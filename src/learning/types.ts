// Normalized Reagvis Trails learning-engine domain model.
//
// Hierarchy: Course -> Zone -> Module -> Checkpoint -> Lesson -> Activity.
// This sits ALONGSIDE the older `src/data/reagvisCourses.ts` shapes
// (CourseData/TrailNode/BiomeZone/LessonContent) rather than replacing them —
// existing scenic/UI components (LessonReader, ChallengeStage, LessonModal,
// TrailHUD) still consume the old shapes directly, so `courseRegistry.ts`
// builds this new hierarchy BY WRAPPING the old data instead of duplicating
// lesson content. See LEARNING_ENGINE_ARCHITECTURE.md.

import type { LessonContent } from "../data/reagvisCourses"

/** Activity types the engine can eventually schedule inside a lesson. Only
 * "reading" and "quick-check" (and optionally "code") are populated today —
 * the rest exist so the model doesn't need to change shape when they land. */
export type ActivityType = "reading" | "quick-check" | "code" | "quiz" | "sql" | "simulation" | "design"

export interface Activity {
  id: string
  type: ActivityType
  title: string
}

/** A lesson's content is still the existing `LessonContent` shape (theory,
 * code snippet, quick check, optional challenge) — reused, not rewritten. */
export interface Lesson {
  id: string
  title: string
  content: LessonContent
  activities: Activity[]
}

export type CheckpointType = "lesson" | "checkpoint" | "challenge" | "boss"

/** Resolved progression state for a single checkpoint. Computed by
 * `progressEngine.ts` from a learner's `LearnerProgressState` — never stored
 * as a literal on the checkpoint itself. */
export type ProgressState = "locked" | "available" | "current" | "completed" | "mastered"

export interface Checkpoint {
  id: string
  /** Bridges back to the legacy numeric `TrailNode.id` in reagvisCourses.ts,
   * for checkpoints derived from that old data so consumers still on the old
   * shapes (LessonReader, ChallengeStage) keep working. Checkpoints authored
   * directly in the new model (e.g. the Trees module) have no legacy node
   * and omit this. */
  legacyNodeId?: number
  title: string
  subtitle: string
  type: CheckpointType
  xp: number
  /** Extra XP awarded, and this checkpoint added to `masteredCheckpointIds`
   * instead of just `completedCheckpointIds`, on completion. Only set on a
   * module's terminal checkpoint (see progressEngine.ts's completeCheckpoint). */
  masteryXp?: number
  /** Checkpoint ids that must be completed before this one is `available`. */
  prerequisites: string[]
  /** Old-model lesson (LessonContent-based) — set for checkpoints derived
   * from reagvisCourses.ts's TrailNodes. */
  lesson?: Lesson
  /** New-model lesson — set for checkpoints authored directly for the
   * generic Lesson Workspace (src/components/lesson/LessonWorkspace.tsx).
   * A checkpoint has exactly one of `lesson` or `workspace`, never both. */
  workspace?: LessonWorkspaceContent
  /** InterviewQuestionMeta ids (below) this checkpoint draws its practice
   * question(s) from — optional, metadata-only linkage for the future
   * Grind75/company-question integration. Not required for a checkpoint to
   * have a `codingActivity`; today's activities are original wording even
   * when a `questionIds` entry names the canonical problem they're modeled
   * after. */
  questionIds?: string[]
}

export interface Module {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  checkpoints: Checkpoint[]
  /** Which UI renders this module's checkpoints. "legacy" = the original
   * LessonReader/ChallengeStage pages (reagvisView "lesson"/"challenge").
   * "workspace" = the new generic Lesson Workspace (reagvisView
   * "roadmap"/"workspace"). Defaults to "legacy" when absent. */
  contentKind?: "legacy" | "workspace"
}

// ── Generic Lesson Workspace content model ──────────────────────────────
// Deliberately course-agnostic: DBMS/OS/Networks/System Design checkpoints
// will reuse these same shapes (a SQL activity is still a "CodingActivityContent"
// with language "sql", a network diagram is still a "visual", etc.) rather than
// each course inventing its own lesson shape. Only `TraversalVisual`/`TreeVizNode`
// below are tree-specific — everything else is generic.

export interface TheoryBlock {
  heading: string
  body: string
}

/** A simple binary tree, for the Trees module's traversal visualization.
 * Tree-specific by necessity (a SQL lesson's "visual" would be a different
 * shape entirely) — kept out of the generic Activity/Lesson types. */
export interface TreeVizNode {
  value: number
  left?: TreeVizNode
  right?: TreeVizNode
}

export interface TraversalVisual {
  tree: TreeVizNode
  preorder: number[]
  inorder: number[]
  postorder: number[]
}

/** "javascript" exists only for the legacy ChallengeStage adapter
 * (src/learning/legacyChallengeAdapter.ts) — every new-model activity
 * (Trees, Foundations, Linked Lists, Recursion) uses python/cpp/java. */
export type CodeLanguage = "python" | "cpp" | "java" | "javascript"

export interface CodeExample {
  language: CodeLanguage
  code: string
}

export interface TestCase {
  id: string
  description: string
  input: string
  expected: string
}

export interface CodingActivityContent {
  prompt: string
  constraints?: string[]
  /** Function name the mock runner looks for in the submission — see
   * MockCodeRunner in services/codeRunner.ts. */
  functionName: string
  /** Substrings the mock heuristic looks for to judge whether an attempt is
   * "complete enough" (e.g. ["left", "right"] for a tree traversal). Not
   * real static analysis — see codeRunner.ts's documented limitations. */
  requiredKeywords: string[]
  starterCode: Partial<Record<CodeLanguage, string>>
  languages: CodeLanguage[]
  visibleTests: TestCase[]
  hiddenTests: TestCase[]
  hint: string
  mistakeFeedback: string
  /** DEMO-ONLY canonical correct solution per language, used exclusively by
   * CodeWorkspace's "Auto-fill Demo Answer" button (gated behind
   * DEVELOPMENT_MODE.DEMO_CODE_AUTOFILL_ENABLED — see
   * src/config/developmentMode.ts). Never shown to a normal learner and
   * never read by anything else. Not required for every language in
   * `languages` to keep authoring incremental, but every activity should
   * have one per declared language. */
  demoSolution?: Partial<Record<CodeLanguage, string>>
}

export interface QuickCheckContent {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

/** One step in a call-stack animation — "push a call," "hit the base case,"
 * or "pop/return a value." Generic over any recursive function, not tied to
 * factorial — see CallStackVisual.tsx. */
export interface CallStackFrame {
  label: string
  kind: "call" | "base-case" | "return"
  detail?: string
}

export interface CallStackVisualSpec {
  frames: CallStackFrame[]
}

export interface TwoPointerVisualSpec {
  values: number[]
  mode: "opposite" | "same-direction"
}

export type AlgorithmAnimationId = "arrays-in-place-reversal"

export interface AlgorithmAnimationSpec {
  id: AlgorithmAnimationId
  title?: string
}

export interface LessonWorkspaceContent {
  title: string
  theory: TheoryBlock[]
  learnMore?: string
  /** Each visual type is its own optional field (rather than one polymorphic
   * "visual" union) — same reasoning as TraversalVisual: a tree diagram, a
   * call-stack animation, and a pointer-movement strip are genuinely
   * different shapes, not variants of one generic "visual." At most one is
   * ever set per checkpoint. */
  visual?: TraversalVisual
  callStackVisual?: CallStackVisualSpec
  twoPointerVisual?: TwoPointerVisualSpec
  animation?: AlgorithmAnimationSpec
  codeExamples?: CodeExample[]
  quickCheck?: QuickCheckContent
  codingActivity?: CodingActivityContent
}

// ── Question metadata layer ──────────────────────────────────────────────
// Architecture only — no Grind75 import, no scraping, no company data. See
// src/learning/content/questionMeta.ts for the small curated set and
// LEARNING_ENGINE_ARCHITECTURE.md for how this is meant to be used later.

export type QuestionSource = "grind75" | "company" | "internal"
export type QuestionDifficulty = "easy" | "medium" | "hard"

/** What purpose a question serves in a learner's path through a module —
 * lets a future adaptive-selection layer (not built yet) choose which
 * question to serve without changing this shape. */
export type QuestionRole = "core" | "reinforcement" | "challenge" | "mastery" | "company-mission"

export interface InterviewQuestionMeta {
  id: string
  title: string
  source: QuestionSource
  /** Link to the original problem (LeetCode/Grind75/etc.) — we store the
   * pointer, never the problem statement itself; our own lesson/challenge
   * wording is always original (see PART 12 of the course-expansion task). */
  externalUrl?: string
  difficulty: QuestionDifficulty
  topics: string[]
  moduleId: string
  role: QuestionRole
  estimatedMinutes?: number
  /** Reserved for future company-question integration (PART 14) — left
   * undefined today; no fake frequency/recency data is fabricated. */
  companyIds?: string[]
  recencyWindow?: string
  frequencyScore?: number
}

export interface Zone {
  id: string
  title: string
  description: string
  modules: Module[]
}

export interface Course {
  id: string
  title: string
  description: string
  provider: string
  zones: Zone[]
}
