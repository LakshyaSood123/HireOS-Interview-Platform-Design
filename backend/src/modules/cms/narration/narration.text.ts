import { createHash } from "node:crypto";

/**
 * The explanation shown under an animation step is `{ h: HEADING, t: "text with **bold**" }`. Narration speaks the
 * body text `t` exactly as the learner reads it: only the `**` emphasis markers are removed and whitespace is
 * normalised. No other rewriting, so what is heard is what is displayed.
 */
export interface StepExplanation {
  h: string;
  t: string;
}

export function narrationTextOf(explanation: Pick<StepExplanation, "t">): string {
  return String(explanation.t).replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
}

export function sourceTextHash(text: string): string {
  return "sha256:" + createHash("sha256").update(text.normalize("NFC")).digest("hex");
}

/**
 * Narration-only pronunciation normalisation. The VISIBLE explanation is never changed and `sourceTextHash` is always computed
 * from it; only the text handed to the speech engine is rewritten, so acronyms are spelled out instead of mispronounced.
 * Replacement is case-sensitive and token-boundary aware ("MAP" the acronym, never "map" or "MAPPING"; "F1" but not "F10").
 * Bump PRONUNCIATION_VERSION whenever a rule is added or changed.
 */
export const PRONUNCIATION_VERSION = "1";
const PRONUNCIATION_RULES: [RegExp, string][] = [
  ["MLE", "M L E"],
  ["MAP", "M A P"],
  ["PCA", "P C A"],
  ["GMM", "G M M"],
  ["F1", "F one"],
  ["PC1", "P C one"],
  ["PC2", "P C two"],
].map(([token, spoken]) => [new RegExp(`(?<![A-Za-z0-9])${token}(?![A-Za-z0-9])`, "g"), spoken as string]);

export function normalizeForSpeech(text: string): string {
  return PRONUNCIATION_RULES.reduce((out, [re, spoken]) => out.replace(re, spoken), text);
}

/**
 * Everything that changes the produced audio: the text actually SPOKEN, the provider, the voice and settings. `pronunciation`
 * (the rule-set version) is only part of the identity for text that the rules changed, so unaffected narration keeps its hash
 * and is never regenerated when rules are added that do not touch it.
 */
export function generationHash(input: { text: string; provider: string; providerVersion: string; voice: string; language: string; speed: number; pronunciation?: string }): string {
  const parts: unknown[] = [input.text.normalize("NFC"), input.provider, input.providerVersion, input.voice, input.language, Number(input.speed.toFixed(3))];
  if (input.pronunciation) parts.push(input.pronunciation);
  return "sha256:" + createHash("sha256").update(JSON.stringify(parts)).digest("hex");
}

/**
 * Reads the explanation map out of a package's animation.js. Generated packages embed it as
 * `var EXPLAIN = {"step-id": {"h": ..., "t": ...}, ...};` (see seed/ml/shared/explain-runtime.js), and the same data is
 * what the learner's explanation panel renders — so this is the authoritative text, not a copy.
 */
export function extractExplanations(js: string | null | undefined): Record<string, StepExplanation> {
  if (!js) return {};
  const marker = "var EXPLAIN = ";
  const start = js.indexOf(marker);
  if (start < 0) return {};
  const from = start + marker.length;
  const end = js.indexOf("};", from);
  if (end < 0) return {};
  try {
    const parsed = JSON.parse(js.slice(from, end + 1)) as Record<string, unknown>;
    const out: Record<string, StepExplanation> = {};
    for (const [id, value] of Object.entries(parsed)) {
      const v = value as { h?: unknown; t?: unknown };
      if (v && typeof v.t === "string") out[id] = { h: typeof v.h === "string" ? v.h : "", t: v.t };
    }
    return out;
  } catch {
    return {};
  }
}
