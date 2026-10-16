import { z } from "zod";

import { curriculumId } from "../../shared/ids.js";
import { CMS_CHECKPOINT_TYPES, CMS_CUSTOM_BRIDGE_MODES, CMS_ENTITY_STATES, CMS_EXECUTION_MODES, CMS_LANGUAGES } from "./cms.types.js";
import type { CmsTreeVizNode } from "./cms.types.js";

/** Request shapes for `/api/v1/cms/**` — mirrors `cms.types.ts`. Every
 * mutation is admin-only (`requireRole("admin")` in `cms.routes.ts`). */

export const courseIdParams = z.object({ courseId: curriculumId });
export type CourseIdParams = z.infer<typeof courseIdParams>;

export const versionIdParams = z.object({ courseId: curriculumId, versionId: z.string().trim().min(1).max(32) });
export type VersionIdParams = z.infer<typeof versionIdParams>;

/** Creator Studio "Create Course" / "Course Details" fields (the same ones the existing course form collects). */
export const COURSE_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;
const courseDetailsFields = {
  title: z.string().trim().min(1, "A course title is required.").max(120),
  subtitle: z.string().trim().max(200).default(""),
  shortDescription: z.string().trim().min(1, "A short description is required.").max(300),
  description: z.string().trim().max(4000).default(""),
  category: z.string().trim().max(60).default(""),
  difficulty: z.enum(COURSE_DIFFICULTIES).default("Beginner"),
  duration: z.string().trim().max(40).default(""),
  instructor: z.string().trim().max(80).default(""),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  accentColor: z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, "Accent colour must look like #1DB584.").default("#1DB584"),
};
export const createCourseSchema = z.object(courseDetailsFields);
export type CreateCourseInput = z.infer<typeof createCourseSchema>;
/** Permanent delete: the admin's CURRENT password and the exact course title. Neither is ever logged or stored. */
export const permanentDeleteSchema = z.object({ password: z.string().min(1, "Enter your password.").max(200), confirmation: z.string().min(1, "Type the course title to confirm.").max(200) });
export type PermanentDeleteInput = z.infer<typeof permanentDeleteSchema>;
export const updateCourseDetailsSchema = z.object(courseDetailsFields).partial().refine((v) => Object.keys(v).length > 0, "Nothing to update.");
export type UpdateCourseDetailsInput = z.infer<typeof updateCourseDetailsSchema>;

const theoryBlockSchema = z.object({ heading: z.string().max(200), body: z.string().max(4000) });
const codeExampleSchema = z.object({ language: z.enum(CMS_LANGUAGES), code: z.string().max(8000) });
const quickCheckSchema = z.object({
  question: z.string().max(2000),
  options: z.array(z.string().max(500)).min(2).max(6),
  correctIndex: z.number().int().min(0),
  explanation: z.string().max(2000),
});
const testCaseSchema = z.object({
  id: z.string().min(1).max(64),
  description: z.string().max(500),
  input: z.string().max(2000),
  expected: z.string().max(2000),
});
const codingActivitySchema = z.object({
  prompt: z.string().max(4000),
  constraints: z.array(z.string().max(500)).optional(),
  functionName: z.string().max(120),
  requiredKeywords: z.array(z.string().max(60)).default([]),
  starterCode: z.partialRecord(z.enum(CMS_LANGUAGES), z.string().max(8000)),
  languages: z.array(z.enum(CMS_LANGUAGES)).min(1),
  visibleTests: z.array(testCaseSchema).default([]),
  hiddenTests: z.array(testCaseSchema).default([]),
  hint: z.string().max(2000).default(""),
  mistakeFeedback: z.string().max(2000).default(""),
  executionMode: z.enum(CMS_EXECUTION_MODES).default("disabled"),
  // `.nullable()` alongside `.optional()`: the Mongoose model stores this
  // (and the other fields marked the same way below) with `default: null`,
  // so a GET of an untouched draft serializes it as `null`, not omitted.
  // `.optional()` alone rejects `null`, which broke the basic load-then-save
  // round trip — PATCHing back an unmodified draft 400'd. Found while wiring
  // Creator Studio to this route.
  harnessKey: z.string().max(64).nullable().optional(),
});
const registeredAnimationSourceSchema = z.object({
  kind: z.literal("registered"),
  id: z.string().min(1).max(64),
  title: z.string().max(200).nullable().optional(),
});
const customAnimationSourceSchema = z.object({
  kind: z.literal("custom"),
  packageId: z.string().min(1).max(64),
  revisionId: z.string().min(1).max(32),
  title: z.string().max(200).nullable().optional(),
  bridgeMode: z.enum(CMS_CUSTOM_BRIDGE_MODES),
});
/** `z.preprocess` injects `kind: "registered"` when it's absent — a draft
 * created before this discriminated union existed still holds the old bare
 * `{ id, title? }` shape (see cms.types.ts's `normalizeAnimationSource`,
 * the same fallback at the TS-type level). Without this, PATCHing back a
 * pre-existing draft's OWN unmodified data would 400 — the exact
 * load-then-save bug class already fixed once for masteryXp/legacyNodeId/
 * etc., here for a field this change itself introduces. New data written
 * by the frontend always sends `kind` explicitly; this only widens what's
 * ACCEPTED, not what's produced. */
const traceStepSchema = z.object({
  stepId: z.string().min(1).max(64),
  label: z.string().max(200),
  pseudocode: z.string().max(2000), // may be empty in a draft; publish validation requires it
  python: z.string().max(2000).nullable().optional(),
  cpp: z.string().max(2000).nullable().optional(),
  java: z.string().max(2000).nullable().optional(),
  animationEvent: z.string().max(64).nullable().optional(),
});
const traceSourceSchema = z.object({
  kind: z.enum(["registered", "cms", "package", "none"]),
  steps: z.array(traceStepSchema).max(200).optional(),
});

const animationSourceSchema = z.preprocess((value) => {
  if (value && typeof value === "object" && !("kind" in value) && "id" in value) {
    return { kind: "registered", ...value };
  }
  return value;
}, z.discriminatedUnion("kind", [registeredAnimationSourceSchema, customAnimationSourceSchema]));

const treeVizNodeSchema: z.ZodType<CmsTreeVizNode> = z.lazy(() =>
  z.object({
    value: z.number(),
    left: treeVizNodeSchema.optional(),
    right: treeVizNodeSchema.optional(),
  }),
);
const traversalVisualSchema = z.object({
  tree: treeVizNodeSchema,
  preorder: z.array(z.number()),
  inorder: z.array(z.number()),
  postorder: z.array(z.number()),
});
const callStackFrameSchema = z.object({
  label: z.string().max(200),
  kind: z.enum(["call", "base-case", "return"]),
  detail: z.string().max(500).nullable().optional(),
});
const callStackVisualSchema = z.object({ frames: z.array(callStackFrameSchema).default([]) });
const twoPointerVisualSchema = z.object({ values: z.array(z.number()), mode: z.enum(["opposite", "same-direction"]) });

const workspaceSchema = z.object({
  title: z.string().min(1).max(200),
  theory: z.array(theoryBlockSchema).default([]),
  learnMore: z.string().max(4000).nullable().optional(),
  visual: traversalVisualSchema.optional(),
  callStackVisual: callStackVisualSchema.optional(),
  twoPointerVisual: twoPointerVisualSchema.optional(),
  codeExamples: z.array(codeExampleSchema).optional(),
  quickCheck: quickCheckSchema.optional(),
  codingActivity: codingActivitySchema.optional(),
  animation: animationSourceSchema.optional(),
  traceSource: traceSourceSchema.optional(),
});

const layoutBlockSchema = z.object({
  type: z.enum(["concepts", "animation", "codeTrace", "quickCheck", "coding"]),
  span: z.number().int().min(1).max(12),
  hidden: z.boolean().optional(),
});
const layoutRowSchema = z.object({ blocks: z.array(layoutBlockSchema).min(1).max(4) });
const layoutSchema = z.object({ version: z.literal(1), rows: z.array(layoutRowSchema).max(8) });

const checkpointSchema = z.object({
  id: z.string().min(1).max(64),
  moduleId: z.string().min(1).max(64),
  order: z.number().int().min(0),
  title: z.string().max(200),
  subtitle: z.string().max(300).default(""),
  type: z.enum(CMS_CHECKPOINT_TYPES),
  xp: z.number().int().min(0),
  masteryXp: z.number().int().min(0).nullable().optional(),
  prerequisites: z.array(z.string().min(1).max(64)).default([]),
  legacyNodeId: z.number().int().nullable().optional(),
  workspace: workspaceSchema.optional(),
  layout: layoutSchema.optional(),
  state: z.enum(CMS_ENTITY_STATES),
});

const moduleSchema = z.object({
  id: z.string().min(1).max(64),
  zoneId: z.string().min(1).max(64),
  order: z.number().int().min(0),
  title: z.string().max(200),
  description: z.string().max(1000).default(""),
  icon: z.string().max(16).default(""),
  accentColor: z.string().max(16).default(""),
  contentKind: z.enum(["legacy", "workspace"]).optional(),
  checkpoints: z.array(checkpointSchema).default([]),
  state: z.enum(CMS_ENTITY_STATES),
});

const zoneSchema = z.object({
  id: z.string().min(1).max(64),
  order: z.number().int().min(0),
  title: z.string().max(200),
  description: z.string().max(1000).default(""),
  modules: z.array(moduleSchema).default([]),
  state: z.enum(CMS_ENTITY_STATES),
});

/** PATCH body — full-tree replace (matches how the frontend's
 * DsaEditorShell already always saves the whole draft, not a diff). */
export const saveDraftSchema = z.object({
  zones: z.array(zoneSchema),
  /** Optimistic-concurrency guard (Phase 3B plan §9). */
  expectedRevision: z.number().int().min(1),
});
export type SaveDraftInput = z.infer<typeof saveDraftSchema>;
