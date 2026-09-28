// Abstraction for per-user notes, linked to a course/module/lesson. Wired
// into the Lesson Workspace's Notes panel (src/components/lesson/NotesPanel.tsx).
//
// Async because a real backend-backed implementation can't be synchronous —
// LocalNotesRepository below just resolves immediately, so nothing about its
// own behavior changes.

export interface NoteRecord {
  id: string
  courseId: string
  moduleId?: string
  /** In the new Lesson Workspace model each Checkpoint IS the lesson (1:1) —
   * this is `Checkpoint.id`. */
  lessonId?: string
  text: string
  updatedAt: string
}

export interface NotesRepository {
  list(courseId: string): Promise<NoteRecord[]>
  save(note: NoteRecord): Promise<NoteRecord>
  delete(courseId: string, noteId: string): Promise<void>
}

const STORAGE_PREFIX = "reagvis.notes."

export class LocalNotesRepository implements NotesRepository {
  async list(courseId: string): Promise<NoteRecord[]> {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + courseId)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  async save(note: NoteRecord): Promise<NoteRecord> {
    try {
      const existing = await this.list(note.courseId)
      localStorage.setItem(STORAGE_PREFIX + note.courseId, JSON.stringify([...existing.filter(n => n.id !== note.id), note]))
    } catch {
      // no-op
    }
    return note
  }

  async delete(_courseId: string, noteId: string): Promise<void> {
    try {
      // Notes are stored per-course; without the courseId we scan every key
      // this repository owns rather than requiring callers to pass it.
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (!key?.startsWith(STORAGE_PREFIX)) continue
        const notes = JSON.parse(localStorage.getItem(key) ?? "[]") as NoteRecord[]
        if (notes.some(n => n.id === noteId)) {
          localStorage.setItem(key, JSON.stringify(notes.filter(n => n.id !== noteId)))
          return
        }
      }
    } catch {
      // no-op
    }
  }
}

export function listNotesForLesson(repository: NotesRepository, courseId: string, lessonId: string): Promise<NoteRecord[]> {
  return repository.list(courseId).then(notes => notes.filter(n => n.lessonId === lessonId))
}
