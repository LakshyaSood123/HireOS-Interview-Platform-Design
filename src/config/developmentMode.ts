/**
 * Central switch for the temporary "Course-First" development phase.
 *
 * The pre-interview/interview flow (Landing -> Setup -> Interview -> Results)
 * is frozen while active development focuses on the post-interview Reagvis
 * Trails course experience (Results -> Diagnosis -> Course -> Module ->
 * Lesson -> Practice -> Completion).
 *
 * Nothing about the interview flow has been deleted or rewritten. See
 * /COURSE_FIRST_DEVELOPMENT_MODE.md for the full unfreeze procedure.
 */
export const DEVELOPMENT_MODE = {
  /** Active development is focused on the post-interview course experience. */
  COURSE_FIRST_MODE: true,
  /** Setup/Interview entry points are gated off while this is false. */
  INTERVIEW_FLOW_ENABLED: false,
  /** Page the app boots into while COURSE_FIRST_MODE is active. */
  DEFAULT_ENTRY: "reagvis-trail",
} as const

/**
 * Pages that require a live interview flow to make sense. Landing is
 * intentionally excluded — it may remain viewable for visual reference, only
 * the actions that lead out of it into Setup/Interview are gated.
 */
export const FROZEN_INTERVIEW_PAGES = ["setup", "interview"] as const

export type FrozenInterviewPage = (typeof FROZEN_INTERVIEW_PAGES)[number]

export function isInterviewPage(page: string): page is FrozenInterviewPage {
  return (FROZEN_INTERVIEW_PAGES as readonly string[]).includes(page)
}

/** Message shown wherever a gated interview action is surfaced to the user. */
export const INTERVIEW_FROZEN_MESSAGE =
  "Interview flow is temporarily frozen while Course Experience development is active."
