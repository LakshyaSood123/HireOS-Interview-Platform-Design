import type { AlgorithmAnimationId, Checkpoint, CodeExample, CodeLanguage, Module, QuickCheckContent, TheoryBlock } from "../types"

type ModuleSeed = {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  concept: string
  pattern: string
  practice: string
  animationId?: AlgorithmAnimationId
  code?: {
    functionName: string
    prompt: string
    keywords: string[]
    starter: string
    hint: string
    /** DEMO-ONLY canonical solutions (see CodingActivityContent.demoSolution
     * in types.ts) — used exclusively by CodeWorkspace's Auto-fill Demo
     * Answer button when DEVELOPMENT_MODE.DEMO_CODE_AUTOFILL_ENABLED. */
    demo?: Partial<Record<CodeLanguage, string>>
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
        demoSolution: code.demo,
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
          animation: seed.animationId ? { id: seed.animationId } : undefined,
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
  animationId: "stack-queue-lifo-fifo",
  code: {
    functionName: "isBalanced",
    prompt: "Implement isBalanced(s) using a stack to decide whether brackets (), [], and {} are properly nested.",
    keywords: ["stack", "for"],
    starter: "def isBalanced(s):\n    # your code here\n    pass\n",
    hint: "Push openers. On a closer, pop and compare against the expected opener.",
    demo: {
      python: "def isBalanced(s):\n    if not s:\n        return True\n    stack = []\n    pairs = {')': '(', ']': '[', '}': '{'}\n    for ch in s:\n        if ch in '([{':\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return not stack\n",
      cpp: "bool isBalanced(string s) {\n    if (s.empty()) return true;\n    stack<char> st;\n    unordered_map<char, char> pairs = {{')', '('}, {']', '['}, {'}', '{'}};\n    for (char ch : s) {\n        if (ch == '(' || ch == '[' || ch == '{') st.push(ch);\n        else if (pairs.count(ch)) {\n            if (st.empty() || st.top() != pairs[ch]) return false;\n            st.pop();\n        }\n    }\n    return st.empty();\n}\n",
      java: "boolean isBalanced(String s) {\n    char[] chars = s.toCharArray();\n    if (chars.length == 0) return true;\n    Deque<Character> stack = new ArrayDeque<>();\n    Map<Character, Character> pairs = new HashMap<>();\n    pairs.put(')', '('); pairs.put(']', '['); pairs.put('}', '{');\n    for (char ch : chars) {\n        if (ch == '(' || ch == '[' || ch == '{') stack.push(ch);\n        else if (pairs.containsKey(ch)) {\n            if (stack.size() == 0 || stack.pop() != pairs.get(ch)) return false;\n        }\n    }\n    return stack.size() == 0;\n}\n",
    },
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
  animationId: "heap-insert-bubble",
  code: {
    functionName: "topK",
    prompt: "Implement topK(nums, k) that returns the k largest values using a heap-shaped approach.",
    keywords: ["heap", "for"],
    starter: "def topK(nums, k):\n    # your code here\n    pass\n",
    hint: "Keep only k values in the heap; when it grows too large, remove the smallest.",
    demo: {
      python: "import heapq\n\ndef topK(nums, k):\n    if not nums or k <= 0:\n        return []\n    heap = []\n    for n in nums:\n        heapq.heappush(heap, n)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return sorted(heap, reverse=True)\n",
      cpp: "vector<int> topK(vector<int>& nums, int k) {\n    if (nums.empty() || k <= 0) return {};\n    priority_queue<int, vector<int>, greater<int>> heap;\n    for (int n : nums) {\n        heap.push(n);\n        if ((int)heap.size() > k) heap.pop();\n    }\n    vector<int> result;\n    while (!heap.empty()) {\n        result.push_back(heap.top());\n        heap.pop();\n    }\n    reverse(result.begin(), result.end());\n    return result;\n}\n",
      java: "List<Integer> topK(int[] nums, int k) {\n    if (nums.length == 0 || k <= 0) return new ArrayList<>();\n    PriorityQueue<Integer> heap = new PriorityQueue<>();\n    for (int n : nums) {\n        heap.offer(n);\n        if (heap.size() > k) heap.poll();\n    }\n    List<Integer> result = new ArrayList<>(heap);\n    result.sort(Collections.reverseOrder());\n    return result;\n}\n",
    },
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
  animationId: "trie-prefix-branch",
  code: {
    functionName: "insertWord",
    prompt: "Implement insertWord(root, word) for a trie represented by nested maps and terminal markers.",
    keywords: ["for", "children"],
    starter: "def insertWord(root, word):\n    # your code here\n    pass\n",
    hint: "Walk one character at a time, creating the child node if it does not exist.",
    demo: {
      python: "def insertWord(root, word):\n    if not word:\n        return\n    node = root\n    for ch in word:\n        if ch not in node['children']:\n            node['children'][ch] = {'children': {}, 'is_word': False}\n        node = node['children'][ch]\n    node['is_word'] = True\n",
      cpp: "void insertWord(TrieNode* root, string word) {\n    if (word.empty()) return;\n    TrieNode* node = root;\n    for (char ch : word) {\n        if (node->children.find(ch) == node->children.end()) {\n            node->children[ch] = new TrieNode();\n        }\n        node = node->children[ch];\n    }\n    node->isWord = true;\n}\n",
      java: "void insertWord(TrieNode root, String word) {\n    char[] chars = word.toCharArray();\n    if (chars.length == 0) return;\n    TrieNode node = root;\n    for (char ch : chars) {\n        node.children.putIfAbsent(ch, new TrieNode());\n        node = node.children.get(ch);\n    }\n    node.isWord = true;\n}\n",
    },
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
  animationId: "backtracking-choose-undo",
  code: {
    functionName: "subsets",
    prompt: "Implement subsets(nums) using recursive choose/explore/undo backtracking.",
    keywords: ["def", "for"],
    starter: "def subsets(nums):\n    # your code here\n    pass\n",
    hint: "Carry a path list, append a copy to answers, then recurse over remaining choices.",
    demo: {
      python: "def subsets(nums):\n    if not nums:\n        return [[]]\n    result = []\n    path = []\n\n    def backtrack(start):\n        result.append(path.copy())\n        for i in range(start, len(nums)):\n            path.append(nums[i])\n            backtrack(i + 1)\n            path.pop()\n\n    backtrack(0)\n    return result\n",
      cpp: "// define the recursive step: choose a candidate, explore, then undo\nvector<vector<int>> subsets(vector<int>& nums) {\n    vector<vector<int>> result;\n    vector<int> path;\n    if (nums.empty()) {\n        result.push_back({});\n        return result;\n    }\n    function<void(int)> backtrack = [&](int start) {\n        result.push_back(path);\n        for (int i = start; i < (int)nums.size(); i++) {\n            path.push_back(nums[i]);\n            backtrack(i + 1);\n            path.pop_back();\n        }\n    };\n    backtrack(0);\n    return result;\n}\n",
      java: "// define the recursive step: choose a candidate, explore, then undo\nList<List<Integer>> subsets(int[] nums) {\n    List<List<Integer>> result = new ArrayList<>();\n    List<Integer> path = new ArrayList<>();\n    if (nums.length == 0) {\n        result.add(new ArrayList<>());\n        return result;\n    }\n    subsetsBacktrack(nums, 0, path, result);\n    return result;\n}\n\nprivate void subsetsBacktrack(int[] nums, int start, List<Integer> path, List<List<Integer>> result) {\n    result.add(new ArrayList<>(path));\n    for (int i = start; i < nums.length; i++) {\n        path.add(nums[i]);\n        subsetsBacktrack(nums, i + 1, path, result);\n        path.remove(path.size() - 1);\n    }\n}\n",
    },
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
  animationId: "bst-search-invariant",
  code: {
    functionName: "searchBST",
    prompt: "Implement searchBST(root, target) by moving left or right according to BST ordering.",
    keywords: ["left", "right"],
    starter: "def searchBST(root, target):\n    # your code here\n    pass\n",
    hint: "If target is smaller than root.val go left; if larger go right.",
    demo: {
      python: "def searchBST(root, target):\n    if not root:\n        return None\n    if root.val == target:\n        return root\n    if target < root.val:\n        return searchBST(root.left, target)\n    return searchBST(root.right, target)\n",
      cpp: "TreeNode* searchBST(TreeNode* root, int target) {\n    if (root == nullptr) return nullptr;\n    if (root->val == target) return root;\n    if (target < root->val) return searchBST(root->left, target);\n    return searchBST(root->right, target);\n}\n",
      java: "TreeNode searchBST(TreeNode root, int target) {\n    if (root == null) return null;\n    if (root.val == target) return root;\n    if (target < root.val) return searchBST(root.left, target);\n    return searchBST(root.right, target);\n}\n",
    },
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
  animationId: "graph-adjacency-build",
  code: {
    functionName: "buildGraph",
    prompt: "Implement buildGraph(edges) that returns an adjacency list for an undirected graph.",
    keywords: ["for", "append"],
    starter: "def buildGraph(edges):\n    # your code here\n    pass\n",
    hint: "For each [a,b], add b to a's list and a to b's list.",
    demo: {
      python: "def buildGraph(edges):\n    graph = {}\n    if not edges:\n        return graph\n    for a, b in edges:\n        graph.setdefault(a, []).append(b)\n        graph.setdefault(b, []).append(a)\n    return graph\n",
      cpp: "unordered_map<int, vector<int>> buildGraph(vector<vector<int>>& edges) {\n    unordered_map<int, vector<int>> graph;\n    if (edges.empty()) return graph;\n    for (auto& e : edges) {\n        int a = e[0], b = e[1];\n        graph[a].push_back(b); // append neighbor to adjacency list\n        graph[b].push_back(a); // append neighbor to adjacency list\n    }\n    return graph;\n}\n",
      java: "Map<Integer, List<Integer>> buildGraph(int[][] edges) {\n    Map<Integer, List<Integer>> graph = new HashMap<>();\n    if (edges.length == 0) return graph;\n    for (int[] e : edges) {\n        int a = e[0], b = e[1];\n        graph.computeIfAbsent(a, k -> new ArrayList<>()).add(b); // append neighbor\n        graph.computeIfAbsent(b, k -> new ArrayList<>()).add(a); // append neighbor\n    }\n    return graph;\n}\n",
    },
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
  animationId: "dfs-bfs-frontier",
  code: {
    functionName: "countReachable",
    prompt: "Implement countReachable(graph, start) with a visited set and stack or queue.",
    keywords: ["visited", "while"],
    starter: "def countReachable(graph, start):\n    # your code here\n    pass\n",
    hint: "Pop a node, skip if visited, then add unvisited neighbors.",
    demo: {
      python: "def countReachable(graph, start):\n    if not graph or start not in graph:\n        return 0\n    visited = {start}\n    stack = [start]\n    count = 0\n    while stack:\n        node = stack.pop()\n        count += 1\n        for neighbor in graph.get(node, []):\n            if neighbor not in visited:\n                visited.add(neighbor)\n                stack.append(neighbor)\n    return count\n",
      cpp: "int countReachable(unordered_map<int, vector<int>>& graph, int start) {\n    if (graph.empty() || graph.find(start) == graph.end()) return 0;\n    unordered_set<int> visited = {start};\n    stack<int> st;\n    st.push(start);\n    int count = 0;\n    while (!st.empty()) {\n        int node = st.top();\n        st.pop();\n        count++;\n        for (int neighbor : graph[node]) {\n            if (!visited.count(neighbor)) {\n                visited.insert(neighbor);\n                st.push(neighbor);\n            }\n        }\n    }\n    return count;\n}\n",
      java: "int countReachable(Map<Integer, List<Integer>> graph, int start) {\n    if (graph.size() == 0 || !graph.containsKey(start)) return 0;\n    Set<Integer> visited = new HashSet<>();\n    visited.add(start);\n    Deque<Integer> stack = new ArrayDeque<>();\n    stack.push(start);\n    int count = 0;\n    while (stack.size() > 0) {\n        int node = stack.pop();\n        count++;\n        for (int neighbor : graph.getOrDefault(node, new ArrayList<>())) {\n            if (!visited.contains(neighbor)) {\n                visited.add(neighbor);\n                stack.push(neighbor);\n            }\n        }\n    }\n    return count;\n}\n",
    },
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
  animationId: "grid-graph-frontier",
  code: {
    functionName: "countIsland",
    prompt: "Implement countIsland(grid, r, c) that counts connected land cells from a start cell.",
    keywords: ["visited", "while"],
    starter: "def countIsland(grid, r, c):\n    # your code here\n    pass\n",
    hint: "Use a stack or queue of coordinates and check bounds before visiting.",
    demo: {
      python: "def countIsland(grid, r, c):\n    if not grid or not grid[0]:\n        return 0\n    rows, cols = len(grid), len(grid[0])\n    visited = set()\n    stack = [(r, c)]\n    count = 0\n    while stack:\n        cr, cc = stack.pop()\n        if (cr, cc) in visited or cr < 0 or cr >= rows or cc < 0 or cc >= cols or grid[cr][cc] == 0:\n            continue\n        visited.add((cr, cc))\n        count += 1\n        for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:\n            stack.append((cr + dr, cc + dc))\n    return count\n",
      cpp: "int countIsland(vector<vector<int>>& grid, int r, int c) {\n    if (grid.empty() || grid[0].empty()) return 0;\n    int rows = grid.size(), cols = grid[0].size();\n    set<pair<int, int>> visited;\n    stack<pair<int, int>> st;\n    st.push({r, c});\n    int count = 0;\n    int dr[] = {-1, 1, 0, 0}, dc[] = {0, 0, -1, 1};\n    while (!st.empty()) {\n        auto [cr, cc] = st.top();\n        st.pop();\n        if (visited.count({cr, cc}) || cr < 0 || cr >= rows || cc < 0 || cc >= cols || grid[cr][cc] == 0) continue;\n        visited.insert({cr, cc});\n        count++;\n        for (int i = 0; i < 4; i++) st.push({cr + dr[i], cc + dc[i]});\n    }\n    return count;\n}\n",
      java: "int countIsland(int[][] grid, int r, int c) {\n    if (grid.length == 0 || grid[0].length == 0) return 0;\n    int rows = grid.length, cols = grid[0].length;\n    Set<String> visited = new HashSet<>();\n    Deque<int[]> stack = new ArrayDeque<>();\n    stack.push(new int[]{r, c});\n    int count = 0;\n    int[] dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1};\n    while (stack.size() > 0) {\n        int[] cur = stack.pop();\n        int cr = cur[0], cc = cur[1];\n        String key = cr + \",\" + cc;\n        if (visited.contains(key) || cr < 0 || cr >= rows || cc < 0 || cc >= cols || grid[cr][cc] == 0) continue;\n        visited.add(key);\n        count++;\n        for (int i = 0; i < 4; i++) stack.push(new int[]{cr + dr[i], cc + dc[i]});\n    }\n    return count;\n}\n",
    },
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
  animationId: "topological-sort-kahn",
  code: {
    functionName: "topoOrder",
    prompt: "Implement topoOrder(n, edges) using indegrees and a queue of zero-indegree nodes.",
    keywords: ["queue", "indegree"],
    starter: "def topoOrder(n, edges):\n    # your code here\n    pass\n",
    hint: "Compute indegrees, push all zeros, and reduce neighbors as nodes leave the queue.",
    demo: {
      python: "from collections import deque\n\ndef topoOrder(n, edges):\n    if not n:\n        return []\n    indegree = [0] * n\n    graph = {i: [] for i in range(n)}\n    for a, b in edges:\n        graph[a].append(b)\n        indegree[b] += 1\n    queue = deque(i for i in range(n) if indegree[i] == 0)\n    order = []\n    while queue:\n        node = queue.popleft()\n        order.append(node)\n        for neighbor in graph[node]:\n            indegree[neighbor] -= 1\n            if indegree[neighbor] == 0:\n                queue.append(neighbor)\n    return order\n",
      cpp: "vector<int> topoOrder(int n, vector<vector<int>>& edges) {\n    if (n == 0) return {};\n    vector<int> indegree(n, 0);\n    vector<vector<int>> graph(n);\n    for (auto& e : edges) {\n        graph[e[0]].push_back(e[1]);\n        indegree[e[1]]++;\n    }\n    queue<int> q;\n    for (int i = 0; i < n; i++) if (indegree[i] == 0) q.push(i);\n    vector<int> order;\n    while (!q.empty()) {\n        int node = q.front();\n        q.pop();\n        order.push_back(node);\n        for (int neighbor : graph[node]) {\n            if (--indegree[neighbor] == 0) q.push(neighbor);\n        }\n    }\n    return order;\n}\n",
      java: "List<Integer> topoOrder(int n, int[][] edges) {\n    int[] indegree = new int[n];\n    if (indegree.length == 0) return new ArrayList<>();\n    List<List<Integer>> graph = new ArrayList<>();\n    for (int i = 0; i < n; i++) graph.add(new ArrayList<>());\n    for (int[] e : edges) {\n        graph.get(e[0]).add(e[1]);\n        indegree[e[1]]++;\n    }\n    Queue<Integer> queue = new LinkedList<>();\n    for (int i = 0; i < n; i++) if (indegree[i] == 0) queue.add(i);\n    List<Integer> order = new ArrayList<>();\n    while (queue.size() > 0) {\n        int node = queue.poll();\n        order.add(node);\n        for (int neighbor : graph.get(node)) {\n            if (--indegree[neighbor] == 0) queue.add(neighbor);\n        }\n    }\n    return order;\n}\n",
    },
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
  animationId: "union-find-compression",
  code: {
    functionName: "countComponents",
    prompt: "Implement countComponents(n, edges) with parent links and union operations.",
    keywords: ["parent", "find"],
    starter: "def countComponents(n, edges):\n    # your code here\n    pass\n",
    hint: "Initialize each node as its own parent, then union edge endpoints.",
    demo: {
      python: "def countComponents(n, edges):\n    if not n:\n        return 0\n    parent = list(range(n))\n\n    def find(x):\n        while parent[x] != x:\n            parent[x] = parent[parent[x]]\n            x = parent[x]\n        return x\n\n    def union(a, b):\n        rootA, rootB = find(a), find(b)\n        if rootA != rootB:\n            parent[rootA] = rootB\n\n    for a, b in edges:\n        union(a, b)\n    return len({find(i) for i in range(n)})\n",
      cpp: "int findRoot(vector<int>& parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countComponents(int n, vector<vector<int>>& edges) {\n    vector<int> parent(n);\n    if (parent.empty()) return 0;\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (auto& e : edges) {\n        int rootA = findRoot(parent, e[0]);\n        int rootB = findRoot(parent, e[1]);\n        if (rootA != rootB) parent[rootA] = rootB;\n    }\n    set<int> roots;\n    for (int i = 0; i < n; i++) roots.insert(findRoot(parent, i));\n    return roots.size();\n}\n",
      java: "private int find(int[] parent, int x) {\n    while (parent[x] != x) {\n        parent[x] = parent[parent[x]];\n        x = parent[x];\n    }\n    return x;\n}\n\nint countComponents(int n, int[][] edges) {\n    int[] parent = new int[n];\n    if (parent.length == 0) return 0;\n    for (int i = 0; i < n; i++) parent[i] = i;\n    for (int[] e : edges) {\n        int rootA = find(parent, e[0]);\n        int rootB = find(parent, e[1]);\n        if (rootA != rootB) parent[rootA] = rootB;\n    }\n    Set<Integer> roots = new HashSet<>();\n    for (int i = 0; i < n; i++) roots.add(find(parent, i));\n    return roots.size();\n}\n",
    },
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
  animationId: "greedy-interval-selection",
  code: {
    functionName: "maxNonOverlapping",
    prompt: "Implement maxNonOverlapping(intervals) by sorting by end time and greedily taking compatible intervals.",
    keywords: ["sort", "for"],
    starter: "def maxNonOverlapping(intervals):\n    # your code here\n    pass\n",
    hint: "Take an interval when its start is at or after the last chosen end.",
    demo: {
      python: "def maxNonOverlapping(intervals):\n    if not intervals:\n        return 0\n    intervals = sorted(intervals, key=lambda x: x[1])\n    count = 0\n    last_end = float('-inf')\n    for start, end in intervals:\n        if start >= last_end:\n            count += 1\n            last_end = end\n    return count\n",
      cpp: "int maxNonOverlapping(vector<vector<int>>& intervals) {\n    if (intervals.empty()) return 0;\n    sort(intervals.begin(), intervals.end(), [](vector<int>& a, vector<int>& b) { return a[1] < b[1]; });\n    int count = 0;\n    long lastEnd = LONG_MIN;\n    for (auto& interval : intervals) {\n        if (interval[0] >= lastEnd) {\n            count++;\n            lastEnd = interval[1];\n        }\n    }\n    return count;\n}\n",
      java: "int maxNonOverlapping(int[][] intervals) {\n    if (intervals.length == 0) return 0;\n    Arrays.sort(intervals, (a, b) -> a[1] - b[1]);\n    int count = 0;\n    long lastEnd = Long.MIN_VALUE;\n    for (int[] interval : intervals) {\n        if (interval[0] >= lastEnd) {\n            count++;\n            lastEnd = interval[1];\n        }\n    }\n    return count;\n}\n",
    },
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
  animationId: "dp-1d-fill",
  code: {
    functionName: "climbWays",
    prompt: "Implement climbWays(n) where each move is 1 or 2 steps, using iterative DP.",
    keywords: ["for", "return"],
    starter: "def climbWays(n):\n    # your code here\n    pass\n",
    hint: "ways[i] = ways[i - 1] + ways[i - 2].",
    demo: {
      python: "def climbWays(n):\n    ways = [0] * (n + 1)\n    if len(ways) == 0:\n        return 1\n    ways[0] = 1\n    for i in range(1, n + 1):\n        ways[i] = ways[i - 1] + (ways[i - 2] if i >= 2 else 0)\n    return ways[n]\n",
      cpp: "int climbWays(int n) {\n    vector<int> ways(n + 1, 0);\n    if (ways.empty()) return 1;\n    ways[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        ways[i] = ways[i - 1] + (i >= 2 ? ways[i - 2] : 0);\n    }\n    return ways[n];\n}\n",
      java: "int climbWays(int n) {\n    int[] ways = new int[n + 1];\n    if (ways.length == 0) return 1;\n    ways[0] = 1;\n    for (int i = 1; i <= n; i++) {\n        ways[i] = ways[i - 1] + (i >= 2 ? ways[i - 2] : 0);\n    }\n    return ways[n];\n}\n",
    },
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
  animationId: "dp-2d-grid-paths",
  code: {
    functionName: "uniquePaths",
    prompt: "Implement uniquePaths(rows, cols) with a 2D DP table.",
    keywords: ["for", "dp"],
    starter: "def uniquePaths(rows, cols):\n    # your code here\n    pass\n",
    hint: "Initialize the first row and first column to 1, then add top plus left.",
    demo: {
      python: "def uniquePaths(rows, cols):\n    if not rows or not cols:\n        return 0\n    dp = [[1] * cols for _ in range(rows)]\n    for r in range(1, rows):\n        for c in range(1, cols):\n            dp[r][c] = dp[r - 1][c] + dp[r][c - 1]\n    return dp[rows - 1][cols - 1]\n",
      cpp: "int uniquePaths(int rows, int cols) {\n    vector<vector<int>> dp(rows, vector<int>(cols, 1));\n    if (dp.empty() || dp[0].empty()) return 0;\n    for (int r = 1; r < rows; r++) {\n        for (int c = 1; c < cols; c++) {\n            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];\n        }\n    }\n    return dp[rows - 1][cols - 1];\n}\n",
      java: "int uniquePaths(int rows, int cols) {\n    int[][] dp = new int[Math.max(rows, 0)][Math.max(cols, 0)];\n    if (dp.length == 0 || dp[0].length == 0) return 0;\n    for (int[] row : dp) Arrays.fill(row, 1);\n    for (int r = 1; r < rows; r++) {\n        for (int c = 1; c < cols; c++) {\n            dp[r][c] = dp[r - 1][c] + dp[r][c - 1];\n        }\n    }\n    return dp[rows - 1][cols - 1];\n}\n",
    },
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
  animationId: "dp-take-skip",
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
  animationId: "pattern-recognition-clues",
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
  animationId: "timed-problem-phases",
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
  animationId: "company-mission-review",
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
  animationId: "final-mastery-readiness",
  code: {
    functionName: "solveFinal",
    prompt: "Implement solveFinal(items) for a mixed original challenge after naming your chosen pattern in comments.",
    keywords: ["for", "return"],
    starter: "def solveFinal(items):\n    # name the pattern, then solve\n    pass\n",
    hint: "Start with the simplest correct invariant, then add the data structure that removes repeated work.",
    demo: {
      python: "def solveFinal(items):\n    # Pattern: hashing — count occurrences in one pass, O(n) time, O(n) space.\n    if not items:\n        return {}\n    counts = {}\n    for item in items:\n        counts[item] = counts.get(item, 0) + 1\n    return counts\n",
      cpp: "// Pattern: hashing — count occurrences in one pass, O(n) time, O(n) space.\nunordered_map<int, int> solveFinal(vector<int>& items) {\n    unordered_map<int, int> counts;\n    if (items.empty()) return counts;\n    for (int item : items) counts[item]++;\n    return counts;\n}\n",
      java: "// Pattern: hashing — count occurrences in one pass, O(n) time, O(n) space.\nMap<Integer, Integer> solveFinal(int[] items) {\n    Map<Integer, Integer> counts = new HashMap<>();\n    if (items.length == 0) return counts;\n    for (int item : items) counts.merge(item, 1, Integer::sum);\n    return counts;\n}\n",
    },
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
