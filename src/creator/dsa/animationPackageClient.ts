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
