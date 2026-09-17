interface WorldV2SkyProps {
  variant?: "morning" | "highland" | "dusk"
  showClouds?: boolean
  className?: string
}

export default function WorldV2Sky({
  variant = "morning",
  showClouds = true,
  className = "",
}: WorldV2SkyProps) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className={`w-full h-full block pointer-events-none select-none absolute inset-0 ${className}`}
      fill="none"
    >
      <defs>
        {/* Soft Alpine Morning Sky with Aerial Perspective */}
        <linearGradient id="skyGradV2" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#C4E0E8" />
          <stop offset="30%" stopColor="#BBDED5" />
          <stop offset="65%" stopColor="#B0D8BE" />
          <stop offset="100%" stopColor="#A4CEB0" />
        </linearGradient>

        {/* Directional Morning Sun Glow from Top-Left */}
        <radialGradient id="sunGlowV2" cx="18%" cy="12%" r="70%">
          <stop offset="0%" stopColor="#FFFEE8" stopOpacity="0.65" />
          <stop offset="30%" stopColor="#E6F4EA" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#C8E2D2" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#B0D5BC" stopOpacity="0" />
        </radialGradient>

        {/* Soft Cloud Radial Gradients */}
        <radialGradient id="softCloudGradV2" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#F1F8F4" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#D9EBDC" stopOpacity="0" />
        </radialGradient>

        {/* Cloud Pass Swirling Mist Gradient */}
        <linearGradient id="passMistV2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.88" />
          <stop offset="45%" stopColor="#E8F4EC" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#D2E7DA" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 1. Base Sky Fill */}
      <rect width="1440" height="900" fill="url(#skyGradV2)" />

      {/* 2. Morning Sun Glow */}
      <rect width="1440" height="900" fill="url(#sunGlowV2)" />

      {/* 3. Soft Atmospheric Cirrus / Cumulus Clouds */}
      {showClouds && (
        <g opacity="0.75">
          {/* High Cirrus streaks */}
          <path
            d="M 120 75 C 260 65, 420 80, 580 70 C 640 66, 700 76, 760 72 C 670 85, 500 86, 320 88 C 210 89, 140 82, 120 75 Z"
            fill="url(#softCloudGradV2)"
            opacity="0.55"
          />
          <path
            d="M 680 110 C 820 98, 980 115, 1140 102 C 1220 96, 1310 106, 1390 98 C 1290 114, 1110 118, 930 119 C 810 120, 720 116, 680 110 Z"
            fill="url(#softCloudGradV2)"
            opacity="0.45"
          />

          {/* Drifting Cumulus Bank 1 (Left Upper) */}
          <g transform="translate(180, 110)" opacity="0.65">
            <ellipse cx="60" cy="22" rx="70" ry="24" fill="url(#softCloudGradV2)" />
            <ellipse cx="110" cy="16" rx="55" ry="20" fill="url(#softCloudGradV2)" />
            <ellipse cx="25" cy="24" rx="42" ry="18" fill="url(#softCloudGradV2)" />
          </g>

          {/* Drifting Cumulus Bank 2 (Over Center Peaks) */}
          <g transform="translate(740, 85)" opacity="0.6">
            <ellipse cx="80" cy="26" rx="90" ry="28" fill="url(#softCloudGradV2)" />
            <ellipse cx="150" cy="18" rx="65" ry="22" fill="url(#softCloudGradV2)" />
            <ellipse cx="30" cy="28" rx="50" ry="20" fill="url(#softCloudGradV2)" />
          </g>

          {/* Distant Sunlit Cloud Edge (Right Summit) */}
          <g transform="translate(1120, 70)" opacity="0.5">
            <ellipse cx="60" cy="18" rx="75" ry="22" fill="url(#softCloudGradV2)" />
            <ellipse cx="120" cy="14" rx="55" ry="18" fill="url(#softCloudGradV2)" />
          </g>
        </g>
      )}
    </svg>
  )
}
