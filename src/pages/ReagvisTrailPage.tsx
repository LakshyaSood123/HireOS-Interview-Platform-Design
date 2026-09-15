import { useState } from "react"
import TrailHUD from "../components/forest/TrailHUD"
import BiomeTrailMap from "../components/forest/BiomeTrailMap"
import LessonModal from "../components/forest/LessonModal"
import LessonReader from "../components/forest/LessonReader"
import ChallengeStage from "../components/forest/ChallengeStage"
import UnlockCelebration from "../components/forest/UnlockCelebration"
import OwlAvatar from "../components/OwlAvatar"
import AlpineMountainRange from "../components/forest/scenic/AlpineMountainRange"
import AlpineCabin from "../components/forest/scenic/AlpineCabin"
import AlpinePineTree from "../components/forest/scenic/AlpinePineTree"
import { MeadowCow } from "../components/forest/scenic/ScenicAnimals"
import { useAppState } from "../state/AppStateContext"
import { libraryCourses, type TrailNode } from "../data/reagvisCourses"

interface ReagvisTrailPageProps {
  onNavigateHireOS?: (page: string) => void
}

export default function ReagvisTrailPage({ onNavigateHireOS }: ReagvisTrailPageProps) {
  const {
    reagvisView,
    setReagvisView,
    courseData,
    activeNode,
    setActiveNode,
    completeCurrentLesson,
    retakeInterview,
    returnToHireOS,
  } = useAppState()

  const [previewNode, setPreviewNode] = useState<TrailNode | null>(null)

  const handleSelectNode = (node: TrailNode) => {
    setPreviewNode(node)
  }

  const handleEnterLesson = (node: TrailNode) => {
    setActiveNode(node)
    setPreviewNode(null)
    setReagvisView("lesson")
  }

  const handleRetakeFromCelebration = () => {
    retakeInterview()
    if (onNavigateHireOS) {
      onNavigateHireOS("interview")
    }
  }

  return (
    <div className="min-h-screen bg-[#CFDFBA] font-display text-[#1E3B2B] relative flex flex-col overflow-x-hidden">
      {/* ── TOP NAV / HUD ── */}
      <TrailHUD />

      <main className="relative z-10 flex-1">
        {/* ══════════════════════════════════════════════════════
            1. COURSE INTRO / EXPEDITION BRIEF SCREEN
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "intro" && (
          <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 animate-fade-up">
            <div className="rounded-[36px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-6 sm:p-10 shadow-[0_25px_60px_rgba(40,65,45,0.12)] relative overflow-hidden">

              {/* Scenic Mountain Horizon Header Banner */}
              <div className="relative w-full h-40 sm:h-48 rounded-2xl overflow-hidden bg-gradient-to-b from-[#DDEEEF] to-[#CFDFBA] border border-[#BDD4B6] mb-8">
                <AlpineMountainRange className="absolute -bottom-6 inset-x-0 w-full" />
                <div className="absolute right-8 bottom-3 z-10">
                  <AlpineCabin scale={0.75} hasSmoke={true} isGlow={true} />
                </div>
                <div className="absolute left-8 bottom-2 z-10">
                  <AlpinePineTree variant="cluster" scale={0.8} />
                </div>
                <div className="absolute right-28 bottom-2 z-10">
                  <MeadowCow scale={0.7} />
                </div>
              </div>

              {/* Guide Character & Title */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
                <div className="p-4 rounded-3xl bg-[#E4EED5] border border-[#BBD4B8] flex-shrink-0 shadow-2xs">
                  <OwlAvatar size={100} state="thinking" className="drop-shadow-md" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5B8854]/15 text-[#2F6747] border border-[#5B8854]/30 mb-2">
                    <span>🧭</span> Diagnostic Transfer Complete
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-black text-[#1B3F2B] tracking-tight">
                    Your Alpine DSA Trail Is Ready
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-2 leading-relaxed">
                    Based on your HireOS interview diagnosis, we synthesized an alpine trail targetting the exact technical skills that will elevate your technical score from 58 to Interview Ready (80+).
                  </p>
                </div>
              </div>

              {/* Diagnostic Comparison Grid (Soft cream cards) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-8">
                <div className="bg-white/80 rounded-2xl border border-[#CBDCC4] p-4 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block mb-1">HireOS Score</span>
                  <span className="text-2xl font-black text-[#E27D4C] font-mono">58 / 100</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">Struggle Area</span>
                </div>
                <div className="bg-white/80 rounded-2xl border border-[#CBDCC4] p-4 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block mb-1">Current State</span>
                  <span className="text-lg font-black text-[#D97706]">Developing</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">Foundational gaps</span>
                </div>
                <div className="bg-white/80 rounded-2xl border border-[#CBDCC4] p-4 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block mb-1">Target Milestone</span>
                  <span className="text-2xl font-black text-[#1DB584] font-mono">80+</span>
                  <span className="text-[10px] text-[#1DB584] font-bold block mt-0.5">Interview Ready</span>
                </div>
                <div className="bg-white/80 rounded-2xl border border-[#CBDCC4] p-4 text-center shadow-2xs">
                  <span className="text-xs text-gray-500 block mb-1">Estimated Trail</span>
                  <span className="text-lg font-black text-[#1E3B2B]">~2h 30m</span>
                  <span className="text-[10px] text-gray-500 block mt-0.5 font-medium">18 Alpine lessons</span>
                </div>
              </div>

              {/* Calibrated Focus Skills */}
              <div className="mb-8">
                <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">
                  Calibrated Focus Topics:
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {courseData.weakSkills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#E6F0DC] border border-[#BDD4B6] text-[#244F39] flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-[#1DB584]" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-6 border-t border-[#CBDCC4]">
                <button
                  onClick={() => setReagvisView("map")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-full font-black text-xs text-white bg-[#5B8854] hover:bg-[#487342] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <span>🏔️ Begin the Alpine Trail</span>
                  <span>➔</span>
                </button>
                <button
                  onClick={() => setReagvisView("library")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full font-bold text-xs text-[#244F39] hover:text-black bg-white/80 hover:bg-white border border-[#BDD4B6] transition-all text-center cursor-pointer shadow-2xs"
                >
                  Explore All Course Biomes
                </button>
                <button
                  onClick={returnToHireOS}
                  className="w-full sm:w-auto px-4 py-3 text-xs font-bold text-gray-500 hover:text-gray-800 text-center cursor-pointer"
                >
                  Return to Results
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            2. THE PRIMARY SCENIC ALPINE COURSE MAP
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "map" && (
          <div className="animate-fade-up w-full">
            <BiomeTrailMap
              nodes={courseData.nodes}
              biomes={courseData.biomes}
              onSelectNode={handleSelectNode}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            3. LESSON READER VIEW
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "lesson" && activeNode && (
          <div className="animate-fade-up py-4">
            <LessonReader
              node={activeNode}
              onBackToMap={() => setReagvisView("map")}
              onOpenChallenge={() => setReagvisView("challenge")}
              onCompleteLesson={completeCurrentLesson}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            4. CHALLENGE STAGE VIEW
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "challenge" && activeNode?.lesson?.challenge && (
          <div className="animate-fade-up py-4">
            <ChallengeStage
              challenge={activeNode.lesson.challenge}
              onBackToLesson={() => setReagvisView("lesson")}
              onSuccess={completeCurrentLesson}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. COURSE LIBRARY / BIOMES VIEW
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "library" && (
          <div className="max-w-6xl mx-auto py-10 px-6 animate-fade-up">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5B8854]/15 text-[#2F6747] mb-2">
                <span>📚</span> Reagvis Labs Course Worlds
              </div>
              <h2 className="text-3xl font-black text-[#1B3F2B]">Course Library &amp; Destinations</h2>
              <p className="text-sm text-gray-600 mt-1">
                Each engineering discipline forms an explorable alpine environment in the Knowledge Forest.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {libraryCourses.map(course => (
                <div
                  key={course.id}
                  className="rounded-[30px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-6 shadow-[0_15px_35px_rgba(40,65,45,0.08)] flex flex-col justify-between transition-all hover:scale-[1.02]"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#E4EED5] border border-[#BBD4B8] flex items-center justify-center text-2xl mb-4 shadow-2xs">
                      {course.icon}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-1">
                      {course.category}
                    </span>
                    <h3 className="text-lg font-black text-[#1B3F2B] mb-2">{course.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed mb-4">{course.description}</p>
                  </div>

                  <div className="pt-4 border-t border-[#CBDCC4] flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-bold">⏱️ {course.duration}</span>
                    <button
                      onClick={() => setReagvisView("map")}
                      className="px-4 py-2 rounded-full bg-[#5B8854] hover:bg-[#487342] text-white font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Enter Trail ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {previewNode && (
        <LessonModal
          node={previewNode}
          onClose={() => setPreviewNode(null)}
          onEnterLesson={handleEnterLesson}
        />
      )}

      {reagvisView === "complete" && (
        <UnlockCelebration
          onReturnToMap={() => setReagvisView("map")}
          onRetakeInterview={handleRetakeFromCelebration}
        />
      )}
    </div>
  )
}
