import * as narrationService from "./narration/narration.service.js";
import {
  courseNarrationGenerateSchema, narrationAudioParams, narrationGenerateSchema, narrationOverviewQuery, narrationSettingsSchema,
  type CourseNarrationGenerateInput, type NarrationAudioParams, type NarrationGenerateInput, type NarrationSettingsInput,
} from "./narration/narration.schema.js";
import { Router } from "express";

import { currentUserId, requireAuth, requireRole } from "../../middleware/auth.js";
import { query, body, params, validate } from "../../middleware/validate.js";
import { sendData } from "../../shared/envelope.js";
import * as cmsService from "./cms.service.js";
import * as courseDeletion from "./courseDeletion.service.js";
import { permanentDeleteRateLimit } from "../../middleware/rateLimit.js";
import * as animationPackageService from "./animationPackage.service.js";
import { courseIdParams, createCourseSchema, permanentDeleteSchema, type PermanentDeleteInput, saveDraftSchema, updateCourseDetailsSchema, type CreateCourseInput, type UpdateCourseDetailsInput, versionIdParams, type CourseIdParams, type SaveDraftInput, type VersionIdParams } from "./cms.schema.js";
import { z } from "zod";
import { curriculumId } from "../../shared/ids.js";
const learnerPackageRevisionParams = z.object({ courseId: curriculumId, packageId: z.string().trim().min(1).max(64), revisionId: z.string().trim().min(1).max(32) });
type LearnerPackageRevisionParams = z.infer<typeof learnerPackageRevisionParams>;
import {
  createPackageSchema,
  packageIdParams,
  packageRevisionParams,
  savePackageContentSchema,
  uploadZipPackageSchema,
  type CreatePackageInput,
  type PackageIdParams,
  type PackageRevisionParams,
  type SavePackageContentInput,
  type UploadZipPackageInput,
} from "./animationPackage.schema.js";
import { ANIMATION_PACKAGE_LIMITS, CMS_PACKAGE_CAPABILITIES, type CmsPackageCapability } from "./animationPackage.types.js";

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

cmsRouter.post("/cms/courses", requireAuth, requireRole("admin"), validate({ body: createCourseSchema }), async (req, res) => {
  const created = await cmsService.createCourse(currentUserId(req), body<CreateCourseInput>(req));
  sendData(res, created, 201);
});

cmsRouter.get("/cms/courses/:courseId", requireAuth, requireRole("admin"), validate({ params: courseIdParams }), async (req, res) => {
  sendData(res, await cmsService.getCourseSummary(params<CourseIdParams>(req).courseId));
});

cmsRouter.patch(
  "/cms/courses/:courseId/details",
  requireAuth,
  requireRole("admin"),
  validate({ params: courseIdParams, body: updateCourseDetailsSchema }),
  async (req, res) => {
    sendData(res, await cmsService.updateCourseDetails(params<CourseIdParams>(req).courseId, body<UpdateCourseDetailsInput>(req)));
  },
);

/** Read-only: what permanently deleting this course would remove, and whether anything blocks it. Admin only. */
cmsRouter.get("/cms/courses/:courseId/delete-impact", requireAuth, requireRole("admin"), validate({ params: courseIdParams }), async (req, res) => {
  sendData(res, await courseDeletion.getDeletionImpact(params<CourseIdParams>(req).courseId));
});

/** Irreversible. Requires the CURRENT admin's password and the exact course title (POST, not DELETE, so the credentials travel in a body). */
cmsRouter.post(
  "/cms/courses/:courseId/permanent-delete",
  requireAuth,
  requireRole("admin"),
  permanentDeleteRateLimit,
  validate({ params: courseIdParams, body: permanentDeleteSchema }),
  async (req, res) => {
    sendData(res, await courseDeletion.deleteCoursePermanently(params<CourseIdParams>(req).courseId, currentUserId(req), body<PermanentDeleteInput>(req)));
  },
);

/** Learner-facing catalog of published CMS-created courses (library cards). Authenticated, not admin-only. */
cmsRouter.get("/courses", requireAuth, async (_req, res) => {
  sendData(res, await cmsService.listPublishedCatalog());
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
 * `/api/v1/cms/animation-packages/**` — the custom HTML animation authoring
 * subsystem's storage API, admin-only like the rest of `/cms/**`. See
 * animationPackage.types.ts's header comment for the draft/frozen revision
 * model. ZIP uploads travel as base64 JSON (see animationPackage.schema.ts)
 * rather than multipart, so they're gated by the same JSON_BODY_LIMIT as
 * every other route plus this schema's own `zipBase64` presence check —
 * `extractZipPackage` in the service layer enforces the real byte limits
 * once decoded.
 */
cmsRouter.post("/cms/animation-packages", requireAuth, requireRole("admin"), validate({ body: createPackageSchema }), async (req, res) => {
  const { title } = body<CreatePackageInput>(req);
  sendData(res, await animationPackageService.createDraftPackage(currentUserId(req), title));
});

cmsRouter.get("/cms/animation-packages", requireAuth, requireRole("admin"), async (_req, res) => {
  sendData(res, await animationPackageService.listPackages());
});

cmsRouter.get(
  "/cms/animation-packages/:packageId",
  requireAuth,
  requireRole("admin"),
  validate({ params: packageIdParams }),
  async (req, res) => {
    const { packageId } = params<PackageIdParams>(req);
    sendData(res, await animationPackageService.getDraftPackage(packageId));
  },
);

/** Fetches a SPECIFIC revision — `"draft"` (the mutable working copy) or a
 * frozen `"r1"`, `"r2"`, … . Needed for Preview Draft and Code Trace
 * authoring to render a checkpoint's animation exactly as it's actually
 * referenced (which may be a frozen revision if the course draft hasn't
 * been re-pointed at "draft" since a previous publish), not just whatever
 * the package's current mutable draft happens to say right now. */
cmsRouter.get(
  "/cms/animation-packages/:packageId/revisions/:revisionId",
  requireAuth,
  requireRole("admin"),
  validate({ params: packageRevisionParams }),
  async (req, res) => {
    const { packageId, revisionId } = params<PackageRevisionParams>(req);
    sendData(res, await animationPackageService.getPackageRevision(packageId, revisionId));
  },
);

/**
 * Narration (text-to-speech) — admin-only, like everything under `/cms/**`. Generation runs on the backend with the
 * server-configured provider; learners never reach these routes (requireRole("admin") is enforced server-side) and play
 * stored audio from the frozen package revision instead.
 */
cmsRouter.get("/cms/animation-packages/:packageId/narration", requireAuth, requireRole("admin"), validate({ params: packageIdParams, query: narrationOverviewQuery }), async (req, res) => {
  const { packageId } = params<PackageIdParams>(req);
  const { revisionId } = query<{ revisionId?: string }>(req);
  sendData(res, await narrationService.getNarrationOverview(packageId, revisionId ?? "draft"));
});

cmsRouter.patch("/cms/animation-packages/:packageId/narration", requireAuth, requireRole("admin"), validate({ params: packageIdParams, body: narrationSettingsSchema }), async (req, res) => {
  const { packageId } = params<PackageIdParams>(req);
  sendData(res, await narrationService.updateNarrationSettings(packageId, body<NarrationSettingsInput>(req)));
});

cmsRouter.post("/cms/animation-packages/:packageId/narration/generate", requireAuth, requireRole("admin"), validate({ params: packageIdParams, body: narrationGenerateSchema }), async (req, res) => {
  const { packageId } = params<PackageIdParams>(req);
  const input = body<NarrationGenerateInput>(req);
  sendData(res, await narrationService.generateNarration(packageId, { mode: input.mode, stepId: input.stepId, force: input.force }));
});

cmsRouter.get("/cms/animation-packages/:packageId/revisions/:revisionId/narration/audio/:stepId", requireAuth, requireRole("admin"), validate({ params: narrationAudioParams }), async (req, res) => {
  const { packageId, revisionId, stepId } = params<NarrationAudioParams>(req);
  sendData(res, await narrationService.getNarrationAudio(packageId, revisionId, stepId));
});

cmsRouter.post("/cms/courses/:courseId/narration/generate", requireAuth, requireRole("admin"), validate({ params: courseIdParams, body: courseNarrationGenerateSchema }), async (req, res) => {
  const { courseId } = params<CourseIdParams>(req);
  const input = body<CourseNarrationGenerateInput>(req);
  sendData(res, await narrationService.generateCourseNarration(courseId, input.mode, { force: input.force }));
});

cmsRouter.patch(
  "/cms/animation-packages/:packageId",
  requireAuth,
  requireRole("admin"),
  validate({ params: packageIdParams, body: savePackageContentSchema }),
  async (req, res) => {
    const { packageId } = params<PackageIdParams>(req);
    // `input.packageTrace` (whole-tree-replace, like every other field
    // here — see the schema's own comment) flows straight through.
    const input = body<SavePackageContentInput>(req);
    sendData(res, await animationPackageService.savePackageDraftContent(packageId, currentUserId(req), input, "html", []));
  },
);

cmsRouter.post(
  "/cms/animation-packages/:packageId/upload-zip",
  requireAuth,
  requireRole("admin"),
  validate({ params: packageIdParams, body: uploadZipPackageSchema }),
  async (req, res) => {
    const { packageId } = params<PackageIdParams>(req);
    const input = body<UploadZipPackageInput>(req);
    const zipBuffer = Buffer.from(input.zipBase64, "base64");
    if (zipBuffer.byteLength === 0) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "zipBase64 did not decode to any bytes." } });
      return;
    }
    if (zipBuffer.byteLength > ANIMATION_PACKAGE_LIMITS.maxZipCompressedBytes) {
      res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: `ZIP exceeds the ${ANIMATION_PACKAGE_LIMITS.maxZipCompressedBytes}-byte compressed size limit.` },
      });
      return;
    }
    const extracted = await animationPackageService.extractZipPackage(zipBuffer);
    animationPackageService.assertAssetContentTypesAllowed(extracted.assets);
    // manifest.json's `capabilities` isn't trusted as-is — only entries that
    // are actually valid CMS_PACKAGE_CAPABILITY values survive; anything
    // else is silently dropped rather than rejecting the whole upload.
    const knownCapabilities = new Set(CMS_PACKAGE_CAPABILITIES as readonly string[]);
    const capabilities = (extracted.manifestFromZip?.capabilities ?? []).filter((c) => knownCapabilities.has(c)) as CmsPackageCapability[];
    const traceEvents = extracted.manifestFromZip?.traceEvents ?? [];
    // Cross-field check once BOTH manifest and trace.json are known — see
    // `validatePackageTraceAgainstManifest`'s own doc comment. Rejects the
    // whole upload (never a partial save) if trace.json references a
    // semantic event the manifest never declared.
    if (extracted.packageTrace) {
      animationPackageService.validatePackageTraceAgainstManifest(extracted.packageTrace, traceEvents);
    }
    sendData(
      res,
      await animationPackageService.savePackageDraftContent(
        packageId,
        currentUserId(req),
        {
          title: input.title,
          manifest: { heightPx: extracted.manifestFromZip?.heightPx ?? 420, capabilities, traceEvents },
          html: extracted.html,
          css: extracted.css,
          js: extracted.js,
          packageTrace: extracted.packageTrace,
          expectedRevision: input.expectedRevision,
          ...(extracted.narration ? { narration: extracted.narration } : {}),
        },
        "zip",
        extracted.assets,
      ),
    );
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

/**
 * Learner-side frozen package read — see `getLearnerReferencedPackageRevision`.
 * `requireAuth` only (no admin role); the package must be referenced by the
 * caller's own pinned published version, so this is never a general CMS read.
 */
cmsRouter.get(
  "/me/courses/:courseId/animation-packages/:packageId/revisions/:revisionId",
  requireAuth,
  validate({ params: learnerPackageRevisionParams }),
  async (req, res) => {
    const { courseId, packageId, revisionId } = params<LearnerPackageRevisionParams>(req);
    sendData(res, await cmsService.getLearnerReferencedPackageRevision(courseId, currentUserId(req), packageId, revisionId));
  },
);
