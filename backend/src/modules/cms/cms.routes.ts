import { Router } from "express";

import { currentUserId, requireAuth, requireRole } from "../../middleware/auth.js";
import { body, params, validate } from "../../middleware/validate.js";
import { sendData } from "../../shared/envelope.js";
import * as cmsService from "./cms.service.js";
import { courseIdParams, saveDraftSchema, versionIdParams, type CourseIdParams, type SaveDraftInput, type VersionIdParams } from "./cms.schema.js";

/**
 * `/api/v1/cms/**` — course-authoring endpoints, every one `requireRole("admin")`
 * (Phase 3B plan §8: "Do not trust frontend hiding" — a learner-role token is
 * rejected here regardless of what the Creator Studio UI shows or hides).
 *
 * `/api/v1/courses/**` — the learner-facing read side, `requireAuth` only.
 */
export const cmsRouter = Router();

cmsRouter.get("/cms/courses", requireAuth, requireRole("admin"), async (_req, res) => {
  sendData(res, await cmsService.listCourses());
});

cmsRouter.get(
  "/cms/courses/:courseId/draft",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await cmsService.getDraft(courseId));
  },
);

cmsRouter.patch(
  "/cms/courses/:courseId/draft",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams, body: saveDraftSchema }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await cmsService.saveDraft(courseId, currentUserId(req), body<SaveDraftInput>(req)));
  },
);

cmsRouter.get(
  "/cms/courses/:courseId/draft/validate",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    const issues = await cmsService.validateDraft(courseId);
    sendData(res, { issues, valid: issues.length === 0 });
  },
);

cmsRouter.post(
  "/cms/courses/:courseId/draft/publish",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await cmsService.publishDraft(courseId, currentUserId(req)));
  },
);

cmsRouter.post(
  "/cms/courses/:courseId/draft/reset",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await cmsService.resetDraft(courseId, currentUserId(req)));
  },
);

cmsRouter.get(
  "/cms/courses/:courseId/versions",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams }),
  async (req, res) => {
    const { courseId } = params<CourseIdParams>(req);
    sendData(res, await cmsService.listVersions(courseId));
  },
);

cmsRouter.post(
  "/cms/courses/:courseId/versions/:versionId/activate",
  requireAuth,
  requireRole("admin"),
  validate({ params: versionIdParams }),
  async (req, res) => {
    const { courseId, versionId } = params<VersionIdParams>(req);
    await cmsService.activateVersion(courseId, versionId);
    sendData(res, { activated: versionId });
  },
);

/**
 * Learner-facing published reads — no admin gate, `requireAuth` only. The
 * bare `/published` endpoint is "whatever is active right now"; the
 * `/versions/:versionId` endpoint is what a pinned learner actually resolves
 * against (Phase 3B plan §15) so `progress=v1, content=v2` never happens.
 */
cmsRouter.get("/courses/:courseId/published", requireAuth, validate({ params: courseIdParams }), async (req, res) => {
  const { courseId } = params<CourseIdParams>(req);
  sendData(res, await cmsService.getPublishedContent(courseId));
});

cmsRouter.get(
  "/courses/:courseId/versions/:versionId",
  requireAuth,
  validate({ params: versionIdParams }),
  async (req, res) => {
    const { courseId, versionId } = params<VersionIdParams>(req);
    sendData(res, await cmsService.getPublishedVersionById(courseId, versionId));
  },
);

/**
 * The authenticated learner's OWN pinned version, resolved server-side from
 * their `courseProgress.curriculumVersion` — see `getPinnedPublishedContent`
 * (Phase 3B hardening plan §4). This is the endpoint the frontend should
 * actually call for lesson content; `/courses/:courseId/published` always
 * answers with the latest, which is only correct for a learner who happens
 * to already be pinned to it.
 */
cmsRouter.get("/me/courses/:courseId/content", requireAuth, validate({ params: courseIdParams }), async (req, res) => {
  const { courseId } = params<CourseIdParams>(req);
  sendData(res, await cmsService.getPinnedPublishedContent(courseId, currentUserId(req)));
});
