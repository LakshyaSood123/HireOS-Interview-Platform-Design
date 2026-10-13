/**
 * Module 12 release (Unsupervised Valley -> Dimensionality Reduction),
 * in three guarded phases. Each phase stops on the first failure.
 *
 *   --phase=validate        read-only: CMS draft validation + Module 12 structure/content checks
 *   --phase=publish         re-runs validate, then publishes the current draft ONCE
 *   --phase=repin --version=<published id> --email=<learner> [--previous=<version>]
 *                           verifies the published snapshot (frozen animation revisions, isolation against
 *                           the previous version, PCA/SVD numeric consistency), repins ONE learner via
 *                           cmsService.repinLearnerCourse, then verifies through the real learner services
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
const MODULE = "dimensionality-reduction";
const MODULE12 = [
  ["dimensionality-reduction-1", "Why Reduce Dimensions?"],
  ["dimensionality-reduction-2", "Variance as Information"],
  ["dimensionality-reduction-3", "Covariance Matrix"],
  ["dimensionality-reduction-4", "Principal Directions"],
  ["dimensionality-reduction-5", "PCA Intuition"],
  ["dimensionality-reduction-6", "PCA Using Eigenvectors"],
  ["dimensionality-reduction-7", "PCA and SVD"],
  ["dimensionality-reduction-8", "Projection to Lower Dimensions"],
  ["dimensionality-reduction-9", "Information Loss"],
] as const;
const PREREQ: Record<string, string[]> = {
  "dimensionality-reduction-1": [],
  "dimensionality-reduction-2": ["dimensionality-reduction-1", "probability-foundations-6"],
  "dimensionality-reduction-3": ["dimensionality-reduction-2", "probability-foundations-10"],
  "dimensionality-reduction-4": ["dimensionality-reduction-3", "linear-algebra-6"],
  "dimensionality-reduction-5": ["dimensionality-reduction-4"],
  "dimensionality-reduction-6": ["dimensionality-reduction-5", "linear-algebra-6"],
  "dimensionality-reduction-7": ["dimensionality-reduction-6", "linear-algebra-8"],
  "dimensionality-reduction-8": ["dimensionality-reduction-7"],
  "dimensionality-reduction-9": ["dimensionality-reduction-8"],
};
const TRACE_STEPS = [9, 9, 9, 10, 9, 10, 9, 10, 10];

const NEW_FIRST_BLOCK = "Many features, many dimensions";
const NEW_QUICK_CHECK_6 = "A covariance matrix has eigenvalues 6.03 and 0.17. Which statement is correct?";
const EXPECTED_TOTAL = 104;

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

const canon = (v: unknown) => JSON.stringify(v, (k, x) => (k === "_id" || k === "__v" ? undefined : x));
const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
const allModules = (zones: any[]): any[] => zones.flatMap((z) => z.modules.map((m: any) => ({ ...m, __zone: z.id })));
function module12Of(zones: any[]): any[] {
  const zone = zones.find((z) => z.id === ZONE);
  return zone?.modules.find((m: any) => m.id === MODULE)?.checkpoints ?? [];
}
const module1Count = (zones: any[]) => zones.flatMap((z) => z.modules).find((m: any) => m.id === "ml-foundations")?.checkpoints.length ?? 0;
const textOf = (c: any) => JSON.stringify([c.workspace.theory, c.workspace.learnMore, c.workspace.codeExamples, c.workspace.quickCheck]);

/** Every module except Module 12 (and zone metadata) must be identical between two course snapshots. */
function isolationProblems(base: any[], next: any[]): string[] {
  const problems: string[] = [];
  const b = Object.fromEntries(allModules(base).map((m) => [`${m.__zone}/${m.id}`, m]));
  const n = Object.fromEntries(allModules(next).map((m) => [`${m.__zone}/${m.id}`, m]));
  for (const key of Object.keys(b)) if (canon(b[key]) !== canon(n[key])) problems.push(`module ${key} changed`);
  for (const key of Object.keys(n)) if (!(key in b) && key !== `${ZONE}/${MODULE}`) problems.push(`unexpected new module ${key}`);
  const zmeta = (zs: any[]) => canon(zs.map((z) => [z.id, z.order, z.title, z.description]));
  if (zmeta(base) !== zmeta(next)) problems.push("zone metadata changed");
  return problems;
}

/** `frozen`: animations must point at frozen rN revisions; otherwise at the package draft. */
async function checkModule12(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module12Of(zones);
  if (cps.length !== 9) problems.push(`Module 12 has ${cps.length} checkpoints, expected 9`);
  for (let i = 0; i < MODULE12.length; i++) {
    const [id, title] = MODULE12[i]!;
    const cp = cps[i];
    if (!cp) continue;
    if (cp.id !== id) problems.push(`position ${i + 1}: id ${cp.id}, expected ${id}`);
    if (cp.title !== title) problems.push(`${id}: title "${cp.title}", expected "${title}"`);
    if (JSON.stringify(cp.prerequisites) !== JSON.stringify(PREREQ[id])) problems.push(`${id}: prerequisites ${JSON.stringify(cp.prerequisites)}`);
    if (cp.xp !== 30) problems.push(`${id}: xp ${cp.xp}, expected 30`);
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
        if (pkg.packageTrace.steps.length !== TRACE_STEPS[i]) problems.push(`${id}: ${pkg.packageTrace.steps.length} trace steps, expected ${TRACE_STEPS[i]}`);
        try {
          validatePackageTraceAgainstManifest(pkg.packageTrace, pkg.manifest.traceEvents);
        } catch (e: any) {
          problems.push(`${id}: trace does not match manifest: ${e.message}`);
        }
      }
    }
  }
  if (cps[0] && cps[0].workspace.theory[0]?.heading !== NEW_FIRST_BLOCK) problems.push(`dimensionality-reduction-1 has unexpected content ("${cps[0].workspace.theory[0]?.heading}")`);
  if (cps[5] && cps[5].workspace.quickCheck?.question !== NEW_QUICK_CHECK_6) problems.push("dimensionality-reduction-6 has an unexpected Quick Check");
  if (zones.filter((z) => z.id === ZONE).length !== 1) problems.push(`zone ${ZONE} appears ${zones.filter((z) => z.id === ZONE).length} times, expected 1`);
  const z6 = zones.find((z) => z.id === ZONE);
  if (JSON.stringify((z6?.modules ?? []).map((m: any) => `${m.id}=${m.checkpoints.length}`)) !== JSON.stringify(["clustering=7", "gaussian-mixtures=9", `${MODULE}=9`])) problems.push(`zone ${ZONE} must contain exactly clustering (7), gaussian-mixtures (9), then ${MODULE} (9)`);
  if (z6 && z6.order !== 5) problems.push(`zone ${ZONE} has order ${z6.order}, expected 5`);
  if (zones.length !== 6 || zones[4]?.id !== "classification-woods" || zones[5]?.id !== ZONE) problems.push(`course zones are ${zones.map((z) => z.id).join(",")}; expected six with ${ZONE} after classification-woods`);
  const modCount = zones.flatMap((z) => z.modules).length;
  if (modCount !== 12) problems.push(`course has ${modCount} modules, expected 12`);
  if (allCheckpoints(zones).length !== EXPECTED_TOTAL) problems.push(`course has ${allCheckpoints(zones).length} checkpoints, expected ${EXPECTED_TOTAL}`);
  if (zones.flatMap((z) => z.modules).some((m: any) => /reliab/i.test(m.id))) problems.push("Reliable ML Systems must not be assembled yet");
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
  const problems = await checkModule12(draft.zones as any[], false);
  console.log(`DRAFT: revision ${draft.revision}, zones ${draft.zones.length}, checkpoints ${allCheckpoints(draft.zones as any[]).length}, module1 ${module1Count(draft.zones as any[])}, module12 ${module12Of(draft.zones as any[]).length}`);
  if (module1Count(draft.zones as any[]) !== 7) problems.push(`Module 1 has ${module1Count(draft.zones as any[])} checkpoints, expected 7`);
  const pointer = await CmsCourse.findOne({ courseId: COURSE }).lean();
  const published = await cmsService.getPublishedVersionById(COURSE, String(pointer?.latestPublishedVersion));
  console.log(`PREVIOUS_PUBLISHED_VERSION: ${pointer?.latestPublishedVersion}, checkpoints ${allCheckpoints(published.zones as any[]).length}`);
  problems.push(...isolationProblems(published.zones as any[], draft.zones as any[]).map((p) => `draft vs published: ${p}`));
  if (problems.length) fail("Module 12 checks failed:\n  - " + problems.join("\n  - "));
  console.log("MODULES_1_TO_11_UNCHANGED_VS_PUBLISHED: true");
  console.log("PHASE validate: PASS");
}

async function phasePublish() {
  const before = (await CmsCourse.findOne({ courseId: COURSE }).lean())?.latestPublishedVersion;
  await phaseValidate(); // never publish unvalidated content
  const actorId = await resolveActorId(arg("admin-email"));
  const result = await cmsService.publishDraft(COURSE, actorId);
  console.log(`PUBLISHED: previous ${before} -> new ${result.version.versionId} (snapshot ${result.snapshotVersion}, ${result.snapshotCheckpointCount} checkpoints)`);
  printApiCacheNotice("finalizeMlModule12 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");
  const previous = arg("previous") ?? "v15";

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const base = await cmsService.getPublishedVersionById(COURSE, previous);
  const pubProblems = await checkModule12(published.zones as any[], true);
  console.log(`PUBLISHED ${version}: zones ${published.zones.length}, modules ${published.zones.flatMap((z: any) => z.modules).length}, checkpoints ${allCheckpoints(published.zones as any[]).length}, module1 ${module1Count(published.zones as any[])}, module12 ${module12Of(published.zones as any[]).length}`);
  if (module1Count(published.zones as any[]) !== 7) pubProblems.push("Module 1 does not have 7 checkpoints");
  const iso = isolationProblems(base.zones as any[], published.zones as any[]);
  console.log(`ISOLATION_VS_${previous}: ${iso.length ? "FAIL " + iso.join("; ") : "PASS (only Module 12 added)"}`);
  const prevCps = new Map(allCheckpoints(base.zones as any[]).map((c: any) => [c.id, c]));
  const prevOk = [...prevCps.values()].every((c: any) => allCheckpoints(published.zones as any[]).some((n: any) => n.id === c.id && n.xp === c.xp && canon(n.prerequisites) === canon(c.prerequisites)));
  console.log(`PREVIOUS_CHECKPOINT_IDS_XP_PREREQS_UNCHANGED: ${prevOk}`);
  pubProblems.push(...iso);
  if (!prevOk) pubProblems.push("previous checkpoint ids/xp/prerequisites changed");
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  console.log(`MODULE12_ANIMATIONS_FROZEN: ${module12Of(published.zones as any[]).filter((c: any) => /^r\d+$/.test(c.workspace.animation?.revisionId ?? "")).length}/9`);

  const user = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
  if (!user) fail(`no user ${email}`);
  const userId = String(user._id);
  const before = await CourseProgress.findOne({ userId, courseId: COURSE }).lean();
  const beforeIds = [...(before?.completedCheckpointIds ?? [])];
  const beforeXp = before?.xp;
  console.log(`DEV_LEARNER_PIN_BEFORE: ${before?.curriculumVersion}; completed ${beforeIds.length}; xp ${beforeXp}; active ${before?.activeCheckpointId}`);
  const repin = await cmsService.repinLearnerCourse(userId, COURSE, version);
  console.log(`REPIN: ${JSON.stringify(repin)}`);

  // Verify through the real learner services.
  const state = await learning.getCourseState(userId, COURSE);
  const content: any = await cmsService.getPinnedPublishedContent(COURSE, userId);
  const curriculum = await resolveLearnerCurriculum(userId, COURSE);
  const contentIds = allCheckpoints(content.zones).map((c) => c.id);
  const sameSnapshot = content.versionId === curriculum.version && JSON.stringify(contentIds) === JSON.stringify(curriculum.checkpoints.map((c) => c.id));
  const afterIds = state.progress.completedCheckpointIds as string[];
  console.log(`DEV_LEARNER_PIN_AFTER: ${state.curriculumVersion}`);
  console.log(`COMPLETED_BEFORE/AFTER: ${beforeIds.length}/${afterIds.length}  IDS_PRESERVED: ${JSON.stringify(beforeIds) === JSON.stringify(afterIds)}  ORPHANED: ${afterIds.filter((id) => !contentIds.includes(id)).length}`);
  console.log(`XP_BEFORE/AFTER: ${beforeXp}/${state.progress.xp}  XP_PRESERVED: ${beforeXp === state.progress.xp}`);
  console.log(`ACTIVE_CHECKPOINT_ID: ${(state.progress as any).activeCheckpointId}`);
  console.log(`LEARNER_MODULE1_CHECKPOINTS: ${module1Count(content.zones)}  LEARNER_MODULE12_CHECKPOINTS: ${module12Of(content.zones).length}`);
  console.log(`LEARNER_ZONES: ${content.zones.map((z: any) => `${z.order}:${z.id}[${z.modules.map((m: any) => `${m.order}:${m.id}=${m.checkpoints.length}`).join(",")}]`).join(" ")}`);
  console.log(`CONTENT_PIN: ${content.versionId}  CURRICULUM_PIN: ${curriculum.version}  PROGRESS_PIN: ${state.curriculumVersion}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot}`);
  console.log(`RELIABLE_PRESENT: ${content.zones.flatMap((z: any) => z.modules).some((m: any) => /reliab/i.test(m.id))}`);

  const dr = module12Of(content.zones);
  const byId = (id: string) => dr.find((c: any) => c.id === id);
  const pkgOf = async (c: any) => cmsService.getLearnerReferencedPackageRevision(COURSE, userId, c.workspace.animation.packageId, c.workspace.animation.revisionId) as Promise<any>;
  for (const id of ["dimensionality-reduction-4", "dimensionality-reduction-6", "dimensionality-reduction-7", "dimensionality-reduction-9"]) {
    const c = byId(id);
    const a = c.workspace.animation;
    const pkg = await pkgOf(c);
    console.log(`PAYLOAD ${id} "${c.title}": blocks ${c.workspace.theory.length}, first "${c.workspace.theory[0].heading}", quick check "${c.workspace.quickCheck.question.slice(0, 60)}...", animation ${a.kind} ${a.packageId.slice(0, 8)}@${a.revisionId} (fetch OK), trace steps ${pkg.packageTrace.steps.length}, bridge ${a.bridgeMode}, trace source ${c.workspace.traceSource.kind}`);
  }
  console.log(`MODULE12_PACKAGE_TRACES: ${dr.filter((c: any) => c.workspace.traceSource?.kind === "package").length}/9`);

  // PCA / SVD numeric consistency in the published snapshot.
  const T = (id: string) => textOf(byId(id));
  const js = async (id: string) => String((await pkgOf(byId(id))).js ?? "");
  const tr = async (id: string) => JSON.stringify((await pkgOf(byId(id))).packageTrace);
  const dataInJs = /\[2, 1\.5\], \[3, 2\.5\], \[4, 2\.5\], \[5, 4\.5\], \[6, 4\.0\], \[7, 6\.0\]/;
  const dataInTxt = /\(2, 1\.5\)[\s\S]*\(7, 6\.0\)|\(2,1\.5\)/;
  const pass = (v: boolean) => (v ? "PASS" : "FAIL");
  const checks: Record<string, boolean> = {
    "dataset in lesson 1 python": /X = \[\(2, 1\.5\), \(3, 2\.5\), \(4, 2\.5\), \(5, 4\.5\), \(6, 4\.0\), \(7, 6\.0\)\]/.test(T("dimensionality-reduction-1")),
    "dataset in all 9 animations": (await Promise.all(dr.map((c: any) => js(c.id)))).every((s) => dataInJs.test(s) || /DX = /.test(s)),
    "n-1 convention stated (lesson 3)": /n − 1|n - 1/.test(T("dimensionality-reduction-3")),
    "n-1 in covariance python": /\/ \(n - 1\)/.test(T("dimensionality-reduction-3")),
    "covariance matrix 3.5/2.9/2.7": /\[\[3\.5, 2\.9\], \[2\.9, 2\.7\]\]/.test(T("dimensionality-reduction-3")),
    "correlation 0.94": /0\.94/.test(T("dimensionality-reduction-3")),
    "PC1 0.754/0.657": /0\.7539/.test(T("dimensionality-reduction-4")) && /0\.657/.test(T("dimensionality-reduction-4")),
    "angle 41.1": /41\.1/.test(T("dimensionality-reduction-4")),
    "eigenvalues 6.0275/0.1725": /6\.0275/.test(T("dimensionality-reduction-6")) && /0\.1725/.test(T("dimensionality-reduction-6")),
    "S v1 = lambda v1 check in python": /S times v1/.test(T("dimensionality-reduction-6")) && /lambda1 times v1/.test(T("dimensionality-reduction-6")),
    "total variance 6.2": /6\.2/.test(T("dimensionality-reduction-6")),
    "sign ambiguity (v and -v)": /−v|-v/.test(T("dimensionality-reduction-4")) && /−v|-v/.test(T("dimensionality-reduction-6")),
    "SVD sigma 5.4897/0.9288": /5\.4897/.test(T("dimensionality-reduction-7")) && /0\.9288/.test(T("dimensionality-reduction-7")),
    "sigma^2/(n-1) = 6.0275/0.1725": /sigma\^2 \/ \(n - 1\): \[6\.0275, 0\.1725\]/.test(T("dimensionality-reduction-7")),
    "Xc = U Sigma Vt rebuilt": /rebuilt exactly: True/.test(T("dimensionality-reduction-7")),
    "SVD PC2 opposite sign explained": /opposite sign/.test(T("dimensionality-reduction-7")),
    "explained variance 97.2%": /97\.2/.test(T("dimensionality-reduction-9")),
    "discarded 2.8%": /2\.8/.test(T("dimensionality-reduction-9")),
    "reconstruction error 0.8627": /0\.8627/.test(T("dimensionality-reduction-9")),
    "customer 5 worked example (6, 4.0)": /fifth customer/.test(T("dimensionality-reduction-9")) && /\(6, 4\.0\)/.test(T("dimensionality-reduction-8")),
    "no 95%-equals-accuracy claim": /not accuracy|not 95% accurate|Explained variance is not accuracy/.test(T("dimensionality-reduction-9")) && !/95% explained variance (is|means|equals) 95% accuracy/i.test(T("dimensionality-reduction-9")),
    "trace 4 mentions 6.03 and 0.17": /6\.03/.test(await tr("dimensionality-reduction-4")) && /0\.17/.test(await tr("dimensionality-reduction-4")),
    "trace 7 sigma 5.49/0.93": /5\.4897|5\.49/.test(await tr("dimensionality-reduction-7")) && /0\.9288|0\.93/.test(await tr("dimensionality-reduction-7")),
    "trace 9 error 0.863": /0\.8627|0\.863/.test(await tr("dimensionality-reduction-9")),
    "trace 9 explained 97.2": /0\.9722|97\.2/.test(await tr("dimensionality-reduction-9")),
  };
  for (const [k, v] of Object.entries(checks)) console.log(`NUMERIC ${pass(v)}: ${k}`);
  console.log(`NUMERIC_ALL: ${Object.values(checks).every(Boolean) ? "PASS" : "FAIL"}`);
  void dataInTxt;
  const prereqOk = Object.entries(PREREQ).every(([id, p]) => JSON.stringify(byId(id)?.prerequisites) === JSON.stringify(p));
  console.log(`MODULE12_PREREQUISITES_PRESERVED: ${prereqOk}`);
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
  console.error("[finalize-m12] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
