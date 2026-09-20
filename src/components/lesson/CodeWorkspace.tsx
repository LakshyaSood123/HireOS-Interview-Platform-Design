import { useState } from "react"
import type { CodeLanguage, CodingActivityContent, TheoryBlock } from "../../learning/types"
import type { CodeRunner, CodeRunResult } from "../../learning/services/codeRunner"
import { DEVELOPMENT_MODE } from "../../config/developmentMode"

const LANGUAGE_LABEL: Record<CodeLanguage, string> = {
  python: "Python",
  cpp: "C++",
  java: "Java",
  javascript: "JavaScript",
}

interface CodeWorkspaceProps {
  activity: CodingActivityContent
  /** Checkpoint id (e.g. "foundations-4") — passed through to the runner so
   * RoutingCodeRunner can decide whether this activity is real-execution-eligible.
   * Optional: omitting it simply means the request is never eligible. */
  activityId?: string
  theory?: TheoryBlock[]
  learnMore?: string
  runner: CodeRunner
  /** Submit failed (0 tests short of full pass) — caller decrements a life. */
  onFailedSubmit: () => void
  /** Submit passed every hidden test — caller may award XP / advance. */
  onSuccessfulSubmit: () => void
}

function ResultPanel({ result, label }: { result: CodeRunResult; label: string }) {
  if (result.status === "error") {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-xs text-red-200 min-w-0 w-full max-w-full box-border">
        <div className="flex items-center gap-1.5 font-bold mb-1.5 text-red-300">
          <span>⚠️</span>
          <span>Execution Error</span>
        </div>
        <pre className="whitespace-pre font-mono text-[11px] text-red-200/90 leading-relaxed max-h-48 overflow-x-auto overflow-y-auto min-w-0 max-w-full p-2.5 bg-black/40 rounded-lg">
          {result.message}
        </pre>
      </div>
    )
  }

  if (result.status !== "completed") {
    return (
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-200 min-w-0 w-full max-w-full box-border">
        <p className="font-bold mb-1 flex items-center gap-1.5 text-amber-300">
          <span>ℹ️</span>
          <span>{result.status === "empty" ? "Validation Error" : "Incomplete Attempt"}</span>
        </p>
        <p className="leading-relaxed text-amber-200/90 break-words">{result.message}</p>
      </div>
    )
  }

  const allPassed = result.testsPassed === result.totalTests

  return (
    <div className="rounded-xl bg-[#03110C] border border-[#1DB584]/25 p-4 shadow-inner min-w-0 w-full max-w-full box-border">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${allPassed ? "bg-[#1DB584] animate-pulse" : "bg-amber-400"}`}
          />
          <span className="text-xs font-bold text-white tracking-wide truncate">
            {label}: {result.testsPassed} / {result.totalTests} Passed
          </span>
        </div>
        <span className="text-[10px] text-emerald-300/70 font-mono bg-black/40 px-2 py-0.5 rounded border border-white/5 shrink-0">
          {result.runtimeMs}ms
        </span>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto pr-1 min-w-0">
        {result.tests.map((t, i) => (
          <details
            key={t.id}
            className="group rounded-lg bg-black/30 border border-white/5 p-2 transition-all min-w-0"
            open={t.status === "failed"}
          >
            <summary className="flex items-center gap-2 text-xs cursor-pointer list-none select-none min-w-0">
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                  t.status === "passed" ? "bg-[#1DB584]/20 text-[#1DB584]" : "bg-red-500/20 text-red-400"
                }`}
              >
                {t.status === "passed" ? "✓" : "✗"}
              </span>
              <span className={`font-medium min-w-0 break-words ${t.status === "passed" ? "text-gray-300" : "text-red-300"}`}>
                Test {i + 1}: {t.description}
              </span>
            </summary>
            {t.status === "failed" && (
              <div className="mt-2.5 pt-2 border-t border-white/10 grid grid-cols-1 gap-2 text-[11px] font-mono min-w-0">
                <div className="bg-black/50 rounded-md p-2 min-w-0 overflow-x-auto">
                  <span className="text-gray-500 block text-[9px] uppercase tracking-wider mb-0.5">Input</span>
                  <span className="text-gray-300 break-words whitespace-pre-wrap">{t.input}</span>
                </div>
                <div className="bg-black/50 rounded-md p-2 min-w-0 overflow-x-auto">
                  <span className="text-emerald-400 block text-[9px] uppercase tracking-wider mb-0.5">Expected</span>
                  <span className="text-emerald-300 break-words whitespace-pre-wrap">{t.expected}</span>
                </div>
                <div className="bg-black/50 rounded-md p-2 min-w-0 overflow-x-auto">
                  <span className="text-red-400 block text-[9px] uppercase tracking-wider mb-0.5">Received</span>
                  <span className="text-red-300 break-words whitespace-pre-wrap">{t.received}</span>
                </div>
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}

/**
 * Desktop-First Coding Workstation:
 * - LEFT: Problem Statement, Theory & Constraints
 * - CENTER: Code Editor (Hero workstation) with language selector & action controls
 * - RIGHT: Live Test Results, Execution Benchmarks & Mistake Feedback
 *
 * Preserves 100% of Piston / MockCodeRunner execution logic, test feedback,
 * and progression hooks without any functional regressions.
 */
export default function CodeWorkspace({
  activity,
  activityId,
  theory,
  learnMore,
  runner,
  onFailedSubmit,
  onSuccessfulSubmit,
}: CodeWorkspaceProps) {
  const [language, setLanguage] = useState<CodeLanguage>(activity.languages[0])
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(() => ({ ...activity.starterCode }))
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [submitResult, setSubmitResult] = useState<CodeRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showMistakeFeedback, setShowMistakeFeedback] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [learnMoreOpen, setLearnMoreOpen] = useState(false)

  const code = codeByLanguage[language] ?? ""
  const setCode = (value: string) => setCodeByLanguage(prev => ({ ...prev, [language]: value }))

  const handleReset = () => {
    setCode(activity.starterCode[language] ?? "")
    setRunResult(null)
    setSubmitResult(null)
    setShowMistakeFeedback(false)
    setAccepted(false)
  }

  /** DEMO-ONLY — drops a canonical correct solution into the editor */
  const handleAutoFillDemo = () => {
    const solution = activity.demoSolution?.[language]
    if (!solution) return
    setCode(solution)
    setRunResult(null)
    setSubmitResult(null)
    setShowMistakeFeedback(false)
    setAccepted(false)
  }

  const handleRun = async () => {
    setIsRunning(true)
    setSubmitResult(null)
    const result = await runner.run({ code, language, activity, activityId })
    setRunResult(result)
    setIsRunning(false)
    if (result.status === "completed" && result.testsPassed < result.totalTests) {
      setShowMistakeFeedback(false)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    const result = await runner.submit({ code, language, activity, activityId })
    setSubmitResult(result)
    setIsSubmitting(false)

    const passed = result.status === "completed" && result.testsPassed === result.totalTests
    if (passed) {
      setAccepted(true)
      onSuccessfulSubmit()
    } else {
      onFailedSubmit()
    }
  }

  return (
    <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] xl:grid-cols-[minmax(280px,0.85fr)_minmax(0,1.5fr)_minmax(280px,0.95fr)] gap-5 items-start box-border min-w-0">
      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 1: LEARN & UNDERSTAND (PROBLEM, CONSTRAINTS, THEORY, HINT)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 min-w-0 w-full max-w-full">
        {/* Problem Statement Card */}
        <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-5 shadow-xl min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2 h-2 rounded-full bg-[#1DB584]" />
            <span className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65]">
              Problem Task
            </span>
          </div>
          <p className="text-sm text-gray-200 leading-relaxed font-normal break-words">{activity.prompt}</p>

          {activity.constraints && activity.constraints.length > 0 && (
            <div className="mt-4 pt-3.5 border-t border-white/10">
              <span className="text-[10.5px] font-black uppercase tracking-wider text-gray-400 block mb-1.5">
                Constraints
              </span>
              <ul className="space-y-1">
                {activity.constraints.map((c, i) => (
                  <li key={i} className="text-xs text-gray-300 font-mono flex items-start gap-1.5 min-w-0">
                    <span className="text-[#1DB584] mt-0.5 shrink-0">•</span>
                    <span className="break-words min-w-0">{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Supporting Theory Blocks (if provided) */}
        {theory && theory.length > 0 && (
          <div className="space-y-3 min-w-0">
            {theory.map((block, i) => (
              <div
                key={i}
                className="rounded-2xl bg-[#082017]/90 backdrop-blur-md border border-white/10 p-4.5 shadow-lg min-w-0"
              >
                <h3 className="text-xs font-bold text-[#A7CE65] mb-1.5 flex items-center gap-1.5">
                  <span>📖</span>
                  <span>{block.heading}</span>
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed break-words">{block.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Learn More Expandable Card */}
        {learnMore && (
          <div className="rounded-2xl bg-[#082017]/90 border border-white/10 p-4 min-w-0">
            <button
              onClick={() => setLearnMoreOpen(v => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#1DB584] hover:text-[#4FD8A8] transition-colors cursor-pointer"
            >
              <span>{learnMoreOpen ? "Hide Advanced Details" : "Learn More Details ›"}</span>
              <span className="text-sm leading-none">{learnMoreOpen ? "▲" : "▼"}</span>
            </button>
            {learnMoreOpen && (
              <p className="mt-2.5 pt-2.5 border-t border-white/10 text-xs text-gray-400 leading-relaxed break-words">
                {learnMore}
              </p>
            )}
          </div>
        )}

        {/* Hint Card */}
        {activity.hint && (
          <div className="rounded-2xl bg-[#082017]/90 border border-amber-500/20 p-4 min-w-0">
            <button
              onClick={() => setShowHint(v => !v)}
              className="w-full flex items-center justify-between text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <span>💡</span>
                <span>Need a Hint?</span>
              </span>
              <span className="text-xs">{showHint ? "Hide" : "Reveal"}</span>
            </button>
            {showHint && (
              <p className="mt-2.5 pt-2.5 border-t border-amber-500/20 text-xs text-amber-200/90 leading-relaxed break-words">
                {activity.hint}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 2: ACTIVE CODE EDITOR WORKSTATION (HERO AREA)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl bg-[#04100C] border border-[#1DB584]/35 shadow-2xl overflow-hidden flex flex-col min-h-[540px] lg:min-h-[580px] min-w-0 w-full max-w-full box-border">
        {/* Editor Top Bar: Language tabs & Utilities */}
        <div className="px-4 py-2.5 bg-[#09261B] border-b border-[#1DB584]/20 flex items-center justify-between gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black uppercase tracking-wider text-[#1DB584] mr-2 hidden sm:inline shrink-0">
              Workstation
            </span>
            <div className="flex items-center bg-black/40 rounded-lg p-0.5 border border-white/10 overflow-x-auto max-w-full">
              {activity.languages.map(lang => (
                <button
                  key={lang}
                  onClick={() => setLanguage(lang)}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    language === lang
                      ? "bg-[#1DB584] text-white shadow-xs"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {LANGUAGE_LABEL[lang]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              title="Reset starter code"
            >
              Reset
            </button>
            {DEVELOPMENT_MODE.DEMO_CODE_AUTOFILL_ENABLED && activity.demoSolution?.[language] && (
              <button
                onClick={handleAutoFillDemo}
                title="Demo convenience only — drops canonical solution into editor"
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all cursor-pointer flex items-center gap-1"
              >
                <span>✨</span>
                <span className="hidden sm:inline">Auto-fill Demo</span>
              </button>
            )}
          </div>
        </div>

        {/* Code Editor Area */}
        <div className="flex-1 p-4 bg-[#030E0A] relative flex flex-col min-w-0 overflow-hidden">
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 min-h-[380px] lg:min-h-[440px] bg-transparent text-emerald-300 font-mono text-sm leading-relaxed outline-none resize-none p-2 focus:ring-1 focus:ring-[#1DB584]/40 rounded-lg min-w-0 whitespace-pre overflow-x-auto"
            placeholder="Write your solution here..."
          />
        </div>

        {/* Editor Bottom Bar: Run & Submit Actions */}
        <div className="px-4 py-3 bg-[#09261B] border-t border-[#1DB584]/20 flex items-center justify-between gap-3 flex-wrap min-w-0">
          <div className="text-[11px] text-gray-400 font-mono hidden sm:block truncate">
            <span>{LANGUAGE_LABEL[language]}</span>
            <span className="mx-2">•</span>
            <span>{code.split("\n").length} lines</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <span>{isRunning ? "Evaluating..." : "▶ Run Visible Tests"}</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={isRunning || isSubmitting || accepted}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 transition-all cursor-pointer disabled:opacity-60 flex items-center gap-1.5 shrink-0"
            >
              <span>{isSubmitting ? "Submitting..." : accepted ? "✓ Accepted" : "Submit Solution"}</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          COLUMN 3: SUPPORT & TEST RESULTS (OUTPUT, CRITIQUE, PASS/FAIL)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="space-y-4 min-w-0 w-full max-w-full lg:col-span-2 xl:col-span-1">
        {/* Results Header Card */}
        <div className="rounded-2xl bg-[#082017]/95 backdrop-blur-md border border-[#1DB584]/25 p-5 shadow-xl min-w-0">
          <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-base">🧪</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Test Results &amp; Feedback
              </h4>
            </div>
            {accepted && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#1DB584]/20 text-[#1DB584] border border-[#1DB584]/40">
                Passed
              </span>
            )}
          </div>

          {/* If neither run nor submit has happened yet */}
          {!runResult && !submitResult && (
            <div className="py-4 text-center">
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-lg mx-auto mb-2.5 text-gray-400">
                ⚡
              </div>
              <p className="text-xs font-bold text-gray-300">No Execution Yet</p>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Click <span className="text-white font-bold">▶ Run Visible Tests</span> to test against sample cases, or <span className="text-white font-bold">Submit Solution</span> when ready.
              </p>

              {/* Preview of visible test cases */}
              {activity.visibleTests && activity.visibleTests.length > 0 && (
                <div className="mt-4 pt-3 border-t border-white/10 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                    Visible Test Cases ({activity.visibleTests.length})
                  </span>
                  <div className="space-y-1.5">
                    {activity.visibleTests.slice(0, 3).map((test, i) => (
                      <div
                        key={test.id}
                        className="rounded-lg bg-black/30 border border-white/5 p-2 text-[11px] font-mono text-gray-300 flex items-center justify-between"
                      >
                        <span className="truncate max-w-[140px] text-gray-400">
                          {i + 1}. {test.description}
                        </span>
                        <span className="text-emerald-400/80 font-bold shrink-0">{test.expected}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Visible Tests Run Result */}
          {runResult && (
            <div className="space-y-3">
              <ResultPanel result={runResult} label="Visible Tests" />
            </div>
          )}

          {/* Submission Result */}
          {submitResult && (
            <div className="space-y-3">
              <ResultPanel result={submitResult} label="Submission" />

              {/* Explain My Mistake Button & Card */}
              {submitResult.status === "completed" && submitResult.testsPassed < submitResult.totalTests && activity.mistakeFeedback && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowMistakeFeedback(v => !v)}
                    className="w-full py-2 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>🧭</span>
                    <span>{showMistakeFeedback ? "Hide Analysis" : "Explain My Mistake"}</span>
                  </button>
                  {showMistakeFeedback && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
                      <p className="font-bold mb-1 text-amber-300">Diagnostic Insight</p>
                      <p>{activity.mistakeFeedback}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Accepted Card */}
              {accepted && (
                <div className="p-4 rounded-xl bg-gradient-to-br from-[#1DB584]/20 to-[#10B981]/10 border border-[#1DB584]/40 text-emerald-200 text-xs shadow-lg">
                  <div className="flex items-center gap-2 font-black text-sm text-white mb-1">
                    <span>🎉</span>
                    <span>All Tests Passed!</span>
                  </div>
                  <p className="text-emerald-200/90 leading-relaxed">
                    Great work! Your solution meets all constraints and passed all test cases.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
