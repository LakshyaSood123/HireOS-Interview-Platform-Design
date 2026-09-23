import { model, Schema, type InferSchemaType } from "mongoose";

/**
 * `rewardEvents` — the XP and lives ledger, and the reason duplicate XP is
 * impossible. Schema doc §4.
 *
 * The unique `{ userId, courseId, eventKey }` index is the guard, not a
 * read-then-write: a completion inserts its event BEFORE touching XP, so a
 * retry, a double-click, ten parallel requests or a review of a finished
 * module all collide on the index and take the "already completed, award
 * nothing" path.
 *
 * It is also an audit trail: every point a learner holds can be traced to the
 * row that granted it.
 */

export const REWARD_EVENT_TYPES = ["checkpoint-complete", "mastery-bonus", "failed-submit", "streak"] as const;
export type RewardEventType = (typeof REWARD_EVENT_TYPES)[number];

const rewardEventSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: String, required: true },
    /** `complete:trees-3`, `mastery:trees-5`, `failed-submit:<submissionId>`. */
    eventKey: { type: String, required: true, maxlength: 160 },
    eventType: { type: String, enum: REWARD_EVENT_TYPES, required: true },
    referenceType: { type: String, required: true, maxlength: 40 },
    referenceId: { type: String, required: true, maxlength: 120 },
    xpDelta: { type: Number, required: true, default: 0 },
    livesDelta: { type: Number, required: true, default: 0 },
    /** What produced it — `submit`, `quick-check`, `reading`, `manual`. */
    source: { type: String, default: null, maxlength: 40 },
    /** Day 4: the submission that earned it, when one did. */
    submissionId: { type: String, default: null, maxlength: 64 },
  },
  { timestamps: true, collection: "rewardEvents" },
);

rewardEventSchema.index({ userId: 1, courseId: 1, eventKey: 1 }, { unique: true });
rewardEventSchema.index({ userId: 1, createdAt: -1 });

export type RewardEventAttributes = InferSchemaType<typeof rewardEventSchema>;

export const RewardEvent = model("RewardEvent", rewardEventSchema);

export function completionEventKey(checkpointId: string): string {
  return `complete:${checkpointId}`;
}

export function masteryEventKey(checkpointId: string): string {
  return `mastery:${checkpointId}`;
}
