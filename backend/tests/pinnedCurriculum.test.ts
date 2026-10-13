// Regression: every learner-facing operation must use the SAME curriculum, the
// version the learner is pinned to. Found when a learner pinned to a 3-checkpoint
// version had progress logic running against the latest 7-checkpoint snapshot,
// so "current" pointed at a checkpoint their content did not contain.
//
// Runs the real services against a THROWAWAY database on the local MongoDB
// (never reagvis_dev). Needs a running local mongod, like the dev servers do.

import mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { env } from "../src/config/env.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import { RewardEvent } from "../src/modules/learning/rewardEvent.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { getNextCheckpointId } from "../src/modules/learning/progress.engine.js";
import { requireCurriculum, resolveLearnerCurriculum } from "../src/modules/curriculum/curriculum.service.js";
import { moduleOf, zoneOf, type CheckpointSpec } from "../seed/ml/curriculum/builder.js";

const TEST_DB = `reagvis_test_pinning_${Date.now()}`;
const COURSE = "pin-test-course";
const ACTOR = new mongoose.Types.ObjectId().toString();
const learnerA = new mongoose.Types.ObjectId().toString();
const learnerB = new mongoose.Types.ObjectId().toString();
const learnerC = new mongoose.Types.ObjectId().toString();

function zonesWith(count: number) {
  const specs: CheckpointSpec[] = Array.from({ length: count }, (_, i) => ({
    id: `pin-cp-${i + 1}`,
    title: `Pin checkpoint ${i + 1}`,
    subtitle: "test",
    prerequisites: i === 0 ? [] : [`pin-cp-${i}`],
    theory: [{ heading: "Idea", body: "Body text." }],
    quickCheck: { question: "Q?", options: ["a", "b", "c", "d"], correctIndex: 1, explanation: "Because." },
  }));
  return [
    zoneOf(0, { id: "pin-zone", title: "Pin zone", description: "Test zone." }, [
      moduleOf("pin-zone", 0, { id: "pin-module", title: "Pin module", description: "Test module.", icon: "T", accentColor: "#38BDF8" }, specs),
    ]),
  ] as never;
}

async function publish(checkpointCount: number): Promise<string> {
  const draft = await cmsService.getDraft(COURSE);
  await cmsService.saveDraft(COURSE, ACTOR, { zones: zonesWith(checkpointCount), expectedRevision: draft.revision });
  const result = await cmsService.publishDraft(COURSE, ACTOR);
  return result.version.versionId;
}

const ids = (curriculum: { checkpoints: { id: string }[] }) => curriculum.checkpoints.map(c => c.id);
const contentIds = (content: { zones: { modules: { checkpoints: { id: string }[] }[] }[] }) =>
  content.zones.flatMap(z => z.modules.flatMap(m => m.checkpoints.map(c => c.id)));

beforeAll(async () => {
  await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
  await Promise.all([CmsCourse, CmsCourseVersion, CurriculumSnapshot, CourseProgress, RewardEvent].map(m => m.createIndexes()));

  await CmsCourse.create({ courseId: COURSE, title: "Pin test", courseType: "standard", latestDraftVersion: "draft", latestPublishedVersion: null });
  await CmsCourseVersion.create({
    courseId: COURSE, versionId: "draft", status: "draft", createdFromVersion: null,
    createdBy: ACTOR, updatedBy: ACTOR, revision: 1, title: "Pin test", courseType: "standard", zones: [],
  });

  // v1 has checkpoints 1..3. Learner A enrolls while v1 is the active version.
  expect(await publish(3)).toBe("v1");
  await learning.getCourseState(learnerA, COURSE);

  // v3-like later version with checkpoints 1..7. Learner B enrolls after it.
  expect(await publish(7)).toBe("v2");
  await learning.getCourseState(learnerB, COURSE);
});

afterAll(async () => {
  await mongoose.connection.db?.dropDatabase();
  await mongoose.disconnect();
});

describe("learner pinned to v1 while v2 is the latest published version", () => {
  it("is pinned to v1 and the latest published version is v2", async () => {
    const progress = await CourseProgress.findOne({ userId: learnerA, courseId: COURSE }).lean();
    expect(progress?.curriculumVersion).toBe("v1");
    expect((await cmsService.getPublishedContent(COURSE)).versionId).toBe("v2");
  });

  it("learner content, and the curriculum used for progress, are both exactly checkpoints 1..3", async () => {
    const content = await cmsService.getPinnedPublishedContent(COURSE, learnerA);
    expect(contentIds(content as never)).toEqual(["pin-cp-1", "pin-cp-2", "pin-cp-3"]);
    const curriculum = await resolveLearnerCurriculum(learnerA, COURSE);
    expect(curriculum.version).toBe("v1");
    expect(ids(curriculum)).toEqual(["pin-cp-1", "pin-cp-2", "pin-cp-3"]);
  });

  it("rejects a checkpoint that only exists in the newer version", async () => {
    await expect(learning.completeCheckpoint(learnerA, COURSE, "pin-cp-4")).rejects.toThrow(/Unknown checkpoint/);
  });

  it("completing 1..3 awards XP against v1 and never points at checkpoint 4", async () => {
    for (const id of ["pin-cp-1", "pin-cp-2", "pin-cp-3"]) await learning.completeCheckpoint(learnerA, COURSE, id);
    const state = await learning.getCourseState(learnerA, COURSE);
    expect(state.curriculumVersion).toBe("v1");
    expect(state.progress.completedCheckpointIds).toEqual(["pin-cp-1", "pin-cp-2", "pin-cp-3"]);
    expect(state.progress.xp).toBe(90);
    expect(state.progress.activeCheckpointId).not.toBe("pin-cp-4");
    const curriculum = await resolveLearnerCurriculum(learnerA, COURSE);
    expect(getNextCheckpointId(curriculum, "pin-cp-3")).toBeNull();
  });

  it("completion is idempotent: repeating it does not add XP", async () => {
    await learning.completeCheckpoint(learnerA, COURSE, "pin-cp-3");
    expect((await learning.getCourseState(learnerA, COURSE)).progress.xp).toBe(90);
  });
});

describe("new learners and repinning", () => {
  it("a learner who enrolled after v2 is pinned to v2 and sees checkpoints 1..7", async () => {
    const progress = await CourseProgress.findOne({ userId: learnerB, courseId: COURSE }).lean();
    expect(progress?.curriculumVersion).toBe("v2");
    expect(contentIds((await cmsService.getPinnedPublishedContent(COURSE, learnerB)) as never)).toHaveLength(7);
  });

  it("refuses a draft, a nonexistent version, and an un-enrolled learner", async () => {
    await expect(cmsService.repinLearnerCourse(learnerA, COURSE, "draft")).rejects.toThrow(/not found/i);
    await expect(cmsService.repinLearnerCourse(learnerA, COURSE, "v99")).rejects.toThrow(/not found/i);
    await expect(cmsService.repinLearnerCourse(new mongoose.Types.ObjectId().toString(), COURSE, "v2")).rejects.toThrow(/not enrolled/i);
  });

  it("a dry run changes nothing", async () => {
    const result = await cmsService.repinLearnerCourse(learnerA, COURSE, "v2", { dryRun: true });
    expect(result).toEqual({ changed: true, from: "v1", to: "v2" });
    expect((await CourseProgress.findOne({ userId: learnerA, courseId: COURSE }).lean())?.curriculumVersion).toBe("v1");
  });

  it("repins one learner to v2: content, progress and next checkpoint all follow, XP stays valid", async () => {
    expect(await cmsService.repinLearnerCourse(learnerA, COURSE, "v2")).toEqual({ changed: true, from: "v1", to: "v2" });

    expect(contentIds((await cmsService.getPinnedPublishedContent(COURSE, learnerA)) as never)).toHaveLength(7);
    const curriculum = await resolveLearnerCurriculum(learnerA, COURSE);
    expect(curriculum.version).toBe("v2");
    expect(getNextCheckpointId(curriculum, "pin-cp-3")).toBe("pin-cp-4");

    const state = await learning.getCourseState(learnerA, COURSE);
    expect(state.curriculumVersion).toBe("v2");
    expect(state.progress.completedCheckpointIds).toEqual(["pin-cp-1", "pin-cp-2", "pin-cp-3"]);
    expect(state.progress.xp).toBe(90);

    const done = await learning.completeCheckpoint(learnerA, COURSE, "pin-cp-4");
    expect(done.rewards.xpAwarded).toBe(30);
    expect(done.progress.xp).toBe(120);
  });

  it("repinning is idempotent and does not touch other learners", async () => {
    expect(await cmsService.repinLearnerCourse(learnerA, COURSE, "v2")).toEqual({ changed: false, from: "v2", to: "v2" });
    expect((await CourseProgress.findOne({ userId: learnerB, courseId: COURSE }).lean())?.curriculumVersion).toBe("v2");
  });
});

describe("a publish made by another process cannot cause a stale pin", () => {
  it("enrollment pins the database's active snapshot, not a cached one", async () => {
    await requireCurriculum(COURSE); // warm the in-process active-snapshot cache with v2

    // Simulate ANOTHER process changing the active snapshot (this process's cache is not told).
    await CurriculumSnapshot.updateMany({ courseId: COURSE, isActive: true }, { $set: { isActive: false } });
    await CurriculumSnapshot.updateOne({ courseId: COURSE, version: "v1" }, { $set: { isActive: true } });

    await learning.getCourseState(learnerC, COURSE);
    const progress = await CourseProgress.findOne({ userId: learnerC, courseId: COURSE }).lean();
    expect(progress?.curriculumVersion).toBe("v1");
  });
});
