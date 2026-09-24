import { useEffect, useState } from "react"

interface TwoPointerVisualProps {
  values: number[]
  /** "opposite" animates left/right converging toward the middle.
   * "same-direction" simulates read/write compaction on the given values: a
   * read pointer scans every position, a write pointer marks the next slot for
   * a kept value and advances only when one is kept. A value is kept when it
   * differs from the value before it, so `values` should be sorted for the
   * picture to match the teaching. */
  mode: "opposite" | "same-direction"
}

/** Lightweight, reusable pointer-movement animation — plain SVG/CSS, no
 * visualization library. Generic enough to reuse for any array-based
 * two-pointer example, not just this specific value set. */
export default function TwoPointerVisual({ values, mode }: TwoPointerVisualProps) {
  return mode === "opposite" ? <OppositeVisual values={values} /> : <CompactionVisual values={values} />
}

function OppositeVisual({ values }: { values: number[] }) {
  const [step, setStep] = useState(0)
  const maxStep = Math.floor(values.length / 2)

  useEffect(() => {
    setStep(0)
    const interval = setInterval(() => {
      setStep(s => (s >= maxStep ? 0 : s + 1))
    }, 900)
    return () => clearInterval(interval)
  }, [maxStep])

  const leftIndex = step
  const rightIndex = values.length - 1 - step

  const cellW = 48

  return (
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-5">
      <div className="overflow-x-auto">
        <div className="relative inline-flex" style={{ paddingTop: 28 }}>
          {values.map((v, i) => {
            const isLeft = i === leftIndex
            const isRight = i === rightIndex
            return (
              <div key={i} className="relative flex flex-col items-center" style={{ width: cellW }}>
                {isLeft && (
                  <span className="absolute -top-7 text-[10px] font-black text-[#A7CE65]">L</span>
                )}
                {isRight && (
                  <span className="absolute -top-7 text-[10px] font-black text-amber-400">R</span>
                )}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black border transition-colors ${
                    isLeft || isRight ? "bg-[#1DB584] text-white border-[#1DB584]" : "bg-black/30 text-gray-300 border-white/10"
                  }`}
                >
                  {v}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="text-[11px] text-gray-500 mt-3">L and R start at opposite ends and step toward each other.</p>
    </div>
  )
}

interface CompactionStep {
  /** Position being read, or null on the final summary step. */
  read: number | null
  /** Next slot a kept value will be written to. */
  write: number
  cells: number[]
  /** Slot that was just filled by a kept value, if any. */
  justWritten: number | null
  message: string
}

function buildCompactionSteps(values: number[]): CompactionStep[] {
  if (values.length === 0) return []
  const cells = [...values]
  let write = 1
  const steps: CompactionStep[] = [
    {
      read: 0,
      write,
      cells: [...cells],
      justWritten: 0,
      message: `Read ${values[0]} at position 0. The first value is always kept, so write starts at 1.`,
    },
  ]
  for (let read = 1; read < values.length; read++) {
    if (values[read] !== values[read - 1]) {
      cells[write] = values[read]
      const filled = write
      write++
      steps.push({
        read,
        write,
        cells: [...cells],
        justWritten: filled,
        message: `Read ${values[read]}: different from the value before it, so copy it to slot ${filled}. Write advances to ${write}.`,
      })
    } else {
      steps.push({
        read,
        write,
        cells: [...cells],
        justWritten: null,
        message: `Read ${values[read]}: same as the value before it, so skip. Write stays at ${write}.`,
      })
    }
  }
  steps.push({
    read: null,
    write,
    cells: [...cells],
    justWritten: null,
    message: `Done. Write is ${write}, so the first ${write} slots hold the kept values.`,
  })
  return steps
}

function CompactionVisual({ values }: { values: number[] }) {
  const steps = buildCompactionSteps(values)
  const [step, setStep] = useState(0)
  const lastStep = steps.length - 1

  useEffect(() => {
    setStep(0)
    const interval = setInterval(() => {
      setStep(s => (s >= lastStep ? 0 : s + 1))
    }, 1400)
    return () => clearInterval(interval)
  }, [lastStep])

  const current = steps[Math.min(step, lastStep)]
  if (!current) return null

  const cellW = 48

  return (
    <div className="rounded-2xl border border-[#1DB584]/25 bg-[#092218] p-5">
      <div className="overflow-x-auto">
        <div className="relative inline-flex" style={{ paddingTop: 28, paddingBottom: 24 }}>
          {current.cells.map((v, i) => {
            const isRead = i === current.read
            const isWrite = i === current.write
            const isJustWritten = i === current.justWritten
            const inKeptRegion = i < current.write
            return (
              <div key={i} className="relative flex flex-col items-center" style={{ width: cellW }}>
                {isRead && <span className="absolute -top-7 text-[10px] font-black text-[#A7CE65]">R</span>}
                {isWrite && <span className="absolute -bottom-6 text-[10px] font-black text-amber-400">W</span>}
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-black border transition-colors ${
                    isJustWritten
                      ? "bg-[#1DB584] text-white border-[#1DB584]"
                      : isRead
                        ? "bg-[#1DB584]/30 text-white border-[#1DB584]"
                        : inKeptRegion
                          ? "bg-black/30 text-white border-[#1DB584]/40"
                          : "bg-black/30 text-gray-500 border-white/10"
                  }`}
                >
                  {v}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <p className="text-[11px] text-gray-400 mt-3 min-h-[2.5rem]">{current.message}</p>
      <p className="text-[11px] text-gray-500 mt-1">R reads every position. W marks the next slot for a kept value and moves only when one is kept.</p>
    </div>
  )
}
