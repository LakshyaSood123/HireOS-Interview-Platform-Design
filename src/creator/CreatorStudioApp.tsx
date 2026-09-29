import { useState, useCallback } from "react"
import { courseAuthoringRepository } from "./courseAuthoringRepository"
import type { CreatorCourse } from "./types"
import CreatorDashboard from "./components/CreatorDashboard"
import CourseEditorShell from "./components/CourseEditorShell"
import DsaEditorShell from "./dsa/components/DsaEditorShell"
import { useIsAdmin } from "../auth/AuthContext"

interface CreatorStudioAppProps {
  onExit: () => void
}

/** Frontend-side convenience only — every `/cms/**` route this app's DSA
 * editor now talks to independently enforces `requireRole("admin")`
 * server-side regardless of what this screen shows or hides (see
 * backend/src/middleware/auth.ts's `requireRole`). This gate exists purely
 * so a learner account doesn't land in an authoring UI that would 403 on
 * every request; it is never the actual authorization boundary. */
function AdminOnlyNotice({ onExit }: { onExit: () => void }) {
  return (
    <div className="min-h-screen bg-[#0A1F17] font-display text-white flex items-center justify-center px-4">
      <div className="max-w-sm text-center rounded-3xl bg-white/[0.04] border border-white/10 p-8">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#E2B44A] mb-2">Creator Studio</p>
        <h1 className="text-lg font-black text-white mb-2">Admins only</h1>
        <p className="text-xs text-gray-400 leading-relaxed mb-6">
          Course authoring is limited to admin accounts. If you believe you should have access, ask an existing admin.
        </p>
        <button
          onClick={onExit}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] cursor-pointer"
        >
          Back to Reagvis Trails
        </button>
      </div>
    </div>
  )
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
  const isAdmin = useIsAdmin()
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

  if (!isAdmin) return <AdminOnlyNotice onExit={onExit} />

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
