import { model, Schema, type InferSchemaType } from "mongoose";

/**
 * `notes` — a learner's notes, private per user. Schema doc §5.
 *
 * The Notes panel (src/components/lesson/NotesPanel.tsx) keeps SEVERAL notes
 * per lesson, each with an id the browser mints (`note-<timestamp>`). So a
 * note is addressed by that id, not by its lesson: `PUT /me/notes/{noteId}`
 * is an idempotent upsert, and a retry — or a change made offline and
 * replayed later — lands on the same document instead of creating another.
 *
 * Ids are minted by clients, so they are only unique per user. The unique
 * `{ userId, noteId }` index makes that the rule, and every query carries the
 * user id from the token: two learners who happen to mint the same id each
 * get their own note, and neither can reach the other's.
 */

export const NOTE_TEXT_MAX = 10_000;

const noteSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    /** The public id. Minted by the client; unique per user, not globally. */
    noteId: { type: String, required: true, maxlength: 64 },
    courseId: { type: String, required: true },
    /** Read from the curriculum when the note is on a lesson — never from the body. */
    moduleId: { type: String, default: null },
    /** The checkpoint id — a checkpoint is the lesson. Null for a module- or course-level note. */
    lessonId: { type: String, default: null },
    text: { type: String, required: true, maxlength: NOTE_TEXT_MAX },
  },
  { timestamps: true, collection: "notes" },
);

noteSchema.index({ userId: 1, noteId: 1 }, { unique: true });
/** `GET /me/notes?courseId=…` — one user's notes in a course, in creation order, paged by `_id`. */
noteSchema.index({ userId: 1, courseId: 1, _id: 1 });

export type NoteAttributes = InferSchemaType<typeof noteSchema>;

export const Note = model("Note", noteSchema);
