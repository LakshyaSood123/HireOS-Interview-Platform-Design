import { useState } from "react"
import type { CreatorCourse } from "../../types"
import type { CmsDsaZone } from "../dsaCmsTypes"
import { addModule, moveModule, setModuleState, updateZone } from "../dsaDraftMutations"

interface DsaZoneEditorProps {
  course: CreatorCourse
  zone: CmsDsaZone
  onChange: (course: CreatorCourse) => void
  onOpenModule: (moduleId: string) => void
}

const FIELD_CLASS =
  "w-full rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
const LABEL_CLASS = "text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5"

export default function DsaZoneEditor({ course, zone, onChange, onOpenModule }: DsaZoneEditorProps) {
  const [newModuleTitle, setNewModuleTitle] = useState("")

  const handleAddModule = () => {
    const title = newModuleTitle.trim()
    if (!title) return
    onChange(addModule(course, zone.id, title))
    setNewModuleTitle("")
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="rounded-2xl bg-[#0F2A20] border border-white/10 p-6 mb-8 space-y-4">
        <div>
          <label className={LABEL_CLASS}>Zone Title</label>
          <input className={FIELD_CLASS} value={zone.title} onChange={e => onChange(updateZone(course, zone.id, { title: e.target.value }))} />
        </div>
        <div>
          <label className={LABEL_CLASS}>Description</label>
          <textarea
            className={`${FIELD_CLASS} resize-none`}
            rows={2}
            value={zone.description}
            onChange={e => onChange(updateZone(course, zone.id, { description: e.target.value }))}
          />
        </div>
        <p className="text-[10.5px] text-gray-500 font-mono">id: {zone.id} • order: {zone.order} • status: {zone.state}</p>
      </div>

      <div className="mb-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-1">Modules</h2>
        <p className="text-[11px] text-gray-500">Modules in this zone, in learner order.</p>
      </div>

      <div className="space-y-2.5">
        {zone.modules.map((module, index) => {
          const archived = module.state === "archived"
          return (
            <div
              key={module.id}
              className={`rounded-xl bg-[#0F2A20] border p-4 flex items-center justify-between gap-4 flex-wrap ${archived ? "border-white/5 opacity-50" : "border-white/10"}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg shrink-0">☰</span>
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: `${module.accentColor}22`, border: `1px solid ${module.accentColor}55` }}
                >
                  {module.icon}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{module.title}</span>
                    {archived && <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-gray-500/15 text-gray-400 border border-gray-500/25">Archived</span>}
                  </div>
                  <p className="text-[10.5px] text-gray-500 font-mono">id: {module.id} • {module.checkpoints.length} checkpoint{module.checkpoints.length === 1 ? "" : "s"}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onChange(moveModule(course, zone.id, module.id, -1))} disabled={index === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-xs" title="Move up">▲</button>
                <button onClick={() => onChange(moveModule(course, zone.id, module.id, 1))} disabled={index === zone.modules.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-xs" title="Move down">▼</button>
                <button
                  onClick={() => onChange(setModuleState(course, zone.id, module.id, archived ? "active" : "archived"))}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-300 hover:bg-white/10 border border-white/10 cursor-pointer"
                >
                  {archived ? "Unarchive" : "Archive"}
                </button>
                <button onClick={() => onOpenModule(module.id)} className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer">
                  Open →
                </button>
              </div>
            </div>
          )
        })}
        {zone.modules.length === 0 && <p className="text-xs text-gray-500 py-6 text-center">No modules in this zone yet.</p>}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <input
          value={newModuleTitle}
          onChange={e => setNewModuleTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddModule()}
          placeholder="New module title…"
          className={FIELD_CLASS}
        />
        <button
          onClick={handleAddModule}
          disabled={!newModuleTitle.trim()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
        >
          + Add Module
        </button>
      </div>
    </div>
  )
}
