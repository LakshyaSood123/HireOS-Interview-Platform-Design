// Code Trace source selector + CMS Structured Trace step editor. Registered
// animations keep defaulting to their existing Code Trace registry entry
// (no `traceSource` field at all, or `{ kind: "registered" }`) — this only
// adds the three new options.

import { useEffect, useState } from "react"
import { useAuth } from "../../../auth/AuthContext"
import type { CmsDsaTraceSource, CmsDsaTraceStep, CmsDsaAnimationSource } from "../dsaCmsTypes"
import { getAnimationPackageRevision, type CmsAnimationPackage } from "../animationPackageClient"
import { summarizePackageTrace, packageTraceStepToCmsDsaTraceStep } from "../packageTraceUtils"
import type { PromptContext } from "../promptGenerator"
import PromptGeneratorModal from "./PromptGeneratorModal"
import PackageRequirementsModal from "./PackageRequirementsModal"

interface DsaCodeTraceSourceEditorProps {
  traceSource: CmsDsaTraceSource | undefined
  animation: CmsDsaAnimationSource | undefined
  onChange: (traceSource: CmsDsaTraceSource | undefined) => void
  promptContext: PromptContext
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-xs text-white placeholder-gray-500 outline-none transition-colors font-mono"
const LABEL_CLASS = "text-[10.5px] font-bold uppercase tracking-wider text-gray-400 block mb-1"

function newStep(): CmsDsaTraceStep {
  return { stepId: `step-${Math.random().toString(36).slice(2, 8)}`, label: "", pseudocode: "" }
}

export default function DsaCodeTraceSourceEditor({ traceSource, animation, onChange, promptContext }: DsaCodeTraceSourceEditorProps) {
  const { client } = useAuth()
  const kind = traceSource?.kind ?? "registered"
  const steps = traceSource?.steps ?? []
  const [expandedStep, setExpandedStep] = useState<string | null>(null)
  const [showTracePrompt, setShowTracePrompt] = useState(false)
  const [showTraceRequirements, setShowTraceRequirements] = useState(false)

  const isCustomAnimationForPkg = animation?.kind === "custom" ? animation : null
  const [pkg, setPkg] = useState<CmsAnimationPackage | null>(null)
  const [pkgLoadError, setPkgLoadError] = useState<string | null>(null)
  const [previewTrace, setPreviewTrace] = useState(false)
  const [importConfirm, setImportConfirm] = useState(false)

  useEffect(() => {
    setPkg(null)
    setPkgLoadError(null)
    if (!isCustomAnimationForPkg) return
    let cancelled = false
    getAnimationPackageRevision(client, isCustomAnimationForPkg.packageId, isCustomAnimationForPkg.revisionId)
      .then(loaded => !cancelled && setPkg(loaded))
      .catch(err => !cancelled && setPkgLoadError(err instanceof Error ? err.message : "Failed to load animation package."))
    return () => {
      cancelled = true
    }
  }, [client, isCustomAnimationForPkg?.packageId, isCustomAnimationForPkg?.revisionId])

  function performImport() {
    if (!pkg?.packageTrace) return
    const imported = pkg.packageTrace.steps.map(packageTraceStepToCmsDsaTraceStep)
    onChange({ kind: "cms", steps: imported })
    setImportConfirm(false)
  }

  function handleImportClick() {
    if (steps.length > 0) setImportConfirm(true)
    else performImport()
  }

  function setKind(next: CmsDsaTraceSource["kind"]) {
    if (next === "registered") onChange(undefined)
    // `steps` is kept regardless of which kind is currently active — not
    // just when switching TO "cms" — so a manually-authored CMS Structured
    // trace survives detours through Package Trace / None and back, rather
    // than being silently discarded the moment the author switches away.
    else onChange({ kind: next, steps: traceSource?.steps ?? [] })
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
        <div className="space-y-3">
          {!isCustomAnimationForPkg && <p className="text-[10.5px] text-gray-500">Pick a Custom HTML Animation in the Study Animation section above first.</p>}
          {isCustomAnimationForPkg && pkgLoadError && <p className="text-[11px] text-red-400">{pkgLoadError}</p>}
          {isCustomAnimationForPkg && !pkg && !pkgLoadError && <p className="text-[10.5px] text-gray-500">Loading package…</p>}

          {isCustomAnimationForPkg && pkg && !pkg.packageTrace && (
            <div className="rounded-xl border border-dashed border-white/15 p-4 space-y-2.5">
              <p className="text-xs font-bold text-gray-300">No package trace found.</p>
              <p className="text-[10.5px] text-gray-500">This animation package doesn't include a trace.json. Upload a ZIP containing one, or use one of the options below.</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setShowTracePrompt(true)} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-[#7DD3FC] bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/25 cursor-pointer transition-all">
                  ✨ Generate AI Trace Package Prompt
                </button>
                <button onClick={() => setShowTraceRequirements(true)} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                  View Trace Requirements
                </button>
                <button onClick={() => setKind("cms")} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                  Switch to CMS Structured
                </button>
              </div>
            </div>
          )}

          {isCustomAnimationForPkg && pkg?.packageTrace && (
            <PackageTraceSummaryPanel
              pkg={pkg}
              previewTrace={previewTrace}
              onTogglePreview={() => setPreviewTrace(v => !v)}
              onImportClick={handleImportClick}
              onGeneratePrompt={() => setShowTracePrompt(true)}
              onViewRequirements={() => setShowTraceRequirements(true)}
            />
          )}
        </div>
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

      {importConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setImportConfirm(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-[#0F2A20] border border-white/10 p-5 space-y-4" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-bold text-white">Overwrite existing CMS Structured trace?</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              This checkpoint already has {steps.length} manually-authored CMS Structured step{steps.length === 1 ? "" : "s"}. Importing the package trace will replace{" "}
              them. The imported copy becomes independent — later edits to the package trace won't silently overwrite it again unless you re-import.
            </p>
            <div className="flex gap-2.5">
              <button onClick={performImport} className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer transition-all">
                Overwrite & Import
              </button>
              <button onClick={() => setImportConfirm(false)} className="flex-1 px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTracePrompt && (
        <PromptGeneratorModal
          initialMode="trace"
          availableModes={["trace"]}
          context={{ ...promptContext, declaredTraceEvents: pkg?.manifest.traceEvents }}
          defaultBridgeMode="synchronized"
          onClose={() => setShowTracePrompt(false)}
        />
      )}
      {showTraceRequirements && <PackageRequirementsModal focus="trace" onClose={() => setShowTraceRequirements(false)} />}
    </div>
  )
}

interface PackageTraceSummaryPanelProps {
  pkg: CmsAnimationPackage
  previewTrace: boolean
  onTogglePreview: () => void
  onImportClick: () => void
  onGeneratePrompt: () => void
  onViewRequirements: () => void
}

function PackageTraceSummaryPanel({ pkg, previewTrace, onTogglePreview, onImportClick, onGeneratePrompt, onViewRequirements }: PackageTraceSummaryPanelProps) {
  if (!pkg.packageTrace) return null
  const summary = summarizePackageTrace(pkg.packageTrace, pkg.manifest.traceEvents)
  const errors = summary.issues.filter(i => i.severity === "error")
  const warnings = summary.issues.filter(i => i.severity === "warning")

  return (
    <div className="rounded-xl border border-[#1DB584]/30 bg-[#1DB584]/5 p-4 space-y-3">
      <p className="text-xs font-bold text-[#4FD8A8]">PACKAGE TRACE FOUND ✓</p>
      <p className="text-[10.5px] text-gray-300">
        {summary.stepCount} trace step{summary.stepCount === 1 ? "" : "s"}
      </p>
      <div className="flex flex-wrap gap-2 text-[10.5px] text-gray-300">
        <span>{summary.languages.pseudocode ? "✓" : "✗"} Pseudocode</span>
        <span>{summary.languages.python ? "✓" : "○"} Python</span>
        <span>{summary.languages.cpp ? "✓" : "○"} C++</span>
        <span>{summary.languages.java ? "✓" : "○"} Java</span>
      </div>
      {summary.eventsDeclaredByManifest > 0 && (
        <p className="text-[10.5px] text-gray-300">
          Animation synchronization: {summary.eventsMatched}/{summary.eventsTotal} events matched
        </p>
      )}
      <p className="text-[10.5px] text-gray-500 font-mono">
        Source: trace.json · Package revision: {pkg.revisionId === "draft" ? "editable draft" : pkg.revisionId}
      </p>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((issue, i) => (
            <p key={i} className="text-[10.5px] text-red-400">
              ERROR: {issue.message}
            </p>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((issue, i) => (
            <p key={i} className="text-[10.5px] text-amber-300">
              ⚠ {issue.message}
            </p>
          ))}
        </div>
      )}

      {previewTrace && (
        <div className="space-y-2 pt-2 border-t border-white/10">
          {pkg.packageTrace.steps.map(step => (
            <div key={step.id} className="rounded-lg bg-black/25 p-2.5">
              <p className="text-[11px] font-bold text-white">{step.label}</p>
              <pre className="text-[10.5px] text-gray-400 font-mono whitespace-pre-wrap mt-1">{step.code.pseudocode}</pre>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        <button onClick={onTogglePreview} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
          {previewTrace ? "Hide Preview" : "Preview Trace"}
        </button>
        <button onClick={onImportClick} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer transition-all">
          Import into CMS Structured & Edit
        </button>
        <button onClick={onGeneratePrompt} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-[#7DD3FC] bg-[#38BDF8]/10 hover:bg-[#38BDF8]/20 border border-[#38BDF8]/25 cursor-pointer transition-all">
          ✨ Generate AI Trace Prompt
        </button>
        <button onClick={onViewRequirements} className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
          View Trace Requirements
        </button>
      </div>
    </div>
  )
}
