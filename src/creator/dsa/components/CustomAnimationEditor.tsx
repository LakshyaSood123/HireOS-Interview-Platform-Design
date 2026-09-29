// Authoring UI for a single custom HTML animation package — upload
// (HTML/ZIP) or direct HTML/CSS/JS editing, manifest/bridge-mode controls,
// and a live sandboxed preview. Reuses Creator Studio's existing visual
// language (same panel/button/input classes as the rest of dsa/components)
// rather than introducing a new IDE-style shell.

import { useEffect, useState } from "react"
import { useAuth } from "../../../auth/AuthContext"
import {
  getAnimationPackageDraft,
  saveAnimationPackageContent,
  uploadAnimationPackageZip,
  fileToBase64,
  CMS_PACKAGE_CAPABILITIES,
  type CmsAnimationPackage,
  type CmsPackageCapability,
} from "../animationPackageClient"
import { CmsRevisionConflictError } from "../dsaCmsClient"
import CustomAnimationHost from "./CustomAnimationHost"
import type { CmsDsaBridgeMode } from "../dsaCmsTypes"

interface CustomAnimationEditorProps {
  packageId: string
  bridgeMode: CmsDsaBridgeMode
  onBridgeModeChange: (mode: CmsDsaBridgeMode) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors font-mono"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

export default function CustomAnimationEditor({ packageId, bridgeMode, onBridgeModeChange }: CustomAnimationEditorProps) {
  const { client } = useAuth()
  const [pkg, setPkg] = useState<CmsAnimationPackage | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [tab, setTab] = useState<"html" | "css" | "js">("html")
  const [draft, setDraft] = useState<{ title: string; html: string; css: string; js: string; heightPx: number; capabilities: CmsPackageCapability[]; traceEvents: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    let cancelled = false
    getAnimationPackageDraft(client, packageId)
      .then(loaded => {
        if (cancelled) return
        setPkg(loaded)
        setDraft({
          title: loaded.title,
          html: loaded.html,
          css: loaded.css ?? "",
          js: loaded.js ?? "",
          heightPx: loaded.manifest.heightPx,
          capabilities: loaded.manifest.capabilities,
          traceEvents: loaded.manifest.traceEvents.join(", "),
        })
      })
      .catch(err => !cancelled && setLoadError(err instanceof Error ? err.message : "Failed to load animation package."))
    return () => {
      cancelled = true
    }
  }, [client, packageId])

  async function handleSave() {
    if (!pkg || !draft) return
    setSaving(true)
    setSaveError(null)
    setConflict(false)
    try {
      const saved = await saveAnimationPackageContent(client, packageId, {
        title: draft.title,
        manifest: {
          heightPx: draft.heightPx,
          capabilities: draft.capabilities,
          traceEvents: draft.traceEvents
            .split(",")
            .map(s => s.trim())
            .filter(Boolean),
        },
        html: draft.html,
        css: draft.css || null,
        js: draft.js || null,
        expectedRevision: pkg.revision,
      })
      setPkg(saved)
    } catch (err) {
      if (err instanceof CmsRevisionConflictError) setConflict(true)
      else setSaveError(err instanceof Error ? err.message : "Failed to save animation package.")
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(file: File) {
    if (!pkg) return
    setUploadError(null)
    try {
      const base64 = await fileToBase64(file)
      const isZip = file.name.toLowerCase().endsWith(".zip")
      const saved = isZip
        ? await uploadAnimationPackageZip(client, packageId, draft?.title ?? pkg.title, base64, pkg.revision)
        : await saveAnimationPackageContent(client, packageId, {
            title: draft?.title ?? pkg.title,
            manifest: { heightPx: draft?.heightPx ?? pkg.manifest.heightPx, capabilities: draft?.capabilities ?? [], traceEvents: [] },
            html: await file.text(),
            css: null,
            js: null,
            expectedRevision: pkg.revision,
          })
      setPkg(saved)
      setDraft({
        title: saved.title,
        html: saved.html,
        css: saved.css ?? "",
        js: saved.js ?? "",
        heightPx: saved.manifest.heightPx,
        capabilities: saved.manifest.capabilities,
        traceEvents: saved.manifest.traceEvents.join(", "),
      })
    } catch (err) {
      if (err instanceof CmsRevisionConflictError) setConflict(true)
      // Backend validation errors already carry a clean, specific message
      // (missing animation.html, unsafe path, oversize, etc.) — shown as-is,
      // never a raw stack trace.
      else setUploadError(err instanceof Error ? err.message : "Upload failed.")
    }
  }

  if (loadError) return <p className="text-xs text-red-400">{loadError}</p>
  if (!pkg || !draft) return <p className="text-xs text-gray-500">Loading animation package…</p>

  const toggleCapability = (cap: CmsPackageCapability) => {
    setDraft(d => (d ? { ...d, capabilities: d.capabilities.includes(cap) ? d.capabilities.filter(c => c !== cap) : [...d.capabilities, cap] } : d))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 text-[10.5px] text-gray-500">
        <span>
          Package <span className="font-mono text-gray-400">{pkg.packageId.slice(0, 8)}…</span> · revision r{pkg.revision} ·{" "}
          {pkg.status === "draft" ? "editable draft" : "frozen (immutable)"}
        </span>
      </div>

      {conflict && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-4 py-3 text-xs text-amber-200">
          This animation package changed since you loaded it (maybe in another tab).{" "}
          <button
            onClick={() => getAnimationPackageDraft(client, packageId).then(setPkg)}
            className="underline font-bold hover:text-amber-100 cursor-pointer"
          >
            Reload
          </button>{" "}
          before saving again — your current edits are kept in this editor, not overwritten.
        </div>
      )}

      <div>
        <label className={LABEL_CLASS}>Title</label>
        <input className={FIELD_CLASS} value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
      </div>

      <div>
        <label className={LABEL_CLASS}>Upload HTML / ZIP</label>
        <input
          type="file"
          accept=".html,.htm,.zip"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
            e.target.value = ""
          }}
          className="block w-full text-xs text-gray-300 file:mr-3 file:px-3.5 file:py-2 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#1DB584] file:text-white hover:file:bg-[#159a6f] file:cursor-pointer cursor-pointer"
        />
        {uploadError && <p className="text-[11px] text-red-400 mt-1.5">{uploadError}</p>}
        <p className="text-[10.5px] text-gray-500 mt-1.5">A single .html file, or a .zip containing animation.html (required) plus optional animation.css, animation.js, manifest.json, and assets/*.png|jpg|gif|webp.</p>
      </div>

      <div>
        <div className="flex gap-1.5 mb-2">
          {(["html", "css", "js"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide cursor-pointer transition-all ${
                tab === t ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        {tab === "html" && <textarea className={`${FIELD_CLASS} h-48`} value={draft.html} onChange={e => setDraft({ ...draft, html: e.target.value })} spellCheck={false} />}
        {tab === "css" && <textarea className={`${FIELD_CLASS} h-48`} value={draft.css} onChange={e => setDraft({ ...draft, css: e.target.value })} spellCheck={false} />}
        {tab === "js" && <textarea className={`${FIELD_CLASS} h-48`} value={draft.js} onChange={e => setDraft({ ...draft, js: e.target.value })} spellCheck={false} />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={LABEL_CLASS}>Height (px)</label>
          <input
            type="number"
            className={FIELD_CLASS}
            value={draft.heightPx}
            onChange={e => setDraft({ ...draft, heightPx: Number(e.target.value) || 420 })}
            min={80}
            max={2000}
          />
        </div>
        <div>
          <label className={LABEL_CLASS}>Bridge Mode</label>
          <select
            value={bridgeMode}
            onChange={e => onBridgeModeChange(e.target.value as CmsDsaBridgeMode)}
            className="w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
          >
            <option value="standalone">Standalone</option>
            <option value="controlled">Controlled</option>
            <option value="synchronized">Synchronized</option>
          </select>
        </div>
      </div>

      {bridgeMode !== "standalone" && (
        <div>
          <label className={LABEL_CLASS}>Declared capabilities (commands the parent may send)</label>
          <div className="flex flex-wrap gap-1.5">
            {CMS_PACKAGE_CAPABILITIES.map(cap => (
              <button
                key={cap}
                onClick={() => toggleCapability(cap)}
                className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold cursor-pointer transition-all ${
                  draft.capabilities.includes(cap) ? "bg-[#38BDF8]/20 text-[#7DD3FC] border border-[#38BDF8]/40" : "bg-white/5 text-gray-400 border border-white/10"
                }`}
              >
                {cap}
              </button>
            ))}
          </div>
        </div>
      )}

      {bridgeMode === "synchronized" && (
        <div>
          <label className={LABEL_CLASS}>Declared semantic step ids (comma-separated)</label>
          <input className={FIELD_CLASS} value={draft.traceEvents} onChange={e => setDraft({ ...draft, traceEvents: e.target.value })} placeholder="compare-mid, swap, done" />
        </div>
      )}

      {saveError && <p className="text-[11px] text-red-400">{saveError}</p>}

      <div className="flex items-center gap-3">
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-50 cursor-pointer transition-all">
          {saving ? "Saving…" : "Save Package"}
        </button>
        <button onClick={() => setShowPreview(v => !v)} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
          {showPreview ? "Hide Preview" : "Preview Animation"}
        </button>
      </div>

      {showPreview && (
        <div className="rounded-xl border border-white/10 p-3 bg-black/20">
          <CustomAnimationHost pkg={{ html: draft.html, css: draft.css || null, js: draft.js || null, assets: pkg.assets, manifest: { bridgeVersion: 1, heightPx: draft.heightPx, capabilities: draft.capabilities, traceEvents: [] } }} bridgeMode={bridgeMode} />
        </div>
      )}
    </div>
  )
}
