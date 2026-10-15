/**
 * Read-only proof that a narration candidate was carried over EXACTLY: compares every animation package's content and narration
 * (text, trace, manifest, assets, narration records and audio bytes) between a source database's DRAFT revisions and the
 * matching revisions of a destination database (its drafts, or the frozen revisions its published version references).
 *
 *   npx tsx scripts/compareNarrationDrafts.ts --from-db=reagvis_dev --to-db=<db> [--to=draft|published] [--course=<id>]
 *
 * Prints counts (packages, narration entries, audio assets, voice/provider) and exits non-zero on any difference.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const FIELDS = ["title", "manifest", "html", "css", "js", "assets", "packageTrace", "narration", "sourceKind"] as const;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object" && !(value instanceof Date) && !("_bsontype" in (value as object))) {
    const o = value as Record<string, unknown>;
    return `{${Object.keys(o).sort().map((k) => `${JSON.stringify(k)}:${canonical(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}
const digest = (doc: any) => createHash("sha256").update(canonical(Object.fromEntries(FIELDS.map((f) => [f, doc?.[f] ?? null])))).digest("hex");

async function main() {
  const fromDb = arg("from-db") ?? "reagvis_dev";
  const toDb = arg("to-db");
  const to = arg("to") ?? "draft";
  const course = arg("course") ?? "machine-learning-foundations";
  if (!toDb || (toDb === fromDb && to !== "published")) throw new Error("--to-db=<a different database> is required (the same database is only allowed with --to=published: draft vs its own frozen revisions)");
  const src = (await mongoose.createConnection(env.MONGO_URI, { dbName: fromDb, autoIndex: false }).asPromise()).db!;
  const dst = (await mongoose.createConnection(env.MONGO_URI, { dbName: toDb, autoIndex: false }).asPromise()).db!;
  const pk = "cmsAnimationPackages";
  const sources = await src.collection(pk).find({ revisionId: "draft", narration: { $ne: null } }).toArray();
  let refs = new Map<string, string>();
  if (to === "published") {
    const c: any = await dst.collection("cmsCourses").findOne({ courseId: course });
    const v: any = await dst.collection("cmsCourseVersions").findOne({ courseId: course, versionId: c.latestPublishedVersion });
    for (const z of v.zones) for (const m of z.modules) for (const k of m.checkpoints) {
      const a = k.workspace?.animation;
      if (a?.kind === "custom") refs.set(a.packageId, a.revisionId);
    }
    console.log(`DEST published version=${c.latestPublishedVersion} referenced packages=${refs.size}`);
  }
  let equal = 0, narrationSteps = 0, audioAssets = 0, audioBytes = 0, voiceDefault = 0, provider = new Set<string>(), differences: string[] = [];
  for (const s of sources) {
    const revisionId = to === "published" ? refs.get(s.packageId) : "draft";
    if (!revisionId) { differences.push(`${s.packageId}: not referenced by the published version`); continue; }
    if (to === "published" && revisionId === "draft") { differences.push(`${s.packageId}: published version references the DRAFT revision`); continue; }
    const d: any = await dst.collection(pk).findOne({ packageId: s.packageId, revisionId });
    if (!d) { differences.push(`${s.packageId}@${revisionId}: missing in destination`); continue; }
    if (to === "published" && d.status !== "frozen") differences.push(`${s.packageId}@${revisionId}: not frozen`);
    if (digest(s) !== digest(d)) { differences.push(`${s.packageId}@${revisionId}: content/narration differs`); continue; }
    equal++;
    const steps = Object.values(d.narration.steps) as any[];
    narrationSteps += steps.length;
    audioAssets += d.narration.audio.length;
    for (const a of d.narration.audio) audioBytes += Buffer.from(a.dataBase64, "base64").byteLength;
    for (const r of steps) { provider.add(String(r.provider)); if ((r.voice ?? "default") === "default") voiceDefault++; }
  }
  const dup = await dst.collection(pk).aggregate([{ $group: { _id: { p: "$packageId", r: "$revisionId" }, n: { $sum: 1 } } }, { $match: { n: { $gt: 1 } } }]).toArray();
  console.log(`COMPARE from=${fromDb} to=${toDb}(${to}) sourcePackages=${sources.length} identical=${equal} narrationEntries=${narrationSteps} audioAssets=${audioAssets} audioBytes=${audioBytes} providers=${[...provider].join(",")} defaultVoiceEntries=${voiceDefault} duplicateRevisionIds=${dup.length}`);
  for (const d of differences.slice(0, 20)) console.log("DIFF", d);
  await mongoose.disconnect();
  process.exit(differences.length === 0 && equal === sources.length && dup.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
