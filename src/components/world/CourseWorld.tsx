import { useState } from "react"
import type { Course, ProgressState } from "../../learning/types"
import type { WorldCameraMode } from "../../learning/scenic/types"
import { getZoneScenicSpec } from "../../learning/scenic/zoneScenicSpecs"
import WorldMapMacro from "./WorldMapMacro"
import ZoneScene from "./ZoneScene"

interface CourseWorldProps {
  course: Course
  activeModuleId: string | null
  activeZoneId: string | null
  moduleStates: Record<string, ProgressState>
  zoneStates: Record<string, ProgressState>
  onEnterModule: (moduleId: string) => void
}

/** Top-level Course World orchestrator — owns `WorldViewState`
 * (cameraMode/activeZoneId/focusedModuleId), UI/navigation state that is
 * NOT persisted (progress stays with the learning engine, see PART 2).
 * Renders Macro (world), Zone, or Focused camera modes; Focused and Zone
 * both render the same `ZoneScene`, just with a different CSS transform —
 * there's no separate "focused view" component to keep in sync. */
export default function CourseWorld({
  course,
  activeModuleId,
  activeZoneId: engineActiveZoneId,
  moduleStates,
  zoneStates,
  onEnterModule,
}: CourseWorldProps) {
  const defaultZoneId = engineActiveZoneId ?? "basecamp"

  const [cameraMode, setCameraMode] = useState<WorldCameraMode>("focused")
  const [activeZoneId, setActiveZoneId] = useState<string>(defaultZoneId)
  const [focusedModuleId, setFocusedModuleId] = useState<string | undefined>(activeModuleId ?? undefined)

  const allModules = course.zones.flatMap(z => z.modules)
  const activeSpec = getZoneScenicSpec(activeZoneId)
  const focusedLandmark = activeSpec?.landmarks.find(l => l.moduleId === focusedModuleId)

  const handleEnterZone = (zoneId: string) => {
    setActiveZoneId(zoneId)
    setCameraMode("zone")
  }

  const handleFocusModule = (moduleId: string) => {
    setFocusedModuleId(moduleId)
    setCameraMode("focused")
  }

  // FOCUSED camera transform — derived purely from the focused landmark's
  // scenic coordinates (PART 8: "do not hardcode Trees-specific
  // transforms... derive focus from scenic coordinates"). No per-module
  // special-casing.
  const focusTransform =
    cameraMode === "focused" && focusedLandmark
      ? { transform: `scale(1.65) translate(${50 - focusedLandmark.xPercent}%, ${50 - focusedLandmark.yPercent}%)` }
      : { transform: "scale(1) translate(0%, 0%)" }

  if (cameraMode === "world") {
    return (
      <div className="relative w-full h-full">
        <WorldMapMacro
          course={course}
          zoneStates={zoneStates}
          moduleStates={moduleStates}
          activeZoneId={activeZoneId}
          onSelectZone={handleEnterZone}
        />
        <WorldCameraDock
          cameraMode={cameraMode}
          onFocused={() => setCameraMode(focusedModuleId ? "focused" : "zone")}
          onZone={() => setCameraMode("zone")}
          onWorld={() => setCameraMode("world")}
        />
      </div>
    )
  }

  if (!activeSpec) {
    return <div className="p-10 text-center text-gray-500">This zone isn't mapped yet.</div>
  }

  const zoneModules = allModules.filter(m => activeSpec.landmarks.some(l => l.moduleId === m.id))

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        className="w-full h-full transition-transform duration-700 ease-out origin-center"
        style={focusTransform}
      >
        {/* ZoneScene is data-driven by `spec` for every zone — `spec.polished`
            (Pattern Meadows/Recursive Forest today) only controls decoration
            density inside it; there's no separate placeholder component to
            keep in sync (PART 19's "structured placeholder" is this same
            renderer with lighter dressing, not a different code path). */}
        <ZoneScene
          spec={activeSpec}
          modules={zoneModules}
          moduleStates={moduleStates}
          zoneStates={zoneStates}
          onEnterModule={onEnterModule}
          onEnterZone={handleEnterZone}
        />
      </div>

      <WorldCameraDock
        cameraMode={cameraMode}
        onFocused={() => setCameraMode("focused")}
        onZone={() => setCameraMode("zone")}
        onWorld={() => setCameraMode("world")}
      />

      {/* Quick module-focus row (Zone mode only) — lets the learner pick
          which landmark to focus without leaving Course World. */}
      {cameraMode === "zone" && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-white/85 backdrop-blur-md rounded-full px-2 py-1.5 border border-white/70 shadow-md max-w-[92vw] overflow-x-auto">
          {zoneModules.map(m => (
            <button
              key={m.id}
              onClick={() => handleFocusModule(m.id)}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold text-[#234E35] hover:bg-white/80 whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              {m.icon} {m.title}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function WorldCameraDock({
  cameraMode,
  onFocused,
  onZone,
  onWorld,
}: {
  cameraMode: WorldCameraMode
  onFocused: () => void
  onZone: () => void
  onWorld: () => void
}) {
  return (
    <div className="absolute bottom-3 inset-x-0 z-30 flex justify-center pointer-events-none px-3">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[#E2EED5]/92 backdrop-blur-md border border-white/75 p-1.5 shadow-lg">
        <button
          onClick={onFocused}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            cameraMode === "focused" ? "bg-[#1DB584] text-white" : "text-gray-600 hover:bg-white/70"
          }`}
        >
          🎯 Focus
        </button>
        <button
          onClick={onZone}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            cameraMode === "zone" ? "bg-[#1DB584] text-white" : "text-gray-600 hover:bg-white/70"
          }`}
        >
          🗺️ Zone
        </button>
        <button
          onClick={onWorld}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
            cameraMode === "world" ? "bg-[#1DB584] text-white" : "text-gray-600 hover:bg-white/70"
          }`}
        >
          🏔️ View Full World Map
        </button>
      </div>
    </div>
  )
}
