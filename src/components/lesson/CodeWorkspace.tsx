import { useState } from "react"
import type { CodeLanguage, CodingActivityContent } from "../../learning/types"
import type { CodeRunner, CodeRunResult } from "../../learning/services/codeRunner"
import { DEVELOPMENT_MODE } from "../../config/developmentMode"

const LANGUAGE_LABEL: Record<CodeLanguage, string> = { python: "Python", cpp: "C++", java: "Java", javascript: "JavaScript" }

interface CodeWorkspaceProps {
  activity: CodingActivityContent
  /** Checkpoint id (e.g. "foundations-4") — passed through to the runner so
   * RoutingCodeRunner can decide whether this activity is real-execution-eligible.
   * Optional: omitting it simply means the request is never eligible. */
  activityId?: string
  runner: CodeRunner
  /** Submit failed (0 tests short of full pass) — caller decrements a life. */
  onFailedSubmit: () => void
  /** Submit passed every hidden test — caller may award XP / advance. */
  onSuccessfulSubmit: () => void
}

function ResultPanel({ result, label }: { result: CodeRunResult; label: string }) {
  if (result.status === "error") {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 text-xs text-red-200">
        <p className="font-bold mb-1.5">Execution Error</p>
        <pre className="whitespace-pre-wrap font-mono text-[11px] text-red-300 leading-relaxed">{result.message}</pre>
      </div>
    )
  }

  if (result.status !== "completed") {
    return (
      <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-200">
        <p className="font-bold mb-0.5">{result.status === "empty" ? "Validation Error" : "Incomplete Attempt"}</p>
        <p>{result.message}</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-black/30 border border-white/10 p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-bold text-white">
          {label}: {result.testsPassed} / {result.totalTests} Passed
        </span>
        <span className="text-[10px] text-gray-500 font-mono">{result.runtimeMs}ms</span>
      </div>
      <div className="space-y-1.5">
        {result.tests.map((t, i) => (
          <details key={t.id} className="group" open={t.status === "failed"}>
            <summary className="flex items-center gap-2 text-xs cursor-pointer list-none">
              <span className={t.status === "passed" ? "text-[#1DB584]" : "text-red-400"}>
                {t.status === "passed" ? "✓" : "✗"}
              </span>
              <span className={t.status === "passed" ? "text-gray-300" : "text-red-300"}>
                Test {i + 1}: {t.description}
              </span>
            </summary>
            {t.status === "failed" && (
              <div className="mt-1.5 ml-5 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="bg-black/40 rounded-lg p-2">
                  <span className="text-gray-500 block mb-0.5">Input</span>
                  <span className="text-gray-300">{t.input}</span>
                </div>
                <div className="bg-black/40 rounded-lg p-2">
                  <span className="text-gray-500 block mb-0.5">Expected</span>
                  <span className="text-emerald-300">{t.expected}</span>
                </div>
                <div className="bg-black/40 rounded-lg p-2">
                  <span className="text-gray-500 block mb-0.5">Received</span>
                  <span className="text-red-300">{t.received}</span>
                </div>
              </div>
            )}
          </details>
        ))}
      </div>
    </div>
  )
}

/** The generic "Try It Yourself" coding activity — language selector,
 * editable starter code, Reset/Hint/Run/Submit, structured results. Calls
 * `CodeRunner` (currently `MockCodeRunner`) rather than executing anything
 * itself, so swapping in a real judge later doesn't touch this component
 * (PART 9). Not Trees-specific — works off any `CodingActivityContent`. */
export default function CodeWorkspace({ activity, activityId, runner, onFailedSubmit, onSuccessfulSubmit }: CodeWorkspaceProps) {
  const [language, setLanguage] = useState<CodeLanguage>(activity.languages[0])
  const [codeByLanguage, setCodeByLanguage] = useState<Record<string, string>>(() => ({ ...activity.starterCode }))
  const [runResult, setRunResult] = useState<CodeRunResult | null>(null)
  const [submitResult, setSubmitResult] = useState<CodeRunResult | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showMistakeFeedback, setShowMistakeFeedback] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const code = codeByLanguage[language] ?? ""
  const setCode = (value: string) => setCodeByLanguage(prev => ({ ...prev, [language]: value }))

  const handleReset = () => {
    setCode(activity.starterCode[language] ?? "")
    setRunResult(null)
    setSubmitResult(null)
    setShowMistakeFeedback(false)
  }

  /** DEMO-ONLY (see DEVELOPMENT_MODE.DEMO_CODE_AUTOFILL_ENABLED) — drops a
   * canonical correct solution into the editor for the CURRENT language.
   * Deliberately does not Run, Submit, award XP, or complete the
   * checkpoint — the presenter drives those explicitly afterward, exactly
   * like a real learner would. */
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
    <div className="rounded-3xl bg-[#04100C] border border-[#1DB584]/40 overflow-hidden shadow-xl">
      <div className="px-5 py-3 bg-[#0A261B] border-b border-[#1DB584]/20">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-[#1DB584]">Try It Yourself</span>
          <div className="flex items-center gap-1">
            {activity.languages.map(lang => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors cursor-pointer ${
                  language === lang ? "bg-[#1DB584] text-white" : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {LANGUAGE_LABEL[lang]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-gray-200 mt-3 leading-relaxed">{activity.prompt}</p>
        {activity.constraints && (
          <ul className="mt-2 space-y-0.5">
            {activity.constraints.map((c, i) => (
              <li key={i} className="text-[11px] text-gray-400">&bull; {c}</li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4">
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          spellCheck={false}
          className="w-full min-h-[220px] bg-transparent text-emerald-300 font-mono text-sm leading-relaxed outline-none resize-y rounded-xl border border-white/10 p-3.5 focus:border-[#1DB584]/50"
        />
      </div>

      <div className="px-5 py-3.5 bg-[#0A261B] border-t border-[#1DB584]/20 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={() => setShowHint(v => !v)}
            className="px-3 py-2 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 transition-all cursor-pointer"
          >
            💡 Hint
          </button>
          {DEVELOPMENT_MODE.DEMO_CODE_AUTOFILL_ENABLED && activity.demoSolution?.[language] && (
            <button
              onClick={handleAutoFillDemo}
              title="Demo convenience only — never shown to real learners"
              className="px-3 py-2 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/10 hover:bg-purple-500/15 border border-purple-500/25 transition-all cursor-pointer"
            >
              ✨ Auto-fill Demo Answer
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRun}
            disabled={isRunning || isSubmitting}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 border border-white/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {isRunning ? "Running..." : "▶ Run"}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isRunning || isSubmitting || accepted}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? "Submitting..." : accepted ? "✓ Accepted" : "Submit"}
          </button>
        </div>
      </div>

      {showHint && (
        <div className="mx-5 mb-4 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 text-xs leading-relaxed">
          <p className="font-bold mb-1">Hint</p>
          <p>{activity.hint}</p>
        </div>
      )}

      {runResult && (
        <div className="mx-5 mb-4">
          <ResultPanel result={runResult} label="Visible Tests" />
        </div>
      )}

      {submitResult && (
        <div className="mx-5 mb-5 space-y-3">
          <ResultPanel result={submitResult} label="Submission" />
          {submitResult.status === "completed" && submitResult.testsPassed < submitResult.totalTests && (
            <>
              <button
                onClick={() => setShowMistakeFeedback(v => !v)}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300"
              >
                {showMistakeFeedback ? "Hide" : "Explain My Mistake"}
              </button>
              {showMistakeFeedback && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/25 text-red-200 text-xs leading-relaxed">
                  {activity.mistakeFeedback}
                </div>
              )}
            </>
          )}
          {accepted && (
            <div className="p-3.5 rounded-xl bg-[#1DB584]/15 border border-[#1DB584]/40 text-emerald-200 text-xs font-bold">
              🎉 {submitResult.testsPassed} / {submitResult.totalTests} Passed — Accepted!
            </div>
          )}
        </div>
      )}
    </div>
  )
}
