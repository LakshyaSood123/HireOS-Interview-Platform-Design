import type { CreatorCourse } from "../../types"
import type { CmsDsaZone, CmsDsaModule, CmsDsaCheckpoint, CmsDsaWorkspace } from "../dsaCmsTypes"
import type { CheckpointType } from "../../../learning/types"
import { updateCheckpoint } from "../dsaDraftMutations"
import { DsaTheoryBlocksEditor, DsaCodeExamplesEditor } from "./DsaTheoryEditor"
import DsaQuickCheckSubEditor from "./DsaQuickCheckSubEditor"
import DsaCodingActivitySubEditor from "./DsaCodingActivitySubEditor"
import DsaAnimationSourceEditor from "./DsaAnimationSourceEditor"
import DsaCodeTraceSourceEditor from "./DsaCodeTraceSourceEditor"
import DsaLayoutEditor from "./DsaLayoutEditor"
import { useState } from "react"
import type { PromptContext } from "../promptGenerator"

interface DsaCheckpointEditorProps {
  course: CreatorCourse
  zone: CmsDsaZone
  module: CmsDsaModule
  checkpoint: CmsDsaCheckpoint
  onChange: (course: CreatorCourse) => void
  onPreview: () => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"
const CHECKPOINT_TYPES: CheckpointType[] = ["lesson", "checkpoint", "challenge", "boss"]

export default function DsaCheckpointEditor({ course, zone, module, checkpoint, onChange, onPreview }: DsaCheckpointEditorProps) {
  const [editLayout, setEditLayout] = useState(false)
  const commit = (patch: Partial<CmsDsaCheckpoint>) => {
    onChange(updateCheckpoint(course, zone.id, module.id, checkpoint.id, { ...checkpoint, ...patch }))
  }
  const commitWorkspace = (patch: Partial<CmsDsaWorkspace>) => {
    const workspace: CmsDsaWorkspace = { ...(checkpoint.workspace ?? { title: checkpoint.title, theory: [] }), ...patch }
    commit({ workspace })
  }

  // Prerequisite choices: any other active checkpoint in the course that does not (directly or indirectly) already depend on this one,
  // so an author cannot create a cycle from the editor.
  const allCheckpoints = (course.dsaZones ?? []).flatMap(z => z.modules.flatMap(m => m.checkpoints))
  const prereqsOf = new Map(allCheckpoints.map(c => [c.id, c.prerequisites]))
  const dependsOnThis = (id: string, seen = new Set<string>()): boolean => {
    if (id === checkpoint.id) return true
    if (seen.has(id)) return false
    seen.add(id)
    return (prereqsOf.get(id) ?? []).some(p => dependsOnThis(p, seen))
  }
  const prerequisiteChoices = allCheckpoints.filter(c => c.id !== checkpoint.id && c.state === "active" && !checkpoint.prerequisites.includes(c.id) && !dependsOnThis(c.id))

  // Real, currently-authored context only — every field is omitted by
  // promptGenerator.ts when absent, never fabricated (PART 9).
  const promptContext: PromptContext = {
    courseTitle: course.title,
    zoneTitle: zone.title,
    moduleTitle: module.title,
    checkpointTitle: checkpoint.title,
    lessonTitle: checkpoint.workspace?.title,
    theory: checkpoint.workspace?.theory?.length ? checkpoint.workspace.theory : undefined,
    quickCheckQuestion: checkpoint.workspace?.quickCheck?.question,
    existingCodeExamples: checkpoint.workspace?.codeExamples?.length ? checkpoint.workspace.codeExamples : undefined,
    existingTraceSteps:
      checkpoint.workspace?.traceSource?.kind === "cms" && checkpoint.workspace.traceSource.steps?.length
        ? checkpoint.workspace.traceSource.steps.map((s) => ({ label: s.label || s.stepId, pseudocode: s.pseudocode }))
        : undefined,
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
      {/* Header / meta */}
      <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">Checkpoint</h2>
          <button onClick={onPreview} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
            Preview This Checkpoint →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Title</label>
            <input className={FIELD_CLASS} value={checkpoint.title} onChange={e => commit({ title: e.target.value })} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Subtitle</label>
            <input className={FIELD_CLASS} value={checkpoint.subtitle} onChange={e => commit({ subtitle: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className={LABEL_CLASS}>Type</label>
            <select className={FIELD_CLASS} value={checkpoint.type} onChange={e => commit({ type: e.target.value as CheckpointType })}>
              {CHECKPOINT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={LABEL_CLASS}>XP</label>
            <input type="number" min={0} className={FIELD_CLASS} value={checkpoint.xp} onChange={e => commit({ xp: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Mastery XP (module-terminal only)</label>
            <input
              type="number"
              min={0}
              className={FIELD_CLASS}
              value={checkpoint.masteryXp ?? ""}
              placeholder="—"
              onChange={e => commit({ masteryXp: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
          <div>
            <label className={LABEL_CLASS}>Status</label>
            <div className="px-3.5 py-2.5 text-sm text-gray-300">{checkpoint.state}</div>
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>
            Prerequisites <span className="text-gray-600 normal-case font-normal">(checkpoints a learner must complete first)</span>
          </label>
          {checkpoint.prerequisites.length === 0 ? (
            <p className="text-xs text-gray-500 mb-2">None — this is an entry point.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {checkpoint.prerequisites.map(id => (
                <span key={id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-gray-300">
                  {id}
                  <button
                    type="button"
                    aria-label={`Remove prerequisite ${id}`}
                    onClick={() => commit({ prerequisites: checkpoint.prerequisites.filter(p => p !== id) })}
                    className="text-gray-500 hover:text-red-300 cursor-pointer"
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          {prerequisiteChoices.length > 0 && (
            <select
              aria-label="Add prerequisite"
              value=""
              onChange={e => e.target.value && commit({ prerequisites: [...checkpoint.prerequisites, e.target.value] })}
              className={FIELD_CLASS}
            >
              <option value="">Add a prerequisite…</option>
              {prerequisiteChoices.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0b1d16]">
                  {c.title} ({c.id})
                </option>
              ))}
            </select>
          )}
        </div>

        <p className="text-[10.5px] text-gray-500 font-mono">id: {checkpoint.id} • moduleId: {checkpoint.moduleId} • order: {checkpoint.order}</p>
      </div>

      {checkpoint.lesson && !checkpoint.workspace && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-5 text-xs text-amber-200 leading-relaxed">
          This checkpoint still uses the legacy TrailNode-derived lesson model (<code className="font-mono">checkpoint.lesson</code>) rather than
          the newer Lesson Workspace model. Editing legacy lesson content is out of scope for this phase — none of the 107 checkpoints
          currently use this path (see the DSA CMS schema audit), so this is a compatibility placeholder, not a gap in today's editor.
        </div>
      )}

      {checkpoint.workspace && (
        <>
          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">Lesson Content</h3>
            {checkpoint.workspace.theory.length === 0 && !checkpoint.workspace.quickCheck && !checkpoint.workspace.codingActivity && !checkpoint.workspace.animation && (
              <p className="text-xs text-gray-400 bg-black/20 border border-dashed border-white/15 rounded-xl px-4 py-3">
                No lesson content yet. Add what this lesson needs: a theory block, a Quick Check, a coding activity, a study animation or a code trace below. A lesson does not need every block.
              </p>
            )}
            <div>
              <label className={LABEL_CLASS}>Workspace Title (heading shown in Lesson Workspace)</label>
              <input className={FIELD_CLASS} value={checkpoint.workspace.title} onChange={e => commitWorkspace({ title: e.target.value })} />
            </div>
            <DsaTheoryBlocksEditor blocks={checkpoint.workspace.theory} onChange={theory => commitWorkspace({ theory })} />
            <div>
              <label className={LABEL_CLASS}>Learn More (optional expandable detail)</label>
              <textarea
                className={`${FIELD_CLASS} resize-none`}
                rows={3}
                value={checkpoint.workspace.learnMore ?? ""}
                onChange={e => commitWorkspace({ learnMore: e.target.value || undefined })}
              />
            </div>
            <DsaCodeExamplesEditor codeExamples={checkpoint.workspace.codeExamples} onChange={codeExamples => commitWorkspace({ codeExamples })} />
          </div>

          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-4">Quick Check</h3>
            <DsaQuickCheckSubEditor quickCheck={checkpoint.workspace.quickCheck} onChange={quickCheck => commitWorkspace({ quickCheck })} />
          </div>

          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-4">Coding Activity</h3>
            <DsaCodingActivitySubEditor coding={checkpoint.workspace.codingActivity} onChange={codingActivity => commitWorkspace({ codingActivity })} />
          </div>

          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-4">Study Animation</h3>
            <DsaAnimationSourceEditor animation={checkpoint.workspace.animation} onChange={animation => commitWorkspace({ animation })} promptContext={promptContext} />
          </div>

          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-4">Code Trace</h3>
            <DsaCodeTraceSourceEditor
              traceSource={checkpoint.workspace.traceSource}
              animation={checkpoint.workspace.animation}
              onChange={traceSource => commitWorkspace({ traceSource })}
              promptContext={promptContext}
            />
          </div>

          <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">Preview Draft Layout</h3>
              <button
                onClick={() => setEditLayout(v => !v)}
                className={`px-3.5 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all ${
                  editLayout ? "bg-[#1DB584] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                }`}
              >
                {editLayout ? "Editing Layout" : "Edit Layout"}
              </button>
            </div>
            {editLayout ? (
              <DsaLayoutEditor layout={checkpoint.layout} onChange={layout => commit({ layout })} />
            ) : (
              <p className="text-[10.5px] text-gray-500">{checkpoint.layout ? "Custom layout configured." : "Default layout (unchanged)."} Click "Edit Layout" to modify.</p>
            )}
          </div>
        </>
      )}

      {!checkpoint.lesson && !checkpoint.workspace && (
        <div className="rounded-2xl bg-[#0F2A20] border border-dashed border-white/15 p-8 text-center">
          <p className="text-sm text-gray-400 mb-4">This checkpoint has no lesson content yet.</p>
          <button
            onClick={() => commit({ workspace: { title: checkpoint.title, theory: [] } })}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer transition-all"
          >
            + Add Lesson Workspace Content
          </button>
        </div>
      )}
    </div>
  )
}
