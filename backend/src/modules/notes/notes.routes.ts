import { Router } from "express";

import { currentUserId, requireAuth } from "../../middleware/auth.js";
import { body, params, query, validate } from "../../middleware/validate.js";
import { sendData } from "../../shared/envelope.js";
import * as notesService from "./notes.service.js";
import {
  listNotesQuery,
  noteIdParams,
  upsertNoteSchema,
  type ListNotesQuery,
  type NoteIdParams,
  type UpsertNoteInput,
} from "./notes.schema.js";

/**
 * Notes routes — docs/03-API-CONTRACT.md "Notes".
 *
 * Every one is `requireAuth` and passes `currentUserId(req)` into the
 * service; a `userId` anywhere in the request is ignored.
 */
export const notesRouter = Router();

notesRouter.get("/me/notes", requireAuth, validate({ query: listNotesQuery }), async (req, res) => {
  const { notes, nextCursor } = await notesService.listNotes(currentUserId(req), query<ListNotesQuery>(req));
  sendData(res, notes, 200, { nextCursor });
});

notesRouter.put(
  "/me/notes/:noteId",
  requireAuth,
  validate({ params: noteIdParams, body: upsertNoteSchema }),
  async (req, res) => {
    const { noteId } = params<NoteIdParams>(req);
    sendData(res, await notesService.upsertNote(currentUserId(req), noteId, body<UpsertNoteInput>(req)));
  },
);

notesRouter.delete("/me/notes/:noteId", requireAuth, validate({ params: noteIdParams }), async (req, res) => {
  const { noteId } = params<NoteIdParams>(req);
  await notesService.deleteNote(currentUserId(req), noteId);
  res.status(204).end();
});
