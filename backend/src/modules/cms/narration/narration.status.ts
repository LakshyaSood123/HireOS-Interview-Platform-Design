import type { PackageNarration, NarrationStepRecord, NarrationStatus } from "./narration.types.js";
import { narrationTextOf, sourceTextHash, type StepExplanation } from "./narration.text.js";

export interface StepStatusView {
  stepId: string;
  label: string;
  heading: string;
  explanation: string;
  status: NarrationStatus;
  enabled: boolean;
  voice?: string;
  language?: string;
  speed?: number;
  durationMs?: number;
  generatedAt?: string;
  provider?: string;
  asset?: string;
  bytes?: number;
  error?: string;
}

/** Status of ONE step, derived from what is stored and the CURRENT explanation. */
export function stepStatus(narration: PackageNarration | null | undefined, stepId: string, explanation: StepExplanation | undefined): NarrationStatus {
  if (!narration || !narration.enabled) {
    // A package that was never narrated reads as MISSING (what the admin should do next is generate), not DISABLED.
    const everNarrated = !!narration && Object.values(narration.steps).some(r => r.asset || r.error);
    return everNarrated ? "DISABLED" : "MISSING";
  }
  const rec: NarrationStepRecord | undefined = narration.steps[stepId];
  if (rec && rec.enabled === false) return "DISABLED";
  if (!rec || !rec.asset) return rec?.error ? "ERROR" : "MISSING";
  if (!explanation) return "STALE";
  return rec.sourceTextHash === sourceTextHash(narrationTextOf(explanation)) ? "GENERATED" : "STALE";
}

export function summarize(views: StepStatusView[]): Record<NarrationStatus, number> {
  const out: Record<NarrationStatus, number> = { MISSING: 0, GENERATED: 0, STALE: 0, DISABLED: 0, ERROR: 0 };
  for (const v of views) out[v.status]++;
  return out;
}
