// Creator Studio / CMS demo — entirely separate data model from the
// learner-facing curriculum in src/learning/types.ts. Nothing here is
// consumed by Reagvis Trails today; CreatorPreview (components/CreatorPreview.tsx)
// renders it standalone. See src/creator/README.md for the full isolation
// rationale.

export type CmsDifficulty = "Beginner" | "Intermediate" | "Advanced"
export type CmsLanguage = "python" | "cpp" | "java"
export type CourseStatus = "draft" | "published-demo"

// ── Structured lesson content blocks (PART 14) — never one HTML blob. ──
export type LessonBlock =
  | { id: string; type: "explanation"; content: string }
  | { id: string; type: "keyPoints"; items: string[] }
  | { id: string; type: "example"; content: string }
  | { id: string; type: "codeExample"; language: CmsLanguage; code: string }
  | { id: string; type: "callout"; content: string }

export interface CreatorLessonActivity {
  id: string
  type: "lesson"
  order: number
  title: string
  objective?: string
  blocks: LessonBlock[]
  complexityTime?: string
  complexitySpace?: string
  estimatedMinutes?: number
  difficulty?: CmsDifficulty
}

export interface CreatorQuickCheckActivity {
  id: string
  type: "quick-check"
  order: number
  title: string
  question: string
  options: string[]
  correctIndex: number
  explanation?: string
}

export interface CmsTestCase {
  id: string
  input: string
  expected: string
}

export interface CreatorCodingActivity {
  id: string
  type: "coding"
  order: number
  title: string
  problemStatement: string
  functionName: string
  difficulty?: CmsDifficulty
  languages: CmsLanguage[]
  starterCode: Partial<Record<CmsLanguage, string>>
  visibleTests: CmsTestCase[]
}

export type CreatorActivity = CreatorLessonActivity | CreatorQuickCheckActivity | CreatorCodingActivity

export interface CreatorModule {
  id: string
  title: string
  description?: string
  order: number
  activities: CreatorActivity[]
}

export interface CreatorCourse {
  id: string
  slug: string
  version: number
  status: CourseStatus

  title: string
  shortDescription: string
  description?: string
  category: string
  difficulty: CmsDifficulty
  duration?: string
  instructor: string
  tags: string[]
  thumbnailDataUrl?: string
  accentColor?: string

  modules: CreatorModule[]

  createdAt: string
  updatedAt: string
}

export const CMS_ACCENT_COLORS = ["#1DB584", "#E2B44A", "#38BDF8", "#A855F7", "#F97316", "#EC4899"] as const

let idCounter = 0
/** Stable id generator — called once at creation time only, never on
 * render (PART 17: "Do NOT regenerate IDs every render"). */
export function newCmsId(prefix: string): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "untitled-course"
  )
}
