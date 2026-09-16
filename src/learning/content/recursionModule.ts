// Recursion — authored directly in the new content model, replacing the old
// legacy Recursion Cave TrailNodes (7-8), which never had lesson content.
// Module id stays "recursion" (unchanged) — already matches the scenic
// map's tile id, no remapping needed.

import type { Checkpoint, Module } from "../types"

const mentalModel: Checkpoint = {
  id: "recursion-1",
  title: "Recursion Mental Model",
  subtitle: "A function that calls itself",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Recursion Mental Model",
    theory: [
      {
        heading: "Trust the smaller problem",
        body: "Recursion solves a problem by assuming a function already correctly solves a *smaller* version of it, then combines that result with a little extra work.",
      },
      {
        heading: "Base case and recursive case",
        body: "Every recursive function needs a base case — a version simple enough to answer directly — and a recursive case that shrinks the problem toward that base case.",
      },
      {
        heading: "When to reach for it",
        body: "Recursion fits naturally when a problem is defined in terms of smaller versions of itself: trees, nested structures, and 'try this, then try that' search problems.",
      },
    ],
    quickCheck: {
      question: "What are the two parts every recursive function needs?",
      options: ["A loop and a counter", "A base case and a recursive case", "Two return statements", "A global variable"],
      correctIndex: 1,
      explanation: "The base case stops the recursion; the recursive case shrinks the problem and calls the function again.",
    },
  },
}

const baseAndRecursiveCase: Checkpoint = {
  id: "recursion-2",
  title: "Base Case + Recursive Case",
  subtitle: "Factorial, step by step",
  type: "lesson",
  xp: 30,
  prerequisites: [mentalModel.id],
  workspace: {
    title: "Base Case + Recursive Case",
    theory: [
      {
        heading: "A worked example",
        body: "factorial(n) = n × factorial(n - 1), with factorial(0) = 1 as the base case. Each call shrinks n by 1 until it hits the base case, then the multiplications unwind.",
      },
      {
        heading: "Missing base case = infinite recursion",
        body: "If the recursive case never reaches the base case (or there's no base case at all), the calls never stop — this is the recursive equivalent of an infinite loop.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def factorial(n):
    if n == 0:
        return 1
    return n * factorial(n - 1)`,
      },
      {
        language: "cpp",
        code: `int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}`,
      },
      {
        language: "java",
        code: `int factorial(int n) {
    if (n == 0) return 1;
    return n * factorial(n - 1);
}`,
      },
    ],
    quickCheck: {
      question: "What happens if factorial(n) is called without a base case?",
      options: ["It returns 0", "It runs once and stops", "The recursive calls never stop", "It automatically becomes a loop"],
      correctIndex: 2,
      explanation: "Without a base case to stop it, the function keeps calling itself with smaller n forever (in practice, until the call stack overflows).",
    },
  },
}

const callStack: Checkpoint = {
  id: "recursion-3",
  title: "Call Stack Visualization",
  subtitle: "What's actually happening in memory",
  type: "lesson",
  xp: 30,
  prerequisites: [baseAndRecursiveCase.id],
  workspace: {
    title: "Call Stack Visualization",
    theory: [
      {
        heading: "Each call is a stack frame",
        body: "Calling factorial(3) pushes a new frame for factorial(3), which calls factorial(2) (pushing another frame), which calls factorial(1), then factorial(0) — the base case.",
      },
      {
        heading: "Unwinding",
        body: "factorial(0) returns 1 to factorial(1), which computes 1×1 and returns to factorial(2), which computes 2×1, and so on — the multiplications happen on the way back out, not the way in.",
      },
      {
        heading: "Stack depth = space cost",
        body: "Each pending call sits on the stack until it returns — a recursive function that goes n levels deep uses O(n) extra space, even if it doesn't allocate anything itself.",
      },
    ],
    learnMore: "This is exactly why very deep recursion (tens of thousands of levels) can crash with a stack overflow, even when the logic is correct — the call stack itself is a finite resource.",
    callStackVisual: {
      frames: [
        { label: "factorial(3)", kind: "call" },
        { label: "factorial(2)", kind: "call" },
        { label: "factorial(1)", kind: "call" },
        { label: "factorial(0)", kind: "base-case", detail: "returns 1" },
        { label: "factorial(1)", kind: "return", detail: "1 × 1 = 1" },
        { label: "factorial(2)", kind: "return", detail: "2 × 1 = 2" },
        { label: "factorial(3)", kind: "return", detail: "3 × 2 = 6" },
      ],
    },
    quickCheck: {
      question: "For factorial(3), which call's result is computed first?",
      options: ["factorial(3)", "factorial(2)", "factorial(1)", "factorial(0) — the base case"],
      correctIndex: 3,
      explanation: "The base case is the first one to actually produce a value — every other call is waiting on the one below it before it can compute its own result.",
    },
  },
}

const codeLab: Checkpoint = {
  id: "recursion-4",
  title: "Recursive Code Lab",
  subtitle: "Sum of digits",
  type: "challenge",
  xp: 40,
  prerequisites: [callStack.id],
  workspace: {
    title: "Recursive Code Lab",
    theory: [
      {
        heading: "Your turn",
        body: "Peel off one digit at a time, add it to the recursive result for the rest of the number, and stop when there's nothing left.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def sumOfDigits(n):
    if n == 0:
        return 0
    return n % 10 + sumOfDigits(n // 10)`,
      },
    ],
    codingActivity: {
      prompt: "Implement sumOfDigits(n) that returns the sum of the digits of a non-negative integer n, using recursion.",
      constraints: ["0 ≤ n ≤ 10^9"],
      functionName: "sumOfDigits",
      requiredKeywords: ["sumofdigits"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def sumOfDigits(n):\n    # your code here\n    pass\n",
        cpp: "int sumOfDigits(int n) {\n    // your code here\n}\n",
        java: "int sumOfDigits(int n) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Multi-digit number", input: "n=1234", expected: "10" },
        { id: "v2", description: "Single digit", input: "n=7", expected: "7" },
        { id: "v3", description: "Number with a zero digit", input: "n=105", expected: "6" },
      ],
      hiddenTests: [
        { id: "h1", description: "Large number", input: "n=987654321", expected: "45" },
        { id: "h2", description: "All same digit", input: "n=1111", expected: "4" },
        { id: "h3", description: "n is zero", input: "n=0", expected: "0" },
      ],
      hint: "n % 10 gives the last digit; n // 10 (integer division) gives the rest of the number to recurse on.",
      mistakeFeedback: "This isn't actually calling itself with a smaller version of n — recursion needs the function to call itself again on a reduced input, not just compute the answer directly.",
    },
  },
  questionIds: ["q-recursion-fibonacci"],
}

const mastery: Checkpoint = {
  id: "recursion-5",
  title: "Recursion Challenge",
  subtitle: "Power function — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Recursion Challenge",
    theory: [
      {
        heading: "A classic recursive relation",
        body: "power(base, exp) = base × power(base, exp - 1), with power(base, 0) = 1 as the base case — the same shape as factorial, applied to a new problem.",
      },
    ],
    codingActivity: {
      prompt: "Implement power(base, exp) that computes base raised to a non-negative integer exponent, using recursion.",
      constraints: ["0 ≤ exp ≤ 20", "base is an integer"],
      functionName: "power",
      requiredKeywords: ["power"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def power(base, exp):\n    # your code here\n    pass\n",
        cpp: "long power(int base, int exp) {\n    // your code here\n}\n",
        java: "long power(int base, int exp) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Typical case", input: "base=2, exp=5", expected: "32" },
        { id: "v2", description: "Exponent of zero", input: "base=7, exp=0", expected: "1" },
        { id: "v3", description: "Base of one", input: "base=1, exp=10", expected: "1" },
      ],
      hiddenTests: [
        { id: "h1", description: "Negative base", input: "base=-2, exp=3", expected: "-8" },
        { id: "h2", description: "Larger exponent", input: "base=3, exp=4", expected: "81" },
        { id: "h3", description: "Both zero", input: "base=0, exp=0", expected: "1" },
      ],
      hint: "Multiply base by power(base, exp - 1), and stop recursing once exp reaches 0.",
      mistakeFeedback: "This looks like a fixed number of multiplications rather than a true recursive call that shrinks exp toward the base case each time — recheck the recursive call itself.",
    },
  },
}

export const recursionModule: Module = {
  id: "recursion",
  title: "Recursion",
  description: "Base cases, recursive cases, and the call stack that makes it all work.",
  icon: "💎",
  accentColor: "#A855F7",
  contentKind: "workspace",
  checkpoints: [mentalModel, baseAndRecursiveCase, callStack, codeLab, mastery],
}
