// Package Trace for a package-backed animation in a normal lesson. Shows the
// trace.json steps as rows, highlights the step matching the animation's
// current event, and sends a GOTO_STEP when a row is clicked. Only the
// language tabs that actually have code are shown (see learning/packageTrace.ts).

import type { CmsPackageTraceStep } from "../../creator/dsa/animationPackageClient"
import type { TraceLanguage } from "../../learning/packageTrace"

interface PackageTracePanelProps {
  steps: CmsPackageTraceStep[]
  languages: TraceLanguage[]
  selectedLanguage: TraceLanguage
  languageLabel: Record<TraceLanguage, string>
  onSelectLanguage: (language: TraceLanguage) => void
  /** The animation event id currently reported by the package (STEP_CHANGED). */
  activeEventId: string | null
  /** Code for a step in the selected language, or null when that step has none. */
  codeFor: (step: CmsPackageTraceStep) => string | null
  onSelectStep: (eventId: string) => void
}

export default function PackageTracePanel({
  steps,
  languages,
  selectedLanguage,
  languageLabel,
  onSelectLanguage,
  activeEventId,
  codeFor,
  onSelectStep,
}: PackageTracePanelProps) {
  const activeStep = steps.find(step => step.animationEvent === activeEventId) ?? steps[0]
  const activeCode = activeStep ? codeFor(activeStep) : null

  return (
    <div className="rounded-xl bg-[#082017] border border-white/10 p-4 space-y-3 min-w-0">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-[10.5px] font-black uppercase tracking-wider text-gray-400">Code Trace</p>
        <div className="flex gap-1.5 flex-wrap" role="tablist">
          {languages.map(language => (
            <button
              key={language}
              role="tab"
              aria-selected={language === selectedLanguage}
              onClick={() => onSelectLanguage(language)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold border cursor-pointer transition-all ${
                language === selectedLanguage
                  ? "bg-[#1DB584]/20 border-[#1DB584]/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
              }`}
            >
              {languageLabel[language]}
            </button>
          ))}
        </div>
      </div>

      <ol className="space-y-1">
        {steps.map(step => {
          const isActive = Boolean(step.animationEvent) && step.animationEvent === activeEventId
          const clickable = Boolean(step.animationEvent)
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!clickable}
                data-trace-step={step.id}
                data-animation-event={step.animationEvent ?? ""}
                onClick={() => step.animationEvent && onSelectStep(step.animationEvent)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold border transition-all ${
                  isActive
                    ? "bg-[#1DB584]/20 border-[#1DB584]/60 text-white"
                    : "bg-white/[0.03] border-white/10 text-gray-300 enabled:hover:bg-white/10"
                } disabled:cursor-default cursor-pointer`}
              >
                {step.label || step.id}
              </button>
            </li>
          )
        })}
      </ol>

      {activeStep && (
        <div className="rounded-lg bg-black/30 border border-white/10 p-3 min-h-[3rem]">
          {activeCode !== null ? (
            <pre className="text-[11.5px] text-gray-200 font-mono whitespace-pre-wrap">{activeCode}</pre>
          ) : (
            <p className="text-xs text-gray-400">No {languageLabel[selectedLanguage]} code for this step.</p>
          )}
        </div>
      )}
    </div>
  )
}
