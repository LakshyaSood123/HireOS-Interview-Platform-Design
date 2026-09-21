import { useTrailGuide } from "../../assistant/TrailGuideContext"
import { useFeedback } from "../../feedback/FeedbackContext"
import { useAppState } from "../../state/AppStateContext"

/**
 * Coherent utility cluster on the right edge:
 * Stacks [ Trail Guide ] and [ Feedback ] without collisions.
 * 
 * Coordinates open/close states so opening Trail Guide closes Feedback
 * and vice-versa, ensuring zero z-index chaos or overlapping panels.
 */
export default function TrailUtilityCluster() {
  const {
    isOpen: isGuideOpen,
    openGuide,
    closeGuide,
  } = useTrailGuide()

  const {
    isOpen: isFeedbackOpen,
    openFeedback,
    closeFeedback,
  } = useFeedback()

  const { activeProduct, reagvisView, viewedCheckpointId, viewedModuleId } = useAppState()

  // If any drawer is open, keep launchers hidden to avoid visual clutter
  if (isGuideOpen || isFeedbackOpen) return null

  // Trail Guide is available in all learning contexts:
  // - inside any lesson workspace / checkpoint (concept, animation, quick check, coding)
  // - on module roadmap
  // - on reagvis learning trails
  const showTrailGuide =
    Boolean(viewedCheckpointId) ||
    Boolean(viewedModuleId) ||
    reagvisView === "workspace" ||
    reagvisView === "lesson" ||
    reagvisView === "challenge" ||
    reagvisView === "roadmap" ||
    reagvisView === "map" ||
    activeProduct === "reagvis"

  const handleOpenGuide = () => {
    closeFeedback()
    openGuide()
  }

  const handleOpenFeedback = () => {
    closeGuide()
    openFeedback()
  }

  return (
    <div className="fixed bottom-13 right-4 sm:bottom-14 sm:right-6 z-40 pointer-events-auto flex flex-col items-end gap-2">
      {/* ── 1. TRAIL GUIDE LAUNCHER (LEARNING COMPANION) ── */}
      {showTrailGuide && (
        <button
          onClick={handleOpenGuide}
          aria-label="Ask Trail Guide"
          className="group flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#082319]/95 hover:bg-[#0C3425] text-gray-200 hover:text-white border border-[#1DB584]/40 hover:border-[#1DB584] shadow-lg shadow-black/50 hover:shadow-[0_0_20px_rgba(29,181,132,0.3)] backdrop-blur-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584]/60"
        >
          {/* Glowing Compass Badge */}
          <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-[#1DB584]/20 border border-[#1DB584]/40 text-emerald-300 text-xs transition-transform group-hover:scale-110">
            <span className="text-[11px] leading-none">🧭</span>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#E2B44A] animate-pulse" />
          </span>

          <span className="text-xs font-bold tracking-wide font-display">Trail Guide</span>

          <span className="text-[10px] text-[#A7CE65] opacity-75 group-hover:opacity-100 transition-opacity hidden md:inline">
            ⛰️
          </span>
        </button>
      )}

      {/* ── 2. FEEDBACK LAUNCHER (TRAIL JOURNAL) ── */}
      <button
        onClick={handleOpenFeedback}
        aria-label="Share Trail Feedback"
        className="group flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#072016]/90 hover:bg-[#0A2D20] text-gray-400 hover:text-white border border-white/15 hover:border-[#1DB584]/50 shadow-md shadow-black/40 hover:shadow-[0_0_15px_rgba(29,181,132,0.2)] backdrop-blur-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#1DB584]/60"
      >
        <span className="relative flex items-center justify-center w-4 h-4 rounded-full bg-[#E2B44A]/15 border border-[#E2B44A]/30 text-[#E2B44A] text-[10px] transition-transform group-hover:scale-110">
          <span>🌲</span>
        </span>

        <span className="text-[11px] font-bold tracking-wide font-display">Feedback</span>
      </button>
    </div>
  )
}
