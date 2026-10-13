/**
 * Final Module 1 release, in three guarded phases. Each phase stops on the first
 * failure and nothing in a later phase runs unless the earlier one passed.
 *
 *   --phase=validate        read-only: draft validation + Module 1 structure checks
 *   --phase=publish         publishes the current draft ONCE through cmsService.publishDraft
 *   --phase=repin --version=<published id> --email=<learner>
 *                           verifies the published snapshot, repins ONE learner via
 *                           cmsService.repinLearnerCourse, then verifies through the learner services
 *
 * No raw database writes. No version number is assumed anywhere.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { resolveLearnerCurriculum } from "../src/modules/curriculum/curriculum.service.js";
import { getNextCheckpointId } from "../src/modules/learning/progress.engine.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import { printApiCacheNotice } from "./lib/apiCacheNotice.js";

const COURSE = "machine-learning-foundations";
const MODULE1 = [
  ["ml-foundations-1", "What is Machine Learning?"],
  ["ml-foundations-2", "Data, Features & Labels"],
  ["ml-foundations-3", "Linear Regression — The Line That Learns"],
  ["ml-foundations-4", "Training, Validation & Testing"],
  ["ml-foundations-5", "Generalization, Underfitting & Overfitting"],
  ["ml-foundations-6", "Supervised vs Unsupervised Learning"],
  ["ml-foundations-7", "The Machine Learning Workflow"],
] as const;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

function module1Of(zones: any[]): any[] {
  const module = zones.flatMap((z) => z.modules).find((m) => m.id === "ml-foundations");
  return module?.checkpoints ?? [];
}

/** Structure checks for the seven Module 1 checkpoints. `frozen` additionally
 * requires every animation to reference a frozen revision (rN), not "draft". */
async function checkModule1(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module1Of(zones);
  if (cps.length !== 7) problems.push(`Module 1 has ${cps.length} checkpoints, expected 7`);
  for (let i = 0; i < MODULE1.length; i++) {
    const [id, title] = MODULE1[i]!;
    const cp = cps[i];
    if (!cp) continue;
    if (cp.id !== id) problems.push(`position ${i + 1}: id ${cp.id}, expected ${id}`);
    if (cp.title !== title) problems.push(`${id}: title "${cp.title}", expected "${title}"`);
    const expectedPrereq = i === 0 ? [] : [MODULE1[i - 1]![0]];
    if (JSON.stringify(cp.prerequisites) !== JSON.stringify(expectedPrereq)) problems.push(`${id}: prerequisites ${JSON.stringify(cp.prerequisites)}`);
    if (!(cp.xp > 0)) problems.push(`${id}: xp ${cp.xp}`);
    const ws = cp.workspace ?? {};
    if (!ws.quickCheck) problems.push(`${id}: no Quick Check`);
    const anim = ws.animation;
    if (!anim || anim.kind !== "custom") problems.push(`${id}: no custom animation package`);
    else {
      if (anim.bridgeMode !== "synchronized") problems.push(`${id}: bridgeMode ${anim.bridgeMode}`);
      if (frozen) {
        if (!/^r\d+$/.test(anim.revisionId)) problems.push(`${id}: animation revision "${anim.revisionId}" is not frozen`);
        else if (!(await CmsAnimationPackage.exists({ packageId: anim.packageId, revisionId: anim.revisionId, status: "frozen" }))) {
          problems.push(`${id}: frozen package revision ${anim.packageId}@${anim.revisionId} not found`);
        }
      }
    }
    if (ws.traceSource?.kind !== "package") problems.push(`${id}: traceSource ${ws.traceSource?.kind ?? "none"}`);
  }
  return problems;
}

async function phaseValidate() {
  const issues = await cmsService.validateDraft(COURSE);
  // Every CMS validation issue blocks publishing.
  console.log(`DRAFT_VALIDATION_ISSUES: ${issues.length}`);
  if (issues.length) fail(`blocking validation issues: ${JSON.stringify(issues)}`);
  const draft = await cmsService.getDraft(COURSE);
  const problems = await checkModule1(draft.zones as any[], false);
  const all = (draft.zones as any[]).flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
  console.log(`DRAFT: revision ${draft.revision}, zones ${draft.zones.length}, checkpoints ${all.length}, module1 ${module1Of(draft.zones as any[]).length}`);
  if (problems.length) fail("Module 1 checks failed:\n  - " + problems.join("\n  - "));
  const pointer = await CmsCourse.findOne({ courseId: COURSE }).lean();
  console.log(`PREVIOUS_PUBLISHED_VERSION: ${pointer?.latestPublishedVersion}`);
  console.log("PHASE validate: PASS");
}

async function phasePublish() {
  const before = (await CmsCourse.findOne({ courseId: COURSE }).lean())?.latestPublishedVersion;
  // Re-run the gate immediately before publishing; never publish unvalidated content.
  await phaseValidate();
  const actorId = await resolveActorId(arg("admin-email"));
  const result = await cmsService.publishDraft(COURSE, actorId);
  console.log(`PUBLISHED: previous ${before} -> new ${result.version.versionId} (snapshot ${result.snapshotVersion}, ${result.snapshotCheckpointCount} checkpoints)`);
  printApiCacheNotice("finalizeMlModule1 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");

  // 1. Verify the published snapshot before touching any learner.
  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const pubProblems = await checkModule1(published.zones as any[], true);
  const pubAll = (published.zones as any[]).flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
  console.log(`PUBLISHED ${version}: zones ${published.zones.length}, checkpoints ${pubAll.length}, module1 ${module1Of(published.zones as any[]).length}`);
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  const draftNow = await cmsService.getDraft(COURSE);
  const draftAll = (draftNow.zones as any[]).flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
  if (draftAll.length !== pubAll.length) fail(`published has ${pubAll.length} checkpoints but the validated draft has ${draftAll.length}`);

  // 2. Repin exactly one learner through the service.
  const user = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
  if (!user) fail(`no user ${email}`);
  const userId = String(user._id);
  const before = await CourseProgress.findOne({ userId, courseId: COURSE }).lean();
  console.log(`DEV_LEARNER_PIN_BEFORE: ${before?.curriculumVersion}; completed ${before?.completedCheckpointIds?.length}; xp ${before?.xp}`);
  const repin = await cmsService.repinLearnerCourse(userId, COURSE, version);
  console.log(`REPIN: ${JSON.stringify(repin)}`);

  // 3. Verify through the real learner services.
  const state = await learning.getCourseState(userId, COURSE);
  const content = await cmsService.getPinnedPublishedContent(COURSE, userId);
  const curriculum = await resolveLearnerCurriculum(userId, COURSE);
  const contentIds = (content.zones as any[]).flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints.map((c: any) => c.id)));
  const curriculumIds = curriculum.checkpoints.map((c) => c.id);
  const sameSnapshot = content.versionId === curriculum.version && JSON.stringify(contentIds) === JSON.stringify(curriculumIds);
  const next = getNextCheckpointId(curriculum, "ml-foundations-3");
  console.log(`DEV_LEARNER_PIN_AFTER: ${state.curriculumVersion}`);
  console.log(`LEARNER_MODULE1_CHECKPOINTS: ${module1Of(content.zones as any[]).length}`);
  console.log(`COMPLETED: ${JSON.stringify(state.progress.completedCheckpointIds)}`);
  console.log(`XP_AFTER_REPIN: ${state.progress.xp}`);
  console.log(`NEXT_CHECKPOINT: ${next}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot} (content ${content.versionId}, progress ${curriculum.version})`);
}

async function main() {
  const phase = arg("phase");
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    if (phase === "validate") await phaseValidate();
    else if (phase === "publish") await phasePublish();
    else if (phase === "repin") await phaseRepin();
    else fail("--phase=validate|publish|repin is required");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("[finalize] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
