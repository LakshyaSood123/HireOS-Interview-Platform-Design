import { useState, type FormEvent, type MouseEvent } from "react"
import OwlAvatar from "../components/OwlAvatar"
import ForestBackdrop from "../components/forest/ForestBackdrop"
import { ApiRequestError, ApiUnavailableError } from "../learning/services/apiClient"
import { signIn, signUp } from "../learning/services/learnerSession"
import { hrefFor, navigate, reloadTo } from "../router"

type AuthMode = "login" | "signup"

interface Props {
  mode: AuthMode
}

/** backend/src/modules/auth/auth.schema.ts — checked here so the form can say so before a round trip. */
const MIN_PASSWORD_LENGTH = 8

const copy: Record<AuthMode, { title: string; subtitle: string; submit: string; busy: string }> = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to pick up your trail where you left off.",
    submit: "Log in",
    busy: "Logging in…",
  },
  signup: {
    title: "Create your account",
    subtitle: "Your XP, streak, progress and notes are saved to your account.",
    submit: "Create account",
    busy: "Creating account…",
  },
}

interface FormError {
  message: string
  /** Offer the other mode — e.g. an email that is already registered. */
  switchTo?: AuthMode
}

function describeError(error: unknown): FormError {
  if (error instanceof ApiUnavailableError) {
    return { message: "We can't reach the server right now. Check your connection and try again." }
  }
  if (error instanceof ApiRequestError) {
    switch (error.code) {
      case "EMAIL_ALREADY_REGISTERED":
        return { message: "That email is already registered.", switchTo: "login" }
      case "UNAUTHENTICATED":
        return { message: "That email and password don't match." }
      case "RATE_LIMITED":
        return { message: "Too many attempts. Wait a few minutes, then try again." }
      case "VALIDATION_ERROR": {
        const issues = error.details?.issues
        const first = Array.isArray(issues) ? (issues[0] as { message?: unknown } | undefined) : undefined
        return { message: typeof first?.message === "string" ? first.message : error.message }
      }
    }
  }
  return { message: "Something went wrong. Please try again." }
}

const inputClass =
  "w-full rounded-xl bg-black/30 border border-white/10 px-4 py-3 text-sm text-white placeholder:text-gray-500 outline-none transition-colors focus:border-[#1DB584] focus:ring-2 focus:ring-[#1DB584]/25"

export default function AuthPage({ mode }: Props) {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<FormError | null>(null)

  const text = copy[mode]
  const isSignup = mode === "signup"

  const switchMode = (next: AuthMode) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    setError(null)
    navigate(next, { replace: true })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (submitting) return

    if (isSignup && password.length < MIN_PASSWORD_LENGTH) {
      setError({ message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` })
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      if (isSignup) await signUp(email.trim(), password, displayName.trim())
      else await signIn(email.trim(), password)
      // A full load, so the session boots as this learner before the landing page renders.
      reloadTo("landing")
    } catch (caught) {
      setError(describeError(caught))
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#071A14] font-display text-white relative overflow-x-hidden flex flex-col">
      <ForestBackdrop intensity="subtle" />

      {/* ── TOP BAR ── */}
      <header className="relative z-10 max-w-7xl w-full mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href={hrefFor("landing")}
          onClick={event => {
            event.preventDefault()
            navigate("landing")
          }}
          className="flex items-center gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg bg-[#1DB584] flex items-center justify-center text-slate-950 font-black shadow-md shadow-[#1DB584]/30">
            🦉
          </div>
          <span className="text-xl font-black text-white tracking-tight">HireOS</span>
        </a>
        <a
          href={hrefFor("landing")}
          onClick={event => {
            event.preventDefault()
            navigate("landing")
          }}
          className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
        >
          ← Back to home
        </a>
      </header>

      {/* ── AUTH CARD ── */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#0F3524] to-[#071A14] border border-[#1DB584]/25 p-6 sm:p-8 shadow-[0_0_60px_rgba(29,181,132,0.12)] animate-fade-up">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="p-2.5 rounded-full bg-[#1DB584]/15 border border-[#1DB584]/30 mb-4">
              <OwlAvatar size={64} state={submitting ? "thinking" : "listening"} />
            </div>
            <h1 className="text-2xl font-black tracking-tight">{text.title}</h1>
            <p className="mt-1.5 text-sm text-emerald-200/70">{text.subtitle}</p>
          </div>

          {/* Mode switch */}
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-black/30 border border-white/10 mb-6" role="tablist">
            {(["login", "signup"] as const).map(option => (
              <a
                key={option}
                href={hrefFor(option)}
                onClick={switchMode(option)}
                role="tab"
                aria-selected={mode === option}
                className={`text-center text-xs font-bold py-2 rounded-lg transition-all ${
                  mode === option ? "bg-[#1DB584] text-white shadow-md shadow-[#1DB584]/25" : "text-gray-400 hover:text-white"
                }`}
              >
                {option === "login" ? "Log in" : "Sign up"}
              </a>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignup && (
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-emerald-200/80">Name</span>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                  maxLength={80}
                  value={displayName}
                  onChange={event => setDisplayName(event.target.value)}
                  placeholder="Alex Chen"
                  className={inputClass}
                />
              </label>
            )}

            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-emerald-200/80">Email</span>
              <input
                type="email"
                name="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={event => setEmail(event.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="flex items-center justify-between text-xs font-semibold text-emerald-200/80">
                <span>Password</span>
                <button
                  type="button"
                  onClick={() => setShowPassword(shown => !shown)}
                  className="text-[11px] font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={isSignup ? MIN_PASSWORD_LENGTH : undefined}
                maxLength={128}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder={isSignup ? `At least ${MIN_PASSWORD_LENGTH} characters` : "Your password"}
                className={inputClass}
              />
            </label>

            {error && (
              <div role="alert" className="rounded-xl border border-[#FB923C]/40 bg-[#FB923C]/10 px-4 py-3 text-xs text-orange-100">
                {error.message}{" "}
                {error.switchTo && (
                  <a
                    href={hrefFor(error.switchTo)}
                    onClick={switchMode(error.switchTo)}
                    className="font-bold text-white underline underline-offset-2"
                  >
                    {error.switchTo === "login" ? "Log in instead" : "Create an account"}
                  </a>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1DB584] to-[#10B981] hover:from-[#159a6f] hover:to-[#0d9668] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#1DB584]/25 transition-all cursor-pointer disabled:cursor-wait disabled:opacity-70"
            >
              {submitting ? text.busy : text.submit}
              {!submitting && <span>➔</span>}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            {isSignup ? "Already have an account? " : "New to Reagvis Trails? "}
            <a
              href={hrefFor(isSignup ? "login" : "signup")}
              onClick={switchMode(isSignup ? "login" : "signup")}
              className="font-bold text-[#1DB584] hover:text-white transition-colors"
            >
              {isSignup ? "Log in" : "Create an account"}
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
