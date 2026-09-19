import { useEffect, useState } from "react"
import type { ArrayTraversalState } from "../../learning/animations/arraysInPlaceStates"

interface ArrayTraversalVisualProps {
  title: string
  states: ArrayTraversalState[]
}

export default function ArrayTraversalVisual({ title, states }: ArrayTraversalVisualProps) {
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
    }, 2000)

    return () => window.clearTimeout(timer)
  }, [isPlaying, isLast, states.length, index])

  if (!current) return null

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
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-wider text-[#A7CE65]">Algorithm Animation</p>
          <h3 className="text-sm font-bold text-white mt-1">{title}</h3>
        </div>
        <span className="shrink-0 rounded-full bg-black/30 border border-white/10 px-2.5 py-1 text-[10px] font-bold text-gray-300">
          Step {index + 1}/{states.length}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="inline-flex gap-2 min-w-max">
          {current.values.map((value, cellIndex) => {
            const isActive = cellIndex === current.activeIndex
            const isLeft = cellIndex === current.leftIndex
            const isRight = cellIndex === current.rightIndex
            return (
              <div key={`${index}-${cellIndex}`} className="relative flex flex-col items-center pt-7">
                <div className="absolute top-0 flex gap-1">
                  {isActive && <span className="text-[10px] font-black text-[#A7CE65]">idx</span>}
                  {isLeft && <span className="text-[10px] font-black text-[#A7CE65]">L</span>}
                  {isRight && <span className="text-[10px] font-black text-amber-300">R</span>}
                </div>
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-black border transition-colors ${
                    isActive || isLeft || isRight
                      ? "bg-[#1DB584] text-white border-[#1DB584]"
                      : "bg-black/30 text-gray-300 border-white/10"
                  }`}
                >
                  {value}
                </div>
                <span className="mt-1.5 text-[10px] text-gray-500">{cellIndex}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-black/20 border border-white/10 px-3.5 py-3">
        <div className="text-[10px] font-black tracking-wider text-[#A7CE65]">{current.operation}</div>
        <p className="mt-1 text-xs leading-relaxed text-gray-300">{current.message}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={goPrevious}
          disabled={isFirst}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={play}
          disabled={isPlaying}
          className="px-3 py-2 rounded-lg bg-[#1DB584] hover:bg-[#159a6f] text-xs font-bold text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Play
        </button>
        <button
          type="button"
          onClick={pause}
          disabled={!isPlaying}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Pause
        </button>
        <button
          type="button"
          onClick={goNext}
          disabled={isLast}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
        <button
          type="button"
          onClick={restart}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-200"
        >
          Restart
        </button>
      </div>
    </div>
  )
}
