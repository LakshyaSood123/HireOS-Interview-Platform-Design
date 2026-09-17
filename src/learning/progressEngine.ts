// Pure progression logic. Replaces the old `completeCurrentLesson()` model
// (`currentLessonId + 1`, AppStateContext.tsx) with real prerequisite-graph
// resolution, so a checkpoint's state is DERIVED from what's actually been
// completed rather than a single hand-advanced integer. No React, no I/O —
// everything here is a pure function of (Course, LearnerProgressState).

import type { Course, Checkpoint, Module, Zone, ProgressState } from "./types"
import { getAllCheckpointsInOrder } from "./courseRegistry"

export interface LearnerProgressState {
  activeCourseId: string
  activeZoneId: string | null
  activeModuleId: string | null
  activeCheckpointId: string | null
  completedCheckpointIds: string[]
  masteredCheckpointIds: string[]
  xp: number
  streak: number
  lives: number
  /** ISO date ("YYYY-MM-DD") of the last day a checkpoint was completed —
   * drives the streak. See `recordActivity` below. */
  lastActivityDate: string | null
}

export const DEFAULT_LIVES = 3

export function resolveCheckpointState(
  checkpoint: Checkpoint,
  progress: LearnerProgressState,
): ProgressState {
  if (progress.masteredCheckpointIds.includes(checkpoint.id)) return "mastered"
  if (progress.completedCheckpointIds.includes(checkpoint.id)) return "completed"
  if (checkpoint.id === progress.activeCheckpointId) return "current"

  const prerequisitesMet = checkpoint.prerequisites.every(id => progress.completedCheckpointIds.includes(id))
  return prerequisitesMet ? "available" : "locked"
}

/** A module's state rolls up from its checkpoints: completed only when every
 * checkpoint is; current if it contains the active checkpoint; locked only
 * when its first checkpoint hasn't unlocked yet. */
export function resolveModuleState(
  module: Module,
  progress: LearnerProgressState,
): ProgressState {
  if (module.checkpoints.length === 0) return "locked"

  const states = module.checkpoints.map(cp => resolveCheckpointState(cp, progress))
  if (states.every(s => s === "completed" || s === "mastered")) {
    return states.every(s => s === "mastered") ? "mastered" : "completed"
  }
  if (states.some(s => s === "current")) return "current"
  if (states[0] === "locked") return "locked"
  return "available"
}

export function resolveZoneState(zone: Zone, progress: LearnerProgressState): ProgressState {
  const moduleStates = zone.modules.map(m => resolveModuleState(m, progress))
  if (moduleStates.every(s => s === "completed" || s === "mastered")) return "completed"
  if (moduleStates.some(s => s === "current")) return "current"
  if (moduleStates[0] === "locked") return "locked"
  return "available"
}

/** Convenience maps for UI components that just want `id -> state` without
 * walking the course tree themselves (e.g. BiomeTrailMap). */
export function resolveAllModuleStates(course: Course, progress: LearnerProgressState): Record<string, ProgressState> {
  const result: Record<string, ProgressState> = {}
  for (const zone of course.zones) {
    for (const module of zone.modules) {
      result[module.id] = resolveModuleState(module, progress)
    }
  }
  return result
}

export function resolveAllZoneStates(course: Course, progress: LearnerProgressState): Record<string, ProgressState> {
  const result: Record<string, ProgressState> = {}
  for (const zone of course.zones) {
    result[zone.id] = resolveZoneState(zone, progress)
  }
  return result
}

/** The checkpoint immediately after `checkpointId` WITHIN THE SAME MODULE,
 * or null if it was that module's last checkpoint (or the checkpoint isn't
 * found at all). Deliberately scoped to the owning module rather than
 * flattened course order (`getAllCheckpointsInOrder`) — this course's zones
 * fan out into parallel modules (Pattern Meadows, Structure Woods, Graph
 * Highlands, etc.), so "next in flattened registry order" can land in a
 * completely unrelated module purely because of how courseRegistry.ts
 * happens to list modules within a zone. That was a real bug: finishing the
 * last checkpoint of one module could silently move the learner's active
 * focus into a different module's checkpoint that isn't even unlocked yet.
 * Used to advance `activeCheckpointId` on completion — see
 * `completeCheckpoint` below. */
export function getNextCheckpointId(course: Course, checkpointId: string): string | null {
  for (const zone of course.zones) {
    for (const module of zone.modules) {
      const index = module.checkpoints.findIndex(cp => cp.id === checkpointId)
      if (index === -1) continue
      return index + 1 < module.checkpoints.length ? module.checkpoints[index + 1].id : null
    }
  }
  return null
}

/** Applies a checkpoint completion to a progress snapshot and returns the
 * new snapshot. Pure — callers (AppStateContext) own persisting the result.
 * `today` is an ISO date string ("YYYY-MM-DD"), passed in rather than read
 * from `Date.now()` internally so this stays a pure, testable function —
 * see `recordActivity` for the streak rule it applies. */
export function completeCheckpoint(
  course: Course,
  progress: LearnerProgressState,
  checkpointId: string,
  today: string,
): LearnerProgressState {
  const checkpoint = getAllCheckpointsInOrder(course).find(cp => cp.id === checkpointId)
  // Checkpoint's configured XP, plus a mastery bonus (and mastered-list
  // entry) for a module's terminal checkpoint — see Checkpoint.masteryXp.
  // Never a flat constant: PART 17 requires the reward to come from content
  // data, not be scattered across UI components.
  const xpGain = (checkpoint?.xp ?? 0) + (checkpoint?.masteryXp ?? 0)

  const completedCheckpointIds = progress.completedCheckpointIds.includes(checkpointId)
    ? progress.completedCheckpointIds
    : [...progress.completedCheckpointIds, checkpointId]

  const masteredCheckpointIds =
    checkpoint?.masteryXp && !progress.masteredCheckpointIds.includes(checkpointId)
      ? [...progress.masteredCheckpointIds, checkpointId]
      : progress.masteredCheckpointIds

  const nextId = getNextCheckpointId(course, checkpointId)
  const nextModule = nextId ? course.zones.flatMap(z => z.modules).find(m => m.checkpoints.some(cp => cp.id === nextId)) : undefined
  const nextZone = nextModule ? course.zones.find(z => z.modules.includes(nextModule)) : undefined

  return recordActivity(
    {
      ...progress,
      completedCheckpointIds,
      masteredCheckpointIds,
      // A same-module next checkpoint becomes the new focus. When the
      // module is now fully complete, there's no single correct next
      // destination the pure engine can pick without guessing (which of
      // possibly several newly-available parallel modules?) — preserve the
      // learner's current focus rather than jumping via flattened order.
      activeCheckpointId: nextId ?? progress.activeCheckpointId,
      activeModuleId: nextModule?.id ?? progress.activeModuleId,
      activeZoneId: nextZone?.id ?? progress.activeZoneId,
      xp: progress.xp + xpGain,
    },
    today,
  )
}

/** Streak rule: completing something today either continues yesterday's
 * streak (+1), starts a fresh streak (=1) if there was a gap or no prior
 * activity, or leaves it unchanged if today was already counted. No
 * timezone handling — `today` is whatever the caller's local calendar date
 * is, which is good enough for a local/demo streak. */
export function recordActivity(progress: LearnerProgressState, today: string): LearnerProgressState {
  if (progress.lastActivityDate === today) return progress

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayIso = yesterday.toISOString().slice(0, 10)

  const streak = progress.lastActivityDate === yesterdayIso ? progress.streak + 1 : 1

  return { ...progress, streak, lastActivityDate: today }
}

/** A failed Submit costs one life, floored at 0. Run and Hint never cost a
 * life. Reaching 0 doesn't lock the learner out — see PART 18: the UI shows
 * a soft "take a break" message instead of a hard gate. */
export function recordFailedSubmit(progress: LearnerProgressState): LearnerProgressState {
  return { ...progress, lives: Math.max(0, progress.lives - 1) }
}
