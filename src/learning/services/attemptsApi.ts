// Learner attempt recording — POST /me/attempts, through the shared
// auth-aware ApiClient. Deliberately narrow: the backend's LearningAttempt
// model (backend/src/modules/learning/learningAttempt.model.ts) is
// documented as "quick-check and quiz answers" — attemptType is one of
// "quick-check" | "quiz" | "reading", and the schema has no language,
// source-code or execution-result fields at all. It does NOT model graded
// coding Run/Submit attempts; see the integration report's Phase 2 audit
// for why coding attempts are out of scope for this endpoint.
//
// An attempt never affects XP, completion or progression — the backend's
// own model comment is explicit about that ("append-only and never
// rewarding"), matching how Quick Checks have always behaved in this app.

import type { ApiClient } from "./apiClient"

export type AttemptType = "quick-check" | "quiz" | "reading"

export interface RecordAttemptInput {
  courseId: string
  checkpointId: string
  /** Frontend-owned id for what was attempted, e.g. "foundations-1-quick-check". */
  activityId: string
  attemptType: AttemptType
  passed: boolean
  payload?: Record<string, unknown> | null
}

export interface RecordAttemptResponse {
  attemptId: string
  passed: boolean
}

export function recordAttempt(client: ApiClient, input: RecordAttemptInput): Promise<RecordAttemptResponse> {
  return client.request<RecordAttemptResponse>("POST", "/me/attempts", { body: input }).then(res => res.data)
}
