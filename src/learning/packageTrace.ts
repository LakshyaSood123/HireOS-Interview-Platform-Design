// Pure helpers for showing a package trace (trace.json) inside a normal
// lesson. No React, no network. The wire format and its validation are owned
// by the backend (animationPackage.schema.ts); this only decides what the
// learner sees: which language tabs exist, which step matches the animation's
// current event, and what code to show for a given tab.

import type { CmsPackageTraceStep } from "../creator/dsa/animationPackageClient"

export const TRACE_LANGUAGES = ["pseudocode", "python", "cpp", "java"] as const
export type TraceLanguage = (typeof TRACE_LANGUAGES)[number]

export const TRACE_LANGUAGE_LABEL: Record<TraceLanguage, string> = {
  pseudocode: "Pseudocode",
  python: "Python",
  cpp: "C++",
  java: "Java",
}

/** Language tabs to show. Pseudocode is always present (required by the
 * schema). Every other language appears only when at least one step actually
 * provides code for it, so an empty C++ or Java tab is never rendered. */
export function presentTraceLanguages(steps: readonly CmsPackageTraceStep[]): TraceLanguage[] {
  return TRACE_LANGUAGES.filter(
    language => language === "pseudocode" || steps.some(step => Boolean(step.code[language]?.trim())),
  )
}

/** The code for one step in one language, or null when that step has none.
 * Deliberately NO fallback to pseudocode: showing pseudocode under a "Python"
 * tab would be misleading. */
export function codeForTraceLanguage(step: CmsPackageTraceStep, language: TraceLanguage): string | null {
  const code = step.code[language]
  return code && code.trim() ? code : null
}

/** The trace step bound to an animation event id (the id the package reports
 * in STEP_CHANGED, and the same id a trace step carries as `animationEvent`). */
export function findTraceStepForEvent(
  steps: readonly CmsPackageTraceStep[],
  eventId: string | null,
): CmsPackageTraceStep | undefined {
  if (!eventId) return undefined
  return steps.find(step => step.animationEvent === eventId)
}
