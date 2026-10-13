// The curriculum section of a Course Home: zones, each with its module cards.
// One implementation for every course. It renders whatever zones it is given,
// so each course shows only its OWN curriculum. State labels and the demo
// "preview" badge mirror what the original DSA module list showed.

import type { Module, ProgressState, Zone } from "../../learning/types"

interface CourseCurriculumProps {
  zones: Pick<Zone, "id" | "title" | "description" | "modules">[]
  moduleStates: Record<string, ProgressState>
  /** Locked modules that may still be opened as a read-only demo preview. */
  previewModuleIds?: readonly string[]
  /** Hide zone headings (used for flat courses with a single unnamed group). */
  hideZoneTitles?: boolean
  onEnterModule: (module: Module, state: ProgressState) => void
}

const BADGE: Record<ProgressState, string> = {
  completed: "bg-[#1DB584]/15 text-[#128A5B]",
  mastered: "bg-[#1DB584]/15 text-[#128A5B]",
  current: "bg-[#1DB584] text-white",
  available: "bg-[#E2EED5] text-[#234E35]",
  locked: "bg-gray-200 text-gray-500",
}

export default function CourseCurriculum({
  zones,
  moduleStates,
  previewModuleIds = [],
  hideZoneTitles = false,
  onEnterModule,
}: CourseCurriculumProps) {
  const visibleZones = zones
    .map(zone => ({ ...zone, modules: zone.modules.filter(m => m.checkpoints.length > 0) }))
    .filter(zone => zone.modules.length > 0)

  if (visibleZones.length === 0) {
    return <p className="text-sm text-gray-500 py-6 text-center">This course has no lessons yet.</p>
  }

  return (
    <div>
      {visibleZones.map(zone => (
        <div key={zone.id} className="mb-8">
          {!hideZoneTitles && (
            <div className="mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-500">{zone.title}</h4>
              {zone.description && <p className="text-[11px] text-gray-500 mt-0.5">{zone.description}</p>}
            </div>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {zone.modules.map(module => {
              const state = moduleStates[module.id] ?? "locked"
              const previewable = state === "locked" && previewModuleIds.includes(module.id)
              const enterable = state !== "locked" || previewable
              return (
                <button
                  key={module.id}
                  onClick={() => enterable && onEnterModule(module, state)}
                  disabled={!enterable}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    enterable
                      ? "bg-white/90 border-[#C2D6B8] hover:bg-white hover:shadow-md cursor-pointer"
                      : "bg-white/40 border-[#D8E4D2] opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className="text-lg">{module.icon}</span>
                    <span className="text-sm font-black text-[#1B3F2B]">{module.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug mb-2">{module.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${BADGE[state]}`}>
                      {state === "locked" ? "🔒 Locked" : state}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {module.checkpoints.length} lesson{module.checkpoints.length === 1 ? "" : "s"}
                    </span>
                    {previewable && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#2563EB] border border-[#3B82F6]/30">
                        Demo Preview 👁️
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
