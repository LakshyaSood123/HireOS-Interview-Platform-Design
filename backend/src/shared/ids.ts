import { z } from "zod";

/**
 * The two kinds of id a request can carry, validated the same way everywhere.
 *
 * Constraining the shape is what keeps an id from ever carrying a `$` or a
 * `.` into a MongoDB dotted path or query operator, whatever a caller sends.
 */

/** Curriculum ids come from the frontend registry: lowercase, digits and hyphens. */
export const curriculumId = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Must be a curriculum id (lowercase letters, digits and hyphens).");

/**
 * An id the client mints for its own record — the Notes panel's
 * `note-1726900000000`, or a UUID. Letters, digits, `-` and `_`.
 */
export const clientId = z
  .string()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, "Must be letters, digits, '-' or '_' (at most 64).");
