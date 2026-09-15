import type { TrailNode } from "../../data/reagvisCourses"
import AlpineCabin from "./scenic/AlpineCabin"

interface LessonModalProps {
  node: TrailNode | null
  onClose: () => void
  onEnterLesson: (node: TrailNode) => void
}

export default function LessonModal({ node, onClose, onEnterLesson }: LessonModalProps) {
  if (!node) return null

  const isCompleted = node.status === "completed"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-up font-display">
      <div className="relative w-full max-w-md sm:max-w-lg rounded-t-[34px] sm:rounded-[34px] bg-[#F8F6EC] border border-[#C2D6B8] p-6 sm:p-8 text-[#1E3B2B] shadow-[0_25px_70px_rgba(40,65,45,0.16)] overflow-hidden">

        {/* Top Decorative Header */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider bg-[#E4EED5] border border-[#BBD4B8] text-[#2F6747]">
            <span>🌱</span> {node.biome} &bull; Level {node.id}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/80 border border-[#BBD4B8]/60 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-800 transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Title & Preview Header with Cabin */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-2xl font-black text-[#1B3F2B] tracking-tight leading-tight">
              {node.title}
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">{node.subtitle}</p>
          </div>
          <div className="flex-shrink-0">
            <AlpineCabin scale={0.75} hasSmoke={true} isGlow={true} />
          </div>
        </div>

        {/* Metrics Row (Soft cream pills) */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-white/80 border border-[#CBDCC4]/60 rounded-2xl p-3 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 block">Est. Time</span>
            <span className="text-base font-black text-[#2F6747]">
              {node.lesson?.readTime || "12 min"}
            </span>
          </div>
          <div className="bg-white/80 border border-[#CBDCC4]/60 rounded-2xl p-3 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 block">XP Reward</span>
            <span className="text-base font-black text-[#D97706]">+{node.xp} XP</span>
          </div>
          <div className="bg-white/80 border border-[#CBDCC4]/60 rounded-2xl p-3 text-center shadow-2xs">
            <span className="text-[10px] font-bold text-gray-500 block">Status</span>
            <span
              className={`text-xs font-black mt-1 block ${
                isCompleted ? "text-[#1DB584]" : "text-[#E27D4C]"
              }`}
            >
              {isCompleted ? "✓ Mastered" : "● Active Quest"}
            </span>
          </div>
        </div>

        {/* Trail Objectives / Syllabus */}
        <div className="bg-[#EDF4E7] rounded-2xl border border-[#C2D6B8] p-4 mb-6">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-[#2F6747] mb-2.5">
            Lesson Learning Goals:
          </h4>
          <ul className="space-y-1.5 text-xs text-[#2A4E38]">
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/80 text-[#1DB584] font-black flex items-center justify-center text-[10px] shadow-2xs">✓</span>
              <span>Deconstruct asymptotic runtime &amp; space trade-offs</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/80 text-[#1DB584] font-black flex items-center justify-center text-[10px] shadow-2xs">✓</span>
              <span>Pattern identification for top tech technical interviews</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-white/80 text-[#1DB584] font-black flex items-center justify-center text-[10px] shadow-2xs">✓</span>
              <span>Interactive coding challenge with simulated test runner</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-white/60 transition-all cursor-pointer"
          >
            Not Now
          </button>
          <button
            onClick={() => onEnterLesson(node)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black text-white bg-[#5B8854] hover:bg-[#487342] shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <span>Enter Landmark Lesson</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    </div>
  )
}
