interface AlpineCabinProps {
  className?: string
  scale?: number
  hasSmoke?: boolean
  hasFlag?: boolean
  flagText?: string
  isGlow?: boolean
}

export default function AlpineCabin({
  className = "",
  scale = 1,
  hasSmoke = true,
  hasFlag = false,
  flagText = "",
  isGlow = false,
}: AlpineCabinProps) {
  return (
    <div
      className={`relative inline-block pointer-events-none select-none ${className}`}
      style={{
        width: `${72 * scale}px`,
        height: `${64 * scale}px`,
      }}
    >
      <svg
        viewBox="0 0 80 72"
        className="w-full h-full"
        fill="none"
      >
        {/* Drop shadow underneath */}
        <ellipse cx="40" cy="68" rx="28" ry="4" fill="#000000" opacity="0.12" />

        {/* Chimney */}
        <rect x="52" y="14" width="8" height="18" rx="1.5" fill="#884C28" />

        {/* Chimney Smoke puffs */}
        {hasSmoke && (
          <g opacity="0.65">
            <circle cx="56" cy="10" r="4.5" fill="#FFFFFF" />
            <circle cx="59" cy="4" r="5.5" fill="#FFFFFF" opacity="0.5" />
            <circle cx="63" cy="-2" r="6.5" fill="#FFFFFF" opacity="0.35" />
          </g>
        )}

        {/* Cabin Timber Walls */}
        <rect x="16" y="32" width="48" height="34" rx="4" fill="#B3592E" stroke="#803B19" strokeWidth="1.5" />
        {/* Horizontal log lines */}
        <line x1="16" y1="41" x2="64" y2="41" stroke="#8E421E" strokeWidth="1" />
        <line x1="16" y1="50" x2="64" y2="50" stroke="#8E421E" strokeWidth="1" />
        <line x1="16" y1="59" x2="64" y2="59" stroke="#8E421E" strokeWidth="1" />

        {/* Terracotta / Rust Roof */}
        <polygon
          points="40,16 6,36 74,36"
          fill="#DA713E"
          stroke="#A84C21"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Roof Overhang Ridge Shading */}
        <polygon points="40,16 6,36 40,36" fill="#EA804E" opacity="0.5" />

        {/* Multi-pane Glowing Window */}
        <rect
          x="24"
          y="42"
          width="16"
          height="16"
          rx="2"
          fill={isGlow ? "#FEF08A" : "#FDE047"}
          stroke="#682F12"
          strokeWidth="1.5"
        />
        <line x1="32" y1="42" x2="32" y2="58" stroke="#682F12" strokeWidth="1.2" />
        <line x1="24" y1="50" x2="40" y2="50" stroke="#682F12" strokeWidth="1.2" />

        {/* Wooden Door */}
        <rect x="46" y="44" width="12" height="22" rx="2" fill="#5F270D" />
        <circle cx="49" cy="55" r="1" fill="#FEF08A" />

        {/* Red / Orange Trail Flag (as seen in the reference image) */}
        {hasFlag && (
          <g transform="translate(66, 30)">
            <line x1="0" y1="0" x2="0" y2="22" stroke="#4A2511" strokeWidth="1.5" strokeLinecap="round" />
            <rect x="0" y="0" width="20" height="12" rx="3" fill="#D94E28" />
            {flagText && (
              <text x="10" y="9" fontSize="6" fontWeight="bold" fill="#FFFFFF" textAnchor="middle">
                {flagText}
              </text>
            )}
          </g>
        )}
      </svg>
    </div>
  )
}
