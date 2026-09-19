// Intervals — Pattern Meadows. 4 checkpoints: like Prefix Sum, the pattern
// is narrow enough that a full 5-checkpoint split would mean padding rather
// than teaching.

import type { Checkpoint, Module } from "../types"

const understandingIntervals: Checkpoint = {
  id: "intervals-1",
  title: "Understanding Intervals",
  subtitle: "A range with a start and an end",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Understanding Intervals",
    theory: [
      {
        heading: "What an interval represents",
        body: "An interval [start, end] represents a range — meeting times, booked rooms, covered spans. Two intervals overlap when one starts before the other ends.",
      },
      {
        heading: "The overlap check",
        body: "Intervals a and b overlap exactly when a.start <= b.end AND b.start <= a.end — worth memorizing, since almost every interval problem uses this condition somewhere.",
      },
    ],
    quickCheck: {
      question: "Do [1, 5] and [4, 8] overlap?",
      options: ["Yes — 4 is within [1, 5]", "No — they have different endpoints", "Only if the array is sorted", "Cannot be determined"],
      correctIndex: 0,
      explanation: "1 ≤ 8 and 4 ≤ 5 both hold, so the overlap condition is satisfied — the intervals share the range [4, 5].",
    },
  },
}

const sortingAndOverlap: Checkpoint = {
  id: "intervals-2",
  title: "Sorting + Overlap",
  subtitle: "Why almost every interval problem starts with a sort",
  type: "lesson",
  xp: 30,
  prerequisites: [understandingIntervals.id],
  workspace: {
    title: "Sorting + Overlap",
    theory: [
      {
        heading: "Sort by start time first",
        body: "Once intervals are sorted by start, you only ever need to compare each interval to the one immediately before it — overlaps with anything further back are impossible.",
      },
      {
        heading: "One pass after sorting",
        body: "After sorting, a single O(n) pass — comparing each interval to the last one you kept — is enough to merge, count overlaps, or detect conflicts.",
      },
    ],
    animation: {
      id: "intervals-merge-overlap",
    },
    codeExamples: [
      {
        language: "python",
        code: `def mergeIntervals(intervals):
    intervals.sort(key=lambda pair: pair[0])
    merged = [intervals[0]]
    for start, end in intervals[1:]:
        if start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
      },
    ],
  },
}

const codeLab: Checkpoint = {
  id: "intervals-3",
  title: "Intervals Code Lab",
  subtitle: "Merge overlapping intervals",
  type: "challenge",
  xp: 40,
  prerequisites: [sortingAndOverlap.id],
  workspace: {
    title: "Intervals Code Lab",
    theory: [
      {
        heading: "Your turn",
        body: "Sort by start time, then walk through merging any interval that overlaps the last one you kept.",
      },
    ],
    codingActivity: {
      prompt: "Implement mergeIntervals(intervals) that merges all overlapping intervals and returns the resulting non-overlapping list, sorted by start time.",
      constraints: ["1 ≤ number of intervals ≤ 10^4"],
      functionName: "mergeIntervals",
      requiredKeywords: ["sort", "for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def mergeIntervals(intervals):\n    # your code here\n    pass\n",
        cpp: "vector<vector<int>> mergeIntervals(vector<vector<int>>& intervals) {\n    // your code here\n}\n",
        java: "int[][] mergeIntervals(int[][] intervals) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Two overlapping pairs", input: "[[1,3],[2,6],[8,10],[15,18]]", expected: "[[1,6],[8,10],[15,18]]" },
        { id: "v2", description: "Adjacent, touching intervals", input: "[[1,4],[4,5]]", expected: "[[1,5]]" },
        { id: "v3", description: "No overlaps", input: "[[1,2],[3,4]]", expected: "[[1,2],[3,4]]" },
      ],
      hiddenTests: [
        { id: "h1", description: "Unsorted input", input: "[[5,6],[1,2],[3,4]]", expected: "[[1,2],[3,4],[5,6]]" },
        { id: "h2", description: "Fully nested interval", input: "[[1,10],[2,3]]", expected: "[[1,10]]" },
        { id: "h3", description: "Single interval", input: "[[1,5]]", expected: "[[1,5]]" },
      ],
      hint: "Sort by start time first. Then, for each interval, merge it into the last kept interval if its start is <= the last kept interval's end; otherwise append it as a new interval.",
      mistakeFeedback: "This looks like it's comparing every pair of intervals directly (O(n²)) instead of sorting first and merging in a single pass against only the last kept interval (O(n log n)).",
      demoSolution: {
        python: "def mergeIntervals(intervals):\n    if not intervals:\n        return []\n    intervals = sorted(intervals, key=lambda x: x[0])\n    merged = [intervals[0]]\n    for start, end in intervals[1:]:\n        last = merged[-1]\n        if start <= last[1]:\n            last[1] = max(last[1], end)\n        else:\n            merged.append([start, end])\n    return merged\n",
        cpp: "vector<vector<int>> mergeIntervals(vector<vector<int>>& intervals) {\n    if (intervals.empty()) return {};\n    sort(intervals.begin(), intervals.end());\n    vector<vector<int>> merged;\n    merged.push_back(intervals[0]);\n    for (int i = 1; i < (int)intervals.size(); i++) {\n        auto& last = merged.back();\n        if (intervals[i][0] <= last[1]) {\n            last[1] = max(last[1], intervals[i][1]);\n        } else {\n            merged.push_back(intervals[i]);\n        }\n    }\n    return merged;\n}\n",
        java: "List<int[]> mergeIntervals(int[][] intervals) {\n    if (intervals.length == 0) return new ArrayList<>();\n    Arrays.sort(intervals, (a, b) -> a[0] - b[0]);\n    List<int[]> merged = new ArrayList<>();\n    merged.add(intervals[0]);\n    for (int i = 1; i < intervals.length; i++) {\n        int[] last = merged.get(merged.size() - 1);\n        if (intervals[i][0] <= last[1]) {\n            last[1] = Math.max(last[1], intervals[i][1]);\n        } else {\n            merged.add(intervals[i]);\n        }\n    }\n    return merged;\n}\n",
      },
    },
  },
  questionIds: ["q-merge-intervals"],
}

const mastery: Checkpoint = {
  id: "intervals-4",
  title: "Intervals Interview Challenge",
  subtitle: "Insert interval — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Intervals Interview Challenge",
    theory: [
      {
        heading: "Three zones, one pass",
        body: "Given the list is already sorted and non-overlapping, walk through in three phases: intervals entirely before the new one (keep as-is), intervals that overlap it (merge into one), and intervals entirely after (keep as-is).",
      },
    ],
    codingActivity: {
      prompt: "Implement insertInterval(intervals, newInterval) that inserts newInterval into a sorted, non-overlapping list of intervals, merging as needed, and returns the resulting list.",
      constraints: ["0 ≤ number of intervals ≤ 10^4", "intervals is sorted by start time and non-overlapping"],
      functionName: "insertInterval",
      requiredKeywords: ["for"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def insertInterval(intervals, newInterval):\n    # your code here\n    pass\n",
        cpp: "vector<vector<int>> insertInterval(vector<vector<int>>& intervals, vector<int>& newInterval) {\n    // your code here\n}\n",
        java: "int[][] insertInterval(int[][] intervals, int[] newInterval) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Overlaps one interval", input: "intervals=[[1,3],[6,9]], new=[2,5]", expected: "[[1,5],[6,9]]" },
        { id: "v2", description: "Overlaps several intervals", input: "intervals=[[1,2],[3,5],[6,7],[8,10],[12,16]], new=[4,8]", expected: "[[1,2],[3,10],[12,16]]" },
        { id: "v3", description: "No overlap, inserted between", input: "intervals=[[1,2],[5,6]], new=[3,4]", expected: "[[1,2],[3,4],[5,6]]" },
      ],
      hiddenTests: [
        { id: "h1", description: "Empty interval list", input: "intervals=[], new=[5,7]", expected: "[[5,7]]" },
        { id: "h2", description: "New interval before all others", input: "intervals=[[3,5],[6,7]], new=[1,2]", expected: "[[1,2],[3,5],[6,7]]" },
        { id: "h3", description: "New interval covers everything", input: "intervals=[[2,3],[4,5]], new=[1,6]", expected: "[[1,6]]" },
      ],
      hint: "Add all intervals ending before newInterval starts, then merge all overlapping intervals into newInterval itself, then add the merged interval and everything remaining.",
      mistakeFeedback: "This looks like it's inserting newInterval and re-sorting/re-merging everything from scratch, rather than taking advantage of the list already being sorted and non-overlapping to do it in one pass.",
      demoSolution: {
        python: "def insertInterval(intervals, newInterval):\n    if not intervals:\n        return [newInterval]\n    result = []\n    i = 0\n    n = len(intervals)\n    while i < n and intervals[i][1] < newInterval[0]:\n        result.append(intervals[i])\n        i += 1\n    start, end = newInterval\n    while i < n and intervals[i][0] <= end:\n        start = min(start, intervals[i][0])\n        end = max(end, intervals[i][1])\n        i += 1\n    result.append([start, end])\n    for j in range(i, n):\n        result.append(intervals[j])\n    return result\n",
        cpp: "vector<vector<int>> insertInterval(vector<vector<int>>& intervals, vector<int>& newInterval) {\n    if (intervals.empty()) return {newInterval};\n    vector<vector<int>> result;\n    int i = 0, n = (int)intervals.size();\n    while (i < n && intervals[i][1] < newInterval[0]) {\n        result.push_back(intervals[i]);\n        i++;\n    }\n    int start = newInterval[0], end = newInterval[1];\n    while (i < n && intervals[i][0] <= end) {\n        start = min(start, intervals[i][0]);\n        end = max(end, intervals[i][1]);\n        i++;\n    }\n    result.push_back({start, end});\n    for (int j = i; j < n; j++) result.push_back(intervals[j]);\n    return result;\n}\n",
        java: "List<int[]> insertInterval(int[][] intervals, int[] newInterval) {\n    List<int[]> result = new ArrayList<>();\n    if (intervals.length == 0) {\n        result.add(newInterval);\n        return result;\n    }\n    int i = 0, n = intervals.length;\n    while (i < n && intervals[i][1] < newInterval[0]) {\n        result.add(intervals[i]);\n        i++;\n    }\n    int start = newInterval[0], end = newInterval[1];\n    while (i < n && intervals[i][0] <= end) {\n        start = Math.min(start, intervals[i][0]);\n        end = Math.max(end, intervals[i][1]);\n        i++;\n    }\n    result.add(new int[]{start, end});\n    for (int j = i; j < n; j++) result.add(intervals[j]);\n    return result;\n}\n",
      },
    },
  },
  questionIds: ["q-insert-interval"],
}

export const intervalsModule: Module = {
  id: "intervals",
  title: "Intervals",
  description: "Sorting, overlap detection, and the merge/insert pattern for range-based problems.",
  icon: "📏",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [understandingIntervals, sortingAndOverlap, codeLab, mastery],
}
