// The single read surface for the Course Library grid — merges the
// existing static course catalog with published Creator Studio (CMS)
// courses. Course Library itself stays the ONE real list; this just widens
// what feeds it. See src/creator/cmsCourseAdapter.ts for the CMS side.

import { libraryCourses, type LibraryCourse } from "../data/reagvisCourses"
import { getPublishedCmsLibraryCards, type UnifiedLibraryCourse } from "../creator/cmsCourseAdapter"

function asStatic(course: LibraryCourse): UnifiedLibraryCourse {
  return { ...course, source: "static" }
}

export function getUnifiedLibraryCourses(): UnifiedLibraryCourse[] {
  return [...libraryCourses.map(asStatic), ...getPublishedCmsLibraryCards()]
}
