/**
 * Re-exports `src/modules/curriculum/snapshotBuilder.ts` unchanged.
 *
 * The logic moved there in Phase 3B so it's reachable from production
 * server code (the CMS publish flow needs it too, and `scripts/**` sits
 * outside `tsconfig.json`'s `rootDir: "src"`) — this file exists purely so
 * `seedCurriculum.ts` and `verifyEngineParity.ts` keep importing
 * `./lib/buildSnapshot.js` with no changes of their own.
 */
export * from "../../src/modules/curriculum/snapshotBuilder.js";
