/**
 * Checkpoint 2.4 — "derives locked / available / current / completed /
 * mastered … matches `progressEngine.ts` exactly".
 *
 *   npm run verify:parity
 *
 * Reading both files side by side is an argument. This is a proof: it loads
 * the REAL frontend engine (`src/learning/progressEngine.ts`) and the backend
 * port (`backend/src/modules/learning/progress.engine.ts`), runs both over the
 * same progress snapshots, and compares every answer — 107 checkpoint states,
 * 29 module states, 7 zone states and 107 "what is next" answers per scenario.
 *
 * No database and no server: both engines are pure functions, which is the
 * whole reason this check is possible.
 */

import { buildCurriculumIndex } from "../src/modules/curriculum/curriculum.service.js";
import * as backend from "../src/modules/learning/progress.engine.js";
import { assertRegistryShape, buildSnapshotDraft } from "./lib/buildSnapshot.js";

import { coursesById, findModuleForCheckpoint, getAllCheckpointsInOrder } from "../../src/learning/courseRegistry";
import * as frontend from "../../src/learning/progressEngine";
import type { LearnerProgressState } from "../../src/learning/progressEngine";

const course = Object.values(coursesById)[0];
assertRegistryShape(course);

const draft = buildSnapshotDraft(course, { version: "parity", frontendCommit: null });
const curriculum = buildCurriculumIndex(draft);

const frontendCourse = Object.values(coursesById)[0]!;
const allCheckpoints = getAllCheckpointsInOrder(frontendCourse);
const allModules = frontendCourse.zones.flatMap((zone) => zone.modules);

// ── scenarios ──────────────────────────────────────────────────────────────

function state(partial: Partial<LearnerProgressState>): LearnerProgressState {
  return {
    activeCourseId: frontendCourse.id,
    activeZoneId: null,
    activeModuleId: null,
    activeCheckpointId: null,
    completedCheckpointIds: [],
    masteredCheckpointIds: [],
    xp: 0,
    streak: 0,
    lives: 3,
    lastActivityDate: null,
    ...partial,
  };
}

function idsOf(moduleIds: string[]): string[] {
  return moduleIds.flatMap((moduleId) => {
    const module = allModules.find((entry) => entry.id === moduleId);
    return module ? module.checkpoints.map((checkpoint) => checkpoint.id) : [];
  });
}

/** Deterministic, so a failure is reproducible. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const everyId = allCheckpoints.map((checkpoint) => checkpoint.id);

const scenarios: { name: string; progress: LearnerProgressState }[] = [
  { name: "fresh account, no pointer", progress: state({}) },
  {
    name: "fresh account, pointing at the first checkpoint",
    progress: state({ activeZoneId: "basecamp", activeModuleId: "foundations", activeCheckpointId: "foundations-1" }),
  },
  {
    name: "mid-course (Basecamp done, in Arrays & Strings)",
    progress: state({
      completedCheckpointIds: idsOf(["foundations"]),
      masteredCheckpointIds: ["foundations-5"],
      activeZoneId: "basecamp",
      activeModuleId: "arrays-strings",
      activeCheckpointId: "arrays-strings-2",
    }),
  },
  {
    name: "mid-course on the demo branch (Foundations → Recursion done, in Trees)",
    progress: state({
      completedCheckpointIds: idsOf(["foundations", "linked-structures", "recursion"]),
      masteredCheckpointIds: ["foundations-5", "linked-structures-5", "recursion-5"],
      activeZoneId: "recursive-forest",
      activeModuleId: "trees",
      activeCheckpointId: "trees-1",
    }),
  },
  {
    name: "one module finished but not mastered",
    progress: state({
      completedCheckpointIds: idsOf(["foundations"]),
      masteredCheckpointIds: [],
      activeCheckpointId: "arrays-strings-1",
    }),
  },
  {
    name: "completed account",
    progress: state({ completedCheckpointIds: everyId, activeCheckpointId: "summit-3" }),
  },
  {
    name: "completed and fully mastered account",
    progress: state({ completedCheckpointIds: everyId, masteredCheckpointIds: everyId, activeCheckpointId: null }),
  },
  {
    name: "pointer at a checkpoint that is already complete",
    progress: state({ completedCheckpointIds: idsOf(["foundations"]), activeCheckpointId: "foundations-3" }),
  },
  {
    name: "pointer at a still-locked checkpoint",
    progress: state({ activeCheckpointId: "summit-1" }),
  },
];

// Random snapshots, to catch the shapes nobody thought to write down.
const random = mulberry32(20260920);
for (let i = 0; i < 40; i += 1) {
  const completed = everyId.filter(() => random() < 0.45);
  const mastered = completed.filter(() => random() < 0.2);
  const pointer = everyId[Math.floor(random() * everyId.length)] ?? null;
  scenarios.push({
    name: `random snapshot #${i + 1} (${completed.length} completed, ${mastered.length} mastered)`,
    progress: state({ completedCheckpointIds: completed, masteredCheckpointIds: mastered, activeCheckpointId: pointer }),
  });
}

// ── compare ────────────────────────────────────────────────────────────────

let compared = 0;
const mismatches: string[] = [];

function expectSame(scenario: string, subject: string, expected: unknown, actual: unknown): void {
  compared += 1;
  if (expected !== actual) {
    mismatches.push(`  ${scenario}\n    ${subject}: frontend "${String(expected)}" vs backend "${String(actual)}"`);
  }
}

for (const { name, progress } of scenarios) {
  for (const checkpoint of allCheckpoints) {
    expectSame(
      name,
      `checkpoint ${checkpoint.id}`,
      frontend.resolveCheckpointState(checkpoint, progress),
      backend.resolveCheckpointState(
        curriculum.checkpointById.get(checkpoint.id)!,
        progress as backend.LearnerProgressState,
      ),
    );

    expectSame(
      name,
      `next after ${checkpoint.id}`,
      frontend.getNextCheckpointId(frontendCourse, checkpoint.id),
      backend.getNextCheckpointId(curriculum, checkpoint.id),
    );
  }

  for (const module of allModules) {
    expectSame(
      name,
      `module ${module.id}`,
      frontend.resolveModuleState(module, progress),
      backend.resolveModuleState(curriculum, module.id, progress as backend.LearnerProgressState),
    );
  }

  for (const zone of frontendCourse.zones) {
    expectSame(
      name,
      `zone ${zone.id}`,
      frontend.resolveZoneState(zone, progress),
      backend.resolveZoneState(curriculum, zone.id, progress as backend.LearnerProgressState),
    );
  }
}

// ── completion parity: the whole resulting snapshot, not just the states ───

const completionCases = scenarios.slice(0, 9).flatMap(({ name, progress }) =>
  ["foundations-1", "foundations-5", "arrays-strings-3", "trees-5", "summit-3"].map((checkpointId) => ({
    name: `${name} → complete ${checkpointId}`,
    progress,
    checkpointId,
  })),
);

for (const { name, progress, checkpointId } of completionCases) {
  const today = "2026-09-20";
  const fromFrontend = frontend.completeCheckpoint(frontendCourse, progress, checkpointId, today);
  const fromBackend = backend.completeCheckpoint(
    curriculum,
    progress as backend.LearnerProgressState,
    checkpointId,
    today,
  );

  for (const field of [
    "activeZoneId",
    "activeModuleId",
    "activeCheckpointId",
    "xp",
    "streak",
    "lastActivityDate",
  ] as const) {
    expectSame(name, field, fromFrontend[field], fromBackend[field]);
  }
  expectSame(
    name,
    "completedCheckpointIds",
    [...fromFrontend.completedCheckpointIds].sort().join(","),
    [...fromBackend.completedCheckpointIds].sort().join(","),
  );
  expectSame(
    name,
    "masteredCheckpointIds",
    [...fromFrontend.masteredCheckpointIds].sort().join(","),
    [...fromBackend.masteredCheckpointIds].sort().join(","),
  );
}

// Sanity: the module every checkpoint belongs to, as each side sees it.
for (const checkpoint of allCheckpoints) {
  expectSame(
    "checkpoint ownership",
    checkpoint.id,
    findModuleForCheckpoint(frontendCourse, checkpoint.id)?.id,
    curriculum.moduleIdByCheckpointId.get(checkpoint.id),
  );
}

// ── the streak: same rule, corrected arithmetic ────────────────────────────
//
// The rule is identical — same day changes nothing, yesterday adds one,
// anything else resets to one. The arithmetic is not: the frontend derives
// "yesterday" with `new Date(today)` and LOCAL-timezone getters, so on the two
// days a year a DST zone falls back (a 25-hour local day) it names the wrong
// date, breaking a real streak and continuing a broken one.
//
// The server is the authority on the streak now, so it does the arithmetic in
// UTC, where every day is 24 hours. This sweep proves the backend is right on
// every date in a three-year window, and reports where the frontend would have
// disagreed rather than hiding it.

function utcYesterday(iso: string): string {
  return new Date(Date.parse(`${iso}T00:00:00.000Z`) - 86_400_000).toISOString().slice(0, 10);
}

const streakStart = Date.UTC(2025, 0, 1);
const streakDivergences: string[] = [];
let streakCompared = 0;
let backendWrong = 0;

for (let day = 0; day < 1096; day += 1) {
  const today = new Date(streakStart + day * 86_400_000).toISOString().slice(0, 10);

  for (const back of [0, 1, 2]) {
    const last = new Date(streakStart + (day - back) * 86_400_000).toISOString().slice(0, 10);
    const before = state({ streak: 4, lastActivityDate: last });

    const fromFrontend = frontend.recordActivity(before, today);
    const fromBackend = backend.recordActivity(before as backend.LearnerProgressState, today);
    streakCompared += 1;

    // What the rule says, computed in UTC — the reference both are judged by.
    const expected = last === today ? 4 : last === utcYesterday(today) ? 5 : 1;
    if (fromBackend.streak !== expected) {
      backendWrong += 1;
      mismatches.push(`  streak ${last} → ${today}: rule says ${expected}, backend says ${fromBackend.streak}`);
    }
    if (fromFrontend.streak !== fromBackend.streak) {
      streakDivergences.push(`${last} → ${today}: frontend ${fromFrontend.streak}, backend ${fromBackend.streak}`);
    }
  }
}

// ── report ─────────────────────────────────────────────────────────────────

const label = `${scenarios.length} scenarios · ${(compared + streakCompared).toLocaleString("en-US")} comparisons`;

if (mismatches.length > 0) {
  console.error(`\n  \u001b[31mENGINE PARITY FAILED\u001b[0m  ${label}\n`);
  console.error(mismatches.slice(0, 40).join("\n"));
  if (mismatches.length > 40) console.error(`\n  …and ${mismatches.length - 40} more.`);
  console.error("");
  process.exit(1);
}

console.log(`\n  \u001b[32mENGINE PARITY OK\u001b[0m  ${label}`);
console.log(`  Derived states, "what is next" and completion results are identical to`);
console.log(`  src/learning/progressEngine.ts. Streak arithmetic follows the same rule`);
console.log(`  and is correct in UTC on all ${streakCompared.toLocaleString("en-US")} date pairs (backend wrong: ${backendWrong}).`);

if (streakDivergences.length > 0) {
  console.log(
    `\n  \u001b[33mnote\u001b[0m  the frontend would answer differently on ${streakDivergences.length} of them, all DST`,
  );
  console.log(`        fall-back days in TZ=${process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone}:`);
  for (const line of streakDivergences.slice(0, 6)) console.log(`          ${line}`);
  console.log(`        Deliberate: the server is the authority and its day is 24 hours long.`);
}

console.log("");
process.exit(0);
