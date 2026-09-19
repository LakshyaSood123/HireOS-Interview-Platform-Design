// Abstraction over "run my code somewhere." This is a DETERMINISTIC MOCK —
// no `eval`, no execution of user source, no network call. It never claims
// to run real code; it only judges the submitted TEXT with a handful of
// keyword/shape heuristics (documented per-branch below) to make the Lesson
// Workspace's Run/Submit feel responsive instead of unconditionally
// succeeding the way the old ChallengeStage.tsx mock did.
//
// Swap path: a future `RemoteCodeRunner implements CodeRunner` (real
// sandboxed execution — see BACKEND_CAPABILITY_AND_GAP_AUDIT.md Target B)
// replaces `MockCodeRunner` behind this same interface; the Lesson Workspace
// UI that calls `run()`/`submit()` doesn't change.

import type { CodeLanguage, CodingActivityContent, TestCase } from "../types"

export interface TestOutcome {
  id: string
  description: string
  status: "passed" | "failed"
  input: string
  expected: string
  received: string
}

export interface CodeRunResult {
  /** "error" is a real (non-mock) compile/runtime/timeout failure — see
   * PistonCodeRunner. It is never produced by MockCodeRunner. */
  status: "empty" | "unchanged" | "completed" | "error"
  message?: string
  testsPassed: number
  totalTests: number
  runtimeMs: number
  tests: TestOutcome[]
}

export interface CodeRunRequest {
  code: string
  language: CodeLanguage
  activity: CodingActivityContent
  /** Checkpoint id (e.g. "foundations-4") — optional because MockCodeRunner
   * never needs it; PistonCodeRunner/RoutingCodeRunner use it to decide
   * whether a request is eligible for real execution. */
  activityId?: string
}

export interface CodeRunner {
  run(request: CodeRunRequest): Promise<CodeRunResult>
  submit(request: CodeRunRequest): Promise<CodeRunResult>
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function normalize(code: string): string {
  return code.replace(/\s+/g, " ").trim().toLowerCase()
}

/** Exported so PistonCodeRunner can reuse the exact same empty/unchanged
 * detection MockCodeRunner already uses, instead of re-deriving it. */
export function looksLikeStarter(code: string, activity: CodingActivityContent, language: CodeLanguage): boolean {
  return normalize(code) === normalize(activity.starterCode[language] ?? "")
}

function hasFunctionSignature(code: string, activity: CodingActivityContent): boolean {
  return code.toLowerCase().includes(activity.functionName.toLowerCase())
}

function keywordCoverage(code: string, activity: CodingActivityContent): number {
  if (activity.requiredKeywords.length === 0) return 1
  const lower = code.toLowerCase()
  const matched = activity.requiredKeywords.filter(kw => lower.includes(kw.toLowerCase())).length
  return matched / activity.requiredKeywords.length
}

/** Recursion / iteration signal: does the code call its own function name
 * again, or use an explicit loop/queue construct? Most of this module's
 * activities are naturally recursive, so this is a reasonable "did they
 * actually implement traversal logic, not just the signature" signal. */
function hasControlFlowSignal(code: string, activity: CodingActivityContent): boolean {
  const lower = code.toLowerCase()
  const selfCallCount = lower.split(activity.functionName.toLowerCase()).length - 1
  const hasLoop = /\bfor\b|\bwhile\b|\bqueue\b/.test(lower)
  return selfCallCount > 1 || hasLoop
}

/** Generic "did they guard against the empty/base case" signal — deliberately
 * NOT tied to a specific variable name (the original version only recognized
 * `root`-named guards, which broke as soon as a non-tree activity used
 * `nums`/`head`/etc.). Recognizes the common empty/null-check shapes across
 * Python/C++/Java without knowing the parameter name. */
function hasEmptyGuard(code: string): boolean {
  const lower = code.toLowerCase()
  return (
    /if\s*\(?\s*not\s+\w+/.test(lower) ||
    /\bis\s+none\b/.test(lower) ||
    /==\s*null\b/.test(lower) ||
    /==\s*nullptr\b/.test(lower) ||
    /!\s*\w+\s*[)\s:]/.test(lower) ||
    /len\(\s*\w+\s*\)\s*==\s*0/.test(lower) ||
    /\.empty\(\)/.test(lower) ||
    /\.size\(\)\s*==\s*0/.test(lower) ||
    /\.length\s*==\s*0/.test(lower)
  )
}

function buildOutcomes(tests: TestCase[], passed: boolean, receivedWhenPassing: (t: TestCase) => string, receivedWhenFailing: (t: TestCase) => string): TestOutcome[] {
  return tests.map(t => ({
    id: t.id,
    description: t.description,
    status: passed ? "passed" : "failed",
    input: t.input,
    expected: t.expected,
    received: passed ? receivedWhenPassing(t) : receivedWhenFailing(t),
  }))
}

/** Core heuristic shared by run() and submit() — decides, per test, whether
 * it "passes" based on: function name present, general keyword coverage,
 * control-flow signal, and (only relevant for the hidden "empty tree" case)
 * a null/empty guard. This is intentionally simple pattern matching, not
 * static analysis — documented so nobody mistakes it for real execution. */
function evaluate(code: string, activity: CodingActivityContent, tests: TestCase[]): TestOutcome[] {
  const hasFunction = hasFunctionSignature(code, activity)
  const coverage = keywordCoverage(code, activity)
  const hasFlow = hasControlFlowSignal(code, activity)
  const nullSafe = hasEmptyGuard(code)

  return tests.map(t => {
    const isEmptyCase = /empty/i.test(t.description)
    const passes = hasFunction && hasFlow && coverage >= 0.99 && (!isEmptyCase || nullSafe)

    return {
      id: t.id,
      description: t.description,
      status: passes ? "passed" : "failed",
      input: t.input,
      expected: t.expected,
      received: passes
        ? t.expected
        : !hasFunction
          ? "(no matching function found)"
          : isEmptyCase && !nullSafe
            ? "Error: cannot read property of undefined/null"
            : !hasFlow
              ? "(returned nothing — no traversal logic detected)"
              : "(incorrect output)",
    }
  })
}

export class MockCodeRunner implements CodeRunner {
  async run({ code, language, activity }: CodeRunRequest): Promise<CodeRunResult> {
    await delay(650)

    if (code.trim().length === 0) {
      return {
        status: "empty",
        message: "Write a solution before running.",
        testsPassed: 0,
        totalTests: activity.visibleTests.length,
        runtimeMs: 0,
        tests: [],
      }
    }

    if (looksLikeStarter(code, activity, language)) {
      return {
        status: "unchanged",
        message: "This still looks like the starter code — implement the function body before running.",
        testsPassed: 0,
        totalTests: activity.visibleTests.length,
        runtimeMs: 4,
        tests: buildOutcomes(activity.visibleTests, false, () => "", t => `(no output — ${t.description.toLowerCase()} never reached)`),
      }
    }

    const tests = evaluate(code, activity, activity.visibleTests)
    return {
      status: "completed",
      testsPassed: tests.filter(t => t.status === "passed").length,
      totalTests: tests.length,
      runtimeMs: 30 + Math.round(Math.random() * 40),
      tests,
    }
  }

  async submit({ code, language, activity }: CodeRunRequest): Promise<CodeRunResult> {
    await delay(900)

    if (code.trim().length === 0) {
      return {
        status: "empty",
        message: "Write a solution before submitting.",
        testsPassed: 0,
        totalTests: activity.hiddenTests.length,
        runtimeMs: 0,
        tests: [],
      }
    }

    if (looksLikeStarter(code, activity, language)) {
      return {
        status: "unchanged",
        message: "This still looks like the starter code — implement the function body before submitting.",
        testsPassed: 0,
        totalTests: activity.hiddenTests.length,
        runtimeMs: 4,
        tests: buildOutcomes(activity.hiddenTests, false, () => "", t => `(no output — ${t.description.toLowerCase()} never reached)`),
      }
    }

    // Submit runs against hidden tests, conceptually distinct from run()'s
    // visible tests (PART 12) — same evaluate() heuristic, different (and
    // typically harder, e.g. an empty-tree edge case) test set.
    const tests = evaluate(code, activity, activity.hiddenTests)
    return {
      status: "completed",
      testsPassed: tests.filter(t => t.status === "passed").length,
      totalTests: tests.length,
      runtimeMs: 40 + Math.round(Math.random() * 60),
      tests,
    }
  }
}
