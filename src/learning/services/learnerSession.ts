// Which progress and notes repositories the app uses, decided once at boot.
//
//  - Signed out → LocalProgressRepository and LocalNotesRepository, exactly as
//    before there was a backend. No request is made at all.
//  - Signed in, API reachable → ApiProgressRepository and ApiNotesRepository,
//    filled from the server before the first render. The server is the
//    authority; this browser keeps a copy so the synchronous repository
//    interfaces can answer.
//  - Signed in, API unreachable → the same API repositories, answering from
//    that copy. Changes queue in this browser and go to the server when it
//    answers again. Without a copy (never used on this browser), the
//    signed-out local repositories stand in.
//
// main.tsx awaits `bootLearnerSession()` before rendering, because
// AppStateContext reads progress synchronously as it mounts. There is no
// sign-in screen yet — that is the frontend's to design — so the browser
// console is the way in: `reagvis.login(email, password)`, `reagvis.logout()`,
// `reagvis.status()`. A screen would call the same functions.

import {
  ApiProgressRepository,
  LocalProgressRepository,
  type ProgressImportReport,
  type ProgressRepository,
} from "../progressRepository"
import { coursesById } from "../courseRegistry"
import {
  ApiNotesRepository,
  LocalNotesRepository,
  type NotesImportReport,
  type NotesRepository,
} from "./notesRepository"
import { ApiClient, SessionExpiredError, forgetLearner, type SessionUser } from "./apiClient"

export type LearnerSessionMode = "local" | "api" | "offline"

/** What boot decided. AppStateContext reads `signedIn`: a signed-in
 * learner's progress is their own and is never swapped for demo data. */
export const learnerSession = {
  mode: "local" as LearnerSessionMode,
  user: null as SessionUser | null,
  get signedIn(): boolean {
    return this.mode !== "local"
  },
}

let activeProgress: ProgressRepository = new LocalProgressRepository()
let activeNotes: NotesRepository = new LocalNotesRepository()

/** The app's progress repository — whichever one boot chose. */
export const progressRepository: ProgressRepository = {
  load: courseId => activeProgress.load(courseId),
  save: state => activeProgress.save(state),
  reset: courseId => activeProgress.reset(courseId),
}

/** The app's notes repository — whichever one boot chose. */
export const notesRepository: NotesRepository = {
  list: courseId => activeNotes.list(courseId),
  save: note => activeNotes.save(note),
  delete: noteId => activeNotes.delete(noteId),
}

export interface LearnerSessionDeps {
  client: ApiClient
  storage: Storage
  courseIds: string[]
  /** This browser's signed-out repositories: the fallback, and what first
   * sign-in imports from. */
  local: { progress: ProgressRepository; notes: NotesRepository }
}

export interface LearnerSessionOutcome {
  mode: LearnerSessionMode
  user: SessionUser | null
  progress: ProgressRepository
  notes: NotesRepository
  /** The signed-in learner's repositories, whether or not boot could fill them. */
  account: { progress: ApiProgressRepository; notes: ApiNotesRepository } | null
  imports: { courseId: string; progress: ProgressImportReport | null; notes: NotesImportReport | null }[]
  /** Why a signed-in learner is not on the API right now. */
  problem?: { kind: "expired" | "unavailable"; detail: string }
}

/** The boot decision, with every dependency passed in — no window, no
 * globals — so backend/scripts/verifyAdapters.ts can run it from Node. */
export async function startLearnerSession(deps: LearnerSessionDeps): Promise<LearnerSessionOutcome> {
  const session = deps.client.session()
  const local = (account: LearnerSessionOutcome["account"], problem?: LearnerSessionOutcome["problem"]): LearnerSessionOutcome => ({
    mode: "local",
    user: null,
    progress: deps.local.progress,
    notes: deps.local.notes,
    account,
    imports: [],
    ...(problem ? { problem } : {}),
  })

  if (!session) return local(null)

  const account = {
    progress: new ApiProgressRepository({ client: deps.client, storage: deps.storage, userId: session.user.id }),
    notes: new ApiNotesRepository({ client: deps.client, storage: deps.storage, userId: session.user.id }),
  }

  try {
    const imports: LearnerSessionOutcome["imports"] = []
    for (const courseId of deps.courseIds) {
      const [progress, notes] = await Promise.all([
        account.progress.hydrate(courseId, { importFrom: deps.local.progress }),
        account.notes.hydrate(courseId, { importFrom: deps.local.notes }),
      ])
      imports.push({ courseId, progress, notes })
    }
    return { mode: "api", user: session.user, progress: account.progress, notes: account.notes, account, imports }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)

    if (error instanceof SessionExpiredError) {
      account.progress.stop()
      account.notes.stop()
      return local(null, { kind: "expired", detail })
    }

    // Unreachable, or unable to serve the course right now. A learner who has
    // used this browser before keeps working on their last copy; whatever is
    // queued keeps retrying in the background either way.
    const problem = { kind: "unavailable" as const, detail }
    if (deps.courseIds.every(courseId => account.progress.hasLocalCopy(courseId))) {
      return { mode: "offline", user: session.user, progress: account.progress, notes: account.notes, account, imports: [], problem }
    }
    return local(account, problem)
  }
}

/** Called by main.tsx before the first render. Never rejects: whatever
 * happens, the app renders — on the API, on this browser's copy, or on the
 * signed-out local repositories. */
export async function bootLearnerSession(): Promise<void> {
  if (typeof window === "undefined") return

  try {
    const storage = window.localStorage
    const client = new ApiClient({ storage })
    const outcome = await startLearnerSession({
      client,
      storage,
      courseIds: Object.keys(coursesById),
      local: { progress: new LocalProgressRepository(), notes: new LocalNotesRepository() },
    })

    activeProgress = outcome.progress
    activeNotes = outcome.notes
    learnerSession.mode = outcome.mode
    learnerSession.user = outcome.user

    const { account } = outcome
    if (account) {
      window.addEventListener("online", () => {
        void account.progress.flush()
        void account.notes.flush()
      })
    }

    installConsole(client, storage, outcome)
    announce(outcome, client)
  } catch (error) {
    console.error("[reagvis] Could not start the learner session — using this browser's local progress.", error)
  }
}

// ── console ──────────────────────────────────────────────────────────────

interface ReagvisConsole {
  status(): { mode: LearnerSessionMode; user: string | null; api: string; unsent: { progress: number; notes: number } }
  login(email: string, password: string): Promise<void>
  register(email: string, password: string, displayName?: string): Promise<void>
  logout(options?: { discardUnsent?: boolean }): Promise<void>
  sync(): Promise<{ progress: number; notes: number }>
}

function installConsole(client: ApiClient, storage: Storage, outcome: LearnerSessionOutcome): void {
  const { account } = outcome
  const unsent = () => ({ progress: account?.progress.pendingCount() ?? 0, notes: account?.notes.pendingCount() ?? 0 })

  const refuseIfSignedIn = () => {
    const current = client.session()
    if (current) throw new Error(`Already signed in as ${current.user.email}. Run reagvis.logout() first.`)
  }

  const reagvis: ReagvisConsole = {
    status: () => ({ mode: outcome.mode, user: client.session()?.user.email ?? null, api: client.baseUrl, unsent: unsent() }),

    async login(email, password) {
      refuseIfSignedIn()
      const user = await client.signIn(email, password)
      console.info(`[reagvis] Signed in as ${user.email}. Reloading…`)
      window.location.reload()
    },

    async register(email, password, displayName = email.split("@")[0] || "Learner") {
      refuseIfSignedIn()
      const user = await client.register(email, password, displayName)
      console.info(`[reagvis] Registered and signed in as ${user.email}. Reloading…`)
      window.location.reload()
    },

    async logout({ discardUnsent = false } = {}) {
      const current = client.session()
      if (!current) {
        console.info("[reagvis] Not signed in.")
        return
      }

      if (account) {
        await Promise.all([account.progress.flush(), account.notes.flush()])
        const left = unsent()
        if (left.progress + left.notes > 0 && !discardUnsent) {
          throw new Error(
            `${left.progress + left.notes} change(s) have not reached the server yet — it is unreachable. ` +
              "Signing out removes them from this browser. Run reagvis.logout({ discardUnsent: true }) to do it anyway.",
          )
        }
        account.progress.stop()
        account.notes.stop()
      }

      await client.signOut()
      // Nothing of this learner stays behind in this browser.
      forgetLearner(storage, current.user.id)
      console.info("[reagvis] Signed out. Reloading…")
      window.location.reload()
    },

    async sync() {
      if (account) await Promise.all([account.progress.flush(), account.notes.flush()])
      return unsent()
    },
  }

  ;(window as unknown as { reagvis: ReagvisConsole }).reagvis = reagvis
}

function announce(outcome: LearnerSessionOutcome, client: ApiClient): void {
  const email = client.session()?.user.email

  if (outcome.mode === "api") {
    console.info(`[reagvis] Signed in as ${outcome.user?.email}. Progress and notes are saved to your account.`)
    for (const { courseId, progress, notes } of outcome.imports) {
      if (progress?.outcome === "imported") {
        console.info(`[reagvis] Imported this browser's progress into ${courseId}:`, progress.checkpointIds)
      }
      if (progress && progress.demoBootstrapIds.length > 0) {
        console.info(`[reagvis] Not imported — demo data, not your work: ${progress.demoBootstrapIds.length} demo bootstrap checkpoints.`)
      }
      if (progress && progress.unreachableIds.length > 0) {
        console.info("[reagvis] Not imported — reachable only through demo data:", progress.unreachableIds)
      }
      if (progress?.outcome === "server-has-progress") {
        console.info(`[reagvis] Your account already has progress in ${courseId}; this browser's signed-out copy was cleared.`)
      }
      if (notes?.outcome === "imported") console.info(`[reagvis] Imported ${notes.noteIds.length} note(s) from this browser.`)
    }
    return
  }

  if (outcome.mode === "offline") {
    console.warn(
      `[reagvis] Signed in as ${outcome.user?.email}, but the API is unavailable (${outcome.problem?.detail}). ` +
        "Showing your last synced progress; changes are kept in this browser and sent when it is back.",
    )
    return
  }

  if (outcome.problem?.kind === "expired") {
    console.warn("[reagvis] Your session has ended. Sign in again with reagvis.login(email, password).")
  } else if (outcome.problem) {
    console.warn(
      `[reagvis] Signed in as ${email}, but the API is unavailable (${outcome.problem.detail}) and this browser ` +
        "has no copy of your progress yet — using this browser's local progress until it is back.",
    )
  } else {
    console.info(
      "[reagvis] Not signed in — progress stays in this browser. " +
        "To save it to an account: reagvis.register(email, password) or reagvis.login(email, password).",
    )
  }
}
