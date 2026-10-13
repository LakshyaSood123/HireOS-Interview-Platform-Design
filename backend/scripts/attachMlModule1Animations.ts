/**
 * Attaches the four Module 1 animation ZIPs to the CURRENT machine-learning-foundations
 * CMS draft, through the same service calls Creator Studio's upload route uses
 * (extractZipPackage -> assertAssetContentTypesAllowed -> capability filter ->
 * validatePackageTraceAgainstManifest -> createDraftPackage/savePackageDraftContent),
 * then updates ONLY the four checkpoints' workspace.animation and traceSource
 * fields in the draft. It never publishes — packages stay at revision "draft",
 * never frozen to r1/r2/....
 *
 * Idempotent: re-running compares each ZIP's extracted content against the
 * package's current draft content and only saves (and bumps the package's
 * revision counter) when something actually changed.
 *
 *   npx tsx scripts/attachMlModule1Animations.ts --admin-email=<admin email>
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import * as animationPackageService from "../src/modules/cms/animationPackage.service.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import { resolveActorId } from "./lib/resolveActorId.js";

export const ML_COURSE_ID = "machine-learning-foundations";
const KNOWN_CAPS = new Set(["play", "pause", "next", "previous", "reset", "gotoStep"]);
const here = path.dirname(fileURLToPath(import.meta.url));
const ZIP_ROOT = path.resolve(here, "..", "..", "seed", "ml", "module1-zips");
const SOURCE_ROOT = path.resolve(here, "..", "..", "seed", "ml", "animations");

interface Mapping {
  checkpointId: string;
  checkpointTitle: string;
  /** Prebuilt ZIP in seed/ml/module1-zips (new packages). */
  zipFile?: string;
  /** Source folder under seed/ml/animations (existing packages 1–3, zipped in memory). */
  sourceDir?: string;
  /** Existing packages must already exist; they are updated, never created. */
  mustExist?: boolean;
  packageTitle: string;
  expectedSteps: number;
}

export const MAPPINGS: Mapping[] = [
  { checkpointId: "ml-foundations-1", checkpointTitle: "What is Machine Learning?", sourceDir: "what-is-machine-learning", mustExist: true, packageTitle: "ML Seed — What is Machine Learning?", expectedSteps: 5 },
  { checkpointId: "ml-foundations-2", checkpointTitle: "Data, Features & Labels", sourceDir: "features-and-labels", mustExist: true, packageTitle: "ML Seed — Features and Labels", expectedSteps: 5 },
  { checkpointId: "ml-foundations-3", checkpointTitle: "Linear Regression — The Line That Learns", sourceDir: "linear-regression-learning", mustExist: true, packageTitle: "ML Seed — Linear Regression: The Line That Learns", expectedSteps: 7 },
  { checkpointId: "ml-foundations-4", checkpointTitle: "Training, Validation & Testing", zipFile: "training-validation-testing.zip", packageTitle: "ML Module 1 — Training, Validation & Testing", expectedSteps: 8 },
  { checkpointId: "ml-foundations-5", checkpointTitle: "Generalization, Underfitting & Overfitting", zipFile: "generalization-fit-comparison.zip", packageTitle: "ML Module 1 — Generalization, Underfitting & Overfitting", expectedSteps: 6 },
  { checkpointId: "ml-foundations-6", checkpointTitle: "Supervised vs Unsupervised Learning", zipFile: "supervised-vs-unsupervised.zip", packageTitle: "ML Module 1 — Supervised vs Unsupervised Learning", expectedSteps: 6 },
  { checkpointId: "ml-foundations-7", checkpointTitle: "The Machine Learning Workflow", zipFile: "ml-workflow.zip", packageTitle: "ML Module 1 — The Machine Learning Workflow", expectedSteps: 10 },
];

// Mongoose `.lean()` documents carry `_id`/`__v` on every subdocument (each
// trace step included) and do not guarantee the same key order as freshly
// parsed JSON from the ZIP. A naive JSON.stringify comparison treats those as
// real differences and would call savePackageDraftContent (bumping the
// package's revision counter) on every run even when nothing changed. This
// canonicalizes both sides — sorted keys, `_id`/`__v` stripped, `undefined`
// treated the same as a missing key — before comparing.
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
function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

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

async function attachOne(actorId: string, mapping: Mapping) {
  let zipBuffer: Buffer;
  if (mapping.sourceDir) {
    const dir = path.join(SOURCE_ROOT, mapping.sourceDir);
    const zip = new JSZip();
    for (const f of ["animation.html", "animation.css", "animation.js", "manifest.json", "trace.json"]) zip.file(f, readFileSync(path.join(dir, f)));
    zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  } else {
    zipBuffer = readFileSync(path.join(ZIP_ROOT, mapping.zipFile as string));
  }
  const label = mapping.zipFile ?? mapping.sourceDir;

  // Same validation the upload route performs, in the same order.
  const extracted = await animationPackageService.extractZipPackage(zipBuffer);
  animationPackageService.assertAssetContentTypesAllowed(extracted.assets);
  const capabilities = (extracted.manifestFromZip?.capabilities ?? []).filter((c) => KNOWN_CAPS.has(c)) as any;
  const traceEvents = extracted.manifestFromZip?.traceEvents ?? [];
  if (extracted.packageTrace) {
    animationPackageService.validatePackageTraceAgainstManifest(extracted.packageTrace, traceEvents);
  }
  if (!extracted.packageTrace) throw new Error(`${label}: no trace.json found; refusing to attach without a Package Trace.`);
  if (extracted.packageTrace.steps.length !== mapping.expectedSteps) {
    throw new Error(`${label}: expected ${mapping.expectedSteps} trace steps, found ${extracted.packageTrace.steps.length}.`);
  }

  const input = {
    title: mapping.packageTitle,
    manifest: { heightPx: extracted.manifestFromZip?.heightPx ?? 420, capabilities, traceEvents },
    html: extracted.html,
    css: extracted.css,
    js: extracted.js,
    packageTrace: extracted.packageTrace,
  };

  const existing = await CmsAnimationPackage.findOne({ title: mapping.packageTitle, status: "draft" }).lean();
  let packageId: string;
  let status: "CREATED" | "REUSED" | "UPDATED";

  if (existing) {
    packageId = existing.packageId;
    if (contentEquals(existing, input)) {
      status = "REUSED";
    } else {
      await animationPackageService.savePackageDraftContent(packageId, actorId, { ...input, expectedRevision: existing.revision }, "zip", extracted.assets);
      status = "UPDATED";
    }
  } else {
    if (mapping.mustExist) throw new Error(`${label}: expected an existing package titled "${mapping.packageTitle}" but none was found; refusing to create a new one.`);
    const created = await animationPackageService.createDraftPackage(actorId, mapping.packageTitle);
    packageId = created.packageId;
    await animationPackageService.savePackageDraftContent(packageId, actorId, { ...input, expectedRevision: created.revision }, "zip", extracted.assets);
    status = "CREATED";
  }

  return { packageId, status, traceSteps: extracted.packageTrace.steps.length };
}

async function main(adminEmail: string | undefined) {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const actorId = await resolveActorId(adminEmail);

    const rows: { checkpointId: string; packageId: string; status: string; traceSteps: number }[] = [];
    for (const mapping of MAPPINGS) {
      const result = await attachOne(actorId, mapping);
      rows.push({ checkpointId: mapping.checkpointId, packageId: result.packageId, status: result.status, traceSteps: result.traceSteps });
      console.log(`[attach] ${mapping.checkpointId}: ${result.status} package ${result.packageId} (${result.traceSteps} trace steps)`);
    }

    // Update ONLY the four checkpoints' animation/traceSource fields in the current draft.
    const draft = await cmsService.getDraft(ML_COURSE_ID);
    const zones = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const byCheckpoint = new Map(rows.map((r) => [r.checkpointId, r]));
    let touched = 0;
    for (const zone of zones) {
      for (const module of zone.modules) {
        for (const cp of module.checkpoints) {
          const row = byCheckpoint.get(cp.id);
          if (!row) continue;
          cp.workspace.animation = { kind: "custom", packageId: row.packageId, revisionId: "draft", title: cp.title, bridgeMode: "synchronized" };
          cp.workspace.traceSource = { kind: "package" };
          touched += 1;
        }
      }
    }
    if (touched !== MAPPINGS.length) throw new Error(`attachMl: expected to touch ${MAPPINGS.length} checkpoints, touched ${touched}.`);

    await cmsService.saveDraft(ML_COURSE_ID, actorId, { zones, expectedRevision: draft.revision });
    const issues = await cmsService.validateDraft(ML_COURSE_ID);
    console.log(`[attach] draft validation: ${issues.length} issue(s)`, issues);

    // Re-read and verify all seven Module 1 checkpoints.
    const reread = await cmsService.getDraft(ML_COURSE_ID);
    const basecamp = (reread.zones as any[]).find((z) => z.id === "ml-basecamp").modules.find((m: any) => m.id === "ml-foundations");
    console.log("\n[attach] Module 1 checkpoints after attachment:");
    for (const cp of basecamp.checkpoints) {
      const anim = cp.workspace.animation;
      console.log(`  ${cp.id}: animation=${anim ? `${anim.kind}:${anim.packageId}@${anim.revisionId}` : "none"} trace=${cp.workspace.traceSource?.kind ?? "none"}`);
    }

    console.log("\nCMS_DRAFT_VALIDATION_ISSUES:", issues.length);
    console.log("MODULE1_CHECKPOINTS:", basecamp.checkpoints.length);
    const animatedCount = basecamp.checkpoints.filter((cp: any) => Boolean(cp.workspace.animation)).length;
    const tracedCount = basecamp.checkpoints.filter((cp: any) => cp.workspace.traceSource?.kind === "package").length;
    console.log("MODULE1_ANIMATIONS_ATTACHED:", `${animatedCount}/7`);
    console.log("MODULE1_PACKAGE_TRACES:", `${tracedCount}/7`);

    const pointer = await CmsCourse.findOne({ courseId: ML_COURSE_ID }).lean();
    console.log("PUBLISHED_VERSION_AFTER:", pointer?.latestPublishedVersion);
  } finally {
    await mongoose.disconnect();
  }
}

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("attachMlModule1Animations.ts");
if (isEntrypoint) {
  const emailArg = process.argv.find((a) => a.startsWith("--admin-email="));
  main(emailArg?.slice("--admin-email=".length)).catch((err) => {
    console.error("[attach] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
