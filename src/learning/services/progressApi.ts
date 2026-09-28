// Learner progress + checkpoint completion, talking to the existing backend
// learning module (backend/src/modules/learning/*) through the shared,
// auth-aware ApiClient. AUTH + SESSION integration already gives this
// automatic Authorization headers, one refresh-with-retry, and normalized
// errors — this file only adds the two calls this phase needs and maps
// their response shape onto the frontend's own `LearnerProgressState`.
//
// Deliberately thin: no XP/reward handling, no attempts, no notes. The
// backend's response `progress` field is already, field-for-field, the
// frontend's `LearnerProgressState` (see courseProgress.model.ts's own
// comment: "field-for-field the frontend's LearnerProgressState") — so no
// DTO transform is needed beyond trusting that documented shape.

import type { ApiClient } from "./apiClient"
import type { LearnerProgressState } from "../progressEngine"

export interface CourseStateResponse {
  courseId: string
  curriculumVersion: string
  progress: LearnerProgressState
  moduleStates: Record<string, string>
  zoneStates: Record<string, string>
}

export interface CompletionResponse {
  alreadyCompleted: boolean
  rewards: { xpAwarded: number; masteryAwarded: boolean; livesDelta: number; streak: number }
  progress: LearnerProgressState
  unlocked: { checkpointIds: string[]; moduleIds: string[] }
}

export type CompletionSource = "submit" | "quick-check" | "reading" | "manual" | "import"

/** `GET /me/courses/{courseId}/state` — enrolls the learner on first read if
 * they have no progress row yet (backend's `getOrCreateProgress`), so a
 * brand-new account is a normal empty state here, never an error. */
export function fetchCourseState(client: ApiClient, courseId: string): Promise<CourseStateResponse> {
  return client.request<CourseStateResponse>("GET", `/me/courses/${courseId}/state`).then(res => res.data)
}

/** `POST /me/checkpoints/{checkpointId}/complete` — idempotent on the
 * backend (a repeat call for an already-completed checkpoint returns
 * `alreadyCompleted: true` with no further effect), so this is safe to call
 * once per legitimate local completion without extra client-side locking. */
export function completeCheckpointOnBackend(
  client: ApiClient,
  courseId: string,
  checkpointId: string,
  options: { source?: CompletionSource; submissionId?: string } = {},
): Promise<CompletionResponse> {
  return client
    .request<CompletionResponse>("POST", `/me/checkpoints/${encodeURIComponent(checkpointId)}/complete`, {
      body: { courseId, source: options.source ?? "manual", submissionId: options.submissionId },
    })
    .then(res => res.data)
}
