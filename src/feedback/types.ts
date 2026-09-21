export type FeedbackSentiment = 1 | 2 | 3 | 4

export type FeedbackCategory =
  | "bug"
  | "ui"
  | "content"
  | "confusing"
  | "suggestion"
  | "other"
  | "problem-statement"
  | "compiler-run"
  | "navigation"
  | "progress"

export type ScreenType =
  | "course-library"
  | "dsa-world"
  | "zone"
  | "module"
  | "module-roadmap"
  | "lesson"
  | "coding-challenge"
  | "algorithm-animation"
  | "concept-theory"
  | "quick-check"
  | "code-trace"
  | "interview-results"
  | "interview-session"
  | "dashboard"
  | "general"

export interface FeedbackContext {
  screenId: string
  screenType: ScreenType
  title: string
  subtitle?: string
  breadcrumb?: string[]

  courseId?: string
  courseTitle?: string
  zoneId?: string
  zoneTitle?: string
  moduleId?: string
  moduleTitle?: string
  checkpointId?: string
  checkpointTitle?: string
  activityType?: string
  activityTitle?: string
  problemId?: string
  problemTitle?: string
  animationId?: string
  interviewSessionId?: string

  additionalDetails?: Record<string, string | number | boolean | null | undefined>
}

export interface FeedbackSubmissionPayload {
  screenId: string
  screenType: ScreenType
  title: string
  subtitle?: string
  breadcrumb?: string[]

  courseId?: string
  courseTitle?: string
  zoneId?: string
  zoneTitle?: string
  moduleId?: string
  moduleTitle?: string
  checkpointId?: string
  checkpointTitle?: string
  activityType?: string
  activityTitle?: string
  problemId?: string
  problemTitle?: string
  animationId?: string
  interviewSessionId?: string

  /** Future backend payload nesting support */
  context?: {
    screenType: ScreenType
    screenId?: string
    courseId?: string
    courseTitle?: string
    zoneId?: string
    zoneTitle?: string
    moduleId?: string
    moduleTitle?: string
    checkpointId?: string
    checkpointTitle?: string
    activityType?: string
    activityTitle?: string
    problemId?: string
    problemTitle?: string
  }

  rating?: FeedbackSentiment
  category: FeedbackCategory
  message?: string
  includeContext: boolean

  createdAt: string
  userAgent?: string
  viewport?: {
    width: number
    height: number
  }
}

export interface FeedbackRecord extends FeedbackSubmissionPayload {
  id: string
}

