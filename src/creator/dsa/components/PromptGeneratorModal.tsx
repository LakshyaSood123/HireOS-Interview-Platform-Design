// Reusable "Generate AI Package/Trace/Full Prompt" modal. Pure client-side
// template generation (promptGenerator.ts) — NO network call, NO AI API.
// Used from both the Custom Animation editor and the Code Trace editor.

import { useMemo, useState } from "react"
import { buildPrompt, type PromptContext, type PromptLanguageSelection, type PromptMode } from "../promptGenerator"
import type { CmsDsaBridgeMode } from "../dsaCmsTypes"

interface PromptGeneratorModalProps {
  initialMode: PromptMode
  /** Restricts which mode tabs are shown — e.g. the Code Trace area only
   * ever wants Trace/Full, not a bare Animation-only prompt. */
  availableModes: PromptMode[]
  context: PromptContext
  defaultBridgeMode: CmsDsaBridgeMode
  onClose: () => void
}

const MODE_LABELS: Record<PromptMode, string> = { animation: "Animation Only", trace: "Trace Only", full: "Full Animation + Trace" }

export default function PromptGeneratorModal({ initialMode, availableModes, context, defaultBridgeMode, onClose }: PromptGeneratorModalProps) {
  const [mode, setMode] = useState<PromptMode>(initialMode)
  const [bridgeMode, setBridgeMode] = useState<CmsDsaBridgeMode>(defaultBridgeMode === "standalone" ? "synchronized" : defaultBridgeMode)
  const [languages, setLanguages] = useState<PromptLanguageSelection>({ pseudocode: true, python: true, cpp: true, java: true })
  const [copied, setCopied] = useState(false)

  const prompt = useMemo(() => buildPrompt(context, { mode, bridgeMode, languages }), [context, mode, bridgeMode, languages])

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function handleDownload() {
    const blob = new Blob([prompt], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `reagvis-${mode}-prompt.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  function toggleLanguage(key: keyof PromptLanguageSelection) {
    if (key === "pseudocode") return // always required
    setLanguages((l) => ({ ...l, [key]: !l[key] }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-[#0F2A20] border border-white/10 shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-sm font-black text-white">✨ Generate AI Prompt</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer text-lg leading-none">
            ×
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/10 space-y-3 shrink-0">
          {availableModes.length > 1 && (
            <div className="flex gap-1.5">
              {availableModes.map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer transition-all ${
                    mode === m ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                  }`}
                >
                  {MODE_LABELS[m]}
                </button>
              ))}
            </div>
          )}

          {mode !== "trace" && (
            <div className="flex items-center gap-2">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Bridge Mode</span>
              <select
                value={bridgeMode}
                onChange={(e) => setBridgeMode(e.target.value as CmsDsaBridgeMode)}
                className="rounded-lg bg-black/25 border border-white/10 px-2.5 py-1 text-xs text-white outline-none"
              >
                <option value="standalone">Standalone</option>
                <option value="controlled">Controlled</option>
                <option value="synchronized">Synchronized</option>
              </select>
            </div>
          )}

          {mode !== "animation" && (
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-gray-400">Languages</span>
              {(["pseudocode", "python", "cpp", "java"] as const).map((key) => (
                <label key={key} className="flex items-center gap-1.5 text-[11px] text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={languages[key]} disabled={key === "pseudocode"} onChange={() => toggleLanguage(key)} className="accent-[#1DB584]" />
                  {key === "pseudocode" ? "Pseudocode (required)" : key === "cpp" ? "C++" : key[0]!.toUpperCase() + key.slice(1)}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <textarea readOnly value={prompt} className="w-full h-80 rounded-xl bg-black/30 border border-white/10 p-3.5 text-[11px] font-mono text-gray-200 outline-none resize-none" />
        </div>

        <div className="px-5 py-4 border-t border-white/10 flex items-center gap-3 shrink-0">
          <button onClick={handleCopy} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer transition-all">
            {copied ? "✓ Copied" : "Copy Prompt"}
          </button>
          <button onClick={handleDownload} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
            Download .txt
          </button>
        </div>
      </div>
    </div>
  )
}
