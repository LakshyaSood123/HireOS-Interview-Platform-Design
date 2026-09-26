import { useEffect, useMemo, useRef, useState } from "react"
import type { ModuleMasteryQuiz, ModuleQuizQuestion } from "../../learning/types"
import {
  countUnanswered,
  hasMeaningfulConceptBreakdown,
  isAnswered,
  scoreQuiz,
  type QuizAnswers,
} from "../../learning/quiz/moduleQuizScoring"
import LessonCampBackdrop from "../lesson/camp/LessonCampBackdrop"

interface ModuleMasteryQuizViewProps {
  quiz: ModuleMasteryQuiz
  moduleTitle: string
  onReturn: () => void
}

type Phase = "quiz" | "result" | "review"

const BACK_PILL =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A]"
const PRIMARY_BTN =
  "px-5 py-2.5 rounded-xl bg-[#1DB584] hover:bg-[#19a075] text-white text-sm font-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A14] disabled:opacity-40 disabled:cursor-not-allowed"
const SECONDARY_BTN =
  "px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-sm font-bold text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] disabled:opacity-40 disabled:cursor-not-allowed"

function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

/** Module Mastery Quiz — dark lesson-theme screen. State lives only in React:
 * leaving the view (or "Try Again") discards it. Nothing here touches
 * progress, XP or checkpoint completion. */
export default function ModuleMasteryQuizView({ quiz, moduleTitle, onReturn }: ModuleMasteryQuizViewProps) {
  const [phase, setPhase] = useState<Phase>("quiz")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [confirming, setConfirming] = useState(false)
  const [reviewIndex, setReviewIndex] = useState(0)
  const headingRef = useRef<HTMLHeadingElement>(null)

  const total = quiz.questions.length
  const unanswered = countUnanswered(quiz, answers)
  const result = useMemo(() => (phase === "quiz" ? null : scoreQuiz(quiz, answers)), [phase, quiz, answers])

  // Move focus to the new heading whenever the visible question or phase changes.
  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [phase, index, reviewIndex])

  const select = (question: ModuleQuizQuestion, optionId: string) => {
    setConfirming(false)
    setAnswers(prev => {
      if (question.type === "single-select") return { ...prev, [question.id]: [optionId] }
      const current = prev[question.id] ?? []
      const next = current.includes(optionId) ? current.filter(id => id !== optionId) : [...current, optionId]
      return { ...prev, [question.id]: next }
    })
  }

  const retry = () => {
    setAnswers({})
    setIndex(0)
    setReviewIndex(0)
    setConfirming(false)
    setPhase("quiz")
  }

  const submit = () => {
    if (unanswered > 0 && !confirming) {
      setConfirming(true)
      return
    }
    setConfirming(false)
    setPhase("result")
  }

  const header = (
    <header className="flex items-center justify-between gap-3 mb-6">
      <button type="button" onClick={onReturn} className={BACK_PILL}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Return to Module
      </button>
      <span className="text-[11px] font-bold uppercase tracking-widest text-[#E2B44A]">Module Mastery</span>
    </header>
  )

  let body: React.ReactNode

  if (phase === "quiz") {
    const question = quiz.questions[index]!
    body = (
      <div className="grid lg:grid-cols-[1fr_220px] gap-6 items-start">
        <section aria-labelledby="quiz-question-heading" className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-8">
          <p className="text-xs font-bold text-gray-400">
            Question {index + 1} of {total}
          </p>
          <h2
            id="quiz-question-heading"
            ref={headingRef}
            tabIndex={-1}
            className="mt-2 text-lg sm:text-xl font-black leading-snug text-white focus:outline-none"
          >
            {question.prompt}
          </h2>
          {question.code && (
            <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 border border-white/10 p-4 text-[13px] leading-relaxed text-gray-100 font-mono">
              <code>{question.code}</code>
            </pre>
          )}

          <fieldset className="mt-5 border-0 p-0 m-0">
            <legend className="sr-only">
              {question.type === "multi-select"
                ? `Question ${index + 1}. Select all that apply. Several options can be chosen.`
                : `Question ${index + 1}. Choose one answer.`}
            </legend>
            {question.type === "multi-select" && (
              <p className="mb-3 text-xs font-bold text-[#E2B44A]">Select all that apply.</p>
            )}
            <div className="space-y-2.5">
              {question.options.map((option, optionIndex) => {
                const checked = (answers[question.id] ?? []).includes(option.id)
                const inputType = question.type === "multi-select" ? "checkbox" : "radio"
                return (
                  <label
                    key={option.id}
                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-[#E2B44A] ${
                      checked ? "bg-[#1DB584]/15 border-[#1DB584]/60" : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07]"
                    }`}
                  >
                    <input
                      type={inputType}
                      name={question.id}
                      checked={checked}
                      onChange={() => select(question, option.id)}
                      className="mt-1 h-4 w-4 accent-[#1DB584] flex-shrink-0"
                    />
                    <span className="text-sm leading-relaxed text-gray-100">
                      <span className="font-black text-gray-400 mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                      {option.text}
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>

          {confirming && (
            <div role="alert" className="mt-5 rounded-2xl border border-[#E2B44A]/50 bg-[#E2B44A]/10 p-4">
              <p className="text-sm font-bold text-[#F3D98B]">
                You still have {unanswered} unanswered {plural(unanswered, "question", "questions")}.
              </p>
              <p className="text-xs text-gray-300 mt-1">Unanswered questions count as incorrect. You can go back, or submit as it is.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={SECONDARY_BTN} onClick={() => setConfirming(false)}>
                  Keep Answering
                </button>
                <button type="button" className={PRIMARY_BTN} onClick={submit}>
                  Submit Anyway
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <button type="button" className={SECONDARY_BTN} onClick={() => setIndex(index - 1)} disabled={index === 0}>
              Previous
            </button>
            {index < total - 1 ? (
              <button type="button" className={PRIMARY_BTN} onClick={() => setIndex(index + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className={PRIMARY_BTN} onClick={submit}>
                Submit Quiz
              </button>
            )}
          </div>
        </section>

        <nav aria-label="Question navigator" className="rounded-3xl bg-white/[0.04] border border-white/10 p-4">
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Questions</p>
          <ol className="grid grid-cols-6 lg:grid-cols-4 gap-2">
            {quiz.questions.map((q, i) => {
              const answered = isAnswered(answers, q.id)
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-current={i === index ? "step" : undefined}
                    aria-label={`Question ${i + 1}, ${answered ? "answered" : "not answered"}`}
                    className={`w-full aspect-square rounded-lg text-xs font-black border focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] ${
                      i === index ? "ring-2 ring-white/70" : ""
                    } ${answered ? "bg-[#1DB584]/25 border-[#1DB584]/60 text-white" : "bg-transparent border-dashed border-white/25 text-gray-400"}`}
                  >
                    {answered ? `${i + 1}✓` : i + 1}
                  </button>
                </li>
              )
            })}
          </ol>
          <p className="mt-3 text-[11px] text-gray-400">✓ marks answered questions.</p>
          <button type="button" className={`${SECONDARY_BTN} w-full mt-4`} onClick={submit}>
            Submit Quiz
          </button>
        </nav>
      </div>
    )
  } else if (phase === "result" && result) {
    const showBreakdown = hasMeaningfulConceptBreakdown(quiz)
    body = (
      <section aria-labelledby="quiz-result-heading" className="max-w-2xl mx-auto rounded-3xl bg-white/[0.04] border border-white/10 p-6 sm:p-8">
        <h2 id="quiz-result-heading" ref={headingRef} tabIndex={-1} className="text-xl font-black text-white focus:outline-none">
          {quiz.title}: Results
        </h2>
        <div className="mt-5 flex flex-wrap items-baseline gap-x-5 gap-y-2">
          <p className="text-4xl font-black text-white">
            {result.correct} / {result.total}
          </p>
          <p className="text-xl font-black text-gray-300">{result.percent}%</p>
          <span
            className={`text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              result.passed ? "bg-[#1DB584]/15 border-[#1DB584]/50 text-[#7EE2BE]" : "bg-[#E2B44A]/10 border-[#E2B44A]/50 text-[#F3D98B]"
            }`}
          >
            {result.passed ? "✓ Pass" : "Needs Review"}
          </span>
        </div>
        <p className="mt-3 text-sm text-gray-300">
          {result.passed
            ? `You reached the ${result.passPercentage}% mark for this module.`
            : `The ${result.passPercentage}% mark is a guide, not a gate. Reviewing your answers is a good next step.`}{" "}
          Nothing here changes your module progress.
        </p>
        {result.unanswered > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            {result.unanswered} {plural(result.unanswered, "question was", "questions were")} left unanswered.
          </p>
        )}

        {showBreakdown && (result.strongConcepts.length > 0 || result.reviewConcepts.length > 0) && (
          <div className="mt-6 grid sm:grid-cols-2 gap-4">
            {result.strongConcepts.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#7EE2BE]">Strong areas</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-200">
                  {result.strongConcepts.map(c => (
                    <li key={c.concept}>{c.concept}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.reviewConcepts.length > 0 && (
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-[#F3D98B]">Review</h3>
                <ul className="mt-2 space-y-1 text-sm text-gray-200">
                  {result.reviewConcepts.map(c => (
                    <li key={c.concept}>{c.concept}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className={PRIMARY_BTN}
            onClick={() => {
              setReviewIndex(0)
              setPhase("review")
            }}
          >
            Review Answers
          </button>
          <button type="button" className={SECONDARY_BTN} onClick={retry}>
            Try Again
          </button>
          <button type="button" className={SECONDARY_BTN} onClick={onReturn}>
            Return to Module
          </button>
        </div>
      </section>
    )
  } else if (phase === "review" && result) {
    const question = quiz.questions[reviewIndex]!
    const questionResult = result.questions[reviewIndex]!
    const statusLabel =
      questionResult.outcome === "correct" ? "✓ Correct" : questionResult.outcome === "unanswered" ? "Not answered" : "Not quite"
    body = (
      <section aria-labelledby="quiz-review-heading" className="max-w-3xl mx-auto rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-gray-400">
            Review: question {reviewIndex + 1} of {total}
          </p>
          <span className="text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-white/20 text-gray-200">
            {statusLabel}
          </span>
        </div>
        <h2 id="quiz-review-heading" ref={headingRef} tabIndex={-1} className="mt-2 text-lg sm:text-xl font-black leading-snug text-white focus:outline-none">
          {question.prompt}
        </h2>
        {question.code && (
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 border border-white/10 p-4 text-[13px] leading-relaxed text-gray-100 font-mono">
            <code>{question.code}</code>
          </pre>
        )}
        <ul className="mt-5 space-y-2.5">
          {question.options.map((option, optionIndex) => {
            const isCorrect = question.correctOptionIds.includes(option.id)
            const isSelected = questionResult.selectedOptionIds.includes(option.id)
            return (
              <li
                key={option.id}
                className={`rounded-2xl border px-4 py-3 text-sm leading-relaxed text-gray-100 ${
                  isCorrect ? "bg-[#1DB584]/15 border-[#1DB584]/60" : isSelected ? "bg-[#E2B44A]/10 border-[#E2B44A]/40" : "bg-white/[0.03] border-white/10"
                }`}
              >
                <span className="font-black text-gray-400 mr-2">{String.fromCharCode(65 + optionIndex)}.</span>
                {option.text}
                {(isSelected || isCorrect) && (
                  <span className="block mt-1 text-[11px] font-black uppercase tracking-wide text-gray-300">
                    {isSelected ? "Your answer" : ""}
                    {isSelected && isCorrect ? " · " : ""}
                    {isCorrect ? "Correct answer" : ""}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
        <div className="mt-5 rounded-2xl bg-black/25 border border-white/10 p-4">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-gray-400">Explanation</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-gray-200">{question.explanation}</p>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className={SECONDARY_BTN} onClick={() => setReviewIndex(reviewIndex - 1)} disabled={reviewIndex === 0}>
            Previous
          </button>
          <button type="button" className={SECONDARY_BTN} onClick={() => setPhase("result")}>
            Back to Results
          </button>
          <button type="button" className={PRIMARY_BTN} onClick={() => setReviewIndex(reviewIndex + 1)} disabled={reviewIndex === total - 1}>
            Next
          </button>
        </div>
      </section>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#071A14] font-display text-white overflow-x-hidden">
      <LessonCampBackdrop moduleTitle={moduleTitle} />
      <div className="relative z-10 w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col min-h-screen">
        {header}
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-1">{quiz.title}</h1>
        <p className="text-sm text-gray-400 mb-6">
          {total} questions · an end-of-module check. It does not affect your progress or unlock anything.
        </p>
        {body}
      </div>
    </div>
  )
}
