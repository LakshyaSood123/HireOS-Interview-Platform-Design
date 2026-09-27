import { useState } from "react"
import LessonCampBackdrop from "../components/lesson/camp/LessonCampBackdrop"
import { useAuth } from "./AuthContext"
import { ApiRequestError, ApiUnavailableError } from "../learning/services/apiClient"

type Mode = "login" | "register"

const INPUT_CLASS =
  "w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm text-gray-100 placeholder:text-gray-500 outline-none focus:ring-1 focus:ring-[#1DB584]/60 focus:border-[#1DB584]/60"
const PRIMARY_BTN =
  "w-full px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] shadow-md shadow-[#1DB584]/30 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#071A14]"

function readableAuthError(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof ApiUnavailableError) return "Can't reach the server right now. Check your connection and try again."
  return "Something went wrong. Please try again."
}

/** Auth screen — native Reagvis Trails styling (dark forest/camp theme, the
 * same shell used by the Lesson Workspace, Module Mastery Quiz and Concept
 * Code Lab), shown only while signed out. */
export default function AuthPage({ bootProblem }: { bootProblem?: string | null }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitting) return
    setSubmitting(true)
    setError(null)
    try {
      if (mode === "login") await login(email, password)
      else await register(email, password, displayName)
    } catch (err) {
      setError(readableAuthError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-[#071A14] font-display text-white overflow-x-hidden flex items-center justify-center px-4 py-10">
      <LessonCampBackdrop />
      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#A7CE65]">Reagvis Labs</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight">Reagvis Trails</h1>
        </div>

        <div className="rounded-3xl bg-white/[0.04] border border-white/10 p-6 shadow-2xl">
          <div className="flex rounded-xl bg-black/30 border border-white/10 p-1 mb-5" role="tablist" aria-label="Sign in or create an account">
            {(["login", "register"] as const).map(m => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m)
                  setError(null)
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E2B44A] ${
                  mode === m ? "bg-[#1DB584] text-white" : "text-gray-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Log In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-3.5" noValidate>
            {mode === "register" && (
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Name</span>
                <input
                  type="text"
                  required
                  autoComplete="name"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className={`${INPUT_CLASS} mt-1`}
                  placeholder="Your name"
                />
              </label>
            )}
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`${INPUT_CLASS} mt-1`}
                placeholder="you@example.com"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Password</span>
              <input
                type="password"
                required
                minLength={mode === "register" ? 8 : undefined}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`${INPUT_CLASS} mt-1`}
                placeholder={mode === "register" ? "At least 8 characters" : "••••••••"}
              />
            </label>

            {error && (
              <p role="alert" className="text-xs leading-relaxed text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {!error && bootProblem && (
              <p className="text-xs leading-relaxed text-gray-400 bg-white/5 border border-white/10 rounded-lg px-3 py-2">{bootProblem}</p>
            )}

            <button type="submit" disabled={submitting} className={PRIMARY_BTN}>
              {submitting ? (mode === "login" ? "Logging in…" : "Creating account…") : mode === "login" ? "Log In" : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
