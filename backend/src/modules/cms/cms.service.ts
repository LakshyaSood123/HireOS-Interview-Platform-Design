import type { ClientSession } from "mongoose";

import { ApiError } from "../../shared/errors.js";
import { withTransaction } from "../../shared/transaction.js";
import { CurriculumSnapshot } from "../curriculum/curriculum.model.js";
import { assertGraphIsSound, assertStructureOnly } from "../curriculum/snapshotBuilder.js";
import { forgetCurriculum } from "../curriculum/curriculum.service.js";
import { CourseProgress } from "../learning/courseProgress.model.js";
import { CmsCourse } from "./cmsCourse.model.js";
import { CmsCourseVersion, type CmsCourseVersionAttributes } from "./cmsCourseVersion.model.js";
import { validateCmsVersionContent, type CmsValidationIssue } from "./cms.validation.js";
import { buildSnapshotFromCmsVersion } from "./snapshotFromCmsVersion.js";
import type { CmsCourseType, CmsZone } from "./cms.types.js";

/** The draft document's `versionId` is always this literal string — it is
 * not a numbered version until it's published (Phase 3B plan §14: "Publishing
 * creates a new immutable published version"). The `one_draft_per_course`
 * partial unique index on `cmsCourseVersions` guarantees there is at most
 * one per course regardless of this shared id. */
const DRAFT_VERSION_ID = "draft";

export interface CmsCourseSummary {
  courseId: string;
  title: string;
  courseType: CmsCourseType;
  latestDraftVersion: string | null;
  latestPublishedVersion: string | null;
}

export async function listCourses(): Promise<CmsCourseSummary[]> {
  const courses = await CmsCourse.find().lean();
  return courses.map((course) => ({
    courseId: course.courseId,
    title: course.title,
    courseType: course.courseType as CmsCourseType,
    latestDraftVersion: course.latestDraftVersion ?? null,
    latestPublishedVersion: course.latestPublishedVersion ?? null,
  }));
}

async function getActivePublishedVersion(courseId: string): Promise<CmsCourseVersionAttributes & { _id: unknown } | null> {
  const course = await CmsCourse.findOne({ courseId }).lean();
  if (!course?.latestPublishedVersion) return null;
  return CmsCourseVersion.findOne({ courseId, versionId: course.latestPublishedVersion, status: "published" }).lean();
}

/**
 * Loads the mutable draft, creating one if none exists yet — FROM the
 * currently active published version only (Phase 3B plan §9). If no
 * published version exists either, this throws rather than reaching for the
 * frontend's static registry itself: the only place that ever converts
 * "the current static DSA" into CMS content is the explicit, idempotent
 * `bootstrapDsaCms.ts` script (plan §19) — never a live request handler.
 * That keeps the backend/frontend decoupling boundary (plan §5) real, not
 * just documented.
 */
export async function getDraft(courseId: string): Promise<CmsCourseVersionAttributes> {
  const existing = await CmsCourseVersion.findOne({ courseId, status: "draft" }).lean();
  if (existing) return existing;

  const active = await getActivePublishedVersion(courseId);
  if (!active) {
    throw ApiError.notFound(
      `No CMS content exists yet for course "${courseId}". Run the bootstrap script (backend/scripts/bootstrapDsaCms.ts) first.`,
    );
  }

  const draft = await CmsCourseVersion.create({
    courseId,
    versionId: DRAFT_VERSION_ID,
    status: "draft",
    createdFromVersion: active.versionId,
    createdBy: active.updatedBy,
    updatedBy: active.updatedBy,
    revision: 1,
    title: active.title,
    courseType: active.courseType,
    zones: active.zones,
  });
  await CmsCourse.updateOne({ courseId }, { $set: { latestDraftVersion: DRAFT_VERSION_ID } });
  return draft.toObject();
}

export async function saveDraft(
  courseId: string,
  actorId: string,
  input: { zones: CmsZone[]; expectedRevision: number },
): Promise<CmsCourseVersionAttributes> {
  const draft = await CmsCourseVersion.findOne({ courseId, status: "draft" });
  if (!draft) throw ApiError.notFound(`No draft exists for course "${courseId}". Load one first.`);

  if (draft.revision !== input.expectedRevision) {
    throw new ApiError("VALIDATION_ERROR", "This draft has changed since you loaded it — reload and reapply your edit.", {
      expectedRevision: input.expectedRevision,
      currentRevision: draft.revision,
    });
  }

  draft.zones = input.zones as CmsCourseVersionAttributes["zones"];
  draft.updatedBy = actorId as unknown as CmsCourseVersionAttributes["updatedBy"];
  draft.revision += 1;
  await draft.save();
  return draft.toObject();
}

export async function validateDraft(courseId: string): Promise<CmsValidationIssue[]> {
  const draft = await CmsCourseVersion.findOne({ courseId, status: "draft" }).lean();
  if (!draft) throw ApiError.notFound(`No draft exists for course "${courseId}". Load one first.`);
  return validateCmsVersionContent({ courseId: draft.courseId, title: draft.title, courseType: draft.courseType as CmsCourseType, zones: draft.zones as CmsZone[] });
}

export async function resetDraft(courseId: string, actorId: string): Promise<CmsCourseVersionAttributes> {
  const active = await getActivePublishedVersion(courseId);
  if (!active) throw ApiError.notFound(`No published version exists for course "${courseId}" to reset from.`);

  const draft = await CmsCourseVersion.findOneAndUpdate(
    { courseId, status: "draft" },
    {
      $set: {
        title: active.title,
        courseType: active.courseType,
        zones: active.zones,
        createdFromVersion: active.versionId,
        updatedBy: actorId,
      },
      $setOnInsert: { versionId: DRAFT_VERSION_ID, createdBy: actorId },
      $inc: { revision: 1 },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  await CmsCourse.updateOne({ courseId }, { $set: { latestDraftVersion: DRAFT_VERSION_ID } });
  return draft.toObject();
}

async function nextVersionId(courseId: string, session?: ClientSession): Promise<string> {
  const count = await CmsCourseVersion.countDocuments({ courseId, status: { $in: ["published", "archived"] } }).session(session ?? null);
  return `v${count + 1}`;
}

export interface PublishResult {
  version: CmsCourseVersionAttributes;
  snapshotVersion: string;
  snapshotCheckpointCount: number;
}

/**
 * Draft -> immutable published version -> derived runtime snapshot -> active
 * pointer flip, all in one Mongo transaction (Phase 3B plan §16). No step is
 * visible to a reader until every step has committed — a failure at any
 * point leaves the previously-active published version and its snapshot
 * exactly as they were.
 */
export async function publishDraft(courseId: string, actorId: string): Promise<PublishResult> {
  const draft = await CmsCourseVersion.findOne({ courseId, status: "draft" }).lean();
  if (!draft) throw ApiError.notFound(`No draft exists for course "${courseId}". Load one first.`);

  const issues = validateCmsVersionContent({ courseId: draft.courseId, title: draft.title, courseType: draft.courseType as CmsCourseType, zones: draft.zones as CmsZone[] });
  if (issues.length > 0) {
    throw ApiError.validation("The draft has validation errors and cannot be published.", { issues });
  }

  return withTransaction(async (session) => {
    const versionId = await nextVersionId(courseId, session);

    const created = await CmsCourseVersion.create(
      [
        {
          courseId: draft.courseId,
          versionId,
          status: "published",
          createdFromVersion: draft.createdFromVersion,
          createdBy: draft.createdBy,
          updatedBy: actorId,
          publishedAt: new Date(),
          revision: draft.revision,
          title: draft.title,
          courseType: draft.courseType,
          zones: draft.zones,
        },
      ],
      { session },
    );
    const published = created[0]!;

    let snapshotCheckpointCount = 0;

    if (draft.courseType === "structured-dsa") {
      const snapshotDraft = buildSnapshotFromCmsVersion(published.toObject(), { frontendCommit: null });
      assertStructureOnly(snapshotDraft);
      assertGraphIsSound(snapshotDraft);
      snapshotCheckpointCount = snapshotDraft.checkpoints.length;

      await CurriculumSnapshot.updateMany({ courseId, isActive: true }, { $set: { isActive: false } }, { session });
      await CurriculumSnapshot.findOneAndUpdate(
        { courseId, version: versionId },
        {
          $set: {
            title: snapshotDraft.title,
            version: snapshotDraft.version,
            frontendCommit: snapshotDraft.frontendCommit,
            structureHash: snapshotDraft.structureHash,
            isActive: true,
            zones: snapshotDraft.zones,
            modules: snapshotDraft.modules,
            checkpoints: snapshotDraft.checkpoints,
          },
        },
        { upsert: true, session, new: true },
      );
    }

    await CmsCourse.updateOne(
      { courseId },
      { $set: { latestPublishedVersion: versionId, latestDraftVersion: null, title: draft.title } },
      { session },
    );
    await CmsCourseVersion.deleteOne({ courseId, status: "draft" }, { session });

    forgetCurriculum(courseId);

    return {
      version: published.toObject(),
      snapshotVersion: versionId,
      snapshotCheckpointCount,
    };
  });
}

export interface CmsVersionSummary {
  versionId: string;
  status: string;
  createdFromVersion: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export async function listVersions(courseId: string): Promise<CmsVersionSummary[]> {
  const versions = await CmsCourseVersion.find({ courseId, status: { $ne: "draft" } })
    .sort({ createdAt: -1 })
    .lean();
  return versions.map((version) => ({
    versionId: version.versionId,
    status: version.status,
    createdFromVersion: version.createdFromVersion ?? null,
    publishedAt: version.publishedAt ? version.publishedAt.toISOString() : null,
    createdAt: version.createdAt!.toISOString(),
  }));
}

/**
 * Rollback foundation (Phase 3B plan §17) — activates an EXISTING published
 * version. Never deletes anything, never touches learners' pinned
 * `courseProgress.curriculumVersion` (they stay exactly where they are).
 * No frontend UI calls this yet.
 */
export async function activateVersion(courseId: string, versionId: string): Promise<void> {
  const target = await CmsCourseVersion.findOne({ courseId, versionId, status: "published" }).lean();
  if (!target) throw ApiError.notFound(`Published version "${versionId}" not found for course "${courseId}".`);

  await withTransaction(async (session) => {
    if (target.courseType === "structured-dsa") {
      const existingSnapshot = await CurriculumSnapshot.findOne({ courseId, version: versionId }).session(session ?? null);

      await CurriculumSnapshot.updateMany({ courseId, isActive: true }, { $set: { isActive: false } }, { session });

      if (existingSnapshot) {
        existingSnapshot.isActive = true;
        await existingSnapshot.save({ session });
      } else {
        const snapshotDraft = buildSnapshotFromCmsVersion(target, { frontendCommit: null });
        await CurriculumSnapshot.create(
          [
            {
              courseId,
              version: versionId,
              title: snapshotDraft.title,
              frontendCommit: null,
              structureHash: snapshotDraft.structureHash,
              isActive: true,
              zones: snapshotDraft.zones,
              modules: snapshotDraft.modules,
              checkpoints: snapshotDraft.checkpoints,
            },
          ],
          { session },
        );
      }
    }

    await CmsCourse.updateOne({ courseId }, { $set: { latestPublishedVersion: versionId } }, { session });
  });

  forgetCurriculum(courseId);
}

/** Learner-facing: the currently active published content. No admin gate —
 * mounted separately in `cms.routes.ts` under `/courses/:courseId/published`. */
export async function getPublishedContent(courseId: string): Promise<CmsCourseVersionAttributes> {
  const active = await getActivePublishedVersion(courseId);
  if (!active) throw ApiError.notFound(`No published version exists for course "${courseId}".`);
  return active;
}

/** Learner-facing, version-pinned (Phase 3B plan §15): resolves an EXACT
 * published version by id, so a learner enrolled on `v1` can keep reading
 * `v1` content even after `v2` is published and becomes the new default. */
export async function getPublishedVersionById(courseId: string, versionId: string): Promise<CmsCourseVersionAttributes> {
  const version = await CmsCourseVersion.findOne({ courseId, versionId, status: "published" }).lean();
  if (!version) throw ApiError.notFound(`Published version "${versionId}" not found for course "${courseId}".`);
  return version;
}

/**
 * Learner-facing — resolves content for the CALLING learner's OWN pinned
 * version, server-side, from their own `courseProgress.curriculumVersion`
 * (Keshav's field, unchanged). This is what backs
 * `GET /me/courses/:courseId/content` (Phase 3B hardening plan §4): the
 * frontend never has to know or guess which version id to ask for, and it
 * can never accidentally read `/published` (always-latest) for a learner who
 * is pinned to an older version — the two would silently diverge the moment
 * a new version is published while that learner is mid-course.
 *
 * A learner with no progress row yet (never enrolled) has nothing pinned —
 * this resolves the currently active published version, exactly what
 * enrolling them right now would pin them to.
 */
export async function getPinnedPublishedContent(courseId: string, userId: string): Promise<CmsCourseVersionAttributes> {
  const progress = await CourseProgress.findOne({ userId, courseId }).lean();
  if (progress?.curriculumVersion) {
    return getPublishedVersionById(courseId, progress.curriculumVersion);
  }
  return getPublishedContent(courseId);
}
