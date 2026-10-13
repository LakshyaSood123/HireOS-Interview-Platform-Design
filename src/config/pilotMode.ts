import { useIsAdmin } from "../auth/AuthContext"

/**
 * Pilot learner surface. When active, the learner sees ONLY the finished course
 * experience: no demo navigator, no Creator Studio, no unfinished DSA world, no
 * mock "Ready %" readiness chip, no link back to the (frozen) interview flow.
 *
 * It is a presentation gate, never an authorization boundary: every CMS route
 * is still `requireRole("admin")` server-side. Admins always keep the full UI.
 *
 * Default ON. Build with `VITE_REAGVIS_PILOT_UI=false` to restore the full
 * development UI for learners (admins are unaffected either way).
 */
export const PILOT_LEARNER_UI_ENABLED = import.meta.env?.VITE_REAGVIS_PILOT_UI !== "false"

/** True for a signed-in non-admin while the pilot surface is enabled. */
export function usePilotLearnerUi(): boolean {
  const isAdmin = useIsAdmin()
  return PILOT_LEARNER_UI_ENABLED && !isAdmin
}
