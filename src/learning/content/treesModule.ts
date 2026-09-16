// Authored Trees module content — the first real (non-legacy) module in the
// Lesson Workspace model. Five checkpoints, "in our own words," not derived
// from reagvisCourses.ts's TrailNodes (which only had 3 Ancient Canopy nodes
// and none of them had lesson content authored). See
// LEARNING_ENGINE_ARCHITECTURE.md's "Trees vertical slice" section.
//
// This is the ONLY module using the new content model today — everything
// else (foundations, linked-structures, recursion, graphs, dp, summit)
// still comes from the old TrailNode data via courseRegistry.ts's
// buildDsaCourse(). Keep it that way until a module is deliberately migrated.

import type { Checkpoint, Module, TraversalVisual } from "../types"

const EXAMPLE_TREE: TraversalVisual = {
  tree: {
    value: 1,
    left: { value: 2, left: { value: 4 }, right: { value: 5 } },
    right: { value: 3 },
  },
  preorder: [1, 2, 4, 5, 3],
  inorder: [4, 2, 5, 1, 3],
  postorder: [4, 5, 2, 3, 1],
}

const PREORDER_EXAMPLES = [
  {
    language: "python" as const,
    code: `def preorderTraversal(root):
    if not root:
        return []
    return [root.val] + preorderTraversal(root.left) + preorderTraversal(root.right)`,
  },
  {
    language: "cpp" as const,
    code: `vector<int> preorderTraversal(TreeNode* root) {
    if (!root) return {};
    vector<int> result = {root->val};
    for (int v : preorderTraversal(root->left)) result.push_back(v);
    for (int v : preorderTraversal(root->right)) result.push_back(v);
    return result;
}`,
  },
  {
    language: "java" as const,
    code: `List<Integer> preorderTraversal(TreeNode root) {
    List<Integer> result = new ArrayList<>();
    if (root == null) return result;
    result.add(root.val);
    result.addAll(preorderTraversal(root.left));
    result.addAll(preorderTraversal(root.right));
    return result;
}`,
  },
]

const treeFoundations: Checkpoint = {
  id: "trees-1",
  title: "Tree Foundations",
  subtitle: "Nodes, roots, leaves & depth",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Tree Foundations",
    theory: [
      {
        heading: "What is a tree?",
        body: "A tree is a hierarchy of nodes connected by edges, starting from one root node, with no cycles — every node has exactly one path back to the root.",
      },
      {
        heading: "Key terms",
        body: "Root: the top node, with no parent. Leaf: a node with no children. Depth: how many edges from a node up to the root. Height: the longest path from a node down to a leaf.",
      },
      {
        heading: "Binary trees",
        body: "A binary tree restricts every node to at most two children, conventionally called left and right. Almost every interview tree question is really a binary tree question.",
      },
    ],
    quickCheck: {
      question: "Which node in a tree has no parent?",
      options: ["A leaf", "The root", "Any child node", "A sibling node"],
      correctIndex: 1,
      explanation: "The root is the single entry point of the tree — every other node is reachable from it, and it has no parent of its own.",
    },
  },
}

const traversals: Checkpoint = {
  id: "trees-2",
  title: "Traversals",
  subtitle: "DFS orders & level order",
  type: "lesson",
  xp: 30,
  prerequisites: [treeFoundations.id],
  workspace: {
    title: "Traversals",
    theory: [
      {
        heading: "Depth-first vs. breadth-first",
        body: "DFS explores down a branch before backtracking, usually written recursively. BFS explores level by level outward from the root, usually using a queue.",
      },
      {
        heading: "The three DFS orders",
        body: "Preorder visits Root → Left → Right. Inorder visits Left → Root → Right (on a BST this produces sorted order). Postorder visits Left → Right → Root.",
      },
      {
        heading: "BFS / level order",
        body: "Push the root into a queue, then repeatedly pop a node, visit it, and push its children — this naturally processes the tree one level at a time.",
      },
    ],
    visual: EXAMPLE_TREE,
    codeExamples: PREORDER_EXAMPLES,
    quickCheck: {
      question: "Which traversal visits Left → Root → Right?",
      options: ["Preorder", "Inorder", "Postorder", "BFS"],
      correctIndex: 1,
      explanation: "That's the definition of inorder — and on a binary search tree specifically, inorder traversal always produces values in sorted order.",
    },
  },
}

const dfsBfsCodeLab: Checkpoint = {
  id: "trees-3",
  title: "DFS / BFS Code Lab",
  subtitle: "Write your first traversal",
  type: "challenge",
  xp: 40,
  prerequisites: [traversals.id],
  workspace: {
    title: "DFS / BFS Code Lab",
    theory: [
      {
        heading: "Time to implement it",
        body: "You've seen preorder traversal explained and worked through by example. Now write it yourself — the recursive structure mirrors the tree's own structure.",
      },
    ],
    codeExamples: PREORDER_EXAMPLES,
    codingActivity: {
      prompt: "Implement preorderTraversal(root) that returns the values of a binary tree in preorder (Root → Left → Right) order, as a list.",
      constraints: ["0 ≤ number of nodes ≤ 100", "Node values are unique integers"],
      functionName: "preorderTraversal",
      requiredKeywords: ["left", "right"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def preorderTraversal(root):\n    # your code here\n    pass\n",
        cpp: "vector<int> preorderTraversal(TreeNode* root) {\n    // your code here\n}\n",
        java: "List<Integer> preorderTraversal(TreeNode root) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Example tree", input: "[1,2,3,4,5]", expected: "[1,2,4,5,3]" },
        { id: "v2", description: "Single node", input: "[7]", expected: "[7]" },
        { id: "v3", description: "Left-skewed tree", input: "[1,2,null,3]", expected: "[1,2,3]" },
      ],
      hiddenTests: [
        { id: "h1", description: "Right-skewed tree", input: "[1,null,2,null,3]", expected: "[1,2,3]" },
        { id: "h2", description: "Balanced tree", input: "[5,3,8,1,4,7,9]", expected: "[5,3,1,4,8,7,9]" },
        { id: "h3", description: "Empty tree", input: "[]", expected: "[]" },
      ],
      hint: "Think recursively: process the current node, then traverse the left and right subtrees.",
      mistakeFeedback: "You are visiting the right child before the left child, so this produces a different traversal order.",
    },
  },
}

const binarySearchTrees: Checkpoint = {
  id: "trees-4",
  title: "Binary Search Trees",
  subtitle: "The BST invariant & search",
  type: "lesson",
  xp: 40,
  prerequisites: [dfsBfsCodeLab.id],
  workspace: {
    title: "Binary Search Trees",
    theory: [
      {
        heading: "The BST invariant",
        body: "In a binary search tree, every node's left subtree holds only smaller values and its right subtree holds only larger values — and that rule holds recursively at every node, not just the root.",
      },
      {
        heading: "Search",
        body: "Starting at the root, compare the target to the current node: go left if smaller, right if larger, found if equal. Each step eliminates one entire subtree, giving O(height) search.",
      },
      {
        heading: "Insert",
        body: "Insertion walks the same comparison path as search until it falls off the tree, then attaches the new value as a leaf at that empty spot.",
      },
    ],
    quickCheck: {
      question: "In a valid BST, where do values smaller than the root live?",
      options: ["The right subtree", "The left subtree", "Anywhere in the tree", "Only at leaf nodes"],
      correctIndex: 1,
      explanation: "The BST invariant places everything smaller than a node in its left subtree, and everything larger in its right subtree.",
    },
    codingActivity: {
      prompt: "Implement searchBST(root, target) that returns the subtree rooted at the node whose value equals target, or null if it isn't present.",
      constraints: ["Assume the tree satisfies the BST invariant"],
      functionName: "searchBST",
      requiredKeywords: ["left", "right"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def searchBST(root, target):\n    # your code here\n    pass\n",
        cpp: "TreeNode* searchBST(TreeNode* root, int target) {\n    // your code here\n}\n",
        java: "TreeNode searchBST(TreeNode root, int target) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Target at root", input: "root=[4,2,7], target=4", expected: "[4,2,7]" },
        { id: "v2", description: "Target in left subtree", input: "root=[4,2,7], target=2", expected: "[2]" },
        { id: "v3", description: "Target not present", input: "root=[4,2,7], target=9", expected: "null" },
      ],
      hiddenTests: [
        { id: "h1", description: "Target in right subtree", input: "root=[4,2,7,1,3], target=7", expected: "[7]" },
        { id: "h2", description: "Deep target", input: "root=[8,3,10,1,6,null,14], target=6", expected: "[6]" },
        { id: "h3", description: "Empty tree", input: "root=[], target=5", expected: "null" },
      ],
      hint: "Compare target to root.val, then recurse into the left or right subtree accordingly — you never need to search both sides.",
      mistakeFeedback: "You're recursing into both subtrees on every call — the BST invariant means you only ever need to go one direction.",
    },
  },
}

const interviewChallenge: Checkpoint = {
  id: "trees-5",
  title: "Trees Interview Challenge",
  subtitle: "Height-balanced check — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [binarySearchTrees.id],
  workspace: {
    title: "Trees Interview Challenge",
    theory: [
      {
        heading: "A real interview-style question",
        body: "This is the kind of tree question interviewers reach for often: it looks simple, but a naive solution recomputes heights repeatedly and becomes slow on large trees.",
      },
    ],
    codingActivity: {
      prompt: "Given a binary tree, implement isBalanced(root) that returns true if the tree is height-balanced: for every node, the heights of its left and right subtrees differ by at most 1.",
      constraints: ["0 ≤ number of nodes ≤ 500"],
      functionName: "isBalanced",
      requiredKeywords: ["left", "right"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def isBalanced(root):\n    # your code here\n    pass\n",
        cpp: "bool isBalanced(TreeNode* root) {\n    // your code here\n}\n",
        java: "boolean isBalanced(TreeNode root) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Balanced tree", input: "[3,9,20,null,null,15,7]", expected: "true" },
        { id: "v2", description: "Unbalanced tree", input: "[1,2,2,3,3,null,null,4,4]", expected: "false" },
        { id: "v3", description: "Single node", input: "[1]", expected: "true" },
      ],
      hiddenTests: [
        { id: "h1", description: "Left-skewed chain", input: "[1,2,null,3]", expected: "false" },
        { id: "h2", description: "Two levels, balanced", input: "[1,2,3]", expected: "true" },
        { id: "h3", description: "Empty tree", input: "[]", expected: "true" },
      ],
      hint: "Compute the height of each subtree; a tree is balanced only if both subtrees are themselves balanced AND their heights differ by at most 1.",
      mistakeFeedback: "You're comparing subtree heights but not checking that both subtrees are themselves balanced — a locally-balanced-looking node can still sit above an unbalanced one further down.",
    },
  },
}

export const treesModule: Module = {
  id: "trees",
  title: "Ancient Canopy",
  description: "Hierarchical tree nodes, traversal orders, and BST search logic.",
  icon: "🌳",
  accentColor: "#1DB584",
  contentKind: "workspace",
  checkpoints: [treeFoundations, traversals, dfsBfsCodeLab, binarySearchTrees, interviewChallenge],
}
