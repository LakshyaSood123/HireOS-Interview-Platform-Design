import { useState } from "react"
import type { RecursiveLandmarkData } from "../worldV2Types"
import AlpineMountainRange from "../../forest/scenic/AlpineMountainRange"
import AlpinePineTree from "../../forest/scenic/AlpinePineTree"
import AlpineCabin from "../../forest/scenic/AlpineCabin"
import { AlpineGoat, AlpineFawn, MeadowCow, SoaringBird } from "../../forest/scenic/ScenicAnimals"
import SoftCloud from "../../forest/scenic/SoftCloud"
import OwlAvatar from "../../OwlAvatar"

interface RecursiveForestLandscapeProps {
  landmarks: RecursiveLandmarkData[]
  activeLandmarkId: string | null
  onSelectLandmark: (landmark: RecursiveLandmarkData) => void
  className?: string
}

export default function RecursiveForestLandscape({
  landmarks,
  activeLandmarkId,
  onSelectLandmark,
  className = "",
}: RecursiveForestLandscapeProps) {
  const [hoveredLandmarkId, setHoveredLandmarkId] = useState<string | null>(null)

  const recursion = landmarks.find((l) => l.id === "recursion")
  const backtracking = landmarks.find((l) => l.id === "backtracking")
  const trees = landmarks.find((l) => l.id === "trees")
  const bst = landmarks.find((l) => l.id === "bst")
  const highlandPass = landmarks.find((l) => l.id === "highland-pass")

  return (
    <div className={`relative w-full h-full bg-[#D2ECED] select-none font-display overflow-hidden ${className}`}>
      {/* ══════════════════════════════════════════════════════════════════
          1. SCENIC MOUNTAIN MASSIFS & TEXTURED MEADOW BASELINE
          Directly leverages approved photorealistic Alpine geological strata,
          rockGrain & meadowGrain filters, and atmospheric morning haze
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <AlpineMountainRange className="w-full h-full object-cover drop-shadow-[0_14px_28px_rgba(120,145,115,0.16)]" />

        {/* Alpine Goat perched on left granite crag above Recursion */}
        <div
          className="hidden sm:block pointer-events-none z-10"
          style={{ position: "absolute", left: "17%", top: "23%" }}
        >
          <AlpineGoat scale={0.76} />
        </div>

        {/* Midground Pasture Cow grazing peacefully on the upper meadow knoll */}
        <div
          className="hidden md:block pointer-events-none z-10 opacity-90"
          style={{ position: "absolute", right: "18%", bottom: "29%" }}
        >
          <MeadowCow scale={0.70} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. ATMOSPHERIC LIFE: DRIFTING MORNING CLOUDS & SOARING BIRDS
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute top-0 inset-x-0 h-44 pointer-events-none z-1">
        <div style={{ position: "absolute", left: "6%", top: "8px" }} className="opacity-90 animate-float-slow">
          <SoftCloud scale={0.95} />
        </div>
        <div style={{ position: "absolute", left: "28%", top: "20px" }} className="opacity-75 animate-float">
          <SoftCloud scale={0.78} />
        </div>
        <div style={{ position: "absolute", right: "35%", top: "6px" }} className="opacity-75 animate-float-slow">
          <SoftCloud scale={0.72} />
        </div>
        <div style={{ position: "absolute", right: "5%", top: "24px" }} className="opacity-65">
          <SoftCloud scale={0.65} />
        </div>
        <div style={{ position: "absolute", left: "42%", top: "32px" }} className="opacity-65">
          <SoaringBird scale={0.82} />
        </div>
        <div style={{ position: "absolute", left: "47%", top: "48px" }} className="opacity-50">
          <SoaringBird scale={0.65} />
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          3. DISTANT GRAPH HIGHLANDS TEASE (Seen in the High Saddle Col)
          Beyond Highland Pass, teasing interconnected ridges, suspension bridges,
          remote lookout tower, and network route suggestions
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="z-2 pointer-events-none opacity-90"
        style={{
          position: "absolute",
          left: "50%",
          top: "7.5%",
          transform: "translateX(-50%)",
        }}
      >
        <svg viewBox="0 0 220 95" className="w-48 sm:w-60 h-22 sm:h-28" fill="none">
          <defs>
            <linearGradient id="ghDistantPeak1" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#647E6F" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#87A393" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#ABC4B6" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ghDistantPeak2" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#7E9B8B" stopOpacity="0.8" />
              <stop offset="65%" stopColor="#A2BEAF" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#C6DEC8" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="ghSaddleMist" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#EBF3EE" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D5E8DD" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Deepest Mountain Ridge Silhouette */}
          <polygon points="15,65 42,28 65,48 95,16 125,42 160,18 190,52 210,65" fill="url(#ghDistantPeak1)" />

          {/* Midground Interconnected Ridge Form */}
          <polygon points="25,68 55,38 78,54 110,24 140,50 175,32 205,68" fill="url(#ghDistantPeak2)" />

          {/* Billowing Mountain Col Mist Veil separating Zone 4 and 5 */}
          <ellipse cx="110" cy="58" rx="95" ry="24" fill="url(#ghSaddleMist)" />

          {/* Distant High Rope/Timber Suspension Bridge spanning canyon */}
          {/* Twin Timber Anchorage Towers */}
          <line x1="56" y1="36" x2="56" y2="48" stroke="#3D291B" strokeWidth="1.6" opacity="0.85" />
          <line x1="108" y1="28" x2="108" y2="40" stroke="#3D291B" strokeWidth="1.6" opacity="0.85" />
          {/* Catenary Main Suspension Cables */}
          <path d="M 56 37 Q 82 45, 108 29" stroke="#3D291B" strokeWidth="1.3" opacity="0.8" />
          <path d="M 56 40 Q 82 48, 108 32" stroke="#3D291B" strokeWidth="1.0" opacity="0.7" />
          {/* Vertical Suspenders */}
          <line x1="68" y1="40" x2="68" y2="43" stroke="#3D291B" strokeWidth="0.7" opacity="0.75" />
          <line x1="82" y1="43" x2="82" y2="46" stroke="#3D291B" strokeWidth="0.7" opacity="0.75" />
          <line x1="96" y1="37" x2="96" y2="40" stroke="#3D291B" strokeWidth="0.7" opacity="0.75" />
          {/* Bridge Walking Deck */}
          <path d="M 56 42 Q 82 48, 108 34" stroke="#5E4028" strokeWidth="1.4" opacity="0.8" />

          {/* Distant High Fire Watchtower / Spire on remote crag */}
          <rect x="158" y="14" width="5" height="9" fill="#3D291B" opacity="0.8" />
          <polygon points="160.5,8 154,14 167,14" fill="#5A3E2A" opacity="0.85" />
          <line x1="160.5" y1="8" x2="160.5" y2="5" stroke="#3D291B" strokeWidth="0.8" />

          {/* Distant Highland Route Lines (Network trail suggestions traversing cols) */}
          <path d="M 38 48 Q 48 52, 55 45 Q 68 47, 76 54" stroke="#523F2F" strokeWidth="0.7" strokeDasharray="1.5,1.5" opacity="0.5" />
          <path d="M 112 34 Q 124 38, 135 36 Q 148 42, 158 35" stroke="#523F2F" strokeWidth="0.7" strokeDasharray="1.5,1.5" opacity="0.5" />

          {/* Lower drifting mist cloud */}
          <ellipse cx="110" cy="70" rx="65" ry="14" fill="#FFFFFF" opacity="0.4" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4. ORGANIC MOUNTAIN FOOTPATH WITH BACKTRACKING FORK & DEAD-END OVERLOOK
          - Section 1: Recursion (21.5, 68) -> Backtracking (35, 58) -> Trees (51, 46)
          - Backtracking Branch: Fork at (34, 58.5) -> Overlook at (39, 63) -> Return Loop
          - Section 2: Trees (51, 46) -> Binary Search Trees Arboretum (72, 36)
          - Section 3: BST Arboretum (72, 36) -> Highland Pass Col (48, 20.5) (Climbing Scree)
          ══════════════════════════════════════════════════════════════════ */}
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 w-full h-full pointer-events-none z-5"
      >
        <defs>
          <filter id="rfTrailShadow" x="-25%" y="-25%" width="150%" height="150%">
            <feDropShadow dx="0" dy="0.30" stdDeviation="0.22" floodColor="#122013" floodOpacity="0.32" />
          </filter>
          <filter id="rfCairnShadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0.1" dy="0.35" stdDeviation="0.25" floodColor="#0E180F" floodOpacity="0.40" />
          </filter>

          {/* Weathered Granite Flagstone Shaders */}
          <linearGradient id="rfFlagstoneSunlit" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#8A9A87" />
            <stop offset="45%" stopColor="#758573" />
            <stop offset="100%" stopColor="#5E6D5B" />
          </linearGradient>
          <linearGradient id="rfFlagstoneMuted" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#7D8D7B" />
            <stop offset="50%" stopColor="#697967" />
            <stop offset="100%" stopColor="#546352" />
          </linearGradient>
          <linearGradient id="rfScreeRock" x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#869584" />
            <stop offset="50%" stopColor="#71806F" />
            <stop offset="100%" stopColor="#5C6A5A" />
          </linearGradient>
        </defs>

        {/* ── Layer A: Continuous Worn Earth & Loam Bed ── */}
        {/* Section 1: Recursion (21.5, 68) -> Backtracking (35, 58) -> Trees (51, 46) */}
        <path
          d="M 21.5 68 Q 28 63, 35 58 Q 43 52, 51 46"
          fill="none"
          stroke="#4D6643"
          strokeWidth="3.6"
          strokeLinecap="round"
          opacity="0.34"
        />
        <path
          d="M 21.5 68 Q 28 63, 35 58 Q 43 52, 51 46"
          fill="none"
          stroke="#5F4A37"
          strokeWidth="2.1"
          strokeLinecap="round"
          opacity="0.58"
        />
        <path
          d="M 21.5 68 Q 28 63, 35 58 Q 43 52, 51 46"
          fill="none"
          stroke="#7C6650"
          strokeWidth="1.0"
          strokeLinecap="round"
          opacity="0.48"
        />

        {/* Backtracking Exploratory Branch Spur & Return Loop (Physicalizes CHOOSE -> EXPLORE -> DEAD END -> RETURN) */}
        {/* Branch Spur descending to Ravine Overlook */}
        <path
          d="M 34.0 58.5 Q 36.5 61.0, 39.0 63.0"
          fill="none"
          stroke="#4D6643"
          strokeWidth="2.8"
          strokeLinecap="round"
          opacity="0.30"
        />
        <path
          d="M 34.0 58.5 Q 36.5 61.0, 39.0 63.0"
          fill="none"
          stroke="#5F4A37"
          strokeWidth="1.6"
          strokeLinecap="round"
          opacity="0.52"
        />
        {/* Overlook Turnaround Platform */}
        <ellipse cx="39.0" cy="63.0" rx="1.6" ry="1.0" fill="#5F4A37" opacity="0.45" />
        {/* Return Footpath looping back to junction */}
        <path
          d="M 38.6 63.2 Q 36.8 61.5, 35.8 57.6"
          fill="none"
          stroke="#7C6650"
          strokeWidth="0.8"
          strokeDasharray="1.2,1.2"
          opacity="0.45"
        />

        {/* Section 2: Trees (51, 46) -> Binary Search Trees Arboretum (72, 36) */}
        <path
          d="M 51 46 Q 62 42, 72 36"
          fill="none"
          stroke="#4D6643"
          strokeWidth="3.2"
          strokeLinecap="round"
          opacity="0.28"
        />
        <path
          d="M 51 46 Q 62 42, 72 36"
          fill="none"
          stroke="#5F4A37"
          strokeWidth="1.9"
          strokeLinecap="round"
          opacity="0.50"
        />
        <path
          d="M 51 46 Q 62 42, 72 36"
          fill="none"
          stroke="#7C6650"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.42"
        />

        {/* Section 3: BST Arboretum (72, 36) -> Highland Pass Col (48, 20.5) (Transitions into scree & rock) */}
        <path
          d="M 72 36 Q 66 26, 48 20.5"
          fill="none"
          stroke="#5F6F5D"
          strokeWidth="3.0"
          strokeLinecap="round"
          opacity="0.26"
        />
        <path
          d="M 72 36 Q 66 26, 48 20.5"
          fill="none"
          stroke="#524335"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.48"
        />
        <path
          d="M 72 36 Q 66 26, 48 20.5"
          fill="none"
          stroke="#7E8D7C"
          strokeWidth="0.9"
          strokeLinecap="round"
          opacity="0.45"
        />

        {/* Section 4: Highland Pass upward corridor dissolving into mountain mist */}
        <path
          d="M 48 20.5 Q 49.5 15, 51 11"
          fill="none"
          stroke="#5F4A37"
          strokeWidth="1.4"
          strokeLinecap="round"
          opacity="0.35"
        />

        {/* ── Layer B: Weathered Granite Steps & Timber Water Bars ── */}
        <g filter="url(#rfTrailShadow)">
          {/* Steps from Recursion to Backtracking */}
          <path d="M 22.5 67.2 C 22.2 66.7, 23.6 66.1, 24.3 66.4 C 24.7 66.9, 24.0 67.5, 23.2 67.3 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 24.5 65.8 C 24.1 65.3, 25.7 64.7, 26.3 65.1 C 26.7 65.6, 26.0 66.2, 25.2 66.0 Z" fill="url(#rfFlagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          
          {/* Timber water bar 1 */}
          <path d="M 26.0 65.2 L 27.8 64.0" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />

          <path d="M 27.2 64.2 C 26.8 63.7, 28.4 63.1, 29.0 63.5 C 29.4 64.0, 28.7 64.6, 28.0 64.4 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 29.4 62.8 C 29.0 62.3, 30.6 61.7, 31.2 62.1 C 31.6 62.6, 30.9 63.2, 30.2 63.0 Z" fill="url(#rfFlagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 31.8 61.2 C 31.4 60.7, 33.0 60.1, 33.6 60.5 C 34.0 61.0, 33.3 61.6, 32.5 61.4 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />

          {/* Timber water bar 2 before Backtracking brook */}
          <path d="M 33.2 60.4 L 35.0 59.2" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />

          {/* Exploratory Overlook Stepping Stones */}
          <path d="M 36.2 60.5 C 35.8 60.1, 37.0 59.7, 37.6 60.0 C 37.9 60.4, 37.4 60.9, 36.8 60.7 Z" fill="url(#rfFlagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 38.0 62.0 C 37.6 61.6, 38.8 61.2, 39.4 61.5 C 39.7 61.9, 39.2 62.4, 38.6 62.2 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />

          {/* Steps after Backtracking up towards Trees Lodge */}
          <path d="M 37.0 56.6 C 36.6 56.1, 38.2 55.5, 38.9 55.9 C 39.3 56.4, 38.6 57.0, 37.8 56.8 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 39.5 54.8 C 39.1 54.3, 40.8 53.7, 41.5 54.1 C 42.0 54.6, 41.2 55.2, 40.3 55.0 Z" fill="url(#rfFlagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          
          {/* Timber trail riser 3 */}
          <path d="M 41.2 54.2 L 43.1 53.3" stroke="#352010" strokeWidth="0.32" strokeLinecap="round" />

          <path d="M 42.6 53.2 C 42.2 52.7, 44.0 52.1, 44.7 52.5 C 45.2 53.0, 44.4 53.6, 43.5 53.4 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 45.0 51.5 C 44.6 51.0, 46.4 50.4, 47.1 50.8 C 47.6 51.3, 46.8 51.9, 45.9 51.7 Z" fill="url(#rfFlagstoneMuted)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 47.8 49.6 C 47.4 49.1, 49.2 48.5, 49.9 48.9 C 50.4 49.4, 49.6 50.0, 48.7 49.8 Z" fill="url(#rfFlagstoneSunlit)" stroke="#4A5847" strokeWidth="0.08" />

          {/* Stepping stones ascending right to Binary Search Trees */}
          <path d="M 53.5 45.4 C 53.1 44.9, 54.8 44.3, 55.5 44.7 C 56.0 45.2, 55.2 45.8, 54.3 45.6 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 57.0 43.6 C 56.6 43.1, 58.3 42.5, 59.0 42.9 C 59.5 43.4, 58.7 44.0, 57.8 43.8 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 61.2 41.5 C 60.8 41.0, 62.5 40.4, 63.2 40.8 C 63.7 41.3, 62.9 41.9, 62.0 41.7 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 65.5 39.4 C 65.1 38.9, 66.8 38.3, 67.5 38.7 C 68.0 39.2, 67.2 39.8, 66.3 39.6 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 69.8 37.4 C 69.4 36.9, 71.1 36.3, 71.8 36.7 C 72.3 37.2, 71.5 37.8, 70.6 37.6 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />

          {/* Mountain Pass Scree Switchback (BST to Highland Pass) */}
          <path d="M 69.0 33.2 C 68.6 32.7, 70.2 32.1, 70.8 32.5 C 71.2 33.0, 70.5 33.6, 69.7 33.4 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 64.2 29.5 C 63.8 29.0, 65.4 28.4, 66.0 28.8 C 66.4 29.3, 65.7 29.9, 64.9 29.7 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 59.0 26.2 C 58.6 25.7, 60.2 25.1, 60.8 25.5 C 61.2 26.0, 60.5 26.6, 59.7 26.4 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 53.8 23.4 C 53.4 22.9, 55.0 22.3, 55.6 22.7 C 56.0 23.2, 55.3 23.8, 54.5 23.6 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
          <path d="M 49.2 21.4 C 48.8 20.9, 50.4 20.3, 51.0 20.7 C 51.4 21.2, 50.7 21.8, 49.9 21.6 Z" fill="url(#rfScreeRock)" stroke="#4A5847" strokeWidth="0.08" />
        </g>

        {/* ── Layer C: Geological Stone Trail Cairns ── */}
        <g filter="url(#rfCairnShadow)">
          {/* Cairn 1: Near Recursion Portal */}
          <g transform="translate(24.8, 65.5)">
            <ellipse cx="0" cy="0" rx="0.52" ry="0.22" fill="#424D40" />
            <ellipse cx="0" cy="-0.28" rx="0.40" ry="0.18" fill="#596657" />
            <ellipse cx="0" cy="-0.54" rx="0.30" ry="0.14" fill="#728070" />
            <ellipse cx="0" cy="-0.78" rx="0.18" ry="0.10" fill="#93A391" />
          </g>

          {/* Cairn 2: Backtracking Junction */}
          <g transform="translate(37.5, 56.2)">
            <ellipse cx="0" cy="0" rx="0.50" ry="0.22" fill="#424D40" />
            <ellipse cx="0" cy="-0.28" rx="0.38" ry="0.17" fill="#596657" />
            <ellipse cx="0" cy="-0.54" rx="0.28" ry="0.13" fill="#728070" />
            <ellipse cx="0" cy="-0.76" rx="0.18" ry="0.10" fill="#93A391" />
          </g>

          {/* Cairn 2B: Backtracking Dead-End Overlook Cairn */}
          <g transform="translate(39.8, 63.8)">
            <ellipse cx="0" cy="0" rx="0.46" ry="0.20" fill="#424D40" />
            <ellipse cx="0" cy="-0.24" rx="0.34" ry="0.15" fill="#596657" />
            <ellipse cx="0" cy="-0.46" rx="0.24" ry="0.11" fill="#728070" />
          </g>

          {/* Cairn 3: Trees Learning Lodge Junction */}
          <g transform="translate(49.2, 48.5)">
            <ellipse cx="0" cy="0" rx="0.55" ry="0.24" fill="#384A37" />
            <ellipse cx="0" cy="-0.30" rx="0.44" ry="0.19" fill="#4E674D" />
            <ellipse cx="0" cy="-0.58" rx="0.32" ry="0.15" fill="#6A8768" />
            <ellipse cx="0" cy="-0.82" rx="0.20" ry="0.11" fill="#90B08E" />
          </g>

          {/* Cairn 4: BST Arboretum Terrace */}
          <g transform="translate(68.5, 37.8)">
            <ellipse cx="0" cy="0" rx="0.50" ry="0.22" fill="#424D40" />
            <ellipse cx="0" cy="-0.28" rx="0.38" ry="0.17" fill="#596657" />
            <ellipse cx="0" cy="-0.54" rx="0.28" ry="0.13" fill="#728070" />
          </g>

          {/* Cairn 5: Highland Pass Ridge Approach */}
          <g transform="translate(53.2, 22.8)">
            <ellipse cx="0" cy="0" rx="0.48" ry="0.20" fill="#424D40" />
            <ellipse cx="0" cy="-0.26" rx="0.36" ry="0.16" fill="#596657" />
            <ellipse cx="0" cy="-0.50" rx="0.26" ry="0.12" fill="#728070" />
          </g>
        </g>
      </svg>

      {/* ══════════════════════════════════════════════════════════════════
          5. ENHANCED MEADOW STORYTELLING: REDUCE EMPTY FOREGROUND
          Nurse log, mossy boulders, alpine wildflowers, and terrain contours
          ══════════════════════════════════════════════════════════════════ */}
      {/* Ancient Fallen Nurse Log with Moss & Bracket Fungi (Lower Left Foreground) */}
      <div
        className="pointer-events-none z-12 hidden sm:block"
        style={{ position: "absolute", left: "16%", bottom: "13%" }}
      >
        <svg viewBox="0 0 120 40" className="w-28 sm:w-34 h-10 sm:h-12 drop-shadow-sm" fill="none">
          {/* Ground Contact Shadow */}
          <ellipse cx="60" cy="30" rx="55" ry="6" fill="#182817" opacity="0.35" />
          {/* Weathered Cedar Log Body */}
          <path d="M 8 26 C 24 22, 92 20, 112 25 L 110 32 C 90 35, 20 36, 6 31 Z" fill="#4A3423" stroke="#2D1D12" strokeWidth="1" />
          {/* Log Top Sunlight Highlight & Hollow */}
          <path d="M 12 24 C 28 21, 88 19, 108 23 L 106 26 C 86 23, 26 24, 10 27 Z" fill="#6A4D35" />
          <ellipse cx="110" cy="28" rx="3.5" ry="4.5" fill="#382214" stroke="#221208" strokeWidth="0.8" />
          {/* Clustered Moss Cushions on the Bark */}
          <ellipse cx="32" cy="22" rx="10" ry="3.5" fill="#4D7033" opacity="0.85" />
          <ellipse cx="33" cy="21" rx="8" ry="2.2" fill="#6A9648" />
          <ellipse cx="70" cy="20" rx="14" ry="4" fill="#4D7033" opacity="0.85" />
          <ellipse cx="72" cy="19" rx="11" ry="2.5" fill="#6A9648" />
          {/* Little Sprouting Pine Sapling growing out of the nurse log */}
          <line x1="72" y1="18" x2="72" y2="10" stroke="#3D291B" strokeWidth="1" />
          <polygon points="72,7 67,14 77,14" fill="#2D5A34" />
          <polygon points="72,10 68,16 76,16" fill="#3D7546" />
          {/* Bracket Fungi Shelves */}
          <path d="M 44 26 C 46 24, 52 24, 54 26 Z" fill="#D97706" stroke="#92400E" strokeWidth="0.6" />
          <path d="M 88 24 C 90 22, 96 22, 98 24 Z" fill="#D97706" stroke="#92400E" strokeWidth="0.6" />
        </svg>
      </div>

      {/* Midground Mossy Granite Erratics (Center-Lower Meadow) */}
      <div
        className="pointer-events-none z-10 hidden sm:block"
        style={{ position: "absolute", left: "37%", bottom: "17%" }}
      >
        <svg viewBox="0 0 80 40" className="w-20 sm:w-24 h-10 sm:h-12 drop-shadow-xs" fill="none">
          <ellipse cx="40" cy="30" rx="36" ry="6" fill="#182817" opacity="0.25" />
          {/* Main Granite Boulder */}
          <polygon points="12,30 32,14 54,16 68,30" fill="#62705E" stroke="#3F4B3C" strokeWidth="1" />
          <polygon points="18,29 33,16 48,17 40,28" fill="#7E8E7A" />
          {/* Smaller Flanking Rock */}
          <polygon points="50,31 62,22 72,31" fill="#525E4F" stroke="#333D31" strokeWidth="0.8" />
          {/* Moss Patch on Boulder Crest */}
          <ellipse cx="36" cy="15" rx="8" ry="2.5" fill="#4E7036" />
        </svg>
      </div>

      {/* Right Midground Rock Cluster & Meadow Grass Tufts */}
      <div
        className="pointer-events-none z-10 hidden md:block"
        style={{ position: "absolute", right: "26%", bottom: "22%" }}
      >
        <svg viewBox="0 0 90 45" className="w-22 sm:w-26 h-11 sm:h-13 drop-shadow-xs" fill="none">
          <ellipse cx="45" cy="35" rx="40" ry="6.5" fill="#182817" opacity="0.22" />
          <polygon points="14,35 36,18 64,21 76,35" fill="#6B7A67" stroke="#465343" strokeWidth="1" />
          <polygon points="20,34 38,20 56,22 46,33" fill="#849480" />
          <ellipse cx="42" cy="19" rx="9" ry="2.8" fill="#557B3D" />
        </svg>
      </div>

      {/* Alpine Wildflower Colonies (Cobalt Gentians & Golden Buttercups) */}
      <div
        className="pointer-events-none z-12 hidden sm:block"
        style={{ position: "absolute", left: "26%", bottom: "16%" }}
      >
        <svg viewBox="0 0 60 30" className="w-16 h-8" fill="none">
          {/* Alpine Gentians (Deep Vivid Blue) */}
          <circle cx="12" cy="18" r="2.2" fill="#2563EB" />
          <circle cx="12" cy="18" r="0.8" fill="#FEF08A" />
          <circle cx="20" cy="22" r="1.8" fill="#3B82F6" />
          <circle cx="20" cy="22" r="0.6" fill="#FEF08A" />
          <circle cx="28" cy="16" r="2.0" fill="#2563EB" />
          <circle cx="28" cy="16" r="0.7" fill="#FEF08A" />
          {/* Alpine Buttercups (Golden Yellow) */}
          <circle cx="38" cy="20" r="1.8" fill="#F59E0B" />
          <circle cx="46" cy="17" r="2.2" fill="#FBBF24" />
          <circle cx="52" cy="22" r="1.6" fill="#F59E0B" />
        </svg>
      </div>

      <div
        className="pointer-events-none z-12 hidden sm:block"
        style={{ position: "absolute", right: "32%", bottom: "18%" }}
      >
        <svg viewBox="0 0 60 30" className="w-16 h-8" fill="none">
          <circle cx="15" cy="18" r="2.0" fill="#3B82F6" />
          <circle cx="24" cy="21" r="2.2" fill="#FBBF24" />
          <circle cx="34" cy="17" r="1.8" fill="#2563EB" />
          <circle cx="44" cy="20" r="2.0" fill="#FBBF24" />
        </svg>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          6. OLD-GROWTH FOREST DEPTH & CANOPY LAYERING
          Dense old-growth conifers framing the learning route (Recursion -> Backtracking -> Trees)
          ══════════════════════════════════════════════════════════════════ */}
      {/* Deep Background Stand behind Recursion Glade */}
      <div
        className="z-8 pointer-events-none hidden md:block opacity-90"
        style={{ position: "absolute", left: "15%", bottom: "35%" }}
      >
        <div className="relative flex items-end -space-x-4">
          <AlpinePineTree variant="ancient" scale={0.92} />
          <AlpinePineTree variant="dense" scale={0.84} />
        </div>
      </div>

      {/* Deep Background Stand between Recursion and Backtracking (Darker Forest Pocket) */}
      <div
        className="z-8 pointer-events-none hidden md:block opacity-92"
        style={{ position: "absolute", left: "25%", bottom: "38%" }}
      >
        <div className="relative flex items-end -space-x-3">
          <AlpinePineTree variant="dense" scale={0.88} />
          <AlpinePineTree variant="slender" scale={0.80} />
          <AlpinePineTree variant="ancient" scale={0.85} />
        </div>
      </div>

      {/* Dense Midground Pine Stand behind Backtracking Ravine */}
      <div
        className="z-8 pointer-events-none hidden md:block opacity-92"
        style={{ position: "absolute", left: "32%", bottom: "42%" }}
      >
        <div className="relative flex items-end -space-x-3">
          <AlpinePineTree variant="ancient" scale={0.94} />
          <AlpinePineTree variant="slender" scale={0.82} />
        </div>
      </div>

      {/* Atmospheric Forest Mist Ribbon weaving between the tree layers */}
      <div
        className="z-9 pointer-events-none hidden md:block"
        style={{ position: "absolute", left: "14%", bottom: "36%", width: "32%", height: "24px" }}
      >
        <svg viewBox="0 0 200 24" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="rfWoodlandMist" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
              <stop offset="30%" stopColor="#FFFFFF" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#E6F2EB" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </linearGradient>
          </defs>
          <ellipse cx="100" cy="12" rx="90" ry="9" fill="url(#rfWoodlandMist)" />
        </svg>
      </div>

      {/* Left Foreground Ancient Grove & Fawn (Repoussoir) */}
      <div
        className="z-15 pointer-events-none hidden sm:block"
        style={{ position: "absolute", left: "24px", bottom: "12px" }}
      >
        <div className="relative">
          <div style={{ marginLeft: "28px", marginBottom: "4px" }}>
            <AlpineFawn scale={1.05} />
          </div>
          <AlpinePineTree variant="grove" scale={1.30} />
        </div>
      </div>

      {/* Midground Conifer Clusters along meadow contours */}
      <div
        className="z-12 pointer-events-none hidden md:block"
        style={{ position: "absolute", left: "43%", bottom: "24%" }}
      >
        <div className="relative flex items-end -space-x-3">
          <AlpinePineTree variant="dense" scale={0.78} />
          <AlpinePineTree variant="windblown" scale={0.70} />
        </div>
      </div>

      {/* Right Foreground Stately Pine Grove (Repoussoir framing) */}
      <div
        className="z-15 pointer-events-none hidden sm:block"
        style={{ position: "absolute", right: "24px", bottom: "12px" }}
      >
        <div className="relative flex flex-col items-end">
          <AlpinePineTree variant="grove" scale={1.28} />
        </div>
      </div>

      {/* Midground Conifers framing the lower-right knoll */}
      <div
        className="z-12 pointer-events-none hidden md:block"
        style={{ position: "absolute", right: "12%", bottom: "30%" }}
      >
        <div className="relative flex items-end -space-x-4">
          <AlpinePineTree variant="slender" scale={0.84} />
          <AlpinePineTree variant="dense" scale={0.76} />
        </div>
      </div>

      {/* ── ELEVATION TRANSITION: TREE-LINE THINNING TOWARD HIGHLAND PASS ── */}
      {/* Wind-shaped, gnarled krummholz pines approaching the high pass scree */}
      <div
        className="z-11 pointer-events-none hidden lg:block"
        style={{ position: "absolute", left: "41%", top: "18.5%" }}
      >
        <AlpinePineTree variant="windblown" scale={0.62} />
      </div>
      <div
        className="z-11 pointer-events-none hidden lg:block"
        style={{ position: "absolute", left: "55%", top: "18.5%" }}
      >
        <AlpinePineTree variant="windblown" scale={0.65} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          7. THE 5 RECURSIVE FOREST LANDMARKS (Ground-Anchored Micro-Architecture)
          Recursion -> Backtracking -> Trees (HERO) -> Binary Search Trees -> Highland Pass
          ══════════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 w-full h-full z-20 pointer-events-none">

        {/* ── LANDMARK 1: RECURSION (Completed • Ancient Monumental Arch Portal) ── */}
        {recursion && (
          <div
            style={{
              position: "absolute",
              left: "21.5%",
              top: "68%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onSelectLandmark(recursion)}
            onMouseEnter={() => setHoveredLandmarkId(recursion.id)}
            onMouseLeave={() => setHoveredLandmarkId(null)}
            className="cursor-pointer group pointer-events-auto transition-all duration-300"
          >
            <div className="relative flex flex-col items-center">
              {/* Massive Cyclopean Bedrock Foundation & Stepping Stone Apron */}
              <div
                className="w-34 sm:w-40 h-12 pointer-events-none"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "-12px",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              >
                <svg viewBox="0 0 140 48" className="w-full h-full" fill="none">
                  <ellipse cx="70" cy="36" rx="64" ry="9" fill="#1C2E1B" opacity="0.35" />
                  {/* Layered Bedrock Plinth */}
                  <polygon points="16,36 124,36 114,24 26,24" fill="#4E5E4C" stroke="#323E30" strokeWidth="1.2" />
                  <polygon points="22,25 118,25 110,17 30,17" fill="#647761" stroke="#3D4B3B" strokeWidth="0.9" />
                  {/* Glacial Boulder Flanks */}
                  <ellipse cx="20" cy="27" rx="12" ry="8.5" fill="#4B5849" stroke="#333D32" strokeWidth="1" />
                  <ellipse cx="120" cy="27" rx="13" ry="9.5" fill="#4B5849" stroke="#333D32" strokeWidth="1" />
                  {/* Worn Approach Threshold Stone Steps */}
                  <rect x="48" y="28" width="44" height="5" rx="1.5" fill="#889885" stroke="#4B5849" strokeWidth="0.9" />
                  <rect x="54" y="32" width="32" height="4" rx="1.2" fill="#758572" />
                </svg>
              </div>

              {/* Monumental Weathered Granite Megalith with 4 Concentric Recursive Arch Rings */}
              <div className="relative z-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 96 80" className="w-24 sm:w-28 h-20 sm:h-24 drop-shadow-md" fill="none">
                  {/* Deep Ancient Cavernous Interior Shadow */}
                  <path d="M 20 74 L 20 34 C 20 14, 76 14, 76 34 L 76 74 Z" fill="#0E170F" />

                  {/* Outer Ring 1: Cyclopean Weathered Granite Arch & Masonry Pillars */}
                  <path d="M 16 74 L 16 34 C 16 10, 80 10, 80 34 L 80 74" stroke="#4E5F4B" strokeWidth="10" strokeLinecap="round" />
                  <path d="M 16 74 L 16 34 C 16 10, 80 10, 80 34 L 80 74" stroke="#687C64" strokeWidth="7.2" strokeLinecap="round" />

                  {/* Concentric Ring 2: First Recursive Recessed Lintel */}
                  <path d="M 23 74 L 23 35 C 23 16, 73 16, 73 35 L 73 74" stroke="#354433" strokeWidth="4.2" strokeLinecap="round" />
                  <path d="M 23 74 L 23 35 C 23 16, 73 16, 73 35 L 73 74" stroke="#7A9175" strokeWidth="2.8" strokeLinecap="round" />

                  {/* Concentric Ring 3: Second Recursive Recessed Lintel */}
                  <path d="M 30 74 L 30 36 C 30 21, 66 21, 66 36 L 66 74" stroke="#253224" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 30 74 L 30 36 C 30 21, 66 21, 66 36 L 66 74" stroke="#93AA8E" strokeWidth="1.8" strokeLinecap="round" />

                  {/* Concentric Ring 4: Innermost Threshold Arch */}
                  <path d="M 37 74 L 37 38 C 37 26, 59 26, 59 38 L 59 74" stroke="#B2C9AD" strokeWidth="1.2" strokeLinecap="round" />

                  {/* Restrained Violet Pulsing Rune Core (Concentric Waves of Depth) */}
                  <circle cx="48" cy="38" r="9" fill="#7C3AED" opacity="0.25" className="animate-ping" />
                  <circle cx="48" cy="38" r="6" fill="#8B5CF6" opacity="0.85" className="animate-pulse" />
                  <circle cx="48" cy="38" r="3.2" fill="#E9D5FF" />
                  <circle cx="48" cy="38" r="1.4" fill="#FFFFFF" />

                  {/* Weathered Moss & Lichen Encrustations on Stone Lintel */}
                  <ellipse cx="28" cy="22" rx="5" ry="3" fill="#3D5A1E" opacity="0.85" />
                  <ellipse cx="68" cy="20" rx="6" ry="3.2" fill="#3D5A1E" opacity="0.85" />
                  <ellipse cx="48" cy="13" rx="7" ry="2.5" fill="#4B6E26" opacity="0.80" />
                </svg>

                {/* Flanking Slender Spruce set safely to the left */}
                <div style={{ position: "absolute", left: "-42px", top: "0px", zIndex: 5 }}>
                  <AlpinePineTree variant="slender" scale={0.76} />
                </div>
              </div>

              {/* Physical Restrained Landmark Label Badge - Crisp Solid White Pill with ample top margin */}
              <div
                className="mt-3 px-3 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight flex items-center gap-1.5 shadow-md bg-white text-[#1B3F2B] border border-[#BBD4B8] transition-all group-hover:scale-105"
                style={{ position: "relative", zIndex: 25 }}
              >
                <span className="text-[11px]">💎</span>
                <span className="font-extrabold">Recursion</span>
                <span className="text-[#128A5B] font-black ml-0.5">✓</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 ml-0.5">Review</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LANDMARK 2: BACKTRACKING (Completed • Timber Bridge, Forked Path & Dead-End Overlook) ── */}
        {backtracking && (
          <div
            style={{
              position: "absolute",
              left: "35%",
              top: "58%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onSelectLandmark(backtracking)}
            onMouseEnter={() => setHoveredLandmarkId(backtracking.id)}
            onMouseLeave={() => setHoveredLandmarkId(null)}
            className="cursor-pointer group pointer-events-auto transition-all duration-300"
          >
            <div className="relative flex flex-col items-center">
              {/* Glacial Brook, Arched Main Timber Bridge & Forked Overlook Spur */}
              <div className="relative transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 125 76" className="w-28 sm:w-32 h-18 sm:h-20 drop-shadow-sm" fill="none">
                  {/* Ground & Water Ambient Shadow */}
                  <ellipse cx="62" cy="60" rx="58" ry="10" fill="#182817" opacity="0.30" />

                  {/* Grassy Stream Ravine Banks */}
                  <path d="M 0 46 Q 25 40, 32 50 L 30 64 L 0 64 Z" fill="#6B8E5A" />
                  <path d="M 0 44 Q 22 40, 28 48 L 26 52 L 0 50 Z" fill="#82A670" />
                  <path d="M 90 50 Q 100 42, 125 46 L 125 64 L 92 64 Z" fill="#6B8E5A" />
                  <path d="M 92 48 Q 102 41, 125 44 L 125 50 L 94 52 Z" fill="#82A670" />

                  {/* Rushing Mountain Stream (Glacial Turquoise Cascade with Water Ripples) */}
                  <path d="M 14 55 C 38 48, 86 48, 110 55 L 112 63 C 86 54, 38 54, 12 63 Z" fill="#0284C7" opacity="0.45" />
                  <path d="M 18 53 C 40 47, 84 47, 106 53" stroke="#38BDF8" strokeWidth="5.5" strokeLinecap="round" opacity="0.92" />
                  <path d="M 28 54.5 C 44 50, 78 50, 96 54.5" stroke="#E0F2FE" strokeWidth="2.6" strokeLinecap="round" opacity="0.95" />
                  <circle cx="50" cy="52" r="1.2" fill="#FFFFFF" opacity="0.8" />
                  <circle cx="76" cy="52" r="1.4" fill="#FFFFFF" opacity="0.8" />

                  {/* Heavy Granite Bridge Abutments */}
                  <rect x="24" y="44" width="13" height="12" rx="1.5" fill="#586856" stroke="#374336" strokeWidth="1" />
                  <rect x="85" y="44" width="13" height="12" rx="1.5" fill="#586856" stroke="#374336" strokeWidth="1" />

                  {/* ── FORK 1: MAIN CONTINUING TIMBER BRIDGE (Northeast to Trees) ── */}
                  <path d="M 26 43 Q 62 21, 95 43" stroke="#4A2914" strokeWidth="5.6" strokeLinecap="round" />
                  <path d="M 28 35 Q 62 15, 93 35" stroke="#724323" strokeWidth="4.0" strokeLinecap="round" />
                  {/* Vertical Handrail Balusters */}
                  <line x1="38" y1="40" x2="38" y2="23" stroke="#351B0C" strokeWidth="2.4" strokeLinecap="round" />
                  <line x1="62" y1="32" x2="62" y2="17" stroke="#351B0C" strokeWidth="2.4" strokeLinecap="round" />
                  <line x1="84" y1="40" x2="84" y2="23" stroke="#351B0C" strokeWidth="2.4" strokeLinecap="round" />

                  {/* ── FORK 2: EXPLORATORY PROMONTORY OVERLOOK (Dead-End Spur) ── */}
                  {/* Timber Plank Walk branching to Southeast cliff edge */}
                  <path d="M 62 34 Q 48 50, 36 60" stroke="#422411" strokeWidth="4.2" strokeLinecap="round" />
                  <path d="M 62 29 Q 50 43, 38 52" stroke="#603519" strokeWidth="2.6" strokeLinecap="round" />
                  {/* Rocky Overlook Promontory Platform */}
                  <ellipse cx="34" cy="61" rx="8" ry="4.5" fill="#5A6B58" stroke="#384336" strokeWidth="1" />
                  {/* Dead-End Wooden Warning Barrier / Railing */}
                  <line x1="28" y1="58" x2="28" y2="65" stroke="#331A0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="39" y1="58" x2="39" y2="65" stroke="#331A0B" strokeWidth="2" strokeLinecap="round" />
                  <line x1="27" y1="60" x2="40" y2="60" stroke="#522C14" strokeWidth="2.2" strokeLinecap="round" />
                  {/* Dead End Overlook Marker Post */}
                  <circle cx="28" cy="58" r="1.4" fill="#EF4444" />

                  {/* Junction Trail Signpost with Dual Arms */}
                  <rect x="61" y="16" width="3.5" height="17" fill="#3D2412" rx="0.5" />
                  {/* Arm 1: Points across bridge toward Trees */}
                  <polygon points="63,16 74,16 71,20 63,20" fill="#E2EED5" stroke="#3D2412" strokeWidth="0.6" />
                  {/* Arm 2: Points toward overlook */}
                  <polygon points="61,21 50,21 53,25 61,25" fill="#FEE2E2" stroke="#3D2412" strokeWidth="0.6" />
                  {/* Amber Warning Lantern on Junction Post */}
                  <polygon points="59,13 65,13 66,17 58,17" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="62" cy="15" r="1.8" fill="#FEF08A" className="animate-pulse" />
                </svg>

                {/* Flanking conifer set safely to the right of bridge */}
                <div style={{ position: "absolute", right: "-32px", top: "0px", zIndex: 5 }}>
                  <AlpinePineTree variant="slender" scale={0.76} />
                </div>
              </div>

              {/* Physical Restrained Landmark Label Badge - Crisp Solid White Pill with ample top margin */}
              <div
                className="mt-3 px-3 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight flex items-center gap-1.5 shadow-md bg-white text-[#1B3F2B] border border-[#BBD4B8] transition-all group-hover:scale-105"
                style={{ position: "relative", zIndex: 25 }}
              >
                <span className="text-[11px]">🔀</span>
                <span className="font-extrabold">Backtracking</span>
                <span className="text-[#128A5B] font-black ml-0.5">✓</span>
                <span className="text-[8px] font-bold uppercase tracking-wider text-emerald-700 ml-0.5">Review</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LANDMARK 3: TREES (HERO ACTIVE EXPEDITION • Ancient Canopy & Lodge) ── */}
        {trees && (
          <div
            style={{
              position: "absolute",
              left: "51%",
              top: "46%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onSelectLandmark(trees)}
            onMouseEnter={() => setHoveredLandmarkId(trees.id)}
            onMouseLeave={() => setHoveredLandmarkId(null)}
            className="cursor-pointer group pointer-events-auto transition-all duration-300 scale-105"
          >
            <div className="relative flex flex-col items-center">
              {/* Active Learning Waypoint Beacon Halo Radiance */}
              <div className="absolute inset-0 -m-6 rounded-full bg-[#168E65]/20 animate-ping pointer-events-none" />
              <div className="absolute inset-0 -m-3 rounded-full border-2 border-[#168E65]/70 animate-pulse pointer-events-none" />

              {/* Elevated Forest Clearing, Stone Retaining Wall & Heavy Timber Boardwalk Deck */}
              <div
                className="w-44 sm:w-48 h-12 pointer-events-none"
                style={{
                  position: "absolute",
                  left: "50%",
                  bottom: "-14px",
                  transform: "translateX(-50%)",
                  zIndex: 4,
                }}
              >
                <svg viewBox="0 0 156 48" className="w-full h-full" fill="none">
                  <ellipse cx="78" cy="35" rx="72" ry="10" fill="#152417" opacity="0.34" />
                  <path d="M 12 30 Q 78 15, 144 30 L 138 41 Q 78 26, 18 41 Z" fill="#648557" />
                  {/* Heavy Timber Boardwalk Deck */}
                  <polygon points="28,26 128,26 122,36 22,36" fill="#694121" stroke="#442713" strokeWidth="1.2" />
                  <polygon points="30,26 126,26 123,30 27,30" fill="#80532C" />
                  {/* Deck Plank Spacers */}
                  <line x1="42" y1="26" x2="37" y2="36" stroke="#442713" strokeWidth="0.9" />
                  <line x1="58" y1="26" x2="53" y2="36" stroke="#442713" strokeWidth="0.9" />
                  <line x1="76" y1="26" x2="71" y2="36" stroke="#442713" strokeWidth="0.9" />
                  <line x1="96" y1="26" x2="91" y2="36" stroke="#442713" strokeWidth="0.9" />
                  <line x1="112" y1="26" x2="107" y2="36" stroke="#442713" strokeWidth="0.9" />
                  {/* Flagstone Approach Steps down to Trail */}
                  <ellipse cx="74" cy="38" rx="9" ry="3" fill="#E8EFE5" stroke="#6F8D67" strokeWidth="0.9" />
                </svg>
              </div>

              {/* Background: Ancient Old-Growth Pine towering over the roofline */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "-48px",
                  transform: "translateX(-50%)",
                  zIndex: 0,
                }}
              >
                <AlpinePineTree variant="ancient" scale={1.28} />
              </div>

              {/* Fore-mid: Two-Story Alpine Learning Lodge with warm glowing hearth and smoking chimney */}
              <div className="relative z-10 transition-transform duration-300 group-hover:scale-105">
                <AlpineCabin variant="lodge" scale={1.25} hasSmoke={true} isGlow={true} />
              </div>

              {/* Flanking Conifers: Placed wide to the sides so lodge facade, door, and windows are 100% visible */}
              <div
                className="pointer-events-none"
                style={{ position: "absolute", left: "-56px", top: "8px", zIndex: 6 }}
              >
                <AlpinePineTree variant="dense" scale={0.90} />
              </div>
              <div
                className="pointer-events-none"
                style={{ position: "absolute", right: "-56px", top: "14px", zIndex: 6 }}
              >
                <AlpinePineTree variant="slender" scale={0.86} />
              </div>

              {/* Corner Timber Post: Perched Owl Mascot */}
              <div
                className="w-8.5 h-8.5 rounded-full bg-white/95 border-2 border-[#168E65] shadow-md flex items-center justify-center pointer-events-none"
                style={{ position: "absolute", right: "-14px", top: "-24px", zIndex: 25 }}
              >
                <OwlAvatar size={23} state="listening" />
              </div>

              {/* Warm Hanging Brass Porch Lantern */}
              <div style={{ position: "absolute", left: "6px", bottom: "14px", zIndex: 20 }}>
                <svg viewBox="0 0 10 14" className="w-3.5 h-4.5 drop-shadow-2xs">
                  <line x1="5" y1="0" x2="5" y2="4" stroke="#333" strokeWidth="0.8" />
                  <rect x="2" y="4" width="6" height="7" rx="1.5" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="5" cy="7.5" r="1.6" fill="#FEF08A" />
                </svg>
              </div>

              {/* Navigational Hero Badge with Active Pulse (Positioned cleanly below boardwalk steps) */}
              <div
                className="mt-3 px-4 py-1.5 rounded-full text-[10.5px] sm:text-[11.5px] font-black tracking-tight flex items-center gap-1.5 shadow-[0_4px_14px_rgba(22,142,101,0.45)] bg-[#168E65] text-white ring-2 ring-white transition-all group-hover:scale-106"
                style={{ position: "relative", zIndex: 25 }}
              >
                <span className="text-[13px]">🌳</span>
                <span>TREES</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-bold">
                  Current Expedition
                </span>
                <span className="text-[10px] font-black text-emerald-200 ml-0.5">➔</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LANDMARK 4: BINARY SEARCH TREES (Locked • The Hierarchical Ordered Arboretum) ── */}
        {bst && (
          <div
            style={{
              position: "absolute",
              left: "72%",
              top: "35%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onSelectLandmark(bst)}
            onMouseEnter={() => setHoveredLandmarkId(bst.id)}
            onMouseLeave={() => setHoveredLandmarkId(null)}
            className="cursor-pointer group pointer-events-auto transition-all duration-300 opacity-95"
          >
            <div className="relative flex flex-col items-center">
              {/* Ordered Terraces, Central Grand Root Tree & Symmetrical Subtree Gardens Graphic */}
              <div className="relative transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 156 94" className="relative z-10 w-38 sm:w-46 h-24 sm:h-28 drop-shadow-md" fill="none">
                  <defs>
                    <linearGradient id="bstStoneSunlit" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#A4B8A1" />
                      <stop offset="40%" stopColor="#879C84" />
                      <stop offset="100%" stopColor="#62755F" />
                    </linearGradient>
                    <linearGradient id="bstStoneShaded" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#7E937B" />
                      <stop offset="100%" stopColor="#536450" />
                    </linearGradient>
                    <linearGradient id="bstGravelBed" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9FB39C" />
                      <stop offset="50%" stopColor="#BDD1BA" />
                      <stop offset="100%" stopColor="#9FB39C" />
                    </linearGradient>
                  </defs>

                  {/* Ambient Ground Shadow */}
                  <ellipse cx="78" cy="78" rx="74" ry="12" fill="#182817" opacity="0.32" />

                  {/* ── LOWER BASE TERRACE PLINTH ── */}
                  <polygon points="12,70 144,70 138,82 18,82" fill="url(#bstStoneShaded)" stroke="#2E372A" strokeWidth="1.2" />
                  <polygon points="18,70 138,70 134,74 22,74" fill="#B4C7B1" />

                  {/* ── LOWER LEFT SUBTREE TERRACE (Left Child Platform) ── */}
                  <polygon points="14,54 58,54 54,70 10,70" fill="url(#bstStoneSunlit)" stroke="#343E30" strokeWidth="1.0" />
                  <polygon points="17,54 55,54 53,57 19,57" fill="#CDE0CB" />
                  {/* Raked Zen Gravel Garden Bed on Left Terrace */}
                  <ellipse cx="36" cy="62" rx="16" ry="5.5" fill="url(#bstGravelBed)" />
                  <path d="M 23 62 Q 36 60, 49 62" stroke="#687865" strokeWidth="0.8" strokeDasharray="1.2,1.2" />
                  {/* Exactly 2 Manicured Pyramidal Subtree Conifers (Ordered Left Children) */}
                  {/* Left-Left Child */}
                  <polygon points="26,32 17,52 35,52" fill="#1C3F27" stroke="#102517" strokeWidth="0.8" />
                  <polygon points="26,26 19,40 33,40" fill="#255434" />
                  <polygon points="26,20 21,30 31,30" fill="#367349" />
                  {/* Left-Right Child */}
                  <polygon points="46,36 38,52 54,52" fill="#1C3F27" stroke="#102517" strokeWidth="0.8" />
                  <polygon points="46,30 40,42 52,42" fill="#255434" />
                  <polygon points="46,24 42,33 50,33" fill="#367349" />

                  {/* ── LOWER RIGHT SUBTREE TERRACE (Right Child Platform) ── */}
                  <polygon points="98,54 142,54 146,70 102,70" fill="url(#bstStoneSunlit)" stroke="#343E30" strokeWidth="1.0" />
                  <polygon points="101,54 139,54 137,57 103,57" fill="#CDE0CB" />
                  {/* Raked Zen Gravel Garden Bed on Right Terrace */}
                  <ellipse cx="120" cy="62" rx="16" ry="5.5" fill="url(#bstGravelBed)" />
                  <path d="M 107 62 Q 120 60, 133 62" stroke="#687865" strokeWidth="0.8" strokeDasharray="1.2,1.2" />
                  {/* Exactly 2 Symmetrically Groomed Subtree Conifers (Ordered Right Children) */}
                  {/* Right-Left Child */}
                  <polygon points="110,36 102,52 118,52" fill="#1C3F27" stroke="#102517" strokeWidth="0.8" />
                  <polygon points="110,30 104,42 116,42" fill="#255434" />
                  <polygon points="110,24 106,33 114,33" fill="#367349" />
                  {/* Right-Right Child */}
                  <polygon points="130,32 121,52 139,52" fill="#1C3F27" stroke="#102517" strokeWidth="0.8" />
                  <polygon points="130,26 123,40 137,40" fill="#255434" />
                  <polygon points="130,20 125,30 135,30" fill="#367349" />

                  {/* ── UPPER CENTRAL TERRACE (ROOT NODE PLATFORM) ── */}
                  <polygon points="52,40 104,40 98,56 58,56" fill="url(#bstStoneSunlit)" stroke="#3F4B3C" strokeWidth="1.2" />
                  <polygon points="56,40 100,40 96,44 60,44" fill="#D5E8D3" />

                  {/* Grand Root Tree (Manicured Ancient Bonsai Conifer on Elevated Root Plinth) */}
                  <rect x="76" y="24" width="4.5" height="18" fill="#3D291B" stroke="#22140A" strokeWidth="0.9" rx="0.8" />
                  {/* Layered Symmetrical Crown with Broad Cloud Foliage Pads */}
                  <polygon points="78,8 58,26 98,26" fill="#173520" stroke="#0E2114" strokeWidth="1" />
                  <polygon points="78,4 62,18 94,18" fill="#214A2D" />
                  <polygon points="78,-1 66,11 90,11" fill="#2D663E" />
                  <polygon points="78,-5 71,4 85,4" fill="#3F8554" />

                  {/* Root Pavilion Open Cedar Cupola behind Root Tree */}
                  <rect x="68" y="26" width="20" height="14" fill="#4A3423" stroke="#26170D" strokeWidth="1.0" rx="1" opacity="0.9" />
                  <polygon points="78,16 64,26 92,26" fill="#5C3B24" stroke="#26170D" strokeWidth="1.2" />
                  <circle cx="78" cy="33" r="1.8" fill="#FEF08A" />

                  {/* ── HIERARCHICAL BRANCHING TIMBER STAIRWAYS (Connecting Root to Left and Right) ── */}
                  <path d="M 60 46 Q 48 48, 44 54" stroke="#7A4E2D" strokeWidth="3.2" strokeLinecap="round" />
                  <path d="M 96 46 Q 108 48, 112 54" stroke="#7A4E2D" strokeWidth="3.2" strokeLinecap="round" />
                  {/* Riser notches */}
                  <line x1="53" y1="46" x2="53" y2="51" stroke="#3E2413" strokeWidth="1.4" />
                  <line x1="103" y1="46" x2="103" y2="51" stroke="#3E2413" strokeWidth="1.4" />

                  {/* ── LOCKED STATE: CLOSED CEDAR GATEWAY & BRONZE PADLOCK ── */}
                  <rect x="70" y="60" width="16" height="10" fill="#3A2212" stroke="#1F1108" strokeWidth="1.0" rx="0.8" />
                  <line x1="72" y1="65" x2="84" y2="65" stroke="#D97706" strokeWidth="1.4" />
                  <rect x="76" y="62" width="4" height="6" rx="0.6" fill="#F59E0B" stroke="#78350F" strokeWidth="0.7" />

                  {/* Symmetrical Carved Granite Lanterns */}
                  <rect x="52" y="50" width="3" height="5" fill="#889A85" stroke="#3E493C" strokeWidth="0.6" />
                  <polygon points="53.5,47 49,50 58,50" fill="#536450" />
                  <rect x="101" y="50" width="3" height="5" fill="#889A85" stroke="#3E493C" strokeWidth="0.6" />
                  <polygon points="102.5,47 98,50 107,50" fill="#536450" />

                  {/* Early Morning Mountain Mist Weaving Across Terraces */}
                  <ellipse cx="78" cy="58" rx="60" ry="8" fill="#FFFFFF" opacity="0.30" />
                </svg>

                {/* Symmetrical Slender Spruce flanking the plinth set safely behind to sides */}
                <div style={{ position: "absolute", left: "-54px", top: "14px", zIndex: 0 }}>
                  <AlpinePineTree variant="slender" scale={0.72} />
                </div>
                <div style={{ position: "absolute", right: "-54px", top: "14px", zIndex: 0 }}>
                  <AlpinePineTree variant="slender" scale={0.72} />
                </div>
              </div>

              {/* Physical Restrained Landmark Label Badge - Crisp Solid White Pill */}
              <div
                className="mt-3 px-3 py-1 rounded-full text-[9.5px] sm:text-[10px] font-bold tracking-tight flex items-center gap-1.5 shadow-md bg-white text-gray-800 border border-[#CBDCC4] transition-all group-hover:scale-105"
                style={{ position: "relative", zIndex: 25 }}
              >
                <span className="text-[11px]">🌲</span>
                <span className="font-extrabold">Binary Search Trees</span>
                <span className="text-[8.5px] text-gray-500 font-semibold ml-0.5">🔒 Locked</span>
              </div>
            </div>
          </div>
        )}

        {/* ── LANDMARK 5: HIGHLAND PASS (Gateway • Mountain Col Transition at Ridge) ── */}
        {highlandPass && (
          <div
            style={{
              position: "absolute",
              left: "48%",
              top: "16.5%",
              transform: "translate(-50%, -50%)",
            }}
            onClick={() => onSelectLandmark(highlandPass)}
            onMouseEnter={() => setHoveredLandmarkId(highlandPass.id)}
            onMouseLeave={() => setHoveredLandmarkId(null)}
            className="cursor-pointer group pointer-events-auto transition-all duration-300"
          >
            <div className="relative flex flex-col items-center">
              {/* Mountain Pass Gateway Landmark Graphic (Granite & Heavy Alpine Timber, Scaled to Perspective) */}
              <div className="relative w-22 sm:w-26 h-16 sm:h-19 drop-shadow-md transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 116 82" className="w-full h-full" fill="none">
                  <defs>
                    <linearGradient id="rfGateTimber2" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#633F26" />
                      <stop offset="50%" stopColor="#4A2E1A" />
                      <stop offset="100%" stopColor="#321D0E" />
                    </linearGradient>
                    <linearGradient id="rfGateStone2" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6C7A68" />
                      <stop offset="50%" stopColor="#536050" />
                      <stop offset="100%" stopColor="#3D473A" />
                    </linearGradient>
                    <radialGradient id="rfGateMist2" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.80" />
                      <stop offset="65%" stopColor="#E2EBE5" stopOpacity="0.40" />
                      <stop offset="100%" stopColor="#D4E4DC" stopOpacity="0" />
                    </radialGradient>
                  </defs>

                  {/* Ground Contact Shadow */}
                  <ellipse cx="58" cy="76" rx="50" ry="6.0" fill="#142416" opacity="0.38" />

                  {/* Billowing Mountain Mist Corridor passing through the archway */}
                  <ellipse cx="58" cy="58" rx="30" ry="20" fill="url(#rfGateMist2)" />
                  <ellipse cx="58" cy="48" rx="24" ry="14" fill="url(#rfGateMist2)" />

                  {/* Left Stone Masonry Pylon Base */}
                  <polygon points="18,76 34,76 32,54 20,54" fill="url(#rfGateStone2)" stroke="#2C3529" strokeWidth="1" />
                  <rect x="19" y="58" width="14" height="4" rx="0.5" fill="#7D8D79" stroke="#2C3529" strokeWidth="0.6" />
                  <rect x="20" y="66" width="13" height="4.5" rx="0.5" fill="#62705E" stroke="#2C3529" strokeWidth="0.6" />

                  {/* Right Stone Masonry Pylon Base */}
                  <polygon points="82,76 98,76 96,54 84,54" fill="url(#rfGateStone2)" stroke="#2C3529" strokeWidth="1" />
                  <rect x="83" y="58" width="14" height="4" rx="0.5" fill="#7D8D79" stroke="#2C3529" strokeWidth="0.6" />
                  <rect x="83" y="66" width="13" height="4.5" rx="0.5" fill="#62705E" stroke="#2C3529" strokeWidth="0.6" />

                  {/* Heavy Hand-Hewn Timber Posts */}
                  <rect x="23" y="24" width="7.5" height="32" rx="1.2" fill="url(#rfGateTimber2)" stroke="#24140A" strokeWidth="1" />
                  <rect x="85.5" y="24" width="7.5" height="32" rx="1.2" fill="url(#rfGateTimber2)" stroke="#24140A" strokeWidth="1" />

                  {/* Diagonal Knee Braces */}
                  <line x1="28" y1="36" x2="43" y2="24" stroke="#4A2E1A" strokeWidth="3" strokeLinecap="round" />
                  <line x1="88" y1="36" x2="73" y2="24" stroke="#4A2E1A" strokeWidth="3" strokeLinecap="round" />

                  {/* Heavy Timber Lintels (Arched Crossbeam) */}
                  <rect x="16" y="20" width="84" height="8" rx="2" fill="url(#rfGateTimber2)" stroke="#24140A" strokeWidth="1.2" />
                  <polygon points="18,20 58,12 98,20" fill="#3D2413" stroke="#24140A" strokeWidth="1.2" />

                  {/* Hanging Carved Alpine Cedar Signboard */}
                  <line x1="40" y1="28" x2="40" y2="34" stroke="#1A1A1A" strokeWidth="1" />
                  <line x1="76" y1="28" x2="76" y2="34" stroke="#1A1A1A" strokeWidth="1" />
                  <rect x="30" y="33" width="56" height="13" rx="2" fill="#52341F" stroke="#2B180C" strokeWidth="1" />
                  <text x="58" y="40" textAnchor="middle" fill="#FFFBEB" fontSize="4.8" fontWeight="bold" letterSpacing="0.4" fontFamily="sans-serif">
                    HIGHLAND PASS
                  </text>
                  <text x="58" y="43.8" textAnchor="middle" fill="#86EFAC" fontSize="3.6" fontWeight="bold" letterSpacing="0.3" fontFamily="sans-serif">
                    ZONE 5 CONTINUATION ➔
                  </text>

                  {/* Wrought Iron Lantern with Glowing Amber Core */}
                  <line x1="58" y1="20" x2="58" y2="28" stroke="#1F1F1F" strokeWidth="1" />
                  <polygon points="55,28 61,28 62,35 54,35" fill="#F59E0B" stroke="#78350F" strokeWidth="0.8" />
                  <circle cx="58" cy="31.5" r="2.2" fill="#FEF08A" className="animate-pulse" />

                  {/* Weathered Stone Trail Marker by Gateway Base */}
                  <path d="M 8 76 L 14 64 L 17 76 Z" fill="#5F6F5E" stroke="#333E32" strokeWidth="0.8" />
                  <rect x="9" y="68" width="7" height="3" rx="0.5" fill="#3D4B3C" />
                </svg>
              </div>

              {/* Physical Restrained Landmark Label Badge - Crisp Solid White Pill positioned cleanly at ridge */}
              <div
                className="mt-1.5 px-2.5 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold tracking-tight flex items-center gap-1.5 shadow-md bg-white text-gray-800 border border-[#CBDCC4] transition-all group-hover:scale-105"
                style={{ position: "relative", zIndex: 25 }}
              >
                <span className="text-[10.5px]">⛰️</span>
                <span className="font-extrabold">Highland Pass</span>
                <span className="text-[8px] text-gray-500 font-semibold ml-0.5">Gateway • Locked</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
