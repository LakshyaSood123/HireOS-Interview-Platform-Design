import { useState } from "react"
import type { RecursiveLandmarkData, ZoneCameraPreset } from "./worldV2Types"
import RecursiveForestLandscape from "./scenic/RecursiveForestLandscape"

interface RecursiveForestViewProps {
  landmarks: RecursiveLandmarkData[]
  cameraPreset?: ZoneCameraPreset
  onSelectLandmarkId?: (id: string) => void
  onCameraPresetChange?: (preset: ZoneCameraPreset) => void
  className?: string
}

export default function RecursiveForestView({
  landmarks,
  cameraPreset = "complete-zone",
  onSelectLandmarkId,
  onCameraPresetChange,
  className = "",
}: RecursiveForestViewProps) {
  const [internalCamera, setInternalCamera] = useState<ZoneCameraPreset>(cameraPreset)
  const [selectedLandmark, setSelectedLandmark] = useState<RecursiveLandmarkData | null>(null)
  const [isCleanMode, setIsCleanMode] = useState(false)

  const activeCamera = onCameraPresetChange ? cameraPreset : internalCamera
  const handleCameraChange = (preset: ZoneCameraPreset) => {
    setInternalCamera(preset)
    onCameraPresetChange?.(preset)
  }

  // Smooth cinematic camera transform
  let cameraTransform = "scale(1) translate(0%, 0%)"
  if (activeCamera === "wayfarer-focus") {
    // Focused around: Recursion (21.5%) -> Backtracking (35%) -> Trees (51%)
    // Enhanced margin ensures Recursion on the left is never clipped
    cameraTransform = "scale(1.44) translate(17%, -5%)"
  } else if (activeCamera === "trees-hero") {
    // Focused directly on Trees Hero Ancient Canopy Lodge (51%, 46%)
    cameraTransform = "scale(1.70) translate(-1.2%, 2.2%)"
  } else if (activeCamera === "ascent-pass") {
    // Focused on BST (72%) -> Highland Pass (48%) -> Distant Graph Highlands
    cameraTransform = "scale(1.48) translate(-13%, 15%)"
  }

  const handleSelectLandmark = (landmark: RecursiveLandmarkData) => {
    setSelectedLandmark(landmark)
    onSelectLandmarkId?.(landmark.id)
  }

  const completedCount = landmarks.filter((l) => l.state === "completed").length
  const totalCount = landmarks.filter((l) => !l.isGateway).length

  return (
    <div className={`relative w-full h-full overflow-hidden select-none bg-[#D2ECED] font-display ${className}`}>
      {/* ══════════════════════════════════════════════════════════════════
          CINEMATIC CAMERA CONTAINER:
          Supports Full Complete Zone (Default) & Focused Expedition Views
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="w-full h-full transition-transform duration-700 ease-out origin-center"
        style={{ transform: cameraTransform }}
      >
        <RecursiveForestLandscape
          landmarks={landmarks}
          activeLandmarkId={selectedLandmark?.id ?? null}
          onSelectLandmark={handleSelectLandmark}
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          LIGHTWEIGHT RESTYLED HUD CONTROLS (ALPINE DESIGN DNA)
          Can be toggled to Clean Canvas for pure environmental immersion
          ══════════════════════════════════════════════════════════════════ */}

      {/* Top-Left Frosted Breadcrumb Pill */}
      {!isCleanMode && (
        <div
          className="pointer-events-auto animate-fade-up"
          style={{ position: "absolute", top: "16px", left: "24px", zIndex: 30 }}
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#E2EED5]/94 backdrop-blur-md border border-white/80 shadow-[0_10px_24px_rgba(40,65,45,0.08)] text-xs font-bold text-[#234E35]">
            <span className="text-base">🌲</span>
            <span className="font-black text-[#1B3F2B]">Zone 4: Recursive Forest</span>
            <span className="text-gray-300">•</span>
            <span className="text-[#168E65] font-black">
              {completedCount} / {totalCount} Completed
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-[11px] text-[#2F6141] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#168E65] animate-ping inline-block" />
              Current Focus: Trees
            </span>
            <div className="w-12 h-1.5 rounded-full bg-[#CBDCC4] overflow-hidden ml-1.5">
              <div
                className="h-full bg-[#168E65] rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top-Right Camera View Dock & Clean Mode Toggle */}
      <div
        className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#E2EED5]/94 backdrop-blur-md border border-white/80 shadow-[0_10px_24px_rgba(40,65,45,0.08)] animate-fade-up"
        style={{ position: "absolute", top: "16px", right: "24px", zIndex: 30 }}
      >
        {!isCleanMode && (
          <>
            <button
              onClick={() => handleCameraChange("complete-zone")}
              className={`py-1.5 px-3 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeCamera === "complete-zone"
                  ? "bg-[#168E65] text-white shadow-xs"
                  : "text-[#234E35] hover:bg-white/60"
              }`}
              title="Complete Zone View (Full Panorama)"
            >
              🗺️ Complete Zone
            </button>
            <button
              onClick={() => handleCameraChange("trees-hero")}
              className={`py-1.5 px-3 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeCamera === "trees-hero"
                  ? "bg-[#168E65] text-white shadow-xs"
                  : "text-[#234E35] hover:bg-white/60"
              }`}
              title="Trees Hero Area Focus"
            >
              🌳 Trees Hero
            </button>
            <button
              onClick={() => handleCameraChange("wayfarer-focus")}
              className={`py-1.5 px-3 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeCamera === "wayfarer-focus"
                  ? "bg-[#168E65] text-white shadow-xs"
                  : "text-[#234E35] hover:bg-white/60"
              }`}
              title="Recursion & Backtracking Focus"
            >
              💎 Wayfarer Focus
            </button>
            <button
              onClick={() => handleCameraChange("ascent-pass")}
              className={`py-1.5 px-3 text-xs font-bold rounded-full transition-all cursor-pointer ${
                activeCamera === "ascent-pass"
                  ? "bg-[#168E65] text-white shadow-xs"
                  : "text-[#234E35] hover:bg-white/60"
              }`}
              title="BST & Highland Pass Focus"
            >
              ⛰️ Highland Ascent
            </button>
          </>
        )}
        <button
          onClick={() => setIsCleanMode(!isCleanMode)}
          className="py-1.5 px-3 text-xs font-bold rounded-full bg-white/80 hover:bg-white text-[#234E35] transition-all cursor-pointer shadow-2xs"
          title={isCleanMode ? "Show HUD overlays" : "Hide HUD overlays for scenic evaluation"}
        >
          {isCleanMode ? "👁️ Show HUD" : "🌿 Clean Canvas"}
        </button>
      </div>

      {/* Bottom-Right Floating Inspection Card (Only if a landmark is explicitly clicked) */}
      {selectedLandmark && (
        <div
          className="pointer-events-auto max-w-sm w-full rounded-[22px] bg-[#E2EED5]/95 backdrop-blur-md border border-white/80 p-4 shadow-[0_16px_36px_rgba(40,65,45,0.12)] animate-fade-up"
          style={{ position: "absolute", bottom: "24px", right: "24px", zIndex: 30 }}
        >
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-[#3B6B49] tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-[#BBD4B8]">
                Step {selectedLandmark.routeStep} of 5
              </span>
              {selectedLandmark.isHero && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#F59E0B]/20 text-[#92400E] border border-[#F59E0B]/30">
                  Hero Landmark
                </span>
              )}
              {selectedLandmark.isGateway && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-gray-200/80 text-gray-700">
                  Zone Gateway
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  selectedLandmark.state === "current"
                    ? "bg-[#168E65] text-white"
                    : selectedLandmark.state === "completed"
                    ? "bg-white text-[#168E65] border border-[#BBD4B8]"
                    : "bg-gray-200/80 text-gray-600"
                }`}
              >
                {selectedLandmark.state === "current"
                  ? "Current Focus"
                  : selectedLandmark.state === "completed"
                  ? "Completed ✓"
                  : "Locked 🔒"}
              </span>
              <button
                onClick={() => setSelectedLandmark(null)}
                className="w-5 h-5 rounded-full bg-white/70 hover:bg-white text-gray-500 hover:text-gray-800 text-xs flex items-center justify-center cursor-pointer transition-all"
                title="Close Drawer"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-9 h-9 rounded-xl bg-white/95 border border-[#BBD4B8] flex items-center justify-center text-lg shadow-2xs flex-shrink-0">
              {selectedLandmark.id === "recursion"
                ? "💎"
                : selectedLandmark.id === "backtracking"
                ? "🔀"
                : selectedLandmark.id === "trees"
                ? "🌳"
                : selectedLandmark.id === "bst"
                ? "🌲"
                : "⛰️"}
            </div>
            <div>
              <h4 className="text-sm font-black text-[#1B3F2B] leading-tight">
                {selectedLandmark.name}
              </h4>
              <span className="text-[11px] font-bold text-[#3B6B49] block">
                {selectedLandmark.conceptTitle}
              </span>
            </div>
          </div>

          <p className="text-[11px] text-gray-600 leading-snug mb-3.5">
            {selectedLandmark.environmentalIdentity}
          </p>

          {selectedLandmark.state === "current" ? (
            <button
              onClick={() => handleCameraChange("trees-hero")}
              className="w-full py-2 rounded-full bg-[#168E65] hover:bg-[#127956] text-white text-xs font-bold tracking-wide shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Continue Expedition</span>
              <span>➔</span>
            </button>
          ) : selectedLandmark.state === "completed" ? (
            <button
              className="w-full py-2 rounded-full bg-white/90 hover:bg-white text-[#234E35] border border-[#BBD4B8] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Review Completed Chapter ↺</span>
            </button>
          ) : (
            <div className="py-2 rounded-full bg-gray-200/70 text-gray-500 text-xs font-bold text-center border border-gray-300/60 flex items-center justify-center gap-1">
              <span>🔒 Complete Trees First</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Center Floating Quick-Jump Dock */}
      {!isCleanMode && (
        <div
          className="pointer-events-auto hidden sm:flex items-center gap-2 p-1.5 rounded-full bg-[#E2EED5]/94 backdrop-blur-md border border-white/80 shadow-[0_14px_32px_rgba(40,65,45,0.10)]"
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30,
          }}
        >
        <button
          onClick={() => {
            const l = landmarks.find((item) => item.id === "trees")
            if (l) setSelectedLandmark(l)
            handleCameraChange("trees-hero")
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedLandmark?.id === "trees" && activeCamera === "trees-hero"
              ? "bg-[#168E65] text-white shadow-xs"
              : "bg-white/85 hover:bg-white text-[#234E35]"
          }`}
        >
          <span>🌳</span>
          <span>Trees (Hero)</span>
        </button>

        <button
          onClick={() => {
            const l = landmarks.find((item) => item.id === "recursion")
            if (l) setSelectedLandmark(l)
            handleCameraChange("wayfarer-focus")
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedLandmark?.id === "recursion"
              ? "bg-[#168E65] text-white shadow-xs"
              : "bg-white/85 hover:bg-white text-[#234E35]"
          }`}
        >
          <span>💎</span>
          <span>Recursion</span>
        </button>

        <button
          onClick={() => {
            const l = landmarks.find((item) => item.id === "backtracking")
            if (l) setSelectedLandmark(l)
            handleCameraChange("wayfarer-focus")
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedLandmark?.id === "backtracking"
              ? "bg-[#168E65] text-white shadow-xs"
              : "bg-white/85 hover:bg-white text-[#234E35]"
          }`}
        >
          <span>🔀</span>
          <span>Backtracking</span>
        </button>

        <button
          onClick={() => {
            const l = landmarks.find((item) => item.id === "bst")
            if (l) setSelectedLandmark(l)
            handleCameraChange("ascent-pass")
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedLandmark?.id === "bst"
              ? "bg-[#168E65] text-white shadow-xs"
              : "bg-white/85 hover:bg-white text-[#234E35]"
          }`}
        >
          <span>🌲</span>
          <span>BST</span>
        </button>

        <button
          onClick={() => {
            const l = landmarks.find((item) => item.id === "highland-pass")
            if (l) setSelectedLandmark(l)
            handleCameraChange("ascent-pass")
          }}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            selectedLandmark?.id === "highland-pass"
              ? "bg-[#168E65] text-white shadow-xs"
              : "bg-white/85 hover:bg-white text-[#234E35]"
          }`}
        >
          <span>⛰️</span>
          <span>Highland Pass</span>
        </button>
      </div>
      )}
    </div>
  )
}
