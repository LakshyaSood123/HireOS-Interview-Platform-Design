import type { Suggestion } from "./intents"

export type AssistantRole = "user" | "assistant" | "system"

export interface AssistantMessage {
  id: string
  role: AssistantRole
  content: string
  suggestedFollowUps?: Suggestion[]
  intent?: string
  createdAt: string
}

export type ActivityType =
  | "concept-theory"
  | "algorithm-animation"
  | "code-trace"
  | "quick-check"
  | "coding-challenge"
  | "general-learning"

export interface AssistantContext {
  screenType: string
  courseId?: string
  courseTitle?: string
  zoneId?: string
  zoneTitle?: string
  moduleId?: string
  moduleTitle?: string
  checkpointId?: string
  checkpointTitle?: string
  activityType?: ActivityType
  /** Function name for coding checkpoints — shown as the third breadcrumb
   * level in the drawer header (PART 27). */
  problemTitle?: string

  // Animation runtime context (read-only)
  animationId?: string
  animationStep?: number
  animationTotalSteps?: number
  animationOperation?: string
  animationMessage?: string

  // Code editor runtime context (read-only)
  language?: "python" | "cpp" | "java" | "javascript"
  includeLearnerCode?: boolean
  learnerCode?: string
  compilerSummary?: string

  /** Set to "cms" for a published Creator Studio course screen. Trail Guide
   * shows an explicit limited-support state for these rather than routing
   * through the DSA-curriculum-grounded TopicAssistantProvider — see
   * TrailGuideDrawer.tsx. Absent for every DSA/HireOS screen. */
  source?: "cms"
}

export interface TopicAssistantRequest {
  message: string
  context: AssistantContext
  conversation?: AssistantMessage[]
  /** Set when the message originated from a suggestion button click — the
   * provider resolves using THIS id directly, never by re-matching the
   * message text. This is what makes every displayed suggestion guaranteed
   * to resolve (see intents.ts / topicKnowledgeResolver.ts). Absent for
   * free-typed messages, which fall back to text-based intent detection. */
  forcedIntent?: string
}

export interface TopicAssistantResponse {
  id: string
  role: "assistant"
  content: string
  suggestedFollowUps?: Suggestion[]
  intent?: string
  createdAt: string
}

export interface TopicAssistantProvider {
  sendMessage(request: TopicAssistantRequest): Promise<TopicAssistantResponse>
}
