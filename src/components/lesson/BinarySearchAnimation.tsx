import {
  BINARY_SEARCH_TARGET,
  BINARY_SEARCH_VALUES,
  type BinarySearchState,
} from "../../learning/animations/binarySearchStates"
import AnimationPlayback from "./AnimationPlayback"

interface BinarySearchAnimationProps {
  title: string
  states: BinarySearchState[]
}

export default function BinarySearchAnimation({ title, states }: BinarySearchAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
    >
      {state => (
        <div>
          <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-300">
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
              target {BINARY_SEARCH_TARGET}
            </span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">low {state.low}</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">mid {state.mid}</span>
            <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">high {state.high}</span>
          </div>

          <div className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-max gap-2">
              {BINARY_SEARCH_VALUES.map((value, cellIndex) => {
                const discarded = state.discarded.includes(cellIndex)
                const inRange = cellIndex >= state.low && cellIndex <= state.high
                const isMid = cellIndex === state.mid
                return (
                  <div key={cellIndex} className="relative flex flex-col items-center pt-7">
                    <div className="absolute top-0 flex gap-1">
                      {cellIndex === state.low && <span className="text-[10px] font-black text-[#A7CE65]">L</span>}
                      {isMid && <span className="text-[10px] font-black text-white">M</span>}
                      {cellIndex === state.high && <span className="text-[10px] font-black text-amber-300">R</span>}
                    </div>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black transition-colors ${
                        isMid
                          ? "border-[#1DB584] bg-[#1DB584] text-white"
                          : discarded
                            ? "border-white/5 bg-black/20 text-gray-600 line-through"
                            : inRange
                              ? "border-[#A7CE65]/45 bg-[#A7CE65]/10 text-gray-100"
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

          <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-amber-100">
            {state.decision}
          </div>
        </div>
      )}
    </AnimationPlayback>
  )
}
