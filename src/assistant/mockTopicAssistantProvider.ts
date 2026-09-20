import type {
  TopicAssistantProvider,
  TopicAssistantRequest,
  TopicAssistantResponse,
} from "./types"
import type { IntentId } from "./intents"
import { getFollowUpSuggestions } from "./intents"
import { detectIntent } from "./intentDetector"
import { buildTopicKnowledge } from "./topicKnowledgeBuilder"
import { resolveIntent, buildContextualFallback } from "./topicKnowledgeResolver"
import { getCourseById, findCheckpoint, findModuleForCheckpoint, findZoneForModule } from "../learning/courseRegistry"

const HINT_INTENTS = new Set<IntentId>(["GIVE_HINT", "GIVE_ANOTHER_HINT", "STRONGER_HINT"])

export class MockTopicAssistantProvider implements TopicAssistantProvider {
  private simulateError: boolean = false

  setSimulateError(shouldError: boolean): void {
    this.simulateError = shouldError
  }

  async sendMessage(request: TopicAssistantRequest): Promise<TopicAssistantResponse> {
    // Realistic artificial delay (350-550ms) for polished typing indicator experience
    const delay = Math.floor(Math.random() * 200) + 350
    await new Promise(resolve => setTimeout(resolve, delay))

    if (this.simulateError) {
      throw new Error("Trail Guide couldn't respond just now. Try again.")
    }

    // Mock-only: derive the curriculum-grounded TopicKnowledge client-side
    // via the course registry. A future ApiTopicAssistantProvider instead
    // forwards `request.context` (already screen/checkpoint/runtime scoped)
    // to a backend that does this same lookup server-side — the request
    // contract does not change, only what's behind it.
    const course = request.context.courseId ? getCourseById(request.context.courseId) : undefined
    const checkpoint = course && request.context.checkpointId ? findCheckpoint(course, request.context.checkpointId) : undefined
    const module = course && checkpoint ? findModuleForCheckpoint(course, checkpoint.id) : undefined
    const zone = course && module ? findZoneForModule(course, module.id) : undefined

    const knowledge = buildTopicKnowledge({ context: request.context, checkpoint, module, zone })

    const intent = (request.forcedIntent as IntentId | undefined) ?? detectIntent(request.message)

    if (!intent) {
      // Genuinely unsupported free text — the ONLY path that reaches the
      // contextual (never generic) fallback.
      return {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: buildContextualFallback(knowledge),
        suggestedFollowUps: getFollowUpSuggestions("EXPLAIN_SIMPLE", request.context).slice(0, 3),
        intent: "fallback",
        createdAt: new Date().toISOString(),
      }
    }

    // Progressive hint level: count prior hint-intent turns in THIS topic's
    // conversation so GIVE_ANOTHER_HINT/STRONGER_HINT escalate deterministically.
    const priorHintTurns = (request.conversation ?? []).filter(
      m => m.role === "assistant" && m.intent && HINT_INTENTS.has(m.intent as IntentId),
    ).length
    const hintLevel = priorHintTurns + 1

    const resolved = resolveIntent(knowledge, intent, hintLevel)

    return {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: "assistant",
      content: resolved.content,
      suggestedFollowUps: getFollowUpSuggestions(intent, request.context),
      intent,
      createdAt: new Date().toISOString(),
    }
  }
}
