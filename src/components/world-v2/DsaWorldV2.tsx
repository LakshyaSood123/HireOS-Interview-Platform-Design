import { useState } from "react"
import type {
  WorldV2ViewMode,
  MacroCameraPreset,
  ZoneCameraPreset,
} from "./worldV2Types"
import { MACRO_ZONES_V2, RECURSIVE_LANDMARKS_V2 } from "./worldV2Data"
import MacroWorldView from "./MacroWorldView"
import RecursiveForestView from "./RecursiveForestView"

interface DsaWorldV2Props {
  initialMode?: WorldV2ViewMode
  initialMacroCamera?: MacroCameraPreset
  initialZoneCamera?: ZoneCameraPreset
  className?: string
}

export default function DsaWorldV2({
  initialMode = "zone-recursive-forest",
  initialMacroCamera = "full-journey",
  initialZoneCamera = "complete-zone",
  className = "",
}: DsaWorldV2Props) {
  const [viewMode, setViewMode] = useState<WorldV2ViewMode>(initialMode)
  const [macroCamera, setMacroCamera] = useState<MacroCameraPreset>(initialMacroCamera)
  const [zoneCamera, setZoneCamera] = useState<ZoneCameraPreset>(initialZoneCamera)

  return (
    <div className={`relative w-full h-screen overflow-hidden flex flex-col bg-[#D2ECED] text-[#234E35] select-none font-display ${className}`}>
      {/* ── Main View Container: Full-Screen Scenic Immersion ── */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {viewMode === "zone-recursive-forest" ? (
          <RecursiveForestView
            landmarks={RECURSIVE_LANDMARKS_V2}
            cameraPreset={zoneCamera}
            onCameraPresetChange={setZoneCamera}
          />
        ) : (
          <MacroWorldView
            zones={MACRO_ZONES_V2}
            cameraPreset={macroCamera}
            onEnterRecursiveForest={() => setViewMode("zone-recursive-forest")}
            onSelectZoneId={(id) => {
              if (id === "recursive-forest") {
                setViewMode("zone-recursive-forest")
              }
            }}
          />
        )}
      </main>
    </div>
  )
}
