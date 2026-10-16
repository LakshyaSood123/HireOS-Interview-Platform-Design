// HTTP client for the Reagvis Trails API (backend/) and the signed-in
// session. Auth/session concepts only in this phase — no progress or notes
// repositories yet (those are a later integration phase; see
// docs/00-BACKEND-INTEGRATION-SUMMARY.md and the auth integration report).
//
// Ported from the semantics of an earlier frontend branch's apiClient.ts
// (commit 0ca34d7), trimmed to auth/session only: the Outbox and the
// per-learner progress/notes storage helpers are deliberately not carried
// over, since this phase does not touch progress or notes.
//
// Nothing here renders anything or imports React, and nothing touches
// `window`/`localStorage` at import time — storage and fetch are passed in.

export interface SessionUser {
  id: string
  email: string
  displayName: string
  role: "learner" | "admin"
}

export interface Session {
  accessToken: string
  refreshToken: string
  user: SessionUser
}

/** `{ data, meta }` — every successful API response (docs/03-API-CONTRACT.md). */
export interface ApiResponse<T> {
  data: T
  meta: { requestId?: string; [key: string]: unknown }
}

const SESSION_KEY = "reagvis.session"
const DEFAULT_TIMEOUT_MS = 6_000

/** Where the API lives. No Vite proxy for this in dev — the backend's CORS
 * allowlist already includes http://localhost:8443, so the browser calls it
 * directly, cross-origin. `VITE_REAGVIS_API_URL` overrides it. */
export function defaultApiBaseUrl(): string {
  const configured = import.meta.env?.VITE_REAGVIS_API_URL
  if (typeof configured === "string" && configured.trim()) return configured.trim().replace(/\/+$/, "")
  return "http://localhost:4883/api/v1"
}

/** The API did not answer: unreachable, timed out, or something that is not
 * the API answered instead. Never a statement about the learner's account —
 * keep what you have, try again later. */
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
  /** Overrides the client's default timeout for ONE slow, deliberate request (e.g. an admin generating narration with the local engine). */
  timeoutMs?: number
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
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role }
}

/** Runs `work` holding a lock shared by every tab of this origin, where the
 * browser has the Web Locks API; otherwise just runs it. Keeps two tabs from
 * ever spending the same refresh token — the backend treats a reused,
 * already-rotated refresh token as theft and revokes every session for that
 * user (see backend/src/modules/auth/auth.service.ts's `refresh`). */
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
    this.fetchImpl = options.fetch ?? ((input, init) => fetch(input, init))
    this.timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  }

  /** The signed-in learner's session, or null when signed out. Read
   * synchronously so app boot can decide loading/authenticated/unauthenticated
   * without an extra render. */
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
      return false
    } finally {
      this.writeSession(null)
    }
  }

  /** Fetches `/users/me` with the current session, refreshing once if the
   * access token has expired. Used by boot to confirm a restored session is
   * still valid and to pick up the latest role/profile. */
  async fetchCurrentUser(): Promise<SessionUser> {
    const { data } = await this.request<SessionUser>("GET", "/users/me")
    return pickUser(data)
  }

  /** Throws `ApiRequestError` for an error envelope, `ApiUnavailableError`
   * when the API did not answer, `SessionExpiredError` when signed out. */
  async request<T>(method: string, path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
    const authenticated = options.authenticated ?? true
    const session = authenticated ? this.session() : null
    if (authenticated && !session) throw new SessionExpiredError()

    let response = await this.send(method, path, options.body, session?.accessToken, options.timeoutMs)

    if (response.status === 401 && session) {
      // Access tokens are short-lived: renew once, then retry once.
      const renewed = await this.renew(session.accessToken)
      if (!renewed) throw new SessionExpiredError()
      response = await this.send(method, path, options.body, renewed.accessToken, options.timeoutMs)
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

  private async send(method: string, path: string, body: unknown, accessToken?: string, timeoutMs: number = this.timeoutMs): Promise<RawResponse> {
    const headers: Record<string, string> = { Accept: "application/json" }
    if (body !== undefined) headers["Content-Type"] = "application/json"
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
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

    throw new ApiUnavailableError(`HTTP ${response.status} without an API response`)
  }

  /** One renewal at a time: in this tab through `this.renewal`, across tabs
   * through a Web Lock. */
  private renew(staleAccessToken: string): Promise<Session | null> {
    this.renewal ??= withLock("reagvis-session-renewal", async () => {
      const current = this.session()
      if (!current) return null
      if (current.accessToken !== staleAccessToken) return current // another tab already renewed

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
