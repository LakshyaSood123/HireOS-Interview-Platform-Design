/**
 * Custom HTML animation packages — the deferred "Custom HTML Animation
 * Source" subsystem. Kept as its own collection (`cmsAnimationPackages`),
 * one document per REVISION, mirroring the existing `cmsCourse`/
 * `cmsCourseVersion` split: a package has a stable `packageId` and a single
 * mutable `"draft"` revision the author edits, plus zero or more immutable
 * `"frozen"` revisions created automatically the moment a course draft that
 * references the package's current draft content gets published (see
 * `freezePackageRevisionIfNeeded` in animationPackage.service.ts).
 *
 * This is what makes "published course version N keeps referencing exact
 * package revision A even after the author edits the animation" hold: a
 * `CmsCourseVersion` document never embeds package content, only a
 * `{ packageId, revisionId }` reference (see `CmsAnimationSource` in
 * cms.types.ts) — the same reference-not-embed pattern the course version
 * itself already uses for `AlgorithmAnimationId` (registered animations).
 */

export const CMS_PACKAGE_CAPABILITIES = ["play", "pause", "next", "previous", "reset", "gotoStep"] as const;
export type CmsPackageCapability = (typeof CMS_PACKAGE_CAPABILITIES)[number];

export const CMS_BRIDGE_MODES = ["standalone", "controlled", "synchronized"] as const;
export type CmsBridgeMode = (typeof CMS_BRIDGE_MODES)[number];

export const CMS_PACKAGE_STATUSES = ["draft", "frozen"] as const;
export type CmsPackageStatus = (typeof CMS_PACKAGE_STATUSES)[number];

export const CMS_PACKAGE_SOURCE_KINDS = ["html", "zip"] as const;
export type CmsPackageSourceKind = (typeof CMS_PACKAGE_SOURCE_KINDS)[number];

/** Currently fixed at 1 — bumped only if the postMessage contract itself
 * changes shape (see animationBridge.ts on the frontend, the single source
 * of truth for the actual message schema both sides validate against). */
export const CMS_BRIDGE_VERSION = 1;

export interface CmsPackageAsset {
  /** Relative path as it appeared in the uploaded ZIP, e.g. "assets/tile.png". */
  path: string;
  contentType: string;
  /** Base64-encoded bytes. Bounded — see ANIMATION_PACKAGE_LIMITS. */
  dataBase64: string;
}

export interface CmsPackageManifest {
  bridgeVersion: number;
  /** Suggested render height in px — the sandbox iframe's default height;
   * the host may still cap it. */
  heightPx: number;
  /** Which LEVEL 2 commands this package actually declares it responds to.
   * The parent bridge never sends a command not in this list. */
  capabilities: CmsPackageCapability[];
  /** LEVEL 3 semantic step ids this package declares it may emit via
   * STEP_CHANGED, and accepts via GOTO_STEP. Advisory for authoring/
   * validation (matching against Code Trace step ids) — not enforced at
   * the bridge transport level beyond basic string shape. */
  traceEvents: string[];
}

/**
 * `trace.json`'s own wire format — deliberately NOT the same shape as the
 * existing `CmsTraceStep` (cms.types.ts: `stepId`, flat `pseudocode`/
 * `python`/`cpp`/`java` fields). `id`/nested `code.{pseudocode,...}` is what
 * this project's generated AI prompts instruct an external tool to produce
 * (see promptGenerator.ts on the frontend) — a natural, self-documenting
 * external file format. `packageTraceStepToCmsTraceStep` (frontend) is the
 * one place that flattens it into the existing internal `CmsTraceStep`
 * shape for the "Import into CMS Structured" feature — there is still only
 * ONE internal structured-trace model; trace.json is just its own honest
 * external contract, not a second internal one.
 */
export interface CmsPackageTraceStepCode {
  pseudocode: string;
  python?: string | null;
  cpp?: string | null;
  java?: string | null;
}
export interface CmsPackageTraceStep {
  id: string;
  label: string;
  animationEvent?: string | null;
  code: CmsPackageTraceStepCode;
}
export interface CmsPackageTrace {
  version: number;
  steps: CmsPackageTraceStep[];
}

export interface CmsAnimationPackageContent {
  title: string;
  manifest: CmsPackageManifest;
  sourceKind: CmsPackageSourceKind;
  /** Required — the package's entry document. For sourceKind "html" this is
   * the single uploaded/authored file. For "zip" this is the extracted
   * animation.html. */
  html: string;
  css?: string | null;
  js?: string | null;
  assets: CmsPackageAsset[];
  /** Parsed, validated `trace.json` — absent for a single-HTML upload or a
   * ZIP that didn't include one (both remain fully valid packages). Part of
   * the SAME immutable package revision as everything else above — see
   * `freezePackageRevisionIfNeeded` in animationPackage.service.ts, whose
   * content hash now includes this field so a trace-only edit mints a new
   * frozen revision exactly like an html/css/js edit would. */
  packageTrace?: CmsPackageTrace | null;
}

export interface CmsAnimationPackageRevision extends CmsAnimationPackageContent {
  packageId: string;
  revisionId: string;
  status: CmsPackageStatus;
  revision: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

/** Hard limits enforced both by the zod schema (animationPackage.schema.ts)
 * and, for ZIP uploads, during extraction itself (so a bomb never even
 * reaches the zod check as one giant string) — see
 * animationPackage.service.ts's `extractZipPackage`. Chosen to comfortably
 * fit a small interactive animation while keeping a package far under
 * MongoDB's 16MB document limit even with several frozen revisions
 * accumulated over time. */
export const ANIMATION_PACKAGE_LIMITS = {
  htmlMaxChars: 200_000,
  cssMaxChars: 100_000,
  jsMaxChars: 200_000,
  titleMaxChars: 200,
  maxAssetCount: 20,
  maxAssetBytes: 500_000,
  maxTotalAssetBytes: 3_000_000,
  maxZipCompressedBytes: 12_000_000,
  maxZipUncompressedBytes: 8_000_000,
  maxZipEntryCount: 80,
  traceEventsMaxCount: 200,
  traceEventIdMaxChars: 64,
  // trace.json limits — deliberately close to the existing CMS Structured
  // trace limits (cms.schema.ts's `traceStepSchema`) so the two stay
  // consistent, not two independently-drifting numbers.
  packageTraceMaxSteps: 200,
  packageTraceStepIdMaxChars: 64,
  packageTraceLabelMaxChars: 200,
  packageTraceCodeMaxChars: 2000,
  packageTraceJsonMaxBytes: 200_000,
} as const;

export const ANIMATION_PACKAGE_ASSET_CONTENT_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;
