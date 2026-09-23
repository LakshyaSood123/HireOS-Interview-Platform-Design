import { model, Schema, type InferSchemaType } from "mongoose";

import { CMS_COURSE_TYPES } from "./cms.types.js";

/**
 * `cmsCourses` — one thin pointer document per course. Schema doc:
 * Phase 3B plan §6/8. Never holds authored content itself; `latestDraftVersion`
 * and `latestPublishedVersion` point at `cmsCourseVersions` documents.
 */
const cmsCourseSchema = new Schema(
  {
    courseId: { type: String, required: true, unique: true, maxlength: 64 },
    title: { type: String, required: true, maxlength: 120 },
    courseType: { type: String, enum: CMS_COURSE_TYPES, required: true },
    latestDraftVersion: { type: String, default: null },
    latestPublishedVersion: { type: String, default: null },
  },
  { timestamps: true, collection: "cmsCourses" },
);

export type CmsCourseAttributes = InferSchemaType<typeof cmsCourseSchema>;

export const CmsCourse = model("CmsCourse", cmsCourseSchema);
