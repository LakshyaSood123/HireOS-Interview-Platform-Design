// Module Mastery Quiz — Two Pointers (module id "two-pointers").
// Written from two-pointers-1..5: two pointers as a family of techniques,
// opposite-end pair search on sorted data and why each pointer move is safe,
// read/write compaction, the palindrome check (skip, empty string, O(1)
// space), and the container-with-most-water reasoning for moving the shorter
// wall. Nothing here assumes sliding window, which comes later.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

export const twoPointersQuiz: ModuleMasteryQuiz = {
  id: "two-pointers-mastery",
  moduleId: "two-pointers",
  title: "Two Pointers Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "two-pointers-q1",
      concept: "Recognizing the pattern",
      difficulty: "foundation",
      prompt: "Which description fits two pointers best?",
      options: [
        "Two nested loops that check every possible pair of values.",
        "Two moving indices where each move depends on what they point at.",
        "Two copies of the array, each sorted in a different way.",
        "Two hash maps that are kept side by side and compared.",
      ],
      correct: "b",
      explanation:
        "Two pointers coordinate two moving positions while you process a sequence. Depending on the problem they can narrow a search, compare opposite positions, compact data, or avoid repeated work.",
    }),
    singleSelect({
      id: "two-pointers-q2",
      concept: "Sorted pair search",
      difficulty: "application",
      prompt:
        "In [1, 3, 5, 8, 12] with target 9, left is at 1 and right is at 12, so the sum is 13. Which pointer moves, and why is it safe?",
      options: [
        "Move left: 1 is too small to matter, so it should go first.",
        "Move right: the largest value never belongs to any pair.",
        "Move right: 12 plus any remaining value is at least 13, so 12 is out.",
        "Move neither: check every pair before moving anything.",
      ],
      correct: "c",
      explanation:
        "The array is sorted, so every other remaining value is at least 1, and 12 + 1 = 13 already overshoots 9. That means 12 cannot be part of any answer and can be discarded. The largest value can belong to a pair when the target is larger.",
    }),
    singleSelect({
      id: "two-pointers-q3",
      concept: "Sorted pair search",
      difficulty: "application",
      prompt: "In [1, 4, 6, 8, 10] with target 12, the ends add up to 11. Which pointer moves?",
      options: [
        "Move left forward: 1 plus any remaining value is at most 11, so 1 is out.",
        "Move right inward, because the sum is too big for the target.",
        "Move both pointers one step toward the middle at once.",
        "Stop, because no pair in this array can reach the target.",
      ],
      correct: "a",
      explanation:
        "11 is too low. Every other remaining value is at most 10, so 1 + anything is at most 11 and 1 cannot be in a pair. Move left. Then 4 + 10 = 14 is too high, so move right, and 4 + 8 = 12 is found.",
    }),
    singleSelect({
      id: "two-pointers-q4",
      concept: "Sorted pair search",
      difficulty: "challenge",
      prompt:
        "The pair-sum rule \"too big, move right; too small, move left\" is run on the unsorted array [5, 1, 9, 2]. What is the problem?",
      options: [
        "Nothing at all. The rule works the same on any array.",
        "It only breaks when the target is a negative number.",
        "It quietly turns into an O(n²) search instead.",
        "It relies on sorted order, so it can drop a needed value.",
      ],
      correct: "d",
      explanation:
        "\"Too big, so the right value can go\" is only true because everything to its left is smaller. On unsorted data that reasoning breaks, and a value that belongs to the answer can be discarded.",
    }),
    singleSelect({
      id: "two-pointers-q5",
      concept: "Read/write compaction",
      difficulty: "application",
      prompt:
        "You keep each value that differs from the one before it in [0, 0, 1, 1, 2]. When the pointers finish, what is write and what does the front hold?",
      options: [
        "write is 5, front is [0, 0, 1, 1, 2]",
        "write is 3, front is [0, 1, 2]",
        "write is 2, front is [0, 1]",
        "write is 3, front is [0, 0, 1]",
      ],
      correct: "b",
      explanation:
        "The first 0 is kept. The second 0 matches the one before it, so it is skipped. 1 is new, copied to slot 1. The second 1 is skipped. 2 is new, copied to slot 2. write is 3 and the front is [0, 1, 2].",
    }),
    singleSelect({
      id: "two-pointers-q6",
      concept: "Palindrome check",
      difficulty: "application",
      prompt: "While checking a palindrome, left lands on a comma. What should happen?",
      options: [
        "Return false, since a comma can never match anything.",
        "Compare it with the character currently on the right.",
        "Stop and return true, because punctuation ends the check.",
        "Skip it by moving left forward; only letters and digits count.",
      ],
      correct: "d",
      explanation:
        "The check only compares letters and digits, ignoring case. Punctuation and spaces are skipped on both sides, then the next real characters are compared.",
    }),
    singleSelect({
      id: "two-pointers-q7",
      concept: "Palindrome check",
      difficulty: "application",
      prompt: "What should isPalindrome return for an empty string?",
      options: [
        "false, because there is nothing to compare.",
        "true, because there is nothing that can mismatch.",
        "It depends on the language.",
        "An error.",
      ],
      correct: "b",
      explanation:
        "left starts at 0 and right at -1, so the loop never runs and no mismatch is found. An empty string counts as a palindrome.",
    }),
    singleSelect({
      id: "two-pointers-q8",
      concept: "Palindrome check",
      difficulty: "application",
      prompt:
        "Compared with building a cleaned lowercase copy and comparing it with its reverse, what does the two-pointer version save?",
      options: [
        "Extra space: it needs O(1) instead of O(n).",
        "Time: it is O(log n).",
        "Correctness: the copy approach gives wrong answers.",
        "Nothing. The two are identical in every way.",
      ],
      correct: "a",
      explanation:
        "Building a cleaned copy also works, but it uses O(n) extra space. The two-pointer version compares characters in place, so extra space is O(1) and time is O(n).",
    }),
    singleSelect({
      id: "two-pointers-q9",
      concept: "Container area",
      difficulty: "application",
      prompt: "Heights are [3, 9, 4, 7]. What is the area between the wall of height 9 and the wall of height 7?",
      options: ["18", "21", "14", "63"],
      correct: "c",
      explanation:
        "Area is the shorter height times the distance between the walls. The shorter wall is 7 and the walls are 2 positions apart, so 7 × 2 = 14.",
    }),
    singleSelect({
      id: "two-pointers-q10",
      concept: "Container area",
      difficulty: "challenge",
      prompt:
        "In [1, 8, 6, 2, 5, 4, 8, 3, 7] the first container (walls 1 and 7, distance 8) has area 8. Why is it safe to move the pointer at the wall of height 1?",
      options: [
        "Moving the left pointer always makes the area bigger.",
        "The left wall is the first wall, so it is already used up.",
        "Taller walls should always be moved before shorter ones.",
        "Other containers using that wall are capped at height 1 and narrower.",
      ],
      correct: "d",
      explanation:
        "Every other container that uses the height-1 wall has height at most 1 and a smaller distance, so its area is at most 7. That wall has no future and can be dropped.",
    }),
    singleSelect({
      id: "two-pointers-q11",
      concept: "Sorted pair search",
      difficulty: "application",
      prompt: "Why does opposite-end pair search take at most about n steps?",
      options: [
        "It sorts the array first, and then makes a single scan of it.",
        "Each step discards a value for good, and the pointers never back up.",
        "It checks each pair of values exactly once, one after another.",
        "It only ever runs about log n steps, because it halves the range.",
      ],
      correct: "b",
      explanation:
        "Every step moves one pointer inward and discards a value that can no longer be part of the answer. The pointers only move toward each other, so there are at most n steps.",
    }),
    multiSelect({
      id: "two-pointers-q12",
      concept: "Recognizing the pattern",
      difficulty: "application",
      prompt: "Which statements about two pointers are true? Select all that apply.",
      options: [
        "It is a family of techniques with more than one common shape.",
        "Every two-pointer problem needs the region between the pointers to be a contiguous window.",
        "Opposite-end pair search relies on the input being sorted.",
        "Both pointers must move on every single step.",
      ],
      correct: ["a", "c"],
      explanation:
        "Two pointers has shapes such as opposite ends and read/write. Some problems track a range between the pointers, others just coordinate two positions like the two ends of a sorted array. In pair search only one pointer moves per step.",
    }),
  ],
}
