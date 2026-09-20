import { useEffect, useState } from "react"
import type { NotesRepository, NoteRecord } from "../../learning/services/notesRepository"

interface NotesPanelProps {
  repository: NotesRepository
  courseId: string
  moduleId: string
  lessonId: string
  onClose: () => void
}

/** Compact notes drawer (PART 16) — create/edit/delete, persisted via
 * whatever `NotesRepository` is passed in (LocalNotesRepository today).
 * Not a full notes application: one drawer, scoped to the checkpoint
 * currently open in the Lesson Workspace. */
export default function NotesPanel({ repository, courseId, moduleId, lessonId, onClose }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteRecord[]>([])
  const [draft, setDraft] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    setNotes(repository.list(courseId).filter(n => n.lessonId === lessonId))
  }, [repository, courseId, lessonId])

  const refresh = () => setNotes(repository.list(courseId).filter(n => n.lessonId === lessonId))

  const handleSave = () => {
    if (!draft.trim()) return
    const note: NoteRecord = {
      id: editingId ?? `note-${Date.now()}`,
      courseId,
      moduleId,
      lessonId,
      text: draft.trim(),
      updatedAt: new Date().toISOString(),
    }
    repository.save(note)
    setDraft("")
    setEditingId(null)
    refresh()
  }

  const handleEdit = (note: NoteRecord) => {
    setDraft(note.text)
    setEditingId(note.id)
  }

  const handleDelete = (id: string) => {
    repository.delete(id)
    if (editingId === id) {
      setDraft("")
      setEditingId(null)
    }
    refresh()
  }

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-[#0A261B] border-l border-[#1DB584]/30 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <h3 className="text-sm font-black text-white flex items-center gap-2">📝 Notes</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg leading-none cursor-pointer">
          ✕
        </button>
      </div>

      <div className="p-4 border-b border-white/10">
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Write something you want to remember about this lesson..."
          className="w-full min-h-[90px] bg-black/30 text-gray-100 text-sm rounded-xl border border-white/10 p-3 outline-none resize-none placeholder-gray-600 focus:border-[#1DB584]/50"
        />
        <div className="flex items-center justify-end gap-2 mt-2">
          {editingId && (
            <button
              onClick={() => {
                setDraft("")
                setEditingId(null)
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!draft.trim()}
            className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#1DB584] hover:bg-[#159a6f] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {editingId ? "Update Note" : "Save Note"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <p className="text-xs text-gray-500 text-center pt-8">No notes yet for this lesson.</p>
        ) : (
          notes
            .slice()
            .reverse()
            .map(note => (
              <div key={note.id} className="rounded-xl bg-white/5 border border-white/10 p-3 min-w-0">
                <p className="text-xs text-gray-200 whitespace-pre-wrap break-words leading-relaxed">{note.text}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-gray-500">{new Date(note.updatedAt).toLocaleString()}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(note)} className="text-[11px] text-[#1DB584] hover:text-[#4FD8A8] font-semibold cursor-pointer">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(note.id)} className="text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  )
}
