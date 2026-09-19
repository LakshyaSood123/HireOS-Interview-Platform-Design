import type {
  ComplexityState,
  HashingState,
  IntervalsState,
  PrefixSumState,
  TwoPointersState,
} from "../../learning/animations/patternBasicsStates"
import type { AlgorithmAnimationId } from "../../learning/types"
import AnimationPlayback from "./AnimationPlayback"

type PatternState = ComplexityState | HashingState | TwoPointersState | PrefixSumState | IntervalsState

type PatternKind = "complexity" | "hashing" | "two-pointers" | "prefix-sum" | "intervals"

interface PatternBasicsAnimationProps<TState extends PatternState> {
  title: string
  states: TState[]
  kind: PatternKind
}

/** Each `kind` maps to exactly one production animation id — resolved here
 * rather than threaded as a separate prop, since `kind` already uniquely
 * determines it. */
const KIND_TO_TRACE_ID: Record<PatternKind, AlgorithmAnimationId> = {
  complexity: "complexity-growth",
  hashing: "hashing-frequency-map",
  "two-pointers": "two-pointers-opposite-sum",
  "prefix-sum": "prefix-sum-range-query",
  intervals: "intervals-merge-overlap",
}

export default function PatternBasicsAnimation<TState extends PatternState>({
  title,
  states,
  kind,
}: PatternBasicsAnimationProps<TState>) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
      traceId={KIND_TO_TRACE_ID[kind]}
    >
      {state => renderPatternState(kind, state)}
    </AnimationPlayback>
  )
}

function renderPatternState(kind: PatternBasicsAnimationProps<PatternState>["kind"], state: PatternState) {
  if (kind === "complexity") return <ComplexityFrame state={state as ComplexityState} />
  if (kind === "hashing") return <HashingFrame state={state as HashingState} />
  if (kind === "two-pointers") return <TwoPointersFrame state={state as TwoPointersState} />
  if (kind === "prefix-sum") return <PrefixSumFrame state={state as PrefixSumState} />
  return <IntervalsFrame state={state as IntervalsState} />
}

function ComplexityFrame({ state }: { state: ComplexityState }) {
  const cursorX = 44 + state.n * 28
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <svg viewBox="0 0 360 160" className="h-56 w-full">
        <path d="M35 12V128H342" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
        <polyline points="42,112 92,112 142,112 192,112 242,112 292,112 336,112" fill="none" stroke="#A7CE65" strokeWidth="4" />
        <polyline points="42,111 92,105 142,99 192,93 242,87 292,82 336,77" fill="none" stroke="#38BDF8" strokeWidth="4" />
        <polyline points="42,112 92,100 142,88 192,76 242,64 292,52 336,42" fill="none" stroke="#1DB584" strokeWidth="4" />
        <polyline points="42,112 92,101 142,84 192,64 242,42 292,22 336,12" fill="none" stroke="#FBBF24" strokeWidth="4" />
        <polyline points="42,112 92,108 142,96 192,76 242,50 292,24 336,8" fill="none" stroke="#F97316" strokeWidth="4" />
        <line x1={cursorX} y1="12" x2={cursorX} y2="128" stroke="#ffffff" strokeOpacity="0.55" strokeDasharray="5 5" />
        <text x="256" y="109" className="fill-white text-[10px] font-bold">O(1)</text>
        <text x="256" y="80" className="fill-white text-[10px] font-bold">O(log n)</text>
        <text x="256" y="55" className="fill-white text-[10px] font-bold">O(n)</text>
        <text x="256" y="34" className="fill-white text-[10px] font-bold">O(n log n)</text>
        <text x="256" y="15" className="fill-white text-[10px] font-bold">O(n^2)</text>
      </svg>
    </div>
  )
}

function HashingFrame({ state }: { state: HashingState }) {
  return (
    <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="flex items-center justify-center gap-3 text-sm font-black text-white">
          <span className="rounded-lg bg-[#1DB584] px-3 py-2">"{state.key}"</span>
          <span className="text-gray-500">{"->"}</span>
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">hash</span>
          <span className="text-gray-500">{"->"}</span>
          <span className="rounded-lg bg-[#A7CE65]/20 px-3 py-2 text-[#A7CE65]">bucket {state.bucket}</span>
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map(bucket => (
          <div
            key={bucket}
            className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-bold ${
              bucket === state.bucket
                ? "border-[#1DB584]/50 bg-[#1DB584]/15 text-white"
                : "border-white/10 bg-black/20 text-gray-400"
            }`}
          >
            <span>bucket {bucket}</span>
            <span>{bucket === state.bucket ? `${state.key}: ${state.count}` : "-"}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TwoPointersFrame({ state }: { state: TwoPointersState }) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-bold text-gray-300">
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">target {state.target}</span>
        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1">sum {state.sum}</span>
      </div>
      <div className="inline-flex min-w-max gap-2">
        {state.values.map((value, index) => (
          <div key={index} className="relative flex flex-col items-center pt-7">
            <div className="absolute top-0 flex gap-1">
              {index === state.left && <span className="text-[10px] font-black text-[#A7CE65]">L</span>}
              {index === state.right && <span className="text-[10px] font-black text-amber-300">R</span>}
            </div>
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl border text-sm font-black ${
                index === state.left || index === state.right
                  ? "border-[#1DB584] bg-[#1DB584] text-white"
                  : "border-white/10 bg-black/30 text-gray-300"
              }`}
            >
              {value}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-amber-100">
        {state.decision}
      </div>
    </div>
  )
}

function PrefixSumFrame({ state }: { state: PrefixSumState }) {
  return (
    <div className="space-y-4 overflow-x-auto pb-1">
      <NumberRow label="nums" values={state.values} activeRange={state.range} />
      <NumberRow
        label="prefix"
        values={state.prefix}
        activeIndex={state.active}
        mutedIndex={state.subtractIndex}
      />
      {state.result !== undefined && (
        <div className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-[#A7CE65]">
          result = {state.result}
        </div>
      )}
    </div>
  )
}

function NumberRow({
  label,
  values,
  activeIndex,
  mutedIndex,
  activeRange,
}: {
  label: string
  values: Array<number | null>
  activeIndex?: number
  mutedIndex?: number
  activeRange?: [number, number]
}) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">{label}</div>
      <div className="inline-flex min-w-max gap-2">
        {values.map((value, index) => {
          const inRange = activeRange && index >= activeRange[0] && index <= activeRange[1]
          return (
            <div
              key={index}
              className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black ${
                index === activeIndex || inRange
                  ? "border-[#1DB584] bg-[#1DB584] text-white"
                  : index === mutedIndex
                    ? "border-amber-400/50 bg-amber-400/15 text-amber-100"
                    : "border-white/10 bg-black/30 text-gray-300"
              }`}
            >
              {value ?? "."}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function IntervalsFrame({ state }: { state: IntervalsState }) {
  const scale = (value: number) => 24 + value * 34
  return (
    <div className="relative h-44 rounded-xl border border-white/10 bg-black/20 p-4">
      <div className="absolute left-7 right-7 top-20 h-1 rounded-full bg-white/10" />
      {state.intervals.map(([start, end], index) => (
        <div
          key={`${start}-${end}-${index}`}
          className="absolute rounded-full border border-[#1DB584]/60 bg-[#1DB584]/30 px-3 py-2 text-xs font-black text-white"
          style={{ left: scale(start), top: 38 + index * 40, width: Math.max(54, (end - start) * 34) }}
        >
          [{start}, {end}]
        </div>
      ))}
      {state.operation === "MERGE" && (
        <div className="absolute bottom-4 left-4 rounded-lg bg-[#A7CE65]/15 px-3 py-2 text-xs font-bold text-[#A7CE65]">
          merged interval [1, 8]
        </div>
      )}
    </div>
  )
}
