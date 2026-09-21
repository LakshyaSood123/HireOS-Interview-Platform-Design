import { Router } from "express";

import { currentUserId, requireAuth } from "../../middleware/auth.js";
import { body, params, query, validate } from "../../middleware/validate.js";
import { sendData } from "../../shared/envelope.js";
import * as learningService from "./learning.service.js";
import {
  checkpointIdParams,
  completeCheckpointSchema,
  courseIdParams,
  courseIdQuery,
  moduleIdParams,
  recordAttemptSchema,
  setActiveSchema,
  startModuleSchema,
  type CheckpointIdParams,
  type CompleteCheckpointInput,
  type CourseIdParams,
  type CourseIdQuery,
  type ModuleIdParams,
  type RecordAttemptInput,
  type SetActiveInput,
  type StartModuleInput,
} from "./learning.schema.js";

/**
 * Learning routes — docs/03-API-CONTRACT.md "Learning".
 *
 * Every one of them is `requireAuth`, and every one passes
 * `currentUserId(req)` into the service. There is no path by which a route
 * here reads a user id from a body, a query or a header.
 */
export const learningRouter = Router();

learningRouter.get(
  "/me/courses/:courseId/state",
  requireAuth,
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await learningService.getCourseState(currentUserId(req), courseId));
  },
);

learningRouter.put(
  "/me/courses/:courseId/active",
  requireAuth,
  validate({ params: courseIdParams, body: setActiveSchema }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    const result = await learningService.setActive(currentUserId(req), courseId, body<SetActiveInput>(req));
    sendData(res, result);
  },
);

learningRouter.post(
  "/me/modules/:moduleId/start",
  requireAuth,
  validate({ params: moduleIdParams, body: startModuleSchema }),
  async (req, res) => {
    const { moduleId } = params<ModuleIdParams>(req);
    const { courseId } = body<StartModuleInput>(req);
    sendData(res, await learningService.startModule(currentUserId(req), courseId, moduleId));
  },
);

learningRouter.get(
  "/me/modules/:moduleId/progress",
  requireAuth,
  validate({ params: moduleIdParams, query: courseIdQuery }),
  async (req, res) => {
    const { moduleId } = params<ModuleIdParams>(req);
    const { courseId } = query<CourseIdQuery>(req);
    sendData(res, await learningService.getModuleProgress(currentUserId(req), courseId, moduleId));
  },
);

learningRouter.post(
  "/me/checkpoints/:checkpointId/complete",
  requireAuth,
  validate({ params: checkpointIdParams, body: completeCheckpointSchema }),
  async (req, res) => {
    const { checkpointId } = params<CheckpointIdParams>(req);
    const { courseId, source, submissionId } = body<CompleteCheckpointInput>(req);

    // Always 200, whether this completed the checkpoint or found it already
    // complete: "already completed" is a state, not an HTTP error.
    sendData(
      res,
      await learningService.completeCheckpoint(currentUserId(req), courseId, checkpointId, {
        source,
        submissionId,
      }),
    );
  },
);

learningRouter.post(
  "/me/attempts",
  requireAuth,
  validate({ body: recordAttemptSchema }),
  async (req, res) => {
    const result = await learningService.recordAttempt(currentUserId(req), body<RecordAttemptInput>(req));
    sendData(res, result, 201);
  },
);
