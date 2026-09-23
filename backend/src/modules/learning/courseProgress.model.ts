import { model, Schema, type InferSchemaType } from "mongoose";

import { DEFAULT_LIVES } from "./progress.engine.js";

/**
 * `courseProgress` — one document per user per course, and the main
 * collection in the system. Schema doc §3.
 *
 * The first block of fields is field-for-field the frontend's
 * `LearnerProgressState`, so `ApiProgressRepository` (Day 3) can return the
 * response unchanged. The rest is detail the browser never kept.
 *
 * Whole state read together, whole state written together: one document means
 * one atomic update, no joins, and no way for a module row to disagree with
 * its checkpoint rows. At 107 checkpoints it is a few KB.
 *
 * Stored here are FACTS — what is completed, XP, lives, streak, the active
 * pointer. `locked` / `available` / `current` / `completed` / `mastered` are
 * derived by `progress.engine.ts` on read; storing them would create a second
 * source of truth.
 */

export interface CheckpointStat {
  attempts?: number;
  failedSubmits?: number;
  firstCompletedAt?: Date | string | null;
  bestScore?: number | null;
}

export interface ModuleStat {
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
}

const courseProgressSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: String, required: true },
    /** The snapshot version this progress was made against — schema §"Curriculum traceability". */
    curriculumVersion: { type: String, required: true },
    enrolledAt: { type: Date, required: true, default: () => new Date() },

    // ── exactly the frontend's LearnerProgressState ──────────────────────
    activeZoneId: { type: String, default: null },
    activeModuleId: { type: String, default: null },
    activeCheckpointId: { type: String, default: null },
    completedCheckpointIds: { type: [String], required: true, default: [] },
    masteredCheckpointIds: { type: [String], required: true, default: [] },
    xp: { type: Number, required: true, default: 0, min: 0 },
    lives: { type: Number, required: true, default: DEFAULT_LIVES, min: 0 },
    streak: { type: Number, required: true, default: 0, min: 0 },
    /** `"YYYY-MM-DD"`, UTC. Drives the streak — see progress.engine.ts. */
    lastActivityDate: { type: String, default: null },

    // ── detail the frontend does not keep ────────────────────────────────
    /** `{ "trees-2": { attempts, failedSubmits, firstCompletedAt, bestScore } }`.
     *  Mixed rather than a Map so a `.lean()` read is a plain object
     *  everywhere and `$inc` on a dotted path stays the only writer. Keys are
     *  curriculum checkpoint ids, always validated against the snapshot
     *  before they reach a query. */
    checkpointStats: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
    /** `{ "trees": { startedAt, completedAt } }`. */
    moduleStats: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
    /** Day 5. Dismissals are the only part of a recommendation that persists. */
    dismissedRecommendationKeys: { type: [String], required: true, default: [] },
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: true, collection: "courseProgress" },
);

courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

export type CourseProgressAttributes = InferSchemaType<typeof courseProgressSchema>;

export const CourseProgress = model("CourseProgress", courseProgressSchema);
