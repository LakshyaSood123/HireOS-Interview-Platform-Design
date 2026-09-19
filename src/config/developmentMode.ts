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
  /** TEMPORARY demo convenience — when true, CodeWorkspace shows an
   * "✨ Auto-fill Demo Answer" button that fills the editor with a canonical
   * correct solution (CodingActivityContent.demoSolution) for the current
   * language. Strictly for live/rehearsal demos; must be false for the
   * normal learner experience. Flip to false (or delete this flag entirely
   * once a real production build step exists) before shipping. */
  DEMO_CODE_AUTOFILL_ENABLED: true,
  /** MVP real-execution proof: when true, the checkpoints listed in
   * REAL_CODE_EXECUTION_ACTIVITY_IDS run through a self-hosted Piston
   * instance (via the local tools/code-runner-gateway.mjs gateway) instead
   * of MockCodeRunner. Every other activity keeps using MockCodeRunner
   * regardless of this flag. Requires the gateway (port 8787) and Piston
   * (127.0.0.1:2000) to be running locally — see tools/code-runner-gateway.mjs. */
  REAL_CODE_EXECUTION_ENABLED: true,
  /** Checkpoint ids eligible for real execution while REAL_CODE_EXECUTION_ENABLED
   * is true. Keep this to the proven MVP activity only. */
  REAL_CODE_EXECUTION_ACTIVITY_IDS: ["foundations-4"] as string[],
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
