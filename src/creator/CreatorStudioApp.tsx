import { useState, useCallback } from "react"
import { courseAuthoringRepository } from "./courseAuthoringRepository"
import type { CreatorCourse } from "./types"
import CreatorDashboard from "./components/CreatorDashboard"
import CourseEditorShell from "./components/CourseEditorShell"
import DsaEditorShell from "./dsa/components/DsaEditorShell"

interface CreatorStudioAppProps {
  onExit: () => void
}

/**
 * Top-level Creator Studio state machine — entirely self-contained.
 * Reads/writes ONLY through courseAuthoringRepository (standard courses)
 * and dsaCourseAuthoringRepository (the structured DSA draft, entirely
 * separate storage — see src/creator/dsa/dsaDraftRepository.ts). Never
 * touches learner progress, the static DSA curriculum, Piston, Trail
 * Guide, or Feedback. See PART 1/28 of the task.
 */
export default function CreatorStudioApp({ onExit }: CreatorStudioAppProps) {
  const [screen, setScreen] = useState<"dashboard" | "editor" | "dsa-editor">("dashboard")
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const openCourse = useCallback((id: string) => {
    setActiveCourseId(id)
    setScreen("editor")
  }, [])

  const openDsa = useCallback(() => {
    setScreen("dsa-editor")
  }, [])

  const createAndOpen = useCallback((course: CreatorCourse) => {
    setActiveCourseId(course.id)
    setScreen("editor")
    setRefreshKey(k => k + 1)
  }, [])

  const backToDashboard = useCallback(() => {
    setActiveCourseId(null)
    setScreen("dashboard")
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <div className="min-h-screen bg-[#0A1F17] font-display text-white">
      {screen === "dashboard" && (
        <CreatorDashboard
          key={refreshKey}
          repository={courseAuthoringRepository}
          onOpenCourse={openCourse}
          onOpenDsa={openDsa}
          onCourseCreated={createAndOpen}
          onExit={onExit}
        />
      )}
      {screen === "editor" && activeCourseId && (
        <CourseEditorShell
          courseId={activeCourseId}
          repository={courseAuthoringRepository}
          onBackToDashboard={backToDashboard}
        />
      )}
      {screen === "dsa-editor" && <DsaEditorShell onBackToDashboard={backToDashboard} />}
    </div>
  )
}
