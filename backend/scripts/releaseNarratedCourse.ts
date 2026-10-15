/**
 * Publishes the narration-complete course DRAFT exactly once through the normal CMS service, then (separately) repins ONE
 * designated learner. Every phase refuses to run when its preconditions are not exactly as expected.
 *
 *   npx tsx scripts/releaseNarratedCourse.ts --phase=preflight --expect-published=v18
 *   npx tsx scripts/releaseNarratedCourse.ts --phase=publish   --expect-published=v18 --admin-email=<admin>
 *   npx tsx scripts/releaseNarratedCourse.ts --phase=verify    --version=<new> --previous=v18
 *   npx tsx scripts/releaseNarratedCourse.ts --phase=repin     --version=<new> --email=<learner>
 *
 * preflight: published pointer is the expected one, CMS validation is clean, 115 custom animation packages are in the draft and
 *            every step of every package has CURRENT narration. publish: runs preflight again, then publishes ONCE.
 * verify:    the new version has 7/13/115, every referenced package revision is frozen (never "draft") and carries complete
 *            narration, and the previous version is untouched. repin: moves exactly one learner through
 *            cmsService.repinLearnerCourse and proves progress, XP and the active checkpoint were preserved.
 * Never touches any other learner. Never writes to MongoDB directly.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { stepStatus } from "../src/modules/cms/narration/narration.status.js";
import { extractExplanations } from "../src/modules/cms/narration/narration.text.js";
import type { PackageNarration } from "../src/modules/cms/narration/narration.types.js";
import { resolveLearnerCurriculum } from "../src/modules/curriculum/curriculum.service.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { printApiCacheNotice } from "./lib/apiCacheNotice.js";
import { resolveActorId } from "./lib/resolveActorId.js";

const COURSE = "machine-learning-foundations";
const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never {
  throw new Error(message);
}
const checkpointsOf = (zones: any[]) => zones.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints));
const shape = (zones: any[]) => `${zones.length}/${zones.flatMap((z) => z.modules).length}/${checkpointsOf(zones).length}`;

/** Packages referenced by a set of zones, with the revision each checkpoint points at. */
function refsOf(zones: any[]): Map<string, string> {
  const refs = new Map<string, string>();
  for (const c of checkpointsOf(zones)) {
    const a = c.workspace?.animation;
    if (a?.kind === "custom") refs.set(a.packageId, a.revisionId);
  }
  return refs;
}

async function narrationProblems(revisionFor: (packageId: string) => string, packageIds: string[]): Promise<{ steps: number; current: number; problems: string[] }> {
  let steps = 0, current = 0;
  const problems: string[] = [];
  for (const packageId of packageIds) {
    const doc: any = await CmsAnimationPackage.findOne({ packageId, revisionId: revisionFor(packageId) }).lean();
    if (!doc) { problems.push(`${packageId}: package revision missing`); continue; }
    const narration = (doc.narration ?? null) as PackageNarration | null;
    const explanations = extractExplanations(doc.js);
    for (const s of doc.packageTrace?.steps ?? []) {
      steps++;
      const id = s.animationEvent as string;
      const status = stepStatus(narration, id, explanations[id]);
      const rec = narration?.steps[id];
      if (status !== "GENERATED" || !rec?.asset || !narration!.audio.some((a) => a.path === rec.asset)) problems.push(`${packageId}/${id}: ${status}`);
      else current++;
    }
  }
  return { steps, current, problems };
}

async function preflight(expectPublished: string): Promise<void> {
  const course: any = await CmsCourse.findOne({ courseId: COURSE }).lean();
  if (course?.latestPublishedVersion !== expectPublished) fail(`published pointer is "${course?.latestPublishedVersion}", expected "${expectPublished}"`);
  const published: any = await cmsService.getPublishedContent(COURSE);
  if (shape(published.zones) !== "7/13/115") fail(`published ${expectPublished} shape ${shape(published.zones)}, expected 7/13/115`);
  const issues = await cmsService.validateDraft(COURSE);
  if (issues.length) fail(`CMS validation is not clean: ${issues.length} issue(s), first: ${JSON.stringify(issues[0])}`);
  const draft: any = await cmsService.getDraft(COURSE);
  if (shape(draft.zones) !== "7/13/115") fail(`draft shape ${shape(draft.zones)}`);
  const refs = refsOf(draft.zones);
  if (refs.size !== 115) fail(`draft references ${refs.size} custom packages, expected 115`);
  const n = await narrationProblems(() => "draft", [...refs.keys()]);
  if (n.steps !== 980 || n.current !== 980 || n.problems.length) fail(`draft narration ${n.current}/${n.steps} current; ${n.problems.slice(0, 5).join("; ")}`);
  console.log(`PREFLIGHT_OK published=${expectPublished} (7/13/115) draft=7/13/115 packages=${refs.size} narration=${n.current}/${n.steps} CMS-validation=0 issues`);
}

async function main() {
  const phase = arg("phase");
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    if (phase === "preflight") {
      await preflight(arg("expect-published") ?? fail("--expect-published=<version> is required"));
    } else if (phase === "publish") {
      const expect = arg("expect-published") ?? fail("--expect-published=<version> is required");
      await preflight(expect); // never publish anything that is not exactly the validated candidate
      const actorId = await resolveActorId(arg("admin-email"));
      const result = await cmsService.publishDraft(COURSE, actorId); // the ONE publish call
      console.log(`PUBLISHED previous=${expect} new=${result.version.versionId} snapshot=${result.snapshotVersion} checkpoints=${result.snapshotCheckpointCount}`);
      printApiCacheNotice("releaseNarratedCourse --phase=publish");
    } else if (phase === "verify") {
      const version = arg("version") ?? fail("--version=<new published version> is required");
      const previous = arg("previous") ?? fail("--previous=<version> is required");
      const course: any = await CmsCourse.findOne({ courseId: COURSE }).lean();
      const pub: any = await cmsService.getPublishedVersionById(COURSE, version);
      const refs = refsOf(pub.zones);
      const frozen = await CmsAnimationPackage.countDocuments({ $or: [...refs.entries()].map(([packageId, revisionId]) => ({ packageId, revisionId, status: "frozen" })) });
      const n = await narrationProblems((id) => refs.get(id)!, [...refs.keys()]);
      const dup = await CmsAnimationPackage.aggregate([{ $group: { _id: { p: "$packageId", r: "$revisionId" }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]);
      const base: any = await cmsService.getPublishedVersionById(COURSE, previous);
      console.log(`VERIFY pointer=${course.latestPublishedVersion} version=${version} shape=${shape(pub.zones)} frozenPackages=${frozen}/${refs.size} draftRefs=${[...refs.values()].filter((r) => r === "draft").length} narration=${n.current}/${n.steps} problems=${n.problems.length} duplicateRevisionIds=${dup.length} previousReadable=${base.versionId}`);
      if (course.latestPublishedVersion !== version || shape(pub.zones) !== "7/13/115" || frozen !== 115 || n.current !== 980 || n.problems.length || dup.length) fail("verification failed");
    } else if (phase === "repin") {
      const version = arg("version") ?? fail("--version=<new published version> is required");
      const email = arg("email") ?? fail("--email=<learner email> is required");
      const user = await User.findOne({ email: email.toLowerCase() }).select("_id").lean();
      if (!user) fail(`no user ${email}`);
      const userId = String(user._id);
      const before: any = await CourseProgress.findOne({ userId, courseId: COURSE }).lean();
      const snap = (p: any) => ({ pin: p?.curriculumVersion, completed: [...(p?.completedCheckpointIds ?? [])], mastered: [...(p?.masteredCheckpointIds ?? [])], xp: p?.xp, active: p?.activeCheckpointId, streak: p?.streak, lives: p?.lives });
      const b = snap(before);
      console.log(`LEARNER_BEFORE pin=${b.pin} completed=${b.completed.length} mastered=${b.mastered.length} xp=${b.xp} active=${b.active} streak=${b.streak} lives=${b.lives}`);
      const repin = await cmsService.repinLearnerCourse(userId, COURSE, version);
      console.log(`REPIN ${JSON.stringify(repin)}`);
      const after = snap(await CourseProgress.findOne({ userId, courseId: COURSE }).lean());
      const state = await learning.getCourseState(userId, COURSE);
      const content: any = await cmsService.getPinnedPublishedContent(COURSE, userId);
      const curriculum = await resolveLearnerCurriculum(userId, COURSE);
      const same = (x: unknown, y: unknown) => JSON.stringify(x) === JSON.stringify(y);
      console.log(`LEARNER_AFTER pin=${after.pin} completed=${after.completed.length} xp=${after.xp} active=${after.active}`);
      console.log(`PROGRESS_PRESERVED=${same(b.completed, after.completed)} MASTERY_PRESERVED=${same(b.mastered, after.mastered)} XP_PRESERVED=${b.xp === after.xp} ACTIVE_PRESERVED=${b.active === after.active} STREAK_LIVES_PRESERVED=${b.streak === after.streak && b.lives === after.lives}`);
      console.log(`RESOLVES progress=${state.curriculumVersion} roadmap=${curriculum.version} content=${content.versionId}`);
      if (after.pin !== version || curriculum.version !== version || content.versionId !== version || !same(b.completed, after.completed) || b.xp !== after.xp || b.active !== after.active) fail("repin verification failed");
      printApiCacheNotice("releaseNarratedCourse --phase=repin");
    } else fail("--phase=preflight|publish|verify|repin is required");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
