/**
 * Shared pieces of the sanitized course-release export/import (see
 * deployment/course-bootstrap/README.md).
 *
 * A "course release" is exactly the data a fresh database needs so that learners can register, be pinned
 * to one published version and study it — and nothing else:
 *
 *   cmsCourses            1 pointer document (draft pointer cleared, published pointer = the exported version)
 *   cmsCourseVersions     the ONE published version document
 *   curriculumSnapshots   the matching active snapshot (the structure learners are pinned to)
 *   cmsAnimationPackages  every FROZEN package revision that version references
 *
 * No users, refresh tokens, progress, XP, notes, attempts, reward events or drafts are ever exported.
 * Documents are serialized as canonical EJSON so ObjectIds, Dates and numeric types round-trip exactly.
 */
import { createHash } from "node:crypto";
import mongoose from "mongoose";

export const RELEASE_FORMAT = "reagvis-course-release";
export const RELEASE_SCHEMA_VERSION = 1;
/** Replaces every user reference (createdBy / updatedBy) in an export, so no account id leaves the source DB. */
export const ACTOR_PLACEHOLDER = "000000000000000000000000";

// `mongoose.mongo.BSON` is the bson package bundled with the driver mongoose uses.
const { EJSON, ObjectId } = (mongoose.mongo as any).BSON as { EJSON: any; ObjectId: any };
export { ObjectId };

export function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

/** Recursively sort object keys so the same document always serializes to the same bytes. */
export function sortKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map(sortKeys) as unknown as T;
  if (value && typeof value === "object" && !(value as any)._bsontype && !(value instanceof Date)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as object).sort()) out[key] = sortKeys((value as any)[key]);
    return out as T;
  }
  return value;
}

export function toEjsonText(doc: unknown): string {
  return JSON.stringify(sortKeys(EJSON.serialize(doc, { relaxed: false })), null, 2) + "\n";
}

export function fromEjsonText(text: string): any {
  return EJSON.deserialize(JSON.parse(text), { relaxed: false });
}

/** Replaces user ids with the placeholder. Returns a deep copy. */
export function scrubActors<T extends Record<string, any>>(doc: T): T {
  const copy: any = JSON.parse(JSON.stringify(EJSON.serialize(doc, { relaxed: false })));
  for (const key of ["createdBy", "updatedBy"]) if (copy[key]) copy[key] = { $oid: ACTOR_PLACEHOLDER };
  return EJSON.deserialize(copy, { relaxed: false });
}

/** Canonical comparison text for a document, ignoring Mongo bookkeeping and the actor fields. */
export function comparable(doc: Record<string, any>, ignore: string[] = []): string {
  const copy: any = JSON.parse(JSON.stringify(EJSON.serialize(doc, { relaxed: false })));
  delete copy.__v;
  delete copy.createdBy;
  delete copy.updatedBy;
  for (const key of ignore) delete copy[key];
  return JSON.stringify(sortKeys(copy));
}

/** All `{ kind: "custom", packageId, revisionId }` animation references in a version document. */
export function referencedPackages(zones: any[]): { checkpointId: string; packageId: string; revisionId: string }[] {
  const refs: { checkpointId: string; packageId: string; revisionId: string }[] = [];
  for (const zone of zones) for (const mod of zone.modules) for (const cp of mod.checkpoints) {
    const a = cp.workspace?.animation;
    if (a && a.kind === "custom") refs.push({ checkpointId: cp.id, packageId: a.packageId, revisionId: a.revisionId });
  }
  return refs;
}

export function structureCounts(zones: any[]) {
  const modules = zones.flatMap((z) => z.modules);
  const checkpoints = modules.flatMap((m: any) => m.checkpoints);
  return { zones: zones.length, modules: modules.length, checkpoints: checkpoints.length };
}

export const fileNameForPackage = (packageId: string, revisionId: string) => `packages/${packageId}@${revisionId}.json`;

export interface ReleaseManifest {
  format: typeof RELEASE_FORMAT;
  schemaVersion: number;
  courseId: string;
  title: string;
  sourcePublishedVersion: string;
  exportedAt: string;
  expected: { zones: number; modules: number; checkpoints: number; packages: number; packageTraces: number };
  /** sha256 of every file's exact bytes, keyed by relative path. */
  files: Record<string, string>;
  excludes: string[];
}
