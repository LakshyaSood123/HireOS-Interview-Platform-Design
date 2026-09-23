import { model, Schema, type InferSchemaType } from "mongoose";

/**
 * `curriculumSnapshots` — the course's ID STRUCTURE ONLY.
 *
 * Schema doc §9. This exists for exactly one reason: the server must be able
 * to answer "is this module locked?" without trusting the client. It stores
 * ids, order, XP and the prerequisite graph — no theory, no questions, no
 * starter code, no scenic data. Plan §6: *the backend never becomes a second
 * curriculum.*
 *
 * `title` on zones and modules is the one display string kept, because the
 * contract's own error message is "Complete Recursion before starting Trees."
 * and a lock the learner cannot read is a worse outcome than storing 36 short
 * names. Checkpoints keep no title at all. `scripts/seedCurriculum.ts`
 * enforces both rules with a field allowlist before it writes anything.
 */

const zoneSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    order: { type: Number, required: true },
    moduleIds: { type: [String], required: true },
  },
  { _id: false },
);

const moduleSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    zoneId: { type: String, required: true },
    /** Course-wide order, 1-based — the order the roadmap walks modules in. */
    order: { type: Number, required: true },
    checkpointIds: { type: [String], required: true },
  },
  { _id: false },
);

const checkpointSchema = new Schema(
  {
    id: { type: String, required: true },
    moduleId: { type: String, required: true },
    /** Order within the owning module, 1-based. */
    order: { type: Number, required: true },
    type: { type: String, required: true },
    xp: { type: Number, required: true },
    /** Set only on a module's terminal checkpoint — see progressEngine.ts. */
    masteryXp: { type: Number, default: null },
    prerequisites: { type: [String], required: true },
    /** Day 4 needs to know which checkpoints can be judged. */
    hasCodingActivity: { type: Boolean, required: true },
  },
  { _id: false },
);

const curriculumSnapshotSchema = new Schema(
  {
    courseId: { type: String, required: true },
    title: { type: String, required: true, maxlength: 120 },
    /** `"YYYY-MM-DD"` of the seed run, or whatever `--version` was given. */
    version: { type: String, required: true },
    /** The frontend commit the structure was read from, for traceability. */
    frontendCommit: { type: String, default: null },
    /** SHA-256 of the canonical structure — tells a re-seed from a real change. */
    structureHash: { type: String, required: true },
    /**
     * Which snapshot the API answers from. Exactly one per course, held by a
     * unique partial index, so rolling back is a flag flip and never a guess
     * about which version is newest.
     */
    isActive: { type: Boolean, required: true, default: false },
    zones: { type: [zoneSchema], required: true },
    modules: { type: [moduleSchema], required: true },
    checkpoints: { type: [checkpointSchema], required: true },
  },
  { timestamps: true, collection: "curriculumSnapshots" },
);

curriculumSnapshotSchema.index({ courseId: 1, version: 1 }, { unique: true });
curriculumSnapshotSchema.index(
  { courseId: 1 },
  { unique: true, partialFilterExpression: { isActive: true }, name: "one_active_snapshot_per_course" },
);

export type CurriculumSnapshotAttributes = InferSchemaType<typeof curriculumSnapshotSchema>;
export type SnapshotZone = CurriculumSnapshotAttributes["zones"][number];
export type SnapshotModule = CurriculumSnapshotAttributes["modules"][number];
export type SnapshotCheckpoint = CurriculumSnapshotAttributes["checkpoints"][number];

export const CurriculumSnapshot = model("CurriculumSnapshot", curriculumSnapshotSchema);
