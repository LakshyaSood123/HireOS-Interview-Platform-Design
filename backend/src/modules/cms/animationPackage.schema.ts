import { z } from "zod";

import { ANIMATION_PACKAGE_LIMITS, CMS_PACKAGE_CAPABILITIES } from "./animationPackage.types.js";

/** Request shapes for `/api/v1/cms/animation-packages/**` — admin-only, same
 * pattern as cms.schema.ts. */

export const packageIdParams = z.object({ packageId: z.string().trim().min(1).max(64) });
export type PackageIdParams = z.infer<typeof packageIdParams>;

export const packageRevisionParams = z.object({ packageId: z.string().trim().min(1).max(64), revisionId: z.string().trim().min(1).max(32) });
export type PackageRevisionParams = z.infer<typeof packageRevisionParams>;

const packageTraceStepCodeSchema = z.object({
  pseudocode: z.string().min(1).max(ANIMATION_PACKAGE_LIMITS.packageTraceCodeMaxChars),
  python: z.string().max(ANIMATION_PACKAGE_LIMITS.packageTraceCodeMaxChars).nullable().optional(),
  cpp: z.string().max(ANIMATION_PACKAGE_LIMITS.packageTraceCodeMaxChars).nullable().optional(),
  java: z.string().max(ANIMATION_PACKAGE_LIMITS.packageTraceCodeMaxChars).nullable().optional(),
});
const packageTraceStepSchema = z.object({
  id: z
    .string()
    .trim()
    .min(1)
    .max(ANIMATION_PACKAGE_LIMITS.packageTraceStepIdMaxChars)
    .regex(/^[a-zA-Z0-9_-]+$/, "step id must be alphanumeric with _ or - only"),
  label: z.string().trim().min(1).max(ANIMATION_PACKAGE_LIMITS.packageTraceLabelMaxChars),
  animationEvent: z
    .string()
    .trim()
    .min(1)
    .max(ANIMATION_PACKAGE_LIMITS.packageTraceStepIdMaxChars)
    .regex(/^[a-zA-Z0-9_-]+$/, "animationEvent must be alphanumeric with _ or - only")
    .nullable()
    .optional(),
  code: packageTraceStepCodeSchema,
});
/** `trace.json`'s own schema — see animationPackage.types.ts's
 * `CmsPackageTraceStep` comment for why this is a deliberately different
 * (nested, `id`-keyed) wire shape from the existing flat `CmsTraceStep`. */
export const packageTraceSchema = z
  .object({
    version: z.literal(1),
    steps: z.array(packageTraceStepSchema).min(1).max(ANIMATION_PACKAGE_LIMITS.packageTraceMaxSteps),
  })
  .refine((trace) => new Set(trace.steps.map((s) => s.id)).size === trace.steps.length, { message: "Duplicate trace step id." });
export type PackageTraceInput = z.infer<typeof packageTraceSchema>;

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
  /** Whole-tree-replace, same as every other field here — the frontend
   * echoes back whatever `packageTrace` the package currently has (loaded
   * on fetch) so a plain HTML/CSS/JS edit-and-save doesn't silently wipe a
   * trace that came from an earlier ZIP upload. Only a fresh ZIP upload
   * (the separate upload-zip route) actually derives a new value for this
   * from a real trace.json. */
  packageTrace: packageTraceSchema.nullable().optional(),
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
