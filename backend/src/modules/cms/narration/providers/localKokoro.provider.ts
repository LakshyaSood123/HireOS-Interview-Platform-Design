import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { env } from "../../../../config/env.js";
import { ApiError } from "../../../../shared/errors.js";
import { logger } from "../../../../shared/logger.js";
import type { NarrationProvider, NarrationRequest, NarrationResult } from "../narration.provider.js";
import { wavDurationMs } from "../narration.provider.js";
import { inspectMp3 } from "./mp3.js";

/**
 * LOCAL, OFFLINE text-to-speech with Kokoro-82M (Apache-2.0 code and weights). No API, no credential, no per-view generation.
 *
 * Architecture: a persistent Python worker (tools/local-tts/kokoro_worker.py) is spawned lazily the first time an ADMIN asks for
 * narration, loads the model once, and then serves every step over newline-delimited JSON on stdin/stdout. There is no socket and
 * no port: the browser cannot reach it, and the worker itself refuses every non-loopback network connection. It is stopped again
 * after a period of inactivity. Learners never need any of this: they play the audio that was generated once and frozen into
 * the published package.
 */

export const KOKORO_MODEL_ID = "Kokoro-82M";
/** Upstream commit of hexgrad/Kokoro-82M the weights were fetched from (recorded by the setup script). */
export const KOKORO_UPSTREAM_REVISION = "f3ff3571791e39611d31c381e3a41a3af07b4987";
const FALLBACK_VOICE = "af_heart";
const MAX_TEXT_CHARS = 2000;
const IDLE_SHUTDOWN_MS = 5 * 60_000;
const LOAD_TIMEOUT_MS = 180_000;

const here = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(here, "..", "..", "..", "..", ".."); // backend/
export const DEFAULT_MODEL_DIR = path.join(BACKEND_ROOT, ".models", "kokoro", "model");
const DEFAULT_PYTHON = path.join(BACKEND_ROOT, ".models", "kokoro", "venv", process.platform === "win32" ? path.join("Scripts", "python.exe") : path.join("bin", "python"));
const WORKER_SCRIPT = path.join(BACKEND_ROOT, "tools", "local-tts", "kokoro_worker.py");

export interface LocalKokoroOptions {
  pythonPath?: string;
  modelDir?: string;
  device?: "cpu" | "cuda" | "auto";
  format?: "mp3" | "wav";
  defaultVoice?: string;
  requestTimeoutMs?: number;
  idleShutdownMs?: number;
  /** Test seam: replaces the worker command (the protocol stays the same). */
  command?: { file: string; args: string[] };
}

export interface LocalReadiness {
  ready: boolean;
  problem?: string;
}

/** Cheap, filesystem-only readiness check (no model load, no process): Python runtime and model files exist. */
export function checkLocalKokoroReadiness(options: LocalKokoroOptions = {}): LocalReadiness {
  const python = options.command ? options.command.file : (options.pythonPath ?? env.NARRATION_LOCAL_PYTHON ?? DEFAULT_PYTHON);
  const modelDir = options.modelDir ?? env.NARRATION_LOCAL_MODEL_PATH ?? DEFAULT_MODEL_DIR;
  const hint = "Run `npm run narration:setup` on the machine that generates narration. Learners do not need it.";
  if (!options.command && !existsSync(python)) return { ready: false, problem: `Local narration engine unavailable: Python runtime not found. ${hint}` };
  if (!options.command && !existsSync(WORKER_SCRIPT)) return { ready: false, problem: "Local narration engine unavailable: worker script is missing from this build." };
  for (const file of ["config.json", "kokoro-v1_0.pth"]) {
    if (!existsSync(path.join(modelDir, file))) return { ready: false, problem: `Local narration engine unavailable: Kokoro model file "${file}" not found in the model directory. ${hint}` };
  }
  if (listVoices(modelDir).length === 0) return { ready: false, problem: `Local narration engine unavailable: no Kokoro voices found in the model directory. ${hint}` };
  return { ready: true };
}

function listVoices(modelDir: string): string[] {
  try {
    return readdirSync(path.join(modelDir, "voices"))
      .filter((f) => f.endsWith(".pt"))
      .map((f) => f.slice(0, -3))
      .sort();
  } catch {
    return [];
  }
}

// ── worker process ───────────────────────────────────────────────────────────────────────────────────────

interface Pending {
  resolve: (value: Record<string, unknown>) => void;
  reject: (reason: Error) => void;
  timer: NodeJS.Timeout;
}

/** One persistent worker process. Requests are serialised; a crash fails the in-flight request and the next call restarts it. */
class KokoroWorker {
  private proc: ChildProcessWithoutNullStreams | null = null;
  private buffer = "";
  private pending = new Map<string, Pending>();
  private nextId = 1;
  private queue: Promise<unknown> = Promise.resolve();
  private stderrTail = "";
  private idleTimer: NodeJS.Timeout | null = null;
  private loaded = false;

  constructor(private readonly opts: Required<Pick<LocalKokoroOptions, "device" | "requestTimeoutMs" | "idleShutdownMs">> & { file: string; args: string[] }) {}

  request(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    const run = () => this.send(payload);
    const result = this.queue.then(run, run);
    this.queue = result.catch(() => undefined); // keep the chain alive after a failure
    return result;
  }

  private ensureStarted(): void {
    if (this.proc) return;
    this.buffer = "";
    this.loaded = false;
    const proc = spawn(this.opts.file, this.opts.args, {
      stdio: ["pipe", "pipe", "pipe"],
      windowsHide: true,
      // Offline by construction; the worker enforces it again by refusing non-loopback sockets.
      env: { ...process.env, HF_HUB_OFFLINE: "1", TRANSFORMERS_OFFLINE: "1", HF_HUB_DISABLE_TELEMETRY: "1", PYTHONIOENCODING: "utf-8" },
    });
    this.proc = proc;
    proc.stdout.setEncoding("utf8");
    proc.stdout.on("data", (chunk: string) => this.onData(chunk));
    proc.stderr.setEncoding("utf8");
    proc.stderr.on("data", (chunk: string) => {
      this.stderrTail = (this.stderrTail + chunk).slice(-1500);
    });
    proc.on("error", (err) => this.onExit(proc, `could not start the local narration worker (${err.message})`));
    proc.on("exit", (code, signal) => this.onExit(proc, `the local narration worker stopped unexpectedly (${signal ?? `exit code ${code}`})`));
  }

  private onData(chunk: string): void {
    this.buffer += chunk;
    let index: number;
    while ((index = this.buffer.indexOf("\n")) >= 0) {
      const line = this.buffer.slice(0, index).trim();
      this.buffer = this.buffer.slice(index + 1);
      if (!line) continue;
      let message: Record<string, unknown>;
      try {
        message = JSON.parse(line) as Record<string, unknown>;
      } catch {
        logger.warn("narration: ignoring a non-protocol line from the local worker");
        continue;
      }
      if (message.event === "worker-started") continue;
      const id = typeof message.id === "string" ? message.id : undefined;
      const pending = id ? this.pending.get(id) : undefined;
      if (!pending || !id) continue;
      clearTimeout(pending.timer);
      this.pending.delete(id);
      pending.resolve(message);
    }
  }

  private onExit(proc: ChildProcessWithoutNullStreams, reason: string): void {
    if (this.proc !== proc) return;
    this.proc = null;
    const detail = this.stderrTail.trim().split("\n").slice(-2).join(" ").slice(0, 300);
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new ApiError("RUNNER_UNAVAILABLE", `Local narration engine unavailable: ${reason}${detail ? `. ${detail}` : ""}`));
      this.pending.delete(id);
    }
  }

  private send(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
    this.ensureStarted();
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const id = String(this.nextId++);
    const proc = this.proc!;
    const timeoutMs = this.loaded ? this.opts.requestTimeoutMs : Math.max(this.opts.requestTimeoutMs, LOAD_TIMEOUT_MS);
    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new ApiError("RUNNER_UNAVAILABLE", `Local narration engine did not answer within ${timeoutMs} ms.`));
        this.stop(); // a hung worker is killed; the next request starts a fresh one
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      proc.stdin.write(`${JSON.stringify({ id, ...payload })}\n`, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(new ApiError("RUNNER_UNAVAILABLE", "Local narration engine unavailable: could not send the request to the worker."));
        }
      });
    }).then((reply) => {
      if (reply.ok === true) this.loaded = true;
      this.armIdleShutdown();
      return reply;
    }, (err) => {
      this.armIdleShutdown();
      throw err;
    });
  }

  private armIdleShutdown(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.opts.idleShutdownMs <= 0) return;
    this.idleTimer = setTimeout(() => this.stop(), this.opts.idleShutdownMs);
    this.idleTimer.unref();
  }

  stop(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    const proc = this.proc;
    this.proc = null;
    if (proc) {
      try {
        proc.stdin.end();
        proc.kill();
      } catch {
        /* already gone */
      }
    }
  }
}

// ── provider ─────────────────────────────────────────────────────────────────────────────────────────────

export class LocalKokoroNarrationProvider implements NarrationProvider {
  readonly providerId = "local-kokoro";
  readonly providerVersion: string;
  readonly isProduction = true;

  private readonly modelDir: string;
  private readonly format: "mp3" | "wav";
  readonly defaultVoice: string;
  private readonly options: LocalKokoroOptions;
  private worker: KokoroWorker | null = null;

  constructor(options: LocalKokoroOptions = {}) {
    this.options = options;
    this.modelDir = options.modelDir ?? env.NARRATION_LOCAL_MODEL_PATH ?? DEFAULT_MODEL_DIR;
    this.format = options.format ?? env.NARRATION_LOCAL_FORMAT;
    this.defaultVoice = options.defaultVoice ?? env.NARRATION_DEFAULT_VOICE ?? FALLBACK_VOICE;
    // Part of the generation hash: a different model build, default voice, output format or encoder setting makes existing
    // narration regenerable. (provider id, voice and speed are hashed separately.)
    this.providerVersion = `${KOKORO_MODEL_ID}@${KOKORO_UPSTREAM_REVISION.slice(0, 7)}:${this.defaultVoice}:${this.format === "mp3" ? "mp3-cbr48" : "wav"}:1`;
  }

  readiness(): LocalReadiness {
    return checkLocalKokoroReadiness(this.options);
  }

  supportedVoices(): string[] {
    return ["default", ...listVoices(this.modelDir)];
  }

  private resolveVoice(voice: string): string {
    return voice === "default" ? this.defaultVoice : voice;
  }

  private getWorker(): KokoroWorker {
    if (!this.worker) {
      const python = this.options.pythonPath ?? env.NARRATION_LOCAL_PYTHON ?? DEFAULT_PYTHON;
      const command = this.options.command ?? { file: python, args: [WORKER_SCRIPT, "--model-dir", this.modelDir, "--device", this.options.device ?? env.NARRATION_LOCAL_DEVICE] };
      this.worker = new KokoroWorker({ ...command, device: this.options.device ?? env.NARRATION_LOCAL_DEVICE, requestTimeoutMs: this.options.requestTimeoutMs ?? env.NARRATION_REQUEST_TIMEOUT_MS, idleShutdownMs: this.options.idleShutdownMs ?? IDLE_SHUTDOWN_MS });
    }
    return this.worker;
  }

  /** Full health probe: starts the worker (loads the model once) and asks it to describe itself. */
  async health(): Promise<{ ready: boolean; problem?: string; details?: Record<string, unknown> }> {
    const readiness = this.readiness();
    if (!readiness.ready) return readiness;
    try {
      const reply = await this.getWorker().request({ op: "ping" });
      if (reply.ok !== true) return { ready: false, problem: `Local narration engine unavailable: ${String(reply.error ?? "worker error")}` };
      const { id: _id, ok: _ok, ...details } = reply;
      return { ready: true, details };
    } catch (err) {
      return { ready: false, problem: err instanceof Error ? err.message : "Local narration engine unavailable" };
    }
  }

  async generate(request: NarrationRequest): Promise<NarrationResult> {
    const readiness = this.readiness();
    if (!readiness.ready) throw new ApiError("RUNNER_UNAVAILABLE", readiness.problem!);
    const voice = this.resolveVoice(request.voice);
    if (!listVoices(this.modelDir).includes(voice)) throw ApiError.validation(`Unsupported narration voice "${request.voice}".`);
    const text = request.text.trim();
    if (!text) throw ApiError.validation("Cannot narrate empty text.");
    if (text.length > MAX_TEXT_CHARS) throw ApiError.validation(`Narration text is too long for one request (max ${MAX_TEXT_CHARS} characters).`);
    if (!(request.speed >= 0.5 && request.speed <= 2)) throw ApiError.validation("Narration speed must be between 0.5 and 2.");

    const seed = seedFor(text, voice, request.speed); // same text + voice + speed => reproducible audio
    const reply = await this.getWorker().request({ op: "generate", text, voice, speed: request.speed, format: this.format, seed });
    if (reply.ok !== true) throw new ApiError("RUNNER_UNAVAILABLE", `Local narration engine error: ${String(reply.error ?? "unknown error").slice(0, 300)}`);

    const base64 = reply.audioBase64;
    if (typeof base64 !== "string" || base64.length === 0) throw new ApiError("RUNNER_UNAVAILABLE", "Local narration engine returned no audio.");
    const audio = Buffer.from(base64, "base64");
    let durationMs: number | null = null;
    let extra: Record<string, number> = {};
    if (this.format === "mp3") {
      const info = inspectMp3(audio);
      if (info) {
        durationMs = info.durationMs;
        extra = { bitrateKbps: info.bitrateKbps, sampleRate: info.sampleRate, channels: info.channels };
      }
    } else {
      durationMs = wavDurationMs(audio);
      extra = { sampleRate: Number(reply.sampleRate) || 24000, channels: Number(reply.channels) || 1 };
    }
    if (!durationMs) throw new ApiError("RUNNER_UNAVAILABLE", `Local narration engine returned audio that is not a valid ${this.format.toUpperCase()} file (${audio.byteLength} bytes).`);
    const expected = Number(reply.pcmDurationMs);
    if (Number.isFinite(expected) && Math.abs(durationMs - expected) > 150) {
      throw new ApiError("RUNNER_UNAVAILABLE", `Local narration engine returned audio whose length (${durationMs} ms) does not match what it synthesised (${expected} ms).`);
    }
    const peak = Number(reply.peak);
    if (!(peak > 0.01)) throw new ApiError("RUNNER_UNAVAILABLE", "Local narration engine returned silent audio.");
    return {
      audio,
      contentType: this.format === "mp3" ? "audio/mpeg" : "audio/wav",
      extension: this.format === "mp3" ? ".mp3" : ".wav",
      durationMs,
      metadata: { model: KOKORO_MODEL_ID, voice, ...extra, segments: Number(reply.segments) || 1, elapsedMs: Number(reply.elapsedMs) || 0, peak, rmsDbfs: Number(reply.rmsDbfs) || 0 },
    };
  }

  /** Stops the worker process (tests, graceful shutdown). */
  dispose(): void {
    this.worker?.stop();
    this.worker = null;
  }
}

function seedFor(text: string, voice: string, speed: number): number {
  let h = 2166136261;
  for (const ch of `${voice}|${speed}|${text}`) {
    h ^= ch.codePointAt(0)!;
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h & 0x7fffffff;
}
