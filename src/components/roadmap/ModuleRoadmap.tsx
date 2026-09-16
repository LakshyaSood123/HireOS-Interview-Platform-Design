import type { Module, ProgressState } from "../../learning/types"

interface ModuleRoadmapProps {
  module: Module
  checkpointStates: Record<string, ProgressState>
  onEnterCheckpoint: (checkpointId: string) => void
  onBack: () => void
}

const STATE_BADGE: Record<ProgressState, { label: string; className: string }> = {
  locked: { label: "Locked", className: "bg-gray-100 text-gray-500 border-gray-200" },
  available: { label: "Available", className: "bg-[#E2EED5] text-[#234E35] border-[#BBD4B8]" },
  current: { label: "Current", className: "bg-[#1DB584] text-white border-[#1DB584]" },
  completed: { label: "Completed", className: "bg-[#1DB584]/15 text-[#128A5B] border-[#1DB584]/30" },
  mastered: { label: "Mastered", className: "bg-[#E2B44A]/20 text-[#8A6212] border-[#E2B44A]/50" },
}

/** Data-driven module roadmap — reused by any module that adopts the new
 * Lesson Workspace content model (Trees today, DBMS/OS/etc. later). Renders
 * whatever checkpoints + states it's given; no per-checkpoint wiring. Reuses
 * the app's existing cream/forest-green palette instead of the Alpine
 * scenic map's SVG art — this is a focused reading/navigation screen, not a
 * second scenic world (see PART 27: "clean, not another scenic-map
 * redesign"). */
export default function ModuleRoadmap({ module, checkpointStates, onEnterCheckpoint, onBack }: ModuleRoadmapProps) {
  return (
    <div className="min-h-screen bg-[#CFDFBA] font-display text-[#1E3B2B]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-[#234E35] hover:text-[#1B3F2B] mb-6"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="w-3.5 h-3.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Course World
        </button>

        <div className="rounded-[28px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-6 sm:p-8 shadow-[0_20px_50px_rgba(40,65,45,0.10)] mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-2xs flex-shrink-0"
              style={{ backgroundColor: `${module.accentColor}22`, border: `1px solid ${module.accentColor}55` }}
            >
              {module.icon}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#1B3F2B] tracking-tight">{module.title}</h1>
              <p className="text-sm text-gray-600 mt-1">{module.description}</p>
            </div>
          </div>
        </div>

        <ol className="relative space-y-4">
          {module.checkpoints.map((checkpoint, index) => {
            const state = checkpointStates[checkpoint.id] ?? "locked"
            const badge = STATE_BADGE[state]
            const enterable = state !== "locked"
            const prevTitle = index > 0 ? module.checkpoints[index - 1].title : null

            return (
              <li key={checkpoint.id} className="relative">
                {index < module.checkpoints.length - 1 && (
                  <div className="absolute left-5 top-14 bottom-[-1rem] w-0.5 bg-[#BDD4B6]" aria-hidden="true" />
                )}
                <button
                  onClick={() => enterable && onEnterCheckpoint(checkpoint.id)}
                  disabled={!enterable}
                  className={`w-full text-left rounded-2xl border p-4 sm:p-5 flex items-start gap-4 transition-all shadow-2xs ${
                    enterable
                      ? "bg-white/90 border-[#C2D6B8] hover:bg-white hover:shadow-md cursor-pointer"
                      : "bg-white/50 border-[#D8E4D2] opacity-70 cursor-not-allowed"
                  } ${state === "current" ? "ring-2 ring-[#1DB584] ring-offset-2 ring-offset-[#CFDFBA]" : ""}`}
                >
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 ${
                      state === "completed" || state === "mastered"
                        ? "bg-[#1DB584] text-white"
                        : state === "current"
                          ? "bg-white text-[#1DB584] border-2 border-[#1DB584]"
                          : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {state === "completed" || state === "mastered" ? "✓" : state === "locked" ? "🔒" : index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-black text-[#1B3F2B]">{checkpoint.title}</h3>
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${badge.className}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{checkpoint.subtitle}</p>
                    {state === "locked" && prevTitle ? (
                      <p className="text-[11px] text-gray-500 mt-1.5 italic">Complete "{prevTitle}" first to unlock this checkpoint.</p>
                    ) : (
                      <p className="text-[11px] text-[#1DB584] font-bold mt-1.5">
                        +{checkpoint.xp}
                        {checkpoint.masteryXp ? ` (+${checkpoint.masteryXp} mastery)` : ""} XP
                      </p>
                    )}
                  </div>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
