// Static registry of the approved Code Trace specifications, one per
// AlgorithmAnimationId. This is authored content, not logic — every trace's
// `states` array aligns 1:1 with that animation's own semantic-state array
// (src/learning/animations/*States.ts / advancedAnimationStates.ts), which
// this file deliberately does NOT import, to avoid coupling trace content to
// the protected/validated animation-state files. State-count agreement is
// checked separately by validateCodeTraces() below, given the real counts by
// the caller (see the disposable audit script referenced in the hardening
// report — this file has no browser/React dependency itself).
//
// All current traces use TRACE_VISIBILITY = ALWAYS_VISIBLE — every animation here is
// attached to a "lesson"-type checkpoint, never a coding challenge.

import type { AlgorithmAnimationId } from "../types"
import type { AlgorithmCodeTrace, CodeTraceRegistryShape } from "./codeTraceTypes"

export const codeTraceRegistry: CodeTraceRegistryShape = {
  // ── BASECAMP ─────────────────────────────────────────────────────────
  "complexity-growth": {
    title: "Comparing growth as n increases",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "n = small",
      "evaluate cost(n) for O(1), O(log n), O(n), O(n log n), O(n^2)",
      "",
      "n = medium",
      "compare relative growth so far",
      "",
      "n = large",
      "growth differences become obvious",
    ],
    states: [
      { activeLines: [1, 2], changes: [{ name: "n", to: "2", status: "info" }], note: "At small n, every growth class looks similar." },
      { activeLines: [4, 5], executedLines: [1, 2], changes: [{ name: "n", from: "2", to: "5", status: "changed" }], note: "Quadratic and log-linear begin separating." },
      { activeLines: [7, 8], executedLines: [4, 5], changes: [{ name: "n", from: "5", to: "9", status: "changed" }], status: { label: "SCALED", tone: "valid" }, note: "Relative scaling becomes obvious as n grows." },
    ],
  },

  "arrays-in-place-reversal": {
    title: "Index, update, then reverse with two indices",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "value = nums[index]",
      "",
      "nums[index] = newValue",
      "",
      "left = 0",
      "right = length - 1",
      "while left < right:",
      "    swap(nums[left], nums[right])",
      "    left = left + 1",
      "    right = right - 1",
    ],
    states: [
      { activeLines: [1], changes: [{ name: "value", to: "nums[0] = 4", status: "info" }], note: "Read nums[0] directly by index." },
      { activeLines: [3], executedLines: [1], changes: [{ name: "nums[3]", from: "9", to: "7", status: "changed" }], note: "Update index 3 from 9 to 7." },
      { activeLines: [7, 8, 9, 10], executedLines: [5, 6], changes: [{ name: "nums[0]", from: "4", to: "6", status: "changed" }, { name: "nums[5]", from: "6", to: "4", status: "changed" }], note: "Reverse: swap the two ends inward (later swaps compressed)." },
      { activeLines: [10], executedLines: [7, 8, 9], status: { label: "VALID", tone: "valid" }, note: "Final reversed order after symmetric swaps." },
    ],
  },

  "hashing-frequency-map": {
    title: "Key to hash to bucket to frequency update",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "key = next item",
      "bucket = hash(key)",
      "",
      "if bucket not in counts:",
      "    counts[bucket] = 0",
      "counts[bucket] = counts[bucket] + 1",
    ],
    states: [
      { activeLines: [1], changes: [{ name: "key", to: "\"pear\"", status: "info" }], note: "Start with the key you want to count." },
      { activeLines: [2], executedLines: [1], changes: [{ name: "bucket", to: "1", status: "info" }], note: "The hash function maps the key to a bucket." },
      { activeLines: [4, 5, 6], executedLines: [1, 2], changes: [{ name: "counts[1]", from: "1", to: "2", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "A repeat key updates the count instead of rescanning." },
    ],
  },

  "hashing-complement-lookup": {
    title: "One-pass complement lookup",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "seen = {}",
      "for i, n in enumerate(nums):",
      "    complement = target - n",
      "    if complement in seen:",
      "        return [seen[complement], i]",
      "    seen[n] = i",
    ],
    states: [
      { activeLines: [1], changes: [{ name: "seen", to: "{}", status: "info" }], note: "Begin with no previously seen values." },
      { activeLines: [2, 3, 4], executedLines: [1], changes: [{ name: "n", to: "2", status: "info" }, { name: "complement", to: "7", status: "info" }], status: { label: "NOT SEEN", tone: "neutral" }, note: "Seven has not appeared yet." },
      { activeLines: [6], executedLines: [2, 3, 4], changes: [{ name: "seen", from: "{}", to: "{2: 0}", status: "changed" }], note: "Store value 2 with its index." },
      { activeLines: [2, 3, 4], executedLines: [6], changes: [{ name: "n", from: "2", to: "7", status: "changed" }, { name: "complement", from: "7", to: "2", status: "changed" }], status: { label: "FOUND", tone: "valid" }, note: "Two is already in seen at index 0." },
      { activeLines: [5], executedLines: [2, 3, 4], changes: [{ name: "result", to: "[0, 1]", status: "valid" }], status: { label: "RETURN", tone: "valid" }, note: "Return the two indices whose values sum to the target." },
    ],
  },

  // ── PATTERN MEADOWS ──────────────────────────────────────────────────
  "two-pointers-opposite-sum": {
    title: "Move the pointer justified by the current sum",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "left = 0",
      "right = length - 1",
      "while left < right:",
      "    sum = values[left] + values[right]",
      "    if sum == target:",
      "        return FOUND",
      "    elif sum > target:",
      "        right = right - 1",
      "    else:",
      "        left = left + 1",
    ],
    states: [
      { activeLines: [4, 7, 8], executedLines: [1, 2], changes: [{ name: "sum", to: "11", status: "info" }], status: { label: "TOO HIGH", tone: "warning" }, note: "Sum too large — move right pointer inward." },
      { activeLines: [4, 9, 10], executedLines: [8], changes: [{ name: "right", from: "4", to: "3", status: "changed" }, { name: "sum", from: "11", to: "7", status: "changed" }], status: { label: "TOO LOW", tone: "warning" }, note: "Sum too small — move left pointer inward." },
      { activeLines: [5, 6], executedLines: [10], changes: [{ name: "left", from: "0", to: "1", status: "changed" }, { name: "sum", from: "7", to: "8", status: "changed" }], status: { label: "FOUND", tone: "valid" }, note: "Target sum reached." },
    ],
  },

  "sliding-window-variable": {
    title: "Variable window: expand right, shrink until valid",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "left = 0",
      "sum = 0",
      "best = 0",
      "",
      "for right in range(length):",
      "    sum = sum + values[right]",
      "",
      "    while sum > limit:",
      "        sum = sum - values[left]",
      "        left = left + 1",
      "",
      "    best = max(best, right - left + 1)",
    ],
    states: [
      { activeLines: [1, 2, 3], note: "Start with an empty window before expanding right." },
      { activeLines: [5, 6], executedLines: [1, 2, 3], changes: [{ name: "sum", from: "0", to: "2", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Expand right to include 2." },
      { activeLines: [6, 12], executedLines: [5], changes: [{ name: "sum", from: "2", to: "3", status: "changed" }, { name: "best", from: "1", to: "2", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Sum stays within the limit — best window grows." },
      { activeLines: [6, 8, 12], executedLines: [5], changes: [{ name: "sum", from: "3", to: "6", status: "changed" }, { name: "best", from: "2", to: "3", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Sum equals the limit — this is the current best." },
      { activeLines: [6, 8], executedLines: [12], changes: [{ name: "sum", from: "6", to: "8", status: "changed" }, { name: "valid", from: "true", to: "false", status: "invalid" }], status: { label: "INVALID", tone: "invalid" }, note: "Window exceeded the allowed sum." },
      { activeLines: [9, 10], executedLines: [8], changes: [{ name: "sum", from: "8", to: "6", status: "changed" }, { name: "left", from: "0", to: "1", status: "changed" }, { name: "valid", from: "false", to: "true", status: "valid" }], status: { label: "VALID", tone: "valid" }, note: "Move the left boundary inward." },
      { activeLines: [5, 6, 8], executedLines: [9, 10], changes: [{ name: "sum", from: "6", to: "10", status: "changed" }, { name: "valid", from: "true", to: "false", status: "invalid" }], status: { label: "INVALID", tone: "invalid" }, note: "New value pushes the window over the limit." },
      { activeLines: [9, 10], executedLines: [8], changes: [{ name: "sum", from: "10", to: "9", status: "changed" }, { name: "left", from: "1", to: "2", status: "changed" }], status: { label: "INVALID", tone: "invalid" }, note: "Still too large — keep shrinking." },
      { activeLines: [9, 10], executedLines: [8], changes: [{ name: "sum", from: "9", to: "6", status: "changed" }, { name: "left", from: "2", to: "3", status: "changed" }, { name: "valid", from: "false", to: "true", status: "valid" }], status: { label: "VALID", tone: "valid" }, note: "Valid again at sum 6." },
      { activeLines: [5, 6, 8], executedLines: [9, 10], changes: [{ name: "sum", from: "6", to: "7", status: "changed" }, { name: "valid", from: "true", to: "false", status: "invalid" }], status: { label: "INVALID", tone: "invalid" }, note: "One more shrink is needed." },
      { activeLines: [9, 10], executedLines: [8], changes: [{ name: "sum", from: "7", to: "5", status: "changed" }, { name: "left", from: "3", to: "4", status: "changed" }, { name: "valid", from: "false", to: "true", status: "valid" }], status: { label: "VALID", tone: "valid" }, note: "Final shrink restores validity." },
      { activeLines: [12], executedLines: [1, 2, 3, 5, 6, 8, 9, 10], changes: [{ name: "best", to: "3", status: "info" }], status: { label: "COMPLETE", tone: "valid" }, note: "Best valid window length was 3: [2, 1, 3]." },
    ],
  },

  "prefix-sum-range-query": {
    title: "Build prefix values, then subtract before the range",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "prefix[0] = values[0]",
      "for i in range(1, length):",
      "    prefix[i] = prefix[i-1] + values[i]",
      "",
      "rangeSum(left, right):",
      "    if left == 0:",
      "        return prefix[right]",
      "    return prefix[right] - prefix[left - 1]",
    ],
    states: [
      { activeLines: [1, 2, 3], changes: [{ name: "prefix[1]", to: "3", status: "info" }], note: "Build prefix sums from left to right." },
      { activeLines: [2, 3], executedLines: [1], changes: [{ name: "prefix[5]", to: "17", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "Every cell now stores the running total." },
      { activeLines: [8], executedLines: [6], changes: [{ name: "result", to: "prefix[5] - prefix[2] = 10", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "Range sum [3..5] is 17 - 7 = 10." },
    ],
  },

  "binary-search-decision": {
    title: "Compare mid, discard half, then find the target",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "low = 0",
      "high = length - 1",
      "while low <= high:",
      "    mid = (low + high) // 2",
      "    if values[mid] == target:",
      "        return mid",
      "    elif values[mid] < target:",
      "        low = mid + 1",
      "    else:",
      "        high = mid - 1",
    ],
    states: [
      { activeLines: [4, 7, 8], executedLines: [1, 2], changes: [{ name: "mid", to: "2", status: "info" }, { name: "values[mid]", to: "3", status: "info" }], note: "3 is less than 9 — discard the left half." },
      { activeLines: [4], executedLines: [8], changes: [{ name: "low", from: "0", to: "3", status: "changed" }], note: "Recompute mid inside the remaining range." },
      { activeLines: [5, 6], executedLines: [4], status: { label: "FOUND", tone: "valid" }, note: "Middle value matches the target — return index 4." },
    ],
  },

  "binary-search-monotonic-condition": {
    title: "First true value in a monotonic answer range",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "low, high, answer = 1, 10, None",
      "while low <= high:",
      "    mid = (low + high) // 2",
      "    if mid * mid >= 30:",
      "        answer = mid",
      "        high = mid - 1",
      "    else:",
      "        low = mid + 1",
      "return answer",
    ],
    states: [
      { activeLines: [2, 3, 4, 7, 8], executedLines: [1], changes: [{ name: "mid", to: "5", status: "info" }, { name: "5² >= 30", to: "false", status: "invalid" }], status: { label: "FALSE", tone: "warning" }, note: "Everything at or below 5 can be discarded." },
      { activeLines: [8, 3], executedLines: [4, 7], changes: [{ name: "low", from: "1", to: "6", status: "changed" }, { name: "mid", from: "5", to: "8", status: "changed" }], note: "Search the remaining right-hand answer range." },
      { activeLines: [4, 5], executedLines: [3], changes: [{ name: "8² >= 30", to: "true", status: "valid" }, { name: "answer", from: "None", to: "8", status: "changed" }], status: { label: "CANDIDATE", tone: "valid" }, note: "Eight works, but a smaller valid answer may exist." },
      { activeLines: [6, 3], executedLines: [4, 5], changes: [{ name: "high", from: "10", to: "7", status: "changed" }, { name: "mid", from: "8", to: "6", status: "changed" }], note: "Move left while preserving candidate 8." },
      { activeLines: [4, 5], executedLines: [3], changes: [{ name: "6² >= 30", to: "true", status: "valid" }, { name: "answer", from: "8", to: "6", status: "changed" }], status: { label: "BETTER", tone: "valid" }, note: "Six is a smaller valid candidate." },
      { activeLines: [6, 9], executedLines: [4, 5], changes: [{ name: "high", from: "7", to: "5", status: "changed" }], status: { label: "FIRST TRUE = 6", tone: "valid" }, note: "The range is exhausted; return the smallest valid answer." },
    ],
  },

  "intervals-merge-overlap": {
    title: "Merge overlapping intervals",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "sort intervals by start",
      "",
      "merged = [intervals[0]]",
      "for interval in intervals[1:]:",
      "    last = merged[-1]",
      "    if interval.start <= last.end:",
      "        last.end = max(last.end, interval.end)",
      "    else:",
      "        merged.append(interval)",
    ],
    states: [
      { activeLines: [1], note: "Place the intervals on one timeline." },
      { activeLines: [5, 6], executedLines: [1], changes: [{ name: "interval.start", to: "4", status: "info" }, { name: "last.end", to: "5", status: "info" }], status: { label: "OVERLAP", tone: "warning" }, note: "4 starts before 5 ends — the intervals overlap." },
      { activeLines: [7], executedLines: [6], changes: [{ name: "intervals", from: "[1,5],[4,8]", to: "[1,8]", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Merge by keeping the earliest start and latest end." },
    ],
  },

  // ── STRUCTURE WOODS ──────────────────────────────────────────────────
  "linked-list-reversal": {
    title: "Reverse a linked list with prev, curr, and next",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "prev = null",
      "curr = head",
      "while curr != null:",
      "    next = curr.next",
      "    curr.next = prev",
      "    prev = curr",
      "    curr = next",
      "return prev",
    ],
    states: [
      { activeLines: [4], executedLines: [1, 2], changes: [{ name: "next", to: "curr.next = 2", status: "info" }], note: "Save curr.next before rewiring, or the rest of the list is lost." },
      { activeLines: [5], executedLines: [4], changes: [{ name: "curr.next", to: "prev", status: "changed" }], note: "Flip curr.next backward so node 1 points to prev." },
      { activeLines: [6, 7], executedLines: [5], changes: [{ name: "prev", from: "null", to: "1", status: "changed" }, { name: "curr", from: "1", to: "2", status: "changed" }], note: "Advance prev and curr forward." },
      { activeLines: [3, 8], executedLines: [4, 5, 6, 7], changes: [{ name: "curr", from: "2", to: "null", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "curr is null — prev is the new head." },
    ],
  },

  "linked-list-fast-slow-cycle": {
    title: "Floyd cycle detection",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "slow = head",
      "fast = head",
      "while fast and fast.next:",
      "    slow = slow.next",
      "    fast = fast.next.next",
      "    if slow == fast:",
      "        return true",
      "return false",
    ],
    states: [
      { activeLines: [1, 2], changes: [{ name: "slow", to: "1", status: "info" }, { name: "fast", to: "1", status: "info" }], note: "Start both pointers at the head." },
      { activeLines: [3, 4, 5], executedLines: [1, 2], changes: [{ name: "slow", from: "1", to: "2", status: "changed" }, { name: "fast", from: "1", to: "3", status: "changed" }], note: "Slow moves one edge; fast moves two." },
      { activeLines: [3, 4, 5], executedLines: [4, 5], changes: [{ name: "slow", from: "2", to: "3", status: "changed" }, { name: "fast", from: "3", to: "5", status: "changed" }], note: "Fast continues gaining one node per iteration inside the cycle." },
      { activeLines: [3, 4, 5, 6, 7], executedLines: [4, 5], changes: [{ name: "slow", from: "3", to: "4", status: "changed" }, { name: "fast", from: "5", to: "4", status: "changed" }], status: { label: "CYCLE", tone: "valid" }, note: "The pointers meet at node 4, proving a cycle exists." },
    ],
  },

  "stack-queue-lifo-fifo": {
    title: "LIFO stack versus FIFO queue",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "stack.push(item)",
      "queue.enqueue(item)",
      "",
      "stack.pop()      # removes newest",
      "queue.dequeue()  # removes oldest",
    ],
    states: [
      { activeLines: [1, 2], changes: [{ name: "stack", to: "[A,B]", status: "info" }, { name: "queue", to: "[A,B]", status: "info" }], note: "Both structures receive A then B." },
      { activeLines: [1, 2], executedLines: [1, 2], changes: [{ name: "stack", from: "[A,B]", to: "[A,B,C]", status: "changed" }, { name: "queue", from: "[A,B]", to: "[A,B,C]", status: "changed" }], note: "Add C to both structures." },
      { activeLines: [4, 5], executedLines: [1, 2], changes: [{ name: "stack removes", to: "C", status: "info" }, { name: "queue removes", to: "A", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "A stack removes the newest item; a queue removes the oldest." },
    ],
  },

  "heap-insert-bubble": {
    title: "Insert leaf, compare parent, swap upward",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "array.append(value)",
      "child = length - 1",
      "",
      "while child > 0 and array[parent(child)] > array[child]:",
      "    swap(array[parent(child)], array[child])",
      "    child = parent(child)",
    ],
    states: [
      { activeLines: [1, 2], changes: [{ name: "array[5]", to: "2", status: "info" }], note: "Insert the new value at the next leaf position." },
      { activeLines: [4, 5, 6], executedLines: [1, 2], changes: [{ name: "array[2]", from: "6", to: "2", status: "changed" }, { name: "array[0]", from: "4", to: "6", status: "changed" }], note: "Bubble the smaller value upward by swapping with its parent." },
      { activeLines: [4], executedLines: [5, 6], status: { label: "VALID", tone: "valid" }, note: "The min-heap property is restored at the root." },
    ],
  },

  "trie-prefix-branch": {
    title: "Reuse shared prefix before branching",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "node = root",
      "for ch in word:",
      "    if ch not in node.children:",
      "        node.children[ch] = new TrieNode()",
      "    node = node.children[ch]",
      "node.isWord = true",
    ],
    states: [
      { activeLines: [2, 3, 4, 5], changes: [{ name: "children", to: "c, a, r created", status: "info" }], note: "Insert car by walking one character at a time." },
      { activeLines: [2, 5], executedLines: [3, 4], note: "The word cat reuses the existing c → a prefix." },
      { activeLines: [3, 4], executedLines: [2, 5], changes: [{ name: "children[t]", to: "created", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Only the final character branches away from car." },
    ],
  },

  // ── RECURSIVE FOREST ─────────────────────────────────────────────────
  "recursion-factorial-unwind": {
    title: "Factorial calls grow, hit the base case, then unwind",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "factorial(n):",
      "    if n == 0:",
      "        return 1",
      "    return n * factorial(n - 1)",
    ],
    states: [
      { activeLines: [4], note: "factorial(3) calls factorial(2), shrinking toward the base case." },
      { activeLines: [2, 3], executedLines: [4], status: { label: "VALID", tone: "valid" }, note: "The base case answers directly — recursion stops growing." },
      { activeLines: [4], executedLines: [3], changes: [{ name: "factorial(1)", to: "1", status: "info" }, { name: "factorial(2)", to: "2", status: "info" }], note: "Calls return upward, multiplying as the stack unwinds." },
      { activeLines: [4], executedLines: [2, 3], changes: [{ name: "factorial(3)", to: "6", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "The original call receives the final value." },
    ],
  },

  "backtracking-choose-undo": {
    title: "Choose, explore, dead end, undo, alternate",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "path = []",
      "backtrack(start):",
      "    if isValid(path):",
      "        record(path)",
      "    for choice in remainingChoices(start):",
      "        path.append(choice)",
      "        backtrack(next)",
      "        path.pop()",
    ],
    states: [
      { activeLines: [6], changes: [{ name: "path", to: "[A]", status: "info" }], status: { label: "CHOOSE", tone: "neutral" }, note: "Choose the first branch and record it in the path." },
      { activeLines: [7], executedLines: [6], changes: [{ name: "path", to: "[A,B]", status: "info" }], status: { label: "EXPLORE", tone: "neutral" }, note: "Explore deeper while the partial choice is still viable." },
      { activeLines: [3], executedLines: [7], status: { label: "DEAD END", tone: "invalid" }, note: "This branch cannot produce a valid answer." },
      { activeLines: [8], executedLines: [3], changes: [{ name: "path", from: "[A,B]", to: "[A]", status: "changed" }], status: { label: "RETURN", tone: "warning" }, note: "Undo the last choice before trying a sibling branch." },
      { activeLines: [6], executedLines: [8], changes: [{ name: "path", from: "[A]", to: "[A,C]", status: "changed" }], status: { label: "CHOOSE", tone: "neutral" }, note: "Try the alternate branch with a clean path state." },
    ],
  },

  "tree-preorder-traversal": {
    title: "Preorder traversal: root, left, right",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "preorder(node):",
      "    if node == null:",
      "        return",
      "    visit(node)",
      "    preorder(node.left)",
      "    preorder(node.right)",
    ],
    states: [
      { activeLines: [4], changes: [{ name: "sequence", to: "[1]", status: "info" }], note: "Preorder visits the root first." },
      { activeLines: [5, 4], executedLines: [4], changes: [{ name: "sequence", from: "[1]", to: "[1,2]", status: "changed" }], note: "Then DFS moves into the left subtree." },
      { activeLines: [5, 4], executedLines: [4], changes: [{ name: "sequence", from: "[1,2]", to: "[1,2,4]", status: "changed" }], note: "Continue left as far as possible." },
      { activeLines: [6, 4], executedLines: [5], changes: [{ name: "sequence", from: "[1,2,4]", to: "[1,2,4,5]", status: "changed" }], note: "After finishing node 4, backtrack and visit node 5." },
      { activeLines: [6, 4], executedLines: [5, 6], changes: [{ name: "sequence", to: "[1,2,4,5,3]", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Finish with the right subtree — the preorder sequence is complete." },
    ],
  },

  "bst-search-invariant": {
    title: "Use the BST invariant to choose one direction",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "search(node, target):",
      "    if node == null or node.val == target:",
      "        return node",
      "    if target < node.val:",
      "        return search(node.left, target)",
      "    return search(node.right, target)",
    ],
    states: [
      { activeLines: [4, 5], changes: [{ name: "current", to: "8", status: "info" }], note: "6 < 8 — the target must be in the left subtree." },
      { activeLines: [6], executedLines: [4], changes: [{ name: "current", from: "8", to: "3", status: "changed" }], note: "6 > 3 — the target must be in the right subtree." },
      { activeLines: [2], executedLines: [6], changes: [{ name: "current", from: "3", to: "6", status: "changed" }], status: { label: "FOUND", tone: "valid" }, note: "The BST invariant guides the search directly to the target." },
    ],
  },

  // ── GRAPH HIGHLANDS ──────────────────────────────────────────────────
  "graph-adjacency-build": {
    title: "Edges and adjacency list represent the same graph",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "graph = {}",
      "for (a, b) in edges:",
      "    graph[a].append(b)",
      "    graph[b].append(a)",
    ],
    states: [
      { activeLines: [3, 4], changes: [{ name: "graph[A]", to: "[B]", status: "info" }, { name: "graph[B]", to: "[A]", status: "info" }], note: "Add the first undirected edge to the adjacency list." },
      { activeLines: [3, 4], executedLines: [3, 4], changes: [{ name: "graph[A]", from: "[B]", to: "[B,C]", status: "changed" }], note: "A now has two neighbors." },
      { activeLines: [3, 4], executedLines: [3, 4], changes: [{ name: "graph[B]", from: "[A]", to: "[A,D]", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "The adjacency list and edge drawing describe the same graph." },
    ],
  },

  "dfs-bfs-frontier": {
    title: "Same graph, different frontier discipline",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "dfs: stack = [start]",
      "bfs: queue = [start]",
      "",
      "while frontier not empty:",
      "    node = frontier.pop()   # stack: last-in; queue: first-in",
      "    visit(node)",
      "    push unvisited neighbors",
    ],
    states: [
      { activeLines: [1, 2], note: "Both traversals begin at the same start node." },
      { activeLines: [4, 5, 6, 7], executedLines: [1, 2], changes: [{ name: "dfs", from: "[A]", to: "[A,B,D,E]", status: "changed" }, { name: "bfs", from: "[A]", to: "[A,B,C]", status: "changed" }], note: "DFS exhausts a branch while BFS expands level by level." },
      { activeLines: [7], executedLines: [4, 5, 6], changes: [{ name: "dfs", to: "[A,B,D,E,C,F]", status: "changed" }, { name: "bfs", to: "[A,B,C,D,E,F]", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Same graph, different frontier discipline." },
    ],
  },

  "grid-graph-frontier": {
    title: "Traversal grows from one start through a frontier",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "visited = {start}",
      "frontier = [start]",
      "while frontier not empty:",
      "    cell = frontier.pop()",
      "    for neighbor in validNeighbors(cell):",
      "        if neighbor not in visited:",
      "            visited.add(neighbor)",
      "            frontier.append(neighbor)",
    ],
    states: [
      { activeLines: [1, 2], note: "Start from one grid cell." },
      { activeLines: [5, 6, 7, 8], executedLines: [3, 4], changes: [{ name: "visited", from: "1 cell", to: "3 cells", status: "changed" }], note: "Expand to valid neighboring cells." },
      { activeLines: [5, 6, 7, 8], executedLines: [5, 6, 7, 8], changes: [{ name: "visited", from: "3 cells", to: "5 cells", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "The traversal grows through the frontier." },
    ],
  },

  "topological-sort-kahn": {
    title: "Kahn's algorithm processes zero-indegree nodes",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "indegree = computeIndegrees(edges)",
      "queue = nodes with indegree == 0",
      "output = []",
      "",
      "while queue not empty:",
      "    node = queue.pop()",
      "    output.append(node)",
      "    for neighbor in graph[node]:",
      "        indegree[neighbor] -= 1",
      "        if indegree[neighbor] == 0:",
      "            queue.append(neighbor)",
    ],
    states: [
      { activeLines: [1, 2], status: { label: "READY", tone: "neutral" }, note: "Begin with nodes whose indegree is zero." },
      { activeLines: [6, 7, 8, 9, 10, 11], executedLines: [2], changes: [{ name: "output", from: "[]", to: "[A]", status: "changed" }, { name: "indegree[B]", from: "1", to: "0", status: "changed" }, { name: "indegree[C]", from: "1", to: "0", status: "changed" }], status: { label: "PROCESSING", tone: "neutral" }, note: "Removing A unlocks B and C." },
      { activeLines: [6, 7, 8, 9, 10], executedLines: [11], changes: [{ name: "output", to: "[A,B]", status: "changed" }, { name: "indegree[D]", from: "2", to: "1", status: "changed" }], status: { label: "PROCESSING", tone: "neutral" }, note: "Processing B lowers D's indegree." },
      { activeLines: [6, 7, 8, 9, 10, 11], executedLines: [9], changes: [{ name: "output", to: "[A,B,C]", status: "changed" }, { name: "indegree[D]", from: "1", to: "0", status: "changed" }], status: { label: "PROCESSING", tone: "neutral" }, note: "Processing C unlocks D." },
      { activeLines: [5], executedLines: [6, 7], changes: [{ name: "output", to: "[A,B,C,D]", status: "changed" }], status: { label: "COMPLETE", tone: "valid" }, note: "The final output respects every prerequisite edge." },
    ],
  },

  "union-find-compression": {
    title: "Find root, then compress the parent chain",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "find(x):",
      "    path = [x]",
      "    while parent[x] != x:",
      "        x = parent[x]",
      "        path.append(x)",
      "    for node in path:",
      "        parent[node] = x   # path compression",
      "    return x",
    ],
    states: [
      { activeLines: [3, 4, 5], note: "Before compression, find(4) walks through 3 to reach root 1." },
      { activeLines: [3], executedLines: [4, 5], note: "The representative is node 1." },
      { activeLines: [6, 7], executedLines: [3, 4, 5], changes: [{ name: "parent[4]", from: "3", to: "1", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Path compression points 4 directly at the root." },
    ],
  },

  // ── OPTIMIZATION PEAKS ───────────────────────────────────────────────
  "greedy-interval-selection": {
    title: "Select the earliest-finishing compatible interval",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "sort intervals by end time",
      "selected = []",
      "lastEnd = -infinity",
      "",
      "for interval in intervals:",
      "    if interval.start >= lastEnd:",
      "        selected.append(interval)",
      "        lastEnd = interval.end",
    ],
    states: [
      { activeLines: [6, 7, 8], changes: [{ name: "selected", to: "[A]", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "Select the earliest-finishing compatible interval." },
      { activeLines: [6], executedLines: [7, 8], status: { label: "SKIPPED", tone: "invalid" }, note: "Skip B — it overlaps the last selected interval." },
      { activeLines: [6, 7, 8], executedLines: [6], changes: [{ name: "selected", from: "[A]", to: "[A,C]", status: "changed" }, { name: "lastEnd", from: "3", to: "6", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "C starts after A ends — safe to take." },
      { activeLines: [6, 7, 8], executedLines: [7, 8], changes: [{ name: "selected", to: "[A,C,D]", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "The greedy choices produce three compatible intervals." },
    ],
  },

  "dp-1d-fill": {
    title: "Fill each state from previously solved states",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "dp[0] = 1",
      "dp[1] = 1",
      "for i in range(2, n):",
      "    dp[i] = dp[i-1] + dp[i-2]",
    ],
    states: [
      { activeLines: [1, 2], note: "Initialize the base cases." },
      { activeLines: [3, 4], executedLines: [1, 2], changes: [{ name: "dp[2]", to: "2", status: "info" }, { name: "dp[3]", to: "3", status: "info" }], note: "Each new value depends on earlier solved states." },
      { activeLines: [4], executedLines: [3], changes: [{ name: "dp[4]", to: "5", status: "info" }, { name: "dp[5]", to: "8", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "The table is complete after filling left to right." },
    ],
  },

  "dp-2d-grid-paths": {
    title: "Grid paths: each cell is top plus left",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "for r in range(rows): dp[r][0] = 1",
      "for c in range(cols): dp[0][c] = 1",
      "",
      "for r in range(1, rows):",
      "    for c in range(1, cols):",
      "        dp[r][c] = dp[r-1][c] + dp[r][c-1]",
    ],
    states: [
      { activeLines: [1, 2], note: "Initialize the first row and column." },
      { activeLines: [6], executedLines: [1, 2], changes: [{ name: "dp[1][2]", to: "3", status: "info" }], note: "Each cell adds the value from above and left." },
      { activeLines: [6], executedLines: [6], changes: [{ name: "dp[2][2]", to: "6", status: "info" }], note: "Previously solved neighbors feed the current cell." },
      { activeLines: [6], executedLines: [6], changes: [{ name: "dp[2][3]", to: "10", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "The bottom-right cell contains the final path count." },
    ],
  },

  "dp-take-skip": {
    title: "Take versus skip, then merge with max",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "take = value[i] + solve(i - cost)",
      "skip = solve(i - 1)",
      "result = max(take, skip)",
    ],
    states: [
      { activeLines: [1, 2, 3], changes: [{ name: "take", to: "10", status: "info" }, { name: "skip", to: "3", status: "info" }, { name: "result", to: "10", status: "info" }], note: "Evaluate taking versus skipping at index 2." },
      { activeLines: [3], executedLines: [1, 2], changes: [{ name: "take", to: "10", status: "info" }, { name: "skip", to: "10", status: "info" }], note: "When choices tie, either keeps the optimal value." },
      { activeLines: [3], executedLines: [1, 2], changes: [{ name: "result", from: "10", to: "12", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "The best answer is the max of take and skip." },
    ],
  },

  // ── INTERVIEW SUMMIT (procedural, not language-shaped code) ─────────
  "pattern-recognition-clues": {
    title: "Clues suggest a pattern but do not guarantee one",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "inspect constraints",
      "identify dominant signal",
      "match candidate pattern",
      "validate pattern",
      "choose strategy",
    ],
    states: [
      { activeLines: [1], note: "Start by reading the nouns and constraints." },
      { activeLines: [2], executedLines: [1], changes: [{ name: "clues", to: "LONGEST, CONTIGUOUS, RUNNING CONSTRAINT", status: "info" }], note: "These clues suggest a maintained window." },
      { activeLines: [3, 4, 5], executedLines: [2], changes: [{ name: "candidate", to: "\"Sliding Window\"", status: "changed" }], status: { label: "VALID", tone: "valid" }, note: "Pick Sliding Window as the first candidate pattern." },
    ],
  },

  "timed-problem-phases": {
    title: "Calm phase budgets for timed problems",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "clarify (2 min)",
      "derive approach (5 min)",
      "implement (12 min)",
      "test (3 min)",
      "explain (remainder)",
    ],
    states: [
      { activeLines: [1], note: "Begin with a calm time-boxed plan." },
      { activeLines: [3], executedLines: [1, 2], note: "Spend the largest block implementing the chosen approach." },
      { activeLines: [5], executedLines: [3, 4], status: { label: "VALID", tone: "valid" }, note: "Leave time to explain complexity and tradeoffs." },
    ],
  },

  "company-mission-review": {
    title: "Target, solve, then review misses by root cause",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "inspect mission",
      "select pattern cluster",
      "implement solution",
      "review misses by root cause",
    ],
    states: [
      { activeLines: [1], changes: [{ name: "difficulty mix", to: "Easy 20% / Medium 60% / Hard 20%", status: "info" }], note: "Start with a target company pattern mix." },
      { activeLines: [2, 3], executedLines: [1], note: "Solve by cluster rather than random order." },
      { activeLines: [4], executedLines: [2, 3], changes: [{ name: "miss", to: "\"Graph traversal\" → routed to Graph Highlands", status: "info" }], status: { label: "VALID", tone: "valid" }, note: "Review misses by root cause and route them back to a learning zone." },
    ],
  },

  "final-mastery-readiness": {
    title: "Five capstone abilities converge into readiness",
    visibility: "ALWAYS_VISIBLE",
    pseudocode: [
      "complete pattern gate",
      "complete complexity gate",
      "complete code gate",
      "pass tests",
      "explain solution",
      "mark mastery",
    ],
    states: [
      { activeLines: [1, 2], changes: [{ name: "readiness", to: "40", status: "info" }], note: "Mastery starts with recognition and complexity." },
      { activeLines: [3, 4], executedLines: [1, 2], changes: [{ name: "readiness", from: "40", to: "80", status: "changed" }], note: "Code and tests move readiness close to complete." },
      { activeLines: [5, 6], executedLines: [3, 4], changes: [{ name: "readiness", from: "80", to: "100", status: "changed" }], status: { label: "COMPLETE", tone: "valid" }, note: "The final challenge combines all five abilities." },
    ],
  },
}

export function getCodeTrace(id: AlgorithmAnimationId): AlgorithmCodeTrace | undefined {
  return codeTraceRegistry[id]
}

/** Pure structural audit — no browser/React/storage dependency. `animationStateCounts`
 * is supplied by the caller (e.g. a disposable script reading AlgorithmAnimation.tsx's
 * own registry) rather than imported here, to avoid a circular dependency between this
 * file and the animation dispatcher. Returns an empty array when everything is valid. */
export function validateCodeTraces(
  productionAnimationIds: AlgorithmAnimationId[],
  animationStateCounts: Partial<Record<AlgorithmAnimationId, number>>,
): string[] {
  const errors: string[] = []
  const seen = new Set<string>()

  for (const id of productionAnimationIds) {
    if (seen.has(id)) errors.push(`Duplicate trace registration attempted for "${id}".`)
    seen.add(id)

    const trace = codeTraceRegistry[id]
    if (!trace) {
      errors.push(`Missing trace for production animation id "${id}".`)
      continue
    }
    if (trace.pseudocode.length === 0) errors.push(`"${id}": pseudocode listing is empty.`)
    if (trace.states.length === 0) errors.push(`"${id}": trace has no states.`)

    const expectedCount = animationStateCounts[id]
    if (expectedCount !== undefined && trace.states.length !== expectedCount) {
      errors.push(`"${id}": trace has ${trace.states.length} states but the animation has ${expectedCount}.`)
    }

    const maxLine = trace.pseudocode.length
    trace.states.forEach((state, stateIndex) => {
      for (const line of state.activeLines) {
        if (line <= 0 || line > maxLine) errors.push(`"${id}" state ${stateIndex}: invalid active line ${line} (pseudocode has ${maxLine} lines).`)
      }
      for (const line of state.executedLines ?? []) {
        if (line <= 0 || line > maxLine) errors.push(`"${id}" state ${stateIndex}: invalid executed line ${line} (pseudocode has ${maxLine} lines).`)
      }
      const validTones = ["neutral", "valid", "invalid", "warning"]
      if (state.status && !validTones.includes(state.status.tone)) {
        errors.push(`"${id}" state ${stateIndex}: invalid status tone "${state.status.tone}".`)
      }
      for (const change of state.changes ?? []) {
        if (!change.name.trim() || !change.to.trim()) {
          errors.push(`"${id}" state ${stateIndex}: a change is missing a meaningful name/to value.`)
        }
      }
    })
  }

  const knownIds = new Set(productionAnimationIds as string[])
  for (const id of Object.keys(codeTraceRegistry)) {
    if (!knownIds.has(id)) errors.push(`Unknown trace id "${id}" is not a production animation id.`)
  }

  return errors
}
