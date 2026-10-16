// Deterministic, template-based prompt generation for "Generate AI Package
// Prompt" / "Generate AI Trace Prompt" / "Generate Full Animation + Trace
// Prompt". NO network call, NO AI API — this only ever builds a plain text
// string from the CURRENT real contract (bridge, manifest, trace.json
// schema) plus whatever checkpoint context is actually available. Every
// fact asserted here (file names, message names, capability names) is
// pulled from this project's own constants, not invented — see
// animationBridge.ts and packageTraceUtils.ts for the sources of truth.

import { BRIDGE_VERSION, BRIDGE_COMMANDS, BRIDGE_EVENTS, CMS_PACKAGE_CAPABILITIES } from "./animationBridge"
import { PACKAGE_TRACE_LIMITS } from "./packageTraceUtils"
import type { CmsDsaBridgeMode } from "./dsaCmsTypes"

export type PromptMode = "animation" | "trace" | "full"

export interface PromptLanguageSelection {
  pseudocode: boolean
  python: boolean
  cpp: boolean
  java: boolean
}

export interface PromptOptions {
  mode: PromptMode
  bridgeMode: CmsDsaBridgeMode
  languages: PromptLanguageSelection
}

/** Everything real, available checkpoint context can supply. Every field is
 * optional and OMITTED from the generated prompt when absent — nothing here
 * is ever fabricated (PART 9: "Do NOT fabricate missing educational
 * content. If a field does not exist: omit it."). */
export interface PromptContext {
  courseTitle?: string
  zoneTitle?: string
  moduleTitle?: string
  checkpointTitle?: string
  lessonTitle?: string
  theory?: { heading: string; body: string }[]
  quickCheckQuestion?: string
  existingCodeExamples?: { language: string; code: string }[]
  /** Existing CMS Structured trace steps, if any — useful reference
   * pseudocode/language content for a Trace-only prompt when the author
   * already has SOME manual trace authored. */
  existingTraceSteps?: { label: string; pseudocode: string }[]
  animationTitle?: string
  heightPx?: number
  /** The package's OWN currently-declared manifest.traceEvents, if any —
   * when present, the Trace-only prompt instructs the AI to use ONLY these
   * ids (PART 12), preventing manifest/trace mismatches. */
  declaredTraceEvents?: string[]
}

const LANG_LABELS: Record<keyof PromptLanguageSelection, string> = { pseudocode: "Pseudocode", python: "Python", cpp: "C++", java: "Java" }

function section(title: string, body: string): string {
  return `## ${title}\n${body.trim()}\n`
}

function contextBlock(ctx: PromptContext): string {
  const lines: string[] = []
  if (ctx.courseTitle) lines.push(`Course: ${ctx.courseTitle}`)
  if (ctx.zoneTitle) lines.push(`Zone: ${ctx.zoneTitle}`)
  if (ctx.moduleTitle) lines.push(`Module: ${ctx.moduleTitle}`)
  if (ctx.checkpointTitle) lines.push(`Checkpoint: ${ctx.checkpointTitle}`)
  if (ctx.lessonTitle && ctx.lessonTitle !== ctx.checkpointTitle) lines.push(`Lesson title: ${ctx.lessonTitle}`)
  if (ctx.animationTitle) lines.push(`Animation title: ${ctx.animationTitle}`)
  if (ctx.theory && ctx.theory.length > 0) {
    lines.push("", "Concept / theory content already authored for this checkpoint (for context — do not just restate it, use it to make the animation and trace pedagogically accurate):")
    for (const block of ctx.theory) lines.push(`- ${block.heading}: ${block.body}`)
  }
  if (ctx.quickCheckQuestion) lines.push("", `Quick Check question already authored for this checkpoint: "${ctx.quickCheckQuestion}"`)
  if (ctx.existingCodeExamples && ctx.existingCodeExamples.length > 0) {
    lines.push("", "Existing reference code examples for this checkpoint:")
    for (const ex of ctx.existingCodeExamples) lines.push(`\`\`\`${ex.language}\n${ex.code}\n\`\`\``)
  }
  if (ctx.existingTraceSteps && ctx.existingTraceSteps.length > 0) {
    lines.push("", "Existing manually-authored trace steps for this checkpoint (use as a reference for the algorithm's actual step sequence):")
    for (const step of ctx.existingTraceSteps) lines.push(`- ${step.label}: ${step.pseudocode}`)
  }
  return lines.join("\n")
}

const SECURITY_RULES = `- plain HTML/CSS/JavaScript only — no React, no build step, no npm/node_modules
- must work by being embedded directly inside a sandboxed <iframe sandbox="allow-scripts"> (no allow-same-origin, no allow-forms, no allow-popups, no allow-top-navigation)
- no external network dependencies of any kind:
  - no CDN scripts or stylesheets
  - no remote fonts
  - no fetch, XHR, or WebSocket calls
  - no calls to any external API
- do not attempt to access parent.document, parent.localStorage, or parent.sessionStorage — the sandbox blocks this and it will simply fail
- do not attempt window.top.location navigation or window.open() popups — both are blocked
- all images/fonts/other assets must be packaged locally under assets/ (png, jpg, jpeg, gif, or webp only) — no external URLs`

function manifestSchemaBlock(): string {
  return `manifest.json (all fields except the ones marked optional are required):
{
  "heightPx": 420,                          // integer, 80-2000
  "capabilities": [${CMS_PACKAGE_CAPABILITIES.map((c) => `"${c}"`).join(", ")}],  // subset — only list commands your animation.js actually handles
  "traceEvents": ["initialize", "compare-mid", "..."]  // optional — every semantic step id your animation emits via STEP_CHANGED / accepts via GOTO_STEP
}
Every animation semantic event used by trace.json's "animationEvent" field MUST appear in this traceEvents list, or the package upload will be rejected.`
}

function traceSchemaBlock(): string {
  return `trace.json (optional file; version and steps are required, animationEvent and the language fields are optional except pseudocode):
{
  "version": 1,
  "steps": [
    {
      "id": "initialize",                    // unique, alphanumeric + "_"/"-" only, max ${PACKAGE_TRACE_LIMITS.stepIdMaxChars} chars
      "label": "Initialize pointers",
      "animationEvent": "initialize",        // optional — must match a manifest.json traceEvents entry if present
      "code": {
        "pseudocode": "left <- 0\\nright <- n - 1",   // REQUIRED, plain text
        "python": "left = 0\\nright = len(nums) - 1", // optional
        "cpp": "int left = 0;\\nint right = n - 1;",  // optional
        "java": "int left = 0;\\nint right = n - 1;"  // optional
      }
    }
  ]
}
Rules: step ids must be unique. Pseudocode is required for every step. Python/C++/Java are optional but should be included when possible. Max ${PACKAGE_TRACE_LIMITS.maxSteps} steps.`
}

function bridgeContractBlock(bridgeMode: CmsDsaBridgeMode): string {
  if (bridgeMode === "standalone") {
    return `Bridge mode: Standalone — the animation runs entirely on its own; the host page sends it no commands and expects no messages back. You do not need to implement any of the bridge contract below.`
  }
  const lines: string[] = []
  lines.push(`Bridge protocol version: ${BRIDGE_VERSION} (every message must include "bridgeVersion": ${BRIDGE_VERSION}, or it is silently ignored).`)
  lines.push("")
  lines.push("Your animation.js can use a helper the host page injects automatically — do not redefine window.ReagvisBridge yourself:")
  lines.push("- window.ReagvisBridge.ready() — call this once your animation has finished its own setup and is ready to receive commands.")
  if (bridgeMode === "synchronized") {
    lines.push(
      '- window.ReagvisBridge.stepChanged(stepId) — call this every time the animation reaches a new semantic step, passing one of the ids declared in manifest.json\'s "traceEvents". IMPORTANT: call it for the FIRST step too, right after ready() — not just on later transitions. If you never call stepChanged() for the initial state, the host has no current step to synchronize against until the first command arrives, and step-jump controls have nothing to jump from.',
    )
  }
  if (bridgeMode === "synchronized") {
    lines.push("")
    lines.push("NARRATION TEXT (required so the lesson can be voiced): animation.js MUST declare, at top level, one explanation per traceEvents step id, written EXACTLY in this form, on one assignment that ends with `};`:")
    lines.push('  var EXPLAIN = {"initialize": {"h": "Short step heading", "t": "One or two plain sentences explaining this step. Use **bold** sparingly."}, "compare-mid": {"h": "...", "t": "..."}};')
    lines.push('Rules: the keys are exactly the ids in manifest.json "traceEvents"; every id has both "h" and "t"; the object is valid JSON (double quotes, no trailing commas, no functions); and the same "t" text is what the animation shows the learner for that step. Do not store the explanation under other names such as "detail" or "title" only — the narration reads var EXPLAIN.')
  }
  lines.push("")
  lines.push("To RECEIVE commands from the host page, define this global function — it will be called for every command the host sends:")
  lines.push("  window.ReagvisAnimation = { onCommand: function(type, stepId) { /* type is one of the command names below; stepId is only set for GOTO_STEP */ } };")
  lines.push("")
  lines.push(`Commands the host page may send (only the ones you declared in manifest.json's "capabilities" — never send a command you didn't declare support for): ${BRIDGE_COMMANDS.join(", ")}.`)
  lines.push(`Events your animation may send TO the host: ${BRIDGE_EVENTS.filter((e) => bridgeMode === "synchronized" || e !== "STEP_CHANGED").join(", ")}.`)
  return lines.join("\n")
}

function languagesLine(languages: PromptLanguageSelection): string {
  return (Object.keys(languages) as (keyof PromptLanguageSelection)[])
    .filter((k) => languages[k])
    .map((k) => LANG_LABELS[k])
    .join(", ")
}

export function buildAnimationOnlyPrompt(ctx: PromptContext, options: PromptOptions): string {
  const parts: string[] = []
  parts.push("Create a ZIP package compatible with Reagvis / HireOS Creator Studio's custom animation authoring system.")
  parts.push("")
  parts.push("The ZIP must contain, at its root:")
  parts.push("  animation.html   (required)")
  parts.push("  animation.css    (optional)")
  parts.push("  animation.js     (optional)")
  parts.push("  manifest.json    (required)")
  parts.push("  assets/*         (optional — images only)")
  parts.push("")
  parts.push(section("Rules", SECURITY_RULES))
  parts.push(section("manifest.json schema", manifestSchemaBlock()))
  parts.push(section("Bridge contract", bridgeContractBlock(options.bridgeMode)))
  const ctxText = contextBlock(ctx)
  if (ctxText) parts.push(section("Lesson context (for pedagogical accuracy — do not just restate it)", ctxText))
  if (ctx.heightPx) parts.push(`Target height: ${ctx.heightPx}px.`)
  parts.push("")
  parts.push('Return the final result as a ZIP-ready folder/file structure (list every file with its full path and complete contents). Ensure every animation semantic event used anywhere is declared in manifest.json\'s "traceEvents".')
  return parts.join("\n")
}

export function buildTraceOnlyPrompt(ctx: PromptContext, options: PromptOptions): string {
  const parts: string[] = []
  parts.push("Create a trace.json file compatible with Reagvis / HireOS Creator Studio's Code Trace authoring system.")
  parts.push("")
  parts.push(section("trace.json schema", traceSchemaBlock()))
  parts.push(`Languages to include: ${languagesLine(options.languages)} (pseudocode is always required; the others are optional but should be filled in when requested).`)
  if (ctx.declaredTraceEvents && ctx.declaredTraceEvents.length > 0) {
    parts.push("")
    parts.push(`Use ONLY these animationEvent IDs — do not invent new ones: ${ctx.declaredTraceEvents.join(", ")}.`)
  }
  const ctxText = contextBlock(ctx)
  if (ctxText) parts.push(section("Lesson context", ctxText))
  parts.push("")
  parts.push("Return the complete trace.json file content.")
  return parts.join("\n")
}

export function buildFullPrompt(ctx: PromptContext, options: PromptOptions): string {
  const parts: string[] = []
  parts.push("Create a ZIP package compatible with Reagvis / HireOS Creator Studio's Creator Studio custom-animation + Code Trace authoring system.")
  parts.push("")
  parts.push("The ZIP must contain, at its root:")
  parts.push("  animation.html   (required)")
  parts.push("  animation.css    (optional)")
  parts.push("  animation.js     (optional)")
  parts.push("  manifest.json    (required)")
  parts.push("  trace.json       (required for this Full Animation + Trace request)")
  parts.push("  assets/*         (optional — images only)")
  parts.push("")
  parts.push(section("Rules", SECURITY_RULES))
  parts.push(section("manifest.json schema", manifestSchemaBlock()))
  parts.push(section("trace.json schema", traceSchemaBlock()))
  parts.push(`Languages to include in trace.json: ${languagesLine(options.languages)}.`)
  parts.push(section("Bridge contract", bridgeContractBlock(options.bridgeMode)))
  const ctxText = contextBlock(ctx)
  if (ctxText) parts.push(section("Lesson context (for pedagogical accuracy — do not just restate it)", ctxText))
  if (ctx.heightPx) parts.push(`Target height: ${ctx.heightPx}px.`)
  parts.push("")
  parts.push('Return the final result as a ZIP-ready folder/file structure (list every file with its full path and complete contents). Ensure every animation semantic event used by trace.json is declared by manifest.json\'s "traceEvents".')
  return parts.join("\n")
}

export function buildPrompt(ctx: PromptContext, options: PromptOptions): string {
  if (options.mode === "animation") return buildAnimationOnlyPrompt(ctx, options)
  if (options.mode === "trace") return buildTraceOnlyPrompt(ctx, options)
  return buildFullPrompt(ctx, options)
}
