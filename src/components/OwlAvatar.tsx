interface OwlAvatarProps {
  state?: "idle" | "listening" | "celebrating" | "thinking"
  size?: number
  className?: string
}

export default function OwlAvatar({ state = "idle", size = 300, className = "" }: OwlAvatarProps) {
  const containerClass = {
    idle: "owl-idle",
    listening: "owl-listening",
    celebrating: "owl-celebrating",
    thinking: "owl-thinking",
  }[state]

  return (
    <div
      className={`${containerClass} ${className} inline-block select-none`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 400 400"
        width="100%"
        height="100%"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="bodyGrad" x1="20%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#22D4A0" />
            <stop offset="100%" stopColor="#0C9268" />
          </linearGradient>
          <linearGradient id="bodyGrad2" x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#1EC893" />
            <stop offset="100%" stopColor="#0A8560" />
          </linearGradient>
          <linearGradient id="earGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
          <radialGradient id="eyeGrad" cx="35%" cy="35%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#F0F0F0" />
          </radialGradient>
          <filter id="softShadow" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" floodOpacity="0.18" />
          </filter>
        </defs>

        {/* ── Ground shadow ── */}
        <ellipse cx="200" cy="384" rx="82" ry="11" fill="rgba(0,0,0,0.09)" />

        {/* ── Orange ear tufts (drawn before head so head clips base) ── */}
        <g className="ear-l">
          <path d="M 152 105 Q 144 68 158 34 Q 162 68 166 105 Z" fill="#FDE68A" />
          <path d="M 159 105 Q 152 55 166 26 Q 170 56 169 106 Z" fill="#FB923C" />
          <path d="M 166 107 Q 161 72 173 47 Q 175 73 172 108 Z" fill="#F97316" />
        </g>
        <g className="ear-r">
          <path d="M 248 105 Q 256 68 242 34 Q 238 68 234 105 Z" fill="#FDE68A" />
          <path d="M 241 105 Q 248 55 234 26 Q 230 56 231 106 Z" fill="#FB923C" />
          <path d="M 234 107 Q 239 72 227 47 Q 225 73 228 108 Z" fill="#F97316" />
        </g>

        {/* ── Lower body ── */}
        <ellipse cx="200" cy="300" rx="79" ry="66" fill="url(#bodyGrad2)" />

        {/* ── Head ── */}
        <circle
          cx="200" cy="188" r="107"
          fill="url(#bodyGrad)"
          filter="url(#softShadow)"
        />

        {/* ── White facial disk ── */}
        <ellipse cx="200" cy="218" rx="77" ry="90" fill="#FEFDFB" opacity="0.93" />

        {/* ── Left eye ── */}
        <g className="owl-eye">
          <circle cx="165" cy="190" r="23" fill="url(#eyeGrad)" />
          <circle cx="165" cy="190" r="23" fill="white" />
          <circle cx="167" cy="188" r="12" fill="#1F2937" />
          <circle cx="171" cy="184" r="5.5" fill="white" />
          <circle cx="162" cy="194" r="2.5" fill="white" opacity="0.6" />
        </g>

        {/* ── Right eye ── */}
        <g className="owl-eye owl-eye-r">
          <circle cx="235" cy="190" r="23" fill="white" />
          <circle cx="233" cy="188" r="12" fill="#1F2937" />
          <circle cx="229" cy="184" r="5.5" fill="white" />
          <circle cx="238" cy="194" r="2.5" fill="white" opacity="0.6" />
        </g>

        {/* ── Beak ── */}
        <path
          d="M 194 222 Q 200 236 206 222 Q 203 215 200 213 Q 197 215 194 222 Z"
          fill="#FB923C"
        />
        <path
          d="M 196 222 Q 200 229 204 222 Z"
          fill="#E8821A"
          opacity="0.5"
        />

        {/* ── Left foot toes ── */}
        <ellipse cx="165" cy="360" rx="17" ry="8" fill="#FB923C" transform="rotate(-12 165 360)" />
        <ellipse cx="149" cy="364" rx="11" ry="5.5" fill="#FB923C" transform="rotate(-25 149 364)" />
        <ellipse cx="180" cy="366" rx="11" ry="5.5" fill="#FB923C" transform="rotate(0 180 366)" />
        <ellipse cx="165" cy="368" rx="8" ry="4" fill="#E87028" opacity="0.4" />

        {/* ── Right foot toes ── */}
        <ellipse cx="235" cy="360" rx="17" ry="8" fill="#FB923C" transform="rotate(12 235 360)" />
        <ellipse cx="251" cy="364" rx="11" ry="5.5" fill="#FB923C" transform="rotate(25 251 364)" />
        <ellipse cx="220" cy="366" rx="11" ry="5.5" fill="#FB923C" transform="rotate(0 220 366)" />
        <ellipse cx="235" cy="368" rx="8" ry="4" fill="#E87028" opacity="0.4" />

        {/* ── Headphone band ── */}
        <path
          d="M 96 186 Q 200 76 304 186"
          stroke="#475569"
          strokeWidth="22"
          fill="none"
          strokeLinecap="round"
        />
        {/* Gold accent stripe */}
        <path
          d="M 96 186 Q 200 76 304 186"
          stroke="#FBBF24"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          opacity="0.88"
        />

        {/* ── Left ear cup ── */}
        <circle cx="96" cy="186" r="23" fill="#334155" />
        <circle cx="96" cy="186" r="17" fill="#64748B" />
        <circle cx="91" cy="181" r="5.5" fill="#94A3B8" opacity="0.65" />

        {/* ── Right ear cup ── */}
        <circle cx="304" cy="186" r="23" fill="#334155" />
        <circle cx="304" cy="186" r="17" fill="#64748B" />
        <circle cx="309" cy="181" r="5.5" fill="#94A3B8" opacity="0.65" />

        {/* ── Boom mic ── */}
        <path
          d="M 96 209 Q 80 240 74 264"
          stroke="#64748B"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="74" cy="272" r="9" fill="#94A3B8" />
        <circle cx="74" cy="272" r="5.5" fill="#475569" />
        <circle cx="72" cy="270" r="2" fill="#CBD5E1" opacity="0.7" />
      </svg>
    </div>
  )
}
