// Creator Studio / CMS demo — entirely separate data model from the
// learner-facing curriculum in src/learning/types.ts. Nothing here is
// consumed by Reagvis Trails today; CreatorPreview (components/CreatorPreview.tsx)
// renders it standalone. See src/creator/README.md for the full isolation
// rationale.

import type { CmsDsaZone } from "./dsa/dsaCmsTypes"

export type CmsDifficulty = "Beginner" | "Intermediate" | "Advanced"
export type CmsLanguage = "python" | "cpp" | "java"
export type CourseStatus = "draft" | "published-demo"

/** "standard" is every course Creator Studio has authored so far (e.g.
 * Python Foundations) — flat `modules: CreatorActivity[]`, unchanged by
 * this field's existence. "structured-dsa" is new (Phase 1, see
 * src/creator/dsa/**): a course that carries the richer Zone -> Module ->
 * Checkpoint hierarchy the existing DSA curriculum needs, in `dsaZones`
 * instead of (or alongside) `modules`. Absent on a CreatorCourse means
 * "standard" — every existing course and every existing code path that
 * reads `course.modules` keeps working exactly as before. */
export type CourseType = "standard" | "structured-dsa"

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
  /** Defaults to "standard" when absent — see `CourseType`'s doc comment.
   * Existing courses (Python Foundations, any course created through the
   * current Course Details form) never set this and are completely
   * unaffected. */
  courseType?: CourseType
  /** Versioning seam for a future "Create Draft from Published" flow (PART
   * 10 of the DSA CMS schema task) — the version this draft was branched
   * from, so a future backend can show "editing v2, based on published v1"
   * without needing a schema change later. Not read or written by anything
   * yet in this phase. */
  createdFromVersion?: number

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
  /** Only meaningful when `courseType === "structured-dsa"`. Holds the
   * full Zone -> Module -> Checkpoint hierarchy; `modules` stays empty for
   * a structured-dsa course since `CreatorActivity`'s flat lesson/
   * quick-check/coding union can't represent a DSA checkpoint's richer
   * shape (legacy-vs-workspace content, prerequisites, masteryXp, combined
   * quickCheck+animation, etc.) without losing information — see PART 4 of
   * the task. */
  dsaZones?: CmsDsaZone[]

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
