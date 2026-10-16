// Password-protected permanent deletion of a manually created CMS course. Real services + HTTP against a THROWAWAY database
// (never reagvis_dev). Proves: authorization, protection of system courses, current-admin password binding, exact-title
// confirmation, learner/dependency blockers, safe package cleanup, audit content, and that other courses are untouched.

import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createApp } from "../src/app.js";
import { env } from "../src/config/env.js";
import { register } from "../src/modules/auth/auth.service.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import { User } from "../src/modules/auth/user.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CmsAuditLog } from "../src/modules/cms/cmsAuditLog.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as learning from "../src/modules/learning/learning.service.js";
import { moduleOf, zoneOf, type CheckpointSpec } from "../seed/ml/curriculum/builder.js";

const TEST_DB = `reagvis_test_course_deletion_${Date.now()}`;
const PW_A = "Admin-A-password-1!";
const PW_B = "Admin-B-password-2!";
const TITLE = "Permanent Delete QA";
const app = createApp();
let adminA = "", adminB = "", learner = "";
let tokenA = "", tokenB = "", tokenLearner = "";
const auth = (t: string) => ({ Authorization: `Bearer ${t}` });
const details = (title: string) => ({ title, subtitle: "", shortDescription: "QA", description: "", category: "QA", difficulty: "Beginner" as const, duration: "", instructor: "", tags: [], accentColor: "#1DB584" });

const pkgDoc = (packageId: string, revisionId: string, status: "draft" | "frozen") => ({
  packageId, revisionId, status, revision: 1, createdBy: adminA, updatedBy: adminA, title: "t", sourceKind: "zip", html: "<html></html>", assets: [],
  manifest: { bridgeVersion: 1, heightPx: 400, capabilities: ["play"], traceEvents: ["a"] },
  packageTrace: { version: 1, steps: [{ id: "s1", label: "A", animationEvent: "a", code: { pseudocode: "x" } }] },
  narration: { schemaVersion: 1, enabled: false, defaults: { voice: "default", language: "en", speed: 1 }, steps: { a: { enabled: false } }, audio: [{ path: "audio/a.mp3", contentType: "audio/mpeg", dataBase64: "AAAA" }] },
});

function zonesFor(prefix: string, opts: { packageId?: string; prerequisiteOf?: string } = {}) {
  const specs = (n: number, start: number): CheckpointSpec[] => Array.from({ length: n }, (_, i) => ({
    id: `${prefix}-cp-${start + i}`, title: `${prefix} checkpoint ${start + i}`, subtitle: "t", prerequisites: opts.prerequisiteOf && start + i === 1 ? [opts.prerequisiteOf] : [],
    theory: [{ heading: "Idea", body: "Body." }], quickCheck: { question: "Q?", options: ["a", "b"], correctIndex: 0, explanation: "Because." },
  }));
  const cps = specs(2, 1);
  const withAnim = cps;
  return [
    zoneOf(0, { id: "basecamp", title: "Basecamp", description: "." }, [moduleOf("basecamp", 0, { id: `${prefix}-m1`, title: "M1", description: ".", icon: "T", accentColor: "#38BDF8" }, withAnim as CheckpointSpec[])]),
    zoneOf(1, { id: `${prefix}-z2`, title: "Zone 2", description: "." }, [moduleOf(`${prefix}-z2`, 0, { id: `${prefix}-m2`, title: "M2", description: ".", icon: "T", accentColor: "#38BDF8" }, specs(1, 3))]),
  ] as never;
}

const animationRef = (packageId: string) => ({ kind: "custom", packageId, revisionId: "draft", bridgeMode: "synchronized" });

async function buildCourse(title: string, prefix: string, opts: { packageId?: string; prerequisiteOf?: string } = {}) {
  const created = await cmsService.createCourse(adminA, details(title));
  const courseId = created.course.courseId;
  const draft: any = await cmsService.getDraft(courseId);
  const zones: any = JSON.parse(JSON.stringify(zonesFor(prefix, opts)));
  if (opts.packageId) zones[0].modules[0].checkpoints[0].workspace.animation = animationRef(opts.packageId);
  await cmsService.saveDraft(courseId, adminA, { zones, expectedRevision: draft.revision });
  return courseId;
}

beforeAll(async () => {
  await mongoose.connect(env.MONGO_URI, { dbName: TEST_DB, autoIndex: false });
  await Promise.all([CmsCourse, CmsCourseVersion, CurriculumSnapshot, CourseProgress, User, CmsAnimationPackage].map((m) => m.createIndexes()));
  adminA = (await register({ email: "admin-a@example.com", password: PW_A, displayName: "Admin A" })).user.id;
  adminB = (await register({ email: "admin-b@example.com", password: PW_B, displayName: "Admin B" })).user.id;
  learner = (await register({ email: "learner@example.com", password: "Learner-pw-3!", displayName: "L" })).user.id;
  await User.updateMany({ _id: { $in: [adminA, adminB] } }, { $set: { role: "admin" } });
  tokenA = signAccessToken(adminA, "admin").token;
  tokenB = signAccessToken(adminB, "admin").token;
  tokenLearner = signAccessToken(learner, "learner").token;
});
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

describe("authorization and protection", () => {
  it("delete-impact and permanent-delete: anonymous 401, learner 403, admin allowed", async () => {
    const id = await buildCourse("Authz course", "az");
    for (const [method, path, body] of [["get", `/api/v1/cms/courses/${id}/delete-impact`], ["post", `/api/v1/cms/courses/${id}/permanent-delete`, { password: PW_A, confirmation: "Authz course" }]] as const) {
      expect((await (request(app) as any)[method](path).send(body)).status, `anon ${path}`).toBe(401);
      expect((await (request(app) as any)[method](path).set(auth(tokenLearner)).send(body)).status, `learner ${path}`).toBe(403);
    }
    const impact = await request(app).get(`/api/v1/cms/courses/${id}/delete-impact`).set(auth(tokenA));
    expect(impact.status).toBe(200);
    expect(impact.body.data).toMatchObject({ courseId: id, courseTitle: "Authz course", zones: 2, modules: 2, checkpoints: 3, versions: 1, learnersPinned: 0, canDelete: true, blockers: [] });
  });

  it("system courses (no manual provenance, or a protected id/flag) are refused by the backend even when called directly", async () => {
    await CmsCourse.create({ courseId: "dsa-foundations", title: "Data Structures", courseType: "structured-dsa", latestPublishedVersion: null });
    await CmsCourse.create({ courseId: "machine-learning-foundations", title: "Machine Learning", courseType: "standard", creationSource: "manual" }); // even a wrongly-marked ML is protected by id
    const flagged = await buildCourse("Flagged", "fl");
    await CmsCourse.updateOne({ courseId: flagged }, { $set: { systemProtected: true } });
    for (const [id, title] of [["dsa-foundations", "Data Structures"], ["machine-learning-foundations", "Machine Learning"], [flagged, "Flagged"]] as const) {
      const before = await CmsCourse.countDocuments();
      const res = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: title });
      expect(res.status, id).toBe(403);
      expect(res.body.error.message).toMatch(/protected/);
      expect(await CmsCourse.countDocuments()).toBe(before);
      expect((await request(app).get(`/api/v1/cms/courses/${id}/delete-impact`).set(auth(tokenA))).body.data.canDelete).toBe(false);
    }
    expect((await cmsService.listCourses()).filter((c) => !c.canPermanentlyDelete).map((c) => c.courseId).sort()).toEqual(["dsa-foundations", "flagged", "machine-learning-foundations"]);
  });

  it("an unknown course is a 404", async () => {
    expect((await request(app).get("/api/v1/cms/courses/nope-nope/delete-impact").set(auth(tokenA))).status).toBe(404);
  });
});

describe("reauthentication and confirmation", () => {
  let id = "";
  beforeAll(async () => {
    id = await buildCourse(TITLE, "pd");
  });
  const attempt = (token: string, body: object) => request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(token)).send(body);

  it("a wrong password is rejected and nothing is deleted or audited", async () => {
    const res = await attempt(tokenA, { password: "wrong-password", confirmation: TITLE });
    expect(res.status).toBe(403);
    expect(res.body.error.message).toBe("Password verification failed.");
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(1);
    expect(await CmsCourseVersion.countDocuments({ courseId: id })).toBeGreaterThan(0);
    expect(await CmsAuditLog.countDocuments({ courseId: id })).toBe(0);
  });

  it("the password must belong to the CURRENT admin: Admin A cannot use Admin B's password (and vice versa)", async () => {
    expect((await attempt(tokenA, { password: PW_B, confirmation: TITLE })).status).toBe(403);
    expect((await attempt(tokenB, { password: PW_A, confirmation: TITLE })).status).toBe(403);
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(1);
  });

  it("a wrong, partial or differently-cased title is rejected with 400 and the course is untouched", async () => {
    for (const confirmation of ["Permanent Delete", "permanent delete qa", "PERMANENT DELETE QA", `${TITLE} `, "x"]) {
      const res = await attempt(tokenA, { password: PW_A, confirmation });
      expect(res.status, confirmation).toBe(400);
      expect(res.body.error.message).toBe("Course title does not match.");
    }
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(1);
    expect(await CmsAuditLog.countDocuments({ courseId: id })).toBe(0);
  });

  it("missing password / confirmation are validation errors", async () => {
    expect((await attempt(tokenA, { confirmation: TITLE })).status).toBe(400);
    expect((await attempt(tokenA, { password: PW_A })).status).toBe(400);
  });
});

describe("blockers", () => {
  it("a pinned learner blocks deletion (nothing deleted, no silent repin); removing the pin unblocks it", async () => {
    const id = await buildCourse("Pinned course", "pn");
    await cmsService.publishDraft(id, adminA);
    await learning.getCourseState(learner, id); // normal enrolment pins v1
    const impact = (await request(app).get(`/api/v1/cms/courses/${id}/delete-impact`).set(auth(tokenA))).body.data;
    expect(impact).toMatchObject({ learnersPinned: 1, progressRecords: 1, canDelete: false });
    expect(impact.blockers[0]).toBe("This course cannot be permanently deleted while 1 learner is pinned to it.");
    const res = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Pinned course" });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(1);
    expect(await CourseProgress.countDocuments({ courseId: id })).toBe(1);
    expect((await CourseProgress.findOne({ courseId: id }).lean())!.curriculumVersion).toBe("v1");
    await CourseProgress.deleteMany({ courseId: id }); // supported cleanup of the temporary test learner's pin
    const ok = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Pinned course" });
    expect(ok.status).toBe(200);
  });

  it("another course that depends on this course's checkpoints blocks deletion and is never rewritten", async () => {
    const owner = await buildCourse("Owner course", "ow");
    const dependent = await buildCourse("Dependent course", "dp", { prerequisiteOf: "ow-cp-1" });
    const before = JSON.stringify(await CmsCourseVersion.findOne({ courseId: dependent }).lean());
    const impact = (await request(app).get(`/api/v1/cms/courses/${owner}/delete-impact`).set(auth(tokenA))).body.data;
    expect(impact.canDelete).toBe(false);
    expect(impact.blockers.join(" ")).toMatch(/referenced by other content.*dependent-course/);
    const res = await request(app).post(`/api/v1/cms/courses/${owner}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Owner course" });
    expect(res.status).toBe(409);
    expect(await CmsCourse.countDocuments({ courseId: owner })).toBe(1);
    expect(JSON.stringify(await CmsCourseVersion.findOne({ courseId: dependent }).lean())).toBe(before);
  });
});

describe("successful deletion", () => {
  it("deletes the course and everything it owns, keeps shared packages and other courses, and audits without secrets", async () => {
    await CmsAnimationPackage.create([pkgDoc("pkg-owned", "draft", "draft"), pkgDoc("pkg-shared", "draft", "draft")]);
    const target = await buildCourse("Delete target", "tg", { packageId: "pkg-owned" });
    // a second course also uses pkg-shared; the target uses it too (second checkpoint of its draft via direct save)
    const sibling = await buildCourse("Sibling course", "sb", { packageId: "pkg-shared" });
    const tdraft: any = await cmsService.getDraft(target);
    const zones = JSON.parse(JSON.stringify(tdraft.zones));
    zones[0].modules[0].checkpoints[1].workspace.animation = animationRef("pkg-shared");
    await cmsService.saveDraft(target, adminA, { zones, expectedRevision: tdraft.revision });
    await cmsService.publishDraft(target, adminA); // freezes pkg-owned@r1 and pkg-shared@r1
    await cmsService.publishDraft(sibling, adminA);
    const siblingBefore = JSON.stringify(await CmsCourseVersion.find({ courseId: sibling }).sort({ versionId: 1 }).lean());
    const sharedBefore = await CmsAnimationPackage.countDocuments({ packageId: "pkg-shared" });

    const impact = (await request(app).get(`/api/v1/cms/courses/${target}/delete-impact`).set(auth(tokenA))).body.data;
    expect(impact).toMatchObject({ zones: 2, modules: 2, checkpoints: 3, packagesDeleted: 1, packagesKept: 1, narrationAssets: 2, canDelete: true });
    expect(impact.versions).toBe(1); // v1 (the draft is recreated lazily after a publish)
    expect(impact.snapshots).toBe(1);

    const res = await request(app).post(`/api/v1/cms/courses/${target}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Delete target" });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ courseId: target, courseTitle: "Delete target" });

    // gone
    expect(await CmsCourse.countDocuments({ courseId: target })).toBe(0);
    expect(await CmsCourseVersion.countDocuments({ courseId: target })).toBe(0);
    expect(await CurriculumSnapshot.countDocuments({ courseId: target })).toBe(0);
    expect(await CmsAnimationPackage.countDocuments({ packageId: "pkg-owned" })).toBe(0);
    expect((await request(app).get(`/api/v1/cms/courses/${target}`).set(auth(tokenA))).status).toBe(404);
    expect((await request(app).get(`/api/v1/cms/courses/${target}/delete-impact`).set(auth(tokenA))).status).toBe(404);
    expect((await cmsService.listPublishedCatalog()).some((c) => c.courseId === target)).toBe(false);
    expect((await cmsService.listCourses()).some((c) => c.courseId === target)).toBe(false);
    expect((await request(app).get("/api/v1/courses").set(auth(tokenLearner))).body.data.some((c: any) => c.courseId === target)).toBe(false);

    // preserved
    expect(await CmsAnimationPackage.countDocuments({ packageId: "pkg-shared" })).toBe(sharedBefore);
    expect(JSON.stringify(await CmsCourseVersion.find({ courseId: sibling }).sort({ versionId: 1 }).lean())).toBe(siblingBefore);
    expect((await cmsService.listPublishedCatalog()).some((c) => c.courseId === sibling)).toBe(true);

    // audit: ids and counts, never a secret
    const audit: any = await CmsAuditLog.findOne({ courseId: target }).lean();
    expect(audit).toMatchObject({ action: "COURSE_PERMANENTLY_DELETED", courseTitle: "Delete target" });
    expect(String(audit.adminId)).toBe(adminA);
    expect(audit.counts).toMatchObject({ zones: 2, modules: 2, checkpoints: 3, versions: 1, snapshots: 1, packages: 1 });
    const serialized = JSON.stringify(audit);
    expect(serialized).not.toContain(PW_A);
    expect(serialized.toLowerCase()).not.toMatch(/password|hash|token/);

    // orphan audit: nothing in the database still points at the deleted course
    for (const [name, count] of [["progress", CourseProgress.countDocuments({ courseId: target })], ["snapshots", CurriculumSnapshot.countDocuments({ courseId: target })], ["versions", CmsCourseVersion.countDocuments({ courseId: target })]] as const) expect(await count, name).toBe(0);
    const stillReferencing = await CmsCourseVersion.find({ "zones.modules.checkpoints.workspace.animation.packageId": "pkg-owned" }).lean();
    expect(stillReferencing).toHaveLength(0);
  });

  it("a failure part-way leaves the course retryable (no half-deleted course the admin cannot finish), and the retry audits once", async () => {
    const id = await buildCourse("Retry target", "rt");
    await cmsService.publishDraft(id, adminA);
    const spy = vi.spyOn(CmsCourse, "deleteOne").mockRejectedValueOnce(new Error("simulated failure"));
    const failed = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Retry target" });
    spy.mockRestore();
    expect(failed.status).toBe(500);
    expect(failed.text).not.toMatch(/simulated failure|stack/i); // no internals leak to the client
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(1); // the pointer is deleted last, so the course is still addressable
    expect(await CmsAuditLog.countDocuments({ courseId: id })).toBe(0);
    const retry = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Retry target" });
    expect(retry.status).toBe(200);
    expect(await CmsCourse.countDocuments({ courseId: id })).toBe(0);
    expect(await CmsAuditLog.countDocuments({ courseId: id })).toBe(1);
  });

  it("the submitted password never appears in the response or the stored audit", async () => {
    const id = await buildCourse("Secret check", "sc");
    const res = await request(app).post(`/api/v1/cms/courses/${id}/permanent-delete`).set(auth(tokenA)).send({ password: PW_A, confirmation: "Secret check" });
    expect(res.status).toBe(200);
    expect(res.text).not.toContain(PW_A);
    expect(JSON.stringify(await CmsAuditLog.find().lean())).not.toContain(PW_A);
  });
});
