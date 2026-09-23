/**
 * The transactional core of the one-time DSA bootstrap (Phase 3B hardening
 * plan §3). Lives in `src/` — not `scripts/` — so it is typechecked/built
 * like production code and importable by both the CLI script
 * (`backend/scripts/bootstrapDsaCms.ts`) and `verifyBootstrapAtomicity.ts`.
 *
 * Writes, in order, inside ONE Mongo transaction (`withTransaction`):
 *   1. verify the course is not already bootstrapped
 *   2. create the immutable published version (v1)
 *   3. build + activate the matching curriculumSnapshot
 *   4. create the cmsCourses pointer document
 *   5. commit
 *
 * A failure at any step aborts the whole transaction — there is never a
 * published version without a course pointer, a snapshot without a course,
 * or a course pointer without its version. Re-running after a full success
 * is a no-op (`alreadyBootstrapped: true`), checked both as a fast path
 * outside the transaction and, authoritatively, inside it.
 */

import { withTransaction } from "../../shared/transaction.js";
import { CurriculumSnapshot } from "../curriculum/curriculum.model.js";
import { assertGraphIsSound, assertStructureOnly } from "../curriculum/snapshotBuilder.js";
import { CmsCourse } from "./cmsCourse.model.js";
import { CmsCourseVersion } from "./cmsCourseVersion.model.js";
import { buildSnapshotFromCmsVersion } from "./snapshotFromCmsVersion.js";
import type { CmsCourseType, CmsZone } from "./cms.types.js";

export interface BootstrapCourseInput {
  courseId: string;
  title: string;
  courseType: CmsCourseType;
  zones: CmsZone[];
  actorId: string;
  /** TEST-ONLY. Throws immediately after step 3 (snapshot activated), before
   * step 4 (course pointer). Never set outside `verifyBootstrapAtomicity.ts` —
   * there is no request path or CLI flag that can reach this. Its only job is
   * proving the transaction actually rolls back steps 2–3 when step 4 never
   * happens, rather than leaving a published version / active snapshot with
   * no `cmsCourses` pointer to reach them. */
  _induceFailureBeforeCoursePointer?: boolean;
}

export interface BootstrapCourseResult {
  alreadyBootstrapped: boolean;
  versionId?: string;
  snapshotCheckpointCount?: number;
}

export async function bootstrapCourse(input: BootstrapCourseInput): Promise<BootstrapCourseResult> {
  const fastPathExisting = await CmsCourse.findOne({ courseId: input.courseId }).lean();
  if (fastPathExisting) return { alreadyBootstrapped: true };

  return withTransaction(async (session) => {
    // Step 1 — authoritative check, inside the transaction: guards the race
    // between two concurrent bootstrap runs, which the fast-path check above
    // cannot.
    const existing = await CmsCourse.findOne({ courseId: input.courseId }).session(session ?? null);
    if (existing) return { alreadyBootstrapped: true };

    const versionId = "v1";

    // Step 2 — the immutable published version.
    const created = await CmsCourseVersion.create(
      [
        {
          courseId: input.courseId,
          versionId,
          status: "published",
          createdFromVersion: null,
          createdBy: input.actorId,
          updatedBy: input.actorId,
          publishedAt: new Date(),
          revision: 1,
          title: input.title,
          courseType: input.courseType,
          zones: input.zones,
        },
      ],
      { session },
    );
    const published = created[0]!;

    // Step 3 — the derived, structure-only runtime snapshot, activated.
    let snapshotCheckpointCount = 0;
    if (input.courseType === "structured-dsa") {
      const snapshotDraft = buildSnapshotFromCmsVersion(published.toObject(), { frontendCommit: null });
      assertStructureOnly(snapshotDraft);
      assertGraphIsSound(snapshotDraft);
      snapshotCheckpointCount = snapshotDraft.checkpoints.length;

      await CurriculumSnapshot.updateMany({ courseId: input.courseId, isActive: true }, { $set: { isActive: false } }, { session });
      await CurriculumSnapshot.updateOne(
        { courseId: input.courseId, version: versionId },
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
        { upsert: true, session },
      );
    }

    if (input._induceFailureBeforeCoursePointer) {
      throw new Error("bootstrapCourse: induced test failure before step 4 (course pointer) — the transaction must roll back.");
    }

    // Step 4 — the course pointer. Created last: this is the row every other
    // read (`getDraft`, `getPublishedContent`, …) checks first, so nothing
    // downstream can observe a published version or an active snapshot that
    // this pointer doesn't yet know about.
    await CmsCourse.create(
      [
        {
          courseId: input.courseId,
          title: input.title,
          courseType: input.courseType,
          latestDraftVersion: null,
          latestPublishedVersion: versionId,
        },
      ],
      { session },
    );

    // Step 5 — commit (withTransaction commits on successful return).
    return { alreadyBootstrapped: false, versionId, snapshotCheckpointCount };
  });
}
