// The Animation block for a package-backed (custom ZIP) animation inside a
// normal lesson. Rendered by LessonWorkspace in the SAME slot as a registered
// animation — it is not a special panel.
//
// It only ever uses the shared sandboxed host (creator/dsa/components/
// CustomAnimationHost.tsx: sandbox="allow-scripts", CSP, bridge v1). The
// package comes from the learner-safe endpoint, which serves only the exact
// frozen revision referenced by the learner's pinned curriculum.
//
// Trace sync, both directions, over the existing bridge v1 contract:
//   animation STEP_CHANGED(eventId) → trace row with that animationEvent is highlighted
//   trace row click                 → host.gotoStep(eventId)  (GOTO_STEP)

import { useEffect, useRef, useState } from "react"
import CustomAnimationHost, { type CustomAnimationHostHandle } from "../../creator/dsa/components/CustomAnimationHost"
import { fetchLearnerAnimationPackage, type LearnerAnimationPackage } from "../../learning/services/learnerCourseApi"
import { useAuth } from "../../auth/AuthContext"
import { SessionExpiredError, ApiUnavailableError } from "../../learning/services/apiClient"
import type { LearnerCustomAnimation } from "../../learning/types"
import { presentTraceLanguages, codeForTraceLanguage, findTraceStepForEvent, TRACE_LANGUAGE_LABEL, type TraceLanguage } from "../../learning/packageTrace"
import PackageTracePanel from "./PackageTracePanel"

/** Loads the package for an animation reference. */
export type AnimationPackageLoader = (packageId: string, revisionId: string) => Promise<LearnerAnimationPackage>

interface PackageAnimationBlockProps {
  courseId: string
  animation: LearnerCustomAnimation
  /** Overrides the default learner-safe fetch. Creator Studio preview passes
   * its authenticated creator-API loader so draft packages can be previewed;
   * the learner runtime never sets this. */
  loadPackage?: AnimationPackageLoader
}

export default function PackageAnimationBlock({ courseId, animation, loadPackage }: PackageAnimationBlockProps) {
  const { client, reportSessionExpired } = useAuth()
  const [pkg, setPkg] = useState<LearnerAnimationPackage | null>(null)
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading")
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [currentEventId, setCurrentEventId] = useState<string | null>(null)
  const [language, setLanguage] = useState<TraceLanguage>("pseudocode")
  const hostRef = useRef<CustomAnimationHostHandle>(null)

  useEffect(() => {
    let cancelled = false
    setStatus("loading")
    setError(null)
    setCurrentEventId(null)
    const load = loadPackage
      ? loadPackage(animation.packageId, animation.revisionId)
      : fetchLearnerAnimationPackage(client, courseId, animation.packageId, animation.revisionId)
    load
      .then(loaded => {
        if (cancelled) return
        setPkg(loaded)
        setStatus("ready")
      })
      .catch(err => {
        if (cancelled) return
        if (err instanceof SessionExpiredError) {
          reportSessionExpired()
          return
        }
        // No fallback: an animation that cannot be loaded is shown as an error.
        setError(err instanceof ApiUnavailableError
          ? "Can't reach the server right now. Check your connection and try again."
          : "This animation could not be loaded.")
        if (!(err instanceof ApiUnavailableError)) console.error("[reagvis] animation package load failed", err)
        setStatus("error")
      })
    return () => {
      cancelled = true
    }
  }, [client, courseId, animation.packageId, animation.revisionId, attempt])

  if (status === "loading") {
    return <div className="p-6 text-sm text-gray-300">Loading animation…</div>
  }

  if (status === "error" || !pkg) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-amber-200">{error ?? "This animation could not be loaded."}</p>
        <button
          onClick={() => setAttempt(n => n + 1)}
          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#1DB584] hover:bg-[#159a6f] cursor-pointer"
        >
          Retry
        </button>
      </div>
    )
  }

  const trace = pkg.packageTrace && pkg.packageTrace.steps.length > 0 ? pkg.packageTrace : null
  const languages = trace ? presentTraceLanguages(trace.steps) : []
  const selectedLanguage: TraceLanguage = languages.includes(language) ? language : "pseudocode"
  const activeStep = trace ? findTraceStepForEvent(trace.steps, currentEventId) : undefined

  return (
    <div className="p-1 space-y-3 min-w-0">
      {animation.title && <p className="px-3 pt-2 text-xs font-bold text-gray-300">{animation.title}</p>}
      <CustomAnimationHost
        ref={hostRef}
        pkg={pkg}
        bridgeMode={animation.bridgeMode}
        onStepChanged={setCurrentEventId}
      />
      {trace && (
        <PackageTracePanel
          steps={trace.steps}
          languages={languages}
          selectedLanguage={selectedLanguage}
          languageLabel={TRACE_LANGUAGE_LABEL}
          onSelectLanguage={setLanguage}
          activeEventId={activeStep?.animationEvent ?? null}
          codeFor={(step) => codeForTraceLanguage(step, selectedLanguage)}
          onSelectStep={(eventId) => {
            setCurrentEventId(eventId)
            hostRef.current?.gotoStep(eventId)
          }}
        />
      )}
    </div>
  )
}
