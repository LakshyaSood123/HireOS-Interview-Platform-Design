interface SoftCloudProps {
  className?: string
  scale?: number
  opacity?: number
}

export default function SoftCloud({ className = "", scale = 1, opacity = 0.9 }: SoftCloudProps) {
  return (
    <svg
      viewBox="0 0 120 48"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{
        width: `${120 * scale}px`,
        height: `${48 * scale}px`,
        opacity,
      }}
      fill="none"
    >
      {/* Soft Pillowy Cloud Body */}
      <g filter="drop-shadow(0 4px 12px rgba(180, 205, 195, 0.45))">
        <path
          d="M 24 38 L 96 38 C 108 38 116 30 116 20 C 116 10 106 4 96 6 C 92 1 82 -1 74 3 C 68 -2 54 -1 48 6 C 42 2 32 3 28 8 C 20 6 12 12 12 22 C 12 31 18 38 24 38 Z"
          fill="#FFFFFF"
        />
        {/* Soft Under-shading */}
        <path
          d="M 20 38 L 98 38 C 106 38 112 33 114 26 C 104 31 92 34 80 34 C 64 34 50 30 36 32 C 26 33 18 36 20 38 Z"
          fill="#EBF3EE"
          opacity="0.8"
        />
      </g>
    </svg>
  )
}
