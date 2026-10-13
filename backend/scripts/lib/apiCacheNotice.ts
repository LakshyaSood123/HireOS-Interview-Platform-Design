/**
 * Scripts run in their OWN Node process. A script cannot clear the running API
 * server's in-memory curriculum cache, and must not pretend it can.
 *
 * What is safe after this notice (pinned-curriculum fix):
 *  - New enrollments read the active snapshot fresh from the database, so a
 *    publish made by a script cannot cause a stale version to be pinned.
 *  - Per-version snapshots are cached by version and never change once published.
 *
 * What still needs an API restart: a snapshot that was rewritten IN PLACE under
 * the same version id (for example re-running seedCurriculum), because the API
 * may still hold the old copy of that exact version in memory.
 *
 * The runtime-safe way to publish is the API/service path Creator Studio uses
 * (POST /cms/courses/:id/draft/publish), which clears the cache in the API process.
 */
export function printApiCacheNotice(what: string): void {
  console.log(
    [
      "",
      "============================================================",
      `NOTICE: ${what} ran in a separate process from the API server.`,
      "  - New learner enrollments will pin the correct (fresh) version.",
      "  - If you rewrote an EXISTING version in place, RESTART the API process",
      "    before learner testing, so it does not serve its cached copy.",
      "  - To publish without restarting, publish through Creator Studio / the API.",
      "============================================================",
      "",
    ].join("\n"),
  );
}
