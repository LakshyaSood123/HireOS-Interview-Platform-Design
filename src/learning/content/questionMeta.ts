// Small curated set of interview-question METADATA — pointers (title,
// source, url, topics), never the problem statement itself. Our lesson/
// challenge wording throughout src/learning/content/ is original, even
// where a checkpoint's `questionIds` names the canonical problem it's
// modeled after.
//
// This is deliberately NOT the Grind75 list — just enough entries to prove
// the model works for the modules built so far (Foundations, Linked Lists,
// Recursion, Trees). Importing the full 75-question set, scraping, and
// company-frequency data are all explicitly out of scope — see
// LEARNING_ENGINE_ARCHITECTURE.md.

import type { InterviewQuestionMeta } from "../types"

export const questionMeta: InterviewQuestionMeta[] = [
  // Foundations — internal complexity-analysis tasks, not LeetCode problems
  // (there isn't a canonical "Big-O" problem to point at).
  {
    id: "q-foundations-complexity-analysis",
    title: "Complexity Analysis Drill",
    source: "internal",
    difficulty: "easy",
    topics: ["complexity", "big-o"],
    moduleId: "foundations",
    role: "core",
    estimatedMinutes: 10,
  },

  // Linked Lists
  {
    id: "q-linked-list-reverse",
    title: "Reverse Linked List",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/reverse-linked-list/",
    difficulty: "easy",
    topics: ["linked-list", "pointers"],
    moduleId: "linked-structures",
    role: "core",
    estimatedMinutes: 15,
  },
  {
    id: "q-linked-list-cycle",
    title: "Linked List Cycle",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/linked-list-cycle/",
    difficulty: "easy",
    topics: ["linked-list", "fast-slow-pointers"],
    moduleId: "linked-structures",
    role: "reinforcement",
    estimatedMinutes: 15,
  },
  {
    id: "q-merge-two-sorted-lists",
    title: "Merge Two Sorted Lists",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/merge-two-sorted-lists/",
    difficulty: "easy",
    topics: ["linked-list", "merging"],
    moduleId: "linked-structures",
    role: "mastery",
    estimatedMinutes: 15,
  },

  // Recursion
  {
    id: "q-recursion-fibonacci",
    title: "Fibonacci Number (Recursive)",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/fibonacci-number/",
    difficulty: "easy",
    topics: ["recursion", "base-case"],
    moduleId: "recursion",
    role: "core",
    estimatedMinutes: 10,
  },
  {
    id: "q-recursion-subsets",
    title: "Subsets (Backtracking Preview)",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/subsets/",
    difficulty: "medium",
    topics: ["recursion", "backtracking"],
    moduleId: "recursion",
    role: "mastery",
    estimatedMinutes: 20,
  },

  // Trees — mapped for completeness; Trees' own content (checkpoints 3-5)
  // was authored before this metadata layer existed, so this only links
  // the canonical problems the activities are modeled after.
  {
    id: "q-trees-balanced-binary-tree",
    title: "Balanced Binary Tree",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/balanced-binary-tree/",
    difficulty: "easy",
    topics: ["trees", "recursion", "height"],
    moduleId: "trees",
    role: "mastery",
    estimatedMinutes: 15,
  },
  {
    id: "q-trees-search-bst",
    title: "Search in a Binary Search Tree",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/search-in-a-binary-search-tree/",
    difficulty: "easy",
    topics: ["trees", "bst"],
    moduleId: "trees",
    role: "core",
    estimatedMinutes: 10,
  },

  // Arrays & Strings
  {
    id: "q-best-time-buy-sell-stock",
    title: "Best Time to Buy and Sell Stock",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    difficulty: "easy",
    topics: ["array", "one-pass"],
    moduleId: "arrays-strings",
    role: "mastery",
    estimatedMinutes: 15,
  },
  {
    id: "q-remove-duplicates-sorted-array",
    title: "Remove Duplicates from Sorted Array",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    difficulty: "easy",
    // Cross-topic (PART 14): genuinely an array in-place-mutation problem
    // AND a same-direction two-pointers problem — one record, two topics,
    // referenced from Arrays & Strings' code lab; Two Pointers' theory
    // (checkpoint 3) describes the same technique without re-declaring it.
    topics: ["array", "two-pointers", "in-place"],
    moduleId: "arrays-strings",
    role: "core",
    estimatedMinutes: 15,
  },
  {
    id: "q-product-except-self",
    title: "Product of Array Except Self",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/product-of-array-except-self/",
    difficulty: "medium",
    // Cross-topic: an array problem best solved with prefix/suffix running
    // products — the same "precompute once, read fast" idea as Prefix Sum.
    // Referenced from Prefix Sum's code lab rather than duplicated.
    topics: ["array", "prefix-sum"],
    moduleId: "arrays-strings",
    role: "reinforcement",
    estimatedMinutes: 20,
  },

  // Hashing
  {
    id: "q-two-sum",
    title: "Two Sum",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/two-sum/",
    difficulty: "easy",
    topics: ["hashing", "array"],
    moduleId: "hashing",
    role: "core",
    estimatedMinutes: 10,
  },
  {
    id: "q-valid-anagram",
    title: "Valid Anagram",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/valid-anagram/",
    difficulty: "easy",
    topics: ["hashing", "string"],
    moduleId: "hashing",
    role: "core",
    estimatedMinutes: 10,
  },
  {
    id: "q-group-anagrams",
    title: "Group Anagrams",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/group-anagrams/",
    difficulty: "medium",
    topics: ["hashing", "string"],
    moduleId: "hashing",
    role: "mastery",
    estimatedMinutes: 20,
  },

  // Two Pointers
  {
    id: "q-valid-palindrome",
    title: "Valid Palindrome",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/valid-palindrome/",
    difficulty: "easy",
    topics: ["two-pointers", "string"],
    moduleId: "two-pointers",
    role: "core",
    estimatedMinutes: 15,
  },
  {
    id: "q-container-with-most-water",
    title: "Container With Most Water",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/container-with-most-water/",
    difficulty: "medium",
    topics: ["two-pointers", "array"],
    moduleId: "two-pointers",
    role: "mastery",
    estimatedMinutes: 20,
  },
  {
    id: "q-3sum",
    title: "3Sum",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/3sum/",
    difficulty: "medium",
    topics: ["two-pointers", "array", "sorting"],
    moduleId: "two-pointers",
    role: "reinforcement",
    estimatedMinutes: 25,
  },

  // Sliding Window
  {
    id: "q-longest-substring-no-repeat",
    title: "Longest Substring Without Repeating Characters",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    difficulty: "medium",
    topics: ["sliding-window", "hashing", "string"],
    moduleId: "sliding-window",
    role: "mastery",
    estimatedMinutes: 20,
  },
  {
    id: "q-minimum-window-substring",
    title: "Minimum Window Substring",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/minimum-window-substring/",
    difficulty: "hard",
    topics: ["sliding-window", "hashing", "string"],
    moduleId: "sliding-window",
    role: "challenge",
    estimatedMinutes: 30,
  },
  {
    id: "q-permutation-in-string",
    title: "Permutation in String",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/permutation-in-string/",
    difficulty: "medium",
    topics: ["sliding-window", "hashing", "string"],
    moduleId: "sliding-window",
    role: "reinforcement",
    estimatedMinutes: 20,
  },

  // Prefix Sum
  {
    id: "q-subarray-sum-equals-k",
    title: "Subarray Sum Equals K",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/subarray-sum-equals-k/",
    difficulty: "medium",
    topics: ["prefix-sum", "hashing", "array"],
    moduleId: "prefix-sum",
    role: "mastery",
    estimatedMinutes: 20,
  },

  // Binary Search
  {
    id: "q-binary-search",
    title: "Binary Search",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/binary-search/",
    difficulty: "easy",
    topics: ["binary-search", "array"],
    moduleId: "binary-search",
    role: "core",
    estimatedMinutes: 10,
  },
  {
    id: "q-search-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    difficulty: "medium",
    topics: ["binary-search", "array"],
    moduleId: "binary-search",
    role: "mastery",
    estimatedMinutes: 20,
  },
  {
    id: "q-koko-eating-bananas",
    title: "Koko Eating Bananas",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/koko-eating-bananas/",
    difficulty: "medium",
    topics: ["binary-search", "search-on-answer"],
    moduleId: "binary-search",
    role: "reinforcement",
    estimatedMinutes: 20,
  },

  // Intervals
  {
    id: "q-merge-intervals",
    title: "Merge Intervals",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/merge-intervals/",
    difficulty: "medium",
    topics: ["intervals", "sorting"],
    moduleId: "intervals",
    role: "core",
    estimatedMinutes: 20,
  },
  {
    id: "q-insert-interval",
    title: "Insert Interval",
    source: "grind75",
    externalUrl: "https://leetcode.com/problems/insert-interval/",
    difficulty: "medium",
    topics: ["intervals", "sorting"],
    moduleId: "intervals",
    role: "mastery",
    estimatedMinutes: 20,
  },
]

export function getQuestionMetaByModule(moduleId: string): InterviewQuestionMeta[] {
  return questionMeta.filter(q => q.moduleId === moduleId)
}

export function getQuestionMetaById(id: string): InterviewQuestionMeta | undefined {
  return questionMeta.find(q => q.id === id)
}

/** Cross-topic lookup (PART 14) — a question's `moduleId` is its single
 * primary home, but `topics` lets it surface for a related module too
 * (e.g. "Product of Array Except Self" is topics: ["array", "prefix-sum"],
 * findable from either angle without a duplicate record). */
export function getQuestionMetaByTopic(topic: string): InterviewQuestionMeta[] {
  return questionMeta.filter(q => q.topics.includes(topic))
}
