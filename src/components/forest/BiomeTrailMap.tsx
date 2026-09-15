import { useState } from "react"
import type { TrailNode, BiomeZone } from "../../data/reagvisCourses"
import OwlAvatar from "../OwlAvatar"
import AlpineMountainRange from "./scenic/AlpineMountainRange"
import AlpinePineTree from "./scenic/AlpinePineTree"
import AlpineCabin from "./scenic/AlpineCabin"
import { AlpineGoat, AlpineFawn, MeadowCow, TimberLogPile, SoaringBird, RusticBroom } from "./scenic/ScenicAnimals"
import SoftCloud from "./scenic/SoftCloud"
import { useAppState } from "../../state/AppStateContext"

interface BiomeTrailMapProps {
  nodes: TrailNode[]
  biomes: BiomeZone[]
  onSelectNode: (node: TrailNode) => void
}

interface WorldModule {
  id: string
  name: string
  subtitle: string
  zoneNumber: number
  icon: string
  status: "completed" | "current" | "locked"
  xPercent: number
  yPercent: number
  conceptSummary: string
}

export default function BiomeTrailMap({ nodes, onSelectNode }: BiomeTrailMapProps) {
  const { currentLessonId, simulatedReadinessScore, setActiveNode, setReagvisView } = useAppState()
  const [selectedModuleId, setSelectedModuleId] = useState<string>("trees")
  const [showCourseInfo, setShowCourseInfo] = useState(false)

  const activeNode = nodes.find(n => n.id === currentLessonId) || nodes[2]

  const handleStartActiveLesson = () => {
    if (activeNode) {
      setActiveNode(activeNode)
      setReagvisView("lesson")
    }
  }

  // 7 Major DSA Regions arranged as organic destinations across the mountain landscape
  const dsaModules: WorldModule[] = [
    {
      id: "foundations",
      name: "Foundations",
      subtitle: "Complexity & Two-Pointers",
      zoneNumber: 1,
      icon: "🌱",
      status: "completed",
      xPercent: 18,
      yPercent: 74,
      conceptSummary: "Foundational asymptotic bounds, two-pointer scanning, and sliding windows.",
    },
    {
      id: "linked-structures",
      name: "Linked Structures",
      subtitle: "Pointers, Lists & Stacks",
      zoneNumber: 2,
      icon: "🌊",
      status: "completed",
      xPercent: 28,
      yPercent: 64,
      conceptSummary: "Dynamic memory pointers, cycle detection, and monotonic stacks.",
    },
    {
      id: "recursion",
      name: "Recursion",
      subtitle: "Call Stacks & Backtracking",
      zoneNumber: 3,
      icon: "💎",
      status: "completed",
      xPercent: 39,
      yPercent: 54,
      conceptSummary: "Call stack unwinding, recurrence relations, and combinatorial search trees.",
    },
    {
      id: "trees",
      name: "Trees",
      subtitle: "BST & Traversal (Active)",
      zoneNumber: 4,
      icon: "🌳",
      status: "current",
      xPercent: 54,
      yPercent: 49,
      conceptSummary: "Binary search tree invariants, level/depth traversals, and balance factors.",
    },
    {
      id: "graphs",
      name: "Graphs",
      subtitle: "BFS, DFS & Shortest Path",
      zoneNumber: 5,
      icon: "🕸️",
      status: "locked",
      xPercent: 72,
      yPercent: 42,
      conceptSummary: "Adjacency structures, topological ordering, and breadth-first search.",
    },
    {
      id: "dp",
      name: "Dynamic Programming",
      subtitle: "Memoization & Tabulation",
      zoneNumber: 6,
      icon: "⚡",
      status: "locked",
      xPercent: 81,
      yPercent: 30,
      conceptSummary: "Overlapping subproblems, state memoization caches, and bottom-up tables.",
    },
    {
      id: "summit",
      name: "Algorithm Summit",
      subtitle: "HireOS Full Assessment",
      zoneNumber: 7,
      icon: "⭐",
      status: "locked",
      xPercent: 88,
      yPercent: 18,
      conceptSummary: "The comprehensive technical interview trial to reach 80+ readiness score.",
    },
  ]

  const activeModule = dsaModules.find(m => m.id === selectedModuleId) || dsaModules[3]

  return (
    <div className="relative w-full h-[calc(100vh-56px)] min-h-[660px] bg-[#D5ECED] select-none font-display overflow-hidden flex flex-col justify-between">

      {/* ══════════════════════════════════════════════════════════
          1. FULL-BLEED GRAND ALPINE MOUNTAIN RANGE
          Occupies full canvas with 5 layered rolling foothills & meadows
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <AlpineMountainRange className="w-full h-full object-cover drop-shadow-[0_12px_24px_rgba(120,145,115,0.14)]" />

        {/* Alpine Goat perched on left rocky ridge (matching reference) */}
        <div className="hidden sm:block absolute left-[18%] top-[25%] z-10 pointer-events-none">
          <AlpineGoat scale={0.95} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          2. SUBTLE NATURAL HIKING TRAIL (1:1 PERCENTAGE COORDINATES)
          Winding, thin, low-contrast foot-path connecting landmarks
          ══════════════════════════════════════════════════════════ */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
      >
        {/* Traversed segment: Foundations -> Bridge -> Arch -> Trees */}
        <path
          d="M 18 74 
             Q 23 70, 28 64 
             Q 33 58, 39 54 
             Q 46 51, 54 49"
          fill="none"
          stroke="#467241"
          strokeWidth="0.28"
          strokeLinecap="round"
          strokeDasharray="0.7 0.5"
          opacity="0.55"
        />

        {/* Locked future trail: Trees -> Graphs -> DP -> Summit (extremely faint) */}
        <path
          d="M 54 49 
             Q 63 46, 72 42 
             Q 77 36, 81 30 
             Q 85 24, 88 18"
          fill="none"
          stroke="#889A84"
          strokeWidth="0.18"
          strokeLinecap="round"
          strokeDasharray="0.3 0.8"
          opacity="0.22"
        />
      </svg>

      {/* ══════════════════════════════════════════════════════════
          3. SCENIC DETAILS: CLOUDS, BIRDS, ANIMALS & FLORA
          ══════════════════════════════════════════════════════════ */}
      {/* Sky Clouds & Soaring Birds */}
      <div className="absolute top-0 inset-x-0 h-44 pointer-events-none z-1">
        <SoftCloud scale={0.95} className="absolute left-[6%] top-2 opacity-90 animate-float-slow" />
        <SoftCloud scale={0.8} className="absolute left-[30%] top-6 opacity-75 animate-float" />
        <SoftCloud scale={0.9} className="absolute right-[24%] top-3 opacity-85 animate-float-slow" />
        <SoftCloud scale={0.7} className="absolute right-[6%] top-8 opacity-70" />
        <SoaringBird scale={0.85} className="absolute left-[44%] top-7 opacity-65" />
        <SoaringBird scale={0.65} className="absolute left-[48%] top-11 opacity-50" />
      </div>

      {/* Left Foreground Stately Pine Forest & Fawn */}
      <div className="absolute left-3 sm:left-8 bottom-3 z-15 pointer-events-none hidden sm:block">
        <div className="relative">
          <div className="ml-5 mb-1.5">
            <AlpineFawn scale={1.25} />
          </div>
          <AlpinePineTree variant="grove" scale={1.3} />
        </div>
      </div>

      {/* Midground Pine Clusters along the meadows */}
      <div className="absolute left-[21%] bottom-[30%] z-12 pointer-events-none hidden md:block">
        <AlpinePineTree variant="cluster" scale={0.85} />
      </div>
      <div className="absolute left-[34%] bottom-[20%] z-12 pointer-events-none hidden md:block">
        <AlpinePineTree variant="cluster" scale={0.8} />
      </div>
      <div className="absolute left-[48%] bottom-[28%] z-12 pointer-events-none hidden md:block">
        <AlpinePineTree variant="cluster" scale={0.75} />
      </div>

      {/* Conifers framing the stilt cabin on mountain ridge */}
      <div className="absolute right-[27%] top-[39%] z-12 pointer-events-none hidden md:block">
        <AlpinePineTree variant="cluster" scale={0.8} />
      </div>
      <div className="absolute right-[19%] bottom-[32%] z-12 pointer-events-none hidden md:block">
        <AlpinePineTree variant="cluster" scale={0.85} />
      </div>

      {/* Right Foreground Meadow: Cow, Logs & Broom */}
      <div className="absolute right-3 sm:right-8 bottom-3 z-15 pointer-events-none hidden sm:flex items-end gap-3">
        <div className="flex flex-col items-end mr-1">
          <TimberLogPile scale={1.2} />
          <div className="mt-2">
            <AlpinePineTree variant="dense" scale={1.2} />
          </div>
        </div>
        <div className="flex items-end gap-2">
          <MeadowCow scale={1.3} />
          <div className="transform -rotate-6 translate-y-1">
            <RusticBroom scale={1.1} />
          </div>
        </div>
      </div>

      {/* Meadow Wildflower Clusters */}
      <div className="absolute inset-0 pointer-events-none z-6 hidden sm:block">
        <div className="absolute left-[22%] bottom-[15%] flex gap-1 items-end opacity-65">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FCE278]" />
          <div className="w-1 h-1 rounded-full bg-[#FCE278] mb-0.5" />
        </div>
        <div className="absolute left-[44%] bottom-[22%] flex gap-1 items-end opacity-60">
          <div className="w-1.5 h-1.5 rounded-full bg-[#E3B8E8]" />
          <div className="w-1 h-1 rounded-full bg-white mb-0.5" />
        </div>
        <div className="absolute right-[36%] bottom-[18%] flex gap-1 items-end opacity-65">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FCE278]" />
          <div className="w-1 h-1 rounded-full bg-[#FCE278] mb-0.5" />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          4. THE 7 SCENIC COURSE REGION LANDMARKS
          Placed organically in terrain (NOT in a straight line!)
          ══════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">

        {dsaModules.map(mod => {
          const isSelected = selectedModuleId === mod.id
          const isCurrent = mod.status === "current"
          const isCompleted = mod.status === "completed"

          return (
            <div
              key={mod.id}
              onClick={() => setSelectedModuleId(mod.id)}
              style={{
                left: `${mod.xPercent}%`,
                top: `${mod.yPercent}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-300 pointer-events-auto"
            >
              <div className="relative flex flex-col items-center">

                {/* ── SCENIC LANDMARK GRAPHIC ── */}
                <div className={`transition-transform duration-300 group-hover:scale-110 ${isSelected ? "scale-105" : ""}`}>
                  
                  {/* Zone 1: Foundations (Trailhead Meadow Cabin & Pines) */}
                  {mod.id === "foundations" && (
                    <div className="relative">
                      <AlpineCabin scale={0.92} hasSmoke={false} isGlow={true} />
                      <div className="absolute -left-3 bottom-0">
                        <AlpinePineTree variant="small" scale={0.75} />
                      </div>
                    </div>
                  )}

                  {/* Zone 2: Linked Structures (River Footbridge & Brook) */}
                  {mod.id === "linked-structures" && (
                    <div className="relative flex items-center justify-center w-16 h-12">
                      <svg viewBox="0 0 64 36" className="w-16 h-10 drop-shadow-xs" fill="none">
                        <path d="M 0 32 Q 32 28, 64 32" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                        <path d="M 4 28 Q 32 12, 60 28" stroke="#8D5B38" strokeWidth="4" strokeLinecap="round" />
                        <path d="M 6 22 Q 32 8, 58 22" stroke="#B37C54" strokeWidth="3" strokeLinecap="round" />
                        <line x1="16" y1="26" x2="16" y2="14" stroke="#5C3B24" strokeWidth="2.4" />
                        <line x1="32" y1="20" x2="32" y2="10" stroke="#5C3B24" strokeWidth="2.4" />
                        <line x1="48" y1="26" x2="48" y2="14" stroke="#5C3B24" strokeWidth="2.4" />
                      </svg>
                      <div className="absolute -right-3 top-0">
                        <AlpinePineTree variant="small" scale={0.68} />
                      </div>
                    </div>
                  )}

                  {/* Zone 3: Recursion (Rustic Stone Arch Portal) */}
                  {mod.id === "recursion" && (
                    <div className="relative flex items-center justify-center">
                      <svg viewBox="0 0 50 40" className="w-13 h-11 drop-shadow-xs" fill="none">
                        <path d="M 10 38 L 10 18 C 10 6, 40 6, 40 18 L 40 38" stroke="#758872" strokeWidth="5.5" strokeLinecap="round" />
                        <path d="M 16 38 L 16 18 C 16 11, 34 11, 34 18 L 34 38" stroke="#9AB095" strokeWidth="2" strokeLinecap="round" />
                        <circle cx="25" cy="18" r="3.5" fill="#A855F7" className="animate-pulse" />
                      </svg>
                      <div className="absolute -left-2 top-0">
                        <AlpinePineTree variant="small" scale={0.7} />
                      </div>
                    </div>
                  )}

                  {/* Zone 4: Trees (Active Focal Chalet with Chimney Smoke, Owl & Grove) */}
                  {mod.id === "trees" && (
                    <div className="relative">
                      <AlpineCabin scale={1.18} hasSmoke={true} isGlow={true} />
                      <div className="absolute -right-6 -bottom-1">
                        <AlpinePineTree variant="dense" scale={0.95} />
                      </div>
                      <div className="absolute -left-6 top-1">
                        <AlpinePineTree variant="tall" scale={0.9} />
                      </div>
                      <div className="absolute -top-3 -right-2 w-7 h-7 rounded-full bg-white/95 border border-[#1DB584] shadow-xs flex items-center justify-center">
                        <OwlAvatar size={20} state="listening" />
                      </div>
                      <div className="absolute right-[12%] bottom-[20%] w-2 h-2 rounded-full bg-[#E27D4C] shadow-xs flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-white animate-ping" />
                      </div>
                    </div>
                  )}

                  {/* Zone 5: Graphs (Ridge Stilt Cabin - matching reference!) */}
                  {mod.id === "graphs" && (
                    <div className="relative flex items-center justify-center w-14 h-14">
                      <svg viewBox="0 0 52 56" className="w-13 h-14 drop-shadow-xs" fill="none">
                        <line x1="16" y1="36" x2="14" y2="54" stroke="#683F24" strokeWidth="2.5" />
                        <line x1="36" y1="36" x2="38" y2="54" stroke="#683F24" strokeWidth="2.5" />
                        <line x1="26" y1="36" x2="26" y2="54" stroke="#683F24" strokeWidth="2" />
                        <rect x="10" y="16" width="32" height="20" rx="3" fill="#D66C3E" stroke="#B04F26" strokeWidth="1.5" />
                        <polygon points="6,18 26,4 46,18" fill="#B04F26" stroke="#873A18" strokeWidth="1.5" />
                        <rect x="18" y="22" width="8" height="8" rx="1.5" fill="#FFFFFF" opacity="0.9" />
                        <rect x="28" y="22" width="8" height="8" rx="1.5" fill="#FCE790" />
                      </svg>
                    </div>
                  )}

                  {/* Zone 6: Dynamic Programming (Glacial Runic Obelisk) */}
                  {mod.id === "dp" && (
                    <div className="relative flex items-center justify-center w-14 h-14 opacity-80">
                      <svg viewBox="0 0 40 50" className="w-10 h-12 drop-shadow-xs" fill="none">
                        <polygon points="20,4 28,42 12,42" fill="#ADC0AB" stroke="#7A8D77" strokeWidth="1.5" />
                        <line x1="20" y1="8" x2="20" y2="38" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
                        <line x1="16" y1="20" x2="24" y2="20" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
                      </svg>
                    </div>
                  )}

                  {/* Zone 7: Algorithm Summit (Grand Summit Lodge with Flag) */}
                  {mod.id === "summit" && (
                    <div className="relative">
                      <AlpineCabin scale={0.95} hasFlag={true} flagText="Summit ⭐" isGlow={true} />
                      <div className="absolute -top-5 -right-1 w-5 h-5 rounded-full bg-[#E2B44A] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                        ⭐
                      </div>
                    </div>
                  )}

                </div>

                {/* ── SUBTLE ELEGANT NAME BADGE (Clean & Low-Clutter) ── */}
                <div className={`mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-tight flex items-center gap-1 shadow-2xs transition-all ${
                  isCurrent
                    ? "bg-[#1DB584] text-white shadow-xs"
                    : isSelected
                    ? "bg-white text-[#234E35] border border-[#BBD4B8]"
                    : "opacity-0 group-hover:opacity-100 bg-white/85 text-gray-600 border border-white/60"
                }`}>
                  <span>{mod.icon}</span>
                  <span>{mod.name}</span>
                  {isCompleted && <span className="text-[#1DB584] text-[10px]">✓</span>}
                  {mod.status === "locked" && <span className="text-[9px] text-gray-400">🔒</span>}
                </div>

              </div>
            </div>
          )
        })}

      </div>

      {/* ══════════════════════════════════════════════════════════
          5. FLOATING SCENIC UI CARDS (Soft, Translucent & Restrained)
          ══════════════════════════════════════════════════════════ */}
      {/* Top Header Row with Course Progress Pill and Desktop Module Card */}
      <div className="relative z-30 pt-3 sm:pt-5 px-4 sm:px-8 flex justify-between items-start pointer-events-none">
        
        {/* Top-Left Pill */}
        <div className="hidden sm:flex animate-fade-up pointer-events-auto">
          <button
            onClick={() => setShowCourseInfo(!showCourseInfo)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E2EED5]/88 backdrop-blur-md border border-white/60 shadow-[0_10px_24px_rgba(40,65,45,0.06)] hover:bg-[#E2EED5] transition-all cursor-pointer text-xs font-bold text-[#234E35]"
          >
            <span>🏔️</span>
            <span>DSA Foundations</span>
            <span className="text-gray-400">&bull;</span>
            <span className="text-[#1DB584] font-mono font-black">{simulatedReadinessScore}% Ready</span>
            <span className="text-[10px] text-gray-500">({showCourseInfo ? "▴" : "▾"})</span>
          </button>

          {showCourseInfo && (
            <div className="absolute top-12 left-8 w-64 rounded-2xl bg-[#E2EED5]/95 backdrop-blur-md border border-[#BDD4B6] p-3 shadow-[0_14px_30px_rgba(40,65,45,0.10)] text-xs text-[#234E35]">
              <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#CBDCC4]/60">
                <span className="font-bold">Course Progression</span>
                <span className="font-black text-[#1DB584]">3 / 7 Regions</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug">
                Foundations, Linked Structures, and Recursion unlocked. Current milestone is <span className="font-bold text-[#1B3F2B]">Zone 4: Trees</span>.
              </p>
            </div>
          )}
        </div>

        {/* Top-Right Active Module Card on Desktop */}
        <div className="hidden sm:block w-72 lg:w-76 animate-fade-up pointer-events-auto">
          <div className="rounded-[24px] bg-[#E2EED5]/92 backdrop-blur-md border border-white/65 p-3.5 shadow-[0_16px_36px_rgba(40,65,45,0.08)]">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-white/90 border border-[#BBD4B8] flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
                {activeModule.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase text-[#3B6B49] tracking-wider block">
                  Zone {activeModule.zoneNumber} &bull; {activeModule.status.toUpperCase()}
                </span>
                <h4 className="text-xs font-black text-[#1B3F2B] truncate leading-tight mt-0.5">
                  {activeModule.name}
                </h4>
              </div>
            </div>

            <p className="text-[11px] text-gray-600 leading-snug mb-2.5">
              {activeModule.conceptSummary}
            </p>

            {activeModule.status === "current" ? (
              <button
                onClick={handleStartActiveLesson}
                className="w-full py-1.5 rounded-full bg-[#5E8C58] hover:bg-[#4C7546] text-white text-xs font-bold tracking-wide shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <span>Enter Module</span>
                <span>➔</span>
              </button>
            ) : activeModule.status === "completed" ? (
              <button
                onClick={() => onSelectNode(nodes[0])}
                className="w-full py-1.5 rounded-full bg-white/80 hover:bg-white text-[#234E35] border border-[#BBD4B8] text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Review Lessons ↺</span>
              </button>
            ) : (
              <div className="py-1.5 rounded-full bg-gray-200/60 text-gray-500 text-xs font-bold text-center border border-gray-300/60 flex items-center justify-center gap-1">
                <span>🔒 Locked Region</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════
          6. FLOATING BOTTOM TRAIL DOCK & MOBILE CARD WRAPPER
          Matching the exact floating dock from the reference image
          ══════════════════════════════════════════════════════════ */}
      <div className="relative z-30 px-4 pb-4 sm:pb-5 flex flex-col items-center gap-2 pointer-events-auto">
        
        {/* ── Mobile Active Module Card (Floats softly right above the dock) ── */}
        <div className="sm:hidden w-full max-w-sm animate-fade-up">
          <div className="rounded-[22px] bg-[#E2EED5]/92 backdrop-blur-md border border-white/65 p-3 shadow-[0_14px_30px_rgba(40,65,45,0.08)]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-white/90 border border-[#BBD4B8] flex items-center justify-center text-xs shadow-2xs flex-shrink-0">
                {activeModule.icon}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-black uppercase text-[#3B6B49] tracking-wider block">
                  Zone {activeModule.zoneNumber} &bull; {activeModule.status.toUpperCase()}
                </span>
                <h4 className="text-xs font-black text-[#1B3F2B] truncate leading-tight">
                  {activeModule.name}
                </h4>
              </div>
            </div>
            <p className="text-[10px] text-gray-600 leading-snug mb-2">
              {activeModule.conceptSummary}
            </p>
            <button
              onClick={handleStartActiveLesson}
              className="w-full py-1.5 rounded-full bg-[#5E8C58] hover:bg-[#4C7546] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Enter Module ➔</span>
            </button>
          </div>
        </div>

        {/* ── Floating Pill Dock ── */}
        <div className="rounded-full bg-[#E2EED5]/88 backdrop-blur-md border border-white/60 p-1.5 shadow-[0_14px_32px_rgba(40,65,45,0.07)] flex items-center gap-2 sm:gap-3">
          
          {/* Soft circular icon buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => setSelectedModuleId("trees")}
              className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-gray-600 flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs"
              title="Locate Current Focus"
            >
              🧭
            </button>
            <button
              onClick={() => setSelectedModuleId("foundations")}
              className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-gray-600 flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs"
              title="Trailhead"
            >
              🌱
            </button>
            <button
              onClick={() => setSelectedModuleId("summit")}
              className="w-7 h-7 rounded-full bg-white/70 hover:bg-white text-gray-600 flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs"
              title="Summit Observatory"
            >
              ⭐
            </button>
          </div>

          {/* Primary Relay CTA */}
          <button
            onClick={handleStartActiveLesson}
            className="px-5 sm:px-6 py-1.5 rounded-full bg-[#5E8C58] hover:bg-[#4C7546] text-white text-xs font-bold tracking-wide shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>Relay: Trees</span>
            <span>➔</span>
          </button>

          {/* Course View Tag */}
          <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-white/60 text-[#244F39] text-xs font-semibold">
            <span>🗺️ World View</span>
          </div>

        </div>
      </div>

    </div>
  )
}
