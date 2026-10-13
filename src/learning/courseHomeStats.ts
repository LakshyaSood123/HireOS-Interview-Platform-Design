// Stats shown on a Course Home. Every number is derived from the selected
// course's own zones and the learner's own progress; nothing is hardcoded.

import type { Module, ProgressState, Zone } from "./types"
import type { CourseStat } from "../components/course/CourseHome"

export interface CourseStatsInput {
  zones: Pick<Zone, "modules">[]
  getCheckpointState: (checkpointId: string) => ProgressState
  /** Only passed for flat courses where a duration is authored. */
  duration?: string
}

function realModules(zones: Pick<Zone, "modules">[]): Module[] {
  return zones.flatMap(z => z.modules).filter(m => m.checkpoints.length > 0)
}

export function countCompleted(zones: Pick<Zone, "modules">[], getCheckpointState: (id: string) => ProgressState): { done: number; total: number } {
  const checkpoints = realModules(zones).flatMap(m => m.checkpoints)
  const done = checkpoints.filter(cp => {
    const state = getCheckpointState(cp.id)
    return state === "completed" || state === "mastered"
  }).length
  return { done, total: checkpoints.length }
}

export function buildCourseStats({ zones, getCheckpointState, duration }: CourseStatsInput): CourseStat[] {
  const modules = realModules(zones)
  const zoneCount = zones.filter(z => z.modules.some(m => m.checkpoints.length > 0)).length
  const { done, total } = countCompleted(zones, getCheckpointState)

  const stats: CourseStat[] = []
  if (zoneCount > 1) stats.push({ label: "Zones", value: String(zoneCount) })
  stats.push({ label: "Modules", value: String(modules.length) })
  stats.push({ label: "Lessons", value: String(total) })
  if (zoneCount <= 1 && duration) stats.push({ label: "Estimated time", value: duration })
  stats.push({ label: "Progress", value: `${done} / ${total}`, hint: total > 0 ? `${Math.round((done / total) * 100)}% complete` : undefined })
  return stats
}
