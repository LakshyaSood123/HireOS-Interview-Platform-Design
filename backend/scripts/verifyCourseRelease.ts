/**
 * Proves that a database restored from a course release is IDENTICAL (apart from the actor ids) to the
 * source database for one published version. Read-only on both databases.
 *
 *   npx tsx scripts/verifyCourseRelease.ts --course=<id> --version=<v> --source-db=<name> --target-db=<name>
 *
 * Uses the same MONGO_URI for both (two database names on one server).
 */
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { comparable, referencedPackages, structureCounts } from "./lib/courseRelease.js";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const need = (name: string) => arg(name) ?? (() => { throw new Error(`--${name}=... is required`); })();

async function main() {
  const courseId = need("course"), version = need("version"), srcName = need("source-db"), dstName = need("target-db");
  if (srcName === dstName) throw new Error("source and target must be different databases");
  const src = await mongoose.createConnection(env.MONGO_URI, { dbName: srcName }).asPromise();
  const dst = await mongoose.createConnection(env.MONGO_URI, { dbName: dstName }).asPromise();
  const problems: string[] = [];
  try {
    const one = async (c: mongoose.Connection, coll: string, filter: object) => c.collection(coll).findOne(filter);
    const same = async (coll: string, filter: object, label: string) => {
      const a: any = await one(src, coll, filter), b: any = await one(dst, coll, filter);
      if (!a || !b) { problems.push(`${label}: missing in ${!a ? "source" : "target"}`); return null; }
      if (coll === "cmsCourses") { a.latestDraftVersion = null; b.latestDraftVersion = null; }
      if (comparable(a) !== comparable(b)) problems.push(`${label}: differs`);
      return a;
    };
    const ver: any = await same("cmsCourseVersions", { courseId, versionId: version }, "version document");
    await same("cmsCourses", { courseId }, "course pointer");
    const snapSrc: any = await one(src, "curriculumSnapshots", { courseId, version });
    const snapDst: any = await one(dst, "curriculumSnapshots", { courseId, version });
    if (!snapSrc || !snapDst) problems.push("snapshot missing");
    else {
      snapSrc.isActive = true;
      if (comparable(snapSrc) !== comparable(snapDst)) problems.push("curriculum snapshot differs");
    }
    let n = 0;
    if (ver) {
      for (const r of referencedPackages(ver.zones)) {
        const a: any = await one(src, "cmsAnimationPackages", { packageId: r.packageId, revisionId: r.revisionId });
        const b: any = await one(dst, "cmsAnimationPackages", { packageId: r.packageId, revisionId: r.revisionId });
        if (!a || !b) { problems.push(`package ${r.packageId}@${r.revisionId} missing`); continue; }
        a.lastFrozenRevisionId = null; a.lastFrozenContentHash = null;
        if (comparable(a) !== comparable(b)) problems.push(`package ${r.packageId}@${r.revisionId} differs`);
        n++;
      }
      const c = structureCounts(ver.zones);
      console.log(`COMPARED version=${version} zones=${c.zones} modules=${c.modules} checkpoints=${c.checkpoints} packages=${n}`);
    }
    for (const coll of ["users", "refreshTokens", "courseProgress", "rewardEvents", "notes"]) {
      const count = await dst.collection(coll).countDocuments({});
      console.log(`TARGET ${coll}: ${count}`);
      if (count !== 0) problems.push(`target database has ${count} document(s) in ${coll}`);
    }
    if (problems.length) { console.log("VERIFY_FAIL\n  - " + problems.join("\n  - ")); process.exitCode = 1; }
    else console.log("VERIFY_IDENTICAL source and target are identical for the release (ignoring actor ids); no learner data in target");
  } finally {
    await src.close(); await dst.close();
  }
}

main().catch((e) => { console.error("[verify-course-release] STOPPED:", e instanceof Error ? e.message : e); process.exitCode = 1; });
