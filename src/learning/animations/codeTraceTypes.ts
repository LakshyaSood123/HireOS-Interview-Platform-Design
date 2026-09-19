// Generic types for the synchronized pseudocode "Code Trace" feature.
//
// A trace is purely DISPLAY data — CodeTracePanel.tsx never calls
// completeCheckpointById, never touches LearnerProgressState/XP/lives, and
// never runs/submits code. It exists solely to show, for the animation's
// CURRENT semantic step, which pseudocode line caused it and which values
// changed — see the approved 29-module trace specification for the
// authored content itself (src/learning/animations/codeTraceRegistry.ts).

import type { AlgorithmAnimationId } from "../types"

export type TraceStatusTone = "neutral" | "valid" | "invalid" | "warning"

export interface CodeTraceVariableChange {
  name: string
  /** Omitted for a pure informational readout (no real transition to show). */
  from?: string
  to: string
  status?: "changed" | "valid" | "invalid" | "info"
}

export interface CodeTraceState {
  /** Pseudocode line(s), 1-indexed, causing the current animation step.
   * Usually one line, occasionally two tightly coupled ones. Multiple lines
   * are also used to represent a compressed animation state that stands in
   * for several real operations — see the spec's "Compressed-State Handling"
   * section — rather than inventing an extra timeline step. */
  activeLines: number[]
  /** Prior line(s) whose effect is still visible in this step. */
  executedLines?: number[]
  /** Only real value transitions between the previous and current state —
   * never fabricated for visual effect. Omit entirely when nothing changed. */
  changes?: CodeTraceVariableChange[]
  status?: {
    label: string
    tone: TraceStatusTone
  }
  /** One short sentence. Never a paragraph. */
  note?: string
}

/** How a checkpoint's Code Trace should be surfaced. Every one of the 29
 * current animations sits on a pure "lesson" checkpoint (never a coding
 * challenge), so all 29 use ALWAYS_VISIBLE today. The other two values are
 * reserved for a future animation attached to a challenge/assessment
 * checkpoint — nothing wires attempt-state or CodeWorkspace coupling yet. */
export type TraceVisibility = "ALWAYS_VISIBLE" | "OPTIONAL_HINT" | "REVEAL_AFTER_ATTEMPT"

export interface AlgorithmCodeTrace {
  title?: string
  /** Stable, numbered pseudocode listing — authored once, never rewritten
   * between states. Only `states[i]`'s highlighting/metadata changes. */
  pseudocode: string[]
  /** states[i] corresponds 1:1 to the paired animation's states[i]. Trace
   * state COUNT must exactly equal that animation's semantic state count —
   * see validateCodeTraces() in codeTraceRegistry.ts. */
  states: CodeTraceState[]
  visibility: TraceVisibility
}

export type CodeTraceRegistryShape = Partial<Record<AlgorithmAnimationId, AlgorithmCodeTrace>>
