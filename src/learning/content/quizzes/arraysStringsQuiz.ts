// Module Mastery Quiz — Arrays & Strings (module id "arrays-strings").
// Written from arrays-strings-1..5: indexing, editing in place versus building
// a copy, language differences for strings, nested loops as a question about
// repeated work, contiguous slices, the read/write index for removeDuplicates,
// and the running-minimum approach to maxProfit.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const REMOVE_DUPLICATES_CODE =
  "write = 1\nfor read in range(1, len(nums)):\n    if nums[read] != nums[read - 1]:\n        nums[write] = nums[read]\n        write += 1"

export const arraysStringsQuiz: ModuleMasteryQuiz = {
  id: "arrays-strings-mastery",
  moduleId: "arrays-strings",
  title: "Arrays & Strings Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "arrays-strings-q1",
      concept: "Indexing",
      difficulty: "foundation",
      prompt: "In nums = [10, 20, 30, 40], what is nums[3], and how does reading it compare with reading nums[0]?",
      options: [
        "40, and it takes the same amount of work.",
        "30, and it takes a little longer.",
        "40, but it takes about n steps to reach.",
        "30, because counting starts at 1.",
      ],
      correct: "a",
      explanation:
        "Positions start at 0, so nums[3] is 40. In the standard interview model, reading any position takes the same effort, which is why index access is O(1).",
    }),
    singleSelect({
      id: "arrays-strings-q2",
      concept: "Copy vs in-place",
      difficulty: "foundation",
      prompt: "You must return a reversed copy and leave the original array unchanged. How much extra space does that need?",
      options: ["O(log n)", "O(1), because swaps are cheap", "O(n), because you build a second array", "O(n²)"],
      correct: "c",
      explanation:
        "A separate result of n values is n extra slots, so O(n). Swapping inside the original would need only O(1), but it changes the original.",
    }),
    singleSelect({
      id: "arrays-strings-q3",
      concept: "Strings by language",
      difficulty: "application",
      prompt: "In Python or Java you want a string with one character replaced. Why does that usually cost O(n) extra work?",
      options: [
        "Reading one character of a string takes O(n) time.",
        "Characters have to be counted before they can be changed.",
        "The string must be sorted before one character can be replaced.",
        "The string can't change after creation, so a new string is built.",
      ],
      correct: "d",
      explanation:
        "Python and Java strings can't be edited after they are created, so \"editing\" one builds a new string. A C++ string can be edited in place, so check what your language allows before promising O(1) extra space.",
    }),
    singleSelect({
      id: "arrays-strings-q4",
      concept: "Read/write pointers",
      difficulty: "application",
      prompt: "You must remove duplicates from a sorted array using only O(1) extra space. Which idea fits?",
      options: [
        "Build a new array and copy each unique value into it as you go.",
        "Use two indices: one scans, one marks the next slot for a unique value.",
        "Use a set to remember every value you have already seen.",
        "Count how many times each value appears using a map, then rebuild.",
      ],
      correct: "b",
      explanation:
        "A read index scans the array and a write index marks the next slot for a unique value, all inside the same array. The other ideas each need O(n) extra memory.",
    }),
    singleSelect({
      id: "arrays-strings-q5",
      concept: "Nested loops",
      difficulty: "application",
      prompt: "Which situation is a good reason to question a loop inside a loop?",
      options: [
        "The inner loop keeps rescanning the array to repeat the same searching.",
        "Any solution that has two loops in it, whatever they do.",
        "The array has more than five items, so nested loops get slow.",
        "The two loops use different variable names from each other.",
      ],
      correct: "a",
      explanation:
        "A loop inside a loop is not automatically wrong. The question is whether the inner loop repeats work you could avoid, such as rescanning the array to ask \"have I seen this value?\" for every item.",
    }),
    singleSelect({
      id: "arrays-strings-q6",
      concept: "Contiguous ranges",
      difficulty: "foundation",
      prompt: "In [3, 1, 4, 1], which one is a subarray?",
      options: ["[3, 4]", "[3, 1, 1]", "[4, 3]", "[1, 4]"],
      correct: "d",
      explanation:
        "A subarray is a contiguous slice. The 1 and the 4 sit side by side, so [1, 4] is a subarray. [3, 4] and [3, 1, 1] skip values (they are subsequences), and [4, 3] is in the wrong order.",
    }),
    singleSelect({
      id: "arrays-strings-q7",
      concept: "Read/write pointers",
      difficulty: "application",
      prompt: "nums = [1, 1, 2, 2, 3]. When read is at position 2 (the value 2), what happens?",
      code: REMOVE_DUPLICATES_CODE,
      options: [
        "write goes back to 0.",
        "It is skipped, because 2 appears again later.",
        "It is copied to position 1 and write becomes 2.",
        "The array is sorted again.",
      ],
      correct: "c",
      explanation:
        "At position 1 the value 1 matched the one before it, so write stayed at 1. At position 2, 2 differs from the value before it, so it is copied to nums[1] and write becomes 2.",
    }),
    singleSelect({
      id: "arrays-strings-q8",
      concept: "Read/write pointers",
      difficulty: "challenge",
      prompt: "A learner starts write at 0 instead of 1 in this code. What goes wrong on [1, 1, 2, 2, 3]?",
      code: REMOVE_DUPLICATES_CODE.replace("write = 1", "write = 0"),
      options: [
        "Nothing. The result comes out exactly the same as before.",
        "The first value gets overwritten, so the front loses the unique values.",
        "It counts one extra duplicate, but the array is fine.",
        "It crashes, because sorted arrays can't be edited in place.",
      ],
      correct: "b",
      explanation:
        "Position 0 already holds the first unique value. With write = 0, the first different value (2) is copied over it, giving [2, 1, 2, 2, 3]. Starting write at 1 protects it.",
    }),
    singleSelect({
      id: "arrays-strings-q9",
      concept: "Running minimum",
      difficulty: "application",
      prompt: "prices = [7, 1, 5, 3, 6, 4]. You are at the price 5. What is the lowest price so far, and what would selling at 5 earn?",
      options: [
        "7, and it earns -2.",
        "5, and it earns 0.",
        "1, and it earns 5.",
        "1, and it earns 4.",
      ],
      correct: "d",
      explanation:
        "The lowest price seen so far is 1, so selling at 5 earns 5 - 1 = 4. The running minimum already holds the best day to have bought, so each day costs one subtraction.",
    }),
    singleSelect({
      id: "arrays-strings-q10",
      concept: "Running minimum",
      difficulty: "challenge",
      prompt:
        "A learner takes the lowest price in the whole list and the highest price, then subtracts. For [3, 2, 6, 5, 0, 3] that gives 6, but the real answer is 4. Why is it wrong?",
      options: [
        "It can pair a sale with a cheaper price from later. You must buy first.",
        "The highest price should be found first, then the lowest.",
        "It only works when the list has fewer than five prices in it.",
        "The list must be sorted before the two prices are subtracted.",
      ],
      correct: "a",
      explanation:
        "The lowest price, 0, comes after the highest price, 6, so that trade is impossible. The best real trade buys at 2 and sells at 6 for a profit of 4.",
    }),
    singleSelect({
      id: "arrays-strings-q11",
      concept: "Edge cases",
      difficulty: "application",
      prompt: "prices = [7, 6, 4, 3, 1], and they only fall. What should maxProfit return?",
      options: ["-6", "6", "1", "0"],
      correct: "d",
      explanation:
        "No sale can make money, so the best you can do is not trade. That is 0, never a negative number.",
    }),
    multiSelect({
      id: "arrays-strings-q12",
      concept: "Copy vs in-place",
      difficulty: "application",
      prompt: "Which statements about editing an array in place are true? Select all that apply.",
      options: [
        "It writes results back into the array you were given.",
        "It keeps the extra space at O(1).",
        "The original order of the array is preserved.",
        "It is always faster than building a new array.",
      ],
      correct: ["a", "b"],
      explanation:
        "In place means writing results back into the array you were given, so extra space stays O(1). The trade-off is that the original order is gone, and it is not automatically faster.",
    }),
  ],
}
