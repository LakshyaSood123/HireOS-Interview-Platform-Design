/**
 * Published CMS version -> the exact same SnapshotDraft shape
 * `buildSnapshotDraft()` already produces from the static frontend registry
 * (Phase 3B plan §4/13). Archived zones/modules/checkpoints are dropped —
 * the runtime progression graph only ever reflects active content, mirroring
 * `src/creator/dsa/dsaCmsAdapter.ts`'s `activeOnly` option on the frontend
 * (this file does not import that module; the filtering logic is
 * independently written here against the backend's own `CmsZone` type).
 */

import { buildSnapshotDraft, type RegistryCourse, type SnapshotDraft } from "../curriculum/snapshotBuilder.js";
import type { CmsCourseVersionAttributes } from "./cmsCourseVersion.model.js";

function toRegistryCourse(version: Pick<CmsCourseVersionAttributes, "courseId" | "title" | "zones">): RegistryCourse {
  return {
    id: version.courseId,
    title: version.title,
    zones: version.zones
      .filter((zone) => zone.state === "active")
      .map((zone) => ({
        id: zone.id,
        title: zone.title,
        modules: zone.modules
          .filter((zoneModule) => zoneModule.state === "active")
          .map((zoneModule) => ({
            id: zoneModule.id,
            title: zoneModule.title,
            checkpoints: zoneModule.checkpoints
              .filter((checkpoint) => checkpoint.state === "active")
              .map((checkpoint) => ({
                id: checkpoint.id,
                type: checkpoint.type,
                xp: checkpoint.xp,
                masteryXp: checkpoint.masteryXp ?? undefined,
                prerequisites: [...checkpoint.prerequisites],
                workspace: checkpoint.workspace ? { codingActivity: checkpoint.workspace.codingActivity } : undefined,
              })),
          })),
      })),
  };
}

export function buildSnapshotFromCmsVersion(
  version: Pick<CmsCourseVersionAttributes, "courseId" | "title" | "zones" | "versionId">,
  options: { frontendCommit: string | null },
): SnapshotDraft {
  return buildSnapshotDraft(toRegistryCourse(version), { version: version.versionId, frontendCommit: options.frontendCommit });
}
