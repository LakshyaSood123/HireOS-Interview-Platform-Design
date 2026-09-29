import { z } from "zod";

import { ANIMATION_PACKAGE_LIMITS, CMS_PACKAGE_CAPABILITIES } from "./animationPackage.types.js";

/** Request shapes for `/api/v1/cms/animation-packages/**` — admin-only, same
 * pattern as cms.schema.ts. */

export const packageIdParams = z.object({ packageId: z.string().trim().min(1).max(64) });
export type PackageIdParams = z.infer<typeof packageIdParams>;

export const packageRevisionParams = z.object({ packageId: z.string().trim().min(1).max(64), revisionId: z.string().trim().min(1).max(32) });
export type PackageRevisionParams = z.infer<typeof packageRevisionParams>;

const manifestInputSchema = z.object({
  heightPx: z.number().int().min(80).max(2000),
  capabilities: z.array(z.enum(CMS_PACKAGE_CAPABILITIES)).max(CMS_PACKAGE_CAPABILITIES.length),
  traceEvents: z
    .array(z.string().trim().min(1).max(ANIMATION_PACKAGE_LIMITS.traceEventIdMaxChars))
    .max(ANIMATION_PACKAGE_LIMITS.traceEventsMaxCount)
    .default([]),
});

export const createPackageSchema = z.object({
  title: z.string().trim().min(1).max(ANIMATION_PACKAGE_LIMITS.titleMaxChars),
});
export type CreatePackageInput = z.infer<typeof createPackageSchema>;

/** Direct HTML/CSS/JS authoring (or the result of a ZIP upload already
 * extracted server-side) — the whole-tree replace of a package draft's
 * content, same "always saves the full draft" shape as `saveDraftSchema`. */
export const savePackageContentSchema = z.object({
  title: z.string().trim().min(1).max(ANIMATION_PACKAGE_LIMITS.titleMaxChars),
  manifest: manifestInputSchema,
  html: z.string().min(1).max(ANIMATION_PACKAGE_LIMITS.htmlMaxChars),
  css: z.string().max(ANIMATION_PACKAGE_LIMITS.cssMaxChars).nullable().optional(),
  js: z.string().max(ANIMATION_PACKAGE_LIMITS.jsMaxChars).nullable().optional(),
  expectedRevision: z.number().int().min(1),
});
export type SavePackageContentInput = z.infer<typeof savePackageContentSchema>;

/** ZIP upload body — base64 rather than multipart (see animationPackage
 * service header comment): keeps this API entirely JSON, gated by the same
 * JSON_BODY_LIMIT as every other route, with an additional explicit
 * decoded-size check in the service layer before the archive is even
 * opened. */
export const uploadZipPackageSchema = z.object({
  title: z.string().trim().min(1).max(ANIMATION_PACKAGE_LIMITS.titleMaxChars),
  zipBase64: z.string().min(1),
  expectedRevision: z.number().int().min(1),
});
export type UploadZipPackageInput = z.infer<typeof uploadZipPackageSchema>;
