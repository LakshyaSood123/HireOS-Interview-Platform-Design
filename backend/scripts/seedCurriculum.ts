/**
 * Checkpoint 2.1 — seed `curriculumSnapshots` from the frontend registry.
 *
 *   npm run seed:curriculum
 *   npm run seed:curriculum -- --dry-run          # build and check, write nothing
 *   npm run seed:curriculum -- --version=2026-09-16
 *   npm run seed:curriculum -- --course=dsa-foundations
 *
 * Imports `src/learning/courseRegistry.ts` — the frontend's own registry, at
 * this repository's checked-out commit — and writes out the course's ID
 * STRUCTURE ONLY. What that means, and what enforces it, is in
 * `scripts/lib/buildSnapshot.ts`; this file is the database half.
 *
 * Re-running is safe: the same structure re-seeded is an upsert on
 * `{ courseId, version }`, and `isActive` moves to the snapshot just written.
 */

import { execFileSync } from "node:child_process";

import mongoose from "mongoose";

import { env, REPO_ROOT } from "../src/config/env.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { isoDate } from "../src/shared/dates.js";
import {
  assertGraphIsSound,
  assertRegistryShape,
  assertStructureOnly,
  buildSnapshotDraft,
  type SnapshotDraft,
} from "./lib/buildSnapshot.js";

// The frontend registry. Pure TypeScript data — no React, no CSS, no
// `import.meta` — so it imports cleanly under tsx.
import { coursesById } from "../../src/learning/courseRegistry";

const args = process.argv.slice(2);
const flag = (name: string): string | undefined => {
  const match = args.find((entry) => entry === `--${name}` || entry.startsWith(`--${name}=`));
  if (!match) return undefined;
  return match.includes("=") ? match.slice(match.indexOf("=") + 1) : "";
};

const dryRun = flag("dry-run") !== undefined;
const version = flag("version") || isoDate();
const onlyCourse = flag("course") || undefined;

function frontendCommit(): string | null {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim();
  } catch {
    return null;
  }
}

function report(draft: SnapshotDraft): void {
  const coding = draft.checkpoints.filter((checkpoint) => checkpoint.hasCodingActivity).length;
  const mastery = draft.checkpoints.filter((checkpoint) => checkpoint.masteryXp !== null).length;
  const xp = draft.checkpoints.reduce((total, checkpoint) => total + checkpoint.xp + (checkpoint.masteryXp ?? 0), 0);

  console.log(`\n  ${draft.courseId}  v${draft.version}`);
  console.log(`  ${"─".repeat(60)}`);
  console.log(`  zones               ${draft.zones.length}`);
  console.log(`  modules             ${draft.modules.length}`);
  console.log(`  checkpoints         ${draft.checkpoints.length}`);
  console.log(`  coding activities   ${coding}`);
  console.log(`  mastery bonuses     ${mastery}`);
  console.log(`  total XP on offer   ${xp}`);
  console.log(`  frontend commit     ${draft.frontendCommit ?? "(unknown)"}`);
  console.log(`  structure hash      ${draft.structureHash.slice(0, 16)}…`);
  console.log(`  written             ids · order · type · xp · masteryXp · prerequisites · hasCodingActivity · title`);
  console.log(`  not written         theory · questions · starter code · solutions · visuals · scenic data`);
}

async function main(): Promise<void> {
  const courses = Object.values(coursesById).filter((course) => {
    assertRegistryShape(course);
    return !onlyCourse || course.id === onlyCourse;
  });

  if (courses.length === 0) {
    throw new Error(onlyCourse ? `No registered course "${onlyCourse}".` : "The frontend registry has no courses.");
  }

  const commit = frontendCommit();
  const drafts = courses.map((course) => {
    assertRegistryShape(course);
    const draft = buildSnapshotDraft(course, { version, frontendCommit: commit });
    assertStructureOnly(draft);
    assertGraphIsSound(draft);
    return draft;
  });

  drafts.forEach(report);

  if (dryRun) {
    console.log("\n  --dry-run: built and checked, nothing written.\n");
    return;
  }

  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  await CurriculumSnapshot.createIndexes();

  for (const draft of drafts) {
    const previous = await CurriculumSnapshot.findOne({ courseId: draft.courseId, version: draft.version }).lean();
    if (previous && previous.structureHash !== draft.structureHash) {
      console.log(
        `\n  note: ${draft.courseId} v${draft.version} already exists with different content — replacing it.` +
          `\n        Pass --version=<name> to keep both.`,
      );
    }

    // One active snapshot per course is a unique partial index, so the old one
    // is stood down before the new one is stood up.
    await CurriculumSnapshot.updateMany(
      { courseId: draft.courseId, isActive: true, version: { $ne: draft.version } },
      { $set: { isActive: false } },
    );

    await CurriculumSnapshot.updateOne(
      { courseId: draft.courseId, version: draft.version },
      { $set: { ...draft, isActive: true } },
      { upsert: true },
    );

    console.log(`\n  seeded ${draft.courseId} v${draft.version} into ${env.MONGO_DB_NAME} (active)`);
  }

  console.log("\n  Restart the API (or it keeps the snapshot it loaded at boot).\n");
}

main()
  .then(async () => {
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
    if (mongoose.connection.readyState === 1) await mongoose.connection.close();
    process.exit(1);
  });
