/**
 * Course-wide narration generation on the course DRAFT's animation packages, with the configured provider (local-kokoro in
 * practice). Sequential, resumable and idempotent: steps whose complete generation identity is current are skipped without any
 * engine call, one failing step never loses the others, and a re-run only does the missing / stale / errored work.
 * Never publishes, never repins, never touches learners.
 *
 *   NARRATION_PROVIDER=local-kokoro NARRATION_DEFAULT_VOICE=af_heart npx tsx scripts/generateCourseNarration.ts [--course=<id>] [--mode=missing-and-stale|missing|stale]
 *
 * Prints one PROGRESS line per package and a final TOTALS line (and FAILURES, if any).
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { getNarrationProvider } from "../src/modules/cms/narration/narration.provider.js";
import { generateCourseNarration } from "../src/modules/cms/narration/narration.service.js";

async function main() {
  const args = process.argv.slice(2);
  const course = args.find((a) => a.startsWith("--course="))?.slice(9) ?? "machine-learning-foundations";
  const mode = (args.find((a) => a.startsWith("--mode="))?.slice(7) ?? "missing-and-stale") as "missing" | "stale" | "missing-and-stale";
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  const started = Date.now();
  try {
    const provider = getNarrationProvider(); // refuses clearly if the engine is not ready
    console.log(`START db=${env.MONGO_DB_NAME} course=${course} mode=${mode} provider=${provider.providerId} version=${provider.providerVersion}`);
    const out = await generateCourseNarration(course, mode, {
      provider,
      onPackage: (s, i, n) => console.log(`PROGRESS ${i}/${n} ${s.packageId} generated=${s.generated} reused=${s.reused} skipped=${s.skipped} failed=${s.failed} t=${Math.round((Date.now() - started) / 1000)}s`),
    });
    console.log(`TOTALS packages=${out.totals.packages} generated=${out.totals.generated} reused=${out.totals.reused} skipped=${out.totals.skipped} failed=${out.totals.failed} seconds=${Math.round((Date.now() - started) / 1000)}`);
    for (const r of out.results) for (const s of r.steps) if (s.outcome === "failed") console.log(`FAILURE ${r.packageId} step=${s.stepId} ${s.reason ?? ""}`);
    process.exitCode = out.totals.failed > 0 ? 2 : 0;
  } finally {
    await mongoose.disconnect();
    process.exit(process.exitCode ?? 0); // also stops the warm worker
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
