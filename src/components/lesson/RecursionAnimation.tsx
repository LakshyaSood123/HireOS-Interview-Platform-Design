import type { RecursionFactorialState } from "../../learning/animations/recursionFactorialStates"
import AnimationPlayback from "./AnimationPlayback"

interface RecursionAnimationProps {
  title: string
  states: RecursionFactorialState[]
}

export default function RecursionAnimation({ title, states }: RecursionAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
    >
      {state => (
        <div className="grid gap-4 md:grid-cols-[1fr_0.85fr]">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Call Stack</div>
            <div className="flex min-h-36 flex-col-reverse gap-2">
              {state.stack.length ? (
                state.stack.map((frame, frameIndex) => (
                  <div
                    key={`${frame}-${frameIndex}`}
                    className={`rounded-lg border px-3 py-2 text-xs font-bold ${
                      frameIndex === state.stack.length - 1
                        ? "border-[#1DB584] bg-[#1DB584]/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-300"
                    }`}
                  >
                    {frame}
                  </div>
                ))
              ) : (
                <div className="flex min-h-28 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-xs font-bold text-gray-400">
                  stack empty
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Return Detail</div>
            <p className="text-sm font-black text-white">{state.detail}</p>
          </div>
        </div>
      )}
    </AnimationPlayback>
  )
}
