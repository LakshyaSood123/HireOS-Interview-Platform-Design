// The single read surface for the Course Library grid — merges the
// existing static course catalog with published Creator Studio (CMS)
// courses. Course Library itself stays the ONE real list; this just widens
// what feeds it. See src/creator/cmsCourseAdapter.ts for the CMS side.

import { libraryCourses, type LibraryCourse } from "../data/reagvisCourses"
import { getPublishedCmsLibraryCards, type UnifiedLibraryCourse } from "../creator/cmsCourseAdapter"
import { DSA_COURSE_ID, ML_COURSE_ID } from "./courseSources"
import { catalogEntryToLibraryCard, type CatalogEntry } from "./courseCatalog"

/** Static catalog entries a learner can see. The other entries in
 * `libraryCourses` are future-course placeholders: they stay in the data, but
 * are not shown in the learner Course Library. */
const LEARNER_VISIBLE_STATIC_COURSES: readonly string[] = [DSA_COURSE_ID, ML_COURSE_ID]

function asStatic(course: LibraryCourse): UnifiedLibraryCourse {
  return { ...course, source: "static" }
}

export function getUnifiedLibraryCourses(catalog: readonly CatalogEntry[] = []): UnifiedLibraryCourse[] {
  const staticCards = libraryCourses.filter(c => LEARNER_VISIBLE_STATIC_COURSES.includes(c.id)).map(asStatic)
  const known = new Set(staticCards.map(c => c.id))
  return [
    ...staticCards,
    // Courses published from the backend CMS: same card shape, listed after the built-in courses.
    ...catalog.filter(e => !known.has(e.courseId)).map(catalogEntryToLibraryCard),
    ...getPublishedCmsLibraryCards(),
  ]
}
