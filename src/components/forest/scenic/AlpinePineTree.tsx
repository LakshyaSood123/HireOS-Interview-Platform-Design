interface AlpinePineTreeProps {
  variant?: "small" | "medium" | "tall" | "cluster" | "dense" | "grove" | "grand" | "ancient" | "slender" | "windblown" | "distant"
  className?: string
  scale?: number
}

/* 
  Stylized Photorealistic Alpine Conifer System:
  - Irregular natural silhouettes with jagged branchlet clusters and serrated needle sprays
  - Deep shadow interior with sunlit foliage rims
  - Gnarled bark and root flares
  - Multiple distinct species: Ancient Pine, Slender Alpine Spruce, Dense Mountain Fir, Windblown Krummholz, Distant Misty Conifer
*/

// 1. ANCIENT OLD-GROWTH PINE (Hero Trees Region Landmark Conifer)
function AncientPine({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {/* Ground Contact Shadow */}
      <ellipse cx="48" cy="120" rx="44" ry="7" fill="#0A160D" opacity="0.36" />
      <ellipse cx="48" cy="119" rx="28" ry="4.5" fill="#0A160D" opacity="0.45" />

      {/* Rugged Weathered Trunk with Exposed Root Flare & Deadwood Spire */}
      <path
        d="M 43 45 L 41 119 L 55 119 L 52 45 Z"
        fill="#2A170C"
      />
      <path
        d="M 41 102 C 36 110, 28 116, 20 119 L 42 119 Z"
        fill="#1E0F07"
      />
      <path
        d="M 54 105 C 60 112, 68 116, 76 119 L 54 119 Z"
        fill="#362012"
      />
      {/* Weathered Gnarled Crown Spire (Deadwood Lightning Spike) */}
      <path d="M 48 4 L 46 36 L 50 36 Z" fill="#3D291B" />
      <path d="M 48 4 C 53 11, 57 16, 64 19 L 60 21 C 55 18, 50 14, 48 9 Z" fill="#503725" />
      <path d="M 47 16 C 41 20, 36 22, 30 24 L 32 26 C 37 24, 42 22, 47 19 Z" fill="#3D291B" />

      {/* ── Tier 5: Giant Bottom Heavy Boughs (Irregular Drooping Needles) ── */}
      <path
        d="M 46 68 
           L 36 73 L 28 72 L 20 78 L 12 77 L 3 86 L 8 88 L 0 97 L 9 98 L 4 105 
           L 15 103 L 22 106 L 31 101 L 42 104 L 47 101 L 56 104 L 66 101 L 76 105 
           L 87 100 L 96 103 L 94 94 L 101 92 L 95 84 L 100 81 L 91 75 L 82 76 
           L 72 71 L 62 74 L 46 68 Z"
        fill="#0A1E11"
      />
      <path
        d="M 46 71 
           L 37 75 L 30 74 L 23 80 L 16 79 L 8 87 L 13 89 L 6 97 L 14 98 L 10 103 
           L 19 102 L 26 104 L 34 100 L 43 102 L 48 100 L 57 102 L 65 100 L 74 103 
           L 83 99 L 91 101 L 89 93 L 95 91 L 89 84 L 93 81 L 85 76 L 76 77 
           L 68 73 L 59 75 L 46 71 Z"
        fill="#14311D"
      />
      <path
        d="M 46 74 
           L 39 77 L 33 76 L 27 82 L 21 81 L 15 88 L 19 90 L 14 96 L 22 96 L 19 100 
           L 27 99 L 33 101 L 39 98 L 46 100 L 50 98 L 57 100 L 64 98 L 71 101 
           L 78 97 L 84 98 L 82 92 L 87 90 L 82 84 L 86 81 L 79 77 L 72 78 
           L 64 74 L 56 76 L 46 74 Z"
        fill="#22472B"
      />
      {/* Sunlit needle tip highlights */}
      <path
        d="M 46 77 L 40 80 L 35 79 L 30 84 L 26 83 L 22 88 L 26 90 L 22 94 L 28 94 
           L 33 97 L 39 95 L 45 97 L 49 95 L 55 97 L 61 95 L 67 98 L 72 95 
           L 76 96 L 74 91 L 78 89 L 74 84 L 70 82 L 62 80 L 54 81 L 46 77 Z"
        fill="#386A45"
        opacity="0.9"
      />

      {/* ── Tier 4: Mid-Lower Boughs with Multi-Spurred Needle Sprays ── */}
      <path
        d="M 47 50 
           L 38 55 L 30 54 L 22 61 L 14 60 L 6 70 L 12 72 L 5 80 L 15 81 L 11 88 
           L 22 86 L 30 89 L 40 85 L 48 87 L 57 85 L 66 88 L 76 84 L 86 87 
           L 84 79 L 91 78 L 85 69 L 89 67 L 80 60 L 71 62 L 60 56 L 47 50 Z"
        fill="#0E2415"
      />
      <path
        d="M 47 53 
           L 39 57 L 32 56 L 25 62 L 18 61 L 11 70 L 16 72 L 11 79 L 19 80 L 16 86 
           L 25 85 L 33 87 L 41 84 L 49 85 L 57 84 L 65 86 L 73 83 L 81 85 
           L 79 78 L 85 77 L 80 69 L 83 67 L 76 61 L 68 63 L 58 58 L 47 53 Z"
        fill="#1A3A23"
      />
      <path
        d="M 47 56 
           L 41 59 L 35 58 L 29 64 L 23 63 L 18 70 L 22 72 L 18 77 L 25 78 L 22 83 
           L 29 82 L 36 84 L 43 82 L 50 83 L 57 82 L 63 84 L 70 81 L 76 83 
           L 74 77 L 79 76 L 75 69 L 71 65 L 63 62 L 55 60 L 47 56 Z"
        fill="#2B5435"
      />
      <path
        d="M 47 58 L 42 61 L 37 60 L 32 65 L 28 64 L 24 70 L 28 71 L 25 75 L 31 76 
           L 36 78 L 43 77 L 49 78 L 55 77 L 61 79 L 66 76 L 71 78 L 69 73 
           L 64 70 L 56 67 L 47 58 Z"
        fill="#427850"
        opacity="0.85"
      />

      {/* ── Tier 3: Mid-Upper Boughs ── */}
      <path
        d="M 48 32 
           L 40 37 L 33 36 L 26 43 L 19 42 L 14 51 L 20 53 L 16 60 L 25 61 L 23 67 
           L 32 66 L 41 68 L 49 66 L 57 68 L 65 65 L 73 68 L 72 60 L 78 59 
           L 74 51 L 78 49 L 70 42 L 61 44 L 52 38 L 48 32 Z"
        fill="#163420"
      />
      <path
        d="M 48 35 
           L 41 39 L 35 38 L 29 44 L 23 43 L 19 51 L 24 53 L 21 59 L 28 60 L 27 65 
           L 35 64 L 42 66 L 49 64 L 56 66 L 63 64 L 69 66 L 68 59 L 73 58 
           L 69 51 L 65 47 L 57 43 L 48 35 Z"
        fill="#285033"
      />
      <path
        d="M 48 37 L 43 41 L 38 40 L 33 46 L 29 45 L 25 51 L 29 53 L 27 57 L 33 58 
           L 39 60 L 46 59 L 52 61 L 58 59 L 63 61 L 62 56 L 57 52 L 48 37 Z"
        fill="#3F764E"
      />

      {/* ── Tier 2 & 1: Asymmetrical Apex Needle Sprays ── */}
      <path
        d="M 48 16 
           L 42 22 L 36 21 L 30 28 L 25 27 L 22 35 L 28 36 L 26 42 L 34 43 L 33 48 
           L 41 47 L 49 48 L 56 46 L 63 48 L 62 42 L 67 41 L 64 34 L 60 28 L 52 22 L 48 16 Z"
        fill="#24492F"
      />
      <path
        d="M 48 18 
           L 43 23 L 38 22 L 33 28 L 29 28 L 26 35 L 31 36 L 30 41 L 37 41 L 43 43 
           L 49 42 L 54 43 L 58 41 L 57 36 L 54 30 L 48 18 Z"
        fill="#3A6F48"
      />
      <path
        d="M 48 20 L 44 24 L 40 24 L 36 29 L 33 29 L 31 34 L 35 35 L 40 37 L 46 36 L 51 38 L 50 33 L 48 20 Z"
        fill="#57956B"
        opacity="0.9"
      />
    </g>
  )
}

// 2. SLENDER ALPINE SPRUCE (Narrow, Elegant Tapering Conifer with Serrated Branchlets)
function SlenderSpruce({ x = 0, y = 0, scale = 1, toneOffset = 0 }: { x?: number; y?: number; scale?: number; toneOffset?: number }) {
  const tones = [
    { s: "#0E2114", m: "#1B3923", l: "#2E5839", c: "#477D53", h: "#639F70" },
    { s: "#132719", m: "#22442B", l: "#356543", c: "#4F8D5D", h: "#6DAF7D" },
    { s: "#0A1B10", m: "#16311E", l: "#274E32", c: "#3D7148", h: "#579262" },
  ]
  const t = tones[toneOffset % 3]

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="28" cy="117" rx="24" ry="4.5" fill="#0A160D" opacity="0.30" />
      {/* Slender trunk */}
      <path d="M 26 75 L 25 117 L 31 117 L 30 75 Z" fill="#2E1A0E" />

      {/* Tier 5 (Base) */}
      <path
        d="M 28 72 
           L 20 78 L 14 77 L 8 84 L 4 92 L 9 94 L 2 101 L 8 103 L 4 109 
           L 13 107 L 19 109 L 26 106 L 31 108 L 38 105 L 44 108 L 52 104 
           L 48 98 L 53 96 L 47 88 L 51 86 L 43 78 L 36 79 L 28 72 Z"
        fill={t.s}
      />
      <path
        d="M 28 74 
           L 21 80 L 16 79 L 11 85 L 7 92 L 11 94 L 6 100 L 11 102 L 8 107 
           L 15 105 L 21 107 L 27 104 L 32 106 L 38 103 L 43 106 L 48 102 
           L 45 97 L 49 95 L 44 88 L 47 86 L 41 79 L 35 80 L 28 74 Z"
        fill={t.m}
      />
      <path
        d="M 28 77 
           L 22 82 L 18 81 L 14 86 L 11 92 L 15 94 L 11 99 L 16 100 L 14 104 
           L 20 103 L 25 104 L 29 102 L 34 103 L 39 101 L 43 102 L 41 97 L 37 92 L 33 82 L 28 77 Z"
        fill={t.l}
      />
      <path
        d="M 28 80 L 23 85 L 20 88 L 24 90 L 20 95 L 25 96 L 28 94 L 32 96 L 35 94 L 32 88 L 28 80 Z"
        fill={t.c}
        opacity="0.85"
      />

      {/* Tier 4 */}
      <path
        d="M 28 54 
           L 21 60 L 15 59 L 10 66 L 6 73 L 11 75 L 6 82 L 12 83 L 9 88 
           L 17 87 L 23 89 L 29 86 L 35 88 L 42 85 L 48 87 L 44 81 L 48 79 
           L 43 72 L 46 70 L 39 63 L 34 64 L 28 54 Z"
        fill={t.s}
      />
      <path
        d="M 28 56 
           L 22 61 L 17 60 L 13 67 L 9 73 L 13 75 L 9 81 L 14 82 L 12 86 
           L 19 85 L 24 87 L 30 84 L 35 86 L 40 83 L 44 85 L 41 80 L 44 78 
           L 40 72 L 42 70 L 37 64 L 33 65 L 28 56 Z"
        fill={t.m}
      />
      <path
        d="M 28 58 
           L 23 63 L 19 62 L 16 68 L 13 74 L 17 75 L 14 80 L 19 81 L 17 84 
           L 23 83 L 28 84 L 32 82 L 36 83 L 37 78 L 34 72 L 28 58 Z"
        fill={t.l}
      />
      <path
        d="M 28 61 L 24 65 L 21 70 L 25 71 L 22 76 L 27 77 L 30 75 L 34 76 L 31 71 L 28 61 Z"
        fill={t.c}
        opacity="0.9"
      />

      {/* Tier 3 */}
      <path
        d="M 28 36 
           L 22 41 L 17 40 L 13 47 L 9 53 L 14 55 L 10 61 L 16 62 L 14 67 
           L 21 66 L 27 67 L 33 65 L 39 67 L 45 65 L 41 59 L 45 57 
           L 40 50 L 43 48 L 37 42 L 33 43 L 28 36 Z"
        fill={t.m}
      />
      <path
        d="M 28 38 
           L 23 43 L 19 42 L 15 48 L 12 54 L 16 55 L 13 60 L 18 61 L 17 65 
           L 23 64 L 28 65 L 33 63 L 37 64 L 40 62 L 37 57 L 34 50 L 28 38 Z"
        fill={t.l}
      />
      <path
        d="M 28 40 L 24 45 L 21 50 L 25 51 L 23 56 L 28 57 L 32 55 L 35 56 L 32 50 L 28 40 Z"
        fill={t.c}
      />

      {/* Tier 2 */}
      <path
        d="M 28 20 
           L 23 25 L 19 24 L 15 30 L 12 36 L 17 37 L 14 42 L 20 43 L 19 47 
           L 25 46 L 31 47 L 36 45 L 41 47 L 38 41 L 41 39 L 37 32 L 33 33 L 28 20 Z"
        fill={t.l}
      />
      <path
        d="M 28 22 L 24 27 L 20 27 L 17 32 L 15 37 L 19 38 L 18 42 L 24 42 L 29 43 L 33 41 L 36 42 L 33 37 L 28 22 Z"
        fill={t.c}
      />
      <path
        d="M 28 24 L 25 28 L 22 33 L 26 34 L 24 38 L 28 38 L 31 36 L 30 31 L 28 24 Z"
        fill={t.h}
        opacity="0.85"
      />

      {/* Tier 1 Apex Spire */}
      <path
        d="M 28 4 
           L 25 10 L 22 16 L 19 23 L 23 24 L 21 28 L 26 28 L 30 27 L 34 28 L 32 23 
           L 35 22 L 31 16 L 28 4 Z"
        fill={t.c}
      />
      <path
        d="M 28 5 L 26 11 L 24 16 L 22 22 L 25 23 L 28 22 L 30 23 L 29 17 L 28 5 Z"
        fill={t.h}
      />
    </g>
  )
}

// 3. DENSE MOUNTAIN FIR (Full-Bodied, Rich Tiered Conifer with Deep Needle Skirts)
function DenseFir({ x = 0, y = 0, scale = 1, toneOffset = 1 }: { x?: number; y?: number; scale?: number; toneOffset?: number }) {
  const tones = [
    { s: "#0A1D10", m: "#16341F", l: "#275032", c: "#3E744B", h: "#589B69" },
    { s: "#0F2314", m: "#1C3C25", l: "#2E5A39", c: "#488255", h: "#63A872" },
    { s: "#132A18", m: "#23462C", l: "#366542", c: "#518F60", h: "#6DB57E" },
  ]
  const t = tones[toneOffset % 3]

  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="38" cy="111" rx="35" ry="6.5" fill="#0A160D" opacity="0.32" />
      <path d="M 35 68 L 34 111 L 42 111 L 41 68 Z" fill="#2E1B0F" />

      {/* Tier 4 (Broad Ground Needle Skirt) */}
      <path
        d="M 38 60 
           L 29 66 L 21 64 L 14 72 L 7 71 L 1 80 L 7 82 L 0 91 L 8 93 L 3 101 
           L 13 99 L 20 102 L 29 97 L 38 100 L 47 97 L 56 102 L 63 99 L 73 101 
           L 68 93 L 76 91 L 69 82 L 75 80 L 69 71 L 62 72 L 55 64 L 47 66 L 38 60 Z"
        fill={t.s}
      />
      <path
        d="M 38 63 
           L 30 68 L 23 66 L 16 73 L 10 72 L 5 80 L 10 82 L 4 90 L 11 92 L 7 99 
           L 16 97 L 22 100 L 30 96 L 38 98 L 46 96 L 54 100 L 60 97 L 69 99 
           L 65 92 L 72 90 L 66 82 L 71 80 L 66 72 L 60 73 L 53 66 L 46 68 L 38 63 Z"
        fill={t.m}
      />
      <path
        d="M 38 66 
           L 32 70 L 26 69 L 20 75 L 14 74 L 10 81 L 15 82 L 10 89 L 16 90 L 13 96 
           L 20 95 L 26 97 L 32 94 L 38 96 L 44 94 L 50 97 L 56 95 L 63 96 
           L 60 90 L 66 89 L 61 82 L 65 80 L 60 74 L 54 75 L 48 69 L 44 70 L 38 66 Z"
        fill={t.l}
      />
      {/* Sunlit branch fringe */}
      <path
        d="M 38 69 L 33 73 L 28 72 L 23 77 L 18 76 L 15 82 L 19 83 L 15 88 L 21 89 
           L 27 92 L 33 90 L 38 92 L 43 90 L 49 92 L 54 89 L 58 88 L 54 82 L 47 77 L 38 69 Z"
        fill={t.c}
        opacity="0.9"
      />

      {/* Tier 3 */}
      <path
        d="M 38 42 
           L 30 47 L 23 46 L 17 53 L 11 52 L 6 61 L 12 63 L 7 71 L 15 72 L 11 79 
           L 20 78 L 27 80 L 34 76 L 42 78 L 49 76 L 56 80 L 63 78 L 69 79 
           L 65 72 L 72 71 L 67 63 L 72 61 L 67 52 L 61 53 L 55 46 L 47 47 L 38 42 Z"
        fill={t.s}
      />
      <path
        d="M 38 44 
           L 31 49 L 25 48 L 19 54 L 14 53 L 9 61 L 14 63 L 10 70 L 17 71 L 14 77 
           L 22 76 L 28 78 L 35 75 L 42 76 L 48 75 L 54 78 L 60 76 L 66 77 
           L 63 71 L 68 70 L 64 63 L 68 61 L 64 53 L 59 54 L 53 48 L 47 49 L 38 44 Z"
        fill={t.m}
      />
      <path
        d="M 38 47 
           L 32 51 L 27 50 L 22 56 L 17 55 L 14 62 L 18 63 L 15 69 L 21 70 L 19 75 
           L 25 74 L 31 76 L 37 73 L 43 74 L 49 73 L 55 75 L 61 74 L 59 69 L 54 62 L 48 55 L 38 47 Z"
        fill={t.l}
      />
      <path
        d="M 38 50 L 33 54 L 29 53 L 25 58 L 21 57 L 18 63 L 22 64 L 25 68 L 31 69 L 37 67 L 43 68 L 49 67 L 52 64 L 47 58 L 38 50 Z"
        fill={t.c}
        opacity="0.88"
      />

      {/* Tier 2 */}
      <path
        d="M 38 24 
           L 31 29 L 25 28 L 19 35 L 14 34 L 10 42 L 15 44 L 12 51 L 19 52 L 17 58 
           L 24 57 L 31 59 L 38 56 L 45 58 L 52 56 L 58 58 L 64 57 L 61 51 L 65 49 
           L 61 42 L 57 34 L 51 28 L 45 29 L 38 24 Z"
        fill={t.m}
      />
      <path
        d="M 38 26 
           L 32 31 L 27 30 L 22 36 L 17 35 L 14 42 L 18 44 L 15 50 L 21 51 L 20 56 
           L 27 55 L 33 57 L 38 54 L 44 56 L 50 54 L 55 56 L 57 51 L 54 44 L 49 36 L 44 31 L 38 26 Z"
        fill={t.l}
      />
      <path
        d="M 38 29 L 33 33 L 29 32 L 25 38 L 21 37 L 19 43 L 23 44 L 26 49 L 32 50 L 38 48 L 44 49 L 48 47 L 46 41 L 43 35 L 38 29 Z"
        fill={t.c}
      />
      <path
        d="M 38 31 L 34 35 L 31 34 L 28 39 L 26 44 L 30 45 L 35 46 L 40 45 L 44 46 L 43 41 L 38 31 Z"
        fill={t.h}
        opacity="0.85"
      />

      {/* Tier 1 Apex Spire */}
      <path
        d="M 38 6 
           L 33 12 L 29 11 L 25 17 L 21 16 L 18 24 L 23 25 L 21 31 L 27 32 L 26 37 
           L 32 36 L 38 38 L 44 36 L 50 37 L 48 31 L 52 30 L 49 23 L 45 16 L 41 11 L 38 6 Z"
        fill={t.l}
      />
      <path
        d="M 38 8 L 34 13 L 30 13 L 27 18 L 24 23 L 28 24 L 27 29 L 33 30 L 38 32 L 43 30 L 47 31 L 44 25 L 42 19 L 38 8 Z"
        fill={t.c}
      />
      <path
        d="M 38 10 L 35 15 L 32 15 L 29 20 L 32 23 L 36 24 L 40 24 L 43 22 L 40 16 L 38 10 Z"
        fill={t.h}
      />
    </g>
  )
}

// 4. WINDBLOWN KRUMMHOLZ PINE (Alpine Ridgeline Character Tree)
function WindblownPine({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <ellipse cx="34" cy="99" rx="28" ry="5.5" fill="#0A160D" opacity="0.30" />
      {/* Leaning twisted trunk */}
      <path d="M 27 99 C 29 84, 32 68, 38 48 C 36 68, 34 84, 33 99 Z" fill="#2E1B0F" />

      {/* Asymmetric wind-swept boughs (flowing rightward from alpine gusts) */}
      <path
        d="M 36 48 
           L 26 54 L 19 53 L 13 61 L 8 68 L 14 70 L 9 78 L 18 79 L 16 85 
           L 27 84 L 36 87 L 46 84 L 56 89 L 66 85 L 76 89 L 84 83 L 77 75 
           L 82 73 L 74 65 L 78 63 L 68 55 L 58 57 L 48 50 L 36 48 Z"
        fill="#0E2314"
      />
      <path
        d="M 36 51 
           L 28 56 L 22 55 L 16 62 L 12 68 L 17 70 L 13 77 L 20 78 L 19 83 
           L 29 82 L 38 85 L 47 82 L 56 86 L 64 83 L 73 86 L 79 81 L 74 74 
           L 77 72 L 71 65 L 64 57 L 54 58 L 46 52 L 36 51 Z"
        fill="#1C3D25"
      />
      <path
        d="M 36 54 
           L 30 58 L 25 57 L 20 63 L 17 69 L 21 70 L 18 75 L 24 76 L 23 80 
           L 31 79 L 39 82 L 47 79 L 55 83 L 62 80 L 69 82 L 72 78 L 68 72 
           L 63 65 L 56 60 L 48 55 L 36 54 Z"
        fill="#2E5C38"
      />
      <path
        d="M 36 57 L 31 60 L 26 64 L 29 65 L 26 70 L 32 72 L 38 74 L 45 72 L 52 75 L 58 72 L 63 74 L 62 69 L 56 63 L 48 58 L 36 57 Z"
        fill="#468352"
        opacity="0.9"
      />

      {/* Mid Wind Tier */}
      <path
        d="M 38 30 
           L 29 36 L 23 35 L 18 43 L 15 50 L 21 52 L 18 58 L 26 59 L 25 65 
           L 34 64 L 43 67 L 52 64 L 61 68 L 69 64 L 75 67 L 73 60 L 76 58 
           L 70 51 L 64 43 L 54 44 L 46 38 L 38 30 Z"
        fill="#1B3A23"
      />
      <path
        d="M 38 33 
           L 31 38 L 26 37 L 21 44 L 18 50 L 23 52 L 21 57 L 28 57 L 28 62 
           L 36 61 L 44 64 L 52 61 L 59 64 L 66 61 L 70 63 L 68 58 L 64 51 L 58 45 L 48 40 L 38 33 Z"
        fill="#2D5837"
      />
      <path
        d="M 38 36 L 33 40 L 29 45 L 33 47 L 30 52 L 36 53 L 42 55 L 49 53 L 56 56 L 61 53 L 64 55 L 61 50 L 55 45 L 46 41 L 38 36 Z"
        fill="#488454"
      />

      {/* Leaning Apex Needle Cluster */}
      <path
        d="M 40 12 
           L 33 18 L 28 17 L 24 24 L 21 31 L 27 32 L 25 38 L 32 39 L 32 44 
           L 40 43 L 48 45 L 55 43 L 62 46 L 65 41 L 62 34 L 56 26 L 48 24 L 40 12 Z"
        fill="#2D5837"
      />
      <path
        d="M 40 15 L 35 20 L 31 20 L 28 25 L 26 31 L 30 32 L 30 36 L 36 37 L 42 39 L 48 37 L 54 39 L 56 35 L 53 28 L 47 21 L 40 15 Z"
        fill="#457E52"
      />
      <path
        d="M 40 18 L 36 22 L 32 26 L 36 27 L 35 31 L 40 32 L 45 34 L 50 32 L 51 28 L 46 22 L 40 18 Z"
        fill="#61A36F"
      />
    </g>
  )
}

// 5. DISTANT MISTY PINE (Atmospheric perspective conifer for deep background)
function DistantPine({ x = 0, y = 0, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`} opacity="0.65">
      <path
        d="M 20 4 
           L 15 14 L 11 24 L 6 36 L 11 38 L 5 49 L 12 51 L 8 61 L 16 60 L 20 58 
           L 24 60 L 32 61 L 28 51 L 35 49 L 29 38 L 34 36 L 29 24 L 25 14 L 20 4 Z"
        fill="#466E53"
      />
      <path
        d="M 20 18 
           L 16 26 L 12 36 L 16 38 L 11 48 L 17 50 L 15 57 L 20 56 
           L 25 57 L 23 50 L 29 48 L 24 38 L 28 36 L 24 26 L 20 18 Z"
        fill="#5A8869"
        opacity="0.75"
      />
    </g>
  )
}

export default function AlpinePineTree({
  variant = "medium",
  className = "",
  scale = 1,
}: AlpinePineTreeProps) {
  // 1. Ancient Old-Growth Pine (Centerpiece for Trees Module & ancient clearings)
  if (variant === "ancient") {
    return (
      <svg
        viewBox="0 0 106 128"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${106 * scale}px`, height: `${128 * scale}px` }}
        fill="none"
      >
        <AncientPine x={4} y={2} scale={1} />
      </svg>
    )
  }

  // 2. Slender Spruce (Narrow, elegant alpine conifer)
  if (variant === "slender") {
    return (
      <svg
        viewBox="0 0 58 124"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${58 * scale}px`, height: `${124 * scale}px` }}
        fill="none"
      >
        <SlenderSpruce x={1} y={1} scale={1} toneOffset={0} />
      </svg>
    )
  }

  // 3. Windblown Krummholz Pine
  if (variant === "windblown") {
    return (
      <svg
        viewBox="0 0 88 106"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${88 * scale}px`, height: `${106 * scale}px` }}
        fill="none"
      >
        <WindblownPine x={2} y={2} scale={1} />
      </svg>
    )
  }

  // 4. Distant Misty Conifer
  if (variant === "distant") {
    return (
      <svg
        viewBox="0 0 42 78"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${42 * scale}px`, height: `${78 * scale}px` }}
        fill="none"
      >
        <DistantPine x={1} y={1} scale={1} />
      </svg>
    )
  }

  // 5. Lush 5-Tree Alpine Grove (Varied heights & species cluster)
  if (variant === "grove") {
    return (
      <svg
        viewBox="0 0 176 132"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${176 * scale}px`, height: `${132 * scale}px` }}
        fill="none"
      >
        {/* Distant back-left slender spruce */}
        <SlenderSpruce x={4} y={14} scale={0.76} toneOffset={0} />
        {/* Distant back-right dense fir */}
        <DenseFir x={96} y={18} scale={0.78} toneOffset={2} />
        {/* Midground left dense fir */}
        <DenseFir x={22} y={8} scale={0.92} toneOffset={1} />
        {/* Midground right slender spruce */}
        <SlenderSpruce x={90} y={6} scale={0.96} toneOffset={2} />
        {/* Foreground dominant center ancient conifer */}
        <DenseFir x={52} y={-2} scale={1.12} toneOffset={0} />
      </svg>
    )
  }

  // 6. Dense 3-tree Cluster (Midground Pasture Meadows)
  if (variant === "dense" || variant === "cluster") {
    return (
      <svg
        viewBox="0 0 120 120"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${120 * scale}px`, height: `${120 * scale}px` }}
        fill="none"
      >
        {/* Back-left slender spruce */}
        <SlenderSpruce x={2} y={14} scale={0.72} toneOffset={0} />
        {/* Back-right dense fir */}
        <DenseFir x={52} y={10} scale={0.80} toneOffset={2} />
        {/* Front center dense fir */}
        <DenseFir x={22} y={0} scale={1.02} toneOffset={1} />
      </svg>
    )
  }

  // 7. Stately Grand Conifer (Single large foreground conifer)
  if (variant === "grand" || variant === "tall") {
    return (
      <svg
        viewBox="0 0 80 120"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${80 * scale}px`, height: `${120 * scale}px` }}
        fill="none"
      >
        <DenseFir x={2} y={2} scale={1.08} toneOffset={1} />
      </svg>
    )
  }

  // 8. Small Single Conifer
  if (variant === "small") {
    return (
      <svg
        viewBox="0 0 54 82"
        className={`inline-block pointer-events-none select-none ${className}`}
        style={{ width: `${54 * scale}px`, height: `${82 * scale}px` }}
        fill="none"
      >
        <SlenderSpruce x={1} y={1} scale={0.68} toneOffset={2} />
      </svg>
    )
  }

  // 9. Medium Single Conifer (Default)
  return (
    <svg
      viewBox="0 0 78 116"
      className={`inline-block pointer-events-none select-none ${className}`}
      style={{ width: `${78 * scale}px`, height: `${116 * scale}px` }}
      fill="none"
    >
      <DenseFir x={1} y={1} scale={0.94} toneOffset={0} />
    </svg>
  )
}
