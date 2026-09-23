// Hashing — Basecamp, third module (after Arrays & Strings). Completes
// Basecamp; Pattern Meadows' 5 modules all branch off this module's last
// checkpoint.

import type { Checkpoint, Module } from "../types"

const whyHashingHelps: Checkpoint = {
  id: "hashing-1",
  title: "Why Hashing Helps",
  subtitle: "Trading memory for speed",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Why Hashing Helps",
    theory: [
      {
        heading: "The brute-force cost",
        body: "'Have I seen this value before?' answered by rescanning the array each time is O(n) per check — O(n²) overall across a full pass.",
      },
      {
        heading: "Remember as you go",
        body: "A hash map or set gives average O(1) lookup — insert every value as you scan, and 'have I seen X' becomes a single membership check instead of a rescan.",
      },
    ],
    quickCheck: {
      question: "What's the average-case lookup time in a hash set?",
      options: ["O(n)", "O(log n)", "O(1)", "O(n log n)"],
      correctIndex: 2,
      explanation: "Hashing computes a bucket directly from the value, so lookup, insert, and membership checks are O(1) on average.",
    },
  },
}

const frequencyMapsSets: Checkpoint = {
  id: "hashing-2",
  title: "Frequency Maps & Sets",
  subtitle: "Counting vs. membership",
  type: "lesson",
  xp: 30,
  prerequisites: [whyHashingHelps.id],
  workspace: {
    title: "Frequency Maps & Sets",
    theory: [
      {
        heading: "Set: 'have I seen this?'",
        body: "A set only tracks membership — perfect for duplicate detection or checking if a value exists.",
      },
      {
        heading: "Map: 'how many, or what, for this key?'",
        body: "A hash map attaches a value to each key — a running count (frequency map), an index, or anything else you need to remember about that key.",
      },
    ],
    animation: {
      id: "hashing-frequency-map",
    },
    codeExamples: [
      {
        language: "python",
        code: `def frequencyMap(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts`,
      },
    ],
  },
}

const lookupVsBrute: Checkpoint = {
  id: "hashing-3",
  title: "Lookup vs. Brute Force",
  subtitle: "The complement-lookup trick",
  type: "lesson",
  xp: 30,
  prerequisites: [frequencyMapsSets.id],
  workspace: {
    title: "Lookup vs. Brute Force",
    theory: [
      {
        heading: "The complement trick",
        body: "Looking for two numbers that sum to a target? For each number, check whether (target - number) is already in your map — one pass instead of checking every pair.",
      },
      {
        heading: "The memory trade-off",
        body: "A hash map costs O(n) extra space to hold what you've seen — almost always worth it to drop an O(n²) brute force down to O(n).",
      },
    ],
    animation: {
      id: "hashing-complement-lookup",
      title: "One-pass complement lookup on [2, 7, 11, 15]",
    },
    quickCheck: {
      question: "Checking every pair of elements for a matching sum is what complexity?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
      correctIndex: 2,
      explanation: "Comparing every element against every other element is O(n²) — the exact pattern a hash map's complement lookup replaces with a single O(n) pass.",
    },
  },
}

const codeLab: Checkpoint = {
  id: "hashing-4",
  title: "Hashing Code Lab",
  subtitle: "Valid anagram",
  type: "challenge",
  xp: 40,
  prerequisites: [lookupVsBrute.id],
  workspace: {
    title: "Hashing Code Lab",
    theory: [
      {
        heading: "Same letters, same counts",
        body: "Two strings are anagrams exactly when they have identical character frequencies — build one frequency map and check it against the other string.",
      },
    ],
    codingActivity: {
      prompt: "Implement isAnagram(s, t) that returns true if t is an anagram of s (same characters, same counts, possibly reordered).",
      constraints: ["0 ≤ length of s, t ≤ 5×10^4"],
      functionName: "isAnagram",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def isAnagram(s, t):\n    # your code here\n    pass\n",
        cpp: "bool isAnagram(string s, string t) {\n    // your code here\n}\n",
        java: "boolean isAnagram(String s, String t) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Valid anagram", input: "s='anagram', t='nagaram'", expected: "true" },
        { id: "v2", description: "Not an anagram", input: "s='rat', t='car'", expected: "false" },
        { id: "v3", description: "Different lengths", input: "s='ab', t='a'", expected: "false" },
      ],
      hiddenTests: [
        { id: "h1", description: "Identical strings", input: "s='abc', t='abc'", expected: "true" },
        { id: "h2", description: "Same letters, different counts", input: "s='aabb', t='abbb'", expected: "false" },
        { id: "h3", description: "Both empty", input: "s='', t=''", expected: "true" },
      ],
      hint: "Build a frequency map of s, then walk t decrementing counts — if any count goes negative or a character is missing, it's not an anagram.",
      mistakeFeedback: "This looks like it's only comparing sorted characters or lengths rather than building and checking a real frequency map — that misses cases with matching counts in different arrangements.",
      demoSolution: {
        python: "def isAnagram(s, t):\n    if not s and not t:\n        return True\n    if len(s) != len(t):\n        return False\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    for ch in t:\n        if counts.get(ch, 0) == 0:\n            return False\n        counts[ch] -= 1\n    return True\n",
        cpp: "bool isAnagram(string s, string t) {\n    if (s.empty() && t.empty()) return true;\n    if (s.size() != t.size()) return false;\n    unordered_map<char, int> counts;\n    for (char c : s) counts[c]++;\n    for (char c : t) {\n        if (counts[c] == 0) return false;\n        counts[c]--;\n    }\n    return true;\n}\n",
        java: "boolean isAnagram(String s, String t) {\n    char[] sc = s.toCharArray(), tc = t.toCharArray();\n    if (sc.length == 0 && tc.length == 0) return true;\n    if (sc.length != tc.length) return false;\n    Map<Character, Integer> counts = new HashMap<>();\n    for (char c : sc) counts.merge(c, 1, Integer::sum);\n    for (char c : tc) {\n        Integer cur = counts.get(c);\n        if (cur == null || cur == 0) return false;\n        counts.put(c, cur - 1);\n    }\n    return true;\n}\n",
      },
    },
  },
  questionIds: ["q-valid-anagram"],
}

const mastery: Checkpoint = {
  id: "hashing-5",
  title: "Hashing Interview Challenge",
  subtitle: "Two Sum — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Hashing Interview Challenge",
    theory: [
      {
        heading: "The classic complement lookup",
        body: "This is the pattern from checkpoint 3, put into practice: for each number, check whether its complement is already in the map before adding the current number.",
      },
    ],
    codingActivity: {
      prompt: "Implement twoSum(nums, target) that returns the indices of the two numbers that add up to target, using a single pass with a hash map.",
      constraints: ["2 ≤ length of nums ≤ 10^4", "Exactly one valid answer exists"],
      functionName: "twoSum",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def twoSum(nums, target):\n    # your code here\n    pass\n",
        cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    // your code here\n}\n",
        java: "int[] twoSum(int[] nums, int target) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Standard case", input: "nums=[2,7,11,15], target=9", expected: "[0,1]" },
        { id: "v2", description: "Match not adjacent", input: "nums=[3,2,4], target=6", expected: "[1,2]" },
        { id: "v3", description: "Duplicate values", input: "nums=[3,3], target=6", expected: "[0,1]" },
      ],
      hiddenTests: [
        { id: "h1", description: "Negative numbers", input: "nums=[-1,-2,-3,-4,-5], target=-8", expected: "[2,4]" },
        { id: "h2", description: "Target at the start", input: "nums=[5,1,2], target=6", expected: "[0,1]" },
        { id: "h3", description: "Larger list", input: "nums=[1,2,3,4,5,6], target=11", expected: "[4,5]" },
      ],
      hint: "For each number, compute target - number and check if it's already in your map before inserting the current number and its index.",
      mistakeFeedback: "This looks like it's checking every pair of numbers (O(n²)) instead of looking up each number's complement in a hash map as you scan (O(n)).",
      demoSolution: {
        python: "def twoSum(nums, target):\n    if not nums:\n        return []\n    seen = {}\n    for i, n in enumerate(nums):\n        complement = target - n\n        if complement in seen:\n            return [seen[complement], i]\n        seen[n] = i\n    return []\n",
        cpp: "vector<int> twoSum(vector<int>& nums, int target) {\n    if (nums.empty()) return {};\n    unordered_map<int, int> seen;\n    for (int i = 0; i < (int)nums.size(); i++) {\n        int complement = target - nums[i];\n        if (seen.count(complement)) return {seen[complement], i};\n        seen[nums[i]] = i;\n    }\n    return {};\n}\n",
        java: "int[] twoSum(int[] nums, int target) {\n    if (nums.length == 0) return new int[0];\n    Map<Integer, Integer> seen = new HashMap<>();\n    for (int i = 0; i < nums.length; i++) {\n        int complement = target - nums[i];\n        if (seen.containsKey(complement)) return new int[]{seen.get(complement), i};\n        seen.put(nums[i], i);\n    }\n    return new int[0];\n}\n",
      },
    },
  },
  questionIds: ["q-two-sum"],
}

export const hashingModule: Module = {
  id: "hashing",
  title: "Hashing",
  description: "Frequency maps, sets, and the complement-lookup trick that replaces O(n²) brute force.",
  icon: "🗂️",
  accentColor: "#79A84B",
  contentKind: "workspace",
  checkpoints: [whyHashingHelps, frequencyMapsSets, lookupVsBrute, codeLab, mastery],
}
