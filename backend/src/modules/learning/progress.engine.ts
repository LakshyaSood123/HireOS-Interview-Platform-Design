import { addDays } from "../../shared/dates.js";
import type { CurriculumIndex } from "../curriculum/curriculum.service.js";
import type { SnapshotCheckpoint } from "../curriculum/curriculum.model.js";

/**
 * A port of the frontend's `src/learning/progressEngine.ts`, function for
 * function, so the server derives exactly what the browser derives.
 *
 * Everything here is pure: a function of (curriculum, progress). Nothing
 * reads the clock, the database or a request. The one deliberate difference
 * is that the frontend walks a nested Course tree while the server walks the
 * seeded index — the rules applied to it are identical, and checkpoint 2.4
 * ("matches progressEngine.ts exactly") is about those rules.
 *
 * Read this file beside the frontend one. If they ever disagree, the
 * frontend is the specification.
 */

export type ProgressState = "locked" | "available" | "current" | "completed" | "mastered";

/** Field-for-field the frontend's `LearnerProgressState`. */
export interface LearnerProgressState {
  activeCourseId: string;
  activeZoneId: string | null;
  activeModuleId: string | null;
  activeCheckpointId: string | null;
  completedCheckpointIds: string[];
  masteredCheckpointIds: string[];
  xp: number;
  streak: number;
  lives: number;
  lastActivityDate: string | null;
}

export const DEFAULT_LIVES = 3;

export function resolveCheckpointState(
  checkpoint: SnapshotCheckpoint,
  progress: LearnerProgressState,
): ProgressState {
  if (progress.masteredCheckpointIds.includes(checkpoint.id)) return "mastered";
  if (progress.completedCheckpointIds.includes(checkpoint.id)) return "completed";
  if (checkpoint.id === progress.activeCheckpointId) return "current";

  const prerequisitesMet = checkpoint.prerequisites.every((id) => progress.completedCheckpointIds.includes(id));
  return prerequisitesMet ? "available" : "locked";
}

/** Prerequisites of a checkpoint the learner has not completed yet. */
export function missingPrerequisites(
  checkpoint: SnapshotCheckpoint,
  progress: LearnerProgressState,
): string[] {
  return checkpoint.prerequisites.filter((id) => !progress.completedCheckpointIds.includes(id));
}

function checkpointsOf(curriculum: CurriculumIndex, moduleId: string): SnapshotCheckpoint[] {
  const module = curriculum.moduleById.get(moduleId);
  if (!module) return [];

  const checkpoints: SnapshotCheckpoint[] = [];
  for (const id of module.checkpointIds) {
    const checkpoint = curriculum.checkpointById.get(id);
    if (checkpoint) checkpoints.push(checkpoint);
  }
  return checkpoints;
}

/**
 * A module's state rolls up from its checkpoints: completed only when every
 * checkpoint is; current if it contains the active checkpoint; locked only
 * when its first checkpoint has not unlocked yet.
 */
export function resolveModuleState(
  curriculum: CurriculumIndex,
  moduleId: string,
  progress: LearnerProgressState,
): ProgressState {
  const checkpoints = checkpointsOf(curriculum, moduleId);
  if (checkpoints.length === 0) return "locked";

  const states = checkpoints.map((checkpoint) => resolveCheckpointState(checkpoint, progress));
  if (states.every((state) => state === "completed" || state === "mastered")) {
    return states.every((state) => state === "mastered") ? "mastered" : "completed";
  }
  if (states.some((state) => state === "current")) return "current";
  if (states[0] === "locked") return "locked";
  return "available";
}

export function resolveZoneState(
  curriculum: CurriculumIndex,
  zoneId: string,
  progress: LearnerProgressState,
): ProgressState {
  const zone = curriculum.zoneById.get(zoneId);
  if (!zone) return "locked";

  const moduleStates = zone.moduleIds.map((moduleId) => resolveModuleState(curriculum, moduleId, progress));
  if (moduleStates.every((state) => state === "completed" || state === "mastered")) return "completed";
  if (moduleStates.some((state) => state === "current")) return "current";
  if (moduleStates[0] === "locked") return "locked";
  return "available";
}

export function resolveAllModuleStates(
  curriculum: CurriculumIndex,
  progress: LearnerProgressState,
): Record<string, ProgressState> {
  const result: Record<string, ProgressState> = {};
  for (const module of curriculum.modules) {
    result[module.id] = resolveModuleState(curriculum, module.id, progress);
  }
  return result;
}

export function resolveAllZoneStates(
  curriculum: CurriculumIndex,
  progress: LearnerProgressState,
): Record<string, ProgressState> {
  const result: Record<string, ProgressState> = {};
  for (const zone of curriculum.zones) {
    result[zone.id] = resolveZoneState(curriculum, zone.id, progress);
  }
  return result;
}

export function resolveAllCheckpointStates(
  curriculum: CurriculumIndex,
  progress: LearnerProgressState,
): Record<string, ProgressState> {
  const result: Record<string, ProgressState> = {};
  for (const checkpoint of curriculum.checkpoints) {
    result[checkpoint.id] = resolveCheckpointState(checkpoint, progress);
  }
  return result;
}

/**
 * The checkpoint immediately after `checkpointId` WITHIN THE SAME MODULE, or
 * null if it was that module's last.
 *
 * Deliberately module-scoped, not flattened course order — the frontend
 * comment on this function records why: zones fan out into parallel modules,
 * so "next in registry order" could move a learner's focus into an unrelated,
 * still-locked module. That was a real bug there; it is not going to be
 * re-introduced here.
 */
export function getNextCheckpointId(curriculum: CurriculumIndex, checkpointId: string): string | null {
  const moduleId = curriculum.moduleIdByCheckpointId.get(checkpointId);
  if (!moduleId) return null;

  const module = curriculum.moduleById.get(moduleId);
  if (!module) return null;

  const index = module.checkpointIds.indexOf(checkpointId);
  if (index === -1) return null;

  return module.checkpointIds[index + 1] ?? null;
}

/**
 * Streak rule, from `progressEngine.recordActivity`: completing something
 * today either continues yesterday's streak (+1), starts a fresh one (=1)
 * after a gap, or leaves it alone if today was already counted.
 *
 * `today` is passed in rather than read from the clock, so this stays pure —
 * the service supplies `isoDate()` in UTC.
 */
export function recordActivity(progress: LearnerProgressState, today: string): LearnerProgressState {
  if (progress.lastActivityDate === today) return progress;

  const streak = progress.lastActivityDate === addDays(today, -1) ? progress.streak + 1 : 1;

  return { ...progress, streak, lastActivityDate: today };
}

/**
 * Applies a completion to a snapshot and returns the new one — the port of
 * `progressEngine.completeCheckpoint`.
 *
 * XP is the checkpoint's own plus its mastery bonus, never a flat constant:
 * the reward comes from curriculum data. A module's terminal checkpoint also
 * joins `masteredCheckpointIds`.
 */
export function completeCheckpoint(
  curriculum: CurriculumIndex,
  progress: LearnerProgressState,
  checkpointId: string,
  today: string,
): LearnerProgressState {
  const checkpoint = curriculum.checkpointById.get(checkpointId);
  const xpGain = (checkpoint?.xp ?? 0) + (checkpoint?.masteryXp ?? 0);

  const completedCheckpointIds = progress.completedCheckpointIds.includes(checkpointId)
    ? progress.completedCheckpointIds
    : [...progress.completedCheckpointIds, checkpointId];

  const masteredCheckpointIds =
    checkpoint?.masteryXp && !progress.masteredCheckpointIds.includes(checkpointId)
      ? [...progress.masteredCheckpointIds, checkpointId]
      : progress.masteredCheckpointIds;

  const nextId = getNextCheckpointId(curriculum, checkpointId);
  const nextModuleId = nextId ? curriculum.moduleIdByCheckpointId.get(nextId) : undefined;
  const nextZoneId = nextModuleId ? curriculum.zoneIdByModuleId.get(nextModuleId) : undefined;

  return recordActivity(
    {
      ...progress,
      completedCheckpointIds,
      masteredCheckpointIds,
      // A same-module next checkpoint becomes the new focus. When the module
      // is now fully complete there is no single correct next destination the
      // pure engine can pick without guessing which of several newly-available
      // parallel modules — so the learner's current focus is preserved.
      activeCheckpointId: nextId ?? progress.activeCheckpointId,
      activeModuleId: nextModuleId ?? progress.activeModuleId,
      activeZoneId: nextZoneId ?? progress.activeZoneId,
      xp: progress.xp + xpGain,
    },
    today,
  );
}

/** A failed submit costs one life, floored at 0. Day 4 calls this. */
export function recordFailedSubmit(progress: LearnerProgressState): LearnerProgressState {
  return { ...progress, lives: Math.max(0, progress.lives - 1) };
}

/** Ids that moved out of `locked` between two snapshots — what a completion unlocked. */
export function newlyUnlocked(
  before: Record<string, ProgressState>,
  after: Record<string, ProgressState>,
): string[] {
  return Object.keys(after).filter((id) => before[id] === "locked" && after[id] !== "locked");
}
