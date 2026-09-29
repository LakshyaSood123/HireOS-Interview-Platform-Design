import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

import type { ClientSession } from "mongoose";
import JSZip from "jszip";

import { ApiError } from "../../shared/errors.js";
import { CmsAnimationPackage, type CmsAnimationPackageAttributes } from "./animationPackage.model.js";
import {
  ANIMATION_PACKAGE_ASSET_CONTENT_TYPES,
  ANIMATION_PACKAGE_LIMITS,
  CMS_BRIDGE_VERSION,
  type CmsAnimationPackageContent,
  type CmsPackageAsset,
} from "./animationPackage.types.js";

const DRAFT_REVISION_ID = "draft";

function contentHash(content: Pick<CmsAnimationPackageContent, "title" | "manifest" | "html" | "css" | "js" | "assets">): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: content.title,
        manifest: content.manifest,
        html: content.html,
        css: content.css ?? null,
        js: content.js ?? null,
        assets: content.assets.map((a) => ({ path: a.path, contentType: a.contentType, dataBase64: a.dataBase64 })),
      }),
    )
    .digest("hex");
}

export async function createDraftPackage(actorId: string, title: string): Promise<CmsAnimationPackageAttributes> {
  const packageId = randomUUID();
  const doc = await CmsAnimationPackage.create({
    packageId,
    revisionId: DRAFT_REVISION_ID,
    status: "draft",
    revision: 1,
    createdBy: actorId,
    updatedBy: actorId,
    title,
    manifest: { bridgeVersion: CMS_BRIDGE_VERSION, heightPx: 420, capabilities: [], traceEvents: [] },
    sourceKind: "html",
    html: "<!doctype html>\n<html>\n  <body>\n    <!-- Custom animation entry point -->\n  </body>\n</html>\n",
    css: null,
    js: null,
    assets: [],
  });
  return doc.toObject();
}

export async function getPackageRevision(packageId: string, revisionId: string): Promise<CmsAnimationPackageAttributes> {
  const doc = await CmsAnimationPackage.findOne({ packageId, revisionId }).lean();
  if (!doc) throw ApiError.notFound(`Animation package "${packageId}" revision "${revisionId}" not found.`);
  return doc;
}

export async function getDraftPackage(packageId: string): Promise<CmsAnimationPackageAttributes> {
  return getPackageRevision(packageId, DRAFT_REVISION_ID);
}

export async function listPackages(): Promise<CmsAnimationPackageAttributes[]> {
  return CmsAnimationPackage.find({ status: "draft" }).sort({ updatedAt: -1 }).lean();
}

export async function savePackageDraftContent(
  packageId: string,
  actorId: string,
  input: { title: string; manifest: Omit<CmsAnimationPackageContent["manifest"], "bridgeVersion">; html: string; css?: string | null; js?: string | null; expectedRevision: number },
  sourceKind: "html" | "zip" = "html",
  assets: CmsPackageAsset[] = [],
): Promise<CmsAnimationPackageAttributes> {
  const draft = await CmsAnimationPackage.findOne({ packageId, status: "draft" });
  if (!draft) throw ApiError.notFound(`No draft revision exists for animation package "${packageId}".`);

  if (draft.revision !== input.expectedRevision) {
    throw new ApiError("VALIDATION_ERROR", "This animation package has changed since you loaded it — reload and reapply your edit.", {
      expectedRevision: input.expectedRevision,
      currentRevision: draft.revision,
    });
  }

  draft.title = input.title;
  draft.manifest = { bridgeVersion: CMS_BRIDGE_VERSION, heightPx: input.manifest.heightPx, capabilities: input.manifest.capabilities, traceEvents: input.manifest.traceEvents } as CmsAnimationPackageAttributes["manifest"];
  draft.sourceKind = sourceKind;
  draft.html = input.html;
  draft.css = input.css ?? null;
  draft.js = input.js ?? null;
  draft.assets = assets as CmsAnimationPackageAttributes["assets"];
  draft.updatedBy = actorId as unknown as CmsAnimationPackageAttributes["updatedBy"];
  draft.revision += 1;
  await draft.save();
  return draft.toObject();
}

/** Path safety for ZIP entries — rejects traversal (`../`), absolute paths,
 * and Windows drive-letter paths. Applied to every entry name BEFORE it is
 * read, not after. */
function isSafeZipEntryPath(entryPath: string): boolean {
  if (!entryPath || entryPath.trim().length === 0) return false;
  if (entryPath.startsWith("/") || entryPath.startsWith("\\")) return false;
  if (/^[a-zA-Z]:/.test(entryPath)) return false;
  const segments = entryPath.split(/[/\\]/);
  if (segments.some((segment) => segment === "..")) return false;
  return true;
}

const TEXT_EXTENSIONS: Record<string, "html" | "css" | "js" | "json"> = {
  ".html": "html",
  ".htm": "html",
  ".css": "css",
  ".js": "js",
  ".json": "json",
};

const IMAGE_EXTENSIONS: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

function extensionOf(path: string): string {
  const dot = path.lastIndexOf(".");
  return dot === -1 ? "" : path.slice(dot).toLowerCase();
}

export interface ExtractedZipPackage {
  html: string;
  css: string | null;
  js: string | null;
  assets: CmsPackageAsset[];
  manifestFromZip: { heightPx?: number; capabilities?: string[]; traceEvents?: string[] } | null;
}

/**
 * Parses and validates an uploaded ZIP with defenses against: path
 * traversal, absolute/drive-letter paths, symlink entries, too many
 * entries, oversized compressed/uncompressed payloads (archive-bomb
 * defense — the uncompressed-size cap is enforced incrementally, entry by
 * entry, so a small compressed bomb is rejected before it fully inflates),
 * and disallowed file types. `animation.html` is required at the archive
 * root. Never executes any extracted content — everything here is a text
 * read via JSZip's in-memory inflate.
 */
export async function extractZipPackage(zipBuffer: Buffer): Promise<ExtractedZipPackage> {
  if (zipBuffer.byteLength > ANIMATION_PACKAGE_LIMITS.maxZipCompressedBytes) {
    throw ApiError.validation(`ZIP is too large (${zipBuffer.byteLength} bytes) — max ${ANIMATION_PACKAGE_LIMITS.maxZipCompressedBytes} bytes compressed.`);
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch {
    throw ApiError.validation("The uploaded file is not a valid ZIP archive.");
  }

  const entries = Object.values(zip.files).filter((entry) => !entry.dir);
  if (entries.length === 0) throw ApiError.validation("The ZIP archive is empty.");
  if (entries.length > ANIMATION_PACKAGE_LIMITS.maxZipEntryCount) {
    throw ApiError.validation(`ZIP has too many entries (${entries.length}) — max ${ANIMATION_PACKAGE_LIMITS.maxZipEntryCount}.`);
  }

  let html: string | null = null;
  let css: string | null = null;
  let js: string | null = null;
  let manifestFromZip: ExtractedZipPackage["manifestFromZip"] = null;
  const assets: CmsPackageAsset[] = [];
  let totalUncompressedBytes = 0;
  let totalAssetBytes = 0;

  for (const entry of entries) {
    const path = entry.name;
    if (!isSafeZipEntryPath(path)) {
      throw ApiError.validation(`Unsafe entry path in ZIP: "${path}".`);
    }
    // JSZip surfaces the raw external file attributes; the Unix symlink bit
    // (S_IFLNK, 0o120000) lives in the top 16 bits when the archive was
    // created on a Unix-like system. A regular file/dir never sets it.
    const unixMode = (entry.unixPermissions ?? 0) as number;
    if ((unixMode & 0o170000) === 0o120000) {
      throw ApiError.validation(`Symlink entries are not allowed in ZIP uploads: "${path}".`);
    }

    const ext = extensionOf(path);
    const isTopLevel = !path.includes("/") && !path.includes("\\");

    if (TEXT_EXTENSIONS[ext]) {
      const text = await entry.async("string");
      totalUncompressedBytes += Buffer.byteLength(text, "utf8");
      if (totalUncompressedBytes > ANIMATION_PACKAGE_LIMITS.maxZipUncompressedBytes) {
        throw ApiError.validation(`ZIP contents exceed the uncompressed size limit (${ANIMATION_PACKAGE_LIMITS.maxZipUncompressedBytes} bytes).`);
      }
      const kind = TEXT_EXTENSIONS[ext];
      if (kind === "html" && isTopLevel && /^animation\.html?$/i.test(path)) {
        if (text.length > ANIMATION_PACKAGE_LIMITS.htmlMaxChars) throw ApiError.validation("animation.html exceeds the maximum allowed size.");
        html = text;
      } else if (kind === "css" && isTopLevel && /^animation\.css$/i.test(path)) {
        if (text.length > ANIMATION_PACKAGE_LIMITS.cssMaxChars) throw ApiError.validation("animation.css exceeds the maximum allowed size.");
        css = text;
      } else if (kind === "js" && isTopLevel && /^animation\.js$/i.test(path)) {
        if (text.length > ANIMATION_PACKAGE_LIMITS.jsMaxChars) throw ApiError.validation("animation.js exceeds the maximum allowed size.");
        js = text;
      } else if (kind === "json" && isTopLevel && /^manifest\.json$/i.test(path)) {
        try {
          const parsed = JSON.parse(text);
          manifestFromZip = {
            heightPx: typeof parsed.heightPx === "number" ? parsed.heightPx : undefined,
            capabilities: Array.isArray(parsed.capabilities) ? parsed.capabilities.filter((c: unknown) => typeof c === "string") : undefined,
            traceEvents: Array.isArray(parsed.traceEvents) ? parsed.traceEvents.filter((c: unknown) => typeof c === "string") : undefined,
          };
        } catch {
          throw ApiError.validation("manifest.json is not valid JSON.");
        }
      } else {
        // FAIL CLOSED rather than silently drop. This matters even for an
        // entry that arrives here with an already-harmless name: JSZip
        // resolves `..`/`.` segments while it parses the central directory,
        // so a ZIP built with a literal path like "../evil.js" is handed to
        // us here as plain "evil.js" — the traversal is neutralized before
        // `isSafeZipEntryPath` ever runs, but silently accepting the
        // resulting stray file would mean the archive's actual (hostile)
        // intent was masked rather than rejected. Any entry that isn't a
        // top-level animation.html/css/js, a top-level manifest.json, or an
        // assets/ image (handled below) is unexpected and rejects the whole
        // upload — found via a genuinely hostile ZIP fixture built with
        // Python's zipfile (whose writer does not path-normalize), sent to
        // this real endpoint.
        throw ApiError.validation(`Unexpected file in ZIP: "${path}". Only animation.html, animation.css, animation.js, manifest.json (all top-level), and images under assets/ are allowed.`);
      }
      continue;
    }

    if (IMAGE_EXTENSIONS[ext] && path.toLowerCase().startsWith("assets/")) {
      const buf = await entry.async("nodebuffer");
      totalUncompressedBytes += buf.byteLength;
      totalAssetBytes += buf.byteLength;
      if (totalUncompressedBytes > ANIMATION_PACKAGE_LIMITS.maxZipUncompressedBytes) {
        throw ApiError.validation(`ZIP contents exceed the uncompressed size limit (${ANIMATION_PACKAGE_LIMITS.maxZipUncompressedBytes} bytes).`);
      }
      if (buf.byteLength > ANIMATION_PACKAGE_LIMITS.maxAssetBytes) {
        throw ApiError.validation(`Asset "${path}" exceeds the per-file size limit (${ANIMATION_PACKAGE_LIMITS.maxAssetBytes} bytes).`);
      }
      if (totalAssetBytes > ANIMATION_PACKAGE_LIMITS.maxTotalAssetBytes) {
        throw ApiError.validation(`Total asset size exceeds the limit (${ANIMATION_PACKAGE_LIMITS.maxTotalAssetBytes} bytes).`);
      }
      if (assets.length >= ANIMATION_PACKAGE_LIMITS.maxAssetCount) {
        throw ApiError.validation(`Too many assets — max ${ANIMATION_PACKAGE_LIMITS.maxAssetCount}.`);
      }
      assets.push({ path, contentType: IMAGE_EXTENSIONS[ext]!, dataBase64: buf.toString("base64") });
      continue;
    }

    // Any other file type (fonts, videos, arbitrary binaries, dotfiles,
    // `.map` files, etc.) is rejected outright rather than silently
    // skipped — an author who needs it should ask for that extension to be
    // added deliberately, not have it quietly vanish from their package.
    throw ApiError.validation(`Unsupported file type in ZIP: "${path}". Allowed: html, css, js, json, and images under assets/ (${Object.values(IMAGE_EXTENSIONS).join(", ")}).`);
  }

  if (!html) {
    throw ApiError.validation("The ZIP archive must contain animation.html at its root.");
  }

  return { html, css, js, assets, manifestFromZip };
}

const contentTypeAllowed = new Set<string>(ANIMATION_PACKAGE_ASSET_CONTENT_TYPES);
export function assertAssetContentTypesAllowed(assets: CmsPackageAsset[]): void {
  for (const asset of assets) {
    if (!contentTypeAllowed.has(asset.contentType)) {
      throw ApiError.validation(`Unsupported asset content type: "${asset.contentType}".`);
    }
  }
}

/**
 * Called from `cms.service.ts`'s `publishDraft`, inside the SAME
 * transaction, for every checkpoint whose `workspace.animation` is
 * `{ kind: "custom", revisionId: "draft" }`. Freezes the package's current
 * draft content into a new immutable revision (`r1`, `r2`, …) and returns
 * that revision id to substitute into the PUBLISHED course version's copy
 * of the reference — the course DRAFT keeps pointing at `"draft"`, so
 * continued editing is unaffected.
 *
 * Idempotent per unchanged content: if the draft's content hash matches
 * `lastFrozenContentHash`, the previously-frozen revision id is reused
 * instead of minting a new one, so publishing repeatedly without touching
 * the animation doesn't pile up redundant frozen copies.
 */
export async function freezePackageRevisionIfNeeded(packageId: string, session: ClientSession | undefined): Promise<string> {
  const draft = await CmsAnimationPackage.findOne({ packageId, status: "draft" }).session(session ?? null);
  if (!draft) throw ApiError.notFound(`Animation package "${packageId}" has no draft revision to freeze.`);

  const hash = contentHash({
    title: draft.title,
    manifest: draft.manifest as CmsAnimationPackageContent["manifest"],
    html: draft.html,
    css: draft.css ?? null,
    js: draft.js ?? null,
    assets: (draft.assets ?? []) as CmsPackageAsset[],
  });

  if (draft.lastFrozenContentHash === hash && draft.lastFrozenRevisionId) {
    return draft.lastFrozenRevisionId;
  }

  const frozenCount = await CmsAnimationPackage.countDocuments({ packageId, status: "frozen" }).session(session ?? null);
  const revisionId = `r${frozenCount + 1}`;

  await CmsAnimationPackage.create(
    [
      {
        packageId,
        revisionId,
        status: "frozen",
        revision: draft.revision,
        createdBy: draft.createdBy,
        updatedBy: draft.updatedBy,
        title: draft.title,
        manifest: draft.manifest,
        sourceKind: draft.sourceKind,
        html: draft.html,
        css: draft.css,
        js: draft.js,
        assets: draft.assets,
      },
    ],
    { session },
  );

  draft.lastFrozenRevisionId = revisionId;
  draft.lastFrozenContentHash = hash;
  await draft.save({ session });

  return revisionId;
}
