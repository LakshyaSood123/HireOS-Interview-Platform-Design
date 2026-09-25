// Experiment Mode — structured parsing/rendering, NOT a language interpreter.
//
// The editable box looks like a code declaration ("nums = [1, 3, 5]"), but
// this file only ever extracts a bracketed number list and, for animations
// that need one, a `target`/`limit` scalar. It never reads control flow,
// never touches anything the learner types outside those two shapes, and
// never falls back to executing or evaluating the text in any way.

import type { AlgorithmAnimationId } from "../types"
import type { TraceLanguage } from "../animations/codeTraceTypes"
import { arraysInPlaceStates } from "../animations/arraysInPlaceStates"
import { BINARY_SEARCH_TARGET, BINARY_SEARCH_VALUES } from "../animations/binarySearchStates"
import { SLIDING_WINDOW_TARGET, SLIDING_WINDOW_VALUES } from "../animations/slidingWindowStates"
import { twoPointersStates } from "../animations/patternBasicsStates"
import { HASHING_COMPLEMENT_TARGET, HASHING_COMPLEMENT_VALUES } from "../animations/studyExpansionStates"
import {
  EXPERIMENT_MAX_VALUES,
  EXPERIMENT_MIN_VALUES,
  EXPERIMENT_VALUE_MAX,
  EXPERIMENT_VALUE_MIN,
  type ArrayReversalConfig,
  type BinarySearchConfig,
  type HashingComplementConfig,
  type SlidingWindowConfig,
  type TraceExperimentConfig,
  type TwoPointersConfig,
} from "./traceExperimentTypes"

export type ParseResult<TConfig> = { ok: true; config: TConfig } | { ok: false; error: string }

const UNSUPPORTED_EDIT_MESSAGE =
  "Experiment Mode currently supports changing the input values and parameters. The algorithm steps themselves are fixed for this lesson."

const BRACKET_LIST = /[[{]\s*([^[\]{}]*)\s*[\]}]/
const SCALAR = (name: string) => new RegExp(`\\b${name}\\b\\s*(?:=|<-|←)\\s*(-?\\d+(?:\\.\\d+)?)`, "i")

function parseNumberList(raw: string): number[] | null {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return []
  const parts = trimmed.split(",").map(part => part.trim())
  const values: number[] = []
  for (const part of parts) {
    if (!/^-?\d+$/.test(part)) return null
    const value = Number(part)
    if (!Number.isFinite(value)) return null
    values.push(value)
  }
  return values
}

function extractValues(text: string): number[] | null | undefined {
  const match = text.match(BRACKET_LIST)
  if (!match) return undefined
  return parseNumberList(match[1] ?? "")
}

function extractScalar(text: string, name: string): number | undefined {
  const match = text.match(SCALAR(name))
  if (!match) return undefined
  const value = Number(match[1])
  return Number.isFinite(value) ? value : undefined
}

function validateValuesLength(values: number[]): string | null {
  if (values.length < EXPERIMENT_MIN_VALUES || values.length > EXPERIMENT_MAX_VALUES) {
    return `Enter between ${EXPERIMENT_MIN_VALUES} and ${EXPERIMENT_MAX_VALUES} values.`
  }
  for (const value of values) {
    if (!Number.isFinite(value)) return "Values must be finite numbers."
    if (value < EXPERIMENT_VALUE_MIN || value > EXPERIMENT_VALUE_MAX) {
      return `Values must be between ${EXPERIMENT_VALUE_MIN} and ${EXPERIMENT_VALUE_MAX}.`
    }
  }
  return null
}

function isSorted(values: number[]): boolean {
  return values.every((value, i) => i === 0 || values[i - 1]! <= value)
}

export function parseExperimentText(id: AlgorithmAnimationId, text: string): ParseResult<TraceExperimentConfig> {
  const values = extractValues(text)
  if (values === undefined) return { ok: false, error: UNSUPPORTED_EDIT_MESSAGE }
  if (values === null) return { ok: false, error: "Values must be whole numbers, separated by commas." }

  const lengthError = validateValuesLength(values)
  if (lengthError) return { ok: false, error: lengthError }

  if (id === "arrays-in-place-reversal") {
    return { ok: true, config: { values } satisfies ArrayReversalConfig }
  }

  if (id === "binary-search-decision") {
    const target = extractScalar(text, "target")
    if (target === undefined) return { ok: false, error: "Target must be a number." }
    if (!isSorted(values)) return { ok: false, error: "Binary Search input must be sorted in ascending order." }
    return { ok: true, config: { values, target } satisfies BinarySearchConfig }
  }

  if (id === "two-pointers-opposite-sum") {
    const target = extractScalar(text, "target")
    if (target === undefined) return { ok: false, error: "Target must be a number." }
    if (!isSorted(values)) return { ok: false, error: "Two Pointers input must be sorted in ascending order." }
    return { ok: true, config: { values, target } satisfies TwoPointersConfig }
  }

  if (id === "sliding-window-variable") {
    const limit = extractScalar(text, "limit")
    if (limit === undefined) return { ok: false, error: "Limit must be a number." }
    return { ok: true, config: { values, limit } satisfies SlidingWindowConfig }
  }

  if (id === "hashing-complement-lookup") {
    const target = extractScalar(text, "target")
    if (target === undefined) return { ok: false, error: "Target must be a number." }
    return { ok: true, config: { values, target } satisfies HashingComplementConfig }
  }

  return { ok: false, error: UNSUPPORTED_EDIT_MESSAGE }
}

function formatList(values: number[], language: TraceLanguage): string {
  return language === "cpp" || language === "java" ? `{${values.join(", ")}}` : `[${values.join(", ")}]`
}

function assign(language: TraceLanguage): string {
  return language === "pseudocode" ? "←" : "="
}

/** The SAME config, rendered as a declaration in whichever language is
 * currently selected. Never re-derives or re-parses anything — the
 * structured config stays the single source of truth. */
export function renderExperimentText(id: AlgorithmAnimationId, config: TraceExperimentConfig, language: TraceLanguage): string {
  const op = assign(language)
  const numsType = language === "cpp" ? "vector<int> " : language === "java" ? "int[] " : ""
  const intType = language === "cpp" || language === "java" ? "int " : ""
  const list = (values: number[]) => `${numsType}nums ${op} ${formatList(values, language)}${language === "cpp" || language === "java" ? ";" : ""}`

  if (id === "arrays-in-place-reversal") {
    const c = config as ArrayReversalConfig
    return list(c.values)
  }
  if (id === "binary-search-decision" || id === "two-pointers-opposite-sum" || id === "hashing-complement-lookup") {
    const c = config as BinarySearchConfig | TwoPointersConfig | HashingComplementConfig
    const targetLine = `${intType}target ${op} ${c.target}${language === "cpp" || language === "java" ? ";" : ""}`
    return `${list(c.values)}\n${targetLine}`
  }
  if (id === "sliding-window-variable") {
    const c = config as SlidingWindowConfig
    const valuesLine = `${numsType}values ${op} ${formatList(c.values, language)}${language === "cpp" || language === "java" ? ";" : ""}`
    const limitLine = `${intType}limit ${op} ${c.limit}${language === "cpp" || language === "java" ? ";" : ""}`
    return `${valuesLine}\n${limitLine}`
  }
  return ""
}

/** The lesson's own authored sample input — reused verbatim (not
 * re-typed/duplicated) as Experiment Mode's starting point, so opening it
 * shows the exact numbers the learner was already looking at. */
export function defaultExperimentConfig(id: AlgorithmAnimationId): TraceExperimentConfig | undefined {
  switch (id) {
    case "arrays-in-place-reversal":
      return { values: [...arraysInPlaceStates[0]!.values] } satisfies ArrayReversalConfig
    case "binary-search-decision":
      return { values: [...BINARY_SEARCH_VALUES], target: BINARY_SEARCH_TARGET } satisfies BinarySearchConfig
    case "two-pointers-opposite-sum":
      return { values: [...twoPointersStates[0]!.values], target: twoPointersStates[0]!.target } satisfies TwoPointersConfig
    case "sliding-window-variable":
      return { values: [...SLIDING_WINDOW_VALUES], limit: SLIDING_WINDOW_TARGET } satisfies SlidingWindowConfig
    case "hashing-complement-lookup":
      return { values: [...HASHING_COMPLEMENT_VALUES], target: HASHING_COMPLEMENT_TARGET } satisfies HashingComplementConfig
    default:
      return undefined
  }
}
