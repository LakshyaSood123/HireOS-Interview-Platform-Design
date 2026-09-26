// Module Mastery Quiz — Linked Lists (module id "linked-structures").
// Written from linked-structures-1..5: nodes and next pointers, traversal
// from head to null, arrays versus linked lists, insertion order, the
// prev/curr/next reversal, fast and slow pointers for cycles and the
// midpoint, and merging two sorted lists by splicing existing nodes.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

const REVERSE_CODE =
  "prev = None\ncurr = head\nwhile curr:\n    nxt = curr.next\n    curr.next = prev\n    prev = curr\n    curr = nxt\nreturn prev"

export const linkedListsQuiz: ModuleMasteryQuiz = {
  id: "linked-structures-mastery",
  moduleId: "linked-structures",
  title: "Linked Lists Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "linked-structures-q1",
      concept: "Node structure",
      difficulty: "foundation",
      prompt: "How are the nodes of a linked list stored, compared with the slots of an array?",
      options: [
        "Side by side in one block of memory.",
        "Anywhere in memory, connected by next pointers.",
        "In sorted order by their values.",
        "In a table that is indexed by position.",
      ],
      correct: "b",
      explanation:
        "Unlike an array, linked list nodes are not stored contiguously. Each node holds a value and a pointer to the following node, and those pointers are what tie the list together.",
    }),
    singleSelect({
      id: "linked-structures-q2",
      concept: "Traversal",
      difficulty: "foundation",
      prompt: "You are given only the head of a singly linked list. How do you visit every node?",
      options: [
        "Read node[0], node[1], and so on, by index.",
        "Start at the last node and move backward.",
        "Jump to the middle node, then move outward.",
        "Start at head and follow .next until null.",
      ],
      correct: "d",
      explanation:
        "A singly linked node only knows its next node, so the walk is one-directional: start at head and follow .next until you reach null. That is the pattern behind almost every linked list operation.",
    }),
    singleSelect({
      id: "linked-structures-q3",
      concept: "Arrays vs lists",
      difficulty: "application",
      prompt: "Which is a real strength of a linked list compared with an array?",
      options: [
        "Insertion is O(1) once you hold the right node.",
        "Reaching the 500th element is O(1).",
        "It uses less memory than an array of the same size.",
        "Searching for a value takes O(log n).",
      ],
      correct: "a",
      explanation:
        "Once you are at the right node, inserting or removing only rewires pointers. Reaching that node still takes O(n), and O(1) random access is the array's strength, not the list's.",
    }),
    singleSelect({
      id: "linked-structures-q4",
      concept: "Insertion order",
      difficulty: "application",
      prompt: "You want to insert a new node after cur without losing the rest of the list. Which order works?",
      options: [
        "cur.next = new\nnew.next = cur.next",
        "new.next = None\ncur.next = new",
        "new.next = cur.next\ncur.next = new",
        "cur.next = None\nnew.next = cur",
      ],
      correct: "c",
      explanation:
        "Point the new node at what cur pointed to first, then point cur at the new node. Doing it the other way round overwrites cur.next before you have saved it, so the rest of the list is lost.",
    }),
    singleSelect({
      id: "linked-structures-q5",
      concept: "Reversal",
      difficulty: "application",
      prompt: "The list is 1 → 2 → 3. After the first pass through the loop (curr started at node 1), what are prev and curr?",
      code: REVERSE_CODE,
      options: [
        "prev = None, curr = node 2",
        "prev = node 1, curr = node 2",
        "prev = node 2, curr = node 1",
        "prev = node 1, curr = None",
      ],
      correct: "b",
      explanation:
        "nxt saves node 2, then node 1's next is pointed backward at None, prev moves to node 1, and curr moves to node 2. The rest of the list is still reachable through curr.",
    }),
    singleSelect({
      id: "linked-structures-q6",
      concept: "Cycle detection",
      difficulty: "application",
      prompt: "Slow moves 1 step and fast moves 2 steps. Fast reaches the end of the list (null). What does that tell you?",
      options: [
        "The list has no cycle.",
        "The list has a cycle.",
        "Slow is still at the head.",
        "The list is empty.",
      ],
      correct: "a",
      explanation:
        "If a list has a cycle, the fast pointer never reaches null; it laps the slow pointer inside the cycle and they meet. Reaching the end means there is no cycle.",
    }),
    singleSelect({
      id: "linked-structures-q7",
      concept: "Midpoint",
      difficulty: "application",
      prompt: "The list is 1 → 2 → 3 → 4 → 5. Slow moves 1 step and fast moves 2 steps at a time. When fast reaches the end, where is slow?",
      options: ["Node 2", "Node 4", "Node 5", "Node 3"],
      correct: "d",
      explanation:
        "Slow visits 1, 2, 3 while fast visits 1, 3, 5. When fast reaches the end at node 5, slow is at node 3, the middle of the list.",
    }),
    singleSelect({
      id: "linked-structures-q8",
      concept: "Merging",
      difficulty: "application",
      prompt: "When merging two sorted lists, what happens at each step?",
      options: [
        "Copy the values into a new list and sort it.",
        "Attach the larger head and advance that pointer.",
        "Attach the smaller head and advance that list.",
        "Take nodes from the two lists in turn.",
      ],
      correct: "c",
      explanation:
        "Always attach the smaller of the two current heads, then advance the pointer of the list it came from. That keeps the result sorted.",
    }),
    singleSelect({
      id: "linked-structures-q9",
      concept: "Merging",
      difficulty: "application",
      prompt: "What does it mean to merge two lists by splicing, without extra space?",
      options: [
        "Reusing the existing nodes by changing next pointers.",
        "Building a fresh node for every value.",
        "Copying every value into an array first.",
        "Reversing one of the lists before merging.",
      ],
      correct: "a",
      explanation:
        "You do not need to build a new list. The existing nodes are spliced together by pointing their next fields at the right neighbour.",
    }),
    singleSelect({
      id: "linked-structures-q10",
      concept: "Midpoint",
      difficulty: "foundation",
      prompt: "What is the advantage of the fast and slow trick for finding the middle of a list?",
      options: [
        "It needs the length counted first.",
        "It finds the middle in a single pass.",
        "It only works on arrays.",
        "It requires a doubly linked list.",
      ],
      correct: "b",
      explanation:
        "The two pointers move together, so when fast reaches the end slow is already at the midpoint. No separate pass to count nodes is needed.",
    }),
    singleSelect({
      id: "linked-structures-q11",
      concept: "Edge cases",
      difficulty: "challenge",
      prompt: "What does this reverseList code return when head is None (an empty list)?",
      code: REVERSE_CODE,
      options: [
        "It raises an error.",
        "It returns a list with one empty node.",
        "It loops forever.",
        "None, since the loop never runs.",
      ],
      correct: "d",
      explanation:
        "curr starts as None, so the while loop is skipped. prev is still None, and that is what gets returned: an empty list reversed is still empty.",
    }),
    multiSelect({
      id: "linked-structures-q12",
      concept: "Arrays vs lists",
      difficulty: "application",
      prompt: "Which statements about linked lists are true? Select all that apply.",
      options: [
        "Nodes must sit next to each other in memory.",
        "Reaching a node in the middle takes O(n) from the head.",
        "A fast pointer meets a slow pointer inside a cycle.",
        "Reversing a list needs a second list to hold the result.",
      ],
      correct: ["b", "c"],
      explanation:
        "Reaching a middle node means following next pointers from head, so it is O(n). Inside a cycle the fast pointer gains a step on the slow one each time and they meet. Nodes are not stored contiguously, and reversal flips next pointers in place.",
    }),
  ],
}
