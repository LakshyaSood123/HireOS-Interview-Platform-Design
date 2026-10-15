// Local offline narration (Kokoro): readiness, provider registry, the worker IPC protocol (against a fake worker speaking the real
// protocol), failure handling, determinism inputs, and the generation lifecycle on top of it. No network, no credential.
// One REAL inference test runs only when the local engine is installed (npm run narration:setup). Lifecycle tests use a
// throwaway database (never reagvis_dev).

import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { env, productionConfigProblems } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { getNarrationProvider, narrationProviderInfo } from "../src/modules/cms/narration/narration.provider.js";
import { generateNarration, getNarrationAudio, getNarrationOverview } from "../src/modules/cms/narration/narration.service.js";
import { generationHash, sourceTextHash } from "../src/modules/cms/narration/narration.text.js";
import { LocalKokoroNarrationProvider, checkLocalKokoroReadiness } from "../src/modules/cms/narration/providers/localKokoro.provider.js";
import { inspectMp3 } from "../src/modules/cms/narration/providers/mp3.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FAKE = { file: process.execPath, args: [path.join(here, "fixtures", "fakeKokoroWorker.mjs")] };

/** A model directory that satisfies the readiness check (contents are irrelevant to the fake worker). */
function fakeModelDir(voices = ["af_heart", "af_bella"]): string {
  const dir = mkdtempSync(path.join(tmpdir(), "kokoro-model-"));
  writeFileSync(path.join(dir, "config.json"), "{}");
  writeFileSync(path.join(dir, "kokoro-v1_0.pth"), "x");
  mkdirSync(path.join(dir, "voices"));
  for (const v of voices) writeFileSync(path.join(dir, "voices", `${v}.pt`), "x");
  return dir;
}

const created: LocalKokoroNarrationProvider[] = [];
function provider(over: Record<string, unknown> = {}) {
  const p = new LocalKokoroNarrationProvider({ command: FAKE, modelDir: fakeModelDir(), idleShutdownMs: 0, requestTimeoutMs: 5000, ...over });
  created.push(p);
  return p;
}
afterEach(() => {
  for (const p of created.splice(0)) p.dispose();
});

const req = (text: string, over: Record<string, unknown> = {}) => ({ text, voice: "default", language: "en", speed: 1, ...over });

describe("local engine readiness (no model load, no process)", () => {
  it("reports clearly when the model or the Python runtime is missing", () => {
    const r = checkLocalKokoroReadiness({ pythonPath: path.join(tmpdir(), "no-such-python"), modelDir: path.join(tmpdir(), "no-such-model") });
    expect(r.ready).toBe(false);
    expect(r.problem).toMatch(/Local narration engine unavailable/);
    expect(r.problem).toMatch(/narration:setup/);
    const noModel = checkLocalKokoroReadiness({ command: FAKE, modelDir: path.join(tmpdir(), "no-such-model") });
    expect(noModel.problem).toMatch(/model file "config.json"/);
  });
  it("is ready when python and the model files exist, and lists the voices on disk", () => {
    const p = provider();
    expect(p.readiness().ready).toBe(true);
    expect(p.supportedVoices()).toEqual(["default", "af_bella", "af_heart"]);
  });
  it("a model directory with no voices is not ready", () => {
    expect(checkLocalKokoroReadiness({ command: FAKE, modelDir: fakeModelDir([]) }).ready).toBe(false);
  });
});

describe("provider registry and configuration", () => {
  const withEnv = (patch: Record<string, unknown>, fn: () => void) => {
    const e = env as unknown as Record<string, unknown>;
    const saved = Object.fromEntries(Object.keys(patch).map((k) => [k, e[k]]));
    Object.assign(e, patch);
    try {
      fn();
    } finally {
      Object.assign(e, saved);
    }
  };
  it("local-kokoro is a registered, production-grade provider that needs no credential", () => {
    withEnv({ NARRATION_PROVIDER: "local-kokoro", NARRATION_LOCAL_MODEL_PATH: fakeModelDir(), NARRATION_LOCAL_PYTHON: process.execPath }, () => {
      const info = narrationProviderInfo();
      expect(info.configured).toBe("local-kokoro");
      expect(info.isProduction).toBe(true);
    });
    expect(Object.keys(env).filter((k) => /NARRATION/.test(k) && /(KEY|SECRET|TOKEN)/.test(k))).toEqual([]);
    const problems = productionConfigProblems({ ...env, NARRATION_PROVIDER: "local-kokoro", isProduction: true } as never, {});
    expect(problems.filter((p) => /NARRATION/.test(p))).toEqual([]);
  });
  it("an engine that is not installed is refused clearly for generation and reported (not a 500) for the CMS overview", () => {
    withEnv({ NARRATION_PROVIDER: "local-kokoro", NARRATION_LOCAL_MODEL_PATH: path.join(tmpdir(), "missing-kokoro-model") }, () => {
      expect(() => getNarrationProvider()).toThrow(/Local narration engine unavailable/);
      const info = narrationProviderInfo();
      expect(info).toMatchObject({ configured: "local-kokoro", available: false });
      expect(info.problem).toMatch(/narration:setup/);
    });
  });
  it("no external TTS provider is registered in this build", () => {
    withEnv({ NARRATION_PROVIDER: "openai" }, () => expect(() => getNarrationProvider()).toThrow(/not available in this build/));
  });
  it("production refuses the dev provider and 'none'", () => {
    withEnv({ isProduction: true, NARRATION_PROVIDER: "dev" }, () => expect(() => getNarrationProvider()).toThrow(/cannot generate narration in production/));
    withEnv({ isProduction: true, NARRATION_PROVIDER: "none" }, () => expect(() => getNarrationProvider()).toThrow(/No text-to-speech provider/));
  });
});

describe("worker protocol (fake worker)", () => {
  it("generates audio, measures the duration from the MP3 frames and records non-secret metadata", async () => {
    const out = await provider().generate(req("Hello learner."));
    expect(out).toMatchObject({ contentType: "audio/mpeg", extension: ".mp3" });
    const info = inspectMp3(out.audio)!;
    expect(out.durationMs).toBe(info.durationMs);
    expect(out.metadata).toMatchObject({ model: "Kokoro-82M", voice: "af_heart", bitrateKbps: 48, channels: 1 });
  });
  it("reuses ONE worker process for many requests (the model loads once)", async () => {
    const p = provider();
    const a = await p.health();
    await p.generate(req("one"));
    await p.generate(req("two"));
    const b = await p.health();
    expect(a.ready && b.ready).toBe(true);
    expect(a.details!.pid).toBe(b.details!.pid);
    expect(b.details!.networkBlocked).toBe(true);
  });
  it("sends the voice, speed and a reproducible seed; same input => same seed, different input => different seed", async () => {
    const seen: Record<string, unknown>[] = [];
    const p = provider();
    const worker = (p as unknown as { getWorker(): { request(x: Record<string, unknown>): Promise<Record<string, unknown>> } }).getWorker();
    const original = worker.request.bind(worker);
    worker.request = async (payload) => {
      const reply = await original(payload);
      seen.push(reply);
      return reply;
    };
    await p.generate(req("Same text.", { speed: 1 }));
    await p.generate(req("Same text.", { speed: 1 }));
    await p.generate(req("Same text.", { speed: 1.25 }));
    await p.generate(req("Same text.", { voice: "af_bella" }));
    expect(seen[0]!.voice).toBe("af_heart"); // "default" resolved
    expect(seen[0]!.seed).toBe(seen[1]!.seed);
    expect(new Set([seen[0]!.seed, seen[2]!.seed, seen[3]!.seed]).size).toBe(3);
    expect(seen[2]!.speed).toBe(1.25);
  });
  it("rejects bad input before touching the worker", async () => {
    const p = provider();
    await expect(p.generate(req("hi", { voice: "robot" }))).rejects.toThrow(/Unsupported narration voice/);
    await expect(p.generate(req("   "))).rejects.toThrow(/empty/);
    await expect(p.generate(req("x".repeat(2001)))).rejects.toThrow(/too long/);
    await expect(p.generate(req("hi", { speed: 3 }))).rejects.toThrow(/speed/);
  });
  it("worker-reported errors fail the step with a clear message and the worker keeps serving", async () => {
    const p = provider();
    await expect(p.generate(req("please ERR now"))).rejects.toThrow(/Local narration engine error: RuntimeError: boom/);
    await expect(p.generate(req("fine"))).resolves.toBeDefined();
  });
  it("a crashing worker fails that request, and the next request transparently restarts it", async () => {
    const p = provider();
    await p.generate(req("warm up"));
    await expect(p.generate(req("CRASH please"))).rejects.toThrow(/stopped unexpectedly/);
    await expect(p.generate(req("after the crash"))).resolves.toMatchObject({ extension: ".mp3" });
  });
  it("a hung worker times out and is replaced", async () => {
    const p = provider({ requestTimeoutMs: 300 });
    await p.generate(req("warm up")); // the first request is allowed the long model-load timeout
    await expect(p.generate(req("HANG forever"))).rejects.toThrow(/did not answer within 300 ms/);
    await expect(p.generate(req("recovered"))).resolves.toBeDefined();
  });
  it("rejects invalid output: not an MP3, silent audio, and a length that contradicts what was synthesised", async () => {
    const p = provider();
    await expect(p.generate(req("BADAUDIO"))).rejects.toThrow(/not a valid MP3/);
    await expect(p.generate(req("SILENT"))).rejects.toThrow(/silent audio/);
    await expect(p.generate(req("MISMATCH"))).rejects.toThrow(/does not match/);
  });
  it("a worker that cannot start is reported, not thrown as an unhandled error", async () => {
    const p = provider({ command: { file: path.join(tmpdir(), "no-such-binary-xyz"), args: [] } });
    await expect(p.generate(req("hi"))).rejects.toThrow(/could not start the local narration worker/);
  });
});

describe("generation identity", () => {
  it("provider version changes with the default voice and output format; the hash also changes with voice and speed", () => {
    const base = provider();
    const versions = new Set([base.providerVersion, provider({ defaultVoice: "af_bella" }).providerVersion, provider({ format: "wav" }).providerVersion]);
    expect(versions.size).toBe(3);
    expect(base.providerId).toBe("local-kokoro");
    const h = (over: Record<string, unknown> = {}) => generationHash({ text: "x", provider: base.providerId, providerVersion: base.providerVersion, voice: "default", language: "en", speed: 1, ...over });
    expect(new Set([h(), h({ voice: "af_bella" }), h({ speed: 1.1 }), h({ language: "en-GB" })]).size).toBe(4);
  });
  it("the source-text hash depends only on the visible explanation, never on provider settings", () => {
    expect(sourceTextHash("Same visible text.")).toBe(sourceTextHash("Same visible text."));
  });
});

describe("worker script safety", () => {
  const script = readFileSync(path.join(here, "..", "tools", "local-tts", "kokoro_worker.py"), "utf8");
  it("never listens on a socket and blocks all non-loopback connections and the Hugging Face hub", () => {
    expect(script).not.toMatch(/\.listen\(|\.bind\(|HTTPServer|http\.server|uvicorn|flask|fastapi/i);
    expect(script).toMatch(/_block_network\(\)/);
    expect(script).toMatch(/HF_HUB_OFFLINE"\] = "1"/);
    expect(script).toMatch(/sys\.stdout = sys\.stderr/);
  });
});

// ── lifecycle on top of the local provider (throwaway DB) ────────────────────────────────────────────────
describe("generation lifecycle with the local provider", () => {
  const TEST_DB = `reagvis_test_narration_local_${Date.now()}`;
  const ACTOR = new mongoose.Types.ObjectId();
  const PKG = "local-lifecycle-pkg";
  const EX = {
    rules: { h: "TRADITIONAL SOFTWARE", t: "A person writes **every rule**. It only handles what its rules cover." },
    generalize: { h: "GENERALIZATION", t: "The model labels a **new email it never saw**, so it has learned a pattern that transfers." },
  };
  const manifest = { bridgeVersion: 1, heightPx: 460, capabilities: ["play"], traceEvents: ["rules", "generalize"] };
  const trace = { version: 1, steps: [{ id: "s1", label: "Rules", animationEvent: "rules", code: { pseudocode: "x" } }, { id: "s2", label: "Generalize", animationEvent: "generalize", code: { pseudocode: "y" } }] };
  let calls = 0;
  let failOn = "";
  function counting(p: LocalKokoroNarrationProvider): LocalKokoroNarrationProvider {
    const generate = p.generate.bind(p);
    p.generate = async (r) => {
      calls++;
      if (failOn && r.text.includes(failOn)) throw new Error("local engine failure");
      return generate(r);
    };
    return p;
  }

  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
    await CmsAnimationPackage.create({ packageId: PKG, revisionId: "draft", status: "draft", revision: 1, createdBy: ACTOR, updatedBy: ACTOR, title: "t", manifest, sourceKind: "zip", html: "<html></html>", js: `(function(){var EXPLAIN = ${JSON.stringify(EX)};\n})();`, assets: [], packageTrace: trace });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("a failing step does not lose the others, and the re-run resumes only the failed step", async () => {
    failOn = "never saw";
    const run1 = await generateNarration(PKG, { mode: "missing", provider: counting(provider()) });
    expect([run1.generated, run1.failed]).toEqual([1, 1]);
    expect((await getNarrationOverview(PKG)).steps.map((s) => s.status)).toEqual(["GENERATED", "ERROR"]);
    failOn = "";
    const before = calls;
    const run2 = await generateNarration(PKG, { mode: "missing", provider: counting(provider()) });
    expect([run2.generated, run2.skipped]).toEqual([1, 1]);
    expect(calls - before).toBe(1);
    const overview = await getNarrationOverview(PKG);
    expect(overview.counts).toMatchObject({ GENERATED: 2, ERROR: 0, MISSING: 0 });
    expect(overview.steps[0]).toMatchObject({ provider: "local-kokoro", voice: "default", language: "en" });
    expect(overview.steps[0]!.durationMs).toBeGreaterThan(0);
  });
  it("is idempotent: a second run makes no engine calls", async () => {
    const before = calls;
    expect((await generateNarration(PKG, { mode: "missing", provider: counting(provider()) })).generated).toBe(0);
    expect((await generateNarration(PKG, { mode: "step", stepId: "rules", provider: counting(provider()) })).steps[0]!.outcome).toBe("reused");
    expect(calls).toBe(before);
  });
  it("a failed REGENERATION keeps the existing audio", async () => {
    const audioBefore = (await getNarrationAudio(PKG, "draft", "rules")).dataBase64;
    failOn = "every rule";
    const run = await generateNarration(PKG, { mode: "step", stepId: "rules", force: true, provider: counting(provider()) });
    failOn = "";
    expect(run.failed).toBe(1);
    expect((await getNarrationAudio(PKG, "draft", "rules")).dataBase64).toBe(audioBefore);
    expect((await getNarrationOverview(PKG)).steps[0]!.status).toBe("GENERATED");
  });
  it("changing the voice or the default voice makes the step regenerate; the stored audio is MP3 with a measured duration", async () => {
    const before = calls;
    const other = counting(provider({ defaultVoice: "af_bella" }));
    expect((await generateNarration(PKG, { mode: "step", stepId: "rules", provider: other })).steps[0]!.outcome).toBe("generated");
    expect(calls).toBe(before + 1);
    const stored = await getNarrationAudio(PKG, "draft", "rules");
    expect(stored.contentType).toBe("audio/mpeg");
    expect(inspectMp3(Buffer.from(stored.dataBase64, "base64"))!.durationMs).toBe(stored.durationMs);
  });
});

// ── ONE real local inference (runs only where the engine is installed) ───────────────────────────────────
const engine = checkLocalKokoroReadiness();
describe.skipIf(!engine.ready)("real local Kokoro inference (engine installed)", () => {
  it("synthesises a valid, audible MP3 offline and stores it as package narration", async () => {
    const p = new LocalKokoroNarrationProvider({ idleShutdownMs: 0 });
    try {
      const health = await p.health();
      expect(health.ready).toBe(true);
      expect(health.details!.networkBlocked).toBe(true);
      const out = await p.generate({ text: "Gradient descent walks downhill, one small step at a time.", voice: "default", language: "en", speed: 1 });
      const info = inspectMp3(out.audio)!;
      expect(info).toMatchObject({ sampleRate: 24000, channels: 1 });
      expect(info.bitrateKbps).toBeGreaterThanOrEqual(40);
      expect(info.bitrateKbps).toBeLessThanOrEqual(56);
      expect(out.durationMs).toBeGreaterThan(2000);
      expect(out.durationMs).toBeLessThan(12000);
      expect(Number(out.metadata!.peak)).toBeGreaterThan(0.05);
      const again = await p.generate({ text: "Gradient descent walks downhill, one small step at a time.", voice: "default", language: "en", speed: 1 });
      expect(again.audio.equals(out.audio)).toBe(true); // seeded: same input, same audio
    } finally {
      p.dispose();
    }
  }, 180_000);
});
