/**
 * FINAL COURSE release (Model Summit -> Building Reliable ML Systems), in three guarded phases.
 * Each phase stops on the first failure.
 *
 *   --phase=validate        read-only: CMS draft validation + full-course (7 zones / 13 modules / 115 checkpoints)
 *                           and Module 13 structure/content checks, Modules 1-12 identical to the published version
 *   --phase=publish         re-runs validate, then publishes the current draft ONCE
 *   --phase=repin --version=<published id> --email=<learner> [--previous=<version>]
 *                           verifies the published snapshot (frozen animation revisions, isolation against the
 *                           previous version, capstone numeric consistency), repins ONE learner via
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
const ZONE = "model-summit";
const MODULE = "reliable-ml-systems";
const MODULE13 = [
  ["reliable-ml-systems-1", "Frame the Problem"],
  ["reliable-ml-systems-2", "Define Features and Targets"],
  ["reliable-ml-systems-3", "Split the Data"],
  ["reliable-ml-systems-4", "Choose a Model"],
  ["reliable-ml-systems-5", "Train the Model"],
  ["reliable-ml-systems-6", "Evaluate Performance"],
  ["reliable-ml-systems-7", "Diagnose Underfitting"],
  ["reliable-ml-systems-8", "Diagnose Overfitting"],
  ["reliable-ml-systems-9", "Tune Hyperparameters"],
  ["reliable-ml-systems-10", "Compare Models"],
  ["reliable-ml-systems-11", "Final ML Workflow"],
] as const;
const PREREQ: Record<string, string[]> = {
  "reliable-ml-systems-1": ["ml-foundations-7"],
  "reliable-ml-systems-2": ["reliable-ml-systems-1"],
  "reliable-ml-systems-3": ["reliable-ml-systems-2", "regression-practice-8"],
  "reliable-ml-systems-4": ["reliable-ml-systems-3", "classification-foundations-6"],
  "reliable-ml-systems-5": ["reliable-ml-systems-4", "optimization-3"],
  "reliable-ml-systems-6": ["reliable-ml-systems-5", "model-evaluation-7"],
  "reliable-ml-systems-7": ["reliable-ml-systems-6", "ml-foundations-5"],
  "reliable-ml-systems-8": ["reliable-ml-systems-7", "regression-practice-6"],
  "reliable-ml-systems-9": ["reliable-ml-systems-8", "regression-practice-8"],
  "reliable-ml-systems-10": ["reliable-ml-systems-9", "model-evaluation-8"],
  "reliable-ml-systems-11": ["reliable-ml-systems-10"],
};
const TRACE_STEPS = [9, 9, 10, 9, 9, 9, 9, 9, 10, 10, 15];

const NEW_FIRST_BLOCK = "Machine learning starts before the algorithm";
const NEW_QUICK_CHECK_6_PREFIX = "Retention staff can contact only a limited number of customers";
const EXPECTED = { zones: 7, modules: 13, checkpoints: 115 };

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}

const canon = (v: unknown) => JSON.stringify(v, (k, x) => (k === "_id" || k === "__v" ? undefined : x));
const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
const allModules = (zones: any[]): any[] => zones.flatMap((z) => z.modules.map((m: any) => ({ ...m, __zone: z.id })));
function module13Of(zones: any[]): any[] {
  const zone = zones.find((z) => z.id === ZONE);
  return zone?.modules.find((m: any) => m.id === MODULE)?.checkpoints ?? [];
}
const module1Count = (zones: any[]) => zones.flatMap((z) => z.modules).find((m: any) => m.id === "ml-foundations")?.checkpoints.length ?? 0;
const textOf = (c: any) => JSON.stringify([c.workspace.theory, c.workspace.learnMore, c.workspace.codeExamples, c.workspace.quickCheck]);

/** Every pre-existing module and zone must be identical between two snapshots; only Model Summit / Module 13 may be added. */
function isolationProblems(base: any[], next: any[]): string[] {
  const problems: string[] = [];
  const b = Object.fromEntries(allModules(base).map((m) => [`${m.__zone}/${m.id}`, m]));
  const n = Object.fromEntries(allModules(next).map((m) => [`${m.__zone}/${m.id}`, m]));
  for (const key of Object.keys(b)) if (canon(b[key]) !== canon(n[key])) problems.push(`module ${key} changed`);
  for (const key of Object.keys(n)) if (!(key in b) && key !== `${ZONE}/${MODULE}`) problems.push(`unexpected new module ${key}`);
  const baseIds = new Set(base.map((z) => z.id));
  for (const z of next) if (!baseIds.has(z.id) && z.id !== ZONE) problems.push(`unexpected new zone ${z.id}`);
  const zmeta = (zs: any[]) => canon(zs.map((z) => [z.id, z.order, z.title, z.description]));
  if (zmeta(base) !== zmeta(next.filter((z) => baseIds.has(z.id)))) problems.push("existing zone metadata changed");
  return problems;
}

/** `frozen`: animations must point at frozen rN revisions; otherwise at the package draft. */
async function checkModule13(zones: any[], frozen: boolean): Promise<string[]> {
  const problems: string[] = [];
  const cps = module13Of(zones);
  if (cps.length !== 11) problems.push(`Module 13 has ${cps.length} checkpoints, expected 11`);
  for (let i = 0; i < MODULE13.length; i++) {
    const [id, title] = MODULE13[i]!;
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
  if (cps[0] && cps[0].workspace.theory[0]?.heading !== NEW_FIRST_BLOCK) problems.push(`reliable-ml-systems-1 has unexpected content ("${cps[0].workspace.theory[0]?.heading}")`);
  if (cps[5] && !String(cps[5].workspace.quickCheck?.question).startsWith(NEW_QUICK_CHECK_6_PREFIX)) problems.push("reliable-ml-systems-6 has an unexpected Quick Check");
  if (zones.filter((z) => z.id === ZONE).length !== 1) problems.push(`zone ${ZONE} appears ${zones.filter((z) => z.id === ZONE).length} times, expected 1`);
  const zs = zones.find((z) => z.id === ZONE);
  if (JSON.stringify((zs?.modules ?? []).map((m: any) => `${m.id}=${m.checkpoints.length}`)) !== JSON.stringify([`${MODULE}=11`])) problems.push(`zone ${ZONE} must contain exactly ${MODULE} (11)`);
  if (zs && zs.order !== 6) problems.push(`zone ${ZONE} has order ${zs.order}, expected 6`);
  if (zones.length !== EXPECTED.zones || zones[6]?.id !== ZONE || zones[5]?.id !== "unsupervised-valley") problems.push(`course zones are ${zones.map((z) => z.id).join(",")}; expected ${EXPECTED.zones} with ${ZONE} last after unsupervised-valley`);
  const uv = zones.find((z) => z.id === "unsupervised-valley");
  if (JSON.stringify((uv?.modules ?? []).map((m: any) => `${m.id}=${m.checkpoints.length}`)) !== JSON.stringify(["clustering=7", "gaussian-mixtures=9", "dimensionality-reduction=9"])) problems.push("unsupervised-valley must still hold clustering (7), gaussian-mixtures (9), dimensionality-reduction (9)");
  zones.forEach((z, k) => { if (z.order !== k) problems.push(`zone ${z.id} has order ${z.order}, expected ${k}`); z.modules.forEach((m: any, j: number) => { if (m.order !== j) problems.push(`module ${m.id} has order ${m.order}, expected ${j}`); }); });
  const zoneIds = zones.map((z) => z.id), moduleIds = zones.flatMap((z) => z.modules.map((m: any) => m.id));
  if (new Set(zoneIds).size !== zoneIds.length) problems.push("duplicate zone ids");
  if (new Set(moduleIds).size !== moduleIds.length) problems.push("duplicate module ids");
  if (moduleIds.length !== EXPECTED.modules) problems.push(`course has ${moduleIds.length} modules, expected ${EXPECTED.modules}`);
  if (allCheckpoints(zones).length !== EXPECTED.checkpoints) problems.push(`course has ${allCheckpoints(zones).length} checkpoints, expected ${EXPECTED.checkpoints}`);
  if (moduleIds.some((m) => !/^(ml-foundations|linear-algebra|calculus|probability-foundations|estimation-uncertainty|optimization|regression-practice|classification-foundations|model-evaluation|clustering|gaussian-mixtures|dimensionality-reduction|reliable-ml-systems)$/.test(m))) problems.push("an unexpected (future) module is present");
  const ids = allCheckpoints(zones).map((c: any) => c.id);
  if (new Set(ids).size !== ids.length) problems.push("duplicate checkpoint ids");
  for (const c of allCheckpoints(zones)) {
    if (!(c.xp > 0)) problems.push(`${c.id}: invalid xp ${c.xp}`);
    for (const p of c.prerequisites) if (!ids.includes(p)) problems.push(`${c.id}: dangling prerequisite ${p}`);
  }
  return problems;
}

async function capstoneChecks(cps: any[], pkgOf: (c: any) => Promise<any>): Promise<Record<string, boolean>> {
  const byId = (id: string) => cps.find((c: any) => c.id === id);
  const T = (n: number) => textOf(byId(`reliable-ml-systems-${n}`));
  const tr = async (n: number) => JSON.stringify((await pkgOf(byId(`reliable-ml-systems-${n}`))).packageTrace);
  const js = async (n: number) => String((await pkgOf(byId(`reliable-ml-systems-${n}`))).js ?? "");
  const checks: Record<string, boolean> = {
    "split 700/150/150, no overlap": /train \/ validation \/ test: 700 150 150/.test(T(3)) && /overlap between the sets: 0/.test(T(3)),
    "chronological 0 vs random 144": /chronological split: 0/.test(T(3)) && /random split: 144/.test(T(3)),
    "leakage: account_closed_date 6 of 6": /account_closed_date/.test(T(2)) && /right for 6 of 6/.test(T(2)),
    "underfit depth 1: 0.48 / 0.46": /\(1, 0\.48, 0\.46\)/.test(T(7)),
    "overfit depth 8: 0.97 / 0.59, gap 0.38": /\(8, 0\.97, 0\.59\)/.test(T(8)) && /0\.38/.test(T(8)),
    "selected depth 4: 0.76 / 0.676": /\(4, 0\.76, 0\.676\)/.test(T(9)),
    "validation matrices (baseline/logistic/tree)": /\(12, 10, 18, 110\)/.test(T(10)) && /\(21, 12, 9, 108\)/.test(T(10)) && /\(24, 17, 6, 103\)/.test(T(10)),
    "goal recall >= 0.75, precision >= 0.50": /recall >= 0\.75 with precision >= 0\.50/.test(T(1)),
    "only the tree meets the goal": /candidates that meet the goal: \['tree'\]/.test(T(10)),
    "final test (22, 19, 6, 103), F1 0.638 vs 0.676": /\(22, 19, 6, 103\)/.test(T(11)) && /test F1: 0\.638/.test(T(11)) && /validation F1: 0\.676/.test(T(11)),
    "test locked until selection (9, 10)": /test set used for tuning: False/.test(T(9)) && /test set opened so far: False/.test(T(10)),
    "final workflow 15 steps": /15 steps, first: frame problem \| last: monitor after deployment/.test(T(11)),
    "drift 25% vs 15% as a toy example": /usage shift since training: -0\.25/.test(T(11)) && /toy monitoring example/.test(T(11)) && /not a universal threshold/.test(T(11)),
    "animation 8 has gap 0.38 label": /gap 0\.38/.test(await js(8)),
    "trace 8 gap 0.38": /0\.38/.test(await tr(8)),
    "trace 10 tree meets goal": /meet the goal: \['tree'\]/.test(await tr(10)),
    "trace 11 test F1 0.638": /0\.638/.test(await tr(11)),
    "trace 11 shift -0.25": /-0\.25/.test(await tr(11)),
    "trace 3 random 144": /random: 144/.test(await tr(3)),
    "trace 2 closed-date 6 of 6": /right for 6 of 6/.test(await tr(2)),
  };
  return checks;
}

async function phaseValidate() {
  const issues = await cmsService.validateDraft(COURSE);
  console.log(`DRAFT_VALIDATION_ISSUES: ${issues.length}`);
  if (issues.length) fail(`blocking validation issues: ${JSON.stringify(issues)}`);
  const draft = await cmsService.getDraft(COURSE);
  const problems = await checkModule13(draft.zones as any[], false);
  console.log(`DRAFT: revision ${draft.revision}, zones ${draft.zones.length}, modules ${draft.zones.flatMap((z: any) => z.modules).length}, checkpoints ${allCheckpoints(draft.zones as any[]).length}, module1 ${module1Count(draft.zones as any[])}, module13 ${module13Of(draft.zones as any[]).length}`);
  if (module1Count(draft.zones as any[]) !== 7) problems.push(`Module 1 has ${module1Count(draft.zones as any[])} checkpoints, expected 7`);
  const pointer = await CmsCourse.findOne({ courseId: COURSE }).lean();
  const published = await cmsService.getPublishedVersionById(COURSE, String(pointer?.latestPublishedVersion));
  console.log(`PREVIOUS_PUBLISHED_VERSION: ${pointer?.latestPublishedVersion}, checkpoints ${allCheckpoints(published.zones as any[]).length}`);
  problems.push(...isolationProblems(published.zones as any[], draft.zones as any[]).map((p) => `draft vs published: ${p}`));
  if (problems.length) fail("Final-course checks failed:\n  - " + problems.join("\n  - "));
  const draftPkg = async (c: any) => (await CmsAnimationPackage.findOne({ packageId: c.workspace.animation.packageId, revisionId: c.workspace.animation.revisionId }).lean()) as any;
  const dChecks = await capstoneChecks(module13Of(draft.zones as any[]), draftPkg);
  for (const [k, v] of Object.entries(dChecks)) console.log(`CAPSTONE(draft) ${v ? "PASS" : "FAIL"}: ${k}`);
  if (!Object.values(dChecks).every(Boolean)) fail("capstone consistency checks failed on the draft");
  console.log("MODULES_1_TO_12_UNCHANGED_VS_PUBLISHED: true");
  console.log("PHASE validate: PASS");
}

async function phasePublish() {
  const before = (await CmsCourse.findOne({ courseId: COURSE }).lean())?.latestPublishedVersion;
  await phaseValidate(); // never publish unvalidated content
  const actorId = await resolveActorId(arg("admin-email"));
  const result = await cmsService.publishDraft(COURSE, actorId);
  console.log(`PUBLISHED: previous ${before} -> new ${result.version.versionId} (snapshot ${result.snapshotVersion}, ${result.snapshotCheckpointCount} checkpoints)`);
  printApiCacheNotice("finalizeMlModule13 --phase=publish");
}

async function phaseRepin() {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");
  const previous = arg("previous") ?? "v16";

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const base = await cmsService.getPublishedVersionById(COURSE, previous);
  const pubProblems = await checkModule13(published.zones as any[], true);
  console.log(`PUBLISHED ${version}: zones ${published.zones.length}, modules ${published.zones.flatMap((z: any) => z.modules).length}, checkpoints ${allCheckpoints(published.zones as any[]).length}, module1 ${module1Count(published.zones as any[])}, module13 ${module13Of(published.zones as any[]).length}`);
  if (module1Count(published.zones as any[]) !== 7) pubProblems.push("Module 1 does not have 7 checkpoints");
  const iso = isolationProblems(base.zones as any[], published.zones as any[]);
  console.log(`ISOLATION_VS_${previous}: ${iso.length ? "FAIL " + iso.join("; ") : "PASS (only Model Summit / Module 13 added)"}`);
  const prevCps = new Map(allCheckpoints(base.zones as any[]).map((c: any) => [c.id, c]));
  const prevOk = [...prevCps.values()].every((c: any) => allCheckpoints(published.zones as any[]).some((n: any) => n.id === c.id && n.xp === c.xp && canon(n.prerequisites) === canon(c.prerequisites)));
  console.log(`PREVIOUS_CHECKPOINT_IDS_XP_PREREQS_UNCHANGED: ${prevOk}`);
  pubProblems.push(...iso);
  if (!prevOk) pubProblems.push("previous checkpoint ids/xp/prerequisites changed");
  if (pubProblems.length) fail("published snapshot checks failed:\n  - " + pubProblems.join("\n  - "));
  console.log(`MODULE13_ANIMATIONS_FROZEN: ${module13Of(published.zones as any[]).filter((c: any) => /^r\d+$/.test(c.workspace.animation?.revisionId ?? "")).length}/11`);

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
  console.log(`LEARNER_COURSE: zones ${content.zones.length}, modules ${content.zones.flatMap((z: any) => z.modules).length}, checkpoints ${contentIds.length}; curriculum checkpoints ${curriculum.checkpoints.length}`);
  console.log(`LEARNER_ZONES: ${content.zones.map((z: any) => `${z.order}:${z.id}[${z.modules.map((m: any) => `${m.order}:${m.id}=${m.checkpoints.length}`).join(",")}]`).join(" ")}`);
  console.log(`CONTENT_PIN: ${content.versionId}  CURRICULUM_PIN: ${curriculum.version}  PROGRESS_PIN: ${state.curriculumVersion}`);
  console.log(`CONTENT_AND_PROGRESS_USE_SAME_SNAPSHOT: ${sameSnapshot}`);
  console.log(`FUTURE_MODULE_PRESENT: ${content.zones.flatMap((z: any) => z.modules).length > EXPECTED.modules}`);

  const rm = module13Of(content.zones);
  const byId = (id: string) => rm.find((c: any) => c.id === id);
  const pkgOf = async (c: any) => cmsService.getLearnerReferencedPackageRevision(COURSE, userId, c.workspace.animation.packageId, c.workspace.animation.revisionId) as Promise<any>;
  for (const id of ["reliable-ml-systems-2", "reliable-ml-systems-7", "reliable-ml-systems-8", "reliable-ml-systems-11"]) {
    const c = byId(id);
    const a = c.workspace.animation;
    const pkg = await pkgOf(c);
    console.log(`PAYLOAD ${id} "${c.title}": blocks ${c.workspace.theory.length}, first "${c.workspace.theory[0].heading}", quick check "${c.workspace.quickCheck.question.slice(0, 60)}...", animation ${a.kind} ${a.packageId.slice(0, 8)}@${a.revisionId} (fetch OK), trace steps ${pkg.packageTrace.steps.length}, bridge ${a.bridgeMode}, trace source ${c.workspace.traceSource.kind}`);
  }
  console.log(`MODULE13_PACKAGE_TRACES: ${rm.filter((c: any) => c.workspace.traceSource?.kind === "package").length}/11`);

  const checks = await capstoneChecks(rm, pkgOf);
  for (const [k, v] of Object.entries(checks)) console.log(`CAPSTONE ${v ? "PASS" : "FAIL"}: ${k}`);
  console.log(`CAPSTONE_ALL: ${Object.values(checks).every(Boolean) ? "PASS" : "FAIL"}`);
  const prereqOk = Object.entries(PREREQ).every(([id, p]) => JSON.stringify(byId(id)?.prerequisites) === JSON.stringify(p));
  console.log(`MODULE13_PREREQUISITES_PRESERVED: ${prereqOk}`);
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
  console.error("[finalize-m13] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
