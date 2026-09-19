export interface ComplexityState {
  operation: "SMALL_N" | "MEDIUM_N" | "LARGE_N"
  n: number
  message: string
}

export interface HashingState {
  operation: "KEY" | "HASH" | "UPDATE_COUNT"
  key: string
  bucket: number
  count: number
  message: string
}

export interface TwoPointersState {
  operation: "COMPARE" | "FOUND"
  values: number[]
  target: number
  left: number
  right: number
  sum: number
  decision: string
  message: string
}

export interface PrefixSumState {
  operation: "BUILD" | "QUERY"
  values: number[]
  prefix: Array<number | null>
  message: string
  active?: number
  range?: [number, number]
  subtractIndex?: number
  result?: number
}

export interface IntervalsState {
  operation: "SHOW" | "CHECK_OVERLAP" | "MERGE"
  intervals: Array<[number, number]>
  message: string
}

export const complexityStates: ComplexityState[] = [
  {
    operation: "SMALL_N",
    n: 2,
    message: "At small n, growth classes are still close.",
  },
  {
    operation: "MEDIUM_N",
    n: 5,
    message: "O(n^2) and O(n log n) begin separating from linear growth.",
  },
  {
    operation: "LARGE_N",
    n: 9,
    message: "Relative scaling becomes obvious as n grows.",
  },
]

export const hashingStates: HashingState[] = [
  {
    operation: "KEY",
    key: "pear",
    bucket: 1,
    count: 1,
    message: "Start with the key you want to count.",
  },
  {
    operation: "HASH",
    key: "pear",
    bucket: 1,
    count: 1,
    message: "The hash function maps the key to a bucket.",
  },
  {
    operation: "UPDATE_COUNT",
    key: "pear",
    bucket: 1,
    count: 2,
    message: "A second pear updates the existing frequency instead of scanning the whole list.",
  },
]

export const twoPointersStates: TwoPointersState[] = [
  {
    operation: "COMPARE",
    values: [1, 2, 4, 6, 10],
    target: 8,
    left: 0,
    right: 4,
    sum: 11,
    decision: "11 > 8 -> MOVE R",
    message: "The sum is too large, so move the right pointer left to try a smaller value.",
  },
  {
    operation: "COMPARE",
    values: [1, 2, 4, 6, 10],
    target: 8,
    left: 0,
    right: 3,
    sum: 7,
    decision: "7 < 8 -> MOVE L",
    message: "The sum is too small, so move the left pointer right to try a larger value.",
  },
  {
    operation: "FOUND",
    values: [1, 2, 4, 6, 10],
    target: 8,
    left: 1,
    right: 3,
    sum: 8,
    decision: "8 = 8 -> FOUND",
    message: "The two pointers now identify values 2 and 6.",
  },
]

export const prefixSumStates: PrefixSumState[] = [
  {
    operation: "BUILD",
    values: [2, 1, 4, 3, 2, 5],
    prefix: [2, 3, null, null, null, null],
    active: 1,
    message: "Build prefix sums from left to right: prefix[1] = 2 + 1.",
  },
  {
    operation: "BUILD",
    values: [2, 1, 4, 3, 2, 5],
    prefix: [2, 3, 7, 10, 12, 17],
    active: 5,
    message: "Once built, each prefix cell stores the total through that index.",
  },
  {
    operation: "QUERY",
    values: [2, 1, 4, 3, 2, 5],
    prefix: [2, 3, 7, 10, 12, 17],
    range: [3, 5],
    subtractIndex: 2,
    result: 10,
    message: "Range sum [3..5] is prefix[5] - prefix[2] = 17 - 7 = 10.",
  },
]

export const intervalsStates: IntervalsState[] = [
  {
    operation: "SHOW",
    intervals: [[1, 5], [4, 8]],
    message: "Place the intervals on one timeline.",
  },
  {
    operation: "CHECK_OVERLAP",
    intervals: [[1, 5], [4, 8]],
    message: "Because 4 starts before 5 ends, the intervals overlap.",
  },
  {
    operation: "MERGE",
    intervals: [[1, 8]],
    message: "Merge by keeping the earliest start and latest end: [1, 8].",
  },
]
