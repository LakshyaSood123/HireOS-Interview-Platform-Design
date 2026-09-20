import type { AlgorithmCodeTrace, CodeTraceVariableChange, TraceStatusTone } from "../../learning/animations/codeTraceTypes"

interface CodeTracePanelProps {
  trace: AlgorithmCodeTrace
  /** The SAME step index the paired animation is currently on — this panel
   * never owns or advances its own step. See AnimationPlayback.tsx /
   * ArrayTraversalVisual.tsx, the only two callers. */
  currentStep: number
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
export default function CodeTracePanel({ trace, currentStep }: CodeTracePanelProps) {
  const state = trace.states[currentStep] ?? trace.states[0]
  if (!state) return null

  const activeSet = new Set(state.activeLines)
  const executedSet = new Set(state.executedLines ?? [])

  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-4 w-full max-w-full min-w-0 box-border">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <p className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65] shrink-0">Code Trace</p>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-gray-300">
          Step {currentStep + 1} / {trace.states.length}
        </span>
      </div>

      {/* Pseudocode line viewer: strict 3-column grid (line-number | minmax(0, code) | status) */}
      <div className="overflow-hidden rounded-xl border border-white/10 bg-black/30 p-2 font-mono text-[12px] leading-relaxed w-full min-w-0">
        <div className="space-y-0.5 w-full min-w-0">
          {trace.pseudocode.map((line, i) => {
            const lineNumber = i + 1
            const isActive = activeSet.has(lineNumber)
            const isExecuted = !isActive && executedSet.has(lineNumber)
            return (
              <div
                key={lineNumber}
                className={`grid grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 py-1 min-w-0 w-full transition-colors ${
                  isActive
                    ? "border-l-2 border-[#1DB584] bg-[#1DB584]/20"
                    : isExecuted
                      ? "border-l-2 border-white/20 bg-white/5"
                      : "border-l-2 border-transparent"
                }`}
              >
                {/* 1. Line number column */}
                <span className="shrink-0 text-right text-gray-500 select-none text-[11px]">{lineNumber}</span>

                {/* 2. Code column: shrink-safe with internal horizontal scroll for long lines */}
                <div className="min-w-0 overflow-x-auto overflow-y-hidden py-0.5">
                  <span
                    className={`whitespace-pre font-mono text-[11.5px] block ${
                      isActive ? "font-bold text-white" : isExecuted ? "text-gray-300" : "text-gray-500"
                    }`}
                  >
                    {line || " "}
                  </span>
                </div>

                {/* 3. Status badge column: fixed min-width, never pushed off-screen */}
                <div className="shrink-0 text-right min-w-[72px] pl-1">
                  {isActive && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-[#1DB584]/30 text-[#4FD8A8] border border-[#1DB584]/50">
                      CURRENT
                    </span>
                  )}
                  {isExecuted && (
                    <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider bg-white/5 text-gray-400 border border-white/10">
                      EXECUTED
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
