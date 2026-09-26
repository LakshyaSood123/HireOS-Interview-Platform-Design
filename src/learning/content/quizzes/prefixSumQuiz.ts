// Module Mastery Quiz — Prefix Sum (module id "prefix-sum").
// Written from prefix-sum-1..4: the cost of re-summing ranges, building
// prefix[i] as a running total, reading a range back out by subtraction, the
// i = 0 boundary, the Code Lab's one-extra-slot prefix array, and the
// prefix-sum-plus-hash-map idea behind "subarray sum equals K".

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const RANGE_SUM_CODE =
  "prefix = [0] * (len(nums) + 1)\nfor i in range(len(nums)):\n    prefix[i + 1] = prefix[i] + nums[i]\nreturn prefix[right + 1] - prefix[left]"

export const prefixSumQuiz: ModuleMasteryQuiz = {
  id: "prefix-sum-mastery",
  moduleId: "prefix-sum",
  title: "Prefix Sum Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "prefix-sum-q1",
      concept: "Repeated range work",
      difficulty: "foundation",
      prompt: "Why is summing each range with a loop a problem when you get many queries on the same array?",
      options: [
        "Loops give wrong totals once the array holds negative numbers.",
        "The array has to be rebuilt from scratch after every query.",
        "Each query costs time proportional to the range's width.",
        "Each query needs the array to be sorted beforehand.",
      ],
      correct: "c",
      explanation:
        "Summing a range [i, j] with a loop is O(j - i) every time. That is fine once, but expensive when you are asked about many ranges of the same array.",
    }),
    singleSelect({
      id: "prefix-sum-q2",
      concept: "Setup vs query cost",
      difficulty: "foundation",
      prompt: "You build a prefix array for n numbers once, then answer q range-sum queries. What is the total cost?",
      options: ["O(n + q)", "O(n × q)", "O(q log n)", "O(n²)"],
      correct: "a",
      explanation:
        "Building the prefix array is one O(n) pass, and every query afterward is a single subtraction, O(1). Summing each range with a loop would cost about O(n × q) instead.",
    }),
    singleSelect({
      id: "prefix-sum-q3",
      concept: "Building prefix values",
      difficulty: "foundation",
      prompt: "nums = [3, 1, 4, 2]. What is prefix, if prefix[i] is the total of everything up to and including index i?",
      options: ["[10, 7, 6, 2]", "[0, 3, 4, 8]", "[3, 1, 4, 2]", "[3, 4, 8, 10]"],
      correct: "d",
      explanation:
        "Each entry is the previous entry plus the current number: 3, then 3 + 1 = 4, then 4 + 4 = 8, then 8 + 2 = 10.",
    }),
    singleSelect({
      id: "prefix-sum-q4",
      concept: "Reading a range",
      difficulty: "application",
      prompt: "nums = [2, 5, 1, 3] and prefix = [2, 7, 8, 11]. What is the sum of nums[1..3], and how do you get it?",
      options: [
        "11, which is prefix[3].",
        "9, which is prefix[3] - prefix[0].",
        "4, which is prefix[3] - prefix[1].",
        "13, which is prefix[3] + prefix[0].",
      ],
      correct: "b",
      explanation:
        "sum(i, j) = prefix[j] - prefix[i - 1]. Here that is prefix[3] - prefix[0] = 11 - 2 = 9, which is 5 + 1 + 3. Subtracting prefix[1] would also remove nums[1].",
    }),
    singleSelect({
      id: "prefix-sum-q5",
      concept: "Boundary cases",
      difficulty: "application",
      prompt: "For a range that starts at index 0, why can't you subtract prefix[i - 1]?",
      options: [
        "prefix[0] is always zero, so subtraction fails.",
        "Prefix values are stored in reverse order.",
        "There is no prefix[-1], so use prefix[j] alone.",
        "Ranges that start at 0 have no defined sum.",
      ],
      correct: "c",
      explanation:
        "The formula prefix[j] - prefix[i - 1] only works when i > 0. When i is 0 there is nothing before the range, so the sum is just prefix[j]. The Code Lab avoids the special case by keeping one extra leading 0 in the prefix array.",
    }),
    singleSelect({
      id: "prefix-sum-q6",
      concept: "Reading a range",
      difficulty: "application",
      prompt: "nums = [1, 2, 3, 4, 5], left = 1, right = 3. What does this code return?",
      code: RANGE_SUM_CODE,
      options: ["10", "8", "6", "9"],
      correct: "d",
      explanation:
        "prefix ends up as [0, 1, 3, 6, 10, 15]. prefix[right + 1] - prefix[left] = prefix[4] - prefix[1] = 10 - 1 = 9, which is 2 + 3 + 4.",
    }),
    singleSelect({
      id: "prefix-sum-q7",
      concept: "When prefix helps",
      difficulty: "application",
      prompt: "Which situation is the best reason to build a prefix sum array?",
      options: [
        "Answering many range-sum queries on the same array.",
        "Finding the largest value in an array, just once.",
        "Checking whether one number appears in an array.",
        "Reversing an array in place using two swaps.",
      ],
      correct: "a",
      explanation:
        "A prefix array pays off when you will ask about many ranges of the same array: build once in O(n), then each query is one subtraction. A one-time task does not benefit from the setup.",
    }),
    singleSelect({
      id: "prefix-sum-q8",
      concept: "Prefix + hashing",
      difficulty: "application",
      prompt: "In \"subarray sum equals K\", what does prefix[j] - prefix[i] = k tell you?",
      options: [
        "That the element at j is equal to k.",
        "That the subarray between i and j adds up to k.",
        "That the values between i and j are sorted.",
        "That prefix[i] appears only once in the array.",
      ],
      correct: "b",
      explanation:
        "Subtracting two prefix values leaves exactly the total of what lies between them. If that difference is k, the subarray between i and j sums to k.",
    }),
    singleSelect({
      id: "prefix-sum-q9",
      concept: "Prefix + hashing",
      difficulty: "challenge",
      prompt: "The running prefix is 3 and k = 2. Which earlier prefix value would make a matching subarray end here?",
      options: ["5, which is prefix + k", "2, which is k itself", "3, which is the prefix itself", "1, which is prefix - k"],
      correct: "d",
      explanation:
        "A subarray ending here sums to k when an earlier prefix equals the current prefix minus k, here 3 - 2 = 1. That is why the map is checked for (prefix - k).",
    }),
    singleSelect({
      id: "prefix-sum-q10",
      concept: "Complexity",
      difficulty: "application",
      prompt: "Why does the prefix-plus-map approach to counting subarrays run in O(n) instead of O(n²)?",
      options: [
        "It sorts the prefix values before scanning them.",
        "It checks each subarray using a shorter inner loop.",
        "It scans once and looks up one value per step.",
        "It skips subarrays that contain a negative number.",
      ],
      correct: "c",
      explanation:
        "Instead of checking every start and end pair, each step does one lookup of (prefix - k) in a map of counts and then records the current prefix. That is a single pass, O(n).",
    }),
    singleSelect({
      id: "prefix-sum-q11",
      concept: "Off-by-one",
      difficulty: "challenge",
      prompt: "A learner computes sum(i, j) as prefix[j] - prefix[i], where prefix[i] includes nums[i]. What goes wrong?",
      options: [
        "It leaves out nums[i], the first element of the range.",
        "It counts nums[j] twice in the total.",
        "It adds an extra element from before the range.",
        "Nothing is wrong; it gives the range sum.",
      ],
      correct: "a",
      explanation:
        "prefix[i] already contains nums[i], so subtracting it removes that element from the range. The subtraction should use prefix[i - 1], everything before the range.",
    }),
    multiSelect({
      id: "prefix-sum-q12",
      concept: "Building prefix values",
      difficulty: "application",
      prompt: "Which statements about prefix sums are true? Select all that apply.",
      options: [
        "Building the prefix array costs O(1), since it is one line.",
        "prefix[i] is the running total of everything up to and including index i.",
        "A prefix array only speeds up range sums if the array is sorted.",
        "Prefix sums can be paired with a hash map to count subarrays that sum to k.",
      ],
      correct: ["b", "d"],
      explanation:
        "prefix[i] = prefix[i - 1] + nums[i] is a running total, and the module's final problem pairs prefix sums with a map of counts. Building the array takes one O(n) pass, and sorting has nothing to do with it.",
    }),
  ],
}
