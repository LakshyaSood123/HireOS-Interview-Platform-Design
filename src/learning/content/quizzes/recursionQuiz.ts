// Module Mastery Quiz — Recursion (module id "recursion").
// Written from recursion-1..5: trusting the smaller problem, base case and
// recursive case, what happens without a base case, factorial as the worked
// example, stack frames and unwinding, stack depth as space cost, and the
// sumOfDigits and power examples.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const FACTORIAL_CODE = "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)"
const SUM_DIGITS_CODE = "def sumOfDigits(n):\n    if n == 0:\n        return 0\n    return n % 10 + sumOfDigits(n // 10)"

export const recursionQuiz: ModuleMasteryQuiz = {
  id: "recursion-mastery",
  moduleId: "recursion",
  title: "Recursion Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "recursion-q1",
      concept: "Recursive thinking",
      difficulty: "foundation",
      prompt: "What is the mindset behind solving a problem with recursion?",
      options: [
        "Repeat the same steps in a loop until a counter runs out.",
        "Solve every possible case directly, with no shortcuts.",
        "Assume a smaller version is solved, then add a little work.",
        "Sort the input, then solve from the largest piece down.",
      ],
      correct: "c",
      explanation:
        "Recursion assumes the function already solves a smaller version of the problem, then combines that result with a little extra work.",
    }),
    singleSelect({
      id: "recursion-q2",
      concept: "When to use recursion",
      difficulty: "foundation",
      prompt: "Which task is naturally defined in terms of smaller versions of itself?",
      options: [
        "Visiting every node of a tree by handling each subtree the same way.",
        "Adding two numbers that are already in variables.",
        "Reading a single element from an array by its index.",
        "Printing one fixed message to the screen.",
      ],
      correct: "a",
      explanation:
        "Trees and other nested structures are made of smaller copies of themselves: each subtree is a tree. That is where recursion fits most naturally.",
    }),
    singleSelect({
      id: "recursion-q3",
      concept: "Base case",
      difficulty: "foundation",
      prompt: "What is the base case in factorial(n)?",
      code: FACTORIAL_CODE,
      options: ["n * factorial(n - 1)", "n == 1 returns 0", "n < 0 returns n", "n == 0 returns 1"],
      correct: "d",
      explanation:
        "The base case is the version simple enough to answer directly: factorial(0) = 1. The line n * factorial(n - 1) is the recursive case.",
    }),
    singleSelect({
      id: "recursion-q4",
      concept: "Infinite recursion",
      difficulty: "application",
      prompt: "What happens when this factorial code is called with n = -1?",
      code: FACTORIAL_CODE,
      options: [
        "It returns 1 immediately.",
        "n keeps getting smaller and never reaches 0.",
        "It returns -1 without recursing.",
        "It returns 0 after one call.",
      ],
      correct: "b",
      explanation:
        "The recursive case moves n from -1 to -2 to -3, away from the base case at 0. It never stops, and in practice the call stack overflows.",
    }),
    singleSelect({
      id: "recursion-q5",
      concept: "Reading recursive code",
      difficulty: "application",
      prompt: "What does sumOfDigits(45) return?",
      code: SUM_DIGITS_CODE,
      options: ["9", "4", "5", "54"],
      correct: "a",
      explanation:
        "45 % 10 = 5, so it returns 5 + sumOfDigits(4). That is 4 + sumOfDigits(0), and the base case returns 0. The total is 5 + 4 + 0 = 9.",
    }),
    singleSelect({
      id: "recursion-q6",
      concept: "Call stack",
      difficulty: "application",
      prompt: "When factorial(3) reaches its base case, how many calls are on the stack, counting the base case itself?",
      code: FACTORIAL_CODE,
      options: ["1", "3", "6", "4"],
      correct: "d",
      explanation:
        "The frames are factorial(3), factorial(2), factorial(1) and factorial(0). Each pending call sits on the stack until the call below it returns.",
    }),
    singleSelect({
      id: "recursion-q7",
      concept: "Unwinding",
      difficulty: "application",
      prompt: "In factorial(3), when does the multiplication 3 * 2 happen?",
      options: [
        "Before factorial(2) is called.",
        "At the moment factorial(3) is first called.",
        "After factorial(2) has returned its value.",
        "Only when the base case runs.",
      ],
      correct: "c",
      explanation:
        "factorial(3) has to wait for factorial(2) to return 2 before it can compute 3 × 2. The multiplications happen on the way back out, not on the way in.",
    }),
    singleSelect({
      id: "recursion-q8",
      concept: "Space cost",
      difficulty: "application",
      prompt: "A recursive function goes n levels deep and allocates nothing else. How much extra space does it use?",
      options: ["O(1)", "O(n)", "O(log n)", "O(n²)"],
      correct: "b",
      explanation:
        "Each pending call sits on the stack until it returns, so n levels deep means about n frames: O(n) extra space, even if the function allocates nothing itself.",
    }),
    singleSelect({
      id: "recursion-q9",
      concept: "Call stack limits",
      difficulty: "application",
      prompt: "Why can very deep recursion crash even when the logic is correct?",
      options: [
        "The base case stops working at large depth.",
        "Each call quietly makes a copy of the whole input.",
        "The call stack is finite, and each call uses some.",
        "Integer division breaks down on large numbers.",
      ],
      correct: "c",
      explanation:
        "The call stack is a finite resource. With tens of thousands of levels, the pending calls can exhaust it and cause a stack overflow, even though nothing is wrong with the logic.",
    }),
    singleSelect({
      id: "recursion-q10",
      concept: "Reading recursive code",
      difficulty: "application",
      prompt: "With power(base, exp) = base * power(base, exp - 1) and power(base, 0) = 1, what is power(2, 3)?",
      options: ["8", "6", "9", "5"],
      correct: "a",
      explanation:
        "power(2, 3) = 2 × power(2, 2) = 2 × 2 × power(2, 1) = 2 × 2 × 2 × power(2, 0) = 2 × 2 × 2 × 1 = 8.",
    }),
    singleSelect({
      id: "recursion-q11",
      concept: "Recursive case",
      difficulty: "challenge",
      prompt: "A learner writes sumOfDigits with return n % 10 + sumOfDigits(n), leaving out the n // 10. What happens?",
      code: "def sumOfDigits(n):\n    if n == 0:\n        return 0\n    return n % 10 + sumOfDigits(n)",
      options: [
        "It still returns the sum of the digits.",
        "It returns only the last digit.",
        "It returns 0 for every input.",
        "n never shrinks, so the calls never stop.",
      ],
      correct: "d",
      explanation:
        "The recursive case has to shrink the problem toward the base case. Here the same n is passed down every time, so it never reaches 0 and the recursion never ends.",
    }),
    multiSelect({
      id: "recursion-q12",
      concept: "Base case",
      difficulty: "application",
      prompt: "Which statements about recursion are true? Select all that apply.",
      options: [
        "A recursive function can skip its base case for small inputs.",
        "Each recursive call should move the problem toward the base case.",
        "In factorial, the multiplications happen while the calls go down.",
        "Pending calls stay on the call stack until they return.",
      ],
      correct: ["b", "d"],
      explanation:
        "The recursive case has to shrink the problem toward the base case, and every pending call stays on the stack until it returns. A missing base case means infinite recursion, and factorial multiplies on the way back out.",
    }),
  ],
}
