import { model, Schema, type InferSchemaType } from "mongoose";

import { CMS_PACKAGE_CAPABILITIES, CMS_PACKAGE_SOURCE_KINDS, CMS_PACKAGE_STATUSES } from "./animationPackage.types.js";

/**
 * `cmsAnimationPackages` — one document per package REVISION (see
 * animationPackage.types.ts's header comment for the draft/frozen model).
 * Uploaded/authored code is stored as plain text/base64 fields only — never
 * executed by the backend in any form (no `eval`, no child process, no
 * server-side rendering of the HTML).
 */

const assetSchema = new Schema(
  { path: { type: String, required: true }, contentType: { type: String, required: true }, dataBase64: { type: String, required: true } },
  { _id: false },
);

const manifestSchema = new Schema(
  {
    bridgeVersion: { type: Number, required: true },
    heightPx: { type: Number, required: true },
    capabilities: { type: [{ type: String, enum: CMS_PACKAGE_CAPABILITIES }], required: true, default: [] },
    traceEvents: { type: [String], required: true, default: [] },
  },
  { _id: false },
);

const packageTraceStepCodeSchema = new Schema(
  {
    pseudocode: { type: String, required: true },
    python: { type: String, default: null },
    cpp: { type: String, default: null },
    java: { type: String, default: null },
  },
  { _id: false },
);
const packageTraceStepSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    animationEvent: { type: String, default: null },
    code: { type: packageTraceStepCodeSchema, required: true },
  },
  { _id: false },
);
/** `trace.json`, stored as-parsed — see animationPackage.types.ts's
 * `CmsPackageTrace` comment for why its shape differs from the existing
 * flat `CmsTraceStep`. */
const packageTraceSchema = new Schema({ version: { type: Number, required: true }, steps: { type: [packageTraceStepSchema], required: true, default: [] } }, { _id: false });

const animationPackageSchema = new Schema(
  {
    packageId: { type: String, required: true, maxlength: 64 },
    /** `"draft"` for the single mutable working copy, else `"r1"`, `"r2"`, … — immutable once created. */
    revisionId: { type: String, required: true, maxlength: 32 },
    status: { type: String, enum: CMS_PACKAGE_STATUSES, required: true, default: "draft" },
    /** Optimistic-concurrency guard, same pattern as `cmsCourseVersions.revision` — only meaningful for the `"draft"` revision. */
    revision: { type: Number, required: true, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, required: true, maxlength: 200 },
    manifest: { type: manifestSchema, required: true },
    sourceKind: { type: String, enum: CMS_PACKAGE_SOURCE_KINDS, required: true },
    html: { type: String, required: true },
    css: { type: String, default: null },
    js: { type: String, default: null },
    assets: { type: [assetSchema], required: true, default: [] },
    packageTrace: { type: packageTraceSchema, default: null },

    /** Set only on a `"draft"` revision, after it has been frozen at least
     * once — lets `freezePackageRevisionIfNeeded` reuse the same frozen
     * revision across repeated course publishes when the package hasn't
     * actually changed since, instead of minting a new one every time. */
    lastFrozenRevisionId: { type: String, default: null },
    lastFrozenContentHash: { type: String, default: null },
  },
  { timestamps: true, collection: "cmsAnimationPackages" },
);

animationPackageSchema.index({ packageId: 1, revisionId: 1 }, { unique: true });
animationPackageSchema.index(
  { packageId: 1 },
  { unique: true, partialFilterExpression: { status: "draft" }, name: "one_draft_revision_per_package" },
);

export type CmsAnimationPackageAttributes = InferSchemaType<typeof animationPackageSchema>;

export const CmsAnimationPackage = model("CmsAnimationPackage", animationPackageSchema);
