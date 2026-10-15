/**
 * Generates narration for the packages of SPECIFIC checkpoints, on each package's DRAFT revision, with whatever provider
 * NARRATION_PROVIDER selects (the deterministic "dev" provider, or "local-kokoro", the offline engine). Meant for
 * small representative runs, e.g. real-audio QA before a full-course generation. It never publishes and never touches learners.
 *
 *   npx tsx scripts/generateNarrationForCheckpoints.ts [--course=<id>] [--sample=<n>] [--dry-run] <checkpointId> [<checkpointId> ...]
 *
 *   --sample=<n>  only n steps per checkpoint, chosen deterministically from the explanation lengths (shortest, longest, then
 *                 evenly through the middle), so a run covers short, medium and long text. Default: every missing step.
 *   --dry-run     print the plan (steps, characters, words) and exit WITHOUT calling the provider.
 *
 * Steps that already have current narration are skipped, so re-running is cheap and idempotent (no provider calls). For a
 * whole course use the admin API (POST /cms/courses/:courseId/narration/generate), which runs the same service.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { getNarrationProvider } from "../src/modules/cms/narration/narration.provider.js";
import * as narration from "../src/modules/cms/narration/narration.service.js";
import { extractExplanations, narrationTextOf } from "../src/modules/cms/narration/narration.text.js";

/** `n` steps spread over the length range: shortest, longest, and evenly spaced ones between. Deterministic. */
export function sampleSteps(items: { id: string; chars: number }[], n: number): string[] {
  const sorted = [...items].sort((a, b) => a.chars - b.chars || a.id.localeCompare(b.id));
  if (n >= sorted.length) return sorted.map((s) => s.id);
  const picked = new Set<string>();
  for (let i = 0; i < n; i++) picked.add(sorted[n === 1 ? 0 : Math.round((i * (sorted.length - 1)) / (n - 1))]!.id);
  return items.filter((s) => picked.has(s.id)).map((s) => s.id); // keep animation order
}

async function main() {
  const args = process.argv.slice(2);
  const course = args.find((a) => a.startsWith("--course="))?.slice(9) ?? "machine-learning-foundations";
  const sample = Number(args.find((a) => a.startsWith("--sample="))?.slice(9) ?? 0);
  const dryRun = args.includes("--dry-run");
  const ids = args.filter((a) => !a.startsWith("--"));
  if (ids.length === 0) throw new Error("Pass one or more checkpoint ids.");
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const provider = dryRun ? null : getNarrationProvider(); // fails clearly (before any step) if no usable provider/credential
    const draft: any = await cmsService.getDraft(course);
    const all = draft.zones.flatMap((z: any) => z.modules.flatMap((m: any) => m.checkpoints));
    let steps = 0, chars = 0, words = 0;
    for (const id of ids) {
      const cp = all.find((c: any) => c.id === id);
      if (!cp) throw new Error(`Unknown checkpoint ${id} in ${course}`);
      if (cp.workspace?.animation?.kind !== "custom") throw new Error(`${id}: no custom animation package`);
      const packageId = cp.workspace.animation.packageId;
      const pkg: any = await CmsAnimationPackage.findOne({ packageId, status: "draft" }).lean();
      const explanations = extractExplanations(pkg.js);
      const items = (pkg.packageTrace?.steps ?? []).map((s: any) => ({ id: s.animationEvent as string, chars: narrationTextOf(explanations[s.animationEvent] ?? { t: "" }).length }));
      const chosen = sample > 0 ? sampleSteps(items, sample) : items.map((s: any) => s.id);
      for (const stepId of chosen) {
        const text = narrationTextOf(explanations[stepId] ?? { t: "" });
        steps++; chars += text.length; words += text.split(/\s+/).filter(Boolean).length;
      }
      if (dryRun) {
        console.log(`PLAN ${id} "${cp.title}" package=${packageId} steps=${chosen.join(",")}`);
        continue;
      }
      const outcomes = { generated: 0, skipped: 0, failed: 0 };
      for (const stepId of chosen) {
        const s = await narration.generateNarration(packageId, sample > 0 ? { mode: "step", stepId, provider: provider! } : { mode: "missing", provider: provider! });
        outcomes.generated += s.generated; outcomes.skipped += s.skipped + s.reused; outcomes.failed += s.failed;
        if (sample <= 0) break; // "missing" mode already covered every step of the package in one call
      }
      const overview = await narration.getNarrationOverview(packageId);
      console.log(`NARRATED ${id} "${cp.title}" package=${packageId}`, JSON.stringify({ provider: provider!.providerId, ...outcomes, counts: overview.counts, audioKB: Math.round(overview.totalAudioBytes / 1024) }));
    }
    console.log(`${dryRun ? "PLAN_TOTAL" : "RUN_TOTAL"} steps=${steps} words=${words} characters=${chars}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
