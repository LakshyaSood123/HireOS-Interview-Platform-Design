// CMS: narration (text-to-speech) for ONE animation package. Shows package-level and per-step narration state, lets an admin
// generate / regenerate / disable / preview narration on the package's DRAFT revision, and previews the animation with
// narration exactly as a learner would hear it. Nothing here runs on page load except reading the current state: generation
// only happens when an admin clicks a button. Narration is derived from the explanation text; it is never typed in here.

import { useCallback, useEffect, useRef, useState } from "react"
import { useAuth } from "../../../auth/AuthContext"
import {
  generateNarration,
  getAnimationPackageDraft,
  getNarrationAudio,
  getNarrationOverview,
  updateNarrationSettings,
  type CmsAnimationPackage,
  type CmsNarrationGenerationSummary,
  type CmsNarrationOverview,
  type CmsNarrationStatus,
} from "../animationPackageClient"
import CustomAnimationHost from "./CustomAnimationHost"
import type { CmsDsaBridgeMode } from "../dsaCmsTypes"

const BADGE: Record<CmsNarrationStatus, string> = {
  GENERATED: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30",
  MISSING: "bg-amber-500/15 text-amber-200 border-amber-400/30",
  STALE: "bg-orange-500/20 text-orange-200 border-orange-400/40",
  DISABLED: "bg-white/5 text-gray-400 border-white/10",
  ERROR: "bg-red-500/15 text-red-200 border-red-400/30",
}
const BTN = "px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 disabled:opacity-40 cursor-pointer transition-all"

function seconds(ms?: number): string {
  return ms ? `${(ms / 1000).toFixed(1)}s` : "–"
}

export default function NarrationPanel({ packageId, bridgeMode, contentRevision }: { packageId: string; bridgeMode: CmsDsaBridgeMode; contentRevision?: number }) {
  const { client } = useAuth()
  const [overview, setOverview] = useState<CmsNarrationOverview | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [summary, setSummary] = useState<CmsNarrationGenerationSummary | null>(null)
  const [previewPkg, setPreviewPkg] = useState<CmsAnimationPackage | null>(null)
  const [playing, setPlaying] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlaying(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      setOverview(await getNarrationOverview(client, packageId))
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load narration state.")
    }
  }, [client, packageId])

  // Re-read the state whenever the package itself is saved (an edited explanation turns its narration STALE).
  useEffect(() => {
    void refresh()
    return stopPreview
  }, [refresh, stopPreview, contentRevision])

  async function run<T>(label: string, fn: () => Promise<T>): Promise<T | undefined> {
    setBusy(label)
    setError(null)
    try {
      return await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : `${label} failed.`)
      return undefined
    } finally {
      setBusy(null)
    }
  }

  async function generate(input: Parameters<typeof generateNarration>[2], label: string) {
    const result = await run(label, () => generateNarration(client, packageId, input))
    if (result) setSummary(result)
    await refresh()
  }

  async function preview(stepId: string) {
    stopPreview()
    const audio = await run("Loading preview", () => getNarrationAudio(client, packageId, "draft", stepId))
    if (!audio) return
    const bytes = Uint8Array.from(atob(audio.dataBase64), c => c.charCodeAt(0))
    const url = URL.createObjectURL(new Blob([bytes], { type: audio.contentType }))
    const el = audioRef.current ?? new Audio()
    audioRef.current = el
    el.onended = () => setPlaying(null)
    el.src = url
    setPlaying(stepId)
    // Preview is purely local playback: it never touches learner progress or completion.
    el.play().catch(() => setPlaying(null))
  }

  async function openAnimationPreview() {
    const loaded = await run("Loading preview", () => getAnimationPackageDraft(client, packageId))
    if (loaded) setPreviewPkg(loaded)
  }

  if (!overview) return <p className="text-xs text-gray-400">{error ?? "Loading narration…"}</p>

  const c = overview.counts
  return (
    <section className="rounded-xl border border-white/10 p-4 bg-black/20 space-y-3" aria-label="Narration">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-bold text-white">Narration</h4>
        <label className="flex items-center gap-2 text-xs text-gray-200">
          <input
            type="checkbox"
            checked={overview.enabled}
            disabled={busy !== null}
            onChange={e => void run("Saving", () => updateNarrationSettings(client, packageId, { enabled: e.target.checked })).then(refresh)}
          />
          Narration enabled
        </label>
      </div>

      <p className="text-[11px] text-gray-400">
        Provider: <b className="text-gray-200">{overview.provider.configured}</b>
        {!overview.provider.isProduction && <span className="ml-2 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-200">DEV/TEST PROVIDER: not real speech</span>}
        {!overview.provider.available && <span className="ml-2 text-red-300">no provider available: generation is disabled{overview.provider.problem ? ` (${overview.provider.problem})` : ""}</span>}
        <span className="ml-3">Audio stored: {(overview.totalAudioBytes / 1024).toFixed(0)} KB</span>
      </p>

      <div className="grid grid-cols-3 gap-2 max-w-md">
        {(["voice", "language", "speed"] as const).map(field => (
          <label key={field} className="text-[10px] uppercase tracking-wider text-gray-400">
            Default {field}
            <input
              className="mt-1 w-full rounded-lg bg-black/25 border border-white/10 px-2 py-1.5 text-xs text-white"
              defaultValue={String(overview.defaults[field])}
              key={`${field}-${overview.defaults[field]}`}
              onBlur={e => {
                const raw = e.target.value.trim()
                const value = field === "speed" ? Number(raw) : raw
                if (value !== overview.defaults[field] && value !== "" && !Number.isNaN(value)) {
                  void run("Saving", () => updateNarrationSettings(client, packageId, { defaults: { [field]: value } })).then(refresh)
                }
              }}
            />
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-200" role="status">
        Generated <b>{c.GENERATED}</b> · Missing <b>{c.MISSING}</b> · Stale <b className={c.STALE ? "text-orange-300" : ""}>{c.STALE}</b> · Disabled <b>{c.DISABLED}</b> · Errors <b className={c.ERROR ? "text-red-300" : ""}>{c.ERROR}</b>
        <span className="text-gray-500"> of {c.total} steps</span>
      </p>

      <div className="flex gap-2 flex-wrap">
        <button className={BTN} disabled={busy !== null || !overview.provider.available} onClick={() => void generate({ mode: "missing" }, "Generating missing narration")}>
          Generate Missing Narration
        </button>
        <button className={BTN} disabled={busy !== null || !overview.provider.available || c.STALE === 0} onClick={() => void generate({ mode: "stale" }, "Regenerating stale narration")}>
          Regenerate Stale Narration
        </button>
        <button className={BTN} disabled={busy !== null || c.GENERATED + c.STALE === 0} onClick={() => void openAnimationPreview()}>
          Preview Animation + Narration
        </button>
        {busy && <span className="text-[11px] text-gray-400" role="status">{busy}…</span>}
      </div>

      {summary && (
        <p className="text-[11px] text-gray-300" role="status">
          Last run: generated {summary.generated}, reused {summary.reused}, skipped {summary.skipped}, failed {summary.failed}.
        </p>
      )}
      {error && <p className="text-[11px] text-red-400" role="alert">{error}</p>}
      {overview.issues.filter(i => i.severity === "error").map((i, k) => (
        <p key={k} className="text-[11px] text-red-300">Error: {i.message}</p>
      ))}

      <div className="space-y-2">
        {overview.steps.map(step => (
          <div key={step.stepId} className="rounded-lg border border-white/10 bg-white/[0.03] p-3 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-white">{step.label}</span>
              <code className="text-[10px] text-gray-500">{step.stepId}</code>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${BADGE[step.status]}`}>{step.status}</span>
              {step.status === "STALE" && <span className="text-[10px] text-orange-300">explanation changed since this audio was generated</span>}
            </div>
            <p className="text-[11.5px] text-gray-300 leading-relaxed">{step.explanation || <i className="text-gray-500">no explanation text</i>}</p>
            <p className="text-[10.5px] text-gray-500">
              {step.voice ? `voice ${step.voice === "default" && overview.provider.defaultVoice ? `default (${overview.provider.defaultVoice})` : step.voice} · ${step.language} · ${step.speed}x · ` : ""}duration {seconds(step.durationMs)}
              {step.generatedAt ? ` · generated ${new Date(step.generatedAt).toLocaleString()}` : ""}
              {step.error ? <span className="text-red-300"> · {step.error}</span> : null}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button className={BTN} disabled={busy !== null || !step.asset} onClick={() => (playing === step.stepId ? stopPreview() : void preview(step.stepId))}>
                {playing === step.stepId ? "Stop" : "Preview"}
              </button>
              <button className={BTN} disabled={busy !== null || !overview.provider.available || !step.explanation} onClick={() => void generate({ mode: "step", stepId: step.stepId, force: step.status === "GENERATED" }, step.asset ? "Regenerating" : "Generating")}>
                {step.asset ? "Regenerate" : "Generate"}
              </button>
              <button className={BTN} disabled={busy !== null} onClick={() => void run("Saving", () => updateNarrationSettings(client, packageId, { steps: { [step.stepId]: { enabled: step.status === "DISABLED" } } })).then(refresh)}>
                {step.status === "DISABLED" ? "Enable" : "Disable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {previewPkg && (
        <div className="rounded-xl border border-white/10 p-3 bg-black/20">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-400">Preview (draft revision, with narration controls as learners see them)</span>
            <button className={BTN} onClick={() => setPreviewPkg(null)}>Close preview</button>
          </div>
          <CustomAnimationHost pkg={previewPkg} bridgeMode={bridgeMode === "standalone" ? "synchronized" : bridgeMode} />
        </div>
      )}
    </section>
  )
}
