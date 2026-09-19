import type { AdvancedAnimationState } from "../../learning/animations/advancedAnimationStates"
import AnimationPlayback from "./AnimationPlayback"

interface AdvancedConceptAnimationProps {
  title: string
  states: AdvancedAnimationState[]
}

export default function AdvancedConceptAnimation({ title, states }: AdvancedConceptAnimationProps) {
  return (
    <AnimationPlayback
      title={title}
      states={states}
      getOperation={state => state.operation}
      getMessage={state => state.message}
    >
      {state => <AdvancedFrame state={state} />}
    </AnimationPlayback>
  )
}

function AdvancedFrame({ state }: { state: AdvancedAnimationState }) {
  return (
    <div className="grid gap-4 md:grid-cols-[1fr_0.9fr]">
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <PrimaryVisual state={state} />
      </div>
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">State Data</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(state)
            .filter(([key]) => key !== "operation" && key !== "message")
            .map(([key, value]) => (
              <span key={key} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[11px] font-bold text-gray-200">
                {key}: {formatValue(value)}
              </span>
            ))}
        </div>
      </div>
    </div>
  )
}

function PrimaryVisual({ state }: { state: AdvancedAnimationState }) {
  if (Array.isArray(state.stack) || Array.isArray(state.queue)) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <PillColumn label="stack" items={toStringArray(state.stack).slice().reverse()} />
        <PillColumn label="queue" items={toStringArray(state.queue)} />
      </div>
    )
  }

  if (Array.isArray(state.array) || Array.isArray(state.values)) {
    const values = (state.array ?? state.values) as Array<string | number | null>
    return <CellRow values={values} activeIndex={typeof state.activeIndex === "number" ? state.activeIndex : typeof state.active === "number" ? state.active : undefined} />
  }

  if (Array.isArray(state.grid)) {
    return <GridView grid={state.grid as Array<Array<string | number | null>>} active={Array.isArray(state.active) ? state.active as [number, number] : undefined} />
  }

  if (Array.isArray(state.path)) return <ArrowPills items={toStringArray(state.path)} />
  if (Array.isArray(state.output)) return <ArrowPills items={toStringArray(state.output)} />
  if (Array.isArray(state.sequence)) return <ArrowPills items={toStringArray(state.sequence)} />
  if (Array.isArray(state.selected)) return <ArrowPills items={toStringArray(state.selected)} />
  if (Array.isArray(state.completed) && Array.isArray(state.stages)) {
    const completed = new Set(toStringArray(state.completed))
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {toStringArray(state.stages).map(stage => (
            <span key={stage} className={`rounded-lg px-3 py-2 text-xs font-black ${completed.has(stage) ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400"}`}>
              {stage}
            </span>
          ))}
        </div>
        {typeof state.readiness === "number" && (
          <div className="h-3 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#A7CE65]" style={{ width: `${state.readiness}%` }} />
          </div>
        )}
      </div>
    )
  }

  if (Array.isArray(state.phases)) {
    return (
      <div className="space-y-2">
        {(state.phases as Array<[string, string | number]>).map(([name, minutes], index) => (
          <div key={name} className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-bold ${index === state.active ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-300"}`}>
            <span>{name}</span>
            <span>{minutes}</span>
          </div>
        ))}
      </div>
    )
  }

  if (Array.isArray(state.edges)) {
    return <ArrowPills items={(state.edges as Array<[string, string]>).map(([a, b]) => `${a}-${b}`)} />
  }

  if (state.decision) {
    return <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-3 text-sm font-black text-amber-100">{String(state.decision)}</div>
  }

  return <div className="text-sm font-bold text-gray-300">{state.operation}</div>
}

function CellRow({ values, activeIndex }: { values: Array<string | number | null>; activeIndex?: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, index) => (
        <span key={index} className={`flex h-11 w-11 items-center justify-center rounded-xl border text-sm font-black ${index === activeIndex ? "border-[#1DB584] bg-[#1DB584] text-white" : "border-white/10 bg-white/5 text-gray-300"}`}>
          {value ?? "."}
        </span>
      ))}
    </div>
  )
}

function GridView({ grid, active }: { grid: Array<Array<string | number | null>>; active?: [number, number] }) {
  return (
    <div className="inline-grid gap-2" style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 1}, minmax(0, 2.5rem))` }}>
      {grid.flatMap((row, r) =>
        row.map((value, c) => (
          <span key={`${r}-${c}`} className={`flex h-10 w-10 items-center justify-center rounded-lg border text-xs font-black ${active?.[0] === r && active?.[1] === c ? "border-[#1DB584] bg-[#1DB584] text-white" : "border-white/10 bg-white/5 text-gray-300"}`}>
            {value ?? "."}
          </span>
        )),
      )}
    </div>
  )
}

function PillColumn({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#A7CE65]">{label}</div>
      <div className="flex min-h-24 flex-col gap-2">
        {items.map(item => (
          <span key={item} className="rounded-lg bg-[#1DB584]/20 px-3 py-2 text-center text-xs font-black text-white">{item}</span>
        ))}
      </div>
    </div>
  )
}

function ArrowPills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <span key={`${item}-${index}`} className="rounded-lg bg-[#1DB584]/20 px-3 py-2 text-xs font-black text-white">
          {item}
        </span>
      ))}
    </div>
  )
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map(item => String(item)) : []
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(formatValue).join(", ")}]`
  if (value && typeof value === "object") return JSON.stringify(value)
  return String(value)
}
