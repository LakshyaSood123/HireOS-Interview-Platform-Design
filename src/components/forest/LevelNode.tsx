import { useState } from "react"
import type { TrailNode } from "../../data/reagvisCourses"
import AlpineCabin from "./scenic/AlpineCabin"

interface LevelNodeProps {
  node: TrailNode
  isSelected?: boolean
  onSelect: (node: TrailNode) => void
}

export default function LevelNode({
  node,
  isSelected = false,
  onSelect,
}: LevelNodeProps) {
  const [isHovered, setIsHovered] = useState(false)

  const isCompleted = node.status === "completed"
  const isCurrent = node.status === "current"
  const isLocked = node.status === "locked"

  // Only checkpoints and summit are major landmark structures
  // Ordinary lessons (including active node) are subtle scenic markers
  const isCheckpoint = node.type === "checkpoint" || node.id === 6
  const isSummit = node.id === 18

  const handleClick = () => {
    if (!isLocked) {
      onSelect(node)
    }
  }

  // 1. Checkpoint Landmark Cabin (e.g. Level 6 Foundations Bridge)
  if (isCheckpoint && !isSummit) {
    return (
      <div
        className="relative flex flex-col items-center select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={handleClick}
          disabled={isLocked}
          aria-label={`Checkpoint Cabin: ${node.title}`}
          className={`group cursor-pointer transition-all duration-300 transform ${
            isLocked ? "opacity-65 cursor-not-allowed" : "hover:scale-105 active:scale-95"
          }`}
        >
          <div className="relative">
            <AlpineCabin
              scale={0.72}
              hasSmoke={!isLocked}
              hasFlag={true}
              flagText={`Lv${node.id}`}
              isGlow={isCurrent}
            />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#FAF8F0]/95 border border-[#C2D4BC] shadow-xs text-[9px] font-bold text-[#234E35] whitespace-nowrap">
              {isCompleted ? "✓ Passed" : isCurrent ? "● Active" : `Lv ${node.id}`}
            </div>
          </div>
        </button>

        {isHovered && (
          <div className="absolute bottom-full mb-2 z-50 min-w-[180px] pointer-events-none animate-fade-in">
            <div className="rounded-2xl bg-[#FAF8F0]/95 backdrop-blur-md border border-[#BBD4B8] p-3 shadow-lg shadow-black/10 text-center">
              <span className="text-[10px] font-bold text-[#1DB584] uppercase tracking-wider block">
                Checkpoint Lodge &bull; Lv {node.id}
              </span>
              <p className="text-xs font-black text-[#1E3B2B] leading-tight mt-0.5">{node.title}</p>
              <span className="text-[10px] text-gray-500 mt-1 block">+{node.xp} XP</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 2. Summit Node (Level 18 Grand Trial)
  if (isSummit) {
    return (
      <div
        className="relative flex flex-col items-center select-none"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <button
          onClick={handleClick}
          disabled={isLocked}
          aria-label={`Algorithm Summit: ${node.title}`}
          className={`group cursor-pointer transition-all duration-300 transform ${
            isLocked ? "opacity-75 cursor-not-allowed" : "hover:scale-105 active:scale-95"
          }`}
        >
          <div className="relative flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-[#FAF8F0] border-2 border-[#E2B44A] shadow-md flex items-center justify-center text-base">
              👑
            </div>
            <span className="mt-1 px-2.5 py-0.5 rounded-full bg-[#E2B44A] text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
              Summit
            </span>
          </div>
        </button>

        {isHovered && (
          <div className="absolute bottom-full mb-2 z-50 min-w-[190px] pointer-events-none animate-fade-in">
            <div className="rounded-2xl bg-[#FAF8F0]/95 backdrop-blur-md border border-[#E2B44A] p-3 shadow-lg text-center">
              <span className="text-[10px] font-black text-[#B45309] uppercase tracking-wider block">
                ⭐ Final Master Trial
              </span>
              <p className="text-xs font-black text-[#1E3B2B] mt-0.5">{node.title}</p>
              <span className="text-[10px] text-gray-600 mt-1 block">Prove HireOS Readiness</span>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 3. Ordinary Lessons: Subtle scenic markers (Clean circular pills matching reference)
  return (
    <div
      className="relative flex flex-col items-center select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Active breathing glow ring */}
      {isCurrent && (
        <span className="absolute -inset-1.5 rounded-full bg-[#1DB584]/30 animate-ping pointer-events-none" />
      )}

      <button
        onClick={handleClick}
        disabled={isLocked}
        aria-label={`Level ${node.id}: ${node.title}`}
        className={`relative z-20 flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isCurrent
            ? "w-8 h-8 rounded-full bg-[#1DB584] text-white border-2 border-white shadow-md scale-110"
            : isCompleted
            ? "w-7 h-7 rounded-full bg-[#EBF3E5] text-[#1DB584] border border-[#1DB584]/60 shadow-xs hover:scale-110"
            : "w-6 h-6 rounded-full bg-white/70 text-gray-400 border border-[#B8C8B4]/60 shadow-xs opacity-75 cursor-not-allowed"
        } ${isSelected ? "ring-2 ring-[#1DB584] ring-offset-2 ring-offset-[#DDEAC5]" : ""}`}
      >
        {isCompleted ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-3.5 h-3.5 text-[#1DB584]"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : isCurrent ? (
          <span className="font-extrabold text-xs text-white font-mono leading-none">
            {node.id}
          </span>
        ) : (
          <span className="font-bold text-[10px] text-gray-400 font-mono leading-none">
            {node.id}
          </span>
        )}
      </button>

      {/* Hover Tooltip Card */}
      {isHovered && (
        <div className="absolute bottom-full mb-2 z-50 min-w-[160px] pointer-events-none animate-fade-in">
          <div className="rounded-2xl bg-[#FAF8F0]/95 backdrop-blur-md border border-[#BBD4B8] p-2.5 shadow-lg shadow-black/10 text-center">
            <span className="text-[9px] font-mono font-bold text-[#1DB584] uppercase tracking-wider block">
              Level {node.id} &bull; {node.code}
            </span>
            <p className="text-xs font-bold text-[#1E3B2B] leading-tight mt-0.5">{node.title}</p>
            <div className="mt-1 flex items-center justify-center gap-2 text-[10px] text-gray-500">
              <span>+{node.xp} XP</span>
              <span>&bull;</span>
              <span>{isCompleted ? "✓ Completed" : isCurrent ? "● Active" : "Locked"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
