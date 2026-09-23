import { useState } from "react"
import type { CreatorCourse } from "../../types"
import { addZone, moveZone, setZoneState } from "../dsaDraftMutations"

interface DsaZoneListProps {
  course: CreatorCourse
  onChange: (course: CreatorCourse) => void
  onOpenZone: (zoneId: string) => void
}

export default function DsaZoneList({ course, onChange, onOpenZone }: DsaZoneListProps) {
  const [newZoneTitle, setNewZoneTitle] = useState("")
  const zones = course.dsaZones ?? []

  const handleAddZone = () => {
    const title = newZoneTitle.trim()
    if (!title) return
    onChange(addZone(course, title))
    setNewZoneTitle("")
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65] mb-1">Zones</h2>
        <p className="text-[11px] text-gray-500">The top level of the DSA curriculum tree — each zone groups a set of modules.</p>
      </div>

      <div className="space-y-3">
        {zones.map((zone, index) => {
          const checkpointCount = zone.modules.reduce((sum, m) => sum + m.checkpoints.length, 0)
          const archived = zone.state === "archived"
          return (
            <div
              key={zone.id}
              className={`rounded-2xl bg-[#0F2A20] border p-5 flex items-center justify-between gap-4 flex-wrap transition-all ${
                archived ? "border-white/5 opacity-50" : "border-white/10"
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-bold text-white truncate">{zone.title}</span>
                  {archived && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-gray-500/15 text-gray-400 border border-gray-500/25">
                      Archived
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-500 font-mono">id: {zone.id} • order: {zone.order}</p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {zone.modules.length} module{zone.modules.length === 1 ? "" : "s"} • {checkpointCount} checkpoint{checkpointCount === 1 ? "" : "s"}
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => onChange(moveZone(course, zone.id, -1))} disabled={index === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-xs" title="Move up">▲</button>
                <button onClick={() => onChange(moveZone(course, zone.id, 1))} disabled={index === zones.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer text-xs" title="Move down">▼</button>
                <button
                  onClick={() => onChange(setZoneState(course, zone.id, archived ? "active" : "archived"))}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-gray-300 hover:bg-white/10 border border-white/10 cursor-pointer"
                >
                  {archived ? "Unarchive" : "Archive"}
                </button>
                <button
                  onClick={() => onOpenZone(zone.id)}
                  className="px-4 py-1.5 rounded-lg text-[11px] font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer"
                >
                  Open →
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-6 flex items-center gap-2">
        <input
          value={newZoneTitle}
          onChange={e => setNewZoneTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAddZone()}
          placeholder="New zone title…"
          className="flex-1 rounded-xl bg-black/25 border border-white/10 focus:border-[#1DB584]/60 px-3.5 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-colors"
        />
        <button
          onClick={handleAddZone}
          disabled={!newZoneTitle.trim()}
          className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all shrink-0"
        >
          + Add Zone
        </button>
      </div>
    </div>
  )
}
