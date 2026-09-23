import type { MonotonicSearchState } from "../../learning/animations/studyExpansionStates"
import AnimationPlayback from "./AnimationPlayback"

interface MonotonicConditionAnimationProps {
  title: string
  states: MonotonicSearchState[]
}

export default function MonotonicConditionAnimation({ title, states }: MonotonicConditionAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
      traceId="binary-search-monotonic-condition"
    >
      {state => <MonotonicFrame state={state} />}
    </AnimationPlayback>
  )
}

function MonotonicFrame({ state }: { state: MonotonicSearchState }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 min-w-0">
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Find first valid x</div>
          <div className="mt-1 text-xs text-gray-300">condition: x² ≥ {state.threshold}</div>
        </div>
        <div className="flex gap-2 text-[10px] font-black">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">LOW {state.low}</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-gray-300">HIGH {state.high}</span>
          <span className="rounded-full border border-[#A7CE65]/30 bg-[#A7CE65]/10 px-2.5 py-1 text-[#D7F0AF]">BEST {state.answer ?? "—"}</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {state.values.map(value => {
          const inRange = value >= state.low && value <= state.high
          const isMid = state.mid === value
          const isCandidate = state.answer === value
          const predicate = value * value >= state.threshold
          return (
            <div key={value} className={`flex flex-col items-center gap-1 ${inRange || isCandidate ? "opacity-100" : "opacity-30"}`}>
              <span
                className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black ${
                  isMid
                    ? "border-[#1DB584] bg-[#1DB584] text-white"
                    : isCandidate
                      ? "border-[#A7CE65] bg-[#A7CE65]/20 text-white"
                      : "border-white/10 bg-white/5 text-gray-300"
                }`}
                aria-label={`x ${value}, condition ${predicate ? "true" : "false"}${isMid ? ", current mid" : ""}`}
              >
                {value}
              </span>
              <span className={`text-[9px] font-black ${predicate ? "text-[#A7CE65]" : "text-gray-500"}`}>{predicate ? "TRUE" : "FALSE"}</span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Readout label="mid" value={state.mid ?? "—"} />
        <Readout
          label="check(mid)"
          value={state.check === null ? "not checked" : state.check ? "TRUE" : "FALSE"}
        />
        <Readout label="candidate" value={state.answer ?? "—"} />
      </div>
    </div>
  )
}

function Readout({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <div className="text-[9px] font-black uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-0.5 font-mono text-xs font-bold text-white">{value}</div>
    </div>
  )
}
