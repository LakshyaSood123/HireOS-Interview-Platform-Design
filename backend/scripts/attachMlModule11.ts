/**
 * Writes Module 11 (Unsupervised Valley -> Gaussian Mixture Models)
 * into the CURRENT machine-learning-foundations CMS draft and attaches its nine
 * animation packages, through the existing CMS services only:
 *
 *   per package: extractZipPackage -> assertAssetContentTypesAllowed ->
 *                capability filter -> validatePackageTraceAgainstManifest ->
 *                createDraftPackage / savePackageDraftContent
 *   then: add ONLY the `gaussian-mixtures` module to the existing `unsupervised-valley` zone's checkpoints in the draft
 *         (content from seed/ml/curriculum/zone-gmm.ts), pointing each
 *         at its package draft with synchronized bridge mode and package trace.
 *
 * Safety: every other zone/module in the draft is compared before and after and
 * the script refuses to save if anything else changed. It never publishes, and
 * packages stay at the "draft" revision (never frozen).
 *
 * Idempotent: unchanged packages report REUSED; an unchanged draft is not re-saved.
 *
 *   npx tsx scripts/attachMlModule11.ts --admin-email=<admin email>
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
import { checkpoint, moduleOf, zoneOf } from "../seed/ml/curriculum/builder.js";
import { gaussianMixtureModuleSpecs } from "../seed/ml/curriculum/zone-gmm.js";

const COURSE = "machine-learning-foundations";
const ZONE_ID = "unsupervised-valley";
const MODULE_ID = "gaussian-mixtures";
const ZONE_META = { id: ZONE_ID, title: "Unsupervised Valley", description: "Finding structure in data that comes without labels." };
const MODULE_META = { id: MODULE_ID, title: "Gaussian Mixture Models", description: "Soft clustering with probability: densities, mixtures, responsibilities and the EM algorithm.", icon: "🔔", accentColor: "#C084FC" };
const KNOWN_CAPS = new Set(["play", "pause", "next", "previous", "reset", "gotoStep"]);
const here = path.dirname(fileURLToPath(import.meta.url));
const ZIP_ROOT = path.resolve(here, "..", "..", "seed", "ml", "module11-zips");

interface Mapping {
  checkpointId: string;
  zip: string;
  expectedSteps: number;
}

export const MAPPINGS: Mapping[] = [
  { checkpointId: "gaussian-mixtures-1", zip: "density-estimation", expectedSteps: 9 },
  { checkpointId: "gaussian-mixtures-2", zip: "mixture-models", expectedSteps: 9 },
  { checkpointId: "gaussian-mixtures-3", zip: "gaussian-mixture-models", expectedSteps: 9 },
  { checkpointId: "gaussian-mixtures-4", zip: "hidden-membership", expectedSteps: 8 },
  { checkpointId: "gaussian-mixtures-5", zip: "responsibilities", expectedSteps: 9 },
  { checkpointId: "gaussian-mixtures-6", zip: "e-step", expectedSteps: 9 },
  { checkpointId: "gaussian-mixtures-7", zip: "m-step", expectedSteps: 10 },
  { checkpointId: "gaussian-mixtures-8", zip: "expectation-maximization", expectedSteps: 10 },
  { checkpointId: "gaussian-mixtures-9", zip: "k-means-vs-gmm", expectedSteps: 11 },
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

    // Build the seven checkpoints from the authored specs.
    const built = gaussianMixtureModuleSpecs.map((spec, i) => checkpoint(MODULE_ID, i, spec));
    if (built.length !== MAPPINGS.length) throw new Error(`expected ${MAPPINGS.length} Module 11 checkpoints, found ${built.length}`);

    const rows: { id: string; title: string; packageId: string; status: string; steps: number }[] = [];
    for (let i = 0; i < MAPPINGS.length; i++) {
      const m = MAPPINGS[i]!;
      const cp = built[i]!;
      if (cp.id !== m.checkpointId) throw new Error(`spec ${i} is ${cp.id}, expected ${m.checkpointId}`);
      const result = await attachPackage(actorId, m, `ML Module 11 — ${cp.title}`);
      rows.push({ id: cp.id, title: cp.title, packageId: result.packageId, status: result.status, steps: result.steps });
      cp.workspace.animation = { kind: "custom", packageId: result.packageId, revisionId: "draft", title: cp.title, bridgeMode: "synchronized" };
      cp.workspace.traceSource = { kind: "package" };
    }

    const draft = await cmsService.getDraft(COURSE);
    const before = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const after = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const zoneBefore = before.find((z) => z.id === ZONE_ID);
    let zone = after.find((z) => z.id === ZONE_ID);
    if (!zone) {
      // Zone 5 is absent: add it with only this module, after the existing zones.
      const newZone: any = zoneOf(after.length, ZONE_META, []);
      newZone.modules = [{ ...moduleOf(ZONE_ID, 0, MODULE_META, []), checkpoints: JSON.parse(JSON.stringify(built)) }];
      after.push(newZone);
      console.log("[module11] zone unsupervised-valley was absent; adding it with module clustering only.");
    } else {
      let mod = zone.modules.find((m: any) => m.id === MODULE_ID);
      if (!mod) {
        mod = { ...moduleOf(ZONE_ID, zone.modules.length, MODULE_META, []), checkpoints: [] };
        zone.modules.push(mod);
        console.log("[module11] module gaussian-mixtures was absent from the existing unsupervised-valley zone; adding it.");
      }
      mod.checkpoints = JSON.parse(JSON.stringify(built));
    }

    // Safety: every other zone is byte-identical; inside the target zone only the target module may differ.
    const others = (zones: any[]) => JSON.stringify(zones.filter((z) => z.id !== ZONE_ID));
    if (others(before) !== others(after)) throw new Error("safety check failed: something outside Module 11 would change; not saving.");
    const zoneAfter = after.find((z) => z.id === ZONE_ID);
    const otherModules = (z: any) => JSON.stringify((z?.modules ?? []).filter((m: any) => m.id !== MODULE_ID));
    if (otherModules(zoneBefore) !== otherModules(zoneAfter)) throw new Error("safety check failed: another module in the zone would change; not saving.");

    if (sameJson(before, after)) {
      console.log("[module11] draft already matches; not re-saved.");
    } else {
      await cmsService.saveDraft(COURSE, actorId, { zones: after, expectedRevision: draft.revision });
      console.log("[module11] draft saved (Module 11 only).");
    }

    const issues = await cmsService.validateDraft(COURSE);
    console.log(`[module11] draft validation: ${issues.length} issue(s)`, issues);

    const reread = await cmsService.getDraft(COURSE);
    const cps = (reread.zones as any[]).find((z) => z.id === ZONE_ID).modules.find((m: any) => m.id === MODULE_ID).checkpoints;
    console.table(rows.map((r) => ({ checkpoint: r.id, package: r.packageId, status: r.status, traceSteps: r.steps })));
    const pointerAfter = await CmsCourse.findOne({ courseId: COURSE }).lean();
    console.log("MODULE11_CHECKPOINTS:", cps.length);
    console.log("MODULE11_ANIMATIONS:", `${cps.filter((c: any) => c.workspace.animation).length}/9`);
    console.log("MODULE11_PACKAGE_TRACES:", `${cps.filter((c: any) => c.workspace.traceSource?.kind === "package").length}/9`);
    console.log("CMS_VALIDATION_ISSUES:", issues.length);
    console.log("PUBLISHED_VERSION_BEFORE:", pointerBefore?.latestPublishedVersion, " AFTER:", pointerAfter?.latestPublishedVersion);
  } finally {
    await mongoose.disconnect();
  }
}

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("attachMlModule11.ts");
if (isEntrypoint) {
  const emailArg = process.argv.find((a) => a.startsWith("--admin-email="));
  main(emailArg?.slice("--admin-email=".length)).catch((err) => {
    console.error("[module11] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
