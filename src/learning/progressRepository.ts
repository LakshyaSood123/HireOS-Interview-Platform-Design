// Learner progress storage. Nothing outside this file should call
// `localStorage` directly for progress — AppStateContext goes through
// `ProgressRepository`, so `LocalProgressRepository` (this browser only) and
// `ApiProgressRepository` (the signed-in learner's account, below) swap
// without touching any UI component. learnerSession.ts picks one at boot.

import type { LearnerProgressState } from "./progressEngine"
import { DEFAULT_LIVES, getNextCheckpointId } from "./progressEngine"
import { getAllCheckpointsInOrder, getCourseById } from "./courseRegistry"
import {
  ApiClient,
  ApiUnavailableError,
  learnerKey,
  Outbox,
  readJson,
  SessionExpiredError,
  writeJson,
  type OutboxFlushResult,
} from "./services/apiClient"

export interface ProgressRepository {
  load(courseId: string): LearnerProgressState | null
  save(state: LearnerProgressState): void
  reset(courseId: string): void
}

const STORAGE_PREFIX = "reagvis.progress."

/** Old-model checkpoint id -> which new-model module's checkpoints it
 * belongs to. Foundations/Linked Structures/Recursion were re-authored from
 * 3/3/2 bare-numeric legacy TrailNode ids ("1"-"8") into 5 checkpoints each
 * with descriptive ids ("foundations-1", etc.) in the DSA course-expansion
 * task. Anyone who has local progress from before that change has
 * `completedCheckpointIds`/`activeCheckpointId` referencing ids that no
 * longer exist in the registry — `migrateLegacyCheckpointIds` below detects
 * and rewrites them rather than silently discarding that progress. Trees
 * ("trees-1".."trees-5") was already migrated once (Trees vertical slice)
 * and needs no further change here. */
const LEGACY_CHECKPOINT_TO_MODULE: Record<string, string> = {
  "1": "foundations",
  "2": "foundations",
  "3": "foundations",
  "4": "linked-structures",
  "5": "linked-structures",
  "6": "linked-structures",
  "7": "recursion",
  "8": "recursion",
}

const NEW_MODULE_CHECKPOINT_COUNT: Record<string, number> = {
  foundations: 5,
  "linked-structures": 5,
  recursion: 5,
}

function isLegacyId(id: string): boolean {
  return id in LEGACY_CHECKPOINT_TO_MODULE
}

/** Rewrites any pre-course-expansion bare-numeric checkpoint ids in a
 * persisted progress snapshot to the new descriptive ids, marking the
 * migrated module's checkpoints as fully completed (the old ids only ever
 * meant "this module is done" in the demo bootstrap — there's no finer-
 * grained per-checkpoint history to preserve). A no-op for progress that's
 * already on the new ids. Structural detection, not a version field: the
 * only shape that ever needs migrating is "contains a bare '1'-'8' id." */
export function migrateLegacyCheckpointIds(state: LearnerProgressState): LearnerProgressState {
  const legacyIdsPresent = state.completedCheckpointIds.some(isLegacyId) || (state.activeCheckpointId ? isLegacyId(state.activeCheckpointId) : false)
  if (!legacyIdsPresent) return state

  const migratedModuleIds = new Set(
    state.completedCheckpointIds.filter(isLegacyId).map(id => LEGACY_CHECKPOINT_TO_MODULE[id]),
  )

  const completedCheckpointIds = [
    ...state.completedCheckpointIds.filter(id => !isLegacyId(id)),
    ...Array.from(migratedModuleIds).flatMap(moduleId =>
      Array.from({ length: NEW_MODULE_CHECKPOINT_COUNT[moduleId] ?? 0 }, (_, i) => `${moduleId}-${i + 1}`),
    ),
  ]

  const activeCheckpointId =
    state.activeCheckpointId && isLegacyId(state.activeCheckpointId)
      ? `${LEGACY_CHECKPOINT_TO_MODULE[state.activeCheckpointId]}-1`
      : state.activeCheckpointId

  return { ...state, completedCheckpointIds, activeCheckpointId }
}

export class LocalProgressRepository implements ProgressRepository {
  load(courseId: string): LearnerProgressState | null {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + courseId)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== "object" || parsed.activeCourseId !== courseId) return null
      return migrateLegacyCheckpointIds(parsed as LearnerProgressState)
    } catch {
      // Private browsing, storage disabled, or corrupted JSON — fall back to
      // defaults rather than throwing.
      return null
    }
  }

  save(state: LearnerProgressState): void {
    try {
      localStorage.setItem(STORAGE_PREFIX + state.activeCourseId, JSON.stringify(state))
    } catch {
      // Storage full/unavailable — progress just won't survive a refresh
      // this session; not fatal.
    }
  }

  reset(courseId: string): void {
    try {
      localStorage.removeItem(STORAGE_PREFIX + courseId)
    } catch {
      // no-op
    }
  }
}

// ── The signed-in learner's account ──────────────────────────────────────
//
// `ApiProgressRepository` puts the API behind the same interface. The
// interface is synchronous and the network is not, so:
//
//  - `hydrate()` runs once at boot, before the first render (learnerSession.ts).
//    It sends anything this browser still has queued, imports the browser's
//    signed-out progress on first sign-in, and keeps a copy of the server's
//    state. That copy is what `load()` answers with.
//  - `save()` is still handed the whole snapshot after every change. It works
//    out what the learner just did — completed one checkpoint, or moved the
//    active pointer — and queues that as an API call. The server applies it
//    with its own lock check and its own reward ledger, so XP, mastery and
//    the streak are never sent: the server derives them. Lives are not sent
//    either — a failed submit reaches the server through /code/submit (Day 4).
//
// The server is the authority. Whatever this tab shows mid-session, the next
// boot shows exactly what the server holds.

/** The checkpoints `buildDemoLearnerBootstrap` (AppStateContext.tsx)
 * pre-completes for the demo — Foundations, Linked Lists and Recursion.
 * Presentation data, not the learner's own work, so it never reaches the
 * server (docs/04-INTEGRATION-CHECKLIST.md §4). Keep in step with that
 * function. */
export const DEMO_BOOTSTRAP_CHECKPOINT_IDS: readonly string[] = [
  "foundations-1", "foundations-2", "foundations-3", "foundations-4", "foundations-5",
  "linked-structures-1", "linked-structures-2", "linked-structures-3", "linked-structures-4", "linked-structures-5",
  "recursion-1", "recursion-2", "recursion-3", "recursion-4", "recursion-5",
]

type ProgressOp =
  | { kind: "complete"; courseId: string; checkpointId: string; source?: "import" }
  | { kind: "active"; courseId: string; checkpointId: string }

export interface ImportPlan {
  /** Sent to the server, in an order its locks accept. */
  checkpointIds: string[]
  /** The demo bootstrap's — never sent. */
  demoBootstrapIds: string[]
  /** Completed in this browser, but only ever reachable through demo data,
   * so the server's locks would refuse them. Not sent. */
  unreachableIds: string[]
  /** Where to point the learner afterwards; null leaves the server's choice. */
  activeCheckpointId: string | null
}

/** What first sign-in did with this browser's signed-out progress. */
export interface ProgressImportReport extends Omit<ImportPlan, "activeCheckpointId"> {
  outcome: "imported" | "nothing-to-import" | "server-has-progress"
}

/** A progress document nothing has been recorded in yet — what enrollment creates. */
function isUntouched(state: LearnerProgressState): boolean {
  return (
    state.completedCheckpointIds.length === 0 &&
    state.masteredCheckpointIds.length === 0 &&
    state.xp === 0 &&
    state.lives === DEFAULT_LIVES &&
    state.lastActivityDate === null
  )
}

/** Decides what of a signed-out snapshot an untouched account receives.
 * Pure — a function of the registry and two snapshots. */
export function planImport(
  courseId: string,
  snapshot: LearnerProgressState,
  server: LearnerProgressState,
): ImportPlan {
  const course = getCourseById(courseId)
  if (!course) return { checkpointIds: [], demoBootstrapIds: [], unreachableIds: [], activeCheckpointId: null }

  const ordered = getAllCheckpointsInOrder(course)
  const completed = new Set(snapshot.completedCheckpointIds)

  // Built on the demo bootstrap: every checkpoint it pre-completes is there.
  const demo = new Set(DEMO_BOOTSTRAP_CHECKPOINT_IDS.every(id => completed.has(id)) ? DEMO_BOOTSTRAP_CHECKPOINT_IDS : [])

  // Course order, taking each checkpoint once everything it needs is on the
  // server or earlier in the replay — exactly what the server's lock check
  // will ask for. What never becomes ready depended on demo data.
  const reached = new Set(server.completedCheckpointIds)
  let waiting = ordered.filter(checkpoint => completed.has(checkpoint.id) && !demo.has(checkpoint.id) && !reached.has(checkpoint.id))
  const replay: string[] = []
  for (let progressed = true; progressed; ) {
    progressed = false
    for (const checkpoint of waiting) {
      if (checkpoint.prerequisites.every(id => reached.has(id))) {
        replay.push(checkpoint.id)
        reached.add(checkpoint.id)
        progressed = true
      }
    }
    waiting = waiting.filter(checkpoint => !reached.has(checkpoint.id))
  }

  // Where the learner was — if the server will let them stand there, and it
  // is not already where replaying the completions leaves the pointer.
  let pointerAfterReplay = server.activeCheckpointId
  for (const id of replay) pointerAfterReplay = getNextCheckpointId(course, id) ?? pointerAfterReplay
  const target = ordered.find(checkpoint => checkpoint.id === snapshot.activeCheckpointId)
  const standable = target && (reached.has(target.id) || target.prerequisites.every(id => reached.has(id)))

  return {
    checkpointIds: replay,
    demoBootstrapIds: DEMO_BOOTSTRAP_CHECKPOINT_IDS.filter(id => demo.has(id)),
    unreachableIds: waiting.map(checkpoint => checkpoint.id),
    activeCheckpointId: standable && target.id !== pointerAfterReplay ? target.id : null,
  }
}

export class ApiProgressRepository implements ProgressRepository {
  private readonly client: ApiClient
  private readonly storage: Storage
  private readonly userId: string
  private readonly outbox: Outbox<ProgressOp>
  /** What the next `save()` is compared with: the last snapshot `load()`
   * handed out or `save()` was given, per course. */
  private readonly baseline = new Map<string, LearnerProgressState>()

  constructor(deps: { client: ApiClient; storage: Storage; userId: string }) {
    this.client = deps.client
    this.storage = deps.storage
    this.userId = deps.userId
    this.outbox = new Outbox<ProgressOp>(deps.storage, learnerKey(deps.userId, "outbox", "progress"), op => this.deliver(op), {
      // Only where the learner ended up matters, not every stop on the way.
      coalesce: (queue, next) => {
        const last = queue[queue.length - 1]
        const replacesLast = next.kind === "active" && last?.kind === "active" && last.courseId === next.courseId
        return replacesLast ? [...queue.slice(0, -1), next] : [...queue, next]
      },
      onDrop: (op, error) =>
        console.warn(
          `[reagvis] The server refused ${op.kind === "complete" ? `completing ${op.checkpointId}` : `moving to ${op.checkpointId}`}` +
            ` — ${error.code}: ${error.message} After the next reload this browser shows what the server holds.`,
        ),
    })
  }

  /** Boot, before the first render: send what this browser queued, import
   * its signed-out progress on first sign-in, then adopt the server's state.
   * Throws `ApiUnavailableError`, `ApiRequestError` or `SessionExpiredError`;
   * learnerSession.ts decides what each one means. */
  async hydrate(courseId: string, options: { importFrom?: ProgressRepository } = {}): Promise<ProgressImportReport | null> {
    // Reachable, and serving this course — proved before anything queued is sent.
    let server = await this.fetchState(courseId)

    const report = options.importFrom ? this.queueImport(courseId, server, options.importFrom) : null

    if (this.outbox.size() > 0) {
      const result = await this.outbox.flush()
      if (result.stopped === "signed-out") throw new SessionExpiredError()
      if (result.stopped === "unavailable") throw new ApiUnavailableError("stopped while sending queued progress")
      server = await this.fetchState(courseId)
    }

    this.adopt(server)
    return report
  }

  /** Whether this browser holds a copy of the learner's progress — what an
   * offline boot can fall back to. */
  hasLocalCopy(courseId: string): boolean {
    return this.readCopy(courseId) !== null
  }

  pendingCount(): number {
    return this.outbox.size()
  }

  flush(): Promise<OutboxFlushResult> {
    return this.outbox.flush()
  }

  stop(): void {
    this.outbox.stop()
  }

  load(courseId: string): LearnerProgressState | null {
    const state = this.readCopy(courseId)
    if (state) this.baseline.set(courseId, state)
    return state
  }

  save(state: LearnerProgressState): void {
    const courseId = state.activeCourseId
    const before = this.baseline.get(courseId)
    this.baseline.set(courseId, state)

    // A course this session never loaded: nothing to compare with, so this
    // snapshot becomes the reference point and nothing is sent.
    if (!before) {
      this.writeCopy(state)
      return
    }

    const added = state.completedCheckpointIds.filter(id => !before.completedCheckpointIds.includes(id))

    // The app completes one checkpoint per action. Several in one save is a
    // replaced snapshot — the demo bootstrap, say — not something the learner
    // did, and none of it goes to the server.
    if (added.length > 1) {
      console.error(
        `[reagvis] Not sending ${added.length} completions that arrived in a single save: the app completes one ` +
          "checkpoint at a time, so this is not a learner action. The server keeps the learner's real progress.",
      )
      return
    }

    if (added.length === 1) {
      this.outbox.enqueue({ kind: "complete", courseId, checkpointId: added[0] })
    } else if (state.activeCheckpointId && state.activeCheckpointId !== before.activeCheckpointId) {
      this.outbox.enqueue({ kind: "active", courseId, checkpointId: state.activeCheckpointId })
    }

    this.writeCopy(state)
  }

  /** Forgets this browser's copy. Never deletes anything on the server —
   * there is deliberately no endpoint that could. */
  reset(courseId: string): void {
    this.baseline.delete(courseId)
    try {
      this.storage.removeItem(this.copyKey(courseId))
    } catch {
      // no-op
    }
  }

  /** First sign-in on this browser: the progress it made while signed out
   * goes to the account once — only if the account has none of its own —
   * as ordinary completions, so the server re-checks every lock and computes
   * every reward itself. The demo bootstrap is never part of it. */
  private queueImport(courseId: string, server: LearnerProgressState, local: ProgressRepository): ProgressImportReport | null {
    // LocalProgressRepository.load() already runs migrateLegacyCheckpointIds();
    // running it here too keeps the rule true for any repository passed in.
    const loaded = local.load(courseId)
    if (!loaded) return null
    const snapshot = migrateLegacyCheckpointIds(loaded)

    let report: ProgressImportReport
    if (!isUntouched(server)) {
      // The account has progress of its own: the server wins, and a stale
      // copy from this browser is never merged into it.
      report = { outcome: "server-has-progress", checkpointIds: [], demoBootstrapIds: [], unreachableIds: [] }
    } else {
      const { activeCheckpointId, ...plan } = planImport(courseId, snapshot, server)
      // Sent one by one, in order, before the first render — say why the page waits.
      if (plan.checkpointIds.length > 0) {
        console.info(`[reagvis] Importing ${plan.checkpointIds.length} checkpoint(s) this browser completed while signed out…`)
      }
      for (const checkpointId of plan.checkpointIds) {
        this.outbox.enqueue({ kind: "complete", courseId, checkpointId, source: "import" })
      }
      if (activeCheckpointId) this.outbox.enqueue({ kind: "active", courseId, checkpointId: activeCheckpointId })
      report = { outcome: plan.checkpointIds.length > 0 ? "imported" : "nothing-to-import", ...plan }
    }

    // Either way the signed-out copy is dealt with — what was worth sending
    // is in the outbox, which survives a reload — so it is cleared. It can
    // never be imported twice, or into a second account on this browser.
    local.reset(courseId)
    return report
  }

  private async deliver(op: ProgressOp): Promise<void> {
    if (op.kind === "complete") {
      await this.client.request("POST", `/me/checkpoints/${encodeURIComponent(op.checkpointId)}/complete`, {
        body: { courseId: op.courseId, ...(op.source ? { source: op.source } : {}) },
      })
      return
    }
    await this.client.request("PUT", `/me/courses/${encodeURIComponent(op.courseId)}/active`, {
      body: { checkpointId: op.checkpointId },
    })
  }

  private async fetchState(courseId: string): Promise<LearnerProgressState> {
    const { data } = await this.client.request<{ progress: LearnerProgressState }>(
      "GET",
      `/me/courses/${encodeURIComponent(courseId)}/state`,
    )
    return data.progress
  }

  /** The server's state becomes this browser's copy and the reference point. */
  private adopt(state: LearnerProgressState): void {
    this.baseline.set(state.activeCourseId, state)
    this.writeCopy(state)
  }

  private copyKey(courseId: string): string {
    return learnerKey(this.userId, "progress", courseId)
  }

  private readCopy(courseId: string): LearnerProgressState | null {
    const stored = readJson(this.storage, this.copyKey(courseId)) as Partial<LearnerProgressState> | null
    if (!stored || stored.activeCourseId !== courseId) return null
    if (!Array.isArray(stored.completedCheckpointIds) || !Array.isArray(stored.masteredCheckpointIds)) return null
    return stored as LearnerProgressState
  }

  private writeCopy(state: LearnerProgressState): void {
    writeJson(this.storage, this.copyKey(state.activeCourseId), state)
  }
}
