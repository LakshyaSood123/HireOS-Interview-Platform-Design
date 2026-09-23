import { ApiError } from "../../shared/errors.js";
import { isoDate } from "../../shared/dates.js";
import { logger } from "../../shared/logger.js";
import { isDuplicateKeyError, withTransaction } from "../../shared/transaction.js";
import { requireCurriculum, type CurriculumIndex } from "../curriculum/curriculum.service.js";
import type { SnapshotCheckpoint } from "../curriculum/curriculum.model.js";
import { CourseProgress, type CheckpointStat, type ModuleStat } from "./courseProgress.model.js";
import { LearningAttempt } from "./learningAttempt.model.js";
import {
  completionEventKey,
  masteryEventKey,
  RewardEvent,
  type RewardEventType,
} from "./rewardEvent.model.js";
import {
  completeCheckpoint as applyCompletion,
  DEFAULT_LIVES,
  missingPrerequisites,
  newlyUnlocked,
  resolveAllCheckpointStates,
  resolveAllModuleStates,
  resolveAllZoneStates,
  resolveCheckpointState,
  resolveModuleState,
  type LearnerProgressState,
  type ProgressState,
} from "./progress.engine.js";
import type { COMPLETION_SOURCES, RecordAttemptInput, SetActiveInput } from "./learning.schema.js";

/**
 * Durable learner state, with the server as the authority on it.
 *
 * Two rules run through every function here:
 *
 *  - **Identity comes from the token.** `userId` is a parameter supplied by
 *    the route from `currentUserId(req)`; nothing reads it from a body, and
 *    every query filters on it.
 *  - **Locks are checked here, not in the UI.** A request that bypasses the
 *    frontend entirely gets the same answer, because the prerequisite graph
 *    lives in the seeded snapshot and is consulted on every write.
 */

export type CompletionSource = (typeof COMPLETION_SOURCES)[number];

export interface CourseStateResponse {
  courseId: string;
  curriculumVersion: string;
  progress: LearnerProgressState;
  moduleStates: Record<string, ProgressState>;
  zoneStates: Record<string, ProgressState>;
}

export interface CompletionResponse {
  alreadyCompleted: boolean;
  rewards: { xpAwarded: number; masteryAwarded: boolean; livesDelta: number; streak: number };
  progress: LearnerProgressState;
  unlocked: { checkpointIds: string[]; moduleIds: string[] };
}

export interface ModuleProgressResponse {
  moduleId: string;
  state: ProgressState;
  checkpoints: { id: string; state: ProgressState; attempts: number; completedAt: string | null }[];
}

export interface StartModuleResponse {
  moduleId: string;
  state: ProgressState;
  activeCheckpointId: string | null;
}

/** The lean shape of a progress document, as every read here sees it. */
interface ProgressRecord {
  courseId: string;
  curriculumVersion: string;
  activeZoneId: string | null;
  activeModuleId: string | null;
  activeCheckpointId: string | null;
  completedCheckpointIds: string[];
  masteredCheckpointIds: string[];
  xp: number;
  lives: number;
  streak: number;
  lastActivityDate: string | null;
  checkpointStats?: unknown;
  moduleStats?: unknown;
}

// ── mapping ────────────────────────────────────────────────────────────────

/** The stored document, as the frontend's `LearnerProgressState`. */
function toLearnerState(record: ProgressRecord): LearnerProgressState {
  return {
    activeCourseId: record.courseId,
    activeZoneId: record.activeZoneId ?? null,
    activeModuleId: record.activeModuleId ?? null,
    activeCheckpointId: record.activeCheckpointId ?? null,
    completedCheckpointIds: record.completedCheckpointIds ?? [],
    masteredCheckpointIds: record.masteredCheckpointIds ?? [],
    xp: record.xp ?? 0,
    streak: record.streak ?? 0,
    lives: record.lives ?? DEFAULT_LIVES,
    lastActivityDate: record.lastActivityDate ?? null,
  };
}

function statsOf<T>(value: unknown): Record<string, T> {
  return value && typeof value === "object" ? (value as Record<string, T>) : {};
}

function asIsoOrNull(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string" && value) return value;
  return null;
}

// ── curriculum lookups ─────────────────────────────────────────────────────

function requireCheckpoint(curriculum: CurriculumIndex, checkpointId: string): SnapshotCheckpoint {
  const checkpoint = curriculum.checkpointById.get(checkpointId);
  if (!checkpoint) throw ApiError.notFound(`Unknown checkpoint "${checkpointId}" in course "${curriculum.courseId}".`);
  return checkpoint;
}

function requireModule(curriculum: CurriculumIndex, moduleId: string) {
  const module = curriculum.moduleById.get(moduleId);
  if (!module) throw ApiError.notFound(`Unknown module "${moduleId}" in course "${curriculum.courseId}".`);
  return module;
}

/** Where a brand-new learner starts: the first checkpoint of the first module. */
function courseEntryPoint(curriculum: CurriculumIndex): {
  zoneId: string | null;
  moduleId: string | null;
  checkpointId: string | null;
} {
  for (const zone of curriculum.zones) {
    for (const moduleId of zone.moduleIds) {
      const module = curriculum.moduleById.get(moduleId);
      const checkpointId = module?.checkpointIds[0];
      if (checkpointId) return { zoneId: zone.id, moduleId, checkpointId };
    }
  }
  return { zoneId: null, moduleId: null, checkpointId: null };
}

/** Where to drop the learner inside a module: the first checkpoint they have not finished. */
function entryCheckpointOf(
  curriculum: CurriculumIndex,
  moduleId: string,
  progress: LearnerProgressState,
): string | null {
  const module = curriculum.moduleById.get(moduleId);
  if (!module) return null;

  const unfinished = module.checkpointIds.find((id) => !progress.completedCheckpointIds.includes(id));
  return unfinished ?? module.checkpointIds[0] ?? null;
}

function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * "Complete Recursion before starting Trees." — the contract's own wording.
 * Built from the modules that own the missing prerequisites, so the learner
 * is told where to go rather than which checkpoint id they are short of.
 */
function lockMessage(curriculum: CurriculumIndex, missing: string[], targetTitle: string): string {
  const titles: string[] = [];
  for (const checkpointId of missing) {
    const moduleId = curriculum.moduleIdByCheckpointId.get(checkpointId);
    const title = moduleId ? curriculum.moduleById.get(moduleId)?.title : undefined;
    if (title && !titles.includes(title)) titles.push(title);
  }

  if (titles.length === 0) return `${targetTitle} is locked.`;
  return `Complete ${formatList(titles)} before starting ${targetTitle}.`;
}

// ── enrollment ─────────────────────────────────────────────────────────────

/**
 * The progress document for this user and course, creating it on first touch.
 *
 * Enrollment is implicit: the first read of the course state enrolls. A fresh
 * learner starts at the course's first checkpoint with zero XP, three lives
 * and no streak — never with demo bootstrap data, which is frontend
 * presentation and is deliberately not importable (checklist §4).
 *
 * `curriculumVersion` is written once, on insert. Progress keeps pointing at
 * the version it was made against even after a re-seed.
 */
async function getOrCreateProgress(userId: string, curriculum: CurriculumIndex): Promise<ProgressRecord> {
  const courseId = curriculum.courseId;
  const existing = await CourseProgress.findOne({ userId, courseId }).lean();
  if (existing) return existing as unknown as ProgressRecord;

  const entry = courseEntryPoint(curriculum);

  try {
    const created = await CourseProgress.create({
      userId,
      courseId,
      curriculumVersion: curriculum.version,
      enrolledAt: new Date(),
      activeZoneId: entry.zoneId,
      activeModuleId: entry.moduleId,
      activeCheckpointId: entry.checkpointId,
    });
    logger.info({ userId, courseId, curriculumVersion: curriculum.version }, "learning: enrolled");
    return created.toObject() as unknown as ProgressRecord;
  } catch (error) {
    // Two first requests raced. The unique { userId, courseId } index settled
    // it; whichever document exists now is the right one.
    if (!isDuplicateKeyError(error)) throw error;
    const settled = await CourseProgress.findOne({ userId, courseId }).lean();
    if (!settled) throw error;
    return settled as unknown as ProgressRecord;
  }
}

function buildCourseState(curriculum: CurriculumIndex, record: ProgressRecord): CourseStateResponse {
  const progress = toLearnerState(record);

  return {
    courseId: curriculum.courseId,
    curriculumVersion: record.curriculumVersion ?? curriculum.version,
    progress,
    moduleStates: resolveAllModuleStates(curriculum, progress),
    zoneStates: resolveAllZoneStates(curriculum, progress),
  };
}

// ── reads ──────────────────────────────────────────────────────────────────

/** `GET /me/courses/{courseId}/state` — the call the app makes on boot. */
export async function getCourseState(userId: string, courseId: string): Promise<CourseStateResponse> {
  const curriculum = await requireCurriculum(courseId);
  const record = await getOrCreateProgress(userId, curriculum);
  return buildCourseState(curriculum, record);
}

/** `GET /me/modules/{moduleId}/progress` — one module, for a roadmap refresh. */
export async function getModuleProgress(
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<ModuleProgressResponse> {
  const curriculum = await requireCurriculum(courseId);
  const module = requireModule(curriculum, moduleId);
  const record = await getOrCreateProgress(userId, curriculum);
  const progress = toLearnerState(record);
  const stats = statsOf<CheckpointStat>(record.checkpointStats);

  return {
    moduleId: module.id,
    state: resolveModuleState(curriculum, module.id, progress),
    checkpoints: module.checkpointIds.flatMap((checkpointId) => {
      const checkpoint = curriculum.checkpointById.get(checkpointId);
      if (!checkpoint) return [];

      const stat = stats[checkpointId];
      return [
        {
          id: checkpointId,
          state: resolveCheckpointState(checkpoint, progress),
          attempts: stat?.attempts ?? 0,
          completedAt: asIsoOrNull(stat?.firstCompletedAt),
        },
      ];
    }),
  };
}

// ── writes ─────────────────────────────────────────────────────────────────

/**
 * `PUT /me/courses/{courseId}/active` — move the learner's focus.
 *
 * A locked target is rejected with 409 and the ids that are missing. This is
 * the same check `start` and `complete` make: there is one lock rule and
 * three doors into it.
 */
export async function setActive(
  userId: string,
  courseId: string,
  input: SetActiveInput,
): Promise<CourseStateResponse> {
  const curriculum = await requireCurriculum(courseId);
  const record = await getOrCreateProgress(userId, curriculum);
  const progress = toLearnerState(record);

  let targetModuleId: string;
  let targetCheckpointId: string | null;

  if (input.checkpointId) {
    const checkpoint = requireCheckpoint(curriculum, input.checkpointId);
    const owningModuleId = curriculum.moduleIdByCheckpointId.get(checkpoint.id);
    if (!owningModuleId) throw ApiError.notFound(`Checkpoint "${checkpoint.id}" belongs to no module.`);

    if (input.moduleId && input.moduleId !== owningModuleId) {
      throw ApiError.validation(`Checkpoint "${checkpoint.id}" belongs to module "${owningModuleId}".`, {
        checkpointId: checkpoint.id,
        moduleId: owningModuleId,
      });
    }

    if (resolveCheckpointState(checkpoint, progress) === "locked") {
      const missing = missingPrerequisites(checkpoint, progress);
      throw new ApiError(
        "CHECKPOINT_LOCKED",
        lockMessage(curriculum, missing, curriculum.moduleById.get(owningModuleId)?.title ?? owningModuleId),
        { checkpointId: checkpoint.id, missingPrerequisites: missing },
      );
    }

    targetModuleId = owningModuleId;
    targetCheckpointId = checkpoint.id;
  } else {
    const module = requireModule(curriculum, input.moduleId as string);
    assertModuleUnlocked(curriculum, module.id, progress);
    targetModuleId = module.id;
    targetCheckpointId = entryCheckpointOf(curriculum, module.id, progress);
  }

  const updated = await CourseProgress.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        activeModuleId: targetModuleId,
        activeZoneId: curriculum.zoneIdByModuleId.get(targetModuleId) ?? null,
        activeCheckpointId: targetCheckpointId,
        lastActivityAt: new Date(),
      },
    },
    { new: true },
  ).lean();

  if (!updated) throw ApiError.notFound("No progress for this course.");
  return buildCourseState(curriculum, updated as unknown as ProgressRecord);
}

/** Throws `MODULE_LOCKED` unless the module's first checkpoint has unlocked. */
function assertModuleUnlocked(
  curriculum: CurriculumIndex,
  moduleId: string,
  progress: LearnerProgressState,
): void {
  const module = requireModule(curriculum, moduleId);
  const firstCheckpointId = module.checkpointIds[0];
  const firstCheckpoint = firstCheckpointId ? curriculum.checkpointById.get(firstCheckpointId) : undefined;

  if (!firstCheckpoint) {
    // A module with no checkpoints resolves to "locked" in the engine, and
    // there is nothing in it to start.
    throw new ApiError("MODULE_LOCKED", `${module.title} has no checkpoints yet.`, {
      moduleId,
      missingPrerequisites: [],
    });
  }

  if (resolveModuleState(curriculum, moduleId, progress) !== "locked") return;

  const missing = missingPrerequisites(firstCheckpoint, progress);
  throw new ApiError("MODULE_LOCKED", lockMessage(curriculum, missing, module.title), {
    moduleId,
    missingPrerequisites: missing,
  });
}

/**
 * `POST /me/modules/{moduleId}/start` — begin a module.
 *
 * The prerequisite check is server-side and reads the stored graph, so
 * calling this endpoint directly cannot unlock anything the UI would not.
 */
export async function startModule(
  userId: string,
  courseId: string,
  moduleId: string,
): Promise<StartModuleResponse> {
  const curriculum = await requireCurriculum(courseId);
  const module = requireModule(curriculum, moduleId);
  const record = await getOrCreateProgress(userId, curriculum);
  const progress = toLearnerState(record);

  assertModuleUnlocked(curriculum, module.id, progress);

  const activeCheckpointId = entryCheckpointOf(curriculum, module.id, progress);
  const startedAt = statsOf<ModuleStat>(record.moduleStats)[module.id]?.startedAt;

  const updated = await CourseProgress.findOneAndUpdate(
    { userId, courseId },
    {
      $set: {
        activeModuleId: module.id,
        activeZoneId: curriculum.zoneIdByModuleId.get(module.id) ?? null,
        activeCheckpointId,
        lastActivityAt: new Date(),
        // First start wins; re-entering a module does not reset when it began.
        [`moduleStats.${module.id}.startedAt`]: startedAt ?? new Date(),
      },
    },
    { new: true },
  ).lean();

  if (!updated) throw ApiError.notFound("No progress for this course.");

  return {
    moduleId: module.id,
    state: resolveModuleState(curriculum, module.id, toLearnerState(updated as unknown as ProgressRecord)),
    activeCheckpointId,
  };
}

/** Raised when the checkpoint turned out to be complete already. */
class AlreadyAwarded extends Error {
  constructor(readonly needsCleanup: boolean) {
    super("checkpoint already complete");
  }
}

/** One row for the reward ledger. */
interface RewardEventInput {
  userId: string;
  courseId: string;
  eventKey: string;
  eventType: RewardEventType;
  referenceType: string;
  referenceId: string;
  xpDelta: number;
  livesDelta: number;
  source: string;
  submissionId: string | null;
}

export interface CompleteCheckpointOptions {
  source?: CompletionSource;
  submissionId?: string;
}

/**
 * `POST /me/checkpoints/{checkpointId}/complete` — the endpoint the five
 * rules in plan §"Five rules we protect" mostly live in.
 *
 * Order matters: the ledger row goes in BEFORE the XP. A retry, a
 * double-click, ten parallel requests or a review of a finished module all
 * collide on the unique `{ userId, courseId, eventKey }` index and return
 * `alreadyCompleted: true` with `xpAwarded: 0` and identical progress.
 *
 * Day 4's `/code/submit` calls this function rather than re-implementing it,
 * so a passing submission and a manual completion award XP the same way,
 * once.
 */
export async function completeCheckpoint(
  userId: string,
  courseId: string,
  checkpointId: string,
  options: CompleteCheckpointOptions = {},
): Promise<CompletionResponse> {
  const curriculum = await requireCurriculum(courseId);
  const checkpoint = requireCheckpoint(curriculum, checkpointId);
  const record = await getOrCreateProgress(userId, curriculum);
  const before = toLearnerState(record);

  const state = resolveCheckpointState(checkpoint, before);

  // Review, retry and double-click all land here — the checkpoint is already
  // done, so the call is a read that reports the existing state.
  if (state === "completed" || state === "mastered") return unchanged(before);

  if (state === "locked") {
    const missing = missingPrerequisites(checkpoint, before);
    const moduleId = curriculum.moduleIdByCheckpointId.get(checkpoint.id);
    const moduleTitle = (moduleId ? curriculum.moduleById.get(moduleId)?.title : undefined) ?? checkpoint.id;
    throw new ApiError("CHECKPOINT_LOCKED", lockMessage(curriculum, missing, moduleTitle), {
      checkpointId: checkpoint.id,
      missingPrerequisites: missing,
    });
  }

  const today = isoDate();
  const after = applyCompletion(curriculum, before, checkpoint.id, today);
  const xpAwarded = after.xp - before.xp;
  const masteryAwarded = Boolean(checkpoint.masteryXp);
  const now = new Date();

  const moduleId = curriculum.moduleIdByCheckpointId.get(checkpoint.id);
  const module = moduleId ? curriculum.moduleById.get(moduleId) : undefined;
  const moduleNowComplete =
    module?.checkpointIds.every((id) => after.completedCheckpointIds.includes(id)) ?? false;
  const moduleStats = statsOf<ModuleStat>(record.moduleStats);

  const set: Record<string, unknown> = {
    activeZoneId: after.activeZoneId,
    activeModuleId: after.activeModuleId,
    activeCheckpointId: after.activeCheckpointId,
    streak: after.streak,
    lastActivityDate: after.lastActivityDate,
    lastActivityAt: now,
    [`checkpointStats.${checkpoint.id}.firstCompletedAt`]: now,
  };
  if (module) {
    set[`moduleStats.${module.id}.startedAt`] = moduleStats[module.id]?.startedAt ?? now;
    if (moduleNowComplete) set[`moduleStats.${module.id}.completedAt`] = now;
  }

  const source = options.source ?? "manual";
  const submissionId = options.submissionId ?? null;

  const events: RewardEventInput[] = [
    {
      userId,
      courseId,
      eventKey: completionEventKey(checkpoint.id),
      eventType: "checkpoint-complete",
      referenceType: "checkpoint",
      referenceId: checkpoint.id,
      xpDelta: checkpoint.xp,
      livesDelta: 0,
      source,
      submissionId,
    },
  ];
  if (masteryAwarded) {
    events.push({
      userId,
      courseId,
      eventKey: masteryEventKey(checkpoint.id),
      eventType: "mastery-bonus",
      referenceType: "checkpoint",
      referenceId: checkpoint.id,
      xpDelta: checkpoint.masteryXp ?? 0,
      livesDelta: 0,
      source,
      submissionId,
    });
  }

  let written: ProgressRecord;

  try {
    written = await withTransaction(async (session) => {
      // The ledger first. A duplicate key here IS the idempotency guarantee:
      // it is what a retry, a double-click and ten parallel calls collide on.
      await RewardEvent.insertMany(events, session ? { session, ordered: true } : { ordered: true });

      const result = await CourseProgress.findOneAndUpdate(
        { userId, courseId, completedCheckpointIds: { $ne: checkpoint.id } },
        {
          $addToSet: masteryAwarded
            ? { completedCheckpointIds: checkpoint.id, masteredCheckpointIds: checkpoint.id }
            : { completedCheckpointIds: checkpoint.id },
          $inc: { xp: xpAwarded },
          $set: set,
        },
        session ? { new: true, session } : { new: true },
      ).lean();

      // Our ledger rows went in, but the progress document already held the
      // checkpoint — so a previous completion was applied without a ledger
      // row. Award nothing and undo the rows we just wrote, rather than leave
      // the ledger claiming XP that was never granted.
      if (!result) throw new AlreadyAwarded(session === undefined);

      return result as unknown as ProgressRecord;
    });
  } catch (error) {
    if (!isDuplicateKeyError(error) && !(error instanceof AlreadyAwarded)) throw error;

    if (error instanceof AlreadyAwarded) {
      logger.warn(
        { userId, courseId, checkpointId: checkpoint.id },
        "learning: checkpoint was complete with no ledger row — awarded nothing",
      );
      // A transaction already rolled the rows back; without one, remove them.
      if (error.needsCleanup) {
        await RewardEvent.deleteMany({ userId, courseId, eventKey: { $in: events.map((e) => e.eventKey) } });
      }
    }

    const settled = await CourseProgress.findOne({ userId, courseId }).lean();
    return unchanged(toLearnerState((settled ?? record) as unknown as ProgressRecord));
  }

  const progress = toLearnerState(written);

  logger.info(
    { userId, courseId, checkpointId: checkpoint.id, xpAwarded, masteryAwarded, source: options.source ?? "manual" },
    "learning: checkpoint completed",
  );

  return {
    alreadyCompleted: false,
    rewards: { xpAwarded, masteryAwarded, livesDelta: 0, streak: progress.streak },
    progress,
    unlocked: {
      checkpointIds: newlyUnlocked(
        resolveAllCheckpointStates(curriculum, before),
        resolveAllCheckpointStates(curriculum, progress),
      ),
      moduleIds: newlyUnlocked(
        resolveAllModuleStates(curriculum, before),
        resolveAllModuleStates(curriculum, progress),
      ),
    },
  };
}

/** The "nothing happened" response — review, retry, or a lost race. */
function unchanged(progress: LearnerProgressState): CompletionResponse {
  return {
    alreadyCompleted: true,
    rewards: { xpAwarded: 0, masteryAwarded: false, livesDelta: 0, streak: progress.streak },
    progress,
    unlocked: { checkpointIds: [], moduleIds: [] },
  };
}

/**
 * `POST /me/attempts` — a quick-check or quiz answer.
 *
 * Records what happened and counts it. An attempt never moves XP, lives or
 * the streak: only a completion does, and only through the ledger.
 */
export async function recordAttempt(
  userId: string,
  input: RecordAttemptInput,
): Promise<{ attemptId: string; passed: boolean }> {
  const curriculum = await requireCurriculum(input.courseId);
  const checkpoint = requireCheckpoint(curriculum, input.checkpointId);
  const moduleId = curriculum.moduleIdByCheckpointId.get(checkpoint.id) ?? "";

  await getOrCreateProgress(userId, curriculum);

  const attempt = await LearningAttempt.create({
    userId,
    courseId: curriculum.courseId,
    // From the curriculum, not from `input.moduleId` — the body does not get
    // to say where a checkpoint lives, the same way it does not get to say
    // who the user is.
    moduleId,
    checkpointId: checkpoint.id,
    activityId: input.activityId,
    attemptType: input.attemptType,
    passed: input.passed,
    payload: input.payload ?? null,
  });

  await CourseProgress.updateOne(
    { userId, courseId: curriculum.courseId },
    {
      $inc: { [`checkpointStats.${checkpoint.id}.attempts`]: 1 },
      $set: { lastActivityAt: new Date() },
    },
  );

  return { attemptId: attempt._id.toString(), passed: input.passed };
}
