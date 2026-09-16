import type { Checkpoint, CodeExample, Module, QuickCheckContent, TheoryBlock } from "../types"

type ModuleSeed = {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  concept: string
  pattern: string
  practice: string
  code?: {
    functionName: string
    prompt: string
    keywords: string[]
    starter: string
    hint: string
  }
}

const quick = (topic: string, answer: string): QuickCheckContent => ({
  question: `When should ${topic} be your first instinct?`,
  options: [
    answer,
    "When the input is tiny enough that any approach is fine",
    "Only after trying every possible subset",
    "When the problem statement mentions a database",
  ],
  correctIndex: 0,
  explanation: answer,
})

const pythonExample = (name: string, body: string): CodeExample[] => [
  {
    language: "python",
    code: `def ${name}(items):\n${body}`,
  },
]

function lesson(id: string, title: string, subtitle: string, xp: number, prerequisites: string[], theory: TheoryBlock[], check: QuickCheckContent): Checkpoint {
  return {
    id,
    title,
    subtitle,
    type: "lesson",
    xp,
    prerequisites,
    workspace: {
      title,
      theory,
      quickCheck: check,
    },
  }
}

function codeCheckpoint(seed: ModuleSeed, previousId: string): Checkpoint {
  const code = seed.code
  if (!code) {
    return {
      id: `${seed.id}-3`,
      title: `${seed.title} Application`,
      subtitle: "Pick the right move",
      type: "challenge",
      xp: 45,
      prerequisites: [previousId],
      workspace: {
        title: `${seed.title} Application`,
        theory: [
          { heading: "Practice target", body: seed.practice },
          { heading: "Interview habit", body: "State the pattern, name the invariant you maintain, then explain why each input element is processed a bounded number of times." },
        ],
        quickCheck: quick(seed.title, seed.practice),
      },
    }
  }

  return {
    id: `${seed.id}-3`,
    title: `${seed.title} Code Lab`,
    subtitle: "Implement the core pattern",
    type: "challenge",
    xp: 50,
    masteryXp: 80,
    prerequisites: [previousId],
    workspace: {
      title: `${seed.title} Code Lab`,
      theory: [
        { heading: "Practice target", body: seed.practice },
        { heading: "Mock runner note", body: "The local runner checks for the intended structure and edge-case guard. It is a practice judge, not a real compiler." },
      ],
      codingActivity: {
        prompt: code.prompt,
        constraints: ["Use the pattern from this module.", "Handle empty or minimal input where it applies."],
        functionName: code.functionName,
        requiredKeywords: code.keywords,
        languages: ["python", "cpp", "java"],
        starterCode: {
          python: code.starter,
          cpp: `${code.functionName}() {\n    // your code here\n}\n`,
          java: `${code.functionName}() {\n    // your code here\n}\n`,
        },
        visibleTests: [
          { id: "v1", description: "Basic case", input: "[1,2,3]", expected: "valid result" },
          { id: "v2", description: "Empty case", input: "[]", expected: "valid empty result" },
        ],
        hiddenTests: [
          { id: "h1", description: "Repeated values", input: "[2,2,3]", expected: "valid result" },
          { id: "h2", description: "Empty input", input: "[]", expected: "valid empty result" },
        ],
        hint: code.hint,
        mistakeFeedback: "Your attempt is missing one of the core structural signals for this pattern. Revisit the invariant, then make the loop or recursive step explicit.",
      },
    },
  }
}

function buildModule(seed: ModuleSeed): Module {
  const first = `${seed.id}-1`
  const second = `${seed.id}-2`
  return {
    id: seed.id,
    title: seed.title,
    description: seed.description,
    icon: seed.icon,
    accentColor: seed.accentColor,
    contentKind: "workspace",
    checkpoints: [
      lesson(
        first,
        `${seed.title} Foundations`,
        "Core mental model",
        30,
        [],
        [
          { heading: "What this pattern solves", body: seed.concept },
          { heading: "The invariant", body: "Keep one simple truth true after every step. Good interview solutions are usually just invariants written as code." },
        ],
        quick(seed.title, seed.concept),
      ),
      {
        id: second,
        title: `${seed.title} Worked Pattern`,
        subtitle: "Trace the moves",
        type: "lesson",
        xp: 35,
        prerequisites: [first],
        workspace: {
          title: `${seed.title} Worked Pattern`,
          theory: [
            { heading: "Worked example", body: seed.pattern },
            { heading: "Complexity target", body: "Prefer the standard interview bound for this module and call out any extra memory you allocate." },
          ],
          codeExamples: pythonExample(seed.code?.functionName ?? "solve", "    # maintain the module invariant here\n    for item in items:\n        pass\n    return items"),
          quickCheck: quick(seed.title, seed.pattern),
        },
      },
      codeCheckpoint(seed, second),
    ],
  }
}

const blue = "#38BDF8"
const purple = "#A855F7"
const amber = "#F59E0B"
const pink = "#EC4899"
const gold = "#E2B44A"

export const stackQueueModule = buildModule({
  id: "stack-queue",
  title: "Stack & Queue",
  description: "LIFO/FIFO structures, monotonic stacks, and breadth-first order.",
  icon: "[]",
  accentColor: blue,
  concept: "Use a stack when the most recent unresolved item must be handled first, and a queue when items must be processed in arrival order.",
  pattern: "For valid parentheses, push opening brackets and require each closing bracket to match the latest opener. For BFS, push neighbors into a queue so distance grows level by level.",
  practice: "Implement a balanced-brackets scanner with a stack and reject the first mismatched closing token.",
  code: {
    functionName: "isBalanced",
    prompt: "Implement isBalanced(s) using a stack to decide whether brackets (), [], and {} are properly nested.",
    keywords: ["stack", "for"],
    starter: "def isBalanced(s):\n    # your code here\n    pass\n",
    hint: "Push openers. On a closer, pop and compare against the expected opener.",
  },
})

export const heapPriorityQueueModule = buildModule({
  id: "heap-priority-queue",
  title: "Heap / Priority Queue",
  description: "Always retrieve the current smallest or largest item efficiently.",
  icon: "PQ",
  accentColor: blue,
  concept: "Use a heap when repeated min or max extraction matters more than full sorted order.",
  pattern: "For top-k tasks, keep a heap of only k candidates. The heap root is the weakest kept candidate, so replacements are cheap.",
  practice: "Track the k largest numbers by maintaining a size-k min-heap.",
  code: {
    functionName: "topK",
    prompt: "Implement topK(nums, k) that returns the k largest values using a heap-shaped approach.",
    keywords: ["heap", "for"],
    starter: "def topK(nums, k):\n    # your code here\n    pass\n",
    hint: "Keep only k values in the heap; when it grows too large, remove the smallest.",
  },
})

export const trieModule = buildModule({
  id: "trie",
  title: "Trie",
  description: "Prefix trees for autocomplete, dictionaries, and word search.",
  icon: "TR",
  accentColor: blue,
  concept: "Use a trie when many words share prefixes and queries ask whether a prefix or whole word exists.",
  pattern: "Each edge represents one character. A terminal marker distinguishes the prefix 'car' from the full word 'car'.",
  practice: "Insert words character by character and check search/prefix queries without scanning every stored word.",
  code: {
    functionName: "insertWord",
    prompt: "Implement insertWord(root, word) for a trie represented by nested maps and terminal markers.",
    keywords: ["for", "children"],
    starter: "def insertWord(root, word):\n    # your code here\n    pass\n",
    hint: "Walk one character at a time, creating the child node if it does not exist.",
  },
})

export const backtrackingModule = buildModule({
  id: "backtracking",
  title: "Backtracking",
  description: "Recursive search with choose, explore, and undo.",
  icon: "BT",
  accentColor: purple,
  concept: "Use backtracking when you must enumerate valid combinations under constraints.",
  pattern: "At each decision, choose one candidate, recurse, then undo that choice before trying the next branch.",
  practice: "Generate subsets by deciding include/exclude for each element.",
  code: {
    functionName: "subsets",
    prompt: "Implement subsets(nums) using recursive choose/explore/undo backtracking.",
    keywords: ["def", "for"],
    starter: "def subsets(nums):\n    # your code here\n    pass\n",
    hint: "Carry a path list, append a copy to answers, then recurse over remaining choices.",
  },
})

export const binarySearchTreesModule = buildModule({
  id: "binary-search-trees",
  title: "Binary Search Trees",
  description: "Ordered trees, search boundaries, and validation.",
  icon: "BST",
  accentColor: purple,
  concept: "A BST keeps all left values smaller and all right values larger, recursively at every node.",
  pattern: "Validation needs low/high bounds, not only comparing a node with its direct children.",
  practice: "Search or validate a BST by narrowing the allowed value range as you descend.",
  code: {
    functionName: "searchBST",
    prompt: "Implement searchBST(root, target) by moving left or right according to BST ordering.",
    keywords: ["left", "right"],
    starter: "def searchBST(root, target):\n    # your code here\n    pass\n",
    hint: "If target is smaller than root.val go left; if larger go right.",
  },
})

export const graphFundamentalsModule = buildModule({
  id: "graphs",
  title: "Graph Fundamentals",
  description: "Nodes, edges, adjacency lists, and connected components.",
  icon: "GF",
  accentColor: amber,
  concept: "Use graphs when relationships are many-to-many rather than parent-to-child.",
  pattern: "An adjacency list stores each node's neighbors, making traversal proportional to vertices plus edges.",
  practice: "Build an adjacency list from edge pairs, then inspect neighbors without scanning every edge.",
  code: {
    functionName: "buildGraph",
    prompt: "Implement buildGraph(edges) that returns an adjacency list for an undirected graph.",
    keywords: ["for", "append"],
    starter: "def buildGraph(edges):\n    # your code here\n    pass\n",
    hint: "For each [a,b], add b to a's list and a to b's list.",
  },
})

export const dfsBfsModule = buildModule({
  id: "dfs-bfs",
  title: "DFS & BFS",
  description: "Depth-first and breadth-first traversal on explicit graphs.",
  icon: "DB",
  accentColor: amber,
  concept: "Use DFS to exhaust a branch and BFS to expand evenly by distance.",
  pattern: "Both need a visited set. Without it, cycles turn traversal into repeated work or infinite loops.",
  practice: "Count reachable nodes from a start node using either a stack or queue.",
  code: {
    functionName: "countReachable",
    prompt: "Implement countReachable(graph, start) with a visited set and stack or queue.",
    keywords: ["visited", "while"],
    starter: "def countReachable(graph, start):\n    # your code here\n    pass\n",
    hint: "Pop a node, skip if visited, then add unvisited neighbors.",
  },
})

export const gridGraphsModule = buildModule({
  id: "grid-graphs",
  title: "Grid Graphs",
  description: "Treat 2D grids as implicit graphs with neighbor moves.",
  icon: "GG",
  accentColor: amber,
  concept: "Use grid graph thinking when cells connect to nearby cells by direction rules.",
  pattern: "Bounds checks, visited marking, and four-direction movement are the core loop.",
  practice: "Flood-fill a region by walking up, down, left, and right from a starting cell.",
  code: {
    functionName: "countIsland",
    prompt: "Implement countIsland(grid, r, c) that counts connected land cells from a start cell.",
    keywords: ["visited", "while"],
    starter: "def countIsland(grid, r, c):\n    # your code here\n    pass\n",
    hint: "Use a stack or queue of coordinates and check bounds before visiting.",
  },
})

export const topologicalSortModule = buildModule({
  id: "topological-sort",
  title: "Topological Sort",
  description: "Order directed acyclic graphs by prerequisites.",
  icon: "TS",
  accentColor: amber,
  concept: "Use topological sort when tasks have one-way dependency edges and you need a valid order.",
  pattern: "Kahn's algorithm repeatedly removes nodes with zero incoming edges.",
  practice: "Return a course order from prerequisite pairs or detect that a cycle prevents one.",
  code: {
    functionName: "topoOrder",
    prompt: "Implement topoOrder(n, edges) using indegrees and a queue of zero-indegree nodes.",
    keywords: ["queue", "indegree"],
    starter: "def topoOrder(n, edges):\n    # your code here\n    pass\n",
    hint: "Compute indegrees, push all zeros, and reduce neighbors as nodes leave the queue.",
  },
})

export const unionFindModule = buildModule({
  id: "union-find",
  title: "Union-Find",
  description: "Disjoint-set components with near-constant merges and finds.",
  icon: "UF",
  accentColor: amber,
  concept: "Use union-find when the problem repeatedly connects items and asks whether they are in the same component.",
  pattern: "Path compression makes future find calls faster by pointing nodes directly at their representative.",
  practice: "Count connected components as edges merge previously separate sets.",
  code: {
    functionName: "countComponents",
    prompt: "Implement countComponents(n, edges) with parent links and union operations.",
    keywords: ["parent", "find"],
    starter: "def countComponents(n, edges):\n    # your code here\n    pass\n",
    hint: "Initialize each node as its own parent, then union edge endpoints.",
  },
})

export const greedyModule = buildModule({
  id: "greedy",
  title: "Greedy",
  description: "Locally optimal choices that can be justified globally.",
  icon: "GR",
  accentColor: pink,
  concept: "Use greedy when a locally best choice can be proven not to block an optimal final answer.",
  pattern: "Sort by the decision that matters, then make the earliest safe commitment.",
  practice: "Select the maximum number of non-overlapping intervals by finishing time.",
  code: {
    functionName: "maxNonOverlapping",
    prompt: "Implement maxNonOverlapping(intervals) by sorting by end time and greedily taking compatible intervals.",
    keywords: ["sort", "for"],
    starter: "def maxNonOverlapping(intervals):\n    # your code here\n    pass\n",
    hint: "Take an interval when its start is at or after the last chosen end.",
  },
})

export const oneDDynamicProgrammingModule = buildModule({
  id: "dp",
  title: "1D Dynamic Programming",
  description: "Linear recurrence, memoization, and tabulation.",
  icon: "1D",
  accentColor: pink,
  concept: "Use 1D DP when each answer depends on earlier positions in one sequence or index line.",
  pattern: "Define dp[i] as the best answer up to index i, then derive it from earlier states.",
  practice: "Solve a stair-climbing count or house-robber maximum by filling one array left to right.",
  code: {
    functionName: "climbWays",
    prompt: "Implement climbWays(n) where each move is 1 or 2 steps, using iterative DP.",
    keywords: ["for", "return"],
    starter: "def climbWays(n):\n    # your code here\n    pass\n",
    hint: "ways[i] = ways[i - 1] + ways[i - 2].",
  },
})

export const twoDDynamicProgrammingModule = buildModule({
  id: "dp-2d",
  title: "2D Dynamic Programming",
  description: "Grid and two-sequence DP tables.",
  icon: "2D",
  accentColor: pink,
  concept: "Use 2D DP when the state needs two coordinates, such as row/column or two string indices.",
  pattern: "Fill a table so each cell reads already-solved neighboring cells.",
  practice: "Count grid paths where each cell depends on the cell above and the cell to the left.",
  code: {
    functionName: "uniquePaths",
    prompt: "Implement uniquePaths(rows, cols) with a 2D DP table.",
    keywords: ["for", "dp"],
    starter: "def uniquePaths(rows, cols):\n    # your code here\n    pass\n",
    hint: "Initialize the first row and first column to 1, then add top plus left.",
  },
})

export const dpPatternsModule = buildModule({
  id: "dp-patterns",
  title: "Common DP Patterns",
  description: "Recognize knapsack, subsequence, partition, and interval DP shapes.",
  icon: "DP",
  accentColor: pink,
  concept: "Use DP pattern recognition when brute force explores overlapping choices or repeated subproblems.",
  pattern: "Ask what state uniquely describes the remaining work, then choose memoization or tabulation.",
  practice: "Classify a problem by state shape before writing the recurrence.",
})

export const mixedPatternRecognitionModule = buildModule({
  id: "mixed-pattern-recognition",
  title: "Mixed Pattern Recognition",
  description: "Identify likely algorithms from problem signals under ambiguity.",
  icon: "MP",
  accentColor: gold,
  concept: "This is an application module: read constraints, verbs, and data shape to choose a candidate pattern.",
  pattern: "Sorted input hints binary search or two pointers; repeated membership hints hashing; dependencies hint graphs or topological sort.",
  practice: "Given a short problem setup, name the likely pattern and one reason before coding.",
})

export const timedProblemsModule = buildModule({
  id: "timed-problems",
  title: "Timed Problems",
  description: "Practice planning, implementation, and review under interview timing.",
  icon: "TM",
  accentColor: gold,
  concept: "Timed practice is about pacing: clarify, brute force, optimize, code, test, and summarize.",
  pattern: "Use time boxes: 2 minutes to clarify, 5 to derive, 12 to code, 3 to test, and the remainder to explain trade-offs.",
  practice: "Run a self-contained practice loop using original prompts and record where time was lost.",
})

export const companyMissionsModule = buildModule({
  id: "company-missions",
  title: "Company Missions",
  description: "Curated company-targeted practice metadata and mission planning.",
  icon: "CO",
  accentColor: gold,
  concept: "Company practice should group by patterns and difficulty, not copied problem statements.",
  pattern: "Use titles, links, difficulty, company tags, and your own notes to create a repeatable practice mission.",
  practice: "Pick a target company set, solve by pattern cluster, and review misses by root cause.",
})

export const finalMasteryModule = buildModule({
  id: "summit",
  title: "Final Mastery Challenge",
  description: "Mixed final assessment across patterns, implementation, and explanation.",
  icon: "FM",
  accentColor: gold,
  concept: "Final mastery combines recognition, coding, testing, and communication.",
  pattern: "A strong final attempt explains the chosen pattern, complexity, edge cases, and why alternatives were rejected.",
  practice: "Complete a mixed assessment: classify two prompts, implement one solution, and write the complexity summary.",
  code: {
    functionName: "solveFinal",
    prompt: "Implement solveFinal(items) for a mixed original challenge after naming your chosen pattern in comments.",
    keywords: ["for", "return"],
    starter: "def solveFinal(items):\n    # name the pattern, then solve\n    pass\n",
    hint: "Start with the simplest correct invariant, then add the data structure that removes repeated work.",
  },
})

export const fullCurriculumModules: Record<string, Module> = {
  "stack-queue": stackQueueModule,
  "heap-priority-queue": heapPriorityQueueModule,
  trie: trieModule,
  backtracking: backtrackingModule,
  "binary-search-trees": binarySearchTreesModule,
  graphs: graphFundamentalsModule,
  "dfs-bfs": dfsBfsModule,
  "grid-graphs": gridGraphsModule,
  "topological-sort": topologicalSortModule,
  "union-find": unionFindModule,
  greedy: greedyModule,
  dp: oneDDynamicProgrammingModule,
  "dp-2d": twoDDynamicProgrammingModule,
  "dp-patterns": dpPatternsModule,
  "mixed-pattern-recognition": mixedPatternRecognitionModule,
  "timed-problems": timedProblemsModule,
  "company-missions": companyMissionsModule,
  summit: finalMasteryModule,
}
