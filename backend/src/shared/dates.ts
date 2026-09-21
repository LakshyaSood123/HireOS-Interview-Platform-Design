/**
 * Dates, in UTC, in one place.
 *
 * The streak is keyed on a plain `"YYYY-MM-DD"` string — schema §"Integrity
 * rules": *UTC everywhere; `lastActivityDate` is a plain "YYYY-MM-DD" string*.
 *
 * The frontend's `recordActivity` derives "yesterday" with `new Date(today)`
 * and local-timezone getters, which drifts by a day for anyone west of UTC.
 * The server is the authority on the streak, so it does the arithmetic in UTC
 * and cannot drift. The rule itself — same day, yesterday, or reset — is
 * `progressEngine.recordActivity`'s, unchanged.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today in UTC as `"YYYY-MM-DD"`. */
export function isoDate(at: Date = new Date()): string {
  return at.toISOString().slice(0, 10);
}

/** `"YYYY-MM-DD"` shifted by whole days, in UTC. */
export function addDays(iso: string, days: number): string {
  const shifted = new Date(`${iso}T00:00:00.000Z`);
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return isoDate(shifted);
}

export function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`));
}
