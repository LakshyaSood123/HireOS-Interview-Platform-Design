// Foundations / Complexity & Problem Solving — authored directly in the new
// content model, replacing the old legacy Trailhead Grove TrailNodes (1-3).
// Module id stays "foundations" (NOT renamed to "complexity-problem-solving")
// so the scenic map's existing tile in BiomeTrailMap.tsx keeps resolving it
// correctly — see LEARNING_ENGINE_ARCHITECTURE.md's module-id note.

import type { Checkpoint, Module } from "../types"
import { complexityQuiz } from "./quizzes/complexityQuiz"

const bigO: Checkpoint = {
  id: "foundations-1",
  title: "Big-O & Cost of Operations",
  subtitle: "How algorithms scale",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Big-O & Cost of Operations",
    theory: [
      {
        heading: "Growth, not stopwatch time",
        body: "Big-O describes how the amount of work grows as the input size n grows. The same code runs at different speeds on different machines, so we ignore seconds and look at the pattern of growth instead.",
      },
      {
        heading: "Compare the growth",
        body: "With n = 10, an O(n) solution does about 10 steps and an O(n²) solution about 100. With n = 1,000, that becomes 1,000 versus 1,000,000. These numbers show how fast the work grows; they are not predicted run times. When the input gets 10 times bigger, O(n) work grows about 10 times and O(n²) work about 100 times.",
      },
      {
        heading: "The rates you will meet",
        body: "O(1) does the same work whatever n is. O(log n) grows very slowly, because each step throws away half of what is left. O(n) is one pass over the input. O(n log n) is typical of efficient sorting. O(n²) usually means a loop inside a loop over the same input.",
      },
      {
        heading: "Space, and what to watch",
        body: "Space complexity counts the extra memory you allocate, not the input you were given. Copying n numbers into a new array costs O(n) extra space; one running-maximum variable costs O(1). In the animation, watch the gap between the O(n) line and the O(n²) line at each of the three input sizes.",
      },
    ],
    animation: {
      id: "complexity-growth",
    },
    quickCheck: {
      question: "A solution takes about 100 steps when n = 10 and about 10,000 steps when n = 100. Which growth rate fits best?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(1)"],
      correctIndex: 2,
      explanation: "The input grew 10 times and the work grew 100 times, which is 10². Linear growth would have given only about 1,000 steps, O(n log n) grows much more slowly than O(n²), and O(1) would not have grown at all.",
    },
  },
}

const readingConstraints: Checkpoint = {
  id: "foundations-2",
  title: "Reading Constraints",
  subtitle: "Let the input size pick your approach",
  type: "lesson",
  xp: 30,
  prerequisites: [bigO.id],
  workspace: {
    title: "Reading Constraints",
    theory: [
      {
        heading: "Limits hint at the work you can afford",
        body: "Problems state limits such as \"n ≤ 10^5\". Read that number as a hint about how much work your program can afford. As a very rough mental estimate, ideas that need far more than about 10^8 simple steps often run into trouble, but this is a guide and not a threshold.",
      },
      {
        heading: "One n, three costs",
        body: "Suppose n = 10^6. An O(n) solution takes about 10^6 steps and an O(n log n) solution about 2×10^7. Both are often plausible under typical interview limits. An O(n²) solution takes about 10^12, which is very likely too much. Nested loops over the same input are where O(n²) usually comes from.",
      },
      {
        heading: "A guide, not a law",
        body: "What is actually feasible also depends on the language, the constant factors hidden inside Big-O, how expensive each step is, and the time limit. Use limits to rule out ideas early, not to memorize cut-offs. When n is tiny, say 20, even a slow idea can be fine.",
      },
    ],
    quickCheck: {
      question: "A problem says n can be up to 200,000, and your first idea compares every pair of elements. What should the limit make you think?",
      options: [
        "That is about 2×10^10 pairs, so look for a faster approach before coding",
        "Comparing every pair is fine, because it is the simplest approach that is correct",
        "The limit only tells you how much memory you may use, not how much time",
        "Even an O(n log n) idea would be too slow at this size, so give up on speed",
      ],
      correctIndex: 0,
      explanation: "With n = 200,000 there are roughly n²/2 = 2×10^10 pairs, well beyond the rough 10^8 mark. An O(n log n) approach would take only about 3.5×10^6 steps. This is only a mental estimate, but it is enough to tell you the pairwise idea needs a rethink.",
    },
  },
}

const problemSolvingPattern: Checkpoint = {
  id: "foundations-3",
  title: "Problem-Solving Pattern",
  subtitle: "From a simple approach to a better one",
  type: "lesson",
  xp: 30,
  prerequisites: [readingConstraints.id],
  workspace: {
    title: "Problem-Solving Pattern",
    theory: [
      {
        heading: "A repeatable order",
        body: "On a new problem, understand it first and trace a small example by hand. Then describe a simple approach that is correct, work out its time and space cost, and look for repeated work. Improve it only if the constraints call for it. A simple approach is a useful baseline and a fallback, but you do not have to code it first if you can already see a better correct one.",
      },
      {
        heading: "What repeated work looks like",
        body: "Say you want the running total at each position of [2, 5, 1]. Recomputing each total from scratch adds 2, then 2 + 5, then 2 + 5 + 1, so 2 + 5 is calculated twice. Keeping one running total removes the repetition. When a loop keeps redoing the same calculation, store the result or track a value as you go.",
      },
      {
        heading: "Then name the pattern",
        body: "The fix often matches a known pattern: hashing for repeated lookups, two pointers for repeated pair checks on sorted data, binary search for repeated scans of sorted data. The next modules teach these one at a time.",
      },
    ],
    learnMore: "Every Code Lab in this course follows this rhythm: understand a small example, get a correct approach, find what it repeats, then improve it. Starting from a simple correct approach helps when you are stuck. When you can already see the better one, go straight to it.",
    quickCheck: {
      question: "Your correct solution compares every pair in an array, and n can reach 10^5. What is the most useful next step?",
      options: [
        "Submit it, because a correct answer matters more than its speed",
        "Rewrite it with a fancier data structure right away, whatever the problem is",
        "Look for repeated work in those comparisons and ask what could be stored instead",
        "Check it on a few small inputs and move on to the next problem",
      ],
      correctIndex: 2,
      explanation: "With n = 10^5 there are about 5×10^9 pairs, which is probably too slow. Finding what those comparisons repeat tells you what to store or restructure. Reaching for a tool before you know what is repeated is guessing, not analysis.",
    },
  },
}

const miniAnalysisChallenge: Checkpoint = {
  id: "foundations-4",
  title: "Mini Analysis Challenge",
  subtitle: "Put O(n) into practice",
  type: "challenge",
  xp: 40,
  prerequisites: [problemSolvingPattern.id],
  workspace: {
    title: "Mini Analysis Challenge",
    theory: [
      {
        heading: "Keep the best value so far",
        body: "Many \"find the biggest or smallest\" problems need only one pass and one variable. Take [3, 7, 2, 9]. Start with best = 3, the first value. See 7: it is larger, so best = 7. See 2: it is smaller, so best stays 7. See 9: larger, so best = 9. Each number is looked at once, so the time is O(n), and one variable means O(1) extra space.",
      },
      {
        heading: "Where to start",
        body: "Start best at the first element, not at 0. If every value is negative, a starting best of 0 would beat all of them and give the wrong answer.",
      },
    ],
    codingActivity: {
      prompt: "Implement findMax(nums) that returns the largest value in a non-empty list of integers, in O(n) time and O(1) extra space.",
      constraints: ["1 ≤ length of nums ≤ 10^5", "Values may be negative"],
      functionName: "findMax",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def findMax(nums):\n    # your code here\n    pass\n",
        cpp: "int findMax(vector<int>& nums) {\n    // your code here\n}\n",
        java: "int findMax(int[] nums) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Mixed values", input: "[3,7,2,9,4]", expected: "9" },
        { id: "v2", description: "Single element", input: "[5]", expected: "5" },
        { id: "v3", description: "All negative", input: "[-3,-1,-7]", expected: "-1" },
      ],
      hiddenTests: [
        { id: "h1", description: "Ascending run", input: "[1,2,3,4,5]", expected: "5" },
        { id: "h2", description: "Descending run", input: "[9,8,7,6]", expected: "9" },
        { id: "h3", description: "Repeated max values", input: "[4,4,4]", expected: "4" },
      ],
      hint: "Keep a running 'best so far' variable, start it at the first element, and update it whenever you see something larger.",
      mistakeFeedback: "If a result is wrong, check where best starts. Starting at 0 fails when every value is negative. Also make sure best is updated inside the loop, and only when the current value is larger.",
      demoSolution: {
        python: "def findMax(nums):\n    if not nums:\n        return None\n    best = nums[0]\n    for n in nums:\n        if n > best:\n            best = n\n    return best\n",
        cpp: "int findMax(vector<int>& nums) {\n    int best = nums[0];\n    for (int n : nums) {\n        if (n > best) best = n;\n    }\n    return best;\n}\n",
        java: "int findMax(int[] nums) {\n    int best = nums[0];\n    for (int n : nums) {\n        if (n > best) best = n;\n    }\n    return best;\n}\n",
      },
    },
  },
  questionIds: ["q-foundations-complexity-analysis"],
}

const foundationsMastery: Checkpoint = {
  id: "foundations-5",
  title: "Foundations Mastery",
  subtitle: "Choosing the right complexity",
  type: "boss",
  xp: 40,
  masteryXp: 100,
  prerequisites: [miniAnalysisChallenge.id],
  workspace: {
    title: "Foundations Mastery",
    theory: [
      {
        heading: "Trade a little memory for time",
        body: "Comparing every pair to find a duplicate costs O(n²). Instead, remember the values you have already seen and ask one question for each new value: is it already in there? That is one pass, at the price of O(n) extra space.",
      },
      {
        heading: "A preview of hashing",
        body: "Take nums = [4, 2, 7, 2] and an empty collection called seen. 4 is not in seen, so add it. 2 is not in seen, so add it. 7, add it. Then 2 arrives and is already in seen, so a duplicate exists. We are borrowing one idea from the Hashing module here: a set answers \"is this value in here?\" quickly, in about constant time on average. That module explains why, and when to use sets and maps.",
      },
    ],
    codingActivity: {
      prompt: "Implement hasDuplicate(nums) that returns true if any value appears more than once. Aim for one pass in O(n) expected time by remembering seen values in a set, instead of comparing every pair.",
      constraints: ["0 ≤ length of nums ≤ 10^5"],
      functionName: "hasDuplicate",
      requiredKeywords: ["set", "for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def hasDuplicate(nums):\n    # your code here\n    pass\n",
        cpp: "bool hasDuplicate(vector<int>& nums) {\n    // your code here\n}\n",
        java: "boolean hasDuplicate(int[] nums) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Has a duplicate", input: "[1,2,3,2]", expected: "true" },
        { id: "v2", description: "No duplicates", input: "[1,2,3,4]", expected: "false" },
        { id: "v3", description: "Single element", input: "[7]", expected: "false" },
      ],
      hiddenTests: [
        { id: "h1", description: "Duplicate at the ends", input: "[5,1,2,5]", expected: "true" },
        { id: "h2", description: "All identical", input: "[3,3,3]", expected: "true" },
        { id: "h3", description: "Empty list", input: "[]", expected: "false" },
      ],
      hint: "Add each value to a set as you scan. If a value is already in the set before you add it, you have found a duplicate.",
      mistakeFeedback: "Comparing every pair also finds duplicates, but it costs O(n²); this checkpoint practices the set version. If your result is wrong, check that you test whether the value is already in the set before you add it, and that an empty list returns false.",
      demoSolution: {
        python: "def hasDuplicate(nums):\n    if not nums:\n        return False\n    seen = set()\n    for n in nums:\n        if n in seen:\n            return True\n        seen.add(n)\n    return False\n",
        cpp: "bool hasDuplicate(vector<int>& nums) {\n    if (nums.empty()) return false;\n    unordered_set<int> seen;\n    for (int n : nums) {\n        if (seen.count(n)) return true;\n        seen.insert(n);\n    }\n    return false;\n}\n",
        java: "boolean hasDuplicate(int[] nums) {\n    if (nums.length == 0) return false;\n    Set<Integer> seen = new HashSet<>();\n    for (int n : nums) {\n        if (seen.contains(n)) return true;\n        seen.add(n);\n    }\n    return false;\n}\n",
      },
    },
  },
}

export const foundationsModule: Module = {
  id: "foundations",
  title: "Complexity & Problem Solving",
  description: "Big-O reasoning, reading constraints, and a repeatable way to move from a simple correct approach to a better one.",
  icon: "🌱",
  accentColor: "#79A84B",
  contentKind: "workspace",
  checkpoints: [bigO, readingConstraints, problemSolvingPattern, miniAnalysisChallenge, foundationsMastery],
  quiz: complexityQuiz,
}
