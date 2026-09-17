interface StructureProps {
  x?: number
  y?: number
  scale?: number
  className?: string
  isCurrent?: boolean
  isCompleted?: boolean
  isLocked?: boolean
}

// ══════════════════════════════════════════════════════════════════════════
// 1. RECURSION PORTAL (Ancient Whispering Megaliths)
// ══════════════════════════════════════════════════════════════════════════
export function RecursionPortalV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
  isCompleted = true,
}: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      {/* Ground Contact Shadow */}
      <ellipse cx="60" cy="85" rx="55" ry="10" fill="#0C1B0E" opacity="0.38" />

      {/* Stone Paved Concentric Stepping Rings (Looping Depth) */}
      <ellipse cx="60" cy="78" rx="46" ry="7" fill="#4B5848" stroke="#333D31" strokeWidth="1" />
      <ellipse cx="60" cy="75" rx="34" ry="5.5" fill="#5A6956" stroke="#3D4A3A" strokeWidth="0.8" />
      <ellipse cx="60" cy="72" rx="22" ry="4" fill="#6B7C67" stroke="#485745" strokeWidth="0.8" />

      {/* Stepping flagstones inside portal */}
      <path
        d="M 52 74 C 55 68, 65 68, 68 74 C 65 77, 55 77, 52 74 Z"
        fill="#82947E"
        opacity="0.9"
      />

      {/* Outer Arch (Grand Weathered Granite Monolith) */}
      <path
        d="M 18 80 L 22 28 C 24 10, 96 10, 98 28 L 102 80 L 88 80 L 85 34 C 84 24, 36 24, 35 34 L 32 80 Z"
        fill="#556552"
        stroke="#333E31"
        strokeWidth="1.6"
      />
      {/* Outer Arch Sunlit Highlight Facet */}
      <path
        d="M 22 28 C 24 10, 96 10, 98 28 L 94 28 C 92 14, 28 14, 26 28 Z"
        fill="#8DA08A"
        opacity="0.7"
      />

      {/* Middle Concentric Arch (Receding Layer 1) */}
      <path
        d="M 32 78 L 35 38 C 36 26, 84 26, 85 38 L 88 78 L 78 78 L 76 42 C 75 34, 45 34, 44 42 L 42 78 Z"
        fill="#475645"
        stroke="#2C372A"
        strokeWidth="1.4"
      />
      <path
        d="M 35 38 C 36 26, 84 26, 85 38 L 81 38 C 80 30, 40 30, 39 38 Z"
        fill="#7A8D78"
        opacity="0.6"
      />

      {/* Inner Concentric Arch (Deep Receding Portal Core) */}
      <path
        d="M 44 76 L 46 46 C 47 38, 73 38, 74 46 L 76 76 L 68 76 L 67 48 C 66 43, 54 43, 53 48 L 52 76 Z"
        fill="#394537"
        stroke="#212A20"
        strokeWidth="1.2"
      />
      <path
        d="M 46 46 C 47 38, 73 38, 74 46 L 71 46 C 70 41, 50 41, 49 46 Z"
        fill="#667764"
        opacity="0.6"
      />

      {/* Portal Portal Interior Glow (Looping Self-Similar Echo) */}
      <ellipse cx="60" cy="54" rx="7" ry="14" fill="#6EE7B7" opacity="0.3" />
      <ellipse cx="60" cy="54" rx="4" ry="9" fill="#A7F3D0" opacity="0.5" />

      {/* Weathered Moss & Ivy Patches */}
      <ellipse cx="25" cy="50" rx="4" ry="8" fill="#365314" opacity="0.75" />
      <ellipse cx="94" cy="62" rx="4.5" ry="9" fill="#365314" opacity="0.75" />
      <ellipse cx="60" cy="14" rx="8" ry="3" fill="#4D7C0F" opacity="0.7" />

      {/* Completed Success Indicator: Subtle Carved Glyphs Glow */}
      {isCompleted && (
        <g opacity="0.85">
          <circle cx="27" cy="40" r="1.5" fill="#34D399" />
          <circle cx="93" cy="40" r="1.5" fill="#34D399" />
          <circle cx="60" cy="20" r="2" fill="#34D399" />
        </g>
      )}
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 2. BACKTRACKING BRIDGE (Forked Woodland Crossings)
// ══════════════════════════════════════════════════════════════════════════
export function BacktrackingBridgeV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
  isCompleted = true,
}: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      {/* Mountain Stream Rushing Beneath (Rippling Blue-Green) */}
      <path
        d="M 10 35 C 35 48, 65 30, 95 42 C 120 52, 140 38, 160 48"
        stroke="#60A5FA"
        strokeWidth="14"
        opacity="0.65"
        strokeLinecap="round"
      />
      <path
        d="M 12 35 C 35 48, 65 30, 95 42 C 120 52, 140 38, 158 48"
        stroke="#93C5FD"
        strokeWidth="6"
        opacity="0.8"
        strokeLinecap="round"
      />

      {/* Stream Bed Boulders */}
      <circle cx="48" cy="38" r="5" fill="#526350" />
      <circle cx="108" cy="45" r="6" fill="#4B5848" />

      {/* Ground Occlusion Shadow for the Bridges */}
      <ellipse cx="55" cy="55" rx="38" ry="6" fill="#0C1B0E" opacity="0.35" />
      <ellipse cx="115" cy="48" rx="34" ry="5.5" fill="#0C1B0E" opacity="0.35" />

      {/* Fork 1: Main Continuation Bridge (Ascending Northeast) */}
      <g>
        {/* Timber Stringers */}
        <line x1="62" y1="52" x2="135" y2="28" stroke="#382214" strokeWidth="6" strokeLinecap="round" />
        <line x1="65" y1="50" x2="133" y2="27" stroke="#633F24" strokeWidth="4" strokeLinecap="round" />
        {/* Cross Planks */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const px = 70 + i * 8
          const py = 48 - i * 2.8
          return (
            <line
              key={i}
              x1={px - 4}
              y1={py - 5}
              x2={px + 4}
              y2={py + 5}
              stroke="#825633"
              strokeWidth="2.4"
            />
          )
        })}
        {/* Railing & Posts */}
        <line x1="72" y1="41" x2="132" y2="20" stroke="#9A6B43" strokeWidth="1.6" />
        <line x1="72" y1="47" x2="72" y2="39" stroke="#52331C" strokeWidth="1.8" />
        <line x1="102" y1="36" x2="102" y2="28" stroke="#52331C" strokeWidth="1.8" />
        <line x1="132" y1="26" x2="132" y2="18" stroke="#52331C" strokeWidth="1.8" />
      </g>

      {/* Fork 2: Dead-End Exploration / Return Loop Bridge (Branching Southeast to Lookout) */}
      <g>
        <line x1="58" y1="52" x2="30" y2="78" stroke="#382214" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="56" y1="53" x2="32" y2="76" stroke="#53331C" strokeWidth="3.6" strokeLinecap="round" />
        {[0, 1, 2, 3, 4].map((i) => {
          const px = 52 - i * 5
          const py = 58 + i * 4.2
          return (
            <line
              key={i}
              x1={px - 4}
              y1={py + 3}
              x2={px + 4}
              y2={py - 3}
              stroke="#734B2C"
              strokeWidth="2.2"
            />
          )
        })}
        {/* Terminating Stone Overlook Platform */}
        <ellipse cx="24" cy="84" rx="14" ry="7" fill="#586A55" stroke="#384736" strokeWidth="1.2" />
        <ellipse cx="23" cy="82" rx="10" ry="4.5" fill="#758872" />
        {/* Return trail marker (Backtracking concept) */}
        <path d="M 20 80 C 24 76, 28 82, 32 78" stroke="#FDE68A" strokeWidth="1.4" strokeDasharray="2 2" />
      </g>

      {/* Fork Junction Hub: Carved Wooden Trail Signpost with Brass Lantern */}
      <rect x="58" y="38" width="4" height="20" fill="#422918" rx="1" />
      {/* Sign 1: Northeast arrow */}
      <path d="M 59 40 L 74 38 L 71 43 L 59 44 Z" fill="#D97706" stroke="#2B170B" strokeWidth="0.8" />
      {/* Sign 2: Southeast loop arrow */}
      <path d="M 59 46 L 47 48 L 49 53 L 59 51 Z" fill="#92400E" stroke="#2B170B" strokeWidth="0.8" />

      {/* Wayfarer Lantern on Signpost */}
      <circle cx="60" cy="35" r="3" fill="#FDE68A" />
      <circle cx="60" cy="35" r="6" fill="#FBBF24" opacity="0.45" />
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 3. ANCIENT CANOPY LODGE (Hero Trees Landmark)
// ══════════════════════════════════════════════════════════════════════════
export function TreesLodgeV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
  isCurrent = true,
}: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      {/* Ambient Ground Occlusion Shadow */}
      <ellipse cx="65" cy="102" rx="60" ry="8" fill="#0C1B0D" opacity="0.45" />
      <ellipse cx="65" cy="101" rx="46" ry="5" fill="#060F07" opacity="0.55" />

      {/* Stone Masonry Terrace Foundation */}
      <path d="M 14 86 L 116 86 L 112 100 L 18 100 Z" fill="#4B5747" stroke="#323B2F" strokeWidth="1.4" />
      <ellipse cx="28" cy="93" rx="7" ry="3" fill="#63725F" stroke="#3A4637" strokeWidth="0.7" />
      <ellipse cx="46" cy="92.5" rx="8" ry="3.2" fill="#546250" stroke="#3A4637" strokeWidth="0.7" />
      <ellipse cx="66" cy="93" rx="8.5" ry="3" fill="#63725F" stroke="#3A4637" strokeWidth="0.7" />
      <ellipse cx="86" cy="92.5" rx="7.5" ry="3" fill="#546250" stroke="#3A4637" strokeWidth="0.7" />
      <ellipse cx="102" cy="93" rx="6.5" ry="2.8" fill="#63725F" stroke="#3A4637" strokeWidth="0.7" />

      {/* Flagstone Entrance Steps */}
      <rect x="52" y="98" width="26" height="3.5" rx="1" fill="#758671" stroke="#3C4838" strokeWidth="0.8" />
      <rect x="55" y="101" width="20" height="3" rx="1" fill="#889B84" stroke="#3C4838" strokeWidth="0.6" />

      {/* Stone Chimney with Drifting Smoke */}
      <rect x="88" y="14" width="14" height="34" rx="1.8" fill="#546250" stroke="#343E31" strokeWidth="1.2" />
      <line x1="88" y1="24" x2="102" y2="24" stroke="#343E31" strokeWidth="1" />
      <line x1="88" y1="34" x2="102" y2="34" stroke="#343E31" strokeWidth="1" />
      <rect x="86" y="12" width="18" height="3.5" rx="1.2" fill="#6E7F6A" stroke="#343E31" strokeWidth="1" />
      
      {/* Chimney Hearth Smoke */}
      <circle cx="95" cy="5" r="5.5" fill="#FFFFFF" opacity="0.65" />
      <circle cx="101" cy="-5" r="7.5" fill="#FFFFFF" opacity="0.5" />
      <circle cx="108" cy="-17" r="10" fill="#FFFFFF" opacity="0.3" />

      {/* Log Cabin Walls (Two Stories) */}
      <rect x="22" y="44" width="86" height="44" rx="3" fill="#4D311E" stroke="#24140A" strokeWidth="1.6" />
      
      {/* Saddle-Notch Log Ends */}
      <g fill="#3D2415" stroke="#24140A" strokeWidth="0.8">
        <rect x="17" y="46" width="6.5" height="7.5" rx="1.6" />
        <rect x="17" y="55" width="6.5" height="7.5" rx="1.6" />
        <rect x="17" y="64" width="6.5" height="7.5" rx="1.6" />
        <rect x="17" y="73" width="6.5" height="7.5" rx="1.6" />

        <rect x="106.5" y="46" width="6.5" height="7.5" rx="1.6" />
        <rect x="106.5" y="55" width="6.5" height="7.5" rx="1.6" />
        <rect x="106.5" y="64" width="6.5" height="7.5" rx="1.6" />
        <rect x="106.5" y="73" width="6.5" height="7.5" rx="1.6" />
      </g>

      {/* Horizontal Timber Grooves */}
      <line x1="22" y1="54" x2="108" y2="54" stroke="#311B0E" strokeWidth="1.4" />
      <line x1="22" y1="63" x2="108" y2="63" stroke="#311B0E" strokeWidth="1.4" />
      <line x1="22" y1="72" x2="108" y2="72" stroke="#311B0E" strokeWidth="1.4" />
      <line x1="22" y1="81" x2="108" y2="81" stroke="#311B0E" strokeWidth="1.4" />

      {/* Cedar Gable Roof with Overhang */}
      <polygon points="65,14 8,50 122,50" fill="#6A452C" stroke="#24140A" strokeWidth="2" strokeLinejoin="round" />
      <polygon points="65,14 8,50 65,50" fill="#8C5C38" opacity="0.4" />
      <line x1="10" y1="51" x2="120" y2="51" stroke="#221208" strokeWidth="2.6" strokeLinecap="round" />

      {/* Upper Loft Gable Window */}
      <path d="M 58 34 C 58 29, 72 29, 72 34 L 72 43 L 58 43 Z" fill="#FDE68A" stroke="#2B170B" strokeWidth="1.4" />
      <line x1="65" y1="30" x2="65" y2="43" stroke="#2B170B" strokeWidth="1.2" />
      <line x1="58" y1="37" x2="72" y2="37" stroke="#2B170B" strokeWidth="1.2" />

      {/* Ground Floor Windows (Glowing Warm Hearth) */}
      <rect x="32" y="58" width="16" height="18" rx="1.4" fill="#FDE68A" stroke="#2B170B" strokeWidth="1.4" />
      <line x1="40" y1="58" x2="40" y2="76" stroke="#2B170B" strokeWidth="1" />
      <line x1="32" y1="67" x2="48" y2="67" stroke="#2B170B" strokeWidth="1" />

      <rect x="82" y="58" width="16" height="18" rx="1.4" fill="#FDE68A" stroke="#2B170B" strokeWidth="1.4" />
      <line x1="90" y1="58" x2="90" y2="76" stroke="#2B170B" strokeWidth="1" />
      <line x1="82" y1="67" x2="98" y2="67" stroke="#2B170B" strokeWidth="1" />

      {/* Main Double Wooden Doors */}
      <rect x="56" y="60" width="18" height="26" rx="1.2" fill="#3B2213" stroke="#221208" strokeWidth="1.4" />
      <line x1="65" y1="60" x2="65" y2="86" stroke="#221208" strokeWidth="1.2" />
      {/* Brass Door Handles */}
      <circle cx="63" cy="74" r="1.2" fill="#FCD34D" />
      <circle cx="67" cy="74" r="1.2" fill="#FCD34D" />

      {/* Warm Balcony Overhang & Handrail */}
      <rect x="26" y="78" width="78" height="3" fill="#6A452C" stroke="#24140A" strokeWidth="0.8" />

      {/* Hero Active Banner / Flag (Golden Expedition Colors) */}
      {isCurrent && (
        <g>
          <line x1="65" y1="14" x2="65" y2="-4" stroke="#452714" strokeWidth="1.8" />
          <polygon points="65,-4 85,2 65,8" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
          {/* Active Beacon Radiance */}
          <circle cx="65" cy="-4" r="3.5" fill="#FEF08A" />
          <circle cx="65" cy="-4" r="9" fill="#FBBF24" opacity="0.4" />
        </g>
      )}
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 4. BST ARBORETUM (The Ordered Arboretum & Twin Spires)
// ══════════════════════════════════════════════════════════════════════════
export function BstArboretumV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
  isLocked = true,
}: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      {/* Ground Contact Shadow */}
      <ellipse cx="65" cy="88" rx="62" ry="9" fill="#0C1B0E" opacity="0.35" />

      {/* Symmetrical Terraced Stone Plinths (Left / Right Hierarchical Split) */}
      <path d="M 12 78 L 118 78 L 112 88 L 18 88 Z" fill="#4B5646" stroke="#2E372A" strokeWidth="1.4" />
      {/* Left Subtree Terrace Platform */}
      <path d="M 16 64 L 52 64 L 50 78 L 14 78 Z" fill="#586653" stroke="#343E30" strokeWidth="1.2" />
      {/* Right Subtree Terrace Platform */}
      <path d="M 78 64 L 114 64 L 116 78 L 80 78 Z" fill="#586653" stroke="#343E30" strokeWidth="1.2" />

      {/* Central Stem Pavilion (Root Node) */}
      <rect x="54" y="44" width="22" height="34" fill="#4A3423" stroke="#25170D" strokeWidth="1.4" />
      {/* Root Spire Roof */}
      <polygon points="65,18 48,44 82,44" fill="#5C3B24" stroke="#25170D" strokeWidth="1.6" />
      <line x1="65" y1="18" x2="65" y2="44" stroke="#784E30" strokeWidth="1.2" />

      {/* Left Branch Spire (Left Child) */}
      <rect x="24" y="40" width="16" height="24" fill="#3D291B" stroke="#20130A" strokeWidth="1.2" />
      <polygon points="32,20 18,40 46,40" fill="#4E311D" stroke="#20130A" strokeWidth="1.4" />

      {/* Right Branch Spire (Right Child) */}
      <rect x="90" y="40" width="16" height="24" fill="#3D291B" stroke="#20130A" strokeWidth="1.2" />
      <polygon points="98,20 84,40 112,40" fill="#4E311D" stroke="#20130A" strokeWidth="1.4" />

      {/* Connecting Elevated Timber Bridges (Root -> Left, Root -> Right) */}
      <line x1="60" y1="52" x2="38" y2="52" stroke="#6F482D" strokeWidth="2.8" />
      <line x1="70" y1="52" x2="92" y2="52" stroke="#6F482D" strokeWidth="2.8" />

      {/* Structured Conifer Flanking (Orderly Arboretum Trees) */}
      <polygon points="32,8 20,24 44,24" fill="#1C3F27" />
      <polygon points="98,8 86,24 110,24" fill="#1C3F27" />
      <polygon points="65,4 51,20 79,20" fill="#265434" />

      {/* Symmetrical Left/Right Dividing Stone Steps */}
      <line x1="65" y1="66" x2="65" y2="88" stroke="#333E30" strokeWidth="2.2" />
      <line x1="45" y1="74" x2="55" y2="74" stroke="#7A8D76" strokeWidth="1" />
      <line x1="75" y1="74" x2="85" y2="74" stroke="#7A8D76" strokeWidth="1" />

      {/* Subdued / Locked State Visual */}
      {isLocked && (
        <g opacity="0.7">
          {/* Weathered Timber Lattice Gate across threshold */}
          <rect x="58" y="62" width="14" height="16" fill="#2E1C11" stroke="#1C1008" strokeWidth="1" />
          <line x1="58" y1="62" x2="72" y2="78" stroke="#4A2F1D" strokeWidth="0.8" />
          <line x1="72" y1="62" x2="58" y2="78" stroke="#4A2F1D" strokeWidth="0.8" />
        </g>
      )}
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 5. HIGHLAND PASS (The Mountain Saddle / Zone 5 Gateway)
// ══════════════════════════════════════════════════════════════════════════
export function HighlandPassGateV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
  isLocked = true,
}: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      {/* Ground Shadow */}
      <ellipse cx="60" cy="82" rx="55" ry="8" fill="#0C1B0E" opacity="0.35" />

      {/* Left Monumental Stone Cairn */}
      <ellipse cx="25" cy="80" rx="16" ry="6" fill="#4B5646" />
      <ellipse cx="25" cy="74" rx="14" ry="5.5" fill="#586653" />
      <ellipse cx="25" cy="68" rx="12" ry="5" fill="#667763" />
      <ellipse cx="25" cy="62" rx="10" ry="4.5" fill="#758872" />
      <ellipse cx="25" cy="56" rx="8" ry="4" fill="#849881" />
      <ellipse cx="25" cy="50" rx="5" ry="3.5" fill="#94A891" />

      {/* Right Monumental Stone Cairn */}
      <ellipse cx="95" cy="80" rx="16" ry="6" fill="#4B5646" />
      <ellipse cx="95" cy="74" rx="14" ry="5.5" fill="#586653" />
      <ellipse cx="95" cy="68" rx="12" ry="5" fill="#667763" />
      <ellipse cx="95" cy="62" rx="10" ry="4.5" fill="#758872" />
      <ellipse cx="95" cy="56" rx="8" ry="4" fill="#849881" />
      <ellipse cx="95" cy="50" rx="5" ry="3.5" fill="#94A891" />

      {/* Massive Weathered Alpine Timber Lintel Beam */}
      <rect x="18" y="44" width="84" height="7" rx="1.8" fill="#3D291B" stroke="#20130A" strokeWidth="1.2" />
      <rect x="22" y="42" width="76" height="3" fill="#5A3D29" opacity="0.7" />

      {/* High Mountain Trail Passing Through Saddle */}
      <path
        d="M 38 82 C 45 68, 75 68, 82 82 C 78 86, 42 86, 38 82 Z"
        fill="#6E7E6B"
        stroke="#455243"
        strokeWidth="1"
      />
      {/* Ascending rocky trail stones */}
      <path d="M 52 74 C 55 64, 65 64, 68 74" stroke="#9BB098" strokeWidth="2.4" strokeDasharray="3 3" />

      {/* Swirling Mountain Pass Mist Drifting Between Cairns */}
      <ellipse cx="60" cy="58" rx="42" ry="16" fill="#FFFFFF" opacity="0.45" />
      <ellipse cx="60" cy="54" rx="28" ry="11" fill="#FFFFFF" opacity="0.6" />

      {/* Boundary Trail Marker Posts */}
      <rect x="36" y="58" width="3" height="18" fill="#382417" />
      <rect x="81" y="58" width="3" height="18" fill="#382417" />
      <line x1="37" y1="62" x2="82" y2="62" stroke="#6B7280" strokeWidth="1.4" strokeDasharray="4 3" />
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 6. GRAPH HIGHLANDS DISTANT TEASE (Beyond Highland Pass)
// ══════════════════════════════════════════════════════════════════════════
export function GraphHighlandsTeaseV2({
  x = 0,
  y = 0,
  scale = 1,
  className = "",
}: {
  x?: number
  y?: number
  scale?: number
  className?: string
}) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className} opacity="0.68">
      {/* High Razor-Sharp Mountain Ridges in Distant Slate */}
      <polygon points="20,120 70,35 120,120" fill="#698579" />
      <polygon points="70,35 70,120 120,120" fill="#50695E" />
      <polygon points="90,120 140,20 190,120" fill="#759386" />
      <polygon points="140,20 140,120 190,120" fill="#587467" />
      <polygon points="160,120 210,45 260,120" fill="#6B887B" />
      <polygon points="210,45 210,120 260,120" fill="#526E61" />

      {/* High-Elevation Suspension Bridge Spanning Between Crags */}
      <path
        d="M 68 55 Q 105 72, 142 45"
        stroke="#2E3C36"
        strokeWidth="2.2"
        fill="none"
      />
      <path
        d="M 68 51 Q 105 68, 142 41"
        stroke="#94A3B8"
        strokeWidth="1.2"
        fill="none"
      />
      {/* Bridge Vertical Struts */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const bx = 80 + i * 10
        const by1 = 57 + (i < 3 ? i * 2.5 : (5 - i) * 2.5)
        return (
          <line
            key={i}
            x1={bx}
            y1={by1}
            x2={bx}
            y2={by1 + 6}
            stroke="#1E293B"
            strokeWidth="0.8"
          />
        )
      })}

      {/* Distant Mountain Lookout Platform (Node in the Graph) */}
      <rect x="64" y="52" width="10" height="5" fill="#334155" />
      <rect x="138" y="42" width="10" height="5" fill="#334155" />

      {/* Atmospheric Haze Layer */}
      <ellipse cx="140" cy="75" rx="120" ry="30" fill="#FFFFFF" opacity="0.38" />
    </g>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// 7. MINIATURE LANDMARKS FOR THE 7-ZONE MACRO WORLD
// ══════════════════════════════════════════════════════════════════════════

// Zone 1: Basecamp Miniature
export function MacroBasecampMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="22" rx="18" ry="4" fill="#0E2114" opacity="0.3" />
      {/* Canvas Outpost Tents */}
      <polygon points="12,6 4,20 20,20" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.8" />
      <polygon points="12,6 20,20 16,20" fill="#CBD5E1" />
      <polygon points="26,8 18,20 34,20" fill="#E2E8F0" stroke="#64748B" strokeWidth="0.8" />
      {/* Small Campfire Glow */}
      <circle cx="21" cy="21" r="2.2" fill="#F59E0B" />
      <circle cx="21" cy="21" r="5" fill="#FBBF24" opacity="0.4" />
    </g>
  )
}

// Zone 2: Pattern Meadows Miniature
export function MacroPatternMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="20" rx="18" ry="4" fill="#0E2114" opacity="0.3" />
      {/* Rustic Timber Watermill / Barn */}
      <rect x="10" y="8" width="16" height="12" fill="#6B482E" stroke="#372314" strokeWidth="0.8" />
      <polygon points="18,2 8,8 28,8" fill="#8C5C38" stroke="#372314" strokeWidth="0.8" />
      {/* Water Wheel */}
      <circle cx="8" cy="15" r="4.5" fill="#4B311E" stroke="#26170B" strokeWidth="0.6" />
      <line x1="8" y1="11" x2="8" y2="19" stroke="#9A6B43" strokeWidth="0.6" />
      <line x1="4" y1="15" x2="12" y2="15" stroke="#9A6B43" strokeWidth="0.6" />
    </g>
  )
}

// Zone 3: Structure Woods Miniature
export function MacroStructureMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="22" rx="18" ry="4" fill="#0E2114" opacity="0.3" />
      {/* Stepped Timber Tower / Loggers' Shelter */}
      <rect x="14" y="6" width="12" height="15" fill="#543A26" stroke="#2B1A0E" strokeWidth="0.8" />
      <polygon points="20,1 12,6 28,6" fill="#6B482E" stroke="#2B1A0E" strokeWidth="0.8" />
      <line x1="10" y1="18" x2="30" y2="18" stroke="#8C633D" strokeWidth="1.4" />
    </g>
  )
}

// Zone 4: Recursive Forest Miniature (Beacon / Current)
export function MacroRecursiveMiniature({ x = 0, y = 0, scale = 1, isCurrent = true }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="22" cy="24" rx="22" ry="5" fill="#0E2114" opacity="0.4" />
      {/* Hero Lodge Silhouette */}
      <rect x="12" y="10" width="18" height="13" fill="#452714" stroke="#241308" strokeWidth="0.8" />
      <polygon points="21,3 9,10 33,10" fill="#6E4427" stroke="#241308" strokeWidth="0.9" />
      {/* Warm Light in window */}
      <rect x="18" y="14" width="5" height="5" fill="#FDE68A" />
      {/* Chimney Smoke */}
      <circle cx="27" cy="6" r="2" fill="#FFFFFF" opacity="0.7" />
      <circle cx="29" cy="2" r="3" fill="#FFFFFF" opacity="0.5" />
      {/* Ancient Pine Sentinel */}
      <polygon points="7,2 2,16 12,16" fill="#14311D" />
      <polygon points="7,8 0,22 14,22" fill="#0D2415" />
      {/* Active Gold Beacon */}
      {isCurrent && (
        <g>
          <circle cx="21" cy="3" r="3" fill="#F59E0B" />
          <circle cx="21" cy="3" r="8" fill="#FBBF24" opacity="0.45" />
        </g>
      )}
    </g>
  )
}

// Zone 5: Graph Highlands Miniature
export function MacroGraphMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="22" rx="18" ry="4" fill="#0E2114" opacity="0.25" />
      {/* Twin Needle Peaks with Suspension Bridge */}
      <polygon points="8,4 3,20 13,20" fill="#586E65" />
      <polygon points="28,2 22,20 34,20" fill="#586E65" />
      <path d="M 8 9 Q 18 14, 28 8" stroke="#94A3B8" strokeWidth="1" fill="none" />
    </g>
  )
}

// Zone 6: Optimization Peaks Miniature
export function MacroOptimizationMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="22" rx="18" ry="4" fill="#0E2114" opacity="0.25" />
      {/* Sharp Glacial Couloir & Refuge Hut */}
      <polygon points="20,0 6,20 34,20" fill="#4B5E55" />
      <polygon points="20,0 20,20 34,20" fill="#384941" />
      {/* Snow couloir */}
      <polygon points="20,0 16,8 22,14 18,20" fill="#FFFFFF" opacity="0.85" />
      <rect x="23" y="14" width="6" height="5" fill="#64748B" />
    </g>
  )
}

// Zone 7: Interview Summit Miniature
export function MacroSummitMiniature({ x = 0, y = 0, scale = 1 }: StructureProps) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="20" cy="22" rx="18" ry="4" fill="#0E2114" opacity="0.25" />
      {/* Master Alpine Horn & Beacon Spire */}
      <polygon points="20,2 10,20 30,20" fill="#3D4E46" />
      <polygon points="20,2 20,20 30,20" fill="#2D3B34" />
      <line x1="20" y1="2" x2="20" y2="-4" stroke="#D97706" strokeWidth="1" />
      <circle cx="20" cy="-4" r="2" fill="#FCD34D" />
      <circle cx="20" cy="-4" r="6" fill="#FCD34D" opacity="0.3" />
    </g>
  )
}
