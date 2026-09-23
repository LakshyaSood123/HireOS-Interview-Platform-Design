import { useState } from "react"
import type { CreatorCourse } from "../../types"
import type { CmsDsaZone, CmsDsaModule } from "../dsaCmsTypes"
import { addCheckpoint, moveCheckpoint, setCheckpointState, updateModule } from "../dsaDraftMutations"

interface DsaModuleEditorProps {
  course: CreatorCourse
  zone: CmsDsaZone
  module: CmsDsaModule
  onChange: (course: CreatorCourse) => void
  onOpenCheckpoint: (checkpointId: string) => void
  onPreviewModule: () => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

const TYPE_BADGE: Record<string, string> = {
  lesson: "bg-[#1DB584]/15 text-[#4FD8A8] border-[#1DB584]/30",
  checkpoint: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  challenge: "bg-[#A855F7]/15 text-[#C4A0F5] border-[#A855F7]/30",
  boss: "bg-red-500/15 text-red-300 border-red-500/30",
}

export default function DsaModuleEditor({ course, zone, module, onChange, onOpenCheckpoint, onPreviewModule }: DsaModuleEditorProps) {
  const [newCheckpointTitle, setNewCheckpointTitle] = useState("")

  const handleAddCheckpoint = () => {
    const title = newCheckpointTitle.trim()
    if (!title) return
    onChange(addCheckpoint(course, zone.id, module.id, title))
    setNewCheckpointTitle("")
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6 mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className={LABEL_CLASS}>Module Title</label>
            <input className={FIELD_CLASS} value={module.title} onChange={e => onChange(updateModule(course, zone.id, module.id, { title: e.target.value }))} />
          </div>
          <div>
            <label className={LABEL_CLASS}>Icon</label>
            <input className={FIELD_CLASS} value={module.icon} onChange={e => onChange(updateModule(course, zone.id, module.id, { icon: e.target.value }))} />
          </div>
        </div>
        <div className="mb-4">
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            className={`${FIELD_CLASS} resize-none`}
            rows={2}
            value={module.description}
            onChange={e => onChange(updateModule(course, zone.id, module.id, { description: e.target.value }))}
          />
        </div>
        <p className="text-[10.5px] text-gray-500 font-mono">id: {module.id} • zoneId: {module.zoneId} • order: {module.order} • status: {module.state} • contentKind: {module.contentKind ?? "—"}</p>
      </div>

      <div className="mb-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-1">Checkpoints</h2>
          <p className="text-[11px] text-gray-500">{module.checkpoints.length} checkpoint{module.checkpoints.length === 1 ? "" : "s"}, in learner order.</p>
        </div>
        <button onClick={onPreviewModule} className="px-4 py-2 rounded-xl text-xs font-bold text-gray-200 bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all">
          Preview Module Roadmap →
        </button>
      </div>

      <div className="space-y-2">
        {module.checkpoints.map((checkpoint, index) => {
          const archived = checkpoint.state === "archived"
          const kind = checkpoint.workspace ? (checkpoint.workspace.codingActivity ? "Coding" : checkpoint.workspace.quickCheck ? "Quick Check" : "Lesson") : "Legacy Lesson"
          return (
            <div
              key={checkpoint.id}
              className={`rounded-xl bg-[#0F2A20] border p-3.5 flex items-center justify-between gap-4 flex-wrap ${archived ? "border-white/5 opacity-50" : "border-white/10"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm shrink-0">☰</span>
                <span className="text-[10px] font-black text-gray-500 shrink-0 w-5">{index + 1}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-white truncate">{checkpoint.title}</span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase border shrink-0 ${TYPE_BADGE[checkpoint.type] ?? "bg-white/5 text-gray-400 border-white/10"}`}>{checkpoint.type}</span>
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-white/5 text-gray-400 border border-white/10 shrink-0">{kind}</span>
                    {checkpoint.workspace?.animation && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-[#38BDF8]/10 text-[#7DD3FC] border border-[#38BDF8]/25 shrink-0">🎬 {checkpoint.workspace.animation.id}</span>
                    )}
                    {archived && <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-500/15 text-gray-400 border border-gray-500/25 shrink-0">Archived</span>}
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono">id: {checkpoint.id} • xp: {checkpoint.xp}{checkpoint.masteryXp ? ` +${checkpoint.masteryXp} mastery` : ""}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onChange(moveCheckpoint(course, zone.id, module.id, checkpoint.id, -1))} disabled={index === 0} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-[10px]" title="Move up">▲</button>
                <button onClick={() => onChange(moveCheckpoint(course, zone.id, module.id, checkpoint.id, 1))} disabled={index === module.checkpoints.length - 1} className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-[10px]" title="Move down">▼</button>
                <button
                  onClick={() => onChange(setCheckpointState(course, zone.id, module.id, checkpoint.id, archived ? "active" : "archived"))}
                  className="px-2.5 py-1 rounded-lg text-[10.5px] font-bold text-gray-300 hover:bg-white/10 border border-white/10 cursor-pointer"
                >
                  {archived ? "Unarchive" : "Archive"}
                </button>
                <button onClick={() => onOpenCheckpoint(checkpoint.id)} className="px-3.5 py-1 rounded-lg text-[10.5px] font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer">
                  Edit →
                </button>
              </div>
            </div>
          )
        })}
        {module.checkpoints.length === 0 && <p className="text-xs text-gray-500 py-6 text-center">No checkpoints in this module yet.</p>}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <input
          value={newCheckpointTitle}
          onChange={e => setNewCheckpointTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddCheckpoint()}
          placeholder="New checkpoint title…"
          className={FIELD_CLASS}
        />
        <button
          onClick={handleAddCheckpoint}
          disabled={!newCheckpointTitle.trim()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
        >
          + Add Checkpoint
        </button>
      </div>
    </div>
  )
}
