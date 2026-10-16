// Manual course authoring parity: a course created through the CMS uses the SAME canonical model, draft lifecycle, validation,
// publish path and learner resolution as every other course. Runs the real services against a THROWAWAY database (never
// reagvis_dev) and proves existing courses are untouched.

import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { resolveLearnerCurriculum } from "../src/modules/curriculum/curriculum.service.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { moduleOf, zoneOf, type CheckpointSpec } from "../seed/ml/curriculum/builder.js";

const TEST_DB = `reagvis_test_course_creation_${Date.now()}`;
const ACTOR = new mongoose.Types.ObjectId().toString();
const LEARNER = new mongoose.Types.ObjectId().toString();
const details = { title: "CMS Manual Authoring QA", subtitle: "A test", shortDescription: "Built by hand in the CMS.", description: "", category: "Testing", difficulty: "Beginner" as const, duration: "10m", instructor: "QA", tags: ["qa"], accentColor: "#1DB584" };

const adminToken = signAccessToken(ACTOR, "admin").token;
const learnerToken = signAccessToken(LEARNER, "learner").token;

const snapshotOf = async (courseId: string) => JSON.stringify(await Promise.all([CmsCourse.findOne({ courseId }).lean(), CmsCourseVersion.find({ courseId }).sort({ versionId: 1 }).lean(), CurriculumSnapshot.find({ courseId }).lean()]));

beforeAll(async () => {
  await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
  await Promise.all([CmsCourse, CmsCourseVersion, CurriculumSnapshot, CourseProgress].map((m) => m.createIndexes()));
  // an "existing" course that must never change (stands in for DSA / Machine Learning)
  await CmsCourse.create({ courseId: "existing-course", title: "Existing", courseType: "standard", latestDraftVersion: "draft", latestPublishedVersion: null });
  await CmsCourseVersion.create({ courseId: "existing-course", versionId: "draft", status: "draft", createdFromVersion: null, createdBy: ACTOR, updatedBy: ACTOR, revision: 1, title: "Existing", courseType: "standard", zones: [] });
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("create course (canonical model)", () => {
  let courseId = "";
  let before = "";

  it("creates a canonical draft whose first zone is a real Basecamp zone; nothing is published", async () => {
    before = await snapshotOf("existing-course");
    const created = await cmsService.createCourse(ACTOR, details);
    courseId = created.course.courseId;
    expect(courseId).toBe("cms-manual-authoring-qa");
    expect(created.course).toMatchObject({ courseType: "standard", creationSource: "manual", latestPublishedVersion: null, latestDraftVersion: "draft" });
    expect(created.course.details).toMatchObject({ shortDescription: "Built by hand in the CMS.", category: "Testing" });
    const draft: any = await cmsService.getDraft(courseId); // the normal loader works: same draft lifecycle as any course
    expect(draft.status).toBe("draft");
    expect(draft.zones).toHaveLength(1);
    expect(draft.zones[0]).toMatchObject({ id: "basecamp", title: "Basecamp", order: 0, state: "active", modules: [] });
  });

  it("allocates unique ids for repeated titles and leaves other courses untouched", async () => {
    const again = await cmsService.createCourse(ACTOR, details);
    expect(again.course.courseId).toBe("cms-manual-authoring-qa-2");
    expect(await snapshotOf("existing-course")).toBe(before);
  });

  it("an empty new course reports normal validation problems and cannot be published", async () => {
    const issues = await cmsService.validateDraft(courseId);
    expect(Array.isArray(issues)).toBe(true);
    await expect(cmsService.publishDraft(courseId, ACTOR)).rejects.toThrow();
    expect((await CmsCourse.findOne({ courseId }).lean())!.latestPublishedVersion).toBeNull();
  });

  it("is not in the learner catalog until it is published", async () => {
    expect((await cmsService.listPublishedCatalog()).some((c) => c.courseId === courseId)).toBe(false);
  });

  it("zones / modules / checkpoints authored through the normal draft save publish through the normal path", async () => {
    const draft: any = await cmsService.getDraft(courseId);
    const specs: CheckpointSpec[] = [1, 2].map((i) => ({
      id: `qa-cp-${i}`, title: `QA checkpoint ${i}`, subtitle: "test", prerequisites: i === 1 ? [] : ["qa-cp-1"],
      theory: [{ heading: "Idea", body: "Body text." }],
      quickCheck: { question: "Q?", options: ["a", "b", "c", "d"], correctIndex: 1, explanation: "Because." },
    }));
    const zones = [
      { ...draft.zones[0], modules: [moduleOf("basecamp", 0, { id: "qa-module", title: "QA module", description: "m", icon: "T", accentColor: "#38BDF8" }, specs)] },
      zoneOf(1, { id: "meadows", title: "Meadows", description: "Second zone." }, []),
    ] as never;
    await cmsService.saveDraft(courseId, ACTOR, { zones, expectedRevision: draft.revision });
    // an empty zone is an expected incomplete-state problem for the author, reported by the normal validator
    expect((await cmsService.validateDraft(courseId)).some((i: any) => i.entityId === "meadows")).toBe(true);
    await cmsService.saveDraft(courseId, ACTOR, { zones: (zones as any[]).slice(0, 1) as never, expectedRevision: draft.revision + 1 });
    expect(await cmsService.validateDraft(courseId)).toEqual([]);
    const published = await cmsService.publishDraft(courseId, ACTOR);
    expect(published.version.versionId).toBe("v1");
    expect(published.snapshotCheckpointCount).toBe(2);
    expect((await CmsCourse.findOne({ courseId }).lean())!.latestPublishedVersion).toBe("v1");
  });

  it("the published version is immutable and a later draft edit does not change it", async () => {
    const frozenBefore = JSON.stringify(await CmsCourseVersion.findOne({ courseId, versionId: "v1" }).lean());
    const draft: any = await cmsService.getDraft(courseId); // draft after publish branches from the published version
    expect(draft.createdFromVersion ?? "v1").toBe("v1");
    await cmsService.saveDraft(courseId, ACTOR, { zones: [{ ...draft.zones[0], title: "Basecamp renamed" }] as never, expectedRevision: draft.revision });
    expect(JSON.stringify(await CmsCourseVersion.findOne({ courseId, versionId: "v1" }).lean())).toBe(frozenBefore);
  });

  it("a learner resolves the published course through the normal resolver, with the same structure", async () => {
    await learning.getCourseState(LEARNER, courseId); // normal enrolment pins the active version
    const curriculum = await resolveLearnerCurriculum(LEARNER, courseId);
    expect(curriculum.version).toBe("v1");
    expect(curriculum.checkpoints.map((c: { id: string }) => c.id)).toEqual(["qa-cp-1", "qa-cp-2"]);
    const content: any = await cmsService.getPinnedPublishedContent(courseId, LEARNER);
    expect(content.zones[0]).toMatchObject({ id: "basecamp", title: "Basecamp" });
  });

  it("the published course appears in the learner catalog with its card details; unrelated courses stay untouched", async () => {
    const entry = (await cmsService.listPublishedCatalog()).find((c) => c.courseId === courseId);
    expect(entry).toMatchObject({ title: "CMS Manual Authoring QA", publishedVersion: "v1", lessonCount: 2 });
    expect(entry!.details.shortDescription).toBe("Built by hand in the CMS.");
    expect(await snapshotOf("existing-course")).toBe(before);
  });

  it("course details can be edited for a CMS-created course, but not for a course that pre-dates CMS creation", async () => {
    const updated = await cmsService.updateCourseDetails(courseId, { shortDescription: "Edited.", category: "QA" });
    expect(updated.details).toMatchObject({ shortDescription: "Edited.", category: "QA" });
    await expect(cmsService.updateCourseDetails("existing-course", { category: "x" })).rejects.toThrow(/no editable course details/);
    expect(await snapshotOf("existing-course")).toBe(before);
  });
});

describe("authorization", () => {
  const app = createApp();
  it("admin can create; learner gets 403; anonymous gets 401 (create, read, details, catalog)", async () => {
    const ok = await request(app).post("/api/v1/cms/courses").set("Authorization", `Bearer ${adminToken}`).send({ ...details, title: "HTTP created course" });
    expect(ok.status).toBe(201);
    expect(ok.body.data.draft.zones[0].title).toBe("Basecamp");
    const id = ok.body.data.course.courseId;
    const learner = { Authorization: `Bearer ${learnerToken}` };
    for (const [method, path, body] of [["post", "/api/v1/cms/courses", details], ["get", `/api/v1/cms/courses/${id}`], ["patch", `/api/v1/cms/courses/${id}/details`, { category: "x" }], ["get", "/api/v1/cms/courses"]] as const) {
      expect((await (request(app) as any)[method](path).set(learner).send(body)).status, `${method} ${path}`).toBe(403);
      expect((await (request(app) as any)[method](path).send(body)).status, `anon ${method} ${path}`).toBe(401);
    }
    // the catalog is readable by any signed-in learner, not by anonymous callers
    expect((await request(app).get("/api/v1/courses").set(learner)).status).toBe(200);
    expect((await request(app).get("/api/v1/courses")).status).toBe(401);
  });
  it("rejects invalid course details", async () => {
    const bad = await request(app).post("/api/v1/cms/courses").set("Authorization", `Bearer ${adminToken}`).send({ title: "", shortDescription: "x" });
    expect(bad.status).toBe(400);
  });
});

describe("draft authoring tolerates unfinished text (found by the final acceptance run)", () => {
  const app = createApp();
  const auth = { Authorization: `Bearer ${adminToken}` };

  it("saves a draft whose Coding Activity, tests, Quick Check, concept block and trace step are still empty, and reports them at validation", async () => {
    const created = await request(app).post("/api/v1/cms/courses").set(auth).send({ ...details, title: "Unfinished authoring course" });
    const id = created.body.data.course.courseId;
    const draft = created.body.data.draft;
    const cp = (moduleOf("basecamp", 0, { id: "m", title: "M", description: "", icon: "T", accentColor: "#38BDF8" }, [{ id: "c1", title: "C1", subtitle: "", prerequisites: [], theory: [{ heading: "", body: "" }], quickCheck: { question: "", options: ["", ""], correctIndex: 0, explanation: "" } } as CheckpointSpec]) as any);
    cp.checkpoints[0].workspace.codingActivity = { prompt: "", functionName: "", requiredKeywords: [], starterCode: {}, languages: ["python"], visibleTests: [{ id: "t1", description: "", input: "", expected: "" }], hiddenTests: [], hint: "", mistakeFeedback: "", executionMode: "disabled" };
    cp.checkpoints[0].workspace.traceSource = { kind: "cms", steps: [{ stepId: "s1", label: "", pseudocode: "" }] };
    const zones = [{ ...draft.zones[0], modules: [cp] }];
    const saved = await request(app).patch(`/api/v1/cms/courses/${id}/draft`).set(auth).send({ zones, expectedRevision: draft.revision });
    expect(saved.status, JSON.stringify(saved.body).slice(0, 300)).toBe(200);
    const issues = (await request(app).get(`/api/v1/cms/courses/${id}/draft/validate`).set(auth)).body.data.issues as { message: string }[];
    const text = issues.map((i) => i.message).join(" | ");
    expect(text).toMatch(/Problem prompt is required/);
    expect(text).toMatch(/Function name is required/);
    expect(text).toMatch(/Quick Check question is required/);
    expect(text).toMatch(/missing required pseudocode/);
    expect(text).toMatch(/needs both a heading and body/);
    expect((await request(app).post(`/api/v1/cms/courses/${id}/draft/publish`).set(auth)).status).toBeGreaterThanOrEqual(400);
  });
});
