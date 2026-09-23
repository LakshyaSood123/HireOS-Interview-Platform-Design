import { z } from "zod";

import { clientId, curriculumId } from "../../shared/ids.js";
import { NOTE_TEXT_MAX } from "./note.model.js";

/** Request shapes for the notes endpoints — mirrors docs/openapi.yaml. */

export const NOTES_PAGE_DEFAULT = 100;
export const NOTES_PAGE_MAX = 200;

export const noteIdParams = z.object({ noteId: clientId });

export const listNotesQuery = z.object({
  courseId: curriculumId,
  moduleId: curriculumId.optional(),
  /** A checkpoint id — a checkpoint is the lesson. */
  lessonId: curriculumId.optional(),
  limit: z.coerce.number().int().min(1).max(NOTES_PAGE_MAX).default(NOTES_PAGE_DEFAULT),
  /** Opaque — the `meta.nextCursor` of the previous page. */
  cursor: z
    .string()
    .regex(/^[a-f0-9]{24}$/, "Must be the nextCursor of a previous page.")
    .optional(),
});

/**
 * The body is the frontend's `NoteRecord`. Its `id` and `updatedAt` are
 * accepted and ignored — the path names the note and the server keeps time —
 * and so is a `userId`, which comes from the token like everywhere else.
 */
export const upsertNoteSchema = z.object({
  courseId: curriculumId,
  /** Ignored when `lessonId` is given: the curriculum says which module a lesson is in. */
  moduleId: curriculumId.nullable().optional(),
  lessonId: curriculumId.nullable().optional(),
  text: z
    .string()
    .max(NOTE_TEXT_MAX, `A note is at most ${NOTE_TEXT_MAX.toLocaleString("en")} characters.`)
    .refine((text) => text.trim().length > 0, "A note cannot be empty — delete it instead."),
});

export type NoteIdParams = z.infer<typeof noteIdParams>;
export type ListNotesQuery = z.infer<typeof listNotesQuery>;
export type UpsertNoteInput = z.infer<typeof upsertNoteSchema>;
