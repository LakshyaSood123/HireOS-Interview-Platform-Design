import { compare } from "bcryptjs";
import type { ClientSession } from "mongoose";

import { ApiError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";
import { withTransaction } from "../../shared/transaction.js";
import { User } from "../auth/user.model.js";
import { CurriculumSnapshot } from "../curriculum/curriculum.model.js";
import { forgetCurriculum } from "../curriculum/curriculum.service.js";
import { CourseProgress } from "../learning/courseProgress.model.js";
import { LearningAttempt } from "../learning/learningAttempt.model.js";
import { RewardEvent } from "../learning/rewardEvent.model.js";
import { Note } from "../notes/note.model.js";
import { CmsAnimationPackage } from "./animationPackage.model.js";
import { CmsAuditLog } from "./cmsAuditLog.model.js";
import { CmsCourse } from "./cmsCourse.model.js";
import { CmsCourseVersion } from "./cmsCourseVersion.model.js";

/**
 * Permanent deletion of an ENTIRE manually created course. This is not Archive: it is irreversible, so it is deliberately hard.
 *
 *  - only a course created through the CMS (`creationSource === "manual"`) that is not `systemProtected` can ever be deleted;
 *    DSA and Machine Learning (and any seeded/imported course) are refused here, on the backend, whatever the UI shows;
 *  - the CURRENT authenticated admin must re-enter their OWN password (verified here, never in the browser) and type the exact title;
 *  - it is blocked while any learner has progress on / is pinned to the course, and while other courses reference its checkpoints;
 *  - packages and their narration audio are deleted only when NO other course references them;
 *  - a minimal audit record (counts and ids, never any secret) is written with the deletion.
 */

/** Defence in depth: these ids are never deletable even if their provenance fields were ever wrong. */
export const PROTECTED_COURSE_IDS: readonly string[] = ["dsa-foundations", "machine-learning-foundations"];

export interface CourseDeletionImpact {
  courseId: string;
  courseTitle: string;
  zones: number;
  modules: number;
  checkpoints: number;
  versions: number;
  snapshots: number;
  /** Distinct package revisions referenced by this course's versions. */
  packageRevisions: number;
  /** Packages (all revisions) that would be deleted because only this course uses them. */
  packagesDeleted: number;
  /** Packages that stay because another course also references them. */
  packagesKept: number;
  narrationAssets: number;
  learnersPinned: number;
  progressRecords: number;
  learnerRecords: { rewardEvents: number; attempts: number; notes: number };
  canDelete: boolean;
  blockers: string[];
}

type AnyVersion = { versionId: string; status: string; zones?: any[] };

const checkpointsOf = (zones: any[] = []) => zones.flatMap((z) => (z.modules ?? []).flatMap((m: any) => m.checkpoints ?? []));
function packageRefs(zones: any[] = []): { packageId: string; revisionId: string }[] {
  const out: { packageId: string; revisionId: string }[] = [];
  for (const cp of checkpointsOf(zones)) {
    const a = cp.workspace?.animation;
    if (a?.kind === "custom" && a.packageId) out.push({ packageId: a.packageId, revisionId: a.revisionId });
  }
  return out;
}

export function isCourseDeletable(course: { courseId: string; creationSource?: string | null; systemProtected?: boolean | null }): boolean {
  return course.creationSource === "manual" && course.systemProtected !== true && !PROTECTED_COURSE_IDS.includes(course.courseId);
}

async function loadCourse(courseId: string) {
  const course = await CmsCourse.findOne({ courseId }).lean();
  if (!course) throw ApiError.notFound(`No course "${courseId}".`);
  return course;
}

export async function getDeletionImpact(courseId: string): Promise<CourseDeletionImpact> {
  const course = await loadCourse(courseId);
  const versions = (await CmsCourseVersion.find({ courseId }).lean()) as unknown as AnyVersion[];
  const current = versions.find((v) => v.status === "draft") ?? [...versions].sort((a, b) => b.versionId.localeCompare(a.versionId, undefined, { numeric: true }))[0];
  const zones = current?.zones ?? [];
  const snapshots = await CurriculumSnapshot.countDocuments({ courseId });

  // Packages referenced by this course, and which of them any OTHER course also references.
  const ownIds = new Set<string>();
  const ownRevisions = new Set<string>();
  const ownCheckpointIds = new Set<string>();
  for (const v of versions) {
    for (const ref of packageRefs(v.zones)) {
      ownIds.add(ref.packageId);
      ownRevisions.add(`${ref.packageId}@${ref.revisionId}`);
    }
    for (const cp of checkpointsOf(v.zones)) ownCheckpointIds.add(cp.id);
  }
  const otherVersions = (await CmsCourseVersion.find({ courseId: { $ne: courseId } }, { courseId: 1, versionId: 1, zones: 1 }).lean()) as unknown as (AnyVersion & { courseId: string })[];
  const sharedIds = new Set<string>();
  const referencingCourses = new Set<string>();
  for (const v of otherVersions) {
    for (const ref of packageRefs(v.zones)) if (ownIds.has(ref.packageId)) sharedIds.add(ref.packageId);
    // Checkpoint ids are only unique within a course, so a prerequisite that resolves inside its own course is not a reference to ours.
    const cps = checkpointsOf(v.zones);
    const localIds = new Set(cps.map((cp) => cp.id));
    for (const cp of cps) {
      if ((cp.prerequisites ?? []).some((p: string) => ownCheckpointIds.has(p) && !localIds.has(p))) referencingCourses.add(v.courseId);
    }
  }
  const deletedIds = [...ownIds].filter((id) => !sharedIds.has(id));
  const packageDocs = deletedIds.length ? await CmsAnimationPackage.find({ packageId: { $in: deletedIds } }, { narration: 1 }).lean() : [];
  const narrationAssets = packageDocs.reduce((sum, p: any) => sum + (p.narration?.audio?.length ?? 0), 0);

  const [learnersPinned, progressRecords, rewardEvents, attempts, notes] = await Promise.all([
    CourseProgress.countDocuments({ courseId, curriculumVersion: { $ne: null } }),
    CourseProgress.countDocuments({ courseId }),
    RewardEvent.countDocuments({ courseId }),
    LearningAttempt.countDocuments({ courseId }),
    Note.countDocuments({ courseId }),
  ]);

  const blockers: string[] = [];
  if (!isCourseDeletable(course)) blockers.push("This course is protected and cannot be permanently deleted.");
  if (learnersPinned > 0) blockers.push(`This course cannot be permanently deleted while ${learnersPinned} learner${learnersPinned === 1 ? " is" : "s are"} pinned to it.`);
  else if (progressRecords + rewardEvents + attempts + notes > 0) blockers.push("This course still has learner progress records and cannot be permanently deleted.");
  if (referencingCourses.size > 0) blockers.push(`This course is referenced by other content (${[...referencingCourses].join(", ")}) and cannot be deleted.`);

  return {
    courseId,
    courseTitle: course.title,
    zones: zones.length,
    modules: zones.reduce((n, z) => n + (z.modules?.length ?? 0), 0),
    checkpoints: checkpointsOf(zones).length,
    versions: versions.length,
    snapshots,
    packageRevisions: ownRevisions.size,
    packagesDeleted: deletedIds.length,
    packagesKept: sharedIds.size,
    narrationAssets,
    learnersPinned,
    progressRecords,
    learnerRecords: { rewardEvents, attempts, notes },
    canDelete: blockers.length === 0,
    blockers,
  };
}

/** The password must belong to the CURRENT authenticated admin (never "any admin"). Verified only here, with the same bcrypt check login uses. */
export async function reauthenticateAdmin(adminId: string, password: string): Promise<void> {
  const admin = await User.findById(adminId).select("+passwordHash +role").lean();
  const ok = !!admin && admin.role === "admin" && (await compare(password, admin.passwordHash));
  if (!ok) {
    logger.warn({ adminId, reason: "REAUTH_FAILED" }, "course deletion: password verification failed");
    // 403, not 401: a wrong password here must not look like an expired session to the client.
    throw ApiError.forbidden("Password verification failed.");
  }
}

export interface DeletionResult {
  courseId: string;
  courseTitle: string;
  counts: Record<string, number>;
}

export async function deleteCoursePermanently(courseId: string, adminId: string, input: { password: string; confirmation: string }): Promise<DeletionResult> {
  const course = await loadCourse(courseId);
  if (!isCourseDeletable(course)) {
    logger.warn({ courseId, adminId, reason: "PROTECTED" }, "course deletion: refused");
    throw ApiError.forbidden("This course is protected and cannot be permanently deleted.");
  }
  await reauthenticateAdmin(adminId, input.password);
  if (input.confirmation !== course.title) {
    logger.warn({ courseId, adminId, reason: "CONFIRMATION_MISMATCH" }, "course deletion: refused");
    throw ApiError.validation("Course title does not match.");
  }
  const impact = await getDeletionImpact(courseId);
  if (!impact.canDelete) {
    logger.warn({ courseId, adminId, reason: "BLOCKED" }, "course deletion: refused");
    throw new ApiError("CONFLICT", impact.blockers[0]!, { blockers: impact.blockers });
  }

  // Which packages are exclusively this course's (recomputed inside the work so the decision is not stale).
  await withTransaction(async (session?: ClientSession) => {
    const versions = (await CmsCourseVersion.find({ courseId }).session(session ?? null).lean()) as unknown as AnyVersion[];
    const own = new Set(versions.flatMap((v) => packageRefs(v.zones).map((r) => r.packageId)));
    const others = (await CmsCourseVersion.find({ courseId: { $ne: courseId } }, { zones: 1 }).session(session ?? null).lean()) as unknown as AnyVersion[];
    const shared = new Set(others.flatMap((v) => packageRefs(v.zones).map((r) => r.packageId)));
    const deletable = [...own].filter((id) => !shared.has(id));

    // Children first, the course pointer last: if anything fails part-way the pointer still exists and the deletion can simply be retried.
    await CurriculumSnapshot.deleteMany({ courseId }, { session });
    await CmsCourseVersion.deleteMany({ courseId }, { session });
    if (deletable.length) await CmsAnimationPackage.deleteMany({ packageId: { $in: deletable } }, { session });
    await CmsCourse.deleteOne({ courseId }, { session });
    await CmsAuditLog.create(
      [
        {
          action: "COURSE_PERMANENTLY_DELETED",
          courseId,
          courseTitle: course.title,
          adminId,
          deletedAt: new Date(),
          counts: { zones: impact.zones, modules: impact.modules, checkpoints: impact.checkpoints, versions: impact.versions, snapshots: impact.snapshots, packages: deletable.length, packageRevisions: impact.packageRevisions, narrationAssets: impact.narrationAssets },
        },
      ],
      { session },
    );
  });
  forgetCurriculum(courseId);
  logger.info({ courseId, adminId, outcome: "DELETED" }, "course deletion: course permanently deleted");
  return { courseId, courseTitle: course.title, counts: { zones: impact.zones, modules: impact.modules, checkpoints: impact.checkpoints, versions: impact.versions, snapshots: impact.snapshots, packages: impact.packagesDeleted } };
}
