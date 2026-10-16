import { model, Schema, type InferSchemaType } from "mongoose";

import { CMS_COURSE_TYPES } from "./cms.types.js";

/**
 * `cmsCourses` — one thin pointer document per course. Schema doc:
 * Phase 3B plan §6/8. Never holds authored content itself; `latestDraftVersion`
 * and `latestPublishedVersion` point at `cmsCourseVersions` documents.
 */
/**
 * Learner-library card metadata for a course created through the CMS (title, short description, category, ...). Optional: courses
 * that pre-date CMS course creation (DSA, Machine Learning) have none and are listed by their own static library cards.
 */
const courseDetailsSchema = new Schema(
  {
    subtitle: { type: String, default: "" },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    category: { type: String, default: "" },
    difficulty: { type: String, default: "Beginner" },
    duration: { type: String, default: "" },
    instructor: { type: String, default: "" },
    tags: { type: [String], default: [] },
    accentColor: { type: String, default: "#1DB584" },
  },
  { _id: false },
);

const cmsCourseSchema = new Schema(
  {
    courseId: { type: String, required: true, unique: true, maxlength: 64 },
    title: { type: String, required: true, maxlength: 120 },
    courseType: { type: String, enum: CMS_COURSE_TYPES, required: true },
    latestDraftVersion: { type: String, default: null },
    latestPublishedVersion: { type: String, default: null },
    /** Provenance only ("manual" = created in Creator Studio). It never decides what the editor or the learner can do. */
    /** Explicit protection: a course with this flag can never be permanently deleted. (Courses without creationSource "manual" are never deletable either.) */
    systemProtected: { type: Boolean, default: undefined },
    creationSource: { type: String, enum: ["manual", "seed", "import"], default: undefined },
    details: { type: courseDetailsSchema, default: undefined },
  },
  { timestamps: true, collection: "cmsCourses" },
);

export type CmsCourseAttributes = InferSchemaType<typeof cmsCourseSchema>;

export const CmsCourse = model("CmsCourse", cmsCourseSchema);
