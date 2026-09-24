// Hand-authored Python / C++ / Java views of the algorithmic Code Traces.
// DISPLAY ONLY: none of this is executed, translated at runtime, sent to any
// service, or stored with learner content. The animation and the trace's
// semantic states (codeTraceRegistry.ts) stay the single source of truth.
//
// Each displayed line lists the pseudocode line numbers ("segments") it
// implements — see codeTraceTypes.ts. A trace state highlights every line
// implementing one of its active segments, so a step that is one pseudocode
// line may light up several C++/Java lines.
//
// Variable names follow the canonical pseudocode (low/high, left/right, …) so
// the animation's own labels and state-change readouts match what is shown.

import type { AlgorithmAnimationId } from "../types"
import type {
  AlgorithmCodeTrace,
  CodeTraceState,
  TraceLanguage,
  TraceLanguageVariants,
  TraceSourceLanguage,
  TraceSourceLine,
} from "./codeTraceTypes"

const L = (code: string, ...segments: number[]): TraceSourceLine => ({ code, implements: segments })

/** Traces that teach a procedure or workflow rather than source code. They
 * stay pseudocode-only and the language selector is hidden for them. */
export const PSEUDOCODE_ONLY_TRACE_IDS: readonly AlgorithmAnimationId[] = [
  "complexity-growth",
  "pattern-recognition-clues",
  "timed-problem-phases",
  "company-mission-review",
  "final-mastery-readiness",
]

export const codeTraceVariants: Partial<Record<AlgorithmAnimationId, TraceLanguageVariants>> = {
  "arrays-in-place-reversal": {
    python: [
      L("value = nums[index]", 1),
      L(""),
      L("nums[index] = new_value", 3),
      L(""),
      L("left = 0", 5),
      L("right = len(nums) - 1", 6),
      L("while left < right:", 7),
      L("    nums[left], nums[right] = nums[right], nums[left]", 8),
      L("    left += 1", 9),
      L("    right -= 1", 10),
    ],
    cpp: [
      L("int value = nums[index];", 1),
      L(""),
      L("nums[index] = newValue;", 3),
      L(""),
      L("int left = 0;", 5),
      L("int right = nums.size() - 1;", 6),
      L("while (left < right) {", 7),
      L("    swap(nums[left], nums[right]);", 8),
      L("    left++;", 9),
      L("    right--;", 10),
      L("}"),
    ],
    java: [
      L("int value = nums[index];", 1),
      L(""),
      L("nums[index] = newValue;", 3),
      L(""),
      L("int left = 0;", 5),
      L("int right = nums.length - 1;", 6),
      L("while (left < right) {", 7),
      L("    int temp = nums[left];", 8),
      L("    nums[left] = nums[right];", 8),
      L("    nums[right] = temp;", 8),
      L("    left++;", 9),
      L("    right--;", 10),
      L("}"),
    ],
  },

  "hashing-frequency-map": {
    python: [
      L("key = next(items)", 1),
      L("bucket = hash(key) % table_size", 2),
      L(""),
      L("if bucket not in counts:", 4),
      L("    counts[bucket] = 0", 5),
      L("counts[bucket] += 1", 6),
    ],
    cpp: [
      L("string key = nextItem();", 1),
      L("size_t bucket = hash<string>{}(key) % tableSize;", 2),
      L(""),
      L("if (!counts.count(bucket)) {", 4),
      L("    counts[bucket] = 0;", 5),
      L("}"),
      L("counts[bucket]++;", 6),
    ],
    java: [
      L("String key = nextItem();", 1),
      L("int bucket = Math.floorMod(key.hashCode(), tableSize);", 2),
      L(""),
      L("if (!counts.containsKey(bucket)) {", 4),
      L("    counts.put(bucket, 0);", 5),
      L("}"),
      L("counts.put(bucket, counts.get(bucket) + 1);", 6),
    ],
  },

  "hashing-complement-lookup": {
    python: [
      L("seen = {}", 1),
      L("for i, n in enumerate(nums):", 2),
      L("    complement = target - n", 3),
      L("    if complement in seen:", 4),
      L("        return [seen[complement], i]", 5),
      L("    seen[n] = i", 6),
    ],
    cpp: [
      L("unordered_map<int, int> seen;", 1),
      L("for (int i = 0; i < nums.size(); i++) {", 2),
      L("    int complement = target - nums[i];", 3),
      L("    if (seen.count(complement)) {", 4),
      L("        return {seen[complement], i};", 5),
      L("    }"),
      L("    seen[nums[i]] = i;", 6),
      L("}"),
    ],
    java: [
      L("Map<Integer, Integer> seen = new HashMap<>();", 1),
      L("for (int i = 0; i < nums.length; i++) {", 2),
      L("    int complement = target - nums[i];", 3),
      L("    if (seen.containsKey(complement)) {", 4),
      L("        return new int[]{seen.get(complement), i};", 5),
      L("    }"),
      L("    seen.put(nums[i], i);", 6),
      L("}"),
    ],
  },

  "two-pointers-opposite-sum": {
    python: [
      L("left = 0", 1),
      L("right = len(values) - 1", 2),
      L("while left < right:", 3),
      L("    total = values[left] + values[right]", 4),
      L("    if total == target:", 5),
      L("        return True", 6),
      L("    elif total > target:", 7),
      L("        right -= 1", 8),
      L("    else:", 9),
      L("        left += 1", 10),
    ],
    cpp: [
      L("int left = 0;", 1),
      L("int right = values.size() - 1;", 2),
      L("while (left < right) {", 3),
      L("    int sum = values[left] + values[right];", 4),
      L("    if (sum == target) {", 5),
      L("        return true;", 6),
      L("    } else if (sum > target) {", 7),
      L("        right--;", 8),
      L("    } else {", 9),
      L("        left++;", 10),
      L("    }"),
      L("}"),
    ],
    java: [
      L("int left = 0;", 1),
      L("int right = values.length - 1;", 2),
      L("while (left < right) {", 3),
      L("    int sum = values[left] + values[right];", 4),
      L("    if (sum == target) {", 5),
      L("        return true;", 6),
      L("    } else if (sum > target) {", 7),
      L("        right--;", 8),
      L("    } else {", 9),
      L("        left++;", 10),
      L("    }"),
      L("}"),
    ],
  },

  "sliding-window-variable": {
    python: [
      L("left = 0", 1),
      L("window_sum = 0", 2),
      L("best = 0", 3),
      L(""),
      L("for right in range(len(values)):", 5),
      L("    window_sum += values[right]", 6),
      L(""),
      L("    while window_sum > limit:", 8),
      L("        window_sum -= values[left]", 9),
      L("        left += 1", 10),
      L(""),
      L("    best = max(best, right - left + 1)", 12),
    ],
    cpp: [
      L("int left = 0;", 1),
      L("int sum = 0;", 2),
      L("int best = 0;", 3),
      L(""),
      L("for (int right = 0; right < values.size(); right++) {", 5),
      L("    sum += values[right];", 6),
      L(""),
      L("    while (sum > limit) {", 8),
      L("        sum -= values[left];", 9),
      L("        left++;", 10),
      L("    }"),
      L(""),
      L("    best = max(best, right - left + 1);", 12),
      L("}"),
    ],
    java: [
      L("int left = 0;", 1),
      L("int sum = 0;", 2),
      L("int best = 0;", 3),
      L(""),
      L("for (int right = 0; right < values.length; right++) {", 5),
      L("    sum += values[right];", 6),
      L(""),
      L("    while (sum > limit) {", 8),
      L("        sum -= values[left];", 9),
      L("        left++;", 10),
      L("    }"),
      L(""),
      L("    best = Math.max(best, right - left + 1);", 12),
      L("}"),
    ],
  },

  "prefix-sum-range-query": {
    python: [
      L("prefix[0] = values[0]", 1),
      L("for i in range(1, len(values)):", 2),
      L("    prefix[i] = prefix[i - 1] + values[i]", 3),
      L(""),
      L("def range_sum(left, right):", 5),
      L("    if left == 0:", 6),
      L("        return prefix[right]", 7),
      L("    return prefix[right] - prefix[left - 1]", 8),
    ],
    cpp: [
      L("prefix[0] = values[0];", 1),
      L("for (int i = 1; i < values.size(); i++) {", 2),
      L("    prefix[i] = prefix[i - 1] + values[i];", 3),
      L("}"),
      L(""),
      L("int rangeSum(int left, int right) {", 5),
      L("    if (left == 0) {", 6),
      L("        return prefix[right];", 7),
      L("    }"),
      L("    return prefix[right] - prefix[left - 1];", 8),
      L("}"),
    ],
    java: [
      L("prefix[0] = values[0];", 1),
      L("for (int i = 1; i < values.length; i++) {", 2),
      L("    prefix[i] = prefix[i - 1] + values[i];", 3),
      L("}"),
      L(""),
      L("int rangeSum(int left, int right) {", 5),
      L("    if (left == 0) {", 6),
      L("        return prefix[right];", 7),
      L("    }"),
      L("    return prefix[right] - prefix[left - 1];", 8),
      L("}"),
    ],
  },

  "binary-search-decision": {
    python: [
      L("low = 0", 1),
      L("high = len(values) - 1", 2),
      L("while low <= high:", 3),
      L("    mid = (low + high) // 2", 4),
      L("    if values[mid] == target:", 5),
      L("        return mid", 6),
      L("    elif values[mid] < target:", 7),
      L("        low = mid + 1", 8),
      L("    else:", 9),
      L("        high = mid - 1", 10),
    ],
    cpp: [
      L("int low = 0;", 1),
      L("int high = values.size() - 1;", 2),
      L("while (low <= high) {", 3),
      L("    int mid = low + (high - low) / 2;", 4),
      L("    if (values[mid] == target) {", 5),
      L("        return mid;", 6),
      L("    } else if (values[mid] < target) {", 7),
      L("        low = mid + 1;", 8),
      L("    } else {", 9),
      L("        high = mid - 1;", 10),
      L("    }"),
      L("}"),
    ],
    java: [
      L("int low = 0;", 1),
      L("int high = values.length - 1;", 2),
      L("while (low <= high) {", 3),
      L("    int mid = low + (high - low) / 2;", 4),
      L("    if (values[mid] == target) {", 5),
      L("        return mid;", 6),
      L("    } else if (values[mid] < target) {", 7),
      L("        low = mid + 1;", 8),
      L("    } else {", 9),
      L("        high = mid - 1;", 10),
      L("    }"),
      L("}"),
    ],
  },

  "binary-search-monotonic-condition": {
    python: [
      L("low, high, answer = 1, 10, None", 1),
      L("while low <= high:", 2),
      L("    mid = (low + high) // 2", 3),
      L("    if mid * mid >= 30:", 4),
      L("        answer = mid", 5),
      L("        high = mid - 1", 6),
      L("    else:", 7),
      L("        low = mid + 1", 8),
      L("return answer", 9),
    ],
    cpp: [
      L("int low = 1, high = 10, answer = -1;  // -1: none yet", 1),
      L("while (low <= high) {", 2),
      L("    int mid = low + (high - low) / 2;", 3),
      L("    if (mid * mid >= 30) {", 4),
      L("        answer = mid;", 5),
      L("        high = mid - 1;", 6),
      L("    } else {", 7),
      L("        low = mid + 1;", 8),
      L("    }"),
      L("}"),
      L("return answer;", 9),
    ],
    java: [
      L("int low = 1, high = 10, answer = -1;  // -1: none yet", 1),
      L("while (low <= high) {", 2),
      L("    int mid = low + (high - low) / 2;", 3),
      L("    if (mid * mid >= 30) {", 4),
      L("        answer = mid;", 5),
      L("        high = mid - 1;", 6),
      L("    } else {", 7),
      L("        low = mid + 1;", 8),
      L("    }"),
      L("}"),
      L("return answer;", 9),
    ],
  },

  "intervals-merge-overlap": {
    python: [
      L("intervals.sort(key=lambda x: x[0])", 1),
      L(""),
      L("merged = [intervals[0]]", 3),
      L("for interval in intervals[1:]:", 4),
      L("    last = merged[-1]", 5),
      L("    if interval[0] <= last[1]:", 6),
      L("        last[1] = max(last[1], interval[1])", 7),
      L("    else:", 8),
      L("        merged.append(interval)", 9),
    ],
    cpp: [
      L("sort(intervals.begin(), intervals.end());", 1),
      L(""),
      L("vector<vector<int>> merged = {intervals[0]};", 3),
      L("for (int i = 1; i < intervals.size(); i++) {", 4),
      L("    vector<int>& last = merged.back();", 5),
      L("    if (intervals[i][0] <= last[1]) {", 6),
      L("        last[1] = max(last[1], intervals[i][1]);", 7),
      L("    } else {", 8),
      L("        merged.push_back(intervals[i]);", 9),
      L("    }"),
      L("}"),
    ],
    java: [
      L("Arrays.sort(intervals, (a, b) -> a[0] - b[0]);", 1),
      L(""),
      L("List<int[]> merged = new ArrayList<>();", 3),
      L("merged.add(intervals[0]);", 3),
      L("for (int i = 1; i < intervals.length; i++) {", 4),
      L("    int[] last = merged.get(merged.size() - 1);", 5),
      L("    if (intervals[i][0] <= last[1]) {", 6),
      L("        last[1] = Math.max(last[1], intervals[i][1]);", 7),
      L("    } else {", 8),
      L("        merged.add(intervals[i]);", 9),
      L("    }"),
      L("}"),
    ],
  },

  "linked-list-reversal": {
    python: [
      L("prev = None", 1),
      L("curr = head", 2),
      L("while curr is not None:", 3),
      L("    nxt = curr.next", 4),
      L("    curr.next = prev", 5),
      L("    prev = curr", 6),
      L("    curr = nxt", 7),
      L("return prev", 8),
    ],
    cpp: [
      L("ListNode* prev = nullptr;", 1),
      L("ListNode* curr = head;", 2),
      L("while (curr != nullptr) {", 3),
      L("    ListNode* next = curr->next;", 4),
      L("    curr->next = prev;", 5),
      L("    prev = curr;", 6),
      L("    curr = next;", 7),
      L("}"),
      L("return prev;", 8),
    ],
    java: [
      L("ListNode prev = null;", 1),
      L("ListNode curr = head;", 2),
      L("while (curr != null) {", 3),
      L("    ListNode next = curr.next;", 4),
      L("    curr.next = prev;", 5),
      L("    prev = curr;", 6),
      L("    curr = next;", 7),
      L("}"),
      L("return prev;", 8),
    ],
  },

  "linked-list-fast-slow-cycle": {
    python: [
      L("slow = head", 1),
      L("fast = head", 2),
      L("while fast and fast.next:", 3),
      L("    slow = slow.next", 4),
      L("    fast = fast.next.next", 5),
      L("    if slow == fast:", 6),
      L("        return True", 7),
      L("return False", 8),
    ],
    cpp: [
      L("ListNode* slow = head;", 1),
      L("ListNode* fast = head;", 2),
      L("while (fast != nullptr && fast->next != nullptr) {", 3),
      L("    slow = slow->next;", 4),
      L("    fast = fast->next->next;", 5),
      L("    if (slow == fast) {", 6),
      L("        return true;", 7),
      L("    }"),
      L("}"),
      L("return false;", 8),
    ],
    java: [
      L("ListNode slow = head;", 1),
      L("ListNode fast = head;", 2),
      L("while (fast != null && fast.next != null) {", 3),
      L("    slow = slow.next;", 4),
      L("    fast = fast.next.next;", 5),
      L("    if (slow == fast) {", 6),
      L("        return true;", 7),
      L("    }"),
      L("}"),
      L("return false;", 8),
    ],
  },

  "stack-queue-lifo-fifo": {
    python: [
      L("stack.append(item)", 1),
      L("queue.append(item)", 2),
      L(""),
      L("stack.pop()      # removes newest", 4),
      L("queue.popleft()  # removes oldest", 5),
    ],
    cpp: [
      L("stack.push(item);", 1),
      L("queue.push(item);", 2),
      L(""),
      L("stack.pop();  // removes newest", 4),
      L("queue.pop();  // removes oldest", 5),
    ],
    java: [
      L("stack.push(item);", 1),
      L("queue.offer(item);", 2),
      L(""),
      L("stack.pop();   // removes newest", 4),
      L("queue.poll();  // removes oldest", 5),
    ],
  },

  "heap-insert-bubble": {
    python: [
      L("heap.append(value)", 1),
      L("child = len(heap) - 1", 2),
      L(""),
      L("while child > 0 and heap[(child - 1) // 2] > heap[child]:", 4),
      L("    parent = (child - 1) // 2", 5),
      L("    heap[parent], heap[child] = heap[child], heap[parent]", 5),
      L("    child = parent", 6),
    ],
    cpp: [
      L("heap.push_back(value);", 1),
      L("int child = heap.size() - 1;", 2),
      L(""),
      L("while (child > 0 && heap[(child - 1) / 2] > heap[child]) {", 4),
      L("    int parent = (child - 1) / 2;", 5),
      L("    swap(heap[parent], heap[child]);", 5),
      L("    child = parent;", 6),
      L("}"),
    ],
    java: [
      L("heap.add(value);", 1),
      L("int child = heap.size() - 1;", 2),
      L(""),
      L("while (child > 0 && heap.get((child - 1) / 2) > heap.get(child)) {", 4),
      L("    int parent = (child - 1) / 2;", 5),
      L("    Collections.swap(heap, parent, child);", 5),
      L("    child = parent;", 6),
      L("}"),
    ],
  },

  "trie-prefix-branch": {
    python: [
      L("node = root", 1),
      L("for ch in word:", 2),
      L("    if ch not in node.children:", 3),
      L("        node.children[ch] = TrieNode()", 4),
      L("    node = node.children[ch]", 5),
      L("node.is_word = True", 6),
    ],
    cpp: [
      L("TrieNode* node = root;", 1),
      L("for (char ch : word) {", 2),
      L("    if (!node->children.count(ch)) {", 3),
      L("        node->children[ch] = new TrieNode();", 4),
      L("    }"),
      L("    node = node->children[ch];", 5),
      L("}"),
      L("node->isWord = true;", 6),
    ],
    java: [
      L("TrieNode node = root;", 1),
      L("for (char ch : word.toCharArray()) {", 2),
      L("    if (!node.children.containsKey(ch)) {", 3),
      L("        node.children.put(ch, new TrieNode());", 4),
      L("    }"),
      L("    node = node.children.get(ch);", 5),
      L("}"),
      L("node.isWord = true;", 6),
    ],
  },

  "recursion-factorial-unwind": {
    python: [
      L("def factorial(n):", 1),
      L("    if n == 0:", 2),
      L("        return 1", 3),
      L("    return n * factorial(n - 1)", 4),
    ],
    cpp: [
      L("long long factorial(int n) {", 1),
      L("    if (n == 0) {", 2),
      L("        return 1;", 3),
      L("    }"),
      L("    return n * factorial(n - 1);", 4),
      L("}"),
    ],
    java: [
      L("long factorial(int n) {", 1),
      L("    if (n == 0) {", 2),
      L("        return 1;", 3),
      L("    }"),
      L("    return n * factorial(n - 1);", 4),
      L("}"),
    ],
  },

  "backtracking-choose-undo": {
    python: [
      L("path = []", 1),
      L("def backtrack(start):", 2),
      L("    if is_valid(path):", 3),
      L("        record(path)", 4),
      L("    for choice in remaining_choices(start):", 5),
      L("        path.append(choice)", 6),
      L("        backtrack(next_start)", 7),
      L("        path.pop()", 8),
    ],
    cpp: [
      L("vector<int> path;", 1),
      L("void backtrack(int start) {", 2),
      L("    if (isValid(path)) {", 3),
      L("        record(path);", 4),
      L("    }"),
      L("    for (int choice : remainingChoices(start)) {", 5),
      L("        path.push_back(choice);", 6),
      L("        backtrack(nextStart);", 7),
      L("        path.pop_back();", 8),
      L("    }"),
      L("}"),
    ],
    java: [
      L("List<Integer> path = new ArrayList<>();", 1),
      L("void backtrack(int start) {", 2),
      L("    if (isValid(path)) {", 3),
      L("        record(path);", 4),
      L("    }"),
      L("    for (int choice : remainingChoices(start)) {", 5),
      L("        path.add(choice);", 6),
      L("        backtrack(nextStart);", 7),
      L("        path.remove(path.size() - 1);", 8),
      L("    }"),
      L("}"),
    ],
  },

  "tree-preorder-traversal": {
    python: [
      L("def preorder(node):", 1),
      L("    if node is None:", 2),
      L("        return", 3),
      L("    visit(node)", 4),
      L("    preorder(node.left)", 5),
      L("    preorder(node.right)", 6),
    ],
    cpp: [
      L("void preorder(TreeNode* node) {", 1),
      L("    if (node == nullptr) {", 2),
      L("        return;", 3),
      L("    }"),
      L("    visit(node);", 4),
      L("    preorder(node->left);", 5),
      L("    preorder(node->right);", 6),
      L("}"),
    ],
    java: [
      L("void preorder(TreeNode node) {", 1),
      L("    if (node == null) {", 2),
      L("        return;", 3),
      L("    }"),
      L("    visit(node);", 4),
      L("    preorder(node.left);", 5),
      L("    preorder(node.right);", 6),
      L("}"),
    ],
  },

  "bst-search-invariant": {
    python: [
      L("def search(node, target):", 1),
      L("    if node is None or node.val == target:", 2),
      L("        return node", 3),
      L("    if target < node.val:", 4),
      L("        return search(node.left, target)", 5),
      L("    return search(node.right, target)", 6),
    ],
    cpp: [
      L("TreeNode* search(TreeNode* node, int target) {", 1),
      L("    if (node == nullptr || node->val == target) {", 2),
      L("        return node;", 3),
      L("    }"),
      L("    if (target < node->val) {", 4),
      L("        return search(node->left, target);", 5),
      L("    }"),
      L("    return search(node->right, target);", 6),
      L("}"),
    ],
    java: [
      L("TreeNode search(TreeNode node, int target) {", 1),
      L("    if (node == null || node.val == target) {", 2),
      L("        return node;", 3),
      L("    }"),
      L("    if (target < node.val) {", 4),
      L("        return search(node.left, target);", 5),
      L("    }"),
      L("    return search(node.right, target);", 6),
      L("}"),
    ],
  },

  "graph-adjacency-build": {
    python: [
      L("graph = defaultdict(list)", 1),
      L("for a, b in edges:", 2),
      L("    graph[a].append(b)", 3),
      L("    graph[b].append(a)", 4),
    ],
    cpp: [
      L("unordered_map<int, vector<int>> graph;", 1),
      L("for (auto& edge : edges) {", 2),
      L("    int a = edge[0], b = edge[1];", 2),
      L("    graph[a].push_back(b);", 3),
      L("    graph[b].push_back(a);", 4),
      L("}"),
    ],
    java: [
      L("Map<Integer, List<Integer>> graph = new HashMap<>();", 1),
      L("for (int[] edge : edges) {", 2),
      L("    int a = edge[0], b = edge[1];", 2),
      L("    graph.computeIfAbsent(a, k -> new ArrayList<>()).add(b);", 3),
      L("    graph.computeIfAbsent(b, k -> new ArrayList<>()).add(a);", 4),
      L("}"),
    ],
  },

  "dfs-bfs-frontier": {
    python: [
      L("stack = [start]         # DFS", 1),
      L("queue = deque([start])  # BFS", 2),
      L(""),
      L("while frontier:  # stack or queue", 4),
      L("    node = frontier.pop()  # BFS: popleft()", 5),
      L("    visit(node)", 6),
      L("    push_unvisited_neighbors(node)", 7),
    ],
    cpp: [
      L("stack<int> dfsFrontier;  dfsFrontier.push(start);", 1),
      L("queue<int> bfsFrontier;  bfsFrontier.push(start);", 2),
      L(""),
      L("while (!frontier.empty()) {  // stack or queue", 4),
      L("    int node = frontier.top();  // BFS: front()", 5),
      L("    frontier.pop();", 5),
      L("    visit(node);", 6),
      L("    pushUnvisitedNeighbors(node);", 7),
      L("}"),
    ],
    java: [
      L("Deque<Integer> stack = new ArrayDeque<>(List.of(start));", 1),
      L("Queue<Integer> queue = new ArrayDeque<>(List.of(start));", 2),
      L(""),
      L("while (!frontier.isEmpty()) {  // stack or queue", 4),
      L("    int node = frontier.remove();  // pop or poll", 5),
      L("    visit(node);", 6),
      L("    pushUnvisitedNeighbors(node);", 7),
      L("}"),
    ],
  },

  "grid-graph-frontier": {
    python: [
      L("visited = {start}", 1),
      L("frontier = [start]", 2),
      L("while frontier:", 3),
      L("    cell = frontier.pop()", 4),
      L("    for neighbor in valid_neighbors(cell):", 5),
      L("        if neighbor not in visited:", 6),
      L("            visited.add(neighbor)", 7),
      L("            frontier.append(neighbor)", 8),
    ],
    cpp: [
      L("set<Cell> visited = {start};", 1),
      L("vector<Cell> frontier = {start};", 2),
      L("while (!frontier.empty()) {", 3),
      L("    Cell cell = frontier.back();", 4),
      L("    frontier.pop_back();", 4),
      L("    for (Cell neighbor : validNeighbors(cell)) {", 5),
      L("        if (!visited.count(neighbor)) {", 6),
      L("            visited.insert(neighbor);", 7),
      L("            frontier.push_back(neighbor);", 8),
      L("        }"),
      L("    }"),
      L("}"),
    ],
    java: [
      L("Set<Cell> visited = new HashSet<>(List.of(start));", 1),
      L("Deque<Cell> frontier = new ArrayDeque<>(List.of(start));", 2),
      L("while (!frontier.isEmpty()) {", 3),
      L("    Cell cell = frontier.pop();", 4),
      L("    for (Cell neighbor : validNeighbors(cell)) {", 5),
      L("        if (!visited.contains(neighbor)) {", 6),
      L("            visited.add(neighbor);", 7),
      L("            frontier.push(neighbor);", 8),
      L("        }"),
      L("    }"),
      L("}"),
    ],
  },

  "topological-sort-kahn": {
    python: [
      L("indegree = compute_indegrees(edges)", 1),
      L("queue = deque(n for n in nodes if indegree[n] == 0)", 2),
      L("output = []", 3),
      L(""),
      L("while queue:", 5),
      L("    node = queue.popleft()", 6),
      L("    output.append(node)", 7),
      L("    for neighbor in graph[node]:", 8),
      L("        indegree[neighbor] -= 1", 9),
      L("        if indegree[neighbor] == 0:", 10),
      L("            queue.append(neighbor)", 11),
    ],
    cpp: [
      L("vector<int> indegree = computeIndegrees(edges);", 1),
      L("queue<int> q;", 2),
      L("for (int n : nodes) if (indegree[n] == 0) q.push(n);", 2),
      L("vector<int> output;", 3),
      L(""),
      L("while (!q.empty()) {", 5),
      L("    int node = q.front();", 6),
      L("    q.pop();", 6),
      L("    output.push_back(node);", 7),
      L("    for (int neighbor : graph[node]) {", 8),
      L("        indegree[neighbor]--;", 9),
      L("        if (indegree[neighbor] == 0) {", 10),
      L("            q.push(neighbor);", 11),
      L("        }"),
      L("    }"),
      L("}"),
    ],
    java: [
      L("int[] indegree = computeIndegrees(edges);", 1),
      L("Queue<Integer> queue = new ArrayDeque<>();", 2),
      L("for (int n : nodes) if (indegree[n] == 0) queue.add(n);", 2),
      L("List<Integer> output = new ArrayList<>();", 3),
      L(""),
      L("while (!queue.isEmpty()) {", 5),
      L("    int node = queue.poll();", 6),
      L("    output.add(node);", 7),
      L("    for (int neighbor : graph.get(node)) {", 8),
      L("        indegree[neighbor]--;", 9),
      L("        if (indegree[neighbor] == 0) {", 10),
      L("            queue.add(neighbor);", 11),
      L("        }"),
      L("    }"),
      L("}"),
    ],
  },

  "union-find-compression": {
    python: [
      L("def find(x):", 1),
      L("    path = [x]", 2),
      L("    while parent[x] != x:", 3),
      L("        x = parent[x]", 4),
      L("        path.append(x)", 5),
      L("    for node in path:", 6),
      L("        parent[node] = x   # path compression", 7),
      L("    return x", 8),
    ],
    cpp: [
      L("int find(int x) {", 1),
      L("    vector<int> path = {x};", 2),
      L("    while (parent[x] != x) {", 3),
      L("        x = parent[x];", 4),
      L("        path.push_back(x);", 5),
      L("    }"),
      L("    for (int node : path) {", 6),
      L("        parent[node] = x;   // path compression", 7),
      L("    }"),
      L("    return x;", 8),
      L("}"),
    ],
    java: [
      L("int find(int x) {", 1),
      L("    List<Integer> path = new ArrayList<>();", 2),
      L("    path.add(x);", 2),
      L("    while (parent[x] != x) {", 3),
      L("        x = parent[x];", 4),
      L("        path.add(x);", 5),
      L("    }"),
      L("    for (int node : path) {", 6),
      L("        parent[node] = x;   // path compression", 7),
      L("    }"),
      L("    return x;", 8),
      L("}"),
    ],
  },

  "greedy-interval-selection": {
    python: [
      L("intervals.sort(key=lambda x: x[1])", 1),
      L("selected = []", 2),
      L('last_end = float("-inf")', 3),
      L(""),
      L("for interval in intervals:", 5),
      L("    if interval[0] >= last_end:", 6),
      L("        selected.append(interval)", 7),
      L("        last_end = interval[1]", 8),
    ],
    cpp: [
      L("sort(intervals.begin(), intervals.end(),", 1),
      L("     [](auto& a, auto& b) { return a[1] < b[1]; });", 1),
      L("vector<vector<int>> selected;", 2),
      L("long long lastEnd = LLONG_MIN;", 3),
      L(""),
      L("for (auto& interval : intervals) {", 5),
      L("    if (interval[0] >= lastEnd) {", 6),
      L("        selected.push_back(interval);", 7),
      L("        lastEnd = interval[1];", 8),
      L("    }"),
      L("}"),
    ],
    java: [
      L("Arrays.sort(intervals, (a, b) -> Integer.compare(a[1], b[1]));", 1),
      L("List<int[]> selected = new ArrayList<>();", 2),
      L("long lastEnd = Long.MIN_VALUE;", 3),
      L(""),
      L("for (int[] interval : intervals) {", 5),
      L("    if (interval[0] >= lastEnd) {", 6),
      L("        selected.add(interval);", 7),
      L("        lastEnd = interval[1];", 8),
      L("    }"),
      L("}"),
    ],
  },

  "dp-1d-fill": {
    python: [
      L("dp[0] = 1", 1),
      L("dp[1] = 1", 2),
      L("for i in range(2, n):", 3),
      L("    dp[i] = dp[i - 1] + dp[i - 2]", 4),
    ],
    cpp: [
      L("dp[0] = 1;", 1),
      L("dp[1] = 1;", 2),
      L("for (int i = 2; i < n; i++) {", 3),
      L("    dp[i] = dp[i - 1] + dp[i - 2];", 4),
      L("}"),
    ],
    java: [
      L("dp[0] = 1;", 1),
      L("dp[1] = 1;", 2),
      L("for (int i = 2; i < n; i++) {", 3),
      L("    dp[i] = dp[i - 1] + dp[i - 2];", 4),
      L("}"),
    ],
  },

  "dp-2d-grid-paths": {
    python: [
      L("for r in range(rows):", 1),
      L("    dp[r][0] = 1", 1),
      L("for c in range(cols):", 2),
      L("    dp[0][c] = 1", 2),
      L(""),
      L("for r in range(1, rows):", 4),
      L("    for c in range(1, cols):", 5),
      L("        dp[r][c] = dp[r - 1][c] + dp[r][c - 1]", 6),
    ],
    cpp: [
      L("for (int r = 0; r < rows; r++) {", 1),
      L("    dp[r][0] = 1;", 1),
      L("}"),
      L("for (int c = 0; c < cols; c++) {", 2),
      L("    dp[0][c] = 1;", 2),
      L("}"),
      L(""),
      L("for (int r = 1; r < rows; r++) {", 4),
      L("    for (int c = 1; c < cols; c++) {", 5),
      L("        dp[r][c] = dp[r - 1][c] + dp[r][c - 1];", 6),
      L("    }"),
      L("}"),
    ],
    java: [
      L("for (int r = 0; r < rows; r++) {", 1),
      L("    dp[r][0] = 1;", 1),
      L("}"),
      L("for (int c = 0; c < cols; c++) {", 2),
      L("    dp[0][c] = 1;", 2),
      L("}"),
      L(""),
      L("for (int r = 1; r < rows; r++) {", 4),
      L("    for (int c = 1; c < cols; c++) {", 5),
      L("        dp[r][c] = dp[r - 1][c] + dp[r][c - 1];", 6),
      L("    }"),
      L("}"),
    ],
  },

  "dp-take-skip": {
    python: [
      L("take = value[i] + solve(i - cost)", 1),
      L("skip = solve(i - 1)", 2),
      L("result = max(take, skip)", 3),
    ],
    cpp: [
      L("int take = value[i] + solve(i - cost);", 1),
      L("int skip = solve(i - 1);", 2),
      L("int result = max(take, skip);", 3),
    ],
    java: [
      L("int take = value[i] + solve(i - cost);", 1),
      L("int skip = solve(i - 1);", 2),
      L("int result = Math.max(take, skip);", 3),
    ],
  },
}

// ── Resolution (used by CodeTracePanel) ─────────────────────────────────

export interface TraceDisplayLine {
  text: string
  /** 1-indexed position within the DISPLAYED listing (not a semantic key). */
  displayNumber: number
  active: boolean
  executed: boolean
}

export function getTraceVariants(id: AlgorithmAnimationId | undefined): TraceLanguageVariants | undefined {
  return id ? codeTraceVariants[id] : undefined
}

/** The language actually shown: the requested one when this trace has it,
 * otherwise Pseudocode. Never throws for an unknown/missing variant. */
export function effectiveTraceLanguage(
  requested: TraceLanguage,
  variants: TraceLanguageVariants | undefined,
): TraceLanguage {
  if (requested === "pseudocode" || !variants) return "pseudocode"
  return variants[requested]?.length ? requested : "pseudocode"
}

/** Maps the CURRENT semantic state to displayed lines for one language.
 * Highlighting follows the state's active/executed pseudocode segments, so
 * switching language changes only the source shown — never the step. */
export function resolveTraceLines(
  trace: AlgorithmCodeTrace,
  state: CodeTraceState,
  language: TraceLanguage,
  variants: TraceLanguageVariants | undefined,
): TraceDisplayLine[] {
  const activeSet = new Set(state.activeLines)
  const executedSet = new Set(state.executedLines ?? [])
  const shown = effectiveTraceLanguage(language, variants)

  if (shown === "pseudocode") {
    return trace.pseudocode.map((text, i) => {
      const segment = i + 1
      const active = activeSet.has(segment)
      return { text, displayNumber: segment, active, executed: !active && executedSet.has(segment) }
    })
  }

  return (variants![shown as TraceSourceLanguage]).map((line, i) => {
    const active = line.implements.some(segment => activeSet.has(segment))
    const executed = !active && line.implements.some(segment => executedSet.has(segment))
    return { text: line.code, displayNumber: i + 1, active, executed }
  })
}

/** The listing with the most lines (any available language). Rendered
 * invisibly beneath the visible one so switching language never changes the
 * panel's height. */
export function tallestTraceListing(trace: AlgorithmCodeTrace, variants: TraceLanguageVariants | undefined): string[] {
  const listings: string[][] = [trace.pseudocode]
  if (variants) for (const lang of ["python", "cpp", "java"] as const) listings.push(variants[lang].map(line => line.code))
  return listings.reduce((best, current) => (current.length > best.length ? current : best))
}

// ── Validation ───────────────────────────────────────────────────────────

const SOURCE_LANGUAGES: readonly TraceSourceLanguage[] = ["python", "cpp", "java"]

/** Structural audit of one trace's language variants. Algorithmic traces
 * must carry python/cpp/java; procedural (pseudocode-only) traces must carry
 * none. Every semantic segment a state highlights must exist in every
 * language, and no mapping may point outside the pseudocode. */
export function validateTraceVariants(id: AlgorithmAnimationId, trace: AlgorithmCodeTrace): string[] {
  const errors: string[] = []
  const variants = codeTraceVariants[id]
  const pseudoOnly = PSEUDOCODE_ONLY_TRACE_IDS.includes(id)

  if (pseudoOnly) {
    if (variants) errors.push(`"${id}": procedural trace is pseudocode-only but has language variants.`)
    return errors
  }
  if (!variants) {
    errors.push(`"${id}": algorithmic trace has no language variants.`)
    return errors
  }

  for (const key of Object.keys(variants)) {
    if (!(SOURCE_LANGUAGES as readonly string[]).includes(key)) errors.push(`"${id}": invalid language variant "${key}".`)
  }

  const maxSegment = trace.pseudocode.length
  for (const language of SOURCE_LANGUAGES) {
    const lines = variants[language]
    if (!lines || lines.length === 0) {
      errors.push(`"${id}": missing ${language} variant.`)
      continue
    }
    if (!lines.some(line => line.code.trim().length > 0)) errors.push(`"${id}" ${language}: code block is empty.`)

    const covered = new Set<number>()
    lines.forEach((line, i) => {
      for (const segment of line.implements) {
        if (!Number.isInteger(segment) || segment < 1 || segment > maxSegment) {
          errors.push(`"${id}" ${language} line ${i + 1}: invalid segment ${segment} (pseudocode has ${maxSegment} lines).`)
        }
        covered.add(segment)
      }
      if (line.implements.length > 0 && line.code.trim().length === 0) {
        errors.push(`"${id}" ${language} line ${i + 1}: blank line is mapped to a semantic segment.`)
      }
    })

    trace.states.forEach((state, stateIndex) => {
      for (const segment of state.activeLines) {
        if (!covered.has(segment)) errors.push(`"${id}" ${language}: state ${stateIndex} active segment ${segment} has no displayed line.`)
      }
      for (const segment of state.executedLines ?? []) {
        if (!covered.has(segment)) errors.push(`"${id}" ${language}: state ${stateIndex} executed segment ${segment} has no displayed line.`)
      }
    })
  }

  return errors
}
