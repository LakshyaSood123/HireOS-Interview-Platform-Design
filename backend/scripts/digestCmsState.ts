/**
 * Read-only fingerprint of the CMS collections, per course, so a change can prove it left existing courses untouched.
 *
 *   npx tsx scripts/digestCmsState.ts --db=<database> [--exclude-course=<id>[,<id>...]]
 *
 * For every cmsCourses document, version, curriculum snapshot and animation package that belongs to a course (packages are
 * attributed through the versions that reference them), prints one sha256 per course. Courses named in --exclude-course (for
 * example a brand-new QA course) are skipped, so the output of "before" and "after" runs can be compared line for line.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object" && !(value instanceof Date) && !("_bsontype" in (value as object))) {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (value && typeof value === "object") return JSON.stringify(String(value)); // ObjectId and other BSON scalars
  return JSON.stringify(value ?? null);
}

async function main() {
  const db = arg("db") ?? env.MONGO_DB_NAME;
  const exclude = new Set((arg("exclude-course") ?? "").split(",").filter(Boolean));
  const conn = await mongoose.createConnection(env.MONGO_URI, { dbName: db, autoIndex: false }).asPromise();
  const d = conn.db!;
  const courses = (await d.collection("cmsCourses").find().toArray()).filter((c: any) => !exclude.has(c.courseId));
  for (const c of courses.sort((a: any, b: any) => a.courseId.localeCompare(b.courseId))) {
    const h = createHash("sha256");
    h.update(canonical(c));
    const versions = await d.collection("cmsCourseVersions").find({ courseId: c.courseId }).sort({ versionId: 1 }).toArray();
    for (const v of versions) h.update(canonical(v));
    const snaps = await d.collection("curriculumSnapshots").find({ courseId: c.courseId }).sort({ version: 1 }).toArray();
    for (const s of snaps) h.update(canonical(s));
    const refs = new Set<string>();
    for (const v of versions as any[]) for (const z of v.zones ?? []) for (const m of z.modules ?? []) for (const k of m.checkpoints ?? []) {
      const a = k.workspace?.animation;
      if (a?.kind === "custom") refs.add(`${a.packageId}@${a.revisionId}`);
    }
    for (const key of [...refs].sort()) {
      const [packageId, revisionId] = key.split("@");
      const p = await d.collection("cmsAnimationPackages").findOne({ packageId, revisionId });
      if (p) h.update(canonical(p));
    }
    console.log(`COURSE ${c.courseId} versions=${versions.length} snapshots=${snaps.length} packages=${refs.size} sha256=${h.digest("hex").slice(0, 32)}`);
  }
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
