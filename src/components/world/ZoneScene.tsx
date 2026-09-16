import type { ZoneScenicSpec, ZoneEnvironment } from "../../learning/scenic/types"
import type { ProgressState } from "../../learning/types"
import type { Module } from "../../learning/types"
import ZoneLandmark from "./ZoneLandmark"
import ZoneGateway from "./ZoneGateway"
import AlpineMountainRange from "../forest/scenic/AlpineMountainRange"
import AlpinePineTree from "../forest/scenic/AlpinePineTree"
import SoftCloud from "../forest/scenic/SoftCloud"
import { AlpineGoat, MeadowCow, SoaringBird } from "../forest/scenic/ScenicAnimals"
import { buildTrailPath } from "./trailPath"

interface ZoneSceneProps {
  spec: ZoneScenicSpec
  modules: Module[]
  moduleStates: Record<string, ProgressState>
  zoneStates: Record<string, ProgressState>
  onEnterModule: (moduleId: string) => void
  onEnterZone: (zoneId: string) => void
}

const ENVIRONMENT_SKY: Record<ZoneEnvironment, string> = {
  foothills: "from-[#DDEEEF] to-[#CFDFBA]",
  meadow: "from-[#D2ECED] to-[#C7E0AC]",
  "montane-forest": "from-[#C3DEDD] to-[#A8C99A]",
  "deep-forest": "from-[#B7D3D2] to-[#8FB585]",
  highlands: "from-[#C9D8D6] to-[#9FB09D]",
  peaks: "from-[#E4EEF2] to-[#C7D2CE]",
  summit: "from-[#EEF6FA] to-[#D9E3E5]",
}

/** One data-driven meso (zone) scenic view, reused by every zone via its
 * `ZoneScenicSpec` (PART 3 — "the scenic coordinates must be DATA, not
 * hardcoded per zone"). `spec.polished` adds richer decoration (more trees/
 * wildlife/cloud layers); every zone still gets the same real landmark
 * art, trail, and gateway — the polish gap is decoration density, not
 * missing functionality. */
export default function ZoneScene({ spec, modules, moduleStates, zoneStates, onEnterModule, onEnterZone }: ZoneSceneProps) {
  const landmarksBySpec = spec.landmarks
    .map(landmarkSpec => ({
      landmarkSpec,
      module: modules.find(m => m.id === landmarkSpec.moduleId),
    }))
    .filter((entry): entry is { landmarkSpec: typeof spec.landmarks[number]; module: Module } => Boolean(entry.module))

  const trailPoints = landmarksBySpec.map(({ landmarkSpec }) => ({ x: landmarkSpec.xPercent, y: landmarkSpec.yPercent }))
  const trailD = buildTrailPath(trailPoints)

  return (
    <div className={`relative w-full h-full bg-gradient-to-b ${ENVIRONMENT_SKY[spec.environment]} overflow-hidden`}>
      {/* Background mountain silhouette + atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <AlpineMountainRange className="absolute -bottom-4 inset-x-0 w-full opacity-90" />
        <SoftCloud scale={0.9} className="absolute left-[8%] top-4 opacity-85 animate-float-slow" />
        <SoftCloud scale={0.7} className="absolute right-[12%] top-8 opacity-70 animate-float" />
        {spec.polished && (
          <>
            <SoftCloud scale={0.6} className="absolute left-[45%] top-2 opacity-60 animate-float-slow" />
            <SoaringBird scale={0.7} className="absolute left-[30%] top-10 opacity-55" />
          </>
        )}
      </div>

      {/* Trail connecting every landmark in course order */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full pointer-events-none z-5">
        <path d={trailD} fill="none" stroke="#4D6643" strokeWidth="1.4" strokeLinecap="round" opacity="0.35" />
        <path d={trailD} fill="none" stroke="#7C6650" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="1.2 1" opacity="0.5" />
        {spec.exitThreshold && (
          <path
            d={buildTrailPath([...trailPoints.slice(-1), { x: spec.exitThreshold.xPercent, y: spec.exitThreshold.yPercent }])}
            fill="none"
            stroke="#4D6643"
            strokeWidth="1.2"
            strokeLinecap="round"
            opacity="0.3"
          />
        )}
      </svg>

      {/* Ambient decoration — richer for polished zones */}
      {spec.polished && (
        <>
          <div className="absolute left-4 bottom-4 pointer-events-none hidden sm:block">
            <AlpinePineTree variant="grove" scale={1.1} />
          </div>
          <div className="absolute right-4 bottom-4 pointer-events-none hidden sm:block">
            <AlpinePineTree variant="grove" scale={1.05} />
          </div>
          <div className="absolute left-[55%] bottom-[8%] pointer-events-none hidden md:block opacity-90">
            <MeadowCow scale={0.6} />
          </div>
          <div className="absolute left-[15%] top-[30%] pointer-events-none hidden md:block">
            <AlpineGoat scale={0.65} />
          </div>
        </>
      )}

      {/* Landmarks */}
      <div className="absolute inset-0 z-20">
        {landmarksBySpec.map(({ landmarkSpec, module }) => {
          const state = moduleStates[module.id] ?? "locked"
          const enterable = state !== "locked"
          return (
            <button
              key={module.id}
              onClick={() => enterable && onEnterModule(module.id)}
              disabled={!enterable}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1 group ${
                enterable ? "cursor-pointer" : "cursor-not-allowed"
              }`}
              style={{ left: `${landmarkSpec.xPercent}%`, top: `${landmarkSpec.yPercent}%` }}
            >
              <ZoneLandmark landmarkType={landmarkSpec.landmarkType} state={state} label={module.title} scale={state === "current" ? 1.12 : 1} />
              <span
                className={`mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap shadow-xs ${
                  state === "current"
                    ? "bg-[#1DB584] text-white"
                    : state === "completed" || state === "mastered"
                      ? "bg-white/90 text-[#214A32] border border-[#C2DAC0]"
                      : state === "available"
                        ? "bg-[#E2EED5] text-[#234E35] border border-[#BBD4B8]"
                        : "bg-white/70 text-gray-500 border border-white/60"
                }`}
              >
                {module.title}
              </span>
            </button>
          )
        })}
      </div>

      {/* Zone exit gateway */}
      {spec.exitThreshold && (
        <ZoneGateway
          threshold={spec.exitThreshold}
          targetZoneState={zoneStates[spec.exitThreshold.targetZoneId] ?? "locked"}
          onEnter={() => onEnterZone(spec.exitThreshold!.targetZoneId)}
        />
      )}
    </div>
  )
}
