import { useState } from "react"
import type { TrailNode } from "../../data/reagvisCourses"

interface LessonReaderProps {
  node: TrailNode
  onBackToMap: () => void
  onOpenChallenge: () => void
  onCompleteLesson: () => void
}

export default function LessonReader({
  node,
  onBackToMap,
  onOpenChallenge,
  onCompleteLesson,
}: LessonReaderProps) {
  const lesson = node.lesson

  // Quick Check state
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false)

  if (!lesson) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center text-white">
        <h2 className="text-2xl font-bold mb-4">{node.title}</h2>
        <p className="text-gray-400 mb-6">Lesson content is currently under synthesis.</p>
        <button
          onClick={onBackToMap}
          className="px-6 py-2.5 rounded-xl bg-[#1DB584] text-white font-bold"
        >
          Return to Trail Map
        </button>
      </div>
    )
  }

  const handleSelectOption = (idx: number) => {
    if (!isAnswerSubmitted) {
      setSelectedOption(idx)
    }
  }

  const handleCheckAnswer = () => {
    if (selectedOption !== null) {
      setIsAnswerSubmitted(true)
    }
  }

  const isCorrect = selectedOption === lesson.quickCheck.correctIndex

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* ── Top Header ── */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-all group"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform group-hover:-translate-x-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          <span>Back to Trail Map</span>
        </button>

        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="px-2.5 py-1 rounded-md bg-[#1DB584]/20 text-[#1DB584] font-bold">
            {node.biome}
          </span>
          <span>Level {node.id} of 18</span>
        </div>
      </div>

      {/* ── Lesson Title Hero ── */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1DB584]/20 text-[#1DB584] mb-3">
          <span>📖</span> Landmark Lesson &bull; +{lesson.xp} XP
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
          {lesson.title}
        </h1>
        <p className="text-base text-emerald-200/90 leading-relaxed font-medium">
          {lesson.conceptSummary}
        </p>
      </div>

      {/* ── PARCHMENT READING CARD ── */}
      <div className="parchment-card rounded-3xl p-6 sm:p-10 mb-8 text-[#1A2621]">
        <div className="flex items-center justify-between border-b border-[#E3DEC3] pb-4 mb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-[#64452E]">
            Core Technical Concept
          </span>
          <span className="text-xs text-[#64452E]/80 font-mono">Estimated: {lesson.readTime}</span>
        </div>

        {/* Concept Text */}
        <div className="prose prose-slate max-w-none text-base sm:text-lg leading-relaxed text-[#2D3748] mb-8 whitespace-pre-line font-sans">
          {lesson.explanation}
        </div>

        {/* Code Snippet Box (if present) */}
        {lesson.codeSnippet && (
          <div className="mb-8">
            <div className="flex items-center justify-between bg-[#1A2621] text-gray-300 px-4 py-2 rounded-t-xl text-xs font-mono">
              <span>{lesson.codeSnippet.language.toUpperCase()} &bull; Pattern Implementation</span>
              <span className="text-emerald-400">O(1) Auxiliary Space</span>
            </div>
            <pre className="bg-[#0D1E17] text-emerald-300 p-4 sm:p-6 rounded-b-xl overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed border border-emerald-950">
              <code>{lesson.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        {/* ── INTERVIEW TIP BLOCK (Signature HireOS ➔ Reagvis Link) ── */}
        <div className="rounded-2xl bg-[#E6F9F3] border-2 border-[#1DB584]/40 p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3.5">
            <span className="text-2xl flex-shrink-0">🦉</span>
            <div>
              <h4 className="text-sm font-black text-[#0F9269] uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>🎤 HireOS Interviewer Tip</span>
                <span className="px-2 py-0.5 rounded text-[10px] bg-[#1DB584] text-white">Critical</span>
              </h4>
              <p className="text-sm text-[#0B3A29] leading-relaxed font-medium">
                {lesson.interviewTip}
              </p>
            </div>
          </div>
        </div>

        {/* Pitfall Box */}
        <div className="rounded-2xl bg-[#FFF7ED] border border-[#FB923C]/30 p-4 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-[#C2410C] mb-0.5">
              Common Candidate Pitfall
            </h5>
            <p className="text-xs text-[#7C2D12] leading-relaxed">
              {lesson.commonPitfall}
            </p>
          </div>
        </div>
      </div>

      {/* ── QUICK CHECK CARD ── */}
      <div className="rounded-3xl bg-[#092218] border border-[#1DB584]/30 p-6 sm:p-8 mb-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#E2B44A]/20 text-[#E2B44A]">
            Quick Check
          </span>
          <span className="text-xs text-gray-400">Verify understanding</span>
        </div>

        <h3 className="text-lg font-bold text-white mb-4 leading-snug">
          {lesson.quickCheck.question}
        </h3>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {lesson.quickCheck.options.map((opt, idx) => {
            const isSelected = selectedOption === idx
            const isCorrectOption = idx === lesson.quickCheck.correctIndex

            let btnStyle = "bg-white/5 border-white/10 hover:bg-white/10 text-gray-200"
            if (isAnswerSubmitted) {
              if (isCorrectOption) {
                btnStyle = "bg-[#1DB584]/20 border-[#1DB584] text-white font-bold"
              } else if (isSelected && !isCorrect) {
                btnStyle = "bg-red-500/20 border-red-500 text-red-200"
              }
            } else if (isSelected) {
              btnStyle = "bg-[#1DB584]/20 border-[#1DB584] text-white"
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between gap-3 ${btnStyle}`}
              >
                <span>{opt}</span>
                {isAnswerSubmitted && isCorrectOption && (
                  <span className="text-[#1DB584] font-black">✓ Correct</span>
                )}
                {isAnswerSubmitted && isSelected && !isCorrect && (
                  <span className="text-red-400 font-black">✗ Incorrect</span>
                )}
              </button>
            )
          })}
        </div>

        {/* Action / Explanation */}
        {!isAnswerSubmitted ? (
          <button
            onClick={handleCheckAnswer}
            disabled={selectedOption === null}
            className="px-6 py-2.5 rounded-xl font-bold text-xs bg-[#1DB584] hover:bg-[#159a6f] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Confirm Answer
          </button>
        ) : (
          <div
            className={`p-4 rounded-xl text-xs leading-relaxed ${
              isCorrect
                ? "bg-[#1DB584]/15 border border-[#1DB584]/40 text-emerald-200"
                : "bg-amber-500/15 border border-amber-500/40 text-amber-200"
            }`}
          >
            <p className="font-bold mb-1">{isCorrect ? "Well reasoned!" : "Almost there:"}</p>
            <p>{lesson.quickCheck.explanation}</p>
          </div>
        )}
      </div>

      {/* ── Bottom CTAs ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
        <button
          onClick={onBackToMap}
          className="text-xs font-semibold text-gray-400 hover:text-white"
        >
          Return to Trail Map
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {lesson.challenge ? (
            <button
              onClick={onOpenChallenge}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>⚔️ Enter Live Practice Challenge</span>
              <span>➔</span>
            </button>
          ) : (
            <button
              onClick={onCompleteLesson}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-xs text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>Complete Landmark (+{lesson.xp} XP)</span>
              <span>➔</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
