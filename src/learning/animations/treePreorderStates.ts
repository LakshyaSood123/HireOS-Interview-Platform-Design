export interface TreePreorderState {
  operation: "VISIT" | "COMPLETE"
  current: number
  visited: number[]
  sequence: number[]
  message: string
}

export const treePreorderStates: TreePreorderState[] = [
  {
    operation: "VISIT",
    current: 1,
    visited: [1],
    sequence: [1],
    message: "Preorder visits the root first.",
  },
  {
    operation: "VISIT",
    current: 2,
    visited: [1, 2],
    sequence: [1, 2],
    message: "Then DFS moves into the left subtree.",
  },
  {
    operation: "VISIT",
    current: 4,
    visited: [1, 2, 4],
    sequence: [1, 2, 4],
    message: "Continue left as far as possible.",
  },
  {
    operation: "VISIT",
    current: 5,
    visited: [1, 2, 4, 5],
    sequence: [1, 2, 4, 5],
    message: "After finishing node 4, backtrack and visit node 5.",
  },
  {
    operation: "COMPLETE",
    current: 3,
    visited: [1, 2, 4, 5, 3],
    sequence: [1, 2, 4, 5, 3],
    message: "Finish with the right subtree. The preorder sequence is complete.",
  },
]
