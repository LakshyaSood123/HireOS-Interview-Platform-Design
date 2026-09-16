interface AlpineCabinProps {
  className?: string
  scale?: number
  hasSmoke?: boolean
  hasFlag?: boolean
  flagText?: string
  isGlow?: boolean
  variant?: "standard" | "lodge" | "summit" | "lookout" | "stoneChalet"
}

export default function AlpineCabin({
  className = "",
  scale = 1,
  hasSmoke = true,
  hasFlag = false,
  flagText = "",
  isGlow = true,
  variant = "standard",
}: AlpineCabinProps) {
  const isLodge = variant === "lodge"
  const isSummit = variant === "summit"
  const isLookout = variant === "lookout"
  const isStone = variant === "stoneChalet"

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT 1: TWO-STORY TREES LEARNING LODGE (Active Hero Destination)
  // ══════════════════════════════════════════════════════════════════════════
  if (isLodge) {
    return (
      <div
        className={`relative inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${114 * scale}px`, height: `${94 * scale}px` }}
      >
        <svg viewBox="0 0 114 94" className="w-full h-full" fill="none">
          <defs>
            <linearGradient id="lodgeRoof" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#754F34" />
              <stop offset="40%" stopColor="#5E3C25" />
              <stop offset="100%" stopColor="#3C2415" />
            </linearGradient>
            <linearGradient id="lodgeTimber" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5D3E29" />
              <stop offset="50%" stopColor="#4A2F1D" />
              <stop offset="100%" stopColor="#382112" />
            </linearGradient>
            <linearGradient id="warmWindow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFDEB" />
              <stop offset="45%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <radialGradient id="lodgeSmoke" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
              <stop offset="60%" stopColor="#E2E8F0" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Ambient Ground Occlusion Shadow */}
          <ellipse cx="57" cy="88" rx="52" ry="5.5" fill="#0C1B0D" opacity="0.35" />
          <ellipse cx="57" cy="87" rx="42" ry="3.5" fill="#060F07" opacity="0.45" />

          {/* Stone Masonry Terrace Foundation */}
          <path d="M 12 75 L 102 75 L 98 87 L 16 87 Z" fill="#4B5647" stroke="#333C30" strokeWidth="1.2" />
          <ellipse cx="24" cy="81" rx="6" ry="2.5" fill="#62705E" stroke="#3A4437" strokeWidth="0.6" />
          <ellipse cx="40" cy="80.5" rx="7" ry="2.6" fill="#546150" stroke="#3A4437" strokeWidth="0.6" />
          <ellipse cx="58" cy="81" rx="7.5" ry="2.5" fill="#62705E" stroke="#3A4437" strokeWidth="0.6" />
          <ellipse cx="76" cy="80.5" rx="6.5" ry="2.4" fill="#546150" stroke="#3A4437" strokeWidth="0.6" />
          <ellipse cx="90" cy="81" rx="5.5" ry="2.2" fill="#62705E" stroke="#3A4437" strokeWidth="0.6" />

          {/* Stepping Flagstone Slabs leading down */}
          <rect x="46" y="85" width="22" height="3" rx="1" fill="#758471" stroke="#3C4638" strokeWidth="0.8" />
          <rect x="49" y="87.5" width="16" height="2.5" rx="1" fill="#889984" stroke="#3C4638" strokeWidth="0.6" />

          {/* Chimney with Smoke */}
          <rect x="78" y="10" width="12" height="28" rx="1.5" fill="#546150" stroke="#363F33" strokeWidth="1" />
          <line x1="78" y1="18" x2="90" y2="18" stroke="#363F33" strokeWidth="0.8" />
          <line x1="78" y1="26" x2="90" y2="26" stroke="#363F33" strokeWidth="0.8" />
          <rect x="76" y="8" width="16" height="3" rx="1" fill="#6E7D6A" stroke="#363F33" strokeWidth="0.8" />
          {hasSmoke && (
            <g>
              <circle cx="84" cy="2" r="5" fill="url(#lodgeSmoke)" />
              <circle cx="89" cy="-6" r="7" fill="url(#lodgeSmoke)" />
              <circle cx="95" cy="-16" r="9" fill="url(#lodgeSmoke)" />
            </g>
          )}

          {/* Log Cabin Walls (Two Stories) */}
          <rect x="18" y="38" width="78" height="38" rx="2.5" fill="url(#lodgeTimber)" stroke="#26150B" strokeWidth="1.5" />
          
          {/* Saddle-Notch Log Ends */}
          <g>
            <rect x="14" y="40" width="5.5" height="6.5" rx="1.4" fill="#422918" stroke="#26150B" strokeWidth="0.8" />
            <rect x="14" y="48" width="5.5" height="6.5" rx="1.4" fill="#422918" stroke="#26150B" strokeWidth="0.8" />
            <rect x="14" y="56" width="5.5" height="6.5" rx="1.4" fill="#422918" stroke="#26150B" strokeWidth="0.8" />
            <rect x="14" y="64" width="5.5" height="6.5" rx="1.4" fill="#422918" stroke="#26150B" strokeWidth="0.8" />

            <rect x="94.5" y="40" width="5.5" height="6.5" rx="1.4" fill="#321D10" stroke="#26150B" strokeWidth="0.8" />
            <rect x="94.5" y="48" width="5.5" height="6.5" rx="1.4" fill="#321D10" stroke="#26150B" strokeWidth="0.8" />
            <rect x="94.5" y="56" width="5.5" height="6.5" rx="1.4" fill="#321D10" stroke="#26150B" strokeWidth="0.8" />
            <rect x="94.5" y="64" width="5.5" height="6.5" rx="1.4" fill="#321D10" stroke="#26150B" strokeWidth="0.8" />
          </g>

          {/* Log Wall Horizontal Grooves */}
          <line x1="18" y1="47" x2="96" y2="47" stroke="#331E12" strokeWidth="1.2" />
          <line x1="18" y1="55" x2="96" y2="55" stroke="#331E12" strokeWidth="1.2" />
          <line x1="18" y1="63" x2="96" y2="63" stroke="#331E12" strokeWidth="1.2" />
          <line x1="18" y1="71" x2="96" y2="71" stroke="#331E12" strokeWidth="1.2" />

          {/* Overhanging Alpine Cedar Gable Roof */}
          <polygon points="57,12 6,43 108,43" fill="url(#lodgeRoof)" stroke="#26150B" strokeWidth="1.8" strokeLinejoin="round" />
          <polygon points="57,12 6,43 57,43" fill="#8C5C38" opacity="0.38" />
          <line x1="8" y1="44" x2="106" y2="44" stroke="#221209" strokeWidth="2.4" strokeLinecap="round" />
          <polygon points="18,38 96,38 96,42 18,42" fill="#000000" opacity="0.28" />

          {/* Upper Loft Gable Window */}
          <path d="M 51 29 C 51 25, 63 25, 63 29 L 63 36 L 51 36 Z" fill="url(#warmWindow)" stroke="#2E1A0E" strokeWidth="1.2" />
          <line x1="57" y1="26" x2="57" y2="36" stroke="#2E1A0E" strokeWidth="1" />
          <line x1="51" y1="31" x2="63" y2="31" stroke="#2E1A0E" strokeWidth="1" />

          {/* Ground Floor Windows (Left & Right) */}
          <g>
            {/* Left Window */}
            <rect x="25" y="49" width="18" height="15" rx="1.5" fill="url(#warmWindow)" stroke="#2E1A0E" strokeWidth="1.3" />
            <line x1="34" y1="49" x2="34" y2="64" stroke="#2E1A0E" strokeWidth="1" />
            <line x1="25" y1="56.5" x2="43" y2="56.5" stroke="#2E1A0E" strokeWidth="1" />
            <rect x="23" y="63" width="22" height="3" rx="0.8" fill="#4B311E" stroke="#2B180C" strokeWidth="0.8" />
            <circle cx="27" cy="63" r="1.2" fill="#F43F5E" />
            <circle cx="31" cy="62.5" r="1.2" fill="#38BDF8" />
            <circle cx="36" cy="63" r="1.2" fill="#F43F5E" />
            <circle cx="41" cy="62.5" r="1.2" fill="#FEF08A" />

            {/* Right Window */}
            <rect x="71" y="49" width="18" height="15" rx="1.5" fill="url(#warmWindow)" stroke="#2E1A0E" strokeWidth="1.3" />
            <line x1="80" y1="49" x2="80" y2="64" stroke="#2E1A0E" strokeWidth="1" />
            <line x1="71" y1="56.5" x2="89" y2="56.5" stroke="#2E1A0E" strokeWidth="1" />
            <rect x="69" y="63" width="22" height="3" rx="0.8" fill="#4B311E" stroke="#2B180C" strokeWidth="0.8" />
            <circle cx="73" cy="63" r="1.2" fill="#F43F5E" />
            <circle cx="78" cy="62.5" r="1.2" fill="#38BDF8" />
            <circle cx="83" cy="63" r="1.2" fill="#F43F5E" />
            <circle cx="87" cy="62.5" r="1.2" fill="#FEF08A" />
          </g>

          {/* Central Main Entrance Door */}
          <rect x="49" y="49" width="16" height="26" rx="1.5" fill="#3A2214" stroke="#221209" strokeWidth="1.4" />
          <line x1="54" y1="50" x2="54" y2="74" stroke="#221209" strokeWidth="0.8" />
          <line x1="60" y1="50" x2="60" y2="74" stroke="#221209" strokeWidth="0.8" />
          <rect x="49" y="54" width="4.5" height="1.5" fill="#181411" />
          <rect x="49" y="66" width="4.5" height="1.5" fill="#181411" />
          <circle cx="62" cy="62" r="1.2" fill="#F59E0B" stroke="#78350F" strokeWidth="0.4" />

          {/* Stacked Seasoned Firewood under eaves on left */}
          <g>
            <circle cx="10" cy="71" r="2.2" fill="#C29B70" stroke="#5E402B" strokeWidth="0.6" />
            <circle cx="14" cy="71" r="2.2" fill="#C29B70" stroke="#5E402B" strokeWidth="0.6" />
            <circle cx="12" cy="67.5" r="2.2" fill="#C29B70" stroke="#5E402B" strokeWidth="0.6" />
          </g>
        </svg>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // VARIANT 2: LOOKOUT STILT TOWER (Graphs Region)
  // ══════════════════════════════════════════════════════════════════════════
  if (isLookout) {
    return (
      <div
        className={`relative inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${88 * scale}px`, height: `${82 * scale}px` }}
      >
        <svg viewBox="0 0 88 82" className="w-full h-full" fill="none">
          {/* Ground Occlusion */}
          <ellipse cx="44" cy="78" rx="36" ry="3.5" fill="#0C1B0D" opacity="0.3" />

          {/* Heavy Cross-Braced Timber Pilings */}
          <line x1="24" y1="46" x2="20" y2="78" stroke="#3D2716" strokeWidth="3" strokeLinecap="round" />
          <line x1="38" y1="46" x2="36" y2="78" stroke="#3D2716" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="46" x2="52" y2="78" stroke="#3D2716" strokeWidth="3" strokeLinecap="round" />
          <line x1="64" y1="46" x2="68" y2="78" stroke="#3D2716" strokeWidth="3" strokeLinecap="round" />

          {/* Diagonal Cross-Bracing */}
          <line x1="23" y1="52" x2="37" y2="72" stroke="#4E3320" strokeWidth="1.6" />
          <line x1="37" y1="52" x2="21" y2="72" stroke="#4E3320" strokeWidth="1.6" />
          <line x1="51" y1="52" x2="67" y2="72" stroke="#4E3320" strokeWidth="1.6" />
          <line x1="67" y1="52" x2="51" y2="72" stroke="#4E3320" strokeWidth="1.6" />

          {/* Catwalk Observation Platform Deck */}
          <rect x="14" y="44" width="60" height="4.5" rx="1.2" fill="#583A24" stroke="#2B180C" strokeWidth="1.2" />
          {/* Deck Railing */}
          <line x1="15" y1="38" x2="73" y2="38" stroke="#422918" strokeWidth="1.2" />
          <line x1="17" y1="38" x2="17" y2="44" stroke="#422918" strokeWidth="1" />
          <line x1="71" y1="38" x2="71" y2="44" stroke="#422918" strokeWidth="1" />

          {/* Lookout Cabin Box */}
          <rect x="22" y="18" width="44" height="26" rx="2" fill="#4B311E" stroke="#26150B" strokeWidth="1.3" />
          {/* Overhanging Pyramid Lookout Roof */}
          <polygon points="44,3 12,20 76,20" fill="#3D2413" stroke="#221208" strokeWidth="1.5" />
          <line x1="10" y1="21" x2="78" y2="21" stroke="#221208" strokeWidth="2" strokeLinecap="round" />

          {/* 360 Panoramic Windows */}
          <rect x="28" y="24" width="12" height="11" rx="1" fill="#FEF08A" stroke="#221208" strokeWidth="1" />
          <line x1="34" y1="24" x2="34" y2="35" stroke="#221208" strokeWidth="0.8" />
          <line x1="28" y1="29.5" x2="40" y2="29.5" stroke="#221208" strokeWidth="0.8" />

          <rect x="48" y="24" width="12" height="11" rx="1" fill="#FEF08A" stroke="#221208" strokeWidth="1" />
          <line x1="54" y1="24" x2="54" y2="35" stroke="#221208" strokeWidth="0.8" />
          <line x1="48" y1="29.5" x2="60" y2="29.5" stroke="#221208" strokeWidth="0.8" />

          {/* Access Ladder on Side */}
          <line x1="72" y1="46" x2="72" y2="76" stroke="#62422A" strokeWidth="1.2" />
          <line x1="76" y1="46" x2="76" y2="76" stroke="#62422A" strokeWidth="1.2" />
          <line x1="72" y1="52" x2="76" y2="52" stroke="#62422A" strokeWidth="1" />
          <line x1="72" y1="58" x2="76" y2="58" stroke="#62422A" strokeWidth="1" />
          <line x1="72" y1="64" x2="76" y2="64" stroke="#62422A" strokeWidth="1" />
          <line x1="72" y1="70" x2="76" y2="70" stroke="#62422A" strokeWidth="1" />
        </svg>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DEFAULT / STANDARD / STONE CHALET / SUMMIT OBSERVATORY
  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div
      className={`relative inline-block pointer-events-none select-none ${className}`}
      style={{
        width: `${86 * scale}px`,
        height: `${74 * scale}px`,
      }}
    >
      <svg viewBox="0 0 96 82" className="w-full h-full" fill="none">
        <defs>
          <linearGradient id="matureRoofGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#785338" />
            <stop offset="35%" stopColor="#62422C" />
            <stop offset="70%" stopColor="#4F3320" />
            <stop offset="100%" stopColor="#3C2415" />
          </linearGradient>
          <linearGradient id="sunlitRoofSlope" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8A6143" />
            <stop offset="100%" stopColor="#67452E" />
          </linearGradient>
          <linearGradient id="matureWoodWall" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isStone ? "#677564" : "#5E402B"} />
            <stop offset="45%" stopColor={isStone ? "#546252" : "#4E3320"} />
            <stop offset="100%" stopColor={isStone ? "#3E4B3C" : "#3B2516"} />
          </linearGradient>
          <linearGradient id="matureWindowGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFBEB" />
            <stop offset="45%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>
          <radialGradient id="softSmokeGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#E2E8F0" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#CBD5E1" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Ground Occlusion Shadow */}
        <ellipse cx="48" cy="77" rx="42" ry="4.5" fill="#142213" opacity="0.32" />
        <ellipse cx="48" cy="76" rx="34" ry="2.8" fill="#0A140A" opacity="0.40" />

        {/* Heavy Alpine Fieldstone Masonry Foundation */}
        <path d="M 14 66 L 82 66 L 80 75 L 16 75 Z" fill="#4D5849" stroke="#363F33" strokeWidth="1.2" />
        <ellipse cx="22" cy="71" rx="5" ry="2.2" fill="#657361" stroke="#3D473A" strokeWidth="0.6" />
        <ellipse cx="34" cy="70.5" rx="6" ry="2.4" fill="#586554" stroke="#3D473A" strokeWidth="0.6" />
        <ellipse cx="48" cy="71" rx="6.5" ry="2.2" fill="#657361" stroke="#3D473A" strokeWidth="0.6" />
        <ellipse cx="62" cy="70.5" rx="5.5" ry="2.3" fill="#586554" stroke="#3D473A" strokeWidth="0.6" />
        <ellipse cx="74" cy="71" rx="4.5" ry="2.0" fill="#657361" stroke="#3D473A" strokeWidth="0.6" />

        {/* Stone Threshold Step */}
        <rect x="44" y="72.5" width="20" height="3" rx="1" fill="#758471" stroke="#414C3E" strokeWidth="0.8" />

        {/* Chimney */}
        <g>
          <rect x="66" y="16" width="10" height="24" rx="1.5" fill="#566252" stroke="#384235" strokeWidth="1" />
          <line x1="66" y1="23" x2="76" y2="23" stroke="#384235" strokeWidth="0.8" />
          <line x1="66" y1="30" x2="76" y2="30" stroke="#384235" strokeWidth="0.8" />
          <rect x="64" y="14" width="14" height="3" rx="1" fill="#758471" stroke="#384235" strokeWidth="0.8" />
          {hasSmoke && (
            <g>
              <circle cx="71" cy="9" r="4.5" fill="url(#softSmokeGrad)" />
              <circle cx="75" cy="2" r="6" fill="url(#softSmokeGrad)" />
              <circle cx="80" cy="-6" r="7.5" fill="url(#softSmokeGrad)" />
            </g>
          )}
        </g>

        {/* Walls */}
        <rect x="19" y="37" width="58" height="30" rx="2" fill="url(#matureWoodWall)" stroke="#2E1B0F" strokeWidth="1.4" />

        {!isStone && (
          <g>
            <rect x="16" y="39" width="4.5" height="5.5" rx="1.2" fill="#4B311F" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="16" y="46" width="4.5" height="5.5" rx="1.2" fill="#4B311F" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="16" y="53" width="4.5" height="5.5" rx="1.2" fill="#4B311F" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="16" y="60" width="4.5" height="5.5" rx="1.2" fill="#4B311F" stroke="#2E1B0F" strokeWidth="0.8" />

            <rect x="75.5" y="39" width="4.5" height="5.5" rx="1.2" fill="#3B2516" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="75.5" y="46" width="4.5" height="5.5" rx="1.2" fill="#3B2516" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="75.5" y="53" width="4.5" height="5.5" rx="1.2" fill="#3B2516" stroke="#2E1B0F" strokeWidth="0.8" />
            <rect x="75.5" y="60" width="4.5" height="5.5" rx="1.2" fill="#3B2516" stroke="#2E1B0F" strokeWidth="0.8" />
            <line x1="19" y1="45" x2="77" y2="45" stroke="#3A2416" strokeWidth="1.2" />
            <line x1="19" y1="52" x2="77" y2="52" stroke="#3A2416" strokeWidth="1.2" />
            <line x1="19" y1="59" x2="77" y2="59" stroke="#3A2416" strokeWidth="1.2" />
          </g>
        )}

        {/* Alpine Gable Roof */}
        <polygon points="48,16 6,42 90,42" fill="url(#matureRoofGrad)" stroke="#321D10" strokeWidth="1.6" strokeLinejoin="round" />
        <polygon points="48,16 6,42 48,42" fill="url(#sunlitRoofSlope)" opacity="0.45" />
        <line x1="8" y1="43" x2="88" y2="43" stroke="#2B180C" strokeWidth="2.0" strokeLinecap="round" />
        <polygon points="19,37 77,37 77,41 19,41" fill="#000000" opacity="0.25" />

        {/* Window */}
        <g>
          <rect
            x="26"
            y="47"
            width="17"
            height="14"
            rx="1.5"
            fill={isGlow ? "url(#matureWindowGlow)" : "#FDE68A"}
            stroke="#352012"
            strokeWidth="1.4"
          />
          <ellipse cx="34.5" cy="54" rx="6.5" ry="5" fill="#FEF3C7" opacity="0.5" />
          <line x1="34.5" y1="47" x2="34.5" y2="61" stroke="#352012" strokeWidth="1.1" />
          <line x1="26" y1="54" x2="43" y2="54" stroke="#352012" strokeWidth="1.1" />
          <rect x="24.5" y="60.5" width="20" height="3" rx="0.8" fill="#4B311E" stroke="#2B180C" strokeWidth="0.8" />
          <circle cx="28" cy="60.5" r="1.1" fill="#F43F5E" />
          <circle cx="32" cy="60" r="1.1" fill="#38BDF8" />
          <circle cx="36" cy="60.5" r="1.1" fill="#F43F5E" />
          <circle cx="40" cy="60" r="1.1" fill="#FEF08A" />
        </g>

        {/* Door */}
        <g>
          <rect x="52" y="47" width="16" height="21" rx="1.5" fill="#3B2415" stroke="#24140A" strokeWidth="1.2" />
          <line x1="57" y1="48" x2="57" y2="67" stroke="#24140A" strokeWidth="0.8" />
          <line x1="62" y1="48" x2="62" y2="67" stroke="#24140A" strokeWidth="0.8" />
          <rect x="52" y="51" width="5" height="1.4" rx="0.4" fill="#1C1917" />
          <rect x="52" y="61" width="5" height="1.4" rx="0.4" fill="#1C1917" />
          <circle cx="65" cy="57" r="1.1" fill="#F59E0B" stroke="#78350F" strokeWidth="0.4" />
        </g>

        {/* Summit Cupola Dome */}
        {isSummit && (
          <g transform="translate(48, 14)">
            <rect x="-8" y="-4" width="16" height="4" rx="1" fill="#586554" stroke="#363F33" strokeWidth="0.8" />
            <ellipse cx="0" cy="-7" rx="9" ry="6" fill="#2E7D6F" stroke="#1D5349" strokeWidth="1" />
            <ellipse cx="-1.5" cy="-8.5" rx="6" ry="3.5" fill="#48A999" opacity="0.6" />
            <line x1="0" y1="-12" x2="0" y2="-2" stroke="#133831" strokeWidth="1.6" />
            <line x1="0" y1="-13" x2="0" y2="-18" stroke="#D97706" strokeWidth="1.2" />
            <circle cx="0" cy="-18" r="1.2" fill="#F59E0B" />
          </g>
        )}

        {/* Summit Flag */}
        {hasFlag && (
          <g transform="translate(77, 28)">
            <line x1="0" y1="0" x2="0" y2="28" stroke="#3A2416" strokeWidth="1.5" strokeLinecap="round" />
            <polygon points="0,0 20,4.5 0,9" fill="#B91C1C" stroke="#7F1D1D" strokeWidth="0.8" />
            {flagText && (
              <text x="5" y="7" fontSize="5" fontWeight="bold" fill="#FFFFFF" letterSpacing="0.3">
                {flagText}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}

