import type { LinkedListReversalState } from "../../learning/animations/linkedListReversalStates"
import AnimationPlayback from "./AnimationPlayback"

interface LinkedListAnimationProps {
  title: string
  states: LinkedListReversalState[]
}

export default function LinkedListAnimation({ title, states }: LinkedListAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
    >
      {state => (
        <div>
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-max items-center gap-2">
              {state.nodes.map((value, nodeIndex) => {
                const isPrev = value === state.prev
                const isCurr = value === state.curr
                const isNext = value === state.next
                const isReversed = state.reversed.includes(value)
                return (
                  <div key={`${value}-${nodeIndex}`} className="flex items-center gap-2">
                    <div className="relative flex flex-col items-center pt-7">
                      <div className="absolute top-0 flex gap-1">
                        {isPrev && <span className="text-[10px] font-black text-[#A7CE65]">prev</span>}
                        {isCurr && <span className="text-[10px] font-black text-white">curr</span>}
                        {isNext && <span className="text-[10px] font-black text-amber-300">next</span>}
                      </div>
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border text-sm font-black transition-colors ${
                          isCurr
                            ? "border-[#1DB584] bg-[#1DB584] text-white"
                            : isReversed
                              ? "border-[#A7CE65]/60 bg-[#A7CE65]/15 text-white"
                              : "border-white/10 bg-black/30 text-gray-300"
                        }`}
                      >
                        {value}
                      </div>
                    </div>
                    {nodeIndex < state.nodes.length - 1 && <span className="pt-7 text-lg font-black text-gray-500">{"->"}</span>}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-3 grid gap-2 text-[11px] font-bold text-gray-300 sm:grid-cols-4">
            <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">prev: {state.prev ?? "null"}</span>
            <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">curr: {state.curr ?? "null"}</span>
            <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">next: {state.next ?? "null"}</span>
            <span className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-2">
              reversed: [{state.reversed.join(", ")}]
            </span>
          </div>
        </div>
      )}
    </AnimationPlayback>
  )
}
