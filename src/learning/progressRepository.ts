// Single localStorage abstraction for learner progress. Nothing outside this
// file should call `localStorage` directly for progress — AppStateContext
// goes through `ProgressRepository` so swapping `LocalProgressRepository`
// for a future `ApiProgressRepository` (once a real backend exists) doesn't
// require touching any UI component.

import type { LearnerProgressState } from "./progressEngine"

export interface ProgressRepository {
  load(courseId: string): LearnerProgressState | null
  save(state: LearnerProgressState): void
  reset(courseId: string): void
}

const STORAGE_PREFIX = "reagvis.progress."

/** Old-model checkpoint id -> which new-model module's checkpoints it
 * belongs to. Foundations/Linked Structures/Recursion were re-authored from
 * 3/3/2 bare-numeric legacy TrailNode ids ("1"-"8") into 5 checkpoints each
 * with descriptive ids ("foundations-1", etc.) in the DSA course-expansion
 * task. Anyone who has local progress from before that change has
 * `completedCheckpointIds`/`activeCheckpointId` referencing ids that no
 * longer exist in the registry — `migrateLegacyCheckpointIds` below detects
 * and rewrites them rather than silently discarding that progress. Trees
 * ("trees-1".."trees-5") was already migrated once (Trees vertical slice)
 * and needs no further change here. */
const LEGACY_CHECKPOINT_TO_MODULE: Record<string, string> = {
  "1": "foundations",
  "2": "foundations",
  "3": "foundations",
  "4": "linked-structures",
  "5": "linked-structures",
  "6": "linked-structures",
  "7": "recursion",
  "8": "recursion",
}

const NEW_MODULE_CHECKPOINT_COUNT: Record<string, number> = {
  foundations: 5,
  "linked-structures": 5,
  recursion: 5,
}

function isLegacyId(id: string): boolean {
  return id in LEGACY_CHECKPOINT_TO_MODULE
}

/** Rewrites any pre-course-expansion bare-numeric checkpoint ids in a
 * persisted progress snapshot to the new descriptive ids, marking the
 * migrated module's checkpoints as fully completed (the old ids only ever
 * meant "this module is done" in the demo bootstrap — there's no finer-
 * grained per-checkpoint history to preserve). A no-op for progress that's
 * already on the new ids. Structural detection, not a version field: the
 * only shape that ever needs migrating is "contains a bare '1'-'8' id." */
export function migrateLegacyCheckpointIds(state: LearnerProgressState): LearnerProgressState {
  const legacyIdsPresent = state.completedCheckpointIds.some(isLegacyId) || (state.activeCheckpointId ? isLegacyId(state.activeCheckpointId) : false)
  if (!legacyIdsPresent) return state

  const migratedModuleIds = new Set(
    state.completedCheckpointIds.filter(isLegacyId).map(id => LEGACY_CHECKPOINT_TO_MODULE[id]),
  )

  const completedCheckpointIds = [
    ...state.completedCheckpointIds.filter(id => !isLegacyId(id)),
    ...Array.from(migratedModuleIds).flatMap(moduleId =>
      Array.from({ length: NEW_MODULE_CHECKPOINT_COUNT[moduleId] ?? 0 }, (_, i) => `${moduleId}-${i + 1}`),
    ),
  ]

  const activeCheckpointId =
    state.activeCheckpointId && isLegacyId(state.activeCheckpointId)
      ? `${LEGACY_CHECKPOINT_TO_MODULE[state.activeCheckpointId]}-1`
      : state.activeCheckpointId

  return { ...state, completedCheckpointIds, activeCheckpointId }
}

export class LocalProgressRepository implements ProgressRepository {
  load(courseId: string): LearnerProgressState | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + courseId)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== "object" || parsed.activeCourseId !== courseId) return null
      return migrateLegacyCheckpointIds(parsed as LearnerProgressState)
    } catch {
      // Private browsing, storage disabled, or corrupted JSON — fall back to
      // defaults rather than throwing.
      return null
    }
  }

  save(state: LearnerProgressState): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + state.activeCourseId, JSON.stringify(state))
    } catch {
      // Storage full/unavailable — progress just won't survive a refresh
      // this session; not fatal.
    }
  }

  reset(courseId: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + courseId)
    } catch {
      // no-op
    }
  }
}
