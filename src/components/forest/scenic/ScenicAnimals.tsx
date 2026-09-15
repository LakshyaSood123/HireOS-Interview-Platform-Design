interface AnimalProps {
  className?: string
  scale?: number
}

// 1. Charming White Alpine Goat with Horns (Perched on Ridge / Tree)
export function AlpineGoat({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 54 54"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${54 * scale}px`, height: `${54 * scale}px` }}
      fill="none"
    >
      {/* Drop shadow */}
      <ellipse cx="26" cy="50" rx="16" ry="3" fill="#000000" opacity="0.10" />

      {/* Fluffy White Body */}
      <path
        d="M 12 28 C 12 20, 36 18, 38 28 C 40 38, 12 40, 12 28 Z"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.2"
      />
      {/* Little Fluffy Tail */}
      <circle cx="9" cy="27" r="3.5" fill="#FFFFFF" />

      {/* Legs */}
      <rect x="15" y="34" width="3" height="13" rx="1.5" fill="#334155" />
      <rect x="21" y="35" width="3" height="12" rx="1.5" fill="#475569" />
      <rect x="29" y="34" width="3" height="13" rx="1.5" fill="#334155" />
      <rect x="34" y="35" width="3" height="12" rx="1.5" fill="#475569" />

      {/* Head */}
      <circle cx="38" cy="20" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.2" />

      {/* Cute Curved Golden Horns */}
      <path
        d="M 37 13 C 37 5, 43 3, 46 5"
        stroke="#E2B44A"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 34 14 C 34 7, 39 5, 41 7"
        stroke="#CA8A04"
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Eye & Rosy Cheeks */}
      <circle cx="42" cy="19" r="1.8" fill="#0F172A" />
      <circle cx="45" cy="23" r="1.2" fill="#FB7185" opacity="0.6" />
    </svg>
  )
}

// 2. Charming Tan & Cream Alpine Fawn / Deer (Top Left of Reference)
export function AlpineFawn({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${56 * scale}px`, height: `${56 * scale}px` }}
      fill="none"
    >
      {/* Drop shadow */}
      <ellipse cx="28" cy="52" rx="16" ry="3" fill="#000000" opacity="0.10" />

      {/* Tan Body */}
      <ellipse cx="28" cy="30" rx="14" ry="10" fill="#E2A667" />
      {/* White Underbelly */}
      <path d="M 18 32 Q 28 38, 38 32 Q 28 36, 18 32 Z" fill="#FFFDF8" />
      {/* Little White Tail */}
      <ellipse cx="14" cy="27" rx="3.5" ry="4" fill="#FFFDF8" />

      {/* Legs */}
      <rect x="20" y="38" width="3.5" height="12" rx="1.5" fill="#3B2A1E" />
      <rect x="25" y="37" width="3.5" height="12" rx="1.5" fill="#583F2E" />
      <rect x="33" y="38" width="3.5" height="12" rx="1.5" fill="#3B2A1E" />
      <rect x="37" y="37" width="3.5" height="12" rx="1.5" fill="#583F2E" />

      {/* Head */}
      <circle cx="36" cy="18" r="9" fill="#E2A667" />
      {/* White Face Muzzle */}
      <ellipse cx="40" cy="21" rx="5" ry="4" fill="#FFFDF8" />
      <circle cx="43" cy="20" r="1" fill="#3B2A1E" />

      {/* Cute Ears */}
      <polygon points="31,14 26,6 34,10" fill="#FFFDF8" />
      <polygon points="37,13 36,5 42,10" fill="#E2A667" />

      {/* Eye */}
      <circle cx="38" cy="16" r="1.8" fill="#1C1917" />
    </svg>
  )
}

// 3. Charming Meadow Cow with Bell Collar (Bottom Right of Reference)
export function MeadowCow({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 66 52"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${66 * scale}px`, height: `${52 * scale}px` }}
      fill="none"
    >
      {/* Drop shadow */}
      <ellipse cx="33" cy="48" rx="24" ry="3.5" fill="#000000" opacity="0.10" />

      {/* Cream/Tan Cow Body */}
      <rect x="14" y="20" width="36" height="20" rx="7" fill="#F4EDE0" stroke="#D7CABE" strokeWidth="1.2" />

      {/* Legs */}
      <rect x="18" y="38" width="4.5" height="11" rx="2" fill="#B38959" />
      <rect x="26" y="38" width="4.5" height="11" rx="2" fill="#8D663E" />
      <rect x="37" y="38" width="4.5" height="11" rx="2" fill="#B38959" />
      <rect x="44" y="38" width="4.5" height="11" rx="2" fill="#8D663E" />

      {/* Head */}
      <rect x="42" y="14" width="16" height="16" rx="5" fill="#F4EDE0" stroke="#D7CABE" strokeWidth="1.2" />

      {/* Horns */}
      <polygon points="46,14 43,7 48,10" fill="#E2B44A" />
      <polygon points="53,14 56,7 51,10" fill="#E2B44A" />

      {/* Floppy Ears */}
      <ellipse cx="40" cy="18" rx="3" ry="2" fill="#D7CABE" />

      {/* Eye & Rosy Nose */}
      <circle cx="51" cy="19" r="1.8" fill="#1C1917" />
      <circle cx="56" cy="24" r="1" fill="#FB7185" opacity="0.5" />

      {/* Orange Bell Harness & Collar */}
      <rect x="46" y="27" width="5" height="5" rx="1.5" fill="#E27D4C" stroke="#9A3412" strokeWidth="1" />
      <circle cx="48.5" cy="30" r="1" fill="#FDE047" />

      {/* Tail with Tuft */}
      <path d="M 14 26 Q 10 32, 12 36" stroke="#B38959" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="12" cy="37" r="2.5" fill="#8D663E" />
    </svg>
  )
}

// 4. Timber Log Pile with Axe (Right side of reference)
export function TimberLogPile({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 60 30"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${60 * scale}px`, height: `${30 * scale}px` }}
      fill="none"
    >
      {/* Bottom Log 1 */}
      <rect x="4" y="14" width="48" height="12" rx="6" fill="#D98A5B" stroke="#9A522A" strokeWidth="1.2" />
      <ellipse cx="50" cy="20" rx="3" ry="5" fill="#BF6D3F" />
      {/* Top Log 2 */}
      <rect x="10" y="4" width="44" height="12" rx="6" fill="#E29A6E" stroke="#9A522A" strokeWidth="1.2" />
      <ellipse cx="52" cy="10" rx="3" ry="5" fill="#C9784B" />
    </svg>
  )
}

// 5. Tiny Soaring Birds in the Alpine Sky
export function SoaringBird({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 24 14"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${24 * scale}px`, height: `${14 * scale}px` }}
      fill="none"
    >
      <path
        d="M 2 8 Q 7 2, 12 7 Q 17 2, 22 8"
        stroke="#4A6553"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// 6. Rustic Straw Broom / Paddle beside the Cow (Matching reference!)
export function RusticBroom({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 36 64"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${36 * scale}px`, height: `${64 * scale}px` }}
      fill="none"
    >
      {/* Handle stick */}
      <line x1="28" y1="6" x2="8" y2="58" stroke="#4A3B32" strokeWidth="3" strokeLinecap="round" />
      {/* Straw Paddle / Broom Head */}
      <path
        d="M 24 8 C 34 16, 32 30, 20 38 C 12 32, 14 18, 24 8 Z"
        fill="#E8CDB2"
        stroke="#A78B71"
        strokeWidth="1.2"
      />
      {/* Straw Texture Lines */}
      <path d="M 23 11 L 18 34" stroke="#C5A486" strokeWidth="1" strokeLinecap="round" />
      <path d="M 26 14 L 21 36" stroke="#C5A486" strokeWidth="1" strokeLinecap="round" />
      <path d="M 28 19 L 24 35" stroke="#C5A486" strokeWidth="1" strokeLinecap="round" />
      {/* Twine wrap */}
      <rect x="18" y="32" width="6" height="4" rx="1" transform="rotate(-30 18 32)" fill="#8D663E" />
    </svg>
  )
}
