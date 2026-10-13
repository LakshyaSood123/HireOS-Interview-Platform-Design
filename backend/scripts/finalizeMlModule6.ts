/**
 * Module 6 release (Optimization Ridge -> Optimization for Machine Learning),
 * in three guarded phases. Each phase stops on the first failure.
 *
 *   --phase=validate        read-only: CMS draft validation + Module 2 structure/content checks
 *   --phase=publish         re-runs validate, then publishes the current draft ONCE
 *   --phase=repin --version=<published id> --email=<learner>
 *                           verifies the published snapshot (frozen animation revisions),
 *                           repins ONE learner via cmsService.repinLearnerCourse, then
 *                           verifies through the real learner services
 *
 * No raw database writes. No version number is assumed.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { validatePackageTraceAgainstManifest } from "../src/modules/cms/animationPackage.service.js";
import { resolveLearnerCurriculum } from "../src/modules/curriculum/curriculum.service.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import { printApiCacheNotice } from "./lib/apiCacheNotice.js";

const COURSE = "machine-learning-foundations";
const ZONE = "optimization-ridge";
const MODULE = "optimization";
const MODULE2 = [
  ["optimization-1", "Objective Functions"],
  ["optimization-2", "Loss Functions"],
  ["optimization-3", "Gradient Descent"],
  ["optimization-4", "Learning Rate"],
  ["optimization-5", "Gradient Descent in Multiple Dimensions"],
  ["optimization-6", "Taylor Series and Optimization"],
  ["optimization-7", "Convex Sets"],
  ["optimization-8", "Convex Functions"],
  ["optimization-9", "Constrained Optimization"],
  ["optimization-10", "Lagrange Multipliers"],
  ["optimization-11", "KKT Conditions"],
] as const;
const PREREQ: Record<string, string[]> = {
  "optimization-1": [],
  "optimization-2": ["optimization-1"],
  "optimization-3": ["optimization-2", "calculus-5"],
  "optimization-4": ["optimization-3"],
  "optimization-5": ["optimization-4", "calculus-6"],
  "optimization-6": ["optimization-5", "calculus-7"],
  "optimization-7": ["optimization-6"],
  "optimization-8": ["optimization-7"],
  "optimization-9": ["optimization-8"],
  "optimization-10": ["optimization-9"],
  "optimization-11": ["optimization-10"],
};

// Markers that identify the FINAL rewritten content (not the original expansion text).
const NEW_FIRST_BLOCK_LA1 = "Training needs a target";
const NEW_QUICK_CHECK_LA4 = "On L(w) = (w − 3)² a run with learning rate 1.1 produces the weights 0, 6.6, −1.32, 8.18, −3.22, ... What is happening?";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
function module2Of(zones: any[]): any[] {
  const zone = zones.find((z) => z.id === ZONE);
  return zone?.modules.find((m: any) => m.id === MODULE)?.checkpoints ?? [];
}
const module1Count = (zones: any[]) => zones.flatMap((z) => z.modules).find((m: any) => m.id === "ml-foundations")?.checkpoints.length ?? 0;

/** `frozen`: animations must point at frozen rN revisions; otherwise at the package draft. */
async function checkModule2(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module2Of(zones);
  if (cps.length !== 11) problems.push(`Module 2 has ${cps.length} checkpoints, expected 11`);
  for (let i = 0; i < MODULE2.length; i++) {
    const [id, title] = MODULE2[i]!;
    const cp = cps[i];
    if (!cp) continue;
    if (cp.id !== id) problems.push(`position ${i + 1}: id ${cp.id}, expected ${id}`);
    if (cp.title !== title) problems.push(`${id}: title "${cp.title}", expected "${title}"`);
    const expectedPrereq = PREREQ[id]!;
    if (JSON.stringify(cp.prerequisites) !== JSON.stringify(expectedPrereq)) problems.push(`${id}: prerequisites ${JSON.stringify(cp.prerequisites)}`);
    if (!(cp.xp > 0)) problems.push(`${id}: xp ${cp.xp}`);
    const ws = cp.workspace ?? {};
    const qc = ws.quickCheck;
    if (!qc || qc.options.length < 2 || qc.correctIndex < 0 || qc.correctIndex >= qc.options.length || !String(qc.explanation).trim()) problems.push(`${id}: invalid Quick Check`);
    if (!ws.theory?.length || ws.theory.some((t: any) => !String(t.heading).trim() || !String(t.body).trim())) problems.push(`${id}: empty theory`);
    const a = ws.animation;
    if (!a || a.kind !== "custom") {
      problems.push(`${id}: no custom animation package`);
      continue;
    }
    if (a.bridgeMode !== "synchronized") problems.push(`${id}: bridgeMode ${a.bridgeMode}`);
    if (ws.traceSource?.kind !== "package") problems.push(`${id}: traceSource ${ws.traceSource?.kind ?? "none"}`);
    const wantRevision = frozen ? /^r\d+$/.test(a.revisionId) : a.revisionId === "draft";
    if (!wantRevision) problems.push(`${id}: animation revision "${a.revisionId}" (${frozen ? "must be frozen" : "must be draft"})`);
    const pkg: any = await CmsAnimationPackage.findOne({ packageId: a.packageId, revisionId: a.revisionId }).lean();
    if (!pkg) problems.push(`${id}: package ${a.packageId}@${a.revisionId} not found`);
    else {
      if (frozen && pkg.status !== "frozen") problems.push(`${id}: package revision is ${pkg.status}, not frozen`);
      if (!pkg.packageTrace?.steps?.length) problems.push(`${id}: package has no trace`);
      else {
        try {
          validatePackageTraceAgainstManifest(pkg.packageTrace, pkg.manifest.traceEvents);
        } catch (e: any) {
          problems.push(`${id}: trace does not match manifest: ${e.message}`);
        }
      }
    }
  }
  // The rewritten content must be the content in this snapshot.
  if (cps[0] && cps[0].workspace.theory[0]?.heading !== NEW_FIRST_BLOCK_LA1) problems.push(`optimization-1 still has old content ("${cps[0].workspace.theory[0]?.heading}")`);
  if (cps[3] && cps[3].workspace.quickCheck?.question !== NEW_QUICK_CHECK_LA4) problems.push(`optimization-4 still has the old Quick Check ("${cps[3].workspace.quickCheck?.question}")`);
  return problems;
}

async function phaseValidate() {
  const issues = await cmsService.validateDraft(COURSE);
  console.log(`DRAFT_VALIDATION_ISSUES: ${issues.length}`);
  if (issues.length) fail(`blocking validation issues: ${JSON.stringify(issues)}`);
  const draft = await cmsService.getDraft(COURSE);
  const problems = await checkModule2(draft.zones as any[], false);
  console.log(`DRAFT: revision ${draft.revision}, checkpoints ${allCheckpoints(draft.zones as any[]).length}, module1 ${module1Count(draft.zones as any[])}, module2 ${module2Of(draft.zones as any[]).length}`);
  if (module1Count(draft.zones as any[]) !== 7) problems.push(`Module 1 has ${module1Count(draft.zones as any[])} checkpoints, expected 7`);
  if (problems.length) fail("Module 2 checks failed:\n  - " + problems.join("\n  - "));
  const pointer = await CmsCourse.findOne({ courseId: COURSE }).lean();
  console.log(`PREVIOUS_PUBLISHED_VERSION: ${pointer?.latestPublishedVersion}`);
  console.log("PHASE validate: PASS");
}

async function phasePublish() {
  const before = (await CmsCourse.findOne({ courseId: COURSE }).lean())?.latestPublishedVersion;
  await phaseValidate(); // never publish unvalidated content
  const actorId = await resolveActorId(arg("admin-email"));
  const result = await cmsService.publishDraft(COURSE, actorId);
  console.log(`PUBLISHED: previous ${before} -> new ${result.version.versionId} (snapshot ${result.snapshotVersion}, ${result.snapshotCheckpointCount} checkpoints)`);
  printApiCacheNotice("finalizeMlModule6 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const pubProblems = await checkModule2(published.zones as any[], true);
  console.log(`PUBLISHED ${version}: checkpoints ${allCheckpoints(published.zones as any[]).length}, module1 ${module1Count(published.zones as any[])}, module2 ${module2Of(published.zones as any[]).length}`);
  if (module1Count(published.zones as any[]) !== 7) pubProblems.push("Module 1 does not have 7 checkpoints");
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  console.log(`MODULE2_ANIMATIONS_FROZEN: ${module2Of(published.zones as any[]).filter((c: any) => /^r\d+$/.test(c.workspace.animation?.revisionId ?? "")).length}/11`);

  const user = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
  if (!user) fail(`no user ${email}`);
  const userId = String(user._id);
  const before = await CourseProgress.findOne({ userId, courseId: COURSE }).lean();
  console.log(`DEV_LEARNER_PIN_BEFORE: ${before?.curriculumVersion}; completed ${before?.completedCheckpointIds?.length}; xp ${before?.xp}`);
  const repin = await cmsService.repinLearnerCourse(userId, COURSE, version);
  console.log(`REPIN: ${JSON.stringify(repin)}`);

  // Verify through the real learner services.
  const state = await learning.getCourseState(userId, COURSE);
  const content: any = await cmsService.getPinnedPublishedContent(COURSE, userId);
  const curriculum = await resolveLearnerCurriculum(userId, COURSE);
  const contentIds = allCheckpoints(content.zones).map((c) => c.id);
  const sameSnapshot = content.versionId === curriculum.version && JSON.stringify(contentIds) === JSON.stringify(curriculum.checkpoints.map((c) => c.id));
  console.log(`DEV_LEARNER_PIN_AFTER: ${state.curriculumVersion}`);
  console.log(`LEARNER_MODULE1_CHECKPOINTS: ${module1Count(content.zones)}  LEARNER_MODULE2_CHECKPOINTS: ${module2Of(content.zones).length}`);
  console.log(`COMPLETED: ${JSON.stringify(state.progress.completedCheckpointIds)}  XP_AFTER_REPIN: ${state.progress.xp}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot} (content ${content.versionId}, progress ${curriculum.version})`);

  const projections = module2Of(content.zones).find((c: any) => c.id === "optimization-4");
  console.log(`PROJECTIONS: first block "${projections.workspace.theory[0].heading}"; quick check "${projections.workspace.quickCheck.question}"`);
  const a = projections.workspace.animation;
  const pkg: any = await cmsService.getLearnerReferencedPackageRevision(COURSE, userId, a.packageId, a.revisionId);
  console.log(`PROJECTIONS_ANIMATION: ${a.kind} ${a.packageId.slice(0, 8)}@${a.revisionId}, learner fetch OK (status frozen), trace steps ${pkg.packageTrace.steps.length}, bridge ${a.bridgeMode}, trace source ${projections.workspace.traceSource.kind}`);
  const traces = module2Of(content.zones).filter((c: any) => c.workspace.traceSource?.kind === "package").length;
  console.log(`MODULE2_PACKAGE_TRACES: ${traces}/11`);
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
  console.error("[finalize-m6] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
