import OwlAvatar from "../OwlAvatar"
import { useAppState } from "../../state/AppStateContext"

export default function TransitionPortal() {
  const { isTransitioning, transitionMessage } = useAppState()

  if (!isTransitioning) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#04100C]/90 backdrop-blur-xl animate-fade-up"
      style={{ animationDuration: "0.35s" }}
    >
      {/* Background bioluminescent aura */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#1DB584]/20 blur-[100px] pointer-events-none animate-pulse" />

      {/* Center card */}
      <div className="relative z-10 max-w-md w-full rounded-3xl bg-gradient-to-b from-[#0F3524] to-[#071A14] border border-[#1DB584]/40 p-8 text-center shadow-[0_0_60px_rgba(29,181,132,0.3)]">
        {/* Animated connecting energy line */}
        <div className="relative w-full h-1.5 bg-black/50 rounded-full mb-8 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-transparent via-[#1DB584] to-[#A7CE65] w-1/2 animate-[dash-flow_1s_ease-in-out_infinite] rounded-full" />
        </div>

        {/* Mascot */}
        <div className="flex justify-center mb-5">
          <div className="p-3 rounded-full bg-[#1DB584]/15 border border-[#1DB584]/30">
            <OwlAvatar size={96} state="thinking" className="drop-shadow-lg" />
          </div>
        </div>

        {/* Ecosystem Sub-brand */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#1DB584]/20 text-[#1DB584] border border-[#1DB584]/40 mb-3">
          <span>🌿</span> Reagvis Trails &bull; Reagvis Labs
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight mb-2">
          {transitionMessage || "Opening Your Learning Trail..."}
        </h2>

        <p className="text-sm text-emerald-200/80 leading-relaxed mb-6">
          Transferring your HireOS interview diagnosis to generate an explorable, personalized knowledge trail.
        </p>

        {/* Diagnostic Chips */}
        <div className="flex flex-wrap justify-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 border border-white/10 text-emerald-300">
            🌳 Trees &amp; BST
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 border border-white/10 text-emerald-300">
            🕸️ Graph Traversal
          </span>
          <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-black/40 border border-white/10 text-emerald-300">
            ⚡ O(N) Complexity
          </span>
        </div>
      </div>
    </div>
  )
}
