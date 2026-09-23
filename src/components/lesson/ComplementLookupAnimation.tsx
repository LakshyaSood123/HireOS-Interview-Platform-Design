import type { HashingComplementState } from "../../learning/animations/studyExpansionStates"
import AnimationPlayback from "./AnimationPlayback"

interface ComplementLookupAnimationProps {
  title: string
  states: HashingComplementState[]
}

export default function ComplementLookupAnimation({ title, states }: ComplementLookupAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
      traceId="hashing-complement-lookup"
    >
      {state => <ComplementFrame state={state} />}
    </AnimationPlayback>
  )
}

function ComplementFrame({ state }: { state: HashingComplementState }) {
  const resultSet = new Set(state.result ?? [])

  return (
    <div className="grid gap-4 lg:grid-cols-[1.35fr_0.9fr] min-w-0">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4 min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">nums</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-bold text-gray-300">
            target = {state.target}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {state.values.map((value, index) => {
            const active = state.activeIndex === index
            const inResult = resultSet.has(index)
            return (
              <div key={index} className="flex flex-col items-center gap-1.5">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black transition-colors ${
                    inResult
                      ? "border-[#A7CE65] bg-[#A7CE65]/20 text-white"
                      : active
                        ? "border-[#1DB584] bg-[#1DB584] text-white"
                        : "border-white/10 bg-white/5 text-gray-300"
                  }`}
                  aria-label={`index ${index}, value ${value}${active ? ", current" : ""}${inResult ? ", result" : ""}`}
                >
                  {value}
                </span>
                <span className="text-[9px] font-bold text-gray-500">i={index}</span>
                {active && <span className="text-[9px] font-black text-[#4FD8A8]">CURRENT</span>}
                {inResult && <span className="text-[9px] font-black text-[#A7CE65]">PAIR</span>}
              </div>
            )
          })}
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <Readout label="current" value={state.current ?? "—"} />
          <Readout label="target - current" value={state.complement ?? "—"} />
          <Readout label="lookup" value={state.found ? "FOUND" : state.complement === undefined ? "—" : "not seen"} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/20 p-4 min-w-0">
        <div className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65] mb-3">seen map</div>
        {Object.keys(state.seen).length ? (
          <div className="space-y-2">
            {Object.entries(state.seen).map(([value, index]) => (
              <div key={value} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <span className="font-mono text-gray-300">value {value}</span>
                <span className="font-black text-[#4FD8A8]">index {index}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-white/15 px-3 py-4 text-center text-xs text-gray-500">empty</div>
        )}

        {state.result && (
          <div className="mt-3 rounded-lg border border-[#A7CE65]/35 bg-[#A7CE65]/10 px-3 py-2.5 text-xs font-bold text-[#D7F0AF]">
            RESULT: [{state.result[0]}, {state.result[1]}]
          </div>
        )}
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
