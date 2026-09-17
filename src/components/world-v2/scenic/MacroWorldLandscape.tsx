import type { MacroZoneData } from "../worldV2Types"
import { PineTreeV2, WildflowerClusterV2, BoulderV2 } from "./WorldV2Foliage"

interface MacroWorldLandscapeProps {
  zones: MacroZoneData[]
  activeZoneId: string | null
  onSelectZone: (zone: MacroZoneData) => void
  onEnterRecursiveForest: () => void
  className?: string
}

export default function MacroWorldLandscape({
  zones,
  activeZoneId,
  onSelectZone,
  onEnterRecursiveForest,
  className = "",
}: MacroWorldLandscapeProps) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className={`w-full h-full block select-none ${className}`}
      fill="none"
    >
      <defs>
        {/* Sky Gradients */}
        <linearGradient id="mSkyGrad" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#C4E0E8" />
          <stop offset="35%" stopColor="#BBDED5" />
          <stop offset="70%" stopColor="#B0D8BE" />
          <stop offset="100%" stopColor="#A4CEB0" />
        </linearGradient>

        <radialGradient id="mSunGlow" cx="18%" cy="12%" r="70%">
          <stop offset="0%" stopColor="#FFFEE8" stopOpacity="0.65" />
          <stop offset="30%" stopColor="#E6F4EA" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C8E2D2" stopOpacity="0" />
        </radialGradient>

        {/* Shaders & Gradients for Macro World */}
        <linearGradient id="mSunlitGranite" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#D4E3D2" />
          <stop offset="35%" stopColor="#C0D0BE" />
          <stop offset="70%" stopColor="#A4B7A2" />
          <stop offset="100%" stopColor="#879A85" />
        </linearGradient>

        <linearGradient id="mShadedGranite" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#7E917F" />
          <stop offset="45%" stopColor="#677A68" />
          <stop offset="80%" stopColor="#526353" />
          <stop offset="100%" stopColor="#3F4F40" />
        </linearGradient>

        <linearGradient id="mPeakSnow" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="60%" stopColor="#F1F6F2" />
          <stop offset="100%" stopColor="#D5E4D8" />
        </linearGradient>

        {/* High-Contrast Alpine Meadow Tiers */}
        <linearGradient id="mMeadow1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4D7042" />
          <stop offset="50%" stopColor="#5E8352" />
          <stop offset="100%" stopColor="#709763" />
        </linearGradient>

        <linearGradient id="mMeadow2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5E8352" />
          <stop offset="50%" stopColor="#709763" />
          <stop offset="100%" stopColor="#84AB76" />
        </linearGradient>

        <linearGradient id="mMeadow3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6F9562" />
          <stop offset="50%" stopColor="#82A974" />
          <stop offset="100%" stopColor="#96BD88" />
        </linearGradient>

        <linearGradient id="mMeadow4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#81A873" />
          <stop offset="50%" stopColor="#95BD87" />
          <stop offset="100%" stopColor="#A9D19B" />
        </linearGradient>

        {/* Mountain Mist & Cloud */}
        <radialGradient id="mMountainMist" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="60%" stopColor="#E4EFE8" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#CDE1D6" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ── 0. Sky Fill & Morning Sun Glow ── */}
      <rect width="1440" height="900" fill="url(#mSkyGrad)" />
      <rect width="1440" height="900" fill="url(#mSunGlow)" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. DRAMATIC HIGH ALPINE BACKGROUND RANGES (Elevation 2,500m - 3,890m)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* Distant Misty Peaks */}
      <polygon points="50,420 150,260 250,330 350,220 480,380" fill="#9CBBA8" opacity="0.6" />
      <polygon points="450,390 580,210 700,280 820,170 960,340" fill="#9CBBA8" opacity="0.6" />

      {/* Grand Eastern Mountain Crest (Interview Summit Horn & Optimization Peaks) */}
      <g>
        {/* Main Eastern Massif Sunlit Southwest Faces */}
        <polygon points="800,500 930,260 1020,320 1120,180 1200,240 1290,95 1380,180 1480,480 800,480" fill="url(#mSunlitGranite)" />
        {/* Shaded Northeast Facets */}
        <polygon points="930,260 1020,320 1020,500 930,500" fill="url(#mShadedGranite)" opacity="0.75" />
        <polygon points="1120,180 1200,240 1200,500 1120,500" fill="url(#mShadedGranite)" opacity="0.75" />
        <polygon points="1290,95 1380,180 1480,480 1380,500 1290,500" fill="url(#mShadedGranite)" opacity="0.85" />

        {/* Snow Couloirs & Summit Caps */}
        <polygon points="1290,95 1270,140 1290,135 1315,145" fill="url(#mPeakSnow)" />
        <polygon points="1120,180 1105,215 1120,210 1140,220" fill="url(#mPeakSnow)" />
        <polygon points="930,260 918,290 930,285 945,295" fill="url(#mPeakSnow)" />
      </g>

      {/* Western Montane Massif (Backdrop for Basecamp & Pattern Meadows) */}
      <g>
        <polygon points="-40,540 60,380 140,430 240,310 320,370 420,280 540,460 620,530 -40,530" fill="url(#mSunlitGranite)" />
        <polygon points="240,310 320,370 320,530 240,530" fill="url(#mShadedGranite)" opacity="0.7" />
        <polygon points="420,280 540,460 540,530 420,530" fill="url(#mShadedGranite)" opacity="0.75" />
        <polygon points="420,280 405,310 420,305 435,315" fill="url(#mPeakSnow)" />
      </g>

      {/* Mountain Saddle Pass Col Mist (Between Zone 4 and Zone 5) */}
      <ellipse cx="830" cy="380" rx="140" ry="50" fill="url(#mMountainMist)" />

      {/* ══════════════════════════════════════════════════════════════════════
          2. RISING EXPEDITION MEADOW TIERS (4 Layered Pastures)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* Tier 1: High Mountain Saddle Shelf (Zone 5 Graph Highlands & Zone 4 High Ridge) */}
      <path
        d="M -40 460 C 220 390, 480 380, 720 410 C 960 440, 1220 370, 1480 390 L 1480 900 L -40 900 Z"
        fill="url(#mMeadow1)"
      />
      <path
        d="M -40 460 C 220 390, 480 380, 720 410 C 960 440, 1220 370, 1480 390"
        stroke="#84AB76"
        strokeWidth="3.5"
      />

      {/* Tier 2: Mid-High Forest Terrace (Zone 4 Recursive Forest & Zone 3 Structure Woods) */}
      <path
        d="M -40 540 C 200 480, 440 470, 680 510 C 940 550, 1200 490, 1480 480 L 1480 900 L -40 900 Z"
        fill="url(#mMeadow2)"
      />
      <path
        d="M -40 540 C 200 480, 440 470, 680 510 C 940 550, 1200 490, 1480 480"
        stroke="#96BD88"
        strokeWidth="3.5"
      />

      {/* Tier 3: Low-Mid Pasture (Zone 2 Pattern Meadows) */}
      <path
        d="M -40 630 C 220 570, 480 560, 720 605 C 980 650, 1240 600, 1480 580 L 1480 900 L -40 900 Z"
        fill="url(#mMeadow3)"
      />
      <path
        d="M -40 630 C 220 570, 480 560, 720 605 C 980 650, 1240 600, 1480 580"
        stroke="#A9D19B"
        strokeWidth="4"
      />

      {/* Tier 4: Lower Valley Basin (Zone 1 Basecamp Trailhead) */}
      <path
        d="M -40 720 C 240 670, 520 665, 780 710 C 1040 755, 1280 710, 1480 680 L 1480 900 L -40 900 Z"
        fill="url(#mMeadow4)"
      />
      <path
        d="M -40 720 C 240 670, 520 665, 780 710 C 1040 755, 1280 710, 1480 680"
        stroke="#C0E5B3"
        strokeWidth="4"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          3. EXPEDITION TRAIL (Basecamp -> Summit)
          ══════════════════════════════════════════════════════════════════════ */}
      {/* 3A. Completed Expedition Trail: Basecamp (180,720) -> Pattern (350,610) -> Structure (530,520) -> Recursive (730,420) */}
      <path
        d="M 180 720 
           C 240 685, 290 650, 350 610 
           C 410 575, 470 555, 530 520 
           C 600 485, 660 450, 730 420"
        stroke="#047857"
        strokeWidth="10"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M 180 720 
           C 240 685, 290 650, 350 610 
           C 410 575, 470 555, 530 520 
           C 600 485, 660 450, 730 420"
        stroke="#34D399"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray="14 10"
      />
      {/* Stone Paving highlights */}
      {[220, 270, 390, 440, 480, 580, 630, 680].map((px, i) => {
        const py = 720 - (px - 180) * 0.54
        return <rect key={i} x={px} y={py} width="10" height="3" rx="1.5" fill="#ECFDF5" opacity="0.9" />
      })}

      {/* 3B. Locked High Ascent Trail: Recursive (730,420) -> Graph (930,340) -> Optimization (1120,250) -> Summit (1290,160) */}
      <path
        d="M 730 420 
           C 800 390, 870 365, 930 340 
           C 1000 310, 1060 280, 1120 250 
           C 1180 220, 1240 190, 1290 160"
        stroke="#1E293B"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M 730 420 
           C 800 390, 870 365, 930 340 
           C 1000 310, 1060 280, 1120 250 
           C 1180 220, 1240 190, 1290 160"
        stroke="#94A3B8"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="6 8"
      />

      {/* ══════════════════════════════════════════════════════════════════════
          4. BOTANICAL FORESTS & SCENIC DETAILS
          ══════════════════════════════════════════════════════════════════════ */}
      {/* Basecamp Lowland Pine Stand */}
      <PineTreeV2 x={90} y={690} scale={1.2} variant="tall" />
      <PineTreeV2 x={130} y={710} scale={1.1} variant="medium" />
      <PineTreeV2 x={230} y={710} scale={1.0} variant="medium" />
      <WildflowerClusterV2 x={160} y={745} color="yellow" scale={1.4} />

      {/* Pattern Meadows Trees & Watercourse */}
      <PineTreeV2 x={280} y={590} scale={1.1} variant="small" />
      <PineTreeV2 x={400} y={600} scale={1.1} variant="medium" />
      <WildflowerClusterV2 x={330} y={635} color="blue" scale={1.3} />
      <BoulderV2 x={380} y={625} scale={1.3} />

      {/* Structure Woods Dense Montane Canopy */}
      <PineTreeV2 x={460} y={490} scale={1.2} variant="medium" />
      <PineTreeV2 x={490} y={515} scale={1.3} variant="tall" />
      <PineTreeV2 x={570} y={500} scale={1.3} variant="medium" />
      <PineTreeV2 x={600} y={520} scale={1.1} variant="small" />

      {/* Recursive Forest Ancient Pines (HERO GROVE) */}
      <PineTreeV2 x={660} y={380} scale={1.4} variant="ancient" />
      <PineTreeV2 x={790} y={395} scale={1.3} variant="tall" />
      <PineTreeV2 x={720} y={425} scale={1.1} variant="medium" />

      {/* Graph Highlands Ridge Pines */}
      <PineTreeV2 x={870} y={330} scale={0.9} variant="small" />
      <BoulderV2 x={980} y={350} scale={1.5} />

      {/* Optimization Peaks Rugged Couloirs */}
      <PineTreeV2 x={1060} y={240} scale={0.7} variant="distant" />
      <BoulderV2 x={1170} y={250} scale={1.6} />

      {/* ══════════════════════════════════════════════════════════════════════
          5. THE 7 ZONE DESTINATION LANDMARKS & INTERACTIVE BADGES
          ══════════════════════════════════════════════════════════════════════ */}

      {/* ── ZONE 1: BASECAMP (x: 180, y: 720) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[0])}>
        {/* Landmark illustration: Outpost Cabin & Canvas Tents */}
        <g transform="translate(130, 680)">
          <ellipse cx="40" cy="38" rx="36" ry="7" fill="#0C1B0D" opacity="0.4" />
          {/* Main Supply Cabin */}
          <rect x="22" y="16" width="36" height="22" fill="#5D3E29" stroke="#2B170B" strokeWidth="1.5" rx="1.5" />
          <polygon points="40,6 16,18 64,18" fill="#754F34" stroke="#2B170B" strokeWidth="1.8" />
          <rect x="34" y="24" width="10" height="14" fill="#3D2415" />
          {/* Campfire */}
          <circle cx="68" cy="34" r="3.5" fill="#F59E0B" />
          <circle cx="68" cy="34" r="8" fill="#FBBF24" opacity="0.4" />
          {/* Wall Tent */}
          <polygon points="12,18 0,36 24,36" fill="#F1F5F9" stroke="#64748B" strokeWidth="1.2" />
        </g>
      </g>

      {/* ── ZONE 2: PATTERN MEADOWS (x: 350, y: 610) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[1])}>
        <g transform="translate(305, 570)">
          <ellipse cx="40" cy="36" rx="34" ry="7" fill="#0C1B0D" opacity="0.35" />
          {/* Rustic Timber Watermill */}
          <rect x="24" y="14" width="32" height="22" fill="#65432B" stroke="#2B180C" strokeWidth="1.5" rx="1.5" />
          <polygon points="40,5 18,16 62,16" fill="#845738" stroke="#2B180C" strokeWidth="1.8" />
          {/* Watermill wheel */}
          <circle cx="16" cy="26" r="8" fill="#422918" stroke="#22130A" strokeWidth="1.2" />
          <line x1="16" y1="18" x2="16" y2="34" stroke="#B48459" strokeWidth="1" />
          <line x1="8" y1="26" x2="24" y2="26" stroke="#B48459" strokeWidth="1" />
        </g>
      </g>

      {/* ── ZONE 3: STRUCTURE WOODS (x: 530, y: 520) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[2])}>
        <g transform="translate(485, 475)">
          <ellipse cx="40" cy="38" rx="34" ry="7" fill="#0C1B0D" opacity="0.35" />
          {/* High Timber Lookout Tower */}
          <line x1="28" y1="36" x2="34" y2="12" stroke="#4D311E" strokeWidth="2.5" />
          <line x1="52" y1="36" x2="46" y2="12" stroke="#4D311E" strokeWidth="2.5" />
          <line x1="30" y1="26" x2="50" y2="26" stroke="#6F482D" strokeWidth="1.5" />
          <line x1="32" y1="18" x2="48" y2="18" stroke="#6F482D" strokeWidth="1.5" />
          {/* Tower Platform & Roof */}
          <rect x="30" y="8" width="20" height="7" fill="#6A452C" stroke="#221309" strokeWidth="1.2" />
          <polygon points="40,2 26,9 54,9" fill="#825435" stroke="#221309" strokeWidth="1.4" />
        </g>
      </g>

      {/* ── ZONE 4: RECURSIVE FOREST (CURRENT HERO LANDMARK - x: 730, y: 420) ── */}
      <g className="cursor-pointer group" onClick={onEnterRecursiveForest}>
        {/* Pulsing Active Beacon Glow */}
        <circle cx="730" cy="420" r="48" fill="#F59E0B" opacity="0.18" className="animate-pulse" />
        <circle cx="730" cy="420" r="32" fill="#F59E0B" opacity="0.28" />

        <g transform="translate(675, 360)">
          <ellipse cx="55" cy="56" rx="52" ry="9" fill="#0C1B0D" opacity="0.5" />
          {/* Hero Two-Story Lodge Silhouette */}
          <rect x="22" y="24" width="64" height="32" fill="#4B2F1C" stroke="#221309" strokeWidth="2" rx="2" />
          <polygon points="54,2 10,26 98,26" fill="#71482C" stroke="#221309" strokeWidth="2.4" strokeLinejoin="round" />
          {/* Warm Glowing Hearth Windows */}
          <rect x="34" y="34" width="12" height="13" fill="#FDE68A" stroke="#2B170B" strokeWidth="1" />
          <rect x="62" y="34" width="12" height="13" fill="#FDE68A" stroke="#2B170B" strokeWidth="1" />
          {/* Chimney & Hearth Smoke */}
          <rect x="74" y="8" width="10" height="20" fill="#526351" stroke="#2F392E" strokeWidth="1.2" />
          <circle cx="79" cy="0" r="4.5" fill="#FFFFFF" opacity="0.75" />
          <circle cx="83" cy="-9" r="6.5" fill="#FFFFFF" opacity="0.55" />
          {/* Golden Expedition Flag */}
          <line x1="54" y1="2" x2="54" y2="-16" stroke="#2B170B" strokeWidth="2" />
          <polygon points="54,-16 78,-10 54,-4" fill="#F59E0B" stroke="#B45309" strokeWidth="1.2" />
          <circle cx="54" cy="-16" r="3" fill="#FEF08A" />
        </g>

        {/* Hero Landmark Pin Icon */}
        <circle cx="730" cy="420" r="16" fill="#D97706" stroke="#FEF3C7" strokeWidth="3.5" />
        <polygon points="726,411 738,420 726,429" fill="#FFFFFF" />
      </g>

      {/* ── ZONE 5: GRAPH HIGHLANDS (LOCKED - x: 930, y: 340) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[4])}>
        <g transform="translate(880, 290)">
          <ellipse cx="50" cy="48" rx="42" ry="7" fill="#0C1B0D" opacity="0.35" />
          {/* Twin High Rock Needles with Suspension Bridge */}
          <polygon points="20,8 10,46 30,46" fill="#596F65" stroke="#2E3C36" strokeWidth="1.5" />
          <polygon points="80,4 70,46 90,46" fill="#596F65" stroke="#2E3C36" strokeWidth="1.5" />
          <path d="M 20 18 Q 50 28, 80 14" stroke="#94A3B8" strokeWidth="2" fill="none" />
          <path d="M 20 22 Q 50 32, 80 18" stroke="#334155" strokeWidth="2.5" fill="none" />
        </g>
        <circle cx="930" cy="340" r="10" fill="#475569" stroke="#E2E8F0" strokeWidth="2.2" />
        <circle cx="930" cy="340" r="3.5" fill="#CBD5E1" />
      </g>

      {/* ── ZONE 6: OPTIMIZATION PEAKS (LOCKED - x: 1120, y: 250) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[5])}>
        <g transform="translate(1075, 205)">
          <ellipse cx="45" cy="44" rx="40" ry="7" fill="#0C1B0D" opacity="0.35" />
          {/* High Couloir Refuge Hut */}
          <polygon points="45,4 15,42 75,42" fill="#4E6057" stroke="#25322C" strokeWidth="1.5" />
          <polygon points="45,4 45,42 75,42" fill="#384941" />
          <polygon points="45,4 38,18 48,26 42,42" fill="#FFFFFF" opacity="0.85" />
          <rect x="52" y="30" width="12" height="10" fill="#64748B" stroke="#1E293B" strokeWidth="1" />
        </g>
        <circle cx="1120" cy="250" r="10" fill="#475569" stroke="#E2E8F0" strokeWidth="2.2" />
        <circle cx="1120" cy="250" r="3.5" fill="#CBD5E1" />
      </g>

      {/* ── ZONE 7: INTERVIEW SUMMIT (LOCKED - x: 1290, y: 160) ── */}
      <g className="cursor-pointer group" onClick={() => onSelectZone(zones[6])}>
        <g transform="translate(1245, 110)">
          <ellipse cx="45" cy="46" rx="42" ry="7" fill="#0C1B0D" opacity="0.35" />
          {/* Summit Observatory & Mastery Spire */}
          <polygon points="45,6 20,44 70,44" fill="#3E4F47" stroke="#202A25" strokeWidth="1.8" />
          <polygon points="45,6 45,44 70,44" fill="#2D3B34" />
          <line x1="45" y1="6" x2="45" y2="-8" stroke="#D97706" strokeWidth="2" />
          <circle cx="45" cy="-8" r="4.5" fill="#FCD34D" />
          <circle cx="45" cy="-8" r="12" fill="#FCD34D" opacity="0.35" />
        </g>
        <circle cx="1290" cy="160" r="11" fill="#475569" stroke="#E2E8F0" strokeWidth="2.5" />
        <circle cx="1290" cy="160" r="4" fill="#CBD5E1" />
      </g>

      {/* ══════════════════════════════════════════════════════════════════════
          6. RESTRAINED LANDMARK BADGES (High Legibility & Contrast)
          ══════════════════════════════════════════════════════════════════════ */}
      {zones.map((zone) => {
        const isCurrent = zone.state === "current"
        const isCompleted = zone.state === "completed"
        const isSelected = zone.id === activeZoneId

        const lx = zone.x
        const ly = zone.y + (isCurrent ? 46 : 28)

        return (
          <g
            key={zone.id}
            transform={`translate(${lx}, ${ly})`}
            className="cursor-pointer group pointer-events-auto"
            onClick={() => (isCurrent ? onEnterRecursiveForest() : onSelectZone(zone))}
          >
            {/* Pill Backdrop */}
            <rect
              x={-80}
              y={-17}
              width={160}
              height={34}
              rx={17}
              fill={isCurrent ? "#0A241A" : "#071A14"}
              stroke={
                isCurrent
                  ? "#F59E0B"
                  : isCompleted
                    ? "#10B981"
                    : "rgba(148, 163, 184, 0.4)"
              }
              strokeWidth={isCurrent || isSelected ? 2.5 : 1.2}
              style={{ filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" }}
            />

            {/* Zone Name */}
            <text
              x={0}
              y={-2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isCurrent ? "#FEF3C7" : "#FFFFFF"}
              fontSize="12.5"
              fontWeight="700"
              fontFamily="var(--font-display, Outfit, sans-serif)"
              letterSpacing="0.02em"
            >
              {zone.index}. {zone.name}
            </text>

            {/* Status sub-label */}
            <text
              x={0}
              y={9.5}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={isCurrent ? "#FBBF24" : isCompleted ? "#34D399" : "#94A3B8"}
              fontSize="9"
              fontWeight="600"
              fontFamily="var(--font-sans, Inter, sans-serif)"
              letterSpacing="0.04em"
            >
              {isCurrent
                ? "CURRENT EXPEDITION"
                : isCompleted
                  ? "COMPLETED ✓"
                  : "LOCKED 🔒"}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
