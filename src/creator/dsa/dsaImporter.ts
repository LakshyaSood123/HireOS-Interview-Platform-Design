// Deterministic importer: static DSA curriculum -> CMS DSA course model.
//
// Reads ONLY through the existing courseRegistry.ts lookup surface (never
// reaches into content/*.ts files directly) so this stays correct as new
// modules are authored, and never re-derives or regenerates any id —
// every zone/module/checkpoint id is copied verbatim from the live course.
// Array order (zones within course, modules within zone, checkpoints
// within module) becomes the explicit `order` field, since the source
// types encode order only positionally.
//
// Pure function of the current course registry — no I/O, no randomness, no
// wall-clock reads for anything that participates in the lossless
// comparison (PART 9 of the task). `createdAt`/`updatedAt` use a fixed
// constant rather than `Date.now()` so repeated imports are byte-for-byte
// identical, which is what "deterministic" means for a diffable CMS
// record — a real backend will stamp real authorship timestamps later.

import { getCourseById } from "../../learning/courseRegistry"
import type { Checkpoint, Module, Zone } from "../../learning/types"
import type { CreatorCourse } from "../types"
import type { CmsDsaZone, CmsDsaModule, CmsDsaCheckpoint } from "./dsaCmsTypes"

const IMPORT_TIMESTAMP = "2026-01-01T00:00:00.000Z"

/** The only static DSA course that exists today — see courseRegistry.ts.
 * Hardcoding this id (rather than accepting a parameter) keeps the
 * importer's signature honest: there is exactly one source course in this
 * phase, and callers that need a different one don't exist yet. */
const STATIC_DSA_COURSE_ID = "dsa-foundations"

function importCheckpoint(checkpoint: Checkpoint, moduleId: string, order: number): CmsDsaCheckpoint {
  return {
    id: checkpoint.id,
    moduleId,
    order,
    title: checkpoint.title,
    subtitle: checkpoint.subtitle,
    type: checkpoint.type,
    xp: checkpoint.xp,
    masteryXp: checkpoint.masteryXp,
    prerequisites: [...checkpoint.prerequisites],
    legacyNodeId: checkpoint.legacyNodeId,
    lesson: checkpoint.lesson,
    workspace: checkpoint.workspace,
    questionIds: checkpoint.questionIds ? [...checkpoint.questionIds] : undefined,
    state: "active",
  }
}

function importModule(module: Module, zoneId: string, order: number): CmsDsaModule {
  return {
    id: module.id,
    zoneId,
    order,
    title: module.title,
    description: module.description,
    icon: module.icon,
    accentColor: module.accentColor,
    contentKind: module.contentKind,
    checkpoints: module.checkpoints.map((cp, i) => importCheckpoint(cp, module.id, i)),
    state: "active",
  }
}

function importZone(zone: Zone, order: number): CmsDsaZone {
  return {
    id: zone.id,
    order,
    title: zone.title,
    description: zone.description,
    modules: zone.modules.map((module, i) => importModule(module, zone.id, i)),
    state: "active",
  }
}

/** Deterministically imports the current static DSA course into the CMS
 * DSA model, wrapped in a `CreatorCourse` with `courseType:
 * "structured-dsa"`. Does NOT touch localStorage, the authoring
 * repository, or any live runtime state — this is a pure transform callers
 * (verification scripts today; a future "Import DSA into Creator Studio"
 * action later) can invoke and inspect. */
export function importStaticDsaCourse(): CreatorCourse {
  const course = getCourseById(STATIC_DSA_COURSE_ID)
  if (!course) {
    throw new Error(`dsaImporter: static course "${STATIC_DSA_COURSE_ID}" not found in courseRegistry`)
  }

  const dsaZones: CmsDsaZone[] = course.zones.map((zone, i) => importZone(zone, i))

  return {
    id: course.id,
    slug: course.id,
    version: 1,
    status: "draft",
    courseType: "structured-dsa",
    title: course.title,
    shortDescription: course.description,
    description: course.description,
    category: "Computer Science",
    difficulty: "Intermediate",
    duration: undefined,
    instructor: course.provider,
    tags: ["dsa", "algorithms", "data-structures"],
    accentColor: "#1DB584",
    modules: [],
    dsaZones,
    createdAt: IMPORT_TIMESTAMP,
    updatedAt: IMPORT_TIMESTAMP,
  }
}
