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
        heading: "Reading by index",
        body: "An array keeps its values in numbered positions that start at 0. In [10, 20, 30, 40], nums[2] is 30. In the standard interview model, reading nums[2] takes the same effort for 4 items or 4 million, so index access is O(1). Strings can be read by position too: s[0] in Python and C++, s.charAt(0) in Java.",
      },
      {
        heading: "Change it, or build a new one",
        body: "Writing nums[2] = 99 mutates the array: the change happens where the value already lives, with no extra memory. Or you can build a separate result, which is often easier to reason about but costs O(n) extra space. A problem statement usually tells you which one it wants.",
      },
      {
        heading: "Strings depend on the language",
        body: "Arrays can be changed in Python, C++ and Java. Strings differ. In Python and Java a string cannot be changed after it is created, so \"editing\" one really builds a new string. A C++ string can be edited in place. Check what your language allows before promising O(1) extra space.",
      },
    ],
    quickCheck: {
      question: "A function must return an array reversed. Approach A copies each value into a new array. Approach B swaps values inside the original array. Which statement is correct?",
      options: [
        "Both use O(1) extra space, because indexing is O(1)",
        "A uses O(n) extra space; B uses O(1) but changes the original array",
        "B needs O(n) extra space, because every swap makes a copy",
        "A and B use the same space; only the order of the writes differs",
      ],
      correctIndex: 1,
      explanation: "Copying n values into a new array allocates n more slots, which is O(n) extra space. Swapping inside the original needs only a temporary variable, O(1), but the caller's array is changed. Fast indexing makes each read and write cheap; it does not remove the memory a copy needs.",
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
        heading: "Start with one pass",
        body: "A good first question is: can I answer this by looking at each element once? One pass is O(n) and makes a solid baseline before you reach for anything fancier.",
      },
      {
        heading: "Editing in place",
        body: "Editing in place means writing results back into the array you were given, so extra space stays O(1). To reverse [4, 8, 1, 9, 3, 6], swap the two ends (4 and 6), move inward and swap 8 with 3, then swap 1 with 9. Three swaps and no second array.",
      },
      {
        heading: "What to watch",
        body: "The animation runs four steps. SCAN reads one value straight from its index. UPDATE overwrites index 3, changing 9 to 7, to show a single in-place write. REVERSE_SWAP swaps the two ends. REVERSED shows the finished array. Notice that the array is never copied; every change happens inside it.",
      },
    ],
    animation: {
      id: "arrays-in-place-reversal",
    },
    quickCheck: {
      question: "You reverse an array of n numbers by swapping symmetric pairs directly in that same array, using one temporary variable. Which statement is correct?",
      options: [
        "It uses O(n) extra space, because each swap needs a new array",
        "It uses O(1) extra space, and the original order of the array is lost",
        "It uses O(1) extra space, and the original array keeps its old order",
        "It uses O(n) extra space, but the original array stays unchanged",
      ],
      correctIndex: 1,
      explanation: "Swapping inside the array needs only one temporary variable, so extra space is O(1). The trade-off is that the array itself is changed: its original order no longer exists. If you must keep the original, you have to build a new array and pay O(n) extra space.",
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
        heading: "Nested loops: ask what they repeat",
        body: "A loop inside a loop is not automatically wrong. Checking every pair among 5 items is only 10 comparisons. The question is whether the inner loop repeats work you could avoid. If, for each of n items, you rescan the array to ask \"have I seen this value?\", you redo the same searching n times. Remembering values as you go removes that repetition; the Hashing module shows how.",
      },
      {
        heading: "Contiguous or not",
        body: "A subarray or substring is a contiguous slice. In [3, 1, 4, 1], the slice [1, 4] is a subarray. The values 3 and 4 also appear in order, but 1 sits between them, so [3, 4] is a subsequence, not a subarray. Sliding window specifically tracks a contiguous range. Some two-pointer problems also use range boundaries, while others simply coordinate two positions, such as the two ends of a sorted array.",
      },
      {
        heading: "Try the edges",
        body: "Empty input, a single element, and all-equal values catch most array bugs. Test them before calling a solution done.",
      },
    ],
    learnMore: "This is the habit from Foundations: find what a simple approach repeats, then decide whether it matters at the given constraints. Arrays are usually the first place you apply it for real.",
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
        heading: "A read index and a write index",
        body: "Use two indices. The read index scans the array from position 1. The write index marks the next slot where a new unique value belongs. Take [1, 1, 2, 2, 3]. Position 0 is always unique, so write starts at 1. Read position 1: 1 equals the value before it, skip. Read position 2: 2 differs from the value before it, so copy it to slot 1 and write becomes 2. Read position 3: 2 equals the value before it, skip. Read position 4: 3 differs, so copy it to slot 2 and write becomes 3. The front of the array is now [1, 2, 3] and write, 3, is the count of unique values.",
      },
      {
        heading: "Why sorted helps",
        body: "Because duplicates are adjacent in a sorted array, one check is enough: if nums[read] != nums[read - 1], then nums[read] is a new unique value and belongs at nums[write]. The Two Pointers module builds on this read and write idea.",
      },
    ],
    codingActivity: {
      prompt: "Implement removeDuplicates(nums) that removes duplicates in place from a sorted array. After the call, the first k positions of nums must hold the unique values in their original order, and the function returns k.",
      constraints: ["0 ≤ length of nums ≤ 10^4", "nums is sorted in non-decreasing order"],
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
      hint: "Start write at 1 and scan read from 1. Whenever nums[read] != nums[read - 1], copy nums[read] to nums[write] and advance write.",
      mistakeFeedback: "Counting unique values gives you k, but the first k positions of nums must also hold those values. If a result is wrong, check that write starts at 1 and that you compare nums[read] with nums[read - 1], the value just before it.",
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
        heading: "Track three things in one pass",
        body: "Checking every buy and sell pair is O(n²). Instead, walk through the days once and track the lowest price so far, the profit if you sold today, and the best profit so far. Take [7, 1, 5, 3, 6, 4]. Day 1: lowest is 7. Day 2: price 1, lowest becomes 1. Day 3: price 5, selling today earns 5 − 1 = 4, best is 4. Day 4: price 3 earns 2, best stays 4. Day 5: price 6 earns 5, best is 5. Day 6: price 4 earns 3, best stays 5. The answer is 5.",
      },
      {
        heading: "Why one pass is enough",
        body: "For any selling day, the best day to have bought is the cheapest day before it, and the running minimum already holds that price. So each day costs one subtraction instead of a search through all earlier days.",
      },
    ],
    codingActivity: {
      prompt: "Implement maxProfit(prices) that returns the maximum profit from buying on one day and selling on a later day, given a list of daily prices (0 if no profit is possible).",
      constraints: ["0 ≤ length of prices ≤ 10^5"],
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
      hint: "Keep the lowest price seen so far. On each day, compute price - lowest and update your best answer.",
      mistakeFeedback: "Trying every buy and sell pair is a valid brute force at O(n²); here you practice the one-pass version. If a result is wrong, check that the buy day comes before the sell day. Using the lowest price in the whole list can pair a sale with a cheaper purchase that happens later. Return 0 when prices only fall.",
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
  description: "Indexing, in-place traversal, and spotting repeated work in simple array and string solutions.",
  icon: "🔤",
  accentColor: "#79A84B",
  contentKind: "workspace",
  checkpoints: [essentials, traversalInPlace, commonPatterns, codeLab, mastery],
}
