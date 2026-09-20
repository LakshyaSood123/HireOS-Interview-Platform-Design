import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import { useAppState } from "../state/AppStateContext"
import { useLearningScreenContext } from "../learning/learningScreenContext"
import type {
  AssistantContext,
  AssistantMessage,
  TopicAssistantProvider,
} from "./types"
import { MockTopicAssistantProvider } from "./mockTopicAssistantProvider"
import { LocalTopicAssistantHistoryRepository, type AssistantHistoryRepository } from "./assistantHistoryRepository"
import { getStarterSuggestions, type Suggestion } from "./intents"

interface AnimationRuntimeContext {
  animationId?: string
  step?: number
  totalSteps?: number
  operation?: string
  message?: string
}

interface CodingRuntimeContext {
  language?: "python" | "cpp" | "java" | "javascript"
  code?: string
  compilerSummary?: string
}

interface TrailGuideContextValue {
  isOpen: boolean
  openGuide: () => void
  closeGuide: () => void

  context: AssistantContext
  messages: AssistantMessage[]
  isThinking: boolean
  error: string | null
  suggestedQuestions: Suggestion[]

  includeLearnerCode: boolean
  setIncludeLearnerCode: (include: boolean) => void

  sendMessage: (text: string, forcedIntent?: string) => Promise<void>
  clearConversation: () => void

  // Runtime context publishers for Animation and CodeWorkspace
  setAnimationContext: (anim: AnimationRuntimeContext | null) => void
  setCodingContext: (coding: CodingRuntimeContext | null) => void
}

const TrailGuideContextInstance = createContext<TrailGuideContextValue | null>(null)

const defaultProvider: TopicAssistantProvider = new MockTopicAssistantProvider()
const defaultHistoryRepo: AssistantHistoryRepository = new LocalTopicAssistantHistoryRepository()

export function TrailGuideProvider({
  children,
  provider = defaultProvider,
  historyRepo = defaultHistoryRepo,
  onOpen,
}: {
  children: ReactNode
  provider?: TopicAssistantProvider
  historyRepo?: AssistantHistoryRepository
  onOpen?: () => void
}) {
  const learningScreenContext = useLearningScreenContext()

  const [isOpen, setIsOpen] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [includeLearnerCode, setIncludeLearnerCode] = useState(false)

  // Runtime contexts published by active components
  const [animContext, setAnimContext] = useState<AnimationRuntimeContext | null>(null)
  const [codingContext, setCodingContextState] = useState<CodingRuntimeContext | null>(null)

  // ── 1. COMPUTE BASE TOPIC CONTEXT FROM CANONICAL SCREEN CONTEXT ──
  const baseContext = useMemo<AssistantContext>(() => {
    return {
      screenType: learningScreenContext.screenType,
      screenId: learningScreenContext.screenId,
      courseId: learningScreenContext.courseId,
      courseTitle: learningScreenContext.courseTitle,
      zoneId: learningScreenContext.zoneId,
      zoneTitle: learningScreenContext.zoneTitle,
      moduleId: learningScreenContext.moduleId,
      moduleTitle: learningScreenContext.moduleTitle,
      checkpointId: learningScreenContext.checkpointId,
      checkpointTitle: learningScreenContext.checkpointTitle,
      activityType: (learningScreenContext.activityType as AssistantContext["activityType"]) ?? "general-learning",
      problemTitle: learningScreenContext.problemTitle,
    }
  }, [learningScreenContext])

  // ── 2. MERGE RUNTIME ANIMATION & CODING CONTEXT ──
  const effectiveContext = useMemo<AssistantContext>(() => {
    return {
      ...baseContext,
      animationId: animContext?.animationId,
      animationStep: animContext?.step,
      animationTotalSteps: animContext?.totalSteps,
      animationOperation: animContext?.operation,
      animationMessage: animContext?.message,
      language: codingContext?.language,
      includeLearnerCode,
      learnerCode: includeLearnerCode ? codingContext?.code : undefined,
      compilerSummary: codingContext?.compilerSummary,
    }
  }, [baseContext, animContext, codingContext, includeLearnerCode])

  // ── 3. TOPIC KEY & PER-TOPIC HISTORY ──
  const topicKey = useMemo(() => {
    return `${learningScreenContext.courseId ?? "dsa"}_${learningScreenContext.moduleId ?? "nomodule"}_${learningScreenContext.checkpointId ?? learningScreenContext.screenId}`
  }, [
    learningScreenContext.courseId,
    learningScreenContext.moduleId,
    learningScreenContext.checkpointId,
    learningScreenContext.screenId,
  ])

  const [messages, setMessages] = useState<AssistantMessage[]>(() => {
    return historyRepo.getHistory(topicKey)
  })

  // When the topic changes, reload history from repository. Also drop any
  // stale animation/coding runtime context from the PREVIOUS checkpoint —
  // without this, navigating from an animation checkpoint to a
  // concept-only one left the old animation step/operation in
  // effectiveContext, leaking one topic's runtime state into another's
  // suggestions/answers (topic isolation, PART 25).
  useEffect(() => {
    setMessages(historyRepo.getHistory(topicKey))
    setError(null)
    setIncludeLearnerCode(false) // Default code inclusion to OFF on topic switch
    setAnimContext(null)
    setCodingContextState(null)
  }, [topicKey, historyRepo])

  // Save conversation whenever messages change
  const updateMessages = useCallback(
    (newMsgs: AssistantMessage[]) => {
      setMessages(newMsgs)
      historyRepo.saveHistory(topicKey, newMsgs)
    },
    [topicKey, historyRepo],
  )

  const clearConversation = useCallback(() => {
    historyRepo.clearHistory(topicKey)
    setMessages([])
    setError(null)
  }, [topicKey, historyRepo])

  // ── 4. DYNAMIC CONTEXTUAL SUGGESTIONS (activity-aware, ID-carrying) ──
  const suggestedQuestions = useMemo(() => {
    return getStarterSuggestions(effectiveContext)
  }, [effectiveContext])

  // ── 5. OPEN / CLOSE ──
  const openGuide = useCallback(() => {
    onOpen?.()
    setIsOpen(true)
  }, [onOpen])

  const closeGuide = useCallback(() => {
    setIsOpen(false)
    setError(null)
  }, [])

  // ── 6. SEND MESSAGE ──
  // `forcedIntent` is set when the caller is a suggestion-button click —
  // the provider resolves using that id directly rather than re-matching
  // the button's visible label text (the root fix for the fallback-loop
  // bug). Free-typed messages omit it and fall back to text detection.
  const sendMessage = useCallback(
    async (text: string, forcedIntent?: string) => {
      if (!text.trim() || isThinking) return

      setError(null)
      const userMsg: AssistantMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        createdAt: new Date().toISOString(),
      }

      const updatedWithUser = [...messages, userMsg]
      updateMessages(updatedWithUser)
      setIsThinking(true)

      try {
        const res = await provider.sendMessage({
          message: text.trim(),
          context: effectiveContext,
          conversation: updatedWithUser,
          forcedIntent,
        })

        const assistantMsg: AssistantMessage = {
          id: res.id,
          role: "assistant",
          content: res.content,
          suggestedFollowUps: res.suggestedFollowUps,
          intent: res.intent,
          createdAt: res.createdAt,
        }

        updateMessages([...updatedWithUser, assistantMsg])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Trail Guide couldn't respond just now. Try again.")
      } finally {
        setIsThinking(false)
      }
    },
    [messages, isThinking, effectiveContext, provider, updateMessages],
  )

  const value = useMemo<TrailGuideContextValue>(
    () => ({
      isOpen,
      openGuide,
      closeGuide,
      context: effectiveContext,
      messages,
      isThinking,
      error,
      suggestedQuestions,
      includeLearnerCode,
      setIncludeLearnerCode,
      sendMessage,
      clearConversation,
      setAnimationContext: setAnimContext,
      setCodingContext: setCodingContextState,
    }),
    [
      isOpen,
      openGuide,
      closeGuide,
      effectiveContext,
      messages,
      isThinking,
      error,
      suggestedQuestions,
      includeLearnerCode,
      sendMessage,
      clearConversation,
    ],
  )

  return (
    <TrailGuideContextInstance.Provider value={value}>
      {children}
    </TrailGuideContextInstance.Provider>
  )
}

export function useTrailGuide(): TrailGuideContextValue {
  const ctx = useContext(TrailGuideContextInstance)
  if (!ctx) {
    throw new Error("useTrailGuide must be used within a TrailGuideProvider")
  }
  return ctx
}
