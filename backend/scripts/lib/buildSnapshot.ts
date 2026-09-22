/**
 * Turns the frontend's course registry into a curriculum snapshot draft.
 *
 * Shared by `seedCurriculum.ts`, which writes it to MongoDB, and
 * `verifyEngineParity.ts`, which builds an in-memory index from it — so the
 * structure both of them reason about is produced by exactly one piece of
 * code.
 *
 * It writes ONLY the ID structure: ids, order, XP, the mastery bonus, the
 * prerequisite graph and a coding-activity flag, plus one short display title
 * per zone and module for the contract's lock messages. `assertStructureOnly`
 * enforces that with a field allowlist and a length cap — plan §6, *the
 * backend never becomes a second curriculum*.
 */

import { createHash } from "node:crypto";

export interface RegistryCheckpoint {
  id: string;
  type: string;
  xp: number;
  masteryXp?: number;
  prerequisites: string[];
  lesson?: { activities?: { type: string }[] };
  workspace?: { codingActivity?: unknown };
}
export interface RegistryModule {
  id: string;
  title: string;
  checkpoints: RegistryCheckpoint[];
}
export interface RegistryZone {
  id: string;
  title: string;
  modules: RegistryModule[];
}
export interface RegistryCourse {
  id: string;
  title: string;
  zones: RegistryZone[];
}

export interface SnapshotDraft {
  courseId: string;
  title: string;
  version: string;
  frontendCommit: string | null;
  structureHash: string;
  zones: { id: string; title: string; order: number; moduleIds: string[] }[];
  modules: { id: string; title: string; zoneId: string; order: number; checkpointIds: string[] }[];
  checkpoints: {
    id: string;
    moduleId: string;
    order: number;
    type: string;
    xp: number;
    masteryXp: number | null;
    prerequisites: string[];
    hasCodingActivity: boolean;
  }[];
}

export function assertRegistryShape(course: unknown): asserts course is RegistryCourse {
  const candidate = course as RegistryCourse;
  if (!candidate?.id || !Array.isArray(candidate.zones)) {
    throw new Error("The frontend registry no longer looks like { id, title, zones[] }. Update scripts/lib/buildSnapshot.ts.");
  }
}

function hasCodingActivity(checkpoint: RegistryCheckpoint): boolean {
  if (checkpoint.workspace?.codingActivity) return true;
  return Boolean(checkpoint.lesson?.activities?.some((activity) => activity.type === "code"));
}

export function buildSnapshotDraft(
  course: RegistryCourse,
  options: { version: string; frontendCommit: string | null },
): SnapshotDraft {
  const zones: SnapshotDraft["zones"] = [];
  const modules: SnapshotDraft["modules"] = [];
  const checkpoints: SnapshotDraft["checkpoints"] = [];

  let moduleOrder = 0;

  course.zones.forEach((zone, zoneIndex) => {
    zones.push({
      id: zone.id,
      title: zone.title,
      order: zoneIndex + 1,
      moduleIds: zone.modules.map((module) => module.id),
    });

    for (const module of zone.modules) {
      moduleOrder += 1;
      modules.push({
        id: module.id,
        title: module.title,
        zoneId: zone.id,
        order: moduleOrder,
        checkpointIds: module.checkpoints.map((checkpoint) => checkpoint.id),
      });

      module.checkpoints.forEach((checkpoint, index) => {
        checkpoints.push({
          id: checkpoint.id,
          moduleId: module.id,
          order: index + 1,
          type: checkpoint.type,
          xp: checkpoint.xp,
          masteryXp: checkpoint.masteryXp ?? null,
          prerequisites: [...checkpoint.prerequisites],
          hasCodingActivity: hasCodingActivity(checkpoint),
        });
      });
    }
  });

  const structureHash = createHash("sha256")
    .update(JSON.stringify({ courseId: course.id, zones, modules, checkpoints }))
    .digest("hex");

  return {
    courseId: course.id,
    title: course.title,
    version: options.version,
    frontendCommit: options.frontendCommit,
    structureHash,
    zones,
    modules,
    checkpoints,
  };
}

const ALLOWED_FIELDS: Record<string, Set<string>> = {
  zone: new Set(["id", "title", "order", "moduleIds"]),
  module: new Set(["id", "title", "zoneId", "order", "checkpointIds"]),
  checkpoint: new Set([
    "id",
    "moduleId",
    "order",
    "type",
    "xp",
    "masteryXp",
    "prerequisites",
    "hasCodingActivity",
  ]),
};

/** The longest string this snapshot may contain. A title is short; prose is not. */
const MAX_STRING = 120;

export function assertStructureOnly(draft: SnapshotDraft): void {
  const problems: string[] = [];

  const check = (kind: keyof typeof ALLOWED_FIELDS, entity: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(entity)) {
      if (!ALLOWED_FIELDS[kind]?.has(key)) {
        problems.push(`${kind} "${String(entity.id)}" carries a disallowed field "${key}"`);
        continue;
      }
      const strings = typeof value === "string" ? [value] : Array.isArray(value) ? value : [];
      for (const entry of strings) {
        if (typeof entry === "string" && entry.length > MAX_STRING) {
          problems.push(`${kind} "${String(entity.id)}" field "${key}" is ${entry.length} chars — looks like content`);
        }
      }
    }
  };

  draft.zones.forEach((zone) => check("zone", zone));
  draft.modules.forEach((module) => check("module", module));
  draft.checkpoints.forEach((checkpoint) => check("checkpoint", checkpoint));

  if (problems.length > 0) {
    throw new Error(
      `Refusing to seed — the snapshot is not structure-only:\n  - ${problems.join("\n  - ")}\n` +
        `The backend stores ids, order, XP and prerequisites. Lesson content stays in the frontend.`,
    );
  }
}

/** Every prerequisite must name a checkpoint that exists, or a lock is unopenable. */
export function assertGraphIsSound(draft: SnapshotDraft): void {
  const ids = new Set(draft.checkpoints.map((checkpoint) => checkpoint.id));
  const problems: string[] = [];

  for (const checkpoint of draft.checkpoints) {
    for (const prerequisite of checkpoint.prerequisites) {
      if (!ids.has(prerequisite)) problems.push(`${checkpoint.id} requires unknown checkpoint "${prerequisite}"`);
      if (prerequisite === checkpoint.id) problems.push(`${checkpoint.id} requires itself`);
    }
  }

  const duplicates = draft.checkpoints
    .map((checkpoint) => checkpoint.id)
    .filter((id, index, all) => all.indexOf(id) !== index);
  if (duplicates.length > 0) problems.push(`duplicate checkpoint ids: ${[...new Set(duplicates)].join(", ")}`);

  if (problems.length > 0) {
    throw new Error(`Refusing to seed — the prerequisite graph is broken:\n  - ${problems.join("\n  - ")}`);
  }
}
