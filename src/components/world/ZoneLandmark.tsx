import type { LandmarkType } from "../../learning/scenic/types"
import type { ProgressState } from "../../learning/types"
import AlpineCabin from "../forest/scenic/AlpineCabin"
import AlpinePineTree from "../forest/scenic/AlpinePineTree"

interface ZoneLandmarkProps {
  landmarkType: LandmarkType
  state: ProgressState
  label: string
  scale?: number
}

/** Progress-state visual treatment, applied uniformly to every landmark
 * type in one place (PART 13) rather than re-implemented per landmark:
 * locked = desaturated/fogged, available = clear daylight, current = warm
 * glow, completed/mastered = clean and lit, mastered gets a small extra
 * marker rather than a big gold effect. */
function treatmentFor(state: ProgressState) {
  switch (state) {
    case "locked":
      return { filter: "grayscale(0.65) brightness(0.72)", opacity: 0.58 }
    case "available":
      return { filter: "saturate(0.95)", opacity: 0.94 }
    case "current":
      return { filter: "saturate(1.1) brightness(1.04)", opacity: 1 }
    case "completed":
    case "mastered":
      return { filter: "none", opacity: 1 }
  }
}

function TwinCrossingBridge() {
  return (
    <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
      <ellipse cx="50" cy="48" rx="44" ry="7" fill="#182817" opacity="0.22" />
      <path d="M6 34 Q26 28 34 38 L30 50 L6 50 Z" fill="#759864" />
      <path d="M70 38 Q78 28 94 34 L94 50 L72 50 Z" fill="#759864" />
      <path d="M18 40 C34 34 66 34 82 40" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" opacity="0.75" />
      <path d="M24 39 C38 35 62 35 76 39" stroke="#93C5FD" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <path d="M24 32 Q50 20 76 32" stroke="#522F17" strokeWidth="4" strokeLinecap="round" />
      {/* Twin pointer stones — the module's namesake metaphor */}
      <g>
        <ellipse cx="20" cy="30" rx="4.5" ry="3.5" fill="#5A6D57" stroke="#3C463A" strokeWidth="0.8" />
        <ellipse cx="20" cy="26" rx="3" ry="2.4" fill="#7A9376" />
      </g>
      <g>
        <ellipse cx="80" cy="30" rx="4.5" ry="3.5" fill="#5A6D57" stroke="#3C463A" strokeWidth="0.8" />
        <ellipse cx="80" cy="26" rx="3" ry="2.4" fill="#7A9376" />
      </g>
    </svg>
  )
}

function ForkedBridge() {
  return (
    <svg viewBox="0 0 100 64" className="w-20 h-13" fill="none">
      <ellipse cx="50" cy="54" rx="42" ry="7" fill="#182817" opacity="0.22" />
      {/* One trail entering, splitting into two diverging timber paths —
       * the backtrack/undo metaphor: try one branch, retreat, try the other. */}
      <path d="M50 56 L50 40" stroke="#7C6650" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
      <path d="M50 40 Q30 30 14 14" stroke="#522F17" strokeWidth="3.6" strokeLinecap="round" />
      <path d="M50 40 Q70 30 86 14" stroke="#522F17" strokeWidth="3.6" strokeLinecap="round" opacity="0.55" strokeDasharray="2 3" />
      <circle cx="50" cy="40" r="4" fill="#3B1F0E" />
      <circle cx="14" cy="14" r="3" fill="#1DB584" />
      <circle cx="86" cy="14" r="3" fill="#94A3B8" opacity="0.7" />
    </svg>
  )
}

function StreamSluice() {
  return (
    <svg viewBox="0 0 100 64" className="w-20 h-13" fill="none">
      <ellipse cx="50" cy="52" rx="42" ry="7" fill="#182817" opacity="0.22" />
      <path d="M0 44 C24 38 76 38 100 44 L100 56 L0 56 Z" fill="#0284C7" opacity="0.32" />
      <path d="M4 42 C26 37 74 37 96 42" stroke="#38BDF8" strokeWidth="3.4" strokeLinecap="round" opacity="0.85" />
      {/* Timber sluice frame */}
      <rect x="38" y="18" width="24" height="30" rx="1.5" fill="#633F26" stroke="#3B1F0E" strokeWidth="1" />
      {/* Wheel — the sliding/rotating window metaphor */}
      <circle cx="50" cy="24" r="11" fill="none" stroke="#3B1F0E" strokeWidth="2.4" />
      <circle cx="50" cy="24" r="2" fill="#3B1F0E" />
      <line x1="50" y1="13" x2="50" y2="35" stroke="#3B1F0E" strokeWidth="1.6" />
      <line x1="39" y1="24" x2="61" y2="24" stroke="#3B1F0E" strokeWidth="1.6" />
      <line x1="42.5" y1="16.5" x2="57.5" y2="31.5" stroke="#3B1F0E" strokeWidth="1.2" />
      <line x1="57.5" y1="16.5" x2="42.5" y2="31.5" stroke="#3B1F0E" strokeWidth="1.2" />
    </svg>
  )
}

function StoneTerrace() {
  return (
    <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
      <ellipse cx="50" cy="50" rx="42" ry="7" fill="#182817" opacity="0.22" />
      {/* Layered/cumulative terrace steps — the running-total metaphor */}
      <rect x="14" y="38" width="72" height="10" rx="1.5" fill="#5A6D57" stroke="#3C463A" strokeWidth="1" />
      <rect x="22" y="28" width="56" height="10" rx="1.5" fill="#6B7E68" stroke="#3C463A" strokeWidth="1" />
      <rect x="30" y="18" width="40" height="10" rx="1.5" fill="#7A9376" stroke="#3C463A" strokeWidth="1" />
      <rect x="38" y="10" width="24" height="8" rx="1.5" fill="#93A391" stroke="#3C463A" strokeWidth="1" />
    </svg>
  )
}

function Watchtower({ leftRight = false }: { leftRight?: boolean }) {
  return (
    <svg viewBox="0 0 60 84" className="w-12 h-16" fill="none">
      <ellipse cx="30" cy="78" rx="22" ry="5" fill="#182817" opacity="0.22" />
      <polygon points="16,78 44,78 40,22 20,22" fill="#5A6D57" stroke="#3C463A" strokeWidth="1" />
      <line x1="20" y1="22" x2="16" y2="78" stroke="#3C463A" strokeWidth="0.8" />
      <line x1="40" y1="22" x2="44" y2="78" stroke="#3C463A" strokeWidth="0.8" />
      <rect x="18" y="4" width="24" height="20" rx="1.5" fill="#633F26" stroke="#3B1F0E" strokeWidth="1.2" />
      <polygon points="14,4 30,-6 46,4" fill="#3B1F0E" />
      {leftRight ? (
        <>
          <rect x="1" y="8" width="12" height="6" rx="1" fill="#1DB584" opacity="0.9" />
          <text x="7" y="12.5" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#fff">L</text>
          <rect x="47" y="8" width="12" height="6" rx="1" fill="#F59E0B" opacity="0.9" />
          <text x="53" y="12.5" textAnchor="middle" fontSize="5" fontWeight="bold" fill="#fff">R</text>
        </>
      ) : (
        <circle cx="30" cy="13" r="2.6" fill="#FEF08A" />
      )}
    </svg>
  )
}

function MeadowGate() {
  return (
    <svg viewBox="0 0 100 56" className="w-20 h-11" fill="none">
      <ellipse cx="50" cy="48" rx="42" ry="6" fill="#182817" opacity="0.22" />
      {/* Dry-stone enclosure wall */}
      <path d="M4 44 L26 44 L26 26 L4 26 Z" fill="#5A6D57" stroke="#3C463A" strokeWidth="0.9" />
      <path d="M74 44 L96 44 L96 26 L74 26 Z" fill="#5A6D57" stroke="#3C463A" strokeWidth="0.9" />
      <line x1="4" y1="34" x2="26" y2="34" stroke="#3C463A" strokeWidth="0.6" />
      <line x1="74" y1="34" x2="96" y2="34" stroke="#3C463A" strokeWidth="0.6" />
      {/* Timber gate between */}
      <rect x="30" y="20" width="6" height="26" rx="1" fill="#3B1F0E" />
      <rect x="64" y="20" width="6" height="26" rx="1" fill="#3B1F0E" />
      <line x1="36" y1="26" x2="64" y2="26" stroke="#633F26" strokeWidth="3" />
      <line x1="36" y1="40" x2="64" y2="40" stroke="#633F26" strokeWidth="3" />
      <line x1="38" y1="24" x2="62" y2="42" stroke="#522F17" strokeWidth="2" />
    </svg>
  )
}

function CairnMarker() {
  return (
    <svg viewBox="0 0 40 44" className="w-9 h-10" fill="none">
      <ellipse cx="20" cy="40" rx="16" ry="3.5" fill="#182817" opacity="0.22" />
      <ellipse cx="20" cy="36" rx="13" ry="5" fill="#424D40" />
      <ellipse cx="20" cy="28" rx="10" ry="4.5" fill="#596657" />
      <ellipse cx="20" cy="20" rx="7.5" ry="3.6" fill="#728070" />
      <ellipse cx="20" cy="13" rx="4.5" ry="2.6" fill="#93A391" />
    </svg>
  )
}

function MegalithArch() {
  return (
    <svg viewBox="0 0 70 58" className="w-14 h-12" fill="none">
      <ellipse cx="35" cy="52" rx="30" ry="5" fill="#182817" opacity="0.25" />
      <path d="M14 52 L14 26 C14 8, 56 8, 56 26 L56 52 Z" fill="#182318" />
      <path d="M10 52 L10 26 C10 4, 60 4, 60 26 L60 52" stroke="#5A6D57" strokeWidth="8" strokeLinecap="round" />
      <path d="M18 52 L18 26 C18 12, 52 12, 52 26 L52 52" stroke="#7A9376" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="35" cy="26" r="6" fill="#9333EA" opacity="0.85" />
      <circle cx="35" cy="26" r="3.2" fill="#F3E8FF" />
    </svg>
  )
}

function Arboretum() {
  return (
    <svg viewBox="0 0 84 64" className="w-16 h-12" fill="none">
      <ellipse cx="42" cy="56" rx="36" ry="6" fill="#182817" opacity="0.22" />
      {/* Twin-spire glasshouse */}
      <path d="M12 56 L12 24 L28 12 L28 56 Z" fill="#2E4A38" stroke="#1B2E22" strokeWidth="1" />
      <path d="M56 56 L56 12 L72 24 L72 56 Z" fill="#375A43" stroke="#1B2E22" strokeWidth="1" />
      <rect x="30" y="30" width="24" height="26" fill="#264033" stroke="#1B2E22" strokeWidth="1" />
      <line x1="42" y1="30" x2="42" y2="56" stroke="#1B2E22" strokeWidth="0.8" />
      <circle cx="20" cy="34" r="3" fill="#A7CE65" opacity="0.85" />
      <circle cx="64" cy="34" r="3" fill="#A7CE65" opacity="0.85" />
    </svg>
  )
}

function Observatory() {
  return (
    <svg viewBox="0 0 70 66" className="w-14 h-13" fill="none">
      <ellipse cx="35" cy="60" rx="28" ry="5" fill="#182817" opacity="0.25" />
      <rect x="16" y="36" width="38" height="24" rx="2" fill="#586756" stroke="#3C473A" strokeWidth="1" />
      <path d="M16 36 A19 16 0 0 1 54 36 Z" fill="#7D8F7B" stroke="#3C473A" strokeWidth="1" />
      <rect x="32" y="18" width="6" height="18" fill="#3C473A" />
      <circle cx="35" cy="16" r="4.5" fill="#E2B44A" className="animate-pulse" />
    </svg>
  )
}

function TimberPortal() {
  return (
    <svg viewBox="0 0 100 60" className="w-20 h-12" fill="none">
      <ellipse cx="50" cy="52" rx="40" ry="6" fill="#182817" opacity="0.25" />
      <polygon points="14,52 30,52 28,32 16,32" fill="#6C7A68" stroke="#2C3529" strokeWidth="1" />
      <polygon points="70,52 86,52 84,32 72,32" fill="#6C7A68" stroke="#2C3529" strokeWidth="1" />
      <rect x="18" y="10" width="6" height="30" rx="1" fill="#633F26" />
      <rect x="76" y="10" width="6" height="30" rx="1" fill="#633F26" />
      <rect x="14" y="6" width="72" height="8" rx="2" fill="#4A2E1A" stroke="#24140A" strokeWidth="1" />
      <ellipse cx="50" cy="30" rx="22" ry="16" fill="#FFFFFF" opacity="0.18" />
    </svg>
  )
}

export default function ZoneLandmark({ landmarkType, state, label, scale = 1 }: ZoneLandmarkProps) {
  const treatment = treatmentFor(state)

  const inner = (() => {
    switch (landmarkType) {
      case "bridge":
        return <TwinCrossingBridge />
      case "fork":
        return <ForkedBridge />
      case "sluice":
        return <StreamSluice />
      case "terrace":
        return <StoneTerrace />
      case "watchtower":
        return <Watchtower leftRight={landmarkType === "watchtower" && label.toLowerCase().includes("search")} />
      case "gate":
        return <MeadowGate />
      case "cairn":
        return <CairnMarker />
      case "arch":
        return <MegalithArch />
      case "arboretum":
        return <Arboretum />
      case "observatory":
        return <Observatory />
      case "portal":
        return <TimberPortal />
      case "lodge":
        return (
          <div className="relative flex items-end">
            <div className="absolute -left-3 -bottom-1"><AlpinePineTree variant="dense" scale={0.55 * scale} /></div>
            <AlpineCabin variant="lodge" scale={0.75 * scale} hasSmoke={state === "current" || state === "completed" || state === "mastered"} isGlow />
            <div className="absolute -right-3 -bottom-1"><AlpinePineTree variant="slender" scale={0.5 * scale} /></div>
          </div>
        )
      case "cabin":
      default:
        return <AlpineCabin variant="standard" scale={0.7 * scale} hasSmoke={state === "current" || state === "completed" || state === "mastered"} isGlow />
    }
  })()

  return (
    <div className="relative flex flex-col items-center" style={{ filter: treatment.filter, opacity: treatment.opacity, transform: `scale(${scale})` }}>
      {state === "current" && (
        <div className="absolute inset-0 -m-3 rounded-full bg-[#1DB584]/25 animate-ping pointer-events-none" style={{ transform: "scale(0.7)" }} />
      )}
      {inner}
      {(state === "mastered") && (
        <span className="absolute -top-2 -right-2 text-sm drop-shadow" title="Mastered">⭐</span>
      )}
    </div>
  )
}
