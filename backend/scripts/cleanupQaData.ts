/**
 * Removes DEVELOPMENT QA accounts (and only their data) created during audits/testing: users whose email matches
 *   qa-<name>+<suffix>@example.com or qa-<name>-<suffix>@example.com (qa-load, qa-audit, qa-ui, qa-pilot, ...),
 * together with their refresh tokens, course progress, reward events, learning attempts and notes.
 *
 * It is a DRY RUN unless BOTH --execute and --confirm=DELETE-QA-USERS are given, never touches any other account
 * (the development learner cms-admin+test@example.com is explicitly protected), and refuses to run when
 * NODE_ENV=production.
 *
 *   npx tsx scripts/cleanupQaData.ts                                   # report only
 *   npx tsx scripts/cleanupQaData.ts --execute --confirm=DELETE-QA-USERS
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";
import { RefreshToken } from "../src/modules/auth/refreshToken.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import { RewardEvent } from "../src/modules/learning/rewardEvent.model.js";
import { LearningAttempt } from "../src/modules/learning/learningAttempt.model.js";
import { Note } from "../src/modules/notes/note.model.js";

const QA_EMAIL = /^qa-[a-z-]+[+-][^@]+@example\.com$/i;
const PROTECTED = new Set(["cms-admin+test@example.com"]);

async function main() {
  if (env.isProduction) throw new Error("refusing to run in production");
  const execute = process.argv.includes("--execute") && process.argv.includes("--confirm=DELETE-QA-USERS");
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const all = await User.find({}).select("email role").lean();
    const targets = all.filter((u: any) => QA_EMAIL.test(u.email) && !PROTECTED.has(u.email) && u.role !== "admin");
    const ids = targets.map((u: any) => u._id);
    const strIds = ids.map(String);
    console.log(`DATABASE ${env.MONGO_DB_NAME}: ${all.length} users total, ${targets.length} QA users match`);
    const filters: [string, any, object][] = [
      ["refreshTokens", RefreshToken, { userId: { $in: ids } }],
      ["courseProgress", CourseProgress, { userId: { $in: strIds } }],
      ["rewardEvents", RewardEvent, { userId: { $in: strIds } }],
      ["learningAttempts", LearningAttempt, { userId: { $in: strIds } }],
      ["notes", Note, { userId: { $in: strIds } }],
    ];
    for (const [name, model, filter] of filters) console.log(`  ${name.padEnd(18)} ${await model.countDocuments(filter)}`);
    if (!execute) { console.log("DRY RUN: nothing deleted (add --execute --confirm=DELETE-QA-USERS to delete)"); return; }
    for (const [name, model, filter] of filters) console.log(`  deleted ${name}: ${(await model.deleteMany(filter)).deletedCount}`);
    console.log(`  deleted users: ${(await User.deleteMany({ _id: { $in: ids } })).deletedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => { console.error("[cleanup-qa] STOPPED:", e instanceof Error ? e.message : e); process.exitCode = 1; });
