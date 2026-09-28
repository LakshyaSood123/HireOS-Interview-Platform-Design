// Auth/session boundary for the current frontend. AUTH + SESSION ONLY: no
// progress, XP, attempts, notes or CMS wiring here — see the integration
// report's "remaining backend integration" phases for what comes later.
//
// Explicit three-state model (never a flash of the login screen while a
// valid session is being restored):
//   "booting"          — checking a restored session against the API
//   "unauthenticated"  — no session, or the restored one didn't hold up
//   "authenticated"    — confirmed; `user` is set

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  ApiClient,
  ApiUnavailableError,
  SessionExpiredError,
  type SessionUser,
} from "../learning/services/apiClient"
import { LocalProgressRepository } from "../learning/progressRepository"

/** The one course wired to backend progress in this phase — see
 * AppStateContext.tsx's own `dsa-foundations` usage. Clearing only this
 * cached key (never the whole of localStorage) keeps a shared browser from
 * flashing one account's cached progress at the next signed-in account. */
const DSA_COURSE_ID = "dsa-foundations"
const progressCache = new LocalProgressRepository()

export type AuthStatus = "booting" | "authenticated" | "unauthenticated"

export interface AuthContextValue {
  status: AuthStatus
  user: SessionUser | null
  /** Set only when boot could not confirm a restored session because the API
   * itself did not answer (not because the session was invalid). The app
   * still shows the auth screen; this is a hint the auth screen can show. */
  bootProblem: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, displayName: string) => Promise<void>
  logout: () => Promise<void>
  /** The same ApiClient instance auth uses — reused by other authenticated
   * features (progress) instead of each standing up its own. */
  client: ApiClient
  /** Called by any later authenticated request that discovers the session is
   * actually dead (refresh already failed once at the ApiClient level and
   * threw `SessionExpiredError`) — flips the app back to the Auth screen
   * instead of leaving it stuck "authenticated" against a token that no
   * longer works. Boot itself doesn't need this; it handles its own
   * SessionExpiredError inline. */
  reportSessionExpired: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

/** True admin status is always re-checked server-side by every CMS route
 * (`requireRole("admin")`) — this is a convenience for the frontend to decide
 * what to show, never a substitute for that server check. */
export function useIsAdmin(): boolean {
  const { user } = useAuth()
  return user?.role === "admin"
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = useMemo(() => new ApiClient({ storage: window.localStorage }), [])
  const [status, setStatus] = useState<AuthStatus>("booting")
  const [user, setUser] = useState<SessionUser | null>(null)
  const [bootProblem, setBootProblem] = useState<string | null>(null)
  const booted = useRef(false)

  useEffect(() => {
    if (booted.current) return
    booted.current = true

    const restored = client.session()
    if (!restored) {
      setStatus("unauthenticated")
      return
    }

    // A restored session is optimistic until confirmed: fetch the current
    // user (refreshing the access token once if it has expired, same as any
    // other request). Only then does the app open signed in.
    client
      .fetchCurrentUser()
      .then(freshUser => {
        setUser(freshUser)
        setStatus("authenticated")
      })
      .catch(error => {
        if (error instanceof SessionExpiredError) {
          progressCache.reset(DSA_COURSE_ID)
          setStatus("unauthenticated")
          return
        }
        // API unreachable: keep the learner on the auth screen (never guess
        // an authenticated UI without a confirmed session) but say why.
        setStatus("unauthenticated")
        setBootProblem(error instanceof ApiUnavailableError ? error.message : "Could not confirm your session.")
      })
  }, [client])

  // A browser can go from one signed-in account straight to another (tab
  // closed without Logout, then a different learner signs in on the same
  // machine) without ever passing through `logout()`/`reportSessionExpired()`
  // below. Clearing the cached dsa-foundations progress here too — on every
  // successful login/register, not only on the way out — closes that window
  // completely: whoever is about to be signed in never renders through a
  // stale previous account's cached completions/XP, even for the single
  // React commit before AppStateContext's own backend fetch resolves.
  const login = async (email: string, password: string) => {
    const signedInUser = await client.signIn(email, password)
    progressCache.reset(DSA_COURSE_ID)
    setUser(signedInUser)
    setBootProblem(null)
    setStatus("authenticated")
  }

  const register = async (email: string, password: string, displayName: string) => {
    const registeredUser = await client.register(email, password, displayName)
    progressCache.reset(DSA_COURSE_ID)
    setUser(registeredUser)
    setBootProblem(null)
    setStatus("authenticated")
  }

  const logout = async () => {
    await client.signOut()
    progressCache.reset(DSA_COURSE_ID)
    setUser(null)
    setStatus("unauthenticated")
  }

  const reportSessionExpired = () => {
    progressCache.reset(DSA_COURSE_ID)
    setUser(null)
    setStatus("unauthenticated")
  }

  const value: AuthContextValue = { status, user, bootProblem, login, register, logout, client, reportSessionExpired }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
