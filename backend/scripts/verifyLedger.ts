/**
 * Checkpoint 2.3 / 2.7 at the data level — "no duplicate XP".
 *
 *   npm run verify:ledger
 *
 * The HTTP checks prove a learner cannot be awarded twice through the API.
 * This proves it of the database itself, for every user in it: every point of
 * XP anyone holds is reconciled against the ledger rows that granted it, and
 * every completed checkpoint is matched to exactly one `complete:` row.
 *
 * Read-only. It writes nothing and fixes nothing — a mismatch here is a bug to
 * go and find, not a number to correct.
 */

import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import { RewardEvent } from "../src/modules/learning/rewardEvent.model.js";

interface Problem {
  user: string;
  detail: string;
}

async function main(): Promise<void> {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });

  const progressDocs = await CourseProgress.find().lean();
  const problems: Problem[] = [];
  let checkedUsers = 0;
  let checkedEvents = 0;

  for (const progress of progressDocs) {
    checkedUsers += 1;
    const who = `${progress.userId.toString()} / ${progress.courseId}`;
    const events = await RewardEvent.find({ userId: progress.userId, courseId: progress.courseId }).lean();
    checkedEvents += events.length;

    // 1. Stored XP is exactly what the ledger granted.
    const ledgerXp = events.reduce((total, event) => total + event.xpDelta, 0);
    if (ledgerXp !== progress.xp) {
      problems.push({ user: who, detail: `xp is ${progress.xp} but the ledger totals ${ledgerXp}` });
    }

    // 2. No event key appears twice. The unique index should make this
    //    impossible; checking it is how we find out if it ever was not.
    const keys = events.map((event) => event.eventKey);
    const duplicates = [...new Set(keys.filter((key, index) => keys.indexOf(key) !== index))];
    if (duplicates.length > 0) {
      problems.push({ user: who, detail: `duplicate ledger keys: ${duplicates.join(", ")}` });
    }

    // 3. Every completed checkpoint has its row, and every row has its
    //    checkpoint — a reward with nothing to show for it is as wrong as a
    //    completion nobody paid for.
    const completionKeys = new Set(
      events.filter((event) => event.eventType === "checkpoint-complete").map((event) => event.referenceId),
    );
    for (const checkpointId of progress.completedCheckpointIds) {
      if (!completionKeys.has(checkpointId)) {
        problems.push({ user: who, detail: `completed "${checkpointId}" with no ledger row` });
      }
    }
    for (const checkpointId of completionKeys) {
      if (!progress.completedCheckpointIds.includes(checkpointId)) {
        problems.push({ user: who, detail: `ledger row for "${checkpointId}" but it is not completed` });
      }
    }

    // 4. Mastery bonuses line up with the mastered list.
    const masteryIds = new Set(
      events.filter((event) => event.eventType === "mastery-bonus").map((event) => event.referenceId),
    );
    for (const checkpointId of progress.masteredCheckpointIds) {
      if (!masteryIds.has(checkpointId)) {
        problems.push({ user: who, detail: `mastered "${checkpointId}" with no mastery-bonus row` });
      }
    }

    // 5. Lives and the streak stay inside their bounds.
    if (progress.lives < 0) problems.push({ user: who, detail: `lives is ${progress.lives}` });
    if (progress.streak < 0) problems.push({ user: who, detail: `streak is ${progress.streak}` });
  }

  await mongoose.connection.close();

  const scope = `${checkedUsers} progress documents · ${checkedEvents} ledger rows · ${env.MONGO_DB_NAME}`;

  if (problems.length > 0) {
    console.error(`\n  \u001b[31mLEDGER RECONCILIATION FAILED\u001b[0m  ${scope}\n`);
    for (const problem of problems.slice(0, 40)) console.error(`    ${problem.user}\n      ${problem.detail}`);
    if (problems.length > 40) console.error(`\n  …and ${problems.length - 40} more.`);
    console.error("");
    process.exit(1);
  }

  console.log(`\n  \u001b[32mLEDGER RECONCILES\u001b[0m  ${scope}`);
  console.log(`  Every point of XP traces to the row that granted it, and no key appears twice.\n`);
  process.exit(0);
}

main().catch(async (error: unknown) => {
  console.error(`\n  ${error instanceof Error ? error.message : String(error)}\n`);
  if (mongoose.connection.readyState === 1) await mongoose.connection.close();
  process.exit(1);
});
