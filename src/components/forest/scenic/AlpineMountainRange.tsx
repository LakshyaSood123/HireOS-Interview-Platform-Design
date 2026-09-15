interface AlpineMountainRangeProps {
  className?: string
}

export default function AlpineMountainRange({ className = "" }: AlpineMountainRangeProps) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className={`w-full h-full block pointer-events-none select-none ${className}`}
      fill="none"
    >
      <defs>
        {/* Sky gradient */}
        <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#D5ECED" />
          <stop offset="55%" stopColor="#D0E6D5" />
          <stop offset="100%" stopColor="#C2DDB0" />
        </linearGradient>

        {/* Sunlit Rock (warm sandstone/cream matching reference) */}
        <linearGradient id="sunlitRockFace" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#F5F7F0" />
          <stop offset="45%" stopColor="#E6EADF" />
          <stop offset="100%" stopColor="#CED5C6" />
        </linearGradient>

        {/* Shaded Rock (warm olive-taupe matching reference) */}
        <linearGradient id="shadedRockFace" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#A8B0A4" />
          <stop offset="55%" stopColor="#919A8E" />
          <stop offset="100%" stopColor="#788274" />
        </linearGradient>

        {/* Deep Crevice Shadows */}
        <linearGradient id="creviceShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#6D7867" />
          <stop offset="100%" stopColor="#505A49" />
        </linearGradient>

        {/* Distant Haze Mountain */}
        <linearGradient id="distantHaze" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C8DCC6" />
          <stop offset="100%" stopColor="#B2C5AE" />
        </linearGradient>

        {/* Deep Valley Sage Ridge */}
        <linearGradient id="deepValleyRidge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8DAE84" />
          <stop offset="100%" stopColor="#9EC094" />
        </linearGradient>

        {/* Midground Sage Foothills */}
        <linearGradient id="sageFoothills" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#96B88C" />
          <stop offset="100%" stopColor="#ABCBA0" />
        </linearGradient>

        {/* Rolling Green Ridge */}
        <linearGradient id="greenRidge" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A4C896" />
          <stop offset="100%" stopColor="#BAD7A8" />
        </linearGradient>

        {/* Lower Meadow Shelf */}
        <linearGradient id="lowerMeadowShelf" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B4D59C" />
          <stop offset="100%" stopColor="#C6E1AE" />
        </linearGradient>

        {/* Foreground Meadow Valley */}
        <linearGradient id="foregroundMeadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#BFDDA8" />
          <stop offset="100%" stopColor="#CEE6B4" />
        </linearGradient>
      </defs>

      {/* ── Background Sky Fill ── */}
      <rect width="1440" height="900" fill="url(#skyGrad)" />

      {/* ── 1. Distant Background Mountain Peaks ── */}
      <g opacity="0.42">
        <polygon points="180,340 280,180 340,240 400,190 540,380" fill="url(#distantHaze)" />
        <polygon points="280,180 262,208 280,218 298,202" fill="#FFFFFF" opacity="0.9" />
        <polygon points="400,190 384,214 400,224 416,210" fill="#FFFFFF" opacity="0.9" />

        <polygon points="860,380 980,170 1050,240 1140,150 1280,370" fill="url(#distantHaze)" />
        <polygon points="980,170 962,198 980,208 998,194" fill="#FFFFFF" opacity="0.9" />
        <polygon points="1140,150 1118,182 1140,194 1164,176" fill="#FFFFFF" opacity="0.9" />
      </g>

      {/* ── 2. Secondary Left Mountain Massif ── */}
      <g>
        <path
          d="M -60 580 
             L 120 380 
             L 260 210 
             L 360 310 
             L 440 260 
             L 560 410 
             L 640 580 Z"
          fill="url(#sunlitRockFace)"
        />
        <path
          d="M 260 210 
             L 310 285 
             L 360 310 
             L 410 390 
             L 490 490 
             L 580 580 
             L 420 580 
             L 260 210 Z"
          fill="url(#shadedRockFace)"
          opacity="0.75"
        />
        <path
          d="M 440 260 
             L 485 330 
             L 560 410 
             L 640 580 
             L 560 580 
             L 440 260 Z"
          fill="url(#shadedRockFace)"
          opacity="0.85"
        />
        {/* Left Snow Caps */}
        <path
          d="M 260 210 
             L 205 285 
             Q 224 278, 238 294 
             Q 250 308, 260 286 
             L 274 300 
             Q 292 316, 306 290 
             L 332 308 
             L 260 210 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 260 210 L 260 286 L 274 300 Q 292 316, 306 290 L 332 308 L 260 210 Z"
          fill="#EAF1E7"
        />
        <path
          d="M 440 260 
             L 404 310 
             Q 422 300, 436 316 
             Q 448 326, 460 306 
             L 482 318 
             L 440 260 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* ── 3. Secondary Right Mountain Massif ── */}
      <g>
        <path
          d="M 800 600 
             L 920 390 
             L 1040 190 
             L 1130 290 
             L 1240 220 
             L 1360 380 
             L 1480 580 Z"
          fill="url(#sunlitRockFace)"
        />
        <path
          d="M 1040 190 
             L 1080 265 
             L 1130 290 
             L 1180 375 
             L 1260 480 
             L 1360 600 
             L 1180 600 
             L 1040 190 Z"
          fill="url(#shadedRockFace)"
          opacity="0.8"
        />
        <path
          d="M 1240 220 
             L 1285 295 
             L 1360 380 
             L 1480 580 
             L 1360 580 
             L 1240 220 Z"
          fill="url(#shadedRockFace)"
          opacity="0.88"
        />
        {/* Right Snow Caps */}
        <path
          d="M 1040 190 
             L 980 275 
             Q 1002 265, 1016 282 
             Q 1030 294, 1040 274 
             L 1054 288 
             Q 1074 306, 1088 280 
             L 1114 298 
             L 1040 190 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 1040 190 L 1040 274 L 1054 288 Q 1074 306, 1088 280 L 1114 298 L 1040 190 Z"
          fill="#EAF1E7"
        />
        <path
          d="M 1240 220 
             L 1198 280 
             Q 1218 272, 1234 290 
             L 1250 274 
             Q 1270 294, 1286 276 
             L 1308 290 
             L 1240 220 Z"
          fill="#FFFFFF"
        />
      </g>

      {/* ── 4. Dominant Hero Centerpiece Massif ── */}
      <g>
        {/* Sunlit West Face */}
        <path
          d="M 400 640 
             L 530 380 
             L 630 210 
             L 700 70 
             L 700 640 Z"
          fill="url(#sunlitRockFace)"
        />
        {/* Shaded East Face */}
        <path
          d="M 700 70 
             L 770 205 
             L 860 360 
             L 1000 640 
             L 700 640 Z"
          fill="url(#shadedRockFace)"
        />
        {/* Crevice Shadows */}
        <path
          d="M 700 70 
             L 690 170 
             L 675 255 
             L 655 365 
             L 620 490 
             L 580 640 
             L 700 640 Z"
          fill="url(#creviceShadow)"
          opacity="0.32"
        />
        <path
          d="M 770 205 
             L 795 305 
             L 830 415 
             L 890 560 
             L 860 360 Z"
          fill="#566251"
          opacity="0.4"
        />

        {/* Center Summit Pyramid Snow Crown */}
        <path
          d="M 700 70 
             L 638 178 
             Q 658 168, 672 190 
             Q 684 206, 696 186 
             L 700 190 
             Q 712 212, 730 184 
             Q 744 168, 762 198 
             L 788 175 
             L 700 70 Z"
          fill="#FFFFFF"
        />
        {/* Western Cascading Snow Couloirs */}
        <path
          d="M 638 178 
             L 585 275 
             Q 608 260, 622 290 
             Q 638 310, 654 278 
             L 670 288 
             L 672 190 
             Q 658 168, 638 178 Z"
          fill="#FFFFFF"
        />
        <path
          d="M 585 275 
             L 540 355 
             Q 560 342, 574 370 
             L 596 338 
             L 622 290 
             Q 608 260, 585 275 Z"
          fill="#FFFFFF"
        />
        {/* Eastern Shaded Snow Couloirs */}
        <path
          d="M 700 190 
             L 700 305 
             Q 718 328, 736 298 
             Q 752 278, 768 316 
             L 800 288 
             L 788 175 
             Q 762 198, 744 168 
             Q 730 184, 712 212 
             L 700 190 Z"
          fill="#EAF1E7"
        />
        <path
          d="M 736 298 
             L 760 385 
             Q 782 360, 804 398 
             L 820 364 
             L 800 288 
             Q 768 316, 752 278 
             L 736 298 Z"
          fill="#DEECE0"
        />
      </g>

      {/* ── 5. Layer 1: Deep Valley Sage Ridge ── */}
      <path
        d="M -40 620 
           Q 220 460, 540 510 
           Q 880 560, 1220 460 
           Q 1340 430, 1480 490 
           L 1480 900 
           L -40 900 Z"
        fill="url(#deepValleyRidge)"
      />

      {/* ── 6. Layer 2: Midground Sage Foothills ── */}
      <path
        d="M -40 580 
           Q 260 490, 600 555 
           Q 940 620, 1260 520 
           Q 1370 480, 1480 545 
           L 1480 900 
           L -40 900 Z"
        fill="url(#sageFoothills)"
      />
      <path
        d="M -40 580 Q 260 490, 600 555 Q 940 620, 1260 520 Q 1370 480, 1480 545"
        stroke="#C5E2B6"
        strokeWidth="3"
        opacity="0.55"
      />

      {/* ── 7. Layer 3: Rolling Green Ridge ── */}
      <path
        d="M -40 640 
           Q 300 550, 660 625 
           Q 1020 695, 1320 590 
           Q 1400 560, 1480 610 
           L 1480 900 
           L -40 900 Z"
        fill="url(#greenRidge)"
      />
      <path
        d="M -40 640 Q 300 550, 660 625 Q 1020 695, 1320 590 Q 1400 560, 1480 610"
        stroke="#D1EDB8"
        strokeWidth="3.5"
        opacity="0.65"
      />

      {/* ── 8. Layer 4: Lower Meadow Shelf ── */}
      <path
        d="M -40 710 
           Q 340 630, 720 700 
           Q 1080 770, 1480 670 
           L 1480 900 
           L -40 900 Z"
        fill="url(#lowerMeadowShelf)"
      />
      <path
        d="M -40 710 Q 340 630, 720 700 Q 1080 770, 1480 670"
        stroke="#DAF2C0"
        strokeWidth="3.5"
        opacity="0.75"
      />

      {/* ── 9. Layer 5: Foreground Meadow Valley ── */}
      <path
        d="M -40 780 
           Q 380 720, 780 775 
           Q 1140 830, 1480 750 
           L 1480 900 
           L -40 900 Z"
        fill="url(#foregroundMeadow)"
      />
      <path
        d="M -40 780 Q 380 720, 780 775 Q 1140 830, 1480 750"
        stroke="#E2F7C8"
        strokeWidth="4"
        opacity="0.85"
      />
    </svg>
  )
}
