// Foundations / Complexity & Problem Solving — authored directly in the new
// content model, replacing the old legacy Trailhead Grove TrailNodes (1-3).
// Module id stays "foundations" (NOT renamed to "complexity-problem-solving")
// so the scenic map's existing tile in BiomeTrailMap.tsx keeps resolving it
// correctly — see LEARNING_ENGINE_ARCHITECTURE.md's module-id note.

import type { Checkpoint, Module } from "../types"

const bigO: Checkpoint = {
  id: "foundations-1",
  title: "Big-O & Cost of Operations",
  subtitle: "How algorithms scale",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Big-O & Cost of Operations",
    theory: [
      {
        heading: "What Big-O measures",
        body: "Big-O describes how an algorithm's cost grows as the input size n grows — not the exact runtime on any one machine.",
      },
      {
        heading: "The common growth rates",
        body: "O(1) constant, O(log n) logarithmic (halving each step), O(n) linear, O(n log n) linearithmic (typical of sorting), O(n²) quadratic (nested loops over the same input).",
      },
      {
        heading: "Space complexity",
        body: "Memory grows too — count the extra structures you allocate (arrays, hash maps, recursion stack), not the input you were already given.",
      },
    ],
    quickCheck: {
      question: "Which complexity best describes a single loop over n items?",
      options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
      correctIndex: 2,
      explanation: "One pass through n items, doing constant work each time, is O(n) — linear in the input size.",
    },
  },
}

const readingConstraints: Checkpoint = {
  id: "foundations-2",
  title: "Reading Constraints",
  subtitle: "Let the input size pick your approach",
  type: "lesson",
  xp: 30,
  prerequisites: [bigO.id],
  workspace: {
    title: "Reading Constraints",
    theory: [
      {
        heading: "Constraints tell you the budget",
        body: "If n is up to 10^5, roughly O(n log n) is safe. If n is up to 10^8 or higher, you likely need O(n) or better.",
      },
      {
        heading: "Nested loops multiply",
        body: "A loop inside a loop over the same input is O(n²) — easy to write by accident when you're checking every pair.",
      },
      {
        heading: "Extra space is a choice",
        body: "A hash map trades memory for speed (O(n) space for O(1) average lookups); sorting trades a little time for useful structure.",
      },
    ],
    quickCheck: {
      question: "An interviewer says n can be up to 10^6. Which approach is safest?",
      options: ["O(n²)", "O(n log n)", "O(2^n)", "Time complexity doesn't matter here"],
      correctIndex: 1,
      explanation: "At n = 10^6, O(n²) is around 10^12 operations — far too slow. O(n log n) (~2×10^7) comfortably fits.",
    },
  },
}

const problemSolvingPattern: Checkpoint = {
  id: "foundations-3",
  title: "Problem-Solving Pattern",
  subtitle: "Brute force first, then optimize",
  type: "lesson",
  xp: 30,
  prerequisites: [readingConstraints.id],
  workspace: {
    title: "Problem-Solving Pattern",
    theory: [
      {
        heading: "Start brute force",
        body: "Get a working O(n²) (or worse) solution first — it proves you understand the problem before you try to optimize it.",
      },
      {
        heading: "Look for repeated work",
        body: "If you're recomputing the same thing inside a loop, that's usually your signal to cache it (memoization) or restructure the loop (two pointers, a hash map).",
      },
      {
        heading: "Name the pattern",
        body: "Most interview problems are a known pattern in disguise — two pointers, sliding window, hashing, binary search. Recognizing the pattern is most of the battle.",
      },
    ],
    learnMore: "This same brute-force-then-optimize rhythm is exactly what the rest of this course practices — every Code Lab starts from 'get it working' before 'make it fast.'",
    quickCheck: {
      question: "What's usually the safest first step on a new problem?",
      options: ["Optimize immediately", "Write a brute-force solution first", "Guess the time complexity", "Skip straight to code"],
      correctIndex: 1,
      explanation: "A brute-force solution proves your understanding and gives you something correct to optimize from — and something to fall back to if you run out of time.",
    },
  },
}

const miniAnalysisChallenge: Checkpoint = {
  id: "foundations-4",
  title: "Mini Analysis Challenge",
  subtitle: "Put O(n) into practice",
  type: "challenge",
  xp: 40,
  prerequisites: [problemSolvingPattern.id],
  workspace: {
    title: "Mini Analysis Challenge",
    theory: [
      {
        heading: "One pass, one answer",
        body: "A surprising number of 'find the X' problems only need a single linear pass, keeping track of the best answer seen so far as you go.",
      },
    ],
    codingActivity: {
      prompt: "Implement findMax(nums) that returns the largest value in a non-empty list of integers, in O(n) time and O(1) extra space.",
      constraints: ["1 ≤ length of nums ≤ 10^5", "Values may be negative"],
      functionName: "findMax",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def findMax(nums):\n    # your code here\n    pass\n",
        cpp: "int findMax(vector<int>& nums) {\n    // your code here\n}\n",
        java: "int findMax(int[] nums) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Mixed values", input: "[3,7,2,9,4]", expected: "9" },
        { id: "v2", description: "Single element", input: "[5]", expected: "5" },
        { id: "v3", description: "All negative", input: "[-3,-1,-7]", expected: "-1" },
      ],
      hiddenTests: [
        { id: "h1", description: "Ascending run", input: "[1,2,3,4,5]", expected: "5" },
        { id: "h2", description: "Descending run", input: "[9,8,7,6]", expected: "9" },
        { id: "h3", description: "Repeated max values", input: "[4,4,4]", expected: "4" },
      ],
      hint: "Keep a running 'best so far' variable, start it at the first element, and update it whenever you see something larger.",
      mistakeFeedback: "You're comparing values but not updating a running maximum as you scan — keep the best value seen so far in a variable and update it inside the loop.",
    },
  },
  questionIds: ["q-foundations-complexity-analysis"],
}

const foundationsMastery: Checkpoint = {
  id: "foundations-5",
  title: "Foundations Mastery",
  subtitle: "Choosing the right complexity",
  type: "boss",
  xp: 40,
  masteryXp: 100,
  prerequisites: [miniAnalysisChallenge.id],
  workspace: {
    title: "Foundations Mastery",
    theory: [
      {
        heading: "Trading space for time",
        body: "Checking every pair for a duplicate is O(n²). Remembering what you've already seen — in a hash set — turns it into a single O(n) pass.",
      },
    ],
    codingActivity: {
      prompt: "Implement hasDuplicate(nums) that returns true if any value appears more than once, in O(n) time using a hash set — not an O(n²) pairwise comparison.",
      constraints: ["0 ≤ length of nums ≤ 10^5"],
      functionName: "hasDuplicate",
      requiredKeywords: ["set", "for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def hasDuplicate(nums):\n    # your code here\n    pass\n",
        cpp: "bool hasDuplicate(vector<int>& nums) {\n    // your code here\n}\n",
        java: "boolean hasDuplicate(int[] nums) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Has a duplicate", input: "[1,2,3,2]", expected: "true" },
        { id: "v2", description: "No duplicates", input: "[1,2,3,4]", expected: "false" },
        { id: "v3", description: "Single element", input: "[7]", expected: "false" },
      ],
      hiddenTests: [
        { id: "h1", description: "Duplicate at the ends", input: "[5,1,2,5]", expected: "true" },
        { id: "h2", description: "All identical", input: "[3,3,3]", expected: "true" },
        { id: "h3", description: "Empty list", input: "[]", expected: "false" },
      ],
      hint: "Add each value to a set as you scan — if a value is already in the set before you add it, you've found your duplicate.",
      mistakeFeedback: "This looks like it's comparing every pair of elements (O(n²)) instead of tracking seen values in a set (O(n)) — that's the exact trade-off this module has been building toward.",
    },
  },
}

export const foundationsModule: Module = {
  id: "foundations",
  title: "Complexity & Problem Solving",
  description: "Big-O reasoning, reading constraints, and the brute-force-then-optimize pattern that drives every problem in this course.",
  icon: "🌱",
  accentColor: "#79A84B",
  contentKind: "workspace",
  checkpoints: [bigO, readingConstraints, problemSolvingPattern, miniAnalysisChallenge, foundationsMastery],
}
