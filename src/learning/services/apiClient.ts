// HTTP client for the Reagvis Trails API (backend/), the signed-in session,
// and a small persistent outbox. ApiProgressRepository and ApiNotesRepository
// build on this file; learnerSession.ts decides at boot which repositories
// the app uses.
//
// Nothing here renders anything or imports React, and nothing touches
// `window` or `localStorage` at import time — storage and fetch are passed in
// — so backend/scripts/verifyAdapters.ts can drive this exact code from Node
// against a running API.

export interface SessionUser {
  id: string
  email: string
  displayName: string
}

export interface Session {
  accessToken: string
  refreshToken: string
  user: SessionUser
}

/** `{ data, meta }` — every successful API response (docs/03-API-CONTRACT.md). */
export interface ApiResponse<T> {
  data: T
  meta: { requestId?: string; nextCursor?: string | null; [key: string]: unknown }
}

const SESSION_KEY = "reagvis.session"
const DEFAULT_TIMEOUT_MS = 6_000

/** Where the API lives. `/api/v1` is proxied to backend/ by vite.config.ts,
 * so it is same-origin from any device that can open the app.
 * `VITE_REAGVIS_API_URL` points it somewhere else. */
export function defaultApiBaseUrl(): string {
  const configured = import.meta.env?.VITE_REAGVIS_API_URL
  return typeof configured === "string" && configured.trim() ? configured.trim().replace(/\/+$/, "") : "/api/v1"
}

/** The API did not answer: unreachable, timed out, or something that is not
 * the API answered instead (a dev proxy with nothing behind it). Never a
 * statement about the learner's data — keep what you have, try again later. */
export class ApiUnavailableError extends Error {
  constructor(readonly reason: string) {
    super(`The Reagvis API is unavailable (${reason}).`)
    this.name = "ApiUnavailableError"
  }
}

/** The API answered with its `{ error }` envelope. */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message)
    this.name = "ApiRequestError"
  }
}

/** The refresh token was refused, so the learner has to sign in again. */
export class SessionExpiredError extends Error {
  constructor() {
    super("The session has ended. Sign in again.")
    this.name = "SessionExpiredError"
  }
}

export interface ApiClientOptions {
  storage: Storage
  baseUrl?: string
  fetch?: typeof fetch
  timeoutMs?: number
}

interface RequestOptions {
  body?: unknown
  /** Default true: send the access token, and renew it once on a 401. */
  authenticated?: boolean
}

interface RawResponse {
  status: number
  ok: boolean
  text: string
}

interface AuthResult {
  accessToken: string
  refreshToken: string
  user: SessionUser
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseJson(text: string): unknown {
  try {
    return text ? JSON.parse(text) : null
  } catch {
    return null
  }
}

function pickUser(user: SessionUser): SessionUser {
  return { id: user.id, email: user.email, displayName: user.displayName }
}

/** Runs `work` holding a lock shared by every tab of this origin, where the
 * browser has the Web Locks API; otherwise just runs it. */
async function withLock<T>(name: string, work: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== "undefined" ? (navigator as Navigator & { locks?: LockManager }).locks : undefined
  return locks ? ((await locks.request(name, () => work())) as T) : work()
}

export class ApiClient {
  readonly baseUrl: string
  private readonly storage: Storage
  private readonly fetchImpl: typeof fetch
  private readonly timeoutMs: number
  private renewal: Promise<Session | null> | null = null

  constructor(options: ApiClientOptions) {
    this.storage = options.storage
    this.baseUrl = (options.baseUrl ?? defaultApiBaseUrl()).replace(/\/+$/, "")
    // Wrapped, so a browser's `fetch` is never called detached from `window`.
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init))
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  /** The signed-in learner's session, or null when signed out. */
  session(): Session | null {
    try {
      const parsed = parseJson(this.storage.getItem(SESSION_KEY) ?? "")
      if (!isRecord(parsed) || !isRecord(parsed.user)) return null
      if (typeof parsed.accessToken !== "string" || typeof parsed.refreshToken !== "string") return null
      if (typeof parsed.user.id !== "string") return null
      return parsed as unknown as Session
    } catch {
      return null
    }
  }

  signIn(email: string, password: string): Promise<SessionUser> {
    return this.startSession("/auth/login", { email, password })
  }

  register(email: string, password: string, displayName: string): Promise<SessionUser> {
    return this.startSession("/auth/register", { email, password, displayName })
  }

  /** Revokes the refresh token on the server when it can, and forgets the
   * session in this browser either way. Resolves true if the server confirmed. */
  async signOut(): Promise<boolean> {
    const current = this.session()
    if (!current) return true
    try {
      await this.request("POST", "/auth/logout", { body: { refreshToken: current.refreshToken } })
      return true
    } catch {
      // Unreachable, or already signed out on the server. Nothing more can be
      // revoked from here; the refresh token expires on its own.
      return false
    } finally {
      this.writeSession(null)
    }
  }

  /** Throws `ApiRequestError` for an error envelope, `ApiUnavailableError`
   * when the API did not answer, `SessionExpiredError` when signed out. */
  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const authenticated = options.authenticated ?? true
    const session = authenticated ? this.session() : null
    if (authenticated && !session) throw new SessionExpiredError()

    let response = await this.send(method, path, options.body, session?.accessToken)

    if (response.status === 401 && session) {
      // Access tokens last 15 minutes: renew once, then retry once.
      const renewed = await this.renew(session.accessToken)
      if (!renewed) throw new SessionExpiredError()
      response = await this.send(method, path, options.body, renewed.accessToken)
      if (response.status === 401) {
        this.writeSession(null)
        throw new SessionExpiredError()
      }
    }

    return this.read<T>(response)
  }

  private async startSession(path: string, body: Record<string, string>): Promise<SessionUser> {
    const { data } = await this.request<AuthResult>("POST", path, { body, authenticated: false })
    const user = pickUser(data.user)
    this.writeSession({ accessToken: data.accessToken, refreshToken: data.refreshToken, user })
    return user
  }

  private async send(method: string, path: string, body: unknown, accessToken?: string): Promise<RawResponse> {
    const headers: Record<string, string> = { Accept: "application/json" }
    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      })
      return { status: response.status, ok: response.ok, text: await response.text() }
    } catch {
      throw new ApiUnavailableError(controller.signal.aborted ? "timed out" : "unreachable")
    } finally {
      clearTimeout(timer)
    }
  }

  private read<T>(response: RawResponse): ApiResponse<T> {
    if (response.status === 204) return { data: undefined as T, meta: {} }

    const body = parseJson(response.text)
    if (response.ok && isRecord(body) && "data" in body) return body as unknown as ApiResponse<T>

    if (isRecord(body) && isRecord(body.error) && typeof body.error.code === "string") {
      const { code, message, details } = body.error
      throw new ApiRequestError(response.status, code, String(message ?? code), isRecord(details) ? details : undefined)
    }

    // Not the API's envelope — a dev proxy with nothing behind it, a gateway
    // error page. The API itself did not answer.
    throw new ApiUnavailableError(`HTTP ${response.status} without an API response`)
  }

  /** One renewal at a time: in this tab through `this.renewal`, across tabs
   * through a Web Lock. The server rotates refresh tokens and treats a reused
   * one as theft — it revokes every session — so two tabs must never both
   * spend the same token. */
  private renew(staleAccessToken: string): Promise<Session | null> {
    this.renewal ??= withLock("reagvis-session-renewal", async () => {
      const current = this.session()
      if (!current) return null
      // Another tab renewed while this request was in flight.
      if (current.accessToken !== staleAccessToken) return current

      const response = await this.send("POST", "/auth/refresh", { refreshToken: current.refreshToken })
      if (response.status === 400 || response.status === 401 || response.status === 403) {
        this.writeSession(null)
        return null
      }

      const { data } = this.read<AuthResult>(response)
      const next: Session = { accessToken: data.accessToken, refreshToken: data.refreshToken, user: pickUser(data.user) }
      this.writeSession(next)
      return next
    }).finally(() => {
      this.renewal = null
    })
    return this.renewal
  }

  private writeSession(session: Session | null): void {
    try {
      if (session) this.storage.setItem(SESSION_KEY, JSON.stringify(session))
      else this.storage.removeItem(SESSION_KEY)
    } catch {
      // Storage unavailable: nothing to keep, nothing to forget.
    }
  }
}

// ── per-learner storage ──────────────────────────────────────────────────

/** Every key this browser keeps for one signed-in learner starts with
 * `reagvis.api.<userId>.` — separate from the signed-out `reagvis.progress.*`
 * and `reagvis.notes.*` keys, so two accounts on one browser never mix. */
export function learnerKey(userId: string, ...parts: string[]): string {
  return ["reagvis.api", userId, ...parts].join(".")
}

/** Removes everything this browser kept for a learner: their copy of the
 * server's state and anything still queued. Sign-out calls it. */
export function forgetLearner(storage: Storage, userId: string): void {
  const prefix = `${learnerKey(userId)}.`
  try {
    const keys: string[] = []
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i)
      if (key?.startsWith(prefix)) keys.push(key)
    }
    for (const key of keys) storage.removeItem(key)
  } catch {
    // Storage unavailable — there is nothing kept to forget.
  }
}

export function readJson(storage: Storage, key: string): unknown {
  try {
    return parseJson(storage.getItem(key) ?? "")
  } catch {
    return null
  }
}

export function writeJson(storage: Storage, key: string, value: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(value))
  } catch {
    // Full or disabled — the server still has it; this copy is a convenience.
  }
}

// ── outbox ───────────────────────────────────────────────────────────────

/** What one flush did. `stopped` says why it ended with ops still queued. */
export interface OutboxFlushResult {
  sent: number
  dropped: number
  remaining: number
  stopped?: "unavailable" | "signed-out"
}

interface OutboxEntry<Op> {
  op: Op
  /** 5xx answers in a row for this op — see MAX_SERVER_ERRORS. */
  serverErrors: number
}

export interface OutboxOptions<Op> {
  /** Folds a new op into the queue — e.g. only the latest save of a note matters. */
  coalesce?: (queue: Op[], next: Op) => Op[]
  /** The server refused an op in a way that will never change. */
  onDrop?: (op: Op, error: ApiRequestError) => void
}

const RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000, 60_000]
const MAX_SERVER_ERRORS = 5
/** Answers that mean "this op can never succeed": malformed, unknown, locked, too large. */
const REFUSED = [400, 404, 409, 413, 422]

/**
 * Changes the API has not confirmed yet, in the order they were made, kept in
 * storage so a closed tab or a dead network loses nothing. Every op the
 * repositories queue is idempotent on the server — completing a checkpoint
 * twice awards once, saving a note twice leaves one note — so sending an op
 * again after an unclear failure is always safe.
 *
 *  - A 2xx removes the op.
 *  - A refusal that can never succeed (400, 404, 409, 413, 422) drops it, loudly.
 *  - Anything else — the API is down, a 5xx, a 429 — keeps it and retries,
 *    backing off to once a minute. Five 5xx in a row for one op drop it too,
 *    so a single bad op cannot hold up everything queued behind it forever.
 */
export class Outbox<Op> {
  private memory: OutboxEntry<Op>[] = []
  private storageWorks = true
  private flushing: Promise<OutboxFlushResult> | null = null
  private timer: ReturnType<typeof setTimeout> | null = null
  private attempt = 0
  private stopped = false

  constructor(
    private readonly storage: Storage,
    private readonly key: string,
    private readonly deliver: (op: Op) => Promise<void>,
    private readonly options: OutboxOptions<Op> = {},
  ) {}

  size(): number {
    return this.read().length
  }

  enqueue(op: Op): void {
    const entries = this.read()
    const queue = entries.map(entry => entry.op)
    const next = this.options.coalesce ? this.options.coalesce(queue, op) : [...queue, op]
    this.write(next.map(item => entries.find(entry => entry.op === item) ?? { op: item, serverErrors: 0 }))
    this.schedule(0)
  }

  /** Sends everything queued, in order. Concurrent calls share one run. */
  flush(): Promise<OutboxFlushResult> {
    this.flushing ??= this.drain().finally(() => {
      this.flushing = null
    })
    return this.flushing
  }

  /** No more automatic retries — signed out, or a test is done with it. */
  stop(): void {
    this.stopped = true
    if (this.timer) clearTimeout(this.timer)
    this.timer = null
  }

  private async drain(): Promise<OutboxFlushResult> {
    let sent = 0
    let dropped = 0

    for (;;) {
      const head = this.read()[0]
      if (!head) {
        this.attempt = 0
        return { sent, dropped, remaining: 0 }
      }

      try {
        await this.deliver(head.op)
        sent += 1
        this.remove(head.op)
        continue
      } catch (error) {
        if (error instanceof SessionExpiredError) return { sent, dropped, remaining: this.size(), stopped: "signed-out" }

        const refused = error instanceof ApiRequestError && REFUSED.includes(error.status)
        const poisoned = error instanceof ApiRequestError && error.status >= 500 && this.countServerError(head.op) >= MAX_SERVER_ERRORS
        if (refused || poisoned) {
          dropped += 1
          this.remove(head.op)
          this.options.onDrop?.(head.op, error as ApiRequestError)
          continue
        }

        if (!(error instanceof ApiUnavailableError) && !(error instanceof ApiRequestError)) {
          console.error("[reagvis] Unexpected error while sending a queued change; it stays queued.", error)
        }
        this.retryLater()
        return { sent, dropped, remaining: this.size(), stopped: "unavailable" }
      }
    }
  }

  /** Removes the first queued op equal to `op`. By value, not by position:
   * another tab, or a coalesced newer save, may have changed the queue while
   * `op` was in flight. */
  private remove(op: Op): void {
    const target = JSON.stringify(op)
    const entries = this.read()
    const index = entries.findIndex(entry => JSON.stringify(entry.op) === target)
    if (index === -1) return
    entries.splice(index, 1)
    this.write(entries)
  }

  private countServerError(op: Op): number {
    const target = JSON.stringify(op)
    const entries = this.read()
    const entry = entries.find(candidate => JSON.stringify(candidate.op) === target)
    // Already replaced by a newer op, which gets its own count.
    if (!entry) return 0
    entry.serverErrors += 1
    this.write(entries)
    return entry.serverErrors
  }

  private retryLater(): void {
    const delay = RETRY_DELAYS_MS[Math.min(this.attempt, RETRY_DELAYS_MS.length - 1)]
    this.attempt += 1
    this.schedule(delay)
  }

  private schedule(delayMs: number): void {
    if (this.stopped) return
    if (this.timer) clearTimeout(this.timer)
    const timer = setTimeout(() => {
      this.timer = null
      void this.flush()
    }, delayMs)
    // Under Node (the verify scripts), a pending retry must not keep the process alive.
    ;(timer as { unref?: () => void }).unref?.()
    this.timer = timer
  }

  private read(): OutboxEntry<Op>[] {
    if (!this.storageWorks) return this.memory.map(entry => ({ ...entry }))
    const parsed = readJson(this.storage, this.key)
    return Array.isArray(parsed) ? (parsed as OutboxEntry<Op>[]) : []
  }

  private write(entries: OutboxEntry<Op>[]): void {
    this.memory = entries
    if (!this.storageWorks) return
    try {
      if (entries.length > 0) this.storage.setItem(this.key, JSON.stringify(entries))
      else this.storage.removeItem(this.key)
    } catch {
      // Full or disabled: carry on in memory for the life of the page.
      this.storageWorks = false
    }
  }
}
