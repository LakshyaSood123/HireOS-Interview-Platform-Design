import {
  FAST_SLOW_NEXT,
  type FastSlowPointerState,
  type HashingComplementState,
  type MonotonicSearchState,
} from "./studyExpansionStates"

interface MessageState {
  operation?: string
  message?: string
}

export function validateAnimationStates(id: string, states: MessageState[]): string[] {
  const errors: string[] = []

  if (!states.length) {
    errors.push(`${id} has no states.`)
    return errors
  }

  states.forEach((state, index) => {
    if (!state.operation) errors.push(`${id} state ${index + 1} is missing operation.`)
    if (!state.message) errors.push(`${id} state ${index + 1} is missing message.`)
  })

  if (id === "hashing-complement-lookup") {
    errors.push(...validateHashingComplement(states as HashingComplementState[]))
  }
  if (id === "binary-search-monotonic-condition") {
    errors.push(...validateMonotonicSearch(states as MonotonicSearchState[]))
  }
  if (id === "linked-list-fast-slow-cycle") {
    errors.push(...validateFastSlow(states as FastSlowPointerState[]))
  }

  return errors
}

function validateHashingComplement(states: HashingComplementState[]): string[] {
  const errors: string[] = []

  states.forEach((state, index) => {
    if (state.activeIndex !== null) {
      if (state.activeIndex < 0 || state.activeIndex >= state.values.length) {
        errors.push(`hashing-complement-lookup state ${index + 1}: active index is out of range.`)
      } else if (state.current !== state.values[state.activeIndex]) {
        errors.push(`hashing-complement-lookup state ${index + 1}: current value does not match active index.`)
      }
    }

    if (state.current !== undefined && state.complement !== undefined && state.target - state.current !== state.complement) {
      errors.push(`hashing-complement-lookup state ${index + 1}: complement != target - current.`)
    }

    for (const [valueText, seenIndex] of Object.entries(state.seen)) {
      const value = Number(valueText)
      if (!Number.isInteger(seenIndex) || seenIndex < 0 || seenIndex >= state.values.length) {
        errors.push(`hashing-complement-lookup state ${index + 1}: seen-map index is out of range.`)
      } else if (state.values[seenIndex] !== value) {
        errors.push(`hashing-complement-lookup state ${index + 1}: seen map points to the wrong source value.`)
      }
    }

    if (state.found) {
      if (state.complement === undefined || !(state.complement in state.seen)) {
        errors.push(`hashing-complement-lookup state ${index + 1}: found=true but complement is absent from previously seen values.`)
      } else if (state.activeIndex !== null && state.seen[state.complement] >= state.activeIndex) {
        errors.push(`hashing-complement-lookup state ${index + 1}: match is not from a previously seen index.`)
      }
    }

    if (state.result) {
      const [a, b] = state.result
      if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= state.values.length || b >= state.values.length) {
        errors.push(`hashing-complement-lookup state ${index + 1}: result index is out of range.`)
      } else if (a === b || state.values[a] + state.values[b] !== state.target) {
        errors.push(`hashing-complement-lookup state ${index + 1}: result indices do not form the target sum.`)
      }
    }
  })

  const final = states[states.length - 1]
  if (!final?.result || final.result[0] !== 0 || final.result[1] !== 1) {
    errors.push("hashing-complement-lookup final state: expected pair [0, 1].")
  }

  return errors
}

function validateMonotonicSearch(states: MonotonicSearchState[]): string[] {
  const errors: string[] = []
  let previousLow = -Infinity
  let previousHigh = Infinity
  let previousSpan = Infinity

  states.forEach((state, index) => {
    if (state.low < previousLow) errors.push(`binary-search-monotonic-condition state ${index + 1}: low moved backward.`)
    if (state.high > previousHigh) errors.push(`binary-search-monotonic-condition state ${index + 1}: high moved backward.`)

    const span = Math.max(0, state.high - state.low + 1)
    if (index > 0 && span > previousSpan) {
      errors.push(`binary-search-monotonic-condition state ${index + 1}: search range grew instead of shrinking.`)
    }

    if (state.mid !== null && (state.mid < state.low || state.mid > state.high)) {
      errors.push(`binary-search-monotonic-condition state ${index + 1}: mid is outside [low, high].`)
    }

    if (state.mid !== null && state.check !== null) {
      const expected = state.mid * state.mid >= state.threshold
      if (state.check !== expected) {
        errors.push(`binary-search-monotonic-condition state ${index + 1}: predicate result is incorrect.`)
      }
    }

    if (state.answer !== null && state.answer * state.answer < state.threshold) {
      errors.push(`binary-search-monotonic-condition state ${index + 1}: candidate answer does not satisfy the predicate.`)
    }

    if (index > 0) {
      const previous = states[index - 1]
      if (previous.mid !== null && previous.check === false && state.low !== previous.mid + 1 && state.low !== previous.low) {
        errors.push(`binary-search-monotonic-condition state ${index + 1}: false predicate did not move low to mid + 1.`)
      }
      if (previous.mid !== null && previous.check === true && state.high !== previous.mid - 1 && state.high !== previous.high) {
        errors.push(`binary-search-monotonic-condition state ${index + 1}: true predicate did not move high to mid - 1.`)
      }
    }

    previousLow = state.low
    previousHigh = state.high
    previousSpan = span
  })

  const template = states[0]
  if (template) {
    const fiveIsTrue = 5 * 5 >= template.threshold
    const sixIsTrue = 6 * 6 >= template.threshold
    if (fiveIsTrue) errors.push("binary-search-monotonic-condition: 5 must be false for x² >= 30.")
    if (!sixIsTrue) errors.push("binary-search-monotonic-condition: 6 must be true for x² >= 30.")
  }

  const final = states[states.length - 1]
  if (final?.operation !== "COMPLETE") {
    errors.push("binary-search-monotonic-condition final state: expected COMPLETE operation.")
  } else {
    const expected = final.values.find(value => value * value >= final.threshold) ?? null
    if (final.answer !== expected || final.answer !== 6) {
      errors.push(`binary-search-monotonic-condition final state: expected first valid answer 6, got ${final.answer}.`)
    }
    const previousValue = final.answer === null ? null : final.answer - 1
    if (previousValue !== null && previousValue * previousValue >= final.threshold) {
      errors.push("binary-search-monotonic-condition final state: result is valid but not the FIRST valid value.")
    }
  }

  return errors
}

function validateFastSlow(states: FastSlowPointerState[]): string[] {
  const errors: string[] = []
  const visibleNodes = new Set(states.flatMap(state => state.nodes))

  for (const node of visibleNodes) {
    const next = FAST_SLOW_NEXT[node]
    if (next === undefined || !visibleNodes.has(next)) {
      errors.push(`linked-list-fast-slow-cycle: node ${node} points to a missing node or edge.`)
    }
  }

  // Prove the supplied input actually contains a cycle by walking from head.
  const visited = new Set<number>()
  let cursor = states[0]?.nodes[0]
  let cycleExists = false
  for (let steps = 0; cursor !== undefined && steps <= visibleNodes.size; steps += 1) {
    if (visited.has(cursor)) {
      cycleExists = true
      break
    }
    visited.add(cursor)
    cursor = FAST_SLOW_NEXT[cursor]
  }
  if (!cycleExists) errors.push("linked-list-fast-slow-cycle: approved input does not contain a real cycle.")

  states.forEach((state, index) => {
    if (!state.nodes.includes(state.slow) || !state.nodes.includes(state.fast)) {
      errors.push(`linked-list-fast-slow-cycle state ${index + 1}: pointer is not on a visible node.`)
    }

    if (state.met !== (state.slow === state.fast && index > 0)) {
      errors.push(`linked-list-fast-slow-cycle state ${index + 1}: meeting flag does not match pointer positions.`)
    }

    if (index > 0) {
      const previous = states[index - 1]
      const expectedSlow = FAST_SLOW_NEXT[previous.slow]
      const firstFast = FAST_SLOW_NEXT[previous.fast]
      const expectedFast = firstFast === undefined ? undefined : FAST_SLOW_NEXT[firstFast]
      if (state.slow !== expectedSlow || state.fast !== expectedFast) {
        errors.push(`linked-list-fast-slow-cycle state ${index + 1}: pointers did not advance by exactly 1 and 2 edges.`)
      }
    }
  })

  const final = states[states.length - 1]
  if (!final?.met || final.operation !== "CYCLE_DETECTED" || final.slow !== final.fast) {
    errors.push("linked-list-fast-slow-cycle final state: cycle must end with a real pointer meeting.")
  }
  if (final?.slow !== 4 || final.fast !== 4) {
    errors.push(`linked-list-fast-slow-cycle final state: expected meeting node 4, got slow=${final?.slow}, fast=${final?.fast}.`)
  }

  return errors
}
