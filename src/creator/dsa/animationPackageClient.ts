// Custom animation package CRUD, through the same shared auth-aware
// ApiClient as dsaCmsClient.ts — see backend/src/modules/cms/animationPackage.*
// for the server side of this contract (draft/frozen revision model).

import type { ApiClient } from "../../learning/services/apiClient"
import { ApiRequestError } from "../../learning/services/apiClient"
import { CmsRevisionConflictError } from "./dsaCmsClient"
import { CMS_PACKAGE_CAPABILITIES, type CmsPackageCapability } from "./animationBridge"

export { CMS_PACKAGE_CAPABILITIES }
export type { CmsPackageCapability }

export interface CmsPackageManifest {
  bridgeVersion: number
  heightPx: number
  capabilities: CmsPackageCapability[]
  traceEvents: string[]
}

export interface CmsPackageAsset {
  path: string
  contentType: string
  dataBase64: string
}

/** `trace.json`'s own wire format — see the backend's `CmsPackageTraceStep`
 * (animationPackage.types.ts) for why this differs from the flat
 * `CmsDsaTraceStep`. `packageTraceUtils.ts`'s `packageTraceStepToCmsDsaTraceStep`
 * is the one place that flattens it for the "Import into CMS Structured"
 * feature. */
export interface CmsPackageTraceStepCode {
  pseudocode: string
  python?: string | null
  cpp?: string | null
  java?: string | null
}
export interface CmsPackageTraceStep {
  id: string
  label: string
  animationEvent?: string | null
  code: CmsPackageTraceStepCode
}
export interface CmsPackageTrace {
  version: number
  steps: CmsPackageTraceStep[]
}

/** Narration (text-to-speech) that travels with a package revision — see backend narration.types.ts. */
export type CmsNarrationStatus = "MISSING" | "GENERATED" | "STALE" | "DISABLED" | "ERROR"
export interface CmsPackageNarration {
  schemaVersion: number
  enabled: boolean
  defaults: { voice: string; language: string; speed: number }
  steps: Record<string, { enabled: boolean; asset?: string; durationMs?: number; provider?: string; voice?: string; language?: string; speed?: number; sourceTextHash?: string; generatedAt?: string; error?: string }>
  audio: { path: string; contentType: string; dataBase64: string }[]
}

export interface CmsAnimationPackage {
  packageId: string
  revisionId: string
  status: "draft" | "frozen"
  revision: number
  title: string
  manifest: CmsPackageManifest
  sourceKind: "html" | "zip"
  html: string
  css: string | null
  js: string | null
  assets: CmsPackageAsset[]
  packageTrace: CmsPackageTrace | null
  narration?: CmsPackageNarration | null
}

export function createAnimationPackage(client: ApiClient, title: string): Promise<CmsAnimationPackage> {
  return client.request<CmsAnimationPackage>("POST", "/cms/animation-packages", { body: { title } }).then(res => res.data)
}

export function listAnimationPackages(client: ApiClient): Promise<CmsAnimationPackage[]> {
  return client.request<CmsAnimationPackage[]>("GET", "/cms/animation-packages").then(res => res.data)
}

export function getAnimationPackageDraft(client: ApiClient, packageId: string): Promise<CmsAnimationPackage> {
  return client.request<CmsAnimationPackage>("GET", `/cms/animation-packages/${encodeURIComponent(packageId)}`).then(res => res.data)
}

/** Fetches a specific revision — `"draft"` or a frozen `"r1"`, `"r2"`, … .
 * Use this (not `getAnimationPackageDraft`) whenever rendering a
 * checkpoint's animation as it's ACTUALLY referenced, since that reference
 * may point at a frozen revision, not necessarily the current mutable
 * draft. */
export function getAnimationPackageRevision(client: ApiClient, packageId: string, revisionId: string): Promise<CmsAnimationPackage> {
  return client.request<CmsAnimationPackage>("GET", `/cms/animation-packages/${encodeURIComponent(packageId)}/revisions/${encodeURIComponent(revisionId)}`).then(res => res.data)
}

async function withConflictHandling<T>(promise: Promise<T>): Promise<T> {
  try {
    return await promise
  } catch (error) {
    if (error instanceof ApiRequestError && error.code === "VALIDATION_ERROR" && typeof error.details?.currentRevision === "number") {
      throw new CmsRevisionConflictError(error.details.currentRevision)
    }
    throw error
  }
}

export function saveAnimationPackageContent(
  client: ApiClient,
  packageId: string,
  input: {
    title: string
    manifest: Omit<CmsPackageManifest, "bridgeVersion">
    html: string
    css?: string | null
    js?: string | null
    /** Whole-tree-replace, like every other field — pass the package's
     * CURRENT `packageTrace` back unchanged unless intentionally clearing
     * or replacing it, or a plain HTML/CSS/JS edit will silently wipe a
     * trace that came from an earlier ZIP upload. */
    packageTrace?: CmsPackageTrace | null
    expectedRevision: number
  },
): Promise<CmsAnimationPackage> {
  return withConflictHandling(client.request<CmsAnimationPackage>("PATCH", `/cms/animation-packages/${encodeURIComponent(packageId)}`, { body: input }).then(res => res.data))
}

export function uploadAnimationPackageZip(client: ApiClient, packageId: string, title: string, zipBase64: string, expectedRevision: number): Promise<CmsAnimationPackage> {
  return withConflictHandling(
    client.request<CmsAnimationPackage>("POST", `/cms/animation-packages/${encodeURIComponent(packageId)}/upload-zip`, { body: { title, zipBase64, expectedRevision } }).then(res => res.data),
  )
}

/** Reads a File (from an `<input type=file>`) as a base64 string — used for
 * both the single-HTML-file and ZIP upload paths. Runs entirely client-side;
 * the file is never treated as executable here, only as bytes to forward. */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const comma = result.indexOf(",")
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read file"))
    reader.readAsDataURL(file)
  })
}

// ── Narration (admin) ─────────────────────────────────────────────────────────────────────────────────────────────
// Generation runs on the backend with the server-configured provider; the browser never sees provider credentials.

export interface CmsNarrationStepView {
  stepId: string
  label: string
  heading: string
  explanation: string
  status: CmsNarrationStatus
  enabled: boolean
  voice?: string
  language?: string
  speed?: number
  durationMs?: number
  generatedAt?: string
  provider?: string
  asset?: string
  bytes?: number
  error?: string
}
export interface CmsNarrationIssue {
  severity: "error" | "warning"
  code: string
  stepId?: string
  message: string
}
export interface CmsNarrationOverview {
  packageId: string
  revisionId: string
  title: string
  enabled: boolean
  defaults: { voice: string; language: string; speed: number }
  provider: { configured: string; isProduction: boolean; available: boolean; problem?: string; defaultVoice?: string }
  counts: Record<CmsNarrationStatus, number> & { total: number }
  totalAudioBytes: number
  steps: CmsNarrationStepView[]
  issues: CmsNarrationIssue[]
}
export interface CmsNarrationGenerationSummary {
  packageId: string
  provider: string
  mode: string
  generated: number
  reused: number
  skipped: number
  failed: number
  steps: { stepId: string; outcome: "generated" | "reused" | "skipped" | "failed"; reason?: string; durationMs?: number }[]
}

const pkgPath = (packageId: string) => `/cms/animation-packages/${encodeURIComponent(packageId)}`

export function getNarrationOverview(client: ApiClient, packageId: string, revisionId = "draft"): Promise<CmsNarrationOverview> {
  return client.request<CmsNarrationOverview>("GET", `${pkgPath(packageId)}/narration?revisionId=${encodeURIComponent(revisionId)}`).then(res => res.data)
}

export function updateNarrationSettings(
  client: ApiClient,
  packageId: string,
  patch: { enabled?: boolean; defaults?: Partial<CmsNarrationOverview["defaults"]>; steps?: Record<string, { enabled?: boolean }> },
): Promise<CmsNarrationOverview> {
  return client.request<CmsNarrationOverview>("PATCH", `${pkgPath(packageId)}/narration`, { body: patch }).then(res => res.data)
}

/** Local speech generation takes seconds per step (and the model loads on first use), far beyond the client's normal 6 s request limit. */
const NARRATION_GENERATION_TIMEOUT_MS = 15 * 60_000

export function generateNarration(
  client: ApiClient,
  packageId: string,
  input: { mode: "missing" | "stale" | "missing-and-stale" | "step"; stepId?: string; force?: boolean },
): Promise<CmsNarrationGenerationSummary> {
  return client.request<CmsNarrationGenerationSummary>("POST", `${pkgPath(packageId)}/narration/generate`, { body: input, timeoutMs: NARRATION_GENERATION_TIMEOUT_MS }).then(res => res.data)
}

export function getNarrationAudio(client: ApiClient, packageId: string, revisionId: string, stepId: string): Promise<{ contentType: string; dataBase64: string; durationMs: number | null }> {
  return client.request<{ contentType: string; dataBase64: string; durationMs: number | null }>("GET", `${pkgPath(packageId)}/revisions/${encodeURIComponent(revisionId)}/narration/audio/${encodeURIComponent(stepId)}`).then(res => res.data)
}
