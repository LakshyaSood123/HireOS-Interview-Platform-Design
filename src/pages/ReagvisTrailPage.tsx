import { useState } from "react"
import TrailHUD from "../components/forest/TrailHUD"
import BiomeTrailMap from "../components/forest/BiomeTrailMap"
import LessonModal from "../components/forest/LessonModal"
import LessonReader from "../components/forest/LessonReader"
import ChallengeStage from "../components/forest/ChallengeStage"
import UnlockCelebration from "../components/forest/UnlockCelebration"
import ModuleRoadmap from "../components/roadmap/ModuleRoadmap"
import LessonWorkspace from "../components/lesson/LessonWorkspace"
import OwlAvatar from "../components/OwlAvatar"
import AlpineMountainRange from "../components/forest/scenic/AlpineMountainRange"
import AlpineCabin from "../components/forest/scenic/AlpineCabin"
import AlpinePineTree from "../components/forest/scenic/AlpinePineTree"
import { MeadowCow } from "../components/forest/scenic/ScenicAnimals"
import { useAppState } from "../state/AppStateContext"
import { type TrailNode } from "../data/reagvisCourses"
import { getCourseById, isCourseAvailable, getAllCheckpointsInOrder } from "../learning/courseRegistry"
import { RoutingCodeRunner } from "../learning/services/pistonCodeRunner"
import { LocalNotesRepository } from "../learning/services/notesRepository"
import { getUnifiedLibraryCourses } from "../learning/libraryCourseSource"
import CmsCourseRuntime from "../components/cms/CmsCourseRuntime"

// Module-level singletons — one code runner / local notes repository for
// the whole app, same pattern as AppStateContext's progressRepository.
// RoutingCodeRunner sends only the MVP-enabled activity (foundations-4) to
// real Piston execution; every other activity still uses MockCodeRunner.
const codeRunner = new RoutingCodeRunner()
const notesRepository = new LocalNotesRepository()

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
    startLearningTrail,
    activeCourseId,
    lives,
    viewedModuleId,
    viewedCheckpointId,
    enterModule,
    enterCheckpoint,
    backToRoadmap,
    completeCheckpointById,
    failCheckpointAttempt,
    getCheckpointState,
    dsaModuleStates,
    enterCmsCourse,
  } = useAppState()

  const [previewNode, setPreviewNode] = useState<TrailNode | null>(null)
  const [previewModuleId, setPreviewModuleId] = useState<string | null>(null)
  const unifiedLibraryCourses = getUnifiedLibraryCourses()

  const course = getCourseById(activeCourseId)
  const viewedModule = course?.zones.flatMap(z => z.modules).find(m => m.id === viewedModuleId)
  const viewedCheckpoint = viewedModule?.checkpoints.find(cp => cp.id === viewedCheckpointId)
  const orderedCheckpoints = course ? getAllCheckpointsInOrder(course) : []

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

  const handleReturnToHireOS = () => {
    returnToHireOS()
    onNavigateHireOS?.("results")
  }

  return (
    <div className={`font-display text-[#1E3B2B] relative flex flex-col ${
      reagvisView === "map" ? "h-screen overflow-hidden bg-[#D2ECED]" : "min-h-screen bg-[#CFDFBA] overflow-x-hidden"
    }`}>
      {/* ── TOP NAV / HUD ── */}
      <TrailHUD onNavigateHireOS={onNavigateHireOS} />

      <main className={`relative z-10 ${reagvisView === "map" ? "flex-1 min-h-0 overflow-hidden" : "flex-1"}`}>
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
                  onClick={handleReturnToHireOS}
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
          <div className="animate-fade-up w-full h-full">
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
            MODULE ROADMAP VIEW (new Lesson Workspace model — Trees today)
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "roadmap" && viewedModule && (
          <div className="animate-fade-up">
            <ModuleRoadmap
              module={viewedModule}
              checkpointStates={
                previewModuleId === viewedModule.id
                  ? Object.fromEntries(viewedModule.checkpoints.map(cp => [cp.id, "available"]))
                  : Object.fromEntries(
                      viewedModule.checkpoints.map(cp => [cp.id, getCheckpointState(cp.id)]),
                    )
              }
              onEnterCheckpoint={enterCheckpoint}
              onBack={() => {
                setPreviewModuleId(null)
                setReagvisView("map")
              }}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            LESSON WORKSPACE VIEW (new Lesson Workspace model — Trees today)
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "workspace" && viewedCheckpoint && viewedModule && (
          <div className="animate-fade-up">
            <LessonWorkspace
              key={viewedCheckpoint.id}
              checkpoint={viewedCheckpoint}
              moduleTitle={viewedModule.title}
              state={previewModuleId === viewedModule.id ? "available" : getCheckpointState(viewedCheckpoint.id)}
              lives={lives}
              runner={codeRunner}
              notesRepository={notesRepository}
              courseId={activeCourseId}
              moduleId={viewedModule.id}
              isPreview={Boolean(previewModuleId)}
              onFailedSubmit={previewModuleId ? () => {} : failCheckpointAttempt}
              onComplete={previewModuleId ? () => false : () => completeCheckpointById(viewedCheckpoint.id)}
              onContinue={() => {
                const index = orderedCheckpoints.findIndex(cp => cp.id === viewedCheckpoint.id)
                const next = index >= 0 ? orderedCheckpoints[index + 1] : undefined
                if (next && viewedModule.checkpoints.some(cp => cp.id === next.id)) {
                  enterCheckpoint(next.id)
                } else {
                  backToRoadmap()
                }
              }}
              onBack={backToRoadmap}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            5. COURSE LIBRARY / BIOMES VIEW
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "library" && (
          <div className="max-w-6xl mx-auto py-10 px-6 animate-fade-up">
            <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#5B8854]/15 text-[#2F6747] mb-2">
                  <span>📚</span> Reagvis Labs Course Worlds
                </div>
                <h2 className="text-3xl font-black text-[#1B3F2B]">Course Library &amp; Destinations</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Each engineering discipline forms an explorable alpine environment in the Knowledge Forest.
                </p>
              </div>
              {onNavigateHireOS && (
                <button
                  onClick={() => onNavigateHireOS("creator-studio")}
                  className="px-4 py-2.5 rounded-full bg-white border-2 border-[#C2D6B8] hover:border-[#5B8854] text-[#2F6747] font-bold text-xs cursor-pointer transition-all shadow-xs inline-flex items-center gap-2"
                >
                  <span>🧭</span> Creator Studio
                </button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {unifiedLibraryCourses.map(course => {
                const available = course.source === "cms" ? true : isCourseAvailable(course.id)
                return (
                  <div
                    key={course.id}
                    className={`rounded-[30px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-6 shadow-[0_15px_35px_rgba(40,65,45,0.08)] flex flex-col justify-between transition-all ${
                      available ? "hover:scale-[1.02]" : "opacity-70"
                    }`}
                  >
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-[#E4EED5] border border-[#BBD4B8] flex items-center justify-center text-2xl mb-4 shadow-2xs">
                        {course.biomeIcon}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-1">
                        {course.biomeTitle}
                      </span>
                      <h3 className="text-lg font-black text-[#1B3F2B] mb-2">{course.title}</h3>
                      <p className="text-xs text-gray-600 leading-relaxed mb-4">{course.description}</p>
                    </div>

                    <div className="pt-4 border-t border-[#CBDCC4] flex items-center justify-between text-xs">
                      <span className="text-gray-500 font-bold">⏱️ {course.duration}</span>
                      {available ? (
                        <button
                          onClick={() => {
                            if (course.source === "cms") {
                              enterCmsCourse(course.id)
                            } else {
                              startLearningTrail(course.id)
                              setReagvisView("map")
                            }
                          }}
                          className="px-4 py-2 rounded-full bg-[#5B8854] hover:bg-[#487342] text-white font-bold transition-all shadow-xs cursor-pointer"
                        >
                          Enter Trail ➔
                        </button>
                      ) : (
                        <span
                          className="px-4 py-2 rounded-full bg-gray-200 text-gray-500 font-bold cursor-not-allowed"
                          title="This course world is still being built"
                        >
                          Coming Soon
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* ── DSA course-world module list (full functional curriculum) ──
                Course World (the Alpine scenic map) still only shows the
                original 7 module tiles — see LEARNING_ENGINE_ARCHITECTURE.md's
                "Course World vs Module Roadmap" note. This plain list is the
                navigation path to every other real module until the scenic
                map grows more regions, without touching the Alpine visuals
                at all. */}
            {course && (
              <div className="mt-12">
                <div className="mb-6">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1DB584] block mb-1">
                    Data Structures &amp; Algorithms
                  </span>
                  <h3 className="text-xl font-black text-[#1B3F2B]">Full DSA Curriculum</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Every module has real lessons — the scenic Course World above still shows the
                    original 7 destinations until the next world-map phase.
                  </p>
                </div>

                {course.zones
                  .map(zone => (
                    <div key={zone.id} className="mb-8">
                      <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3">{zone.title}</h4>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {zone.modules
                          .filter(module => module.checkpoints.length > 0)
                          .map(module => {
                            const state = dsaModuleStates[module.id] ?? "locked"
                            const isTwoPointers = module.id === "two-pointers"
                            const enterable = state !== "locked" || isTwoPointers
                            return (
                              <button
                                key={module.id}
                                onClick={() => {
                                  if (isTwoPointers && state === "locked") {
                                    setPreviewModuleId("two-pointers")
                                  }
                                  if (enterable) enterModule(module.id)
                                }}
                                disabled={!enterable}
                                className={`text-left rounded-2xl border p-4 transition-all ${
                                  enterable
                                    ? "bg-white/90 border-[#C2D6B8] hover:bg-white hover:shadow-md cursor-pointer"
                                    : "bg-white/40 border-[#D8E4D2] opacity-60 cursor-not-allowed"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <span className="text-lg">{module.icon}</span>
                                  <span className="text-sm font-black text-[#1B3F2B]">{module.title}</span>
                                </div>
                                <p className="text-[11px] text-gray-600 leading-snug mb-2">{module.description}</p>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                      state === "completed" || state === "mastered"
                                        ? "bg-[#1DB584]/15 text-[#128A5B]"
                                        : state === "current"
                                          ? "bg-[#1DB584] text-white"
                                          : state === "available"
                                            ? "bg-[#E2EED5] text-[#234E35]"
                                            : "bg-gray-200 text-gray-500"
                                    }`}
                                  >
                                    {state === "locked" ? "🔒 Locked" : state}
                                  </span>
                                  {isTwoPointers && state === "locked" && (
                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#2563EB] border border-[#3B82F6]/30">
                                      Demo Preview 👁️
                                    </span>
                                  )}
                                </div>
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════
            6. PUBLISHED CMS (CREATOR STUDIO) COURSE VIEW
            ══════════════════════════════════════════════════════ */}
        {reagvisView === "cms-course" && <CmsCourseRuntime onExit={() => setReagvisView("library")} />}
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
