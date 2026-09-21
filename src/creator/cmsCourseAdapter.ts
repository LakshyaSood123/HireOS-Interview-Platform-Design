// Bridges Creator Studio's authoring model (CreatorCourse/CreatorModule/
// CreatorActivity, src/creator/types.ts) to the real learner-facing Course
// Library, WITHOUT coupling learner UI directly to the authoring types.
// This is the one seam a future backend (ApiCourseRepository) replaces —
// callers only ever depend on the types exported from this file.

import { courseAuthoringRepository } from "./courseAuthoringRepository"
import type { CreatorCourse, CreatorModule, CreatorActivity, LessonBlock } from "./types"
import type { LibraryCourse } from "../data/reagvisCourses"
import type {
  Module,
  Checkpoint,
  CheckpointType,
  LessonWorkspaceContent,
  TheoryBlock,
  CodeExample,
  QuickCheckContent,
  CodingActivityContent,
  TestCase,
} from "../learning/types"

export interface UnifiedLibraryCourse extends LibraryCourse {
  source: "static" | "cms"
}

/** A generic icon rotation for CMS courses — Creator Studio does not (yet)
 * author a biome icon, so this keeps Course Library cards visually
 * consistent with the existing static cards without inventing per-course
 * DSA-style biome lore. */
const CMS_CARD_ICON = "🎓"

function countActivities(course: CreatorCourse): number {
  return course.modules.reduce((sum, m) => sum + m.activities.length, 0)
}

export function toLibraryCard(course: CreatorCourse): UnifiedLibraryCourse {
  return {
    id: course.id,
    title: course.title,
    biomeTitle: course.category || "Creator Studio",
    biomeIcon: CMS_CARD_ICON,
    accentColor: course.accentColor ?? "#1DB584",
    description: course.shortDescription,
    duration: course.duration ?? "Self-paced",
    lessonCount: countActivities(course),
    difficulty: course.difficulty,
    status: "available",
    source: "cms",
  }
}

/** Only `status === "published-demo"` courses are visible to learners —
 * drafts never leave Creator Studio. See PART "Published only" of the CMS
 * integration task. */
export function getPublishedCmsCourses(): CreatorCourse[] {
  return courseAuthoringRepository.listCourses().filter(c => c.status === "published-demo")
}

export function getPublishedCmsLibraryCards(): UnifiedLibraryCourse[] {
  return getPublishedCmsCourses().map(toLibraryCard)
}

export function getPublishedCmsCourseById(id: string): CreatorCourse | undefined {
  const course = courseAuthoringRepository.getCourse(id)
  return course && course.status === "published-demo" ? course : undefined
}

// ─────────────────────────────────────────────────────────────────────────
// CANONICAL LEARNER MODEL ADAPTER
//
// Converts CreatorModule/CreatorActivity into the SAME Module/Checkpoint
// shapes the static DSA curriculum uses (src/learning/types.ts), so the
// real ModuleRoadmap and LessonWorkspace components can render CMS content
// completely unmodified — no second learner UI. XP is always 0 and
// prerequisites are always empty here; CMS progression (which checkpoints
// are locked/available/completed) is resolved separately by
// cmsProgressRepository.ts, never by the DSA progress engine.
// ─────────────────────────────────────────────────────────────────────────

function getBlock<T extends LessonBlock["type"]>(blocks: LessonBlock[], type: T): Extract<LessonBlock, { type: T }> | undefined {
  return blocks.find(b => b.type === type) as Extract<LessonBlock, { type: T }> | undefined
}

/** A CMS lesson's freeform blocks -> LessonWorkspaceContent's fixed
 * theory/learnMore/codeExamples shape. Nothing here is invented — every
 * field only appears when the author actually filled it in. */
function lessonActivityToWorkspace(act: Extract<CreatorActivity, { type: "lesson" }>): LessonWorkspaceContent {
  const theory: TheoryBlock[] = []

  if (act.objective) {
    theory.push({ heading: "Learning Objective", body: act.objective })
  }
  const explanation = getBlock(act.blocks, "explanation")
  if (explanation?.content) {
    theory.push({ heading: "Explanation", body: explanation.content })
  }
  const keyPoints = getBlock(act.blocks, "keyPoints")
  const items = keyPoints?.items.filter(Boolean) ?? []
  if (items.length > 0) {
    theory.push({ heading: "Key Points", body: items.map(i => `• ${i}`).join("  ") })
  }
  const callout = getBlock(act.blocks, "callout")
  if (callout?.content) {
    theory.push({ heading: "Note", body: callout.content })
  }
  if (act.complexityTime || act.complexitySpace) {
    const parts = [act.complexityTime && `Time: ${act.complexityTime}`, act.complexitySpace && `Space: ${act.complexitySpace}`].filter(Boolean)
    theory.push({ heading: "Complexity", body: parts.join("  •  ") })
  }

  const example = getBlock(act.blocks, "example")
  const codeExampleBlock = getBlock(act.blocks, "codeExample")
  const codeExamples: CodeExample[] | undefined = codeExampleBlock
    ? [{ language: codeExampleBlock.language, code: codeExampleBlock.code }]
    : undefined

  return {
    title: act.title,
    theory,
    learnMore: example?.content,
    codeExamples,
  }
}

function quickCheckActivityToWorkspace(act: Extract<CreatorActivity, { type: "quick-check" }>): LessonWorkspaceContent {
  const quickCheck: QuickCheckContent = {
    question: act.question,
    options: act.options,
    correctIndex: act.correctIndex,
    explanation: act.explanation ?? "",
  }
  return { title: act.title, theory: [], quickCheck }
}

function codingActivityToWorkspace(act: Extract<CreatorActivity, { type: "coding" }>): LessonWorkspaceContent {
  const visibleTests: TestCase[] = act.visibleTests.map((t, i) => ({
    id: t.id,
    description: t.input ? `Test ${i + 1}: ${t.input}` : `Test ${i + 1}`,
    input: t.input,
    expected: t.expected,
  }))

  const codingActivity: CodingActivityContent = {
    prompt: act.problemStatement,
    functionName: act.functionName,
    requiredKeywords: [],
    starterCode: act.starterCode,
    languages: act.languages,
    visibleTests,
    hiddenTests: [],
    hint: "",
    mistakeFeedback: "",
  }
  return { title: act.title, theory: [], codingActivity }
}

const CHECKPOINT_TYPE_FOR_ACTIVITY: Record<CreatorActivity["type"], CheckpointType> = {
  lesson: "lesson",
  "quick-check": "checkpoint",
  coding: "challenge",
}

function subtitleForActivity(act: CreatorActivity): string {
  if (act.type === "lesson") return act.objective || "Lesson"
  if (act.type === "quick-check") return "Quick Check"
  return "Coding Exercise"
}

export function toLearnerCheckpoint(act: CreatorActivity): Checkpoint {
  const workspace =
    act.type === "lesson"
      ? lessonActivityToWorkspace(act)
      : act.type === "quick-check"
        ? quickCheckActivityToWorkspace(act)
        : codingActivityToWorkspace(act)

  return {
    id: act.id,
    title: act.title,
    subtitle: subtitleForActivity(act),
    type: CHECKPOINT_TYPE_FOR_ACTIVITY[act.type],
    xp: 0,
    prerequisites: [],
    workspace,
  }
}

const MODULE_ICON = "📘"

export function toLearnerModule(mod: CreatorModule, accentColor: string): Module {
  return {
    id: mod.id,
    title: mod.title,
    description: mod.description ?? "",
    icon: MODULE_ICON,
    accentColor,
    checkpoints: mod.activities.slice().sort((a, b) => a.order - b.order).map(toLearnerCheckpoint),
    contentKind: "workspace",
  }
}

export function toLearnerModules(course: CreatorCourse): Module[] {
  return course.modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map(mod => toLearnerModule(mod, course.accentColor ?? "#1DB584"))
}
