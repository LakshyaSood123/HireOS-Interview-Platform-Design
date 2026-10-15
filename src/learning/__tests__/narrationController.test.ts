import { describe, expect, it } from "vitest"

import { NarrationController, narratedStepDurationMs, type AudioLike, type PackageNarrationData } from "../narration/narrationController"

class FakeAudio implements AudioLike {
  src = ""
  playbackRate = 1
  currentTime = 0
  paused = true
  ended = false
  plays: string[] = []
  private listeners: Record<string, (() => void)[]> = {}
  play() {
    this.paused = false
    this.ended = false
    this.plays.push(this.src)
    this.fire("playing")
  }
  pause() {
    if (!this.paused) {
      this.paused = true
      this.fire("pause")
    }
  }
  addEventListener(type: string, fn: () => void) {
    ;(this.listeners[type] ??= []).push(fn)
  }
  removeEventListener() {}
  finish() {
    this.paused = true
    this.ended = true
    this.fire("ended")
  }
  fail() {
    this.fire("error")
  }
  private fire(type: string) {
    for (const fn of this.listeners[type] ?? []) fn()
  }
}

const ORDER = ["a", "b", "c"]
const DATA: PackageNarrationData = {
  enabled: true,
  steps: { a: { enabled: true, asset: "audio/a.wav", durationMs: 4000 }, b: { enabled: true, asset: "audio/b.wav", durationMs: 6000 }, c: { enabled: false, asset: "audio/c.wav", durationMs: 3000 } },
  audio: ["a", "b", "c"].map(id => ({ path: `audio/${id}.wav`, contentType: "audio/wav", dataBase64: "AAAA" })),
}
const memory = () => {
  const m = new Map<string, string>()
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
}
function make(data = DATA, storage = memory()) {
  const audio = new FakeAudio()
  const c = new NarrationController(data, ORDER, { createAudio: () => audio, makeUrl: (_t, _d) => `blob:${Math.random()}`, revokeUrl: () => {}, storage })
  return { c, audio, storage }
}
const urlOf = (c: NarrationController, audio: FakeAudio, step: string) => {
  c.stepChanged(step)
  return audio.src
}

describe("narration availability and timing", () => {
  it("only steps that are enabled AND have audio count as narrated", () => {
    const { c } = make()
    expect([c.hasNarration("a"), c.hasNarration("b"), c.hasNarration("c"), c.hasNarration("zzz")]).toEqual([true, true, false, false])
    expect(c.available).toBe(true)
    expect(c.durations()).toEqual({ a: 4000, b: 6000 })
  })
  it("reports nothing when package narration is disabled or no step has audio", () => {
    expect(make({ ...DATA, enabled: false }).c.available).toBe(false)
    expect(make({ enabled: true, steps: { a: { enabled: true } }, audio: [] }).c.available).toBe(false)
  })
  it("narrated step duration = max(text pace, audio + 600ms); never shortens a step", () => {
    expect(narratedStepDurationMs(5000, undefined)).toBe(5000)
    expect(narratedStepDurationMs(5000, 3000)).toBe(5000)
    expect(narratedStepDurationMs(5000, 8000)).toBe(8600)
    expect(narratedStepDurationMs(4500, 4000)).toBe(4600)
  })
  it("sends no durations while narration is OFF, so autoplay is not slowed", () => {
    const { c } = make()
    c.setEnabled(false)
    expect(c.durations()).toEqual({})
  })
})

describe("playback follows the animation bridge", () => {
  it("does not speak on load: the initial STEP_CHANGED is silent until the learner uses a control", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    expect(audio.plays).toEqual([])
  })
  it("PLAY starts the current step; the next STEP_CHANGED switches to that step with no overlap", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    expect(audio.plays).toHaveLength(1)
    const first = audio.src
    c.stepChanged("b")
    expect(audio.plays).toHaveLength(2)
    expect(audio.src).not.toBe(first)
    expect(audio.paused).toBe(false) // exactly one element, one sound
  })
  it("PAUSE pauses at the same position and PLAY resumes it (no restart)", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    audio.currentTime = 1.7
    c.command("PAUSE")
    expect(audio.paused).toBe(true)
    c.command("PLAY")
    expect(audio.paused).toBe(false)
    expect(audio.currentTime).toBe(1.7)
    expect(audio.plays).toHaveLength(2) // resume = play() on the same source, not a new step start
    expect(new Set(audio.plays).size).toBe(1)
  })
  it("NEXT stops immediately and starts the next step's narration; PREVIOUS likewise", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    c.command("NEXT")
    expect(audio.paused).toBe(true) // old narration stopped before the new step is known
    c.stepChanged("b")
    expect(audio.paused).toBe(false)
    const b = audio.src
    c.command("PREVIOUS")
    expect(audio.paused).toBe(true)
    c.stepChanged("a")
    expect(audio.src).not.toBe(b)
    expect(audio.paused).toBe(false)
  })
  it("RESET stops and rewinds audio, and the reset animation's STEP_CHANGED stays silent until PLAY", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    audio.currentTime = 2
    c.command("RESET")
    expect(audio.paused).toBe(true)
    expect(audio.currentTime).toBe(0)
    c.stepChanged("a")
    expect(audio.paused).toBe(true)
    c.command("PLAY")
    expect(audio.paused).toBe(false)
  })
  it("GOTO_STEP switches to the chosen step's audio only", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    const a = audio.src
    c.command("GOTO_STEP")
    c.stepChanged("b")
    expect(audio.src).not.toBe(a)
    expect(audio.plays).toHaveLength(2)
  })
  it("PLAY on the final step does not speak it again: the animation restarts at step 1, whose STEP_CHANGED speaks", () => {
    const { c, audio } = make()
    c.stepChanged("c")
    c.command("PLAY")
    expect(audio.plays).toEqual([])
    c.stepChanged("a")
    expect(audio.plays).toHaveLength(1)
  })
  it("a step without narration is silent and stops the previous voice", () => {
    const { c, audio } = make()
    c.stepChanged("b")
    c.command("PLAY")
    c.stepChanged("c")
    expect(audio.paused).toBe(true)
    expect(c.getSnapshot().currentStepHasNarration).toBe(false)
  })
})

describe("replay, OFF/ON and speed", () => {
  it("replay restarts only the current explanation's audio", () => {
    const { c, audio } = make()
    c.stepChanged("b")
    c.command("PLAY")
    audio.currentTime = 3
    c.replay()
    expect(audio.currentTime).toBe(0)
    expect(audio.paused).toBe(false)
  })
  it("OFF silences the voice and stays silent through step changes; ON restores narration", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    c.setEnabled(false)
    expect(audio.paused).toBe(true)
    c.stepChanged("b")
    expect(audio.paused).toBe(true)
    c.setEnabled(true)
    c.stepChanged("a")
    expect(audio.paused).toBe(false)
  })
  it("playback speed is client-side: it sets playbackRate live and persists, and rejects unsupported rates", () => {
    const { c, audio, storage } = make()
    c.stepChanged("a")
    c.command("PLAY")
    c.setRate(1.5)
    expect(audio.playbackRate).toBe(1.5)
    expect(storage.getItem("reagvis.narration.rate")).toBe("1.5")
    c.setRate(9)
    expect(audio.playbackRate).toBe(1.5)
    c.stepChanged("b")
    expect(audio.playbackRate).toBe(1.5)
  })
  it("restores persisted preferences", () => {
    const storage = memory()
    storage.setItem("reagvis.narration.enabled", "false")
    storage.setItem("reagvis.narration.rate", "0.75")
    const { c } = make(DATA, storage)
    expect(c.getSnapshot()).toMatchObject({ enabled: false, rate: 0.75 })
  })
})

describe("failure handling", () => {
  it("an audio error is reported but nothing throws and later steps still work", () => {
    const { c, audio } = make()
    c.stepChanged("a")
    c.command("PLAY")
    audio.fail()
    expect(c.getSnapshot().unavailable).toBe(true)
    c.stepChanged("b")
    expect(c.getSnapshot().unavailable).toBe(false)
    expect(audio.paused).toBe(false)
  })
  it("a step whose audio file is missing is silently unavailable, not an exception", () => {
    const data: PackageNarrationData = { enabled: true, steps: { a: { enabled: true, asset: "audio/a.wav", durationMs: 1000 } }, audio: [] }
    const { c, audio } = make(data)
    c.stepChanged("a")
    c.command("PLAY")
    expect(c.hasNarration("a")).toBe(false)
    expect(audio.plays).toEqual([])
  })
})
