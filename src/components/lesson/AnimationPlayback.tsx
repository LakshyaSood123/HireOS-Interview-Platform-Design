import { type ReactNode, useEffect, useState } from "react"
import { getCodeTrace } from "../../learning/animations/codeTraceRegistry"
import type { AlgorithmAnimationId } from "../../learning/types"
import CodeTracePanel from "./CodeTracePanel"

const AUTOPLAY_INTERVAL_MS = 2000

interface AnimationPlaybackProps<TState> {
  title: string
  states: TState[]
  getOperation: (state: TState) => string
  getMessage: (state: TState) => string
  children: (state: TState, index: number) => ReactNode
  /** When provided, renders a synchronized Code Trace panel alongside/beneath the
   * visual, reading THIS SAME playback's `index` — no separate timeline,
   * no duplicated Previous/Play/Pause/Next/Restart controls. */
  traceId?: AlgorithmAnimationId
}

export default function AnimationPlayback<TState>({
  title,
  states,
  getOperation,
  getMessage,
  children,
  traceId,
}: AnimationPlaybackProps<TState>) {
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const current = states[index] ?? states[0]
  const isFirst = index === 0
  const isLast = index === states.length - 1

  useEffect(() => {
    setIndex(0)
    setIsPlaying(false)
  }, [states])

  useEffect(() => {
    if (!isPlaying || isLast) {
      if (isLast) setIsPlaying(false)
      return
    }

    const timer = window.setTimeout(() => {
      setIndex(i => Math.min(i + 1, states.length - 1))
    }, AUTOPLAY_INTERVAL_MS)

    return () => window.clearTimeout(timer)
  }, [isPlaying, isLast, states.length, index])

  if (!current) return null

  const trace = traceId ? getCodeTrace(traceId) : undefined

  const goPrevious = () => {
    setIsPlaying(false)
    setIndex(i => Math.max(0, i - 1))
  }

  const goNext = () => {
    setIsPlaying(false)
    setIndex(i => Math.min(states.length - 1, i + 1))
  }

  const restart = () => {
    setIsPlaying(false)
    setIndex(0)
  }

  const play = () => {
    if (isLast) setIndex(0)
    setIsPlaying(true)
  }

  const pause = () => {
    setIsPlaying(false)
  }

  return (
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-4 sm:p-5 w-full max-w-full min-w-0 box-border">
      <div className="mb-4 flex items-start justify-between gap-4 min-w-0">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65]">Algorithm Animation</p>
          <h3 className="mt-1 text-sm font-bold text-white break-words">{title}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[10px] font-bold text-gray-300">
          Step {index + 1}/{states.length}
        </span>
      </div>

      {/* Sequential Teaching Hierarchy: VISUAL ACTION -> PSEUDOCODE ACTION -> STATE CHANGE */}
      <div className="flex flex-col gap-4 min-w-0 w-full">
        {/* 1. Primary Visual Action */}
        <div className="min-w-0 w-full">
          <div className="overflow-x-auto max-w-full pb-1">
            {children(current, index)}
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2.5 min-w-0">
            <div className="text-[10px] font-black tracking-wider text-[#A7CE65]">{getOperation(current)}</div>
            <p className="mt-1 text-xs leading-relaxed text-gray-300 break-words">{getMessage(current)}</p>
          </div>
        </div>

        {/* 2. Code Trace Action directly beneath animation */}
        {trace && (
          <div className="min-w-0 w-full">
            <CodeTracePanel trace={trace} currentStep={index} />
          </div>
        )}
      </div>

      {/* 3. Playback Controls */}
      <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-white/10">
        <button
          type="button"
          onClick={goPrevious}
          disabled={isFirst}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={play}
          disabled={isPlaying}
          className="rounded-lg bg-[#1DB584] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#159a6f] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-xs transition-all"
        >
          Play
        </button>
        <button
          type="button"
          onClick={pause}
          disabled={!isPlaying}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
        >
          Next
        </button>
        <button
          type="button"
          onClick={restart}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-gray-200 hover:bg-white/10 cursor-pointer transition-colors"
        >
          Restart
        </button>
      </div>
    </div>
  )
}
