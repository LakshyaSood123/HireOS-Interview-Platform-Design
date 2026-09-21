// The smallest safe local progression store for published CMS courses —
// entirely separate from src/learning/progressEngine.ts and
// progressRepository.ts (the real DSA XP/lives/streak/prerequisite engine).
// No XP, no lives, no streak, no mastery — just "which checkpoint ids has
// this learner marked complete within this CMS course," used to resolve a
// simple linear locked/available/completed sequence per module via
// resolveCmsCheckpointStates below. Keyed per courseId so different CMS
// courses (and the DSA course) never share or leak state.

import type { Module, ProgressState } from "../learning/types"

const STORAGE_PREFIX = "reagvis.cms.progress."

function readCompleted(courseId: string): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + courseId)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw)
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeCompleted(courseId: string, ids: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + courseId, JSON.stringify([...ids]))
  } catch {
    // storage unavailable — completion simply won't persist this session
  }
}

export function isCmsCheckpointCompleted(courseId: string, checkpointId: string): boolean {
  return readCompleted(courseId).has(checkpointId)
}

export function markCmsCheckpointCompleted(courseId: string, checkpointId: string): void {
  const ids = readCompleted(courseId)
  ids.add(checkpointId)
  writeCompleted(courseId, ids)
}

/** Linear progression within a single module: the first checkpoint is
 * always available; each subsequent checkpoint unlocks only once the
 * previous one is marked complete. Modules themselves are never locked —
 * see CmsCourseLanding.tsx — this only governs checkpoint order inside one
 * module's roadmap, matching what ModuleRoadmap already visualizes for
 * DSA. */
export function resolveCmsCheckpointStates(courseId: string, module: Module): Record<string, ProgressState> {
  const completed = readCompleted(courseId)
  const states: Record<string, ProgressState> = {}

  let reachedCurrent = false
  module.checkpoints.forEach(cp => {
    if (completed.has(cp.id)) {
      states[cp.id] = "completed"
    } else if (!reachedCurrent) {
      states[cp.id] = "current"
      reachedCurrent = true
    } else {
      states[cp.id] = "locked"
    }
  })

  return states
}
