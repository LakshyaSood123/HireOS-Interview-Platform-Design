// Learner-side narration playback for a package-backed animation.
//
// The controller does NOT run a second timeline. The animation's own bridge is the single source of truth for which step
// is current: narration follows STEP_CHANGED(stepId) and the learner's commands (PLAY / PAUSE / NEXT / PREVIOUS / RESET /
// GOTO_STEP), and owns exactly ONE audio element so two narrations can never overlap.
//
// Narration is supplementary: any audio failure leaves the animation, the explanation text and the controls working.

export interface NarrationStepData {
  enabled: boolean
  asset?: string
  durationMs?: number
}
export interface NarrationAudioFile {
  path: string
  contentType: string
  dataBase64: string
}
/** The `narration` object that travels with a package revision (see backend narration.types.ts). */
export interface PackageNarrationData {
  enabled: boolean
  steps: Record<string, NarrationStepData>
  audio: NarrationAudioFile[]
}

export type NarrationCommand = "PLAY" | "PAUSE" | "NEXT" | "PREVIOUS" | "RESET" | "GOTO_STEP"

/** The subset of HTMLAudioElement the controller uses (lets tests inject a fake). */
export interface AudioLike {
  src: string
  playbackRate: number
  currentTime: number
  readonly paused: boolean
  readonly ended: boolean
  play(): Promise<void> | void
  pause(): void
  addEventListener(type: string, listener: () => void): void
  removeEventListener(type: string, listener: () => void): void
}

export const NARRATION_RATES = [0.75, 1, 1.25, 1.5] as const
export const NARRATION_BREATHING_MS = 600
const ENABLED_KEY = "reagvis.narration.enabled"
const RATE_KEY = "reagvis.narration.rate"

/** Same rule the animation runtime applies: never shorter than the text-based pace, never shorter than audio + breathing room. */
export function narratedStepDurationMs(textBasedMs: number, narrationMs: number | undefined, breathingMs = NARRATION_BREATHING_MS): number {
  return narrationMs && narrationMs > 0 ? Math.max(textBasedMs, Math.round(narrationMs) + breathingMs) : textBasedMs
}

export interface NarrationSnapshot {
  /** The package ships narration for at least one step. */
  available: boolean
  /** Learner preference (persisted): narration ON/OFF. */
  enabled: boolean
  rate: number
  currentStepId: string | null
  /** The current step has narration the learner can replay. */
  currentStepHasNarration: boolean
  /** A step's narration is audibly playing right now. */
  speaking: boolean
  /** Audio failed to load/play for the current step (animation keeps running). */
  unavailable: boolean
}

interface Options {
  createAudio?: () => AudioLike
  makeUrl?: (contentType: string, dataBase64: string) => string
  revokeUrl?: (url: string) => void
  storage?: Pick<Storage, "getItem" | "setItem"> | null
}

function defaultStorage(): Pick<Storage, "getItem" | "setItem"> | null {
  try {
    return typeof window !== "undefined" ? window.localStorage : null
  } catch {
    return null
  }
}

function base64ToBlobUrl(contentType: string, dataBase64: string): string {
  const bytes = Uint8Array.from(atob(dataBase64), c => c.charCodeAt(0))
  return URL.createObjectURL(new Blob([bytes], { type: contentType }))
}

export class NarrationController {
  private readonly data: PackageNarrationData
  private readonly order: string[]
  private readonly createAudio: () => AudioLike
  private readonly makeUrl: (contentType: string, dataBase64: string) => string
  private readonly revokeUrl: (url: string) => void
  private readonly storage: Pick<Storage, "getItem" | "setItem"> | null
  private audio: AudioLike | null = null
  private readonly urls = new Map<string, string>()
  private readonly listeners = new Set<() => void>()
  private enabled: boolean
  private rate: number
  private armed = false // true once the learner has used a control (browsers forbid audio before a user gesture)
  private currentStep: string | null = null
  private audioStep: string | null = null
  private unavailable = false
  private token = 0
  private snap: NarrationSnapshot

  constructor(data: PackageNarrationData, order: string[], options: Options = {}) {
    this.data = data
    this.order = order
    this.createAudio = options.createAudio ?? (() => new Audio() as unknown as AudioLike)
    this.makeUrl = options.makeUrl ?? base64ToBlobUrl
    this.revokeUrl = options.revokeUrl ?? ((u: string) => URL.revokeObjectURL(u))
    this.storage = options.storage === undefined ? defaultStorage() : options.storage
    this.enabled = this.read(ENABLED_KEY, "true") !== "false"
    const rate = Number(this.read(RATE_KEY, "1"))
    this.rate = (NARRATION_RATES as readonly number[]).includes(rate) ? rate : 1
    this.snap = this.compute()
  }

  // ── queries ──────────────────────────────────────────────────────────────
  hasNarration(stepId: string | null): boolean {
    if (!stepId || !this.data.enabled) return false
    const rec = this.data.steps[stepId]
    return Boolean(rec && rec.enabled !== false && rec.asset && this.data.audio.some(a => a.path === rec.asset))
  }
  get available(): boolean {
    return this.order.some(id => this.hasNarration(id))
  }
  /** { stepId: durationMs } for narrated steps — sent to the animation so its autoplay waits for the audio. Empty while narration is OFF. */
  durations(): Record<string, number> {
    const out: Record<string, number> = {}
    if (!this.enabled) return out
    for (const id of this.order) {
      const d = this.data.steps[id]?.durationMs
      if (this.hasNarration(id) && d && d > 0) out[id] = d
    }
    return out
  }
  getSnapshot = (): NarrationSnapshot => this.snap
  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  // ── learner preferences ──────────────────────────────────────────────────
  setEnabled(on: boolean): void {
    this.enabled = on
    this.write(ENABLED_KEY, String(on))
    if (!on) this.stopAudio()
    this.emit()
  }
  setRate(rate: number): void {
    if (!(NARRATION_RATES as readonly number[]).includes(rate)) return
    this.rate = rate
    this.write(RATE_KEY, String(rate))
    if (this.audio) this.audio.playbackRate = rate
    this.emit()
  }

  // ── animation bridge ─────────────────────────────────────────────────────
  /** Call with each learner command BEFORE it is forwarded to the animation. */
  command(type: NarrationCommand): void {
    switch (type) {
      case "PLAY": {
        this.armed = true
        const last = this.order[this.order.length - 1]
        const resumable = this.audio && this.audio.paused && !this.audio.ended && this.audio.currentTime > 0 && this.audioStep === this.currentStep
        if (resumable) this.resume()
        // PLAY on the final step makes the animation restart from step 1, whose STEP_CHANGED starts that narration.
        else if (this.currentStep && this.currentStep !== last) this.startStep(this.currentStep)
        break
      }
      case "PAUSE":
        this.audio?.pause()
        this.emit()
        break
      case "RESET":
        this.armed = false
        this.stopAudio()
        break
      default: // NEXT, PREVIOUS, GOTO_STEP: silence the old step now; the new step's STEP_CHANGED starts its narration
        this.armed = true
        this.stopAudio()
    }
  }
  /** Call on every STEP_CHANGED from the animation. */
  stepChanged(stepId: string): void {
    this.currentStep = stepId
    this.stopAudio()
    this.unavailable = false
    if (this.armed) this.startStep(stepId)
    else this.emit()
  }
  /** Replays the current step's narration from the start without touching the animation. */
  replay(): void {
    this.armed = true
    this.stopAudio()
    if (this.currentStep) this.startStep(this.currentStep)
  }
  dispose(): void {
    this.stopAudio()
    this.audio = null
    for (const url of this.urls.values()) this.revokeUrl(url)
    this.urls.clear()
    this.listeners.clear()
  }

  // ── internals ────────────────────────────────────────────────────────────
  private urlFor(stepId: string): string | null {
    const cached = this.urls.get(stepId)
    if (cached) return cached
    const rec = this.data.steps[stepId]
    const file = rec?.asset ? this.data.audio.find(a => a.path === rec.asset) : undefined
    if (!file) return null
    try {
      const url = this.makeUrl(file.contentType, file.dataBase64)
      this.urls.set(stepId, url)
      return url
    } catch {
      return null
    }
  }
  private ensureAudio(): AudioLike {
    if (!this.audio) {
      this.audio = this.createAudio()
      this.audio.addEventListener("ended", () => this.emit())
      this.audio.addEventListener("pause", () => this.emit())
      this.audio.addEventListener("playing", () => this.emit())
      this.audio.addEventListener("error", () => {
        this.unavailable = true
        this.emit()
      })
    }
    return this.audio
  }
  private startStep(stepId: string): void {
    if (!this.enabled || !this.hasNarration(stepId)) {
      this.emit()
      return
    }
    const url = this.urlFor(stepId)
    if (!url) {
      this.unavailable = true
      this.emit()
      return
    }
    const audio = this.ensureAudio()
    const mine = ++this.token
    audio.src = url
    audio.currentTime = 0
    audio.playbackRate = this.rate
    this.audioStep = stepId
    this.unavailable = false
    try {
      const played = audio.play()
      if (played && typeof (played as Promise<void>).catch === "function") {
        ;(played as Promise<void>).catch(() => {
          if (mine === this.token) {
            this.unavailable = true
            this.emit()
          }
        })
      }
    } catch {
      this.unavailable = true
    }
    this.emit()
  }
  private resume(): void {
    try {
      const played = this.audio?.play()
      if (played && typeof (played as Promise<void>).catch === "function") (played as Promise<void>).catch(() => undefined)
    } catch {
      /* narration is supplementary */
    }
    this.emit()
  }
  private stopAudio(): void {
    this.token++
    if (this.audio) {
      this.audio.pause()
      try {
        this.audio.currentTime = 0
      } catch {
        /* element without metadata yet */
      }
    }
    this.audioStep = null
    this.emit()
  }
  private compute(): NarrationSnapshot {
    return {
      available: this.available,
      enabled: this.enabled,
      rate: this.rate,
      currentStepId: this.currentStep,
      currentStepHasNarration: this.hasNarration(this.currentStep),
      speaking: Boolean(this.audio && !this.audio.paused && !this.audio.ended && this.audioStep !== null),
      unavailable: this.unavailable,
    }
  }
  private emit(): void {
    this.snap = this.compute()
    for (const fn of [...this.listeners]) fn()
  }
  private read(key: string, fallback: string): string {
    try {
      return this.storage?.getItem(key) ?? fallback
    } catch {
      return fallback
    }
  }
  private write(key: string, value: string): void {
    try {
      this.storage?.setItem(key, value)
    } catch {
      /* preference only */
    }
  }
}
