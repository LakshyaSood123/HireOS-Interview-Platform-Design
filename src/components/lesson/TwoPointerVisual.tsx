import { useEffect, useState } from "react"

interface TwoPointerVisualProps {
  values: number[]
  /** "opposite" animates left/right converging toward the middle;
   * "same-direction" animates both pointers starting together and the
   * right one racing ahead — the two recognition shapes PART 5 covers. */
  mode: "opposite" | "same-direction"
}

/** Lightweight, reusable pointer-movement animation — plain SVG/CSS, no
 * visualization library. Generic enough to reuse for any array-based
 * two-pointer example, not just this specific value set. */
export default function TwoPointerVisual({ values, mode }: TwoPointerVisualProps) {
  const [step, setStep] = useState(0)
  const maxStep = mode === "opposite" ? Math.floor(values.length / 2) : values.length - 1

  useEffect(() => {
    setStep(0)
    const interval = setInterval(() => {
      setStep(s => (s >= maxStep ? 0 : s + 1))
    }, 900)
    return () => clearInterval(interval)
  }, [mode, maxStep])

  const leftIndex = mode === "opposite" ? step : 0
  const rightIndex = mode === "opposite" ? values.length - 1 - step : step

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
                {isRight && !(mode === "same-direction" && isLeft) && (
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
      <p className="text-[11px] text-gray-500 mt-3">
        {mode === "opposite"
          ? "L and R start at opposite ends and step toward each other."
          : "L stays behind while R scans ahead — the window between them grows and shrinks as needed."}
      </p>
    </div>
  )
}
