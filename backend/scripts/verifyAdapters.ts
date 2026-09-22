/**
 * Checkpoints 3.3–3.6 — the frontend adapters, against a running API.
 *
 *   npm run dev               # terminal 1
 *   npm run verify:adapters   # terminal 2
 *
 * This loads the REAL frontend files — src/learning/services/apiClient.ts,
 * learnerSession.ts, notesRepository.ts and src/learning/progressRepository.ts —
 * and drives them the way the app does: load once and save after every change
 * the way AppStateContext does, completing checkpoints through the frontend's
 * own progressEngine, and saving notes the way NotesPanel builds them.
 *
 * Each "browser" is its own in-memory Storage. "Log in on a different
 * browser" is literal here: the two share nothing but the API.
 *
 * Uses 5 of the 10 sign-ins per 15 minutes the auth limiter allows an IP.
 */

import { ApiClient, forgetLearner, SessionExpiredError } from "../../src/learning/services/apiClient";
import { startLearnerSession, type LearnerSessionOutcome } from "../../src/learning/services/learnerSession";
import {
  DEMO_BOOTSTRAP_CHECKPOINT_IDS,
  LocalProgressRepository,
  migrateLegacyCheckpointIds,
  planImport,
} from "../../src/learning/progressRepository";
import { LocalNotesRepository, type NoteRecord } from "../../src/learning/services/notesRepository";
import {
  completeCheckpoint,
  recordFailedSubmit,
  resolveCheckpointState,
  type LearnerProgressState,
} from "../../src/learning/progressEngine";
import { coursesById, findCheckpoint } from "../../src/learning/courseRegistry";

const BASE = process.env.BASE ?? "http://localhost:4883/api/v1";
const DEAD = "http://127.0.0.1:9/api/v1"; // nothing listens on port 9
const COURSE = "dsa-foundations";
const PASSWORD = "correct-horse-battery";
const STAMP = Date.now();
const course = coursesById[COURSE]!;
const today = () => new Date().toISOString().slice(0, 10);

// ── output ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

const hr = (title: string) => console.log(`\n\x1b[1m${title}\x1b[0m`);
const note = (text: string) => console.log(`       \x1b[2m${text}\x1b[0m`);
const brief = (value: string) => (value.length > 70 ? `${value.slice(0, 67)}...` : value);

function check(label: string, expected: unknown, actual: unknown): void {
  const want = JSON.stringify(expected);
  const got = JSON.stringify(actual);
  if (want === got) {
    passed += 1;
    console.log(`  \x1b[32mPASS\x1b[0m ${label.padEnd(62)} ${brief(got ?? "undefined")}`);
  } else {
    failed += 1;
    console.log(`  \x1b[31mFAIL\x1b[0m ${label.padEnd(62)} expected ${brief(want ?? "undefined")} got ${brief(got ?? "undefined")}`);
  }
}

// ── a browser ──────────────────────────────────────────────────────────────

/** `localStorage`, for one simulated browser. */
class MemoryStorage {
  private readonly entries = new Map<string, string>();
  get length(): number {
    return this.entries.size;
  }
  key(index: number): string | null {
    return [...this.entries.keys()][index] ?? null;
  }
  getItem(key: string): string | null {
    return this.entries.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.entries.set(key, String(value));
  }
  removeItem(key: string): void {
    this.entries.delete(key);
  }
  clear(): void {
    this.entries.clear();
  }
  keys(): string[] {
    return [...this.entries.keys()];
  }
}

interface Browser {
  storage: MemoryStorage;
  client: ApiClient;
  /** Every request this browser's client sent. */
  requests: number;
}

function openBrowser(baseUrl = BASE, storage = new MemoryStorage()): Browser {
  const browser = { storage, requests: 0 } as Browser;
  browser.client = new ApiClient({
    storage: storage as never,
    baseUrl,
    fetch: (input, init) => {
      browser.requests += 1;
      return fetch(input, init);
    },
  });
  return browser;
}

/** The signed-out repositories read the global `localStorage`, as in a browser. */
function inside(browser: Browser): void {
  (globalThis as { localStorage?: unknown }).localStorage = browser.storage;
}

/** What main.tsx does before the first render. */
async function boot(browser: Browser): Promise<LearnerSessionOutcome> {
  inside(browser);
  return startLearnerSession({
    client: browser.client,
    storage: browser.storage as never,
    courseIds: [COURSE],
    local: { progress: new LocalProgressRepository(), notes: new LocalNotesRepository() },
  });
}

/** `buildDemoLearnerBootstrap` from AppStateContext.tsx. */
function demoBootstrap(): LearnerProgressState {
  return {
    activeCourseId: COURSE,
    activeZoneId: "recursive-forest",
    activeModuleId: "trees",
    activeCheckpointId: "trees-1",
    completedCheckpointIds: [...DEMO_BOOTSTRAP_CHECKPOINT_IDS],
    masteredCheckpointIds: [],
    xp: 1240,
    streak: 7,
    lives: 3,
    lastActivityDate: null,
  };
}

let lastNoteStamp = 0;

/** The app as the learner uses it: AppStateContext's progress plus NotesPanel. */
class App {
  progress: LearnerProgressState;

  constructor(private readonly session: LearnerSessionOutcome) {
    // AppStateContext's first render, line for line.
    const loaded = session.progress.load(COURSE);
    const signedIn = session.mode !== "local";
    if (loaded && signedIn) this.progress = loaded;
    else if (loaded && (!loaded.activeCheckpointId || !loaded.completedCheckpointIds.includes("recursion-5"))) {
      this.progress = demoBootstrap();
    } else this.progress = loaded ?? demoBootstrap();
    session.progress.save(this.progress); // the mount effect
  }

  /** `completeCheckpointById`. */
  complete(checkpointId: string): boolean {
    const checkpoint = findCheckpoint(course, checkpointId);
    if (!checkpoint) return false;
    const state = resolveCheckpointState(checkpoint, this.progress);
    if (state !== "available" && state !== "current") return false;
    this.progress = completeCheckpoint(course, this.progress, checkpointId, today());
    this.session.progress.save(this.progress);
    return true;
  }

  /** `failCheckpointAttempt`. */
  failSubmit(): void {
    this.progress = recordFailedSubmit(this.progress);
    this.session.progress.save(this.progress);
  }

  /** NotesPanel's `handleSave`. */
  writeNote(lessonId: string, text: string, editingId?: string): NoteRecord {
    const stamp = Math.max(Date.now(), lastNoteStamp + 1);
    lastNoteStamp = stamp;
    const record: NoteRecord = {
      id: editingId ?? `note-${stamp}`,
      courseId: COURSE,
      moduleId: findCheckpoint(course, lessonId) ? lessonId.replace(/-\d+$/, "") : undefined,
      lessonId,
      text: text.trim(),
      updatedAt: new Date().toISOString(),
    };
    this.session.notes.save(record);
    return record;
  }

  /** What NotesPanel lists for a lesson. */
  notes(lessonId: string): NoteRecord[] {
    return this.session.notes.list(COURSE).filter((entry) => entry.lessonId === lessonId);
  }

  /** Waits for everything queued to reach the server (or fail to). */
  async settle(): Promise<void> {
    await Promise.all([this.session.account?.progress.flush(), this.session.account?.notes.flush()]);
  }
}

/** `reagvis.logout()`, minus the reload. */
async function signOut(browser: Browser, session: LearnerSessionOutcome): Promise<void> {
  const userId = browser.client.session()?.user.id;
  if (session.account) {
    await Promise.all([session.account.progress.flush(), session.account.notes.flush()]);
    session.account.progress.stop();
    session.account.notes.stop();
  }
  await browser.client.signOut();
  if (userId) forgetLearner(browser.storage as never, userId);
}

function done(session: LearnerSessionOutcome): void {
  session.account?.progress.stop();
  session.account?.notes.stop();
}

async function serverState(client: ApiClient): Promise<LearnerProgressState> {
  const { data } = await client.request<{ progress: LearnerProgressState }>("GET", `/me/courses/${COURSE}/state`);
  return data.progress;
}

async function serverNotes(client: ApiClient): Promise<{ id: string; text: string; lessonId: string | null }[]> {
  const { data } = await client.request<{ id: string; text: string; lessonId: string | null }[]>(
    "GET",
    `/me/notes?courseId=${COURSE}`,
  );
  return data;
}

function progressFor(partial: Partial<LearnerProgressState>): LearnerProgressState {
  return {
    activeCourseId: COURSE,
    activeZoneId: "basecamp",
    activeModuleId: "foundations",
    activeCheckpointId: "foundations-1",
    completedCheckpointIds: [],
    masteredCheckpointIds: [],
    xp: 0,
    streak: 0,
    lives: 3,
    lastActivityDate: null,
    ...partial,
  };
}

// ── run ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const health = await fetch(`${BASE}/health`).catch(() => null);
  if (!health?.ok) {
    console.log(`No server at ${BASE} — start it with 'npm run dev'.`);
    process.exit(2);
  }

  // ── 3.3 / 3.4 ────────────────────────────────────────────────────────────

  hr("3.3 / 3.4  Log in, complete two checkpoints, write a note, log out");
  const xEmail = `day3x+${STAMP}@example.com`;
  const a = openBrowser();
  await a.client.register(xEmail, PASSWORD, "Day3 X");
  const xId = a.client.session()!.user.id;

  const onA = await boot(a);
  check("browser A boots signed in, on the API", "api", onA.mode);
  const appA = new App(onA);
  check(
    "it shows the account's own fresh state, not the demo bootstrap",
    { xp: 0, completed: 0, at: "foundations-1" },
    { xp: appA.progress.xp, completed: appA.progress.completedCheckpointIds.length, at: appA.progress.activeCheckpointId },
  );

  check("complete foundations-1", true, appA.complete("foundations-1"));
  check("complete foundations-2", true, appA.complete("foundations-2"));
  const first = appA.writeNote("foundations-2", "Big-O describes growth, not speed.");
  appA.writeNote("foundations-2", "Drop the constants: O(2n) is O(n).");
  appA.writeNote("foundations-2", "Big-O describes growth — not speed.", first.id); // Edit → Update Note
  check("the Notes panel holds two notes on one lesson", 2, appA.notes("foundations-2").length);

  await appA.settle();
  check(
    "everything reached the server",
    { progress: 0, notes: 0 },
    { progress: onA.account!.progress.pendingCount(), notes: onA.account!.notes.pendingCount() },
  );

  const serverX = await serverState(a.client);
  check("the server holds both completions", ["foundations-1", "foundations-2"], serverX.completedCheckpointIds);
  check("and computed the XP itself", 60, serverX.xp);
  check("two notes on the server, not one overwriting the other", 2, (await serverNotes(a.client)).length);

  const seenOnA = {
    xp: appA.progress.xp,
    streak: appA.progress.streak,
    lives: appA.progress.lives,
    completed: appA.progress.completedCheckpointIds,
    at: appA.progress.activeCheckpointId,
    notes: appA.notes("foundations-2").map((entry) => [entry.id, entry.text]),
  };

  await signOut(a, onA);
  check("logging out leaves nothing of the learner in browser A", [], a.storage.keys().filter((key) => key.includes(xId)));
  check("and no session", null, a.client.session());

  hr("3.3 / 3.4  …log in on a different browser");
  const b = openBrowser();
  await b.client.signIn(xEmail, PASSWORD);
  const onB = await boot(b);
  check("browser B boots signed in, on the API", "api", onB.mode);
  const appB = new App(onB);
  check("the same XP", seenOnA.xp, appB.progress.xp);
  check("the same completed checkpoints", seenOnA.completed, appB.progress.completedCheckpointIds);
  check("the same place in the course", seenOnA.at, appB.progress.activeCheckpointId);
  check("the same streak and lives", [seenOnA.streak, seenOnA.lives], [appB.progress.streak, appB.progress.lives]);
  check("the same notes — ids, edited text and order", seenOnA.notes, appB.notes("foundations-2").map((entry) => [entry.id, entry.text]));

  hr("3.4  Deleting a note");
  const [doomed] = appB.notes("foundations-2");
  onB.notes.delete(doomed!.id);
  check("it leaves the panel at once", 1, appB.notes("foundations-2").length);
  await appB.settle();
  check("and the server", 1, (await serverNotes(b.client)).length);
  onB.notes.delete(doomed!.id); // a double-click
  await appB.settle();
  check("deleting it again is harmless — nothing stuck in the queue", 0, onB.account!.notes.pendingCount());

  // ── 3.5 ──────────────────────────────────────────────────────────────────

  hr("3.5  A returning learner's own progress uploads once");
  const c = openBrowser();
  inside(c);
  new LocalProgressRepository().save(
    progressFor({
      activeCheckpointId: "foundations-4",
      completedCheckpointIds: ["foundations-1", "foundations-2", "foundations-3"],
      xp: 999,
      streak: 9,
      lastActivityDate: "2026-09-01",
    }),
  );
  new LocalNotesRepository().save({
    id: "note-1726000000000",
    courseId: COURSE,
    moduleId: "foundations",
    lessonId: "foundations-3",
    text: "Written while signed out.",
    updatedAt: "2026-09-01T10:00:00.000Z",
  });

  await c.client.register(`day3y+${STAMP}@example.com`, PASSWORD, "Day3 Y");
  const onC = await boot(c);
  const imported = onC.imports[0]?.progress;
  check("first sign-in imports it", "imported", imported?.outcome);
  check("the learner's three checkpoints, in order", ["foundations-1", "foundations-2", "foundations-3"], imported?.checkpointIds);
  const serverY = await serverState(c.client);
  check("the server now holds them", ["foundations-1", "foundations-2", "foundations-3"], serverY.completedCheckpointIds);
  check("XP is the server's own sum — the browser claimed 999", 90, serverY.xp);
  check("the streak is what the server saw — the browser claimed 9", 1, serverY.streak);
  check("the learner is back where they were", "foundations-4", serverY.activeCheckpointId);
  check("the signed-out note came along", ["note-1726000000000"], (await serverNotes(c.client)).map((entry) => entry.id));
  inside(c);
  check("the browser's signed-out progress is cleared", null, new LocalProgressRepository().load(COURSE));
  check("and its signed-out notes", 0, new LocalNotesRepository().list(COURSE).length);
  done(onC);

  const onC2 = await boot(c);
  check("the next boot imports nothing — it uploaded once", null, onC2.imports[0]?.progress ?? null);
  check("and the account is unchanged", 90, (await serverState(c.client)).xp);
  done(onC2);

  hr("3.5  Server progress is never overwritten by a stale local copy");
  const e = openBrowser();
  inside(e);
  new LocalProgressRepository().save(
    progressFor({
      activeCheckpointId: "foundations-4",
      completedCheckpointIds: ["foundations-1", "foundations-2", "foundations-3"],
      xp: 90,
    }),
  );
  await e.client.signIn(xEmail, PASSWORD);
  const beforeE = await serverState(e.client);
  const onE = await boot(e);
  check("the account already has progress — the server wins", "server-has-progress", onE.imports[0]?.progress?.outcome);
  check("its progress is exactly what it was", beforeE, await serverState(e.client));
  inside(e);
  check("the stale copy is cleared, not merged", null, new LocalProgressRepository().load(COURSE));
  done(onE);

  hr("3.5  The demo bootstrap is never imported");
  const f = openBrowser();
  inside(f);
  // Today's app: the demo bootstrap, then a learner who finished trees-1 and trees-2 on top of it.
  const demoPlusWork = ["trees-1", "trees-2"].reduce(
    (state, id) => completeCheckpoint(course, state, id, today()),
    demoBootstrap(),
  );
  new LocalProgressRepository().save(demoPlusWork);
  await f.client.register(`day3z+${STAMP}@example.com`, PASSWORD, "Day3 Z");
  const onF = await boot(f);
  const fromDemo = onF.imports[0]?.progress;
  check("nothing to import", "nothing-to-import", fromDemo?.outcome);
  check("the 15 demo bootstrap checkpoints were set aside", 15, fromDemo?.demoBootstrapIds.length);
  check("work built only on demo data cannot be imported", ["trees-1", "trees-2"], fromDemo?.unreachableIds);
  const serverZ = await serverState(f.client);
  check("the server holds no completions and no XP", [0, 0], [serverZ.completedCheckpointIds.length, serverZ.xp]);
  const appF = new App(onF);
  check("the app shows the account, not the demo", ["foundations-1", 0], [appF.progress.activeCheckpointId, appF.progress.xp]);

  // The app before today's AppStateContext change swapped the demo in on
  // mount and saved it. The adapter refuses that on its own.
  const refusals: unknown[] = [];
  const consoleError = console.error;
  console.error = (...args: unknown[]) => refusals.push(args);
  onF.progress.save(demoBootstrap());
  console.error = consoleError;
  await onF.account!.progress.flush();
  check("a save that completes 15 checkpoints at once is refused", [1, 0], [refusals.length, onF.account!.progress.pendingCount()]);
  check("the account still has no progress", 0, (await serverState(f.client)).completedCheckpointIds.length);
  done(onF);

  hr("3.5  Legacy ids are migrated before the plan is made");
  const legacy = migrateLegacyCheckpointIds(progressFor({ completedCheckpointIds: ["1", "2", "3"], activeCheckpointId: "4" }));
  check("bare '1'-'3' become Foundations", ["foundations-1", "foundations-2", "foundations-3", "foundations-4", "foundations-5"], legacy.completedCheckpointIds);
  const legacyPlan = planImport(COURSE, legacy, progressFor({}));
  check("all five replay, in order", legacy.completedCheckpointIds, legacyPlan.checkpointIds);
  check("and the learner lands where they were", "linked-structures-1", legacyPlan.activeCheckpointId);

  // ── 3.6 ──────────────────────────────────────────────────────────────────

  hr("3.6  With the API stopped, the app still runs");
  const cOffline = openBrowser(DEAD, c.storage); // browser C, API gone
  const offline = await boot(cOffline);
  check("signed in, API unreachable, a copy on this browser → offline", "offline", offline.mode);
  const appOffline = new App(offline);
  check("it runs on the learner's last synced progress", 90, appOffline.progress.xp);
  check("complete foundations-4 while offline", true, appOffline.complete("foundations-4"));
  appOffline.writeNote("foundations-4", "Two nested loops over n: O(n^2).");
  const stuck = await Promise.all([offline.account!.progress.flush(), offline.account!.notes.flush()]);
  check("the changes are kept, not lost", ["unavailable", 1, 1], [stuck[0].stopped, stuck[0].remaining, stuck[1].remaining]);
  done(offline);

  const back = await boot(c); // the API is back
  check("next boot with the API up → on the API", "api", back.mode);
  const serverYBack = await serverState(c.client);
  check("the offline completion reached the server", true, serverYBack.completedCheckpointIds.includes("foundations-4"));
  check("XP 90 + foundations-4's 40", 130, serverYBack.xp);
  check("the offline note too", true, (await serverNotes(c.client)).some((entry) => entry.lessonId === "foundations-4"));
  check("nothing left queued", 0, back.account!.progress.pendingCount() + back.account!.notes.pendingCount());
  done(back);

  const h = openBrowser(DEAD);
  const signedOut = await boot(h);
  check("signed out → the local repositories, exactly as before", "local", signedOut.mode);
  check("and not a single request", 0, h.requests);
  check("the demo bootstrap still greets a signed-out visitor", "trees-1", new App(signedOut).progress.activeCheckpointId);

  const i = openBrowser(DEAD);
  i.storage.setItem("reagvis.session", c.storage.getItem("reagvis.session")!);
  const noCopy = await boot(i);
  check("signed in on a new browser with the API down → local fallback", ["local", "unavailable"], [noCopy.mode, noCopy.problem?.kind]);
  done(noCopy);

  // ── lives, until Day 4 ───────────────────────────────────────────────────

  hr("Day 4  A lost life is not sent yet");
  appB.failSubmit();
  await appB.settle();
  check("nothing queued for it — /code/submit (Day 4) records failed submits", 0, onB.account!.progress.pendingCount());
  check("the server's lives are unchanged", 3, (await serverState(b.client)).lives);
  note("until Day 4, a life lost in the browser is restored by the next reload");

  // ── session ──────────────────────────────────────────────────────────────

  hr("sec  An expired access token is renewed without the learner noticing");
  const sessionB = b.client.session()!;
  b.storage.setItem("reagvis.session", JSON.stringify({ ...sessionB, accessToken: "expired.or.tampered" }));
  const [renewedState, renewedNotes] = await Promise.all([serverState(b.client), serverNotes(b.client)]);
  check("two requests racing one renewal both succeed", [60, 1], [renewedState.xp, renewedNotes.length]);
  check("the refresh token was rotated once", true, b.client.session()!.refreshToken !== sessionB.refreshToken);

  b.storage.setItem("reagvis.session", JSON.stringify({ ...b.client.session()!, accessToken: "x", refreshToken: "y" }));
  const ended = await serverState(b.client).then(
    () => false,
    (error: unknown) => error instanceof SessionExpiredError,
  );
  check("a refused refresh token ends the session", true, ended);
  check("and the browser forgets it", null, b.client.session());
  done(onB);

  // ── result ───────────────────────────────────────────────────────────────

  console.log(`\n\x1b[1mResult\x1b[0m\n  \x1b[32m${passed} passed\x1b[0m${failed ? `   \x1b[31m${failed} failed\x1b[0m` : ""}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((error: unknown) => {
  const status = (error as { status?: number }).status;
  if (status === 429) {
    console.log("\n  \x1b[33mAuth rate limit reached.\x1b[0m The counter is in memory — restart the API and run again.\n");
    process.exit(2);
  }
  console.error(error);
  process.exit(1);
});
