/**
 * Read-only audit of the narration on a course DRAFT: structure, identity, audio validity, storage and timing. Nothing is
 * changed in the database. Clips are written to a gitignored folder so the Python audit can decode them.
 *
 *   NARRATION_DEFAULT_VOICE=af_heart npx tsx scripts/verifyCourseNarration.ts [--course=<id>] [--out=<dir>]
 *
 * Exit code 0 only when every package is valid and every step is current.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { stepStatus } from "../src/modules/cms/narration/narration.status.js";
import { PRONUNCIATION_VERSION, extractExplanations, generationHash, narrationTextOf, normalizeForSpeech, sourceTextHash } from "../src/modules/cms/narration/narration.text.js";
import { NARRATION_LIMITS, type PackageNarration } from "../src/modules/cms/narration/narration.types.js";
import { AUDIO_PATH_RE, validateNarration } from "../src/modules/cms/narration/narration.validation.js";
import { LocalKokoroNarrationProvider } from "../src/modules/cms/narration/providers/localKokoro.provider.js";
import { inspectMp3 } from "../src/modules/cms/narration/providers/mp3.js";

const CAP = 10 * 1024 * 1024;
const textMsOf = (words: number) => Math.max(4500, Math.min(10500, Math.round(3800 + 165 * words)));
const median = (a: number[]) => {
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;

async function main() {
  const args = process.argv.slice(2);
  const course = args.find((a) => a.startsWith("--course="))?.slice(9) ?? "machine-learning-foundations";
  const outDir = path.resolve(args.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(".narration-qa", "full-audit"));
  const audioDir = path.join(outDir, "audio");
  mkdirSync(audioDir, { recursive: true });
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  const provider = new LocalKokoroNarrationProvider(); // identity only: no engine is started
  const problems: string[] = [];
  const clips: { key: string; pkg: string; step: string; bytes: number; durationMs: number; textMs: number; file: string }[] = [];
  const packages: { packageId: string; checkpoint: string; title: string; steps: number; narrated: number; sizeBytes: number; audioBytes: number }[] = [];
  let totalSteps = 0, current = 0, missing = 0, stale = 0, errors = 0, issueErrors = 0, issueWarnings = 0, identityStale = 0, hashStale = 0;
  let maxDurationDiff = 0;
  try {
    const draft: any = await cmsService.getDraft(course);
    const cps = draft.zones.flatMap((z: any) => z.modules.flatMap((m: any) => m.checkpoints)).filter((c: any) => c.workspace?.animation?.kind === "custom");
    const seen = new Set<string>();
    for (const cp of cps) {
      const packageId: string = cp.workspace.animation.packageId;
      if (seen.has(packageId)) continue;
      seen.add(packageId);
      const doc: any = await CmsAnimationPackage.findOne({ packageId, status: "draft" }).lean();
      const label = `${cp.id}`;
      if (!doc) {
        problems.push(`${label}: no draft package`);
        continue;
      }
      const narration = (doc.narration ?? null) as PackageNarration | null;
      const explanations = extractExplanations(doc.js);
      const traceIds: string[] = (doc.packageTrace?.steps ?? []).map((s: any) => s.animationEvent);
      let narrated = 0;
      if (!narration || !narration.enabled) problems.push(`${label}: narration missing or disabled`);
      if (narration) {
        const stepIds = new Set(traceIds);
        for (const id of Object.keys(narration.steps)) if (!stepIds.has(id)) problems.push(`${label}: unknown narration step "${id}"`);
        const issues = validateNarration(narration, { stepIds: traceIds, explanations });
        issueErrors += issues.filter((i) => i.severity === "error").length;
        issueWarnings += issues.filter((i) => i.severity === "warning").length;
        for (const i of issues) problems.push(`${label}: validation ${i.severity} ${i.code}${i.stepId ? ` (${i.stepId})` : ""}`);
      }
      for (const id of traceIds) {
        totalSteps++;
        const ex = explanations[id];
        const rec = narration?.steps[id];
        if (!ex) {
          problems.push(`${label}/${id}: no explanation text`);
          missing++;
          continue;
        }
        const status = stepStatus(narration, id, ex);
        if (status === "MISSING") { missing++; problems.push(`${label}/${id}: MISSING`); continue; }
        if (status === "STALE") { stale++; problems.push(`${label}/${id}: STALE`); continue; }
        if (status === "ERROR" || status === "DISABLED") { errors++; problems.push(`${label}/${id}: ${status}`); continue; }
        if (!rec || rec.error) { errors++; problems.push(`${label}/${id}: recorded error ${rec?.error ?? ""}`); continue; }
        const text = narrationTextOf(ex);
        if (rec.sourceTextHash !== sourceTextHash(text)) { hashStale++; problems.push(`${label}/${id}: sourceTextHash not current`); continue; }
        const spoken = normalizeForSpeech(text);
        const expected = generationHash({ text: spoken, pronunciation: spoken !== text ? PRONUNCIATION_VERSION : undefined, provider: provider.providerId, providerVersion: provider.providerVersion, voice: rec.voice ?? "default", language: rec.language ?? "en", speed: rec.speed ?? 1 });
        if (rec.generationHash !== expected) { identityStale++; problems.push(`${label}/${id}: generation identity not current`); continue; }
        const asset = rec.asset ?? "";
        const audio = narration!.audio.find((a) => a.path === asset);
        if (!AUDIO_PATH_RE.test(asset) || asset.includes("://") || asset.includes("..")) { problems.push(`${label}/${id}: unsafe audio path "${asset}"`); continue; }
        if (!audio) { problems.push(`${label}/${id}: audio asset missing`); continue; }
        const buf = Buffer.from(audio.dataBase64, "base64");
        const info = buf.byteLength > 0 ? inspectMp3(buf) : null;
        if (audio.contentType !== "audio/mpeg" || !info) { problems.push(`${label}/${id}: not a valid MP3`); continue; }
        if (info.sampleRate !== 24000 || info.channels !== 1) problems.push(`${label}/${id}: unexpected format ${info.sampleRate}Hz/${info.channels}ch`);
        if (info.bitrateKbps < 44 || info.bitrateKbps > 52) problems.push(`${label}/${id}: bitrate ${info.bitrateKbps} kbps`);
        if (!(info.durationMs > 0)) { problems.push(`${label}/${id}: zero duration`); continue; }
        const diff = Math.abs(info.durationMs - (rec.durationMs ?? -1));
        maxDurationDiff = Math.max(maxDurationDiff, diff);
        if (diff > 50) { problems.push(`${label}/${id}: duration metadata ${rec.durationMs} vs measured ${info.durationMs}`); continue; }
        current++;
        narrated++;
        const file = path.join(audioDir, `${packageId}__${id}.mp3`);
        writeFileSync(file, buf);
        clips.push({ key: `${packageId}/${id}`, pkg: packageId, step: id, bytes: buf.byteLength, durationMs: info.durationMs, textMs: textMsOf(text.split(/\s+/).filter(Boolean).length), file });
      }
      const sizeBytes = Buffer.byteLength(JSON.stringify(doc));
      const audioBytes = (narration?.audio ?? []).reduce((a, x) => a + Buffer.from(x.dataBase64, "base64").byteLength, 0);
      if (audioBytes > NARRATION_LIMITS.maxTotalAudioBytes) problems.push(`${label}: decoded audio ${audioBytes} exceeds ${NARRATION_LIMITS.maxTotalAudioBytes}`);
      packages.push({ packageId, checkpoint: cp.id, title: cp.title, steps: traceIds.length, narrated, sizeBytes, audioBytes });
    }
  } finally {
    await mongoose.disconnect();
  }

  // decode every clip with the Python audit (valid, not silent, real duration)
  const pythonPath = env.NARRATION_LOCAL_PYTHON ?? path.join(".models", "kokoro", "venv", process.platform === "win32" ? path.join("Scripts", "python.exe") : path.join("bin", "python"));
  let audit: any[] = [];
  if (existsSync(pythonPath) && clips.length) {
    const manifest = path.join(outDir, "audit-manifest.json");
    const result = path.join(outDir, "audit-result.json");
    writeFileSync(manifest, JSON.stringify(clips.map((c) => ({ file: c.file, key: c.key }))));
    execFileSync(pythonPath, [path.join("tools", "local-tts", "audit_audio.py"), manifest, result], { stdio: "inherit" });
    audit = JSON.parse(readFileSync(result, "utf8"));
  } else problems.push("audio decode audit skipped (Python runtime not found)");
  let decodeFail = 0, silent = 0, formatBad = 0, durBad = 0, maxDecodeDiff = 0;
  const byKey = new Map(clips.map((c) => [c.key, c]));
  for (const a of audit) {
    const c = byKey.get(a.key)!;
    if (!a.ok) { decodeFail++; problems.push(`${a.key}: decode failed ${a.error}`); continue; }
    if (a.sampleRate !== 24000 || a.channels !== 1) formatBad++;
    if (a.peak < 0.02 || a.rms < 0.003 || a.silentFraction > 0.6) { silent++; problems.push(`${a.key}: obviously silent (peak ${a.peak.toFixed(3)})`); }
    const d = Math.abs(a.durationMs - c.durationMs);
    maxDecodeDiff = Math.max(maxDecodeDiff, d);
    if (d > 150) { durBad++; problems.push(`${a.key}: decoded duration ${a.durationMs} vs metadata ${c.durationMs}`); }
  }

  const bytes = clips.map((c) => c.bytes), dur = clips.map((c) => c.durationMs);
  const audioCtl = clips.filter((c) => c.durationMs + 600 > c.textMs).length;
  const mb = (n: number) => `${(n / 1024 / 1024).toFixed(2)} MB`;
  const sizes = packages.map((p) => p.sizeBytes);
  const largest = packages.reduce((a, p) => (p.sizeBytes > a.sizeBytes ? p : a), packages[0]!);
  const over = packages.filter((p) => p.sizeBytes > CAP).length;
  const report = {
    packages: packages.length, steps: totalSteps, current, missing, stale, errors, hashStale, identityStale, validationErrors: issueErrors, validationWarnings: issueWarnings,
    audio: { files: clips.length, totalBytes: bytes.reduce((a, b) => a + b, 0), avgBytes: mean(bytes), medianBytes: median(bytes), minBytes: Math.min(...bytes), maxBytes: Math.max(...bytes), minMs: Math.min(...dur), medianMs: median(dur), meanMs: mean(dur), maxMs: Math.max(...dur), totalMs: dur.reduce((a, b) => a + b, 0) },
    timing: { audioControlled: audioCtl, textControlled: clips.length - audioCtl, shortened: clips.filter((c) => Math.max(c.textMs, c.durationMs + 600) < c.textMs).length },
    storage: { totalPackageBytes: sizes.reduce((a, b) => a + b, 0), avgPackageBytes: mean(sizes), medianPackageBytes: median(sizes), largest: { checkpoint: largest.checkpoint, title: largest.title, bytes: largest.sizeBytes, steps: largest.steps }, overCap: over, maxDecodedAudioPerPackage: Math.max(...packages.map((p) => p.audioBytes)) },
    decode: { decodeFail, silent, formatBad, durBad, maxMetaDiffMs: maxDurationDiff, maxDecodeDiffMs: maxDecodeDiff },
    problems: problems.length,
  };
  writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ report, problems, packages }, null, 2));
  console.log("PACKAGES", report.packages, "STEPS", report.steps, "CURRENT", report.current, "MISSING", missing, "STALE", stale, "ERROR", errors, "SOURCEHASH_STALE", hashStale, "IDENTITY_STALE", identityStale);
  console.log("VALIDATION errors", issueErrors, "warnings", issueWarnings);
  console.log("AUDIO files", clips.length, "total", mb(report.audio.totalBytes), "avg", `${(report.audio.avgBytes / 1024).toFixed(1)} KB`, "median", `${(report.audio.medianBytes / 1024).toFixed(1)} KB`, "min", `${(report.audio.minBytes / 1024).toFixed(1)} KB`, "max", `${(report.audio.maxBytes / 1024).toFixed(1)} KB`);
  const t = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
  console.log("DURATION min", t(report.audio.minMs), "median", t(report.audio.medianMs), "mean", t(report.audio.meanMs), "max", t(report.audio.maxMs), "total", `${(report.audio.totalMs / 3600000).toFixed(2)} h`, `(${Math.round(report.audio.totalMs / 60000)} min)`);
  console.log("TIMING audioControlled", audioCtl, "textControlled", clips.length - audioCtl, "shortened", report.timing.shortened);
  console.log("STORAGE packages total", mb(report.storage.totalPackageBytes), "avg", mb(report.storage.avgPackageBytes), "largest", `${largest.checkpoint} (${largest.title}, ${largest.steps} steps) ${mb(largest.sizeBytes)}`, "overCap", over, "maxDecodedAudioPerPackage", mb(report.storage.maxDecodedAudioPerPackage));
  console.log("DECODE fail", decodeFail, "silent", silent, "formatBad", formatBad, "durationBad", durBad, "maxMetaDiffMs", maxDurationDiff, "maxDecodeDiffMs", maxDecodeDiff);
  for (const p of problems.slice(0, 40)) console.log("PROBLEM", p);
  const ok = problems.length === 0 && current === totalSteps && over === 0;
  console.log(ok ? "VERIFY_OK" : `VERIFY_FAILED problems=${problems.length}`);
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
