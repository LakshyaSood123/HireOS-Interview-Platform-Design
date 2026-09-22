# Day 3 — Demo Notes and Manual Verification

Day 3 put the app on the API: progress and notes now live in the learner's account, not in one
browser — and not one screen was redesigned to get there. This document has two halves:

- **[Part 1 — Presentation notes](#part-1--presentation-notes)**, the running order for the demo.
- **[Part 2 — Manual verification](#part-2--manual-verification)**, for a reviewer who wants to
  check the claims rather than take them on trust.

Checkpoint definitions live in [05-DAY-WISE-CHECKPOINTS.md](./05-DAY-WISE-CHECKPOINTS.md).

---

# Part 1 — Presentation notes

## The framing (30 seconds)

> Day 1 made the server the authority on *who you are*. Day 2 made it the authority on *what you've
> done*. Day 3 is the day the app starts asking it. Your progress and your notes now belong to your
> account: log in on another laptop and they are there.

The constraint that shaped everything: the frontend's lesson screens, map and Notes panel stay
exactly as they are. The backend fits behind the interfaces the frontend already had.

## What shipped

| | |
|---|---|
| Endpoints | `GET /me/notes` · `PUT /me/notes/{noteId}` · `DELETE /me/notes/{noteId}` |
| Collection | `notes` — several per lesson, keyed by the note's own id |
| Frontend | `ApiProgressRepository` · `ApiNotesRepository` · an API client with a persistent outbox · a session that picks the repositories at boot |
| Verification | 43 API checks · 63 checks on the real frontend adapters · one real Chrome run through the UI |

## Before the demo

```bash
cd backend && npm run dev     # the API, on 4883
npm run dev                   # the app, from the repository root, on 8443 — proxies /api/v1 to the API
```

Two browsers: your usual one and a second one (another browser, or a private window). Open
DevTools in both; everything below runs in the console.

**Know this before you click.** The world map draws a fixed picture of the demo story —
`BiomeTrailMap.tsx` hardcodes its module statuses — so on a real account it still says
Foundations is completed and Trees is current. The HUD, the roadmaps and the lessons are real. To
reach Foundations: the 🌱 button at the bottom of the map, then **Review Lessons ↺**.

## Demo running order

About eight minutes. Sections 3 and 4 are the ones worth the time.

### 1. Signed out, nothing changed (~40s)

Open the app. DevTools → Network → filter `api/v1`.

> "This is the app you already know — Trees current, 1,240 XP, the demo learner. And the Network
> tab is empty: signed out, the app never talks to the backend. Nothing about the signed-out
> experience moved."

### 2. Sign in (~1 min)

```js
await reagvis.register("you@example.com", "correct-horse-battery")
```

The page reloads. The HUD now reads **0 XP, 0-day streak**.

> "That's a real account, and it starts at Foundations with nothing. The 1,240 XP was demo data —
> the backend has refused to store it since Day 2, and it still does. There's no sign-in screen yet;
> screens are the frontend's to design, so the console calls the same functions one will."

### 3. Complete two checkpoints, write a note (~2 min)

🌱 → **Review Lessons ↺** → **Big-O & Cost of Operations** → *Mark quick check reviewed and
continue* → **Complete Checkpoint** → **Continue ➔**. On *Reading Constraints*, open **Notes**,
write one, **Save Note**, close it, then complete this checkpoint the same way.

HUD: **60 XP, 1-day streak**. Then:

```js
reagvis.status()     // { mode: "api", …, unsent: { progress: 0, notes: 0 } }
```

> "The browser didn't send '60 XP'. It sent 'completed foundations-1' and 'completed
> foundations-2', and the server worked out 60 from the curriculum — through the same ledger that
> makes a double-click award once. The browser never tells the server what it's worth."

### 4. A different browser (~2 min)

```js
await reagvis.logout()                                          // browser one
await reagvis.login("you@example.com", "correct-horse-battery") // browser two
```

Browser two: HUD **60 XP, 1-day streak**. 🌱 → **Review Lessons ↺** → ✓ ✓ on the first two
checkpoints. Open *Reading Constraints* → **Notes** — the note is there.

> "Same account, different browser, same progress, same note. And logging out in the first browser
> left nothing of me behind in it."

### 5. Pull the plug (~1 min)

Stop the API (Ctrl-C in its terminal). Reload browser two.

> "The app still runs — on my last synced progress, with a console line saying the API is down."

Complete *Problem-Solving Pattern*. Then `reagvis.status()` → `unsent: { progress: 1 }`. Start the
API again and run `await reagvis.sync()` → `unsent: 0`.

> "An outage isn't data loss. The change waited in the browser and went through when the server
> came back — and because every call is idempotent, sending it twice couldn't award twice."

### 6. The proof that needs no browser (~1 min)

```bash
npm run verify:day3
```

```
  PASS src/learning's real adapters pass every scenario             0
       63 passed — two browsers, import, offline, renewal
  PASS every point of XP traces to a ledger row                     0
Result
  43 passed
```

> "That runs the real frontend adapter files — not a copy — against this API, with each 'browser'
> its own storage. Two-browser round trip, first-sign-in import, stale copies, the demo bootstrap,
> offline and back, token renewal. And the ledger still reconciles afterwards."

## Questions to expect

**"Why did none of my demo progress come across when I signed in?"**
Because it was never yours. The demo bootstrap pre-completes Foundations, Linked Lists and
Recursion, and every signed-out snapshot today's app makes is built on it. Those fifteen
checkpoints are presentation data and never reach an account, and anything reachable only through
them — Trees, for instance — would be refused by the server's locks anyway. Progress that is really
yours imports on first sign-in, once.

**"Why does the world map say three modules are done on a brand-new account?"**
The map component hardcodes its statuses to the demo story and never reads real progress, although
the state it needs has been available to it for a while. Changing it is a component change, so it
is the frontend owner's. Everything else on screen is real.

**"Why not just send the whole progress object to the server?"**
Then the server would be trusting the browser's XP. The adapter still receives the whole object
after every change, as it always did, but it sends only what the learner *did* — "completed
foundations-2" — and the server applies its own rules to that.

**"What if two tabs are open?"**
Both write through the same idempotent API, so nothing double-counts. Token renewal is serialised
across tabs with a Web Lock, because the server treats a reused refresh token as theft and would
sign you out everywhere. Each tab shows what it last loaded; a reload shows the server's truth.

**"Is a note private?"**
Every query carries the user id from the token. Ask for someone else's note id and you get `404`,
not `403` — the API never confirms that it exists. Note text never reaches a log line.

**"What happens to a life I lose?"**
Nothing records a failed submit on the server until Day 4's `/code/submit`, so for now a lost life
lives only in that tab and comes back on reload. XP, progress and notes are all server-side already.

## What's deliberately not done

- **No sign-in screen.** The frontend designs it; it will call `learnerSession.ts` like the console does.
- **No change to the world map.** It still draws the demo story; wiring it to real state is the frontend's.
- **Lives are not sent.** Day 4.
- **No automated tests in `npm test`.** Day 7; the verify commands stand in.
- **No per-user storage bounds** on notes or attempts beyond the rate limit and the size cap. Day 6.

---

# Part 2 — Manual verification

## 0. Before you start

```bash
cd backend
npm run dev                  # terminal 1 — the API on 4883
cd .. && npm run dev         # terminal 2 — the app on 8443, proxying /api/v1 to 4883
```

```bash
export BASE=http://localhost:4883/api/v1
reg() { curl -sX POST $BASE/auth/register -H 'content-type: application/json' \
  -d "{\"email\":\"$1\",\"password\":\"correct-horse-battery\",\"displayName\":\"Reviewer\"}" | jq -r .data.accessToken; }
A=$(reg reviewer-a@example.com); B=$(reg reviewer-b@example.com)
```

The auth limiter allows 10 sign-ins per 15 minutes per IP. Restarting the API resets it.

## 1. Notes: several per lesson, upserted by id

```bash
note() { curl -sX PUT $BASE/me/notes/$2 -H "authorization: Bearer $1" -H 'content-type: application/json' -d "$3"; }

note $A note-1 '{"courseId":"dsa-foundations","moduleId":"graphs","lessonId":"trees-3","text":"Inorder = left, node, right."}' | jq .data
```

```jsonc
{ "id": "note-1", "courseId": "dsa-foundations", "moduleId": "trees", "lessonId": "trees-3",
  "text": "Inorder = left, node, right.", "createdAt": "…", "updatedAt": "…" }
```

The body said `graphs`; the curriculum says `trees-3` is in `trees`. The curriculum won.

```bash
note $A note-1 '{"courseId":"dsa-foundations","lessonId":"trees-3","text":"Edited."}' >/dev/null   # same id: replaced
note $A note-2 '{"courseId":"dsa-foundations","lessonId":"trees-3","text":"A second note."}' >/dev/null
curl -s "$BASE/me/notes?courseId=dsa-foundations" -H "authorization: Bearer $A" | jq -c '[.data[] | {id, text}]'
# → [{"id":"note-1","text":"Edited."},{"id":"note-2","text":"A second note."}]
```

Two notes on one lesson, and saving `note-1` twice left one `note-1`. Ten parallel saves of a
new id also leave one — `verify-day3.sh` does exactly that.

**Pagination.** `…&limit=1` returns one note and a `meta.nextCursor`; pass it back as `&cursor=…`
for the next page. The last page has `nextCursor: null`.

## 2. One learner cannot touch another's notes

```bash
curl -s "$BASE/me/notes?courseId=dsa-foundations" -H "authorization: Bearer $B" | jq '.data | length'   # → 0
curl -s -o /dev/null -w '%{http_code}\n' -X DELETE $BASE/me/notes/note-1 -H "authorization: Bearer $B"  # → 404
note $B note-1 '{"courseId":"dsa-foundations","text":"B'"'"'s own."}' | jq -r .data.text                  # → B's own.
```

B's `note-1` is B's own note; A's is untouched. Ids are minted by clients, so they are only unique
per user — which is fine, because every query carries the user from the token.

## 3. Signed out is exactly the old app

Open <http://localhost:8443>. The HUD reads 1,240 XP and Trees is current — the demo bootstrap.
DevTools → Network, filter `api/v1`: **no requests**. In the console:

```js
reagvis.status()   // { mode: "local", user: null, … }
```

## 4. The Day 3 test, by hand

In browser one's console:

```js
await reagvis.register("day3-review@example.com", "correct-horse-battery")
```

After the reload the HUD reads **0 XP** — the account, not the demo. Then:

1. 🌱 (bottom of the map) → **Review Lessons ↺** → **Big-O & Cost of Operations** → *Mark quick
   check reviewed and continue* → **Complete Checkpoint** → **Continue ➔**.
2. **Notes** → write something → **Save Note** → ✕.
3. *Mark quick check reviewed and continue* → **Complete Checkpoint**. HUD: **60**.
4. `await reagvis.logout()`. After the reload, check nothing of the account is left behind:

   ```js
   Object.keys(localStorage).filter(k => k.startsWith("reagvis.api.") || k === "reagvis.session")   // → []
   ```

In **a different browser**:

```js
await reagvis.login("day3-review@example.com", "correct-horse-battery")
```

HUD **60 XP, 1d**; 🌱 → **Review Lessons ↺** shows ✓ ✓; *Reading Constraints* → **Notes** shows the
note.

## 5. The import path

The app writes the demo bootstrap over any signed-out progress that lacks `recursion-5` on every
signed-out load. So set the snapshot and sign in **without reloading in between**. Signed out, in
the console:

```js
localStorage.setItem("reagvis.progress.dsa-foundations", JSON.stringify({
  activeCourseId: "dsa-foundations", activeZoneId: "basecamp", activeModuleId: "foundations",
  activeCheckpointId: "foundations-4",
  completedCheckpointIds: ["foundations-1", "foundations-2", "foundations-3"], masteredCheckpointIds: [],
  xp: 999, streak: 9, lives: 3, lastActivityDate: "2026-09-01" }))
await reagvis.register("day3-import@example.com", "correct-horse-battery")
```

After the reload the console says `Imported this browser's progress into dsa-foundations:
["foundations-1","foundations-2","foundations-3"]`. The HUD reads **90**, not 999, and the streak
reads **1**, not 9: the server re-derived both. The ledger says where they came from:

```javascript
db.rewardEvents.find({ source: "import" }, { eventKey: 1, xpDelta: 1, _id: 0 })
```

Reload again: nothing more is imported. The signed-out copy was cleared.

**The demo bootstrap is not imported.** `reagvis.logout()`, and let the signed-out app load once —
it writes the demo bootstrap to `localStorage`. Then `reagvis.register("day3-demo@example.com", …)`.
The console says `Not imported — demo data, not your work: 15 demo bootstrap checkpoints.` The HUD
reads **0**.

**Existing progress is never overwritten.** `reagvis.logout()`, set a stale snapshot as above —
say `completedCheckpointIds: ["foundations-1", "foundations-3"]`, which the account does not have —
then `reagvis.login("day3-review@example.com", …)` (the account from §4). The console says the
account already has progress and the local copy was cleared. The HUD still reads **60**, and
`foundations-3` is still not completed on the roadmap.

## 6. With the API stopped

Signed in, stop the API and reload. The app renders; the console warns that the API is unavailable
and that it is showing your last synced progress. Complete a checkpoint, then:

```js
reagvis.status()      // unsent: { progress: 1, notes: 0 }
```

Start the API again:

```js
await reagvis.sync()  // { progress: 0, notes: 0 }
```

Check with curl — the completion is on the server.

## 7. No UI component moved

```bash
git diff d997026 --stat -- src vite.config.ts
```

Four adapter files under `src/learning/`, three wiring sites (`main.tsx`, `AppStateContext.tsx`,
`ReagvisTrailPage.tsx` — a few lines each), and the dev proxy. Read the last three: nothing in them
renders differently. `05-DAY-WISE-CHECKPOINTS.md` explains why each one had to move.

## 8. Or run all of it at once

```bash
npm run verify:day3
```

```
Result
  43 passed
```

## Verification summary

| Claim | How to check it | Status |
|---|---|---|
| Several notes per lesson; saving twice is one note | §1 | ✅ |
| Notes are paginated | §1 | ✅ |
| One learner cannot read or delete another's notes — `404`, never `403` | §2 | ✅ |
| Signed out, the app is unchanged and makes no request | §3 | ✅ |
| Same account, different browser: same XP, progress and note | §4 | ✅ |
| Logging out leaves nothing of the learner in the browser | §4 | ✅ |
| A returning learner's own progress imports once, re-derived by the server | §5 | ✅ |
| The demo bootstrap is never imported | §5 | ✅ |
| Existing server progress is never overwritten by a stale local copy | §5 | ✅ |
| With the API stopped the app runs, and changes wait for it | §6 | ✅ |
| No UI component changed | §7 | ✅ |
| All of the above, unattended | `npm run verify:day3` — 43/43, with 63/63 adapter checks inside | ✅ |
