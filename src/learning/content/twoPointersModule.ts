// Two Pointers — first Pattern Meadows module. Prerequisite is Hashing's
// last checkpoint (see courseRegistry.ts) — Two Pointers, Sliding Window,
// Prefix Sum, Binary Search, and Intervals all branch off the SAME
// checkpoint (Basecamp completion) rather than chaining serially through
// each other, since none of them depends on the others pedagogically.

import type { Checkpoint, Module } from "../types"

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
        heading: "The recognition cues",
        body: "Sorted array, looking for a pair, checking a palindrome, or removing/moving elements in place — these are the signals that two pointers might replace a nested loop.",
      },
      {
        heading: "Two shapes",
        body: "Opposite-end pointers start at both ends and move toward each other. Same-direction pointers start together and let one race ahead — different problems call for different shapes.",
      },
    ],
    quickCheck: {
      question: "Which of these is the strongest signal to consider two pointers?",
      options: ["The input is a linked list", "The array is sorted and you need a pair", "The input has duplicates", "The array is very large"],
      correctIndex: 1,
      explanation: "A sorted array plus 'find a pair' is the classic two-pointers setup — moving pointers toward each other lets you skip large chunks of the search space.",
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
        heading: "Start at both ends",
        body: "left = 0, right = length - 1. Compare, then move whichever side needs to change — left forward or right backward — until the pointers meet.",
      },
      {
        heading: "Why it's O(n)",
        body: "Each step moves one pointer at least one position, and the pointers can only move toward each other n times total before they meet.",
      },
    ],
    twoPointerVisual: {
      values: [3, 8, 2, 9, 4, 1, 7],
      mode: "opposite",
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
        heading: "One pointer marks a boundary",
        body: "A 'slow' pointer marks where the next valid value should go; a 'fast' pointer scans ahead looking for it — this is how in-place compaction (like removing duplicates) works.",
      },
      {
        heading: "Related to sliding window",
        body: "When the same-direction gap between the two pointers represents a contiguous range you're tracking, you've stepped into sliding window territory — the next module.",
      },
    ],
    twoPointerVisual: {
      values: [3, 8, 2, 9, 4, 1, 7],
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
        heading: "Compare from both ends",
        body: "A string is a palindrome exactly when every character matches its mirror — check left against right and converge.",
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
      hint: "Move left forward and right backward, skipping non-alphanumeric characters, and compare lowercase letters at each step.",
      mistakeFeedback: "This looks like it's comparing the raw string to its reverse without skipping punctuation/case — that fails on anything with spaces or symbols in it.",
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
        heading: "Why moving the shorter wall works",
        body: "The container's area is limited by the shorter of its two walls — moving the taller wall inward can only shrink the width without any chance of a taller wall, so it's always safe to move the shorter one instead.",
      },
    ],
    codingActivity: {
      prompt: "Implement maxArea(heights) that returns the maximum water a container can hold, given wall heights at each index — the container is formed by any two walls and the shorter one's height.",
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
      mistakeFeedback: "This looks like it's checking every pair of walls (O(n²)) instead of narrowing from both ends and always moving the shorter wall inward (O(n)).",
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
}
