import { z } from "zod";

import { wavDurationMs } from "./narration.provider.js";
import { stepStatus } from "./narration.status.js";
import type { StepExplanation } from "./narration.text.js";
import { NARRATION_AUDIO_CONTENT_TYPES, NARRATION_AUDIO_EXTENSIONS, NARRATION_LIMITS, NARRATION_SCHEMA_VERSION, type PackageNarration } from "./narration.types.js";

/**
 * Validation POLICY (see the feature report):
 *   - narration disabled (package or step)                 -> nothing required
 *   - enabled, step never generated (MISSING)              -> WARNING (the course publishes; that step is silent)
 *   - enabled, audio stale vs the explanation (STALE)      -> WARNING initially. To make stale narration block a
 *                                                              publish later, change STALE_IS_ERROR to true.
 *   - enabled, step references audio that is absent/unsafe/ -> ERROR (blocks publish)
 *     invalid, unknown step ids, bad hash/duration, oversize
 */
export const STALE_IS_ERROR = false;

export interface NarrationIssue {
  severity: "error" | "warning";
  code: string;
  stepId?: string;
  message: string;
}

export const AUDIO_PATH_RE = /^audio\/[A-Za-z0-9_-]{1,64}\.(mp3|wav|ogg|m4a)$/;

const stepSchema = z.object({
  enabled: z.boolean(),
  asset: z.string().max(100).optional(),
  durationMs: z.number().finite().optional(),
  provider: z.string().max(60).optional(),
  voice: z.string().max(60).optional(),
  language: z.string().max(16).optional(),
  speed: z.number().finite().min(0.25).max(4).optional(),
  sourceTextHash: z.string().regex(/^sha256:[0-9a-f]{64}$/).optional(),
  generationHash: z.string().regex(/^sha256:[0-9a-f]{64}$/).optional(),
  generatedAt: z.string().max(40).optional(),
  bytes: z.number().int().nonnegative().optional(),
  error: z.string().max(500).optional(),
});

export const packageNarrationSchema = z.object({
  schemaVersion: z.literal(NARRATION_SCHEMA_VERSION),
  enabled: z.boolean(),
  defaults: z.object({ voice: z.string().min(1).max(60), language: z.string().min(2).max(16), speed: z.number().finite().min(0.25).max(4) }),
  steps: z.record(z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/), stepSchema),
  audio: z.array(z.object({ path: z.string().max(100), contentType: z.string().max(40), dataBase64: z.string() })).max(NARRATION_LIMITS.maxAudioFiles),
});

export function validateNarration(
  narration: PackageNarration | null | undefined,
  ctx: { stepIds: readonly string[]; explanations: Record<string, StepExplanation> },
): NarrationIssue[] {
  const issues: NarrationIssue[] = [];
  if (!narration) return issues;
  const add = (severity: NarrationIssue["severity"], code: string, message: string, stepId?: string) => issues.push({ severity, code, message, ...(stepId ? { stepId } : {}) });

  const parsed = packageNarrationSchema.safeParse(narration);
  if (!parsed.success) {
    add("error", "SCHEMA", `narration is malformed: ${parsed.error.issues[0]?.path.join(".")}: ${parsed.error.issues[0]?.message}`);
    return issues;
  }
  if (!narration.enabled) return issues; // nothing required while disabled

  const known = new Set(ctx.stepIds);
  const audioByPath = new Map<string, PackageNarration["audio"][number]>();
  let totalBytes = 0;
  for (const file of narration.audio) {
    if (audioByPath.has(file.path)) add("error", "DUPLICATE_AUDIO", `audio path "${file.path}" appears more than once`);
    audioByPath.set(file.path, file);
    if (!AUDIO_PATH_RE.test(file.path)) add("error", "UNSAFE_PATH", `audio path "${file.path}" is not a safe audio/<name>.<ext> path`);
    const ext = file.path.slice(file.path.lastIndexOf(".")).toLowerCase();
    if (!(NARRATION_AUDIO_CONTENT_TYPES as readonly string[]).includes(file.contentType) || NARRATION_AUDIO_EXTENSIONS[ext] !== file.contentType) {
      add("error", "AUDIO_TYPE", `audio "${file.path}" has unsupported or mismatching content type "${file.contentType}"`);
    }
    const bytes = Buffer.byteLength(file.dataBase64, "base64");
    totalBytes += bytes;
    if (bytes === 0) add("error", "AUDIO_EMPTY", `audio "${file.path}" is empty`);
    if (bytes > NARRATION_LIMITS.maxAudioBytes) add("error", "AUDIO_TOO_LARGE", `audio "${file.path}" is ${bytes} bytes (max ${NARRATION_LIMITS.maxAudioBytes})`);
  }
  if (totalBytes > NARRATION_LIMITS.maxTotalAudioBytes) add("error", "AUDIO_TOTAL_TOO_LARGE", `narration audio totals ${totalBytes} bytes (max ${NARRATION_LIMITS.maxTotalAudioBytes})`);

  const referenced = new Set<string>();
  for (const [stepId, rec] of Object.entries(narration.steps)) {
    if (!known.has(stepId)) {
      add("error", "UNKNOWN_STEP", `narration references step "${stepId}", which is not a step of this animation`, stepId);
      continue;
    }
    if (rec.enabled === false) continue;
    const explanation = ctx.explanations[stepId];
    if (!explanation) add("error", "NO_EXPLANATION", `step "${stepId}" has narration enabled but no explanation text to narrate`, stepId);
    if (!rec.asset) {
      add("warning", "MISSING", `narration for step "${stepId}" has not been generated`, stepId);
      continue;
    }
    referenced.add(rec.asset);
    if (!AUDIO_PATH_RE.test(rec.asset) || rec.asset.includes("://") || rec.asset.includes("..")) {
      add("error", "UNSAFE_PATH", `step "${stepId}" references an unsafe audio path "${rec.asset}"`, stepId);
      continue;
    }
    const file = audioByPath.get(rec.asset);
    if (!file) {
      add("error", "MISSING_ASSET", `step "${stepId}" references audio "${rec.asset}", which is not in the package`, stepId);
      continue;
    }
    if (!rec.sourceTextHash) add("error", "NO_SOURCE_HASH", `step "${stepId}" has audio but no sourceTextHash`, stepId);
    if (typeof rec.durationMs !== "number" || rec.durationMs < NARRATION_LIMITS.minStepDurationMs || rec.durationMs > NARRATION_LIMITS.maxStepDurationMs) {
      add("error", "BAD_DURATION", `step "${stepId}" has an implausible durationMs (${rec.durationMs})`, stepId);
    } else if (file.contentType === "audio/wav") {
      const actual = wavDurationMs(Buffer.from(file.dataBase64, "base64"));
      if (actual !== null && Math.abs(actual - rec.durationMs) > Math.max(250, rec.durationMs * 0.05)) {
        add("error", "DURATION_MISMATCH", `step "${stepId}" declares ${rec.durationMs} ms but the audio is ${actual} ms`, stepId);
      }
    }
    if (stepStatus(narration, stepId, explanation) === "STALE") {
      add(STALE_IS_ERROR ? "error" : "warning", "STALE", `narration for step "${stepId}" was generated from older explanation text`, stepId);
    }
  }
  for (const path of audioByPath.keys()) {
    if (!referenced.has(path)) add("warning", "ORPHAN_AUDIO", `audio "${path}" is not used by any step`);
  }
  return issues;
}
