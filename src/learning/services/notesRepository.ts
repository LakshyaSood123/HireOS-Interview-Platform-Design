// Abstraction for per-user notes, linked to a course/module/lesson. Wired
// into the Lesson Workspace's Notes panel (src/components/lesson/NotesPanel.tsx).
//
// Swap path: `ApiNotesRepository` (the signed-in learner's account, below)
// replaces `LocalNotesRepository` behind this same interface; the Notes panel
// that calls list/save/delete doesn't change. learnerSession.ts picks one at
// boot.

import {
  ApiClient,
  ApiRequestError,
  ApiUnavailableError,
  learnerKey,
  Outbox,
  readJson,
  SessionExpiredError,
  writeJson,
  type OutboxFlushResult,
} from "./apiClient"

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

// ── The signed-in learner's account ──────────────────────────────────────
//
// Same interface, backed by /me/notes. The Notes panel keeps several notes
// per lesson and mints each one's id itself (`note-<timestamp>`), so a note
// is saved with `PUT /me/notes/{id}` — an upsert on that id. Saving twice, or
// replaying a save queued while offline, leaves one note, never two.
//
// `list()` is synchronous, so it answers from this browser's copy of the
// learner's notes, filled from the server at boot (`hydrate()`, run by
// learnerSession.ts before the first render). `save()` and `delete()` change
// that copy at once — the panel re-lists straight after — and queue the API
// call, which the outbox delivers in order and keeps across reloads.

type NoteOp = { kind: "put"; note: NoteRecord } | { kind: "delete"; noteId: string }

/** A note as the API returns it: `NoteRecord`, with nulls for "no scope". */
interface ApiNote {
  id: string
  courseId: string
  moduleId: string | null
  lessonId: string | null
  text: string
  updatedAt: string
}

/** What first sign-in did with the notes this browser kept while signed out. */
export interface NotesImportReport {
  outcome: "imported" | "server-has-notes"
  noteIds: string[]
}

const NOTES_PAGE_SIZE = 200
const MAX_NOTE_PAGES = 50

function toNoteRecord(note: ApiNote): NoteRecord {
  return {
    id: note.id,
    courseId: note.courseId,
    ...(note.moduleId ? { moduleId: note.moduleId } : {}),
    ...(note.lessonId ? { lessonId: note.lessonId } : {}),
    text: note.text,
    updatedAt: note.updatedAt,
  }
}

/** Oldest save first — the order `LocalNotesRepository` keeps, which the
 * panel reverses to show the newest on top. */
function bySaveOrder(a: NoteRecord, b: NoteRecord): number {
  return a.updatedAt.localeCompare(b.updatedAt) || a.id.localeCompare(b.id)
}

export class ApiNotesRepository implements NotesRepository {
  private readonly client: ApiClient
  private readonly storage: Storage
  private readonly userId: string
  private readonly outbox: Outbox<NoteOp>

  constructor(deps: { client: ApiClient; storage: Storage; userId: string }) {
    this.client = deps.client
    this.storage = deps.storage
    this.userId = deps.userId
    this.outbox = new Outbox<NoteOp>(deps.storage, learnerKey(deps.userId, "outbox", "notes"), op => this.deliver(op), {
      // Only a note's latest save matters, and deleting it makes any queued save moot.
      coalesce: (queue, next) => {
        const noteId = next.kind === "put" ? next.note.id : next.noteId
        return [...queue.filter(op => !(op.kind === "put" && op.note.id === noteId)), next]
      },
      onDrop: (op, error) =>
        console.warn(
          `[reagvis] The server refused ${op.kind === "put" ? "saving" : "deleting"} note ` +
            `${op.kind === "put" ? op.note.id : op.noteId} — ${error.code}: ${error.message}`,
        ),
    })
  }

  /** Boot, before the first render: send what this browser queued, import
   * its signed-out notes on first sign-in, then keep a copy of the server's.
   * Throws like `ApiProgressRepository.hydrate()`. */
  async hydrate(courseId: string, options: { importFrom?: NotesRepository } = {}): Promise<NotesImportReport | null> {
    // Reachable, and serving this course — proved before anything queued is sent.
    let notes = await this.fetchAll(courseId)

    const report = options.importFrom ? this.queueImport(courseId, notes, options.importFrom) : null

    if (this.outbox.size() > 0) {
      const result = await this.outbox.flush()
      if (result.stopped === "signed-out") throw new SessionExpiredError()
      if (result.stopped === "unavailable") throw new ApiUnavailableError("stopped while sending queued notes")
      notes = await this.fetchAll(courseId)
    }

    this.writeCopy(courseId, notes.sort(bySaveOrder))
    return report
  }

  pendingCount(): number {
    return this.outbox.size()
  }

  flush(): Promise<OutboxFlushResult> {
    return this.outbox.flush()
  }

  stop(): void {
    this.outbox.stop()
  }

  list(courseId: string): NoteRecord[] {
    return this.readCopy(courseId)
  }

  save(note: NoteRecord): void {
    // Same order rule as LocalNotesRepository: a saved note moves to the end.
    const others = this.readCopy(note.courseId).filter(n => n.id !== note.id)
    this.writeCopy(note.courseId, [...others, note])
    this.outbox.enqueue({ kind: "put", note })
  }

  delete(noteId: string): void {
    for (const courseId of this.copiedCourseIds()) {
      const notes = this.readCopy(courseId)
      if (notes.some(n => n.id === noteId)) this.writeCopy(courseId, notes.filter(n => n.id !== noteId))
    }
    this.outbox.enqueue({ kind: "delete", noteId })
  }

  /** First sign-in on this browser: notes written while signed out go to the
   * account — only if it has no notes in this course yet, so one learner's
   * notes never land in another's account on a shared computer. Uploaded
   * notes leave the signed-out store. If the account already has notes, the
   * signed-out ones stay exactly where they were: they are the learner's own
   * writing, and nothing here throws writing away. */
  private queueImport(courseId: string, server: NoteRecord[], local: NotesRepository): NotesImportReport | null {
    const signedOut = local.list(courseId)
    if (signedOut.length === 0) return null
    if (server.length > 0) return { outcome: "server-has-notes", noteIds: [] }

    for (const note of signedOut) {
      this.outbox.enqueue({ kind: "put", note })
      local.delete(note.id)
    }
    return { outcome: "imported", noteIds: signedOut.map(note => note.id) }
  }

  private async deliver(op: NoteOp): Promise<void> {
    if (op.kind === "put") {
      const { note } = op
      await this.client.request("PUT", `/me/notes/${encodeURIComponent(note.id)}`, {
        body: { courseId: note.courseId, moduleId: note.moduleId ?? null, lessonId: note.lessonId ?? null, text: note.text },
      })
      return
    }

    try {
      await this.client.request("DELETE", `/me/notes/${encodeURIComponent(op.noteId)}`)
    } catch (error) {
      // Already gone, which is all a delete asks for.
      if (error instanceof ApiRequestError && error.status === 404) return
      throw error
    }
  }

  private async fetchAll(courseId: string): Promise<NoteRecord[]> {
    const notes: NoteRecord[] = []
    let cursor: string | null = null

    for (let page = 0; page < MAX_NOTE_PAGES; page++) {
      const query = new URLSearchParams({ courseId, limit: String(NOTES_PAGE_SIZE) })
      if (cursor) query.set("cursor", cursor)

      const { data, meta } = await this.client.request<ApiNote[]>("GET", `/me/notes?${query.toString()}`)
      notes.push(...data.map(toNoteRecord))

      cursor = typeof meta.nextCursor === "string" ? meta.nextCursor : null
      if (!cursor) break
    }

    return notes
  }

  private copyKey(courseId: string): string {
    return learnerKey(this.userId, "notes", courseId)
  }

  private readCopy(courseId: string): NoteRecord[] {
    const stored = readJson(this.storage, this.copyKey(courseId))
    return Array.isArray(stored) ? (stored as NoteRecord[]) : []
  }

  private writeCopy(courseId: string, notes: NoteRecord[]): void {
    writeJson(this.storage, this.copyKey(courseId), notes)
  }

  /** Courses this browser holds a notes copy for — `delete()` gets no course id. */
  private copiedCourseIds(): string[] {
    const prefix = `${learnerKey(this.userId, "notes")}.`
    const courseIds: string[] = []
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i)
        if (key?.startsWith(prefix)) courseIds.push(key.slice(prefix.length))
      }
    } catch {
      // Storage unavailable — there is no copy to update.
    }
    return courseIds
  }
}
