// Narration: text/hash integrity, status, validation policy, provider determinism, ZIP safety, generation lifecycle
// (idempotency, stale detection, bulk resume, per-step failure isolation), revision freezing and admin-only access.
// The lifecycle tests use a THROWAWAY database on the local MongoDB (never reagvis_dev), like pinnedCurriculum.test.ts.

import JSZip from "jszip";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as packageService from "../src/modules/cms/animationPackage.service.js";
import { DevNarrationProvider, wavDurationMs, type NarrationProvider } from "../src/modules/cms/narration/narration.provider.js";
import * as narrationService from "../src/modules/cms/narration/narration.service.js";
import { stepStatus } from "../src/modules/cms/narration/narration.status.js";
import { extractExplanations, generationHash, narrationTextOf, sourceTextHash } from "../src/modules/cms/narration/narration.text.js";
import { emptyNarration, type PackageNarration } from "../src/modules/cms/narration/narration.types.js";
import { validateNarration } from "../src/modules/cms/narration/narration.validation.js";

const EX = {
  rules: { h: "TRADITIONAL SOFTWARE", t: "A person writes **every rule**. It only handles what its rules cover." },
  generalize: { h: "WHY THIS SHOWS GENERALIZATION", t: "The model labels a **new email it never saw**, so it has learned a pattern that transfers." },
};
const jsWith = (ex: Record<string, { h: string; t: string }>) => `(function(){var EXPLAIN = ${JSON.stringify(ex)};\n})();`;

describe("text + hash integrity", () => {
  it("narrates exactly the displayed text (only ** markers and whitespace are normalised)", () => {
    expect(narrationTextOf({ t: "A  **bold**\n word." })).toBe("A bold word.");
  });
  it("sourceTextHash changes with the text and not with markup-only differences", () => {
    expect(sourceTextHash("hello world")).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(sourceTextHash(narrationTextOf({ t: "**hello** world" }))).toBe(sourceTextHash("hello world"));
    expect(sourceTextHash("hello world")).not.toBe(sourceTextHash("hello worlds"));
  });
  it("generationHash depends on provider, voice, language and speed as well as the text", () => {
    const base = { text: "x", provider: "p", providerVersion: "1", voice: "v", language: "en", speed: 1 };
    const h = generationHash(base);
    for (const change of [{ provider: "q" }, { providerVersion: "2" }, { voice: "w" }, { language: "fr" }, { speed: 1.25 }, { text: "y" }]) {
      expect(generationHash({ ...base, ...change })).not.toBe(h);
    }
    expect(generationHash({ ...base })).toBe(h);
  });
  it("reads the explanation map from a built animation.js", () => {
    expect(extractExplanations(jsWith(EX)).generalize!.t).toContain("never saw");
    expect(extractExplanations("no explain here")).toEqual({});
  });
});

describe("status + validation policy", () => {
  const text = narrationTextOf(EX.rules);
  const narration = (over: Partial<PackageNarration> = {}): PackageNarration => ({
    ...emptyNarration(),
    enabled: true,
    ...over,
  });
  it("derives MISSING / GENERATED / STALE / DISABLED from the stored hash vs the current explanation", () => {
    const n = narration({ steps: { rules: { enabled: true, asset: "audio/rules.wav", sourceTextHash: sourceTextHash(text), durationMs: 2000 } }, audio: [{ path: "audio/rules.wav", contentType: "audio/wav", dataBase64: "AAAA" }] });
    expect(stepStatus(n, "rules", EX.rules)).toBe("GENERATED");
    expect(stepStatus(n, "rules", { h: "", t: "changed text" })).toBe("STALE");
    expect(stepStatus(n, "generalize", EX.generalize)).toBe("MISSING");
    expect(stepStatus({ ...n, enabled: false }, "rules", EX.rules)).toBe("DISABLED");
    expect(stepStatus({ ...n, steps: { rules: { ...n.steps.rules!, enabled: false } } }, "rules", EX.rules)).toBe("DISABLED");
    expect(stepStatus({ ...n, steps: { rules: { enabled: true, error: "boom" } } }, "rules", EX.rules)).toBe("ERROR");
    // never narrated -> MISSING (not DISABLED); explicitly disabled after being narrated -> DISABLED
    expect(stepStatus(null, "rules", EX.rules)).toBe("MISSING");
    expect(stepStatus(emptyNarration(), "rules", EX.rules)).toBe("MISSING");
  });
  const ctx = { stepIds: ["rules", "generalize"], explanations: EX };
  it("requires nothing when disabled", () => {
    expect(validateNarration({ ...narration(), enabled: false }, ctx)).toEqual([]);
    expect(validateNarration(null, ctx)).toEqual([]);
  });
  it("MISSING is a warning; a referenced asset that is absent is an error", () => {
    const missing = validateNarration(narration({ steps: { rules: { enabled: true } } }), ctx);
    expect(missing.map((i) => [i.severity, i.code])).toEqual([["warning", "MISSING"]]);
    const noAsset = validateNarration(narration({ steps: { rules: { enabled: true, asset: "audio/rules.wav", sourceTextHash: sourceTextHash(text), durationMs: 2000 } } }), ctx);
    expect(noAsset.some((i) => i.severity === "error" && i.code === "MISSING_ASSET")).toBe(true);
  });
  it("rejects unsafe paths, remote URLs, unknown steps, missing hash and bad durations", () => {
    const bad = (asset: string) =>
      validateNarration(narration({ steps: { rules: { enabled: true, asset, sourceTextHash: sourceTextHash(text), durationMs: 2000 } }, audio: [{ path: asset, contentType: "audio/wav", dataBase64: "AAAA" }] }), ctx);
    for (const path of ["../evil.wav", "audio/../../evil.wav", "/etc/passwd", "audio/a/b.wav", "http://x/y.wav", "audio/x.exe"]) {
      expect(bad(path).some((i) => i.severity === "error"), path).toBe(true);
    }
    expect(validateNarration(narration({ steps: { nope: { enabled: true } } }), ctx).some((i) => i.code === "UNKNOWN_STEP")).toBe(true);
    const noHash = validateNarration(narration({ steps: { rules: { enabled: true, asset: "audio/rules.wav", durationMs: 2000 } }, audio: [{ path: "audio/rules.wav", contentType: "audio/wav", dataBase64: "AAAA" }] }), ctx);
    expect(noHash.some((i) => i.code === "NO_SOURCE_HASH")).toBe(true);
    const badDuration = validateNarration(narration({ steps: { rules: { enabled: true, asset: "audio/rules.wav", sourceTextHash: sourceTextHash(text), durationMs: 5 } }, audio: [{ path: "audio/rules.wav", contentType: "audio/wav", dataBase64: "AAAA" }] }), ctx);
    expect(badDuration.some((i) => i.code === "BAD_DURATION")).toBe(true);
  });
  it("STALE is a warning (policy), not a blocking error", () => {
    const issues = validateNarration(narration({ steps: { rules: { enabled: true, asset: "audio/rules.wav", sourceTextHash: sourceTextHash("old text"), durationMs: 2000 } }, audio: [{ path: "audio/rules.wav", contentType: "audio/wav", dataBase64: Buffer.alloc(64).toString("base64") }] }), ctx);
    expect(issues.find((i) => i.code === "STALE")?.severity).toBe("warning");
  });
});

describe("development provider", () => {
  it("is deterministic and reports a duration that matches the audio", async () => {
    const p = new DevNarrationProvider();
    const a = await p.generate({ text: "one two three four five", voice: "default", language: "en", speed: 1 });
    const b = await p.generate({ text: "one two three four five", voice: "default", language: "en", speed: 1 });
    expect(a.audio.equals(b.audio)).toBe(true);
    expect(wavDurationMs(a.audio)).toBe(a.durationMs);
    expect(a.durationMs).toBeGreaterThan(1500);
    const c = await p.generate({ text: "one two three four five", voice: "low", language: "en", speed: 1 });
    expect(c.audio.equals(a.audio)).toBe(false);
  });
  it("is not a production provider", () => {
    expect(new DevNarrationProvider().isProduction).toBe(false);
  });
});

describe("ZIP narration safety", () => {
  async function zipWith(files: Record<string, string | Buffer>): Promise<Buffer> {
    const zip = new JSZip();
    zip.file("animation.html", "<html><body></body></html>");
    for (const [name, content] of Object.entries(files)) zip.file(name, content);
    return zip.generateAsync({ type: "nodebuffer" });
  }
  const narrationJson = JSON.stringify({ schemaVersion: 1, enabled: true, defaults: { voice: "default", language: "en", speed: 1 }, steps: { rules: { enabled: true, asset: "audio/rules.wav", durationMs: 2000, sourceTextHash: sourceTextHash("x") } } });
  it("accepts narration.json + audio/<step>.wav", async () => {
    const out = await packageService.extractZipPackage(await zipWith({ "narration.json": narrationJson, "audio/rules.wav": Buffer.alloc(100) }));
    expect(out.narration?.audio.map((a) => a.path)).toEqual(["audio/rules.wav"]);
  });
  it("rejects audio without narration.json, traversal-style names and wrong folders", async () => {
    await expect(packageService.extractZipPackage(await zipWith({ "audio/rules.wav": Buffer.alloc(10) }))).rejects.toThrow(/narration\.json/);
    await expect(packageService.extractZipPackage(await zipWith({ "narration.json": narrationJson, "audio/sub/rules.wav": Buffer.alloc(10) }))).rejects.toThrow();
    await expect(packageService.extractZipPackage(await zipWith({ "narration.json": narrationJson, "sounds/rules.wav": Buffer.alloc(10) }))).rejects.toThrow();
  });
  it("rejects oversized audio", async () => {
    await expect(packageService.extractZipPackage(await zipWith({ "narration.json": narrationJson, "audio/rules.wav": Buffer.alloc(2_100_000) }))).rejects.toThrow(/limit/);
  });
});

describe("authorization", () => {
  const app = createApp();
  const learner = signAccessToken("6ace4df790b317cec41a8fcc", "learner").token;
  it("a learner cannot read, change or generate narration, or fetch admin audio", async () => {
    const auth = { Authorization: `Bearer ${learner}` };
    expect((await request(app).get("/api/v1/cms/animation-packages/p1/narration").set(auth)).status).toBe(403);
    expect((await request(app).patch("/api/v1/cms/animation-packages/p1/narration").set(auth).send({ enabled: true })).status).toBe(403);
    expect((await request(app).post("/api/v1/cms/animation-packages/p1/narration/generate").set(auth).send({ mode: "missing" })).status).toBe(403);
    expect((await request(app).post("/api/v1/cms/courses/c1/narration/generate").set(auth).send({ mode: "missing" })).status).toBe(403);
    expect((await request(app).get("/api/v1/cms/animation-packages/p1/revisions/draft/narration/audio/s1").set(auth)).status).toBe(403);
  });
  it("anonymous callers get 401", async () => {
    expect((await request(app).post("/api/v1/cms/animation-packages/p1/narration/generate").send({ mode: "missing" })).status).toBe(401);
  });
});

describe("generation lifecycle", () => {
  const TEST_DB = `reagvis_test_narration_${Date.now()}`;
  const ACTOR = new mongoose.Types.ObjectId();
  const PKG = "narration-test-pkg";
  const provider = new DevNarrationProvider();
  const manifest = { bridgeVersion: 1, heightPx: 460, capabilities: ["play"], traceEvents: ["rules", "generalize"] };
  const trace = { version: 1, steps: [{ id: "s1", label: "Rules", animationEvent: "rules", code: { pseudocode: "x" } }, { id: "s2", label: "Generalize", animationEvent: "generalize", code: { pseudocode: "y" } }] };

  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
    await CmsAnimationPackage.createIndexes();
    await CmsAnimationPackage.create({ packageId: PKG, revisionId: "draft", status: "draft", revision: 1, createdBy: ACTOR, updatedBy: ACTOR, title: "t", manifest, sourceKind: "zip", html: "<html></html>", js: jsWith(EX), assets: [], packageTrace: trace });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("generates missing narration, then REUSES everything on a second run (idempotent)", async () => {
    const first = await narrationService.generateNarration(PKG, { mode: "missing", provider });
    expect([first.generated, first.reused, first.failed]).toEqual([2, 0, 0]);
    const second = await narrationService.generateNarration(PKG, { mode: "missing", provider });
    expect(second.generated).toBe(0);
    const forced = await narrationService.generateNarration(PKG, { mode: "step", stepId: "rules", provider });
    expect(forced.steps[0]).toMatchObject({ stepId: "rules", outcome: "reused" });
    const overview = await narrationService.getNarrationOverview(PKG);
    expect(overview.counts).toMatchObject({ GENERATED: 2, MISSING: 0, STALE: 0 });
    expect(overview.issues).toEqual([]);
  });

  it("an explanation edit makes only that step STALE; regenerating stale fixes just it", async () => {
    await CmsAnimationPackage.updateOne({ packageId: PKG, status: "draft" }, { $set: { js: jsWith({ ...EX, generalize: { h: EX.generalize.h, t: "The model labels a **brand new email** correctly, so it generalises." } }) } });
    const stale = await narrationService.getNarrationOverview(PKG);
    expect(stale.steps.map((s) => s.status)).toEqual(["GENERATED", "STALE"]);
    expect(stale.issues.find((i) => i.code === "STALE")?.severity).toBe("warning");
    const fixed = await narrationService.generateNarration(PKG, { mode: "stale", provider });
    expect([fixed.generated, fixed.skipped]).toEqual([1, 1]);
    expect((await narrationService.getNarrationOverview(PKG)).counts.STALE).toBe(0);
  });

  it("one failing step does not lose the others, and a re-run resumes only the failed step", async () => {
    await narrationService.updateNarrationSettings(PKG, { steps: { rules: { enabled: true } } });
    await CmsAnimationPackage.updateOne({ packageId: PKG, status: "draft" }, { $set: { narration: null } });
    const flaky: NarrationProvider = {
      providerId: "flaky", providerVersion: "1", isProduction: false, supportedVoices: () => ["default"],
      generate: async (req) => {
        if (req.text.includes("brand new")) throw new Error("provider unavailable");
        return provider.generate(req);
      },
    };
    const run1 = await narrationService.generateNarration(PKG, { mode: "missing", provider: flaky });
    expect([run1.generated, run1.failed]).toEqual([1, 1]);
    const afterFail = await narrationService.getNarrationOverview(PKG);
    expect(afterFail.steps.map((s) => s.status)).toEqual(["GENERATED", "ERROR"]);
    const run2 = await narrationService.generateNarration(PKG, { mode: "missing", provider });
    expect([run2.generated, run2.reused]).toEqual([1, 0]);
    expect((await narrationService.getNarrationOverview(PKG)).counts.GENERATED).toBe(2);
  });

  it("disabling a step removes the requirement without deleting audio", async () => {
    const o = await narrationService.updateNarrationSettings(PKG, { steps: { rules: { enabled: false } } });
    expect(o.steps[0]!.status).toBe("DISABLED");
    const back = await narrationService.updateNarrationSettings(PKG, { steps: { rules: { enabled: true } } });
    expect(back.steps[0]!.status).toBe("GENERATED");
  });

  it("freezing copies narration into an immutable revision; later draft edits never touch it", async () => {
    const revisionId = await packageService.freezePackageRevisionIfNeeded(PKG, undefined);
    const frozen = await CmsAnimationPackage.findOne({ packageId: PKG, revisionId }).lean();
    expect((frozen!.narration as PackageNarration).audio).toHaveLength(2);
    await narrationService.updateNarrationSettings(PKG, { enabled: false });
    const again = await CmsAnimationPackage.findOne({ packageId: PKG, revisionId }).lean();
    expect((again!.narration as PackageNarration).enabled).toBe(true);
    // a frozen revision cannot be targeted by the settings or generation APIs (they only address the draft)
    await expect(narrationService.generateNarration("no-such-package", { mode: "missing", provider })).rejects.toThrow();
  });

  it("a database restored with only revision r2 allocates r3 next (never a duplicate r2)", async () => {
    const restored = "restored-pkg";
    const base = { packageId: restored, createdBy: ACTOR, updatedBy: ACTOR, title: "t", manifest, sourceKind: "zip", html: "<html></html>", assets: [], packageTrace: trace, revision: 1 };
    await CmsAnimationPackage.create({ ...base, revisionId: "r2", status: "frozen", js: jsWith(EX) });
    await CmsAnimationPackage.create({ ...base, revisionId: "draft", status: "draft", js: jsWith({ ...EX, rules: { h: "X", t: "Changed after restore." } }) });
    expect(await packageService.freezePackageRevisionIfNeeded(restored, undefined)).toBe("r3");
    expect(await CmsAnimationPackage.countDocuments({ packageId: restored, revisionId: "r2" })).toBe(1);
  });

  it("serves audio for a step and 404s for a step without audio", async () => {
    const audio = await narrationService.getNarrationAudio(PKG, "draft", "rules");
    expect(audio.contentType).toBe("audio/wav");
    expect(Buffer.from(audio.dataBase64, "base64").toString("ascii", 0, 4)).toBe("RIFF");
    await expect(narrationService.getNarrationAudio(PKG, "draft", "nope")).rejects.toThrow();
  });
});
