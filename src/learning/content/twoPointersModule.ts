// Two Pointers — first Pattern Meadows module. Prerequisite is Hashing's
// last checkpoint (see courseRegistry.ts) — Two Pointers, Sliding Window,
// Prefix Sum, Binary Search, and Intervals all branch off the SAME
// checkpoint (Basecamp completion) rather than chaining serially through
// each other, since none of them depends on the others pedagogically.

import type { Checkpoint, Module } from "../types"
import { twoPointersQuiz } from "./quizzes/twoPointersQuiz"

const recognizing: Checkpoint = {
  id: "two-pointers-1",
  title: "Recognizing Two Pointers",
  subtitle: "When two indices beat one",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Recognizing Two Pointers",
    theory: [
      {
        heading: "A family of techniques",
        body: "Here a pointer is just an index that you move. Two pointers coordinate two moving positions while you process a sequence. Depending on the problem, they can narrow a search, compare opposite positions, compact data in place, or avoid repeating work. It is a family of techniques, not one algorithm, and it has two common shapes.",
      },
      {
        heading: "Shape 1: opposite ends",
        body: "Start one pointer at each end and move them toward each other. This fits checking a palindrome, where you compare each character with its mirror, and finding a pair with a given sum in a sorted array.",
      },
      {
        heading: "Shape 2: same direction",
        body: "Start both pointers at the left. One scans ahead reading values while the other marks where the next kept value should be written. This fits removing duplicates from a sorted array in place, which you already did in Arrays & Strings.",
      },
    ],
    quickCheck: {
      question: "Which task fits opposite-end pointers, rather than a read and write pair moving in the same direction?",
      options: [
        "Removing duplicates from a sorted array in place",
        "Counting how many times each word appears",
        "Checking whether a string reads the same backward",
        "Finding the largest value in an array",
      ],
      correctIndex: 2,
      explanation: "A palindrome check compares mirrored positions, so one pointer starts at each end and they move inward. Removing duplicates in place is the read and write shape. Counting words is a job for a hash map, and finding the largest value needs only a single pass with one variable.",
    },
  },
}

const oppositeEnd: Checkpoint = {
  id: "two-pointers-2",
  title: "Opposite-End Pointers",
  subtitle: "Converging toward the middle",
  type: "lesson",
  xp: 30,
  prerequisites: [recognizing.id],
  workspace: {
    title: "Opposite-End Pointers",
    theory: [
      {
        heading: "Pair search needs sorted data",
        body: "Set left = 0 and right = length - 1, and find two values that add to a target. This only works because the array is sorted. Take [1, 2, 4, 6, 10] with target 8. 1 + 10 = 11 is too high. Since the array is sorted, 10 plus any other remaining value is at least 1 + 10 = 11, so 10 cannot be in any pair. Move right inward.",
      },
      {
        heading: "Each move discards a value",
        body: "Now 1 + 6 = 7 is too low. Every other remaining value is at most 6, so 1 + anything is at most 7, and 1 cannot be in any pair. Move left forward. Then 2 + 6 = 8: found. The rule is: too high, move right; too low, move left. Each step throws one value away for good, so the search takes at most n steps.",
      },
      {
        heading: "What to watch",
        body: "The moving strip is a simplified picture of two markers closing in; in a real search only one pointer moves per step. The step-through animation shows the actual decisions. Before each step, decide which pointer should move, then check.",
      },
    ],
    twoPointerVisual: {
      values: [1, 2, 4, 6, 10],
      mode: "opposite",
    },
    animation: {
      id: "two-pointers-opposite-sum",
    },
    quickCheck: {
      question: "In a sorted array, left points at 1 and right at 10. The sum is 11 and the target is 8. Why is it safe to move right inward?",
      options: [
        "Because the largest value never belongs to any pair",
        "Because 10 plus any other remaining value is at least 11, so 10 cannot be in a valid pair",
        "It is not really safe; 10 should first be tried against every remaining value",
        "Because moving right is always faster than moving left",
      ],
      correctIndex: 1,
      explanation: "The array is sorted, so every other remaining value is at least 1, and 10 + 1 = 11 already overshoots 8. That means 10 cannot be part of any answer and can be discarded without checking. The largest value can belong to a pair when the target is larger, and neither pointer is faster than the other.",
    },
  },
}

const sameDirection: Checkpoint = {
  id: "two-pointers-3",
  title: "Same-Direction Pointers",
  subtitle: "A slow pointer trailing a fast one",
  type: "lesson",
  xp: 30,
  prerequisites: [oppositeEnd.id],
  workspace: {
    title: "Same-Direction Pointers",
    theory: [
      {
        heading: "Read and write compaction",
        body: "You already used this idea in Arrays & Strings. A read pointer scans every element. A write pointer marks where the next kept value goes, and it moves only when a value is kept. Take [1, 1, 1, 2, 3, 3] and keep each value that differs from the one before it. The first 1 is kept. The next two 1s match the value before them, so they are skipped and write stays put. Read 2: new, copy it to slot 1, write becomes 2. Read 3: new, copy it to slot 2, write becomes 3. The last 3 is skipped. The front is [1, 2, 3], and write, 3, is how many values were kept.",
      },
      {
        heading: "The rule can change",
        body: "Here the keep rule is \"differs from the previous value\". Other problems use other rules, such as keeping only nonzero values. The pointers behave the same way: read always moves forward, and write moves only when a value is kept. In the strip, watch R visit every position while W advances only on a kept value.",
      },
      {
        heading: "A preview",
        body: "When the stretch between two pointers is a range you are tracking, the technique is called a sliding window. That is the next module; for now you only need the read and write idea.",
      },
    ],
    twoPointerVisual: {
      values: [1, 1, 1, 2, 3, 3],
      mode: "same-direction",
    },
  },
}

const codeLab: Checkpoint = {
  id: "two-pointers-4",
  title: "Two Pointers Code Lab",
  subtitle: "Valid palindrome",
  type: "challenge",
  xp: 40,
  prerequisites: [sameDirection.id],
  workspace: {
    title: "Two Pointers Code Lab",
    theory: [
      {
        heading: "Compare mirrored characters",
        body: "A string is a palindrome when each character matches its mirror: first with last, second with second-to-last, and so on. Put left at the start and right at the end, compare, and move both inward. Take \"A man, a plan, a canal: Panama\". Left is A and right is a, which match once case is ignored, so move both inward. Left lands on a space, which is skipped. It moves on to m. Right moves in to m. They match.",
      },
      {
        heading: "The rules",
        body: "Skip anything that is not a letter or a digit, and compare lowercase versions. Stop when left meets right. An empty string counts as a palindrome. You never copy the string, so the extra space is O(1) and the time is O(n).",
      },
    ],
    codingActivity: {
      prompt: "Implement isPalindrome(s) that returns true if s reads the same forwards and backwards, considering only alphanumeric characters and ignoring case.",
      constraints: ["0 ≤ length of s ≤ 2×10^5"],
      functionName: "isPalindrome",
      requiredKeywords: ["left", "right"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def isPalindrome(s):\n    # your code here\n    pass\n",
        cpp: "bool isPalindrome(string s) {\n    // your code here\n}\n",
        java: "boolean isPalindrome(String s) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Palindrome with punctuation", input: "'A man, a plan, a canal: Panama'", expected: "true" },
        { id: "v2", description: "Not a palindrome", input: "'race a car'", expected: "false" },
        { id: "v3", description: "Single character", input: "'a'", expected: "true" },
      ],
      hiddenTests: [
        { id: "h1", description: "Mixed case", input: "'Was it a car or a cat I saw'", expected: "true" },
        { id: "h2", description: "Numbers included", input: "'0P'", expected: "false" },
        { id: "h3", description: "Empty string", input: "''", expected: "true" },
      ],
      hint: "Move left forward and right backward, skipping characters that are not letters or digits, and compare lowercase versions at each step.",
      mistakeFeedback: "Building a cleaned lowercase copy and comparing it with its reverse also works, using O(n) extra space; this checkpoint practices the two-pointer version. If a result is wrong, check that punctuation and spaces are skipped on both sides and that letters are compared ignoring case. Digits count as characters too.",
      demoSolution: {
        python: "def isPalindrome(s):\n    if not s:\n        return True\n    left, right = 0, len(s) - 1\n    while left < right:\n        while left < right and not s[left].isalnum():\n            left += 1\n        while left < right and not s[right].isalnum():\n            right -= 1\n        if s[left].lower() != s[right].lower():\n            return False\n        left += 1\n        right -= 1\n    return True\n",
        cpp: "bool isPalindrome(string s) {\n    if (s.empty()) return true;\n    int left = 0, right = (int)s.size() - 1;\n    while (left < right) {\n        while (left < right && !isalnum(s[left])) left++;\n        while (left < right && !isalnum(s[right])) right--;\n        if (tolower(s[left]) != tolower(s[right])) return false;\n        left++;\n        right--;\n    }\n    return true;\n}\n",
        java: "boolean isPalindrome(String s) {\n    char[] chars = s.toCharArray();\n    if (chars.length == 0) return true;\n    int left = 0, right = chars.length - 1;\n    while (left < right) {\n        while (left < right && !Character.isLetterOrDigit(chars[left])) left++;\n        while (left < right && !Character.isLetterOrDigit(chars[right])) right--;\n        if (Character.toLowerCase(chars[left]) != Character.toLowerCase(chars[right])) return false;\n        left++;\n        right--;\n    }\n    return true;\n}\n",
      },
    },
  },
  questionIds: ["q-valid-palindrome"],
}

const mastery: Checkpoint = {
  id: "two-pointers-5",
  title: "Two Pointers Interview Challenge",
  subtitle: "Container with most water — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Two Pointers Interview Challenge",
    theory: [
      {
        heading: "Area from two walls",
        body: "Two walls hold water up to the height of the shorter wall, across the distance between them: area = shorter height × distance. Take heights [1, 8, 6, 2, 5, 4, 8, 3, 7]. The widest container uses the two end walls, 1 and 7, at distance 8. Its area is 1 × 8 = 8.",
      },
      {
        heading: "Why move the shorter wall",
        body: "The wall of height 1 limits that container. Any other container using it is capped at height 1 and has a closer partner, so its distance is at most 7 and its area at most 7, no better than the 8 we measured. That wall has no future, so drop it. Moving the taller wall instead could skip the best container, because the short wall would still cap the height while the width shrank.",
      },
      {
        heading: "Then repeat",
        body: "Record the best area each step, move the pointer at the shorter wall, and stop when they meet. If the two walls are equal, either pointer may move. As in pair search, you discard the side that cannot be part of a better answer.",
      },
    ],
    codingActivity: {
      prompt: "Implement maxArea(heights) that returns the maximum water a container can hold. Heights are given by index; a container is formed by any two walls, and its area is the height of the shorter wall multiplied by the distance (index difference) between them.",
      constraints: ["2 ≤ length of heights ≤ 10^5"],
      functionName: "maxArea",
      requiredKeywords: ["left", "right"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def maxArea(heights):\n    # your code here\n    pass\n",
        cpp: "int maxArea(vector<int>& heights) {\n    // your code here\n}\n",
        java: "int maxArea(int[] heights) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Typical case", input: "[1,8,6,2,5,4,8,3,7]", expected: "49" },
        { id: "v2", description: "Two walls", input: "[1,1]", expected: "1" },
        { id: "v3", description: "Increasing heights", input: "[1,2,3,4,5]", expected: "6" },
      ],
      hiddenTests: [
        { id: "h1", description: "Decreasing heights", input: "[5,4,3,2,1]", expected: "6" },
        { id: "h2", description: "All equal", input: "[4,4,4,4]", expected: "12" },
        { id: "h3", description: "Tall walls at the ends", input: "[9,1,1,1,9]", expected: "36" },
      ],
      hint: "Start left and right at the two ends, track the best area seen, and always move the pointer at the shorter wall inward.",
      mistakeFeedback: "Checking every pair of walls gives the right answer at O(n²), and this checkpoint asks for the O(n) pointer version. If a result is wrong, check that the area is the shorter height times the index distance, and that you move the pointer at the shorter wall. Moving the taller wall can skip the best container.",
      demoSolution: {
        python: "def maxArea(heights):\n    if not heights:\n        return 0\n    left, right = 0, len(heights) - 1\n    best = 0\n    while left < right:\n        area = min(heights[left], heights[right]) * (right - left)\n        best = max(best, area)\n        if heights[left] < heights[right]:\n            left += 1\n        else:\n            right -= 1\n    return best\n",
        cpp: "int maxArea(vector<int>& heights) {\n    if (heights.empty()) return 0;\n    int left = 0, right = (int)heights.size() - 1, best = 0;\n    while (left < right) {\n        int area = min(heights[left], heights[right]) * (right - left);\n        best = max(best, area);\n        if (heights[left] < heights[right]) left++; else right--;\n    }\n    return best;\n}\n",
        java: "int maxArea(int[] heights) {\n    if (heights.length == 0) return 0;\n    int left = 0, right = heights.length - 1, best = 0;\n    while (left < right) {\n        int area = Math.min(heights[left], heights[right]) * (right - left);\n        best = Math.max(best, area);\n        if (heights[left] < heights[right]) left++; else right--;\n    }\n    return best;\n}\n",
      },
    },
  },
  questionIds: ["q-container-with-most-water"],
}

export const twoPointersModule: Module = {
  id: "two-pointers",
  title: "Two Pointers",
  description: "Opposite-end and same-direction pointer techniques for sorted arrays and in-place compaction.",
  icon: "👉",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [recognizing, oppositeEnd, sameDirection, codeLab, mastery],
  quiz: twoPointersQuiz,
}
