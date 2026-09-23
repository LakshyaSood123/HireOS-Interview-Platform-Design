/**
 * The backend's OWN copy of the currently-registered `AlgorithmAnimationId`s
 * (frontend source of truth: `src/learning/types.ts`'s `AlgorithmAnimationId`
 * union, one entry per key in `src/components/lesson/AlgorithmAnimation.tsx`'s
 * `animations` registry). The backend never imports that file — it is
 * React-adjacent — so this is a plain, checked-in, machine-readable manifest
 * kept in sync by hand.
 *
 * Publish-time validation (`cms.validation.ts`) rejects any
 * `workspace.animation.id` not in this set. The frontend continues to own
 * every animation's actual implementation and its Code Trace entry — the
 * backend only ever stores and validates the reference string.
 *
 * IMPORTANT: whenever a frontend task adds a new animation id (as the
 * animation-expansion tasks have done twice now), this list must be updated
 * in the same review pass, or CMS publish will wrongly reject the new id.
 * A future improvement could generate this file from the frontend registry
 * at build time; for Phase 3B it is a reviewed, hand-maintained list.
 */
export const REGISTERED_ANIMATION_IDS = [
  "arrays-in-place-reversal",
  "complexity-growth",
  "hashing-frequency-map",
  "hashing-complement-lookup",
  "two-pointers-opposite-sum",
  "sliding-window-variable",
  "prefix-sum-range-query",
  "binary-search-decision",
  "binary-search-monotonic-condition",
  "intervals-merge-overlap",
  "linked-list-reversal",
  "linked-list-fast-slow-cycle",
  "stack-queue-lifo-fifo",
  "heap-insert-bubble",
  "trie-prefix-branch",
  "recursion-factorial-unwind",
  "backtracking-choose-undo",
  "tree-preorder-traversal",
  "bst-search-invariant",
  "graph-adjacency-build",
  "dfs-bfs-frontier",
  "grid-graph-frontier",
  "topological-sort-kahn",
  "union-find-compression",
  "greedy-interval-selection",
  "dp-1d-fill",
  "dp-2d-grid-paths",
  "dp-take-skip",
  "pattern-recognition-clues",
  "timed-problem-phases",
  "company-mission-review",
  "final-mastery-readiness",
] as const;

export type RegisteredAnimationId = (typeof REGISTERED_ANIMATION_IDS)[number];

const ANIMATION_ID_SET = new Set<string>(REGISTERED_ANIMATION_IDS);

export function isKnownAnimationId(id: string): boolean {
  return ANIMATION_ID_SET.has(id);
}
