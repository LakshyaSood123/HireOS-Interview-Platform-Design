// Sliding Window — Pattern Meadows, called out as especially important in
// interviews (PART 6 of the task). Branches off Hashing's last checkpoint,
// same as the other Pattern Meadows modules.

import type { Checkpoint, Module } from "../types"

const whenAWindowApplies: Checkpoint = {
  id: "sliding-window-1",
  title: "When a Window Applies",
  subtitle: "Contiguous, and something to track",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "When a Window Applies",
    theory: [
      {
        heading: "The recognition cues",
        body: "'Substring', 'subarray', 'contiguous', 'longest', 'shortest', or 'at most/at least K' — sliding window almost always applies when a problem asks about a contiguous range with some running condition.",
      },
      {
        heading: "Why it beats brute force",
        body: "Checking every possible contiguous range is O(n²) or worse. A window that only ever expands or shrinks by one element at a time processes the whole array in O(n).",
      },
    ],
    quickCheck: {
      question: "Which phrase most strongly suggests a sliding window approach?",
      options: ["'Find a pair that sums to X'", "'Longest substring without repeating characters'", "'Sort the array'", "'Is the tree balanced'"],
      correctIndex: 1,
      explanation: "'Longest substring' is a contiguous-range question with a running condition (no repeats) — exactly the shape sliding window solves.",
    },
  },
}

const fixedVsVariable: Checkpoint = {
  id: "sliding-window-2",
  title: "Fixed vs. Variable Window",
  subtitle: "Two flavors of the same idea",
  type: "lesson",
  xp: 30,
  prerequisites: [whenAWindowApplies.id],
  workspace: {
    title: "Fixed vs. Variable Window",
    theory: [
      {
        heading: "Fixed-size window",
        body: "The window width is given (e.g. 'max sum of any 3 consecutive elements') — slide it by adding the new right element and removing the old left element each step.",
      },
      {
        heading: "Variable-size window",
        body: "The window grows by moving right, and shrinks by moving left whenever it breaks a constraint — the window's size itself is part of the answer.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def maxSumFixedWindow(nums, k):
    window_sum = sum(nums[:k])
    best = window_sum
    for i in range(k, len(nums)):
        window_sum += nums[i] - nums[i - k]
        best = max(best, window_sum)
    return best`,
      },
    ],
    animation: {
      id: "sliding-window-variable",
    },
  },
}

const windowState: Checkpoint = {
  id: "sliding-window-3",
  title: "Window State",
  subtitle: "What you track as the window moves",
  type: "lesson",
  xp: 30,
  prerequisites: [fixedVsVariable.id],
  workspace: {
    title: "Window State",
    theory: [
      {
        heading: "A running summary, not a rescan",
        body: "The whole point of sliding window is to update a running sum, count, or frequency map incrementally — add what enters the window, remove what leaves it, never rescan the whole window.",
      },
      {
        heading: "Shrink until valid again",
        body: "For variable windows: expand right by one, and while the window violates your constraint, shrink from the left until it's valid again — then record the answer.",
      },
    ],
    animation: {
      id: "sliding-window-variable",
      title: "Track the running window state without rescanning",
    },
    learnMore: "This 'expand right, shrink left while invalid' loop is the single template behind almost every variable-window problem, from longest-substring questions to minimum-window-substring style problems.",
  },
}

const codeLab: Checkpoint = {
  id: "sliding-window-4",
  title: "Sliding Window Code Lab",
  subtitle: "Max sum of a fixed-size window",
  type: "challenge",
  xp: 40,
  prerequisites: [windowState.id],
  workspace: {
    title: "Sliding Window Code Lab",
    theory: [
      {
        heading: "Slide, don't rescan",
        body: "Compute the first window's sum once, then slide by subtracting the element leaving and adding the element entering — O(1) per step instead of O(k) per window.",
      },
    ],
    codingActivity: {
      prompt: "Implement maxSumFixedWindow(nums, k) that returns the maximum sum of any k consecutive elements in nums.",
      constraints: ["1 ≤ k ≤ length of nums ≤ 10^5"],
      functionName: "maxSumFixedWindow",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def maxSumFixedWindow(nums, k):\n    # your code here\n    pass\n",
        cpp: "int maxSumFixedWindow(vector<int>& nums, int k) {\n    // your code here\n}\n",
        java: "int maxSumFixedWindow(int[] nums, int k) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Typical case", input: "nums=[2,1,5,1,3,2], k=3", expected: "9" },
        { id: "v2", description: "Window is whole array", input: "nums=[4,2,1], k=3", expected: "7" },
        { id: "v3", description: "Window size 1", input: "nums=[1,5,2], k=1", expected: "5" },
      ],
      hiddenTests: [
        { id: "h1", description: "All negative", input: "nums=[-1,-2,-3,-4], k=2", expected: "-3" },
        { id: "h2", description: "Best window at the end", input: "nums=[1,1,1,9,9], k=2", expected: "18" },
        { id: "h3", description: "Single element window count", input: "nums=[3,3,3], k=2", expected: "6" },
      ],
      hint: "Compute the sum of the first k elements, then for each subsequent position add the new element and subtract the one that's now outside the window.",
      mistakeFeedback: "This looks like it's re-summing all k elements for every window position (O(n×k)) instead of sliding the sum incrementally (O(n)).",
      demoSolution: {
        python: "def maxSumFixedWindow(nums, k):\n    if not nums or k <= 0:\n        return 0\n    window_sum = sum(nums[:k])\n    best = window_sum\n    for i in range(k, len(nums)):\n        window_sum += nums[i] - nums[i - k]\n        best = max(best, window_sum)\n    return best\n",
        cpp: "int maxSumFixedWindow(vector<int>& nums, int k) {\n    if (nums.empty() || k <= 0) return 0;\n    int windowSum = 0;\n    for (int i = 0; i < k; i++) windowSum += nums[i];\n    int best = windowSum;\n    for (int i = k; i < (int)nums.size(); i++) {\n        windowSum += nums[i] - nums[i - k];\n        best = max(best, windowSum);\n    }\n    return best;\n}\n",
        java: "int maxSumFixedWindow(int[] nums, int k) {\n    if (nums.length == 0 || k <= 0) return 0;\n    int windowSum = 0;\n    for (int i = 0; i < k; i++) windowSum += nums[i];\n    int best = windowSum;\n    for (int i = k; i < nums.length; i++) {\n        windowSum += nums[i] - nums[i - k];\n        best = Math.max(best, windowSum);\n    }\n    return best;\n}\n",
      },
    },
  },
}

const mastery: Checkpoint = {
  id: "sliding-window-5",
  title: "Sliding Window Interview Challenge",
  subtitle: "Longest substring without repeats — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Sliding Window Interview Challenge",
    theory: [
      {
        heading: "A variable window with a set",
        body: "Expand right, adding characters to a set. The moment you'd add a duplicate, shrink from the left (removing characters from the set) until the duplicate is gone — then continue.",
      },
    ],
    codingActivity: {
      prompt: "Implement lengthOfLongestSubstring(s) that returns the length of the longest substring of s without repeating characters.",
      constraints: ["0 ≤ length of s ≤ 5×10^4"],
      functionName: "lengthOfLongestSubstring",
      requiredKeywords: ["set", "while"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def lengthOfLongestSubstring(s):\n    # your code here\n    pass\n",
        cpp: "int lengthOfLongestSubstring(string s) {\n    // your code here\n}\n",
        java: "int lengthOfLongestSubstring(String s) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Has repeats", input: "'abcabcbb'", expected: "3" },
        { id: "v2", description: "All same character", input: "'bbbbb'", expected: "1" },
        { id: "v3", description: "No repeats at all", input: "'pwwkew'", expected: "3" },
      ],
      hiddenTests: [
        { id: "h1", description: "Empty string", input: "''", expected: "0" },
        { id: "h2", description: "Single character", input: "'a'", expected: "1" },
        { id: "h3", description: "Longest at the end", input: "'aab'", expected: "2" },
      ],
      hint: "Keep a set of characters currently in the window; when the incoming character is already in the set, shrink from the left (removing characters) until it isn't.",
      mistakeFeedback: "This looks like it's checking every substring for repeats (O(n²) or worse) instead of maintaining a sliding window with a set and shrinking only when a duplicate would enter (O(n)).",
      demoSolution: {
        python: "def lengthOfLongestSubstring(s):\n    if not s:\n        return 0\n    seen = set()\n    left = 0\n    best = 0\n    for right in range(len(s)):\n        while s[right] in seen:\n            seen.remove(s[left])\n            left += 1\n        seen.add(s[right])\n        best = max(best, right - left + 1)\n    return best\n",
        cpp: "int lengthOfLongestSubstring(string s) {\n    if (s.empty()) return 0;\n    unordered_set<char> seen;\n    int left = 0, best = 0;\n    for (int right = 0; right < (int)s.size(); right++) {\n        while (seen.count(s[right])) {\n            seen.erase(s[left]);\n            left++;\n        }\n        seen.insert(s[right]);\n        best = max(best, right - left + 1);\n    }\n    return best;\n}\n",
        java: "int lengthOfLongestSubstring(String s) {\n    char[] chars = s.toCharArray();\n    if (chars.length == 0) return 0;\n    Set<Character> seen = new HashSet<>();\n    int left = 0, best = 0;\n    for (int right = 0; right < chars.length; right++) {\n        while (seen.contains(chars[right])) {\n            seen.remove(chars[left]);\n            left++;\n        }\n        seen.add(chars[right]);\n        best = Math.max(best, right - left + 1);\n    }\n    return best;\n}\n",
      },
    },
  },
  questionIds: ["q-longest-substring-no-repeat"],
}

export const slidingWindowModule: Module = {
  id: "sliding-window",
  title: "Sliding Window",
  description: "Fixed and variable-size windows for contiguous-range problems — one of the highest-value interview patterns.",
  icon: "🪟",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [whenAWindowApplies, fixedVsVariable, windowState, codeLab, mastery],
}
