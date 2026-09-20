import type { IntentId } from "./intents"

export function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Keyword patterns for FREE-TEXT messages only. Suggestion-button clicks
 * never go through this — they carry a `forcedIntent` set directly by the
 * UI (see intents.ts), which is the actual fix for the original
 * fallback-loop bug. This detector exists purely so a learner who types
 * their own question still gets routed sensibly. */
const FREE_TEXT_PATTERNS: [IntentId, string[]][] = [
  ["EXPLAIN_SIMPLE", ["explain this simply", "explain simply", "what is this", "explain concept", "overview", "basics", "simple terms", "eli5"]],
  ["KEY_TAKEAWAYS", ["what should i remember", "key takeaway", "summary", "summarize", "most important"]],
  ["ANOTHER_EXAMPLE", ["another example", "give me an example", "real world", "analogy", "example"]],
  ["TIME_COMPLEXITY", ["time complexity", "complexity", "big o", "runtime", "space complexity", "how fast", "how efficient"]],
  ["PATTERN_RECOGNITION", ["what pattern", "which pattern", "approach should i think", "what approach", "strategy", "algorithm to use"]],
  ["WHEN_TO_USE", ["when should i use", "when to use", "when would i use", "recognize this pattern", "cues", "signals"]],
  ["WHY_THIS_APPROACH", ["why does this work", "why this approach", "why does it work", "why is this efficient"]],
  ["STRONGER_HINT", ["stronger hint", "bigger hint", "more of a hint", "still stuck", "need more help"]],
  ["GIVE_ANOTHER_HINT", ["another hint", "one more hint", "next hint"]],
  ["GIVE_HINT", ["give me a hint", "hint", "stuck", "clue", "nudge"]],
  ["EXPLAIN_PSEUDOCODE", ["pseudocode", "explain the code", "explain the logic"]],
  ["EXPLAIN_CURRENT_STEP", ["explain this step", "what changed", "why did this happen", "current step", "what is happening", "why did this pointer move"]],
  ["EXPLAIN_PROBLEM", ["what is this problem asking", "what is the problem", "understand problem", "problem statement", "clarify"]],
  ["COMMON_MISTAKE", ["common mistake", "what mistakes", "pitfalls", "gotchas"]],
  ["WHY_CODE_FAILS", ["why might my code fail", "why does my code fail", "what is wrong with my code", "debug my code"]],
  ["REVIEW_MY_APPROACH", ["review my approach", "review my code", "check my solution", "is my approach right"]],
  ["QUICK_CHECK_HINT", ["hint for the quick check", "quiz help", "hint for mcq"]],
]

/** Resolves free-typed text to a canonical intent, or null if nothing
 * matches confidently — the caller must fall back honestly, never guess. */
export function detectIntent(message: string): IntentId | null {
  const norm = normalizeQuery(message)
  for (const [intent, patterns] of FREE_TEXT_PATTERNS) {
    if (patterns.some(p => norm.includes(p))) return intent
  }
  return null
}
