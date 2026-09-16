import type { GatewayType, ZoneExitThreshold } from "../../learning/scenic/types"
import type { ProgressState } from "../../learning/types"

interface ZoneGatewayProps {
  threshold: ZoneExitThreshold
  /** Resolved state of the TARGET zone (not this gateway itself) — a
   * gateway's own appearance follows whether the zone beyond it is
   * reachable yet. */
  targetZoneState: ProgressState
  onEnter: () => void
}

const GATEWAY_ICON: Record<GatewayType, string> = {
  "timber-gate": "🚪",
  "stone-bridge": "🌉",
  "mountain-pass": "⛰️",
  "ice-tunnel": "🧊",
  "summit-ridge": "🏔️",
}

/** Reusable zone-transition threshold (PART 11/12). Subdued/fogged when the
 * target zone is locked (click explains the prerequisite instead of
 * transitioning); lit and clickable once available. Same component for
 * every gateway type across all 7 zones — only the icon and copy vary. */
export default function ZoneGateway({ threshold, targetZoneState, onEnter }: ZoneGatewayProps) {
  const locked = targetZoneState === "locked"

  return (
    <button
      onClick={onEnter}
      title={locked ? `${threshold.title} — complete more of this zone to unlock ${threshold.targetZoneId.replace(/-/g, " ")}` : threshold.title}
      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 group cursor-pointer"
      style={{ left: `${threshold.xPercent}%`, top: `${threshold.yPercent}%` }}
    >
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all ${
          locked
            ? "bg-black/20 border-white/10 grayscale opacity-50"
            : "bg-[#E2EED5]/90 border-[#1DB584]/50 shadow-[0_0_20px_rgba(29,181,132,0.35)] group-hover:scale-105"
        }`}
      >
        {GATEWAY_ICON[threshold.landmarkType]}
      </div>
      <span
        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
          locked ? "bg-black/30 text-gray-400" : "bg-[#1DB584] text-white"
        }`}
      >
        {locked ? "🔒 Locked" : threshold.title}
      </span>
    </button>
  )
}
