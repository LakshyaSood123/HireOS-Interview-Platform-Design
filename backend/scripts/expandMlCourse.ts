/**
 * Expands machine-learning-foundations with the authored curriculum content
 * (seed/ml/curriculum), through the existing CMS services only:
 *
 *   1. read the currently published version (must contain ml-foundations-1..3)
 *   2. build the expanded zones (first three checkpoints preserved verbatim)
 *   3. run the content audit — any critical issue aborts before anything is saved
 *   4. save the zones into the CMS draft and run the CMS draft validation
 *   5. publish ONE new version (skipped if the published version already has the
 *      expanded checkpoint count, so re-running is safe)
 *   6. print the demo checkpoints with their quick-check and prerequisite checks
 *
 * It attaches NO animation packages. Animation-target checkpoints are written
 * without animation or trace sources, for manual upload through Creator Studio.
 *
 *   npx tsx scripts/expandMlCourse.ts --admin-email=<admin email>
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import { printApiCacheNotice } from "./lib/apiCacheNotice.js";
import { buildExpandedMlZones, auditMlZones, countCurriculum, EXPECTED_COUNTS } from "../seed/ml/curriculum/index.js";

export const ML_COURSE_ID = "machine-learning-foundations";

/** The six checkpoints for today's demo: exact id and the title the author sees. */
export const DEMO_CHECKPOINTS = [
  { id: "ml-foundations-1", title: "What is Machine Learning?", animationTarget: null },
  { id: "ml-foundations-2", title: "Data, Features & Labels", animationTarget: null },
  { id: "ml-foundations-3", title: "Linear Regression — The Line That Learns", animationTarget: null },
  { id: "probability-foundations-7", title: "Common Probability Distributions", animationTarget: "probability-distributions.zip" },
  { id: "optimization-3", title: "Gradient Descent", animationTarget: "gradient-descent-learning.zip" },
  { id: "estimation-uncertainty-6", title: "MLE vs MAP", animationTarget: "maximum-likelihood-map.zip" },
] as const;

type Zone = ReturnType<typeof buildExpandedMlZones>[number];

function allCheckpoints(zones: Zone[]) {
  return zones.flatMap(z => z.modules.flatMap(m => m.checkpoints.map(cp => ({ zone: z, module: m, cp }))));
}

/** Checks each demo checkpoint: exists, title matches, quick check valid,
 * prerequisites exist. Returns the rows and whether all passed. */
export function checkDemo(zones: Zone[]) {
  const byId = new Map(allCheckpoints(zones).map(x => [x.cp.id, x] as const));
  const rows = DEMO_CHECKPOINTS.map(demo => {
    const hit = byId.get(demo.id);
    if (!hit) return { ...demo, found: false, titleOk: false, quickCheckOk: false, prereqOk: false, zone: "-", module: "-" };
    const qc = hit.cp.workspace.quickCheck;
    const quickCheckOk = Boolean(qc && qc.correctIndex >= 0 && qc.correctIndex < qc.options.length && qc.options.length >= 2);
    const prereqOk = hit.cp.prerequisites.every(p => byId.has(p));
    const hasAnimation = Boolean(hit.cp.workspace.animation) || Boolean(hit.cp.workspace.traceSource);
    return {
      ...demo,
      found: true,
      titleOk: hit.cp.title === demo.title,
      quickCheckOk,
      prereqOk,
      zone: hit.zone.title,
      module: hit.module.title,
      animationAttached: hasAnimation,
    };
  });
  const ok = rows.every(r => r.found && r.titleOk && r.quickCheckOk && r.prereqOk);
  return { rows, ok };
}

async function main(adminEmail: string | undefined) {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const pointer = await CmsCourse.findOne({ courseId: ML_COURSE_ID }).lean();
    if (!pointer?.latestPublishedVersion) {
      throw new Error("expandMl: the ML course has no published version. Run seed:ml-course first.");
    }

    const published = await cmsService.getPublishedContent(ML_COURSE_ID);
    const publishedCount = published.zones.flatMap(z => z.modules.flatMap(m => m.checkpoints)).length;
    const firstThree = published.zones.flatMap(z => z.modules.flatMap(m => m.checkpoints));
    const zones = buildExpandedMlZones(JSON.parse(JSON.stringify(firstThree)));
    const counts = countCurriculum(zones);
    console.log(`[expand-ml] published ${published.versionId}: ${publishedCount} checkpoints; target: ${counts.checkpoints} checkpoints`);

    const issues = auditMlZones(zones);
    const critical = issues.filter(i => i.severity === "critical");
    const warnings = issues.filter(i => i.severity === "warning");
    console.log(`[expand-ml] content audit: ${critical.length} critical, ${warnings.length} warning(s)`);
    for (const issue of [...critical, ...warnings]) console.log(`  [${issue.severity}] ${issue.message}`);
    if (critical.length > 0) throw new Error(`expandMl: ${critical.length} critical audit issue(s); nothing was saved.`);

    if (counts.zones !== EXPECTED_COUNTS.zones || counts.checkpoints !== EXPECTED_COUNTS.checkpoints) {
      throw new Error(`expandMl: built ${counts.zones} zones / ${counts.checkpoints} checkpoints, expected ${EXPECTED_COUNTS.zones} / ${EXPECTED_COUNTS.checkpoints}.`);
    }

    if (publishedCount === counts.checkpoints && !draftOnly) {
      console.log("[expand-ml] published version already has the expanded checkpoint count — nothing to publish (idempotent).");
    } else {
      const actorId = await resolveActorId(adminEmail);
      const draft = await cmsService.getDraft(ML_COURSE_ID);
      await cmsService.saveDraft(ML_COURSE_ID, actorId, {
        zones: JSON.parse(JSON.stringify(zones)),
        expectedRevision: draft.revision,
      });
      const validation = await cmsService.validateDraft(ML_COURSE_ID);
      console.log(`[expand-ml] draft validation: ${validation.length} issue(s)`, validation);
      if (validation.length > 0) throw new Error("expandMl: CMS draft validation failed; not publishing.");
      if (draftOnly) {
        console.log("[expand-ml] --draft-only: draft saved and validated; NOT published. Published version left unchanged.");
      } else {
        const result = await cmsService.publishDraft(ML_COURSE_ID, actorId);
        console.log(`[expand-ml] published ${result.version.versionId}, snapshot ${result.snapshotVersion}, checkpoints ${result.snapshotCheckpointCount}`);
        printApiCacheNotice("expandMlCourse");
      }
    }

    const demo = checkDemo(zones);
    console.table(demo.rows.map(r => ({
      checkpoint: r.title,
      id: r.id,
      found: r.found,
      titleOk: r.titleOk,
      quickCheckOk: r.quickCheckOk,
      prereqOk: r.prereqOk,
      animationAttachedNow: "animationAttached" in r ? r.animationAttached : false,
      futureAnimation: r.animationTarget ?? "none",
    })));
    console.log(`[expand-ml] demo checkpoints ${demo.ok ? "all valid" : "NOT all valid"}`);
    if (!demo.ok) throw new Error("expandMl: a demo checkpoint failed its checks.");
  } finally {
    await mongoose.disconnect();
  }
}

const draftOnly = process.argv.includes("--draft-only");
const isEntrypoint = process.argv[1] && process.argv[1].endsWith("expandMlCourse.ts");
if (isEntrypoint) {
  const emailArg = process.argv.find(a => a.startsWith("--admin-email="));
  main(emailArg?.slice("--admin-email=".length)).catch(err => {
    console.error("[expand-ml] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
