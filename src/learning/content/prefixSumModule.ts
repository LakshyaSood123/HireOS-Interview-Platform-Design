// Prefix Sum — Pattern Meadows. Only 4 checkpoints: the pattern itself is
// narrow enough that a separate "code lab" + "mastery" split (like the
// 5-checkpoint modules) would mean two very similar range-sum problems back
// to back — checkpoint count follows learning need, not a fixed template.

import type { Checkpoint, Module } from "../types"

const repeatedRangeWork: Checkpoint = {
  id: "prefix-sum-1",
  title: "Repeated Range Work",
  subtitle: "The cost of re-summing a range every query",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Repeated Range Work",
    theory: [
      {
        heading: "The naive cost",
        body: "Summing a range [i, j] by looping through it is O(j - i) per query — fine once, expensive if you're asked for many different ranges over the same array.",
      },
      {
        heading: "Precompute once, answer fast",
        body: "If you build a running total as you go, any range sum becomes a subtraction of two precomputed values — O(1) per query after an O(n) setup.",
      },
    ],
    quickCheck: {
      question: "What's the cost of a single range-sum query using a prefix sum array (after it's built)?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n²)"],
      correctIndex: 2,
      explanation: "Range sum [i, j] = prefix[j] - prefix[i-1] — a single subtraction, regardless of how wide the range is.",
    },
  },
}

const buildingPrefixInfo: Checkpoint = {
  id: "prefix-sum-2",
  title: "Building Prefix Information",
  subtitle: "prefix[i] = sum of everything up to i",
  type: "lesson",
  xp: 30,
  prerequisites: [repeatedRangeWork.id],
  workspace: {
    title: "Building Prefix Information",
    theory: [
      {
        heading: "One pass to build it",
        body: "prefix[0] = nums[0], and prefix[i] = prefix[i-1] + nums[i] — each entry is the running total of everything up to and including that index.",
      },
      {
        heading: "Reading a range back out",
        body: "sum(i, j) = prefix[j] - prefix[i-1] (or just prefix[j] if i is 0) — subtracting off everything before the range leaves exactly the range's total.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def buildPrefixSums(nums):
    prefix = [nums[0]]
    for i in range(1, len(nums)):
        prefix.append(prefix[-1] + nums[i])
    return prefix`,
      },
    ],
  },
}

const codeLab: Checkpoint = {
  id: "prefix-sum-3",
  title: "Prefix Sum Code Lab",
  subtitle: "Build and query",
  type: "challenge",
  xp: 40,
  prerequisites: [buildingPrefixInfo.id],
  workspace: {
    title: "Prefix Sum Code Lab",
    theory: [
      {
        heading: "Your turn",
        body: "Build the running-total array from the previous checkpoint, then use it to answer a range-sum query in O(1).",
      },
    ],
    codingActivity: {
      prompt: "Implement rangeSum(nums, left, right) that returns the sum of nums[left..right] (inclusive) by building a prefix sum array first, then answering the query in O(1).",
      constraints: ["1 ≤ length of nums ≤ 10^5", "0 ≤ left ≤ right < length of nums"],
      functionName: "rangeSum",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def rangeSum(nums, left, right):\n    # your code here\n    pass\n",
        cpp: "int rangeSum(vector<int>& nums, int left, int right) {\n    // your code here\n}\n",
        java: "int rangeSum(int[] nums, int left, int right) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Middle range", input: "nums=[1,2,3,4,5], left=1, right=3", expected: "9" },
        { id: "v2", description: "Whole array", input: "nums=[1,2,3], left=0, right=2", expected: "6" },
        { id: "v3", description: "Single element range", input: "nums=[7,2,9], left=1, right=1", expected: "2" },
      ],
      hiddenTests: [
        { id: "h1", description: "Range from the start", input: "nums=[4,4,4,4], left=0, right=2", expected: "12" },
        { id: "h2", description: "Negative numbers", input: "nums=[-1,2,-3,4], left=0, right=3", expected: "2" },
        { id: "h3", description: "Single-element array", input: "nums=[5], left=0, right=0", expected: "5" },
      ],
      hint: "Build a prefix array where prefix[i] is the sum of nums[0..i], then rangeSum(left, right) = prefix[right] - (prefix[left-1] if left > 0 else 0).",
      mistakeFeedback: "This looks like it's summing the range directly with a loop every call instead of building a prefix array once and answering with a subtraction.",
    },
  },
  questionIds: ["q-product-except-self"],
}

const mastery: Checkpoint = {
  id: "prefix-sum-4",
  title: "Prefix Sum Interview Challenge",
  subtitle: "Subarray sum equals K — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Prefix Sum Interview Challenge",
    theory: [
      {
        heading: "Prefix sum meets hashing",
        body: "If prefix[j] - prefix[i] = k, then the subarray between i and j sums to k. Track how many times each prefix value has occurred in a hash map, and for each new prefix, check whether (prefix - k) has been seen before.",
      },
    ],
    codingActivity: {
      prompt: "Implement subarraySum(nums, k) that returns the number of contiguous subarrays that sum to exactly k, using a running prefix sum and a hash map of prefix-sum counts.",
      constraints: ["1 ≤ length of nums ≤ 2×10^4"],
      functionName: "subarraySum",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def subarraySum(nums, k):\n    # your code here\n    pass\n",
        cpp: "int subarraySum(vector<int>& nums, int k) {\n    // your code here\n}\n",
        java: "int subarraySum(int[] nums, int k) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Two matching subarrays", input: "nums=[1,1,1], k=2", expected: "2" },
        { id: "v2", description: "One matching subarray", input: "nums=[1,2,3], k=3", expected: "2" },
        { id: "v3", description: "No match", input: "nums=[1,2,3], k=100", expected: "0" },
      ],
      hiddenTests: [
        { id: "h1", description: "Negative numbers involved", input: "nums=[1,-1,0], k=0", expected: "3" },
        { id: "h2", description: "Whole array matches", input: "nums=[3], k=3", expected: "1" },
        { id: "h3", description: "Repeated zeroes", input: "nums=[0,0,0], k=0", expected: "6" },
      ],
      hint: "Track a running prefix sum and a map of {prefix value: how many times seen}. At each step, add the count of (current prefix - k) to your answer, then record the current prefix.",
      mistakeFeedback: "This looks like it's checking every possible subarray directly (O(n²)) instead of tracking prefix-sum counts in a hash map as you scan (O(n)).",
    },
  },
  questionIds: ["q-subarray-sum-equals-k"],
}

export const prefixSumModule: Module = {
  id: "prefix-sum",
  title: "Prefix Sum",
  description: "Precomputed running totals that turn repeated range queries into O(1) lookups.",
  icon: "➕",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [repeatedRangeWork, buildingPrefixInfo, codeLab, mastery],
}
