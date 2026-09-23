import { model, Schema, type InferSchemaType } from "mongoose";

import { CMS_CHECKPOINT_TYPES, CMS_COURSE_TYPES, CMS_ENTITY_STATES, CMS_EXECUTION_MODES, CMS_LANGUAGES } from "./cms.types.js";

/**
 * `cmsCourseVersions` — one document per course version, PUBLISHED ones
 * immutable once created (Phase 3B plan §5/14). Full authored content is
 * embedded — at 7 zones / 29 modules / 107 checkpoints this is comfortably
 * under MongoDB's 16MB document limit (see
 * `backend/scripts/reportCmsDocumentSize.ts`, run as part of validation) —
 * so publishing is a single insert, never a multi-collection transaction
 * across hundreds of rows.
 *
 * `status: "draft"` documents are the only ones ever mutated in place
 * (`PATCH .../draft`). `"published"` and `"archived"` documents are written
 * once, at publish/rollback time, and never touched again — see
 * `cms.service.ts`'s `publishDraft`/`activateVersion`.
 */

const testCaseSchema = new Schema(
  { id: { type: String, required: true }, description: { type: String, required: true }, input: { type: String, required: true }, expected: { type: String, required: true } },
  { _id: false },
);

const codeExampleSchema = new Schema(
  { language: { type: String, enum: CMS_LANGUAGES, required: true }, code: { type: String, required: true } },
  { _id: false },
);

const quickCheckSchema = new Schema(
  {
    question: { type: String, required: true },
    options: { type: [String], required: true },
    correctIndex: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false },
);

/** `starterCode` is keyed by `CmsLanguage` — Mixed rather than a Map so a
 * `.lean()` read is a plain object, matching `courseProgress.checkpointStats`'s
 * own documented reasoning for the same choice. */
const codingActivitySchema = new Schema(
  {
    prompt: { type: String, required: true },
    constraints: { type: [String], default: undefined },
    functionName: { type: String, required: true },
    requiredKeywords: { type: [String], required: true, default: [] },
    starterCode: { type: Schema.Types.Mixed, required: true, default: () => ({}) },
    languages: { type: [{ type: String, enum: CMS_LANGUAGES }], required: true },
    visibleTests: { type: [testCaseSchema], required: true, default: [] },
    hiddenTests: { type: [testCaseSchema], required: true, default: [] },
    hint: { type: String, default: "" },
    mistakeFeedback: { type: String, default: "" },
    executionMode: { type: String, enum: CMS_EXECUTION_MODES, required: true, default: "disabled" },
    harnessKey: { type: String, default: null },
  },
  { _id: false },
);

const animationRefSchema = new Schema({ id: { type: String, required: true }, title: { type: String, default: null } }, { _id: false });

const theoryBlockSchema = new Schema({ heading: { type: String, required: true }, body: { type: String, required: true } }, { _id: false });

/** Trees module only. Mongoose doesn't need a recursive `TreeVizNode` schema
 * declared up front — `Schema.Types.Mixed` holds the (small, learner-authored)
 * tree as-is, same reasoning as `starterCode` above. */
const traversalVisualSchema = new Schema(
  {
    tree: { type: Schema.Types.Mixed, required: true },
    preorder: { type: [Number], required: true },
    inorder: { type: [Number], required: true },
    postorder: { type: [Number], required: true },
  },
  { _id: false },
);

const callStackFrameSchema = new Schema(
  { label: { type: String, required: true }, kind: { type: String, enum: ["call", "base-case", "return"], required: true }, detail: { type: String, default: null } },
  { _id: false },
);
const callStackVisualSchema = new Schema({ frames: { type: [callStackFrameSchema], required: true, default: [] } }, { _id: false });

const twoPointerVisualSchema = new Schema(
  { values: { type: [Number], required: true }, mode: { type: String, enum: ["opposite", "same-direction"], required: true } },
  { _id: false },
);

const workspaceSchema = new Schema(
  {
    title: { type: String, required: true },
    theory: { type: [theoryBlockSchema], required: true, default: [] },
    learnMore: { type: String, default: null },
    visual: { type: traversalVisualSchema, default: undefined },
    callStackVisual: { type: callStackVisualSchema, default: undefined },
    twoPointerVisual: { type: twoPointerVisualSchema, default: undefined },
    codeExamples: { type: [codeExampleSchema], default: undefined },
    quickCheck: { type: quickCheckSchema, default: undefined },
    codingActivity: { type: codingActivitySchema, default: undefined },
    animation: { type: animationRefSchema, default: undefined },
  },
  { _id: false },
);

const checkpointSchema = new Schema(
  {
    id: { type: String, required: true },
    moduleId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    type: { type: String, enum: CMS_CHECKPOINT_TYPES, required: true },
    xp: { type: Number, required: true },
    masteryXp: { type: Number, default: null },
    prerequisites: { type: [String], required: true, default: [] },
    legacyNodeId: { type: Number, default: null },
    workspace: { type: workspaceSchema, default: undefined },
    state: { type: String, enum: CMS_ENTITY_STATES, required: true, default: "active" },
  },
  { _id: false },
);

const moduleSchema = new Schema(
  {
    id: { type: String, required: true },
    zoneId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    icon: { type: String, default: "" },
    accentColor: { type: String, default: "" },
    contentKind: { type: String, enum: ["legacy", "workspace"], default: undefined },
    checkpoints: { type: [checkpointSchema], required: true, default: [] },
    state: { type: String, enum: CMS_ENTITY_STATES, required: true, default: "active" },
  },
  { _id: false },
);

const zoneSchema = new Schema(
  {
    id: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    modules: { type: [moduleSchema], required: true, default: [] },
    state: { type: String, enum: CMS_ENTITY_STATES, required: true, default: "active" },
  },
  { _id: false },
);

export const CMS_VERSION_STATUSES = ["draft", "published", "archived"] as const;

const cmsCourseVersionSchema = new Schema(
  {
    courseId: { type: String, required: true, maxlength: 64 },
    /** Immutable, human-readable — `v1`, `v2`, … (Phase 3B plan §14, never a bare date). */
    versionId: { type: String, required: true, maxlength: 32 },
    status: { type: String, enum: CMS_VERSION_STATUSES, required: true, default: "draft" },
    /** The published version this draft/version was branched from, if any. */
    createdFromVersion: { type: String, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    publishedAt: { type: Date, default: null },
    /** Optimistic-concurrency guard (Phase 3B plan §9) — every successful
     * PATCH increments this; a PATCH whose `expectedRevision` does not match
     * the stored value is rejected rather than silently overwriting another
     * admin's edit. Published/archived versions never change revision again. */
    revision: { type: Number, required: true, default: 1 },

    title: { type: String, required: true, maxlength: 120 },
    courseType: { type: String, enum: CMS_COURSE_TYPES, required: true },
    zones: { type: [zoneSchema], required: true, default: [] },
  },
  { timestamps: true, collection: "cmsCourseVersions" },
);

cmsCourseVersionSchema.index({ courseId: 1, versionId: 1 }, { unique: true });
cmsCourseVersionSchema.index(
  { courseId: 1 },
  { unique: true, partialFilterExpression: { status: "draft" }, name: "one_draft_per_course" },
);

export type CmsCourseVersionAttributes = InferSchemaType<typeof cmsCourseVersionSchema>;

export const CmsCourseVersion = model("CmsCourseVersion", cmsCourseVersionSchema);
