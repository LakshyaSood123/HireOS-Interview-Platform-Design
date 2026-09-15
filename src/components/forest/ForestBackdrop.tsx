import { useMemo } from "react"

interface ForestBackdropProps {
  intensity?: "deep" | "ambient" | "subtle"
  showCanopy?: boolean
  showParticles?: boolean
  className?: string
}

export default function ForestBackdrop({
  intensity = "ambient",
  showCanopy = true,
  showParticles = true,
  className = "",
}: ForestBackdropProps) {
  const particles = useMemo(
    () =>
      [...Array(14)].map((_, i) => ({
        id: i,
        left: `${(i * 7.5 + 4) % 96}%`,
        top: `${(i * 13 + 8) % 90}%`,
        size: (i % 3) * 1.5 + 2.5,
        duration: 4.5 + (i % 5) * 1.8,
        delay: (i % 4) * 0.9,
      })),
    [],
  )

  const bgGrad =
    intensity === "deep"
      ? "from-[#05140F] via-[#092218] to-[#04100C]"
      : intensity === "subtle"
      ? "from-[#0A261B] via-[#0E3325] to-[#081F16]"
      : "from-[#071A14] via-[#0D2D21] to-[#061711]"

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Background radial atmosphere */}
      <div className={`absolute inset-0 bg-gradient-to-b ${bgGrad}`} />

      {/* Bioluminescent soft glow radials */}
      <div
        className="absolute -top-32 left-1/4 w-96 h-96 rounded-full bg-[#1DB584]/15 blur-3xl"
        style={{ filter: "blur(90px)" }}
      />
      <div
        className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#10B981]/10 blur-3xl"
        style={{ filter: "blur(80px)" }}
      />
      <div
        className="absolute top-1/2 left-3/4 w-72 h-72 rounded-full bg-[#587A3A]/15 blur-3xl"
        style={{ filter: "blur(70px)" }}
      />

      {/* Ambient drifting mist layers */}
      <div className="absolute inset-0 opacity-25 animate-fog bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent" />

      {/* Canopy Silhouettes at top */}
      {showCanopy && (
        <svg
          className="absolute -top-2 left-0 right-0 w-full h-36 opacity-30 text-[#04100C]"
          viewBox="0 0 1440 180"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,0 L1440,0 L1440,65 Q1350,110 1260,70 Q1160,130 1060,85 Q940,140 820,80 Q700,120 580,75 Q460,135 340,80 Q200,125 100,70 Q40,100 0,60 Z" />
          <path
            d="M0,0 L1440,0 L1440,40 Q1380,85 1300,50 Q1190,95 1080,55 Q950,90 840,45 Q720,80 610,50 Q490,90 380,55 Q240,85 120,45 Q50,70 0,40 Z"
            opacity="0.6"
          />
        </svg>
      )}

      {/* Floating bioluminescent spores / motes */}
      {showParticles &&
        particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-[#1DB584]/60 shadow-[0_0_8px_#1DB584]"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `spore-float ${p.duration}s ease-in-out infinite ${p.delay}s`,
            }}
          />
        ))}
    </div>
  )
}
