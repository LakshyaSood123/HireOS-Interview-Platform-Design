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
          setStatus("unauthenticated")
          return
        }
        // API unreachable: keep the learner on the auth screen (never guess
        // an authenticated UI without a confirmed session) but say why.
        setStatus("unauthenticated")
        setBootProblem(error instanceof ApiUnavailableError ? error.message : "Could not confirm your session.")
      })
  }, [client])

  const login = async (email: string, password: string) => {
    const signedInUser = await client.signIn(email, password)
    setUser(signedInUser)
    setBootProblem(null)
    setStatus("authenticated")
  }

  const register = async (email: string, password: string, displayName: string) => {
    const registeredUser = await client.register(email, password, displayName)
    setUser(registeredUser)
    setBootProblem(null)
    setStatus("authenticated")
  }

  const logout = async () => {
    await client.signOut()
    setUser(null)
    setStatus("unauthenticated")
  }

  const value: AuthContextValue = { status, user, bootProblem, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
