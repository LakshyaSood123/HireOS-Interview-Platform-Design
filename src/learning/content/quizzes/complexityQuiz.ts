// Module Mastery Quiz — Complexity & Problem Solving (module id "foundations").
// Every question is written from what foundations-1..5 actually teach: growth
// versus stopwatch time, comparing rates, space, reading constraints as a
// rough guide, a repeatable problem-solving order, repeated work, and the
// findMax / hasDuplicate examples. No question introduces anything later.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

export const complexityQuiz: ModuleMasteryQuiz = {
  id: "foundations-mastery",
  moduleId: "foundations",
  title: "Complexity & Problem Solving Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "foundations-q1",
      concept: "Growth vs runtime",
      difficulty: "foundation",
      prompt: "A friend says, \"My O(n²) code ran faster than your O(n) code on my laptop, so O(n²) must be better.\" What is the best reply?",
      options: [
        "Big-O is only about memory use, so the laptop test tells us nothing at all.",
        "Big-O tracks how work grows with n, so O(n²) can win small inputs but loses later.",
        "Your laptop must be broken, because O(n) code is always faster than O(n²) code.",
        "Big-O predicts exact seconds, so one of you must have timed it wrong.",
      ],
      correct: "b",
      explanation:
        "Big-O describes how the amount of work grows as the input grows, not stopwatch time. On a small input the constants can make O(n²) code quicker, but as n gets bigger its work grows much faster.",
    }),
    singleSelect({
      id: "foundations-q2",
      concept: "Comparing growth rates",
      difficulty: "foundation",
      prompt: "The input gets 10 times bigger, from n = 100 to n = 1,000. About how much more work does an O(n²) solution do?",
      options: ["About 10 times more", "About 1,000 times more", "About 100 times more", "About the same amount"],
      correct: "c",
      explanation:
        "n² grows with the square of n, so 10 times the input means 10 × 10 = 100 times the work. An O(n) solution would do about 10 times more.",
    }),
    singleSelect({
      id: "foundations-q3",
      concept: "Comparing growth rates",
      difficulty: "application",
      prompt: "A solution takes about 3 steps when n = 8, 4 steps when n = 16, and 5 steps when n = 32. Which growth rate fits?",
      options: ["O(log n)", "O(n)", "O(1)", "O(n²)"],
      correct: "a",
      explanation:
        "Doubling n adds just one step, which is what happens when each step throws away half of what is left. That is O(log n). O(n) would double the steps, and O(1) would not change at all.",
    }),
    singleSelect({
      id: "foundations-q4",
      concept: "Space complexity",
      difficulty: "foundation",
      prompt: "A function copies an input array of n numbers into a new array, then reverses the copy. How much extra space does it use?",
      options: ["O(log n)", "O(1)", "O(n²)", "O(n)"],
      correct: "d",
      explanation:
        "Space complexity counts the extra memory you allocate, not the input you were given. A copy of n numbers is n extra slots, so O(n). Reversing the original by swapping would need only O(1).",
    }),
    singleSelect({
      id: "foundations-q5",
      concept: "Reading constraints",
      difficulty: "application",
      prompt: "A problem says n can be up to 10^6. Which statement is the most sensible?",
      options: [
        "O(n²) is fine, because modern computers are fast enough for anything.",
        "Only an O(1) solution can possibly work when n is that large.",
        "O(n log n) is often plausible, but O(n²) is about 10^12 steps: too many.",
        "The limit only tells you how much memory the program is allowed to use.",
      ],
      correct: "c",
      explanation:
        "At n = 10^6, O(n) is about 10^6 steps and O(n log n) about 2×10^7, both often plausible under typical limits. O(n²) is about 10^12, very likely too slow. These are rough estimates, not laws.",
    }),
    singleSelect({
      id: "foundations-q6",
      concept: "Reading constraints",
      difficulty: "application",
      prompt: "A problem says n ≤ 20, and your simple idea checks every pair. What should you think?",
      options: [
        "With n this small, even a slow idea is usually fine.",
        "Any O(n²) idea gets rejected, so I must rewrite it.",
        "I need an O(1) solution for such a small n.",
        "The limit does not matter for time at all.",
      ],
      correct: "a",
      explanation:
        "20 items means only about 200 pairs. Limits are a guide, and small n often allows a simple approach. Feasibility also depends on the language, constants and the time limit.",
    }),
    singleSelect({
      id: "foundations-q7",
      concept: "Problem-solving approach",
      difficulty: "application",
      prompt: "You meet a new problem. Which order of steps works well?",
      options: [
        "Choose the fanciest data structure you know, then build the solution around it.",
        "Start coding right away and fix the speed later if the tests fail.",
        "Always write the slowest possible version first, even when you can see a better one.",
        "Understand it, trace an example, pick a simple correct idea, analyze it, improve if needed.",
      ],
      correct: "d",
      explanation:
        "Understand the problem, work a small example, describe a simple correct approach, work out its cost, look for repeated work, and improve it only if the limits call for it. A simple approach is a baseline, not a ritual.",
    }),
    singleSelect({
      id: "foundations-q8",
      concept: "Repeated work",
      difficulty: "application",
      prompt: "To get the running total at every position, a learner adds up nums[0..i] from scratch for each i. What work is repeated?",
      options: [
        "Each total re-adds numbers that earlier totals already added.",
        "The array is sorted again for every position.",
        "Each total is calculated twice on purpose.",
        "Nothing is repeated, because each total is different.",
      ],
      correct: "a",
      explanation:
        "The total for position 3 starts by adding the same numbers as the total for position 2. Keeping one running total removes that repetition.",
    }),
    singleSelect({
      id: "foundations-q9",
      concept: "Best-so-far tracking",
      difficulty: "challenge",
      prompt: "This findMax code runs on [-3, -1, -7]. What does it return?",
      code: "best = 0\nfor n in nums:\n    if n > best:\n        best = n\nreturn best",
      options: ["-1", "0", "-3", "-7"],
      correct: "b",
      explanation:
        "best starts at 0 and no negative number is larger than 0, so it never updates and returns 0, which is not even in the list. Start best at the first element instead.",
    }),
    singleSelect({
      id: "foundations-q10",
      concept: "Trading space for time",
      difficulty: "application",
      prompt: "hasDuplicate scans [4, 2, 7, 2] and keeps a set of values it has seen. When does it first report a duplicate?",
      options: [
        "Right after reading 4, because it is the first value.",
        "After reading the second 2, because 2 is already in the set.",
        "After reading 7, because the set now holds three values.",
        "Only after it has read the whole list from start to end.",
      ],
      correct: "b",
      explanation:
        "The set holds 4, 2 and 7 when the second 2 arrives. Asking \"is 2 in here?\" answers yes, so it stops right there.",
    }),
    singleSelect({
      id: "foundations-q11",
      concept: "Trading space for time",
      difficulty: "application",
      prompt: "What does the set version of hasDuplicate cost compared with checking every pair?",
      options: [
        "It needs the list to be sorted before it starts.",
        "It uses O(1) extra space but still needs O(n²) time.",
        "It gets slower as the list grows, unlike checking pairs.",
        "About O(n) extra memory, for a single pass.",
      ],
      correct: "d",
      explanation:
        "The set stores up to n values, so it uses O(n) extra space. In return, the whole scan is one pass, about O(n) expected time instead of O(n²).",
    }),
    multiSelect({
      id: "foundations-q12",
      concept: "Growth vs runtime",
      difficulty: "application",
      prompt: "Which statements about Big-O are true? Select all that apply.",
      options: [
        "It ignores constant factors, so two O(n) solutions can run at different speeds.",
        "An O(n²) solution is always slower than an O(n) one, even for tiny inputs.",
        "It describes how the work grows as the input grows.",
        "It tells you exactly how many seconds a program will take.",
      ],
      correct: ["a", "c"],
      explanation:
        "Big-O is about growth and hides constant factors, so it cannot promise seconds or a winner on tiny inputs. Two O(n) solutions really can differ in speed, and O(n²) code can win on a very small input.",
    }),
  ],
}
