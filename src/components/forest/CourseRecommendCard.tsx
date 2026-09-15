import { useState } from "react"
import { useAppState } from "../../state/AppStateContext"

interface CourseRecommendCardProps {
  title?: string
  score?: number
  maxScore?: number
  focusAreas?: string[]
  duration?: string
  lessonsCount?: number
  courseId?: string
  compact?: boolean
  className?: string
}

export default function CourseRecommendCard({
  title = "Data Structures & Algorithms",
  score = 58,
  maxScore = 100,
  focusAreas = ["Trees & BST", "Graph Traversal", "Complexity Analysis", "Recursion Bases"],
  duration = "~2h 30m",
  lessonsCount = 6,
  courseId = "dsa-foundations",
  compact = false,
  className = "",
}: CourseRecommendCardProps) {
  const { startLearningTrail, isTransitioning } = useAppState()
  const [isHovered, setIsHovered] = useState(false)

  const progressPercent = Math.round((score / maxScore) * 100)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${
        isHovered
          ? "border-[#1DB584]/70 shadow-[0_0_35px_rgba(29,181,132,0.35)] -translate-y-1"
          : "border-[#1DB584]/30 shadow-[0_0_20px_rgba(7,26,20,0.4)]"
      } border bg-gradient-to-br from-[#0F2D21] via-[#092218] to-[#05140F] p-6 text-white ${className}`}
    >
      {/* Background ambient trailhead illumination */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB584]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-[#587A3A]/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#1DB584]/15 border border-[#1DB584]/40 text-[#1DB584]">
          <span className="w-2 h-2 rounded-full bg-[#1DB584] animate-pulse" />
          Recommended Growth Trail
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
          <span>Provider:</span>
          <span className="text-[#A7CE65] font-semibold flex items-center gap-1">
            <span className="text-sm">🧪</span> Reagvis Labs
          </span>
        </div>
      </div>

      {/* Title & Score */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-xl font-black text-white tracking-tight">{title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Diagnostic identified high-impact opportunity for your next interview
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="flex items-baseline justify-end gap-1">
            <span className="text-2xl sm:text-3xl font-black text-[#FB923C] font-mono">{score}</span>
            <span className="text-xs text-gray-400 font-medium">/{maxScore}</span>
          </div>
          <span className="text-[11px] font-bold text-[#FB923C]/90 uppercase tracking-wider">
            Struggle Detected
          </span>
        </div>
      </div>

      {/* Diagnosis Score Bar with milestone markers */}
      <div className="mb-5">
        <div className="flex justify-between text-xs text-gray-400 mb-1.5">
          <span>Current Diagnosis</span>
          <span className="text-[#1DB584] font-semibold">Target: 80+ (Interview Ready)</span>
        </div>
        <div className="h-2.5 w-full bg-black/40 rounded-full overflow-hidden border border-white/10 p-0.5 relative">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#FB923C] via-[#E2B44A] to-[#1DB584] transition-all duration-700"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Target marker line at 80% */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/70 shadow-[0_0_4px_white]"
            style={{ left: "80%" }}
            title="Interview Ready Threshold (80%)"
          />
        </div>
      </div>

      {/* Focus Areas Pill list */}
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
          Observed Focus Areas:
        </p>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map((area, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-200"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#1DB584]" />
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* Trail Details & CTA */}
      <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-xs text-gray-300 w-full sm:w-auto">
          <span className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-md border border-white/5">
            <span>🗺️</span> {lessonsCount} Trail Landmarks
          </span>
          <span className="inline-flex items-center gap-1.5 bg-black/30 px-2.5 py-1 rounded-md border border-white/5">
            <span>⏱️</span> {duration}
          </span>
        </div>

        <button
          onClick={() => startLearningTrail(courseId)}
          disabled={isTransitioning}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/25 hover:shadow-[#1DB584]/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
        >
          <span>🌿 Start DSA Learning Trail</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Owl guide quote */}
      {!compact && (
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-3 text-xs text-emerald-200/80 bg-emerald-950/40 rounded-xl px-3.5 py-2.5">
          <span className="text-base flex-shrink-0">🦉</span>
          <span className="italic">
            &ldquo;I found the exact trail where you can master trees and graph traversals before your next interview.&rdquo;
          </span>
        </div>
      )}
    </div>
  )
}
