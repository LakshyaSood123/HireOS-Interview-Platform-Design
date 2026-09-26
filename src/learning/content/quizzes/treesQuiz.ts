// Module Mastery Quiz — Trees (module id "trees", titled "Ancient Canopy").
// Written from trees-1..5: root, leaf, depth and height, binary trees, the
// three DFS orders and BFS with a queue, the recursive preorder code, the BST
// invariant, BST search and insert, and the height-balanced definition. BST
// search is described as O(height), as the lesson does.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const PREORDER_CODE =
  "def preorderTraversal(root):\n    if not root:\n        return []\n    return [root.val] + preorderTraversal(root.left) + preorderTraversal(root.right)"

export const treesQuiz: ModuleMasteryQuiz = {
  id: "trees-mastery",
  moduleId: "trees",
  title: "Trees Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "trees-q1",
      concept: "Tree terms",
      difficulty: "foundation",
      prompt: "In a tree, what does the height of a node measure?",
      options: [
        "The number of edges up to the root.",
        "The number of children it has.",
        "The number of nodes in its subtree.",
        "The longest path down to a leaf.",
      ],
      correct: "d",
      explanation:
        "Height is the longest path from a node down to a leaf. The number of edges from a node up to the root is its depth.",
    }),
    singleSelect({
      id: "trees-q2",
      concept: "Tree terms",
      difficulty: "foundation",
      prompt: "Root 10 has children 5 and 15, and node 5 has children 3 and 7. What is the depth of node 7?",
      options: ["0", "1", "2", "3"],
      correct: "c",
      explanation:
        "Depth counts edges from a node up to the root. From 7 to 5 is one edge and from 5 to 10 is another, so the depth is 2.",
    }),
    singleSelect({
      id: "trees-q3",
      concept: "Traversal orders",
      difficulty: "application",
      prompt: "Root 10 has children 5 and 15, and node 5 has children 3 and 7. What is the preorder traversal?",
      options: ["[3, 5, 7, 10, 15]", "[10, 5, 3, 7, 15]", "[3, 7, 5, 15, 10]", "[10, 5, 15, 3, 7]"],
      correct: "b",
      explanation:
        "Preorder visits Root → Left → Right. Visit 10, then everything in the left subtree (5, then 3, then 7), then the right subtree (15).",
    }),
    singleSelect({
      id: "trees-q4",
      concept: "DFS vs BFS",
      difficulty: "application",
      prompt: "Which structure does a level-by-level (BFS) traversal of a tree usually use?",
      options: ["A queue", "A stack of parents", "A sorted array", "A hash set of values"],
      correct: "a",
      explanation:
        "BFS pushes the root into a queue, then repeatedly pops a node, visits it and pushes its children. That processes the tree one level at a time. DFS is the one usually written recursively.",
    }),
    singleSelect({
      id: "trees-q5",
      concept: "Traversal orders",
      difficulty: "application",
      prompt: "A tree has root 2, left child 1 and right child 3. Which traversal produces 1, 3, 2?",
      options: ["Preorder", "Inorder", "Postorder", "Level order"],
      correct: "c",
      explanation:
        "Postorder visits Left → Right → Root: 1, 3, then 2. Preorder would give 2, 1, 3, inorder 1, 2, 3, and level order 2, 1, 3.",
    }),
    singleSelect({
      id: "trees-q6",
      concept: "Balanced trees",
      difficulty: "application",
      prompt: "What does it mean for a binary tree to be height-balanced?",
      options: [
        "Every leaf sits at exactly the same depth.",
        "At every node, subtree heights differ by at most 1.",
        "Each node's subtrees have equal node counts.",
        "The root has exactly two children.",
      ],
      correct: "b",
      explanation:
        "A tree is height-balanced when, for every node, the heights of its left and right subtrees differ by at most 1. The condition applies at every node, not just the root.",
    }),
    singleSelect({
      id: "trees-q7",
      concept: "Recursive traversal",
      difficulty: "application",
      prompt: "In preorderTraversal, what happens when root is None?",
      code: PREORDER_CODE,
      options: [
        "It raises an error.",
        "It returns [root.val].",
        "It keeps recursing into the children.",
        "It returns an empty list.",
      ],
      correct: "d",
      explanation:
        "if not root: return [] is the base case. An empty subtree contributes nothing, and it stops the recursion at the bottom of every branch.",
    }),
    singleSelect({
      id: "trees-q8",
      concept: "BST invariant",
      difficulty: "challenge",
      prompt: "Node 20 has a right child 30, and 30 has a left child 12. Is this a valid BST?",
      options: [
        "No, 12 is smaller than 20 but sits to its right.",
        "Yes, because 12 is smaller than its parent 30.",
        "Yes, since each node only compares with its parent.",
        "No, because 30 has only a left child.",
      ],
      correct: "a",
      explanation:
        "The BST rule holds recursively at every node, not just between a parent and child. Everything in 20's right subtree must be larger than 20, and 12 is not.",
    }),
    singleSelect({
      id: "trees-q9",
      concept: "BST search",
      difficulty: "application",
      prompt: "You search a BST for 7. The root is 10, its left child is 5, and 5's right child is 7. What is the path?",
      options: ["Left, left, found", "Right, then left", "Left, right, found", "Check every node"],
      correct: "c",
      explanation:
        "7 is smaller than 10, so go left to 5. 7 is larger than 5, so go right and find 7. Each comparison eliminates one whole subtree.",
    }),
    singleSelect({
      id: "trees-q10",
      concept: "BST search",
      difficulty: "application",
      prompt: "Why does BST search never need to check both sides of a node?",
      options: [
        "The tree is always perfectly balanced.",
        "The comparison rules out one whole subtree.",
        "Both subtrees hold the same values.",
        "It searches the left side twice.",
      ],
      correct: "b",
      explanation:
        "Smaller values live only in the left subtree and larger ones in the right, so each comparison discards one entire subtree. The cost is O(height): the number of steps depends on how tall the tree is.",
    }),
    singleSelect({
      id: "trees-q11",
      concept: "BST insert",
      difficulty: "application",
      prompt: "Where does a new value go when you insert it into a BST?",
      options: [
        "As a leaf, where the search path falls off the tree.",
        "As the new root, pushing everything down.",
        "In the leftmost empty spot of the tree.",
        "Replacing the node with the closest value.",
      ],
      correct: "a",
      explanation:
        "Insertion follows the same comparisons as search until it runs out of tree, then attaches the new value as a leaf at that empty spot.",
    }),
    multiSelect({
      id: "trees-q12",
      concept: "Tree terms",
      difficulty: "application",
      prompt: "Which statements about trees are true? Select all that apply.",
      options: [
        "A binary tree allows at most two children per node.",
        "A tree can contain a cycle as long as it has a root.",
        "BFS on a tree is usually written recursively with no extra structure.",
        "BST search takes O(height) because it follows a single path.",
      ],
      correct: ["a", "d"],
      explanation:
        "A binary tree has at most a left and a right child, and BST search follows one path from the root, so it takes O(height). A tree has no cycles, and BFS usually uses a queue rather than recursion.",
    }),
  ],
}
