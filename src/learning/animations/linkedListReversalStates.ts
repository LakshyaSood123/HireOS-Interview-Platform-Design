export interface LinkedListReversalState {
  operation: "SAVE_NEXT" | "REVERSE_LINK" | "ADVANCE" | "COMPLETE"
  nodes: number[]
  prev: number | null
  curr: number | null
  next: number | null
  reversed: number[]
  message: string
}

export const linkedListReversalStates: LinkedListReversalState[] = [
  {
    operation: "SAVE_NEXT",
    nodes: [1, 2, 3],
    prev: null,
    curr: 1,
    next: 2,
    reversed: [],
    message: "Save curr.next before changing any pointer, or the rest of the list is lost.",
  },
  {
    operation: "REVERSE_LINK",
    nodes: [1, 2, 3],
    prev: null,
    curr: 1,
    next: 2,
    reversed: [1],
    message: "Flip curr.next backward so node 1 points to prev.",
  },
  {
    operation: "ADVANCE",
    nodes: [1, 2, 3],
    prev: 1,
    curr: 2,
    next: 3,
    reversed: [1],
    message: "Advance prev and curr. The reversed prefix now starts at node 1.",
  },
  {
    operation: "COMPLETE",
    nodes: [3, 2, 1],
    prev: 3,
    curr: null,
    next: null,
    reversed: [3, 2, 1],
    message: "When curr reaches null, prev is the new head of the fully reversed list.",
  },
]
