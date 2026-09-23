import type { FastSlowPointerState } from "../../learning/animations/studyExpansionStates"
import AnimationPlayback from "./AnimationPlayback"

interface FastSlowPointerAnimationProps {
  title: string
  states: FastSlowPointerState[]
}

const X: Record<number, number> = { 1: 55, 2: 135, 3: 215, 4: 295, 5: 375 }

export default function FastSlowPointerAnimation({ title, states }: FastSlowPointerAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
      traceId="linked-list-fast-slow-cycle"
    >
      {state => <FastSlowFrame state={state} />}
    </AnimationPlayback>
  )
}

function FastSlowFrame({ state }: { state: FastSlowPointerState }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">Cycle: 5 → 3</div>
        <div className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${state.met ? "border-[#A7CE65]/40 bg-[#A7CE65]/10 text-[#D7F0AF]" : "border-white/10 bg-white/5 text-gray-300"}`}>
          {state.met ? "MEETING FOUND" : `ITERATION ${state.iteration}`}
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <svg viewBox="0 0 430 190" className="block min-w-[430px] w-full" role="img" aria-label={`Linked list cycle visual. Slow pointer at ${state.slow}; fast pointer at ${state.fast}.`}>
          <defs>
            <marker id="fastSlowArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
              <path d="M0,0 L8,4 L0,8 z" fill="#6B7E74" />
            </marker>
          </defs>

          {[1, 2, 3, 4].map(node => (
            <line key={node} x1={X[node] + 23} y1="86" x2={X[node + 1] - 25} y2="86" stroke="#6B7E74" strokeWidth="2" markerEnd="url(#fastSlowArrow)" />
          ))}
          <path d="M398 82 C410 25, 225 18, 215 61" fill="none" stroke="#E2B44A" strokeWidth="2.2" markerEnd="url(#fastSlowArrow)" />
          <text x="315" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill="#E2B44A">cycle edge 5 → 3</text>

          {state.nodes.map(node => {
            const slow = state.slow === node
            const fast = state.fast === node
            const both = slow && fast
            return (
              <g key={node}>
                <circle cx={X[node]} cy="86" r="23" fill={both ? "#537A40" : slow || fast ? "#176B50" : "#0F3524"} stroke={both ? "#A7CE65" : "#1DB584"} strokeWidth={both ? 3 : 1.5} />
                <text x={X[node]} y="91" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">{node}</text>
                {slow && <text x={X[node]} y="132" textAnchor="middle" fontSize="10" fontWeight="900" fill="#4FD8A8">SLOW</text>}
                {fast && <text x={X[node]} y={slow ? "148" : "132"} textAnchor="middle" fontSize="10" fontWeight="900" fill="#F4C66E">FAST</text>}
                {both && <text x={X[node]} y="166" textAnchor="middle" fontSize="10" fontWeight="900" fill="#D7F0AF">MEET</text>}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Readout label="slow (1 edge)" value={state.slow} />
        <Readout label="fast (2 edges)" value={state.fast} />
        <Readout label="status" value={state.met ? "cycle detected" : "searching"} />
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
