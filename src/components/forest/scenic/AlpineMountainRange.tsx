interface AlpineMountainRangeProps {
  className?: string
}

/* 
  Stylized Photorealistic Alpine Environment:
  - Irregular craggy mountain massifs with geological strata, couloirs, and atmospheric morning haze
  - True mountain saddle col at center providing the scenic corridor for Highland Mountain Pass (Zone 2)
  - Rich undulating alpine meadows with grass texture, wildflower carpets, glacial erratics, and juniper shrubs
*/

export default function AlpineMountainRange({ className = "" }: AlpineMountainRangeProps) {
  return (
    <svg
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className={`w-full h-full block pointer-events-none select-none ${className}`}
      fill="none"
    >
      <defs>
        {/* Soft Alpine Morning Sky with atmospheric aerial perspective */}
        <linearGradient id="skyGrad" x1="25%" y1="0%" x2="75%" y2="100%">
          <stop offset="0%" stopColor="#C4E0E8" />
          <stop offset="35%" stopColor="#BDDED6" />
          <stop offset="70%" stopColor="#B3D7BE" />
          <stop offset="100%" stopColor="#A8CFB0" />
        </linearGradient>

        {/* Directional Morning Sunlight from Upper-Left */}
        <radialGradient id="morningSunGlow" cx="20%" cy="12%" r="65%">
          <stop offset="0%" stopColor="#FFFEE8" stopOpacity="0.55" />
          <stop offset="35%" stopColor="#E4F2E6" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#C4E0E8" stopOpacity="0" />
        </radialGradient>

        {/* ── Realistic Alpine Granite Rock Shaders (Atmospheric Sunlit vs Shaded Slate) ── */}
        <linearGradient id="sunlitGranite" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#D2E0D0" />
          <stop offset="30%" stopColor="#BFCEBD" />
          <stop offset="70%" stopColor="#A4B5A2" />
          <stop offset="100%" stopColor="#8C9E8A" />
        </linearGradient>

        <linearGradient id="graniteFacetHighlight" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#EAF3E9" />
          <stop offset="40%" stopColor="#D5E4D4" />
          <stop offset="100%" stopColor="#B5C6B4" />
        </linearGradient>

        {/* Soft atmospheric shaded granite - never pitch black */}
        <linearGradient id="shadedGranite" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#8D9E8E" />
          <stop offset="40%" stopColor="#788B79" />
          <stop offset="75%" stopColor="#677868" />
          <stop offset="100%" stopColor="#556656" />
        </linearGradient>

        <linearGradient id="deepFissureShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4E5E4F" />
          <stop offset="50%" stopColor="#3C4A3D" />
          <stop offset="100%" stopColor="#2E3A2F" />
        </linearGradient>

        {/* Distant Atmospheric Peak Haze (Through the Mountain Pass) */}
        <linearGradient id="distantHazePeaks" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C7DDD0" />
          <stop offset="50%" stopColor="#B0CCA0" />
          <stop offset="100%" stopColor="#96B8A5" />
        </linearGradient>

        {/* Cloud Pass Swirling Mist Gradient */}
        <linearGradient id="colMist" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#E6F2EB" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#CFE3D7" stopOpacity="0" />
        </linearGradient>

        {/* ── Distinct Alpine Snow Shaders with Windblown Couloirs ── */}
        <linearGradient id="snowSunlit" x1="15%" y1="0%" x2="85%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="50%" stopColor="#F7FAF6" />
          <stop offset="100%" stopColor="#E2ECE3" />
        </linearGradient>

        <linearGradient id="snowShadow" x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#D9E6DB" />
          <stop offset="60%" stopColor="#BFD2C5" />
          <stop offset="100%" stopColor="#A5BAAC" />
        </linearGradient>

        {/* ── Textured Alpine Meadows with Pasture Gradients ── */}
        <linearGradient id="meadow1" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#698D5E" />
          <stop offset="40%" stopColor="#7A9E6E" />
          <stop offset="100%" stopColor="#8BAF7E" />
        </linearGradient>

        <linearGradient id="meadow2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7A9E6E" />
          <stop offset="40%" stopColor="#8CB180" />
          <stop offset="100%" stopColor="#9DC290" />
        </linearGradient>

        <linearGradient id="meadow3" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#89AD7B" />
          <stop offset="40%" stopColor="#9BC08D" />
          <stop offset="100%" stopColor="#ADD39F" />
        </linearGradient>

        <linearGradient id="meadow4" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#97BC85" />
          <stop offset="40%" stopColor="#A9CE97" />
          <stop offset="100%" stopColor="#BBDFB9" />
        </linearGradient>

        <linearGradient id="meadow5" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#A6CE90" />
          <stop offset="40%" stopColor="#BCE3A6" />
          <stop offset="100%" stopColor="#D0F2B6" />
        </linearGradient>

        {/* ── Natural Texture Filters ── */}
        <filter id="rockGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.07" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0.33 0.33 0.33 0 0  0 0 0 0.12 0" result="grayNoise" />
          <feComposite in="SourceGraphic" in2="grayNoise" operator="over" />
        </filter>

        <filter id="meadowGrain" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.07 0.07" numOctaves="2" result="noise" />
          <feColorMatrix type="matrix" values="0.2 0.3 0.1 0 0  0.2 0.3 0.1 0 0  0.2 0.3 0.1 0 0  0 0 0 0.08 0" result="grassNoise" />
          <feComposite in="SourceGraphic" in2="grassNoise" operator="over" />
        </filter>
      </defs>

      {/* ── 0. Sky Fill & Directional Morning Atmosphere ── */}
      <rect width="1440" height="900" fill="url(#skyGrad)" />
      <rect width="1440" height="900" fill="url(#morningSunGlow)" />

      {/* ══════════════════════════════════════════════════════════════════════
          1. DISTANT ALPINE CHAINS & PASS SADDLE OPENING
          Distant misty mountain ranges visible receding through the pass saddle
          ══════════════════════════════════════════════════════════════════════ */}
      <g opacity="0.6">
        {/* Deep background range 1 */}
        <path
          d="M 500 420 
             C 540 370, 580 340, 615 350 
             C 645 315, 680 280, 715 300 
             C 745 265, 775 295, 805 330 
             C 840 380, 885 415, 930 440 Z"
          fill="url(#distantHazePeaks)"
        />
        <path d="M 680 280 L 715 300 L 705 315 Z" fill="#FFFFFF" opacity="0.75" />
        <path d="M 745 265 L 775 295 L 760 305 Z" fill="#FFFFFF" opacity="0.75" />

        {/* Far Left Sawtooth Ridge */}
        <path
          d="M -20 460 
             C 40 400, 90 350, 130 340 
             C 165 350, 195 305, 230 285 
             C 265 305, 295 250, 325 240 
             C 355 230, 385 260, 420 275 
             C 455 250, 490 310, 530 375 Z"
          fill="url(#distantHazePeaks)"
        />
        <path d="M 325 240 L 345 260 L 320 265 Z" fill="#FFFFFF" opacity="0.75" />

        {/* Far Right Distant Summit Crest */}
        <path
          d="M 870 430 
             C 920 345, 970 290, 1020 260 
             C 1060 275, 1100 215, 1145 190 
             C 1185 230, 1225 210, 1265 245 
             C 1320 310, 1380 380, 1460 430 Z"
          fill="url(#distantHazePeaks)"
        />
        <path d="M 1145 190 L 1170 215 L 1140 220 Z" fill="#FFFFFF" opacity="0.75" />
      </g>

      {/* ══════════════════════════════════════════════════════════════════════
          2. WESTERN MOUNTAIN MASSIF (Natural Crags, Arêtes & Couloirs)
          Backdrop for Foundations, Linked Structures & Recursion
          ══════════════════════════════════════════════════════════════════════ */}
      <g filter="url(#rockGrain)">
        {/* Main Western Massif Sunlit Face */}
        <path
          d="M -40 620 
             C 25 490, 75 435, 115 425 
             C 145 430, 170 370, 205 360 
             C 235 370, 255 290, 280 220 
             C 295 195, 315 190, 325 205 
             C 342 240, 365 225, 390 260 
             C 415 240, 445 285, 475 320 
             C 520 380, 565 440, 610 490 
             C 645 525, 675 545, 700 575 
             L 700 650 L -40 650 Z"
          fill="url(#sunlitGranite)"
        />

        {/* Stepped Granite Highlight Facets (Morning Light) */}
        <path
          d="M 325 205 
             C 305 255, 280 305, 255 355 
             C 280 365, 305 325, 330 280 Z"
          fill="url(#graniteFacetHighlight)"
          opacity="0.65"
        />
        <path
          d="M 205 360 
             C 180 410, 155 455, 125 495 
             C 150 503, 180 460, 210 415 Z"
          fill="url(#graniteFacetHighlight)"
          opacity="0.5"
        />

        {/* Shaded Northeast Rock Buttress (Softer alpine shadow with aerial haze) */}
        <path
          d="M 325 205 
             C 342 240, 365 225, 390 260 
             C 415 240, 445 285, 475 320 
             C 520 380, 565 440, 610 490 
             C 645 525, 675 545, 700 575 
             L 650 575 
             C 580 490, 500 400, 440 330 
             C 385 270, 345 225, 325 205 Z"
          fill="url(#shadedGranite)"
          opacity="0.65"
        />

        {/* Terraced Rock Ledges breaking up the face */}
        <path
          d="M 390 260 
             C 410 290, 435 340, 470 395 
             C 510 450, 550 495, 590 525 
             L 560 540 
             C 510 470, 460 395, 420 325 Z"
          fill="url(#deepFissureShadow)"
          opacity="0.35"
        />

        {/* Geological Strata & Fracture Lines */}
        <path d="M 175 375 C 215 355, 255 370, 295 350" stroke="#5A6D5C" strokeWidth="1.6" opacity="0.38" strokeLinecap="round" />
        <path d="M 135 430 C 185 405, 235 420, 285 400" stroke="#5A6D5C" strokeWidth="1.5" opacity="0.35" strokeLinecap="round" />
        <path d="M 345 310 C 390 290, 435 310, 480 292" stroke="#4A5C4C" strokeWidth="1.6" opacity="0.38" strokeLinecap="round" />
        <path d="M 395 385 C 450 365, 505 385, 560 365" stroke="#4A5C4C" strokeWidth="1.6" opacity="0.35" strokeLinecap="round" />

        {/* Natural Glacial Snow Couloirs (Packed into rock gullies) */}
        <path
          d="M 325 205 
             C 305 240, 275 265, 255 278 
             C 268 272, 285 285, 300 274 
             C 310 290, 322 276, 335 288 
             C 348 300, 360 280, 372 292 
             L 345 245 Z"
          fill="url(#snowSunlit)"
        />
        <path
          d="M 325 205 
             L 345 245 
             C 358 265, 368 275, 372 292 
             C 355 298, 338 274, 330 255 Z"
          fill="url(#snowShadow)"
        />
        <path
          d="M 390 260 
             C 375 285, 388 302, 400 295 
             C 412 310, 425 294, 438 308 
             L 415 275 Z"
          fill="url(#snowSunlit)"
        />
      </g>

      {/* ══════════════════════════════════════════════════════════════════════
          3. EASTERN MOUNTAIN MASSIF (Summit Horn & Rock Ledges)
          Backdrop for Graphs, DP & Algorithm Summit
          ══════════════════════════════════════════════════════════════════════ */}
      <g filter="url(#rockGrain)">
        {/* Main Eastern Massif Sunlit Southwest Face */}
        <path
          d="M 710 575 
             C 760 475, 800 425, 840 405 
             C 870 415, 900 325, 935 215 
             C 950 155, 965 130, 975 135 
             C 990 160, 1015 200, 1045 195 
             C 1075 240, 1115 260, 1155 270 
             C 1205 220, 1255 280, 1310 355 
             C 1380 435, 1430 515, 1480 575 
             L 1480 650 L 710 650 Z"
          fill="url(#sunlitGranite)"
        />

        {/* Summit Apex High Facet (Sharp pyramid crest of Algorithm Summit) */}
        <path
          d="M 975 135 
             C 955 185, 938 230, 920 275 
             C 955 265, 988 235, 1015 205 Z"
          fill="url(#graniteFacetHighlight)"
          opacity="0.7"
        />

        {/* Shaded Eastern Ridge Buttress (Atmospheric, not harsh) */}
        <path
          d="M 975 135 
             C 990 160, 1015 200, 1045 195 
             C 1075 240, 1115 260, 1155 270 
             C 1205 220, 1255 280, 1310 355 
             C 1380 435, 1430 515, 1480 575 
             L 1350 575 
             C 1250 480, 1170 350, 1100 280 
             C 1040 210, 995 155, 975 135 Z"
          fill="url(#shadedGranite)"
          opacity="0.65"
        />

        {/* Exposed Rock Platforms Anchoring High Checkpoints */}
        <path
          d="M 940 168 C 960 165, 990 165, 1010 168 L 1000 186 C 980 184, 960 184, 950 186 Z"
          fill="#667764"
          stroke="#425241"
          strokeWidth="1.2"
        />
        <path
          d="M 1050 296 C 1080 294, 1115 294, 1140 296 L 1130 320 C 1105 318, 1075 318, 1060 320 Z"
          fill="#667764"
          stroke="#425241"
          strokeWidth="1.2"
        />
        <path
          d="M 890 388 C 915 385, 950 385, 975 388 L 965 412 C 940 410, 915 410, 900 412 Z"
          fill="#5D6E5B"
          stroke="#3D4D3C"
          strokeWidth="1.2"
        />

        {/* Geological Fracture Lines */}
        <path d="M 875 430 C 920 410, 965 425, 1010 405" stroke="#526350" strokeWidth="1.6" opacity="0.38" strokeLinecap="round" />
        <path d="M 1035 305 C 1080 290, 1125 307, 1170 291" stroke="#425240" strokeWidth="1.6" opacity="0.38" strokeLinecap="round" />

        {/* Glacial Snow Cornices on Algorithm Summit */}
        <path
          d="M 975 135 
             C 948 175, 932 200, 920 212 
             C 938 204, 954 224, 968 210 
             C 982 228, 998 210, 1012 224 
             L 1015 205 Z"
          fill="url(#snowSunlit)"
        />
        <path
          d="M 975 135 
             L 1015 205 
             C 1005 220, 1010 224, 1010 224 
             C 996 210, 988 175, 975 135 Z"
          fill="url(#snowShadow)"
        />

        {/* DP Ridge Snow Couloir */}
        <path
          d="M 1045 195 
             C 1015 240, 1002 260, 1015 268 
             C 1030 254, 1045 276, 1060 260 
             C 1072 278, 1086 264, 1098 280 
             L 1045 195 Z"
          fill="url(#snowSunlit)"
        />
      </g>

      {/* ══════════════════════════════════════════════════════════════════════
          4. THE CLOUD PASS SADDLE (Natural Col between the two massifs)
          The gateway to Zone 2 with drifting mountain mist
          ══════════════════════════════════════════════════════════════════════ */}
      <ellipse cx="680" cy="380" rx="190" ry="70" fill="url(#colMist)" />
      <ellipse cx="710" cy="360" rx="140" ry="50" fill="url(#colMist)" />

      {/* ══════════════════════════════════════════════════════════════════════
          5. RICH, TEXTURED ALPINE MEADOWS (5 ORGANIC PASTURE TIERS)
          Deep terrain undulation, grass ridges, wildflower patches & boulders
          ══════════════════════════════════════════════════════════════════════ */}
      <g filter="url(#meadowGrain)">
        {/* ── Layer 1: High Alpine Pasture Shelf (Below Peaks & Pass) ── */}
        <path
          d="M -40 570 
             C 150 480, 330 465, 520 500 
             C 710 535, 910 515, 1120 460 
             C 1260 425, 1370 448, 1480 478 
             L 1480 900 
             L -40 900 Z"
          fill="url(#meadow1)"
        />
        <path
          d="M -40 570 C 150 480, 330 465, 520 500 C 710 535, 910 515, 1120 460 C 1260 425, 1370 448, 1480 478"
          stroke="#9DC392"
          strokeWidth="2.2"
          opacity="0.55"
        />

        {/* ── Layer 2: Midground Terraced Pasture (Behind Trees Lodge & Recursion) ── */}
        <path
          d="M -40 540 
             C 160 480, 360 472, 520 502 
             C 660 532, 860 558, 1100 518 
             C 1240 492, 1370 462, 1480 502 
             L 1480 900 
             L -40 900 Z"
          fill="url(#meadow2)"
        />
        <path
          d="M -40 540 C 160 480, 360 472, 520 502 C 660 532, 860 558, 1100 518 C 1240 492, 1370 462, 1480 502"
          stroke="#B5DBA2"
          strokeWidth="2.4"
          opacity="0.6"
        />
        {/* Hillside contour folds & grass swales */}
        <path
          d="M 140 510 C 270 490, 390 494, 510 512"
          stroke="#688E5E"
          strokeWidth="1.6"
          opacity="0.38"
          strokeDasharray="45 15 30 12"
        />
        <path
          d="M 760 550 C 910 535, 1050 515, 1210 494"
          stroke="#688E5E"
          strokeWidth="1.6"
          opacity="0.38"
          strokeDasharray="50 16 35 14"
        />

        {/* ── Layer 3: Rolling Green Ridge (Under Linked Structures Brook) ── */}
        <path
          d="M -40 600 
             C 180 538, 400 532, 620 588 
             C 840 642, 1080 612, 1280 552 
             C 1380 525, 1430 545, 1480 572 
             L 1480 900 
             L -40 900 Z"
          fill="url(#meadow3)"
        />
        <path
          d="M -40 600 C 180 538, 400 532, 620 588 C 840 642, 1080 612, 1280 552 C 1380 525, 1430 545, 1480 572"
          stroke="#C5EBAA"
          strokeWidth="2.6"
          opacity="0.65"
        />
        <path
          d="M 280 555 C 410 545, 540 560, 670 595"
          stroke="#749867"
          strokeWidth="1.5"
          opacity="0.32"
          strokeDasharray="40 14 25 12"
        />

        {/* ── Layer 4: Lower Pasture Terrace (Platform for Foundations Trailhead) ── */}
        <path
          d="M -40 670 
             C 220 610, 460 605, 700 660 
             C 940 715, 1200 685, 1480 625 
             L 1480 900 
             L -40 900 Z"
          fill="url(#meadow4)"
        />
        <path
          d="M -40 670 C 220 610, 460 605, 700 660 C 940 715, 1200 685, 1480 625"
          stroke="#CFEEAF"
          strokeWidth="2.8"
          opacity="0.7"
        />
        <path
          d="M 80 640 C 250 608, 420 615, 590 645"
          stroke="#81A374"
          strokeWidth="1.4"
          opacity="0.3"
          strokeDasharray="35 12 25 10"
        />

        {/* ── Layer 5: Foreground Alpine Basin Meadow ── */}
        <path
          d="M -40 740 
             C 260 695, 540 695, 760 740 
             C 1020 790, 1260 760, 1480 710 
             L 1480 900 
             L -40 900 Z"
          fill="url(#meadow5)"
        />
        <path
          d="M -40 740 C 260 695, 540 695, 760 740 C 1020 790, 1260 760, 1480 710"
          stroke="#DCF6BA"
          strokeWidth="3.2"
          opacity="0.8"
        />
      </g>

      {/* ── 6. Natural Geological Fieldstones, Wildflower Carpets & Shrub Masses ── */}
      <g opacity="0.85">
        {/* Glacial Erratic Granite Boulders with Directional Sunlight & Contact Shadows */}
        <ellipse cx="190" cy="735" rx="9.5" ry="4.2" fill="#142416" opacity="0.3" />
        <ellipse cx="190" cy="731.5" rx="8" ry="4" fill="#627260" />
        <ellipse cx="187.5" cy="729.5" rx="6" ry="2.6" fill="#889886" />

        <ellipse cx="490" cy="664" rx="8" ry="3.6" fill="#142416" opacity="0.3" />
        <ellipse cx="490" cy="661" rx="6.5" ry="3.3" fill="#627260" />
        <ellipse cx="487.5" cy="659.2" rx="4.8" ry="2.2" fill="#889886" />

        <ellipse cx="980" cy="724" rx="10.5" ry="4.8" fill="#142416" opacity="0.3" />
        <ellipse cx="980" cy="721" rx="9" ry="4.4" fill="#627260" />
        <ellipse cx="977.5" cy="719" rx="6.5" ry="2.8" fill="#889886" />

        {/* Alpine Wildflower Colonies (Yellow Buttercups, Blue Gentians & Ivory Edelweiss) */}
        {/* Cluster 1: Near left lower meadow */}
        <circle cx="170" cy="740" r="1.8" fill="#FCD34D" />
        <circle cx="174" cy="742" r="1.5" fill="#FFFFFF" />
        <circle cx="178" cy="739" r="1.7" fill="#60A5FA" />
        <circle cx="182" cy="741" r="1.4" fill="#FCD34D" />
        <circle cx="176" cy="744" r="1.6" fill="#FCD34D" />

        {/* Cluster 2: Near center swale */}
        <circle cx="470" cy="670" r="1.8" fill="#FFFFFF" />
        <circle cx="474" cy="673" r="1.6" fill="#FCD34D" />
        <circle cx="479" cy="669" r="1.8" fill="#60A5FA" />
        <circle cx="483" cy="671" r="1.5" fill="#FFFFFF" />

        {/* Cluster 3: Near right pasture cow */}
        <circle cx="960" cy="730" r="1.8" fill="#FCD34D" />
        <circle cx="965" cy="733" r="1.6" fill="#60A5FA" />
        <circle cx="970" cy="729" r="1.8" fill="#FFFFFF" />
        <circle cx="974" cy="732" r="1.5" fill="#FCD34D" />

        {/* Alpine Juniper Bush Clusters with Foliage Highlights */}
        <ellipse cx="230" cy="655" rx="12" ry="6" fill="#2E4629" />
        <ellipse cx="228" cy="653" rx="9" ry="4.2" fill="#3F6038" />
        <ellipse cx="226" cy="651.5" rx="5.5" ry="2.6" fill="#58824E" />

        <ellipse cx="610" cy="705" rx="15" ry="6.5" fill="#2E4629" />
        <ellipse cx="608" cy="703" rx="11" ry="4.8" fill="#3F6038" />
        <ellipse cx="606" cy="701" rx="6.5" ry="3.2" fill="#58824E" />

        <ellipse cx="1060" cy="665" rx="13" ry="6" fill="#2E4629" />
        <ellipse cx="1058" cy="663" rx="9.5" ry="4.2" fill="#3F6038" />
        <ellipse cx="1056" cy="661" rx="5.5" ry="2.6" fill="#58824E" />
      </g>
    </svg>
  )
}
