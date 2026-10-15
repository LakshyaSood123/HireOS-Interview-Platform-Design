/**
 * Builds a HUMAN REVIEW package for generated narration: copies each generated clip out of the package draft into a gitignored
 * folder and writes a manifest (JSON + Markdown) plus an index.html with an audio player per clip, so a person can listen
 * and mark each one. Read-only on the database; nothing is published or attached.
 *
 *   npx tsx scripts/narrationReviewManifest.ts [--out=<dir>] <checkpointId> [<checkpointId> ...]
 *
 * Clips are flagged for the things automated checks cannot judge: technical terms, acronyms, decimals, percentages, scientific
 * notation and mathematical expressions. Flags only say WHAT to listen for, they are not a quality verdict.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { extractExplanations, narrationTextOf } from "../src/modules/cms/narration/narration.text.js";
import type { PackageNarration } from "../src/modules/cms/narration/narration.types.js";

export const TERM_FLAGS: [string, RegExp][] = [
  ["MLE", /\bMLE\b/], ["MAP", /\bMAP\b/], ["PCA", /\bPCA\b/], ["GMM", /\bGMM\b/], ["F1", /\bF1\b/], ["PC1/PC2", /\bPC\d\b/],
  ["Bayes", /\bBayes/i], ["Gaussian", /\bGaussian/i], ["eigenvalue", /\beigenvalue/i], ["eigenvector", /\beigenvector/i],
  ["covariance", /\bcovariance/i], ["likelihood", /\blikelihood/i], ["regularization", /\bregulari[sz]/i], ["hyperparameter", /\bhyperparameter/i],
  ["precision", /\bprecision\b/i], ["recall", /\brecall\b/i], ["gradient", /\bgradient/i], ["posterior", /\bposterior/i], ["prior", /\bprior\b/i],
  ["overfitting", /\boverfit/i], ["underfitting", /\bunderfit/i], ["generalization", /\bgeneraliz/i], ["variance", /\bvariance/i],
];
export const NUMBER_FLAGS: [string, RegExp][] = [
  ["decimal", /\d+\.\d+/], ["percentage", /\d\s?%/], ["scientific notation", /\d[eE][-+]?\d|×\s?10|\d\s?x\s?10\^/],
  ["math expression", /[=²³√∑∏∫≈≤≥±×÷^]|\b[a-zA-Z]\s?[−-]\s?\d|[a-zA-Z][₀-₉]|\([^)]*[=+−*/][^)]*\)|\b\d+\s?[+−*/×÷]\s?\d+/],
  ["version/identifier", /\bv\d+\b/],
];

export function flagsFor(text: string): { terms: string[]; numbers: string[] } {
  return { terms: TERM_FLAGS.filter(([, re]) => re.test(text)).map(([n]) => n), numbers: NUMBER_FLAGS.filter(([, re]) => re.test(text)).map(([n]) => n) };
}

async function main() {
  const args = process.argv.slice(2);
  const outDir = path.resolve(args.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(".narration-qa", "representative-30"));
  const ids = args.filter((a) => !a.startsWith("--"));
  if (ids.length === 0) throw new Error("Pass one or more checkpoint ids.");
  mkdirSync(path.join(outDir, "audio"), { recursive: true });
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  const clips: Record<string, unknown>[] = [];
  try {
    const draft: any = await cmsService.getDraft("machine-learning-foundations");
    const all = draft.zones.flatMap((z: any) => z.modules.flatMap((m: any) => m.checkpoints));
    for (const id of ids) {
      const cp = all.find((c: any) => c.id === id);
      if (!cp) throw new Error(`Unknown checkpoint ${id}`);
      const pkg: any = await CmsAnimationPackage.findOne({ packageId: cp.workspace.animation.packageId, status: "draft" }).lean();
      const narration = pkg.narration as PackageNarration | null;
      const explanations = extractExplanations(pkg.js);
      for (const step of pkg.packageTrace.steps as { animationEvent: string; label: string }[]) {
        const rec = narration?.steps[step.animationEvent];
        const audio = rec?.asset ? narration!.audio.find((a) => a.path === rec.asset) : undefined;
        if (!rec || !audio) continue;
        const buf = Buffer.from(audio.dataBase64, "base64");
        const file = path.join("audio", `${String(clips.length + 1).padStart(2, "0")}_${id}__${step.animationEvent}${path.extname(audio.path)}`);
        writeFileSync(path.join(outDir, file), buf);
        const text = narrationTextOf(explanations[step.animationEvent]!);
        clips.push({ n: clips.length + 1, checkpoint: id, checkpointTitle: cp.title, stepId: step.animationEvent, stepLabel: step.label, explanation: text, audioPath: path.join(outDir, file), voice: rec.voice === "default" ? env.NARRATION_DEFAULT_VOICE ?? "default" : rec.voice, provider: rec.provider, durationMs: rec.durationMs, bytes: buf.byteLength, words: text.split(/\s+/).filter(Boolean).length, chars: text.length, flags: flagsFor(text) });
      }
    }
  } finally {
    await mongoose.disconnect();
  }
  writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), clips }, null, 2));
  const md = ["# Narration review manifest", "", "Listen to each clip and mark: naturalness, pronunciation (esp. flagged terms/numbers), pacing.", "", "| # | Checkpoint | Step | Dur | Size | Terms to check | Numbers/symbols to check |", "|---|---|---|---|---|---|---|"];
  for (const c of clips as any[]) md.push(`| ${c.n} | ${c.checkpoint} | ${c.stepId} | ${(c.durationMs / 1000).toFixed(1)}s | ${(c.bytes / 1024).toFixed(0)} KB | ${c.flags.terms.join(", ")} | ${c.flags.numbers.join(", ")} |`);
  writeFileSync(path.join(outDir, "manifest.md"), md.join("\n") + "\n");
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const html = `<!doctype html><meta charset="utf-8"><title>Narration review</title><style>body{font:15px system-ui;max-width:900px;margin:24px auto;padding:0 16px}.c{border:1px solid #ccc;border-radius:8px;padding:12px;margin:12px 0}.f{color:#b45309;font-size:12px}audio{width:100%}</style><h1>Narration review (${clips.length} clips)</h1>${(clips as any[]).map((c) => `<div class="c"><b>${c.n}. ${esc(c.checkpointTitle)} / ${esc(c.stepId)}</b> <small>${(c.durationMs / 1000).toFixed(1)}s, ${(c.bytes / 1024).toFixed(0)} KB, voice ${esc(String(c.voice))}</small><p>${esc(c.explanation)}</p><div class="f">terms: ${esc(c.flags.terms.join(", ") || "-")} | numbers/symbols: ${esc(c.flags.numbers.join(", ") || "-")}</div><audio controls preload="none" src="audio/${path.basename(c.audioPath)}"></audio></div>`).join("")}`;
  writeFileSync(path.join(outDir, "index.html"), html);
  console.log(`MANIFEST ${clips.length} clips -> ${outDir}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
