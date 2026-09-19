export interface AdvancedAnimationState {
  operation: string
  message: string
  [key: string]: unknown
}

export const advancedAnimationStates = {
  "stack-queue-lifo-fifo": [
    { operation: "ADD", stack: ["A", "B"], queue: ["A", "B"], message: "Both structures receive A then B." },
    { operation: "ADD", stack: ["A", "B", "C"], queue: ["A", "B", "C"], message: "Add C to both structures." },
    { operation: "REMOVE", stack: ["A", "B"], queue: ["B", "C"], stackRemoved: "C", queueRemoved: "A", message: "A stack removes the newest item; a queue removes the oldest item." },
  ],
  "heap-insert-bubble": [
    { operation: "INSERT_LEAF", array: [4, 7, 6, 9, 8, 2], activeIndex: 5, message: "Insert the new value at the next leaf position." },
    { operation: "SWAP_PARENT", array: [4, 7, 2, 9, 8, 6], activeIndex: 2, compareIndex: 0, message: "Bubble the smaller value upward by swapping with its parent." },
    { operation: "HEAP_RESTORED", array: [2, 7, 4, 9, 8, 6], activeIndex: 0, message: "The min-heap property is restored once the smallest value reaches the root." },
  ],
  "trie-prefix-branch": [
    { operation: "INSERT_CAR", word: "car", path: ["c", "a", "r"], message: "Insert car by walking one character at a time." },
    { operation: "REUSE_PREFIX", word: "cat", path: ["c", "a"], message: "The word cat reuses the existing c -> a prefix." },
    { operation: "BRANCH", word: "cat", path: ["c", "a", "t"], message: "Only the final character branches away from car." },
  ],
  "backtracking-choose-undo": [
    { operation: "CHOOSE", path: ["A"], message: "Choose the first branch and record it in the current path." },
    { operation: "EXPLORE", path: ["A", "B"], message: "Explore deeper while the partial choice is still viable." },
    { operation: "DEAD_END", path: ["A", "B"], dead: "B", message: "This branch cannot produce a valid answer." },
    { operation: "UNDO", path: ["A"], message: "Undo the last choice before trying a sibling branch." },
    { operation: "ALTERNATE", path: ["A", "C"], message: "Try the alternate branch with a clean path state." },
  ],
  "bst-search-invariant": [
    { operation: "COMPARE", target: 6, current: 8, rejected: "right", decision: "6 < 8 -> GO LEFT", message: "The target must be in the left subtree if it exists." },
    { operation: "COMPARE", target: 6, current: 3, rejected: "left-of-3", decision: "6 > 3 -> GO RIGHT", message: "At node 3, the target must be in the right subtree." },
    { operation: "FOUND", target: 6, current: 6, decision: "6 = 6 -> FOUND", message: "The BST invariant guides the search directly to the target." },
  ],
  "graph-adjacency-build": [
    { operation: "ADD_EDGE", edges: [["A", "B"]], message: "Add the first undirected edge to the adjacency list." },
    { operation: "ADD_EDGE", edges: [["A", "B"], ["A", "C"]], message: "A now has two neighbors." },
    { operation: "COMPLETE", edges: [["A", "B"], ["A", "C"], ["B", "D"]], message: "The adjacency list and edge drawing describe the same graph." },
  ],
  "dfs-bfs-frontier": [
    { operation: "START", dfs: ["A"], bfs: ["A"], message: "Both traversals begin at the same start node." },
    { operation: "MID", dfs: ["A", "B", "D", "E"], bfs: ["A", "B", "C"], message: "DFS exhausts a branch while BFS expands level by level." },
    { operation: "COMPLETE", dfs: ["A", "B", "D", "E", "C", "F"], bfs: ["A", "B", "C", "D", "E", "F"], message: "Same graph, different frontier discipline." },
  ],
  "grid-graph-frontier": [
    { operation: "START", visited: [[0, 0]], frontier: [[0, 0]], message: "Start from one grid cell." },
    { operation: "EXPAND", visited: [[0, 0], [0, 1], [1, 0]], frontier: [[0, 1], [1, 0]], message: "Expand to valid neighboring cells." },
    { operation: "EXPAND", visited: [[0, 0], [0, 1], [1, 0], [1, 1], [1, 2]], frontier: [[1, 2]], message: "The traversal grows through the frontier." },
  ],
  "topological-sort-kahn": [
    { operation: "INIT", indeg: { A: 0, B: 1, C: 1, D: 2 }, queue: ["A"], output: [], message: "Begin with nodes whose indegree is zero." },
    { operation: "PROCESS_A", indeg: { A: 0, B: 0, C: 0, D: 2 }, queue: ["B", "C"], output: ["A"], message: "Removing A unlocks B and C." },
    { operation: "PROCESS_B", indeg: { A: 0, B: 0, C: 0, D: 1 }, queue: ["C"], output: ["A", "B"], message: "Processing B lowers D's indegree." },
    { operation: "PROCESS_C", indeg: { A: 0, B: 0, C: 0, D: 0 }, queue: ["D"], output: ["A", "B", "C"], message: "Processing C unlocks D." },
    { operation: "COMPLETE", indeg: { A: 0, B: 0, C: 0, D: 0 }, queue: [], output: ["A", "B", "C", "D"], message: "The final output respects every prerequisite edge." },
  ],
  "union-find-compression": [
    { operation: "BEFORE", parents: { 1: 1, 2: 1, 3: 1, 4: 3 }, path: [4, 3, 1], message: "Before compression, find(4) walks through 3 to reach root 1." },
    { operation: "FIND_ROOT", parents: { 1: 1, 2: 1, 3: 1, 4: 3 }, path: [4, 3, 1], root: 1, message: "The representative is node 1." },
    { operation: "COMPRESS", parents: { 1: 1, 2: 1, 3: 1, 4: 1 }, path: [4, 1], root: 1, message: "Path compression points 4 directly at the root." },
  ],
  "greedy-interval-selection": [
    { operation: "SELECT", interval: ["A", 1, 3], selected: ["A"], message: "Select the earliest-finishing compatible interval." },
    { operation: "SKIP", interval: ["B", 2, 5], lastEnd: 3, selected: ["A"], message: "Skip B because it overlaps the last selected interval." },
    { operation: "SELECT", interval: ["C", 4, 6], selected: ["A", "C"], message: "C starts after A ends, so it is safe to take." },
    { operation: "COMPLETE", interval: ["D", 6, 8], selected: ["A", "C", "D"], message: "The greedy choices produce three compatible intervals." },
  ],
  "dp-1d-fill": [
    { operation: "INIT", values: [1, 1, null, null, null, null], active: 1, message: "Initialize the base cases." },
    { operation: "FILL", values: [1, 1, 2, 3, null, null], active: 3, message: "Each new value depends on earlier solved states." },
    { operation: "COMPLETE", values: [1, 1, 2, 3, 5, 8], active: 5, message: "The table is complete after filling left to right." },
  ],
  "dp-2d-grid-paths": [
    { operation: "INIT", grid: [[1, 1, 1, 1], [1, null, null, null], [1, null, null, null]], message: "Initialize the first row and column." },
    { operation: "FILL", grid: [[1, 1, 1, 1], [1, 2, 3, null], [1, null, null, null]], active: [1, 2], deps: [[0, 2], [1, 1]], message: "Each cell adds the value from above and left." },
    { operation: "FILL", grid: [[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, null]], active: [2, 2], deps: [[1, 2], [2, 1]], message: "Previously solved neighbors feed the current cell." },
    { operation: "COMPLETE", grid: [[1, 1, 1, 1], [1, 2, 3, 4], [1, 3, 6, 10]], active: [2, 3], deps: [[1, 3], [2, 2]], message: "The bottom-right cell contains the final path count." },
  ],
  "dp-take-skip": [
    { operation: "EVAL", i: 2, take: 10, skip: 3, result: 10, message: "Evaluate taking versus skipping at index 2." },
    { operation: "EVAL", i: 1, take: 10, skip: 10, result: 10, message: "When choices tie, either keeps the optimal value." },
    { operation: "COMPLETE", i: 0, take: 12, skip: 10, result: 12, message: "The best answer is the max of take and skip." },
  ],
  "pattern-recognition-clues": [
    { operation: "PROMPT", prompt: "Find the longest contiguous subarray with a running constraint.", message: "Start by reading the nouns and constraints." },
    { operation: "CLUES", clues: ["LONGEST", "CONTIGUOUS", "RUNNING CONSTRAINT"], message: "These clues suggest a maintained window." },
    { operation: "SELECT", choices: ["Hashing", "Two Pointers", "Sliding Window", "Binary Search"], selected: "Sliding Window", message: "Pick Sliding Window as the first candidate pattern." },
  ],
  "timed-problem-phases": [
    { operation: "PLAN", phases: [["Clarify", 2], ["Derive", 5], ["Code", 12], ["Test", 3], ["Explain", "remainder"]], active: 0, message: "Begin with a calm time-boxed plan." },
    { operation: "WORK", phases: [["Clarify", 2], ["Derive", 5], ["Code", 12], ["Test", 3], ["Explain", "remainder"]], active: 2, message: "Spend the largest block implementing the chosen approach." },
    { operation: "FINISH", phases: [["Clarify", 2], ["Derive", 5], ["Code", 12], ["Test", 3], ["Explain", "remainder"]], active: 4, message: "Leave time to explain complexity and tradeoffs." },
  ],
  "company-mission-review": [
    { operation: "TARGET", target: "Company A", patterns: ["Arrays", "Graphs", "DP"], difficulty: { Easy: 20, Medium: 60, Hard: 20 }, message: "Start with a target company pattern mix." },
    { operation: "SOLVE", target: "Company A", patterns: ["Arrays", "Graphs", "DP"], difficulty: { Easy: 20, Medium: 60, Hard: 20 }, message: "Solve by cluster rather than random order." },
    { operation: "REVIEW", miss: "Graph traversal", review: "Graph Highlands", message: "Review misses by root cause and route them back to a learning zone." },
  ],
  "final-mastery-readiness": [
    { operation: "PROGRESS", stages: ["Pattern", "Complexity", "Code", "Tests", "Explain"], completed: ["Pattern", "Complexity"], readiness: 40, message: "Mastery starts with recognition and complexity." },
    { operation: "PROGRESS", stages: ["Pattern", "Complexity", "Code", "Tests", "Explain"], completed: ["Pattern", "Complexity", "Code", "Tests"], readiness: 80, message: "Code and tests move readiness close to complete." },
    { operation: "COMPLETE", stages: ["Pattern", "Complexity", "Code", "Tests", "Explain"], completed: ["Pattern", "Complexity", "Code", "Tests", "Explain"], readiness: 100, message: "The final challenge combines all five abilities." },
  ],
} satisfies Record<string, AdvancedAnimationState[]>
