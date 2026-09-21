import { useState } from "react"
import { useFeedback } from "../../feedback/FeedbackContext"

interface LessonQuickFeedbackProps {
  checkpointTitle?: string
}

export default function LessonQuickFeedback({ checkpointTitle }: LessonQuickFeedbackProps) {
  const { openFeedback, submitFeedback } = useFeedback()
  const [rated, setRated] = useState<"helpful" | "needs-work" | null>(null)

  const handleVote = async (vote: "helpful" | "needs-work") => {
    setRated(vote)
    const ratingValue = vote === "helpful" ? 3 : 1
    // Immediately log the quick sentiment record with full current checkpoint context
    await submitFeedback(
      vote === "helpful" ? "suggestion" : "confusing",
      vote === "helpful" ? "Quick feedback: Lesson was helpful" : "Quick feedback: Lesson needs work",
      ratingValue,
      true,
    )
  }

  return (
    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
      <span className="font-semibold text-gray-300 flex items-center gap-1.5">
        <span>🌲</span>
        <span>Was this lesson helpful?</span>
      </span>

      {rated === null ? (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleVote("helpful")}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[#1DB584]/20 border border-white/10 hover:border-[#1DB584]/50 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Yes, this lesson was clear and helpful"
          >
            <span>👍</span>
            <span>Yes</span>
          </button>
          <button
            onClick={() => handleVote("needs-work")}
            className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/50 text-gray-300 hover:text-white transition-all cursor-pointer flex items-center gap-1"
            title="Not quite, this lesson could be clearer"
          >
            <span>👎</span>
            <span>Not really</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-emerald-300 text-xs animate-fade-in">
          <span>✓ Thanks for the feedback!</span>
          <button
            onClick={() => openFeedback(rated === "helpful" ? 3 : 1)}
            className="text-[11px] text-[#A7CE65] underline hover:text-white transition-colors cursor-pointer"
          >
            Add notes
          </button>
        </div>
      )}
    </div>
  )
}
