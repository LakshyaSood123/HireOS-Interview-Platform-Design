/**
 * Phase 3B §22 — proves the CMS draft/publish/version-pin/rollback API end
 * to end, over real HTTP (`createApp()` + supertest), against an ephemeral
 * in-memory MongoDB (`mongodb-memory-server`, already a devDependency — no
 * external database required to run this).
 *
 *   npm run verify:cms
 *
 * Uses a small 1-zone/1-module/3-checkpoint fixture course, not the full DSA
 * course — full-DSA fidelity is separately proven by
 * `npm run bootstrap:dsa-cms -- --dry-run` (7/29/107, 0 validation issues).
 * This script's job is the CMS *mechanics*: authorization, concurrency,
 * server-side validation, publish atomicity, version pinning and rollback.
 */

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";

import { createApp } from "../src/app.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import { User } from "../src/modules/auth/user.model.js";
import { signAccessToken } from "../src/modules/auth/tokens.js";
import type { CmsZone } from "../src/modules/cms/cms.types.js";

let failures = 0;
let checks = 0;

function expect(label: string, condition: boolean, detail?: unknown): void {
  checks += 1;
  if (!condition) {
    failures += 1;
    console.error(`  \u001b[31mFAIL\u001b[0m  ${label}${detail !== undefined ? `\n        ${JSON.stringify(detail)}` : ""}`);
  } else {
    console.log(`  \u001b[32mok\u001b[0m    ${label}`);
  }
}

const COURSE_ID = "verify-cms-course";

function fixtureZones(overrides?: Partial<{ checkpoint3Title: string }>): CmsZone[] {
  return [
    {
      id: "zone-1",
      order: 0,
      title: "Zone One",
      description: "",
      state: "active",
      modules: [
        {
          id: "module-1",
          zoneId: "zone-1",
          order: 0,
          title: "Module One",
          description: "",
          icon: "star",
          accentColor: "#000",
          state: "active",
          checkpoints: [
            {
              id: "checkpoint-1",
              moduleId: "module-1",
              order: 0,
              title: "Checkpoint One",
              subtitle: "",
              type: "lesson",
              xp: 10,
              prerequisites: [],
              state: "active",
              workspace: { title: "Checkpoint One", theory: [{ heading: "h", body: "b" }] },
            },
            {
              id: "checkpoint-2",
              moduleId: "module-1",
              order: 1,
              title: "Checkpoint Two",
              subtitle: "",
              type: "checkpoint",
              xp: 10,
              prerequisites: ["checkpoint-1"],
              state: "active",
              workspace: {
                title: "Checkpoint Two",
                theory: [{ heading: "h", body: "b" }],
                quickCheck: { question: "q", options: ["a", "b"], correctIndex: 0, explanation: "e" },
              },
            },
            {
              id: "checkpoint-3",
              moduleId: "module-1",
              order: 2,
              title: overrides?.checkpoint3Title ?? "Checkpoint Three",
              subtitle: "",
              type: "boss",
              xp: 20,
              masteryXp: 10,
              prerequisites: ["checkpoint-2"],
              state: "active",
              workspace: { title: "Checkpoint Three", theory: [{ heading: "h", body: "b" }] },
            },
          ],
        },
      ],
    },
  ];
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri(), { dbName: "verify_cms" });
  await Promise.all([CmsCourse.createIndexes(), CmsCourseVersion.createIndexes(), CurriculumSnapshot.createIndexes(), User.createIndexes()]);

  const app = createApp();

  const admin = await User.create({ email: "admin@verify.test", passwordHash: "x", displayName: "Admin", role: "admin" });
  const learner = await User.create({ email: "learner@verify.test", passwordHash: "x", displayName: "Learner", role: "learner" });
  const adminToken = signAccessToken(admin._id.toString(), "admin").token;
  const learnerToken = signAccessToken(learner._id.toString(), "learner").token;

  const asAdmin = (method: "get" | "patch" | "post", path: string) =>
    (request(app) as any)[method](path).set("Authorization", `Bearer ${adminToken}`);
  const asLearner = (method: "get" | "patch" | "post", path: string) =>
    (request(app) as any)[method](path).set("Authorization", `Bearer ${learnerToken}`);

  // Seed a published v1 directly (bypassing the API — this stands in for the
  // bootstrap script, which is proven separately against the real DSA data).
  await CmsCourseVersion.create({
    courseId: COURSE_ID,
    versionId: "v1",
    status: "published",
    createdFromVersion: null,
    createdBy: admin._id,
    updatedBy: admin._id,
    publishedAt: new Date(),
    revision: 1,
    title: "Verify CMS Course",
    courseType: "structured-dsa",
    zones: fixtureZones(),
  });
  await CmsCourse.create({ courseId: COURSE_ID, title: "Verify CMS Course", courseType: "structured-dsa", latestDraftVersion: null, latestPublishedVersion: "v1" });

  // ── 1. authorization ──────────────────────────────────────────────────────
  console.log("\n  1. authorization\n");

  const noToken = await request(app).get(`/api/v1/cms/courses/${COURSE_ID}/draft`);
  expect("no token -> 401", noToken.status === 401);

  const learnerDenied = await asLearner("get", `/api/v1/cms/courses/${COURSE_ID}/draft`);
  expect("learner token on admin CMS route -> 403", learnerDenied.status === 403);

  const adminAllowed = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`);
  expect("admin token on admin CMS route -> 200", adminAllowed.status === 200);

  const learnerReadsPublished = await asLearner("get", `/api/v1/courses/${COURSE_ID}/published`);
  expect("learner CAN read the learner-facing published endpoint -> 200", learnerReadsPublished.status === 200);

  // ── 2. draft load / save / concurrency ───────────────────────────────────
  console.log("\n  2. draft load, save, optimistic concurrency\n");

  const draft1 = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`);
  expect("GET draft materializes from published v1", draft1.body?.data?.zones?.[0]?.id === "zone-1");
  const revision = draft1.body.data.revision as number;

  const staleSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({
    zones: fixtureZones({ checkpoint3Title: "Edited (stale)" }),
    expectedRevision: revision + 99,
  });
  expect("PATCH with wrong expectedRevision is rejected (400)", staleSave.status === 400);

  const goodSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({
    zones: fixtureZones({ checkpoint3Title: "Edited (v2 candidate)" }),
    expectedRevision: revision,
  });
  expect("PATCH with correct expectedRevision succeeds", goodSave.status === 200);
  expect("revision incremented after save", goodSave.body?.data?.revision === revision + 1);

  const staleReplay = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({
    zones: fixtureZones(),
    expectedRevision: revision, // the now-stale value again
  });
  expect("replaying the OLD expectedRevision after a successful save is rejected", staleReplay.status === 400);

  // ── 3. server-side validation (never trust the frontend) ────────────────
  console.log("\n  3. server-side validation rejections\n");

  const draftNow = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`);
  const currentRevision = draftNow.body.data.revision as number;

  const duplicateIdZones = fixtureZones();
  duplicateIdZones[0]!.modules[0]!.checkpoints[1]!.id = "checkpoint-1"; // duplicate of checkpoint-1
  await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: duplicateIdZones, expectedRevision: currentRevision });
  let validation = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("duplicate checkpoint id is rejected", validation.body.data.issues.some((i: any) => i.message.includes("Duplicate checkpoint id")));

  const brokenPrereqZones = fixtureZones();
  brokenPrereqZones[0]!.modules[0]!.checkpoints[1]!.prerequisites = ["does-not-exist"];
  const rev2 = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: brokenPrereqZones, expectedRevision: rev2 });
  validation = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("prerequisite referencing a nonexistent checkpoint is rejected", validation.body.data.issues.some((i: any) => i.message.includes("does not exist")));

  const unknownAnimationZones = fixtureZones();
  unknownAnimationZones[0]!.modules[0]!.checkpoints[0]!.workspace!.animation = { id: "not-a-real-animation-id" };
  const rev3 = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: unknownAnimationZones, expectedRevision: rev3 });
  validation = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("unknown animation id is rejected", validation.body.data.issues.some((i: any) => i.message.includes("Unknown animation id")));

  const tooFewOptionsZones = fixtureZones();
  tooFewOptionsZones[0]!.modules[0]!.checkpoints[1]!.workspace!.quickCheck = { question: "q", options: ["only-one"], correctIndex: 0, explanation: "e" };
  const revTooFew = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  const tooFewSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: tooFewOptionsZones, expectedRevision: revTooFew });
  expect("a quick check with fewer than 2 options is rejected at the request-shape layer (400)", tooFewSave.status === 400);

  const badQuickCheckZones = fixtureZones();
  badQuickCheckZones[0]!.modules[0]!.checkpoints[1]!.workspace!.quickCheck = { question: "q", options: ["a", "b"], correctIndex: 5, explanation: "e" };
  const rev4 = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  const badQcSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: badQuickCheckZones, expectedRevision: rev4 });
  expect("PATCH with an out-of-range (but shape-valid) correctIndex still saves — server business rules, not Zod shape, catch this", badQcSave.status === 200);
  validation = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("out-of-range quick check correctIndex is rejected by server validation", validation.body.data.issues.some((i: any) => i.field === "workspace.quickCheck.correctIndex"));

  const unapprovedPistonZones = fixtureZones();
  unapprovedPistonZones[0]!.modules[0]!.checkpoints[0]!.workspace!.codingActivity = {
    prompt: "p",
    functionName: "f",
    requiredKeywords: [],
    starterCode: {},
    languages: ["python"],
    visibleTests: [],
    hiddenTests: [],
    hint: "",
    mistakeFeedback: "",
    executionMode: "piston",
    harnessKey: "not-an-approved-key",
  };
  const rev5 = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  const pistonSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: unapprovedPistonZones, expectedRevision: rev5 });
  expect("a piston coding activity with an unapproved harnessKey still SAVES to the draft (shape-valid)", pistonSave.status === 200, pistonSave.body);
  validation = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("piston executionMode with an unapproved harnessKey is rejected", validation.body.data.issues.some((i: any) => i.message.includes("not an approved Piston harness")));

  const publishWithIssues = await asAdmin("post", `/api/v1/cms/courses/${COURSE_ID}/draft/publish`);
  expect("publish is refused while the draft has validation issues", publishWithIssues.status === 400);

  const emptyTitleZones = fixtureZones({ checkpoint3Title: "" });
  const rev6 = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  const emptyTitleSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({ zones: emptyTitleZones, expectedRevision: rev6 });
  expect("an empty checkpoint title is rejected — Mongoose's `required` constraint rejects it at save time (400, not a 500)", emptyTitleSave.status === 400, emptyTitleSave.body);

  // Reset back to something valid so the next section can publish cleanly.
  const revReset = (await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft`)).body.data.revision;
  const cleanSave = await asAdmin("patch", `/api/v1/cms/courses/${COURSE_ID}/draft`).send({
    zones: fixtureZones({ checkpoint3Title: "Edited (v2)" }),
    expectedRevision: revReset,
  });
  expect("draft can be repaired back to a valid state", cleanSave.status === 200);
  const validAfterRepair = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/draft/validate`);
  expect("repaired draft passes validation", validAfterRepair.body.data.valid === true);

  // ── 4. publish: immutability, transactional snapshot, atomicity ─────────
  console.log("\n  4. publish\n");

  const publishRes = await asAdmin("post", `/api/v1/cms/courses/${COURSE_ID}/draft/publish`);
  expect("publish succeeds once the draft is valid", publishRes.status === 200, publishRes.body);
  expect("publish creates version v2", publishRes.body?.data?.version?.versionId === "v2");
  expect("publish reports the derived snapshot's checkpoint count (3)", publishRes.body?.data?.snapshotCheckpointCount === 3);

  const v1AfterPublish = await CmsCourseVersion.findOne({ courseId: COURSE_ID, versionId: "v1" }).lean();
  expect("the previous published version (v1) still exists, untouched", v1AfterPublish?.title === "Verify CMS Course");
  expect("v1's content is unchanged (checkpoint-3 title still original)", v1AfterPublish?.zones[0]?.modules[0]?.checkpoints[2]?.title === "Checkpoint Three");

  const courseAfterPublish = await CmsCourse.findOne({ courseId: COURSE_ID }).lean();
  expect("cmsCourses.latestPublishedVersion flips to v2", courseAfterPublish?.latestPublishedVersion === "v2");
  expect("cmsCourses.latestDraftVersion is cleared after publish", courseAfterPublish?.latestDraftVersion === null);

  const draftAfterPublish = await CmsCourseVersion.findOne({ courseId: COURSE_ID, status: "draft" }).lean();
  expect("the draft document is gone after publish", draftAfterPublish === null);

  const activeSnapshots = await CurriculumSnapshot.find({ courseId: COURSE_ID, isActive: true }).lean();
  expect("exactly one active curriculumSnapshot after publish (no half-published state)", activeSnapshots.length === 1);
  expect("the active snapshot is v2", activeSnapshots[0]?.version === "v2");
  expect("the active snapshot has 3 checkpoints, structure only (no theory/prose leaked)", activeSnapshots[0]?.checkpoints.length === 3 && !("theory" in (activeSnapshots[0] as any)));

  // ── 5. version pinning ────────────────────────────────────────────────────
  console.log("\n  5. version pinning\n");

  const publishedNow = await asLearner("get", `/api/v1/courses/${COURSE_ID}/published`);
  expect("learner reading /published gets the NEW active version (v2)", publishedNow.body?.data?.versionId === "v2");
  expect("v2 content reflects the edit", publishedNow.body?.data?.zones?.[0]?.modules?.[0]?.checkpoints?.[2]?.title === "Edited (v2)");

  const pinnedV1 = await asLearner("get", `/api/v1/courses/${COURSE_ID}/versions/v1`);
  expect("a learner PINNED to v1 can still resolve v1's exact content, even after v2 is active", pinnedV1.status === 200 && pinnedV1.body?.data?.zones?.[0]?.modules?.[0]?.checkpoints?.[2]?.title === "Checkpoint Three");

  const pinnedDraftLookup = await asLearner("get", `/api/v1/courses/${COURSE_ID}/versions/draft`);
  expect("a learner cannot resolve the literal 'draft' version id (not published)", pinnedDraftLookup.status === 404);

  // ── 5b. the complete learner A/B pinning scenario (hardening plan §4) ────
  // 1. publish v1 (done in section 4's setup)              2. learner A enrolls on v1
  // 3. learner A curriculumVersion = v1                    4. publish v2 (done above)
  // 5. learner A still curriculumVersion = v1               6. new learner B enrolls on v2
  // 7. learner A resolves v1 CONTENT via /me/courses/:id/content
  // 8. learner B resolves v2 CONTENT via /me/courses/:id/content
  console.log("\n  5b. learner A/B pinned-content resolution\n");

  const learnerA = await User.create({ email: "learner-a@verify.test", passwordHash: "x", displayName: "Learner A", role: "learner" });
  const learnerB = await User.create({ email: "learner-b@verify.test", passwordHash: "x", displayName: "Learner B", role: "learner" });
  const learnerAToken = signAccessToken(learnerA._id.toString(), "learner").token;
  const learnerBToken = signAccessToken(learnerB._id.toString(), "learner").token;
  const asLearnerA = (method: "get", path: string) => (request(app) as any)[method](path).set("Authorization", `Bearer ${learnerAToken}`);
  const asLearnerB = (method: "get", path: string) => (request(app) as any)[method](path).set("Authorization", `Bearer ${learnerBToken}`);

  // Learner A enrolled back when v1 was the only (then-active) version.
  await CourseProgress.create({ userId: learnerA._id, courseId: COURSE_ID, curriculumVersion: "v1" });
  expect("learner A's stored pin is v1", (await CourseProgress.findOne({ userId: learnerA._id, courseId: COURSE_ID }).lean())?.curriculumVersion === "v1");

  // v2 is now active (published in section 4) — a NEW enrollment pins to it.
  await CourseProgress.create({ userId: learnerB._id, courseId: COURSE_ID, curriculumVersion: "v2" });
  expect("learner B's stored pin is v2", (await CourseProgress.findOne({ userId: learnerB._id, courseId: COURSE_ID }).lean())?.curriculumVersion === "v2");

  // Publishing v2 must not have touched learner A's already-written pin.
  expect("learner A's pin is STILL v1 after v2 was published (never silently advanced)", (await CourseProgress.findOne({ userId: learnerA._id, courseId: COURSE_ID }).lean())?.curriculumVersion === "v1");

  const learnerAContent = await asLearnerA("get", `/api/v1/me/courses/${COURSE_ID}/content`);
  expect("learner A's /me/courses/:id/content resolves to v1 — their own pin, not the latest", learnerAContent.body?.data?.versionId === "v1", learnerAContent.body);
  expect("learner A's resolved content is v1's actual content (original checkpoint-3 title)", learnerAContent.body?.data?.zones?.[0]?.modules?.[0]?.checkpoints?.[2]?.title === "Checkpoint Three");

  const learnerBContent = await asLearnerB("get", `/api/v1/me/courses/${COURSE_ID}/content`);
  expect("learner B's /me/courses/:id/content resolves to v2 — their own pin", learnerBContent.body?.data?.versionId === "v2", learnerBContent.body);
  expect("learner B's resolved content is v2's edited content", learnerBContent.body?.data?.zones?.[0]?.modules?.[0]?.checkpoints?.[2]?.title === "Edited (v2)");

  const unenrolledLearner = await User.create({ email: "learner-c-unenrolled@verify.test", passwordHash: "x", displayName: "Learner C", role: "learner" });
  const unenrolledToken = signAccessToken(unenrolledLearner._id.toString(), "learner").token;
  const unenrolledContent = await request(app).get(`/api/v1/me/courses/${COURSE_ID}/content`).set("Authorization", `Bearer ${unenrolledToken}`);
  expect("a learner with NO progress row yet resolves to whatever is currently active (v2) — what enrolling them now would pin", unenrolledContent.body?.data?.versionId === "v2");

  // ── 6. rollback ────────────────────────────────────────────────────────────
  console.log("\n  6. rollback\n");

  const rollback = await asAdmin("post", `/api/v1/cms/courses/${COURSE_ID}/versions/v1/activate`);
  expect("activating an older published version succeeds", rollback.status === 200, rollback.body);

  const courseAfterRollback = await CmsCourse.findOne({ courseId: COURSE_ID }).lean();
  expect("cmsCourses.latestPublishedVersion moves back to v1", courseAfterRollback?.latestPublishedVersion === "v1");

  const v2StillExists = await CmsCourseVersion.findOne({ courseId: COURSE_ID, versionId: "v2" }).lean();
  expect("v2 is NOT deleted by rollback — only the active pointer moved", v2StillExists !== null);

  const activeAfterRollback = await CurriculumSnapshot.find({ courseId: COURSE_ID, isActive: true }).lean();
  expect("exactly one active snapshot after rollback", activeAfterRollback.length === 1);
  expect("the active snapshot is v1 again", activeAfterRollback[0]?.version === "v1");

  const publishedAfterRollback = await asLearner("get", `/api/v1/courses/${COURSE_ID}/published`);
  expect("a NEW read of /published now resolves to v1's content again", publishedAfterRollback.body?.data?.versionId === "v1");

  const versions = await asAdmin("get", `/api/v1/cms/courses/${COURSE_ID}/versions`);
  expect("version history lists both v1 and v2 (rollback deleted nothing)", versions.body?.data?.length === 2);

  // ── report ─────────────────────────────────────────────────────────────────

  console.log(`\n  ${checks} checks, ${failures} failed\n`);

  await mongoose.connection.close();
  await mongo.stop();

  if (failures > 0) process.exit(1);
  console.log(`  \u001b[32mCMS PIPELINE VERIFIED\u001b[0m\n`);
  process.exit(0);
}

main().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
