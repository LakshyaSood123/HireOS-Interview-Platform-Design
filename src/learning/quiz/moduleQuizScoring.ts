// Module Mastery Quiz — scoring and result derivation. Pure functions, no
// React, no storage, no network: V1 is assessment-only and holds everything in
// component state. Nothing here touches progress, XP or completion.

import type { ModuleMasteryQuiz, ModuleQuizQuestion } from "../types"

/** questionId -> the option ids the learner currently has selected. A
 * question with no entry (or an empty array) is unanswered. */
export type QuizAnswers = Record<string, string[]>

export const DEFAULT_PASS_PERCENTAGE = 70

export type QuestionOutcome = "correct" | "incorrect" | "unanswered"

export interface QuestionResult {
  questionId: string
  outcome: QuestionOutcome
  selectedOptionIds: string[]
}

export interface ConceptSummary {
  concept: string
  correct: number
  total: number
}

export interface QuizResult {
  correct: number
  total: number
  /** Whole-number percentage for display. */
  percent: number
  /** Advisory only — never used to gate anything in V1. */
  passed: boolean
  passPercentage: number
  unanswered: number
  questions: QuestionResult[]
  /** Concepts where every question was answered correctly. */
  strongConcepts: ConceptSummary[]
  /** Concepts with at least one missed or unanswered question. */
  reviewConcepts: ConceptSummary[]
}

export function isAnswered(answers: QuizAnswers, questionId: string): boolean {
  return (answers[questionId]?.length ?? 0) > 0
}

export function countUnanswered(quiz: ModuleMasteryQuiz, answers: QuizAnswers): number {
  return quiz.questions.filter(question => !isAnswered(answers, question.id)).length
}

/** One point per question, no partial credit. Single-select: the one correct
 * option. Multi-select: the selected set must match the correct set exactly. */
export function isQuestionCorrect(question: ModuleQuizQuestion, selectedOptionIds: string[]): boolean {
  if (selectedOptionIds.length !== question.correctOptionIds.length) return false
  const selected = new Set(selectedOptionIds)
  if (selected.size !== selectedOptionIds.length) return false
  return question.correctOptionIds.every(id => selected.has(id))
}

export function scoreQuiz(quiz: ModuleMasteryQuiz, answers: QuizAnswers): QuizResult {
  const total = quiz.questions.length
  const questions: QuestionResult[] = quiz.questions.map(question => {
    const selectedOptionIds = answers[question.id] ?? []
    const outcome: QuestionOutcome =
      selectedOptionIds.length === 0 ? "unanswered" : isQuestionCorrect(question, selectedOptionIds) ? "correct" : "incorrect"
    return { questionId: question.id, outcome, selectedOptionIds }
  })

  const correct = questions.filter(result => result.outcome === "correct").length
  const unanswered = questions.filter(result => result.outcome === "unanswered").length
  const passPercentage = quiz.passPercentage ?? DEFAULT_PASS_PERCENTAGE

  // Integer comparison — no floating-point boundary surprises at exactly 70%.
  const passed = total > 0 && correct * 100 >= passPercentage * total

  const byConcept = new Map<string, ConceptSummary>()
  quiz.questions.forEach((question, index) => {
    const summary = byConcept.get(question.concept) ?? { concept: question.concept, correct: 0, total: 0 }
    summary.total += 1
    if (questions[index]!.outcome === "correct") summary.correct += 1
    byConcept.set(question.concept, summary)
  })
  const concepts = [...byConcept.values()]

  return {
    correct,
    total,
    percent: total === 0 ? 0 : Math.round((correct / total) * 100),
    passed,
    passPercentage,
    unanswered,
    questions,
    strongConcepts: concepts.filter(summary => summary.correct === summary.total),
    reviewConcepts: concepts.filter(summary => summary.correct < summary.total),
  }
}

/** The "Strong areas" / "Review" lists are only worth showing when the quiz
 * has more than one concept to tell apart — with a single concept tag they
 * would just repeat the total score. */
export function hasMeaningfulConceptBreakdown(quiz: ModuleMasteryQuiz): boolean {
  return new Set(quiz.questions.map(question => question.concept)).size > 1
}

/** Structural audit of one quiz's authored content. Returns human-readable
 * problems; empty means valid. Used by validation scripts, never at runtime. */
export function validateModuleQuiz(quiz: ModuleMasteryQuiz): string[] {
  const errors: string[] = []
  const seenQuestionIds = new Set<string>()
  const seenPrompts = new Set<string>()

  if (quiz.questions.length < 10 || quiz.questions.length > 15) {
    errors.push(`${quiz.id}: has ${quiz.questions.length} questions (expected 10-15).`)
  }
  if (quiz.passPercentage < 1 || quiz.passPercentage > 100) errors.push(`${quiz.id}: invalid passPercentage ${quiz.passPercentage}.`)

  for (const question of quiz.questions) {
    const tag = `${quiz.id}/${question.id}`
    if (seenQuestionIds.has(question.id)) errors.push(`${tag}: duplicate question id.`)
    seenQuestionIds.add(question.id)
    const normalizedPrompt = question.prompt.trim().toLowerCase()
    if (seenPrompts.has(normalizedPrompt)) errors.push(`${tag}: duplicate prompt.`)
    seenPrompts.add(normalizedPrompt)

    if (!question.prompt.trim()) errors.push(`${tag}: empty prompt.`)
    if (!question.explanation.trim()) errors.push(`${tag}: empty explanation.`)
    if (!question.concept.trim()) errors.push(`${tag}: empty concept tag.`)
    if (question.options.length < 2 || question.options.length > 6) errors.push(`${tag}: ${question.options.length} options.`)

    const optionIds = question.options.map(option => option.id)
    if (new Set(optionIds).size !== optionIds.length) errors.push(`${tag}: duplicate option ids.`)
    const optionTexts = question.options.map(option => option.text.trim().toLowerCase())
    if (new Set(optionTexts).size !== optionTexts.length) errors.push(`${tag}: duplicate option text.`)
    if (question.options.some(option => !option.text.trim())) errors.push(`${tag}: an option is empty.`)

    if (new Set(question.correctOptionIds).size !== question.correctOptionIds.length) errors.push(`${tag}: duplicate correct ids.`)
    for (const id of question.correctOptionIds) {
      if (!optionIds.includes(id)) errors.push(`${tag}: correct id "${id}" is not an option.`)
    }
    if (question.type === "single-select" && question.correctOptionIds.length !== 1) {
      errors.push(`${tag}: single-select needs exactly one correct option.`)
    }
    if (question.type === "multi-select" && (question.correctOptionIds.length < 2 || question.correctOptionIds.length >= question.options.length)) {
      errors.push(`${tag}: multi-select needs 2+ correct options and at least one wrong option.`)
    }
    if (question.type === "multi-select" && !/select all that apply/i.test(question.prompt)) {
      errors.push(`${tag}: multi-select prompt must say "Select all that apply."`)
    }
  }
  return errors
}
