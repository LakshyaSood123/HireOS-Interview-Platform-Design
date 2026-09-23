/**
 * The backend's OWN copy of `tools/code-runner-gateway.mjs`'s Family A
 * `ALLOWED_ACTIVITY_IDS` — the only checkpoint ids the real Piston gateway
 * will execute today. The backend never imports or modifies the gateway
 * file itself (it is a separate, protected system — Phase 3B plan §12).
 *
 * A CMS coding activity may only set `executionMode: "piston"` at publish
 * time if its `harnessKey` is in this set. This is a closed allowlist by
 * design: a brand-new CMS-authored coding problem can NEVER automatically
 * gain real Piston access just by naming an existing checkpoint id as its
 * harness key unless that key is one of these 14 — and even then, the
 * gateway's own fixture data is what actually executes, not anything the
 * CMS stores. New problems always start `executionMode: "disabled"`.
 *
 * Keep this list in sync with `tools/code-runner-gateway.mjs`'s
 * `ALLOWED_ACTIVITY_IDS` by hand — the gateway remains the single
 * authoritative source; this is a read-only mirror for server-side
 * validation.
 */
export const APPROVED_PISTON_HARNESS_KEYS = [
  "foundations-4",
  "foundations-5",
  "arrays-strings-5",
  "hashing-4",
  "two-pointers-4",
  "two-pointers-5",
  "sliding-window-4",
  "sliding-window-5",
  "prefix-sum-3",
  "prefix-sum-4",
  "binary-search-4",
  "binary-search-5",
  "recursion-4",
  "recursion-5",
] as const;

const HARNESS_KEY_SET = new Set<string>(APPROVED_PISTON_HARNESS_KEYS);

export function isApprovedPistonHarnessKey(key: string): boolean {
  return HARNESS_KEY_SET.has(key);
}
