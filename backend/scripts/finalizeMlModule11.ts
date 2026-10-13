/**
 * Module 11 release (Unsupervised Valley -> Gaussian Mixture Models),
 * in three guarded phases. Each phase stops on the first failure.
 *
 *   --phase=validate        read-only: CMS draft validation + Module 11 structure/content checks
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
const ZONE = "unsupervised-valley";
const MODULE = "gaussian-mixtures";
const MODULE11 = [
  ["gaussian-mixtures-1", "Density Estimation"],
  ["gaussian-mixtures-2", "Mixture Models"],
  ["gaussian-mixtures-3", "Gaussian Mixture Models"],
  ["gaussian-mixtures-4", "Hidden Membership"],
  ["gaussian-mixtures-5", "Responsibilities"],
  ["gaussian-mixtures-6", "E-Step"],
  ["gaussian-mixtures-7", "M-Step"],
  ["gaussian-mixtures-8", "Expectation Maximization"],
  ["gaussian-mixtures-9", "K-Means vs GMM"],
] as const;
const PREREQ: Record<string, string[]> = {
  "gaussian-mixtures-1": ["estimation-uncertainty-2"],
  "gaussian-mixtures-2": ["gaussian-mixtures-1"],
  "gaussian-mixtures-3": ["gaussian-mixtures-2"],
  "gaussian-mixtures-4": ["gaussian-mixtures-3"],
  "gaussian-mixtures-5": ["gaussian-mixtures-4"],
  "gaussian-mixtures-6": ["gaussian-mixtures-5"],
  "gaussian-mixtures-7": ["gaussian-mixtures-6"],
  "gaussian-mixtures-8": ["gaussian-mixtures-7"],
  "gaussian-mixtures-9": ["gaussian-mixtures-8", "clustering-6"],
};

const NEW_FIRST_BLOCK = "A third kind of question";
const NEW_QUICK_CHECK_6 = "During the E-step of EM, what is held fixed and what is computed?";
const EXPECTED_TOTAL = 95;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
function module11Of(zones: any[]): any[] {
  const zone = zones.find((z) => z.id === ZONE);
  return zone?.modules.find((m: any) => m.id === MODULE)?.checkpoints ?? [];
}
const module1Count = (zones: any[]) => zones.flatMap((z) => z.modules).find((m: any) => m.id === "ml-foundations")?.checkpoints.length ?? 0;

/** `frozen`: animations must point at frozen rN revisions; otherwise at the package draft. */
async function checkModule2(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module11Of(zones);
  if (cps.length !== 9) problems.push(`Module 11 has ${cps.length} checkpoints, expected 9`);
  for (let i = 0; i < MODULE11.length; i++) {
    const [id, title] = MODULE11[i]!;
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
  if (cps[0] && cps[0].workspace.theory[0]?.heading !== NEW_FIRST_BLOCK) problems.push(`gaussian-mixtures-1 has unexpected content ("${cps[0].workspace.theory[0]?.heading}")`);
  if (cps[5] && cps[5].workspace.quickCheck?.question !== NEW_QUICK_CHECK_6) problems.push("gaussian-mixtures-6 has an unexpected Quick Check");
  if (zones.filter((z) => z.id === ZONE).length !== 1) problems.push(`zone ${ZONE} appears ${zones.filter((z) => z.id === ZONE).length} times, expected 1`);
  const z6 = zones.find((z) => z.id === ZONE);
  if (JSON.stringify((z6?.modules ?? []).map((m: any) => `${m.id}=${m.checkpoints.length}`)) !== JSON.stringify(["clustering=7", `${MODULE}=9`])) problems.push(`zone ${ZONE} must contain exactly clustering (7) then ${MODULE} (9)`);
  if (z6 && z6.order !== 5) problems.push(`zone ${ZONE} has order ${z6.order}, expected 5`);
  if (zones.length !== 6 || zones[4]?.id !== "classification-woods" || zones[5]?.id !== ZONE) problems.push(`course zones are ${zones.map((z) => z.id).join(",")}; expected six with ${ZONE} after classification-woods`);
  const cw = zones.find((z) => z.id === "classification-woods");
  if (JSON.stringify((cw?.modules ?? []).map((m: any) => `${m.id}=${m.checkpoints.length}`)) !== JSON.stringify(["classification-foundations=7", "model-evaluation=8"])) problems.push("classification-woods must still hold classification-foundations (7) and model-evaluation (8)");
  if (allCheckpoints(zones).length !== EXPECTED_TOTAL) problems.push(`course has ${allCheckpoints(zones).length} checkpoints, expected ${EXPECTED_TOTAL}`);
  if (zones.flatMap((z) => z.modules).some((m: any) => /dimension|reliab/i.test(m.id))) problems.push("a later module (Dimensionality Reduction, Reliable ML Systems) must not be assembled yet");
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
  console.log(`DRAFT: revision ${draft.revision}, checkpoints ${allCheckpoints(draft.zones as any[]).length}, module1 ${module1Count(draft.zones as any[])}, module11 ${module11Of(draft.zones as any[]).length}`);
  if (module1Count(draft.zones as any[]) !== 7) problems.push(`Module 1 has ${module1Count(draft.zones as any[])} checkpoints, expected 7`);
  if (problems.length) fail("Module 11 checks failed:\n  - " + problems.join("\n  - "));
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
  printApiCacheNotice("finalizeMlModule11 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const pubProblems = await checkModule2(published.zones as any[], true);
  console.log(`PUBLISHED ${version}: checkpoints ${allCheckpoints(published.zones as any[]).length}, module1 ${module1Count(published.zones as any[])}, module11 ${module11Of(published.zones as any[]).length}`);
  if (module1Count(published.zones as any[]) !== 7) pubProblems.push("Module 1 does not have 7 checkpoints");
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  console.log(`MODULE11_ANIMATIONS_FROZEN: ${module11Of(published.zones as any[]).filter((c: any) => /^r\d+$/.test(c.workspace.animation?.revisionId ?? "")).length}/9`);

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
  console.log(`LEARNER_MODULE1_CHECKPOINTS: ${module1Count(content.zones)}  LEARNER_MODULE11_CHECKPOINTS: ${module11Of(content.zones).length}`);
  console.log(`ACTIVE_CHECKPOINT_ID: ${(state.progress as any).activeCheckpointId}`);
  console.log(`LEARNER_ZONES: ${content.zones.map((z: any) => `${z.order}:${z.id}[${z.modules.map((m: any) => `${m.id}=${m.checkpoints.length}`).join(",")}]`).join(" ")}`);
  console.log(`COMPLETED: ${JSON.stringify(state.progress.completedCheckpointIds)}  XP_AFTER_REPIN: ${state.progress.xp}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot} (content ${content.versionId}, progress ${curriculum.version})`);

  const projections = module11Of(content.zones).find((c: any) => c.id === "gaussian-mixtures-6");
  console.log(`ESTEP_LESSON: first block "${projections.workspace.theory[0].heading}"; quick check "${projections.workspace.quickCheck.question}"`);
  const a = projections.workspace.animation;
  const pkg: any = await cmsService.getLearnerReferencedPackageRevision(COURSE, userId, a.packageId, a.revisionId);
  console.log(`ESTEP_LESSON_ANIMATION: ${a.kind} ${a.packageId.slice(0, 8)}@${a.revisionId}, learner fetch OK (status frozen), trace steps ${pkg.packageTrace.steps.length}, bridge ${a.bridgeMode}, trace source ${projections.workspace.traceSource.kind}`);
  const traces = module11Of(content.zones).filter((c: any) => c.workspace.traceSource?.kind === "package").length;
  console.log(`MODULE11_PACKAGE_TRACES: ${traces}/9`);

  // Consistency of the Responsibilities / E-step / M-step teaching example in the published snapshot.
  const gm = module11Of(content.zones);
  const byId = (id: string) => gm.find((c: any) => c.id === id);
  const textOf = (c: any) => JSON.stringify([c.workspace.theory, c.workspace.learnMore, c.workspace.codeExamples, c.workspace.quickCheck]);
  const pkgOf = async (c: any) => cmsService.getLearnerReferencedPackageRevision(COURSE, userId, c.workspace.animation.packageId, c.workspace.animation.revisionId) as Promise<any>;
  for (const id of ["gaussian-mixtures-5", "gaussian-mixtures-6"]) {
    const c = byId(id);
    const p = await pkgOf(c);
    console.log(`NUMERIC_${id}: lesson ${/0\.3486/.test(textOf(c)) && /0\.6514/.test(textOf(c))}, animation ${/0\.3486/.test(p.js ?? "")}, trace ${/0\.3486/.test(JSON.stringify(p.packageTrace))}, scores 0.0518/0.0968 in lesson ${/0\.0518/.test(textOf(c)) && /0\.0968/.test(textOf(c))}`);
  }
  const m7 = byId("gaussian-mixtures-7");
  console.log(`NUMERIC_gaussian-mixtures-7: lesson mean 2.631 ${/2\.631/.test(textOf(m7))}, animation ${/2\.631/.test(((await pkgOf(m7)) as any).js ?? "")}`);
  const e6 = textOf(byId("gaussian-mixtures-6")), m6 = textOf(m7), em = textOf(byId("gaussian-mixtures-8")), rs = textOf(byId("gaussian-mixtures-5"));
  console.log(`CONSISTENCY: responsibilities soft/sum-to-1 ${/soft membership/i.test(rs) && /add up to 1/i.test(rs)}; E-step fixes components ${/fixed/i.test(e6) && /responsibilities/i.test(e6)}; M-step fixes responsibilities ${/responsibilities stay fixed|responsibilities are fixed/i.test(m6)}; EM alternates ${/E-step/.test(em) && /M-step/.test(em)}`);
  const prereqOk = Object.entries(PREREQ).every(([id, p]) => JSON.stringify(byId(id)?.prerequisites) === JSON.stringify(p));
  console.log(`GMM_PREREQUISITES_PRESERVED: ${prereqOk}`);
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
  console.error("[finalize-m11] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
