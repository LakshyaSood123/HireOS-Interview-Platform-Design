import { useState, useMemo } from "react"
import type { CreatorCourse, CreatorModule, CreatorActivity } from "../types"
import { newCmsId } from "../types"
import ActivityEditor from "./ActivityEditor"

interface CurriculumBuilderProps {
  course: CreatorCourse
  onChange: (course: CreatorCourse) => void
}

const ACTIVITY_ICON: Record<CreatorActivity["type"], string> = {
  lesson: "📖",
  "quick-check": "❓",
  coding: "💻",
}
const ACTIVITY_LABEL: Record<CreatorActivity["type"], string> = {
  lesson: "Lesson",
  "quick-check": "Quick Check",
  coding: "Coding Exercise",
}

function reindex<T extends { order: number }>(items: T[]): T[] {
  return items.map((item, i) => ({ ...item, order: i }))
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction
  if (target < 0 || target >= items.length) return items
  const copy = items.slice()
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

function newLesson(order: number): CreatorActivity {
  return { id: newCmsId("activity"), type: "lesson", order, title: "New Lesson", blocks: [] }
}
function newQuickCheck(order: number): CreatorActivity {
  return { id: newCmsId("activity"), type: "quick-check", order, title: "New Quick Check", question: "", options: ["", ""], correctIndex: 0 }
}
function newCoding(order: number): CreatorActivity {
  return {
    id: newCmsId("activity"),
    type: "coding",
    order,
    title: "New Coding Exercise",
    problemStatement: "",
    functionName: "",
    languages: ["python"],
    starterCode: {},
    visibleTests: [],
  }
}

export default function CurriculumBuilder({ course, onChange }: CurriculumBuilderProps) {
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    course.modules[0]?.activities[0]?.id ?? null,
  )
  const [addMenuModuleId, setAddMenuModuleId] = useState<string | null>(null)

  const selected = useMemo(() => {
    for (const m of course.modules) {
      const a = m.activities.find(x => x.id === selectedActivityId)
      if (a) return { module: m, activity: a }
    }
    return null
  }, [course, selectedActivityId])

  const updateModules = (modules: CreatorModule[]) => onChange({ ...course, modules })

  const addModule = () => {
    const mod: CreatorModule = { id: newCmsId("module"), title: "New Module", order: course.modules.length, activities: [] }
    updateModules([...course.modules, mod])
  }

  const renameModule = (moduleId: string, title: string) => {
    updateModules(course.modules.map(m => (m.id === moduleId ? { ...m, title } : m)))
  }

  const deleteModule = (moduleId: string) => {
    if (!window.confirm("Delete this module and all its activities?")) return
    updateModules(reindex(course.modules.filter(m => m.id !== moduleId)))
  }

  const moveModule = (index: number, dir: -1 | 1) => {
    updateModules(reindex(moveItem(course.modules, index, dir)))
  }

  const addActivity = (moduleId: string, activity: CreatorActivity) => {
    updateModules(
      course.modules.map(m => (m.id === moduleId ? { ...m, activities: [...m.activities, activity] } : m)),
    )
    setSelectedActivityId(activity.id)
    setAddMenuModuleId(null)
  }

  const deleteActivity = (moduleId: string, activityId: string) => {
    if (!window.confirm("Delete this activity?")) return
    updateModules(
      course.modules.map(m =>
        m.id === moduleId ? { ...m, activities: reindex(m.activities.filter(a => a.id !== activityId)) } : m,
      ),
    )
    if (selectedActivityId === activityId) setSelectedActivityId(null)
  }

  const moveActivity = (moduleId: string, index: number, dir: -1 | 1) => {
    updateModules(
      course.modules.map(m => (m.id === moduleId ? { ...m, activities: reindex(moveItem(m.activities, index, dir)) } : m)),
    )
  }

  const updateActivity = (moduleId: string, updated: CreatorActivity) => {
    updateModules(
      course.modules.map(m =>
        m.id === moduleId ? { ...m, activities: m.activities.map(a => (a.id === updated.id ? updated : a)) } : m,
      ),
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] h-[calc(100vh-108px)] min-h-0">
      {/* LEFT: curriculum tree */}
      <div className="border-r border-white/10 bg-[#0A1F17] overflow-y-auto p-4 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#A7CE65]">{course.title || "Untitled Course"}</h2>
        </div>

        {course.modules.length === 0 && (
          <p className="text-[11px] text-gray-500 py-4 text-center">No modules yet. Add your first module below.</p>
        )}

        {course.modules.map((mod, mIdx) => (
          <div key={mod.id} className="rounded-xl bg-[#0F2A20] border border-white/10 overflow-hidden">
            <div className="px-3 py-2.5 flex items-center gap-2 border-b border-white/5 bg-black/15">
              <span className="text-[10px] font-black text-gray-500 shrink-0">M{mIdx + 1}</span>
              <input
                value={mod.title}
                onChange={e => renameModule(mod.id, e.target.value)}
                className="flex-1 min-w-0 bg-transparent text-xs font-bold text-white outline-none"
              />
              <div className="flex items-center gap-0.5 shrink-0">
                <button onClick={() => moveModule(mIdx, -1)} disabled={mIdx === 0} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer text-[10px]" title="Move up">▲</button>
                <button onClick={() => moveModule(mIdx, 1)} disabled={mIdx === course.modules.length - 1} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer text-[10px]" title="Move down">▼</button>
                <button onClick={() => deleteModule(mod.id)} className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-red-400 cursor-pointer text-[10px]" title="Delete module">✕</button>
              </div>
            </div>

            <div className="p-1.5 space-y-1">
              {mod.activities.map((act, aIdx) => (
                <div
                  key={act.id}
                  className={`group flex items-center gap-1.5 rounded-lg px-2 py-1.5 cursor-pointer transition-colors ${
                    selectedActivityId === act.id ? "bg-[#1DB584]/15 border border-[#1DB584]/40" : "hover:bg-white/5 border border-transparent"
                  }`}
                  onClick={() => setSelectedActivityId(act.id)}
                >
                  <span className="text-xs shrink-0">{ACTIVITY_ICON[act.type]}</span>
                  <span className="flex-1 min-w-0 text-[11.5px] text-gray-200 truncate">{act.title || `Untitled ${ACTIVITY_LABEL[act.type]}`}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                    <button onClick={e => { e.stopPropagation(); moveActivity(mod.id, aIdx, -1) }} disabled={aIdx === 0} className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer text-[9px]">▲</button>
                    <button onClick={e => { e.stopPropagation(); moveActivity(mod.id, aIdx, 1) }} disabled={aIdx === mod.activities.length - 1} className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-white disabled:opacity-20 cursor-pointer text-[9px]">▼</button>
                    <button onClick={e => { e.stopPropagation(); deleteActivity(mod.id, act.id) }} className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-red-400 cursor-pointer text-[9px]">✕</button>
                  </div>
                </div>
              ))}

              {addMenuModuleId === mod.id ? (
                // Inline expanding row rather than an absolutely-positioned
                // dropdown — the module card above has `overflow-hidden`
                // (for its rounded corners), which was silently clipping a
                // `position: absolute` menu that extended past the card's
                // current height, making it invisible/unclickable.
                <div className="rounded-lg bg-black/20 border border-white/10 overflow-hidden">
                  <button onClick={() => addActivity(mod.id, newLesson(mod.activities.length))} className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 cursor-pointer flex items-center gap-2">📖 Lesson</button>
                  <button onClick={() => addActivity(mod.id, newQuickCheck(mod.activities.length))} className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 cursor-pointer flex items-center gap-2">❓ Quick Check</button>
                  <button onClick={() => addActivity(mod.id, newCoding(mod.activities.length))} className="w-full text-left px-3 py-2 text-[11px] text-gray-200 hover:bg-white/10 cursor-pointer flex items-center gap-2">💻 Coding Exercise</button>
                  <button onClick={() => setAddMenuModuleId(null)} className="w-full text-left px-3 py-2 text-[11px] text-gray-500 hover:bg-white/5 hover:text-gray-300 cursor-pointer border-t border-white/5">Cancel</button>
                </div>
              ) : (
                <button
                  onClick={() => setAddMenuModuleId(mod.id)}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-[11px] font-semibold text-gray-400 hover:text-[#4FD8A8] hover:bg-white/5 cursor-pointer transition-colors"
                >
                  + Add Activity
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addModule}
          className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-[#A7CE65] bg-[#1DB584]/10 hover:bg-[#1DB584]/15 border border-[#1DB584]/25 cursor-pointer transition-all"
        >
          + Add Module
        </button>
      </div>

      {/* RIGHT: activity editor */}
      <div className="overflow-y-auto bg-[#0D251C]">
        {selected ? (
          <ActivityEditor
            key={selected.activity.id}
            activity={selected.activity}
            onChange={updated => updateActivity(selected.module.id, updated)}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-10">
            <div>
              <p className="text-2xl mb-2">🗺️</p>
              <p className="text-sm text-gray-400">Select an activity on the left to edit it, or add a new one.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
