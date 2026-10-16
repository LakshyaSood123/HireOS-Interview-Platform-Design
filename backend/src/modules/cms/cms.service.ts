import type { ClientSession } from "mongoose";

import { ApiError } from "../../shared/errors.js";
import { withTransaction } from "../../shared/transaction.js";
import { CurriculumSnapshot } from "../curriculum/curriculum.model.js";
import { assertGraphIsSound, assertStructureOnly } from "../curriculum/snapshotBuilder.js";
import { forgetCurriculum } from "../curriculum/curriculum.service.js";
import { CourseProgress } from "../learning/courseProgress.model.js";
import { CmsCourse } from "./cmsCourse.model.js";
import { CmsCourseVersion, type CmsCourseVersionAttributes } from "./cmsCourseVersion.model.js";
import { validateCmsVersionContent, validatePackageReferences, validateNarrationReferences, type CmsValidationIssue } from "./cms.validation.js";
import { buildSnapshotFromCmsVersion } from "./snapshotFromCmsVersion.js";
import { normalizeAnimationSource, type CmsCourseType, type CmsZone } from "./cms.types.js";
import { CmsAnimationPackage } from "./animationPackage.model.js";
import { freezePackageRevisionIfNeeded } from "./animationPackage.service.js";
import type { CreateCourseInput, UpdateCourseDetailsInput } from "./cms.schema.js";
import { isCourseDeletable } from "./courseDeletion.service.js";

/**
 * A pre-existing `CmsCourseVersion` document may hold the old, bare
 * `{ id, title? }` animation shape (no `kind`) — see cms.types.ts's
 * `normalizeAnimationSource`. Applied here, once, whenever content is
 * copied from an existing published version into a (new or reset) draft,
 * so the draft this function returns/stores always has `kind`-tagged
 * animation sources and can be PATCHed straight back without re-triggering
 * the same "load-then-save of unmodified data fails validation" class of
 * bug fixed for `masteryXp`/`legacyNodeId`/etc. Deep-clones rather than
 * mutating the input, since `active.zones` may still be referenced by the
 * caller (e.g. `resetDraft` also uses it for `createFromVersion`).
 */
function normalizeZonesAnimationSources(zones: CmsZone[]): CmsZone[] {
  return zones.map((zone) => ({
    ...zone,
    modules: zone.modules.map((mod) => ({
      ...mod,
      checkpoints: mod.checkpoints.map((checkpoint) => {
        if (!checkpoint.workspace?.animation) return checkpoint;
        return {
          ...checkpoint,
          workspace: { ...checkpoint.workspace, animation: normalizeAnimationSource(checkpoint.workspace.animation) },
        };
      }),
    })),
  }));
}

/** The draft document's `versionId` is always this literal string — it is
 * not a numbered version until it's published (Phase 3B plan §14: "Publishing
 * creates a new immutable published version"). The `one_draft_per_course`
 * partial unique index on `cmsCourseVersions` guarantees there is at most
 * one per course regardless of this shared id. */
const DRAFT_VERSION_ID = "draft";

export interface CmsCourseDetails {
  subtitle: string;
  shortDescription: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  instructor: string;
  tags: string[];
  accentColor: string;
}

export interface CmsCourseSummary {
  courseId: string;
  title: string;
  courseType: CmsCourseType;
  latestDraftVersion: string | null;
  latestPublishedVersion: string | null;
  /** Provenance only ("manual" = created in Creator Studio). Never used to decide capability. */
  creationSource: string | null;
  details: CmsCourseDetails | null;
  /** True only for a course the CMS may permanently delete (created through the CMS, not protected). The backend enforces this again on delete. */
  canPermanentlyDelete: boolean;
}

function summaryOf(course: {
  courseId: string; title: string; courseType: string; latestDraftVersion?: string | null; latestPublishedVersion?: string | null; creationSource?: string | null; details?: unknown; systemProtected?: boolean | null;
}): CmsCourseSummary {
  return {
    courseId: course.courseId,
    title: course.title,
    courseType: course.courseType as CmsCourseType,
    latestDraftVersion: course.latestDraftVersion ?? null,
    latestPublishedVersion: course.latestPublishedVersion ?? null,
    creationSource: course.creationSource ?? null,
    details: (course.details as CmsCourseDetails | undefined) ?? null,
    canPermanentlyDelete: isCourseDeletable(course),
  };
}

export async function listCourses(): Promise<CmsCourseSummary[]> {
  const courses = await CmsCourse.find().lean();
  return courses.map(summaryOf);
}

export async function getCourseSummary(courseId: string): Promise<CmsCourseSummary> {
  const course = await CmsCourse.findOne({ courseId }).lean();
  if (!course) throw ApiError.notFound(`No course "${courseId}".`);
  return summaryOf(course);
}

const BASECAMP_ZONE: CmsZone = { id: "basecamp", order: 0, title: "Basecamp", description: "Where every trail begins.", modules: [], state: "active" };

function slugForCourse(title: string): string {
  const slug = title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return slug || "course";
}

/**
 * Creates a brand-new course in the SAME canonical model every other course uses: a `cmsCourses` pointer, a `standard` course type
 * and an editable draft whose first zone is a real "Basecamp" zone. Nothing is published, and no other course is touched.
 * The draft then goes through the normal save / validate / preview / publish lifecycle like any course.
 */
export async function createCourse(actorId: string, input: CreateCourseInput): Promise<{ course: CmsCourseSummary; draft: CmsCourseVersionAttributes }> {
  const base = slugForCourse(input.title);
  for (let attempt = 1; attempt <= 25; attempt++) {
    const courseId = attempt === 1 ? base : `${base}-${attempt}`.slice(0, 64);
    if (await CmsCourse.exists({ courseId })) continue;
    const details = {
      subtitle: input.subtitle,
      shortDescription: input.shortDescription,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      duration: input.duration,
      instructor: input.instructor,
      tags: input.tags,
      accentColor: input.accentColor,
    };
    try {
      await CmsCourse.create({ courseId, title: input.title, courseType: "standard", latestDraftVersion: DRAFT_VERSION_ID, latestPublishedVersion: null, creationSource: "manual", details });
    } catch (err) {
      if ((err as { code?: number }).code === 11000) continue; // lost a race for this id: try the next suffix
      throw err;
    }
    try {
      const draft = await CmsCourseVersion.create({
        courseId,
        versionId: DRAFT_VERSION_ID,
        status: "draft",
        createdFromVersion: null,
        createdBy: actorId,
        updatedBy: actorId,
        revision: 1,
        title: input.title,
        courseType: "standard",
        zones: [BASECAMP_ZONE],
      });
      const course = await CmsCourse.findOne({ courseId }).lean();
      return { course: summaryOf(course!), draft: draft.toObject() };
    } catch (err) {
      await CmsCourse.deleteOne({ courseId }); // never leave a pointer without its draft
      throw err;
    }
  }
  throw ApiError.validation("Could not allocate a unique course id for this title; try a different title.");
}

/** Edits the library-card details of a course that was created through the CMS. Courses that pre-date CMS creation are not editable here. */
export async function updateCourseDetails(courseId: string, patch: UpdateCourseDetailsInput): Promise<CmsCourseSummary> {
  const course = await CmsCourse.findOne({ courseId });
  if (!course) throw ApiError.notFound(`No course "${courseId}".`);
  if (course.creationSource !== "manual" || !course.details) throw ApiError.validation(`Course "${courseId}" has no editable course details.`);
  const { title, ...rest } = patch;
  if (title !== undefined) course.title = title;
  for (const [key, value] of Object.entries(rest)) (course.details as unknown as Record<string, unknown>)[key] = value;
  course.markModified("details");
  await course.save();
  if (title !== undefined) await CmsCourseVersion.updateOne({ courseId, status: "draft" }, { $set: { title } });
  return summaryOf(course.toObject());
}

export interface CmsCatalogEntry {
  courseId: string;
  title: string;
  courseType: CmsCourseType;
  publishedVersion: string;
  lessonCount: number;
  details: CmsCourseDetails;
}

/** Learner-facing catalog: courses created through the CMS that have a published version. The static DSA / ML cards are not listed here. */
export async function listPublishedCatalog(): Promise<CmsCatalogEntry[]> {
  const courses = await CmsCourse.find({ latestPublishedVersion: { $ne: null }, details: { $exists: true, $ne: null } }).lean();
  const entries: CmsCatalogEntry[] = [];
  for (const course of courses) {
    const version = await CmsCourseVersion.findOne({ courseId: course.courseId, versionId: course.latestPublishedVersion, status: "published" }).lean();
    if (!version) continue;
    const lessonCount = (version.zones as CmsZone[]).flatMap((z) => z.modules).filter((m) => m.state === "active").flatMap((m) => m.checkpoints).filter((c) => c.state === "active").length;
    entries.push({ courseId: course.courseId, title: course.title, courseType: course.courseType as CmsCourseType, publishedVersion: course.latestPublishedVersion!, lessonCount, details: course.details as unknown as CmsCourseDetails });
  }
  return entries;
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
    zones: normalizeZonesAnimationSources(active.zones as CmsZone[]),
  });
  await CmsCourse.updateOne({ courseId }, { $set: { latestDraftVersion: DRAFT_VERSION_ID } });
  return draft.toObject();
}

/** See the call site in `publishDraft` — freezes every referenced custom
 * package's current draft content and returns a deep copy of `zones` with
 * those references rewritten to the frozen revision id. Registered-animation
 * checkpoints and custom ones already pointing at a frozen revision (e.g.
 * unchanged since a previous publish that already froze it) pass through
 * untouched. */
async function freezeCustomAnimationReferences(zones: CmsZone[], session: ClientSession | undefined): Promise<CmsZone[]> {
  const frozenIdCache = new Map<string, string>();

  return Promise.all(
    zones.map(async (zone) => ({
      ...zone,
      modules: await Promise.all(
        zone.modules.map(async (mod) => ({
          ...mod,
          checkpoints: await Promise.all(
            mod.checkpoints.map(async (checkpoint) => {
              const animation = checkpoint.workspace?.animation;
              if (!animation || animation.kind !== "custom" || animation.revisionId !== "draft") return checkpoint;

              let frozenRevisionId = frozenIdCache.get(animation.packageId);
              if (!frozenRevisionId) {
                frozenRevisionId = await freezePackageRevisionIfNeeded(animation.packageId, session);
                frozenIdCache.set(animation.packageId, frozenRevisionId);
              }

              return {
                ...checkpoint,
                workspace: {
                  ...checkpoint.workspace!,
                  animation: { ...animation, revisionId: frozenRevisionId },
                },
              };
            }),
          ),
        })),
      ),
    })),
  );
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
  const content = { courseId: draft.courseId, title: draft.title, courseType: draft.courseType as CmsCourseType, zones: draft.zones as CmsZone[] };
  return [...validateCmsVersionContent(content), ...(await validateNarrationReferences(content.zones))];
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
        zones: normalizeZonesAnimationSources(active.zones as CmsZone[]),
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
  // Narration: errors block publishing, warnings (missing/stale narration) do not.
  issues.push(...(await validateNarrationReferences(draft.zones as CmsZone[])).filter((i) => i.severity !== "warning"));
  if (issues.length > 0) {
    throw ApiError.validation("The draft has validation errors and cannot be published.", { issues });
  }

  return withTransaction(async (session) => {
    const versionId = await nextVersionId(courseId, session);

    // Freeze every custom-animation package this draft references at its
    // mutable "draft" revision — the PUBLISHED copy of `zones` gets
    // rewritten to point at the frozen revision id, so `version N` keeps
    // referencing exact package content even after the author later edits
    // the animation and republishes (see animationPackage.service.ts's
    // freezePackageRevisionIfNeeded). The draft document itself (`draft.zones`,
    // used above for nothing further) is left untouched — it keeps pointing
    // at "draft" so editing continues to work normally after publish.
    const frozenZones = await freezeCustomAnimationReferences(draft.zones as CmsZone[], session);

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
          zones: frozenZones,
        },
      ],
      { session },
    );
    const published = created[0]!;

    let snapshotCheckpointCount = 0;

    if (draft.zones.length > 0) {
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
    if (target.zones.length > 0) {
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
 * Admin/dev operation: moves ONE learner's pin for ONE course to an explicit,
 * already-published version. Nothing else is touched (progress, XP, completed
 * checkpoints stay exactly as they are).
 *
 * Refuses: a draft or nonexistent version (only `status: "published"` is
 * accepted), a version with no curriculum snapshot, a learner who is not
 * enrolled, and a target version that no longer contains a checkpoint the
 * learner has already completed (that would silently orphan their progress).
 * Idempotent: repinning to the version they already have changes nothing.
 */
export async function repinLearnerCourse(
  userId: string,
  courseId: string,
  targetVersionId: string,
  options: { dryRun?: boolean } = {},
): Promise<{ changed: boolean; from: string | null; to: string }> {
  await getPublishedVersionById(courseId, targetVersionId); // throws 404 for draft / nonexistent

  const snapshot = await CurriculumSnapshot.findOne({ courseId, version: targetVersionId }).lean();
  if (!snapshot) {
    throw ApiError.validation(`Version "${targetVersionId}" of "${courseId}" has no curriculum snapshot, so a learner cannot be pinned to it.`);
  }

  const progress = await CourseProgress.findOne({ userId, courseId }).lean();
  if (!progress) throw ApiError.notFound(`This learner is not enrolled in "${courseId}", so there is no pin to move.`);

  const from = progress.curriculumVersion ?? null;
  if (from === targetVersionId) return { changed: false, from, to: targetVersionId };

  const known = new Set((snapshot.checkpoints ?? []).map((cp: { id: string }) => cp.id));
  const orphaned = (progress.completedCheckpointIds ?? []).filter((id: string) => !known.has(id));
  if (orphaned.length > 0) {
    throw ApiError.validation(
      `Refusing to repin: version "${targetVersionId}" no longer contains completed checkpoint(s) ${orphaned.join(", ")}.`,
    );
  }

  // A dry run runs every check above and reports what WOULD change.
  if (!options.dryRun) {
    await CourseProgress.updateOne({ userId, courseId }, { $set: { curriculumVersion: targetVersionId } });
  }
  return { changed: true, from, to: targetVersionId };
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

/**
 * Learner-facing package read. Serves a FROZEN package revision only when it
 * is referenced by the calling learner's own pinned published version
 * (`getPinnedPublishedContent`). Drafts, unreferenced revisions and any
 * other package id are indistinguishable from "not found" to the caller.
 */
export async function getLearnerReferencedPackageRevision(
  courseId: string,
  userId: string,
  packageId: string,
  revisionId: string,
) {
  const pinned = await getPinnedPublishedContent(courseId, userId);
  const referenced = pinned.zones.some((zone) =>
    zone.modules.some((zoneModule) =>
      zoneModule.checkpoints.some((cp) => {
        const anim = normalizeAnimationSource(cp.workspace?.animation);
        return anim?.kind === "custom" && anim.packageId === packageId && anim.revisionId === revisionId;
      }),
    ),
  );
  if (!referenced) throw ApiError.notFound("Animation package revision not found.");

  const revision = await CmsAnimationPackage.findOne({ packageId, revisionId, status: "frozen" }).lean();
  if (!revision) throw ApiError.notFound("Animation package revision not found.");

  return {
    packageId: revision.packageId,
    revisionId: revision.revisionId,
    title: revision.title,
    manifest: revision.manifest,
    sourceKind: revision.sourceKind,
    html: revision.html,
    css: revision.css ?? null,
    js: revision.js ?? null,
    assets: revision.assets,
    packageTrace: revision.packageTrace ?? null,
    // Narration travels with the frozen revision (audio is played by the learner browser); only enabled narration is sent.
    narration: (revision as { narration?: { enabled?: boolean } | null }).narration?.enabled ? (revision as { narration?: unknown }).narration : null,
  };
}
