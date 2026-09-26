// Module Mastery Quiz — Sliding Window (module id "sliding-window").
// Written from sliding-window-1..5: the recognition cues, why a window beats
// checking every range, fixed versus variable windows, the running window
// state, "expand right, shrink left while invalid", the maxSumFixedWindow
// code, and the longest-substring-without-repeats set-and-while loop.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const LONGEST_SUBSTRING_CODE =
  "seen = set()\nleft = 0\nbest = 0\nfor right in range(len(s)):\n    while s[right] in seen:\n        seen.remove(s[left])\n        left += 1\n    seen.add(s[right])\n    best = max(best, right - left + 1)"

const FIXED_WINDOW_CODE =
  "window_sum = sum(nums[:k])\nbest = window_sum\nfor i in range(k, len(nums)):\n    window_sum += nums[i] - nums[i - k]\n    best = max(best, window_sum)"

export const slidingWindowQuiz: ModuleMasteryQuiz = {
  id: "sliding-window-mastery",
  moduleId: "sliding-window",
  title: "Sliding Window Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "sliding-window-q1",
      concept: "Recognition cues",
      difficulty: "foundation",
      prompt: "Which problem is the best fit for a sliding window?",
      options: [
        "Check whether a binary tree is height-balanced or not.",
        "Find the longest substring with no repeated characters.",
        "Sort an array of numbers into ascending order first.",
        "Find the smallest number in an array of integers.",
      ],
      correct: "b",
      explanation:
        "\"Longest substring\" asks about a contiguous range with a running condition (no repeats), which is the shape a window handles. The other tasks are not about a contiguous range of the input.",
    }),
    singleSelect({
      id: "sliding-window-q2",
      concept: "Why windows are fast",
      difficulty: "foundation",
      prompt: "Why can a window solve these problems faster than checking every contiguous range?",
      options: [
        "It moves one element at a time, so one pass over the array is enough.",
        "It sorts the array first, so most ranges can be skipped.",
        "It stores the answer for every range in a table before it starts.",
        "It only checks the ranges that begin at the first element.",
      ],
      correct: "a",
      explanation:
        "Checking every contiguous range is O(n²) or worse. A window only grows or shrinks by one element at a time, so the whole array is processed in O(n).",
    }),
    singleSelect({
      id: "sliding-window-q3",
      concept: "Fixed window",
      difficulty: "application",
      prompt:
        "nums = [2, 1, 5, 1, 3, 2] and k = 3. The first window [2, 1, 5] sums to 8. How do you get the next window's sum?",
      options: [
        "Add the new 1 and keep the 2, giving 10.",
        "Keep 8, because the window size does not change.",
        "Add the new 1, subtract the old 2, giving 7.",
        "Sum only the two middle values again, giving 6.",
      ],
      correct: "c",
      explanation:
        "The window moves one step: nums[3] = 1 enters and nums[0] = 2 leaves, so the sum goes from 8 to 8 + 1 - 2 = 7. That is the slide used in maxSumFixedWindow.",
    }),
    singleSelect({
      id: "sliding-window-q4",
      concept: "Variable window",
      difficulty: "foundation",
      prompt: "What makes a variable-size window different from a fixed-size one?",
      options: [
        "Its width k is given in the problem statement.",
        "It always moves two elements forward at each step.",
        "It starts over from index 0 whenever a constraint breaks.",
        "Its width changes as the constraint is met or broken.",
      ],
      correct: "d",
      explanation:
        "A fixed window has its width given, like \"any 3 consecutive elements\". A variable window grows by moving right and shrinks by moving left, so its size is part of the answer.",
    }),
    singleSelect({
      id: "sliding-window-q5",
      concept: "Running state",
      difficulty: "application",
      prompt: "One element leaves the window on the left. What should happen to the running sum or count?",
      options: [
        "Nothing, because only new elements change it.",
        "That element's contribution is removed from it.",
        "It is rebuilt by rescanning the whole window.",
        "It is reset to zero and the window restarts.",
      ],
      correct: "b",
      explanation:
        "The window keeps a running summary: add what enters, remove what leaves, and never rescan the whole window.",
    }),
    singleSelect({
      id: "sliding-window-q6",
      concept: "Shrink until valid",
      difficulty: "application",
      prompt: "You expand right and the window now breaks the constraint. What do you do next?",
      options: [
        "Shrink from the left until it is valid again, then record.",
        "Move right once more and check both ends afterward.",
        "Reset left and right back to the first index.",
        "Record the answer now and keep the window as it is.",
      ],
      correct: "a",
      explanation:
        "For a variable window you expand right by one, and while the window violates the constraint you shrink from the left until it is valid again. Only then do you record the answer.",
    }),
    singleSelect({
      id: "sliding-window-q7",
      concept: "Shrink until valid",
      difficulty: "challenge",
      prompt: "This code runs on s = \"abcabcbb\". right reaches index 3, the second 'a'. What happens?",
      code: LONGEST_SUBSTRING_CODE,
      options: [
        "left stays at 0 and the set grows to hold four characters.",
        "left jumps ahead to index 4, skipping over the repeated 'a'.",
        "right moves back to index 0 and the scan starts over again.",
        "The old 'a' leaves the set, left becomes 1, and the new 'a' joins.",
      ],
      correct: "d",
      explanation:
        "The set already holds a, b and c. The while loop removes s[0] = 'a' and moves left to 1, which clears the duplicate. Then the new 'a' is added and the window is \"bca\".",
    }),
    singleSelect({
      id: "sliding-window-q8",
      concept: "Boundary cases",
      difficulty: "application",
      prompt: "What does the longest-substring code return for s = \"bbbbb\"?",
      code: LONGEST_SUBSTRING_CODE,
      options: [
        "5, since the window keeps growing.",
        "0, since every character is a repeat.",
        "1, since each new 'b' shrinks the window.",
        "2, since a single repeat is allowed.",
      ],
      correct: "c",
      explanation:
        "Every new 'b' is already in the set, so the window shrinks until only the new 'b' remains. The best length never gets past 1.",
    }),
    singleSelect({
      id: "sliding-window-q9",
      concept: "Variable window",
      difficulty: "application",
      prompt: "Which problem needs a variable-size window?",
      options: [
        "Find the maximum sum of any 3 consecutive elements.",
        "Find the shortest subarray whose sum is at least K.",
        "Find the sum of the first 3 elements only, once.",
        "Find the largest single value in the array.",
      ],
      correct: "b",
      explanation:
        "In \"shortest subarray with sum at least K\" the window's size is part of the answer, so it has to grow and shrink. \"Any 3 consecutive elements\" gives the width up front, which makes it a fixed window.",
    }),
    singleSelect({
      id: "sliding-window-q10",
      concept: "Complexity",
      difficulty: "application",
      prompt: "A learner sums nums[i:i+k] again for every window. What does that cost, and what fixes it?",
      options: [
        "About O(n × k); slide the sum instead of re-summing.",
        "About O(n); the code is already sliding the window.",
        "About O(k); each window reuses the last window's sum.",
        "About O(n²) always; no version can be faster.",
      ],
      correct: "a",
      explanation:
        "Re-summing k elements for about n windows is O(n × k). Adding the entering element and subtracting the leaving one makes each step O(1), so the whole pass is O(n).",
    }),
    singleSelect({
      id: "sliding-window-q11",
      concept: "Boundary cases",
      difficulty: "challenge",
      prompt: "What does this code return for nums = [4, 2, 1] and k = 3?",
      code: FIXED_WINDOW_CODE,
      options: ["4", "6", "7", "3"],
      correct: "c",
      explanation:
        "k equals the length of the array, so the first window is the whole array and its sum is 7. range(3, 3) is empty, so the loop never runs and best stays 7.",
    }),
    multiSelect({
      id: "sliding-window-q12",
      concept: "Running state",
      difficulty: "application",
      prompt: "Which statements about sliding windows are true? Select all that apply.",
      options: [
        "A variable window shrinks from the left when it breaks a constraint.",
        "A sliding window always needs a hash set to work.",
        "A window keeps a running sum or count instead of rescanning.",
        "A fixed window costs O(n × k) even when it slides.",
      ],
      correct: ["a", "c"],
      explanation:
        "Variable windows expand right and shrink left to stay valid, and the whole point is updating a running summary. A set is just one kind of state (the longest-substring problem uses one), and a properly slid fixed window is O(n).",
    }),
  ],
}
