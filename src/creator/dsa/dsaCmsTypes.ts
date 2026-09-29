// Phase 1 of the DSA CMS content model — see PORT/DSA_CMS_SCHEMA task.
//
// This is deliberately NOT a redesign of the learner content shapes. Every
// content-bearing field here is the EXACT existing type from
// src/learning/types.ts (Lesson, LessonWorkspaceContent, CheckpointType) —
// copied by reference, never re-modeled — because those shapes are already
// plain, serializable data (no React, no functions) and are what
// LessonWorkspace/ModuleRoadmap/QuickCheckCard/CodeWorkspace/
// AnimationPlayback already know how to render. Re-inventing an equivalent
// shape here would just be a second schema that happens to look similar,
// which is exactly what PART 4 of the task forbids ("do not flatten to fit
// the generic CreatorCourse shape" — the inverse mistake of inventing a
// needlessly different one applies just as much).
//
// What IS new here is the CMS-specific container: stable back-references
// (moduleId/zoneId), explicit `order` (existing learner types encode order
// only via array position — CMS authoring wants it explicit and editable),
// and the `state: "active" | "archived"` seam so a future CMS can retire a
// module/checkpoint without hard-deleting a record other systems (progress,
// Feedback, Trail Guide) may still reference historically. No archive UI is
// built in this phase — only the schema seam.

import type { CheckpointType, Lesson, LessonWorkspaceContent, ModuleMasteryQuiz } from "../../learning/types"

/**
 * Custom HTML animations are a CMS-authoring-only concept — they never
 * exist in the learner-runtime `AlgorithmAnimationSpec` type
 * (src/learning/types.ts), which stays exactly `{ id, title? }` and
 * untouched (learner runtime still renders only registered animations from
 * the static `AlgorithmAnimation.tsx` registry; this CMS phase explicitly
 * does not switch it to backend-authored content). So — mirroring how the
 * BACKEND's `CmsAnimationSource` (cms.types.ts) is its own independently
 * defined type rather than importing a frontend one — this is Creator
 * Studio's own animation-source type, used only inside
 * `CmsDsaCheckpoint.workspace.animation` below, never inside
 * `LessonWorkspaceContent` itself.
 */
export const CMS_DSA_BRIDGE_MODES = ["standalone", "controlled", "synchronized"] as const
export type CmsDsaBridgeMode = (typeof CMS_DSA_BRIDGE_MODES)[number]

export interface CmsDsaRegisteredAnimationSource {
  kind: "registered"
  id: string
  title?: string
}
export interface CmsDsaCustomAnimationSource {
  kind: "custom"
  packageId: string
  /** `"draft"` while pointed at the package's editable working copy;
   * frozen to `"r1"`, `"r2"`, … at course-publish time — see
   * animationPackage.service.ts's `freezePackageRevisionIfNeeded` on the
   * backend (the actual freeze happens server-side; the frontend only ever
   * sets this to `"draft"` when the author picks "use latest edits"). */
  revisionId: string
  title?: string
  bridgeMode: CmsDsaBridgeMode
}
export type CmsDsaAnimationSource = CmsDsaRegisteredAnimationSource | CmsDsaCustomAnimationSource

/** A pre-existing draft loaded from the backend may still hold the bare
 * `{ id, title? }` shape (no `kind`) for a registered animation — the
 * backend normalizes this on read (cms.types.ts's `normalizeAnimationSource`)
 * so in practice every GET response already has `kind`, but this is kept
 * defensive on the frontend too rather than assuming that always holds. */
export function normalizeCmsDsaAnimationSource(value: unknown): CmsDsaAnimationSource | undefined {
  if (!value || typeof value !== "object") return undefined
  const v = value as Record<string, unknown>
  if (v.kind === "custom" && typeof v.packageId === "string" && typeof v.revisionId === "string") {
    return {
      kind: "custom",
      packageId: v.packageId,
      revisionId: v.revisionId,
      title: typeof v.title === "string" ? v.title : undefined,
      bridgeMode: (CMS_DSA_BRIDGE_MODES as readonly string[]).includes(v.bridgeMode as string) ? (v.bridgeMode as CmsDsaBridgeMode) : "standalone",
    }
  }
  if (typeof v.id === "string") {
    return { kind: "registered", id: v.id, title: typeof v.title === "string" ? v.title : undefined }
  }
  return undefined
}

/** Never hard-delete a published DSA entity — see PART 11 of the task.
 * "archived" is a seam only; no archive UX exists yet, and the importer/
 * adapter in this phase always produces "active". */
export type CmsEntityState = "active" | "archived"

/**
 * CMS Structured Trace — see the backend's `CmsTraceStep`/`CmsTraceSource`
 * (cms.types.ts) for why this is a separate, simpler, string-id-keyed model
 * from the existing learner-runtime `AlgorithmCodeTrace`
 * (codeTraceTypes.ts), which stays completely untouched. Absent
 * `traceSource` = "registered" (existing behavior: a registered animation's
 * existing Code Trace registry entry, unchanged, no migration).
 */
export interface CmsDsaTraceStep {
  stepId: string
  label: string
  pseudocode: string
  python?: string
  cpp?: string
  java?: string
  animationEvent?: string
}
export const CMS_DSA_TRACE_SOURCE_KINDS = ["registered", "cms", "package", "none"] as const
export type CmsDsaTraceSourceKind = (typeof CMS_DSA_TRACE_SOURCE_KINDS)[number]
export interface CmsDsaTraceSource {
  kind: CmsDsaTraceSourceKind
  steps?: CmsDsaTraceStep[]
}

/** The workspace shape actually stored on a CMS checkpoint — identical to
 * the learner `LessonWorkspaceContent` except `animation`, which uses this
 * module's own `CmsDsaAnimationSource` (see the comment above it), plus the
 * new `traceSource` field the learner type has no equivalent of at all. */
export type CmsDsaWorkspace = Omit<LessonWorkspaceContent, "animation"> & { animation?: CmsDsaAnimationSource; traceSource?: CmsDsaTraceSource }

/**
 * Preview Draft layout — constrained 12-column grid, scoped to one
 * checkpoint's own lesson blocks. Absent = the existing default stacked
 * order (`DEFAULT_LAYOUT_BLOCK_ORDER`), matching backend cms.types.ts
 * exactly — see this project's honest scope note: this data model,
 * validation, and the authoring editor below are real; actually
 * RE-ORDERING the live LessonWorkspace render to follow a custom layout is
 * not implemented in this pass (would mean modifying LessonWorkspace.tsx,
 * a shared component the real learner runtime also renders through, which
 * is out of scope for a time-boxed pass touching a protected component).
 */
export const CMS_DSA_LAYOUT_BLOCK_TYPES = ["concepts", "animation", "codeTrace", "quickCheck", "coding"] as const
export type CmsDsaLayoutBlockType = (typeof CMS_DSA_LAYOUT_BLOCK_TYPES)[number]
export const DEFAULT_LAYOUT_BLOCK_ORDER: readonly CmsDsaLayoutBlockType[] = ["concepts", "animation", "codeTrace", "quickCheck", "coding"]
export const CMS_DSA_LAYOUT_VERSION = 1
export interface CmsDsaLayoutBlock {
  type: CmsDsaLayoutBlockType
  span: number
  hidden?: boolean
}
export interface CmsDsaLayoutRow {
  blocks: CmsDsaLayoutBlock[]
}
export interface CmsDsaLayout {
  version: number
  rows: CmsDsaLayoutRow[]
}

export interface CmsDsaCheckpoint {
  /** MUST equal the existing learner Checkpoint.id exactly (e.g.
   * "hashing-3", "binary-search-3") — this id is already referenced by
   * local progress, Feedback, Trail Guide, animation ids, and Code Trace.
   * The importer never regenerates it. */
  id: string
  moduleId: string
  order: number
  title: string
  subtitle: string
  type: CheckpointType
  xp: number
  masteryXp?: number
  /** Checkpoint ids (within or across modules) that must be completed
   * first — copied verbatim from the live prerequisite graph
   * (courseRegistry.ts's chainSerially/fanOutFrom output), not
   * re-derived. */
  prerequisites: string[]
  /** Set only for the ~18 checkpoints still derived from the legacy
   * TrailNode model (today: Graphs, 1D DP, Final Mastery) — preserved so
   * the round-trip adapter can rebuild `Checkpoint.legacyNodeId` exactly. */
  legacyNodeId?: number
  /** Legacy-model content (TrailNode-derived checkpoints only). A
   * checkpoint has exactly one of `lesson` or `workspace`, mirroring
   * `Checkpoint` itself. */
  lesson?: Lesson
  /** New-model content (Lesson Workspace) — theory, quick check, coding
   * activity, and `animation: { id, title? }` where `id` is a stable
   * `AlgorithmAnimationId` REFERENCE only. No animation React component is
   * ever serialized here — the frontend continues to own every
   * implementation via AlgorithmAnimation.tsx's registry, keyed by this
   * same id. Code Trace is similarly a reference: `animation.id` doubles
   * as the `codeTraceRegistry.ts` lookup key, so no separate trace field
   * is needed to "preserve" it — it round-trips automatically as long as
   * the animation id round-trips. */
  workspace?: CmsDsaWorkspace
  questionIds?: string[]
  /** Absent = the existing default block order — see `CmsDsaLayout`'s header comment. */
  layout?: CmsDsaLayout
  state: CmsEntityState
}

export interface CmsDsaModule {
  /** MUST equal the existing learner Module.id exactly (e.g. "hashing",
   * "linked-structures") — BiomeTrailMap.tsx's scenic tiles hardcode 7 of
   * these ids directly. Never regenerated. */
  id: string
  zoneId: string
  order: number
  title: string
  description: string
  icon: string
  accentColor: string
  contentKind?: "legacy" | "workspace"
  /** Optional Module Mastery Quiz — plain data, carried through the
   * importer/adapter unchanged. Frontend draft model only for now; the
   * backend CMS content contract does not carry it yet. */
  quiz?: ModuleMasteryQuiz
  checkpoints: CmsDsaCheckpoint[]
  state: CmsEntityState
}

export interface CmsDsaZone {
  /** MUST equal the existing learner Zone.id exactly (e.g. "basecamp",
   * "pattern-meadows"). Never regenerated. */
  id: string
  order: number
  title: string
  description: string
  modules: CmsDsaModule[]
  state: CmsEntityState
}
