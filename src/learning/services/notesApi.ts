// Learner notes — GET/PUT/DELETE /me/notes, through the shared auth-aware
// ApiClient. The backend's upsertNoteSchema comment says it directly:
// "The body is the frontend's NoteRecord" — so, like progress, no DTO
// transform is needed beyond trusting that documented shape.

import type { ApiClient } from "./apiClient"
import type { NoteRecord } from "./notesRepository"

interface NoteResponseDto {
  id: string
  courseId: string
  moduleId: string | null
  lessonId: string | null
  text: string
  updatedAt: string
}

function toNoteRecord(dto: NoteResponseDto): NoteRecord {
  return {
    id: dto.id,
    courseId: dto.courseId,
    moduleId: dto.moduleId ?? undefined,
    lessonId: dto.lessonId ?? undefined,
    text: dto.text,
    updatedAt: dto.updatedAt,
  }
}

export function listNotes(client: ApiClient, courseId: string): Promise<NoteRecord[]> {
  return client
    .request<NoteResponseDto[]>("GET", `/me/notes?${new URLSearchParams({ courseId, limit: "200" })}`)
    .then(res => res.data.map(toNoteRecord))
}

export function upsertNote(client: ApiClient, note: NoteRecord): Promise<NoteRecord> {
  return client
    .request<NoteResponseDto>("PUT", `/me/notes/${encodeURIComponent(note.id)}`, {
      body: { courseId: note.courseId, moduleId: note.moduleId ?? null, lessonId: note.lessonId ?? null, text: note.text },
    })
    .then(res => toNoteRecord(res.data))
}

export function deleteNote(client: ApiClient, courseId: string, noteId: string): Promise<void> {
  // courseId isn't needed by the DELETE route (ownership is the token alone),
  // kept in the signature only so callers read the same way as the others.
  void courseId
  return client.request<void>("DELETE", `/me/notes/${encodeURIComponent(noteId)}`).then(() => undefined)
}
