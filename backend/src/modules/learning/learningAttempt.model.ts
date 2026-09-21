import { model, Schema, type InferSchemaType } from "mongoose";

/**
 * `learningAttempts` — quick-check and quiz answers. Schema doc §6.
 *
 * Append-only and never rewarding: an attempt records what happened, it does
 * not move XP, lives or the streak. Only a completion does that.
 */

export const ATTEMPT_TYPES = ["quick-check", "quiz", "reading"] as const;
export type AttemptType = (typeof ATTEMPT_TYPES)[number];

const learningAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: String, required: true },
    /** Derived from the curriculum, never from the request body. */
    moduleId: { type: String, required: true },
    checkpointId: { type: String, required: true },
    /** Frontend-owned activity id, e.g. `trees-3-quick-check`. Stored as sent. */
    activityId: { type: String, required: true, maxlength: 120 },
    attemptType: { type: String, enum: ATTEMPT_TYPES, required: true },
    passed: { type: Boolean, required: true },
    /** Free-form, e.g. `{ selectedIndex, correctIndex }`. */
    payload: { type: Schema.Types.Mixed, default: null },
  },
  { timestamps: true, collection: "learningAttempts" },
);

learningAttemptSchema.index({ userId: 1, checkpointId: 1, createdAt: -1 });
learningAttemptSchema.index({ userId: 1, createdAt: -1 });

export type LearningAttemptAttributes = InferSchemaType<typeof learningAttemptSchema>;

export const LearningAttempt = model("LearningAttempt", learningAttemptSchema);
