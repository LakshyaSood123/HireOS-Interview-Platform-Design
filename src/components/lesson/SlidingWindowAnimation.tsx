import {
  SLIDING_WINDOW_TARGET,
  SLIDING_WINDOW_VALUES,
  type SlidingWindowState,
} from "../../learning/animations/slidingWindowStates"
import AnimationPlayback from "./AnimationPlayback"

interface SlidingWindowAnimationProps {
  title: string
  states: SlidingWindowState[]
}

export default function SlidingWindowAnimation({ title, states }: SlidingWindowAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
    >
      {state => {
        const hasWindow = state.right >= state.left
        return (
          <div>
            <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-300">
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                limit {"<="} {SLIDING_WINDOW_TARGET}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                sum {state.sum}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 ${
                  state.valid
                    ? "border-[#1DB584]/40 bg-[#1DB584]/15 text-[#A7CE65]"
                    : "border-amber-400/40 bg-amber-400/10 text-amber-200"
                }`}
              >
                {state.valid ? "valid" : "shrink needed"}
              </span>
              <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">best {state.best}</span>
            </div>

            <div className="overflow-x-auto pb-1">
              <div className="inline-flex min-w-max gap-2">
                {SLIDING_WINDOW_VALUES.map((value, cellIndex) => {
                  const inWindow = hasWindow && cellIndex >= state.left && cellIndex <= state.right
                  const isIncoming = cellIndex === state.incomingIndex
                  const isOutgoing = cellIndex === state.outgoingIndex
                  const isBest = state.bestRange && cellIndex >= state.bestRange[0] && cellIndex <= state.bestRange[1]
                  return (
                    <div key={cellIndex} className="relative flex flex-col items-center pt-7">
                      <div className="absolute top-0 flex gap-1">
                        {cellIndex === state.left && <span className="text-[10px] font-black text-[#A7CE65]">L</span>}
                        {cellIndex === state.right && <span className="text-[10px] font-black text-amber-300">R</span>}
                      </div>
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black transition-colors ${
                          isOutgoing
                            ? "border-amber-400 bg-amber-400/20 text-amber-100"
                            : isIncoming
                              ? "border-[#1DB584] bg-[#1DB584] text-white"
                              : inWindow
                                ? state.valid
                                  ? "border-[#1DB584]/60 bg-[#1DB584]/25 text-white"
                                  : "border-amber-400/60 bg-amber-400/20 text-white"
                                : isBest
                                  ? "border-[#A7CE65]/40 bg-[#A7CE65]/10 text-gray-100"
                                  : "border-white/10 bg-black/30 text-gray-300"
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
          </div>
        )
      }}
    </AnimationPlayback>
  )
}
