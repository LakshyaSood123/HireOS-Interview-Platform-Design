import { Types } from "mongoose";

import { ApiError } from "../../shared/errors.js";
import { logger } from "../../shared/logger.js";
import { isDuplicateKeyError } from "../../shared/transaction.js";
import { requireCurriculum, type CurriculumIndex } from "../curriculum/curriculum.service.js";
import { Note } from "./note.model.js";
import type { ListNotesQuery, UpsertNoteInput } from "./notes.schema.js";

/**
 * Notes — docs/03-API-CONTRACT.md "Notes".
 *
 * Every query here filters on the `userId` the route read from the token.
 * That filter is the only thing between one learner's notes and another's
 * (schema doc, "two rules for the whole schema"), so no function in this file
 * takes a note id without a user id beside it.
 *
 * Note text is the learner's own writing: it is stored and returned, and it
 * never reaches a log line — the logs carry its length at most.
 */

/** Field-for-field the frontend's `NoteRecord`, plus `createdAt`. */
export interface NoteResponse {
  id: string;
  courseId: string;
  moduleId: string | null;
  lessonId: string | null;
  text: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotesPage {
  notes: NoteResponse[];
  /** Pass back as `cursor` for the next page; null on the last one. */
  nextCursor: string | null;
}

/** The lean shape of a note, as every read here sees it. */
interface NoteRecord {
  _id: Types.ObjectId;
  noteId: string;
  courseId: string;
  moduleId?: string | null;
  lessonId?: string | null;
  text: string;
  createdAt?: Date;
  updatedAt?: Date;
}

/** Everything a response needs, and nothing else — the user id stays in the database. */
const PUBLIC_FIELDS = { noteId: 1, courseId: 1, moduleId: 1, lessonId: 1, text: 1, createdAt: 1, updatedAt: 1 } as const;

function toNote(record: NoteRecord): NoteResponse {
  const createdAt = record.createdAt ?? new Date();
  return {
    id: record.noteId,
    courseId: record.courseId,
    moduleId: record.moduleId ?? null,
    lessonId: record.lessonId ?? null,
    text: record.text,
    createdAt: createdAt.toISOString(),
    updatedAt: (record.updatedAt ?? createdAt).toISOString(),
  };
}

/**
 * Where a note lives, according to the curriculum — the rule `/me/attempts`
 * follows too. A note on a lesson belongs to that lesson's module whatever
 * the body says; a module-level note must name a real module.
 */
function resolveScope(
  curriculum: CurriculumIndex,
  input: UpsertNoteInput,
): { moduleId: string | null; lessonId: string | null } {
  if (input.lessonId) {
    const moduleId = curriculum.moduleIdByCheckpointId.get(input.lessonId);
    if (!moduleId) throw ApiError.notFound(`Unknown lesson "${input.lessonId}" in course "${curriculum.courseId}".`);
    return { moduleId, lessonId: input.lessonId };
  }

  if (input.moduleId) {
    if (!curriculum.moduleById.has(input.moduleId)) {
      throw ApiError.notFound(`Unknown module "${input.moduleId}" in course "${curriculum.courseId}".`);
    }
    return { moduleId: input.moduleId, lessonId: null };
  }

  return { moduleId: null, lessonId: null };
}

/**
 * `GET /me/notes` — one page of the caller's notes in a course, oldest first.
 *
 * Paged by `_id`, which never changes, so editing a note while a client walks
 * the pages cannot make it appear twice or not at all.
 */
export async function listNotes(userId: string, query: ListNotesQuery): Promise<NotesPage> {
  const curriculum = await requireCurriculum(query.courseId);

  const filter = {
    userId,
    courseId: curriculum.courseId,
    ...(query.moduleId ? { moduleId: query.moduleId } : {}),
    ...(query.lessonId ? { lessonId: query.lessonId } : {}),
    ...(query.cursor ? { _id: { $gt: new Types.ObjectId(query.cursor) } } : {}),
  };

  // One row more than the page says whether another page exists, without a count.
  const rows = (await Note.find(filter, PUBLIC_FIELDS)
    .sort({ _id: 1 })
    .limit(query.limit + 1)
    .lean()) as unknown as NoteRecord[];

  const page = rows.slice(0, query.limit);
  const last = page[page.length - 1];

  return {
    notes: page.map(toNote),
    nextCursor: rows.length > query.limit && last ? last._id.toString() : null,
  };
}

/**
 * `PUT /me/notes/{noteId}` — create the note, or replace it if it exists.
 *
 * Idempotent by construction: the same request twice leaves one note with the
 * same text. That is what lets the frontend retry a save, or replay one it
 * queued while offline, without ever duplicating a note.
 */
export async function upsertNote(userId: string, noteId: string, input: UpsertNoteInput): Promise<NoteResponse> {
  const curriculum = await requireCurriculum(input.courseId);
  const scope = resolveScope(curriculum, input);

  const write = () =>
    Note.findOneAndUpdate(
      { userId, noteId },
      {
        $set: {
          courseId: curriculum.courseId,
          moduleId: scope.moduleId,
          lessonId: scope.lessonId,
          text: input.text,
        },
      },
      { upsert: true, new: true, runValidators: true, projection: PUBLIC_FIELDS },
    ).lean();

  let saved: Awaited<ReturnType<typeof write>>;
  try {
    saved = await write();
  } catch (error) {
    // Two first saves of the same new note raced and both tried to insert.
    // The unique index let one through, so the other is now an update.
    if (!isDuplicateKeyError(error)) throw error;
    saved = await write();
  }

  if (!saved) throw new ApiError("INTERNAL_ERROR", "The note could not be saved.");

  logger.info(
    { userId, noteId, courseId: curriculum.courseId, lessonId: scope.lessonId, length: input.text.length },
    "notes: saved",
  );

  return toNote(saved as unknown as NoteRecord);
}

/**
 * `DELETE /me/notes/{noteId}`.
 *
 * Another learner's note and a note that never existed get the same 404:
 * among the caller's notes there is no such id. Answering 403 would confirm
 * that someone else's note exists.
 */
export async function deleteNote(userId: string, noteId: string): Promise<void> {
  const { deletedCount } = await Note.deleteOne({ userId, noteId });
  if (deletedCount === 0) throw ApiError.notFound(`No note "${noteId}".`);

  logger.info({ userId, noteId }, "notes: deleted");
}
