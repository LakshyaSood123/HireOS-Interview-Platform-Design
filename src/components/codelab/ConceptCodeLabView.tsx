import { useEffect, useRef, useState } from "react"
import {
  LAB_LANGUAGES,
  LAB_LANGUAGE_LABELS,
  type ConceptCodeLab,
  type LabLanguage,
} from "../../learning/codeLab/conceptCodeLabs"
import { LAB_RUN_TIMEOUT_SECONDS, runLabCode, type LabRunResult } from "../../learning/codeLab/labRunner"
import LessonCampBackdrop from "../lesson/camp/LessonCampBackdrop"

interface ConceptCodeLabViewProps {
  lab: ConceptCodeLab
  initialLanguage: LabLanguage
  onBack: () => void
}

type RunState = { phase: "ready" } | { phase: "running" } | { phase: "done"; result: LabRunResult }

const BACK_PILL =
  "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 hover:text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A]"
const RUN_BTN =
  "px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A]"
const GHOST_BTN =
  "px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A]"

/** Focused Concept Code Lab page. Everything here is temporary React state:
 * no progress, XP, quiz or backend effect, and nothing is written anywhere. */
export default function ConceptCodeLabView({ lab, initialLanguage, onBack }: ConceptCodeLabViewProps) {
  const [language, setLanguage] = useState<LabLanguage>(initialLanguage)
  // Per-language drafts: switching language never throws an edit away.
  const [drafts, setDrafts] = useState<Record<LabLanguage, string>>({ ...lab.starters })
  const [runState, setRunState] = useState<RunState>({ phase: "ready" })
  const runToken = useRef(0)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const escapedTab = useRef(false)

  useEffect(() => {
    headingRef.current?.focus()
    window.scrollTo({ top: 0 })
  }, [])

  const code = drafts[language]
  const edited = code !== lab.starters[language]
  const lineCount = code.split("\n").length
  const running = runState.phase === "running"

  const selectLanguage = (next: LabLanguage) => {
    if (next === language) return
    runToken.current += 1 // an in-flight run belongs to the old language
    setRunState({ phase: "ready" })
    setLanguage(next)
  }

  const reset = () => {
    if (edited && !window.confirm(`Restore the original ${LAB_LANGUAGE_LABELS[language]} code? Your edits will be lost.`)) return
    runToken.current += 1
    setDrafts(prev => ({ ...prev, [language]: lab.starters[language] }))
    setRunState({ phase: "ready" })
  }

  const run = async () => {
    if (running) return
    const token = ++runToken.current
    setRunState({ phase: "running" })
    const result = await runLabCode(language, code)
    if (token === runToken.current) setRunState({ phase: "done", result })
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      escapedTab.current = true // next Tab leaves the editor
      return
    }
    if (event.key === "Tab" && !event.shiftKey && !escapedTab.current) {
      event.preventDefault()
      const target = event.currentTarget
      const { selectionStart, selectionEnd, value } = target
      const next = value.slice(0, selectionStart) + "    " + value.slice(selectionEnd)
      setDrafts(prev => ({ ...prev, [language]: next }))
      window.requestAnimationFrame(() => target.setSelectionRange(selectionStart + 4, selectionStart + 4))
      return
    }
    escapedTab.current = false
  }

  return (
    <div className="relative min-h-screen bg-[#071A14] font-display text-white overflow-x-hidden">
      <LessonCampBackdrop moduleTitle={lab.moduleTitle} />
      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col min-h-screen">
        <header className="flex items-center justify-between gap-3 mb-5">
          <button type="button" onClick={onBack} className={BACK_PILL}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5" aria-hidden="true">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Lesson
          </button>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#E2B44A]">Concept Code Lab</span>
        </header>

        {/* ── Concept ── */}
        <section aria-labelledby="code-lab-title" className="rounded-3xl bg-white/[0.04] border border-white/10 p-5 sm:p-6 mb-5">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#A7CE65]">
            {lab.moduleTitle} <span className="text-gray-500">·</span> {lab.lessonTitle}
          </p>
          <h1 id="code-lab-title" ref={headingRef} tabIndex={-1} className="mt-1 text-2xl sm:text-3xl font-black tracking-tight focus:outline-none">
            {lab.title}
          </h1>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <ConceptBlock label="What are we doing?">{lab.summary}</ConceptBlock>
            <ConceptBlock label="Why does it matter?">{lab.whyItMatters}</ConceptBlock>
            <ConceptBlock label="In this lesson">{lab.lessonContext}</ConceptBlock>
            <div className="min-w-0">
              <h2 className="text-[11px] font-black uppercase tracking-wider text-[#E2B44A]">Example</h2>
              <div className="mt-1.5 rounded-xl bg-black/30 border border-white/10 p-3 font-mono text-[12px] leading-relaxed text-gray-100 break-words">
                <p>{lab.example.input}</p>
                <p className="text-gray-400">→ {lab.example.result}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Editor + output ── */}
        <section aria-label="Code Lab" className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] flex-1 min-h-0">
          <div className="rounded-2xl bg-[#04100C] border border-[#1DB584]/35 shadow-2xl overflow-hidden flex flex-col min-w-0">
            <div className="px-4 py-2.5 bg-[#09261B] border-b border-[#1DB584]/20 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-black uppercase tracking-wider text-[#1DB584]">Code Lab</span>
                <label className="flex items-center gap-2 text-[11px] font-bold text-gray-300">
                  Language
                  <select
                    value={language}
                    onChange={event => selectLanguage(event.target.value as LabLanguage)}
                    aria-label="Code Lab language"
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-xs font-bold text-white cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A]"
                  >
                    {LAB_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>
                        {LAB_LANGUAGE_LABELS[lang]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={reset} disabled={running} className={GHOST_BTN}>
                  Reset Code
                </button>
                <button type="button" onClick={run} disabled={running} className={RUN_BTN}>
                  {running ? "Running..." : "▶ Run"}
                </button>
              </div>
            </div>

            <div className="flex bg-[#030E0A] min-w-0 h-[380px] lg:h-[440px]">
              <div
                ref={gutterRef}
                aria-hidden="true"
                className="shrink-0 overflow-hidden py-4 pl-3 pr-2 text-right font-mono text-sm leading-relaxed text-gray-600 select-none border-r border-white/5"
              >
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i}>{i + 1}</div>
                ))}
              </div>
              <textarea
                value={code}
                onChange={event => setDrafts(prev => ({ ...prev, [language]: event.target.value }))}
                onKeyDown={onKeyDown}
                onScroll={event => {
                  if (gutterRef.current) gutterRef.current.scrollTop = event.currentTarget.scrollTop
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                wrap="off"
                aria-label={`${LAB_LANGUAGE_LABELS[language]} source code. Press Escape, then Tab, to leave the editor.`}
                className="flex-1 min-w-0 h-full resize-none bg-transparent p-4 font-mono text-sm leading-relaxed text-emerald-300 outline-none whitespace-pre overflow-auto focus:ring-1 focus:ring-inset focus:ring-[#1DB584]/40"
              />
            </div>

            <div className="px-4 py-2 bg-[#09261B] border-t border-[#1DB584]/20 text-[11px] text-gray-400 font-mono flex flex-wrap gap-x-3">
              <span>{LAB_LANGUAGE_LABELS[language]}</span>
              <span>{lineCount} lines</span>
              {edited && <span className="text-[#E2B44A]">edited</span>}
              <span className="hidden sm:inline text-gray-500">You can change anything. Esc then Tab leaves the editor.</span>
            </div>
          </div>

          <OutputPanel runState={runState} language={language} />
        </section>

        {lab.tryThis.length > 0 && (
          <section aria-label="Things to try" className="mt-5 rounded-2xl bg-white/[0.03] border border-white/10 p-4">
            <h2 className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65]">Try this</h2>
            <ul className="mt-2 grid gap-1.5 text-sm text-gray-300 list-disc pl-5 md:grid-cols-3 md:gap-x-6">
              {lab.tryThis.map(item => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}

function ConceptBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 className="text-[11px] font-black uppercase tracking-wider text-[#E2B44A]">{label}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-200">{children}</p>
    </div>
  )
}

function OutputPanel({ runState, language }: { runState: RunState; language: LabLanguage }) {
  let heading = "Output"
  let tone = "text-gray-400"
  let body: React.ReactNode = <p className="text-sm text-gray-400">Run the code to see its output.</p>

  if (runState.phase === "running") {
    body = (
      <p className="text-sm text-gray-300">
        Running...
        {language === "cpp" && <span className="block mt-1 text-xs text-gray-500">C++ compiles can take several seconds.</span>}
      </p>
    )
  } else if (runState.phase === "done") {
    const { result } = runState
    switch (result.status) {
      case "ok":
        heading = "Output"
        tone = "text-[#4FD8A8]"
        body =
          result.stdout.trim() === "" && result.stderr.trim() === "" ? (
            <p className="text-sm text-gray-400">Program finished without output.</p>
          ) : (
            <>
              {result.stdout !== "" && <Pre text={result.stdout} />}
              {result.stderr.trim() !== "" && <Pre text={result.stderr} tone="warn" />}
            </>
          )
        break
      case "compile_error":
        heading = "Compile error"
        tone = "text-amber-200"
        body = <Pre text={result.stderr || "The program did not compile."} tone="warn" />
        break
      case "runtime_error":
        heading = /SyntaxError|IndentationError|TabError/.test(result.stderr) ? "Syntax error" : "Runtime error"
        tone = "text-amber-200"
        body = (
          <>
            {result.stdout !== "" && <Pre text={result.stdout} />}
            <Pre text={result.stderr || "The program stopped with an error."} tone="warn" />
          </>
        )
        break
      case "timeout":
        heading = "Timed out"
        tone = "text-amber-200"
        body = (
          <>
            {result.stdout !== "" && <Pre text={result.stdout} />}
            <p className="text-sm text-amber-100">
              The program ran for more than {LAB_RUN_TIMEOUT_SECONDS} seconds and was stopped. Check that every loop has a way to finish.
            </p>
          </>
        )
        break
      case "empty_source":
        heading = "Nothing to run"
        tone = "text-amber-200"
        body = <p className="text-sm text-gray-300">The editor is empty. Add some code, or use Reset Code to bring back the original.</p>
        break
      case "too_large":
        heading = "Code is too long"
        tone = "text-amber-200"
        body = <p className="text-sm text-gray-300">The Code Lab runs programs up to 20 KB. Shorten the code and run it again.</p>
        break
      case "unsupported":
        heading = "Can't run this"
        tone = "text-amber-200"
        body = <p className="text-sm text-gray-300">The Code Lab could not accept that request. Pick Python, C++ or Java and try again.</p>
        break
      case "unavailable":
        heading = "Code runner unavailable"
        tone = "text-amber-200"
        body = (
          <p className="text-sm text-gray-300">
            The code runner isn't reachable right now, so nothing was run. Your code is still here. Try again in a moment.
          </p>
        )
        break
    }
  }

  return (
    <div className="rounded-2xl bg-[#082017]/95 border border-[#1DB584]/25 shadow-xl flex flex-col min-w-0 min-h-[220px] lg:min-h-0">
      <div className="px-4 py-2.5 bg-[#09261B] border-b border-[#1DB584]/20 rounded-t-2xl flex items-center justify-between gap-3">
        <h2 className={`text-xs font-black uppercase tracking-wider ${tone}`}>{heading}</h2>
        {runState.phase === "done" && runState.result.runtimeMs !== undefined && (
          <span className="text-[11px] font-mono text-gray-500">{(runState.result.runtimeMs / 1000).toFixed(1)}s</span>
        )}
      </div>
      <div role="status" aria-live="polite" className="flex-1 min-w-0 p-4 space-y-3 overflow-auto max-h-[440px] lg:max-h-[520px]">
        {body}
      </div>
    </div>
  )
}

function Pre({ text, tone = "out" }: { text: string; tone?: "out" | "warn" }) {
  return (
    <pre
      className={`whitespace-pre-wrap break-words overflow-x-auto rounded-lg bg-black/40 border border-white/10 p-3 font-mono text-[12px] leading-relaxed ${
        tone === "warn" ? "text-amber-100" : "text-gray-100"
      }`}
    >
      {text}
    </pre>
  )
}
