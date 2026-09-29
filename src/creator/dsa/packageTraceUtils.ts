// Pure helpers for the package-trace ("trace.json") authoring workflow —
// no network, no React. The backend (animationPackage.service.ts /
// animationPackage.schema.ts) is the actual authority: it rejects an
// invalid trace.json at upload time. This file re-implements the SAME rules
// client-side purely for live editor feedback on already-accepted data —
// the same "duplicate, not delegate" pattern dsaDraftValidation.ts already
// uses for the course draft (see its own header comment).

import type { CmsPackageTrace, CmsPackageTraceStep } from "./animationPackageClient"
import type { CmsDsaTraceStep } from "./dsaCmsTypes"

// Mirrors the backend's ANIMATION_PACKAGE_LIMITS (animationPackage.types.ts)
// — kept in sync by hand, same convention as animationBridge.ts's
// CMS_PACKAGE_CAPABILITIES duplicating the backend's own copy.
export const PACKAGE_TRACE_LIMITS = {
  maxSteps: 200,
  stepIdMaxChars: 64,
  labelMaxChars: 200,
  codeMaxChars: 2000,
  jsonMaxBytes: 200_000,
} as const

export interface PackageTraceValidationIssue {
  severity: "error" | "warning"
  message: string
}

export interface PackageTraceSummary {
  stepCount: number
  languages: { pseudocode: boolean; python: boolean; cpp: boolean; java: boolean }
  eventsDeclaredByManifest: number
  eventsMatched: number
  eventsTotal: number
  issues: PackageTraceValidationIssue[]
}

/** Read-only inspection of an already-persisted (backend-validated)
 * package trace, for the "PACKAGE TRACE FOUND" summary panel. Warnings
 * (e.g. a language missing for one step) never block anything here — only
 * upload-time backend validation blocks. */
export function summarizePackageTrace(trace: CmsPackageTrace, manifestTraceEvents: readonly string[]): PackageTraceSummary {
  const issues: PackageTraceValidationIssue[] = []
  const languages = { pseudocode: true, python: true, cpp: true, java: true }
  let eventsMatched = 0
  let eventsWithId = 0

  const declared = new Set(manifestTraceEvents)
  const seenIds = new Set<string>()

  for (const step of trace.steps) {
    if (!step.code.pseudocode.trim()) languages.pseudocode = false
    if (!step.code.python?.trim()) languages.python = false
    if (!step.code.cpp?.trim()) languages.cpp = false
    if (!step.code.java?.trim()) languages.java = false

    if (!step.code.python?.trim()) issues.push({ severity: "warning", message: `Python missing for step "${step.id}".` })
    if (!step.code.cpp?.trim()) issues.push({ severity: "warning", message: `C++ missing for step "${step.id}".` })
    if (!step.code.java?.trim()) issues.push({ severity: "warning", message: `Java missing for step "${step.id}".` })

    if (seenIds.has(step.id)) issues.push({ severity: "error", message: `Duplicate trace step id "${step.id}".` })
    seenIds.add(step.id)

    if (step.animationEvent) {
      eventsWithId += 1
      if (declared.size > 0 && !declared.has(step.animationEvent)) {
        issues.push({ severity: "error", message: `Trace step "${step.id}" references undeclared animation event "${step.animationEvent}".` })
      } else {
        eventsMatched += 1
      }
    }
  }

  return {
    stepCount: trace.steps.length,
    languages,
    eventsDeclaredByManifest: manifestTraceEvents.length,
    eventsMatched,
    eventsTotal: eventsWithId,
    issues,
  }
}

/** Flattens `trace.json`'s wire shape (`id`, nested `code.{...}`) into the
 * existing internal `CmsDsaTraceStep` shape (`stepId`, flat fields) used by
 * CMS Structured trace — the ONE internal structured-trace model; see
 * animationPackageClient.ts's `CmsPackageTraceStep` comment. */
export function packageTraceStepToCmsDsaTraceStep(step: CmsPackageTraceStep): CmsDsaTraceStep {
  return {
    stepId: step.id,
    label: step.label,
    pseudocode: step.code.pseudocode,
    python: step.code.python ?? undefined,
    cpp: step.code.cpp ?? undefined,
    java: step.code.java ?? undefined,
    animationEvent: step.animationEvent ?? undefined,
  }
}
