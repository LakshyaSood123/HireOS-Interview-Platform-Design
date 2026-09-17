interface PineTreeProps {
  x?: number
  y?: number
  scale?: number
  variant?: "ancient" | "hero" | "tall" | "medium" | "small" | "cluster" | "distant"
  className?: string
  opacity?: number
}

export function PineTreeV2({
  x = 0,
  y = 0,
  scale = 1,
  variant = "medium",
  className = "",
  opacity = 1,
}: PineTreeProps) {
  if (variant === "ancient" || variant === "hero") {
    return (
      <g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        className={className}
        opacity={opacity}
      >
        {/* Ambient Ground Occlusion Shadow */}
        <ellipse cx="50" cy="122" rx="46" ry="8" fill="#0A160D" opacity="0.4" />
        <ellipse cx="50" cy="121" rx="30" ry="5" fill="#0A160D" opacity="0.5" />

        {/* Gnarled Weathered Pine Trunk with Root Flairs */}
        <path d="M 45 42 L 42 120 L 58 120 L 55 42 Z" fill="#2B180E" />
        <path d="M 42 104 C 36 112, 26 118, 18 120 L 44 120 Z" fill="#1C0E07" />
        <path d="M 56 106 C 62 114, 72 118, 82 120 L 56 120 Z" fill="#382214" />
        {/* Deadwood Crown Spike */}
        <path d="M 50 6 L 47 38 L 53 38 Z" fill="#3D291B" />
        <path d="M 50 6 C 56 13, 62 18, 70 21 L 66 23 C 60 20, 54 16, 50 11 Z" fill="#523927" />

        {/* Tier 5: Giant Bottom Heavy Boughs */}
        <path
          d="M 48 70 L 37 75 L 28 74 L 19 80 L 10 79 L 2 88 L 8 90 L 0 99 L 10 100 L 5 107 L 17 105 L 24 108 L 33 103 L 44 106 L 50 103 L 60 106 L 70 103 L 80 107 L 91 102 L 100 105 L 97 96 L 103 94 L 97 86 L 102 83 L 93 77 L 84 78 L 74 73 L 64 76 Z"
          fill="#0B2013"
        />
        <path
          d="M 48 73 L 38 77 L 30 76 L 22 82 L 14 81 L 6 89 L 12 91 L 5 99 L 14 100 L 9 105 L 19 104 L 26 106 L 35 102 L 44 104 L 50 102 L 59 104 L 68 102 L 77 105 L 86 101 L 94 103 L 91 95 L 97 93 L 91 86 L 95 83 L 87 78 L 78 79 L 70 75 Z"
          fill="#163520"
        />
        <path
          d="M 48 76 L 40 79 L 33 78 L 26 84 L 20 83 L 14 90 L 18 92 L 13 98 L 21 98 L 18 102 L 26 101 L 32 103 L 38 100 L 46 102 L 50 100 L 57 102 L 64 100 L 71 103 L 78 99 L 84 100 L 82 94 L 87 92 L 82 86 L 86 83 L 79 79 L 72 80 L 64 76 Z"
          fill="#254C2F"
        />
        {/* Sunlit Highlights */}
        <path
          d="M 48 79 L 41 82 L 36 81 L 31 86 L 27 85 L 23 90 L 27 92 L 23 96 L 29 96 L 34 99 L 40 97 L 46 99 L 50 97 L 56 99 L 62 97 L 68 100 L 73 97 L 77 98 L 75 93 L 79 91 L 75 86 L 71 84 L 63 82 L 55 83 Z"
          fill="#3C7149"
          opacity="0.88"
        />

        {/* Tier 4: Mid-Lower Boughs */}
        <path
          d="M 49 52 L 39 57 L 31 56 L 22 63 L 14 62 L 5 72 L 12 74 L 5 82 L 16 83 L 11 90 L 23 88 L 31 91 L 41 87 L 50 89 L 59 87 L 68 90 L 78 86 L 88 89 L 86 81 L 93 80 L 87 71 L 91 69 L 82 62 L 73 64 L 62 58 Z"
          fill="#0F2817"
        />
        <path
          d="M 49 55 L 41 59 L 34 58 L 26 64 L 19 63 L 11 72 L 17 74 L 11 81 L 20 82 L 16 88 L 26 87 L 34 89 L 43 86 L 51 87 L 59 86 L 67 88 L 75 85 L 83 87 L 81 80 L 87 79 L 82 71 L 85 69 L 78 63 L 70 65 L 60 60 Z"
          fill="#1C4026"
        />
        <path
          d="M 49 58 L 43 61 L 37 60 L 30 66 L 24 65 L 18 72 L 23 74 L 18 79 L 26 80 L 22 85 L 30 84 L 37 86 L 45 84 L 52 85 L 59 84 L 65 86 L 72 83 L 78 85 L 76 79 L 81 78 L 77 71 L 73 67 L 65 64 Z"
          fill="#2D5B37"
        />
        <path
          d="M 49 60 L 44 63 L 39 62 L 34 67 L 29 66 L 25 72 L 29 73 L 26 77 L 32 78 L 37 80 L 44 79 L 50 80 L 56 79 L 62 81 L 67 78 L 72 80 L 70 75 L 65 72 L 58 69 Z"
          fill="#448053"
          opacity="0.88"
        />

        {/* Tier 3: Mid Boughs */}
        <path
          d="M 50 36 L 42 41 L 35 40 L 28 46 L 21 45 L 14 53 L 20 55 L 14 62 L 23 63 L 19 68 L 28 67 L 36 70 L 44 67 L 51 69 L 59 67 L 67 70 L 75 66 L 82 68 L 81 61 L 86 60 L 81 53 L 84 51 L 77 45 L 69 47 L 59 42 Z"
          fill="#14311D"
        />
        <path
          d="M 50 39 L 44 43 L 38 42 L 32 47 L 26 46 L 20 53 L 24 55 L 20 60 L 27 61 L 24 65 L 32 64 L 39 66 L 46 64 L 52 65 L 59 64 L 65 66 L 71 63 L 77 65 L 75 59 L 80 58 L 76 52 L 72 49 L 65 46 Z"
          fill="#244F2F"
        />
        <path
          d="M 50 42 L 45 45 L 40 44 L 35 49 L 30 48 L 25 54 L 29 55 L 26 59 L 32 60 L 37 62 L 43 61 L 49 62 L 55 61 L 61 63 L 66 60 L 71 62 L 69 57 L 65 54 L 59 51 Z"
          fill="#376E44"
        />
        <path
          d="M 50 44 L 46 47 L 42 46 L 38 50 L 34 49 L 30 54 L 34 55 L 32 58 L 37 59 L 42 60 L 47 59 L 52 60 L 57 59 L 62 61 L 65 58 L 63 55 L 58 53 Z"
          fill="#4D925E"
          opacity="0.85"
        />

        {/* Tier 2: Upper Crown Boughs */}
        <path
          d="M 50 20 L 43 25 L 37 24 L 31 30 L 25 29 L 20 36 L 25 38 L 21 44 L 28 45 L 25 49 L 33 48 L 40 51 L 47 48 L 53 50 L 60 48 L 66 51 L 73 47 L 78 49 L 77 43 L 81 42 L 77 36 L 79 34 L 73 29 L 66 31 L 57 26 Z"
          fill="#1C4026"
        />
        <path
          d="M 50 23 L 45 27 L 40 26 L 35 31 L 30 30 L 25 36 L 29 38 L 26 42 L 32 43 L 30 46 L 37 45 L 43 47 L 49 45 L 54 46 L 60 45 L 65 47 L 70 44 L 74 46 L 72 41 L 76 40 L 72 35 L 69 32 L 63 30 Z"
          fill="#2E5E39"
        />
        <path
          d="M 50 26 L 46 29 L 42 28 L 38 32 L 34 31 L 30 36 L 34 37 L 32 41 L 37 42 L 41 43 L 47 42 L 52 43 L 57 42 L 62 44 L 66 41 L 69 43 L 67 39 L 64 36 L 59 34 Z"
          fill="#458354"
        />
        <path
          d="M 50 28 L 47 30 L 44 29 L 41 33 L 38 32 L 35 36 L 38 37 L 36 40 L 41 41 L 45 41 L 50 41 L 54 41 L 58 42 L 61 40 L 60 37 L 57 35 Z"
          fill="#5CA86E"
          opacity="0.82"
        />
      </g>
    )
  }

  if (variant === "tall") {
    return (
      <g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        className={className}
        opacity={opacity}
      >
        <ellipse cx="20" cy="80" rx="18" ry="3.5" fill="#0A160D" opacity="0.32" />
        <path d="M 18 30 L 17 80 L 23 80 L 22 30 Z" fill="#2B190E" />
        {/* Needle tiers */}
        <polygon points="20,4 6,32 34,32" fill="#14311D" />
        <polygon points="20,4 6,32 20,32" fill="#1F472B" />
        <polygon points="20,18 4,48 36,48" fill="#112818" />
        <polygon points="20,18 4,48 20,48" fill="#1B3F26" />
        <polygon points="20,32 2,64 38,64" fill="#0E2114" />
        <polygon points="20,32 2,64 20,64" fill="#173620" />
        <polygon points="20,46 0,76 40,76" fill="#0B1A10" />
        <polygon points="20,46 0,76 20,76" fill="#132B1A" />
      </g>
    )
  }

  if (variant === "distant") {
    return (
      <g
        transform={`translate(${x}, ${y}) scale(${scale})`}
        className={className}
        opacity={opacity * 0.65}
      >
        <polygon points="12,0 2,36 22,36" fill="#65886F" />
        <polygon points="12,12 0,48 24,48" fill="#587A62" />
        <polygon points="12,24 -2,60 26,60" fill="#4B6C55" />
      </g>
    )
  }

  // Standard Medium / Small Alpine Spruce
  return (
    <g
      transform={`translate(${x}, ${y}) scale(${scale})`}
      className={className}
      opacity={opacity}
    >
      <ellipse cx="20" cy="62" rx="15" ry="3.2" fill="#0A160D" opacity="0.3" />
      <path d="M 18 24 L 17 62 L 23 62 L 22 24 Z" fill="#2E1B10" />
      <polygon points="20,6 8,26 32,26" fill="#183B23" />
      <polygon points="20,6 8,26 20,26" fill="#245432" />
      <polygon points="20,16 5,38 35,38" fill="#14311D" />
      <polygon points="20,16 5,38 20,38" fill="#1C4528" />
      <polygon points="20,26 2,52 38,52" fill="#0E2315" />
      <polygon points="20,26 2,52 20,52" fill="#163820" />
      <polygon points="20,38 0,60 40,60" fill="#0A1B10" />
      <polygon points="20,38 0,60 20,60" fill="#122E1A" />
    </g>
  )
}

export function BoulderV2({
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
    <g transform={`translate(${x}, ${y}) scale(${scale})`} className={className}>
      <ellipse cx="14" cy="11" rx="14" ry="4.5" fill="#0F1A11" opacity="0.35" />
      <path
        d="M 2 10 C 2 4, 8 1, 14 1 C 20 1, 26 5, 26 10 C 26 12, 20 13, 14 13 C 8 13, 2 12, 2 10 Z"
        fill="#5E6F5C"
        stroke="#3A4638"
        strokeWidth="0.8"
      />
      {/* Sunlit facet highlight */}
      <path
        d="M 4 8 C 5 4, 10 2, 14 2 C 18 2, 21 4, 21 7 C 17 6, 11 6, 6 7 Z"
        fill="#879984"
        opacity="0.75"
      />
    </g>
  )
}

export function WildflowerClusterV2({
  x = 0,
  y = 0,
  scale = 1,
  color = "yellow",
}: {
  x?: number
  y?: number
  scale?: number
  color?: "yellow" | "blue" | "white" | "purple"
}) {
  const primaryColor =
    color === "yellow"
      ? "#FCD34D"
      : color === "blue"
        ? "#60A5FA"
        : color === "purple"
          ? "#C084FC"
          : "#FFFFFF"
  const secondaryColor = color === "yellow" ? "#FEF08A" : "#FFFFFF"

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <circle cx="2" cy="4" r="1.8" fill={primaryColor} />
      <circle cx="6" cy="6" r="1.5" fill={secondaryColor} />
      <circle cx="11" cy="3" r="1.8" fill={primaryColor} />
      <circle cx="15" cy="5" r="1.4" fill={secondaryColor} />
      <circle cx="8" cy="8" r="1.6" fill={primaryColor} />
    </g>
  )
}
