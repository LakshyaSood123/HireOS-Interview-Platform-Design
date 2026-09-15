import OwlAvatar from "../OwlAvatar"
import { useAppState } from "../../state/AppStateContext"
import { DEVELOPMENT_MODE } from "../../config/developmentMode"

interface UnlockCelebrationProps {
  onReturnToMap: () => void
  onRetakeInterview: () => void
}

export default function UnlockCelebration({
  onReturnToMap,
  onRetakeInterview,
}: UnlockCelebrationProps) {
  const { simulatedReadinessScore } = useAppState()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-lg animate-fade-up">
      {/* Background bioluminescent celebratory radial */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#1DB584]/20 blur-[100px] pointer-events-none animate-pulse" />

      <div className="relative w-full max-w-lg rounded-3xl bg-gradient-to-b from-[#0F3524] via-[#092218] to-[#05140F] border border-[#1DB584]/50 p-6 sm:p-8 text-center text-white shadow-[0_0_60px_rgba(29,181,132,0.35)]">
        {/* Mascot */}
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-[#1DB584]/20 border border-[#1DB584]/40">
            <OwlAvatar size={100} state="celebrating" className="drop-shadow-xl" />
          </div>
        </div>

        {/* Celebration Title */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#E2B44A]/20 text-[#E2B44A] border border-[#E2B44A]/40 mb-3">
          <span>🏆</span> Landmark Completed &bull; +120 XP
        </div>

        <h2 className="text-3xl font-black text-white tracking-tight mb-2">
          Sorting Clearing Conquered!
        </h2>
        <p className="text-sm text-emerald-200/90 leading-relaxed mb-6">
          You mastered Two-Pointer trade-offs and Hash Table indexing. The River Crossing Timber Bridge is now open!
        </p>

        {/* Progress Delta Box */}
        <div className="bg-black/40 rounded-2xl border border-white/10 p-4 mb-6">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
            <span>HireOS Interview Readiness</span>
            <span className="text-[#A7CE65] font-bold">+16% Gained</span>
          </div>
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="text-center">
              <span className="text-xs text-gray-500 block">Initial Diagnosis</span>
              <span className="text-2xl font-black text-[#FB923C] font-mono">58%</span>
            </div>
            <span className="text-xl text-[#1DB584]">➔</span>
            <div className="text-center">
              <span className="text-xs text-emerald-400 font-bold block">Current Readiness</span>
              <span className="text-3xl font-black text-[#1DB584] font-mono animate-score-bounce">
                {simulatedReadinessScore}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-[#FB923C] to-[#1DB584] transition-all duration-1000"
              style={{ width: `${simulatedReadinessScore}%` }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReturnToMap}
            className="flex-1 py-3 px-5 rounded-xl text-xs font-bold text-gray-200 bg-white/10 hover:bg-white/15 border border-white/15 transition-all cursor-pointer"
          >
            🗺️ Explore River Crossing Map
          </button>
          <button
            onClick={DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? onRetakeInterview : onReturnToMap}
            className="flex-1 py-3 px-5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-lg shadow-[#1DB584]/30 hover:scale-105 transition-all cursor-pointer"
          >
            {DEVELOPMENT_MODE.INTERVIEW_FLOW_ENABLED ? "🎤 Retake HireOS Interview" : "🚀 Continue Learning"}
          </button>
        </div>
      </div>
    </div>
  )
}
