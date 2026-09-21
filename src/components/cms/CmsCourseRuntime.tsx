import { useMemo, useState } from "react"
import { useAppState } from "../../state/AppStateContext"
import { getPublishedCmsCourseById, toLearnerModules } from "../../creator/cmsCourseAdapter"
import { resolveCmsCheckpointStates, markCmsCheckpointCompleted } from "../../creator/cmsProgressRepository"
import { DisabledCodeRunner } from "../../creator/disabledCodeRunner"
import { LocalNotesRepository } from "../../learning/services/notesRepository"
import CmsCourseLanding from "./CmsCourseLanding"
import ModuleRoadmap from "../roadmap/ModuleRoadmap"
import LessonWorkspace from "../lesson/LessonWorkspace"

// One shared instance is enough — CodeWorkspace only calls run()/submit()
// on demand, and both always return the same "not configured" result.
const disabledRunner = new DisabledCodeRunner()
const notesRepository = new LocalNotesRepository()

/**
 * Thin CMS orchestrator — NOT a second learner UI. It resolves a published
 * CreatorCourse into the SAME Module/Checkpoint data the DSA curriculum
 * uses (via cmsCourseAdapter.ts) and hands that data to the real,
 * unmodified CmsCourseLanding/ModuleRoadmap/LessonWorkspace components.
 * All this file owns is: which course/module/checkpoint is being viewed
 * (mirroring AppStateContext's own viewedModuleId/viewedCheckpointId
 * pattern for DSA), and the small local CMS-only completion store in
 * cmsProgressRepository.ts. No DSA progress engine, XP, lives, or streak
 * state is touched anywhere in this file.
 */
export default function CmsCourseRuntime({ onExit }: { onExit: () => void }) {
  const { viewedCmsCourseId, viewedCmsModuleId, viewedCmsActivityId, setViewedCmsModuleId, setViewedCmsActivityId } =
    useAppState()

  // Bumped on every completion so resolveCmsCheckpointStates (which reads
  // localStorage) is recomputed instead of staying stale after a write.
  const [completionTick, setCompletionTick] = useState(0)

  const course = viewedCmsCourseId ? getPublishedCmsCourseById(viewedCmsCourseId) : undefined
  const modules = useMemo(() => (course ? toLearnerModules(course) : []), [course])
  const activeModule = modules.find(m => m.id === viewedCmsModuleId)
  const checkpointStates = useMemo(
    () => (course && activeModule ? resolveCmsCheckpointStates(course.id, activeModule) : {}),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [course, activeModule, completionTick],
  )
  const activeCheckpoint = activeModule?.checkpoints.find(cp => cp.id === viewedCmsActivityId)

  if (!course) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-6 text-center">
        <p className="text-sm text-gray-500 mb-4">This course is no longer published.</p>
        <button
          onClick={onExit}
          className="px-4 py-2 rounded-full bg-[#5B8854] hover:bg-[#487342] text-white font-bold text-sm cursor-pointer"
        >
          ← Back to Course Library
        </button>
      </div>
    )
  }

  // ── WORKSPACE (a single lesson / quick check / coding activity) ──
  if (activeModule && activeCheckpoint) {
    const state = checkpointStates[activeCheckpoint.id] ?? "locked"
    // CMS coding exercises aren't wired to real execution yet — show them
    // as an honest preview (see DisabledCodeRunner) rather than gating
    // progression on a "success" that can never actually happen.
    const isPreview = activeCheckpoint.workspace?.codingActivity !== undefined

    const goToCheckpoint = (checkpointId: string | null) => setViewedCmsActivityId(checkpointId)

    const handleComplete = (): boolean => {
      if (state !== "current" && state !== "available") return false
      markCmsCheckpointCompleted(course.id, activeCheckpoint.id)
      setCompletionTick(t => t + 1)
      return true
    }

    const handleContinue = () => {
      const idx = activeModule.checkpoints.findIndex(cp => cp.id === activeCheckpoint.id)
      const next = activeModule.checkpoints[idx + 1]
      goToCheckpoint(next ? next.id : null)
    }

    return (
      <LessonWorkspace
        key={activeCheckpoint.id}
        checkpoint={activeCheckpoint}
        moduleTitle={activeModule.title}
        state={state}
        lives={3}
        runner={disabledRunner}
        notesRepository={notesRepository}
        courseId={course.id}
        moduleId={activeModule.id}
        isPreview={isPreview}
        onFailedSubmit={() => {}}
        onComplete={handleComplete}
        onContinue={handleContinue}
        onBack={() => goToCheckpoint(null)}
      />
    )
  }

  // ── MODULE ROADMAP ──
  if (activeModule) {
    return (
      <ModuleRoadmap
        module={activeModule}
        checkpointStates={checkpointStates}
        onEnterCheckpoint={checkpointId => setViewedCmsActivityId(checkpointId)}
        onBack={() => setViewedCmsModuleId(null)}
      />
    )
  }

  // ── COURSE LANDING ──
  return <CmsCourseLanding course={course} modules={modules} onEnterModule={moduleId => setViewedCmsModuleId(moduleId)} onExit={onExit} />
}
