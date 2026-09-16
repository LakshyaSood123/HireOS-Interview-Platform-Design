// Abstraction for per-user notes, linked to a course/module/lesson. Wired
// into the Lesson Workspace's Notes panel (src/components/lesson/NotesPanel.tsx).
//
// Swap path: a future `ApiNotesRepository implements NotesRepository`
// (real backend) replaces `LocalNotesRepository` behind this same
// interface; the Notes panel that calls list/save/delete doesn't change.

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
  list(courseId: string): NoteRecord[]
  save(note: NoteRecord): void
  delete(noteId: string): void
}

const STORAGE_PREFIX = "reagvis.notes."

export class LocalNotesRepository implements NotesRepository {
  list(courseId: string): NoteRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + courseId)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  save(note: NoteRecord): void {
    try {
      const existing = this.list(note.courseId).filter(n => n.id !== note.id)
      localStorage.setItem(STORAGE_PREFIX + note.courseId, JSON.stringify([...existing, note]))
    } catch {
      // no-op
    }
  }

  delete(noteId: string): void {
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

export function listNotesForLesson(repository: NotesRepository, courseId: string, lessonId: string): NoteRecord[] {
  return repository.list(courseId).filter(n => n.lessonId === lessonId)
}
