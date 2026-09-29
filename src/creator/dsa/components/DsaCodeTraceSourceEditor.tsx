// Code Trace source selector + CMS Structured Trace step editor. Registered
// animations keep defaulting to their existing Code Trace registry entry
// (no `traceSource` field at all, or `{ kind: "registered" }`) — this only
// adds the three new options.

import { useState } from "react"
import type { CmsDsaTraceSource, CmsDsaTraceStep, CmsDsaAnimationSource } from "../dsaCmsTypes"

interface DsaCodeTraceSourceEditorProps {
  traceSource: CmsDsaTraceSource | undefined
  animation: CmsDsaAnimationSource | undefined
  onChange: (traceSource: CmsDsaTraceSource | undefined) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono"
const LABEL_CLASS = "text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1"

function newStep(): CmsDsaTraceStep {
  return { stepId: `step-${Math.random().toString(36).slice(2, 8)}`, label: "", pseudocode: "" }
}

export default function DsaCodeTraceSourceEditor({ traceSource, animation, onChange }: DsaCodeTraceSourceEditorProps) {
  const kind = traceSource?.kind ?? "registered"
  const steps = traceSource?.steps ?? []
  const [expandedStep, setExpandedStep] = useState<string | null>(null)

  function setKind(next: CmsDsaTraceSource["kind"]) {
    if (next === "registered") onChange(undefined)
    else onChange({ kind: next, steps: next === "cms" ? (traceSource?.steps ?? []) : undefined })
  }

  function updateStep(stepId: string, patch: Partial<CmsDsaTraceStep>) {
    onChange({ kind: "cms", steps: steps.map(s => (s.stepId === stepId ? { ...s, ...patch } : s)) })
  }

  function removeStep(stepId: string) {
    onChange({ kind: "cms", steps: steps.filter(s => s.stepId !== stepId) })
  }

  function addStep() {
    const step = newStep()
    onChange({ kind: "cms", steps: [...steps, step] })
    setExpandedStep(step.stepId)
  }

  const isCustomAnimation = animation?.kind === "custom"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        {(
          [
            ["registered", "Registered Trace"],
            ["cms", "CMS Structured"],
            ["package", "Package Trace"],
            ["none", "None"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setKind(value)}
            disabled={value === "package" && !isCustomAnimation}
            className={`px-2.5 py-2 rounded-xl text-[10.5px] font-bold cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              kind === value ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {kind === "registered" && <p className="text-[10.5px] text-gray-500">Uses this checkpoint's registered animation's existing Code Trace entry (codeTraceRegistry.ts) — unchanged.</p>}
      {kind === "none" && <p className="text-[10.5px] text-gray-500">No Code Trace panel shown for this checkpoint.</p>}
      {kind === "package" && (
        <p className="text-[10.5px] text-gray-500">
          Uses trace metadata declared in the custom animation package's manifest (its declared semantic step ids). Pick "CMS Structured" instead to author an explicit
          pseudocode/language trace that overrides the package's own — explicit CMS override always wins.
        </p>
      )}

      {kind === "cms" && (
        <div className="space-y-2.5">
          {steps.length === 0 && <p className="text-[10.5px] text-gray-500">No steps yet.</p>}
          {steps.map((step, idx) => (
            <div key={step.stepId} className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === step.stepId ? null : step.stepId)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 cursor-pointer"
              >
                <span className="text-xs font-bold text-white">
                  {idx + 1}. {step.label || step.stepId}
                </span>
                <span className="text-[10px] text-gray-500">{expandedStep === step.stepId ? "▲" : "▼"}</span>
              </button>
              {expandedStep === step.stepId && (
                <div className="px-3.5 pb-3.5 space-y-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className={LABEL_CLASS}>Step ID</label>
                      <input className={FIELD_CLASS} value={step.stepId} onChange={e => updateStep(step.stepId, { stepId: e.target.value })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Label</label>
                      <input className={FIELD_CLASS} value={step.label} onChange={e => updateStep(step.stepId, { label: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Pseudocode (required)</label>
                    <textarea className={`${FIELD_CLASS} h-16`} value={step.pseudocode} onChange={e => updateStep(step.stepId, { pseudocode: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className={LABEL_CLASS}>Python (optional)</label>
                      <textarea className={`${FIELD_CLASS} h-14`} value={step.python ?? ""} onChange={e => updateStep(step.stepId, { python: e.target.value || undefined })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>C++ (optional)</label>
                      <textarea className={`${FIELD_CLASS} h-14`} value={step.cpp ?? ""} onChange={e => updateStep(step.stepId, { cpp: e.target.value || undefined })} />
                    </div>
                    <div>
                      <label className={LABEL_CLASS}>Java (optional)</label>
                      <textarea className={`${FIELD_CLASS} h-14`} value={step.java ?? ""} onChange={e => updateStep(step.stepId, { java: e.target.value || undefined })} />
                    </div>
                  </div>
                  <div>
                    <label className={LABEL_CLASS}>Animation event / semantic step id (optional — drives sync)</label>
                    <input
                      className={FIELD_CLASS}
                      value={step.animationEvent ?? ""}
                      onChange={e => updateStep(step.stepId, { animationEvent: e.target.value || undefined })}
                      placeholder="e.g. compare-mid"
                    />
                  </div>
                  <button onClick={() => removeStep(step.stepId)} className="text-[10.5px] font-bold text-red-400 hover:text-red-300 cursor-pointer">
                    Remove step
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={addStep} className="px-3.5 py-2 rounded-xl text-[11px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
            + Add Trace Step
          </button>
        </div>
      )}
    </div>
  )
}
