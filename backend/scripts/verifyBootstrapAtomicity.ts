/**
 * Phase 3B hardening §2/§3 — proves:
 *   - a real (non-dry-run) bootstrap REQUIRES a real admin actor (no
 *     synthetic ObjectId fallback), rejecting a missing/learner/unknown actor
 *   - the bootstrap's writes (published version, snapshot, course pointer)
 *     are genuinely transactional: an induced failure before the LAST write
 *     leaves NONE of the earlier writes behind, and a second, clean run then
 *     succeeds from scratch
 *   - a successful bootstrap is idempotent (second run is a no-op)
 *
 *   npm run verify:bootstrap
 *
 * Uses `MongoMemoryReplSet` (a real single-node replica set), not the plain
 * `MongoMemoryServer` (standalone). `withTransaction` (shared/transaction.ts)
 * silently runs un-wrapped on a standalone mongod — real rollback needs a
 * replica set, which is what Atlas (production) actually is. Testing
 * atomicity against a standalone instance would only prove the no-op
 * fallback works, not that a real failure rolls back — this uses the same
 * deployment shape production has.
 */

import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";

import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { User } from "../src/modules/auth/user.model.js";
import { bootstrapCourse } from "../src/modules/cms/bootstrap.js";
import { resolveActorId } from "./lib/resolveActorId.js";
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

const COURSE_ID = "verify-bootstrap-course";

function fixtureZones(): CmsZone[] {
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
          ],
        },
      ],
    },
  ];
}

async function main(): Promise<void> {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  await mongoose.connect(mongo.getUri("verify_bootstrap"));
  await Promise.all([CmsCourse.createIndexes(), CmsCourseVersion.createIndexes(), CurriculumSnapshot.createIndexes(), User.createIndexes()]);

  // ── 1. real bootstrap requires a real admin ─────────────────────────────
  console.log("\n  1. bootstrap requires a real admin actor\n");

  // bootstrapCourse() itself takes an already-resolved actorId; the "no
  // admin"/"learner"/"unknown email" rejections are resolveActorId()'s own
  // contract, enforced BEFORE bootstrapCourse() is ever called — this proves
  // that shared function directly (the same one bootstrapDsaCms.ts uses).
  // No admin exists in the database yet at this point in the script.
  await expectRejects("no admin exists at all", () => resolveActorId(undefined), /no admin user exists/i);

  const learner = await User.create({ email: "learner@verify-bootstrap.test", passwordHash: "x", displayName: "Learner", role: "learner" });
  await expectRejects("--admin-email names a learner, not an admin", () => resolveActorId(learner.email), /is not an admin/i);
  await expectRejects("--admin-email names a user that does not exist", () => resolveActorId("nobody@nowhere.test"), /no user found/i);

  const admin = await User.create({ email: "admin@verify-bootstrap.test", passwordHash: "x", displayName: "Admin", role: "admin" });
  const resolvedId = await resolveActorId(admin.email);
  expect("--admin-email naming a real admin resolves to that admin's real id", resolvedId === admin._id.toString());

  const resolvedWithoutFlag = await resolveActorId(undefined);
  expect("no --admin-email given, but an admin now exists — falls back to that admin", resolvedWithoutFlag === admin._id.toString());

  // ── 2. transactional atomicity: induced failure leaves nothing behind ──
  console.log("\n  2. bootstrap is transactional (induced failure before the course pointer)\n");

  const induced = await bootstrapCourse({
    courseId: COURSE_ID,
    title: "Verify Bootstrap Course",
    courseType: "structured-dsa",
    zones: fixtureZones(),
    actorId: admin._id.toString(),
    _induceFailureBeforeCoursePointer: true,
  }).catch((error: unknown) => error as Error);

  expect("the induced failure actually threw", induced instanceof Error);

  const versionAfterFailure = await CmsCourseVersion.findOne({ courseId: COURSE_ID }).lean();
  const snapshotAfterFailure = await CurriculumSnapshot.findOne({ courseId: COURSE_ID }).lean();
  const courseAfterFailure = await CmsCourse.findOne({ courseId: COURSE_ID }).lean();

  expect("no published version left behind (rolled back)", versionAfterFailure === null, versionAfterFailure);
  expect("no curriculumSnapshot left behind (rolled back)", snapshotAfterFailure === null, snapshotAfterFailure);
  expect("no cmsCourses pointer left behind (never reached)", courseAfterFailure === null, courseAfterFailure);

  // ── 3. a clean run afterward succeeds from scratch ──────────────────────
  console.log("\n  3. a clean bootstrap after the induced failure succeeds cleanly\n");

  const clean = await bootstrapCourse({
    courseId: COURSE_ID,
    title: "Verify Bootstrap Course",
    courseType: "structured-dsa",
    zones: fixtureZones(),
    actorId: admin._id.toString(),
  });

  expect("clean run reports alreadyBootstrapped: false", clean.alreadyBootstrapped === false);
  expect("clean run creates version v1", clean.versionId === "v1");

  const version = await CmsCourseVersion.findOne({ courseId: COURSE_ID }).lean();
  const snapshot = await CurriculumSnapshot.findOne({ courseId: COURSE_ID, isActive: true }).lean();
  const course = await CmsCourse.findOne({ courseId: COURSE_ID }).lean();

  expect("published version exists", version?.status === "published");
  expect("createdBy/updatedBy reference the REAL admin, not a synthetic id", version?.createdBy?.toString() === admin._id.toString());
  expect("active curriculumSnapshot exists", snapshot?.version === "v1");
  expect("cmsCourses pointer exists and points at v1", course?.latestPublishedVersion === "v1");

  // ── 4. idempotency: second successful run is a no-op ───────────────────
  console.log("\n  4. second run is a no-op\n");

  const second = await bootstrapCourse({
    courseId: COURSE_ID,
    title: "Verify Bootstrap Course",
    courseType: "structured-dsa",
    zones: fixtureZones(),
    actorId: admin._id.toString(),
  });
  expect("second run reports alreadyBootstrapped: true", second.alreadyBootstrapped === true);

  const versionsAfterSecondRun = await CmsCourseVersion.countDocuments({ courseId: COURSE_ID });
  expect("still exactly one version document after a repeat run", versionsAfterSecondRun === 1);

  // ── report ────────────────────────────────────────────────────────────
  console.log(`\n  ${checks} checks, ${failures} failed\n`);

  await mongoose.connection.close();
  await mongo.stop();

  if (failures > 0) process.exit(1);
  console.log(`  \u001b[32mBOOTSTRAP ATOMICITY VERIFIED\u001b[0m\n`);
  process.exit(0);
}

async function expectRejects(label: string, fn: () => Promise<unknown>, messagePattern: RegExp): Promise<void> {
  try {
    await fn();
    expect(label, false, "did not throw");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    expect(label, messagePattern.test(message), message);
  }
}

main().catch(async (error: unknown) => {
  console.error(error);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
