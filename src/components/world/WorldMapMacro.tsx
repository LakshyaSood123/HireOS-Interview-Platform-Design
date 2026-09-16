import type { ProgressState } from "../../learning/types"
import type { Course } from "../../learning/types"
import { ZONE_ORDER, getZoneScenicSpec } from "../../learning/scenic/zoneScenicSpecs"
import { buildTrailPath } from "./trailPath"

interface WorldMapMacroProps {
  course: Course
  zoneStates: Record<string, ProgressState>
  moduleStates: Record<string, ProgressState>
  activeZoneId: string
  onSelectZone: (zoneId: string) => void
}

const ENVIRONMENT_TINT: Record<string, string> = {
  foothills: "#8BB07A",
  meadow: "#79A84B",
  "montane-forest": "#5B8854",
  "deep-forest": "#3D6647",
  highlands: "#6B7E68",
  peaks: "#93A3A1",
  summit: "#D9E3E5",
}

const STATE_BADGE: Record<ProgressState, string> = {
  locked: "bg-gray-200 text-gray-500",
  available: "bg-[#E2EED5] text-[#234E35]",
  current: "bg-[#1DB584] text-white",
  completed: "bg-[#1DB584]/20 text-[#128A5B]",
  mastered: "bg-[#E2B44A]/25 text-[#8A6212]",
}

/** Strategic overview — PART 1/10: "Macro world map = ZONES. Not 28 tiny
 * module labels." Shows 7 zone nodes along one rising trail (altitude
 * increases left-to-right / bottom-to-top, matching the foothills->summit
 * environmental progression), each with a progress badge and a hover/click
 * summary card — never individual module pins. */
export default function WorldMapMacro({ course, zoneStates, moduleStates, activeZoneId, onSelectZone }: WorldMapMacroProps) {
  // Rising diagonal placement, left (low altitude) to right (summit).
  const positions = ZONE_ORDER.map((zoneId, i) => ({
    zoneId,
    x: 8 + (84 / (ZONE_ORDER.length - 1)) * i,
    y: 82 - (64 / (ZONE_ORDER.length - 1)) * i,
  }))
  const trailD = buildTrailPath(positions.map(p => ({ x: p.x, y: p.y })))

  return (
    <div className="relative w-full h-full bg-gradient-to-tr from-[#CFDFBA] via-[#B9D6C9] to-[#E4EEF2] overflow-hidden">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none">
        <path d={trailD} fill="none" stroke="#4D6643" strokeWidth="1" strokeLinecap="round" opacity="0.3" />
        <path d={trailD} fill="none" stroke="#7C6650" strokeWidth="0.4" strokeDasharray="1 1.2" opacity="0.45" />
      </svg>

      <div className="absolute inset-0">
        {positions.map(({ zoneId, x, y }) => {
          const spec = getZoneScenicSpec(zoneId)
          const zone = course.zones.find(z => z.id === zoneId)
          const state = zoneStates[zoneId] ?? "locked"
          const enterable = state !== "locked"
          const completedCount = zone?.modules.filter(m => (moduleStates[m.id] ?? "locked") === "completed" || (moduleStates[m.id] ?? "locked") === "mastered").length ?? 0
          const totalCount = zone?.modules.filter(m => m.checkpoints.length > 0).length ?? 0
          const currentModule = zone?.modules.find(m => (moduleStates[m.id] ?? "locked") === "current")

          return (
            <button
              key={zoneId}
              onClick={() => enterable && onSelectZone(zoneId)}
              disabled={!enterable}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 group ${
                enterable ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div
                className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 flex items-center justify-center text-xl shadow-md transition-all ${
                  zoneId === activeZoneId
                    ? "border-[#1DB584] ring-2 ring-[#1DB584]/50 ring-offset-2"
                    : "border-white/70"
                } ${enterable ? "group-hover:scale-108" : "grayscale opacity-50"}`}
                style={{ backgroundColor: ENVIRONMENT_TINT[spec?.environment ?? "meadow"] }}
              >
                {state === "current" && (
                  <span className="absolute inset-0 rounded-full bg-[#1DB584]/30 animate-ping" />
                )}
                <span className="relative drop-shadow">{spec?.landmarks[0]?.landmarkType === "cabin" ? "🏕️" : "🏔️"}</span>
              </div>

              <span className={`text-[10px] sm:text-xs font-black px-2.5 py-0.5 rounded-full whitespace-nowrap ${STATE_BADGE[state]}`}>
                {spec?.title ?? zoneId}
              </span>

              {/* Summary card — only the active zone's stays open by default via hover; PART 10 */}
              <div className="absolute top-full mt-2 w-44 rounded-xl bg-white/95 border border-[#C2D6B8] shadow-lg p-2.5 text-left opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                <p className="text-[10px] font-black text-[#1B3F2B] mb-0.5">{spec?.title}</p>
                {totalCount > 0 ? (
                  <p className="text-[10px] text-gray-600">
                    {completedCount} / {totalCount} modules completed
                    {currentModule && (
                      <>
                        <br />
                        Current: {currentModule.title}
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-[10px] text-gray-500 italic">Not yet available</p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
