export const BINARY_SEARCH_VALUES = [-1, 0, 3, 5, 9, 12]
export const BINARY_SEARCH_TARGET = 9

export interface BinarySearchState {
  operation: "COMPARE_MID" | "MOVE_LOW" | "FOUND"
  low: number
  high: number
  mid: number
  discarded: number[]
  decision: string
  message: string
}

export const binarySearchStates: BinarySearchState[] = [
  {
    operation: "COMPARE_MID",
    low: 0,
    high: 5,
    mid: 2,
    discarded: [],
    decision: "3 < 9 -> MOVE RIGHT",
    message: "Check the middle value. Since 3 is less than 9, the target cannot be in the left half.",
  },
  {
    operation: "MOVE_LOW",
    low: 3,
    high: 5,
    mid: 4,
    discarded: [0, 1, 2],
    decision: "Discard indices 0..2",
    message: "Move low to mid + 1 and recompute the middle inside the remaining range.",
  },
  {
    operation: "FOUND",
    low: 3,
    high: 5,
    mid: 4,
    discarded: [0, 1, 2],
    decision: "9 = 9 -> FOUND",
    message: "The middle value matches the target, so binary search returns index 4.",
  },
]
