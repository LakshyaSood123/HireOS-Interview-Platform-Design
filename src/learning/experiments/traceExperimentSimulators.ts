// Experiment Mode — deterministic frontend simulators.
//
// Each function below runs the SAME algorithm the lesson teaches over
// learner-supplied input and produces two parallel, equal-length arrays:
//   - `animationStates`: the exact state shape the animation component
//     already renders (ArrayTraversalState[], BinarySearchState[], …).
//   - `traceStates`: a matching CodeTraceState[] for the SAME steps, reusing
//     the lesson's own authored pseudocode line numbers (never new lines,
//     never new wording) so Code Trace highlighting — in every language —
//     keeps working with zero changes to codeTraceVariants.ts.
//
// Nothing here is executed as code, sent anywhere, or produced by an LLM —
// each simulator is a small, hand-written, pure function.

import type { ArrayTraversalState } from "../animations/arraysInPlaceStates"
import type { BinarySearchState } from "../animations/binarySearchStates"
import type { SlidingWindowState } from "../animations/slidingWindowStates"
import type { TwoPointersState } from "../animations/patternBasicsStates"
import type { HashingComplementState } from "../animations/studyExpansionStates"
import type { CodeTraceState } from "../animations/codeTraceTypes"
import type { AlgorithmAnimationId } from "../types"
import type {
  ArrayReversalConfig,
  BinarySearchConfig,
  HashingComplementConfig,
  SlidingWindowConfig,
  TwoPointersConfig,
} from "./traceExperimentTypes"

export interface TraceExperimentResult<TState> {
  animationStates: TState[]
  traceStates: CodeTraceState[]
}

function trace(activeLines: number[], executedLines: number[], note?: string): CodeTraceState {
  return { activeLines, executedLines, note }
}

// ── 1. Array reversal (arrays-in-place-reversal) ────────────────────────
//
// The authored lesson trace bundles TWO ideas into 4 frames: a generic
// index read/write demo (SCAN, UPDATE — unrelated to reversal itself) and
// the actual reversal (one compressed REVERSE_SWAP frame, then REVERSED).
// The simulator regenerates only the reversal itself — one SCAN frame to
// open, one REVERSE_SWAP frame per swap, then REVERSED — since the
// standalone "here is what a single write looks like" aside isn't part of
// the reversal algorithm the lesson is teaching.
export function simulateArrayReversal(config: ArrayReversalConfig): TraceExperimentResult<ArrayTraversalState> {
  const values = [...config.values]
  const n = values.length
  const animationStates: ArrayTraversalState[] = []
  const traceStates: CodeTraceState[] = []

  animationStates.push({ operation: "SCAN", values: [...values], activeIndex: 0, message: "Start with the given array. Read index 0 directly." })
  traceStates.push(trace([1], []))

  const swapCount = Math.floor(n / 2)
  for (let i = 0; i < swapCount; i++) {
    const left = i
    const right = n - 1 - i
    const tmp = values[left]!
    values[left] = values[right]!
    values[right] = tmp
    animationStates.push({
      operation: "REVERSE_SWAP",
      values: [...values],
      leftIndex: left,
      rightIndex: right,
      message: `Swap positions ${left} and ${right}.`,
    })
    traceStates.push(trace([7, 8, 9, 10], [1, 3]))
  }

  animationStates.push({ operation: "REVERSED", values: [...values], message: "Final reversed order after symmetric swaps." })
  traceStates.push(trace([10], [7, 8, 9]))

  return { animationStates, traceStates }
}

// ── 2. Binary search (binary-search-decision) ───────────────────────────
export function simulateBinarySearch(config: BinarySearchConfig): TraceExperimentResult<BinarySearchState> {
  const { values, target } = config
  const animationStates: BinarySearchState[] = []
  const traceStates: CodeTraceState[] = []

  let low = 0
  let high = values.length - 1
  const discarded: number[] = []

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    const midValue = values[mid]!

    if (midValue === target) {
      animationStates.push({ operation: "FOUND", low, high, mid, discarded: [...discarded], decision: `${midValue} = ${target} -> FOUND`, message: "The middle value matches the target." })
      traceStates.push(trace([5, 6], [4]))
      return { animationStates, traceStates }
    }

    if (midValue < target) {
      animationStates.push({ operation: "COMPARE_MID", low, high, mid, discarded: [...discarded], decision: `${midValue} < ${target} -> MOVE RIGHT`, message: `Check the middle value. Since ${midValue} is less than ${target}, the target cannot be in the left half.` })
      traceStates.push(trace([4, 7, 8], []))
      for (let i = low; i <= mid; i++) discarded.push(i)
      const newLow = mid + 1
      // The MOVE_LOW frame shows the RECOMPUTED mid inside the new range —
      // matching the authored lesson's own convention ("recompute the
      // middle inside the remaining range"), not the just-discarded one.
      // Skip the frame entirely once the range is exhausted: there is no
      // valid mid left to recompute, and showing one anyway risks the "M"
      // marker landing on an unrelated cell. NOT_FOUND covers this case.
      if (newLow <= high) {
        const recomputedMid = Math.floor((newLow + high) / 2)
        animationStates.push({ operation: "MOVE_LOW", low: newLow, high, mid: recomputedMid, discarded: [...discarded], decision: `Discard indices ${low}..${mid}`, message: "Move low to mid + 1 and recompute the middle inside the remaining range." })
        traceStates.push(trace([4], [7, 8]))
      }
      low = newLow
    } else {
      animationStates.push({ operation: "COMPARE_MID", low, high, mid, discarded: [...discarded], decision: `${midValue} > ${target} -> MOVE LEFT`, message: `Check the middle value. Since ${midValue} is greater than ${target}, the target cannot be in the right half.` })
      traceStates.push(trace([4, 9, 10], []))
      for (let i = mid; i <= high; i++) discarded.push(i)
      const newHigh = mid - 1
      if (low <= newHigh) {
        const recomputedMid = Math.floor((low + newHigh) / 2)
        animationStates.push({ operation: "MOVE_HIGH", low, high: newHigh, mid: recomputedMid, discarded: [...discarded], decision: `Discard indices ${mid}..${high}`, message: "Move high to mid - 1 and recompute the middle inside the remaining range." })
        traceStates.push(trace([4], [9, 10]))
      }
      high = newHigh
    }
  }

  animationStates.push({ operation: "NOT_FOUND", low, high, mid: -1, discarded: [...discarded], decision: `${target} not present -> NOT FOUND`, message: "The range is empty — nothing left to search." })
  traceStates.push(trace([3], [4, 7, 8, 9, 10]))
  return { animationStates, traceStates }
}

// ── 3. Two pointers, opposite ends (two-pointers-opposite-sum) ──────────
export function simulateTwoPointers(config: TwoPointersConfig): TraceExperimentResult<TwoPointersState> {
  const { values, target } = config
  const animationStates: TwoPointersState[] = []
  const traceStates: CodeTraceState[] = []

  let left = 0
  let right = values.length - 1

  while (left < right) {
    const sum = values[left]! + values[right]!
    if (sum === target) {
      animationStates.push({ operation: "FOUND", values, target, left, right, sum, decision: `${sum} = ${target} -> FOUND`, message: `The two pointers now identify values ${values[left]} and ${values[right]}.` })
      traceStates.push(trace([5, 6], [4]))
      return { animationStates, traceStates }
    }
    if (sum > target) {
      animationStates.push({ operation: "COMPARE", values, target, left, right, sum, decision: `${sum} > ${target} -> MOVE R`, message: "The sum is too large, so move the right pointer left to try a smaller value." })
      traceStates.push(trace([4, 7, 8], []))
      right -= 1
    } else {
      animationStates.push({ operation: "COMPARE", values, target, left, right, sum, decision: `${sum} < ${target} -> MOVE L`, message: "The sum is too small, so move the left pointer right to try a larger value." })
      traceStates.push(trace([4, 9, 10], []))
      left += 1
    }
  }

  animationStates.push({ operation: "NOT_FOUND", values, target, left, right, sum: left <= right ? values[left]! + values[right]! : 0, decision: "No pair sums to the target", message: "The pointers crossed without finding a matching pair." })
  traceStates.push(trace([3], [4, 7, 8, 9, 10]))
  return { animationStates, traceStates }
}

// ── 4. Sliding window, variable size (sliding-window-variable) ──────────
export function simulateSlidingWindow(config: SlidingWindowConfig): TraceExperimentResult<SlidingWindowState> {
  const { values, limit } = config
  const animationStates: SlidingWindowState[] = []
  const traceStates: CodeTraceState[] = []

  let left = 0
  let sum = 0
  let best = 0
  let bestRange: [number, number] | undefined

  for (let right = 0; right < values.length; right++) {
    sum += values[right]!
    const validBeforeShrink = sum <= limit
    animationStates.push({
      operation: "EXPAND_RIGHT",
      left,
      right,
      sum,
      valid: validBeforeShrink,
      len: right - left + 1,
      best,
      incomingIndex: right,
      bestRange,
      message: `Include ${values[right]}. The window sum is now ${sum}.`,
    })
    traceStates.push(trace([5, 6], []))

    while (sum > limit && left <= right) {
      const outgoing = left
      sum -= values[left]!
      left += 1
      const stillHasWindow = left <= right
      animationStates.push({
        operation: "REMOVE_LEFT",
        left,
        right,
        sum,
        valid: sum <= limit,
        len: stillHasWindow ? right - left + 1 : 0,
        best,
        outgoingIndex: outgoing,
        bestRange,
        message: `Remove ${values[outgoing]} from the left. The window sum is now ${sum}.`,
      })
      traceStates.push(trace([8, 9, 10], [5, 6]))
    }

    const hasWindow = left <= right
    const valid = hasWindow && sum <= limit
    const len = hasWindow ? right - left + 1 : 0
    if (valid && len > best) {
      best = len
      bestRange = [left, right]
      animationStates.push({ operation: "UPDATE_BEST", left, right, sum, valid, len, best, bestRange, message: `The window is valid and length ${len} is the best so far.` })
      traceStates.push(trace([12], [5, 6]))
    } else {
      animationStates.push({ operation: "CHECK_CONDITION", left, right, sum, valid, len, best, bestRange, message: valid ? "The window is valid but not longer than the best found so far." : "This position cannot form a valid window." })
      traceStates.push(trace([8], [5, 6]))
    }
  }

  const last = animationStates[animationStates.length - 1]
  animationStates.push({ operation: "COMPLETE", left: last?.left ?? 0, right: last?.right ?? -1, sum: last?.sum ?? 0, valid: last?.valid ?? true, len: last?.len ?? 0, best, bestRange, message: `Done. The best valid window length was ${best}.` })
  traceStates.push(trace([12], [5, 6, 8, 9, 10]))

  return { animationStates, traceStates }
}

// ── 5. Hashing complement lookup (hashing-complement-lookup) ────────────
export function simulateHashingComplement(config: HashingComplementConfig): TraceExperimentResult<HashingComplementState> {
  const { values, target } = config
  const animationStates: HashingComplementState[] = []
  const traceStates: CodeTraceState[] = []

  const seen: Record<number, number> = {}
  animationStates.push({ operation: "INIT", values, target, activeIndex: null, seen: {}, found: false, message: "Start with an empty map. Each stored value points to the index where it was seen." })
  traceStates.push(trace([1], []))

  for (let i = 0; i < values.length; i++) {
    const current = values[i]!
    const complement = target - current
    const already = complement in seen

    animationStates.push({
      operation: "CHECK_COMPLEMENT",
      values,
      target,
      activeIndex: i,
      current,
      complement,
      seen: { ...seen },
      found: already,
      message: already
        ? `At index ${i}, ${target} - ${current} = ${complement}. ${complement} is already in the map, so the pair is found.`
        : `At index ${i}, ${target} - ${current} = ${complement}. ${complement} is not in the map yet.`,
    })
    traceStates.push(trace([2, 3, 4], [1]))

    if (already) {
      const result: [number, number] = [seen[complement]!, i]
      animationStates.push({ operation: "FOUND", values, target, activeIndex: i, current, complement, seen: { ...seen }, found: true, result, message: `Return indices [${result[0]}, ${result[1]}]. Their values are ${values[result[0]]} and ${values[result[1]]}, and ${values[result[0]]} + ${values[result[1]]} = ${target}.` })
      traceStates.push(trace([5], [2, 3, 4]))
      return { animationStates, traceStates }
    }

    seen[current] = i
    animationStates.push({ operation: "STORE_CURRENT", values, target, activeIndex: i, current, complement, seen: { ...seen }, found: false, message: `Store value ${current} with index ${i} so a later number can find it in O(1) average lookup time.` })
    traceStates.push(trace([6], [2, 3, 4]))
  }

  animationStates.push({ operation: "NOT_FOUND", values, target, activeIndex: null, seen: { ...seen }, found: false, message: "No two values in this list sum to the target." })
  traceStates.push(trace([2], [1, 6]))

  return { animationStates, traceStates }
}

// ── Registry (type-erased at the boundary; see useTraceExperiment.ts) ───

export type TraceSimulator<TConfig> = (config: TConfig) => TraceExperimentResult<unknown>

const SIMULATORS: Partial<Record<AlgorithmAnimationId, TraceSimulator<never>>> = {
  "arrays-in-place-reversal": simulateArrayReversal as TraceSimulator<never>,
  "binary-search-decision": simulateBinarySearch as TraceSimulator<never>,
  "two-pointers-opposite-sum": simulateTwoPointers as TraceSimulator<never>,
  "sliding-window-variable": simulateSlidingWindow as TraceSimulator<never>,
  "hashing-complement-lookup": simulateHashingComplement as TraceSimulator<never>,
}

/** `TState` is the caller's own animation state type. Safe only because each
 * `AlgorithmAnimationId` above is paired, by construction, with exactly one
 * simulator that returns that id's real state shape — the same invariant
 * `codeTraceRegistry`'s `Partial<Record<AlgorithmAnimationId, …>>` already
 * relies on elsewhere in this codebase. */
export function getSimulator<TState, TConfig>(id: AlgorithmAnimationId | undefined): ((config: TConfig) => TraceExperimentResult<TState>) | undefined {
  if (!id) return undefined
  return SIMULATORS[id] as ((config: TConfig) => TraceExperimentResult<TState>) | undefined
}
