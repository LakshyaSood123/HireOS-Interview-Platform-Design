/**
 * Writes Module 5 (Probability Grove -> Estimation & Uncertainty)
 * into the CURRENT machine-learning-foundations CMS draft and attaches its eight
 * animation packages, through the existing CMS services only:
 *
 *   per package: extractZipPackage -> assertAssetContentTypesAllowed ->
 *                capability filter -> validatePackageTraceAgainstManifest ->
 *                createDraftPackage / savePackageDraftContent
 *   then: replace ONLY the `estimation-uncertainty` module's checkpoints in the draft
 *         (content from seed/ml/curriculum/zone-mathematics.ts), pointing each
 *         at its package draft with synchronized bridge mode and package trace.
 *
 * Safety: every other zone/module in the draft is compared before and after and
 * the script refuses to save if anything else changed. It never publishes, and
 * packages stay at the "draft" revision (never frozen).
 *
 * Idempotent: unchanged packages report REUSED; an unchanged draft is not re-saved.
 *
 *   npx tsx scripts/attachMlModule5.ts --admin-email=<admin email>
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import * as animationPackageService from "../src/modules/cms/animationPackage.service.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import { checkpoint } from "../seed/ml/curriculum/builder.js";
import { estimationUncertaintySpecs } from "../seed/ml/curriculum/zone-estimation-uncertainty.js";

const COURSE = "machine-learning-foundations";
const ZONE_ID = "probability-grove";
const MODULE_ID = "estimation-uncertainty";
const KNOWN_CAPS = new Set(["play", "pause", "next", "previous", "reset", "gotoStep"]);
const here = path.dirname(fileURLToPath(import.meta.url));
const ZIP_ROOT = path.resolve(here, "..", "..", "seed", "ml", "module5-zips");

interface Mapping {
  checkpointId: string;
  zip: string;
  expectedSteps: number;
}

export const MAPPINGS: Mapping[] = [
  { checkpointId: "estimation-uncertainty-1", zip: "estimation-what", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-2", zip: "mle", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-3", zip: "likelihood-vs-probability", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-4", zip: "bayesian-thinking", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-5", zip: "map-estimation", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-6", zip: "mle-vs-map", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-7", zip: "law-of-large-numbers", expectedSteps: 8 },
  { checkpointId: "estimation-uncertainty-8", zip: "central-limit-theorem", expectedSteps: 10 },
];

// Mongoose `.lean()` documents carry `_id`/`__v` on subdocuments and a different
// key order than freshly parsed JSON; compare canonical forms so an unchanged
// package is REUSED instead of being re-saved on every run.
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      if (key === "_id" || key === "__v") continue;
      const v = (value as Record<string, unknown>)[key];
      if (v === undefined || v === null) continue;
      out[key] = canonicalize(v);
    }
    return out;
  }
  return value;
}
const sameJson = (a: unknown, b: unknown) => JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));

function contentEquals(existing: any, input: { manifest: any; html: string; css: string | null; js: string | null; packageTrace: unknown }): boolean {
  return (
    existing.html === input.html &&
    (existing.css ?? null) === (input.css ?? null) &&
    (existing.js ?? null) === (input.js ?? null) &&
    existing.manifest.heightPx === input.manifest.heightPx &&
    sameJson(existing.manifest.capabilities ?? [], input.manifest.capabilities ?? []) &&
    sameJson(existing.manifest.traceEvents ?? [], input.manifest.traceEvents ?? []) &&
    sameJson(existing.packageTrace ?? null, input.packageTrace ?? null)
  );
}

async function attachPackage(actorId: string, mapping: Mapping, title: string) {
  const zipBuffer = readFileSync(path.join(ZIP_ROOT, `${mapping.zip}.zip`));
  const extracted = await animationPackageService.extractZipPackage(zipBuffer);
  animationPackageService.assertAssetContentTypesAllowed(extracted.assets);
  const capabilities = (extracted.manifestFromZip?.capabilities ?? []).filter((c) => KNOWN_CAPS.has(c)) as any;
  const traceEvents = extracted.manifestFromZip?.traceEvents ?? [];
  if (!extracted.packageTrace) throw new Error(`${mapping.zip}: no trace.json; refusing to attach without a Package Trace.`);
  animationPackageService.validatePackageTraceAgainstManifest(extracted.packageTrace, traceEvents);
  if (extracted.packageTrace.steps.length !== mapping.expectedSteps) {
    throw new Error(`${mapping.zip}: expected ${mapping.expectedSteps} trace steps, found ${extracted.packageTrace.steps.length}.`);
  }

  const input = {
    title,
    manifest: { heightPx: extracted.manifestFromZip?.heightPx ?? 420, capabilities, traceEvents },
    html: extracted.html,
    css: extracted.css,
    js: extracted.js,
    packageTrace: extracted.packageTrace,
  };

  const existing = await CmsAnimationPackage.findOne({ title, status: "draft" }).lean();
  if (existing) {
    if (contentEquals(existing, input)) return { packageId: existing.packageId, status: "REUSED" as const, steps: input.packageTrace.steps.length };
    await animationPackageService.savePackageDraftContent(existing.packageId, actorId, { ...input, expectedRevision: existing.revision }, "zip", extracted.assets);
    return { packageId: existing.packageId, status: "UPDATED" as const, steps: input.packageTrace.steps.length };
  }
  const created = await animationPackageService.createDraftPackage(actorId, title);
  await animationPackageService.savePackageDraftContent(created.packageId, actorId, { ...input, expectedRevision: created.revision }, "zip", extracted.assets);
  return { packageId: created.packageId, status: "CREATED" as const, steps: input.packageTrace.steps.length };
}

async function main(adminEmail: string | undefined) {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const actorId = await resolveActorId(adminEmail);
    const pointerBefore = await CmsCourse.findOne({ courseId: COURSE }).lean();

    // Build the eight checkpoints from the authored specs.
    const built = estimationUncertaintySpecs.map((spec, i) => checkpoint(MODULE_ID, i, spec));
    if (built.length !== MAPPINGS.length) throw new Error(`expected ${MAPPINGS.length} Module 5 checkpoints, found ${built.length}`);

    const rows: { id: string; title: string; packageId: string; status: string; steps: number }[] = [];
    for (let i = 0; i < MAPPINGS.length; i++) {
      const m = MAPPINGS[i]!;
      const cp = built[i]!;
      if (cp.id !== m.checkpointId) throw new Error(`spec ${i} is ${cp.id}, expected ${m.checkpointId}`);
      const result = await attachPackage(actorId, m, `ML Module 5 — ${cp.title}`);
      rows.push({ id: cp.id, title: cp.title, packageId: result.packageId, status: result.status, steps: result.steps });
      cp.workspace.animation = { kind: "custom", packageId: result.packageId, revisionId: "draft", title: cp.title, bridgeMode: "synchronized" };
      cp.workspace.traceSource = { kind: "package" };
    }

    const draft = await cmsService.getDraft(COURSE);
    const before = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const after = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const zone = after.find((z) => z.id === ZONE_ID);
    const mod = zone?.modules.find((m: any) => m.id === MODULE_ID);
    if (!mod) throw new Error(`draft has no ${ZONE_ID} / ${MODULE_ID} module`);
    // Preserve existing order values and ids; replace the checkpoint list only.
    mod.checkpoints = JSON.parse(JSON.stringify(built));

    // Safety: nothing outside the Calculus module may differ.
    const strip = (zones: any[]) =>
      JSON.stringify(zones.map((z) => ({ ...z, modules: z.modules.filter((m: any) => !(z.id === ZONE_ID && m.id === MODULE_ID)) })));
    if (strip(before) !== strip(after)) throw new Error("safety check failed: something outside Module 5 would change; not saving.");

    if (sameJson(before, after)) {
      console.log("[module5] draft already matches; not re-saved.");
    } else {
      await cmsService.saveDraft(COURSE, actorId, { zones: after, expectedRevision: draft.revision });
      console.log("[module5] draft saved (Module 5 only).");
    }

    const issues = await cmsService.validateDraft(COURSE);
    console.log(`[module5] draft validation: ${issues.length} issue(s)`, issues);

    const reread = await cmsService.getDraft(COURSE);
    const cps = (reread.zones as any[]).find((z) => z.id === ZONE_ID).modules.find((m: any) => m.id === MODULE_ID).checkpoints;
    console.table(rows.map((r) => ({ checkpoint: r.id, package: r.packageId, status: r.status, traceSteps: r.steps })));
    const pointerAfter = await CmsCourse.findOne({ courseId: COURSE }).lean();
    console.log("MODULE5_CHECKPOINTS:", cps.length);
    console.log("MODULE5_ANIMATIONS:", `${cps.filter((c: any) => c.workspace.animation).length}/8`);
    console.log("MODULE5_PACKAGE_TRACES:", `${cps.filter((c: any) => c.workspace.traceSource?.kind === "package").length}/8`);
    console.log("CMS_VALIDATION_ISSUES:", issues.length);
    console.log("PUBLISHED_VERSION_BEFORE:", pointerBefore?.latestPublishedVersion, " AFTER:", pointerAfter?.latestPublishedVersion);
  } finally {
    await mongoose.disconnect();
  }
}

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("attachMlModule5.ts");
if (isEntrypoint) {
  const emailArg = process.argv.find((a) => a.startsWith("--admin-email="));
  main(emailArg?.slice("--admin-email=".length)).catch((err) => {
    console.error("[module5] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
