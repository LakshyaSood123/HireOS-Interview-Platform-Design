// Small authoring helpers so quiz files read like content, not boilerplate.
// They only build plain ModuleQuizQuestion data — nothing here runs at
// learning time beyond constructing the objects once at import.

import type { ModuleQuizQuestion } from "../types"

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"] as const

interface QuestionInput {
  id: string
  concept: string
  difficulty?: ModuleQuizQuestion["difficulty"]
  prompt: string
  code?: string
  /** Option texts in display order. Ids are assigned a, b, c, d… */
  options: string[]
  explanation: string
}

function buildOptions(texts: string[]) {
  return texts.map((text, index) => ({ id: OPTION_IDS[index]!, text }))
}

/** One correct answer, given as its letter ("a" | "b" | "c" | "d"). */
export function singleSelect(input: QuestionInput & { correct: (typeof OPTION_IDS)[number] }): ModuleQuizQuestion {
  const { correct, options, ...rest } = input
  return { ...rest, type: "single-select", options: buildOptions(options), correctOptionIds: [correct] }
}

/** Two or more correct answers, given as letters. The prompt must end with
 * "Select all that apply." (checked by validateModuleQuiz). */
export function multiSelect(input: QuestionInput & { correct: (typeof OPTION_IDS)[number][] }): ModuleQuizQuestion {
  const { correct, options, ...rest } = input
  return { ...rest, type: "multi-select", options: buildOptions(options), correctOptionIds: correct }
}
