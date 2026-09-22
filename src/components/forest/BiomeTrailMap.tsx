import { useState } from "react"
import type { TrailNode, BiomeZone } from "../../data/reagvisCourses"
import type { ProgressState } from "../../learning/types"
import OwlAvatar from "../OwlAvatar"
import AlpineMountainRange from "./scenic/AlpineMountainRange"
import AlpinePineTree from "./scenic/AlpinePineTree"
import AlpineCabin from "./scenic/AlpineCabin"
import { AlpineGoat, AlpineFawn, MeadowCow, SoaringBird } from "./scenic/ScenicAnimals"
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
  zoneId: string
  icon: string
  status: "completed" | "current" | "available" | "locked"
  xPercent: number
  yPercent: number
  conceptSummary: string
}

type WorldModuleSpec = Omit<WorldModule, "status">

function worldStatus(state: ProgressState | undefined): WorldModule["status"] {
  if (state === "completed" || state === "mastered") return "completed"
  if (state === "current" || state === "available") return state
  return "locked"
}

/** The module the focused camera frames: the learner's active module while
 * it is still open and on the map, otherwise the first one they can work on,
 * otherwise the last one they finished. (The engine keeps a finished module
 * active until the next checkpoint is entered, so "active" alone is not enough.) */
function pickFocus(modules: WorldModule[], activeModuleId: string | null): WorldModule {
  const isOpen = (m: WorldModule) => m.status === "current" || m.status === "available"
  const active = modules.find(m => m.id === activeModuleId && isOpen(m))
  if (active) return active
  const open = modules.find(isOpen)
  if (open) return open
  return modules.filter(m => m.status === "completed").pop() ?? modules[0]
}

// Focused camera: zoom, and a shift that centres the focus module. The shift
// is capped so the zoomed map still covers the viewport; the bias keeps the
// original hand-tuned framing of Trees (translate -1.2%, 2.2%).
const FOCUS_SCALE = 1.72
const MAX_FOCUS_SHIFT = 50 - 50 / FOCUS_SCALE
const FOCUS_BIAS = { x: -0.2, y: -1.8 }

function focusTransform(module: WorldModule): string {
  const clamp = (shift: number) => Math.max(-MAX_FOCUS_SHIFT, Math.min(MAX_FOCUS_SHIFT, shift))
  const x = clamp(50 - module.xPercent + FOCUS_BIAS.x)
  const y = clamp(50 - module.yPercent + FOCUS_BIAS.y)
  return `scale(${FOCUS_SCALE}) translate(${x.toFixed(2)}%, ${y.toFixed(2)}%)`
}

interface CourseZone {
  id: string
  number: number
  title: string
  description: string
  status: "active" | "locked" | "completed"
  moduleRange: string
}

// The 7 core modules placed organically across the scenic landscape. Their
// status is not part of the scenery: it comes from the learner's progress.
const WORLD_MODULES: WorldModuleSpec[] = [
  {
    id: "foundations",
    name: "Foundations",
    subtitle: "Complexity & Two-Pointers",
    zoneNumber: 1,
    zoneId: "zone-1",
    icon: "🌱",
    xPercent: 16,
    yPercent: 69,
    conceptSummary: "Foundational asymptotic bounds, two-pointer scanning, and sliding windows.",
  },
  {
    id: "linked-structures",
    name: "Linked Structures",
    subtitle: "Pointers, Lists & Stacks",
    zoneNumber: 2,
    zoneId: "zone-1",
    icon: "🌊",
    xPercent: 26,
    yPercent: 61,
    conceptSummary: "Dynamic memory pointers, cycle detection, and monotonic stacks.",
  },
  {
    id: "recursion",
    name: "Recursion",
    subtitle: "Call Stacks & Backtracking",
    zoneNumber: 3,
    zoneId: "zone-1",
    icon: "💎",
    xPercent: 36,
    yPercent: 53,
    conceptSummary: "Call stack unwinding, recurrence relations, and combinatorial search trees.",
  },
  {
    id: "trees",
    name: "Trees",
    subtitle: "BST & Traversal",
    zoneNumber: 4,
    zoneId: "zone-1",
    icon: "🌳",
    xPercent: 51,
    yPercent: 46,
    conceptSummary: "Binary search tree invariants, level/depth traversals, and balance factors.",
  },
  {
    id: "graphs",
    name: "Graphs",
    subtitle: "BFS, DFS & Shortest Path",
    zoneNumber: 5,
    zoneId: "zone-2",
    icon: "🕸️",
    xPercent: 64,
    yPercent: 42,
    conceptSummary: "Adjacency structures, topological ordering, and breadth-first search.",
  },
  {
    id: "dp",
    name: "Dynamic Programming",
    subtitle: "Memoization & Tabulation",
    zoneNumber: 6,
    zoneId: "zone-2",
    icon: "⚡",
    xPercent: 75,
    yPercent: 32,
    conceptSummary: "Overlapping subproblems, state memoization caches, and bottom-up tables.",
  },
  {
    id: "summit",
    name: "Algorithm Summit",
    subtitle: "HireOS Full Assessment",
    zoneNumber: 7,
    zoneId: "zone-3",
    icon: "⭐",
    xPercent: 67,
    yPercent: 17,
    conceptSummary: "The comprehensive technical interview trial to reach 80+ readiness score.",
  },
]

export default function BiomeTrailMap({ nodes, onSelectNode }: BiomeTrailMapProps) {
  const {
    currentLessonId,
    simulatedReadinessScore,
    setActiveNode,
    setReagvisView,
    enterModule,
    dsaModuleStates,
    activeModuleId,
  } = useAppState()

  const dsaModules: WorldModule[] = WORLD_MODULES.map(spec => ({ ...spec, status: worldStatus(dsaModuleStates[spec.id]) }))
  const focusModule = pickFocus(dsaModules, activeModuleId)
  const focusIndex = dsaModules.indexOf(focusModule)

  // ── Camera View Mode: Default to "focused" on current active region ──
  const [cameraMode, setCameraMode] = useState<"focused" | "world">("focused")
  const [selectedModuleId, setSelectedModuleId] = useState<string>(focusModule.id)
  const [activeZoneId, setActiveZoneId] = useState<string>("zone-1")
  const [showCourseInfo, setShowCourseInfo] = useState(false)

  const activeNode = nodes.find(n => n.id === currentLessonId) || nodes[2]

  const enterMapModule = (moduleId: string) => {
    if (enterModule) {
      enterModule(moduleId)
    } else if (activeNode) {
      setActiveNode(activeNode)
      setReagvisView("lesson")
    }
  }

  const handleStartActiveLesson = () => enterMapModule(selectedModuleId || focusModule.id)
  const handleResume = () => enterMapModule(focusModule.id)

  // ── Multi-Zone Progression Concept: Scaling beyond a single mountain ──
  const courseZones: CourseZone[] = [
    {
      id: "zone-1",
      number: 1,
      title: "Alpine Valleys & Ancient Grove",
      description: "Foundations, Linked Structures, Recursion, and Binary Search Trees.",
      status: "active",
      moduleRange: "Modules 1–4",
    },
    {
      id: "zone-2",
      number: 2,
      title: "Highland Crags & Glacial Valleys",
      description: "Graphs, Shortest Paths, Dynamic Programming, and Greedy Algorithms.",
      status: "locked",
      moduleRange: "Modules 5–8",
    },
    {
      id: "zone-3",
      number: 3,
      title: "Celestial Summit & Final Trials",
      description: "Heaps, Tries, Advanced Trees, and the Full Technical Interview Assessment.",
      status: "locked",
      moduleRange: "Modules 9–12",
    },
  ]

  const activeModule = dsaModules.find(m => m.id === selectedModuleId) || focusModule
  const completedCount = dsaModules.filter(m => m.status === "completed").length

  return (
    <div className="relative w-full h-full bg-[#D2ECED] select-none font-display overflow-hidden">

      {/* ══════════════════════════════════════════════════════════════════
          CAMERA TRANSFORM CONTAINER:
          Supports Focused Current Area View (Default) & Expanded World View
          Smooth cinematic transitions between local region and grand panorama
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="w-full h-full transition-transform duration-700 ease-out origin-center"
        style={{
          transform: cameraMode === "focused"
            ? focusTransform(focusModule)
            : "scale(1) translate(0%, 0%)",
        }}
      >

        {/* ── 1. Scenic Mountain Massifs & Textured Meadows ── */}
        <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <AlpineMountainRange className="w-full h-full object-cover drop-shadow-[0_14px_28px_rgba(120,145,115,0.16)]" />

          {/* Alpine Goat perched gracefully on left rocky ridge */}
          <div className="hidden sm:block absolute left-[18%] top-[24%] z-10 pointer-events-none">
            <AlpineGoat scale={0.78} />
          </div>
        </div>

        {/* ── 2. Realistic Mountain Footpath Embedded into Alpine Terrain ── */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-5"
        >
          <defs>
            <filter id="trailShadow" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="0.30" stdDeviation="0.22" floodColor="#122013" floodOpacity="0.32" />
            </filter>
            <filter id="cairnShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0.1" dy="0.35" stdDeviation="0.25" floodColor="#0E180F" floodOpacity="0.40" />
            </filter>
            
            {/* Natural Weathered Granite & Slate Pavers embedded into earth */}
            <linearGradient id="flagstoneSunlit" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#8A9A87" />
              <stop offset="45%" stopColor="#758573" />
              <stop offset="100%" stopColor="#5E6D5B" />
            </linearGradient>
            <linearGradient id="flagstoneMuted" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#7D8D7B" />
              <stop offset="50%" stopColor="#697967" />
              <stop offset="100%" stopColor="#546352" />
            </linearGradient>
            <linearGradient id="screeRock" x1="15%" y1="0%" x2="85%" y2="100%">
              <stop offset="0%" stopColor="#869584" />
              <stop offset="50%" stopColor="#71806F" />
              <stop offset="100%" stopColor="#5C6A5A" />
            </linearGradient>
          </defs>

          {/* ── Layer A: Continuous Worn Earth & Trodden Mountain Loam Ribbon ── */}
          {/* Outer trampled meadow soil margin */}
          <path
            d="M 16 69 Q 21 65, 26 61 Q 31 57, 36 53 Q 44 49, 51 46 Q 58 43, 64 42 Q 70 37, 75 32 Q 74 24, 67 17"
            fill="none"
            stroke="#4D6643"
            strokeWidth="3.6"
            strokeLinecap="round"
            opacity="0.32"
          />
          {/* Compacted mountain earth loam bed */}
          <path
            d="M 16 69 Q 21 65, 26 61 Q 31 57, 36 53 Q 44 49, 51 46 Q 58 43, 64 42 Q 70 37, 75 32 Q 74 24, 67 17"
            fill="none"
            stroke="#5F4A37"
            strokeWidth="2.1"
            strokeLinecap="round"
            opacity="0.55"
          />
          {/* Trodden central footpath line (worn silt & gravel track) */}
          <path
            d="M 16 69 Q 21 65, 26 61 Q 31 57, 36 53 Q 44 49, 51 46 Q 58 43, 64 42 Q 70 37, 75 32 Q 74 24, 67 17"
            fill="none"
            stroke="#7C6650"
            strokeWidth="1.0"
            strokeLinecap="round"
            opacity="0.45"
          />

          {/* Environmental Trail Continuation: Climbing up into Highland Mountain Pass Saddle */}
          <path
            d="M 51 45.5 Q 49.5 33, 47.5 22.5"
            fill="none"
            stroke="#4D6643"
            strokeWidth="3.0"
            strokeLinecap="round"
            opacity="0.30"
          />
          <path
            d="M 51 45.5 Q 49.5 33, 47.5 22.5"
            fill="none"
            stroke="#5F4A37"
            strokeWidth="1.8"
            strokeLinecap="round"
            opacity="0.52"
          />
          <path
            d="M 51 45.5 Q 49.5 33, 47.5 22.5"
            fill="none"
            stroke="#7C6650"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.42"
          />

          {/* ── Layer B: Weathered Granite Steps & Timber Water Bars (Foundations to Recursion) ── */}
          <g filter="url(#trailShadow)">
            {/* Embedded natural stone slabs flush with earth bed */}
            <path d="M 16.4 68.6 C 16.2 68.1, 17.5 67.5, 18.1 67.8 C 18.4 68.3, 17.8 68.9, 17.1 68.8 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 17.8 67.5 C 17.6 67.0, 18.8 66.5, 19.4 66.8 C 19.7 67.3, 19.1 67.8, 18.5 67.7 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 19.1 66.4 C 18.8 65.9, 20.3 65.3, 21.0 65.7 C 21.3 66.2, 20.7 66.8, 19.9 66.6 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 20.5 65.4 C 20.2 64.9, 21.7 64.3, 22.3 64.7 C 22.7 65.2, 22.0 65.8, 21.3 65.6 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            
            {/* Timber water bar / trail erosion barrier */}
            <path d="M 21.6 65.2 L 23.2 64.0" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />
            
            <path d="M 22.0 64.1 C 21.7 63.6, 23.2 63.1, 23.8 63.5 C 24.2 64.0, 23.5 64.6, 22.8 64.4 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 23.3 63.1 C 23.0 62.6, 24.5 62.1, 25.1 62.5 C 25.5 63.0, 24.8 63.6, 24.1 62.4 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 24.8 62.0 C 24.4 61.5, 26.0 61.0, 26.6 61.4 C 27.0 61.9, 26.3 62.5, 25.6 62.3 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 26.5 60.5 C 26.1 60.0, 27.6 59.5, 28.2 59.9 C 28.6 60.4, 28.0 61.0, 27.3 60.8 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 27.9 59.4 C 27.5 58.9, 29.1 58.4, 29.7 58.8 C 30.1 59.3, 29.4 59.9, 28.7 59.7 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 29.4 58.2 C 29.0 57.7, 30.6 57.2, 31.2 57.6 C 31.6 58.1, 30.9 58.7, 30.2 58.5 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 30.9 57.0 C 30.5 56.5, 32.1 56.0, 32.7 56.4 C 33.1 56.9, 32.5 57.5, 31.7 57.3 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            
            {/* Timber water bar */}
            <path d="M 32.2 56.4 L 33.8 55.1" stroke="#352010" strokeWidth="0.30" strokeLinecap="round" />

            <path d="M 32.4 55.8 C 32.0 55.3, 33.6 54.8, 34.2 55.2 C 34.6 55.7, 34.0 56.3, 33.2 56.1 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 33.9 54.6 C 33.5 54.1, 35.1 53.6, 35.7 54.0 C 36.1 54.5, 35.5 55.1, 34.7 54.9 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          </g>

          {/* Natural gravel & crushed stone scatter along path margins */}
          <g fill="#7D8D7B" opacity="0.8">
            <circle cx="17.0" cy="68.2" r="0.16" />
            <circle cx="18.9" cy="67.0" r="0.18" />
            <circle cx="21.6" cy="65.8" r="0.14" />
            <circle cx="23.5" cy="63.8" r="0.19" />
            <circle cx="26.0" cy="61.8" r="0.15" />
            <circle cx="28.3" cy="60.2" r="0.18" />
            <circle cx="30.5" cy="58.5" r="0.14" />
            <circle cx="33.0" cy="56.2" r="0.17" />
          </g>

          {/* ── Layer C: Active Learning Approach Trail (Recursion to Trees) ── */}
          <path
            d="M 36 53 Q 44 49, 51 46"
            fill="none"
            stroke="#658A59"
            strokeWidth="2.4"
            strokeLinecap="round"
            opacity="0.4"
          />
          <g filter="url(#trailShadow)">
            <path d="M 36.6 52.8 C 36.2 52.3, 38.0 51.7, 38.7 52.1 C 39.2 52.6, 38.4 53.2, 37.5 53.1 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 38.3 51.9 C 37.9 51.4, 39.7 50.8, 40.4 51.2 C 40.9 51.7, 40.1 52.3, 39.2 52.2 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            
            {/* Timber trail riser */}
            <path d="M 39.8 51.5 L 41.6 50.6" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />

            <path d="M 40.1 51.0 C 39.7 50.5, 41.5 49.9, 42.2 50.3 C 42.7 50.8, 41.9 51.4, 41.0 51.3 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 41.8 50.1 C 41.4 49.6, 43.2 49.0, 43.9 49.4 C 44.4 49.9, 43.6 50.5, 42.7 50.4 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 43.5 49.3 C 43.1 48.8, 44.9 48.2, 45.6 48.6 C 46.1 49.1, 45.3 49.7, 44.4 49.6 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            
            {/* Timber trail riser */}
            <path d="M 45.0 48.9 L 46.9 48.1" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />

            <path d="M 45.3 48.5 C 44.9 48.0, 46.7 47.4, 47.4 47.8 C 47.9 48.3, 47.1 48.9, 46.2 48.8 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 47.0 47.7 C 46.6 47.2, 48.4 46.6, 49.1 47.0 C 49.6 47.5, 48.8 48.1, 47.9 48.0 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 48.6 47.0 C 48.2 46.5, 50.0 45.9, 50.7 46.3 C 51.2 46.8, 50.4 47.4, 49.5 47.3 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            
            {/* Steps branching up toward Trees Learning Lodge boardwalk */}
            <path d="M 50.1 46.4 C 49.7 45.9, 51.5 45.3, 52.2 45.7 C 52.7 46.2, 51.9 46.8, 51.0 46.7 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          </g>

          {/* ── Layer D: Highland Scree Switchback Steps (Trees to Graphs to DP to Summit) ── */}
          <path
            d="M 51 46 Q 58 43, 64 42 Q 70 37, 75 32 Q 74 24, 67 17"
            fill="none"
            stroke="#536352"
            strokeWidth="0.8"
            strokeDasharray="1.8 1.2"
            opacity="0.5"
          />
          <g filter="url(#trailShadow)">
            {/* Rock slabs carved into exposed granite ridge */}
            <path d="M 52.5 45.5 C 52.2 45.1, 53.7 44.6, 54.3 44.9 C 54.7 45.3, 54.2 45.8, 53.4 45.7 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 54.4 44.8 C 54.1 44.4, 55.6 43.9, 56.2 44.2 C 56.6 44.6, 56.1 45.1, 55.3 45.0 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 56.3 44.2 C 56.0 43.8, 57.5 43.3, 58.1 43.6 C 58.5 44.0, 58.0 44.5, 57.2 44.4 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 58.2 43.6 C 57.9 43.2, 59.4 42.7, 60.0 43.0 C 60.4 43.4, 59.9 43.9, 59.1 43.8 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 60.1 43.0 C 59.8 42.6, 61.3 42.1, 61.9 42.4 C 62.3 42.8, 61.8 43.3, 61.0 43.2 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 62.0 42.4 C 61.7 42.0, 63.2 41.5, 63.8 41.8 C 64.2 42.2, 63.7 42.7, 62.9 42.6 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />

            {/* Steep Ascent to Dynamic Programming Ridge */}
            <path d="M 65.2 41.0 C 64.9 40.6, 66.4 40.0, 67.0 40.3 C 67.4 40.7, 66.8 41.2, 66.0 41.1 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 67.0 39.4 C 66.7 39.0, 68.2 38.4, 68.8 38.7 C 69.2 39.1, 68.6 39.6, 67.8 39.5 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 68.8 37.7 C 68.5 37.3, 70.0 36.7, 70.6 37.0 C 71.0 37.4, 70.4 37.9, 69.6 37.8 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 70.6 35.9 C 70.3 35.5, 71.8 34.9, 72.4 35.2 C 72.8 35.6, 72.2 36.1, 71.4 36.0 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 72.4 34.2 C 72.1 33.8, 73.6 33.2, 74.2 33.5 C 74.6 33.9, 74.0 34.4, 73.2 34.3 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 74.0 32.6 C 73.7 32.2, 75.2 31.6, 75.8 31.9 C 76.2 32.3, 75.6 32.8, 74.8 32.7 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />

            {/* Alpine Switchback Ledges to Algorithm Summit */}
            <path d="M 75.1 30.2 C 74.8 29.8, 76.1 29.3, 76.6 29.6 C 77.0 30.0, 76.4 30.5, 75.7 30.4 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 74.6 27.8 C 74.3 27.4, 75.6 26.9, 76.1 27.2 C 76.5 27.6, 75.9 28.1, 75.2 28.0 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 73.7 25.4 C 73.4 25.0, 74.7 24.5, 75.2 24.8 C 75.6 25.2, 75.0 25.7, 74.3 25.6 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 72.3 23.2 C 72.0 22.8, 73.3 22.3, 73.8 22.6 C 74.2 23.0, 73.6 23.5, 72.9 23.4 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 70.7 21.1 C 70.4 20.7, 71.7 20.2, 72.2 20.5 C 72.6 20.9, 72.0 21.4, 71.3 21.3 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 69.0 19.3 C 68.7 18.9, 70.0 18.4, 70.5 18.7 C 70.9 19.1, 70.3 19.6, 69.6 19.5 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
            <path d="M 67.8 17.8 C 67.5 17.4, 68.8 16.9, 69.3 17.2 C 69.7 17.6, 69.1 18.1, 68.4 18.0 Z" fill="url(#screeRock)" stroke="#465445" strokeWidth="0.08" />
          </g>

          {/* ── Layer E: Mountain Pass Steps (Trees toward Highland Gateway) ── */}
          <g filter="url(#trailShadow)">
            <path d="M 50.7 42.5 C 50.4 42.1, 51.8 41.6, 52.3 41.9 C 52.7 42.3, 52.2 42.8, 51.5 42.7 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 50.3 39.5 C 50.0 39.1, 51.4 38.6, 51.9 38.9 C 52.3 39.3, 51.8 39.8, 51.1 39.7 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 49.8 36.5 C 49.5 36.1, 50.9 35.6, 51.4 35.9 C 51.8 36.3, 51.3 36.8, 50.6 36.7 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 49.3 33.5 C 49.0 33.1, 50.4 32.6, 50.9 32.9 C 51.3 33.3, 50.8 33.8, 50.1 33.7 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 48.8 30.5 C 48.5 30.1, 49.9 29.6, 50.4 29.9 C 50.8 30.3, 50.3 30.8, 49.6 30.7 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 48.3 27.5 C 48.0 27.1, 49.4 26.6, 49.9 26.9 C 50.3 27.3, 49.8 27.8, 49.1 27.7 Z" fill="url(#flagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
            <path d="M 47.9 24.5 C 47.6 24.1, 49.0 23.6, 49.5 23.9 C 49.9 24.3, 49.4 24.8, 48.7 24.7 Z" fill="url(#flagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          </g>


          {/* ── Layer F: Geological Stone Trail Cairns (Navigational Rock Monuments) ── */}
          <g filter="url(#cairnShadow)">
            {/* Cairn 1: Lower Meadow Trailhead */}
            <g transform="translate(21.2, 65.3)">
              <ellipse cx="0" cy="0" rx="0.52" ry="0.22" fill="#424D40" />
              <ellipse cx="0" cy="-0.28" rx="0.40" ry="0.18" fill="#596657" />
              <ellipse cx="0" cy="-0.54" rx="0.30" ry="0.14" fill="#728070" />
              <ellipse cx="0" cy="-0.78" rx="0.18" ry="0.10" fill="#93A391" />
            </g>

            {/* Cairn 2: River Crossing Approach */}
            <g transform="translate(31.2, 57.3)">
              <ellipse cx="0" cy="0" rx="0.52" ry="0.22" fill="#424D40" />
              <ellipse cx="0" cy="-0.28" rx="0.40" ry="0.18" fill="#596657" />
              <ellipse cx="0" cy="-0.54" rx="0.30" ry="0.14" fill="#728070" />
              <ellipse cx="0" cy="-0.78" rx="0.18" ry="0.10" fill="#93A391" />
            </g>

            {/* Cairn 3: Trees Learning Lodge Trail Junction */}
            <g transform="translate(44.2, 49.6)">
              <ellipse cx="0" cy="0" rx="0.55" ry="0.24" fill="#384A37" />
              <ellipse cx="0" cy="-0.30" rx="0.44" ry="0.19" fill="#4E674D" />
              <ellipse cx="0" cy="-0.58" rx="0.32" ry="0.15" fill="#6A8768" />
              <ellipse cx="0" cy="-0.82" rx="0.20" ry="0.11" fill="#90B08E" />
            </g>

            {/* Cairn 4: Ridge Trail to Graphs */}
            <g transform="translate(58.2, 43.3)">
              <ellipse cx="0" cy="0" rx="0.50" ry="0.22" fill="#424D40" />
              <ellipse cx="0" cy="-0.28" rx="0.38" ry="0.17" fill="#596657" />
              <ellipse cx="0" cy="-0.54" rx="0.28" ry="0.13" fill="#728070" />
            </g>

            {/* Cairn 5: Upper Scree Switchback */}
            <g transform="translate(70.2, 37.2)">
              <ellipse cx="0" cy="0" rx="0.48" ry="0.20" fill="#424D40" />
              <ellipse cx="0" cy="-0.26" rx="0.36" ry="0.16" fill="#596657" />
              <ellipse cx="0" cy="-0.50" rx="0.26" ry="0.12" fill="#728070" />
            </g>

            {/* Cairn 6: Summit Ridge Approach */}
            <g transform="translate(73.2, 24.2)">
              <ellipse cx="0" cy="0" rx="0.48" ry="0.20" fill="#424D40" />
              <ellipse cx="0" cy="-0.26" rx="0.36" ry="0.16" fill="#596657" />
              <ellipse cx="0" cy="-0.50" rx="0.26" ry="0.12" fill="#728070" />
            </g>
          </g>
        </svg>

        {/* ── 3. Environmental Life: Atmospheric Clouds, Birds, Pines & Flora ── */}
        <div className="absolute top-0 inset-x-0 h-44 pointer-events-none z-1">
          <SoftCloud scale={0.95} className="absolute left-[6%] top-2 opacity-90 animate-float-slow" />
          <SoftCloud scale={0.78} className="absolute left-[28%] top-5 opacity-75 animate-float" />
          <SoftCloud scale={0.72} className="absolute right-[37%] top-1 opacity-75 animate-float-slow" />
          <SoftCloud scale={0.65} className="absolute right-[4%] top-6 opacity-65" />
          <SoaringBird scale={0.85} className="absolute left-[44%] top-7 opacity-65" />
          <SoaringBird scale={0.65} className="absolute left-[48%] top-11 opacity-50" />
        </div>

        {/* Left Foreground Forest Grove & Fawn */}
        <div className="absolute left-3 sm:left-8 bottom-3 z-15 pointer-events-none hidden sm:block">
          <div className="relative">
            <div className="ml-6 mb-1">
              <AlpineFawn scale={1.05} />
            </div>
            <AlpinePineTree variant="grove" scale={1.25} />
          </div>
        </div>

        {/* Midground Multi-Species Conifer Clusters along the meadow contours */}
        <div className="absolute left-[20%] bottom-[30%] z-12 pointer-events-none hidden md:block">
          <div className="relative flex items-end -space-x-4">
            <AlpinePineTree variant="slender" scale={0.88} />
            <AlpinePineTree variant="dense" scale={0.76} />
          </div>
        </div>
        <div className="absolute left-[32%] bottom-[20%] z-12 pointer-events-none hidden md:block">
          <div className="relative flex items-end -space-x-3">
            <AlpinePineTree variant="dense" scale={0.82} />
            <AlpinePineTree variant="slender" scale={0.74} />
          </div>
        </div>
        <div className="absolute left-[44%] bottom-[27%] z-12 pointer-events-none hidden md:block">
          <div className="relative flex items-end -space-x-3">
            <AlpinePineTree variant="ancient" scale={0.78} />
            <AlpinePineTree variant="windblown" scale={0.70} />
          </div>
        </div>

        {/* Timberline Conifers framing the high ridge to Graphs & DP */}
        <div className="absolute right-[27%] top-[38%] z-12 pointer-events-none hidden md:block">
          <div className="relative flex items-end -space-x-3">
            <AlpinePineTree variant="windblown" scale={0.82} />
            <AlpinePineTree variant="distant" scale={0.68} />
          </div>
        </div>
        <div className="absolute right-[19%] bottom-[32%] z-12 pointer-events-none hidden md:block">
          <div className="relative flex items-end -space-x-4">
            <AlpinePineTree variant="slender" scale={0.86} />
            <AlpinePineTree variant="dense" scale={0.78} />
          </div>
        </div>

        {/* Midground Pasture Cow peacefully grazing on sunny alpine slope */}
        <div className="absolute right-[26%] bottom-[25%] z-11 pointer-events-none hidden md:block opacity-90">
          <MeadowCow scale={0.72} />
        </div>

        {/* Right Foreground Stately Pine Grove (Repoussoir framing) */}
        <div className="absolute right-3 sm:right-8 bottom-3 z-15 pointer-events-none hidden sm:block">
          <div className="relative flex flex-col items-end">
            <AlpinePineTree variant="grove" scale={1.22} />
          </div>
        </div>

        {/* ── Environmental Multi-Zone Transition Landmark: Alpine Mountain Pass Gateway ── */}
        </div>

        {/* ── Environmental Multi-Zone Transition Landmark: Alpine Mountain Pass Gateway ── */}
        <div className="absolute left-[47.5%] top-[19%] z-14 -translate-x-1/2 pointer-events-auto hidden md:block">
          <div
            onClick={() => {
              setActiveZoneId("zone-2")
              setShowCourseInfo(true)
              setCameraMode("world")
            }}
            className="group cursor-pointer flex flex-col items-center transition-all duration-300 hover:-translate-y-1"
            title="Ascend through the Highland Mountain Pass into Zone 2: Highland Crags"
          >
            {/* Mountain Pass Gateway Landmark Graphic (Granite & Heavy Alpine Timber) */}
            <div className="relative w-28 h-20 drop-shadow-md">
              <svg viewBox="0 0 112 80" className="w-full h-full" fill="none">
                <defs>
                  <linearGradient id="gateTimber" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#633F26" />
                    <stop offset="50%" stopColor="#4A2E1A" />
                    <stop offset="100%" stopColor="#321D0E" />
                  </linearGradient>
                  <linearGradient id="gateStone" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#6C7A68" />
                    <stop offset="50%" stopColor="#536050" />
                    <stop offset="100%" stopColor="#3D473A" />
                  </linearGradient>
                  <radialGradient id="gateMist" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                    <stop offset="65%" stopColor="#E2EBE5" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#D4E4DC" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* Ground Contact Shadow */}
                <ellipse cx="56" cy="74" rx="46" ry="5.5" fill="#142416" opacity="0.35" />

                {/* Billowing Mountain Mist / Cloud Corridor passing through the archway */}
                <ellipse cx="56" cy="56" rx="26" ry="18" fill="url(#gateMist)" />
                <ellipse cx="56" cy="46" rx="20" ry="12" fill="url(#gateMist)" />

                {/* Left Stone Masonry Pylon Base */}
                <polygon points="18,74 34,74 32,54 20,54" fill="url(#gateStone)" stroke="#2C3529" strokeWidth="1" />
                <rect x="19" y="58" width="14" height="4" rx="0.5" fill="#7D8D79" stroke="#2C3529" strokeWidth="0.6" />
                <rect x="20" y="65" width="13" height="4.5" rx="0.5" fill="#62705E" stroke="#2C3529" strokeWidth="0.6" />

                {/* Right Stone Masonry Pylon Base */}
                <polygon points="78,74 94,74 92,54 80,54" fill="url(#gateStone)" stroke="#2C3529" strokeWidth="1" />
                <rect x="79" y="58" width="14" height="4" rx="0.5" fill="#7D8D79" stroke="#2C3529" strokeWidth="0.6" />
                <rect x="79" y="65" width="13" height="4.5" rx="0.5" fill="#62705E" stroke="#2C3529" strokeWidth="0.6" />

                {/* Heavy Hand-Hewn Timber Posts */}
                <rect x="23" y="24" width="7" height="32" rx="1.2" fill="url(#gateTimber)" stroke="#24140A" strokeWidth="1" />
                <rect x="82" y="24" width="7" height="32" rx="1.2" fill="url(#gateTimber)" stroke="#24140A" strokeWidth="1" />

                {/* Diagonal Knee Braces */}
                <line x1="28" y1="36" x2="42" y2="24" stroke="#4A2E1A" strokeWidth="3" strokeLinecap="round" />
                <line x1="84" y1="36" x2="70" y2="24" stroke="#4A2E1A" strokeWidth="3" strokeLinecap="round" />

                {/* Heavy Timber Lintels (Arched Crossbeam) */}
                <rect x="16" y="20" width="80" height="7.5" rx="2" fill="url(#gateTimber)" stroke="#24140A" strokeWidth="1.2" />
                <polygon points="18,20 56,12 94,20" fill="#3D2413" stroke="#24140A" strokeWidth="1.2" />

                {/* Hanging Carved Alpine Cedar Signboard */}
                <line x1="38" y1="27.5" x2="38" y2="33" stroke="#1A1A1A" strokeWidth="1" />
                <line x1="74" y1="27.5" x2="74" y2="33" stroke="#1A1A1A" strokeWidth="1" />
                <rect x="30" y="32" width="52" height="12" rx="2" fill="#52341F" stroke="#2B180C" strokeWidth="1" />
                <text x="56" y="39" textAnchor="middle" fill="#FFFBEB" fontSize="4.8" fontWeight="bold" letterSpacing="0.4" fontFamily="sans-serif">
                  HIGHLAND PASS
                </text>
                <text x="56" y="42.5" textAnchor="middle" fill="#86EFAC" fontSize="3.6" fontWeight="bold" letterSpacing="0.3" fontFamily="sans-serif">
                  ZONE 2 CONTINUATION ➔
                </text>

                {/* Wrought Iron Lantern with Glowing Amber Core */}
                <line x1="56" y1="20" x2="56" y2="27" stroke="#1F1F1F" strokeWidth="1" />
                <polygon points="53,27 59,27 60,34 52,34" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
                <circle cx="56" cy="30.5" r="2.2" fill="#FEF08A" className="animate-pulse" />

                {/* Weathered Stone Trail Marker by Gateway Base */}
                <path d="M 8 74 L 14 62 L 17 74 Z" fill="#5F6F5E" stroke="#333E32" strokeWidth="0.8" />
                <rect x="9" y="66" width="7" height="3" rx="0.5" fill="#3D4B3C" />
              </svg>
            </div>
          </div>
        </div>

        {/* ── Meadow Wildflowers & Natural Split-Rail Fence ── */}
        <div className="absolute inset-0 pointer-events-none z-6 hidden sm:block">
          {/* Edelweiss & Buttercup patches */}
          <div className="absolute left-[21%] bottom-[16%] flex gap-1.5 items-end opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FCE278]" />
            <div className="w-1 h-1 rounded-full bg-white mb-0.5" />

          <div className="absolute left-[43%] bottom-[23%] flex gap-1.5 items-end opacity-80">
            <div className="w-1.5 h-1.5 rounded-full bg-[#FCE278]" />
            <div className="w-1 h-1 rounded-full bg-white mb-0.5" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#93C5FD]" />
          </div>

          {/* Split-rail timber fence near trailhead cabin */}
          <div className="absolute left-[11%] bottom-[25%] opacity-75">
            <svg viewBox="0 0 36 16" className="w-9 h-4" fill="none">
              <line x1="4" y1="2" x2="4" y2="15" stroke="#482A14" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="18" y1="3" x2="18" y2="15" stroke="#482A14" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="32" y1="2" x2="32" y2="15" stroke="#482A14" strokeWidth="1.6" strokeLinecap="round" />
              <line x1="2" y1="6" x2="34" y2="8" stroke="#683F21" strokeWidth="1.4" strokeLinecap="round" />
              <line x1="2" y1="11" x2="34" y2="13" stroke="#683F21" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            4. THE 7 SCENIC COURSE DESTINATION PLACES (Grounded Micro-Architecture)
            ══════════════════════════════════════════════════════════════════ */}
        <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">
          {dsaModules.map((mod, index) => {
            const isSelected = selectedModuleId === mod.id
            const isCurrent = mod.status === "current"
            const isCompleted = mod.status === "completed"
            // In focused view, show only the focus module and its neighbours on the trail
            const isVisibleInCurrentView = cameraMode === "world" || Math.abs(index - focusIndex) <= 1

            return (
              <div
                key={mod.id}
                onClick={() => {
                  // First click selects; clicking the selected landmark enters it
                  // (enterModule itself refuses a locked module).
                  if (isSelected) {
                    enterModule?.(mod.id)
                  } else {
                    setSelectedModuleId(mod.id)
                  }
                }}
                style={{
                  left: `${mod.xPercent}%`,
                  top: `${mod.yPercent}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-500 ${
                  isVisibleInCurrentView ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none scale-90"
                }`}
              >
                <div className="relative flex flex-col items-center">

                  {/* ── SCENIC LANDMARK GRAPHIC (GROUNDED INTO TERRAIN) ── */}
                  <div className={`transition-transform duration-300 group-hover:scale-108 ${isSelected ? "scale-105" : ""}`}>
                    
                    {/* Zone 1: Foundations (Cozy Timber Trailhead Cabin, Stone Terrace & Signpost) */}
                    {mod.id === "foundations" && (
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-30 h-9 pointer-events-none z-0">
                          <svg viewBox="0 0 120 36" className="w-full h-full" fill="none">
                            <ellipse cx="60" cy="26" rx="55" ry="7" fill="#1C2E1B" opacity="0.28" />
                            <path d="M 8 23 Q 60 12, 112 23 L 106 30 Q 60 21, 12 30 Z" fill="#759864" />
                            <path d="M 14 22 Q 60 13, 106 22 L 100 27 Q 60 20, 18 27 Z" fill="#8BB07A" />
                            {/* Dressed fieldstone foundation retaining wall */}
                            <path d="M 26 24 L 46 24 L 44 29 L 24 29 Z" fill="#667462" stroke="#485345" strokeWidth="0.8" />
                            <path d="M 48 23 L 74 23 L 72 28 L 46 28 Z" fill="#758471" stroke="#485345" strokeWidth="0.8" />
                            <path d="M 76 24 L 96 24 L 94 29 L 74 29 Z" fill="#667462" stroke="#485345" strokeWidth="0.8" />
                            {/* Flagstone approach step */}
                            <ellipse cx="60" cy="28" rx="8" ry="2.6" fill="#E2E8DE" stroke="#758471" strokeWidth="0.6" />
                          </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-center">
                          <AlpineCabin variant="standard" scale={0.94} hasSmoke={true} isGlow={true} />
                          <div className="absolute -left-3.5 bottom-0">
                            <AlpinePineTree variant="slender" scale={0.72} />
                          </div>
                          {/* Weathered Carved Wood Directional Signpost */}
                          <div className="absolute -right-3.5 bottom-1">
                            <svg viewBox="0 0 18 22" className="w-4.5 h-5.5 drop-shadow-2xs">
                              <rect x="8" y="7" width="2" height="15" fill="#3D2412" rx="0.5" />
                              <rect x="1" y="2" width="16" height="7" rx="1.5" fill="#52341F" stroke="#351F10" strokeWidth="0.8" />
                              <line x1="3" y1="5.5" x2="15" y2="5.5" stroke="#E6E0D6" strokeWidth="0.8" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone 2: Linked Structures (Alpine Stream Footbridge with Timber Stringers & Stone Abutments) */}
                    {mod.id === "linked-structures" && (
                      <div className="relative flex flex-col items-center justify-center w-24 h-17">
                        <svg viewBox="0 0 96 56" className="w-24 h-15 drop-shadow-xs" fill="none">
                          {/* Ambient Ground & Water Shadow */}
                          <ellipse cx="48" cy="45" rx="46" ry="8" fill="#182817" opacity="0.25" />
                          
                          {/* Grassy Stream Banks */}
                          <path d="M 0 36 Q 20 32, 26 40 L 24 51 L 0 51 Z" fill="#759864" />
                          <path d="M 0 34 Q 18 31, 24 38 L 22 42 L 0 40 Z" fill="#8BB07A" />
                          <path d="M 70 40 Q 78 32, 96 36 L 96 51 L 72 51 Z" fill="#759864" />
                          <path d="M 72 38 Q 80 31, 96 34 L 96 40 L 74 42 Z" fill="#8BB07A" />
                          
                          {/* Mountain Stream (Glacial Turquoise Cascade with Water Ripples) */}
                          <path d="M 14 45 C 30 38, 66 38, 82 45 L 84 51 C 66 44, 30 44, 12 51 Z" fill="#0284C7" opacity="0.38" />
                          <path d="M 16 43 C 32 37, 64 37, 80 43" stroke="#38BDF8" strokeWidth="4.4" strokeLinecap="round" opacity="0.9" />
                          <path d="M 24 44.5 C 36 40, 60 40, 72 44.5" stroke="#E0F2FE" strokeWidth="2.2" strokeLinecap="round" opacity="0.95" />
                          <circle cx="38" cy="42" r="1" fill="#FFFFFF" opacity="0.8" />
                          <circle cx="58" cy="42" r="1.2" fill="#FFFFFF" opacity="0.8" />
                          
                          {/* Heavy Stone Bridge Abutments */}
                          <rect x="18" y="34" width="11" height="10" rx="1.5" fill="#5F6F5D" stroke="#3C483B" strokeWidth="1" />
                          <rect x="67" y="34" width="11" height="10" rx="1.5" fill="#5F6F5D" stroke="#3C483B" strokeWidth="1" />
                          
                          {/* Arched Timber Stringers & Footbridge Deck */}
                          <path d="M 20 33 Q 48 15, 76 33" stroke="#522F17" strokeWidth="5.0" strokeLinecap="round" />
                          <path d="M 22 26 Q 48 9, 74 26" stroke="#7A4927" strokeWidth="3.4" strokeLinecap="round" />
                          
                          {/* Handrail Posts & Spindles */}
                          <line x1="30" y1="30" x2="30" y2="16" stroke="#3B1F0E" strokeWidth="2.4" strokeLinecap="round" />
                          <line x1="48" y1="24" x2="48" y2="11" stroke="#3B1F0E" strokeWidth="2.4" strokeLinecap="round" />
                          <line x1="66" y1="30" x2="66" y2="16" stroke="#3B1F0E" strokeWidth="2.4" strokeLinecap="round" />
                        </svg>
                        <div className="absolute -right-3.5 top-0">
                          <AlpinePineTree variant="slender" scale={0.76} />
                        </div>
                      </div>
                    )}

                    {/* Zone 3: Recursion (Granite Megalith Archway with Crystalline Violet Resonance) */}
                    {mod.id === "recursion" && (
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-26 h-10 pointer-events-none z-0">
                          <svg viewBox="0 0 104 42" className="w-full h-full" fill="none">
                            <ellipse cx="52" cy="31" rx="48" ry="7" fill="#1C2E1B" opacity="0.28" />
                            <polygon points="14,31 90,31 82,21 22,21" fill="#546552" stroke="#3A4739" strokeWidth="1" />
                            <polygon points="20,23 84,23 80,16 24,16" fill="#6B7E68" />
                            {/* Weathered glacial erratic boulders flanking portal */}
                            <ellipse cx="18" cy="23" rx="9" ry="6.5" fill="#4B5849" stroke="#333D32" strokeWidth="0.8" />
                            <ellipse cx="86" cy="24" rx="10" ry="7.5" fill="#4B5849" stroke="#333D32" strokeWidth="0.8" />
                            <rect x="40" y="26" width="24" height="3" rx="1" fill="#889885" stroke="#4B5849" strokeWidth="0.8" />
                          </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-center">
                          <svg viewBox="0 0 58 48" className="w-15 h-13 drop-shadow-xs" fill="none">
                            {/* Portal Interior Shadow */}
                            <path d="M 12 45 L 12 21 C 12 8, 46 8, 46 21 L 46 45 Z" fill="#182318" />
                            {/* Heavy Granite Arch Pillars & Keystone */}
                            <path d="M 10 45 L 10 21 C 10 6, 48 6, 48 21 L 48 45" stroke="#5A6D57" strokeWidth="6.8" strokeLinecap="round" />
                            <path d="M 16 45 L 16 21 C 16 11, 42 11, 42 21 L 42 45" stroke="#7A9376" strokeWidth="2.8" strokeLinecap="round" />
                            {/* Arcane Violet Recursive Rune Glow */}
                            <circle cx="29" cy="21" r="5" fill="#9333EA" className="animate-pulse" opacity="0.88" />
                            <circle cx="29" cy="21" r="2.8" fill="#F3E8FF" />
                          </svg>
                          <div className="absolute -left-2.5 top-0">
                            <AlpinePineTree variant="slender" scale={0.72} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone 4: Trees (HERO ACTIVE ZONE: Grand Two-Story Learning Lodge, Boardwalk Terrace & Ancient Grove) */}
                    {mod.id === "trees" && (
                      <div className="relative flex flex-col items-center justify-center">
                        {/* Active Learning Waypoint Beacon Halo */}
                        <div className="absolute inset-0 -m-5 rounded-full bg-[#168E65]/22 animate-ping pointer-events-none" />
                        <div className="absolute inset-0 -m-2.5 rounded-full border-2 border-[#168E65]/70 animate-pulse pointer-events-none" />

                        {/* Elevated Forest Clearing, Stone Retaining Wall & Timber Boardwalk Deck */}
                        <div className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 w-38 h-12 pointer-events-none z-5">
                          <svg viewBox="0 0 152 48" className="w-full h-full" fill="none">
                            <ellipse cx="76" cy="35" rx="70" ry="10" fill="#152417" opacity="0.32" />
                            <path d="M 12 30 Q 76 15, 140 30 L 134 41 Q 76 26, 18 41 Z" fill="#648557" />
                            {/* Heavy Timber Boardwalk Deck */}
                            <polygon points="28,26 124,26 118,36 22,36" fill="#694121" stroke="#442713" strokeWidth="1.2" />
                            <polygon points="30,26 122,26 119,30 27,30" fill="#80532C" />
                            {/* Deck Plank Spacers */}
                            <line x1="42" y1="26" x2="37" y2="36" stroke="#442713" strokeWidth="0.9" />
                            <line x1="58" y1="26" x2="53" y2="36" stroke="#442713" strokeWidth="0.9" />
                            <line x1="76" y1="26" x2="71" y2="36" stroke="#442713" strokeWidth="0.9" />
                            <line x1="94" y1="26" x2="89" y2="36" stroke="#442713" strokeWidth="0.9" />
                            <line x1="110" y1="26" x2="105" y2="36" stroke="#442713" strokeWidth="0.9" />
                            {/* Flagstone Approach Steps down to Trail */}
                            <ellipse cx="72" cy="38" rx="8.5" ry="3" fill="#E8EFE5" stroke="#6F8D67" strokeWidth="0.9" />
                          </svg>
                        </div>

                        {/* Background: Ancient Old-Growth Pine towering over the roofline */}
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-0">
                          <AlpinePineTree variant="ancient" scale={1.28} />
                        </div>

                        {/* Fore-mid: Two-Story Alpine Learning Lodge */}
                        <div className="relative z-10">
                          <AlpineCabin variant="lodge" scale={1.25} hasSmoke={true} isGlow={true} />
                        </div>

                        {/* Flanking Conifer Grove: Dense Fir on left, Slender Spruce on right */}
                        <div className="absolute -left-8 top-1 z-12">
                          <AlpinePineTree variant="dense" scale={0.94} />
                        </div>
                        <div className="absolute -right-7.5 top-3 z-12">
                          <AlpinePineTree variant="slender" scale={0.88} />
                        </div>

                        {/* Corner Timber Post: Perched Owl Mascot */}
                        <div className="absolute -top-6 -right-3 z-20 w-8.5 h-8.5 rounded-full bg-white/95 border-2 border-[#168E65] shadow-md flex items-center justify-center">
                          <OwlAvatar size={23} state="listening" />
                        </div>

                        {/* Warm Hanging Brass Porch Lantern */}
                        <div className="absolute left-1 bottom-3 z-15">
                          <svg viewBox="0 0 10 14" className="w-3 h-4 drop-shadow-2xs">
                            <line x1="5" y1="0" x2="5" y2="4" stroke="#333" strokeWidth="0.8" />
                            <rect x="2" y="4" width="6" height="7" rx="1.5" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
                            <circle cx="5" cy="7.5" r="1.6" fill="#FEF08A" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Zone 5: Graphs (Alpine Fire Lookout Tower on High Granite Promontory) */}
                    {mod.id === "graphs" && (
                      <div className="relative flex flex-col items-center justify-center opacity-92">
                        {/* Exposed Granite Cliff Promontory with Cliff Strata */}
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-9 pointer-events-none z-0">
                          <svg viewBox="0 0 112 36" className="w-full h-full" fill="none">
                            <ellipse cx="56" cy="27" rx="52" ry="6.5" fill="#182518" opacity="0.32" />
                            <polygon points="6,26 106,26 98,14 14,14" fill="#5A6857" stroke="#3C463A" strokeWidth="1.2" />
                            <polygon points="14,14 98,14 92,9 20,9" fill="#758572" />
                            {/* Rock strata lines */}
                            <line x1="30" y1="14" x2="28" y2="26" stroke="#3C463A" strokeWidth="1" />
                            <line x1="58" y1="14" x2="56" y2="26" stroke="#3C463A" strokeWidth="1" />
                            <line x1="84" y1="14" x2="82" y2="26" stroke="#3C463A" strokeWidth="1" />
                          </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-center">
                          <AlpineCabin variant="lookout" scale={1.05} isGlow={true} />
                          <div className="absolute -right-3.5 bottom-1">
                            <AlpinePineTree variant="windblown" scale={0.78} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone 6: Dynamic Programming (Alpine Stone Mountain Chalet on Ridge Terrace) */}
                    {mod.id === "dp" && (
                      <div className="relative flex flex-col items-center justify-center opacity-92">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-9 pointer-events-none z-0">
                          <svg viewBox="0 0 112 36" className="w-full h-full" fill="none">
                            <ellipse cx="56" cy="27" rx="52" ry="6.5" fill="#1A281A" opacity="0.32" />
                            <polygon points="8,26 104,26 96,15 16,15" fill="#627260" stroke="#424E40" strokeWidth="1.2" />
                            <polygon points="16,15 96,15 92,10 20,10" fill="#7D8F7B" />
                            <line x1="32" y1="15" x2="30" y2="26" stroke="#424E40" strokeWidth="1" />
                            <line x1="56" y1="15" x2="54" y2="26" stroke="#424E40" strokeWidth="1" />
                            <line x1="80" y1="15" x2="78" y2="26" stroke="#424E40" strokeWidth="1" />
                            {/* Snow drifts on stone ledge */}
                            <path d="M 12 18 Q 24 12, 36 17 Q 24 16, 12 18" fill="#FFFFFF" opacity="0.9" />
                            <path d="M 76 17 Q 90 12, 102 18 Q 90 15, 76 17" fill="#FFFFFF" opacity="0.9" />
                            <rect x="44" y="20" width="24" height="3" rx="1" fill="#9FB09D" stroke="#546352" strokeWidth="0.8" />
                          </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-center">
                          <AlpineCabin variant="stoneChalet" scale={0.96} hasSmoke={true} isGlow={true} />
                          <div className="absolute -left-3.5 bottom-0">
                            <AlpinePineTree variant="windblown" scale={0.74} />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Zone 7: Algorithm Summit (Celestial Summit Observatory with Verdigris Copper Cupola) */}
                    {mod.id === "summit" && (
                      <div className="relative flex flex-col items-center justify-center opacity-95">
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 h-9 pointer-events-none z-0">
                          <svg viewBox="0 0 112 36" className="w-full h-full" fill="none">
                            <ellipse cx="56" cy="27" rx="50" ry="6" fill="#182518" opacity="0.35" />
                            <polygon points="10,25 102,25 94,14 18,14" fill="#586756" stroke="#3C473A" strokeWidth="1.2" />
                            <polygon points="18,14 94,14 88,8 24,8" fill="#738470" />
                            {/* Glacial Summit Snow Cornices */}
                            <path d="M 8 20 Q 28 11, 48 16 Q 28 14, 8 20" fill="#FFFFFF" opacity="0.96" />
                            <path d="M 64 16 Q 84 10, 104 20 Q 84 13, 64 16" fill="#FFFFFF" opacity="0.96" />
                            <ellipse cx="56" cy="18" rx="12" ry="3.5" fill="#9AA998" stroke="#546352" strokeWidth="0.8" />
                          </svg>
                        </div>

                        <div className="relative z-10 flex items-center justify-center">
                          <AlpineCabin variant="summit" scale={1.08} isGlow={true} hasFlag={true} flagText="Summit ⭐" />
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ── COMPACT PROGRESSION BADGES (Responsive & Legible) ── */}
                  <div className={`mt-0.5 sm:mt-1.5 px-1.5 sm:px-2.5 py-0.5 rounded-full text-[8.5px] sm:text-[10px] font-bold tracking-tight flex items-center gap-1 shadow-xs transition-all whitespace-nowrap ${
                    isCurrent
                      ? "bg-[#168E65] text-white shadow-[0_2px_10px_rgba(22,142,101,0.38)] ring-2 ring-white/80 scale-100 sm:scale-105"
                      : isSelected
                      ? "bg-white text-[#214A32] border border-[#BBD4B8] shadow-sm ring-1 ring-[#168E65]"
                      : isCompleted
                      ? "bg-white/92 text-[#214A32] border border-[#C2DAC0] backdrop-blur-xs"
                      : "bg-white/80 text-gray-600 border border-white/70 backdrop-blur-xs"
                  }`}>
                    <span className="text-[9px] sm:text-[11px]">{mod.icon}</span>
                    <span className="font-extrabold">
                      {mod.id === "linked-structures" ? (
                        <>
                          <span className="sm:hidden">Linked</span>
                          <span className="hidden sm:inline">Linked Structures</span>
                        </>
                      ) : mod.id === "dp" ? (
                        <>
                          <span className="sm:hidden">DP</span>
                          <span className="hidden sm:inline">Dynamic Programming</span>
                        </>
                      ) : mod.id === "summit" ? (
                        <>
                          <span className="sm:hidden">Summit</span>
                          <span className="hidden sm:inline">Algorithm Summit</span>
                        </>
                      ) : (
                        mod.name
                      )}
                    </span>
                    
                    {isCompleted && (
                      <span className="text-[#128A5B] font-black text-[9px] sm:text-[11px]">✓</span>
                    )}
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 ml-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                        <span className="text-[7.5px] sm:text-[9px] uppercase tracking-wider text-emerald-100 font-black">Active</span>
                      </span>
                    )}
                    {mod.status === "locked" && (
                      <span className="text-[8px] sm:text-[9px] text-gray-400">🔒</span>
                    )}
                  </div>

                </div>
              </div>
            )
          })}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. FLOATING HUD CONTROLS: MULTI-ZONE PROGRESSION & VIEW TOGGLE
          ══════════════════════════════════════════════════════════════════ */}
      
      {/* Top-Left Progress Indicator & Zone Continuity Dropdown */}
      <div className="absolute top-3 sm:top-4 left-4 sm:left-6 z-30 pointer-events-auto hidden sm:flex flex-col gap-1.5 animate-fade-up">
        <button
          onClick={() => setShowCourseInfo(!showCourseInfo)}
          className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#E2EED5]/92 backdrop-blur-md border border-white/75 shadow-[0_10px_24px_rgba(40,65,45,0.06)] hover:bg-[#E2EED5] transition-all cursor-pointer text-xs font-bold text-[#234E35]"
        >
          <span>🏔️</span>
          <span className="font-extrabold">Zone 1: Alpine Valleys</span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-[#168E65] font-black">
            {completedCount} / {dsaModules.length} Modules Completed
          </span>
          <span className="text-gray-300">&bull;</span>
          <span className="text-xs text-gray-600 font-medium font-mono">
            {simulatedReadinessScore}% Ready
          </span>
          
          <div className="w-10 h-1.5 rounded-full bg-[#CBDCC4] overflow-hidden ml-0.5">
            <div
              className="h-full bg-[#168E65] rounded-full transition-all duration-500"
              style={{ width: `${(completedCount / dsaModules.length) * 100}%` }}
            />
          </div>
          
          <span className="text-[9px] text-gray-500 ml-0.5">({showCourseInfo ? "▴" : "▾"})</span>
        </button>

        {/* Multi-Zone Dropdown Drawer */}
        {showCourseInfo && (
          <div className="w-80 rounded-2xl bg-[#E2EED5]/95 backdrop-blur-md border border-[#BDD4B6] p-3.5 shadow-[0_16px_36px_rgba(40,65,45,0.12)] text-xs text-[#234E35] z-40">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#CBDCC4]/70">
              <span className="font-black text-[#1B3F2B]">Continuous Course World</span>
              <span className="text-[10px] font-extrabold text-[#168E65]">3 Connected Zones</span>
            </div>
            
            <div className="space-y-1.5 mb-3">
              {courseZones.map(zone => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setActiveZoneId(zone.id)
                    if (zone.id !== "zone-1") {
                      setCameraMode("world")
                    }
                  }}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    activeZoneId === zone.id
                      ? "bg-white/90 border-[#168E65] shadow-2xs"
                      : "bg-white/50 border-[#CBDCC4]/60 hover:bg-white/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#1B3F2B] flex items-center gap-1.5">
                      <span>{zone.number === 1 ? "🌲" : zone.number === 2 ? "🧗" : "⭐"}</span>
                      Zone {zone.number}: {zone.title}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      zone.status === "active" ? "bg-[#168E65]/15 text-[#168E65]" : "bg-gray-200 text-gray-500"
                    }`}>
                      {zone.status === "active" ? "Active" : "Pass Locked"}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-1">{zone.description}</p>
                </div>
              ))}
            </div>

            <p className="text-[10px] text-gray-500 italic border-t border-[#CBDCC4]/50 pt-2">
              The trail ascends continuously through mountain passes and cloud ridges, scaling to new algorithmic domains without overcrowding.
            </p>
          </div>
        )}
      </div>

      {/* Top-Right Active Module Card on Desktop */}
      <div className="absolute top-3 sm:top-4 right-4 sm:right-6 z-30 pointer-events-auto hidden sm:block w-64 lg:w-68 animate-fade-up">
        <div className="rounded-[20px] bg-[#E2EED5]/92 backdrop-blur-md border border-white/65 p-3 shadow-[0_16px_36px_rgba(40,65,45,0.08)]">
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-xl bg-white/90 border border-[#BBD4B8] flex items-center justify-center text-sm shadow-2xs flex-shrink-0">
              {activeModule.icon}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-black uppercase text-[#3B6B49] tracking-wider block">
                Zone {activeModule.zoneNumber} &bull; {activeModule.status === "current" ? "CURRENT FOCUS" : activeModule.status.toUpperCase()}
              </span>
              <h4 className="text-xs font-black text-[#1B3F2B] truncate leading-tight mt-0.5">
                {activeModule.name}
              </h4>
            </div>
          </div>

          <p className="text-[10.5px] text-gray-600 leading-snug mb-2.5">
            {activeModule.conceptSummary}
          </p>

          {activeModule.status === "current" || activeModule.status === "available" ? (
            <button
              onClick={handleStartActiveLesson}
              className="w-full py-1.5 rounded-full bg-[#168E65] hover:bg-[#127956] text-white text-xs font-bold tracking-wide shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span>Enter Module</span>
              <span>➔</span>
            </button>
          ) : activeModule.status === "completed" ? (
            <button
              onClick={() => (enterModule ? enterModule(activeModule.id) : onSelectNode(nodes[0]))}
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

      {/* ══════════════════════════════════════════════════════════════════
          6. FLOATING DOCK & CAMERA VIEW CONTROLS (Focused vs. Full World Map)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute bottom-3 inset-x-0 z-30 px-3 sm:px-6 flex justify-center pointer-events-none">
        
        {/* ── Mobile Streamlined Bottom Pill Bar ── */}
        <div className="sm:hidden pointer-events-auto rounded-full bg-[#E2EED5]/94 backdrop-blur-md border border-white/70 p-1.5 shadow-[0_12px_28px_rgba(40,65,45,0.12)] flex items-center gap-2 max-w-[94vw]">
          <div className="flex items-center gap-1.5 pl-1.5">
            <span className="text-sm">{focusModule.icon}</span>
            <span className="text-[11px] font-black text-[#1B3F2B] truncate max-w-[80px]">{focusModule.name}</span>
          </div>

          <button
            onClick={handleResume}
            className="px-3.5 py-1.5 rounded-full bg-[#168E65] hover:bg-[#127956] text-white text-[10.5px] font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <span>Enter</span>
            <span>➔</span>
          </button>

          {/* Mobile Camera Toggle Button */}
          <button
            onClick={() => setCameraMode(cameraMode === "focused" ? "world" : "focused")}
            className="px-2.5 py-1.5 rounded-full bg-white/85 text-[#1B3F2B] border border-[#BBD4B8] text-[10px] font-bold flex items-center gap-1"
          >
            {cameraMode === "focused" ? "🗺️ Full Map" : "🎯 Focus"}
          </button>
        </div>

        {/* ── Desktop Floating Pill Dock ── */}
        <div className="hidden sm:flex pointer-events-auto rounded-full bg-[#E2EED5]/92 backdrop-blur-md border border-white/75 p-1.5 shadow-[0_14px_32px_rgba(40,65,45,0.10)] items-center gap-2.5">
          
          {/* Quick Landmark Jump Buttons */}
          <div className="flex items-center gap-1 pl-1">
            <button
              onClick={() => {
                setSelectedModuleId(focusModule.id)
                setCameraMode("focused")
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs ${
                selectedModuleId === focusModule.id && cameraMode === "focused" ? "bg-[#168E65] text-white" : "bg-white/75 hover:bg-white text-gray-600"
              }`}
              title={`Focus Active Area: ${focusModule.name}`}
            >
              🧭
            </button>
            <button
              onClick={() => {
                setSelectedModuleId("foundations")
                setCameraMode("world")
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs ${
                selectedModuleId === "foundations" ? "bg-[#168E65] text-white" : "bg-white/75 hover:bg-white text-gray-600"
              }`}
              title="Trailhead: Foundations"
            >
              🌱
            </button>
            <button
              onClick={() => {
                setSelectedModuleId("summit")
                setCameraMode("world")
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all cursor-pointer shadow-2xs ${
                selectedModuleId === "summit" ? "bg-[#168E65] text-white" : "bg-white/75 hover:bg-white text-gray-600"
              }`}
              title="Summit Observatory"
            >
              ⭐
            </button>
          </div>

          {/* Primary Relay CTA */}
          <button
            onClick={handleResume}
            className="px-5 py-1.5 rounded-full bg-[#168E65] hover:bg-[#127956] text-white text-xs font-bold tracking-wide shadow-xs flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 transition-all"
          >
            <span>Resume: {focusModule.name}</span>
            <span>➔</span>
          </button>

          {/* ── CORE FEATURE 1: VIEW FULL WORLD MAP / FOCUS CURRENT AREA TOGGLE ── */}
          <button
            onClick={() => setCameraMode(cameraMode === "focused" ? "world" : "focused")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs ${
              cameraMode === "focused"
                ? "bg-white/90 hover:bg-white text-[#1B3F2B] border border-[#BDD4B6] hover:scale-105"
                : "bg-[#168E65]/15 hover:bg-[#168E65]/25 text-[#168E65] border border-[#168E65]/40 hover:scale-105"
            }`}
          >
            {cameraMode === "focused" ? (
              <>
                <span>🗺️</span>
                <span>View Full World Map</span>
              </>
            ) : (
              <>
                <span>🎯</span>
                <span>Focus Active Area ({focusModule.name})</span>
              </>
            )}
          </button>

        </div>
      </div>

    </div>
  )
}
