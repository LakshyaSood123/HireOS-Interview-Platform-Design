// Backend-backed NotesRepository for a signed-in learner. No local cache at
// all — every `list()` goes straight to the server, so there is no stale
// cross-account note surface to worry about (unlike progress, which caches
// for a fast first paint). `save`/`delete` go through the same ApiClient
// (auth header, one refresh, normalized errors) as everything else.

import type { ApiClient } from "./apiClient"
import { listNotes, upsertNote, deleteNote } from "./notesApi"
import type { NoteRecord, NotesRepository } from "./notesRepository"

export class ApiNotesRepository implements NotesRepository {
  constructor(private readonly client: ApiClient) {}

  list(courseId: string): Promise<NoteRecord[]> {
    return listNotes(this.client, courseId)
  }

  save(note: NoteRecord): Promise<NoteRecord> {
    return upsertNote(this.client, note)
  }

  delete(courseId: string, noteId: string): Promise<void> {
    return deleteNote(this.client, courseId, noteId)
  }
}
