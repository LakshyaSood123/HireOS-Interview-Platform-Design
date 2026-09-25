// Experiment Mode — structured, per-animation input configuration.
//
// Deliberately NOT one shared { values?, target?, left?, right?, k? } bag: a
// binary search config and a sliding window config mean different things by
// "the second number", and a shared optional-everything interface would let
// a learner silently supply a `k` where the algorithm doesn't have one. Each
// supported animation gets its own small, fully-required shape instead.
//
// This is display/interaction state only — never sent anywhere, never
// executed, never mixed into learner progress or CMS content.

import type { AlgorithmAnimationId } from "../types"

export interface ArrayReversalConfig {
  values: number[]
}

export interface BinarySearchConfig {
  values: number[]
  target: number
}

export interface TwoPointersConfig {
  values: number[]
  target: number
}

export interface SlidingWindowConfig {
  values: number[]
  /** The sum limit the window must stay at or under — the actual bound this
   * lesson's algorithm tracks. Not a fixed window length: the lesson teaches
   * a VARIABLE-size window, so a "k" field would misrepresent it. */
  limit: number
}

export interface HashingComplementConfig {
  values: number[]
  target: number
}

export type TraceExperimentConfig =
  | ArrayReversalConfig
  | BinarySearchConfig
  | TwoPointersConfig
  | SlidingWindowConfig
  | HashingComplementConfig

/** The only animations Experiment Mode supports in this version. Every
 * other animation id simply has no entry here, and the UI hides the
 * Experiment button for it — see traceExperimentSimulators.ts's registry. */
export const EXPERIMENT_SUPPORTED_IDS: readonly AlgorithmAnimationId[] = [
  "arrays-in-place-reversal",
  "binary-search-decision",
  "two-pointers-opposite-sum",
  "sliding-window-variable",
  "hashing-complement-lookup",
]

export const EXPERIMENT_MIN_VALUES = 2
export const EXPERIMENT_MAX_VALUES = 12
/** Generous enough for any teaching example, small enough that no generated
 * array of numbers can visually overflow the fixed-width cell row this
 * shares with the authored lesson. */
export const EXPERIMENT_VALUE_MIN = -999
export const EXPERIMENT_VALUE_MAX = 999
