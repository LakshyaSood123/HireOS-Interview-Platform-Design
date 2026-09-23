import type { DsaValidationIssue } from "../dsaDraftValidation"

interface DsaValidationPanelProps {
  issues: DsaValidationIssue[]
  onJumpTo: (zoneId?: string, moduleId?: string, checkpointId?: string) => void
}

export default function DsaValidationPanel({ issues, onJumpTo }: DsaValidationPanelProps) {
  const errors = issues.filter(i => i.severity === "error")
  const warnings = issues.filter(i => i.severity === "warning")

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-1">Draft Validation</h2>
        <p className="text-[11px] text-gray-500">Read-only checks against the current draft. Nothing here publishes or mutates anything.</p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-2xl bg-[#1DB584]/10 border border-[#1DB584]/30 p-8 text-center">
          <p className="text-2xl mb-2">✓</p>
          <p className="text-sm font-bold text-[#4FD8A8]">Draft passes all validation checks.</p>
          <p className="text-xs text-gray-400 mt-1">No duplicate ids, no broken references, no invalid animation/quick-check/coding structure.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {errors.length > 0 && (
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-red-400 mb-2.5">Errors ({errors.length})</h3>
              <div className="space-y-2">
                {errors.map((issue, i) => (
                  <IssueRow key={i} issue={issue} onJumpTo={onJumpTo} tone="error" />
                ))}
              </div>
            </section>
          )}
          {warnings.length > 0 && (
            <section>
              <h3 className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2.5">Warnings ({warnings.length})</h3>
              <div className="space-y-2">
                {warnings.map((issue, i) => (
                  <IssueRow key={i} issue={issue} onJumpTo={onJumpTo} tone="warning" />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}

function IssueRow({ issue, onJumpTo, tone }: { issue: DsaValidationIssue; onJumpTo: DsaValidationPanelProps["onJumpTo"]; tone: "error" | "warning" }) {
  const canJump = Boolean(issue.zoneId)
  return (
    <div
      className={`rounded-xl border p-3.5 flex items-start justify-between gap-4 ${
        tone === "error" ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"
      }`}
    >
      <p className={`text-xs leading-relaxed ${tone === "error" ? "text-red-200" : "text-amber-200"}`}>{issue.message}</p>
      {canJump && (
        <button
          onClick={() => onJumpTo(issue.zoneId, issue.moduleId, issue.checkpointId)}
          className="px-3 py-1.5 rounded-lg text-[10.5px] font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer shrink-0"
        >
          Jump to item →
        </button>
      )}
    </div>
  )
}
