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

import type { CheckpointType, Lesson, LessonWorkspaceContent } from "../../learning/types"

/** Never hard-delete a published DSA entity — see PART 11 of the task.
 * "archived" is a seam only; no archive UX exists yet, and the importer/
 * adapter in this phase always produces "active". */
export type CmsEntityState = "active" | "archived"

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
  workspace?: LessonWorkspaceContent
  questionIds?: string[]
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
