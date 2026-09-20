// ROOT CAUSE OF THE ORIGINAL FALLBACK-LOOP BUG (see task history):
// the previous provider hand-authored a single closed map of ~8 checkpoints
// (topicAssistantDemoContent.ts's old TOPIC_DEMO_CONTENT) and matched BOTH
// suggestion clicks AND free text against those checkpoints' keyword
// patterns. Any checkpoint outside that map — the other ~100 of 107 — had
// no intents to match against at all, so every suggestion button (even ones
// the UI itself generated) fell straight into the generic fallback.
//
// The fix is this file: a Layer A generator that derives a real, on-topic
// answer for every intent from the CURRENT checkpoint's actual curriculum
// fields (via TopicKnowledge), for every checkpoint in the course — no
// hand-authored map required. topicOverrides.ts is an OPTIONAL Layer B that
// only replaces specific (checkpoint, intent) pairs with richer curated
// text; it is consulted first but is never required for a valid response.

import type { IntentId } from "./intents"
import type { TopicKnowledge } from "./topicKnowledgeBuilder"
import { TOPIC_OVERRIDES } from "./topicOverrides"

export interface ResolvedAnswer {
  content: string
  /** True when the answer is a grounded, on-topic response (curated,
   * curriculum-derived, or an honest "not available" decline). False is
   * reserved for genuinely unsupported free text with no matched intent. */
  supported: true
}

const NO_INFO = (topic: string) =>
  `This lesson doesn't currently include enough information for me to answer that precisely for **${topic}**. Here's what I can help with instead:`

function formatKeyPoints(k: TopicKnowledge): string | null {
  if (k.keyPoints.length === 0) return null
  return k.keyPoints.map(p => `• **${p.heading}**: ${p.body}`).join("\n")
}

function explainSimple(k: TopicKnowledge): string {
  if (k.explanation) {
    return `${k.explanation}${k.keyPoints[1] ? `\n\nOne more thing to hold onto: ${k.keyPoints[1].body}` : ""}`
  }
  if (k.problemStatement) {
    return `In short: ${k.problemStatement}`
  }
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function keyTakeaways(k: TopicKnowledge): string {
  const points = formatKeyPoints(k)
  if (points) return `Here's what to hold onto from **${k.checkpointTitle}**:\n${points}`
  if (k.mistakeFeedback) return `The main thing to watch for here: ${k.mistakeFeedback}`
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function anotherExample(k: TopicKnowledge): string {
  if (k.problemStatement) {
    return `Reapplying the idea from **${k.checkpointTitle}**: ${k.problemStatement}${
      k.constraints && k.constraints.length ? `\n\nConstraints to keep in mind: ${k.constraints.join(", ")}.` : ""
    }`
  }
  if (k.explanation) {
    return `Take the idea from "${k.explanation.slice(0, 140)}${k.explanation.length > 140 ? "…" : ""}" and apply it to a fresh small case — walk through it on paper with 3-4 sample values before touching code.`
  }
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function timeComplexity(k: TopicKnowledge): string {
  if (k.complexity) {
    return `For **${k.checkpointTitle}**, this lesson's material points to: ${k.complexity}.`
  }
  return NO_INFO(k.checkpointTitle ?? "this topic") + "\n\nI can still walk through the approach or give you a hint."
}

function patternRecognition(k: TopicKnowledge): string {
  if (k.explanation) {
    return `For **${k.checkpointTitle}**, the core idea to recognize is: ${k.explanation}`
  }
  if (k.problemStatement) {
    return `Look at what ${k.functionName ?? "this function"} needs to do: ${k.problemStatement} — that shape (single array/string in, one answer out) usually hints at the technique this module is teaching.`
  }
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function whenToUse(k: TopicKnowledge): string {
  if (k.moduleTitle && k.explanation) {
    return `This falls under **${k.moduleTitle}**. Reach for it when you recognize: ${k.explanation}`
  }
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function whyThisApproach(k: TopicKnowledge): string {
  if (k.explanation) return k.explanation
  return NO_INFO(k.checkpointTitle ?? "this topic")
}

function giveHint(k: TopicKnowledge, level: number): string {
  if (!k.hint) return NO_INFO(k.checkpointTitle ?? "this problem") + "\n\nTry re-reading the problem statement and constraints closely — the shape of the input often hints at the technique."
  if (level <= 1) {
    return `Trail Hint 1: ${k.hint}`
  }
  if (level === 2) {
    return `Trail Hint 2 (a bit stronger): ${k.hint}${k.constraints?.length ? `\n\nAlso keep the constraints in mind: ${k.constraints.join(", ")}.` : ""}`
  }
  return `Trail Hint 3 (close to the approach, but you'll still write the code yourself): ${k.hint}${
    k.functionName ? ` Focus on what \`${k.functionName}\` needs to return and trace through one example by hand before coding.` : ""
  }`
}

function explainCurrentStep(k: TopicKnowledge): string {
  const anim = k.animationContext
  if (anim && (anim.operation || anim.message)) {
    const stepLabel = anim.step !== undefined && anim.totalSteps !== undefined ? `Step ${anim.step} of ${anim.totalSteps}: ` : ""
    return `${stepLabel}${anim.operation ? `**${anim.operation}** — ` : ""}${anim.message ?? "the animation is updating its state based on the current comparison."}`
  }
  return NO_INFO(k.checkpointTitle ?? "this animation")
}

function explainPseudocode(k: TopicKnowledge): string {
  if (k.traceContext?.activeLine) {
    return `The currently active line is: \`${k.traceContext.activeLine}\`.${k.traceContext.note ? ` ${k.traceContext.note}` : ""}`
  }
  if (k.animationContext?.operation) {
    return `The animation's current operation is **${k.animationContext.operation}** — ${k.animationContext.message ?? "watch how the highlighted elements change as a result."}`
  }
  return NO_INFO(k.checkpointTitle ?? "this animation")
}

function explainProblem(k: TopicKnowledge): string {
  if (k.problemStatement) {
    return `${k.problemStatement}${k.constraints?.length ? `\n\nConstraints: ${k.constraints.join(", ")}.` : ""}`
  }
  return NO_INFO(k.checkpointTitle ?? "this problem")
}

function commonMistake(k: TopicKnowledge): string {
  if (k.mistakeFeedback) return k.mistakeFeedback
  return NO_INFO(k.checkpointTitle ?? "this problem") + "\n\nA good general check: make sure you're not doing an O(n²) nested scan when a single pass would work."
}

function whyCodeFails(k: TopicKnowledge): string {
  if (!k.includeLearnerCode || !k.learnerCode) {
    return "Turn on \"Include my current editor code in question\" below the composer so I can tailor this to what you've written so far."
  }
  const hasFunction = k.functionName ? k.learnerCode.includes(k.functionName) : true
  if (!hasFunction) {
    return `I don't see \`${k.functionName}\` defined yet — start by matching the required function signature from the starter code.`
  }
  return `Looking at your code: double-check your base case and loop boundaries first — those are the most common source of off-by-one or empty-input bugs here.${
    k.mistakeFeedback ? ` A pattern to watch for in this problem specifically: ${k.mistakeFeedback}` : ""
  }`
}

function reviewMyApproach(k: TopicKnowledge): string {
  if (!k.includeLearnerCode || !k.learnerCode) {
    return "Turn on \"Include my current editor code in question\" below the composer and I can review your approach against what this checkpoint expects."
  }
  return `Your code is in view. Compare its shape against the problem: ${k.problemStatement ?? "re-check the prompt"}${
    k.complexity ? `, and aim for ${k.complexity}.` : "."
  } I won't hand you the final solution, but I can keep pointing at specific spots if you ask for a hint.`
}

function quickCheckHint(k: TopicKnowledge): string {
  if (k.explanation) {
    return `Before you answer, think about: ${k.explanation}`
  }
  if (k.quickCheckQuestion) {
    return `Re-read the question carefully: "${k.quickCheckQuestion}" — think about which core term from this lesson it's testing, rather than guessing.`
  }
  return NO_INFO(k.checkpointTitle ?? "this quick check")
}

/** Layer A + Layer B dispatch. Always returns a real, on-topic answer —
 * never the generic unsupported-free-text fallback (that's reserved for
 * detectIntent() returning null on free text, handled by the caller). */
export function resolveIntent(knowledge: TopicKnowledge, intent: IntentId, hintLevel: number): ResolvedAnswer {
  const override = knowledge.checkpointId ? TOPIC_OVERRIDES[knowledge.checkpointId]?.[intent] : undefined
  if (override) {
    const content = typeof override === "function" ? override(knowledge) : override
    return { content, supported: true }
  }

  switch (intent) {
    case "EXPLAIN_SIMPLE":
      return { content: explainSimple(knowledge), supported: true }
    case "KEY_TAKEAWAYS":
      return { content: keyTakeaways(knowledge), supported: true }
    case "ANOTHER_EXAMPLE":
      return { content: anotherExample(knowledge), supported: true }
    case "TIME_COMPLEXITY":
      return { content: timeComplexity(knowledge), supported: true }
    case "PATTERN_RECOGNITION":
      return { content: patternRecognition(knowledge), supported: true }
    case "WHEN_TO_USE":
      return { content: whenToUse(knowledge), supported: true }
    case "WHY_THIS_APPROACH":
      return { content: whyThisApproach(knowledge), supported: true }
    case "GIVE_HINT":
      return { content: giveHint(knowledge, 1), supported: true }
    case "GIVE_ANOTHER_HINT":
      return { content: giveHint(knowledge, Math.max(2, hintLevel)), supported: true }
    case "STRONGER_HINT":
      return { content: giveHint(knowledge, Math.max(3, hintLevel)), supported: true }
    case "EXPLAIN_CURRENT_STEP":
      return { content: explainCurrentStep(knowledge), supported: true }
    case "EXPLAIN_PSEUDOCODE":
      return { content: explainPseudocode(knowledge), supported: true }
    case "EXPLAIN_PROBLEM":
      return { content: explainProblem(knowledge), supported: true }
    case "COMMON_MISTAKE":
      return { content: commonMistake(knowledge), supported: true }
    case "WHY_CODE_FAILS":
      return { content: whyCodeFails(knowledge), supported: true }
    case "REVIEW_MY_APPROACH":
      return { content: reviewMyApproach(knowledge), supported: true }
    case "QUICK_CHECK_HINT":
      return { content: quickCheckHint(knowledge), supported: true }
  }
}

/** Contextual, non-generic fallback for genuinely unsupported free text —
 * always names the current topic, never a giant generic card (PART 23). */
export function buildContextualFallback(knowledge: TopicKnowledge): string {
  const topic = knowledge.checkpointTitle ? `**${knowledge.checkpointTitle}**` : "this checkpoint"
  const moduleClause = knowledge.moduleTitle ? ` — ${knowledge.moduleTitle}` : ""
  return `I'm currently focused on ${topic}${moduleClause}. I can help explain the concept, walk through an example, give you a hint, or discuss complexity for this specific checkpoint — try one of the suggestions below.`
}
