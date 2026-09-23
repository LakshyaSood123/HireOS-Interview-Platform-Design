// Round-trip adapter: CMS DSA course model -> canonical learner structures.
//
// This is the INVERSE of dsaImporter.ts, used ONLY for lossless-round-trip
// verification in this phase (PART 8 of the task) — nothing in the live
// product calls this yet, and it does not touch AppStateContext, the
// progress engine, or courseRegistry.ts's own `dsaCourse` singleton. A
// later phase may wire this into an actual "structured-dsa courses render
// through the same learner Course type" path; today it exists purely to
// prove `adapter(importer(liveCourse))` reproduces `liveCourse` exactly.
//
// `order` fields drive array position on the way out — the inverse of how
// the importer turned position into `order` on the way in — so id/order
// pairs round-trip losslessly even if a CMS edit reorders entries.

import type { Course, Zone, Module, Checkpoint } from "../../learning/types"
import type { CreatorCourse } from "../types"
import type { CmsDsaZone, CmsDsaModule, CmsDsaCheckpoint } from "./dsaCmsTypes"

function byOrder<T extends { order: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => a.order - b.order)
}

function adaptCheckpoint(cp: CmsDsaCheckpoint): Checkpoint {
  const checkpoint: Checkpoint = {
    id: cp.id,
    title: cp.title,
    subtitle: cp.subtitle,
    type: cp.type,
    xp: cp.xp,
    prerequisites: [...cp.prerequisites],
  }
  if (cp.masteryXp !== undefined) checkpoint.masteryXp = cp.masteryXp
  if (cp.legacyNodeId !== undefined) checkpoint.legacyNodeId = cp.legacyNodeId
  if (cp.lesson !== undefined) checkpoint.lesson = cp.lesson
  if (cp.workspace !== undefined) checkpoint.workspace = cp.workspace
  if (cp.questionIds !== undefined) checkpoint.questionIds = [...cp.questionIds]
  return checkpoint
}

function adaptModule(module: CmsDsaModule): Module {
  const result: Module = {
    id: module.id,
    title: module.title,
    description: module.description,
    icon: module.icon,
    accentColor: module.accentColor,
    checkpoints: byOrder(module.checkpoints).map(adaptCheckpoint),
  }
  if (module.contentKind !== undefined) result.contentKind = module.contentKind
  return result
}

function adaptZone(zone: CmsDsaZone): Zone {
  return {
    id: zone.id,
    title: zone.title,
    description: zone.description,
    modules: byOrder(zone.modules).map(adaptModule),
  }
}

/** Rebuilds the canonical learner `Course` from a `CreatorCourse` whose
 * `courseType === "structured-dsa"`. Throws if given a standard course —
 * this adapter is DSA-specific by design (PART 2: "do not create a second
 * DSA learner renderer" cuts both ways, this must never silently accept
 * non-DSA CMS content and produce something that looks like it). */
export function cmsDsaCourseToLearnerCourse(cmsCourse: CreatorCourse): Course {
  if (cmsCourse.courseType !== "structured-dsa" || !cmsCourse.dsaZones) {
    throw new Error("cmsDsaCourseToLearnerCourse: course is not a structured-dsa course with dsaZones")
  }

  return {
    id: cmsCourse.id,
    title: cmsCourse.title,
    description: cmsCourse.description ?? cmsCourse.shortDescription,
    provider: cmsCourse.instructor,
    zones: byOrder(cmsCourse.dsaZones).map(adaptZone),
  }
}
