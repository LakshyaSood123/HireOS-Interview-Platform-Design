// Scenic hero for a Course Home. Composes the EXISTING alpine scenic components
// (mountains, cabin, pines, animals) unchanged, and adds only a small
// course-specific motif on top. No new scenic engine.

import AlpineMountainRange from "../forest/scenic/AlpineMountainRange"
import AlpineCabin from "../forest/scenic/AlpineCabin"
import AlpinePineTree from "../forest/scenic/AlpinePineTree"
import { MeadowCow, AlpineFawn, AlpineGoat } from "../forest/scenic/ScenicAnimals"
import type { CourseHeroVariant } from "../../learning/courseHomeConfig"

const SKY: Record<CourseHeroVariant, string> = {
  dsa: "from-[#DDEEEF] to-[#CFDFBA]",
  ml: "from-[#E1F0F5] to-[#D6E8C2]",
  "python-a": "from-[#F4EBD3] to-[#D9E5B8]",
  "python-b": "from-[#DAEAF3] to-[#D3E6C6]",
}

/** Data points joined by a trend line and a few connected nodes: the "data
 * and model" motif for the Machine Learning meadow. */
function DataMotif() {
  const pts = [
    [30, 70], [62, 58], [92, 62], [124, 44], [158, 40], [190, 26],
  ]
  return (
    <svg viewBox="0 0 220 90" className="absolute left-6 top-4 w-44 sm:w-56 opacity-80 pointer-events-none" fill="none" aria-hidden>
      <path d="M22 76 L198 22" stroke="#5B8854" strokeWidth="2" strokeDasharray="5 4" />
      {pts.map(([x, y], i) => (
        <g key={i}>
          {i > 0 && <line x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={x} y2={y} stroke="#9CC3A0" strokeWidth="1" />}
          <circle cx={x} cy={y} r="4.5" fill="#2F6747" opacity="0.85" />
        </g>
      ))}
    </svg>
  )
}

function Chip({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span className={`px-2.5 py-1 rounded-lg bg-white/70 border border-[#BDD4B6] text-[11px] font-black text-[#2F6747] font-mono ${className}`}>
      {children}
    </span>
  )
}

export default function CourseHero({ variant }: { variant: CourseHeroVariant }) {
  return (
    <div className={`relative w-full h-40 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-b ${SKY[variant]} border border-[#BDD4B6]`}>
      {variant === "ml" && <DataMotif />}
      {variant === "python-a" && (
        <div className="absolute left-6 top-5 flex flex-col gap-1.5 pointer-events-none">
          <Chip>{">>> print(\"hello\")"}</Chip>
          <Chip className="ml-4">{"for x in trail:"}</Chip>
        </div>
      )}
      {variant === "python-b" && (
        <div className="absolute left-6 top-5 flex items-center gap-1.5 pointer-events-none">
          <Chip>def</Chip>
          <span className="text-[#5B8854] font-black">›</span>
          <Chip>if</Chip>
          <span className="text-[#5B8854] font-black">›</span>
          <Chip>for</Chip>
        </div>
      )}

      <AlpineMountainRange className="absolute -bottom-6 inset-x-0 w-full" />

      {variant === "dsa" && (
        <>
          <div className="absolute right-8 bottom-3 z-10"><AlpineCabin scale={0.75} hasSmoke isGlow /></div>
          <div className="absolute left-8 bottom-2 z-10"><AlpinePineTree variant="cluster" scale={0.8} /></div>
          <div className="absolute right-28 bottom-2 z-10"><MeadowCow scale={0.7} /></div>
        </>
      )}
      {variant === "ml" && (
        <>
          <div className="absolute right-8 bottom-3 z-10"><AlpineCabin scale={0.75} variant="lookout" hasSmoke={false} isGlow /></div>
          <div className="absolute left-10 bottom-2 z-10"><AlpinePineTree variant="slender" scale={0.8} /></div>
          <div className="absolute right-32 bottom-2 z-10"><AlpineFawn scale={0.7} /></div>
        </>
      )}
      {variant === "python-a" && (
        <>
          <div className="absolute right-10 bottom-3 z-10"><AlpineCabin scale={0.7} variant="lodge" hasSmoke isGlow /></div>
          <div className="absolute left-8 bottom-2 z-10"><AlpinePineTree variant="grove" scale={0.8} /></div>
          <div className="absolute right-32 bottom-2 z-10"><AlpineFawn scale={0.65} /></div>
        </>
      )}
      {variant === "python-b" && (
        <>
          <div className="absolute right-10 bottom-3 z-10"><AlpineCabin scale={0.7} variant="stoneChalet" hasSmoke isGlow /></div>
          <div className="absolute left-8 bottom-2 z-10"><AlpinePineTree variant="medium" scale={0.9} /></div>
          <div className="absolute right-32 bottom-2 z-10"><AlpineGoat scale={0.65} /></div>
        </>
      )}
    </div>
  )
}
