// Learner-side reads for backend-pinned courses (see courseSources.ts). Both
// calls go through the shared, auth-aware ApiClient — same headers, one
// refresh-with-retry, same normalized errors as every other learner call.
//
// Neither call lets the caller pick a version: the content endpoint returns
// the learner's OWN pinned published version (the backend resolves it from
// their progress record), and the package endpoint only serves a frozen
// revision referenced by that pinned version. The frontend never fetches the
// latest curriculum behind the learner's back.

import type { ApiClient } from "./apiClient"
import type { CmsDsaZone } from "../../creator/dsa/dsaCmsTypes"
import type { CmsAnimationPackage, CmsPackageTrace } from "../../creator/dsa/animationPackageClient"

/** `GET /me/courses/:courseId/content` — the learner's pinned published
 * version. Field names match the backend's cmsCourseVersion document. */
export interface PinnedCourseContent {
  courseId: string
  versionId: string
  title: string
  courseType: string
  zones: CmsDsaZone[]
}

/** Only the fields the learner runtime and the shared sandbox host need.
 * `packageTrace` is absent or null for packages without a trace.json. */
export type LearnerAnimationPackage = Pick<CmsAnimationPackage, "html" | "css" | "js" | "assets" | "manifest"> & {
  packageId: string
  revisionId: string
  title: string
  packageTrace?: CmsPackageTrace | null
}

export function fetchPinnedCourseContent(client: ApiClient, courseId: string): Promise<PinnedCourseContent> {
  return client.request<PinnedCourseContent>("GET", `/me/courses/${encodeURIComponent(courseId)}/content`).then(res => res.data)
}

/** `GET /me/courses/:courseId/animation-packages/:packageId/revisions/:revisionId`
 * — 404 for anything the learner's pinned version does not reference (draft,
 * unreferenced package, wrong revision). Errors surface as ApiRequestError. */
export function fetchLearnerAnimationPackage(
  client: ApiClient,
  courseId: string,
  packageId: string,
  revisionId: string,
): Promise<LearnerAnimationPackage> {
  const path = `/me/courses/${encodeURIComponent(courseId)}/animation-packages/${encodeURIComponent(packageId)}/revisions/${encodeURIComponent(revisionId)}`
  return client.request<LearnerAnimationPackage>("GET", path).then(res => res.data)
}
