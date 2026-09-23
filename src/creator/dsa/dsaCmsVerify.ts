// Deterministic lossless round-trip verification (PART 9 of the task).
//
// Compares the LIVE static DSA course against
// `cmsDsaCourseToLearnerCourse(importStaticDsaCourse())` field-by-field —
// not a single blind JSON.stringify diff, so a real mismatch is reported
// with the exact path that differs rather than "objects are not equal".

import { getCourseById } from "../../learning/courseRegistry"
import type { Course, Checkpoint, Module, Zone } from "../../learning/types"
import { importStaticDsaCourse } from "./dsaImporter"
import { cmsDsaCourseToLearnerCourse } from "./dsaCmsAdapter"

export interface FieldMismatch {
  path: string
  expected: unknown
  actual: unknown
}

export interface DsaLosslessReport {
  zoneCountOriginal: number
  zoneCountRoundTrip: number
  moduleCountOriginal: number
  moduleCountRoundTrip: number
  checkpointCountOriginal: number
  checkpointCountRoundTrip: number
  zoneIdsMatch: boolean
  moduleIdsMatch: boolean
  checkpointIdsMatch: boolean
  zoneOrderMatches: boolean
  moduleOrderMatches: boolean
  checkpointOrderMatches: boolean
  mismatches: FieldMismatch[]
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (typeof a !== typeof b) return false
  if (a === null || b === null) return a === b
  if (typeof a !== "object") return false
  const aKeys = Object.keys(a as Record<string, unknown>)
  const bKeys = Object.keys(b as Record<string, unknown>)
  if (aKeys.length !== bKeys.length) return false
  return aKeys.every(key => deepEqual((a as any)[key], (b as any)[key]))
}

function compareField(path: string, expected: unknown, actual: unknown, mismatches: FieldMismatch[]): void {
  if (!deepEqual(expected, actual)) {
    mismatches.push({ path, expected, actual })
  }
}

function compareCheckpoint(path: string, original: Checkpoint, roundTrip: Checkpoint, mismatches: FieldMismatch[]): void {
  compareField(`${path}.id`, original.id, roundTrip.id, mismatches)
  compareField(`${path}.title`, original.title, roundTrip.title, mismatches)
  compareField(`${path}.subtitle`, original.subtitle, roundTrip.subtitle, mismatches)
  compareField(`${path}.type`, original.type, roundTrip.type, mismatches)
  compareField(`${path}.xp`, original.xp, roundTrip.xp, mismatches)
  compareField(`${path}.masteryXp`, original.masteryXp, roundTrip.masteryXp, mismatches)
  compareField(`${path}.prerequisites`, original.prerequisites, roundTrip.prerequisites, mismatches)
  compareField(`${path}.legacyNodeId`, original.legacyNodeId, roundTrip.legacyNodeId, mismatches)
  compareField(`${path}.lesson`, original.lesson, roundTrip.lesson, mismatches)
  compareField(`${path}.workspace`, original.workspace, roundTrip.workspace, mismatches)
  compareField(`${path}.questionIds`, original.questionIds, roundTrip.questionIds, mismatches)
  // Animation / Code Trace reference specifically — called out separately
  // per PART 5/9 even though it's already covered by the `.workspace`
  // comparison above, since a silent animation-id drift is the single
  // highest-consequence possible mismatch (it would desync Trail Guide's
  // runtime context and the Code Trace panel from the visual).
  compareField(`${path}.workspace.animation.id`, original.workspace?.animation?.id, roundTrip.workspace?.animation?.id, mismatches)
}

function compareModule(path: string, original: Module, roundTrip: Module, mismatches: FieldMismatch[]): void {
  compareField(`${path}.id`, original.id, roundTrip.id, mismatches)
  compareField(`${path}.title`, original.title, roundTrip.title, mismatches)
  compareField(`${path}.description`, original.description, roundTrip.description, mismatches)
  compareField(`${path}.icon`, original.icon, roundTrip.icon, mismatches)
  compareField(`${path}.accentColor`, original.accentColor, roundTrip.accentColor, mismatches)
  compareField(`${path}.contentKind`, original.contentKind, roundTrip.contentKind, mismatches)
  compareField(`${path}.checkpoints.length`, original.checkpoints.length, roundTrip.checkpoints.length, mismatches)

  const maxLen = Math.max(original.checkpoints.length, roundTrip.checkpoints.length)
  for (let i = 0; i < maxLen; i++) {
    const o = original.checkpoints[i]
    const r = roundTrip.checkpoints[i]
    if (!o || !r) {
      mismatches.push({ path: `${path}.checkpoints[${i}]`, expected: o?.id, actual: r?.id })
      continue
    }
    compareCheckpoint(`${path}.checkpoints[${i}]`, o, r, mismatches)
  }
}

function compareZone(path: string, original: Zone, roundTrip: Zone, mismatches: FieldMismatch[]): void {
  compareField(`${path}.id`, original.id, roundTrip.id, mismatches)
  compareField(`${path}.title`, original.title, roundTrip.title, mismatches)
  compareField(`${path}.description`, original.description, roundTrip.description, mismatches)
  compareField(`${path}.modules.length`, original.modules.length, roundTrip.modules.length, mismatches)

  const maxLen = Math.max(original.modules.length, roundTrip.modules.length)
  for (let i = 0; i < maxLen; i++) {
    const o = original.modules[i]
    const r = roundTrip.modules[i]
    if (!o || !r) {
      mismatches.push({ path: `${path}.modules[${i}]`, expected: o?.id, actual: r?.id })
      continue
    }
    compareModule(`${path}.modules[${i}]`, o, r, mismatches)
  }
}

function flattenModules(course: Course): Module[] {
  return course.zones.flatMap(z => z.modules)
}

function flattenCheckpoints(course: Course): Checkpoint[] {
  return course.zones.flatMap(z => z.modules.flatMap(m => m.checkpoints))
}

export function verifyDsaLosslessRoundTrip(): DsaLosslessReport {
  const original = getCourseById("dsa-foundations")
  if (!original) throw new Error("verifyDsaLosslessRoundTrip: static DSA course not found")

  const cmsCourse = importStaticDsaCourse()
  const roundTrip = cmsDsaCourseToLearnerCourse(cmsCourse)

  const mismatches: FieldMismatch[] = []
  compareField("course.id", original.id, roundTrip.id, mismatches)
  compareField("course.title", original.title, roundTrip.title, mismatches)
  compareField("course.description", original.description, roundTrip.description, mismatches)
  compareField("course.provider", original.provider, roundTrip.provider, mismatches)
  compareField("course.zones.length", original.zones.length, roundTrip.zones.length, mismatches)

  const maxZones = Math.max(original.zones.length, roundTrip.zones.length)
  for (let i = 0; i < maxZones; i++) {
    const o = original.zones[i]
    const r = roundTrip.zones[i]
    if (!o || !r) {
      mismatches.push({ path: `course.zones[${i}]`, expected: o?.id, actual: r?.id })
      continue
    }
    compareZone(`course.zones[${i}]`, o, r, mismatches)
  }

  const originalModules = flattenModules(original)
  const roundTripModules = flattenModules(roundTrip)
  const originalCheckpoints = flattenCheckpoints(original)
  const roundTripCheckpoints = flattenCheckpoints(roundTrip)

  const idsEqual = (a: string[], b: string[]) => a.length === b.length && a.every((id, i) => id === b[i])

  return {
    zoneCountOriginal: original.zones.length,
    zoneCountRoundTrip: roundTrip.zones.length,
    moduleCountOriginal: originalModules.length,
    moduleCountRoundTrip: roundTripModules.length,
    checkpointCountOriginal: originalCheckpoints.length,
    checkpointCountRoundTrip: roundTripCheckpoints.length,
    zoneIdsMatch: idsEqual(original.zones.map(z => z.id), roundTrip.zones.map(z => z.id)),
    moduleIdsMatch: idsEqual(originalModules.map(m => m.id), roundTripModules.map(m => m.id)),
    checkpointIdsMatch: idsEqual(originalCheckpoints.map(c => c.id), roundTripCheckpoints.map(c => c.id)),
    zoneOrderMatches: idsEqual(original.zones.map(z => z.id), roundTrip.zones.map(z => z.id)),
    moduleOrderMatches: idsEqual(originalModules.map(m => m.id), roundTripModules.map(m => m.id)),
    checkpointOrderMatches: idsEqual(originalCheckpoints.map(c => c.id), roundTripCheckpoints.map(c => c.id)),
    mismatches,
  }
}
