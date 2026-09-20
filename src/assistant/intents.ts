import type { ActivityType, AssistantContext } from "./types"

/**
 * Canonical intent taxonomy (PART: Trail Guide curriculum-wide hardening).
 *
 * Every suggestion button the UI ever renders carries one of these IDs. The
 * mock provider resolves by ID first (`forcedIntent`), never by re-matching
 * the button's visible label text — that text-matching indirection was the
 * root cause of the original fallback-loop bug (see topicKnowledgeResolver.ts
 * file header for the full explanation).
 */
export type IntentId =
  | "EXPLAIN_SIMPLE"
  | "KEY_TAKEAWAYS"
  | "ANOTHER_EXAMPLE"
  | "TIME_COMPLEXITY"
  | "PATTERN_RECOGNITION"
  | "WHEN_TO_USE"
  | "WHY_THIS_APPROACH"
  | "GIVE_HINT"
  | "GIVE_ANOTHER_HINT"
  | "STRONGER_HINT"
  | "EXPLAIN_CURRENT_STEP"
  | "EXPLAIN_PSEUDOCODE"
  | "EXPLAIN_PROBLEM"
  | "COMMON_MISTAKE"
  | "WHY_CODE_FAILS"
  | "REVIEW_MY_APPROACH"
  | "QUICK_CHECK_HINT"

export interface Suggestion {
  /** Stable, unique-within-the-suggestion-list id — derived from intent +
   * label so the SAME intent can appear more than once with different
   * phrasing (e.g. three animation suggestions all resolve via
   * EXPLAIN_CURRENT_STEP) without colliding as React list keys. */
  id: string
  /** Visible button text. */
  label: string
  /** The ONLY thing the provider uses to resolve a response for this
   * suggestion — never the label text. */
  intent: IntentId
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function suggestion(label: string, intent: IntentId): Suggestion {
  return { id: `${intent}__${slugify(label)}`, label, intent }
}

/**
 * Activity-aware starter suggestions (PART 12 of the task spec). Every
 * intent referenced here MUST be handled by topicKnowledgeResolver's
 * resolveIntent() for every activity type it appears under — enforced by
 * coverageAudit.ts.
 */
export function getStarterSuggestions(context: AssistantContext): Suggestion[] {
  const activityType: ActivityType = context.activityType ?? "general-learning"

  if (activityType === "coding-challenge") {
    const suggestions = [
      suggestion("What is this problem asking?", "EXPLAIN_PROBLEM"),
      suggestion("What pattern should I think about?", "PATTERN_RECOGNITION"),
      suggestion("Give me a hint", "GIVE_HINT"),
      suggestion("What complexity should I aim for?", "TIME_COMPLEXITY"),
    ]
    if (context.includeLearnerCode && context.learnerCode) {
      suggestions.push(suggestion("Why might my code fail?", "WHY_CODE_FAILS"))
      suggestions.push(suggestion("Review my approach", "REVIEW_MY_APPROACH"))
    } else {
      suggestions.push(suggestion("What are common mistakes here?", "COMMON_MISTAKE"))
    }
    return suggestions
  }

  if (activityType === "algorithm-animation" || activityType === "code-trace") {
    return [
      suggestion("Explain this step", "EXPLAIN_CURRENT_STEP"),
      suggestion("What changed here?", "EXPLAIN_CURRENT_STEP"),
      suggestion("Why did this happen?", "EXPLAIN_CURRENT_STEP"),
      suggestion("Explain the pseudocode", "EXPLAIN_PSEUDOCODE"),
    ]
  }

  if (activityType === "quick-check") {
    return [
      suggestion("Give me a hint", "QUICK_CHECK_HINT"),
      suggestion("Explain the concept", "EXPLAIN_SIMPLE"),
      suggestion("What should I think about?", "PATTERN_RECOGNITION"),
    ]
  }

  // concept-theory / general-learning
  return [
    suggestion("Explain this simply", "EXPLAIN_SIMPLE"),
    suggestion("Give me another example", "ANOTHER_EXAMPLE"),
    suggestion("What should I remember?", "KEY_TAKEAWAYS"),
    suggestion("When would I use this?", "WHEN_TO_USE"),
  ]
}

/** Follow-up suggestions shown beneath an assistant response — deliberately
 * a SMALL, relevant subset (2-4), never the full starter set again (PART 28). */
export function getFollowUpSuggestions(resolvedIntent: IntentId, context: AssistantContext): Suggestion[] {
  const activityType: ActivityType = context.activityType ?? "general-learning"

  switch (resolvedIntent) {
    case "EXPLAIN_SIMPLE":
      return [suggestion("Give me another example", "ANOTHER_EXAMPLE"), suggestion("What should I remember?", "KEY_TAKEAWAYS")]
    case "KEY_TAKEAWAYS":
      return [suggestion("Explain this simply", "EXPLAIN_SIMPLE"), suggestion("Give me another example", "ANOTHER_EXAMPLE")]
    case "ANOTHER_EXAMPLE":
      return [suggestion("What should I remember?", "KEY_TAKEAWAYS"), suggestion("When would I use this?", "WHEN_TO_USE")]
    case "TIME_COMPLEXITY":
      return [suggestion("Explain this simply", "EXPLAIN_SIMPLE"), suggestion("Give me another example", "ANOTHER_EXAMPLE")]
    case "WHEN_TO_USE":
      return [suggestion("Why does this approach work?", "WHY_THIS_APPROACH"), suggestion("Give me another example", "ANOTHER_EXAMPLE")]
    case "WHY_THIS_APPROACH":
      return [suggestion("When should I recognize it?", "WHEN_TO_USE"), suggestion("What should I remember?", "KEY_TAKEAWAYS")]
    case "PATTERN_RECOGNITION":
      return activityType === "coding-challenge"
        ? [suggestion("Give me a hint", "GIVE_HINT"), suggestion("What complexity should I aim for?", "TIME_COMPLEXITY")]
        : [suggestion("Why does this approach work?", "WHY_THIS_APPROACH"), suggestion("Give me another example", "ANOTHER_EXAMPLE")]
    case "GIVE_HINT":
      return [suggestion("Give me another hint", "GIVE_ANOTHER_HINT"), suggestion("What pattern should I think about?", "PATTERN_RECOGNITION")]
    case "GIVE_ANOTHER_HINT":
      return [suggestion("I need a stronger hint", "STRONGER_HINT"), suggestion("What complexity should I aim for?", "TIME_COMPLEXITY")]
    case "STRONGER_HINT":
      return [suggestion("What complexity should I aim for?", "TIME_COMPLEXITY"), suggestion("What are common mistakes here?", "COMMON_MISTAKE")]
    case "QUICK_CHECK_HINT":
      return [suggestion("Explain the concept", "EXPLAIN_SIMPLE"), suggestion("What should I think about?", "PATTERN_RECOGNITION")]
    case "EXPLAIN_CURRENT_STEP":
      return [suggestion("Explain the pseudocode", "EXPLAIN_PSEUDOCODE"), suggestion("What changed here?", "EXPLAIN_CURRENT_STEP")]
    case "EXPLAIN_PSEUDOCODE":
      return [suggestion("Explain this step", "EXPLAIN_CURRENT_STEP")]
    case "EXPLAIN_PROBLEM":
      return [suggestion("What pattern should I think about?", "PATTERN_RECOGNITION"), suggestion("Give me a hint", "GIVE_HINT")]
    case "COMMON_MISTAKE":
      return [suggestion("Give me a hint", "GIVE_HINT"), suggestion("What complexity should I aim for?", "TIME_COMPLEXITY")]
    case "WHY_CODE_FAILS":
      return [suggestion("Give me a hint about my implementation", "GIVE_HINT"), suggestion("Review my approach", "REVIEW_MY_APPROACH")]
    case "REVIEW_MY_APPROACH":
      return [suggestion("Why might my code fail?", "WHY_CODE_FAILS"), suggestion("What complexity should I aim for?", "TIME_COMPLEXITY")]
    default:
      return getStarterSuggestions(context).slice(0, 2)
  }
}
