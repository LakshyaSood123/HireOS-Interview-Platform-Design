# Day 2 — Demo Notes and Manual Verification

Day 2 delivered durable learner progress: XP, lives, streak, and the lock rules — with the server
as the authority on all of them. This document has two halves:

- **[Part 1 — Presentation notes](#part-1--presentation-notes)**, the running order for the demo.
- **[Part 2 — Manual verification](#part-2--manual-verification)**, for a reviewer who wants to
  check the claims rather than take them on trust.

Checkpoint definitions live in [05-DAY-WISE-CHECKPOINTS.md](./05-DAY-WISE-CHECKPOINTS.md).

---

# Part 1 — Presentation notes

## The framing (30 seconds)

> Day 1 made the server the authority on *who you are*. Day 2 makes it the authority on *what
> you've done* — and the interesting part is not that progress saves. It's that progress cannot be
> forged, double-claimed, or unlocked out of order, even by someone who never opens the app.

Every rule the product depends on — XP that can't be double-awarded, modules that stay locked,
review that costs nothing — now lives behind an API boundary instead of inside a React component
anyone can open devtools on.

## What shipped

| | |
|---|---|
| Endpoints | `GET /me/courses/{id}/state`, `PUT …/active`, `POST /me/modules/{id}/start`, `GET /me/modules/{id}/progress`, `POST /me/checkpoints/{id}/complete`, `POST /me/attempts` |
| Collections | `curriculumSnapshots`, `courseProgress`, `rewardEvents`, `learningAttempts` |
| Seeder | `npm run seed:curriculum` — 7 zones, 29 modules, 107 checkpoints, **no lesson text** |
| Verification | 67 API assertions · 16,005 engine-parity comparisons · a ledger reconciliation |

## Demo running order

About eight minutes. Sections 3 and 4 are the ones worth the time.

### 1. The curriculum is a structure, not a copy (~1 min)

```bash
npm run seed:curriculum -- --dry-run
```

```
  dsa-foundations  v2026-09-20
  ────────────────────────────────────────────────────────────
  zones               7
  modules             29
  checkpoints         107
  coding activities   37
  mastery bonuses     25
  total XP on offer   6290
  frontend commit     712096a31f03c4abccf21c5c7100de0f0cfc9677
  structure hash      751a6c155a40de2f…
  written             ids · order · type · xp · masteryXp · prerequisites · hasCodingActivity · title
  not written         theory · questions · starter code · solutions · visuals · scenic data
```

> "This imports the frontend's own `courseRegistry.ts` — not a copy of it, the actual file — and
> writes out the ID structure. The last two lines are enforced, not aspirational: the seeder runs a
> field allowlist and a 120-character cap on every string, and refuses to write if either is broken.
> The backend cannot quietly become a second curriculum, because the seeder won't let it."

### 2. A fresh learner (~40s)

```bash
curl -s $BASE/me/courses/dsa-foundations/state -H "authorization: Bearer $ACCESS" | jq .data
```

```jsonc
{
  "progress": { "xp": 0, "lives": 3, "streak": 0, "completedCheckpointIds": [], … },
  "moduleStates": { "foundations": "current", "arrays-strings": "locked", "trees": "locked", … },
  "zoneStates":   { "basecamp": "current", "graph-highlands": "locked", … }
}
```

> "No progress document existed a moment ago — the first read enrolls. Note what is *not* stored:
> `locked`, `available`, `current`. Those are derived per request from the prerequisite graph. Store
> them and you have two sources of truth and a bug six weeks out."

### 3. It can't be cheated — the actual demo (~4 min)

**Double-click, ten times over.**

```bash
for n in $(seq 1 10); do
  curl -s -X POST $BASE/me/checkpoints/foundations-2/complete \
    -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
    -d '{"courseId":"dsa-foundations"}' -o par_$n.json &
done; wait
jq -c '{already:.data.alreadyCompleted, xp:.data.progress.xp}' par_*.json | sort | uniq -c
```

```
   1 {"already":false,"xp":60}
   9 {"already":true,"xp":60}
```

> "Ten requests at once. One reward. The guard isn't a check-then-write — that races. The ledger row
> goes in **first**, on a unique `{ userId, courseId, eventKey }` index, and nine of them bounce off
> the database. Retry, double-click, flaky network, or a learner reviewing a module they finished
> last week: all the same path."

**Unlock Graphs without touching the UI.**

```bash
curl -s -X POST $BASE/me/modules/graphs/start -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' | jq .error
```

```json
{
  "code": "MODULE_LOCKED",
  "message": "Complete Ancient Canopy before starting Graph Fundamentals.",
  "details": { "moduleId": "graphs", "missingPrerequisites": ["trees-5"] }
}
```

> "That request never went near the frontend. The prerequisite graph is in the database, so the lock
> holds against curl, against Postman, against anything. And it tells you *which* checkpoint you're
> short of — a lock you can't act on is just a wall."

**Finish a module and watch two open.**

```bash
curl -s -X POST $BASE/me/checkpoints/foundations-5/complete … | jq '.data | {rewards, unlocked}'
```

```json
{
  "rewards": { "xpAwarded": 140, "masteryAwarded": true, "livesDelta": 0, "streak": 1 },
  "unlocked": { "checkpointIds": ["arrays-strings-1", "linked-structures-1"],
                "moduleIds": ["arrays-strings", "linked-structures"] }
}
```

> "140, not 40 — the terminal checkpoint pays its mastery bonus, and the number comes from the
> curriculum, never a constant in the server. And Foundations is a branch point: finishing it opens
> two parallel paths. The server computes that by diffing derived states before and after, so it
> always matches what the roadmap will draw."

### 4. Proving it matches the frontend (~2 min)

```bash
npm run verify:parity
```

```
  ENGINE PARITY OK  49 scenarios · 16,005 comparisons
  Derived states, "what is next" and completion results are identical to
  src/learning/progressEngine.ts.
```

> "The risk in this day was never 'does the API work'. It's that the server's idea of *locked*
> drifts from the browser's, and the roadmap starts lying. So this doesn't compare the backend to a
> description of the frontend — it imports the real `progressEngine.ts` and runs both engines over
> the same 49 snapshots: fresh, mid-course on both branches, completed, fully mastered, and forty
> seeded-random ones. Every checkpoint, module and zone state, every 'what's next', every completion
> result. Sixteen thousand comparisons, zero differences. It needs no server and no database,
> because both engines are pure functions — which is exactly why they were written that way."

### 5. And the database agrees with itself (~40s)

```bash
npm run verify:ledger
```

```
  LEDGER RECONCILES  3 progress documents · 12 ledger rows · reagvis_dev
  Every point of XP traces to the row that granted it, and no key appears twice.
```

> "Every user in the database, reconciled: stored XP against the sum of the rows that granted it,
> every completion matched to exactly one ledger row, every mastery entry to its bonus. Read-only —
> if this ever fails, it's a bug to go and find, not a number to correct."

## Questions to expect

**"Why does the server compute locked/available at all — the frontend already does?"**
Because the frontend's answer is advisory. The server has to make the same decision to refuse a
write, and if it derived it differently the two would disagree. That's what `verify:parity` exists
to prevent. The frontend keeps computing its own for rendering; both sides apply the same rules.

**"What happens if someone completes a checkpoint in a module they aren't currently in?"**
The active pointer moves to that module, same as the frontend. A checkpoint's state depends on the
prerequisite graph, not on where the learner is standing — the parallel Pattern Meadows modules are
all enterable at once, and that was a real frontend bug once.

**"Why store XP as a number at all if the ledger has it?"**
Reading a total shouldn't require summing a ledger. The ledger is the audit trail and the guard;
the stored number is the answer. `verify:ledger` is what keeps them honest.

**"Is the transaction doing the real work?"**
No — the unique index is. The transaction stops a half-applied write; the index stops a duplicate
one. That's deliberate, because the transaction is the part that degrades on a deployment without a
replica set, and the guarantee shouldn't degrade with it.

**"Can a client send someone else's userId?"**
There is no `userId` field on any of these endpoints. Identity comes from the verified token.
`/me/attempts` accepts a `moduleId` and ignores it too — the curriculum says where a checkpoint
lives, not the request body.

## What's deliberately not done

- **No frontend changes.** Day 3 writes `ApiProgressRepository`; the app still uses localStorage today.
- **No tests.** `npm test` passes with none; Day 7.2 owns the Vitest suite. The three verify
  commands are the stand-in, and two of them need no server.
- **No life regeneration.** `lives` decrements on a failed submit (Day 4) and floors at 0. Nothing
  refills it, because the frontend has no such rule to match.
- **No notes, no code execution, no recommendations.** Days 3, 4 and 5.

---

# Part 2 — Manual verification

Everything below is something you can run. Nothing here needs the frontend.

## 0. Before you start

```bash
cd backend
cp .env.example .env        # MONGO_URI + the two JWT secrets, if you have not already
npm install
npm run seed:curriculum     # writes the curriculum snapshot
npm run dev                 # terminal 1
```

```bash
export BASE=http://localhost:4883/api/v1
export ACCESS=$(curl -sX POST $BASE/auth/register -H 'content-type: application/json' \
  -d '{"email":"reviewer@example.com","password":"correct-horse-battery","displayName":"Reviewer"}' \
  | jq -r .data.accessToken)
```

The boot log tells you the curriculum loaded:

```
curriculum: loaded    courseId: "dsa-foundations"  version: "2026-09-20"  zones: 7  modules: 29  checkpoints: 107
```

If you skipped the seeder it says so instead, and every learning endpoint returns 404 with a message
naming the command. The server still boots, and auth and health still work.

## 1. The seeder stores structure, not content

```bash
npm run seed:curriculum -- --dry-run
```

Then look at what actually landed, in the Atlas UI or a shell:

```javascript
db.curriculumSnapshots.findOne({ isActive: true }, { checkpoints: { $slice: 2 }, zones: 0, modules: 0 })
```

```jsonc
{
  "courseId": "dsa-foundations", "version": "2026-09-20", "isActive": true,
  "frontendCommit": "712096a…", "structureHash": "751a6c15…",
  "checkpoints": [
    { "id": "foundations-1", "moduleId": "foundations", "order": 1, "type": "lesson",
      "xp": 30, "masteryXp": null, "prerequisites": [], "hasCodingActivity": false },
    { "id": "foundations-2", "moduleId": "foundations", "order": 2, "type": "lesson",
      "xp": 30, "masteryXp": null, "prerequisites": ["foundations-1"], "hasCodingActivity": true }
  ]
}
```

No `title` on a checkpoint, no theory, no questions, no starter code. Zones and modules carry one
short title each, because the lock message needs a name a learner recognises.

To check the rule is enforced rather than merely followed, add a field to the draft in
`scripts/lib/buildSnapshot.ts` and run the dry run again — it refuses:

```
Refusing to seed — the snapshot is not structure-only:
  - checkpoint "foundations-1" carries a disallowed field "…"
```

## 2. A fresh learner starts where you would expect

```bash
curl -s $BASE/me/courses/dsa-foundations/state -H "authorization: Bearer $ACCESS" | jq '.data.progress'
```

`xp: 0`, `lives: 3`, `streak: 0`, nothing completed, pointer at `foundations-1`. The document was
created by that read — check `db.courseProgress.countDocuments()` before and after if you like.

Note what is **not** imported: the frontend's demo bootstrap (Foundations, Linked Lists and
Recursion pre-completed, 1240 XP) is presentation data and never reaches the database.

## 3. The checks that actually matter

### 3.1 Five completions, one reward

```bash
for n in 1 2 3 4 5; do
  curl -s -X POST $BASE/me/checkpoints/foundations-1/complete -H "authorization: Bearer $ACCESS" \
    -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' \
  | jq -c '{n:'"$n"', already:.data.alreadyCompleted, awarded:.data.rewards.xpAwarded, xp:.data.progress.xp}'
done
```

```
{"n":1,"already":false,"awarded":30,"xp":30}
{"n":2,"already":true,"awarded":0,"xp":30}
{"n":3,"already":true,"awarded":0,"xp":30}
{"n":4,"already":true,"awarded":0,"xp":30}
{"n":5,"already":true,"awarded":0,"xp":30}
```

All five are `200`. "Already completed" is a state, not an error — the contract is explicit about
that, and a client retrying after a timeout must not see a failure.

### 3.2 Ten at once, one reward

```bash
for n in $(seq 1 10); do
  curl -s -X POST $BASE/me/checkpoints/foundations-2/complete -H "authorization: Bearer $ACCESS" \
    -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' -o /tmp/par_$n.json &
done; wait
jq -c '{already:.data.alreadyCompleted, xp:.data.progress.xp}' /tmp/par_*.json | sort | uniq -c
```

Exactly one `"already":false`. Then confirm the database, not just the responses:

```javascript
db.rewardEvents.countDocuments({ eventKey: "complete:foundations-2" })   // → 1
```

### 3.3 Locked stays locked, three ways

```bash
# start a locked module
curl -s -X POST $BASE/me/modules/graphs/start -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' | jq .error.code
# → "MODULE_LOCKED"

# point at a locked checkpoint
curl -s -X PUT $BASE/me/courses/dsa-foundations/active -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"checkpointId":"summit-1"}' | jq .error.code
# → "CHECKPOINT_LOCKED"

# complete a locked checkpoint
curl -s -X POST $BASE/me/checkpoints/trees-1/complete -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' | jq .error.details
# → { "checkpointId": "trees-1", "missingPrerequisites": ["recursion-5"] }
```

One rule, three doors. All three read the same stored graph.

### 3.4 The reward comes from the curriculum

Complete `foundations-3`, `foundations-4`, then `foundations-5`:

```bash
curl -s -X POST $BASE/me/checkpoints/foundations-5/complete -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations","source":"submit"}' \
  | jq '.data | {rewards, mastered:.progress.masteredCheckpointIds, xp:.progress.xp, unlocked}'
```

`xpAwarded: 140` — the checkpoint's 40 plus its 100-point mastery bonus, both read from the
snapshot. Total XP 270 = 30+30+30+40+40+100. Cross-check against the ledger:

```javascript
db.rewardEvents.find({ courseId: "dsa-foundations" }, { eventKey: 1, xpDelta: 1, _id: 0 })
```

### 3.5 Review costs nothing

```bash
curl -s -X POST $BASE/me/checkpoints/foundations-3/complete -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' -d '{"courseId":"dsa-foundations"}' \
  | jq '.data | {already:.alreadyCompleted, awarded:.rewards.xpAwarded, xp:.progress.xp}'
```

`{"already":true,"awarded":0,"xp":270}`. A learner re-reading a finished module is the same code
path as a retry, by design.

### 3.6 The body cannot tell the server anything about identity or structure

```bash
curl -s -X POST $BASE/me/attempts -H "authorization: Bearer $ACCESS" -H 'content-type: application/json' \
  -d '{"courseId":"dsa-foundations","checkpointId":"arrays-strings-1","moduleId":"trees",
       "activityId":"arrays-strings-1-quick-check","attemptType":"quick-check","passed":true}'
```

```javascript
db.learningAttempts.findOne({}, { moduleId: 1, checkpointId: 1, _id: 0 })
// → { moduleId: "arrays-strings", checkpointId: "arrays-strings-1" }
```

The body said `trees`. The curriculum said `arrays-strings`. The curriculum won. There is no
`userId` field to try in the first place.

### 3.7 Two learners, two worlds

Register a second account and read its state: `xp: 0`, nothing completed, Foundations `current`.
Nothing the first account did is visible. Every query in `learning.service.ts` filters on the
`userId` from the token — the full cross-account sweep is Day 6.4's job, but the filter is in place
now.

## 4. Check the engines agree

```bash
npm run verify:parity
```

This is the check to run if you only run one. It imports `src/learning/progressEngine.ts` — the
real frontend file — and the backend port, and compares them over 49 progress snapshots.

To convince yourself it would actually catch a drift, break something on purpose: in
`backend/src/modules/learning/progress.engine.ts`, change `resolveModuleState`'s

```ts
if (states[0] === "locked") return "locked";
```

to `return "available"`, and run it again. It fails, names the scenario and the module, and prints
what each side said. Put it back.

## 5. Check the database reconciles

```bash
npm run verify:ledger
```

Read-only, and it covers every user in the database, not just yours. A failure here means stored XP
and the ledger have diverged — which should be impossible, which is exactly why it is worth
checking.

## 6. Or run all of it at once

```bash
npm run verify:day2
```

67 assertions across two fresh accounts, ending with the parity and ledger suites. Expect:

```
Result
  67 passed
```

If you get a `429`, the auth limiter is doing its job — it allows 10 registrations per 15 minutes
per IP and the counter is in memory, so restarting the server resets it.

## Verification summary

| Claim | How to check it | Status |
|---|---|---|
| Curriculum is structure-only, 7/29/107 | `npm run seed:curriculum -- --dry-run` | ✅ |
| Fresh learner starts at 0 XP / 3 lives / 0 streak | §2 | ✅ |
| Five completions award once | §3.1 | ✅ |
| Ten parallel completions award once, one ledger row | §3.2 | ✅ |
| Locked stays locked at all three doors | §3.3 | ✅ |
| Reward and mastery bonus come from the curriculum | §3.4 | ✅ |
| Review awards nothing | §3.5 | ✅ |
| Body `moduleId` ignored; no `userId` accepted anywhere | §3.6 | ✅ |
| One learner cannot see another's progress | §3.7 | ✅ |
| Derived states identical to `progressEngine.ts` | `npm run verify:parity` — 16,005 comparisons | ✅ |
| Stored XP reconciles with the ledger | `npm run verify:ledger` | ✅ |
| All of the above, unattended | `npm run verify:day2` — 67/67 | ✅ |

**Known divergence, deliberate:** the streak's date arithmetic is UTC on the server and
local-timezone in `progressEngine.recordActivity`, which differs on DST fall-back days. The server
is correct and is the authority; `verify:parity` prints the affected dates. Day 3's adapter stops
the browser computing it at all.
