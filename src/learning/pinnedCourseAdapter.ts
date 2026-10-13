// Backend-pinned published CMS version → the learner `Course` the existing
// ModuleRoadmap, LessonWorkspace and progress engine already consume.
//
// This does NOT re-implement the conversion: zones/modules/checkpoints/
// workspaces go through `cmsZonesToLearnerZones` (creator/dsa/dsaCmsAdapter.ts),
// the same function the DSA draft preview uses. This file only adds what is
// specific to pinned curriculum:
//   - `activeOnly`: archived entities never reach a learner.
//   - every module is a Lesson Workspace module (`contentKind: "workspace"`),
//     because a backend-authored module has no legacy TrailNode flow.

import type { Course } from "./types"
import type { PinnedCourseContent } from "./services/learnerCourseApi"
import { cmsZonesToLearnerZones } from "../creator/dsa/dsaCmsAdapter"

export interface PinnedLearnerCourse {
  course: Course
  versionId: string
}

export function pinnedContentToLearnerCourse(content: PinnedCourseContent): PinnedLearnerCourse {
  // includeCustomAnimation: package-backed animations are served to learners
  // through the learner-safe endpoint (see courseSources / learnerCourseApi).
  const zones = cmsZonesToLearnerZones(content.zones, { activeOnly: true, includeCustomAnimation: true }).map(zone => ({
    ...zone,
    modules: zone.modules.map(module => ({ ...module, contentKind: "workspace" as const })),
  }))

  return {
    versionId: content.versionId,
    course: {
      id: content.courseId,
      title: content.title,
      description: "",
      provider: "",
      zones,
    },
  }
}
