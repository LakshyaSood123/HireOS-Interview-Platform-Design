// "Study Animation" source toggle — Registered (existing behavior,
// unchanged) vs. Custom HTML (the deferred authoring subsystem). Existing
// registered-animation checkpoints keep working exactly as before; this
// only adds a second branch, never converts one into the other.

import { useState } from "react"
import { useAuth } from "../../../auth/AuthContext"
import { createAnimationPackage } from "../animationPackageClient"
import DsaAnimationSelector from "./DsaAnimationSelector"
import CustomAnimationEditor from "./CustomAnimationEditor"
import type { CmsDsaAnimationSource, CmsDsaBridgeMode } from "../dsaCmsTypes"

interface DsaAnimationSourceEditorProps {
  animation: CmsDsaAnimationSource | undefined
  onChange: (animation: CmsDsaAnimationSource | undefined) => void
}

export default function DsaAnimationSourceEditor({ animation, onChange }: DsaAnimationSourceEditorProps) {
  const { client } = useAuth()
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  // Once "Custom HTML Animation" is picked but no package exists yet, this
  // keeps the tab selected while `createAnimationPackage` is in flight /
  // before the author has created one, rather than snapping back to
  // "Registered" the moment `animation` is undefined.
  const [sourceKind, setSourceKind] = useState<"registered" | "custom">(animation?.kind === "custom" ? "custom" : "registered")

  async function handlePickCustom() {
    setSourceKind("custom")
    if (animation?.kind === "custom") return
    setCreating(true)
    setCreateError(null)
    try {
      const pkg = await createAnimationPackage(client, "Untitled Animation")
      onChange({ kind: "custom", packageId: pkg.packageId, revisionId: "draft", bridgeMode: "standalone" })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create animation package.")
    } finally {
      setCreating(false)
    }
  }

  function handlePickRegistered() {
    setSourceKind("registered")
    if (animation?.kind === "custom") onChange(undefined)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1.5">
        <button
          onClick={handlePickRegistered}
          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            sourceKind === "registered" ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
          }`}
        >
          Registered Animation
        </button>
        <button
          onClick={handlePickCustom}
          className={`flex-1 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
            sourceKind === "custom" ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
          }`}
        >
          Custom HTML Animation
        </button>
      </div>

      {sourceKind === "registered" && <DsaAnimationSelector animation={animation?.kind === "registered" ? animation : undefined} onChange={a => onChange(a)} />}

      {sourceKind === "custom" && (
        <>
          {createError && <p className="text-[11px] text-red-400">{createError}</p>}
          {creating && <p className="text-xs text-gray-500">Creating animation package…</p>}
          {animation?.kind === "custom" && (
            <CustomAnimationEditor
              packageId={animation.packageId}
              bridgeMode={animation.bridgeMode}
              onBridgeModeChange={(bridgeMode: CmsDsaBridgeMode) => onChange({ ...animation, bridgeMode })}
            />
          )}
        </>
      )}
    </div>
  )
}
