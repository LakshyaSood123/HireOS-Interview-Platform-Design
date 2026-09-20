import React from "react"

interface LessonCampBackdropProps {
  moduleTitle?: string
  className?: string
}

/**
 * Illustrated campsite environment for the Reagvis Trails Lesson Workspace.
 * 
 * Evokes the feeling of studying at an alpine trail camp:
 * - Twilight pine silhouettes & distant mountain ridge
 * - Cozy expedition canvas tent with guy ropes & wooden pegs
 * - Glowing campfire with embers, stones & warm firelight
 * - Wooden trail signpost & hanging camp lantern
 * - River stones, logs, and mossy ground details
 * 
 * Styled strictly as a background layer (z-0, pointer-events-none, high contrast),
 * ensuring the functional dark learning panels remain 100% legible and dominant.
 */
export default function LessonCampBackdrop({ moduleTitle, className = "" }: LessonCampBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-0 ${className}`}
      style={{
        background: "radial-gradient(circle at 50% 0%, #08261A 0%, #051810 40%, #030D08 100%)",
      }}
    >
      {/* ── AMBIENT WARM FIRELIGHT GLOW IN CORNERS ── */}
      {/* Campfire glow (bottom right) */}
      <div
        className="absolute -bottom-24 -right-24 w-[600px] h-[600px] rounded-full opacity-35"
        style={{
          background: "radial-gradient(circle, rgba(234, 110, 41, 0.35) 0%, rgba(217, 119, 6, 0.15) 45%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Tent ambient warmth (bottom left) */}
      <div
        className="absolute -bottom-20 -left-20 w-[500px] h-[500px] rounded-full opacity-25"
        style={{
          background: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(180, 83, 9, 0.1) 45%, transparent 70%)",
          filter: "blur(35px)",
        }}
      />

      {/* Forest canopy crown glow (top center) */}
      <div
        className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] rounded-full opacity-20"
        style={{
          background: "radial-gradient(ellipse, rgba(29, 181, 132, 0.25) 0%, rgba(16, 185, 129, 0.08) 50%, transparent 75%)",
          filter: "blur(50px)",
        }}
      />

      {/* ── DISTANT MOUNTAIN RIDGE SILHOUETTES (TOP) ── */}
      <svg
        className="absolute top-0 inset-x-0 w-full h-36 opacity-20 text-[#0E3524]"
        preserveAspectRatio="none"
        viewBox="0 0 1440 144"
        fill="currentColor"
      >
        <path d="M0,80 L180,24 L340,90 L520,18 L710,75 L920,20 L1100,82 L1280,30 L1440,70 L1440,0 L0,0 Z" />
        <path
          d="M0,95 L220,40 L410,105 L600,32 L810,90 L1020,38 L1200,95 L1440,45 L1440,0 L0,0 Z"
          className="text-[#092218] opacity-60"
        />
      </svg>

      {/* ── FORESTRY SILHOUETTES: LEFT MARGIN (Pines & Tent) ── */}
      <div className="absolute left-0 bottom-0 w-72 sm:w-88 h-96 opacity-45 pointer-events-none hidden md:block">
        <svg viewBox="0 0 320 360" className="w-full h-full" fill="none">
          {/* Background pines */}
          <path d="M40,360 L40,160 L20,200 L40,170 L15,220 L40,190 L10,250 L40,220 L5,280 L40,250 L40,360 Z" fill="#0A2A1E" opacity="0.6" />
          <path d="M75,360 L75,120 L55,160 L75,135 L50,185 L75,160 L45,215 L75,190 L40,245 L75,220 L75,360 Z" fill="#0C3425" opacity="0.8" />
          <path d="M120,360 L120,180 L100,210 L120,190 L95,235 L120,210 L90,265 L120,240 L120,360 Z" fill="#082319" opacity="0.5" />

          {/* Expedition Canvas Tent */}
          <g transform="translate(45, 230)">
            {/* Ground shadow */}
            <ellipse cx="65" cy="115" rx="75" ry="12" fill="#020805" opacity="0.7" />
            
            {/* Tent body */}
            <polygon points="65,15 15,110 115,110" fill="#D97706" opacity="0.85" />
            <polygon points="65,15 115,110 135,95 85,15" fill="#B45309" opacity="0.9" />
            
            {/* Tent flap / entrance */}
            <polygon points="65,25 35,110 95,110" fill="#78350F" opacity="0.95" />
            <polygon points="65,25 45,110 85,110" fill="#451A03" />
            
            {/* Interior lantern warm light */}
            <circle cx="65" cy="75" r="14" fill="#FDE68A" opacity="0.85" />
            <ellipse cx="65" cy="80" rx="20" ry="10" fill="#F59E0B" opacity="0.5" />
            
            {/* Guy ropes and pegs */}
            <line x1="65" y1="15" x2="0" y2="115" stroke="#FDE68A" strokeWidth="1.2" opacity="0.4" strokeDasharray="2 2" />
            <line x1="85" y1="15" x2="150" y2="105" stroke="#FDE68A" strokeWidth="1.2" opacity="0.4" strokeDasharray="2 2" />
            <circle cx="0" cy="115" r="2.5" fill="#78350F" />
            <circle cx="150" cy="105" r="2.5" fill="#78350F" />

            {/* Backpack & Bedroll leaning on tent */}
            <rect x="110" y="85" width="22" height="26" rx="6" fill="#1E3A2F" stroke="#2D5845" strokeWidth="1" />
            <ellipse cx="121" cy="84" rx="10" ry="4" fill="#E27D4C" />
            <rect x="114" y="93" width="14" height="12" rx="3" fill="#142B22" />
          </g>
        </svg>
      </div>

      {/* ── FORESTRY SILHOUETTES: RIGHT MARGIN (Campfire, Lantern & Signpost) ── */}
      <div className="absolute right-0 bottom-0 w-72 sm:w-92 h-96 opacity-45 pointer-events-none hidden md:block">
        <svg viewBox="0 0 340 360" className="w-full h-full" fill="none">
          {/* Background pines */}
          <path d="M260,360 L260,110 L280,150 L260,125 L285,175 L260,150 L290,205 L260,180 L295,235 L260,210 L260,360 Z" fill="#0C3425" opacity="0.8" />
          <path d="M220,360 L220,150 L240,190 L220,165 L245,215 L220,190 L250,245 L220,220 L220,360 Z" fill="#0A2A1E" opacity="0.6" />
          <path d="M300,360 L300,170 L315,200 L300,185 L320,225 L300,205 L300,360 Z" fill="#082319" opacity="0.5" />

          {/* Wooden Trail Signpost */}
          <g transform="translate(230, 200)">
            {/* Post */}
            <rect x="28" y="20" width="8" height="120" rx="2" fill="#3E2723" stroke="#271612" strokeWidth="1" />
            {/* Sign board 1 */}
            <path d="M-15,35 L65,35 L75,45 L65,55 L-15,55 Z" fill="#4E342E" stroke="#3E2723" strokeWidth="1" />
            <text x="5" y="47" fill="#D7CCC8" fontSize="6.5" fontWeight="bold" fontFamily="monospace">
              CAMP STATION
            </text>
            {/* Sign board 2 */}
            <path d="M70,62 L-10,62 L-20,72 L-10,82 L70,82 Z" fill="#3E2723" stroke="#271612" strokeWidth="1" />
            <text x="-5" y="74" fill="#BCAAA4" fontSize="6" fontWeight="bold" fontFamily="monospace">
              TRAILS ➔
            </text>
          </g>

          {/* Glowing Campfire */}
          <g transform="translate(85, 250)">
            {/* Campfire ground shadow & fire bed */}
            <ellipse cx="60" cy="95" rx="55" ry="12" fill="#020805" opacity="0.8" />

            {/* Fire ring stones */}
            <ellipse cx="30" cy="94" rx="7" ry="5" fill="#374151" />
            <ellipse cx="45" cy="97" rx="9" ry="6" fill="#4B5563" />
            <ellipse cx="65" cy="99" rx="10" ry="6" fill="#374151" />
            <ellipse cx="85" cy="97" rx="9" ry="5" fill="#4B5563" />
            <ellipse cx="98" cy="93" rx="7" ry="4" fill="#374151" />
            <ellipse cx="80" cy="90" rx="8" ry="4" fill="#1F2937" />
            <ellipse cx="40" cy="90" rx="8" ry="4" fill="#1F2937" />

            {/* Crossed logs */}
            <line x1="35" y1="92" x2="88" y2="82" stroke="#5D4037" strokeWidth="7" strokeLinecap="round" />
            <line x1="88" y1="92" x2="35" y2="82" stroke="#4E342E" strokeWidth="7" strokeLinecap="round" />
            <line x1="45" y1="95" x2="78" y2="78" stroke="#3E2723" strokeWidth="6" strokeLinecap="round" />

            {/* Fire Flames with warm layering */}
            {/* Outer red/orange flame */}
            <path
              d="M60,35 Q75,60 78,82 Q65,88 50,88 Q45,75 48,60 Q55,50 60,35 Z"
              fill="#EA580C"
              opacity="0.9"
            />
            {/* Middle amber flame */}
            <path
              d="M62,45 Q72,65 72,84 Q62,88 53,88 Q50,75 54,62 Q58,55 62,45 Z"
              fill="#F59E0B"
              opacity="0.95"
            />
            {/* Core bright yellow flame */}
            <path
              d="M61,58 Q68,70 67,85 Q61,87 56,87 Q54,78 57,68 Q60,63 61,58 Z"
              fill="#FEF08A"
            />

            {/* Floating embers */}
            <circle cx="68" cy="30" r="1.5" fill="#FDE047" opacity="0.8" />
            <circle cx="52" cy="22" r="1.2" fill="#F97316" opacity="0.7" />
            <circle cx="63" cy="12" r="1" fill="#FEF08A" opacity="0.9" />
            <circle cx="75" cy="18" r="1.3" fill="#F59E0B" opacity="0.75" />
          </g>
        </svg>
      </div>

      {/* ── SUBTLE BOTTOM MOSS & GRASS DETAILS ── */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#020906] to-transparent opacity-80" />
    </div>
  )
}
