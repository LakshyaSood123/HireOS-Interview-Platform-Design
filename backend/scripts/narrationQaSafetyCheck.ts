/**
 * Read-only: prints the published pointer and shape of machine-learning-foundations, through the normal CMS services, plus
 * the dev learner's pin/progress fingerprint. Used to prove a QA run did not publish or repin anything.
 *
 *   MONGO_DB_NAME=reagvis_dev npx tsx scripts/narrationQaSafetyCheck.ts [--learner=<email>]
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";

const COURSE = "machine-learning-foundations";

async function main() {
  const learnerEmail = process.argv.find((a) => a.startsWith("--learner="))?.slice(10);
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  const course: any = await CmsCourse.findOne({ courseId: COURSE }).lean();
  const published = await cmsService.getPublishedContent(COURSE);
  const zones = published.zones as any[];
  const modules = zones.flatMap((z) => z.modules);
  const cps = modules.flatMap((m: any) => m.checkpoints);
  const refs = new Set(cps.map((c: any) => c.workspace.animation.revisionId));
  const narratedFrozen = await CmsAnimationPackage.countDocuments({ status: { $ne: "draft" }, narration: { $ne: null } });
  console.log(`DB=${env.MONGO_DB_NAME} PUBLISHED=${course.latestPublishedVersion} ZONES=${zones.length} MODULES=${modules.length} CHECKPOINTS=${cps.length} PUBLISHED_REFS_DRAFT=${refs.has("draft")} FROZEN_REVISIONS_WITH_NARRATION=${narratedFrozen}`);
  const issues = await cmsService.validateDraft(COURSE);
  console.log(`DRAFT_VALIDATION errors=${issues.filter((i: any) => i.severity !== "warning").length} warnings=${issues.filter((i: any) => i.severity === "warning").length}`);
  if (learnerEmail) {
    const db = mongoose.connection.db!;
    const user: any = await db.collection("users").findOne({ email: learnerEmail });
    if (!user) throw new Error(`no learner ${learnerEmail}`);
    const rows: any[] = [];
    for (const c of await db.listCollections().toArray()) {
      if (["users", "cmscourses", "cmsanimationpackages", "cmscourseversions"].includes(c.name)) continue;
      const docs = await db.collection(c.name).find({ $or: [{ userId: user._id }, { learnerId: user._id }, { user: user._id }] }).toArray();
      if (docs.length) rows.push({ c: c.name, docs: JSON.parse(JSON.stringify(docs)) });
    }
    rows.sort((a, b) => a.c.localeCompare(b.c));
    const fp = createHash("sha256").update(JSON.stringify(rows)).digest("hex").slice(0, 16);
    console.log(`LEARNER=${learnerEmail} COLLECTIONS=${rows.map((r) => `${r.c}:${r.docs.length}`).join(",")} FINGERPRINT=${fp}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
