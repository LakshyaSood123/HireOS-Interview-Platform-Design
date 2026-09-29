/**
 * Phase 3B §19 — one-time, idempotent, EXPLICIT bootstrap of the current
 * static DSA course into the CMS: `cmsCourses["dsa-foundations"]` + a
 * published `v1` `cmsCourseVersions` doc + a matching active
 * `curriculumSnapshots` doc. Never runs on boot — an admin runs it by hand:
 *
 *   npm run bootstrap:dsa-cms
 *   npm run bootstrap:dsa-cms -- --dry-run
 *   npm run bootstrap:dsa-cms -- --admin-email=you@example.com
 *
 * Re-running once `cmsCourses["dsa-foundations"]` already exists is a no-op
 * (idempotent) — it never overwrites an already-bootstrapped course, since
 * from that point on the CMS draft/publish flow (`cms.service.ts`) is the
 * only thing allowed to create new versions.
 *
 * Source of truth for content: `src/creator/dsa/dsaImporter.ts`'s
 * `importStaticDsaCourse()` — the SAME lossless, deterministic importer
 * Phase 1 already proved round-trips all 7 zones / 29 modules / 107
 * checkpoints with 0 mismatches (`src/creator/dsa/dsaCmsVerify.ts`). This
 * script does not re-derive or hand-transcribe any checkpoint; it only maps
 * that importer's frontend-shaped output (`CmsDsaZone[]`, using the learner's
 * own `LessonWorkspaceContent`) onto the backend's independently-defined
 * `CmsZone[]` DTO (`backend/src/modules/cms/cms.types.ts`) field by field.
 */

import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { isKnownAnimationId } from "../src/modules/cms/animationIds.js";
import { resolveExistingExecution, PISTON_CHECKPOINT_IDS } from "../src/modules/cms/executionManifest.js";
import { bootstrapCourse } from "../src/modules/cms/bootstrap.js";
import { validateCmsVersionContent } from "../src/modules/cms/cms.validation.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import type {
  CmsCheckpoint,
  CmsModule,
  CmsWorkspace,
  CmsZone,
} from "../src/modules/cms/cms.types.js";

// Frontend, pure data/types — same precedent as seedCurriculum.ts's import
// of courseRegistry.ts. dsaImporter.ts touches no React, no CSS, no DOM.
import { importStaticDsaCourse } from "../../src/creator/dsa/dsaImporter";
import type {
  CmsDsaCheckpoint,
  CmsDsaModule,
  CmsDsaZone,
} from "../../src/creator/dsa/dsaCmsTypes";
import type { LessonWorkspaceContent } from "../../src/learning/types";

const COURSE_ID = "dsa-foundations";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const match = args.find((entry) => entry === `--${name}` || entry.startsWith(`--${name}=`));
  if (!match) return undefined;
  return match.includes("=") ? match.slice(match.indexOf("=") + 1) : "";
};
const dryRun = flag("dry-run") !== undefined;
const adminEmail = flag("admin-email");

function mapWorkspace(checkpointId: string, workspace: LessonWorkspaceContent): CmsWorkspace {
  return {
    title: workspace.title,
    theory: workspace.theory.map((block) => ({ heading: block.heading, body: block.body })),
    learnMore: workspace.learnMore,
    visual: workspace.visual,
    callStackVisual: workspace.callStackVisual,
    twoPointerVisual: workspace.twoPointerVisual,
    codeExamples: workspace.codeExamples?.map((example) => ({ language: example.language, code: example.code })),
    quickCheck: workspace.quickCheck
      ? {
          question: workspace.quickCheck.question,
          options: [...workspace.quickCheck.options],
          correctIndex: workspace.quickCheck.correctIndex,
          explanation: workspace.quickCheck.explanation,
        }
      : undefined,
    codingActivity: workspace.codingActivity
      ? (() => {
          // Preserve today's ACTUAL execution capability rather than
          // defaulting every existing activity to "disabled" — a checkpoint
          // already approved for real Piston execution (the gateway's own
          // 14-id allowlist) stays "piston"; every other existing coding
          // activity already runs through MockCodeRunner client-side today,
          // so it is bootstrapped as "mock", not silently downgraded. Only a
          // brand-new CMS-authored activity (never part of this bootstrap)
          // starts "disabled" — see `executionManifest.ts` and Phase 3B
          // hardening plan §1.
          const execution = resolveExistingExecution(checkpointId, [...workspace.codingActivity.languages]);
          return {
            prompt: workspace.codingActivity.prompt,
            constraints: workspace.codingActivity.constraints,
            functionName: workspace.codingActivity.functionName,
            requiredKeywords: [...workspace.codingActivity.requiredKeywords],
            starterCode: { ...workspace.codingActivity.starterCode },
            languages: [...workspace.codingActivity.languages],
            visibleTests: workspace.codingActivity.visibleTests.map((test) => ({ ...test })),
            hiddenTests: workspace.codingActivity.hiddenTests.map((test) => ({ ...test })),
            hint: workspace.codingActivity.hint,
            mistakeFeedback: workspace.codingActivity.mistakeFeedback,
            executionMode: execution.executionMode,
            harnessKey: execution.harnessKey,
          };
        })()
      : undefined,
    animation: workspace.animation ? { id: workspace.animation.id, title: workspace.animation.title } : undefined,
  };
}

function mapCheckpoint(checkpoint: CmsDsaCheckpoint): CmsCheckpoint {
  if (checkpoint.lesson && !checkpoint.workspace) {
    throw new Error(
      `bootstrapDsaCms: checkpoint "${checkpoint.id}" is still legacy-model (has "lesson", no "workspace"). ` +
        `This script only maps workspace-model content — extend mapCheckpoint() before bootstrapping.`,
    );
  }
  if (!checkpoint.workspace) {
    throw new Error(`bootstrapDsaCms: checkpoint "${checkpoint.id}" has neither "lesson" nor "workspace" content.`);
  }

  return {
    id: checkpoint.id,
    moduleId: checkpoint.moduleId,
    order: checkpoint.order,
    title: checkpoint.title,
    subtitle: checkpoint.subtitle,
    type: checkpoint.type,
    xp: checkpoint.xp,
    masteryXp: checkpoint.masteryXp,
    prerequisites: [...checkpoint.prerequisites],
    legacyNodeId: checkpoint.legacyNodeId,
    workspace: mapWorkspace(checkpoint.id, checkpoint.workspace),
    state: checkpoint.state,
  };
}

function mapModule(zoneModule: CmsDsaModule): CmsModule {
  return {
    id: zoneModule.id,
    zoneId: zoneModule.zoneId,
    order: zoneModule.order,
    title: zoneModule.title,
    description: zoneModule.description,
    icon: zoneModule.icon,
    accentColor: zoneModule.accentColor,
    contentKind: zoneModule.contentKind,
    checkpoints: zoneModule.checkpoints.map(mapCheckpoint),
    state: zoneModule.state,
  };
}

function mapZone(zone: CmsDsaZone): CmsZone {
  return {
    id: zone.id,
    order: zone.order,
    title: zone.title,
    description: zone.description,
    modules: zone.modules.map(mapModule),
    state: zone.state,
  };
}

function report(zones: CmsZone[], docSizeBytes: number): void {
  const modules = zones.flatMap((zone) => zone.modules);
  const checkpoints = modules.flatMap((zoneModule) => zoneModule.checkpoints);
  const withCoding = checkpoints.filter((checkpoint) => checkpoint.workspace?.codingActivity);
  const withAnimation = checkpoints.filter((checkpoint) => checkpoint.workspace?.animation).length;
  const unknownAnimations = checkpoints
    .filter((checkpoint) => checkpoint.workspace?.animation && !isKnownAnimationId(checkpoint.workspace.animation.id))
    .map((checkpoint) => checkpoint.id);

  const pistonCheckpoints = withCoding.filter((checkpoint) => checkpoint.workspace!.codingActivity!.executionMode === "piston");
  const mockCheckpoints = withCoding.filter((checkpoint) => checkpoint.workspace!.codingActivity!.executionMode === "mock");
  const disabledCheckpoints = withCoding.filter((checkpoint) => checkpoint.workspace!.codingActivity!.executionMode === "disabled");
  const unapprovedHarness = withCoding.filter(
    (checkpoint) => checkpoint.workspace!.codingActivity!.executionMode === "piston" && !PISTON_CHECKPOINT_IDS.includes(checkpoint.id),
  );

  console.log(`\n  ${COURSE_ID}  v1 (bootstrap)`);
  console.log(`  ${"─".repeat(60)}`);
  console.log(`  zones               ${zones.length}`);
  console.log(`  modules             ${modules.length}`);
  console.log(`  checkpoints         ${checkpoints.length}`);
  console.log(`  coding activities   ${withCoding.length}`);
  console.log(`    piston            ${pistonCheckpoints.length}`);
  console.log(`    mock              ${mockCheckpoints.length}`);
  console.log(`    disabled          ${disabledCheckpoints.length}`);
  console.log(`  animations          ${withAnimation}`);
  console.log(`  serialized size     ${(docSizeBytes / 1024).toFixed(1)} KB (limit: 16 MB per Mongo document)`);
  console.log(`\n  piston checkpoint ids (${pistonCheckpoints.length}):`);
  for (const checkpoint of pistonCheckpoints) console.log(`    ${checkpoint.id}`);
  if (unknownAnimations.length > 0) {
    console.log(`\n  \u001b[31munknown animation ids\u001b[0m  ${unknownAnimations.join(", ")}`);
  }
  if (unapprovedHarness.length > 0) {
    throw new Error(
      `bootstrapDsaCms: internal error — checkpoint(s) mapped to "piston" without an approved harnessKey: ${unapprovedHarness.map((c) => c.id).join(", ")}`,
    );
  }
}

async function main(): Promise<void> {
  const frontendCourse = importStaticDsaCourse();
  if (frontendCourse.id !== COURSE_ID) {
    throw new Error(`bootstrapDsaCms: expected course id "${COURSE_ID}", importer returned "${frontendCourse.id}".`);
  }
  if (!frontendCourse.dsaZones) {
    throw new Error(`bootstrapDsaCms: importStaticDsaCourse() returned no dsaZones.`);
  }

  const zones = frontendCourse.dsaZones.map(mapZone);

  const validationIssues = validateCmsVersionContent({
    courseId: COURSE_ID,
    title: frontendCourse.title,
    courseType: "structured-dsa",
    zones,
  });
  if (validationIssues.length > 0) {
    console.error(`\n  \u001b[31mVALIDATION FAILED\u001b[0m — mapped content did not pass server validation:\n`);
    for (const issue of validationIssues) console.error(`    ${issue.entityType} ${issue.entityId}${issue.field ? ` (${issue.field})` : ""}: ${issue.message}`);
    process.exit(1);
  }

  const docSizeBytes = Buffer.byteLength(JSON.stringify({ courseId: COURSE_ID, title: frontendCourse.title, courseType: "structured-dsa", zones }), "utf8");
  const SIXTEEN_MB = 16 * 1024 * 1024;
  if (docSizeBytes >= SIXTEEN_MB) {
    throw new Error(`bootstrapDsaCms: mapped content is ${(docSizeBytes / 1024 / 1024).toFixed(2)} MB — at or over MongoDB's 16 MB document limit.`);
  }

  report(zones, docSizeBytes);

  if (dryRun) {
    console.log("\n  --dry-run: mapped and validated, nothing written.\n");
    return;
  }

  // Connect BEFORE resolveActorId's own User.findOne() — it was previously
  // called first, so every real (non-dry-run) invocation failed with
  // "Operation `users.findOne()` buffering timed out" (Mongoose queues an
  // operation issued before the connection opens, and only times out
  // instead of erroring immediately). Found while wiring Creator Studio to
  // this same bootstrap path; smallest fix is this reordering — nothing
  // about resolveActorId's own logic changed.
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  await Promise.all([CmsCourse.createIndexes(), CmsCourseVersion.createIndexes(), CurriculumSnapshot.createIndexes()]);

  const actorId = await resolveActorId(adminEmail);

  const result = await bootstrapCourse({
    courseId: COURSE_ID,
    title: frontendCourse.title,
    courseType: "structured-dsa",
    zones,
    actorId,
  });

  if (result.alreadyBootstrapped) {
    console.log(`\n  "${COURSE_ID}" is already bootstrapped.`);
    console.log(`  This script never overwrites an existing course — use the CMS draft/publish API for further changes.\n`);
    return;
  }

  console.log(`\n  bootstrapped ${COURSE_ID} ${result.versionId} into ${env.MONGO_DB_NAME} (${result.snapshotCheckpointCount} checkpoints)`);
  console.log(`    cmsCourses.${COURSE_ID}.latestPublishedVersion = "${result.versionId}"`);
  console.log(`    cmsCourseVersions{ courseId: "${COURSE_ID}", versionId: "${result.versionId}", status: "published" }`);
  console.log(`    curriculumSnapshots{ courseId: "${COURSE_ID}", version: "${result.versionId}", isActive: true }`);
  console.log("\n  Restart the API so it warms the new active snapshot into its cache.\n");
}

main()
  .then(async () => {
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(1);
  });
