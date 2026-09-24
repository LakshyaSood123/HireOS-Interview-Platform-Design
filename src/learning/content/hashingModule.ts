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
        heading: "\"Have I seen this before?\"",
        body: "Suppose you have already seen 4, 7 and 2, and another 7 arrives. You want to know immediately that it is a duplicate. If you answer by rescanning the array for every value, each check can take up to n steps, so one full pass costs O(n²).",
      },
      {
        heading: "A set remembers for you",
        body: "A set stores each value once and answers a single question: is this value in here? Add every value as you scan, and \"have I seen this?\" becomes one lookup instead of a rescan. Hash sets are fast on average, so we say expected O(1) per lookup. In rare unlucky cases a lookup can be slower, which is why it is not a guarantee.",
      },
      {
        heading: "The trade",
        body: "The set costs O(n) extra memory. In return, the whole pass drops from O(n²) to about O(n) expected time. This removes the repeated scans we spotted in Foundations.",
      },
    ],
    quickCheck: {
      question: "You scan n numbers and, for each one, need to know whether it appeared earlier. What changes if you store earlier numbers in a set instead of rescanning the array?",
      options: [
        "Each check gets faster, but the whole scan is still O(n²)",
        "The set keeps the numbers sorted, so you can binary search them",
        "Each check takes expected constant time, so the whole scan is about O(n) expected",
        "The scan gets faster and also uses no extra memory",
      ],
      correctIndex: 2,
      explanation: "A rescan costs up to n steps per number. A set lookup costs expected O(1), so n numbers cost about O(n) in total. The speed is paid for with O(n) extra memory, and a set does not keep its values in sorted order.",
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
        heading: "Set: is it in here?",
        body: "A set only tracks membership. Picture the student IDs you have already checked in at a door: you ask \"is 4021 in the set?\" and get yes or no. That suits duplicate detection and \"does this value exist?\" questions.",
      },
      {
        heading: "Map: a key and what you know about it",
        body: "A map, also called a hash map or dictionary, attaches a value to each key. A word-frequency map might hold pear → 2 and apple → 1. The value can be a count, an index, or anything else worth remembering about that key.",
      },
      {
        heading: "Counting with a map",
        body: "Take [\"pear\", \"apple\", \"pear\"]. The first pear creates pear → 1. When the second pear arrives, you do not rescan the whole list: the map uses the key to locate the pear entry, and the count becomes 2. Under the hood, a hash function turns each key into a bucket, a position in the table. For the built-in key types in these examples, the language provides that hashing behavior.",
      },
      {
        heading: "What to watch",
        body: "In the animation, watch the key being mapped to a bucket, then the same entry being updated. In the Python example, counts.get(item, 0) + 1 means \"the current count, or 0 if the key is new\".",
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
        heading: "Find the partner you need",
        body: "Take nums = [2, 7, 11, 15] and target = 9. Checking every pair works but is O(n²). Instead, for each number work out the partner it needs: target minus the current number. That needed partner is called its complement. Then look for it among the values you have already seen.",
      },
      {
        heading: "Walk through it",
        body: "At 2, the complement is 7. 7 has not been seen, so store 2. At 7, the complement is 2. 2 is already stored, so the pair is found: indices 0 and 1. We look before we store because otherwise a number could pair with itself. In [3, 2, 4] with target 6, storing 3 first would let 3 find its own complement, 3, and report a pair that does not exist.",
      },
      {
        heading: "Predict before you step",
        body: "In the animation, calculate target minus the current number yourself before each step, then compare it with the complement shown. One pass with a map costs about O(n) expected time and O(n) extra space, replacing the pairwise scan.",
      },
    ],
    animation: {
      id: "hashing-complement-lookup",
      title: "One-pass complement lookup on [2, 7, 11, 15]",
    },
    quickCheck: {
      question: "In the one-pass pair search, why do we look for the complement before storing the current number?",
      options: [
        "Storing first would use more memory",
        "A map cannot be searched right after it has been changed",
        "Looking first makes the lookup itself run faster than looking after storing",
        "Storing first could match a number with itself, as with 3 in [3, 2, 4] and target 6",
      ],
      correctIndex: 3,
      explanation: "If 3 is stored before the lookup, its complement 3 is found immediately, giving a pair made of one element used twice. Looking first means a match can only be an earlier, different element. Memory use is the same either way, and maps can be searched at any time.",
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
        heading: "Anagrams have equal counts",
        body: "Two strings are anagrams when they use the same characters the same number of times, in any order. \"listen\" and \"silent\" match. \"aabb\" and \"abbb\" have the same length and letters but different counts (a appears 2 times versus 1), so they are not anagrams. Strings of different lengths can never match.",
      },
      {
        heading: "Two valid approaches",
        body: "Sorting both strings and comparing them is a valid solution that costs O(n log n). This checkpoint practices the frequency-count approach, about O(n) expected work: count every character in s, then walk through t and subtract. If a count would drop below zero, or a character is missing, the strings are not anagrams.",
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
      hint: "Build a frequency map of s, then walk t and decrement the counts. If a count would go below zero, or a character is missing, it is not an anagram.",
      mistakeFeedback: "Sorting both strings and comparing them is also a correct way to solve this, in O(n log n) time. This checkpoint practices the O(n) frequency-count approach instead. If a result is wrong, check that you compare counts rather than only letters or lengths, and that a character missing from your map counts as a mismatch.",
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
        heading: "The same idea, now returning indices",
        body: "This is the complement lookup from checkpoint 3. For each number, work out target minus the current number and look for it among the values already seen. The difference is that the map now stores each value together with its index, so a match tells you where the partner is.",
      },
      {
        heading: "Order of operations",
        body: "Look up the complement first, then store the current number. In [3, 3] with target 6, the first 3 is stored, and the second 3 finds it, giving [0, 1]. Return the earlier index first.",
      },
    ],
    codingActivity: {
      prompt: "Implement twoSum(nums, target) that returns the indices of the two numbers that add up to target, smaller index first, using a single pass with a hash map.",
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
      hint: "For each number, compute target - number and check whether it is already in your map. Only then insert the current number and its index.",
      mistakeFeedback: "A pairwise scan is a correct baseline at O(n²); the goal here is the one-pass map version. If a result is wrong, check that you look up the complement before storing the current number, otherwise a number can pair with itself, and that you return the earlier index first.",
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
