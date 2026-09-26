// Module Mastery Quiz — Binary Search (module id "binary-search").
// Written from binary-search-1..5: sorted order as the requirement, ruling out
// half with one comparison, why the steps are logarithmic, the left/right
// invariant and boundary updates, the not-found case, searching on a yes/no
// condition that flips once, and a rotated sorted array. Exact search and
// search-on-answer are kept clearly separate.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

export const binarySearchQuiz: ModuleMasteryQuiz = {
  id: "binary-search-mastery",
  moduleId: "binary-search",
  title: "Binary Search Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "binary-search-q1",
      concept: "Ordering requirement",
      difficulty: "foundation",
      prompt: "Which input can you run a plain binary search on directly?",
      options: [
        "[9, 2, 41, 14, 30]",
        "Any short list.",
        "[2, 9, 14, 30, 41]",
        "A list where only the first half is sorted.",
      ],
      correct: "c",
      explanation:
        "Binary search discards half of the range based on one comparison, and that only works when the values are in order.",
    }),
    singleSelect({
      id: "binary-search-q2",
      concept: "Discard-half reasoning",
      difficulty: "foundation",
      prompt: "The array is sorted, the target is 6, and the middle value is 10. Which positions can you rule out?",
      options: [
        "The middle and everything to its right.",
        "The middle and everything to its left.",
        "Only the middle.",
        "Nothing yet.",
      ],
      correct: "a",
      explanation:
        "Everything to the right of the middle is at least 10, and 6 is smaller. None of those positions can hold the target, so the middle and the whole right side are discarded.",
    }),
    singleSelect({
      id: "binary-search-q3",
      concept: "Complexity",
      difficulty: "foundation",
      prompt: "What is the main reason binary search takes about log₂ n steps?",
      options: [
        "Each comparison removes about half of what is left.",
        "It checks every second element.",
        "It sorts the array as it goes.",
        "It only looks at the first and last values.",
      ],
      correct: "a",
      explanation:
        "You can only halve the range about log₂ n times before nothing is left. For n = 1,000,000 that is about 20 steps, compared with up to a million for a scan.",
    }),
    singleSelect({
      id: "binary-search-q4",
      concept: "Target not found",
      difficulty: "application",
      prompt: "You search [1, 3, 5, 7] for 4. How does the loop know to stop and return -1?",
      options: [
        "It has looked at every element, one after another.",
        "mid lands on the last element of the array, at position 3.",
        "It finds a value larger than 4 somewhere in the array.",
        "The range becomes empty, because left ends up greater than right.",
      ],
      correct: "d",
      explanation:
        "Each step shrinks the range. Here mid = 1 (3 < 4) moves the left pointer to 2, then mid = 2 (5 > 4) moves the right pointer to 1. Now left is greater than right, so nothing is left to search and the answer is -1.",
    }),
    singleSelect({
      id: "binary-search-q5",
      concept: "Discard-half reasoning",
      difficulty: "application",
      prompt: "nums = [1, 3, 5, 7, 9, 11], target = 9, low = 0, high = 5. mid is 2 (the value 5). What are low and high next?",
      options: [
        "low = 3, high = 5",
        "low = 0, high = 1",
        "low = 2, high = 5",
        "low = 0, high = 2",
      ],
      correct: "a",
      explanation:
        "5 is smaller than 9, so the target can't be at position 2 or to its left. The new range starts at mid + 1 = 3 and keeps high = 5.",
    }),
    singleSelect({
      id: "binary-search-q6",
      concept: "Boundary updates",
      difficulty: "challenge",
      prompt: "Why is the update left = mid + 1 (not left = mid) when nums[mid] is smaller than the target?",
      options: [
        "It makes the search run faster than left = mid would.",
        "It keeps the range an even length after every step.",
        "mid is ruled out, and left = mid could loop forever.",
        "Because mid + 1 is always the position of the target.",
      ],
      correct: "c",
      explanation:
        "mid was compared and did not match, so it can be discarded. With left = 0 and right = 1, mid is 0, and left = mid would stay 0 forever.",
    }),
    singleSelect({
      id: "binary-search-q7",
      concept: "Boundary updates",
      difficulty: "challenge",
      prompt: "A learner writes while left < right instead of left <= right. Which search returns the wrong answer?",
      code: "while left < right:\n    mid = (left + right) // 2\n    ...",
      options: [
        "[], target 5",
        "[5], target 5",
        "[1, 2, 3], target 10",
        "[2, 4], target 9",
      ],
      correct: "b",
      explanation:
        "With one element, left and right are both 0, so left < right is false and the loop never checks it. It returns -1 even though 5 is there. The other three searches correctly return -1 either way.",
    }),
    singleSelect({
      id: "binary-search-q8",
      concept: "Monotonic conditions",
      difficulty: "application",
      prompt:
        "For x from 1 to 10, the check \"x² is at least 30\" gives No for 1 to 5 and Yes for 6 to 10. Why does a No at x = 5 tell you a lot?",
      options: [
        "It means x = 5 is the answer we are looking for.",
        "It means every larger x is No as well, so the answer is left.",
        "Every smaller x is No too, so the first Yes must be to the right.",
        "It tells you nothing until you also check x = 6.",
      ],
      correct: "c",
      explanation:
        "The answers change direction only once, from No to Yes. That is called a monotonic condition. A No at 5 means everything before 5 is also No, so the first Yes must be to the right.",
    }),
    singleSelect({
      id: "binary-search-q9",
      concept: "Monotonic conditions",
      difficulty: "challenge",
      prompt: "You want the FIRST x where a yes/no check turns Yes. At mid the check says No. What do you do?",
      options: [
        "Return mid as the answer, since it is the first check.",
        "Search to the left of mid to look for an earlier Yes.",
        "Stop, because the answer does not exist in this range.",
        "Search to the right of mid; nothing at or before mid can be Yes.",
      ],
      correct: "d",
      explanation:
        "The check flips from No to Yes only once. A No at mid means every position up to mid is also No, so the first Yes is somewhere to the right.",
    }),
    singleSelect({
      id: "binary-search-q10",
      concept: "Monotonic conditions",
      difficulty: "application",
      prompt: "Which of these is a search-on-answer problem, rather than looking for a value in an array?",
      options: [
        "Checking whether 9 is in the array [1, 3, 5, 9].",
        "Finding the smallest x in 1..10 where x² is at least 30.",
        "Reversing a sorted array of numbers using swaps.",
        "Adding up all of the values in a sorted array.",
      ],
      correct: "b",
      explanation:
        "Search on answer means binary searching over the possible answers themselves, using a check that flips once. Looking for 9 in a sorted array is an exact search over positions.",
    }),
    singleSelect({
      id: "binary-search-q11",
      concept: "Rotated arrays",
      difficulty: "challenge",
      prompt:
        "In [4, 5, 6, 7, 0, 1, 2] (all values unique), left is 0, right is 6, and mid is 3 (the value 7). Which side of mid is sorted?",
      options: [
        "The right side, from 7 down to the end at 2.",
        "The left side, 4 to 7, since nums[left] ≤ nums[mid].",
        "Neither side is sorted, because of the rotation.",
        "The whole array is sorted, just starting at 4.",
      ],
      correct: "b",
      explanation:
        "The array was rotated, so it is not sorted overall, but at least one side of mid still is. Here 4 ≤ 7, so the left side is sorted. The drop from 7 to 0 is on the right.",
    }),
    multiSelect({
      id: "binary-search-q12",
      concept: "Ordering requirement",
      difficulty: "application",
      prompt: "Which statements about binary search are true? Select all that apply.",
      options: [
        "It needs sorted data, or a yes/no condition that flips only once.",
        "It can find a target in about O(log n) steps.",
        "After each comparison it still has to check both halves.",
        "It works on unsorted data as long as the array is small.",
      ],
      correct: ["a", "b"],
      explanation:
        "Binary search relies on order (or a one-way condition) so one comparison can discard half of the range. That is what gives O(log n). It never needs to check both halves.",
    }),
  ],
}
