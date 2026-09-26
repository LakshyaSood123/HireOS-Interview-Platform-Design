import { getCourseById } from "../src/learning/courseRegistry.js"
import type { ModuleMasteryQuiz } from "../src/learning/types.js"
import {
  countUnanswered,
  hasMeaningfulConceptBreakdown,
  isQuestionCorrect,
  scoreQuiz,
  validateModuleQuiz,
  type QuizAnswers,
} from "../src/learning/quiz/moduleQuizScoring.js"

let failures = 0
function check(label: string, condition: boolean, detail?: unknown): void {
  if (!condition) {
    failures += 1
    console.error(`FAIL  ${label}${detail !== undefined ? `  ${JSON.stringify(detail)}` : ""}`)
  }
}

// ── 1. Content: which modules have quizzes, and are they well formed ─────
const course = getCourseById("dsa-foundations")
if (!course) throw new Error("dsa-foundations course not found")
const modules = course.zones.flatMap(zone => zone.modules)
const quizzed = modules.filter(module => module.quiz)
const EXPECTED = [
  "foundations", "arrays-strings", "hashing", "two-pointers", "binary-search",
  "sliding-window", "prefix-sum", "intervals", "linked-structures", "recursion", "trees",
]

check("exactly the expected modules have a quiz", JSON.stringify(quizzed.map(m => m.id).sort()) === JSON.stringify([...EXPECTED].sort()), quizzed.map(m => m.id))
check("29 modules total", modules.length === 29, modules.length)
check("107 checkpoints total", modules.flatMap(m => m.checkpoints).length === 107)

let totalQuestions = 0
const allQuestionIds = new Set<string>()
for (const module of quizzed) {
  const quiz = module.quiz as ModuleMasteryQuiz
  check(`${module.id}: quiz.moduleId matches`, quiz.moduleId === module.id)
  check(`${module.id}: exactly 12 questions`, quiz.questions.length === 12, quiz.questions.length)
  check(`${module.id}: pass mark is 70`, quiz.passPercentage === 70)
  for (const error of validateModuleQuiz(quiz)) check(error, false)
  totalQuestions += quiz.questions.length

  for (const question of quiz.questions) {
    check(`${question.id}: globally unique id`, !allQuestionIds.has(question.id))
    allQuestionIds.add(question.id)
  }

  const multi = quiz.questions.filter(q => q.type === "multi-select").length
  check(`${module.id}: has a multi-select question`, multi >= 1, multi)
  check(`${module.id}: has a meaningful concept breakdown`, hasMeaningfulConceptBreakdown(quiz))

  // Quick-Check non-duplication: no quiz prompt equals a checkpoint Quick Check question.
  const quickChecks = module.checkpoints.map(cp => cp.workspace?.quickCheck?.question?.trim().toLowerCase()).filter(Boolean)
  for (const question of quiz.questions) {
    check(`${question.id}: not a verbatim Quick Check`, !quickChecks.includes(question.prompt.trim().toLowerCase()))
  }

  // Answer-position and answer-length balance, reported not enforced.
  const positions: Record<string, number> = {}
  let longest = 0
  for (const question of quiz.questions.filter(q => q.type === "single-select")) {
    const correctId = question.correctOptionIds[0]!
    positions[correctId] = (positions[correctId] ?? 0) + 1
    const distractors = question.options.filter(o => o.id !== correctId)
    const averageDistractor = distractors.reduce((sum, o) => sum + o.text.length, 0) / distractors.length
    const correctLength = question.options.find(o => o.id === correctId)!.text.length
    if (correctLength >= averageDistractor * 1.3) longest += 1
  }
  check(`${module.id}: no strong answer-length tell`, longest <= 4, longest)
  console.log(`${module.id.padEnd(15)} 12 questions | correct-answer positions ${JSON.stringify(positions)} | correct is 1.3x+ the average distractor in ${longest}/11 single-selects`)
}
check("12 questions per quiz in total", totalQuestions === 12 * quizzed.length, totalQuestions)
check("no duplicate prompts across all quizzes", new Set(quizzed.flatMap(m => m.quiz!.questions.map(q => q.prompt.trim().toLowerCase()))).size === totalQuestions)

// ── 2. Scoring behavior on a synthetic 10-question quiz ─────────────────
const synthetic: ModuleMasteryQuiz = {
  id: "synthetic",
  moduleId: "synthetic",
  title: "Synthetic",
  passPercentage: 70,
  questions: Array.from({ length: 10 }, (_, i) => ({
    id: `s${i + 1}`,
    type: i === 9 ? ("multi-select" as const) : ("single-select" as const),
    prompt: `Question ${i + 1}${i === 9 ? " Select all that apply." : ""}`,
    options: [
      { id: "a", text: "A" },
      { id: "b", text: "B" },
      { id: "c", text: "C" },
      { id: "d", text: "D" },
    ],
    correctOptionIds: i === 9 ? ["a", "c"] : ["a"],
    explanation: "x",
    concept: i < 5 ? "Concept One" : "Concept Two",
  })),
}
function answersWithCorrect(count: number, wrongOptionForRest = "b"): QuizAnswers {
  const answers: QuizAnswers = {}
  synthetic.questions.forEach((q, i) => {
    answers[q.id] = i < count ? [...q.correctOptionIds] : q.type === "multi-select" ? ["a"] : [wrongOptionForRest]
  })
  return answers
}

const all = scoreQuiz(synthetic, answersWithCorrect(10))
check("all correct: 10/10, 100%, pass", all.correct === 10 && all.percent === 100 && all.passed)
const none = scoreQuiz(synthetic, answersWithCorrect(0))
check("all wrong: 0/10, 0%, not pass", none.correct === 0 && none.percent === 0 && !none.passed)
const exactly70 = scoreQuiz(synthetic, answersWithCorrect(7))
check("exactly 70%: 7/10 passes", exactly70.correct === 7 && exactly70.percent === 70 && exactly70.passed)
const below70 = scoreQuiz(synthetic, answersWithCorrect(6))
check("below 70%: 6/10 does not pass", below70.correct === 6 && below70.percent === 60 && !below70.passed)
const noAnswers = scoreQuiz(synthetic, {})
check("unanswered: counted, scores 0", noAnswers.unanswered === 10 && noAnswers.correct === 0 && countUnanswered(synthetic, {}) === 10)
const partialAnswered = scoreQuiz(synthetic, { s1: ["a"], s2: [] })
check("empty selection counts as unanswered", partialAnswered.unanswered === 9 && partialAnswered.correct === 1)

const multi = synthetic.questions[9]!
check("multi-select exact set is correct", isQuestionCorrect(multi, ["a", "c"]) && isQuestionCorrect(multi, ["c", "a"]))
check("multi-select partial answer gets no credit", !isQuestionCorrect(multi, ["a"]) && !isQuestionCorrect(multi, ["c"]))
check("multi-select extra option gets no credit", !isQuestionCorrect(multi, ["a", "c", "d"]))
check("multi-select wrong set gets no credit", !isQuestionCorrect(multi, ["b", "d"]))
const single = synthetic.questions[0]!
check("single-select needs the exact option", isQuestionCorrect(single, ["a"]) && !isQuestionCorrect(single, ["b"]) && !isQuestionCorrect(single, ["a", "b"]))

// Changing an answer before submitting: only the final selection counts.
const changed: QuizAnswers = { s1: ["b"] }
changed.s1 = ["a"]
check("changed answer uses the latest selection", scoreQuiz(synthetic, changed).questions[0]!.outcome === "correct")

// Concept breakdown derives from tags, only "all correct" concepts are strong.
const mixed = scoreQuiz(synthetic, { ...answersWithCorrect(5), s6: ["b"] })
check("concept breakdown: Concept One strong", mixed.strongConcepts.some(c => c.concept === "Concept One"))
check("concept breakdown: Concept Two needs review", mixed.reviewConcepts.some(c => c.concept === "Concept Two"))

// Real quizzes: all-correct and all-wrong answer keys behave as expected.
for (const module of quizzed) {
  const quiz = module.quiz as ModuleMasteryQuiz
  const allRight: QuizAnswers = Object.fromEntries(quiz.questions.map(q => [q.id, [...q.correctOptionIds]]))
  const r = scoreQuiz(quiz, allRight)
  check(`${module.id}: answer key scores 12/12`, r.correct === 12 && r.passed && r.reviewConcepts.length === 0)
  const allWrong: QuizAnswers = Object.fromEntries(
    quiz.questions.map(q => [q.id, [q.options.find(o => !q.correctOptionIds.includes(o.id))!.id]]),
  )
  const w = scoreQuiz(quiz, allWrong)
  check(`${module.id}: wrong key scores 0/12`, w.correct === 0 && !w.passed)
  const nine = scoreQuiz(quiz, { ...allRight, ...Object.fromEntries(quiz.questions.slice(0, 3).map(q => [q.id, allWrong[q.id]!])) })
  check(`${module.id}: 9/12 = 75% passes`, nine.correct === 9 && nine.percent === 75 && nine.passed)
  const eight = scoreQuiz(quiz, { ...allRight, ...Object.fromEntries(quiz.questions.slice(0, 4).map(q => [q.id, allWrong[q.id]!])) })
  check(`${module.id}: 8/12 = 67% needs review`, eight.correct === 8 && eight.percent === 67 && !eight.passed)
}

if (failures > 0) {
  console.error(`\nModule quiz validation FAILED: ${failures} problem(s).`)
  process.exit(1)
}
console.log(`\nModule quiz validation passed: ${quizzed.length} quizzes, ${totalQuestions} questions, scoring cases OK.`)
