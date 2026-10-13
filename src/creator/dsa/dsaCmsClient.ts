// Creator Studio ↔ real backend CMS, for the structured DSA course and the
// backend-authored Machine Learning course. Through the same shared,
// auth-aware ApiClient as everything else (auth header, one refresh,
// normalized errors) — no second HTTP stack.
//
// Every call takes the courseId it operates on. The editor passes the course
// the author selected; there is no hidden default in the functions themselves.
//
// The backend's `saveDraftSchema` body IS, field-for-field, `CmsDsaZone[]`
// (dsaCmsTypes.ts) — no DTO transform needed beyond passing zones straight
// through. Known gap, already documented: the backend's `moduleSchema` has no
// `quiz` field yet (dsaCmsTypes.ts) — Module Mastery quiz data does not
// round-trip through this backend.

import type { ApiClient } from "../../learning/services/apiClient"
import { ApiRequestError } from "../../learning/services/apiClient"
import type { CmsDsaZone } from "./dsaCmsTypes"

export const CMS_DSA_COURSE_ID = "dsa-foundations"
export const CMS_ML_COURSE_ID = "machine-learning-foundations"

/** The courses Creator Studio can open and edit through the backend CMS. */
export const CMS_EDITABLE_COURSES = [
  { id: CMS_DSA_COURSE_ID, label: "Data Structures & Algorithms" },
  { id: CMS_ML_COURSE_ID, label: "Machine Learning Foundations" },
] as const

export interface CmsDraft {
  revision: number
  title: string
  courseType: string
  zones: CmsDsaZone[]
  updatedBy: string
  createdFromVersion: string | null
}

export interface CmsValidationIssue {
  severity: "error" | "warning"
  message: string
  zoneId?: string
  moduleId?: string
  checkpointId?: string
}

export interface CmsPublishResult {
  version: { versionId: string; publishedAt: string | null };
  snapshotVersion: string
  snapshotCheckpointCount: number
}

export interface CmsVersionSummary {
  versionId: string
  status: string
  createdFromVersion: string | null
  publishedAt: string | null
  createdAt: string
}

/** Thrown specifically for the `expectedRevision != currentRevision`
 * conflict — distinguishable from any other save failure so the UI can show
 * a conflict banner instead of a generic error. */
export class CmsRevisionConflictError extends Error {
  constructor(readonly currentRevision: number) {
    super("This draft has changed since you loaded it — reload and reapply your edit.")
    this.name = "CmsRevisionConflictError"
  }
}

export function loadCmsDraft(client: ApiClient, courseId: string): Promise<CmsDraft> {
  return client.request<CmsDraft>("GET", `/cms/courses/${encodeURIComponent(courseId)}/draft`).then(res => res.data)
}

export async function saveCmsDraft(client: ApiClient, courseId: string, zones: CmsDsaZone[], expectedRevision: number): Promise<CmsDraft> {
  try {
    const res = await client.request<CmsDraft>("PATCH", `/cms/courses/${encodeURIComponent(courseId)}/draft`, {
      body: { zones, expectedRevision },
    })
    return res.data
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "VALIDATION_ERROR" && typeof error.details?.currentRevision === "number") {
      throw new CmsRevisionConflictError(error.details.currentRevision)
    }
    throw error
  }
}

export function validateCmsDraft(client: ApiClient, courseId: string): Promise<{ issues: CmsValidationIssue[]; valid: boolean }> {
  return client
    .request<{ issues: CmsValidationIssue[]; valid: boolean }>("GET", `/cms/courses/${encodeURIComponent(courseId)}/draft/validate`)
    .then(res => res.data)
}

export function publishCmsDraft(client: ApiClient, courseId: string): Promise<CmsPublishResult> {
  return client.request<CmsPublishResult>("POST", `/cms/courses/${encodeURIComponent(courseId)}/draft/publish`).then(res => res.data)
}

/** Resets the draft to the CURRENTLY ACTIVE PUBLISHED backend version — a
 * different operation from the client-side "reset to the static frontend
 * DSA source" the existing Reset Draft button already does. Kept as a
 * clearly separate, clearly labeled action rather than merged into one
 * button — see the editor shell's two distinct buttons. */
export function resetCmsDraftToPublished(client: ApiClient, courseId: string): Promise<CmsDraft> {
  return client.request<CmsDraft>("POST", `/cms/courses/${encodeURIComponent(courseId)}/draft/reset`).then(res => res.data)
}

export function listCmsVersions(client: ApiClient, courseId: string): Promise<CmsVersionSummary[]> {
  return client.request<CmsVersionSummary[]>("GET", `/cms/courses/${encodeURIComponent(courseId)}/versions`).then(res => res.data)
}

export function activateCmsVersion(client: ApiClient, courseId: string, versionId: string): Promise<void> {
  return client
    .request<void>("POST", `/cms/courses/${encodeURIComponent(courseId)}/versions/${encodeURIComponent(versionId)}/activate`)
    .then(() => undefined)
}
