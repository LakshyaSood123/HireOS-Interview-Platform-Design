/**
 * Read-only content digest of ONE published course version: the version's structure plus every frozen package revision it
 * references. Run before and after a publish to prove an older version was not mutated.
 *
 *   npx tsx scripts/digestRelease.ts --db=<database> --version=<versionId> [--course=<id>]
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
  return JSON.stringify(value ?? null);
}

async function main() {
  const db = arg("db");
  const versionId = arg("version");
  const course = arg("course") ?? "machine-learning-foundations";
  if (!db || !versionId) throw new Error("--db=<database> and --version=<versionId> are required");
  const conn = await mongoose.createConnection(env.MONGO_URI, { dbName: db, autoIndex: false }).asPromise();
  const version: any = await conn.db!.collection("cmsCourseVersions").findOne({ courseId: course, versionId });
  if (!version) throw new Error(`no version ${versionId} in ${db}`);
  const refs = new Map<string, string>();
  for (const z of version.zones) for (const m of z.modules) for (const k of m.checkpoints) {
    const a = k.workspace?.animation;
    if (a?.kind === "custom") refs.set(a.packageId, a.revisionId);
  }
  const overall = createHash("sha256");
  overall.update(canonical(version.zones));
  let withNarration = 0, steps = 0, draftRefs = 0;
  for (const [packageId, revisionId] of [...refs.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    if (revisionId === "draft") draftRefs++;
    const p: any = await conn.db!.collection("cmsAnimationPackages").findOne({ packageId, revisionId });
    if (!p) throw new Error(`missing ${packageId}@${revisionId}`);
    const { _id, createdAt, updatedAt, ...rest } = p;
    overall.update(canonical(rest));
    if (p.narration) { withNarration++; steps += Object.keys(p.narration.steps).length; }
  }
  console.log(`DIGEST db=${db} version=${versionId} status=${version.status} packages=${refs.size} draftRefs=${draftRefs} withNarration=${withNarration} narrationSteps=${steps} sha256=${overall.digest("hex").slice(0, 32)}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
