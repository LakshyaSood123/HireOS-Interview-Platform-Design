import type { AlgorithmAnimationId } from "../../learning/types"
import {
  TRACE_LANGUAGES,
  TRACE_LANGUAGE_LABELS,
  type AlgorithmCodeTrace,
  type CodeTraceVariableChange,
  type TraceLanguage,
  type TraceStatusTone,
} from "../../learning/animations/codeTraceTypes"
import {
  effectiveTraceLanguage,
  getTraceVariants,
  resolveTraceLines,
  tallestTraceListing,
} from "../../learning/animations/codeTraceVariants"
import { useTraceLanguage } from "../../learning/traceLanguagePreference"
import type { TraceExperimentPanelProps } from "../../learning/experiments/useTraceExperiment"
import { getConceptCodeLab, type LabLanguage } from "../../learning/codeLab/conceptCodeLabs"
import { useCodeLabLauncher } from "../codelab/CodeLabContext"

interface CodeTracePanelProps {
  trace: AlgorithmCodeTrace
  /** The SAME step index the paired animation is currently on — this panel
   * never owns or advances its own step. See AnimationPlayback.tsx /
   * ArrayTraversalVisual.tsx, the only two callers. */
  currentStep: number
  /** Animation id, used only to look up optional Python/C++/Java views.
   * Omit it and the panel is pseudocode-only. */
  traceId?: AlgorithmAnimationId
  /** Experiment Mode wiring, from `useTraceExperiment()`. Omit it (or leave
   * `experiment.supported` false) and no Experiment button renders at all —
   * this panel stays exactly as it was before Experiment Mode existed. */
  experiment?: TraceExperimentPanelProps
}

const STATUS_TONE_CLASSES: Record<TraceStatusTone, string> = {
  neutral: "border-white/15 bg-white/5 text-gray-300",
  valid: "border-[#1DB584]/40 bg-[#1DB584]/15 text-[#4FD8A8]",
  invalid: "border-red-500/30 bg-red-500/10 text-red-300",
  warning: "border-amber-500/30 bg-amber-500/10 text-amber-200",
}

const CHANGE_STATUS_CLASSES: Record<NonNullable<CodeTraceVariableChange["status"]>, string> = {
  changed: "text-amber-300",
  valid: "text-[#4FD8A8]",
  invalid: "text-red-300",
  info: "text-gray-300",
}

/** Read-only "what's the code doing right now" companion to an algorithm
 * animation — DISPLAY ONLY. Never calls completeCheckpointById, never
 * touches progress/XP/lives, never runs or submits code, and owns no
 * playback state of its own: `currentStep` is handed in by the caller,
 * which is the SAME index driving the animation's own visual, so the two
 * surfaces can never desynchronize (see codeTraceTypes.ts). One generic
 * component renders all 29 approved traces — no per-module variants. */
export default function CodeTracePanel({ trace, currentStep, traceId, experiment }: CodeTracePanelProps) {
  const [preferred, setPreferred] = useTraceLanguage()
  const openCodeLab = useCodeLabLauncher()
  const state = trace.states[currentStep] ?? trace.states[0]
  if (!state) return null

  // Language is DISPLAY ONLY: `currentStep` and the state above are untouched
  // by it. Only which listing is shown, and which of its lines light up for
  // the current semantic step, depends on the language.
  const variants = getTraceVariants(traceId)
  const language = effectiveTraceLanguage(preferred, variants)
  const lines = resolveTraceLines(trace, state, language, variants)
  const spacerLines = tallestTraceListing(trace, variants)

  const editing = experiment?.supported && experiment.mode === "editing"
  const running = experiment?.supported && experiment.mode === "running"

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-4 w-full max-w-full min-w-0 box-border">
      <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65] shrink-0">Code Trace</p>
          {experiment?.supported && <ExperimentToggle mode={experiment.mode} onStart={experiment.startEditing} />}
          {openCodeLab && traceId && getConceptCodeLab(traceId) && (
            <button
              type="button"
              onClick={() => openCodeLab({ animationId: traceId, language: labLanguageFor(language) })}
              className="shrink-0 rounded-full border border-[#E2B44A]/40 bg-[#E2B44A]/10 px-2.5 py-1 text-[10px] font-bold text-[#F3D98B] hover:bg-[#E2B44A]/20 cursor-pointer transition-colors"
            >
              &lt;/&gt; Code Lab
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 min-w-0">
          {variants && <LanguageSelect value={language} onChange={setPreferred} />}
          {running && (
            <span className="shrink-0 rounded-full border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200">
              Custom Run
            </span>
          )}
          <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-gray-300">
            Step {currentStep + 1} / {trace.states.length}
          </span>
        </div>
      </div>

      {editing && experiment ? (
        <ExperimentEditor experiment={experiment} />
      ) : (
        /* Pseudocode line viewer: strict 3-column grid (line-number | minmax(0, code) | status) */
        <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[12px] leading-relaxed w-full min-w-0">
          <div className="grid w-full min-w-0">
            <div className="col-start-1 row-start-1 space-y-0.5 w-full min-w-0">
              {lines.map(line => (
                <div
                  key={line.displayNumber}
                  className={`grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1 min-w-0 w-full transition-colors ${
                    line.active
                      ? "border-l-2 border-[#1DB584] bg-[#1DB584]/20"
                      : line.executed
                        ? "border-l-2 border-white/20 bg-white/5"
                        : "border-l-2 border-transparent"
                  }`}
                >
                  {/* 1. Line number column */}
                  <span className="shrink-0 text-right text-gray-500 select-none text-[11px]">{line.displayNumber}</span>

                  {/* 2. Code column: shrink-safe with internal horizontal scroll for long lines */}
                  <div className="min-w-0 overflow-x-auto overflow-y-hidden py-0.5">
                    <span
                      className={`whitespace-pre font-mono text-[11.5px] block ${
                        line.active ? "font-bold text-white" : line.executed ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {line.text || " "}
                    </span>
                  </div>

                  {/* 3. Status badge column: fixed min-width, never pushed off-screen */}
                  <div className="shrink-0 text-right min-w-[72px] pl-1">
                    {line.active && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-[#1DB584]/30 text-[#4FD8A8] border border-[#1DB584]/50">
                        CURRENT
                      </span>
                    )}
                    {line.executed && (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-white/5 text-gray-400 border border-white/10">
                        EXECUTED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {/* Invisible copy of the tallest available listing, stacked in the
                same grid cell, so the panel keeps one height in every language. */}
            {variants && (
              <div aria-hidden="true" className="col-start-1 row-start-1 invisible space-y-0.5 w-full min-w-0 pointer-events-none">
                {spacerLines.map((text, i) => (
                  <div key={i} className="grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 px-2 py-1 border-l-2 border-transparent">
                    <span className="text-[11px]">{i + 1}</span>
                    <div className="py-0.5">
                      <span className="whitespace-pre font-mono text-[11.5px] block">{text || " "}</span>
                    </div>
                    <div className="min-w-[72px] pl-1" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {running && experiment && (
        <button
          type="button"
          onClick={experiment.resetToLesson}
          className="self-start rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 cursor-pointer transition-colors"
        >
          Reset to Lesson
        </button>
      )}

      {/* State changes section */}
      {state.changes && state.changes.length > 0 && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 w-full min-w-0 overflow-hidden">
          <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">State Changes</p>
          <div className="flex flex-col gap-2 min-w-0">
            {state.changes.map((change, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-[12px] min-w-0">
                <span className="font-mono text-gray-400 truncate max-w-[140px]">{change.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`font-mono font-bold ${change.status ? CHANGE_STATUS_CLASSES[change.status] : "text-gray-300"}`}>
                    {change.from ? `${change.from} → ${change.to}` : change.to}
                  </span>
                  {change.status && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-500 px-1 py-0.5 rounded bg-white/5 border border-white/5">
                      {change.status}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {state.status && (
        <div className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-black tracking-wider ${STATUS_TONE_CLASSES[state.status.tone]}`}>
          {state.status.label}
        </div>
      )}

      {state.note && <p className="text-[11px] leading-relaxed text-gray-400 break-words">{state.note}</p>}
    </div>
  )
}

/** Pseudocode is not executable, so it opens the Code Lab in Python. */
function labLanguageFor(language: TraceLanguage): LabLanguage {
  return language === "cpp" || language === "java" ? language : "python"
}

/** Reset to Lesson is intentionally always its own explicit button elsewhere
 * in the panel — never folded into this toggle — so it can't be one
 * accidental click away from discarding a learner's custom run. */
function ExperimentToggle({
  mode,
  onStart,
}: {
  mode: TraceExperimentPanelProps["mode"]
  onStart: () => void
}) {
  if (mode === "editing") {
    return (
      <span className="shrink-0 rounded-full border border-[#1DB584]/50 bg-[#1DB584]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#4FD8A8]">
        Experiment Mode
      </span>
    )
  }
  if (mode === "running") {
    return (
      <button
        type="button"
        onClick={onStart}
        className="shrink-0 rounded-full border border-[#1DB584]/40 bg-[#1DB584]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[#4FD8A8] hover:bg-[#1DB584]/20 cursor-pointer transition-colors"
      >
        Edit Experiment
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={onStart}
      className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-300 hover:bg-white/10 cursor-pointer transition-colors"
    >
      Experiment
    </button>
  )
}

function ExperimentEditor({ experiment }: { experiment: TraceExperimentPanelProps }) {
  return (
    <div className="rounded-xl border border-[#1DB584]/30 bg-black/30 p-3 w-full min-w-0 flex flex-col gap-2.5">
      <label className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Edit input values</span>
        <textarea
          value={experiment.configText}
          onChange={event => experiment.setConfigText(event.target.value)}
          spellCheck={false}
          rows={3}
          className="w-full min-w-0 resize-none rounded-lg border border-white/10 bg-black/40 px-3 py-2 font-mono text-[12px] leading-relaxed text-gray-100 outline-none focus-visible:border-[#1DB584] focus-visible:ring-1 focus-visible:ring-[#1DB584]"
        />
      </label>

      {experiment.error && (
        <p role="alert" className="text-[11px] leading-relaxed text-amber-200 break-words">
          {experiment.error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={experiment.resetToLesson}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 cursor-pointer transition-colors"
        >
          Reset to Lesson
        </button>
        <button
          type="button"
          onClick={experiment.runChanges}
          className="rounded-lg bg-[#1DB584] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#159a6f] cursor-pointer shadow-xs transition-all"
        >
          Run Changes
        </button>
      </div>
    </div>
  )
}

function LanguageSelect({ value, onChange }: { value: TraceLanguage; onChange: (language: TraceLanguage) => void }) {
  return (
    <label className="relative inline-flex items-center shrink-0">
      <span className="sr-only">Code Trace language</span>
      <select
        value={value}
        onChange={event => onChange(event.target.value as TraceLanguage)}
        aria-label="Code Trace language"
        className="h-6 cursor-pointer appearance-none rounded-full border border-white/10 bg-black/30 pl-2.5 pr-6 text-[10px] font-bold text-gray-200 outline-none transition-colors hover:border-[#1DB584]/50 focus-visible:border-[#1DB584] focus-visible:ring-1 focus-visible:ring-[#1DB584]"
        style={{ colorScheme: "dark" }}
      >
        {TRACE_LANGUAGES.map(language => (
          <option key={language} value={language} className="bg-[#092218] text-gray-100">
            {TRACE_LANGUAGE_LABELS[language]}
          </option>
        ))}
      </select>
      <span aria-hidden="true" className="pointer-events-none absolute right-2 text-[10px] leading-none text-[#A7CE65]">
        ▾
      </span>
    </label>
  )
}
