// Linked Lists — authored directly in the new content model, replacing the
// old legacy River Crossing TrailNodes (4-6). Module id stays
// "linked-structures" (NOT renamed to "linked-lists") so the scenic map's
// existing tile in BiomeTrailMap.tsx keeps resolving it correctly.

import type { Checkpoint, Module } from "../types"

const fundamentals: Checkpoint = {
  id: "linked-structures-1",
  title: "Linked List Fundamentals",
  subtitle: "Nodes, next pointers, and traversal",
  type: "lesson",
  xp: 30,
  prerequisites: [],
  workspace: {
    title: "Linked List Fundamentals",
    theory: [
      {
        heading: "What a node is",
        body: "A linked list node holds a value and a pointer (`next`) to the following node — unlike an array, nodes aren't stored contiguously in memory.",
      },
      {
        heading: "Singly linked traversal",
        body: "Start at `head` and follow `.next` until you reach `null` — that's the entire pattern behind almost every linked-list operation.",
      },
      {
        heading: "Arrays vs. linked lists",
        body: "Arrays give O(1) random access but O(n) insertion in the middle. Linked lists give O(1) insertion/removal once you're at the right node, but O(n) to reach it.",
      },
    ],
    quickCheck: {
      question: "What does a singly linked list node need, at minimum?",
      options: ["A value and a next pointer", "A value and an index", "Two pointers to neighbors", "A fixed-size array slot"],
      correctIndex: 0,
      explanation: "A singly linked node only needs its value and a reference to the next node — that's what makes traversal a one-directional walk.",
    },
  },
}

const traversalAndPointers: Checkpoint = {
  id: "linked-structures-2",
  title: "Traversal & Pointer Manipulation",
  subtitle: "Insert, delete, and reverse",
  type: "lesson",
  xp: 30,
  prerequisites: [fundamentals.id],
  workspace: {
    title: "Traversal & Pointer Manipulation",
    theory: [
      {
        heading: "Insertion and deletion",
        body: "To insert after a node, point the new node's `next` at what the current node pointed to, then point the current node at the new node — order matters, or you lose the rest of the list.",
      },
      {
        heading: "Reversing a list",
        body: "Walk the list with three pointers — `prev`, `curr`, `next` — flipping each node's `next` to point backward as you go, one step at a time.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
      },
      {
        language: "cpp",
        code: `ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;
    while (curr) {
        ListNode* nxt = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}`,
      },
      {
        language: "java",
        code: `ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode curr = head;
    while (curr != null) {
        ListNode nxt = curr.next;
        curr.next = prev;
        prev = curr;
        curr = nxt;
    }
    return prev;
}`,
      },
    ],
    quickCheck: {
      question: "When reversing a list iteratively, why do you save `next` before reassigning `curr.next`?",
      options: [
        "You don't need to — it's optional",
        "Because reassigning curr.next overwrites your only link to the rest of the list",
        "To make the code run faster",
        "Because Python requires it",
      ],
      correctIndex: 1,
      explanation: "Once you set curr.next = prev, you've lost the original next node — saving it first is what lets you keep walking forward.",
    },
  },
}

const fastSlowPointer: Checkpoint = {
  id: "linked-structures-3",
  title: "Fast / Slow Pointer",
  subtitle: "Cycle detection and the midpoint trick",
  type: "lesson",
  xp: 30,
  prerequisites: [traversalAndPointers.id],
  workspace: {
    title: "Fast / Slow Pointer",
    theory: [
      {
        heading: "Two speeds, one list",
        body: "Move one pointer one step at a time and another two steps at a time. If the list has a cycle, the fast pointer will eventually lap the slow one and they'll meet.",
      },
      {
        heading: "Finding the midpoint",
        body: "The same trick finds the middle of a list in one pass: when the fast pointer reaches the end, the slow pointer is sitting at the midpoint.",
      },
    ],
    quickCheck: {
      question: "In a list with a cycle, what happens to a fast pointer moving 2 steps for every 1 step of a slow pointer?",
      options: [
        "It runs off the end of the list",
        "It eventually meets the slow pointer inside the cycle",
        "It moves at the same speed as the slow pointer",
        "It causes an infinite loop with no resolution",
      ],
      correctIndex: 1,
      explanation: "Inside a cycle, the fast pointer gains one step on the slow pointer every iteration — it's guaranteed to catch up and meet it.",
    },
  },
}

const codeLab: Checkpoint = {
  id: "linked-structures-4",
  title: "Linked List Code Lab",
  subtitle: "Implement reversal yourself",
  type: "challenge",
  xp: 40,
  prerequisites: [fastSlowPointer.id],
  workspace: {
    title: "Linked List Code Lab",
    theory: [
      {
        heading: "Your turn",
        body: "You've seen the three-pointer reversal pattern explained and worked through. Now implement it from scratch.",
      },
    ],
    codeExamples: [
      {
        language: "python",
        code: `def reverseList(head):
    prev = None
    curr = head
    while curr:
        nxt = curr.next
        curr.next = prev
        prev = curr
        curr = nxt
    return prev`,
      },
    ],
    codingActivity: {
      prompt: "Implement reverseList(head) that reverses a singly linked list in place and returns the new head.",
      constraints: ["0 ≤ number of nodes ≤ 5000"],
      functionName: "reverseList",
      requiredKeywords: ["next", "prev"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def reverseList(head):\n    # your code here\n    pass\n",
        cpp: "ListNode* reverseList(ListNode* head) {\n    // your code here\n}\n",
        java: "ListNode reverseList(ListNode head) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Several nodes", input: "[1,2,3,4,5]", expected: "[5,4,3,2,1]" },
        { id: "v2", description: "Single node", input: "[7]", expected: "[7]" },
        { id: "v3", description: "Two nodes", input: "[1,2]", expected: "[2,1]" },
      ],
      hiddenTests: [
        { id: "h1", description: "Longer list", input: "[1,2,3,4,5,6,7]", expected: "[7,6,5,4,3,2,1]" },
        { id: "h2", description: "Repeated values", input: "[2,2,3]", expected: "[3,2,2]" },
        { id: "h3", description: "Empty list", input: "[]", expected: "[]" },
      ],
      hint: "Track three pointers — prev, curr, and next — and flip curr.next to point at prev on each step, then advance all three.",
      mistakeFeedback: "You're walking the list but not actually flipping each node's next pointer to point backward — reversal happens by rewiring next, not by reading the list into a new structure.",
    },
  },
  questionIds: ["q-linked-list-reverse", "q-linked-list-cycle"],
}

const mastery: Checkpoint = {
  id: "linked-structures-5",
  title: "Linked List Interview Challenge",
  subtitle: "Merge two sorted lists — module mastery",
  type: "boss",
  xp: 60,
  masteryXp: 100,
  prerequisites: [codeLab.id],
  workspace: {
    title: "Linked List Interview Challenge",
    theory: [
      {
        heading: "Merging without extra space",
        body: "You don't need to build a new list — splice the existing nodes together by always attaching the smaller of the two current heads, then advancing that pointer.",
      },
    ],
    codingActivity: {
      prompt: "Implement mergeTwoLists(l1, l2) that merges two sorted linked lists into one sorted list by splicing the existing nodes together, and returns the new head.",
      constraints: ["0 ≤ number of nodes in each list ≤ 50", "Both lists are sorted in non-decreasing order"],
      functionName: "mergeTwoLists",
      requiredKeywords: ["next", "while"],
      languages: ["python", "cpp", "java"],
      starterCode: {
        python: "def mergeTwoLists(l1, l2):\n    # your code here\n    pass\n",
        cpp: "ListNode* mergeTwoLists(ListNode* l1, ListNode* l2) {\n    // your code here\n}\n",
        java: "ListNode mergeTwoLists(ListNode l1, ListNode l2) {\n    // your code here\n}\n",
      },
      visibleTests: [
        { id: "v1", description: "Interleaved values", input: "l1=[1,2,4], l2=[1,3,4]", expected: "[1,1,2,3,4,4]" },
        { id: "v2", description: "One list empty", input: "l1=[], l2=[0]", expected: "[0]" },
        { id: "v3", description: "Both non-empty, no overlap", input: "l1=[1,2], l2=[3,4]", expected: "[1,2,3,4]" },
      ],
      hiddenTests: [
        { id: "h1", description: "l2 entirely smaller", input: "l1=[5,6], l2=[1,2]", expected: "[1,2,5,6]" },
        { id: "h2", description: "Single-node lists", input: "l1=[2], l2=[1]", expected: "[1,2]" },
        { id: "h3", description: "Both lists empty", input: "l1=[], l2=[]", expected: "[]" },
      ],
      hint: "Use a dummy head node, then repeatedly attach whichever of l1/l2's current node is smaller and advance that list's pointer.",
      mistakeFeedback: "This looks like it's only walking one list and appending the other at the end, rather than interleaving nodes by comparing values at each step — that produces an unsorted result.",
    },
  },
  questionIds: ["q-merge-two-sorted-lists"],
}

export const linkedListsModule: Module = {
  id: "linked-structures",
  title: "Linked Lists",
  description: "Pointer manipulation, traversal, reversal, and the fast/slow pointer technique.",
  icon: "🌊",
  accentColor: "#38BDF8",
  contentKind: "workspace",
  checkpoints: [fundamentals, traversalAndPointers, fastSlowPointer, codeLab, mastery],
}
