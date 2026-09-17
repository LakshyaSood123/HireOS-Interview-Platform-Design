// Arrays & Strings — Basecamp, second module (after Foundations). New id,
// no scenic tile exists for it yet (see LEARNING_ENGINE_ARCHITECTURE.md's
// "Course World vs Module Roadmap" note) — reached via the Course Library.

import type { Checkpoint, Module } from "../types"

const essentials: Checkpoint = {
  id: "arrays-strings-1",
  title: "Arrays & Strings Essentials",
  subtitle: "Indexing, traversal, and mutation",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Arrays & Strings Essentials",
    theory: [
      {
        heading: "Indexing is O(1)",
        body: "Arrays and strings give instant access to any position by index — that's the property almost every array pattern leans on.",
      },
      {
        heading: "Mutation vs. a new structure",
        body: "You can change values in place (no extra memory) or build a new array/string as you go (simpler to reason about, costs O(n) extra space) — know which one a problem is asking for.",
      },
    ],
    quickCheck: {
      question: "What's the time complexity of accessing arr[5] in an array?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correctIndex: 2,
      explanation: "Array indexing computes the memory address directly from the index — constant time regardless of array size.",
    },
  },
}

const traversalInPlace: Checkpoint = {
  id: "arrays-strings-2",
  title: "Traversal & In-Place Thinking",
  subtitle: "One pass, no extra array",
  type: "lesson",
  xp: 30,
  prerequisites: [essentials.id],
  workspace: {
    title: "Traversal & In-Place Thinking",
    theory: [
      {
        heading: "A single O(n) pass",
        body: "Most array problems start with 'can I answer this by looking at each element exactly once?' — that's your O(n) baseline before reaching for anything fancier.",
      },
      {
        heading: "In-place edits",
        body: "Overwriting elements as you scan (instead of allocating a new array) keeps space at O(1) — common in 'remove X' or 'compact the array' problems.",
      },
    ],
    quickCheck: {
      question: "Which is true about in-place array mutation?",
      options: [
        "It always requires O(n) extra space",
        "It modifies the original array without allocating a new one",
        "It only works on sorted arrays",
        "It's slower than building a new array",
      ],
      correctIndex: 1,
      explanation: "In-place means writing your answer back into the same array (or string buffer), avoiding the extra O(n) space a new structure would cost.",
    },
  },
}

const commonPatterns: Checkpoint = {
  id: "arrays-strings-3",
  title: "Common Array/String Patterns",
  subtitle: "Recognizing brute force vs. one-pass",
  type: "lesson",
  xp: 30,
  prerequisites: [traversalInPlace.id],
  workspace: {
    title: "Common Array/String Patterns",
    theory: [
      {
        heading: "Nested loops are a smell",
        body: "Two loops over the same array is O(n²) — often a sign you're re-scanning for something you could track with a single variable or a hash map as you go (see the Hashing module next).",
      },
      {
        heading: "Contiguous ranges",
        body: "'Subarray' or 'substring' means a contiguous slice, not any subset — this distinction is what makes two pointers and sliding window possible later in this course.",
      },
      {
        heading: "Watch the edges",
        body: "Empty input, a single element, and all-identical values are the edge cases that catch most array bugs — check them before you call a solution done.",
      },
    ],
    learnMore: "This 'brute force first, then look for the repeated work' instinct is the same rhythm from the Foundations module — arrays are usually where it's first applied for real.",
  },
}

const codeLab: Checkpoint = {
  id: "arrays-strings-4",
  title: "Arrays Code Lab",
  subtitle: "Remove duplicates in place",
  type: "challenge",
  xp: 40,
  prerequisites: [commonPatterns.id],
  workspace: {
    title: "Arrays Code Lab",
    theory: [
      {
        heading: "In-place, one pass",
        body: "Keep a 'write' pointer for the next unique slot and a 'read' pointer scanning forward — copy a value back only when it's different from the last one written.",
      },
    ],
    codingActivity: {
      prompt: "Implement removeDuplicates(nums) that removes duplicates in place from a sorted array and returns the count of unique elements (the first k slots of nums should hold the unique values).",
      constraints: ["1 ≤ length of nums ≤ 10^4", "nums is sorted in non-decreasing order"],
      functionName: "removeDuplicates",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def removeDuplicates(nums):\n    # your code here\n    pass\n",
        cpp: "int removeDuplicates(vector<int>& nums) {\n    // your code here\n}\n",
        java: "int removeDuplicates(int[] nums) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Some duplicates", input: "[1,1,2]", expected: "2" },
        { id: "v2", description: "Many duplicates", input: "[0,0,1,1,1,2,2,3,3,4]", expected: "5" },
        { id: "v3", description: "No duplicates", input: "[1,2,3]", expected: "3" },
      ],
      hiddenTests: [
        { id: "h1", description: "All identical", input: "[2,2,2,2]", expected: "1" },
        { id: "h2", description: "Single element", input: "[5]", expected: "1" },
        { id: "h3", description: "Empty array", input: "[]", expected: "0" },
      ],
      hint: "Track a 'write' index starting at 1 — whenever nums[read] differs from nums[write-1], copy it to nums[write] and advance write.",
      mistakeFeedback: "This looks like it's counting duplicates rather than compacting the array in place — the unique values need to actually be written to the front of the array, not just counted.",
      demoSolution: {
        python: "def removeDuplicates(nums):\n    if not nums:\n        return 0\n    k = 1\n    for i in range(1, len(nums)):\n        if nums[i] != nums[i - 1]:\n            nums[k] = nums[i]\n            k += 1\n    return k\n",
        cpp: "int removeDuplicates(vector<int>& nums) {\n    if (nums.empty()) return 0;\n    int k = 1;\n    for (int i = 1; i < (int)nums.size(); i++) {\n        if (nums[i] != nums[i - 1]) {\n            nums[k] = nums[i];\n            k++;\n        }\n    }\n    return k;\n}\n",
        java: "int removeDuplicates(int[] nums) {\n    if (nums.length == 0) return 0;\n    int k = 1;\n    for (int i = 1; i < nums.length; i++) {\n        if (nums[i] != nums[i - 1]) {\n            nums[k] = nums[i];\n            k++;\n        }\n    }\n    return k;\n}\n",
      },
    },
  },
}

const mastery: Checkpoint = {
  id: "arrays-strings-5",
  title: "Arrays Interview Challenge",
  subtitle: "Best time to buy and sell — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Arrays Interview Challenge",
    theory: [
      {
        heading: "Track the running minimum",
        body: "Instead of checking every buy/sell pair (O(n²)), scan once while remembering the lowest price seen so far and the best profit possible if you sold today.",
      },
    ],
    codingActivity: {
      prompt: "Implement maxProfit(prices) that returns the maximum profit from buying on one day and selling on a later day, given a list of daily prices (0 if no profit is possible).",
      constraints: ["1 ≤ length of prices ≤ 10^5"],
      functionName: "maxProfit",
      requiredKeywords: ["for", "min"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def maxProfit(prices):\n    # your code here\n    pass\n",
        cpp: "int maxProfit(vector<int>& prices) {\n    // your code here\n}\n",
        java: "int maxProfit(int[] prices) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Clear profit", input: "[7,1,5,3,6,4]", expected: "5" },
        { id: "v2", description: "No profit possible", input: "[7,6,4,3,1]", expected: "0" },
        { id: "v3", description: "Single day", input: "[5]", expected: "0" },
      ],
      hiddenTests: [
        { id: "h1", description: "Profit at the end", input: "[3,2,6,5,0,3]", expected: "4" },
        { id: "h2", description: "Strictly increasing", input: "[1,2,3,4,5]", expected: "4" },
        { id: "h3", description: "Empty prices", input: "[]", expected: "0" },
      ],
      hint: "Keep a running minimum price seen so far, and at each day compute price - minSoFar, updating your best answer.",
      mistakeFeedback: "This looks like it's comparing every pair of days (O(n²)) instead of tracking the minimum price seen so far in a single pass (O(n)).",
      demoSolution: {
        python: "def maxProfit(prices):\n    if not prices:\n        return 0\n    min_price = prices[0]\n    profit = 0\n    for price in prices:\n        min_price = min(min_price, price)\n        profit = max(profit, price - min_price)\n    return profit\n",
        cpp: "int maxProfit(vector<int>& prices) {\n    if (prices.empty()) return 0;\n    int minPrice = prices[0];\n    int profit = 0;\n    for (int price : prices) {\n        minPrice = min(minPrice, price);\n        profit = max(profit, price - minPrice);\n    }\n    return profit;\n}\n",
        java: "int maxProfit(int[] prices) {\n    if (prices.length == 0) return 0;\n    int minPrice = prices[0];\n    int profit = 0;\n    for (int price : prices) {\n        minPrice = Math.min(minPrice, price);\n        profit = Math.max(profit, price - minPrice);\n    }\n    return profit;\n}\n",
      },
    },
  },
  questionIds: ["q-best-time-buy-sell-stock"],
}

export const arraysStringsModule: Module = {
  id: "arrays-strings",
  title: "Arrays & Strings",
  description: "Indexing, in-place traversal, and recognizing brute force before optimizing.",
  icon: "🔤",
  accentColor: "#79A84B",
  contentKind: "workspace",
  checkpoints: [essentials, traversalInPlace, commonPatterns, codeLab, mastery],
}
