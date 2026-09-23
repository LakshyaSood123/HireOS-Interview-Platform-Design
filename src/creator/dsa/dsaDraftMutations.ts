// Pure, side-effect-free mutation helpers for the structured DSA draft.
// Every function takes a CreatorCourse and returns a NEW CreatorCourse —
// callers (DsaEditorShell and friends) own calling repository.saveDraft()
// with the result. Keeping these here (rather than inline in components)
// is what lets every editor share identical archive/reorder/add semantics
// instead of each screen inventing its own slightly-different version.

import type { CreatorCourse } from "../types"
import type { CmsDsaZone, CmsDsaModule, CmsDsaCheckpoint } from "./dsaCmsTypes"
import type { LessonWorkspaceContent } from "../../learning/types"
import { generateDsaZoneId, generateDsaModuleId, generateDsaCheckpointId } from "./dsaId"

function zones(course: CreatorCourse): CmsDsaZone[] {
  return course.dsaZones ?? []
}

function withZones(course: CreatorCourse, dsaZones: CmsDsaZone[]): CreatorCourse {
  return { ...course, dsaZones }
}

/** Reassigns `order` to 0..n-1 by current array position — called after
 * every add/archive/move so order values stay dense and unique (PART 15:
 * "no duplicate order values, no missing/unstable ordering"). Archived
 * entities stay in place in the array (never removed) and still get a
 * normalized order among their siblings — order is positional bookkeeping,
 * not a statement about active/archived state. */
function normalizeOrder<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, i) => (item.order === i ? item : { ...item, order: i }))
}

function moveInArray<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const copy = items.slice()
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

// ── Zones ────────────────────────────────────────────────────────────────

export function addZone(course: CreatorCourse, title: string): CreatorCourse {
  const id = generateDsaZoneId(course, title)
  const newZone: CmsDsaZone = { id, order: zones(course).length, title, description: "", modules: [], state: "active" }
  return withZones(course, normalizeOrder([...zones(course), newZone]))
}

export function updateZone(course: CreatorCourse, zoneId: string, patch: Partial<Pick<CmsDsaZone, "title" | "description">>): CreatorCourse {
  return withZones(course, zones(course).map(z => (z.id === zoneId ? { ...z, ...patch } : z)))
}

export function setZoneState(course: CreatorCourse, zoneId: string, state: CmsDsaZone["state"]): CreatorCourse {
  return withZones(course, zones(course).map(z => (z.id === zoneId ? { ...z, state } : z)))
}

export function moveZone(course: CreatorCourse, zoneId: string, direction: -1 | 1): CreatorCourse {
  const all = zones(course)
  const index = all.findIndex(z => z.id === zoneId)
  if (index === -1) return course
  return withZones(course, normalizeOrder(moveInArray(all, index, direction)))
}

// ── Modules ──────────────────────────────────────────────────────────────

export function addModule(course: CreatorCourse, zoneId: string, title: string): CreatorCourse {
  const zone = zones(course).find(z => z.id === zoneId)
  if (!zone) return course
  const id = generateDsaModuleId(course, title)
  const newModule: CmsDsaModule = {
    id,
    zoneId,
    order: zone.modules.length,
    title,
    description: "",
    icon: "📘",
    accentColor: "#1DB584",
    contentKind: "workspace",
    checkpoints: [],
    state: "active",
  }
  return withZones(
    course,
    zones(course).map(z => (z.id === zoneId ? { ...z, modules: normalizeOrder([...z.modules, newModule]) } : z)),
  )
}

export function updateModule(
  course: CreatorCourse,
  zoneId: string,
  moduleId: string,
  patch: Partial<Pick<CmsDsaModule, "title" | "description" | "icon" | "accentColor">>,
): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z =>
      z.id === zoneId ? { ...z, modules: z.modules.map(m => (m.id === moduleId ? { ...m, ...patch } : m)) } : z,
    ),
  )
}

export function setModuleState(course: CreatorCourse, zoneId: string, moduleId: string, state: CmsDsaModule["state"]): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z =>
      z.id === zoneId ? { ...z, modules: z.modules.map(m => (m.id === moduleId ? { ...m, state } : m)) } : z,
    ),
  )
}

export function moveModule(course: CreatorCourse, zoneId: string, moduleId: string, direction: -1 | 1): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      const index = z.modules.findIndex(m => m.id === moduleId)
      if (index === -1) return z
      return { ...z, modules: normalizeOrder(moveInArray(z.modules, index, direction)) }
    }),
  )
}

// ── Checkpoints ──────────────────────────────────────────────────────────

const EMPTY_WORKSPACE: LessonWorkspaceContent = { title: "New Checkpoint", theory: [] }

export function addCheckpoint(course: CreatorCourse, zoneId: string, moduleId: string, title: string): CreatorCourse {
  const id = generateDsaCheckpointId(course, title)
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      return {
        ...z,
        modules: z.modules.map(m => {
          if (m.id !== moduleId) return m
          const newCheckpoint: CmsDsaCheckpoint = {
            id,
            moduleId,
            order: m.checkpoints.length,
            title,
            subtitle: "",
            type: "lesson",
            xp: 30,
            prerequisites: [],
            workspace: { ...EMPTY_WORKSPACE, title },
            state: "active",
          }
          return { ...m, checkpoints: normalizeOrder([...m.checkpoints, newCheckpoint]) }
        }),
      }
    }),
  )
}

export function updateCheckpoint(
  course: CreatorCourse,
  zoneId: string,
  moduleId: string,
  checkpointId: string,
  updated: CmsDsaCheckpoint,
): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      return {
        ...z,
        modules: z.modules.map(m => {
          if (m.id !== moduleId) return m
          return { ...m, checkpoints: m.checkpoints.map(cp => (cp.id === checkpointId ? updated : cp)) }
        }),
      }
    }),
  )
}

export function setCheckpointState(
  course: CreatorCourse,
  zoneId: string,
  moduleId: string,
  checkpointId: string,
  state: CmsDsaCheckpoint["state"],
): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      return {
        ...z,
        modules: z.modules.map(m => {
          if (m.id !== moduleId) return m
          return { ...m, checkpoints: m.checkpoints.map(cp => (cp.id === checkpointId ? { ...cp, state } : cp)) }
        }),
      }
    }),
  )
}

export function moveCheckpoint(course: CreatorCourse, zoneId: string, moduleId: string, checkpointId: string, direction: -1 | 1): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      return {
        ...z,
        modules: z.modules.map(m => {
          if (m.id !== moduleId) return m
          const index = m.checkpoints.findIndex(cp => cp.id === checkpointId)
          if (index === -1) return m
          return { ...m, checkpoints: normalizeOrder(moveInArray(m.checkpoints, index, direction)) }
        }),
      }
    }),
  )
}

/** A newly-created draft entity that has never existed in a published
 * version may be hard-removed from the draft (PART 14) — the caller is
 * responsible for only offering this for entities it knows are new-in-draft
 * (see DsaModuleEditor/DsaZoneEditor's "isNew" check against the imported
 * static id set). Existing imported entities must go through
 * setZoneState/setModuleState/setCheckpointState ("archived") instead —
 * this function does not distinguish the two itself. */
export function hardRemoveCheckpoint(course: CreatorCourse, zoneId: string, moduleId: string, checkpointId: string): CreatorCourse {
  return withZones(
    course,
    zones(course).map(z => {
      if (z.id !== zoneId) return z
      return {
        ...z,
        modules: z.modules.map(m => {
          if (m.id !== moduleId) return m
          return { ...m, checkpoints: normalizeOrder(m.checkpoints.filter(cp => cp.id !== checkpointId)) }
        }),
      }
    }),
  )
}
