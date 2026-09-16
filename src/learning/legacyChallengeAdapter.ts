// Adapts the OLD `PracticeChallenge` shape (src/data/reagvisCourses.ts,
// still used by the legacy graphs/dp/summit modules) into a
// `CodingActivityContent` so `ChallengeStage.tsx` can call the SAME
// `MockCodeRunner` the new Lesson Workspace uses, instead of its own
// independent `setTimeout`-based always-succeeds mock. This is the "retire
// the second mock execution path" fix — see LEARNING_ENGINE_ARCHITECTURE.md.
//
// `PracticeChallenge` never stored structured test cases (visible/hidden
// input-expected pairs) — only one `expectedOutput` string and one
// `mockRunOutput` narrative string. The adapter does the best it can with
// that: a single visible test built from `expectedOutput`, and the same
// test reused as the lone hidden test (there's no second data point to
// build a distinct hidden case from). This is a strictly legacy code path —
// modules that get migrated to the new content model (as Foundations/Linked
// Lists/Recursion/Trees already were) get real, distinct visible/hidden
// test suites authored directly, as in src/learning/content/*.ts.

import type { PracticeChallenge } from "../data/reagvisCourses"
import type { CodingActivityContent } from "./types"

function inferFunctionName(starterCode: string): string {
  const match = starterCode.match(/function\s+(\w+)\s*\(/)
  return match ? match[1] : "solution"
}

export function practiceChallengeToActivity(challenge: PracticeChallenge): CodingActivityContent {
  const functionName = inferFunctionName(challenge.starterCode)

  return {
    prompt: challenge.description,
    functionName,
    // No reliable keyword signal available from the old data shape — stay
    // permissive rather than guessing incorrectly.
    requiredKeywords: [],
    starterCode: { javascript: challenge.starterCode },
    languages: ["javascript"],
    visibleTests: [
      { id: "legacy-visible", description: "Expected result", input: "(see problem statement)", expected: challenge.expectedOutput },
    ],
    hiddenTests: [
      { id: "legacy-hidden", description: "Expected result", input: "(see problem statement)", expected: challenge.expectedOutput },
    ],
    hint: challenge.solutionHint,
    mistakeFeedback: "Double-check your solution against the constraints and expected return value above.",
  }
}
