/**
 * Animation-polish release (same curriculum, polished animation packages), in three guarded phases.
 * Each phase stops on the first failure. No raw database writes. No version number is assumed.
 *
 *   --phase=validate [--expect-pointer=<version>]
 *        read-only: CMS draft validation, course shape (7 / 13 / 115), and the draft compared with the published
 *        version: the ONLY allowed difference is each checkpoint's workspace.animation.revisionId. Every animation
 *        package must resolve, carry a valid Package Trace, the explanation panel and the latest pacing rule.
 *   --phase=publish [--expect-pointer=<version>] --admin-email=<admin>
 *        re-runs validate, then publishes the current draft ONCE through cmsService.publishDraft
 *   --phase=repin --version=<published id> --previous=<version> --email=<learner>
 *        verifies the published snapshot (frozen revisions, structure identical to <previous> apart from revision ids,
 *        polish present in the frozen packages), repins ONE learner via cmsService.repinLearnerCourse, then verifies
 *        progress preservation and resolution through the real learner services
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
const EXPECTED = { zones: 7, modules: 13, checkpoints: 115 };
const TIMING_RULE = "Math.round(3800 + words * 165)";
const SAMPLE_IDS = [
  "ml-foundations-1", // What is Machine Learning? (Generalization)
  "linear-algebra-4", // vector projection
  "probability-foundations-3", // Bayes rule
  "optimization-3", // gradient descent
  "model-evaluation-6", // threshold trade-offs
  "gaussian-mixtures-5", // responsibilities
  "gaussian-mixtures-6", // E-step
  "dimensionality-reduction-5", // PCA intuition
  "reliable-ml-systems-11", // final ML workflow
];

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}
const allCheckpoints = (zones: any[]): any[] => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
const canon = (v: unknown) => JSON.stringify(v, (k, x) => (k === "_id" || k === "__v" ? undefined : x));
/** Course content with every animation revision reference removed: must be identical between two snapshots. */
const withoutRevisions = (zones: any[]) => canon(JSON.parse(JSON.stringify(zones, (k, v) => (k === "revisionId" ? undefined : v))));

function shapeProblems(zones: any[]): string[] {
  const problems: string[] = [];
  const modules = zones.flatMap((z) => z.modules);
  const cps = allCheckpoints(zones);
  if (zones.length !== EXPECTED.zones) problems.push(`${zones.length} zones, expected ${EXPECTED.zones}`);
  if (modules.length !== EXPECTED.modules) problems.push(`${modules.length} modules, expected ${EXPECTED.modules}`);
  if (cps.length !== EXPECTED.checkpoints) problems.push(`${cps.length} checkpoints, expected ${EXPECTED.checkpoints}`);
  const zoneIds = zones.map((z) => z.id), moduleIds = modules.map((m: any) => m.id), ids = cps.map((c) => c.id);
  if (new Set(zoneIds).size !== zoneIds.length) problems.push("duplicate zone ids");
  if (new Set(moduleIds).size !== moduleIds.length) problems.push("duplicate module ids");
  if (new Set(ids).size !== ids.length) problems.push("duplicate checkpoint ids");
  if (moduleIds.some((m: string) => !/^(ml-foundations|linear-algebra|calculus|probability-foundations|estimation-uncertainty|optimization|regression-practice|classification-foundations|model-evaluation|clustering|gaussian-mixtures|dimensionality-reduction|reliable-ml-systems)$/.test(m))) problems.push("an unexpected (future) module is present");
  for (const c of cps) for (const p of c.prerequisites) if (!ids.includes(p)) problems.push(`${c.id}: dangling prerequisite ${p}`);
  return problems;
}

/** Every checkpoint's animation package: resolves, trace valid, explanation panel, latest pacing, measured height. */
async function packageProblems(zones: any[], frozen: boolean, fetchPkg?: (c: any) => Promise<any>): Promise<{ problems: string[]; withPanel: number; withTrace: number; withTiming: number; heights: number[] }> {
  const problems: string[] = [];
  let withPanel = 0, withTrace = 0, withTiming = 0;
  const heights: number[] = [];
  for (const c of allCheckpoints(zones)) {
    const a = c.workspace?.animation;
    if (!a || a.kind !== "custom") { problems.push(`${c.id}: no custom animation`); continue; }
    if (a.bridgeMode !== "synchronized") problems.push(`${c.id}: bridgeMode ${a.bridgeMode}`);
    if (c.workspace.traceSource?.kind !== "package") problems.push(`${c.id}: traceSource ${c.workspace.traceSource?.kind}`);
    if (frozen ? !/^r\d+$/.test(a.revisionId) : a.revisionId !== "draft") problems.push(`${c.id}: revision "${a.revisionId}"`);
    const pkg: any = fetchPkg ? await fetchPkg(c) : await CmsAnimationPackage.findOne({ packageId: a.packageId, revisionId: a.revisionId }).lean();
    if (!pkg) { problems.push(`${c.id}: package ${a.packageId}@${a.revisionId} not found`); continue; }
    if (frozen && pkg.status && pkg.status !== "frozen") problems.push(`${c.id}: package is ${pkg.status}`);
    const steps = pkg.packageTrace?.steps ?? [];
    if (!steps.length) problems.push(`${c.id}: no Package Trace`);
    else {
      withTrace++;
      try { validatePackageTraceAgainstManifest(pkg.packageTrace, pkg.manifest.traceEvents); } catch (e: any) { problems.push(`${c.id}: trace/manifest mismatch: ${e.message}`); }
    }
    const html = String(pkg.html ?? ""), js = String(pkg.js ?? "");
    if (html.includes('id="explain-h"') && html.includes('class="explain"')) withPanel++; else problems.push(`${c.id}: no explanation panel`);
    if (js.includes(TIMING_RULE) && js.includes("Math.min(10500")) withTiming++; else problems.push(`${c.id}: latest pacing rule missing`);
    if (!js.includes("pagehide") || !js.includes("stepChanged")) problems.push(`${c.id}: pagehide/bridge sync missing`);
    const h = pkg.manifest?.heightPx;
    if (!(h >= 360 && h <= 700)) problems.push(`${c.id}: heightPx ${h}`);
    heights.push(h);
  }
  return { problems, withPanel, withTrace, withTiming, heights };
}

function explainOf(js: string, stepId: string): { h: string; t: string } | null {
  const s = js.indexOf("var EXPLAIN = ");
  if (s < 0) return null;
  const start = s + "var EXPLAIN = ".length;
  try { return JSON.parse(js.slice(start, js.indexOf("};", start) + 1))[stepId] ?? null; } catch { return null; }
}

async function phaseValidate(): Promise<void> {
  const pointer = await CmsCourse.findOne({ courseId: COURSE }).lean();
  const expect = arg("expect-pointer");
  if (expect && pointer?.latestPublishedVersion !== expect) fail(`published pointer is ${pointer?.latestPublishedVersion}, expected ${expect}`);
  const issues = await cmsService.validateDraft(COURSE);
  console.log(`DRAFT_VALIDATION_ISSUES: ${issues.length}`);
  if (issues.length) fail(`blocking validation issues: ${JSON.stringify(issues)}`);
  const draft = await cmsService.getDraft(COURSE);
  const published = await cmsService.getPublishedVersionById(COURSE, String(pointer?.latestPublishedVersion));
  const problems = shapeProblems(draft.zones as any[]);
  console.log(`PUBLISHED_POINTER: ${pointer?.latestPublishedVersion}; DRAFT revision ${draft.revision}: zones ${draft.zones.length}, modules ${draft.zones.flatMap((z: any) => z.modules).length}, checkpoints ${allCheckpoints(draft.zones as any[]).length}`);
  const same = withoutRevisions(published.zones as any[]) === withoutRevisions(draft.zones as any[]);
  console.log(`DRAFT_VS_PUBLISHED_IDENTICAL_APART_FROM_ANIMATION_REVISIONS: ${same}`);
  if (!same) problems.push("draft differs from the published version in more than animation revision references");
  const pk = await packageProblems(draft.zones as any[], false);
  console.log(`DRAFT_PACKAGES: panel ${pk.withPanel}/115, trace ${pk.withTrace}/115, pacing ${pk.withTiming}/115, heightPx ${Math.min(...pk.heights)}-${Math.max(...pk.heights)}`);
  problems.push(...pk.problems);
  if (problems.length) fail("validation failed:\n  - " + problems.join("\n  - "));
  console.log("PHASE validate: PASS");
}

async function phasePublish(): Promise<void> {
  const before = (await CmsCourse.findOne({ courseId: COURSE }).lean())?.latestPublishedVersion;
  await phaseValidate(); // never publish unvalidated content
  const actorId = await resolveActorId(arg("admin-email"));
  const result = await cmsService.publishDraft(COURSE, actorId);
  console.log(`PUBLISHED: previous ${before} -> new ${result.version.versionId} (snapshot ${result.snapshotVersion}, ${result.snapshotCheckpointCount} checkpoints)`);
  printApiCacheNotice("finalizeMlAnimationPolish --phase=publish");
}

async function phaseRepin(): Promise<void> {
  const version = arg("version") ?? fail("--version=<published version id> is required");
  const previous = arg("previous") ?? fail("--previous=<version> is required");
  const email = arg("email") ?? fail("--email=<learner email> is required");

  const published = await cmsService.getPublishedVersionById(COURSE, version);
  const base = await cmsService.getPublishedVersionById(COURSE, previous);
  const pubZones = published.zones as any[];
  const problems = shapeProblems(pubZones);
  const same = withoutRevisions(base.zones as any[]) === withoutRevisions(pubZones);
  console.log(`PUBLISHED ${version}: zones ${pubZones.length}, modules ${pubZones.flatMap((z) => z.modules).length}, checkpoints ${allCheckpoints(pubZones).length}`);
  console.log(`${version}_VS_${previous}_IDENTICAL_APART_FROM_ANIMATION_REVISIONS: ${same}`);
  if (!same) problems.push(`${version} differs from ${previous} in more than animation revision references`);
  const pk = await packageProblems(pubZones, true);
  console.log(`PUBLISHED_PACKAGES: frozen+resolved ${allCheckpoints(pubZones).length - pk.problems.filter((p) => /not found|revision/.test(p)).length}/115, panel ${pk.withPanel}/115, trace ${pk.withTrace}/115, pacing ${pk.withTiming}/115, heightPx ${Math.min(...pk.heights)}-${Math.max(...pk.heights)}`);
  problems.push(...pk.problems);
  if (problems.length) fail("published snapshot checks failed:\n  - " + problems.join("\n  - "));

  const user = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
  if (!user) fail(`no user ${email}`);
  const userId = String(user._id);
  const before = await CourseProgress.findOne({ userId, courseId: COURSE }).lean();
  const beforeIds = [...(before?.completedCheckpointIds ?? [])];
  const beforeXp = before?.xp;
  console.log(`DEV_LEARNER_PIN_BEFORE: ${before?.curriculumVersion}; completed ${beforeIds.length}; xp ${beforeXp}; active ${(before as any)?.activeCheckpointId}`);
  const repin = await cmsService.repinLearnerCourse(userId, COURSE, version);
  console.log(`REPIN: ${JSON.stringify(repin)}`);

  const state = await learning.getCourseState(userId, COURSE);
  const content: any = await cmsService.getPinnedPublishedContent(COURSE, userId);
  const curriculum = await resolveLearnerCurriculum(userId, COURSE);
  const contentIds = allCheckpoints(content.zones).map((c) => c.id);
  const afterIds = state.progress.completedCheckpointIds as string[];
  const sameSnapshot = content.versionId === curriculum.version && JSON.stringify(contentIds) === JSON.stringify(curriculum.checkpoints.map((c) => c.id));
  console.log(`DEV_LEARNER_PIN_AFTER: ${state.curriculumVersion}`);
  console.log(`COMPLETED_BEFORE/AFTER: ${beforeIds.length}/${afterIds.length}  IDS_PRESERVED: ${JSON.stringify(beforeIds) === JSON.stringify(afterIds)}  ORPHANED: ${afterIds.filter((id) => !contentIds.includes(id)).length}`);
  console.log(`XP_BEFORE/AFTER: ${beforeXp}/${state.progress.xp}  XP_PRESERVED: ${beforeXp === state.progress.xp}`);
  console.log(`ACTIVE_CHECKPOINT_ID: ${(state.progress as any).activeCheckpointId}`);
  console.log(`LEARNER_COURSE: zones ${content.zones.length}, modules ${content.zones.flatMap((z: any) => z.modules).length}, checkpoints ${contentIds.length}; curriculum checkpoints ${curriculum.checkpoints.length}`);
  console.log(`COURSE_HOME_PIN(progress): ${state.curriculumVersion}  ROADMAP_PIN(curriculum): ${curriculum.version}  LEARNER_CONTENT_PIN: ${content.versionId}  SAME_SNAPSHOT: ${sameSnapshot}`);
  console.log(`MODEL_SUMMIT_PRESENT: ${content.zones.some((z: any) => z.id === "model-summit")}  RELIABLE_ML_SYSTEMS_PRESENT: ${content.zones.flatMap((z: any) => z.modules).some((m: any) => m.id === "reliable-ml-systems")}`);

  // Learner-resolved samples: polish is what the learner services actually serve.
  const fetchPkg = (c: any) => cmsService.getLearnerReferencedPackageRevision(COURSE, userId, c.workspace.animation.packageId, c.workspace.animation.revisionId) as Promise<any>;
  const lp = await packageProblems(content.zones, true, fetchPkg);
  console.log(`LEARNER_RESOLVED_PACKAGES: panel ${lp.withPanel}/115, trace ${lp.withTrace}/115, pacing ${lp.withTiming}/115, problems ${lp.problems.length}`);
  for (const id of SAMPLE_IDS) {
    const c = allCheckpoints(content.zones).find((x) => x.id === id);
    if (!c) { console.log(`SAMPLE ${id}: MISSING`); continue; }
    const pkg = await fetchPkg(c);
    const stepIds: string[] = pkg.manifest.traceEvents;
    const last = explainOf(String(pkg.js), stepIds[stepIds.length - 1]!);
    console.log(`SAMPLE ${id} "${c.title}": ${c.workspace.animation.packageId.slice(0, 8)}@${c.workspace.animation.revisionId}, steps ${stepIds.length}, heightPx ${pkg.manifest.heightPx}, panel ${String(pkg.html).includes('id="explain-h"')}, pacing ${String(pkg.js).includes(TIMING_RULE)}, trace ${pkg.packageTrace.steps.length}, final takeaway "${last?.h}"`);
  }
  const gen = allCheckpoints(content.zones).find((x) => x.id === "ml-foundations-1");
  const gpkg = await fetchPkg(gen);
  const gx = explainOf(String(gpkg.js), "generalize");
  const genOk = !!gx && /new email it never saw during training/.test(gx.t) && /transfers to unseen data/.test(gx.t) && /merely memorizing/.test(gx.t);
  console.log(`GENERALIZATION_SAMPLE: ${genOk ? "PASS" : "FAIL"} :: ${gx?.h} :: ${gx?.t}`);
  const all = [...lp.problems, ...(genOk ? [] : ["generalization explanation wrong"])];
  if (all.length || !sameSnapshot || JSON.stringify(beforeIds) !== JSON.stringify(afterIds) || beforeXp !== state.progress.xp) fail("post-repin verification failed:\n  - " + all.join("\n  - "));
  console.log("PHASE repin: PASS");
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
  console.error("[finalize-polish] STOPPED:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
