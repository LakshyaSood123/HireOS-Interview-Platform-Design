// Binary Search — Pattern Meadows.

import type { Checkpoint, Module } from "../types"

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
        heading: "Cut the space in half, every time",
        body: "On sorted data, check the middle element — if it's not what you want, you know the answer (if it exists) is entirely in the left half or entirely in the right half. Discard the other half completely.",
      },
      {
        heading: "Why it's O(log n)",
        body: "Halving the search space repeatedly means you can only do it ~log₂(n) times before there's nothing left to search — for n = 1,000,000, that's about 20 steps.",
      },
    ],
    quickCheck: {
      question: "What must be true about the data for binary search to work?",
      options: ["It must be an array (not a list)", "It must be sorted (or have a monotonic condition)", "It must contain unique values", "It must be small"],
      correctIndex: 1,
      explanation: "Binary search relies on being able to discard half the space based on one comparison — that only works if the data is sorted, or if there's some other monotonic (one-directional) condition.",
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
        heading: "The standard loop",
        body: "left = 0, right = length - 1. While left <= right: compute mid, compare, then move left = mid + 1 or right = mid - 1.",
      },
      {
        heading: "Off-by-one is the #1 bug",
        body: "Using < instead of <=, or forgetting the +1/-1 when narrowing, are the most common binary-search bugs — trace through a 2-element array by hand if you're unsure your boundaries are right.",
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
        heading: "You don't need a sorted array",
        body: "Any monotonic condition — a 'yes' answer up to some point and 'no' after it, or vice versa — can be binary searched, even over a range of possible answers rather than array indices.",
      },
      {
        heading: "The shape of the search",
        body: "Define a check(x) that's monotonic (true for all x below some threshold, false above — or the reverse), then binary search over x itself to find that threshold.",
      },
    ],
    learnMore: "This 'search on the answer' framing is what makes binary search applicable to problems that don't look like searching at all — minimizing a maximum, or finding the smallest value that satisfies a constraint.",
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
        heading: "Your turn",
        body: "Implement the standard binary search loop from checkpoint 2 yourself.",
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
      constraints: ["1 ≤ length of nums ≤ 10^4", "nums is sorted in ascending order with unique values"],
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
      hint: "Keep left and right boundaries, compute mid each iteration, and narrow left = mid + 1 or right = mid - 1 based on the comparison.",
      mistakeFeedback: "This looks like it's scanning linearly through nums instead of narrowing the search space by comparing against the middle element each step.",
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
        heading: "One half is always sorted",
        body: "Even after rotation, at least one of the two halves around mid is fully sorted. Check which half is sorted, then check whether the target falls in that sorted half's range — if not, search the other half.",
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
      mistakeFeedback: "This looks like it's assuming the whole array is sorted (ignoring the rotation) rather than first figuring out which half around mid is actually sorted.",
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
}
