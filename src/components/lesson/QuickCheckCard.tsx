import { useState } from "react"
import type { QuickCheckContent } from "../../learning/types"

/** Reusable MCQ card (PART 15 — used sparingly, at most once per checkpoint).
 * Same interaction pattern as the legacy LessonReader's inline quick check,
 * extracted so the new Lesson Workspace doesn't duplicate it. */
export default function QuickCheckCard({ quickCheck }: { quickCheck: QuickCheckContent }) {
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const isCorrect = selected === quickCheck.correctIndex

  return (
    <div className="rounded-2xl bg-[#092218] border border-[#1DB584]/30 p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E2B44A]/20 text-[#E2B44A]">Quick Check</span>
      </div>
      <h4 className="text-sm font-bold mb-3 leading-snug">{quickCheck.question}</h4>

      <div className="space-y-2 mb-4">
        {quickCheck.options.map((opt, idx) => {
          const isSelected = selected === idx
          const isCorrectOption = idx === quickCheck.correctIndex
          let style = "bg-white/5 border-white/10 hover:bg-white/10 text-gray-200"
          if (submitted) {
            if (isCorrectOption) style = "bg-[#1DB584]/20 border-[#1DB584] text-white font-bold"
            else if (isSelected) style = "bg-red-500/20 border-red-500 text-red-200"
          } else if (isSelected) {
            style = "bg-[#1DB584]/20 border-[#1DB584] text-white"
          }
          return (
            <button
              key={idx}
              onClick={() => !submitted && setSelected(idx)}
              className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all flex items-center justify-between gap-2 ${style}`}
            >
              <span>{opt}</span>
              {submitted && isCorrectOption && <span className="text-[#1DB584] font-black">✓</span>}
            </button>
          )
        })}
      </div>

      {!submitted ? (
        <button
          onClick={() => setSubmitted(true)}
          disabled={selected === null}
          className="px-5 py-2 rounded-xl font-bold text-xs bg-[#1DB584] hover:bg-[#159a6f] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          Confirm Answer
        </button>
      ) : (
        <div className={`p-3 rounded-xl text-xs leading-relaxed ${isCorrect ? "bg-[#1DB584]/15 border border-[#1DB584]/40 text-emerald-200" : "bg-amber-500/15 border border-amber-500/40 text-amber-200"}`}>
          <p className="font-bold mb-1">{isCorrect ? "Correct!" : "Not quite:"}</p>
          <p>{quickCheck.explanation}</p>
        </div>
      )}
    </div>
  )
}
