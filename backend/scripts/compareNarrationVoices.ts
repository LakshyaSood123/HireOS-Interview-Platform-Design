/**
 * Voice comparison for human review: synthesises ONE existing explanation with several local Kokoro voices and writes the
 * audio files (and a technical report) to a gitignored folder. Nothing is attached to any package, nothing is published.
 *
 *   npx tsx scripts/compareNarrationVoices.ts --checkpoint=<id> --step=<stepId> <voice> [<voice> ...]
 *   e.g. npx tsx scripts/compareNarrationVoices.ts --checkpoint=estimation-uncertainty-6 --step=compare-small-data af_heart af_bella am_michael
 *
 * The files only prove the engine works. Which voice sounds right is a HUMAN decision: listen to them.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { LocalKokoroNarrationProvider } from "../src/modules/cms/narration/providers/localKokoro.provider.js";
import { extractExplanations, narrationTextOf } from "../src/modules/cms/narration/narration.text.js";

async function main() {
  const args = process.argv.slice(2);
  const checkpoint = args.find((a) => a.startsWith("--checkpoint="))?.slice(13);
  const stepId = args.find((a) => a.startsWith("--step="))?.slice(7);
  const voices = args.filter((a) => !a.startsWith("--"));
  const outDir = path.resolve(args.find((a) => a.startsWith("--out="))?.slice(6) ?? path.join(".narration-qa", "voice-comparison"));
  if (!checkpoint || !stepId || voices.length === 0) throw new Error("Usage: --checkpoint=<id> --step=<stepId> <voice> [<voice> ...]");

  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  let text: string;
  try {
    const draft: any = await cmsService.getDraft("machine-learning-foundations");
    const cp = draft.zones.flatMap((z: any) => z.modules.flatMap((m: any) => m.checkpoints)).find((c: any) => c.id === checkpoint);
    if (!cp) throw new Error(`Unknown checkpoint ${checkpoint}`);
    const pkg: any = await CmsAnimationPackage.findOne({ packageId: cp.workspace.animation.packageId, status: "draft" }).lean();
    const explanation = extractExplanations(pkg.js)[stepId];
    if (!explanation) throw new Error(`Unknown step ${stepId} in ${checkpoint}`);
    text = narrationTextOf(explanation);
  } finally {
    await mongoose.disconnect();
  }

  mkdirSync(outDir, { recursive: true });
  const provider = new LocalKokoroNarrationProvider();
  const health = await provider.health();
  if (!health.ready) throw new Error(health.problem);
  console.log("ENGINE", JSON.stringify(health.details));
  console.log("SOURCE", `${checkpoint}/${stepId}`, `chars=${text.length}`, JSON.stringify(text));
  const report: unknown[] = [];
  try {
    for (const voice of voices) {
      const started = Date.now();
      const out = await provider.generate({ text, voice, language: "en", speed: 1 });
      const file = path.join(outDir, `${voice}${out.extension}`);
      writeFileSync(file, out.audio);
      const row = { voice, file, bytes: out.audio.byteLength, durationMs: out.durationMs, ...out.metadata, wallMs: Date.now() - started };
      report.push(row);
      console.log("VOICE", JSON.stringify(row));
    }
  } finally {
    provider.dispose();
  }
  writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ source: { checkpoint, stepId, text }, engine: health.details, clips: report }, null, 2));
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
