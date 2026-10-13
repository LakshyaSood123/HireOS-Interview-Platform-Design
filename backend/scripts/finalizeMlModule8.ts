/**
 * Module 8 release (Classification Woods -> Classification Foundations),
 * in three guarded phases. Each phase stops on the first failure.
 *
 *   --phase=validate        read-only: CMS draft validation + Module 8 structure/content checks
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
const ZONE = "classification-woods";
const MODULE = "classification-foundations";
const MODULE8 = [
  ["classification-foundations-1", "Regression vs Classification"],
  ["classification-foundations-2", "Binary Classification"],
  ["classification-foundations-3", "Scores and Decision Boundaries"],
  ["classification-foundations-4", "Probabilities and Thresholds"],
  ["classification-foundations-5", "Logistic Intuition"],
  ["classification-foundations-6", "Multiclass Classification"],
  ["classification-foundations-7", "Classification Errors"],
] as const;
const PREREQ: Record<string, string[]> = {
  "classification-foundations-1": [],
  "classification-foundations-2": ["classification-foundations-1"],
  "classification-foundations-3": ["classification-foundations-2"],
  "classification-foundations-4": ["classification-foundations-3"],
  "classification-foundations-5": ["classification-foundations-4"],
  "classification-foundations-6": ["classification-foundations-5"],
  "classification-foundations-7": ["classification-foundations-6"],
};

const NEW_FIRST_BLOCK = "Two kinds of answers";
const NEW_QUICK_CHECK_5 = "In a logistic classifier an email has linear score z = 0. What do we conclude?";
const EXPECTED_TOTAL = 71;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
function module8Of(zones: any[]): any[] {
  const zone = zones.find((z) => z.id === ZONE);
  return zone?.modules.find((m: any) => m.id === MODULE)?.checkpoints ?? [];
}
const module1Count = (zones: any[]) => zones.flatMap((z) => z.modules).find((m: any) => m.id === "ml-foundations")?.checkpoints.length ?? 0;

/** `frozen`: animations must point at frozen rN revisions; otherwise at the package draft. */
async function checkModule2(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module8Of(zones);
  if (cps.length !== 7) problems.push(`Module 8 has ${cps.length} checkpoints, expected 7`);
  for (let i = 0; i < MODULE8.length; i++) {
    const [id, title] = MODULE8[i]!;
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
  if (cps[0] && cps[0].workspace.theory[0]?.heading !== NEW_FIRST_BLOCK) problems.push(`classification-foundations-1 has unexpected content ("${cps[0].workspace.theory[0]?.heading}")`);
  if (cps[4] && cps[4].workspace.quickCheck?.question !== NEW_QUICK_CHECK_5) problems.push("classification-foundations-5 has an unexpected Quick Check");
  if (zones.filter((z) => z.id === ZONE).length !== 1) problems.push(`zone ${ZONE} appears ${zones.filter((z) => z.id === ZONE).length} times, expected 1`);
  const z5 = zones.find((z) => z.id === ZONE);
  if ((z5?.modules ?? []).filter((m: any) => m.id === MODULE).length !== 1 || (z5?.modules ?? []).length !== 1) problems.push(`zone ${ZONE} must contain exactly the one module ${MODULE}`);
  if (zones.length !== 5) problems.push(`course has ${zones.length} zones, expected 5`);
  if (allCheckpoints(zones).length !== EXPECTED_TOTAL) problems.push(`course has ${allCheckpoints(zones).length} checkpoints, expected ${EXPECTED_TOTAL}`);
  if (zones.flatMap((z) => z.modules).some((m: any) => /evaluation/i.test(m.id))) problems.push("Model Evaluation must not be assembled yet");
  const ids = allCheckpoints(zones).map((c: any) => c.id);
  if (new Set(ids).size !== ids.length) problems.push("duplicate checkpoint ids");
  for (const c of allCheckpoints(zones)) for (const p of c.prerequisites) if (!ids.includes(p)) problems.push(`${c.id}: dangling prerequisite ${p}`);
  return problems;
}

async function phaseValidate() {
  const issues = await cmsService.validateDraft(COURSE);
  console.log(`DRAFT_VALIDATION_ISSUES: ${issues.length}`);
  if (issues.length) fail(`blocking validation issues: ${JSON.stringify(issues)}`);
  const draft = await cmsService.getDraft(COURSE);
  const problems = await checkModule2(draft.zones as any[], false);
  console.log(`DRAFT: revision ${draft.revision}, checkpoints ${allCheckpoints(draft.zones as any[]).length}, module1 ${module1Count(draft.zones as any[])}, module8 ${module8Of(draft.zones as any[]).length}`);
  if (module1Count(draft.zones as any[]) !== 7) problems.push(`Module 1 has ${module1Count(draft.zones as any[])} checkpoints, expected 7`);
  if (problems.length) fail("Module 8 checks failed:\n  - " + problems.join("\n  - "));
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
  printApiCacheNotice("finalizeMlModule8 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const pubProblems = await checkModule2(published.zones as any[], true);
  console.log(`PUBLISHED ${version}: checkpoints ${allCheckpoints(published.zones as any[]).length}, module1 ${module1Count(published.zones as any[])}, module8 ${module8Of(published.zones as any[]).length}`);
  if (module1Count(published.zones as any[]) !== 7) pubProblems.push("Module 1 does not have 7 checkpoints");
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  console.log(`MODULE8_ANIMATIONS_FROZEN: ${module8Of(published.zones as any[]).filter((c: any) => /^r\d+$/.test(c.workspace.animation?.revisionId ?? "")).length}/7`);

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
  console.log(`LEARNER_MODULE1_CHECKPOINTS: ${module1Count(content.zones)}  LEARNER_MODULE8_CHECKPOINTS: ${module8Of(content.zones).length}`);
  console.log(`ACTIVE_CHECKPOINT_ID: ${(state.progress as any).activeCheckpointId}`);
  console.log(`LEARNER_ZONES: ${content.zones.map((z: any) => `${z.order}:${z.id}[${z.modules.map((m: any) => `${m.id}=${m.checkpoints.length}`).join(",")}]`).join(" ")}`);
  console.log(`COMPLETED: ${JSON.stringify(state.progress.completedCheckpointIds)}  XP_AFTER_REPIN: ${state.progress.xp}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot} (content ${content.versionId}, progress ${curriculum.version})`);

  const projections = module8Of(content.zones).find((c: any) => c.id === "classification-foundations-5");
  console.log(`LOGISTIC_LESSON: first block "${projections.workspace.theory[0].heading}"; quick check "${projections.workspace.quickCheck.question}"`);
  const a = projections.workspace.animation;
  const pkg: any = await cmsService.getLearnerReferencedPackageRevision(COURSE, userId, a.packageId, a.revisionId);
  console.log(`LOGISTIC_LESSON_ANIMATION: ${a.kind} ${a.packageId.slice(0, 8)}@${a.revisionId}, learner fetch OK (status frozen), trace steps ${pkg.packageTrace.steps.length}, bridge ${a.bridgeMode}, trace source ${projections.workspace.traceSource.kind}`);
  const traces = module8Of(content.zones).filter((c: any) => c.workspace.traceSource?.kind === "package").length;
  console.log(`MODULE8_PACKAGE_TRACES: ${traces}/7`);
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
  console.error("[finalize-m8] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
