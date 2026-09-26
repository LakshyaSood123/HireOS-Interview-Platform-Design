// Module Mastery Quiz — Hashing (module id "hashing").
// Written from hashing-1..5: "have I seen this before?", sets and expected
// (not guaranteed) constant-time lookup, sets versus maps, frequency counting,
// the complement lookup and why it checks before it stores, anagrams (sorting
// is a valid alternative), and the space cost of the one-pass approach.

import type { ModuleMasteryQuiz } from "../../types"
import { multiSelect, singleSelect } from "../../quiz/quizAuthoring"

export const hashingQuiz: ModuleMasteryQuiz = {
  id: "hashing-mastery",
  moduleId: "hashing",
  title: "Hashing Quiz",
  passPercentage: 70,
  questions: [
    singleSelect({
      id: "hashing-q1",
      concept: "Set membership",
      difficulty: "foundation",
      prompt: "You scan [4, 7, 2, 7]. When the second 7 arrives, why can a set tell you it is a duplicate right away?",
      options: [
        "It sorted the numbers first, so duplicates sat next to each other.",
        "It stored 7 earlier, so \"is 7 in here?\" is one lookup, not a rescan.",
        "It counts how many numbers are still left to read.",
        "It compares 7 with every earlier number, only very fast.",
      ],
      correct: "b",
      explanation:
        "A set remembers the values you have seen. Instead of rescanning the array, you ask one question: is this value in here? That is what makes the whole pass about O(n) instead of O(n²).",
    }),
    singleSelect({
      id: "hashing-q2",
      concept: "Expected O(1)",
      difficulty: "foundation",
      prompt: "Which statement about a hash set lookup is most accurate?",
      options: [
        "It is guaranteed to take exactly constant time every time.",
        "It takes O(log n), because the values are kept in sorted order.",
        "Constant time on average, though unlucky cases can be slower.",
        "It takes O(n), because it scans through every stored value.",
      ],
      correct: "c",
      explanation:
        "Hash lookups are fast on average, so we say expected O(1). In rare unlucky cases a lookup can be slower, which is why it is not a guarantee. A set does not keep its values sorted.",
    }),
    singleSelect({
      id: "hashing-q3",
      concept: "Set vs map",
      difficulty: "foundation",
      prompt: "You need to know how many times each word appears in a document. What should you use?",
      options: [
        "A set of words.",
        "A map from each word to its count.",
        "A single counter.",
        "A sorted list of the words only.",
      ],
      correct: "b",
      explanation:
        "A set only tracks membership. A map attaches a value to each key, and here the value is a count: pear → 2, apple → 1.",
    }),
    singleSelect({
      id: "hashing-q4",
      concept: "Frequency counting",
      difficulty: "application",
      prompt: "You add \"pear\", \"apple\", \"pear\" one at a time to a frequency map. What does the map hold at the end?",
      options: ["pear → 1, apple → 2", "pear → 3", "apple → 1 only", "pear → 2, apple → 1"],
      correct: "d",
      explanation:
        "The first pear creates pear → 1. The second pear finds that entry and raises it to 2. apple appears once, so apple → 1.",
    }),
    singleSelect({
      id: "hashing-q5",
      concept: "Complement lookup",
      difficulty: "application",
      prompt: "nums = [2, 7, 11, 15], target = 9. At the number 7, what is the complement, and what should the map hold?",
      options: [
        "2, and the map already holds 2.",
        "16, and the map holds nothing yet.",
        "7, because a number pairs with itself.",
        "9, the target.",
      ],
      correct: "a",
      explanation:
        "The complement is the target minus the current number: 9 - 7 = 2. The 2 was stored when the loop was at index 0, so the pair is found: indices 0 and 1.",
    }),
    singleSelect({
      id: "hashing-q6",
      concept: "Check before store",
      difficulty: "challenge",
      prompt: "nums = [5, 1, 2], target = 10. If you store each number before looking up its complement, what can go wrong?",
      options: [
        "The map runs out of memory before the loop finishes.",
        "5 finds itself as its own complement and reports a false pair.",
        "The pair is still found, only a little more slowly.",
        "Nothing changes, because the order does not matter here.",
      ],
      correct: "b",
      explanation:
        "The complement of 5 is 10 - 5 = 5. If 5 is already stored, it matches itself. Looking up first means a match can only be an earlier, different element.",
    }),
    singleSelect({
      id: "hashing-q7",
      concept: "Complement lookup",
      difficulty: "application",
      prompt: "nums = [3, 3], target = 6. What does the one-pass map approach return?",
      options: [
        "[0, 0]",
        "[1, 0]",
        "[0, 1], because the first 3 is stored and the second 3 finds it.",
        "[]",
      ],
      correct: "c",
      explanation:
        "The first 3 finds nothing and is stored with index 0. The second 3 looks for 6 - 3 = 3, finds it at index 0, and returns the earlier index first: [0, 1].",
    }),
    singleSelect({
      id: "hashing-q8",
      concept: "Anagrams",
      difficulty: "application",
      prompt: "Sorting both strings and comparing them is a valid way to check for an anagram. How does it compare with counting characters?",
      options: [
        "Sorting costs O(n log n); counting is about O(n) expected.",
        "Sorting gives wrong answers when letters repeat.",
        "Both approaches cost O(1).",
        "Sorting only works for strings of different lengths.",
      ],
      correct: "a",
      explanation:
        "Sorting is a correct solution that costs O(n log n). Counting each character and subtracting is about O(n) expected work, which is the technique this module practices.",
    }),
    singleSelect({
      id: "hashing-q9",
      concept: "Anagrams",
      difficulty: "challenge",
      prompt: "Which pair is NOT an anagram, even though both strings have the same length and use the same letters?",
      options: ["\"listen\" and \"silent\"", "\"abc\" and \"cab\"", "\"ab\" and \"ba\"", "\"aabb\" and \"abbb\""],
      correct: "d",
      explanation:
        "Anagrams need the same characters the same number of times. \"aabb\" has two a's and two b's, but \"abbb\" has one a and three b's, so the counts differ.",
    }),
    singleSelect({
      id: "hashing-q10",
      concept: "Space trade-off",
      difficulty: "application",
      prompt: "What do you pay when you turn an O(n²) pair check into a one-pass lookup?",
      options: [
        "You must sort the array before scanning it.",
        "Nothing; the speed-up is completely free.",
        "You lose the ability to return any indices.",
        "About O(n) extra memory for the map or set.",
      ],
      correct: "d",
      explanation:
        "The map or set holds up to n values, so the speed-up costs about O(n) extra space. That is usually worth it to drop from O(n²) to about O(n) expected time.",
    }),
    singleSelect({
      id: "hashing-q11",
      concept: "Choosing hashing",
      difficulty: "application",
      prompt: "Which task is a natural fit for a hash map?",
      options: [
        "Finding the largest value in a list of numbers.",
        "Reversing an array in place by swapping ends.",
        "Counting how often each letter appears in a word.",
        "Adding up every value in an array of numbers.",
      ],
      correct: "c",
      explanation:
        "Counting each letter is a frequency map: letter → count. Finding the largest value or adding values needs only one variable, and reversing in place is done with swaps.",
    }),
    multiSelect({
      id: "hashing-q12",
      concept: "Complement lookup",
      difficulty: "application",
      prompt: "Which statements about the one-pass pair search are true? Select all that apply.",
      options: [
        "It looks for target minus the current number among values already seen.",
        "It needs the array to be sorted.",
        "It takes about O(n) expected time.",
        "It always needs only O(1) extra space.",
      ],
      correct: ["a", "c"],
      explanation:
        "For each number you look up target minus that number among the values already stored. That is one pass, about O(n) expected time, with O(n) extra space. The array does not need to be sorted.",
    }),
  ],
}
