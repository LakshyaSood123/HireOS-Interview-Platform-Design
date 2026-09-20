# Backend Integration — Database Schema

**MongoDB Atlas** (hosted, reached by `MONGO_URI`), one database per environment
(`reagvis_dev` / `reagvis_test` / `reagvis_prod`), 12 collections.

Mongoose with MongoDB's recommended practices: a schema per collection, indexes declared on the
model and built on boot, `lean()` for read-only queries, projections instead of whole documents,
`select: false` on `passwordHash`, and every list endpoint paginated — no unbounded `find()`.

**Two rules for the whole schema:**
1. Every id we create is an ObjectId. Every curriculum id (`courseId`, `moduleId`, `checkpointId`,
   `lessonId`) is the exact string from the frontend registry, stored as a string.
2. MongoDB has no foreign keys, so the service layer adds `userId` from the token to **every**
   query on user data. That is the only thing protecting one user's data from another.

---

## Collections at a glance

| Collection | Holds | Key index |
|---|---|---|
| `users` | account | `email` unique |
| `refreshTokens` | login sessions | `tokenHash` unique, TTL on `expiresAt` |
| `courseProgress` | the whole learner state, one doc per user per course | `{ userId, courseId }` unique |
| `rewardEvents` | XP / lives ledger | `{ userId, courseId, eventKey }` unique |
| `notes` | one note per lesson | `{ userId, courseId, lessonId }` unique |
| `learningAttempts` | quick-check and quiz answers | `{ userId, checkpointId, createdAt }` |
| `codeSubmissions` | submitted code + results | `{ userId, createdAt }` |
| `interviewSessions` | interview result + weak skills | `sourceSessionId` unique |
| `curriculumSnapshots` | course ID structure only | `{ courseId, version }` unique |
| `practiceItems` | question metadata | `externalId` unique |
| `lessonAssets` | image paths / URLs | `assetKey` unique |
| `judgeFixtures` | server-side hidden test fixtures | `{ activityId, version }` unique |

The last four are seeded reference data, not user data.

---

## 1. `users`

| Field | Type | Note |
|---|---|---|
| `email` | string | lowercased, unique |
| `passwordHash` | string | bcrypt; plaintext is never stored or logged |
| `displayName` | string | |
| `role` | `learner` \| `admin` | |
| `createdAt`, `updatedAt` | Date (UTC) | |

## 2. `refreshTokens`

`userId`, `tokenHash` (SHA-256 — the raw token is never stored), `expiresAt`, `revokedAt`,
`userAgent`, `ip`.

## 3. `courseProgress` — the main collection

Shaped like the frontend's `LearnerProgressState`, so the API response can be used directly.

```jsonc
{
  "userId": "ObjectId(...)",
  "courseId": "dsa-foundations",
  "curriculumVersion": "2026-09-16",
  "enrolledAt": "2026-09-18T09:00:00Z",

  // exactly the frontend's LearnerProgressState fields
  "activeZoneId": "recursive-forest",
  "activeModuleId": "trees",
  "activeCheckpointId": "trees-3",
  "completedCheckpointIds": ["foundations-1", "trees-1", "trees-2"],
  "masteredCheckpointIds": ["foundations-5"],
  "xp": 640,
  "lives": 3,
  "streak": 4,
  "lastActivityDate": "2026-09-19",     // "YYYY-MM-DD", drives the streak

  // extra detail the frontend does not keep
  "checkpointStats": {
    "trees-2": { "attempts": 3, "failedSubmits": 1, "firstCompletedAt": "…", "bestScore": 100 }
  },
  "moduleStats": { "trees": { "startedAt": "…", "completedAt": null } },
  "dismissedRecommendationKeys": ["review:trees-2"],
  "lastActivityAt": "2026-09-19T11:40:00Z"
}
```

**Why one document instead of separate module and checkpoint collections:** the whole state is
read together and written together, so one document means one atomic update, no joins, and no way
for a module row to disagree with its checkpoint rows. At 107 checkpoints it is a few KB.

**Stored vs derived:** we store the facts (what is completed, XP, lives, streak, the active
pointer). We derive `locked` / `available` / `current` / `completed` / `mastered` from
`completedCheckpointIds` plus the prerequisite graph — the same way `progressEngine.ts` does.
Storing those states would create a second source of truth.

## 4. `rewardEvents` — how duplicate XP is prevented

| Field | Note |
|---|---|
| `eventKey` | `complete:trees-3`, `mastery:trees-5`, `failed-submit:<submissionId>` |
| `eventType` | `checkpoint-complete` \| `mastery-bonus` \| `failed-submit` \| `streak` |
| `referenceType` / `referenceId` | `checkpoint` / `trees-3` |
| `xpDelta`, `livesDelta` | number |

Completion inserts the event **before** touching XP. A duplicate-key error means it was already
completed, so we skip the reward and return `alreadyCompleted: true`. Retries, double-clicks and
reviewing a finished module all land there.

## 5. `notes`

`userId`, `courseId`, `moduleId`, `lessonId` (= the checkpoint id), `text` (max 10,000 chars),
`createdAt`, `updatedAt`. One note per lesson scope, so the Notes panel can upsert.
Matches the frontend's `NoteRecord`.

## 6. `learningAttempts`

`courseId`, `moduleId`, `checkpointId`, `activityId`, `attemptType`
(`quick-check` | `quiz` | `reading`), `passed`, `payload` (free-form, e.g.
`{ selectedIndex, correctIndex }`).

## 7. `codeSubmissions`

Only submits are stored — including the submitted source code. Runs are rate-limited and discarded.

| Field | Note |
|---|---|
| `moduleId`, `checkpointId`, `activityId` | scope |
| `language` | `python` \| `cpp` \| `java` in v1 |
| `sourceCode` | max 64 KB |
| `status` | `passed` \| `failed` \| `compile-error` \| `runtime-error` \| `timeout` |
| `stdout`, `stderr`, `compileOutput` | truncated to 32 KB each |
| `runtimeMs`, `testsPassed`, `testsTotal` | |
| `tests` | `{ id, description, status, input, expected, received }` — hidden fixture inputs and expected values are stripped from responses |
| `providerName` | `piston` or `mock` — which engine produced the result |
| `providerMeta` | Piston language + runtime version actually used, for reproducibility |

## 8. `interviewSessions`

```jsonc
{
  "userId": "ObjectId(...)",
  "sourceSessionId": "hireos-sess-8821",
  "recommendedCourseId": "dsa-foundations",
  "startingModuleId": "trees",
  "difficulty": "normal",
  "targetCompanyIds": [],
  "weakSkills": ["Trees & Binary Search Trees", "Graph Traversal (BFS / DFS)"],
  "skillSignals": [
    { "skillId": "trees",  "score": 0.35, "strength": "weak", "source": "hireos" },
    { "skillId": "graphs", "score": 0.40, "strength": "weak", "source": "hireos" }
  ]
}
```

Weak skills arrive as display names and are mapped to real module ids by a lookup table kept next
to the seeder. Unknown labels are stored as-is and simply produce no signal.

**Recommendations are not stored** — they are computed per request from progress plus the latest
interview session. Only dismissals persist, inside `courseProgress`.

## 9. `curriculumSnapshots` — structure only

Seeded by `scripts/seedCurriculum.ts`, which imports the frontend registry and writes out ids,
order, XP and prerequisites. **No lesson text, no theory, no scenic data.**

```jsonc
{
  "courseId": "dsa-foundations",
  "version": "2026-09-16",
  "frontendCommit": "99e1d72cb20ec51384bbdb597f35d74870e7e300",
  "zones":  [{ "id": "basecamp", "order": 1, "moduleIds": ["foundations", "arrays-strings", "hashing"] }],
  "modules":[{ "id": "trees", "zoneId": "recursive-forest", "order": 15,
               "checkpointIds": ["trees-1", "…", "trees-5"] }],
  "checkpoints": [
    { "id": "trees-3", "moduleId": "trees", "order": 3, "type": "checkpoint",
      "xp": 40, "masteryXp": null, "prerequisites": ["trees-2"], "hasCodingActivity": true }
  ]
}
```

This exists for one reason: the server must be able to answer "is this module locked?" without
trusting the client. When the frontend curriculum changes we re-run the seeder and get a new
`version`; existing progress keeps pointing at the version it was made against.

## 10. `practiceItems`

`externalId`, `title`, `source` (`grind75` | `company` | `internal`), `sourceUrl` (a link only —
we never copy a third-party problem statement), `authoredPrompt`, `difficulty`, `topics[]`,
`moduleId`, `role`, `companyTags[{ companyId, priority }]`.

## 11. `lessonAssets` — paths only

| Field | Note |
|---|---|
| `assetKey` | stable key, e.g. `trees-3.traversal-diagram` |
| `courseId`, `moduleId`, `checkpointId` | scope |
| `kind` | `image` \| `diagram` \| `animation-frame` |
| `location` | `local` \| `url` |
| `path` | `/assets/lessons/trees/traversal.svg` or a full web URL |
| `alt`, `width`, `height` | |

The API returns the path as-is and the frontend loads the file. No uploads, no binaries, no image
processing.

---

## 12. `judgeFixtures` — hidden tests, server-side

The frontend currently bundles `hiddenTests` in the client bundle, which means they ship to the
browser and are readable by anyone who opens devtools. They are not secret, so they cannot be
trusted for judging. This collection is where the real ones live.

| Field | Note |
|---|---|
| `activityId` | scope, e.g. `trees-3-code` |
| `courseId`, `moduleId`, `checkpointId` | scope |
| `version` | bumped when fixtures change; submissions record the version they were judged against |
| `visibleTests` | `{ id, description, input, expected }` — safe to return; these are what `/code/run` uses |
| `hiddenTests` | `{ id, description, input, expected, weight }` — **never returned in any response** |
| `limits` | `{ timeoutMs, memoryMb, outputKb }` per language, passed through to Piston |
| `comparator` | `exact` \| `trimmed` \| `numeric-tolerance` \| `unordered` |

**Rules:**

- `hiddenTests` inputs and expected values are never serialized into an API response. A failing
  hidden test returns its `id`, `description` and `status` only — no input, no expected value.
- Seeded by `scripts/seedJudgeFixtures.ts` from a source that is **not** part of the client bundle.
- Until a fixture exists for an activity, `/code/submit` falls back to the frontend's bundled tests
  and marks the submission `judgedWith: "client-fixtures"`, so the gap is visible and auditable
  rather than silent.

---

## Integrity rules

| Rule | Enforced by |
|---|---|
| One progress doc per user per course | unique `{ userId, courseId }` |
| No duplicate XP | unique `{ userId, courseId, eventKey }`, written before the XP update |
| No conflicting module / checkpoint rows | impossible — they are fields in one document |
| One note per lesson | unique `{ userId, courseId, lessonId }` |
| No cross-user reads | `userId` from the token injected into every query |
| UTC everywhere | all dates UTC; `lastActivityDate` is a plain `"YYYY-MM-DD"` string |
| Curriculum traceability | `curriculumVersion` on every progress document |

**Deleting a user** runs one cleanup service that removes their progress, notes, reward events,
attempts, submissions, interview sessions and tokens. Mongo has no cascade, so this is the single
place deletes fan out.

## Known limitations

- The reward event and the progress update are wrapped in one transaction. Atlas clusters are
  replica sets, so transactions are available to us from day one. The unique `eventKey` is still
  the real idempotency guard; the transaction only stops a half-applied write.
- `checkpointStats` grows with the curriculum. Fine at 107; it would move to its own collection if
  a course ever reached thousands.
