/**
 * Imports a sanitized course release (see exportCourseRelease.ts) into the CONFIGURED database
 * (MONGO_URI / MONGO_DB_NAME from the environment). Safe to run on a brand-new empty database.
 *
 *   npx tsx scripts/importCourseRelease.ts --in=<dir> [--admin-email=<admin>] [--dry-run] [--force-overwrite]
 *
 * Behaviour:
 *  1. verifies manifest format/schema, every file's sha256, and the expected zone/module/checkpoint/package counts
 *  2. PRE-SCANS the target: for each document it reports CREATE (absent), REUSE (identical) or CONFLICT (different)
 *  3. refuses to write anything if there is any CONFLICT (nothing is overwritten) unless --force-overwrite is given
 *  4. inserts only what is absent, preserving _id and timestamps exactly; never touches users/progress/anything else
 *  5. re-reads through the real CMS services and verifies the result
 *
 * Idempotent: a second run reports REUSE for every document and changes nothing.
 * --admin-email: record that admin as createdBy/updatedBy instead of the placeholder id (the account must already exist).
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { env } from "../src/config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "../src/db/connect.js";
import { User } from "../src/modules/auth/user.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { validatePackageTraceAgainstManifest } from "../src/modules/cms/animationPackage.service.js";
import {
  RELEASE_FORMAT, RELEASE_SCHEMA_VERSION, ObjectId, comparable, fileNameForPackage, fromEjsonText, referencedPackages, sha256, structureCounts,
  type ReleaseManifest,
} from "./lib/courseRelease.js";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const flag = (name: string) => process.argv.includes(`--${name}`);
function fail(message: string): never { throw new Error(message); }

type Plan = { collection: string; key: string; model: any; filter: Record<string, unknown>; doc: any; status: "CREATE" | "REUSE" | "CONFLICT" };

async function main() {
  const dir = path.resolve(arg("in") ?? fail("--in=<release directory> is required"));
  const dryRun = flag("dry-run"), force = flag("force-overwrite");
  const read = (rel: string) => readFileSync(path.join(dir, rel), "utf8");

  // 1. manifest + checksums
  const manifest: ReleaseManifest = JSON.parse(read("manifest.json"));
  if (manifest.format !== RELEASE_FORMAT) fail(`not a course release (format "${manifest.format}")`);
  if (manifest.schemaVersion !== RELEASE_SCHEMA_VERSION) fail(`unsupported release schemaVersion ${manifest.schemaVersion} (this importer supports ${RELEASE_SCHEMA_VERSION})`);
  // line endings are normalised before hashing so a Windows checkout (autocrlf) still matches; .gitattributes also pins them
  for (const [rel, expected] of Object.entries(manifest.files)) if (sha256(read(rel).replace(/\r\n/g, "\n")) !== expected) fail(`checksum mismatch for ${rel}: the release files were modified or corrupted`);
  const course = fromEjsonText(read("course.json")), version = fromEjsonText(read("version.json")), snapshot = fromEjsonText(read("snapshot.json"));
  const pkgFiles = Object.keys(manifest.files).filter((f) => f.startsWith("packages/"));
  const packages = pkgFiles.map((f) => fromEjsonText(read(f)));
  const counts = structureCounts(version.zones);
  for (const k of ["zones", "modules", "checkpoints"] as const) if (counts[k] !== manifest.expected[k]) fail(`release has ${counts[k]} ${k}, manifest says ${manifest.expected[k]}`);
  if (packages.length !== manifest.expected.packages) fail(`release has ${packages.length} packages, manifest says ${manifest.expected.packages}`);
  const have = new Set(packages.map((p: any) => fileNameForPackage(p.packageId, p.revisionId)));
  for (const r of referencedPackages(version.zones)) if (!have.has(fileNameForPackage(r.packageId, r.revisionId))) fail(`version references ${r.packageId}@${r.revisionId} (${r.checkpointId}) but the release does not contain it`);
  let traces = 0;
  for (const p of packages) {
    validatePackageTraceAgainstManifest(p.packageTrace, p.manifest.traceEvents);
    traces++;
    if (p.status !== "frozen") fail(`package ${p.packageId}@${p.revisionId} is not frozen`);
  }
  if (traces !== manifest.expected.packageTraces) fail("Package Trace count mismatch");
  if (course.courseId !== manifest.courseId || version.courseId !== manifest.courseId || version.versionId !== manifest.sourcePublishedVersion || course.latestPublishedVersion !== manifest.sourcePublishedVersion || snapshot.version !== manifest.sourcePublishedVersion) fail("release documents disagree about course/version");
  console.log(`MANIFEST_OK course=${manifest.courseId} version=${manifest.sourcePublishedVersion} zones=${counts.zones} modules=${counts.modules} checkpoints=${counts.checkpoints} packages=${packages.length} traces=${traces} files=${Object.keys(manifest.files).length}`);

  await connectToDatabase(); // env.MONGO_URI / env.MONGO_DB_NAME; also builds indexes (needed on a fresh database)
  try {
    console.log(`TARGET_DB: ${env.MONGO_DB_NAME}`);
    if (arg("admin-email")) {
      const admin: any = await User.findOne({ email: arg("admin-email")!.toLowerCase() }).lean();
      if (!admin || admin.role !== "admin") fail(`--admin-email "${arg("admin-email")}" is not an existing admin account`);
      const id = new ObjectId(String(admin._id));
      for (const d of [version, ...packages]) { d.createdBy = id; d.updatedBy = id; }
    }

    // 2. plan
    const plans: Plan[] = [];
    const plan = async (collection: string, key: string, model: any, filter: Record<string, unknown>, doc: any, ignore: string[] = []) => {
      const existing = await model.collection.findOne(filter);
      plans.push({ collection, key, model, filter, doc, status: !existing ? "CREATE" : comparable(existing, ignore) === comparable(doc, ignore) ? "REUSE" : "CONFLICT" });
    };
    // the course pointer legitimately moves on a live database (draft pointer, updatedAt) without being a conflict
    await plan("cmsCourses", manifest.courseId, CmsCourse, { courseId: manifest.courseId }, course, ["latestDraftVersion", "updatedAt"]);
    await plan("cmsCourseVersions", manifest.sourcePublishedVersion, CmsCourseVersion, { courseId: manifest.courseId, versionId: version.versionId }, version);
    await plan("curriculumSnapshots", manifest.sourcePublishedVersion, CurriculumSnapshot, { courseId: manifest.courseId, version: snapshot.version }, snapshot);
    for (const p of packages) await plan("cmsAnimationPackages", fileNameForPackage(p.packageId, p.revisionId), CmsAnimationPackage, { packageId: p.packageId, revisionId: p.revisionId }, p);
    // another ACTIVE snapshot of this course would violate the one-active-snapshot invariant
    const otherActive = await CurriculumSnapshot.findOne({ courseId: manifest.courseId, isActive: true, version: { $ne: snapshot.version } }).lean();

    for (const c of ["cmsCourses", "cmsCourseVersions", "curriculumSnapshots", "cmsAnimationPackages"]) {
      const sub = plans.filter((p) => p.collection === c);
      console.log(`PLAN ${c.padEnd(22)} CREATE ${sub.filter((p) => p.status === "CREATE").length}  REUSE ${sub.filter((p) => p.status === "REUSE").length}  CONFLICT ${sub.filter((p) => p.status === "CONFLICT").length}`);
    }
    if (otherActive) console.log(`PLAN note: the target has another active snapshot (${otherActive.version}) of this course`);
    const conflicts = plans.filter((p) => p.status === "CONFLICT");
    for (const c of conflicts.slice(0, 10)) console.log(`CONFLICT ${c.collection} ${c.key}`);
    if ((conflicts.length || otherActive) && !force) {
      fail(`${conflicts.length} conflicting document(s)${otherActive ? " and a different active snapshot" : ""} in the target database; nothing was written. Use an empty database, or pass --force-overwrite after taking a backup.`);
    }
    if (dryRun) { console.log("DRY_RUN: nothing written"); return; }

    // 3. write
    let created = 0, reused = 0, replaced = 0;
    for (const p of plans) {
      if (p.status === "REUSE") { reused++; continue; }
      if (p.status === "CONFLICT") { await p.model.collection.replaceOne(p.filter, p.doc); replaced++; continue; }
      await p.model.collection.insertOne(p.doc);
      created++;
    }
    if (otherActive && force) await CurriculumSnapshot.collection.updateMany({ courseId: manifest.courseId, version: { $ne: snapshot.version }, isActive: true }, { $set: { isActive: false } });
    console.log(`IMPORT_RESULT CREATED ${created}  REUSED ${reused}  REPLACED ${replaced}  CONFLICT 0`);

    // 4. verify through the real services
    const pointer: any = await CmsCourse.findOne({ courseId: manifest.courseId }).lean();
    const published: any = await cmsService.getPublishedVersionById(manifest.courseId, manifest.sourcePublishedVersion);
    const pc = structureCounts(published.zones);
    const active: any = await CurriculumSnapshot.findOne({ courseId: manifest.courseId, isActive: true }).lean();
    let resolved = 0, tr = 0;
    for (const r of referencedPackages(published.zones)) {
      const pkg: any = await CmsAnimationPackage.findOne({ packageId: r.packageId, revisionId: r.revisionId }).lean();
      if (!pkg || pkg.status !== "frozen" || !pkg.html || !pkg.js) fail(`verification: package ${r.packageId}@${r.revisionId} did not resolve`);
      resolved++;
      if (pkg.packageTrace?.steps?.length) tr++;
    }
    const ids = published.zones.flatMap((z: any) => z.modules.flatMap((m: any) => m.checkpoints.map((c: any) => c.id)));
    if (new Set(ids).size !== ids.length) fail("verification: duplicate checkpoint ids");
    if (pointer.latestPublishedVersion !== manifest.sourcePublishedVersion || active?.version !== manifest.sourcePublishedVersion) fail("verification: published pointer / active snapshot are not the imported version");
    if (pc.zones !== counts.zones || pc.modules !== counts.modules || pc.checkpoints !== counts.checkpoints) fail("verification: imported structure differs");
    console.log(`VERIFY_OK pointer=${pointer.latestPublishedVersion} activeSnapshot=${active.version} zones=${pc.zones} modules=${pc.modules} checkpoints=${pc.checkpoints} packagesResolved=${resolved} packageTraces=${tr}`);
    console.log("NOTE no users, progress or drafts were imported. Create the first admin with: npx tsx scripts/promoteAdmin.ts --email=<registered account>");
  } finally {
    await disconnectFromDatabase();
  }
}

main().catch((e) => { console.error("[import-course-release] STOPPED:", e instanceof Error ? e.message : e); process.exitCode = 1; });
