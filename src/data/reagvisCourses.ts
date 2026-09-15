export type NodeStatus = "completed" | "current" | "available" | "locked"
export type NodeType = "lesson" | "checkpoint" | "challenge" | "boss"

export interface QuickCheck {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

export interface PracticeChallenge {
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  rewardXP: number
  description: string
  starterCode: string
  solutionHint: string
  expectedOutput: string
  mockRunOutput: string
}

export interface LessonContent {
  id: string
  title: string
  level: number
  readTime: string
  xp: number
  conceptSummary: string
  visualDiagramSvg?: string
  explanation: string
  codeSnippet?: {
    language: string
    code: string
  }
  interviewTip: string
  commonPitfall: string
  quickCheck: QuickCheck
  challenge?: PracticeChallenge
}

export interface TrailNode {
  id: number
  code: string
  title: string
  subtitle: string
  biome: string
  type: NodeType
  status: NodeStatus
  mastery: number
  xp: number
  x: number // Map coordinate percentage
  y: number
  lesson?: LessonContent
}

export interface BiomeZone {
  id: string
  name: string
  environment: string
  accentColor: string
  bgGradient: string
  description: string
  icon: string
  nodeRange: [number, number]
  isUnlocked: boolean
}

export interface CourseData {
  id: string
  title: string
  subBrand: string
  provider: string
  source: string
  difficulty: string
  duration: string
  lessonCount: number
  currentMastery: number
  targetMastery: number
  xpAvailable: number
  assessmentScore: number
  weakSkills: string[]
  biomes: BiomeZone[]
  nodes: TrailNode[]
}

export const dsaCourseData: CourseData = {
  id: "dsa-foundations",
  title: "Data Structures & Algorithms",
  subBrand: "Reagvis Trails",
  provider: "Reagvis Labs",
  source: "HireOS Assessment",
  difficulty: "Beginner → Intermediate",
  duration: "2h 30m",
  lessonCount: 18,
  currentMastery: 58,
  targetMastery: 80,
  xpAvailable: 1640,
  assessmentScore: 58,
  weakSkills: [
    "Trees & Binary Search Trees",
    "Graph Traversal (BFS / DFS)",
    "Time & Space Complexity Analysis",
    "Recursion Base Conditions",
  ],
  biomes: [
    {
      id: "grove",
      name: "Trailhead Grove",
      environment: "Sunlit Clearing & Beginner Path",
      accentColor: "#79A84B",
      bgGradient: "from-emerald-950/80 via-emerald-900/60 to-emerald-950/90",
      description: "Foundations of complexity, arrays, and two-pointer traversal strategies.",
      icon: "🌱",
      nodeRange: [1, 3],
      isUnlocked: true,
    },
    {
      id: "river",
      name: "River Crossing",
      environment: "Rushing Waters & Timber Footbridge",
      accentColor: "#38BDF8",
      bgGradient: "from-cyan-950/80 via-emerald-950/70 to-teal-950/90",
      description: "Linear pointer structures: Linked lists, Monotonic stacks, and Queues.",
      icon: "🌊",
      nodeRange: [4, 6],
      isUnlocked: true, // Will unlock when node 3 is finished
    },
    {
      id: "cave",
      name: "Recursion Cave",
      environment: "Cavern of Glowing Crystals & Echoes",
      accentColor: "#A855F7",
      bgGradient: "from-purple-950/80 via-slate-950/90 to-emerald-950/90",
      description: "Call stack mechanics, base cases, and combinatorial backtracking.",
      icon: "💎",
      nodeRange: [7, 8],
      isUnlocked: false,
    },
    {
      id: "canopy",
      name: "Ancient Canopy",
      environment: "Colossal Ancient Tree & Elevated Branch Walkways",
      accentColor: "#1DB584",
      bgGradient: "from-teal-950/85 via-emerald-950/80 to-green-950/90",
      description: "Hierarchical tree nodes, Pre/In/Postorder traversal, and BST search logic.",
      icon: "🌳",
      nodeRange: [9, 11],
      isUnlocked: false,
    },
    {
      id: "wilds",
      name: "Graph Wilds",
      environment: "Connected Forest Islands & Vine Suspensions",
      accentColor: "#F59E0B",
      bgGradient: "from-amber-950/70 via-emerald-950/85 to-stone-950/90",
      description: "Adjacency representations, BFS queue expansion, DFS, and cycle detection.",
      icon: "🕸️",
      nodeRange: [12, 15],
      isUnlocked: false,
    },
    {
      id: "caverns",
      name: "Dynamic Caverns",
      environment: "Ancient Runic Chambers & Overlapping Puzzles",
      accentColor: "#EC4899",
      bgGradient: "from-rose-950/75 via-purple-950/80 to-emerald-950/90",
      description: "Memoization caches, optimal substructure, and tabulation grids.",
      icon: "⚡",
      nodeRange: [16, 17],
      isUnlocked: false,
    },
    {
      id: "summit",
      name: "Algorithm Summit",
      environment: "Sunlit Peak & Final Mastery Platform",
      accentColor: "#E2B44A",
      bgGradient: "from-amber-900/60 via-emerald-900/50 to-emerald-950/95",
      description: "The complete technical interview trial. Prove your readiness for HireOS.",
      icon: "⭐",
      nodeRange: [18, 18],
      isUnlocked: false,
    },
  ],
  nodes: [
    {
      id: 1,
      code: "DSA-01",
      title: "Arrays & Complexity",
      subtitle: "Big-O runtime & memory intuition",
      biome: "Trailhead Grove",
      type: "lesson",
      status: "completed",
      mastery: 95,
      xp: 80,
      x: 14,
      y: 84,
      lesson: {
        id: "dsa-01",
        title: "Arrays & Asymptotic Complexity",
        level: 1,
        readTime: "8 min",
        xp: 80,
        conceptSummary: "Mastering contiguous memory allocation, instant O(1) indexing, and worst-case trade-offs.",
        explanation: `An array is a contiguous block of memory where each element can be accessed in constant time O(1) via an index offset.
When discussing arrays in an interview, clarify whether you are working with fixed-size static arrays or dynamic resizable arrays (like JavaScript Arrays, Python Lists, or Java ArrayLists), which have amortized O(1) insertions but occasional O(N) resizing operations.`,
        codeSnippet: {
          language: "javascript",
          code: `// Instant indexing in O(1)
const arr = [10, 20, 30, 40];
const secondItem = arr[1]; // O(1) memory lookup

// Linear search requires scanning in O(N)
function linearSearch(items, target) {
  for (let i = 0; i < items.length; i++) {
    if (items[i] === target) return i;
  }
  return -1;
}`,
        },
        interviewTip: "Always clarify with the interviewer if the array is already sorted. A sorted array often transforms an O(N) brute force search into an O(log N) binary search or O(N) two-pointer scan.",
        commonPitfall: "Assuming array shifts (.shift() or .unshift()) are O(1). Shifting requires moving all N elements, making it O(N).",
        quickCheck: {
          question: "What is the time complexity of looking up an element by index in a contiguous array?",
          options: ["O(log N)", "O(1)", "O(N)", "O(N log N)"],
          correctIndex: 1,
          explanation: "Because elements are laid out contiguously in memory, the address can be calculated directly with `baseAddress + index * elementSize` in O(1) time.",
        },
      },
    },
    {
      id: 2,
      code: "DSA-02",
      title: "Strings & Two Pointers",
      subtitle: "Palindromes & window boundaries",
      biome: "Trailhead Grove",
      type: "lesson",
      status: "completed",
      mastery: 88,
      xp: 80,
      x: 25,
      y: 76,
      lesson: {
        id: "dsa-02",
        title: "Two-Pointer Strategy on Strings",
        level: 2,
        readTime: "10 min",
        xp: 80,
        conceptSummary: "Using two converging or sliding markers to solve substring and symmetric queries in O(N) time with O(1) extra space.",
        explanation: `Instead of generating all O(N²) substrings, the two-pointer technique uses two index markers (usually 'left' starting at 0 and 'right' at N - 1) to inspect characters symmetrically. This eliminates unnecessary nested loops and keeps auxiliary memory minimal.`,
        codeSnippet: {
          language: "javascript",
          code: `function isPalindrome(str) {
  let left = 0;
  let right = str.length - 1;
  while (left < right) {
    if (str[left] !== str[right]) return false;
    left++;
    right--;
  }
  return true;
}`,
        },
        interviewTip: "State both the time complexity (O(N)) and auxiliary space complexity (O(1)) immediately after sketching your two-pointer approach.",
        commonPitfall: "Forgetting to handle string mutability. In languages like Java or Python, strings are immutable; repeated concatenation creates new copies in O(N) time.",
        quickCheck: {
          question: "How does the two-pointer approach compare to reversing a string to check for palindromes?",
          options: [
            "Two-pointer is slower but uses less memory",
            "Two-pointer achieves O(1) extra space without copying the entire string",
            "Reversing the string is faster in Big-O terms",
            "There is no difference in memory or time",
          ],
          correctIndex: 1,
          explanation: "Reversing a string requires allocating a full second string of length N (O(N) space), whereas two pointers inspect characters in-place using O(1) space.",
        },
      },
    },
    {
      id: 3,
      code: "DSA-03",
      title: "Sorting Clearing",
      subtitle: "Divide & conquer foundations",
      biome: "Trailhead Grove",
      type: "challenge",
      status: "current", // This is where Alex starts!
      mastery: 42,
      xp: 120,
      x: 36,
      y: 69,
      lesson: {
        id: "dsa-03",
        title: "Sorting Clearing & Two Sum Mastery",
        level: 3,
        readTime: "12 min",
        xp: 120,
        conceptSummary: "Balancing hash-map lookups versus sorted two-pointer scans. Essential for algorithmic interview screening.",
        explanation: `In your HireOS interview, you answered the Two Sum question, but there are two canonical ways to approach it:
1. One-pass Hash Map: O(N) time, O(N) space.
2. Sort + Two Pointers: O(N log N) time, O(1) auxiliary space (if array can be modified).

Interviewers specifically look for candidates who proactively discuss this trade-off between memory and speed!`,
        codeSnippet: {
          language: "javascript",
          code: `function twoSumOptimized(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) {
      return [seen.get(diff), i];
    }
    seen.set(nums[i], i);
  }
  return null;
}`,
        },
        interviewTip: "When asked to optimize a quadratic O(N²) solution, ask yourself: 'Can I trade space for time with a Hash Table, or can I sort first to unlock Binary Search or Two Pointers?'",
        commonPitfall: "Using the same element twice (e.g., if target is 6 and nums contains [3], returning [0, 0]).",
        quickCheck: {
          question: "If memory is strictly limited (embedded system or billion records), which Two Sum approach is preferred?",
          options: [
            "Hash Map storing all seen values in RAM",
            "In-place sorting followed by Two Pointers with O(1) extra memory",
            "Recursive brute-force exponential search",
            "Lookup table caching all pairs",
          ],
          correctIndex: 1,
          explanation: "Sorting in-place followed by two pointers requires O(1) auxiliary space, making it ideal when memory overhead must be minimized.",
        },
        challenge: {
          title: "Two Sum Target Matcher",
          difficulty: "Easy",
          rewardXP: 120,
          description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. Complete the challenge to clear the Trailhead Grove and unlock the River Crossing bridge!",
          starterCode: `function twoSum(nums, target) {
  // Use a hash map to find the pair in O(N) time
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
          solutionHint: "Store each number's index as you iterate. If `target - currentNum` exists in your map, return both indices.",
          expectedOutput: "[0, 1]",
          mockRunOutput: "✓ Test 1: nums = [2, 7, 11, 15], target = 9 ➔ Passed: [0, 1]\n✓ Test 2: nums = [3, 2, 4], target = 6 ➔ Passed: [1, 2]\n✓ Complexity: O(N) Time, O(N) Space verified.",
        },
      },
    },
    {
      id: 4,
      code: "DSA-04",
      title: "Linked Lists",
      subtitle: "Pointer reversal & dummy nodes",
      biome: "River Crossing",
      type: "lesson",
      status: "available", // Can be clicked after clearing #3
      mastery: 0,
      xp: 90,
      x: 48,
      y: 60,
      lesson: {
        id: "dsa-04",
        title: "Linked Lists & Sentinel Nodes",
        level: 4,
        readTime: "10 min",
        xp: 90,
        conceptSummary: "Non-contiguous dynamic node chaining. Eliminating edge cases using dummy/sentinel pointers.",
        explanation: `Unlike arrays, linked list nodes are scattered throughout the heap and bound together via 'next' memory references.
A common interview pitfall is null-pointer exceptions when manipulating the head node. Using a dummy (sentinel) node before the actual head simplifies insertion and deletion loops dramatically.`,
        interviewTip: "Draw the pointer states on the whiteboard or code comments before coding pointer swaps. Always keep a reference to `curr.next` before overwriting it!",
        commonPitfall: "Losing the reference to the rest of the list when reassigning pointers.",
        quickCheck: {
          question: "Why is a dummy (sentinel) head node commonly introduced in linked list problems?",
          options: [
            "It reduces the time complexity from O(N) to O(1)",
            "It eliminates special edge cases when inserting or deleting at the real head",
            "It automatically reverses the list in-place",
            "It sorts the linked list in O(log N)",
          ],
          correctIndex: 1,
          explanation: "A dummy head guarantees that every node, including the first real item, has a preceding node, removing boilerplate null checks.",
        },
      },
    },
    {
      id: 5,
      code: "DSA-05",
      title: "Stacks & Queues",
      subtitle: "LIFO call stacks & FIFO streams",
      biome: "River Crossing",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 90,
      x: 58,
      y: 53,
    },
    {
      id: 6,
      code: "DSA-06",
      title: "Linear Bridge Checkpoint",
      subtitle: "Monotonic Stack Challenge",
      biome: "River Crossing",
      type: "checkpoint",
      status: "locked",
      mastery: 0,
      xp: 140,
      x: 68,
      y: 47,
    },
    {
      id: 7,
      code: "DSA-07",
      title: "Recursion Foundations",
      subtitle: "Base cases & call-stack unwinding",
      biome: "Recursion Cave",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 100,
      x: 77,
      y: 40,
    },
    {
      id: 8,
      code: "DSA-08",
      title: "Escape Recursion Cave",
      subtitle: "Backtracking & decision trees",
      biome: "Recursion Cave",
      type: "challenge",
      status: "locked",
      mastery: 0,
      xp: 150,
      x: 85,
      y: 33,
    },
    {
      id: 9,
      code: "DSA-09",
      title: "Binary Trees",
      subtitle: "Hierarchical branches & root properties",
      biome: "Ancient Canopy",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 100,
      x: 76,
      y: 26,
    },
    {
      id: 10,
      code: "DSA-10",
      title: "Tree Traversals",
      subtitle: "Preorder, Inorder & Postorder mastery",
      biome: "Ancient Canopy",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 110,
      x: 64,
      y: 22,
    },
    {
      id: 11,
      code: "DSA-11",
      title: "Canopy Challenge",
      subtitle: "Binary Search Tree Validation",
      biome: "Ancient Canopy",
      type: "checkpoint",
      status: "locked",
      mastery: 0,
      xp: 160,
      x: 52,
      y: 19,
    },
    {
      id: 12,
      code: "DSA-12",
      title: "Graph Basics",
      subtitle: "Adjacency lists & node degrees",
      biome: "Graph Wilds",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 110,
      x: 41,
      y: 17,
    },
    {
      id: 13,
      code: "DSA-13",
      title: "Breadth-First Search (BFS)",
      subtitle: "Level-order queue wave expansion",
      biome: "Graph Wilds",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 120,
      x: 32,
      y: 18,
    },
    {
      id: 14,
      code: "DSA-14",
      title: "Depth-First Search (DFS)",
      subtitle: "Exhaustive exploration & cycles",
      biome: "Graph Wilds",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 120,
      x: 23,
      y: 21,
    },
    {
      id: 15,
      code: "DSA-15",
      title: "Lost Forest Challenge",
      subtitle: "Shortest Path & Connected Islands",
      biome: "Graph Wilds",
      type: "challenge",
      status: "locked",
      mastery: 0,
      xp: 180,
      x: 16,
      y: 27,
    },
    {
      id: 16,
      code: "DSA-16",
      title: "Memoization Cavern",
      subtitle: "Top-down caching & overlapping subproblems",
      biome: "Dynamic Caverns",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 130,
      x: 25,
      y: 35,
    },
    {
      id: 17,
      code: "DSA-17",
      title: "Tabulation Grid",
      subtitle: "Bottom-up dynamic programming tables",
      biome: "Dynamic Caverns",
      type: "lesson",
      status: "locked",
      mastery: 0,
      xp: 140,
      x: 35,
      y: 41,
    },
    {
      id: 18,
      code: "DSA-18",
      title: "Algorithm Summit",
      subtitle: "Final Interview Readiness Assessment",
      biome: "Algorithm Summit",
      type: "boss",
      status: "locked",
      mastery: 0,
      xp: 250,
      x: 48,
      y: 38,
    },
  ],
}

export interface LibraryCourse {
  id: string
  title: string
  biomeTitle: string
  biomeIcon: string
  accentColor: string
  description: string
  duration: string
  lessonCount: number
  difficulty: string
  status: "recommended" | "in-progress" | "available" | "locked"
  reason?: string
}

export const libraryCourses: LibraryCourse[] = [
  {
    id: "dsa-foundations",
    title: "Data Structures & Algorithms",
    biomeTitle: "Algorithmic Forest",
    biomeIcon: "🌲",
    accentColor: "#1DB584",
    description: "Conquer trees, recursion caves, and graph wilds tailored to your HireOS performance.",
    duration: "2h 30m",
    lessonCount: 18,
    difficulty: "Foundational",
    status: "recommended",
    reason: "Directly recommended from your HireOS Interview score (58/100).",
  },
  {
    id: "system-design",
    title: "System Design Foundations",
    biomeTitle: "Architect's Highlands",
    biomeIcon: "🏛️",
    accentColor: "#38BDF8",
    description: "Navigate high-scale distributed systems, load balancers, and resilient data caches.",
    duration: "3h 15m",
    lessonCount: 14,
    difficulty: "Intermediate",
    status: "recommended",
    reason: "Secondary growth recommendation (Score: 64/100).",
  },
  {
    id: "dbms-essentials",
    title: "Database Architecture & SQL",
    biomeTitle: "Data Caverns",
    biomeIcon: "💎",
    accentColor: "#A855F7",
    description: "Indexing B-Trees, ACID transactions, sharding models, and query planning.",
    duration: "2h 00m",
    lessonCount: 12,
    difficulty: "Intermediate",
    status: "available",
  },
  {
    id: "os-kernel",
    title: "Operating Systems & Concurrency",
    biomeTitle: "Kernel Woods",
    biomeIcon: "⚙️",
    accentColor: "#FB923C",
    description: "Thread scheduling, mutex locks, memory paging, and low-level synchronization.",
    duration: "2h 45m",
    lessonCount: 15,
    difficulty: "Advanced",
    status: "available",
  },
  {
    id: "networks",
    title: "Computer Networks & Protocols",
    biomeTitle: "Connected Canopy",
    biomeIcon: "🌐",
    accentColor: "#10B981",
    description: "TCP handshakes, HTTP/3, TLS handshakes, DNS resolution, and packet routing.",
    duration: "2h 10m",
    lessonCount: 11,
    difficulty: "Intermediate",
    status: "available",
  },
  {
    id: "behavioral-mastery",
    title: "Engineering Leadership & STAR",
    biomeTitle: "Echo Meadow",
    biomeIcon: "📢",
    accentColor: "#F59E0B",
    description: "Structuring impactful behavioral narratives with quantifiable business outcomes.",
    duration: "1h 30m",
    lessonCount: 8,
    difficulty: "All Levels",
    status: "available",
  },
]
