// Stable id generation for NEW draft entities (PART 13 of the task).
// Existing imported zones/modules/checkpoints keep their exact static IDs
// forever — nothing here ever touches those. This file only mints ids for
// entities created fresh inside the draft (+ Add Zone / Module /
// Checkpoint), and verifies they don't collide with anything already in
// the draft.

import type { CreatorCourse } from "../types"

function slugifyId(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
  )
}

function allZoneIds(course: CreatorCourse): Set<string> {
  return new Set((course.dsaZones ?? []).map(z => z.id))
}
function allModuleIds(course: CreatorCourse): Set<string> {
  return new Set((course.dsaZones ?? []).flatMap(z => z.modules.map(m => m.id)))
}
function allCheckpointIds(course: CreatorCourse): Set<string> {
  return new Set((course.dsaZones ?? []).flatMap(z => z.modules.flatMap(m => m.checkpoints.map(cp => cp.id))))
}

/** Slug-based id, deduplicated against everything already in the draft of
 * that kind — `title-2`, `title-3`, etc. on collision, same convention
 * `slugify()` in src/creator/types.ts already establishes for standard CMS
 * courses. Never regenerated once created; callers must persist the
 * returned id on the entity immediately. */
export function generateDsaZoneId(course: CreatorCourse, title: string): string {
  return dedupe(slugifyId(title) || "zone", allZoneIds(course))
}
export function generateDsaModuleId(course: CreatorCourse, title: string): string {
  return dedupe(slugifyId(title) || "module", allModuleIds(course))
}
export function generateDsaCheckpointId(course: CreatorCourse, title: string): string {
  return dedupe(slugifyId(title) || "checkpoint", allCheckpointIds(course))
}

function dedupe(base: string, taken: Set<string>): string {
  if (!taken.has(base)) return base
  let n = 2
  while (taken.has(`${base}-${n}`)) n += 1
  return `${base}-${n}`
}

export interface DsaIdCollision {
  kind: "zone" | "module" | "checkpoint"
  id: string
}

/** Full-draft duplicate-id scan — used by the validation panel (PART 19).
 * A collision here always indicates a real authoring bug (two entities
 * sharing one id), never a legitimate state, since every id-minting path
 * above already dedupes against the draft at creation time. */
export function findDuplicateIds(course: CreatorCourse): DsaIdCollision[] {
  const collisions: DsaIdCollision[] = []
  const seenZones = new Map<string, number>()
  const seenModules = new Map<string, number>()
  const seenCheckpoints = new Map<string, number>()

  for (const zone of course.dsaZones ?? []) {
    seenZones.set(zone.id, (seenZones.get(zone.id) ?? 0) + 1)
    for (const module of zone.modules) {
      seenModules.set(module.id, (seenModules.get(module.id) ?? 0) + 1)
      for (const checkpoint of module.checkpoints) {
        seenCheckpoints.set(checkpoint.id, (seenCheckpoints.get(checkpoint.id) ?? 0) + 1)
      }
    }
  }

  for (const [id, count] of seenZones) if (count > 1) collisions.push({ kind: "zone", id })
  for (const [id, count] of seenModules) if (count > 1) collisions.push({ kind: "module", id })
  for (const [id, count] of seenCheckpoints) if (count > 1) collisions.push({ kind: "checkpoint", id })

  return collisions
}
