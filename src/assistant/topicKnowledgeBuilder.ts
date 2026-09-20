import type { Checkpoint, Module, Zone } from "../learning/types"
import type { ActivityType, AssistantContext } from "./types"

/**
 * Structured, per-topic knowledge Trail Guide reasons over. Built FROM the
 * existing curriculum objects (Checkpoint/Module) — never a second copy of
 * curriculum content. Runtime-only fields (animation/trace/coding state)
 * come from the live component context, not the static curriculum.
 */
export interface TopicKnowledge {
  courseId?: string
  courseTitle?: string

  zoneId?: string
  zoneTitle?: string

  moduleId?: string
  moduleTitle?: string

  checkpointId?: string
  checkpointTitle?: string

  activityType: ActivityType

  /** Theory block headings+bodies, verbatim from the curriculum. */
  keyPoints: { heading: string; body: string }[]
  /** First theory block's body, used as the base "explain simply" seed. */
  explanation?: string

  /** Coding-activity fields, only present for coding-challenge checkpoints. */
  problemStatement?: string
  constraints?: string[]
  functionName?: string
  hint?: string
  mistakeFeedback?: string

  /** Extracted only when the curriculum text itself states a complexity —
   * never invented. See extractComplexity() below. */
  complexity?: string

  /** Quick check fields (never includes correctIndex/explanation pre-submission use). */
  quickCheckQuestion?: string

  animationContext?: {
    animationId?: string
    step?: number
    totalSteps?: number
    operation?: string
    message?: string
  }

  traceContext?: {
    activeLine?: string
    executedLines?: string[]
    note?: string
  }

  includeLearnerCode: boolean
  learnerCode?: string
  language?: string
}

/** Looks for an explicit Big-O token in curriculum text — O(n), O(log n),
 * O(1), O(n^2), O(n log n), etc. Returns undefined (never a guess) if none
 * is present, per the "do not hallucinate complexity" rule. */
function extractComplexity(texts: (string | undefined)[]): string | undefined {
  const bigOPattern = /O\([^)]{1,12}\)/g
  const found = new Set<string>()
  for (const text of texts) {
    if (!text) continue
    const matches = text.match(bigOPattern)
    if (matches) matches.forEach(m => found.add(m))
  }
  if (found.size === 0) return undefined
  return Array.from(found).join(", ")
}

export function buildTopicKnowledge(params: {
  context: AssistantContext
  checkpoint?: Checkpoint
  module?: Module
  zone?: Zone
}): TopicKnowledge {
  const { context, checkpoint, module, zone } = params
  const workspace = checkpoint?.workspace
  const theory = workspace?.theory ?? []
  const coding = workspace?.codingActivity
  const quickCheck = workspace?.quickCheck

  const complexityTexts = [
    ...theory.map(t => t.body),
    coding?.prompt,
    ...(coding?.constraints ?? []),
    coding?.hint,
  ]

  return {
    courseId: context.courseId,
    courseTitle: context.courseTitle,
    zoneId: zone?.id ?? context.zoneId,
    zoneTitle: zone?.title ?? context.zoneTitle,
    moduleId: module?.id ?? context.moduleId,
    moduleTitle: module?.title ?? context.moduleTitle,
    checkpointId: checkpoint?.id ?? context.checkpointId,
    checkpointTitle: checkpoint?.title ?? context.checkpointTitle,
    activityType: context.activityType ?? "general-learning",

    keyPoints: theory.map(t => ({ heading: t.heading, body: t.body })),
    explanation: theory[0]?.body,

    problemStatement: coding?.prompt,
    constraints: coding?.constraints,
    functionName: coding?.functionName,
    hint: coding?.hint,
    mistakeFeedback: coding?.mistakeFeedback,

    complexity: extractComplexity(complexityTexts),

    quickCheckQuestion: quickCheck?.question,

    animationContext:
      context.animationId !== undefined
        ? {
            animationId: context.animationId,
            step: context.animationStep,
            totalSteps: context.animationTotalSteps,
            operation: context.animationOperation,
            message: context.animationMessage,
          }
        : undefined,

    traceContext: undefined, // populated by callers with Code Trace runtime access (see PART 21)

    includeLearnerCode: Boolean(context.includeLearnerCode),
    learnerCode: context.includeLearnerCode ? context.learnerCode : undefined,
    language: context.language,
  }
}
