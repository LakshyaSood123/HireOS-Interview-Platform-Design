// Binary Search — Pattern Meadows.

import type { Checkpoint, Module } from "../types"
import { binarySearchQuiz } from "./quizzes/binarySearchQuiz"

const mentalModel: Checkpoint = {
  id: "binary-search-1",
  title: "Binary Search Mental Model",
  subtitle: "Halving the search space",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Binary Search Mental Model",
    theory: [
      {
        heading: "One comparison rules out a half",
        body: "Take the sorted array [1, 4, 7, 10, 13, 18, 25] and target 18. Look at the middle value, 10. Can 18 be anywhere to the left of 10? No. The array is sorted, so every value to the left is at most 10, and 18 is bigger. That whole left half, and 10 itself, can be discarded with one comparison. Repeat on [13, 18, 25]: its middle is 18, found.",
      },
      {
        heading: "Why it takes so few steps",
        body: "Each comparison removes half of what remains, so you can only halve about log₂(n) times before nothing is left. That is O(log n): for n = 1,000,000 it is about 20 steps, compared with up to a million for a scan. Unlike two pointers, binary search can discard a whole half at once because the ordering gives stronger information.",
      },
      {
        heading: "What to watch",
        body: "The animation runs the same reasoning on [-1, 0, 3, 5, 9, 12], looking for 9. It labels the two ends of the remaining range low and high; later lessons call them left and right. Before each step, decide which half can be removed and why, then check your answer against the step.",
      },
    ],
    animation: {
      id: "binary-search-decision",
    },
    quickCheck: {
      question: "You have a sorted array, and the middle value is smaller than the target. Which part of the array can no longer contain the target?",
      options: [
        "Everything to the right of the middle",
        "Only the middle value itself",
        "Nothing can be ruled out until both halves are checked",
        "The middle value and everything to its left",
      ],
      correctIndex: 3,
      explanation: "The array is sorted, so everything at or left of the middle is no larger than the middle value, which is already smaller than the target. None of those positions can hold the target, so the search continues only to the right of the middle.",
    },
  },
}

const searchBoundaries: Checkpoint = {
  id: "binary-search-2",
  title: "Search Boundaries",
  subtitle: "left, right, mid — and off-by-one care",
  type: "lesson",
  xp: 30,
  prerequisites: [mentalModel.id],
  workspace: {
    title: "Search Boundaries",
    theory: [
      {
        heading: "Keep one promise",
        body: "The whole method rests on this: if the target exists, it is somewhere between left and right, inclusive. Every step must shrink the range while keeping that promise true. A statement that stays true on every step of a loop is called an invariant.",
      },
      {
        heading: "Why left <= right",
        body: "Suppose left and right are both 3. One value is still a candidate, so the loop must run once more to check it. With left < right, it would stop early. Only when left > right is the range truly empty. Try [2, 5] with target 5: mid is 0, 2 < 5, left becomes 1, and left = right = 1 still needs its check.",
      },
      {
        heading: "Why mid + 1 and mid - 1",
        body: "If nums[mid] is smaller than the target, mid has been checked and is wrong, and so is everything to its left, so the new range starts at mid + 1. Using left = mid could leave the range unchanged and loop forever: with left = 0 and right = 1, mid is 0 and left = mid stays 0. The same reasoning gives right = mid - 1.",
      },
      {
        heading: "What to watch",
        body: "In the animation, watch which indices are discarded after each move. It calls the range ends low and high; they are the same as left and right here. The Python example on this page is the same loop, written out.",
      },
    ],
    animation: {
      id: "binary-search-decision",
      title: "Trace left, right, and mid without off-by-one mistakes",
    },
    codeExamples: [
      {
        language: "python",
        code: `def binarySearch(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      },
    ],
  },
}

const searchOnCondition: Checkpoint = {
  id: "binary-search-3",
  title: "Search on Answer / Condition",
  subtitle: "Binary search beyond plain arrays",
  type: "lesson",
  xp: 30,
  prerequisites: [searchBoundaries.id],
  workspace: {
    title: "Search on Answer / Condition",
    theory: [
      {
        heading: "A yes or no question over a range",
        body: "Take x from 1 to 10 and ask: is x² at least 30? For x = 1 to 5 the answer is No, because the squares are 1, 4, 9, 16 and 25. For x = 6 to 10 the answer is Yes, because the squares are 36, 49, 64, 81 and 100. Written out: No No No No No Yes Yes Yes Yes Yes. The answers change direction only once, and we want the first Yes.",
      },
      {
        heading: "Why that helps",
        body: "When the answers switch once and never switch back, the condition is called monotonic. Then one check tells you a lot. If x = 5 is a No, every smaller x is a No too, so the first Yes must be to the right. No sorted array is needed; you search over the possible answers themselves.",
      },
      {
        heading: "Keep the candidate",
        body: "Write a function check(x) and search over x. If check(mid) is Yes, mid might be the first Yes, so remember it and keep looking to its left. If it is No, look to the right. In the animation, predict whether each check sends the search left or right before you step.",
      },
    ],
    animation: {
      id: "binary-search-monotonic-condition",
      title: "Find the first true value of a monotonic condition",
    },
    quickCheck: {
      question: "For x from 1 to 10, the check \"x² is at least 30\" gives No for 1 to 5 and Yes for 6 to 10. You test x = 8 and get Yes. What is the best next step?",
      options: [
        "Return 8, because it is a Yes",
        "Remember 8 as a candidate and look at smaller values, since the first Yes may be earlier",
        "Look only at values above 8, because Yes answers continue to the right",
        "Test every value from 1 to 10 to be sure",
      ],
      correctIndex: 1,
      explanation: "A Yes at 8 does not make 8 the first Yes. Because the answers are No and then Yes, the first Yes could be at 8 or somewhere to its left (here it is 6). Keeping 8 as a candidate and searching left finds it. Checking every value would work but throws away the benefit of the one-way pattern.",
    },
    learnMore: "This idea reaches problems that do not look like searching, such as finding the smallest capacity, speed or size that still satisfies a rule. If you can write a check that flips from No to Yes only once, you can binary search for the switch point.",
  },
}

const codeLab: Checkpoint = {
  id: "binary-search-4",
  title: "Binary Search Code Lab",
  subtitle: "The classic loop",
  type: "challenge",
  xp: 40,
  prerequisites: [searchOnCondition.id],
  workspace: {
    title: "Binary Search Code Lab",
    theory: [
      {
        heading: "Trace it before you code",
        body: "Take [1, 3, 5, 7] and target 4. left = 0, right = 3, mid = 1: 3 is smaller, so left = 2. Now mid = 2: 5 is larger, so right = 1. left is now greater than right, so the range is empty and the answer is -1. Now write that same loop from checkpoint 2 yourself; if you get stuck, revisit the Python example there.",
      },
      {
        heading: "Edge cases fall out of the loop",
        body: "An empty array gives right = -1, so left <= right is false immediately and you return -1. A one-element array runs the loop once.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def binarySearch(nums, target):
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1`,
      },
    ],
    codingActivity: {
      prompt: "Implement binarySearch(nums, target) that returns the index of target in a sorted array nums, or -1 if it isn't present.",
      constraints: ["0 ≤ length of nums ≤ 10^4", "nums is sorted in ascending order with unique values"],
      functionName: "binarySearch",
      requiredKeywords: ["mid", "while"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def binarySearch(nums, target):\n    # your code here\n    pass\n",
        cpp: "int binarySearch(vector<int>& nums, int target) {\n    // your code here\n}\n",
        java: "int binarySearch(int[] nums, int target) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Target present", input: "nums=[-1,0,3,5,9,12], target=9", expected: "4" },
        { id: "v2", description: "Target absent", input: "nums=[-1,0,3,5,9,12], target=2", expected: "-1" },
        { id: "v3", description: "Single element, found", input: "nums=[5], target=5", expected: "0" },
      ],
      hiddenTests: [
        { id: "h1", description: "Target at start", input: "nums=[1,2,3,4,5], target=1", expected: "0" },
        { id: "h2", description: "Target at end", input: "nums=[1,2,3,4,5], target=5", expected: "4" },
        { id: "h3", description: "Empty array", input: "nums=[], target=1", expected: "-1" },
      ],
      hint: "Keep left and right boundaries, compute mid each iteration, and narrow with left = mid + 1 or right = mid - 1 based on the comparison.",
      mistakeFeedback: "A linear scan returns correct answers in O(n); this task is about halving the range instead. If a result is wrong, check that the loop runs while left <= right (so single-element and empty arrays work) and that you move with mid + 1 and mid - 1 rather than mid.",
      demoSolution: {
        python: "def binarySearch(nums, target):\n    if not nums:\n        return -1\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        elif nums[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n",
        cpp: "int binarySearch(vector<int>& nums, int target) {\n    if (nums.empty()) return -1;\n    int left = 0, right = (int)nums.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n",
        java: "int binarySearch(int[] nums, int target) {\n    if (nums.length == 0) return -1;\n    int left = 0, right = nums.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        else if (nums[mid] < target) left = mid + 1;\n        else right = mid - 1;\n    }\n    return -1;\n}\n",
      },
    },
  },
  questionIds: ["q-binary-search"],
}

const mastery: Checkpoint = {
  id: "binary-search-5",
  title: "Binary Search Interview Challenge",
  subtitle: "Search in a rotated sorted array — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Binary Search Interview Challenge",
    theory: [
      {
        heading: "A rotated array is still half sorted",
        body: "Rotating [0, 1, 2, 4, 5, 6, 7] gives [4, 5, 6, 7, 0, 1, 2]. The whole array is no longer sorted, but when values are unique, at least one side around mid still is. Here mid is 3, with value 7. The left side, 4 to 7, is sorted, because nums[left] = 4 is at most nums[mid] = 7. The drop from 7 to 0 is on the right.",
      },
      {
        heading: "Decide, then discard",
        body: "First decide which side is sorted, then check whether the target lies inside its range. If so, search there; if not, search the other side. For target 0, the sorted left side covers 4 to 7 and excludes 0, so discard it. In what remains, [0, 1, 2], the left side 0 to 1 is sorted and contains 0. Search there and find 0 at index 4.",
      },
      {
        heading: "Still O(log n)",
        body: "Each step still discards about half the array; the only new work is deciding which side to trust. This relies on unique values, which the problem promises.",
      },
    ],
    codingActivity: {
      prompt: "Implement searchRotated(nums, target) that finds target's index in a sorted array that has been rotated at an unknown pivot, in O(log n) time, or returns -1 if it isn't present.",
      constraints: ["1 ≤ length of nums ≤ 5000", "All values are unique"],
      functionName: "searchRotated",
      requiredKeywords: ["mid", "while"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def searchRotated(nums, target):\n    # your code here\n    pass\n",
        cpp: "int searchRotated(vector<int>& nums, int target) {\n    // your code here\n}\n",
        java: "int searchRotated(int[] nums, int target) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Target in right half", input: "nums=[4,5,6,7,0,1,2], target=0", expected: "4" },
        { id: "v2", description: "Target absent", input: "nums=[4,5,6,7,0,1,2], target=3", expected: "-1" },
        { id: "v3", description: "No rotation", input: "nums=[1,2,3,4,5], target=3", expected: "2" },
      ],
      hiddenTests: [
        { id: "h1", description: "Single element, found", input: "nums=[1], target=1", expected: "0" },
        { id: "h2", description: "Target at pivot", input: "nums=[6,7,0,1,2,4,5], target=0", expected: "2" },
        { id: "h3", description: "Single element, absent", input: "nums=[1], target=0", expected: "-1" },
      ],
      hint: "At each step, determine whether the left half (nums[left..mid]) or right half (nums[mid..right]) is sorted, then check if the target lies within that sorted half's range.",
      mistakeFeedback: "A linear scan finds the target too, in O(n); the goal here is the O(log n) approach. If a result is wrong, check that you first decide which side of mid is sorted, and that the range test includes the sorted side's left end (nums[left] <= target < nums[mid]) but not mid itself, which you already compared.",
      demoSolution: {
        python: "def searchRotated(nums, target):\n    if not nums:\n        return -1\n    left, right = 0, len(nums) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[left] <= nums[mid]:\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        else:\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n    return -1\n",
        cpp: "int searchRotated(vector<int>& nums, int target) {\n    if (nums.empty()) return -1;\n    int left = 0, right = (int)nums.size() - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[left] <= nums[mid]) {\n            if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n            else left = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n            else right = mid - 1;\n        }\n    }\n    return -1;\n}\n",
        java: "int searchRotated(int[] nums, int target) {\n    if (nums.length == 0) return -1;\n    int left = 0, right = nums.length - 1;\n    while (left <= right) {\n        int mid = left + (right - left) / 2;\n        if (nums[mid] == target) return mid;\n        if (nums[left] <= nums[mid]) {\n            if (nums[left] <= target && target < nums[mid]) right = mid - 1;\n            else left = mid + 1;\n        } else {\n            if (nums[mid] < target && target <= nums[right]) left = mid + 1;\n            else right = mid - 1;\n        }\n    }\n    return -1;\n}\n",
      },
    },
  },
  questionIds: ["q-search-rotated-sorted-array"],
}

export const binarySearchModule: Module = {
  id: "binary-search",
  title: "Binary Search",
  description: "Halving the search space — on sorted arrays, and on any monotonic condition.",
  icon: "🔍",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [mentalModel, searchBoundaries, searchOnCondition, codeLab, mastery],
  quiz: binarySearchQuiz,
}
