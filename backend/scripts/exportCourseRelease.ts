/**
 * Read-only export of ONE published course version as a sanitized, portable "course release".
 *
 *   npx tsx scripts/exportCourseRelease.ts --course=<courseId> --version=<published version> --out=<dir>
 *
 * Writes (deterministically — same source data gives byte-identical files apart from manifest.exportedAt):
 *   manifest.json          format/schema version, counts, sha256 of every file
 *   course.json            the cmsCourses pointer (published pointer = this version, no draft pointer)
 *   version.json           the published cmsCourseVersions document
 *   snapshot.json          the matching curriculumSnapshots document (marked active)
 *   packages/<id>@<rev>.json   every frozen animation package revision the version references
 *
 * Never exports users, auth tokens, progress, XP, notes, attempts, reward events or drafts, and replaces every
 * user reference with a placeholder. Writes nothing to MongoDB. Fails loudly on any incomplete state.
 */
import { mkdirSync, readdirSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CurriculumSnapshot } from "../src/modules/curriculum/curriculum.model.js";
import { validatePackageTraceAgainstManifest } from "../src/modules/cms/animationPackage.service.js";
import {
  RELEASE_FORMAT, RELEASE_SCHEMA_VERSION, fileNameForPackage, referencedPackages, scrubActors, sha256, structureCounts, toEjsonText,
  type ReleaseManifest,
} from "./lib/courseRelease.js";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
function fail(message: string): never { throw new Error(message); }

async function main() {
  const courseId = arg("course") ?? fail("--course=<courseId> is required");
  const version = arg("version") ?? fail("--version=<published version id> is required (no implicit default)");
  const out = path.resolve(arg("out") ?? fail("--out=<directory> is required"));

  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const course: any = await CmsCourse.findOne({ courseId }).lean() ?? fail(`no cmsCourses document for "${courseId}"`);
    const ver: any = await CmsCourseVersion.findOne({ courseId, versionId: version }).lean() ?? fail(`no version "${version}" of "${courseId}"`);
    if (ver.status !== "published" && ver.status !== "archived") fail(`version "${version}" is "${ver.status}"; only published versions can be released`);
    const snapshot: any = await CurriculumSnapshot.findOne({ courseId, version }).lean() ?? fail(`no curriculum snapshot for ${courseId}@${version}`);

    const counts = structureCounts(ver.zones);
    if (snapshot.zones.length !== counts.zones || snapshot.modules.length !== counts.modules || snapshot.checkpoints.length !== counts.checkpoints) {
      fail(`snapshot structure (${snapshot.zones.length}/${snapshot.modules.length}/${snapshot.checkpoints.length}) does not match the version (${counts.zones}/${counts.modules}/${counts.checkpoints})`);
    }

    // Every referenced package revision must exist, be frozen, and carry a valid Package Trace.
    const refs = referencedPackages(ver.zones);
    const unique = new Map(refs.map((r) => [`${r.packageId}@${r.revisionId}`, r]));
    const packages: any[] = [];
    let traces = 0;
    for (const [key, r] of [...unique.entries()].sort(([a], [b]) => a.localeCompare(b))) {
      const pkg: any = await CmsAnimationPackage.findOne({ packageId: r.packageId, revisionId: r.revisionId }).lean() ?? fail(`referenced package ${key} (checkpoint ${r.checkpointId}) is missing`);
      if (pkg.status !== "frozen") fail(`referenced package ${key} is "${pkg.status}", not frozen`);
      if (!pkg.packageTrace?.steps?.length) fail(`package ${key} has no Package Trace`);
      validatePackageTraceAgainstManifest(pkg.packageTrace, pkg.manifest.traceEvents);
      traces++;
      packages.push(scrubActors({ ...pkg, lastFrozenRevisionId: null, lastFrozenContentHash: null }));
    }

    const exportedCourse = { ...course, latestDraftVersion: null, latestPublishedVersion: version };
    const files: Record<string, string> = {};
    const fileText: Record<string, string> = {
      "course.json": toEjsonText(scrubActors(exportedCourse)),
      "version.json": toEjsonText(scrubActors(ver)),
      "snapshot.json": toEjsonText({ ...snapshot, isActive: true }),
    };
    for (const pkg of packages) fileText[fileNameForPackage(pkg.packageId, pkg.revisionId)] = toEjsonText(pkg);
    for (const [name, text] of Object.entries(fileText)) files[name] = sha256(text);

    const manifest: ReleaseManifest = {
      format: RELEASE_FORMAT,
      schemaVersion: RELEASE_SCHEMA_VERSION,
      courseId,
      title: String(ver.title),
      sourcePublishedVersion: version,
      exportedAt: new Date().toISOString(),
      expected: { ...counts, packages: packages.length, packageTraces: traces },
      files: Object.fromEntries(Object.entries(files).sort(([a], [b]) => a.localeCompare(b))),
      excludes: ["users", "refreshTokens", "courseProgress", "rewardEvents", "learningAttempts", "notes", "drafts", "draft package revisions"],
    };

    mkdirSync(path.join(out, "packages"), { recursive: true });
    if (existsSync(path.join(out, "packages"))) for (const f of readdirSync(path.join(out, "packages"))) if (!(`packages/${f}` in fileText)) fail(`${out}/packages/${f} is not part of this export; use an empty --out directory`);
    for (const [name, text] of Object.entries(fileText)) writeFileSync(path.join(out, name), text);
    writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

    console.log(`EXPORT_OK course=${courseId} version=${version} -> ${out}`);
    console.log(`COUNTS zones=${counts.zones} modules=${counts.modules} checkpoints=${counts.checkpoints} packages=${packages.length} traces=${traces} files=${Object.keys(files).length + 1}`);
    console.log("EXCLUDED users/auth/progress/xp/notes/drafts; actor ids scrubbed");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((e) => { console.error("[export-course-release] STOPPED:", e instanceof Error ? e.message : e); process.exitCode = 1; });
