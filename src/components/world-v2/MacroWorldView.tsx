import { useState } from "react"
import type { MacroZoneData, MacroCameraPreset } from "./worldV2Types"
import WorldV2Sky from "./scenic/WorldV2Sky"
import MacroWorldLandscape from "./scenic/MacroWorldLandscape"

interface MacroWorldViewProps {
  zones: MacroZoneData[]
  cameraPreset: MacroCameraPreset
  onEnterRecursiveForest: () => void
  onSelectZoneId?: (zoneId: string) => void
  className?: string
}

export default function MacroWorldView({
  zones,
  cameraPreset,
  onEnterRecursiveForest,
  onSelectZoneId,
  className = "",
}: MacroWorldViewProps) {
  const [selectedZone, setSelectedZone] = useState<MacroZoneData | null>(
    zones.find((z) => z.state === "current") || zones[0]
  )

  // Camera transforms for Macro World
  // Full journey: 100% overview
  // Recursive forest focus: centered on Zone 4 at (720, 430)
  const cameraTransform =
    cameraPreset === "recursive-forest-focus"
      ? "scale(1.65) translate(0%, 1.8%)"
      : "scale(1) translate(0%, 0%)"

  const handleSelectZone = (zone: MacroZoneData) => {
    setSelectedZone(zone)
    onSelectZoneId?.(zone.id)
  }

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-[#071A14] ${className}`}>
      {/* Viewport Layer with Smooth Camera Transform */}
      <div
        className="w-full h-full relative transition-transform duration-700 ease-out origin-center"
        style={{ transform: cameraTransform }}
      >
        <MacroWorldLandscape
          zones={zones}
          activeZoneId={selectedZone?.id ?? null}
          onSelectZone={handleSelectZone}
          onEnterRecursiveForest={onEnterRecursiveForest}
        />
      </div>

      {/* Atmospheric Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_90px_rgba(7,26,20,0.5)]" />

      {/* Floating Zone Inspection Card (Bottom Right to Avoid Blocking Trailhead) */}
      {selectedZone && (
        <div className="absolute bottom-6 right-6 z-20 max-w-sm w-full bg-[#0B241A]/92 backdrop-blur-md border border-[#1DB584]/30 rounded-2xl p-5 shadow-2xl animate-fade-up">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1B4D36] text-[#34D399] tracking-wider uppercase">
                Zone {selectedZone.index} of 7
              </span>
              <span className="text-xs font-mono text-[#94A3B8]">
                {selectedZone.elevation}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                selectedZone.state === "current"
                  ? "bg-[#D97706]/25 text-[#FBBF24] border border-[#F59E0B]/50"
                  : selectedZone.state === "completed"
                    ? "bg-[#059669]/20 text-[#34D399] border border-[#10B981]/30"
                    : "bg-[#334155]/30 text-[#94A3B8] border border-[#475569]/30"
              }`}
            >
              {selectedZone.state === "current"
                ? "Current Expedition"
                : selectedZone.state === "completed"
                  ? "Completed ✓"
                  : "Locked 🔒"}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white font-display mb-0.5">
            {selectedZone.name}
          </h3>
          <p className="text-xs text-[#E2E8F0] font-medium mb-3">
            {selectedZone.subtitle}
          </p>

          <div className="text-xs text-[#94A3B8] space-y-1.5 border-t border-[#1B4D36]/40 pt-3 mb-4">
            <p>
              <span className="text-[#6EE7B7] font-semibold">Terrain: </span>
              {selectedZone.terrainDescription}
            </p>
            <p>
              <span className="text-[#6EE7B7] font-semibold">Curriculum: </span>
              {selectedZone.curriculumSummary}
            </p>
          </div>

          {selectedZone.id === "recursive-forest" ? (
            <button
              onClick={onEnterRecursiveForest}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-[#F59E0B] to-[#D97706] hover:from-[#D97706] hover:to-[#B45309] text-white font-bold text-xs rounded-xl shadow-lg shadow-[#F59E0B]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Enter Recursive Forest Reference Zone</span>
              <span>→</span>
            </button>
          ) : selectedZone.state === "completed" ? (
            <div className="w-full py-2 px-3 bg-[#123524] text-[#A7F3D0] text-center text-xs rounded-xl font-medium border border-[#10B981]/30">
              Completed Area • Explored Territory
            </div>
          ) : (
            <div className="w-full py-2 px-3 bg-[#1E293B]/50 text-[#94A3B8] text-center text-xs rounded-xl font-medium border border-[#334155]/30">
              Ascent Restricted • Complete Prior Zones
            </div>
          )}
        </div>
      )}
    </div>
  )
}
