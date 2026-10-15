/**
 * Animation narration (text-to-speech) — data model.
 *
 * Narration is OWNED BY THE PACKAGE REVISION: it lives in the `narration` field of a `cmsAnimationPackages`
 * document, so it follows the same draft -> frozen revision semantics as html/css/js/trace. A frozen (published)
 * revision is never modified; changing narration happens on the package's draft revision and reaches learners only
 * through a normal publish (which freezes a new revision — narration is part of the content hash).
 *
 * The EXPLANATION TEXT stays the single source of truth. Narration never stores a script of its own: each step
 * records `sourceTextHash`, the hash of the (normalised) explanation it was generated from. If the explanation
 * changes, hash(explanation) != sourceTextHash and the step is STALE.
 */

export const NARRATION_SCHEMA_VERSION = 1;

/** Status the CMS shows per step. Computed from the stored step + the current explanation (see narration.status.ts). */
export const NARRATION_STATUSES = ["MISSING", "GENERATED", "STALE", "DISABLED", "ERROR"] as const;
export type NarrationStatus = (typeof NARRATION_STATUSES)[number];

export const NARRATION_AUDIO_CONTENT_TYPES = ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"] as const;
export const NARRATION_AUDIO_EXTENSIONS: Record<string, string> = { ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg", ".m4a": "audio/mp4" };

export const NARRATION_LIMITS = {
  maxAudioBytes: 2_000_000,
  maxTotalAudioBytes: 10_000_000,
  maxStepDurationMs: 120_000,
  minStepDurationMs: 300,
  maxAudioFiles: 200,
  pathPrefix: "audio/",
} as const;

export interface NarrationDefaults {
  voice: string;
  language: string;
  /** Provider speaking-rate multiplier used when generating (1.0 = normal). Learner playback speed is separate and client-side. */
  speed: number;
}

export interface NarrationStepRecord {
  enabled: boolean;
  /** Path of the audio file inside `narration.audio` (e.g. "audio/generalize.wav"). Absent until generated. */
  asset?: string;
  durationMs?: number;
  provider?: string;
  voice?: string;
  language?: string;
  speed?: number;
  /** sha256 of the normalised explanation text this audio was generated from — "sha256:<hex>". */
  sourceTextHash?: string;
  /** sha256 of (text + provider + voice + language + speed + providerConfigVersion) — the idempotency key. */
  generationHash?: string;
  generatedAt?: string;
  bytes?: number;
  /** Last generation failure; cleared on success. */
  error?: string;
}

export interface NarrationAudioFile {
  path: string;
  contentType: string;
  dataBase64: string;
}

export interface PackageNarration {
  schemaVersion: number;
  /** Package-level switch. When false nothing is narrated and nothing is required. */
  enabled: boolean;
  defaults: NarrationDefaults;
  steps: Record<string, NarrationStepRecord>;
  audio: NarrationAudioFile[];
}

export const DEFAULT_NARRATION_DEFAULTS: NarrationDefaults = { voice: "default", language: "en", speed: 1 };

export function emptyNarration(): PackageNarration {
  return { schemaVersion: NARRATION_SCHEMA_VERSION, enabled: false, defaults: { ...DEFAULT_NARRATION_DEFAULTS }, steps: {}, audio: [] };
}
