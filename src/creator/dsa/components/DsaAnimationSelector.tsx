// CMS controls animation ASSIGNMENT only — it never edits animation React
// code. Options are read from the real codeTraceRegistry (one entry per
// currently-registered AlgorithmAnimationId with a real Code Trace), not
// hardcoded, so this list stays correct as new animations are added. The
// selected id is the SAME id AnimationPlayback/AlgorithmAnimation.tsx and
// codeTraceRegistry.ts already key off — no separate Code Trace id exists
// or is needed (PART 12 of the task).

import { codeTraceRegistry } from "../../../learning/animations/codeTraceRegistry"
import type { AlgorithmAnimationSpec } from "../../../learning/types"

const REGISTERED_ANIMATION_IDS = Object.keys(codeTraceRegistry).sort()

interface DsaAnimationSelectorProps {
  animation: AlgorithmAnimationSpec | undefined
  onChange: (animation: AlgorithmAnimationSpec | undefined) => void
}

export default function DsaAnimationSelector({ animation, onChange }: DsaAnimationSelectorProps) {
  return (
    <div className="space-y-2.5">
      <select
        value={animation?.id ?? ""}
        onChange={e => {
          const id = e.target.value
          onChange(id ? { id: id as AlgorithmAnimationSpec["id"], title: animation?.title } : undefined)
        }}
        className="w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white outline-none transition-colors"
      >
        <option value="">None</option>
        {REGISTERED_ANIMATION_IDS.map(id => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      {animation && (
        <input
          value={animation.title ?? ""}
          onChange={e => onChange({ id: animation.id, title: e.target.value || undefined })}
          placeholder="Optional checkpoint-specific animation title override"
          className="w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors"
        />
      )}
      <p className="text-[10.5px] text-gray-500">
        {REGISTERED_ANIMATION_IDS.length} registered animation{REGISTERED_ANIMATION_IDS.length === 1 ? "" : "s"} available. This id also drives the
        synchronized Code Trace panel — no separate Code Trace reference is needed.
      </p>
    </div>
  )
}
