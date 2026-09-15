interface AlpinePineTreeProps {
  variant?: "small" | "medium" | "tall" | "cluster" | "dense" | "grove" | "grand"
  className?: string
  scale?: number
}

export default function AlpinePineTree({
  variant = "medium",
  className = "",
  scale = 1,
}: AlpinePineTreeProps) {
  // 1. Lush 5-tree natural grove for major landmarks and foreground fullness
  if (variant === "grove") {
    return (
      <svg
        viewBox="0 0 160 120"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${160 * scale}px`, height: `${120 * scale}px` }}
        fill="none"
      >
        {/* Soft ground shadow */}
        <ellipse cx="80" cy="110" rx="72" ry="9" fill="#000000" opacity="0.09" />

        {/* Deep background pines (smaller, darker) */}
        <g transform="translate(10, 25) scale(0.6)">
          <rect x="24" y="74" width="8" height="22" rx="3" fill="#5C361E" />
          <path d="M 28 8 Q 12 28, 8 38 C 18 39, 28 37, 48 38 Q 44 28, 28 8 Z" fill="#295438" />
          <path d="M 28 28 Q 6 50, 2 62 C 14 63, 28 61, 52 62 Q 48 50, 28 28 Z" fill="#1E442B" />
          <path d="M 28 48 Q 2 72, -2 86 C 12 87, 30 85, 56 86 Q 52 72, 28 48 Z" fill="#14331F" />
        </g>
        <g transform="translate(105, 20) scale(0.65)">
          <rect x="24" y="74" width="8" height="22" rx="3" fill="#5C361E" />
          <path d="M 28 8 Q 12 28, 8 38 C 18 39, 28 37, 48 38 Q 44 28, 28 8 Z" fill="#2E5C3D" />
          <path d="M 28 28 Q 6 50, 2 62 C 14 63, 28 61, 52 62 Q 48 50, 28 28 Z" fill="#224A30" />
          <path d="M 28 48 Q 2 72, -2 86 C 12 87, 30 85, 56 86 Q 52 72, 28 48 Z" fill="#163722" />
        </g>

        {/* Midground pines */}
        <g transform="translate(28, 12) scale(0.8)">
          <rect x="24" y="76" width="9" height="24" rx="3" fill="#6B3E22" />
          <path d="M 28 8 Q 10 32, 6 42 C 18 44, 30 42, 50 43 Q 46 32, 28 8 Z" fill="#3D704C" />
          <path d="M 28 30 Q 4 56, 0 68 C 14 70, 30 68, 56 69 Q 52 56, 28 30 Z" fill="#2A5537" />
          <path d="M 28 52 Q -2 80, -6 94 C 12 96, 32 93, 62 94 Q 58 80, 28 52 Z" fill="#1D4028" />
        </g>
        <g transform="translate(85, 10) scale(0.82)">
          <rect x="24" y="76" width="9" height="24" rx="3" fill="#6B3E22" />
          <path d="M 28 8 Q 10 32, 6 42 C 18 44, 30 42, 50 43 Q 46 32, 28 8 Z" fill="#467D56" />
          <path d="M 28 30 Q 4 56, 0 68 C 14 70, 30 68, 56 69 Q 52 56, 28 30 Z" fill="#305D3D" />
          <path d="M 28 52 Q -2 80, -6 94 C 12 96, 32 93, 62 94 Q 58 80, 28 52 Z" fill="#20452C" />
        </g>

        {/* Center Stately Dominant Pine */}
        <g transform="translate(52, 0) scale(1.05)">
          <rect x="25" y="80" width="10" height="25" rx="3.5" fill="#7A4626" />
          <path d="M 30 6 Q 14 30, 10 40 C 20 42, 32 40, 50 41 Q 46 30, 30 6 Z" fill="#589267" />
          <path d="M 30 28 Q 8 54, 4 66 C 18 68, 34 66, 56 67 Q 52 54, 30 28 Z" fill="#3E724D" />
          <path d="M 30 50 Q 2 80, -2 94 C 14 96, 36 93, 62 94 Q 58 80, 30 50 Z" fill="#295638" />
          <path d="M 30 72 Q -4 104, -8 116 C 12 118, 38 115, 68 116 Q 64 104, 30 72 Z" fill="#1A4027" />
          {/* Subtle sunlit foliage highlight */}
          <path d="M 30 6 Q 22 30, 20 40 C 26 41, 30 40, 30 40 Z" fill="#78B388" opacity="0.45" />
          <path d="M 30 28 Q 18 54, 16 66 C 24 67, 30 66, 30 66 Z" fill="#589267" opacity="0.4" />
          <path d="M 30 50 Q 14 80, 10 94 C 20 95, 30 93, 30 93 Z" fill="#3E724D" opacity="0.35" />
        </g>
      </svg>
    )
  }

  // 2. Dense 3-tree cluster
  if (variant === "dense" || variant === "cluster") {
    return (
      <svg
        viewBox="0 0 110 110"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${110 * scale}px`, height: `${110 * scale}px` }}
        fill="none"
      >
        <ellipse cx="55" cy="98" rx="46" ry="7" fill="#000000" opacity="0.08" />

        {/* Back Left Tree */}
        <g transform="translate(6, 20) scale(0.65)">
          <rect x="22" y="70" width="8" height="20" rx="3" fill="#6E4125" />
          <path d="M 26 12 Q 10 32, 6 42 C 16 43, 26 41, 46 42 Q 42 32, 26 12 Z" fill="#417350" />
          <path d="M 26 32 Q 6 54, 2 66 C 14 67, 28 65, 50 66 Q 46 54, 26 32 Z" fill="#2E593B" />
          <path d="M 26 52 Q 2 76, -2 90 C 12 91, 30 89, 54 90 Q 50 76, 26 52 Z" fill="#1C4229" />
        </g>

        {/* Back Right Tree */}
        <g transform="translate(56, 15) scale(0.72)">
          <rect x="22" y="70" width="8" height="20" rx="3" fill="#6E4125" />
          <path d="M 26 12 Q 10 32, 6 42 C 16 43, 26 41, 46 42 Q 42 32, 26 12 Z" fill="#4B7E58" />
          <path d="M 26 32 Q 6 54, 2 66 C 14 67, 28 65, 50 66 Q 46 54, 26 32 Z" fill="#366444" />
          <path d="M 26 52 Q 2 76, -2 90 C 12 91, 30 89, 54 90 Q 50 76, 26 52 Z" fill="#224A32" />
        </g>

        {/* Front Center Dominant Tree */}
        <g transform="translate(24, 0) scale(0.95)">
          <rect x="26" y="80" width="10" height="22" rx="3.5" fill="#7C4729" />
          <path d="M 31 10 Q 14 36, 10 46 C 20 48, 32 46, 52 46 Q 48 36, 31 10 Z" fill="#589267" />
          <path d="M 31 34 Q 8 62, 4 74 C 18 76, 34 74, 58 74 Q 54 62, 31 34 Z" fill="#3E724D" />
          <path d="M 31 58 Q 2 90, -2 102 C 16 104, 36 101, 64 102 Q 60 90, 31 58 Z" fill="#285437" />
          <path d="M 31 10 Q 22 36, 20 46 C 26 47, 31 46, 31 46 Z" fill="#78B388" opacity="0.4" />
          <path d="M 31 34 Q 18 62, 16 74 C 24 75, 31 74, 31 74 Z" fill="#589267" opacity="0.35" />
          <path d="M 31 58 Q 14 90, 10 102 C 20 103, 31 101, 31 101 Z" fill="#3E724D" opacity="0.3" />
        </g>
      </svg>
    )
  }

  // 3. Stately Grand Conifer (single large foreground tree with 4 tiers)
  if (variant === "grand") {
    return (
      <svg
        viewBox="0 0 74 116"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${74 * scale}px`, height: `${116 * scale}px` }}
        fill="none"
      >
        <ellipse cx="37" cy="110" rx="28" ry="4.5" fill="#000000" opacity="0.10" />
        <rect x="32" y="86" width="10" height="26" rx="3.5" fill="#724124" />
        <path d="M 37 6 Q 18 28, 14 38 C 24 40, 38 38, 60 39 Q 54 28, 37 6 Z" fill="#5B976B" />
        <path d="M 37 26 Q 12 52, 6 64 C 20 66, 40 64, 68 65 Q 62 52, 37 26 Z" fill="#427752" />
        <path d="M 37 48 Q 6 78, 0 92 C 16 94, 44 91, 74 92 Q 68 78, 37 48 Z" fill="#2C5B3B" />
        <path d="M 37 70 Q 0 104, -4 114 C 14 116, 46 113, 78 114 Q 72 104, 37 70 Z" fill="#1C4329" />
        {/* Highlight edges */}
        <path d="M 37 6 Q 26 28, 24 38 C 30 39, 37 38, 37 38 Z" fill="#80BC90" opacity="0.4" />
        <path d="M 37 26 Q 22 52, 18 64 C 26 65, 37 64, 37 64 Z" fill="#5B976B" opacity="0.35" />
      </svg>
    )
  }

  // 4. Single conifer variants
  const heights = {
    small: { w: 38, h: 56, scale: 0.7 },
    medium: { w: 50, h: 76, scale: 0.9 },
    tall: { w: 58, h: 94, scale: 1.1 },
  }

  const cfg = heights[variant] || heights.medium

  return (
    <svg
      viewBox="0 0 60 96"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${cfg.w * scale}px`, height: `${cfg.h * scale}px` }}
      fill="none"
    >
      <ellipse cx="30" cy="92" rx="20" ry="3.5" fill="#000000" opacity="0.08" />
      <rect x="26" y="68" width="8" height="24" rx="3" fill="#7C4729" />
      <path d="M 30 6 Q 14 28, 10 38 C 20 40, 32 38, 50 38 Q 46 28, 30 6 Z" fill="#558E64" />
      <path d="M 30 28 Q 8 54, 4 66 C 18 68, 34 66, 56 66 Q 52 54, 30 28 Z" fill="#3D704C" />
      <path d="M 30 52 Q 2 80, -2 92 C 14 94, 34 91, 62 92 Q 58 80, 30 52 Z" fill="#275336" />
    </svg>
  )
}
