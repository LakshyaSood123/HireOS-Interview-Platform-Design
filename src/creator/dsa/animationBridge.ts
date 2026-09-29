// The Reagvis Animation Bridge — the narrow, versioned postMessage contract
// between a custom animation package's sandboxed iframe (the "child") and
// CustomAnimationHost.tsx (the "parent", inside Creator Studio's Preview
// Draft / animation preview). Both sides of this file are pure data + pure
// functions — no DOM access, so it's usable from both CustomAnimationHost
// (parent) and, as documentation/reference, by package authors writing
// their own animation.js (the actual child-side postMessage calls are the
// PACKAGE's own code, not shipped by Reagvis — see the manifest's
// `capabilities`/`traceEvents` for what a package DECLARES it does).
//
// Three bridge modes (declared per-checkpoint in `CmsDsaCustomAnimationSource.bridgeMode`):
//   "standalone"   — the iframe renders itself; the parent sends nothing.
//   "controlled"   — the parent may send PLAY/PAUSE/NEXT/PREVIOUS/RESET/
//                     GOTO_STEP, but ONLY commands the package's own
//                     manifest.capabilities actually lists.
//   "synchronized" — controlled, plus the package emits STEP_CHANGED with a
//                     semantic step id the parent can hand to CodeTracePanel.

export const BRIDGE_VERSION = 1

export const BRIDGE_COMMANDS = ["PLAY", "PAUSE", "NEXT", "PREVIOUS", "RESET", "GOTO_STEP"] as const
export type BridgeCommand = (typeof BRIDGE_COMMANDS)[number]

/** Manifest capability names — the lowercase form authors declare in a
 * package's manifest (matches the backend's `CMS_PACKAGE_CAPABILITIES`,
 * animationPackage.types.ts, exactly). */
export const CMS_PACKAGE_CAPABILITIES = ["play", "pause", "next", "previous", "reset", "gotoStep"] as const
export type CmsPackageCapability = (typeof CMS_PACKAGE_CAPABILITIES)[number]

export const BRIDGE_EVENTS = ["READY", "STEP_CHANGED", "HEIGHT_CHANGED"] as const
export type BridgeEventType = (typeof BRIDGE_EVENTS)[number]

/** A step id is a short, author-chosen semantic token (e.g. "compare-mid") —
 * never free-form prose, never serialized animation internals. Matches the
 * same shape as `traceEventIdMaxChars`/step-id validation on the backend
 * (animationPackage.types.ts) so a value that's valid in one place is valid
 * in the other. */
const STEP_ID_PATTERN = /^[a-zA-Z0-9_-]{1,64}$/

export interface BridgeCommandMessage {
  bridgeVersion: number
  type: BridgeCommand
  /** Present only for GOTO_STEP. */
  stepId?: string
}

export interface BridgeEventMessage {
  bridgeVersion: number
  type: BridgeEventType
  /** Present only for STEP_CHANGED. */
  stepId?: string
  /** Present only for HEIGHT_CHANGED — a bounded, sane pixel height; see
   * `isSafeHeight`. */
  heightPx?: number
}

const MAX_SAFE_HEIGHT_PX = 4000
const MIN_SAFE_HEIGHT_PX = 40

function isSafeHeight(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= MIN_SAFE_HEIGHT_PX && value <= MAX_SAFE_HEIGHT_PX
}

/**
 * Schema-validates a raw `MessageEvent.data` as a `BridgeEventMessage`
 * (child -> parent direction). Returns `null` for anything that doesn't
 * match exactly — unknown type, wrong bridge version, malformed payload —
 * so the caller can silently ignore it rather than crash or half-trust it.
 * Does NOT check `event.source` — that's the caller's job (see
 * CustomAnimationHost.tsx), since only the caller has the iframe reference
 * to compare against.
 */
export function parseBridgeEvent(data: unknown): BridgeEventMessage | null {
  if (!data || typeof data !== "object") return null
  const d = data as Record<string, unknown>
  if (d.bridgeVersion !== BRIDGE_VERSION) return null
  if (typeof d.type !== "string" || !(BRIDGE_EVENTS as readonly string[]).includes(d.type)) return null

  if (d.type === "STEP_CHANGED") {
    if (typeof d.stepId !== "string" || !STEP_ID_PATTERN.test(d.stepId)) return null
    return { bridgeVersion: BRIDGE_VERSION, type: "STEP_CHANGED", stepId: d.stepId }
  }
  if (d.type === "HEIGHT_CHANGED") {
    if (!isSafeHeight(d.heightPx)) return null
    return { bridgeVersion: BRIDGE_VERSION, type: "HEIGHT_CHANGED", heightPx: d.heightPx }
  }
  if (d.type === "READY") {
    return { bridgeVersion: BRIDGE_VERSION, type: "READY" }
  }
  return null
}

/** Builds a parent -> child command, refusing to build one the package
 * hasn't declared support for (`declaredCapabilities` — the manifest's
 * `capabilities`, lowercased command names). This is enforced again, redundantly,
 * on the SENDING side in CustomAnimationHost.tsx — belt-and-braces, since a
 * package that never asked for PLAY should never receive it even if some
 * future caller forgets to check. */
export function buildBridgeCommand(type: BridgeCommand, declaredCapabilities: readonly string[], stepId?: string): BridgeCommandMessage | null {
  // `"GOTO_STEP".toLowerCase()` is `"goto_step"` (the underscore survives
  // lowercasing) — comparing that against the literal `"gotostep"` never
  // matched, so this fell through to the `else` branch and always looked
  // up a `"goto_step"` capability that no manifest ever declares (the real
  // key is `"gotoStep"`, camelCase — see CMS_PACKAGE_CAPABILITIES above).
  // GOTO_STEP has never actually been sendable through this function.
  // Found via a literal end-to-end round-trip test (an independently
  // authored package clicking a real trace-step jump button).
  const capabilityKey = type === "GOTO_STEP" ? "gotoStep" : (type.toLowerCase() as string)
  if (!declaredCapabilities.includes(capabilityKey)) return null
  if (type === "GOTO_STEP") {
    if (!stepId || !STEP_ID_PATTERN.test(stepId)) return null
    return { bridgeVersion: BRIDGE_VERSION, type, stepId }
  }
  return { bridgeVersion: BRIDGE_VERSION, type }
}

export function isValidStepId(value: unknown): value is string {
  return typeof value === "string" && STEP_ID_PATTERN.test(value)
}
