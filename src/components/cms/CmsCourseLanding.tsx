import type { CreatorCourse } from "../../creator/types"
import type { Module, ProgressState } from "../../learning/types"
import { getPublishedCmsCourses } from "../../creator/cmsCourseAdapter"
import { resolveCmsCheckpointStates } from "../../creator/cmsProgressRepository"
import { cmsCourseHomeConfig } from "../../learning/courseHomeConfig"
import { buildCourseStats, countCompleted } from "../../learning/courseHomeStats"
import CourseHome from "../course/CourseHome"
import CourseCurriculum from "../course/CourseCurriculum"

interface CmsCourseLandingProps {
  course: CreatorCourse
  modules: Module[]
  onEnterModule: (moduleId: string) => void
  onExit: () => void
}

/**
 * Course Home for a published Creator Studio course (for example the Python
 * courses). It is the same generic CourseHome used for DSA and Machine
 * Learning; only the configuration and the curriculum differ. Modules, counts
 * and progress come from the course's own authored data and the local CMS
 * progress store. Nothing is invented to fill the page.
 */
export default function CmsCourseLanding({ course, modules, onEnterModule, onExit }: CmsCourseLandingProps) {
  const position = Math.max(0, getPublishedCmsCourses().findIndex(c => c.id === course.id))
  const config = cmsCourseHomeConfig({
    courseId: course.id,
    title: course.title,
    category: course.category,
    description: course.description ?? course.shortDescription,
    position,
  })

  // Per-checkpoint states from the existing local CMS progress store.
  const checkpointStates: Record<string, ProgressState> = {}
  const moduleStates: Record<string, ProgressState> = {}
  for (const mod of modules) {
    const states = resolveCmsCheckpointStates(course.id, mod)
    Object.assign(checkpointStates, states)
    const values = mod.checkpoints.map(cp => states[cp.id])
    moduleStates[mod.id] = values.length > 0 && values.every(v => v === "completed" || v === "mastered")
      ? "completed"
      : values.includes("current")
        ? "current"
        : "available"
  }
  const getCheckpointState = (id: string): ProgressState => checkpointStates[id] ?? "locked"

  const zones = [{ id: "modules", title: "Modules", description: "", modules }]
  const stats = buildCourseStats({ zones, getCheckpointState, duration: course.duration ?? "Self-paced" })
  const { done } = countCompleted(zones, getCheckpointState)
  const firstOpen = modules.find(m => m.checkpoints.length > 0 && moduleStates[m.id] !== "completed") ?? modules.find(m => m.checkpoints.length > 0)

  return (
    <CourseHome
      config={config}
      title={course.title}
      stats={stats}
      hasProgress={done > 0}
      onPrimary={() => firstOpen && onEnterModule(firstOpen.id)}
      onBack={onExit}
    >
      <CourseCurriculum zones={zones} moduleStates={moduleStates} hideZoneTitles onEnterModule={module => onEnterModule(module.id)} />
    </CourseHome>
  )
}
