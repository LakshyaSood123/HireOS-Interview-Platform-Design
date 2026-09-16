// Bridges the new engine back to the OLD `CourseData`/`TrailNode`/`BiomeZone`
// shapes (src/data/reagvisCourses.ts) that existing scenic/UI components
// (LessonReader, ChallengeStage, LessonModal, TrailHUD, BiomeTrailMap) still
// consume directly. Rather than rewriting every consumer's prop contract —
// which risks the visual regressions this task explicitly avoids —
// `deriveLegacyCourseData` projects the engine's resolved progress onto a
// fresh `CourseData` object every time progress changes, so `courseData`
// becomes a read-only VIEW of engine state instead of a second mutable copy
// of it (the old `completeCurrentLesson` used to hand-mutate `courseData`
// directly, which is exactly the duplicate-source-of-truth problem this
// refactor removes).

import { dsaCourseData, type CourseData, type NodeStatus } from "../data/reagvisCourses"
import type { LearnerProgressState } from "./progressEngine"
import { resolveCheckpointState, resolveAllModuleStates } from "./progressEngine"
import { getCourseById, findCheckpoint } from "./courseRegistry"
import type { ProgressState } from "./types"

function toLegacyStatus(state: ProgressState): NodeStatus {
  switch (state) {
    case "completed":
    case "mastered":
      return "completed"
    case "current":
      return "current"
    case "available":
      return "available"
    case "locked":
    default:
      return "locked"
  }
}

export function deriveLegacyCourseData(progress: LearnerProgressState, readinessScore: number): CourseData {
  const course = getCourseById(progress.activeCourseId)
  if (!course) return dsaCourseData

  const moduleStates = resolveAllModuleStates(course, progress)

  const nodes = dsaCourseData.nodes.map(node => {
    const checkpoint = findCheckpoint(course, String(node.id))
    const state = checkpoint ? resolveCheckpointState(checkpoint, progress) : "locked"
    return {
      ...node,
      status: toLegacyStatus(state),
      mastery: state === "completed" || state === "mastered" ? 100 : 0,
    }
  })

  const biomes = dsaCourseData.biomes.map(biome => {
    const moduleId = course.zones.flatMap(z => z.modules).find(m => m.title === biome.name)?.id
    const state = moduleId ? moduleStates[moduleId] : "locked"
    return {
      ...biome,
      isUnlocked: state !== "locked",
    }
  })

  return {
    ...dsaCourseData,
    currentMastery: readinessScore,
    nodes,
    biomes,
  }
}
