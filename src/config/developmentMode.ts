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
  /** TEMPORARY demo convenience — when true, CodeWorkspace shows an
   * "✨ Auto-fill Demo Answer" button that fills the editor with a canonical
   * correct solution (CodingActivityContent.demoSolution) for the current
   * language. Strictly for live/rehearsal demos; must be false for the
   * normal learner experience. Flip to false (or delete this flag entirely
   * once a real production build step exists) before shipping. */
  DEMO_CODE_AUTOFILL_ENABLED: true,
  /** Real-execution rollout: when true, the checkpoints listed in
   * REAL_CODE_EXECUTION_ACTIVITY_IDS run through a self-hosted Piston
   * instance (via the local tools/code-runner-gateway.mjs gateway) instead
   * of MockCodeRunner. Every other activity keeps using MockCodeRunner
   * regardless of this flag. Requires the gateway (port 8787) and Piston
   * (127.0.0.1:2000) to be running locally — see tools/code-runner-gateway.mjs. */
  REAL_CODE_EXECUTION_ENABLED: true,
  /** Checkpoint ids eligible for real execution while REAL_CODE_EXECUTION_ENABLED
   * is true — must stay in lockstep with the gateway's own ALLOWED_ACTIVITY_IDS
   * allowlist (tools/code-runner-gateway.mjs), which is the authoritative
   * enforcement point. Currently: "Family A" (scalar/array/string in,
   * int/long/bool out) activities whose curriculum tests were verified to be
   * genuine deterministic data. Six other Family A checkpoints generated via
   * fullCurriculumModules.ts (stack-queue-3, grid-graphs-3, union-find-3,
   * greedy-3, dp-3, dp-2d-3) still share one placeholder test fixture and are
   * deliberately excluded — see the Family A expansion task's final report. */
  REAL_CODE_EXECUTION_ACTIVITY_IDS: [
    "foundations-4",
    "foundations-5",
    "arrays-strings-5",
    "hashing-4",
    "two-pointers-4",
    "two-pointers-5",
    "sliding-window-4",
    "sliding-window-5",
    "prefix-sum-3",
    "prefix-sum-4",
    "binary-search-4",
    "binary-search-5",
    "recursion-4",
    "recursion-5",
  ] as string[],
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
