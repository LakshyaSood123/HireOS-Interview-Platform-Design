import type { ReactNode } from "react"
import { useAuth } from "./AuthContext"
import AuthPage from "./AuthPage"

/** The one place this app's auth boundary lives: wraps the whole application
 * with the smallest possible gate — booting shows a native-styled loading
 * screen, unauthenticated shows AuthPage, authenticated renders `children`
 * (the current app, untouched). No router is introduced; this composes with
 * the app's own `reagvisView`/`page` state exactly as it did before. */
export default function AuthGate({ children }: { children: ReactNode }) {
  const { status, bootProblem } = useAuth()

  if (status === "booting") return <BootScreen />
  if (status === "unauthenticated") return <AuthPage bootProblem={bootProblem} />
  return <>{children}</>
}

function BootScreen() {
  return (
    <div className="min-h-screen bg-[#071A14] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#1DB584]/30 border-t-[#1DB584] animate-spin" aria-hidden="true" />
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Reagvis Trails</p>
      </div>
    </div>
  )
}
