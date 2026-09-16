interface AnimalProps {
  className?: string
  scale?: number
}

// 1. Noble Alpine Ibex / Chamois (Natural curved horns, perched on high crags)
export function AlpineGoat({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 58 56"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${58 * scale}px`, height: `${56 * scale}px` }}
      fill="none"
    >
      <defs>
        <linearGradient id="goatFleece" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FAFBF9" />
          <stop offset="65%" stopColor="#EDF2EA" />
          <stop offset="100%" stopColor="#D8E2D6" />
        </linearGradient>
      </defs>

      {/* Soft Ground Contact Shadow on rock */}
      <ellipse cx="28" cy="51" rx="18" ry="3.5" fill="#000000" opacity="0.14" />

      {/* Fluffy Natural Body Form */}
      <path
        d="M 14 30 
           C 12 21, 34 19, 39 27 
           C 42 36, 36 41, 24 41 
           C 14 41, 12 37, 14 30 Z"
        fill="url(#goatFleece)"
        stroke="#CAD7C8"
        strokeWidth="1"
      />
      {/* Fluffy Tail */}
      <path d="M 12 30 C 8 29, 7 34, 11 36 Z" fill="#E8EFE6" />

      {/* Slender Slate Legs */}
      <rect x="17" y="37" width="2.8" height="12" rx="1.4" fill="#3D4B59" />
      <rect x="23" y="38" width="2.8" height="11" rx="1.4" fill="#506070" />
      <rect x="30" y="37" width="2.8" height="12" rx="1.4" fill="#3D4B59" />
      <rect x="36" y="38" width="2.8" height="11" rx="1.4" fill="#506070" />
      {/* Tiny hooves */}
      <rect x="16.5" y="47.5" width="3.8" height="2" rx="0.8" fill="#242C33" />
      <rect x="22.5" y="47.5" width="3.8" height="2" rx="0.8" fill="#242C33" />
      <rect x="29.5" y="47.5" width="3.8" height="2" rx="0.8" fill="#242C33" />
      <rect x="35.5" y="47.5" width="3.8" height="2" rx="0.8" fill="#242C33" />

      {/* Head with natural jawline */}
      <path
        d="M 36 24 C 34 16, 44 14, 46 21 C 48 26, 42 29, 36 24 Z"
        fill="url(#goatFleece)"
        stroke="#CAD7C8"
        strokeWidth="1"
      />

      {/* Curved Ridged Alpine Horns (Natural aged ram horn) */}
      <path
        d="M 38 15 C 38 4, 46 2, 50 6"
        stroke="#7A654E"
        strokeWidth="3.0"
        strokeLinecap="round"
      />
      <path
        d="M 35 16 C 35 6, 42 4, 45 8"
        stroke="#5F4E3C"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Horn ridge rings */}
      <line x1="43" y1="9" x2="45" y2="11" stroke="#483B2E" strokeWidth="0.8" />
      <line x1="46" y1="6" x2="48" y2="8" stroke="#483B2E" strokeWidth="0.8" />

      {/* Eye & Muzzle */}
      <circle cx="43" cy="20" r="1.4" fill="#1E293B" />
      <ellipse cx="46" cy="23.5" rx="1.8" ry="1.4" fill="#BCC8BA" />
      <circle cx="47" cy="23.5" r="0.6" fill="#3D4B59" />
    </svg>
  )
}

// 2. Graceful Alpine Fawn (Slender & Natural)
export function AlpineFawn({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 58 58"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${58 * scale}px`, height: `${58 * scale}px` }}
      fill="none"
    >
      {/* Drop shadow on turf */}
      <ellipse cx="29" cy="53" rx="18" ry="3.5" fill="#000000" opacity="0.12" />

      {/* Warm Chestnut Body with natural curve */}
      <path
        d="M 16 32 
           C 14 24, 38 22, 41 31 
           C 43 38, 36 42, 26 42 
           C 17 42, 14 38, 16 32 Z"
        fill="#B8763C"
      />
      {/* Soft Cream Underbelly */}
      <path d="M 20 35 Q 29 40, 37 34 Q 28 37, 20 35 Z" fill="#FDF8F0" />

      {/* Delicate Dappled White Back Spots */}
      <circle cx="24" cy="28" r="0.9" fill="#FFFFFF" opacity="0.75" />
      <circle cx="28" cy="26" r="1.0" fill="#FFFFFF" opacity="0.75" />
      <circle cx="33" cy="27" r="0.9" fill="#FFFFFF" opacity="0.75" />
      <circle cx="29" cy="30" r="0.8" fill="#FFFFFF" opacity="0.65" />

      {/* Little White Tail */}
      <ellipse cx="14" cy="29" rx="3" ry="3.5" fill="#FDF8F0" />

      {/* Slender Delicate Legs */}
      <rect x="21" y="39" width="2.6" height="12" rx="1.3" fill="#422E1F" />
      <rect x="26" y="38" width="2.6" height="12" rx="1.3" fill="#5A3F2B" />
      <rect x="33" y="39" width="2.6" height="12" rx="1.3" fill="#422E1F" />
      <rect x="37" y="38" width="2.6" height="12" rx="1.3" fill="#5A3F2B" />

      {/* Graceful Head & Neck */}
      <path d="M 32 30 L 37 19 L 41 24 Z" fill="#B8763C" />
      <circle cx="37" cy="18" r="8" fill="#B8763C" />
      {/* Cream Muzzle */}
      <ellipse cx="41" cy="21" rx="4.5" ry="3.5" fill="#FDF8F0" />
      <circle cx="44" cy="20" r="0.9" fill="#302014" />

      {/* Delicate Ears */}
      <polygon points="32,14 27,6 35,10" fill="#FDF8F0" />
      <polygon points="38,13 37,5 43,10" fill="#B8763C" />

      {/* Gentle Eye */}
      <circle cx="39" cy="16.5" r="1.5" fill="#1C1917" />
      <circle cx="39.4" cy="16.1" r="0.5" fill="#FFFFFF" />
    </svg>
  )
}

// 3. Swiss Alpine Pasture Cow (Simmental / Braunvieh with brass bell)
export function MeadowCow({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 68 54"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${68 * scale}px`, height: `${54 * scale}px` }}
      fill="none"
    >
      <defs>
        <linearGradient id="cowBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F5EFE4" />
          <stop offset="70%" stopColor="#E8DDCD" />
          <stop offset="100%" stopColor="#D4C6B2" />
        </linearGradient>
      </defs>

      {/* Ground Contact Shadow */}
      <ellipse cx="34" cy="49" rx="26" ry="4" fill="#000000" opacity="0.12" />

      {/* Cream/Tan Cow Body with natural curves */}
      <rect x="14" y="21" width="38" height="20" rx="8" fill="url(#cowBody)" stroke="#BAAB97" strokeWidth="1" />

      {/* Warm Larch/Caramel Patches */}
      <ellipse cx="26" cy="27" rx="7" ry="5" fill="#B68958" opacity="0.8" />
      <ellipse cx="40" cy="32" rx="6" ry="4" fill="#B68958" opacity="0.75" />

      {/* Sturdy Legs */}
      <rect x="18" y="39" width="4" height="10" rx="1.8" fill="#9E7649" />
      <rect x="26" y="39" width="4" height="10" rx="1.8" fill="#7C5732" />
      <rect x="38" y="39" width="4" height="10" rx="1.8" fill="#9E7649" />
      <rect x="45" y="39" width="4" height="10" rx="1.8" fill="#7C5732" />
      {/* Dark Hooves */}
      <rect x="18" y="47" width="4" height="2.2" rx="1" fill="#3D2919" />
      <rect x="26" y="47" width="4" height="2.2" rx="1" fill="#3D2919" />
      <rect x="38" y="47" width="4" height="2.2" rx="1" fill="#3D2919" />
      <rect x="45" y="47" width="4" height="2.2" rx="1" fill="#3D2919" />

      {/* Head */}
      <rect x="44" y="15" width="16" height="16" rx="5" fill="url(#cowBody)" stroke="#BAAB97" strokeWidth="1" />

      {/* Natural Horns */}
      <polygon points="48,15 45,7 50,10" fill="#C9A354" />
      <polygon points="55,15 58,7 53,10" fill="#C9A354" />

      {/* Floppy Ears */}
      <ellipse cx="42" cy="19" rx="3.5" ry="2" fill="#D0C2B4" />

      {/* Gentle Eye & Natural Muzzle */}
      <circle cx="53" cy="20" r="1.5" fill="#1C1917" />
      <ellipse cx="58" cy="25" rx="3.5" ry="2.5" fill="#DCCBC0" />
      <circle cx="57" cy="25" r="0.7" fill="#6B4B3D" />

      {/* Leather Collar & Brass Alpine Bell */}
      <rect x="47" y="27" width="4" height="6" rx="1" fill="#5E2A0E" />
      <polygon points="46,33 52,33 50,38 48,38" fill="#D49B28" stroke="#8C5C0C" strokeWidth="0.8" />
      <circle cx="49" cy="38" r="1" fill="#FDE68A" />

      {/* Tail with Tuft */}
      <path d="M 14 26 Q 9 32, 11 37" stroke="#966C3E" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="11" cy="38" r="2.5" fill="#664323" />
    </svg>
  )
}

// 4. Weathered Alpine Timber Stack (Natural spruce logs with bark texture)
export function TimberLogPile({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${64 * scale}px`, height: `${32 * scale}px` }}
      fill="none"
    >
      {/* Ground shadow */}
      <ellipse cx="32" cy="28" rx="28" ry="3.5" fill="#000000" opacity="0.14" />

      {/* Bottom Log 1 (Natural weathered alpine spruce) */}
      <rect x="4" y="15" width="50" height="12" rx="6" fill="#583C28" stroke="#3A2416" strokeWidth="1" />
      {/* End grain wood rings */}
      <ellipse cx="52" cy="21" rx="4" ry="5.5" fill="#8C6848" />
      <ellipse cx="52" cy="21" rx="2.5" ry="3.5" fill="#583C28" opacity="0.4" />
      <circle cx="52" cy="21" r="1" fill="#3A2416" />

      {/* Top Log 2 */}
      <rect x="10" y="5" width="46" height="12" rx="6" fill="#6B4B33" stroke="#3A2416" strokeWidth="1" />
      <ellipse cx="54" cy="11" rx="4" ry="5.5" fill="#997554" />
      <ellipse cx="54" cy="11" rx="2.5" ry="3.5" fill="#6B4B33" opacity="0.4" />
      <circle cx="54" cy="11" r="1" fill="#3A2416" />
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
        d="M 2 9 Q 7 2, 12 8 Q 17 2, 22 9"
        stroke="#3F5948"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}

// 6. Subtle Hearth Accent
export function RusticBroom({ className = "", scale = 1 }: AnimalProps) {
  return (
    <svg
      viewBox="0 0 16 36"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${16 * scale}px`, height: `${36 * scale}px` }}
      fill="none"
    >
      <line x1="8" y1="2" x2="8" y2="24" stroke="#5E381E" strokeWidth="2.0" strokeLinecap="round" />
      <polygon points="4,22 12,22 15,34 1,34" fill="#B38647" stroke="#7E5824" strokeWidth="1" />
      <line x1="4" y1="26" x2="12" y2="26" stroke="#482A12" strokeWidth="1" />
      <line x1="5" y1="30" x2="11" y2="30" stroke="#8E6327" strokeWidth="0.8" />
    </svg>
  )
}
