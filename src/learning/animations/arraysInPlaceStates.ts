export interface ArrayTraversalState {
  operation: "SCAN" | "UPDATE" | "REVERSE_SWAP" | "REVERSED"
  values: number[]
  message: string
  activeIndex?: number
  leftIndex?: number
  rightIndex?: number
}

export const arraysInPlaceStates: ArrayTraversalState[] = [
  {
    operation: "SCAN",
    values: [4, 8, 1, 9, 3, 6],
    activeIndex: 0,
    message: "Read nums[0] directly by index.",
  },
  {
    operation: "UPDATE",
    values: [4, 8, 1, 7, 3, 6],
    activeIndex: 3,
    message: "Update index 3 from 9 to 7.",
  },
  {
    operation: "REVERSE_SWAP",
    values: [4, 8, 1, 7, 3, 6],
    leftIndex: 0,
    rightIndex: 5,
    message: "Reverse: swap the two ends.",
  },
  {
    operation: "REVERSED",
    values: [6, 3, 7, 1, 8, 4],
    message: "Final reversed order after symmetric swaps.",
  },
]
