// Local authoring persistence for the structured DSA CMS draft — entirely
// separate from courseAuthoringRepository.ts (standard CMS courses like
// Python Foundations) and from src/learning/progressRepository.ts (real
// learner progress). Never shares a storage key with either, so nothing
// here can silently clear a standard course, a learner's progress, notes,
// Feedback, or Trail Guide history — see PART 4/22/25 of the task.
//
// Exactly ONE DSA draft exists at a time in this phase (there is exactly
// one static DSA course to draft from). A future phase may generalize this
// to multiple draft versions; the `schemaVersion` field below exists so
// that future shape change can detect and migrate today's stored draft
// instead of silently discarding it.

import type { CreatorCourse } from "../types"
import { importStaticDsaCourse } from "./dsaImporter"

const STORAGE_KEY = "reagvis.creatorStudio.dsaDraft.v1"
const SCHEMA_VERSION = 1

interface StoredDsaDraft {
  schemaVersion: number
  course: CreatorCourse
}

export interface DsaCourseAuthoringRepository {
  /** Returns the persisted draft, or null if none has ever been created. */
  getDraft(): CreatorCourse | null
  /** Deterministically imports the current static DSA course as a fresh
   * draft AND persists it. Callers should only invoke this when
   * `getDraft()` returned null, or in response to an explicit,
   * user-confirmed "Reset Draft" action — never on every read. */
  createDraftFromStatic(): CreatorCourse
  saveDraft(course: CreatorCourse): CreatorCourse
  /** Explicit, destructive-to-edits reset — re-imports the current static
   * DSA course over whatever draft exists. Only ever called after the
   * caller has obtained user confirmation (see DsaEditorShell). */
  resetDraftToStatic(): CreatorCourse
}

function nowIso(): string {
  return new Date().toISOString()
}

export class LocalDsaCourseAuthoringRepository implements DsaCourseAuthoringRepository {
  private memoryFallback: CreatorCourse | null = null

  private readStored(): StoredDsaDraft | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return null
        const parsed = JSON.parse(raw) as StoredDsaDraft
        if (parsed && typeof parsed === "object" && parsed.course) return parsed
        return null
      }
    } catch {
      // storage unavailable / private mode / corrupt JSON — treat as absent
    }
    return null
  }

  private writeStored(course: CreatorCourse): void {
    this.memoryFallback = course
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const stored: StoredDsaDraft = { schemaVersion: SCHEMA_VERSION, course }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      }
    } catch {
      // storage quota / private mode — memory fallback already updated above
    }
  }

  getDraft(): CreatorCourse | null {
    const stored = this.readStored()
    if (stored) return stored.course
    return this.memoryFallback
  }

  createDraftFromStatic(): CreatorCourse {
    const course = importStaticDsaCourse()
    this.writeStored(course)
    return course
  }

  saveDraft(course: CreatorCourse): CreatorCourse {
    const saved: CreatorCourse = { ...course, updatedAt: nowIso() }
    this.writeStored(saved)
    return saved
  }

  resetDraftToStatic(): CreatorCourse {
    const fresh = importStaticDsaCourse()
    this.writeStored(fresh)
    return fresh
  }
}

export const dsaCourseAuthoringRepository: DsaCourseAuthoringRepository = new LocalDsaCourseAuthoringRepository()

/** Loads the existing draft, or creates-and-persists one from the current
 * static DSA course if none exists yet. This is the ONLY place in the
 * editor that may call `createDraftFromStatic()` implicitly — every other
 * caller must go through an explicit, confirmed "Reset Draft" action. */
export function getOrCreateDsaDraft(repository: DsaCourseAuthoringRepository = dsaCourseAuthoringRepository): CreatorCourse {
  const existing = repository.getDraft()
  if (existing) return existing
  return repository.createDraftFromStatic()
}

export interface DsaDashboardSummary {
  zones: number
  modules: number
  checkpoints: number
  hasDraft: boolean
}

/** Read-only peek for the Creator Studio dashboard card — never creates or
 * persists anything. If a draft already exists, its (possibly edited)
 * counts are shown; otherwise a throwaway (unsaved) import is used purely
 * to display the current static baseline before the user has opened the
 * DSA editor even once. */
export function peekDsaDashboardSummary(repository: DsaCourseAuthoringRepository = dsaCourseAuthoringRepository): DsaDashboardSummary {
  const existing = repository.getDraft()
  const course = existing ?? importStaticDsaCourse()
  const zones = course.dsaZones ?? []
  const modules = zones.flatMap(z => z.modules)
  const checkpoints = modules.flatMap(m => m.checkpoints)
  return { zones: zones.length, modules: modules.length, checkpoints: checkpoints.length, hasDraft: Boolean(existing) }
}
