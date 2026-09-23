/**
 * checkpoint id -> execution capability, for the ONE-TIME bootstrap of the
 * current DSA content into the CMS (`bootstrapDsaCms.ts`). This is not a
 * general-purpose authoring default — it exists to answer one question
 * honestly: "does this EXISTING checkpoint already run through real Piston
 * today, or through MockCodeRunner, or not at all?" — and preserve exactly
 * that, rather than silently downgrading every existing coding activity to
 * `"disabled"` (Phase 3B hardening plan §1).
 *
 * `PISTON_CHECKPOINT_IDS` is the same 14-id Family A set as
 * `pistonHarnessKeys.ts`'s `APPROVED_PISTON_HARNESS_KEYS` (source of truth:
 * `tools/code-runner-gateway.mjs`'s `ALLOWED_ACTIVITY_IDS`, mirrored by the
 * frontend's `src/config/developmentMode.ts`'s `REAL_CODE_EXECUTION_ACTIVITY_IDS`
 * — all three are required to stay in lockstep by hand).
 *
 * Every OTHER checkpoint with a coding activity today runs through
 * `MockCodeRunner` unconditionally — see `RoutingCodeRunner.isRealExecutionEligible`
 * in `src/learning/services/pistonCodeRunner.ts`: a request is only ever
 * routed to Piston when its checkpoint id is in that 14-id list; every other
 * coding activity's request goes straight to Mock, not to a disabled state.
 * So today, across the whole DSA course, a checkpoint with a coding activity
 * is either "piston" (14) or "mock" (everything else) — never "disabled".
 * "disabled" is reserved for a NEW CMS-authored coding activity that has
 * never been wired to any runner.
 */

import { APPROVED_PISTON_HARNESS_KEYS, isApprovedPistonHarnessKey } from "./pistonHarnessKeys.js";
import type { CmsExecutionMode, CmsLanguage } from "./cms.types.js";

/** Matches the gateway's own `ALLOWED_LANGUAGES` — python/cpp/java only. */
const PISTON_LANGUAGES: CmsLanguage[] = ["python", "cpp", "java"];

export interface ExecutionResolution {
  executionMode: CmsExecutionMode;
  harnessKey?: string;
  allowedLanguages: CmsLanguage[];
}

/**
 * Called once per existing coding activity during bootstrap. `checkpointId`
 * is the real checkpoint id (e.g. "foundations-4"); `authoredLanguages` is
 * the activity's own `languages` array from the frontend content (preserved
 * verbatim for the "mock" case — bootstrap never invents or drops a
 * language the activity didn't already declare).
 */
export function resolveExistingExecution(checkpointId: string, authoredLanguages: CmsLanguage[]): ExecutionResolution {
  if (isApprovedPistonHarnessKey(checkpointId)) {
    return { executionMode: "piston", harnessKey: checkpointId, allowedLanguages: PISTON_LANGUAGES };
  }
  return { executionMode: "mock", allowedLanguages: authoredLanguages };
}

export const PISTON_CHECKPOINT_IDS: readonly string[] = APPROVED_PISTON_HARNESS_KEYS;
