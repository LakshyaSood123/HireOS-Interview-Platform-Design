import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react"
import type { ReactNode } from "react"
import { useLearningScreenContext } from "../learning/learningScreenContext"
import { LocalFeedbackRepository, type FeedbackRepository } from "./feedbackRepository"
import type { FeedbackCategory, FeedbackContext, FeedbackSentiment, FeedbackSubmissionPayload } from "./types"

interface FeedbackContextValue {
  isOpen: boolean
  context: FeedbackContext
  prefilledRating: FeedbackSentiment | null
  isSubmitting: boolean
  lastSubmittedId: string | null
  openFeedback: (initialRating?: FeedbackSentiment, override?: Partial<FeedbackContext>) => void
  closeFeedback: () => void
  setOverrideContext: (override: Partial<FeedbackContext> | null) => void
  submitFeedback: (
    category: FeedbackCategory,
    message?: string,
    rating?: FeedbackSentiment,
    includeContext?: boolean,
  ) => Promise<{ success: boolean; error?: string }>
}

const FeedbackContextInstance = createContext<FeedbackContextValue | null>(null)

const defaultRepository: FeedbackRepository = new LocalFeedbackRepository()

export function FeedbackProvider({
  children,
  repository = defaultRepository,
}: {
  children: ReactNode
  repository?: FeedbackRepository
}) {
  const learningScreenContext = useLearningScreenContext()

  const [isOpen, setIsOpen] = useState(false)
  const [prefilledRating, setPrefilledRating] = useState<FeedbackSentiment | null>(null)
  const [overrideContext, setOverrideContextState] = useState<Partial<FeedbackContext> | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastSubmittedId, setLastSubmittedId] = useState<string | null>(null)

  // Clear any temporary override when the learner navigates to a new screen/topic
  useEffect(() => {
    setOverrideContextState(null)
  }, [learningScreenContext.screenId, learningScreenContext.checkpointId])

  const effectiveContext = useMemo<FeedbackContext>(() => {
    if (!overrideContext) return learningScreenContext
    return {
      ...learningScreenContext,
      ...overrideContext,
      breadcrumb: overrideContext.breadcrumb ?? learningScreenContext.breadcrumb,
    }
  }, [learningScreenContext, overrideContext])

  const openFeedback = useCallback(
    (initialRating?: FeedbackSentiment, override?: Partial<FeedbackContext>) => {
      if (initialRating !== undefined) {
        setPrefilledRating(initialRating)
      }
      if (override) {
        setOverrideContextState(override)
      }
      setIsOpen(true)
    },
    [],
  )

  const closeFeedback = useCallback(() => {
    setIsOpen(false)
    setPrefilledRating(null)
    setOverrideContextState(null)
    setLastSubmittedId(null)
  }, [])

  const setOverrideContext = useCallback((override: Partial<FeedbackContext> | null) => {
    setOverrideContextState(override)
  }, [])

  const submitFeedback = useCallback(
    async (
      category: FeedbackCategory,
      message?: string,
      rating?: FeedbackSentiment,
      includeContext: boolean = true,
    ): Promise<{ success: boolean; error?: string }> => {
      setIsSubmitting(true)
      try {
        const payload: FeedbackSubmissionPayload = {
          screenId: effectiveContext.screenId,
          screenType: effectiveContext.screenType,
          title: effectiveContext.title,
          subtitle: effectiveContext.subtitle,
          breadcrumb: effectiveContext.breadcrumb,
          courseId: effectiveContext.courseId,
          courseTitle: effectiveContext.courseTitle,
          zoneId: effectiveContext.zoneId,
          zoneTitle: effectiveContext.zoneTitle,
          moduleId: effectiveContext.moduleId,
          moduleTitle: effectiveContext.moduleTitle,
          checkpointId: effectiveContext.checkpointId,
          checkpointTitle: effectiveContext.checkpointTitle,
          activityType: effectiveContext.activityType,
          activityTitle: effectiveContext.activityTitle,
          problemId: effectiveContext.problemId,
          problemTitle: effectiveContext.problemTitle,
          animationId: effectiveContext.animationId,
          interviewSessionId: effectiveContext.interviewSessionId,
          context: {
            screenType: effectiveContext.screenType,
            screenId: effectiveContext.screenId,
            courseId: effectiveContext.courseId,
            courseTitle: effectiveContext.courseTitle,
            zoneId: effectiveContext.zoneId,
            zoneTitle: effectiveContext.zoneTitle,
            moduleId: effectiveContext.moduleId,
            moduleTitle: effectiveContext.moduleTitle,
            checkpointId: effectiveContext.checkpointId,
            checkpointTitle: effectiveContext.checkpointTitle,
            activityType: effectiveContext.activityType,
            activityTitle: effectiveContext.activityTitle,
            problemId: effectiveContext.problemId,
            problemTitle: effectiveContext.problemTitle,
          },
          rating,
          category,
          message: message?.trim() || undefined,
          includeContext,
          createdAt: new Date().toISOString(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          viewport:
            typeof window !== "undefined"
              ? { width: window.innerWidth, height: window.innerHeight }
              : undefined,
        }

        const res = await repository.submit(payload)
        if (res.success && res.id) {
          setLastSubmittedId(res.id)
        }
        setIsSubmitting(false)
        return res
      } catch (err) {
        setIsSubmitting(false)
        return {
          success: false,
          error: err instanceof Error ? err.message : "Failed to send feedback",
        }
      }
    },
    [effectiveContext, repository],
  )

  const value = useMemo<FeedbackContextValue>(
    () => ({
      isOpen,
      context: effectiveContext,
      prefilledRating,
      isSubmitting,
      lastSubmittedId,
      openFeedback,
      closeFeedback,
      setOverrideContext,
      submitFeedback,
    }),
    [
      isOpen,
      effectiveContext,
      prefilledRating,
      isSubmitting,
      lastSubmittedId,
      openFeedback,
      closeFeedback,
      setOverrideContext,
      submitFeedback,
    ],
  )

  return (
    <FeedbackContextInstance.Provider value={value}>
      {children}
    </FeedbackContextInstance.Provider>
  )
}

export function useFeedback(): FeedbackContextValue {
  const ctx = useContext(FeedbackContextInstance)
  if (!ctx) {
    throw new Error("useFeedback must be used within a FeedbackProvider")
  }
  return ctx
}
