import type { IntentId } from "./intents"
import type { TopicKnowledge } from "./topicKnowledgeBuilder"

/**
 * LAYER B — optional, hand-curated response overrides for specific
 * (checkpoint, intent) pairs where the generic Layer A generator
 * (topicKnowledgeResolver.ts) benefits from richer, teacher-written content
 * (an analogy, a sharper explanation) beyond what can be auto-derived from
 * curriculum fields. Every checkpoint NOT listed here — the overwhelming
 * majority of the 107 checkpoints — still gets a real, useful answer from
 * Layer A. This file must never be the only thing standing between a
 * learner and a response; see topicKnowledgeResolver.ts's resolveIntent().
 */
export const TOPIC_OVERRIDES: Record<string, Partial<Record<IntentId, string | ((k: TopicKnowledge) => string)>>> = {
  "arrays-strings-1": {
    EXPLAIN_SIMPLE:
      "Think of an array like a row of numbered trail lockers. Because every locker is exactly the same size and lined up in order, you can jump directly to locker #5 in a single step without opening lockers 0 through 4 first. That's why indexing is O(1) constant time.",
    ANOTHER_EXAMPLE:
      "Imagine tracking daily summit temperatures over a week: `[62, 58, 65, 70, 68, 60, 64]`. If you want Wednesday's temperature (`temps[2]`), you compute `start + 2*4 bytes` and read `65` instantly. But if you need to find *which day* had 70 degrees, you have to walk through the elements one by one — that's O(n) search.",
    WHY_THIS_APPROACH:
      "Computers store arrays in a contiguous block of memory. The address of index `i` is calculated with math: `base_address + (i * element_size)`. Since this multiplication happens in a single CPU instruction, accessing any index takes the same instant time, whether the array has 10 elements or 10 million.",
  },
  "arrays-strings-2": {
    EXPLAIN_SIMPLE:
      "In-place means modifying the input array directly without allocating a second array of size n. Your auxiliary space stays O(1) — like rearranging gear inside your backpack rather than buying a second backpack.",
    WHY_THIS_APPROACH:
      "A single pass visits each element at most once (or once from each end). Since the number of operations scales linearly with the input length n, the time complexity is strictly O(n).",
    QUICK_CHECK_HINT:
      "Remember what 'in-place' literally means — you are writing changes directly into the original container. Think about whether you created a brand new array or reused the existing memory!",
  },
  "two-pointers-1": {
    WHEN_TO_USE:
      "Look for these 3 trail cues:\n1. A **sorted array** with a target condition (e.g. two sum, closest pair).\n2. A **symmetry check** (e.g. palindrome verification).\n3. An **in-place partition / compaction** (e.g. remove duplicates, move zeroes).\nIf you see a nested loop scanning the same array, ask whether two pointers can prune the search space.",
    PATTERN_RECOGNITION:
      "There are two classic shapes:\n• **Opposite-End**: `left = 0`, `right = n - 1`, moving toward each other until they meet (e.g. reversing an array, pair sum in a sorted array).\n• **Same-Direction**: a 'slow' pointer marks the boundary of valid elements while a 'fast' pointer scans ahead (e.g. removing duplicates in-place, sliding window).",
    WHY_THIS_APPROACH:
      "A nested loop compares every pair: O(n²). With two pointers on a sorted array, each comparison lets you eliminate a whole row or column of candidate pairs because the data is ordered. Each step moves at least one pointer forward, so you do at most n total steps: O(n).",
  },
  "two-pointers-2": {
    EXPLAIN_CURRENT_STEP: k =>
      k.animationContext?.step !== undefined
        ? `Step ${k.animationContext.step}: the left and right pointers are converging. With each step the unexamined window shrinks by 1 element, guaranteeing termination in O(n) steps. If \`current_sum < target\`, moving \`left\` forward increases the sum; if \`current_sum > target\`, moving \`right\` back decreases it.`
        : "The pointers start at indices 0 and n-1. Based on the target-sum comparison, one pointer steps inward each turn until the target is met or the pointers cross.",
  },
  "binary-search-1": {
    WHY_THIS_APPROACH:
      "Because the array is sorted, every element left of `mid` is smaller than `arr[mid]`, and everything right of it is larger. If `target > arr[mid]`, target physically cannot exist in the left half — so you discard it entirely with zero checks.",
    TIME_COMPLEXITY:
      "O(log n) means halving the problem size at each step. For 1,000 elements: ~10 steps. For 1,000,000 elements: only ~20 steps. For 1,000,000,000 elements: ~30 steps — one of the most efficient search algorithms in computer science.",
    EXPLAIN_PSEUDOCODE:
      "`left` (or `low`) is the start of the active search range, `right` (or `high`) is the end, and `mid = left + (right - left) // 2` is the midpoint — that formula (rather than `(left+right)/2`) avoids integer overflow in C++/Java.",
  },
  "trees-1": {
    EXPLAIN_SIMPLE:
      "Think of a binary tree like a trail that forks into at most two paths at every clearing. You start at the trailhead (root), and every path leads deeper until you reach a scenic dead-end (leaf).",
    KEY_TAKEAWAYS:
      "• **Root**: the top-level entry node with no parent.\n• **Leaf**: a node with no children.\n• **Depth**: edges from the root down to this node.\n• **Height**: the longest path from a node down to any leaf.",
    WHEN_TO_USE:
      "Trees naturally model hierarchical relationships: file systems, HTML DOM trees, org charts, database indexes (B-trees). They allow faster searches than linked lists while still allowing dynamic insertions, unlike static arrays.",
  },
  "trees-2": {
    PATTERN_RECOGNITION:
      "All three orders visit the root and both children, just in a different sequence:\n• **Preorder (Root, Left, Right)** — process the parent before its children (great for copying a tree).\n• **Inorder (Left, Root, Right)** — visits BST nodes in ascending sorted order.\n• **Postorder (Left, Right, Root)** — process children before the parent (needed for deleting a tree or computing subtree heights).",
    WHY_THIS_APPROACH:
      "DFS dives down one branch to the leaves before backtracking (recursion or an explicit stack). BFS explores level by level — all depth-1 nodes, then all depth-2 — using a queue (FIFO).",
    TIME_COMPLEXITY:
      "For a tree with n nodes: time is O(n) since every node is visited exactly once; space is O(h) where h is the tree's height (call-stack depth) — O(log n) on a balanced tree, O(n) on a fully skewed one.",
  },
}
