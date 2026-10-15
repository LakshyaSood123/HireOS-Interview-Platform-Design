// Narration-only pronunciation normalisation: deterministic, token-boundary aware, never touches the visible explanation or
// sourceTextHash, and only affected narration changes identity (so only affected clips are regenerated).

import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { DevNarrationProvider, type NarrationProvider, type NarrationRequest } from "../src/modules/cms/narration/narration.provider.js";
import { generateNarration, getNarrationOverview } from "../src/modules/cms/narration/narration.service.js";
import { PRONUNCIATION_VERSION, generationHash, narrationTextOf, normalizeForSpeech, sourceTextHash } from "../src/modules/cms/narration/narration.text.js";

describe("normalizeForSpeech", () => {
  it("spells out the approved acronyms", () => {
    expect(normalizeForSpeech("MLE = 0.8 and MAP = 0.7")).toBe("M L E = 0.8 and M A P = 0.7");
    expect(normalizeForSpeech("PCA keeps PC1, then PC2.")).toBe("P C A keeps P C one, then P C two.");
    expect(normalizeForSpeech("A GMM and the F1 score")).toBe("A G M M and the F one score");
  });
  it("is token-boundary and case aware", () => {
    for (const untouched of ["map the data", "Mapping", "MAPS", "MLEs", "xMLE", "MLEx", "F10", "F1x", "PC10", "PC3", "mle", "pca", "AF1", "F-score", "NAPMAP"]) {
      expect(normalizeForSpeech(untouched), untouched).toBe(untouched);
    }
    expect(normalizeForSpeech("(MAP)")).toBe("(M A P)");
    expect(normalizeForSpeech("MLE/MAP")).toBe("M L E/M A P");
    expect(normalizeForSpeech("F1-score")).toBe("F one-score");
  });
  it("is deterministic and idempotent", () => {
    const once = normalizeForSpeech("MLE, MAP, PCA, GMM, F1, PC1, PC2");
    expect(once).toBe("M L E, M A P, P C A, G M M, F one, P C one, P C two");
    expect(normalizeForSpeech(once)).toBe(once);
  });
});

describe("identity", () => {
  const base = { provider: "p", providerVersion: "1", voice: "v", language: "en", speed: 1 };
  it("text without affected tokens keeps exactly the same generation hash (not regenerated)", () => {
    const text = "Gradient descent walks downhill.";
    const before = generationHash({ text, ...base });
    expect(generationHash({ text: normalizeForSpeech(text), pronunciation: undefined, ...base })).toBe(before);
  });
  it("the rule-set version is part of the identity for affected text", () => {
    const spoken = normalizeForSpeech("MLE wins");
    expect(generationHash({ text: spoken, pronunciation: PRONUNCIATION_VERSION, ...base })).not.toBe(generationHash({ text: spoken, ...base }));
    expect(generationHash({ text: spoken, pronunciation: "1", ...base })).not.toBe(generationHash({ text: spoken, pronunciation: "2", ...base }));
  });
  it("sourceTextHash always comes from the visible text", () => {
    const visible = narrationTextOf({ t: "MLE = **0.8**" });
    expect(visible).toBe("MLE = 0.8");
    expect(sourceTextHash(visible)).not.toBe(sourceTextHash(normalizeForSpeech(visible)));
  });
});

describe("generation applies it to the spoken text only", () => {
  const TEST_DB = `reagvis_test_narration_pron_${Date.now()}`;
  const ACTOR = new mongoose.Types.ObjectId();
  const PKG = "pron-pkg";
  const EX = {
    mle: { h: "MLE", t: "With only 5 flips **MLE = 0.8** and MAP = 0.7." },
    plain: { h: "PLAIN", t: "Gradient descent walks downhill." },
  };
  const manifest = { bridgeVersion: 1, heightPx: 460, capabilities: ["play"], traceEvents: ["mle", "plain"] };
  const trace = { version: 1, steps: [{ id: "s1", label: "MLE", animationEvent: "mle", code: { pseudocode: "x" } }, { id: "s2", label: "Plain", animationEvent: "plain", code: { pseudocode: "y" } }] };
  const spoken: string[] = [];
  const dev = new DevNarrationProvider();
  const recording: NarrationProvider = {
    providerId: dev.providerId, providerVersion: dev.providerVersion, isProduction: false, supportedVoices: () => dev.supportedVoices(),
    generate: async (r: NarrationRequest) => {
      spoken.push(r.text);
      return dev.generate(r);
    },
  };

  beforeAll(async () => {
    await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
    await CmsAnimationPackage.create({ packageId: PKG, revisionId: "draft", status: "draft", revision: 1, createdBy: ACTOR, updatedBy: ACTOR, title: "t", manifest, sourceKind: "zip", html: "<html></html>", js: `(function(){var EXPLAIN = ${JSON.stringify(EX)};\n})();`, assets: [], packageTrace: trace });
  });
  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  it("sends normalised text to the engine, keeps the visible-text hash, and stays idempotent", async () => {
    const run = await generateNarration(PKG, { mode: "missing", provider: recording });
    expect(run.generated).toBe(2);
    expect(spoken).toContain("With only 5 flips M L E = 0.8 and M A P = 0.7.");
    expect(spoken).toContain("Gradient descent walks downhill.");
    const doc: any = await CmsAnimationPackage.findOne({ packageId: PKG, status: "draft" }).lean();
    expect(doc.narration.steps.mle.sourceTextHash).toBe(sourceTextHash("With only 5 flips MLE = 0.8 and MAP = 0.7."));
    expect((await getNarrationOverview(PKG)).counts).toMatchObject({ GENERATED: 2, STALE: 0 });
    const before = spoken.length;
    expect((await generateNarration(PKG, { mode: "missing", provider: recording })).generated).toBe(0);
    expect(spoken.length).toBe(before);
  });

  it("clips whose text the rules do not touch keep their stored identity (only affected clips regenerate)", async () => {
    // Simulate narration generated BEFORE normalisation existed: identity = hash of the raw visible text.
    const doc: any = await CmsAnimationPackage.findOne({ packageId: PKG, status: "draft" });
    const n = doc.narration;
    const rec = n.steps;
    const legacy = (text: string) => generationHash({ text, provider: recording.providerId, providerVersion: recording.providerVersion, voice: "default", language: "en", speed: 1 });
    rec.mle.generationHash = legacy("With only 5 flips MLE = 0.8 and MAP = 0.7.");
    rec.plain.generationHash = legacy("Gradient descent walks downhill.");
    doc.markModified("narration");
    await doc.save();
    const before = spoken.length;
    const run = await generateNarration(PKG, { mode: "step", stepId: "mle", provider: recording });
    const plain = await generateNarration(PKG, { mode: "step", stepId: "plain", provider: recording });
    expect(run.steps[0]!.outcome).toBe("generated"); // affected: identity changed
    expect(plain.steps[0]!.outcome).toBe("reused"); // unaffected: identical identity, reused
    expect(spoken.length).toBe(before + 1);
  });
});
