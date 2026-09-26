// Module Mastery Quiz — Intervals (module id "intervals").
// Written from intervals-1..4: what an interval is, the overlap condition
// (a.start <= b.end and b.start <= a.end, so touching endpoints count),
// sorting by start, the one-pass merge against the last kept interval, and
// the three-zone insertInterval walk.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const MERGE_CODE =
  "intervals.sort(key=lambda pair: pair[0])\nmerged = [intervals[0]]\nfor start, end in intervals[1:]:\n    if start <= merged[-1][1]:\n        merged[-1][1] = max(merged[-1][1], end)\n    else:\n        merged.append([start, end])"

export const intervalsQuiz: ModuleMasteryQuiz = {
  id: "intervals-mastery",
  moduleId: "intervals",
  title: "Intervals Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "intervals-q1",
      concept: "Overlap check",
      difficulty: "foundation",
      prompt: "Which pair of intervals overlaps?",
      options: ["[1, 3] and [4, 6]", "[7, 9] and [1, 2]", "[10, 12] and [13, 15]", "[2, 6] and [5, 9]"],
      correct: "d",
      explanation:
        "[2, 6] and [5, 9] share the range [5, 6]. Two intervals overlap when one starts before the other ends, and the other three pairs leave a gap between them.",
    }),
    singleSelect({
      id: "intervals-q2",
      concept: "Overlap check",
      difficulty: "foundation",
      prompt: "Two intervals a and b overlap exactly when which condition holds?",
      options: [
        "a.start <= b.start AND a.end <= b.end",
        "a.start <= b.end AND b.start <= a.end",
        "a.end < b.start OR b.end < a.start",
        "a.start == b.start OR a.end == b.end",
      ],
      correct: "b",
      explanation:
        "Each interval must start no later than the other one ends. The third option is the opposite: it describes two intervals that do not overlap.",
    }),
    singleSelect({
      id: "intervals-q3",
      concept: "Sort by start",
      difficulty: "application",
      prompt: "Why sort intervals by start time before merging them?",
      options: [
        "Each interval then only needs a check against the last kept one.",
        "Sorting removes the intervals that overlap others.",
        "Sorting makes every interval the same length as the next.",
        "Sorting lets you compare each interval only with the first.",
      ],
      correct: "a",
      explanation:
        "Once intervals are sorted by start, you only need to compare each one with the interval kept just before it, because overlaps with anything further back are not possible. That is what allows a single pass.",
    }),
    singleSelect({
      id: "intervals-q4",
      concept: "Merge step",
      difficulty: "application",
      prompt: "The intervals are already sorted by start: [1, 3], [2, 6], [8, 10]. What does the merge code produce?",
      code: MERGE_CODE,
      options: ["[1, 3], [2, 6], [8, 10]", "[1, 10]", "[1, 6], [8, 10]", "[1, 3], [2, 10]"],
      correct: "c",
      explanation:
        "[2, 6] starts at 2, which is <= 3, so it merges with [1, 3] into [1, 6]. [8, 10] starts at 8, which is > 6, so it is kept as a separate interval.",
    }),
    singleSelect({
      id: "intervals-q5",
      concept: "Merge step",
      difficulty: "challenge",
      prompt: "The last kept interval is [1, 6] and the next one is [2, 4]. After merging, which end is kept?",
      code: MERGE_CODE,
      options: [
        "4, the end of the newer interval.",
        "5, the average of the two ends.",
        "2, the newer interval's start.",
        "6, the larger of the two ends.",
      ],
      correct: "d",
      explanation:
        "The code sets the end to max(merged[-1][1], end) = max(6, 4) = 6. [2, 4] sits entirely inside [1, 6], so the merged interval stays [1, 6].",
    }),
    singleSelect({
      id: "intervals-q6",
      concept: "Endpoints",
      difficulty: "application",
      prompt: "Using the lesson's overlap check, do [1, 4] and [4, 7] overlap?",
      options: [
        "No, because they only share a boundary point.",
        "Yes, since 1 <= 7 and 4 <= 4 both hold.",
        "Only if the intervals are sorted first.",
        "It cannot be determined from the endpoints.",
      ],
      correct: "b",
      explanation:
        "The check uses <=, so intervals that touch at a shared endpoint count as overlapping. The merge code agrees: 4 <= 4, so [1, 4] and [4, 7] merge into [1, 7].",
    }),
    singleSelect({
      id: "intervals-q7",
      concept: "Ordering assumption",
      difficulty: "challenge",
      prompt: "What goes wrong if you run the one-pass merge on intervals that are not sorted by start?",
      options: [
        "Nothing; the merge works in any order.",
        "The result always comes out sorted by end.",
        "Checking only the last kept interval gives wrong merges.",
        "Every interval gets merged into one big interval.",
      ],
      correct: "c",
      explanation:
        "The shortcut of comparing with only the last kept interval is safe because sorting guarantees that anything overlapping comes right before. Without the sort, that comparison can miss overlaps or join intervals that do not overlap.",
    }),
    singleSelect({
      id: "intervals-q8",
      concept: "Complexity",
      difficulty: "application",
      prompt: "After the sort, how many passes over the intervals does the merge need?",
      options: [
        "One pass, O(n), using the last kept interval.",
        "Two passes, one for starts and one for ends.",
        "One full pass for every interval in the list.",
        "As many passes as there are overlaps.",
      ],
      correct: "a",
      explanation:
        "After sorting, a single O(n) pass comparing each interval with the last one you kept is enough to merge, count overlaps, or detect conflicts.",
    }),
    singleSelect({
      id: "intervals-q9",
      concept: "Insert interval",
      difficulty: "application",
      prompt: "insertInterval walks a sorted, non-overlapping list in three zones. What are they?",
      options: [
        "Sorted, unsorted, and already merged intervals.",
        "Before the new one, overlapping it, and after it.",
        "Shorter, equal, and longer than the new one.",
        "Starting first, starting last, and starting in the middle.",
      ],
      correct: "b",
      explanation:
        "Intervals entirely before the new one are kept as they are, intervals that overlap it are merged into it, and intervals entirely after it are kept as they are.",
    }),
    singleSelect({
      id: "intervals-q10",
      concept: "Insert interval",
      difficulty: "challenge",
      prompt: "The list is [1, 2], [3, 5], [6, 7], [8, 10] and the new interval is [4, 8]. What does insertInterval return?",
      options: [
        "[1, 2], [3, 5], [4, 8], [6, 7], [8, 10]",
        "[1, 2], [4, 8], [8, 10]",
        "[1, 10]",
        "[1, 2], [3, 10]",
      ],
      correct: "d",
      explanation:
        "[1, 2] ends before 4, so it stays. [3, 5], [6, 7] and [8, 10] all overlap [4, 8] (8 <= 8 counts), so they merge with it into [3, 10].",
    }),
    singleSelect({
      id: "intervals-q11",
      concept: "Ordering assumption",
      difficulty: "application",
      prompt: "Why does insertInterval rely on the list already being sorted and non-overlapping?",
      options: [
        "So the new interval can simply be added at the end.",
        "So each interval can be sorted again very quickly.",
        "So the three zones can be found in one pass.",
        "So the list never gets longer after the insert.",
      ],
      correct: "c",
      explanation:
        "With a sorted, non-overlapping list, the intervals before, overlapping and after the new one appear in that order, so one walk through the list finds all three zones.",
    }),
    multiSelect({
      id: "intervals-q12",
      concept: "Overlap check",
      difficulty: "application",
      prompt: "Which statements about intervals are true? Select all that apply.",
      options: [
        "[3, 5] and [1, 4] overlap.",
        "Two intervals overlap only if their starts are equal.",
        "Sorting is unnecessary when merging intervals.",
        "After sorting by start, one pass is enough to merge.",
      ],
      correct: ["a", "d"],
      explanation:
        "[3, 5] and [1, 4] share [3, 4], so they overlap: 3 <= 4 and 1 <= 5. Once the intervals are sorted by start, a single pass against the last kept interval merges everything. Overlap does not need equal starts, and the sort is what makes the pass work.",
    }),
  ],
}
