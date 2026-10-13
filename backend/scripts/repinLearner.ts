/**
 * Moves ONE learner's curriculum pin for ONE course to an explicit published
 * version, through cmsService.repinLearnerCourse. Development/admin helper.
 *
 *   npx tsx scripts/repinLearner.ts --course=<id> --email=<learner email> --version=<vN>          (dry run)
 *   npx tsx scripts/repinLearner.ts --course=<id> --email=<learner email> --version=<vN> --apply  (writes)
 *
 * Dry run is the default and changes nothing. Refuses draft and nonexistent
 * versions, un-enrolled learners, and targets that would orphan completed
 * checkpoints. Repinning to the current pin is a no-op.
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { User } from "../src/modules/auth/user.model.js";
import { CourseProgress } from "../src/modules/learning/courseProgress.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";

function arg(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit?.slice(name.length + 3);
}

async function main() {
  const courseId = arg("course");
  const email = arg("email");
  const version = arg("version");
  const apply = process.argv.includes("--apply");
  if (!courseId || !email || !version) {
    throw new Error("Required: --course=<id> --email=<learner email> --version=<published version id, e.g. v3>");
  }

  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const user = await User.findOne({ email: email.toLowerCase() }).select("_id email").lean();
    if (!user) throw new Error(`No user with email ${email}.`);
    const userId = String(user._id);

    const progress = await CourseProgress.findOne({ userId, courseId }).lean();
    console.log(`[repin] learner ${email} (${userId}), course ${courseId}`);
    console.log(`[repin] current pin: ${progress?.curriculumVersion ?? "(not enrolled)"}   target: ${version}`);

    const result = await cmsService.repinLearnerCourse(userId, courseId, version, { dryRun: !apply });
    if (!result.changed) console.log(`[repin] already pinned to ${result.to}; nothing changed (idempotent).`);
    else if (!apply) console.log(`[repin] DRY RUN: all checks passed. Would move pin ${result.from} -> ${result.to}. Re-run with --apply to do it.`);
    else console.log(`[repin] moved pin ${result.from} -> ${result.to}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("[repin] failed:", err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
