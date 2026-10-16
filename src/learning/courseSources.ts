// Where a course's CURRICULUM comes from. Progress is always backend-synced
// per courseId for backend-synced courses; the curriculum itself differs:
//
//   "static"          → hand-authored TypeScript (courseRegistry.ts). DSA.
//   "backend-pinned"  → the learner's pinned, published CMS version, fetched
//                       from GET /me/courses/:courseId/content at runtime.
//                       Machine Learning. Nothing about its content lives in
//                       this frontend.
//
// Adding a course here is the ONLY registration step for a new backend-pinned
// course's runtime path; the Course Library card is metadata in
// src/data/reagvisCourses.ts.

export const DSA_COURSE_ID = "dsa-foundations"
export const ML_COURSE_ID = "machine-learning-foundations"

export type CourseSourceKind = "static" | "backend-pinned"

export interface CourseSourceDefinition {
  id: string
  source: CourseSourceKind
}

const COURSE_SOURCES: Readonly<Record<string, CourseSourceDefinition>> = {
  [DSA_COURSE_ID]: { id: DSA_COURSE_ID, source: "static" },
  [ML_COURSE_ID]: { id: ML_COURSE_ID, source: "backend-pinned" },
}

// Courses created in Creator Studio and published (listed by the backend catalog, see learning/courseCatalog.ts) are registered here at
// runtime, so they are opened exactly like Machine Learning: no per-course code, no per-course deployment.
const dynamicBackendCourses = new Set<string>()

export function registerBackendPinnedCourses(courseIds: Iterable<string>): void {
  for (const id of courseIds) if (!(id in COURSE_SOURCES)) dynamicBackendCourses.add(id)
}

export function getCourseSourceDefinition(courseId: string): CourseSourceDefinition | undefined {
  if (COURSE_SOURCES[courseId]) return COURSE_SOURCES[courseId]
  return dynamicBackendCourses.has(courseId) ? { id: courseId, source: "backend-pinned" } : undefined
}

export function isBackendPinnedCourse(courseId: string): boolean {
  return COURSE_SOURCES[courseId]?.source === "backend-pinned" || dynamicBackendCourses.has(courseId)
}

/** True when learner progress for this course is reconciled with the backend
 * (`/me/courses/:courseId/state`, `/me/checkpoints/:id/complete`,
 * `/me/attempts`, notes). Both DSA and ML are backend-synced; the difference
 * between them is only where the curriculum comes from. */
export function isBackendSyncedCourse(courseId: string): boolean {
  return courseId === DSA_COURSE_ID || isBackendPinnedCourse(courseId)
}
