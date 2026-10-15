import { createHash } from "node:crypto";

import { env } from "../../../config/env.js";
import { ApiError } from "../../../shared/errors.js";
import { LocalKokoroNarrationProvider } from "./providers/localKokoro.provider.js";

/**
 * Text-to-speech provider abstraction. Providers run ONLY on the backend and ONLY when a CMS admin asks for
 * generation; learners never trigger TTS: they play the audio that was generated once and frozen into the package.
 * Provider credentials come from the server environment, are never sent to the browser and never stored in a package.
 */
export interface NarrationRequest {
  text: string;
  voice: string;
  language: string;
  /** Speaking-rate multiplier requested from the provider (1.0 = normal). */
  speed: number;
}

export interface NarrationResult {
  audio: Buffer;
  contentType: "audio/mpeg" | "audio/wav" | "audio/ogg" | "audio/mp4";
  extension: ".mp3" | ".wav" | ".ogg" | ".m4a";
  durationMs: number;
  /** Non-secret provider details recorded for traceability. */
  metadata?: Record<string, string | number>;
}

export interface NarrationProvider {
  readonly providerId: string;
  /** Bump when the provider/model/config changes in a way that changes the audio: it is part of the generation hash. */
  readonly providerVersion: string;
  /** True only for real providers. The development provider is never "production". */
  readonly isProduction: boolean;
  supportedVoices(): string[];
  /** Voice the generic "default" resolves to, when the provider has one (shown in the CMS next to "default"). */
  readonly defaultVoice?: string;
  generate(request: NarrationRequest): Promise<NarrationResult>;
  /** Optional cheap check that the provider can run here (e.g. a local engine's files exist). Not ready => generation is refused clearly. */
  readiness?(): { ready: boolean; problem?: string };
}

// ── development / test provider ───────────────────────────────────────────────────────────────────────────

/**
 * DEV/TEST NARRATION PROVIDER. Not speech: it synthesises a deterministic, soft "murmur" (one short tone burst per
 * word, pitch derived from the word) whose length follows a natural speaking pace. It exists so the whole lifecycle
 * (generation, hashing, asset storage, package integration, CMS status changes, learner playback, timing) can be
 * proven without a paid provider. Same input gives byte-identical output.
 */
export class DevNarrationProvider implements NarrationProvider {
  readonly providerId = "dev-murmur";
  readonly providerVersion = "1";
  readonly isProduction = false;
  private readonly sampleRate = 8000;

  supportedVoices(): string[] {
    return ["default", "low", "high"];
  }

  async generate(request: NarrationRequest): Promise<NarrationResult> {
    const words = request.text.split(/\s+/).filter(Boolean);
    if (words.length === 0) throw ApiError.validation("Cannot narrate empty text.");
    const voiceShift = request.voice === "low" ? 0.8 : request.voice === "high" ? 1.25 : 1;
    const secondsPerWord = 0.4 / Math.max(0.5, Math.min(2, request.speed));
    const samples: number[] = [];
    for (const word of words) {
      const wordSamples = Math.max(1200, Math.round(this.sampleRate * secondsPerWord * Math.min(1.8, 0.55 + word.length / 9)));
      const h = createHash("sha256").update(word.toLowerCase()).digest();
      const freq = (170 + (h[0]! / 255) * 190) * voiceShift;
      const burst = Math.round(wordSamples * 0.7);
      for (let i = 0; i < wordSamples; i++) {
        if (i >= burst) {
          samples.push(0);
          continue;
        }
        const envelope = Math.sin((Math.PI * i) / burst); // smooth attack/decay, no clicks
        samples.push(Math.round(envelope * 0.22 * 32767 * Math.sin((2 * Math.PI * freq * i) / this.sampleRate)));
      }
    }
    return {
      audio: encodeWav(samples, this.sampleRate),
      contentType: "audio/wav",
      extension: ".wav",
      durationMs: Math.round((samples.length / this.sampleRate) * 1000),
      metadata: { sampleRate: this.sampleRate },
    };
  }
}

function encodeWav(samples: number[], sampleRate: number): Buffer {
  const dataBytes = samples.length * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(samples[i]!, 44 + i * 2);
  return buf;
}

/** Playing time of a simple PCM WAV buffer, or null if it is not one. Used to cross-check declared durations. */
export function wavDurationMs(buf: Buffer): number | null {
  if (buf.length < 44 || buf.toString("ascii", 0, 4) !== "RIFF" || buf.toString("ascii", 8, 12) !== "WAVE") return null;
  const byteRate = buf.readUInt32LE(28);
  if (!byteRate) return null;
  return Math.round((buf.readUInt32LE(40) / byteRate) * 1000);
}

// ── registry ───────────────────────────────────────────────────────────────────────────────────────────────

type ProviderFactory = () => NarrationProvider;
const factories = new Map<string, ProviderFactory>([
  ["dev", () => new DevNarrationProvider()],
  ["local-kokoro", () => (kokoro ??= new LocalKokoroNarrationProvider())], // ONE instance: it owns the single warm worker process
]);
let kokoro: LocalKokoroNarrationProvider | undefined;

/**
 * Extension point for real providers: implement NarrationProvider under providers/, register it under an id and select
 * it with NARRATION_PROVIDER=<id>. Built in: "dev" (deterministic test provider) and "local-kokoro" (offline Kokoro-82M, providers/localKokoro.provider.ts).
 */
export function registerNarrationProvider(id: string, factory: ProviderFactory): void {
  factories.set(id, factory);
}

export function getNarrationProvider(): NarrationProvider {
  const id = env.NARRATION_PROVIDER;
  if (id === "none") {
    throw new ApiError("RUNNER_UNAVAILABLE", "No text-to-speech provider is configured on this server (NARRATION_PROVIDER=none). Narration cannot be generated; existing narration still plays.");
  }
  const factory = factories.get(id);
  if (!factory) throw new ApiError("RUNNER_UNAVAILABLE", `Narration provider "${id}" is not available in this build.`);
  const provider = factory();
  if (env.isProduction && !provider.isProduction) {
    throw new ApiError("RUNNER_UNAVAILABLE", "The development narration provider cannot generate narration in production. Configure a real provider.");
  }
  const readiness = provider.readiness?.();
  if (readiness && !readiness.ready) throw new ApiError("RUNNER_UNAVAILABLE", readiness.problem ?? "The narration provider is not ready.");
  return provider;
}

export function narrationProviderInfo(): { configured: string; isProduction: boolean; available: boolean; problem?: string; defaultVoice?: string } {
  const id = env.NARRATION_PROVIDER;
  const factory = factories.get(id);
  if (id === "none" || !factory) return { configured: id, isProduction: false, available: false };
  try {
    const p = factory();
    const readiness = p.readiness?.();
    if (readiness && !readiness.ready) return { configured: p.providerId, isProduction: p.isProduction, available: false, problem: readiness.problem, defaultVoice: p.defaultVoice };
    return { configured: p.providerId, isProduction: p.isProduction, available: !(env.isProduction && !p.isProduction), defaultVoice: p.defaultVoice };
  } catch (err) {
    // e.g. a real provider selected without its credential: reported to the admin, never a 500 on the overview.
    return { configured: id, isProduction: id !== "dev", available: false, problem: err instanceof Error ? err.message : "provider unavailable" };
  }
}
