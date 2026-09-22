import { z } from "zod";

import { curriculumId } from "../../shared/ids.js";
import { ATTEMPT_TYPES } from "./learningAttempt.model.js";

/** Request shapes for the learning endpoints — mirrors docs/openapi.yaml. */

export const courseIdParams = z.object({ courseId: curriculumId });
export const moduleIdParams = z.object({ moduleId: curriculumId });
export const checkpointIdParams = z.object({ checkpointId: curriculumId });

export const courseIdQuery = z.object({ courseId: curriculumId });

/** At least one pointer, or there is nothing to set. */
export const setActiveSchema = z
  .object({
    moduleId: curriculumId.optional(),
    checkpointId: curriculumId.optional(),
  })
  .refine((value) => Boolean(value.moduleId ?? value.checkpointId), {
    message: "Provide moduleId, checkpointId, or both.",
  });

export const startModuleSchema = z.object({ courseId: curriculumId });

/** `import` marks a completion replayed from a browser's local progress on
 *  first sign-in (Day 3) — the ledger says where every point came from. */
export const COMPLETION_SOURCES = ["submit", "quick-check", "reading", "manual", "import"] as const;

export const completeCheckpointSchema = z.object({
  courseId: curriculumId,
  source: z.enum(COMPLETION_SOURCES).default("manual"),
  /** Day 4 passes the submission that earned it; stored on the ledger row. */
  submissionId: z.string().trim().max(64).optional(),
});

export const recordAttemptSchema = z.object({
  courseId: curriculumId,
  checkpointId: curriculumId,
  /** Accepted for contract compatibility and ignored — the owning module is
   *  read from the curriculum, the same way the user id is read from the
   *  token rather than the body. */
  moduleId: curriculumId.optional(),
  activityId: z.string().trim().min(1).max(120),
  attemptType: z.enum(ATTEMPT_TYPES),
  passed: z.boolean(),
  payload: z.record(z.string(), z.unknown()).nullable().optional(),
});

export type SetActiveInput = z.infer<typeof setActiveSchema>;
export type StartModuleInput = z.infer<typeof startModuleSchema>;
export type CompleteCheckpointInput = z.infer<typeof completeCheckpointSchema>;
export type RecordAttemptInput = z.infer<typeof recordAttemptSchema>;
export type CourseIdParams = z.infer<typeof courseIdParams>;
export type ModuleIdParams = z.infer<typeof moduleIdParams>;
export type CheckpointIdParams = z.infer<typeof checkpointIdParams>;
export type CourseIdQuery = z.infer<typeof courseIdQuery>;
