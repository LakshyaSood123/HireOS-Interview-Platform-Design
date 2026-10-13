// Course Home for a backend-pinned course (Machine Learning Foundations):
//   loading / error (with retry)  →  generic CourseHome with the course's OWN
//   curriculum, built from the learner's pinned published version.
//
// Zones, modules and counts all come from `pinnedCourse.course`; nothing about
// the ML curriculum is defined in this frontend.

import type { ReactNode } from "react"
import { useAppState } from "../../state/AppStateContext"
import CourseHome from "./CourseHome"
import CourseCurriculum from "./CourseCurriculum"
import { ML_HOME } from "../../learning/courseHomeConfig"
import { buildCourseStats, countCompleted } from "../../learning/courseHomeStats"

export default function PinnedCourseWorld() {
  const { pinnedCourse, retryPinnedCourse, enterModule, dsaModuleStates, getCheckpointState, setReagvisView } = useAppState()

  const backToLibrary = () => setReagvisView("library")

  if (pinnedCourse.status === "error") {
    return (
      <Shell>
        <Panel>
          <h2 className="text-2xl font-black mb-2">Couldn&apos;t load this course</h2>
          <p className="text-sm text-[#3E5A47] mb-6">{pinnedCourse.error}</p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={retryPinnedCourse} className={PRIMARY_BUTTON}>
              Retry
            </button>
            <button onClick={backToLibrary} className={SECONDARY_BUTTON}>
              Back to Course Library
            </button>
          </div>
        </Panel>
      </Shell>
    )
  }

  if (pinnedCourse.status !== "ready" || !pinnedCourse.course) {
    return (
      <Shell>
        <Panel>
          <p className="text-sm font-bold text-[#3E5A47]">Loading your course…</p>
        </Panel>
      </Shell>
    )
  }

  const course = pinnedCourse.course
  const stats = buildCourseStats({ zones: course.zones, getCheckpointState })
  const { done } = countCompleted(course.zones, getCheckpointState)

  // Primary CTA: the first module the learner can actually open.
  const firstOpenModule = course.zones
    .flatMap(z => z.modules)
    .find(m => m.checkpoints.length > 0 && (dsaModuleStates[m.id] ?? "locked") !== "locked")

  return (
    <CourseHome
      config={ML_HOME}
      title={course.title}
      stats={stats}
      hasProgress={done > 0}
      onPrimary={() => firstOpenModule && enterModule(firstOpenModule.id)}
      onBack={backToLibrary}
    >
      <CourseCurriculum
        zones={course.zones}
        moduleStates={dsaModuleStates}
        onEnterModule={module => enterModule(module.id)}
      />
    </CourseHome>
  )
}

const PRIMARY_BUTTON =
  "px-5 py-2.5 rounded-xl bg-[#1DB584] hover:bg-[#159a6f] text-white font-bold text-sm transition-all cursor-pointer shadow-md"
const SECONDARY_BUTTON =
  "px-5 py-2.5 rounded-xl bg-white border-2 border-[#C2D6B8] hover:border-[#1DB584] text-[#1E3B2B] font-bold text-sm transition-all cursor-pointer"

function Shell({ children }: { children: ReactNode }) {
  return <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 animate-fade-up">{children}</div>
}

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[28px] bg-[#F7F5EC] border-2 border-[#C2D6B8] p-6 sm:p-10 shadow-[0_25px_60px_rgba(40,65,45,0.12)]">
      {children}
    </div>
  )
}
