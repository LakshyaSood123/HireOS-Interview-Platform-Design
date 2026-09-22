import { useAppState } from "../../state/AppStateContext"
import OwlAvatar from "../OwlAvatar"

export default function TrailHUD() {
  const {
    reagvisView,
    setReagvisView,
    returnToHireOS,
    userXP,
    userStreak,
    simulatedReadinessScore,
  } = useAppState()

  return (
    <header className="sticky top-0 z-40 bg-[#E8EFE0]/95 backdrop-blur-md border-b border-[#C2D6B8] text-[#1E3B2B] px-4 sm:px-6 py-2.5 font-display shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* ── Left: Brand & Return to HireOS ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={returnToHireOS}
            title="Back to the HireOS home page"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 hover:bg-white border border-[#BBD4B8]/70 text-xs font-bold text-[#234E35] transition-all group shadow-2xs cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5 text-[#1DB584]"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="hidden sm:inline">HireOS</span>
          </button>

          <div className="h-4 w-[1px] bg-[#BBD4B8] hidden sm:block" />

          {/* Reagvis Labs Logo & Brand */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#5B8854] flex items-center justify-center text-sm shadow-xs flex-shrink-0 text-white font-black">
              🌿
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xs font-black uppercase text-[#477450] tracking-wider">Reagvis Labs</span>
              </div>
              <span className="text-sm font-black tracking-tight text-[#1B3F2B] block leading-tight">
                Reagvis Trails
              </span>
            </div>
          </div>
        </div>

        {/* ── Center: Primary Navigation Links (Minimal & Sleek) ── */}
        <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/70 border border-[#BBD4B8]/60 shadow-2xs">
          <button
            onClick={() => setReagvisView("intro")}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              reagvisView === "intro"
                ? "bg-[#5B8854] text-white shadow-xs"
                : "text-gray-600 hover:text-[#1E3B2B] hover:bg-white/60"
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setReagvisView("library")}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
              reagvisView === "library"
                ? "bg-[#5B8854] text-white shadow-xs"
                : "text-gray-600 hover:text-[#1E3B2B] hover:bg-white/60"
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setReagvisView("map")}
            className={`px-4 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              reagvisView === "map"
                ? "bg-[#5B8854] text-white shadow-xs"
                : "text-gray-600 hover:text-[#1E3B2B] hover:bg-white/60"
            }`}
          >
            <span>🗺️</span>
            <span>My Trail</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#1DB584] animate-ping" />
          </button>
        </nav>

        {/* ── Right: Gamification HUD (Compact & Soft) ── */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Readiness */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-[#BBD4B8]/70 shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 hidden sm:inline">Ready</span>
            <span className="text-xs font-black font-mono text-[#1DB584]">
              {simulatedReadinessScore}%
            </span>
          </div>

          {/* Streak */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-[#BBD4B8]/70 text-xs font-bold text-[#E27D4C] shadow-2xs">
            <span>🔥</span>
            <span>{userStreak}d</span>
          </div>

          {/* XP */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-[#BBD4B8]/70 text-xs font-bold text-[#D97706] shadow-2xs">
            <span>⚡</span>
            <span className="font-mono">{userXP.toLocaleString()}</span>
          </div>

          {/* Profile Mentor Avatar */}
          <button
            onClick={() => setReagvisView("intro")}
            className="w-8 h-8 rounded-full bg-white/90 border border-[#BBD4B8] shadow-xs flex items-center justify-center cursor-pointer hover:scale-105 transition-transform ml-0.5"
            title="Profile & Diagnostic Overview"
          >
            <OwlAvatar size={24} state="listening" />
          </button>
        </div>

      </div>
    </header>
  )
}
