// Second-pass curriculum animation states.
// These are intentionally small, deterministic teaching examples tied to
// the exact concepts/examples already present in the Reagvis Trails lessons.

export const HASHING_COMPLEMENT_VALUES = [2, 7, 11, 15]
export const HASHING_COMPLEMENT_TARGET = 9

export interface HashingComplementState {
  operation: "INIT" | "CHECK_COMPLEMENT" | "STORE_CURRENT" | "FOUND"
  values: number[]
  target: number
  activeIndex: number | null
  current?: number
  complement?: number
  seen: Record<number, number>
  found: boolean
  result?: [number, number]
  message: string
}

export const hashingComplementStates: HashingComplementState[] = [
  {
    operation: "INIT",
    values: HASHING_COMPLEMENT_VALUES,
    target: HASHING_COMPLEMENT_TARGET,
    activeIndex: null,
    seen: {},
    found: false,
    message: "Start with an empty map. Each stored value points to the index where it was seen.",
  },
  {
    operation: "CHECK_COMPLEMENT",
    values: HASHING_COMPLEMENT_VALUES,
    target: HASHING_COMPLEMENT_TARGET,
    activeIndex: 0,
    current: 2,
    complement: 7,
    seen: {},
    found: false,
    message: "At index 0, 9 - 2 = 7. Seven is not in the map yet, so there is no pair yet.",
  },
  {
    operation: "STORE_CURRENT",
    values: HASHING_COMPLEMENT_VALUES,
    target: HASHING_COMPLEMENT_TARGET,
    activeIndex: 0,
    current: 2,
    complement: 7,
    seen: { 2: 0 },
    found: false,
    message: "Store value 2 with index 0 so a later number can find it in O(1) average lookup time.",
  },
  {
    operation: "CHECK_COMPLEMENT",
    values: HASHING_COMPLEMENT_VALUES,
    target: HASHING_COMPLEMENT_TARGET,
    activeIndex: 1,
    current: 7,
    complement: 2,
    seen: { 2: 0 },
    found: true,
    message: "At index 1, 9 - 7 = 2. Two is already in the map at index 0, so the pair has been found.",
  },
  {
    operation: "FOUND",
    values: HASHING_COMPLEMENT_VALUES,
    target: HASHING_COMPLEMENT_TARGET,
    activeIndex: 1,
    current: 7,
    complement: 2,
    seen: { 2: 0 },
    found: true,
    result: [0, 1],
    message: "Return indices [0, 1]. Their values are 2 and 7, and 2 + 7 = 9.",
  },
]

export const MONOTONIC_SEARCH_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
export const MONOTONIC_SEARCH_THRESHOLD = 30

export interface MonotonicSearchState {
  operation: "COMPARE_CONDITION" | "MOVE_LOW" | "RECORD_CANDIDATE" | "MOVE_HIGH" | "COMPLETE"
  values: number[]
  threshold: number
  low: number
  high: number
  mid: number | null
  check: boolean | null
  answer: number | null
  message: string
}

export const monotonicSearchStates: MonotonicSearchState[] = [
  {
    operation: "COMPARE_CONDITION",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 1,
    high: 10,
    mid: 5,
    check: false,
    answer: null,
    message: "Check x = 5. Because 5² = 25 is below 30, every smaller x also fails, so the answer must be to the right.",
  },
  {
    operation: "MOVE_LOW",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 6,
    high: 10,
    mid: 8,
    check: null,
    answer: null,
    message: "Move low to 6 and recompute mid = 8 inside the remaining answer range.",
  },
  {
    operation: "RECORD_CANDIDATE",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 6,
    high: 10,
    mid: 8,
    check: true,
    answer: 8,
    message: "8² = 64 satisfies the condition. Record 8 as a candidate, then keep searching left for a smaller valid answer.",
  },
  {
    operation: "MOVE_HIGH",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 6,
    high: 7,
    mid: 6,
    check: null,
    answer: 8,
    message: "Move high to 7 and recompute mid = 6. Candidate 8 remains valid until a smaller one is proved.",
  },
  {
    operation: "RECORD_CANDIDATE",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 6,
    high: 7,
    mid: 6,
    check: true,
    answer: 6,
    message: "6² = 36 satisfies the condition, so improve the candidate from 8 to 6 and continue left.",
  },
  {
    operation: "COMPLETE",
    values: MONOTONIC_SEARCH_VALUES,
    threshold: MONOTONIC_SEARCH_THRESHOLD,
    low: 6,
    high: 5,
    mid: null,
    check: null,
    answer: 6,
    message: "The boundaries crossed. Six is the smallest x in 1..10 whose square is at least 30.",
  },
]

export const FAST_SLOW_NODES = [1, 2, 3, 4, 5]
export const FAST_SLOW_NEXT: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 3 }

export interface FastSlowPointerState {
  operation: "START" | "ADVANCE" | "CYCLE_DETECTED"
  nodes: number[]
  slow: number
  fast: number
  iteration: number
  met: boolean
  message: string
}

export const fastSlowPointerStates: FastSlowPointerState[] = [
  {
    operation: "START",
    nodes: FAST_SLOW_NODES,
    slow: 1,
    fast: 1,
    iteration: 0,
    met: false,
    message: "Both pointers start at the head. The list contains a cycle because node 5 points back to node 3.",
  },
  {
    operation: "ADVANCE",
    nodes: FAST_SLOW_NODES,
    slow: 2,
    fast: 3,
    iteration: 1,
    met: false,
    message: "Slow moves one edge to 2 while fast moves two edges to 3.",
  },
  {
    operation: "ADVANCE",
    nodes: FAST_SLOW_NODES,
    slow: 3,
    fast: 5,
    iteration: 2,
    met: false,
    message: "Slow reaches 3. Fast advances two more edges and reaches 5.",
  },
  {
    operation: "CYCLE_DETECTED",
    nodes: FAST_SLOW_NODES,
    slow: 4,
    fast: 4,
    iteration: 3,
    met: true,
    message: "Slow moves to 4. Fast follows 5 → 3 → 4, so both pointers meet and the cycle is confirmed.",
  },
]
