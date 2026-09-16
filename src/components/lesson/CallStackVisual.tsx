import { useEffect, useState } from "react"
import type { CallStackFrame } from "../../learning/types"

interface CallStackVisualProps {
  frames: CallStackFrame[]
}

const KIND_STYLE: Record<CallStackFrame["kind"], string> = {
  call: "bg-[#1DB584]/15 border-[#1DB584]/40 text-emerald-200",
  "base-case": "bg-amber-500/15 border-amber-500/40 text-amber-200",
  return: "bg-white/5 border-white/15 text-gray-300",
}

/** Reusable call-stack animation — steps through a fixed sequence of
 * push/base-case/pop frames one at a time. Not tied to factorial or any
 * specific function: pass a different `frames` array (e.g. a backtracking
 * decision tree, or a tree-recursion unwind) to reuse it elsewhere — see
 * LEARNING_ENGINE_ARCHITECTURE.md's reusable-visuals note. */
export default function CallStackVisual({ frames }: CallStackVisualProps) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    setStep(0)
    const interval = setInterval(() => {
      setStep(s => (s >= frames.length - 1 ? 0 : s + 1))
    }, 1100)
    return () => clearInterval(interval)
  }, [frames])

  // The stack at any step: every "call"/"base-case" frame up to `step` that
  // hasn't yet been popped by a later "return" at or before `step`.
  const visibleStack: CallStackFrame[] = []
  let poppedCount = 0
  for (let i = step; i >= 0; i--) {
    if (frames[i].kind === "return") {
      poppedCount++
      continue
    }
    if (poppedCount > 0) {
      poppedCount--
      continue
    }
    visibleStack.unshift(frames[i])
  }

  const current = frames[step]

  return (
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-5">
      <div className="flex flex-col-reverse gap-1.5 min-h-[140px] justify-start">
        {visibleStack.map((frame, i) => (
          <div
            key={i}
            className={`px-3 py-2 rounded-lg border text-xs font-mono text-center transition-all ${KIND_STYLE[frame.kind]}`}
          >
            {frame.label}
          </div>
        ))}
        {visibleStack.length === 0 && <div className="text-[11px] text-gray-500 text-center py-4">(stack empty)</div>}
      </div>
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] text-gray-400">
          {current.kind === "call" && "Pushing a new call onto the stack"}
          {current.kind === "base-case" && "Base case reached — starts returning"}
          {current.kind === "return" && "Returning and popping the stack"}
        </span>
        {current.detail && <span className="text-[11px] font-mono text-[#A7CE65]">{current.detail}</span>}
      </div>
    </div>
  )
}
