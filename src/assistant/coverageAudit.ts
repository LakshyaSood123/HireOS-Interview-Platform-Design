// Deterministic, programmatic coverage audit (PART 24/33/35 of the Trail
// Guide hardening task). Iterates every real checkpoint in the course,
// builds the same AssistantContext/TopicKnowledge the live app would, and
// verifies every displayed suggestion resolves to real content through
// resolveIntent() — never the unsupported-fallback path. Intended to be run
// from a Node/browser script during QA, not shipped as UI.

import type { Course } from "../learning/types"
import { getAllCheckpointsInOrder, findModuleForCheckpoint, findZoneForModule } from "../learning/courseRegistry"
import type { AssistantContext, ActivityType } from "./types"
import { getStarterSuggestions } from "./intents"
import { buildTopicKnowledge } from "./topicKnowledgeBuilder"
import { resolveIntent } from "./topicKnowledgeResolver"

function classifyActivityType(workspace: ReturnType<typeof getAllCheckpointsInOrder>[number]["workspace"]): ActivityType {
  if (workspace?.codingActivity) return "coding-challenge"
  if (workspace?.animation || workspace?.visual || workspace?.callStackVisual || workspace?.twoPointerVisual) return "algorithm-animation"
  if (workspace?.quickCheck) return "quick-check"
  if (workspace) return "concept-theory"
  return "general-learning"
}

export interface CoverageRow {
  checkpointId: string
  checkpointTitle: string
  moduleId: string
  activityType: ActivityType
  suggestionCount: number
  orphanSuggestions: string[] // intents whose resolveIntent() threw or returned empty content
}

export interface CoverageReport {
  totalCheckpoints: number
  contextResolvableCheckpoints: number
  totalSuggestions: number
  orphanSuggestions: number
  rows: CoverageRow[]
}

export function auditAssistantCoverage(course: Course): CoverageReport {
  const checkpoints = getAllCheckpointsInOrder(course)
  const rows: CoverageRow[] = []
  let contextResolvableCheckpoints = 0
  let totalSuggestions = 0
  let orphanSuggestions = 0

  for (const checkpoint of checkpoints) {
    const module = findModuleForCheckpoint(course, checkpoint.id)
    const zone = module ? findZoneForModule(course, module.id) : undefined
    if (!module) continue

    contextResolvableCheckpoints++

    const activityType = classifyActivityType(checkpoint.workspace)
    const context: AssistantContext = {
      screenType: "lesson",
      courseId: course.id,
      courseTitle: course.title,
      zoneId: zone?.id,
      zoneTitle: zone?.title,
      moduleId: module.id,
      moduleTitle: module.title,
      checkpointId: checkpoint.id,
      checkpointTitle: checkpoint.title,
      activityType,
      // Simulate runtime presence for animation/coding so suggestion sets
      // match what the live app would show.
      animationId: activityType === "algorithm-animation" ? "sim" : undefined,
      animationStep: activityType === "algorithm-animation" ? 1 : undefined,
      language: activityType === "coding-challenge" ? "python" : undefined,
    }

    const knowledge = buildTopicKnowledge({ context, checkpoint, module, zone })
    const suggestions = getStarterSuggestions(context)
    totalSuggestions += suggestions.length

    const orphansForRow: string[] = []
    for (const s of suggestions) {
      try {
        const resolved = resolveIntent(knowledge, s.intent, 1)
        if (!resolved.content || resolved.content.trim().length === 0) {
          orphansForRow.push(s.intent)
        }
      } catch {
        orphansForRow.push(s.intent)
      }
    }
    orphanSuggestions += orphansForRow.length

    rows.push({
      checkpointId: checkpoint.id,
      checkpointTitle: checkpoint.title,
      moduleId: module.id,
      activityType,
      suggestionCount: suggestions.length,
      orphanSuggestions: orphansForRow,
    })
  }

  return {
    totalCheckpoints: checkpoints.length,
    contextResolvableCheckpoints,
    totalSuggestions,
    orphanSuggestions,
    rows,
  }
}
