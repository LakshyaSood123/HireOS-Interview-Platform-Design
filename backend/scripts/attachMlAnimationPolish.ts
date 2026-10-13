/**
 * Course-wide ML animation polish: attaches the rebuilt animation packages (per-step explanations, educational
 * autoplay pacing, 640px height budget) of ALL 115 checkpoints to the CURRENT machine-learning-foundations draft,
 * through the same service calls Creator Studio's upload route uses:
 *
 *   per package: extractZipPackage -> assertAssetContentTypesAllowed -> capability filter ->
 *                validatePackageTraceAgainstManifest -> savePackageDraftContent (draft revision of the SAME package)
 *   then: point every checkpoint's workspace.animation at the package's draft revision.
 *
 * It touches nothing else: lessons, Quick Checks, prerequisites, XP, ids and ordering are compared before and after
 * (apart from the animation revision reference) and the script refuses to save if anything else would change.
 * It never publishes and never touches learners.
 *
 * Idempotent: unchanged packages report REUSED and an unchanged draft is not re-saved.
 *
 *   npx tsx scripts/attachMlAnimationPolish.ts --admin-email=<admin email>
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
import { MAPPINGS as M1 } from "./attachMlModule1Animations.js";
import { MAPPINGS as M2 } from "./attachMlModule2.js";
import { MAPPINGS as M3 } from "./attachMlModule3.js";
import { MAPPINGS as M4 } from "./attachMlModule4.js";
import { MAPPINGS as M5 } from "./attachMlModule5.js";
import { MAPPINGS as M6 } from "./attachMlModule6.js";
import { MAPPINGS as M7 } from "./attachMlModule7.js";
import { MAPPINGS as M8 } from "./attachMlModule8.js";
import { MAPPINGS as M9 } from "./attachMlModule9.js";
import { MAPPINGS as M10 } from "./attachMlModule10.js";
import { MAPPINGS as M11 } from "./attachMlModule11.js";
import { MAPPINGS as M12 } from "./attachMlModule12.js";
import { MAPPINGS as M13 } from "./attachMlModule13.js";

const COURSE = "machine-learning-foundations";
const KNOWN_CAPS = new Set(["play", "pause", "next", "previous", "reset", "gotoStep"]);
const here = path.dirname(fileURLToPath(import.meta.url));
const ML = path.resolve(here, "..", "..", "seed", "ml");

interface Item {
  checkpointId: string;
  expectedSteps: number;
  /** A prebuilt ZIP. */
  zipPath?: string;
  /** A source folder under seed/ml/animations (the three original Module 1 packages), zipped in memory. */
  sourceDir?: string;
}

function items(): Item[] {
  const out: Item[] = [];
  for (const m of M1 as any[]) {
    out.push({ checkpointId: m.checkpointId, expectedSteps: m.expectedSteps, zipPath: m.zipFile ? path.join(ML, "module1-zips", m.zipFile) : undefined, sourceDir: m.sourceDir ? path.join(ML, "animations", m.sourceDir) : undefined });
  }
  const rest: [number, { checkpointId: string; zip: string; expectedSteps: number }[]][] = [[2, M2], [3, M3], [4, M4], [5, M5], [6, M6], [7, M7], [8, M8], [9, M9], [10, M10], [11, M11], [12, M12], [13, M13]];
  for (const [n, list] of rest) for (const m of list) out.push({ checkpointId: m.checkpointId, expectedSteps: m.expectedSteps, zipPath: path.join(ML, `module${n}-zips`, `${m.zip}.zip`) });
  return out;
}

// Mongoose `.lean()` documents carry `_id`/`__v` and a different key order than parsed JSON; compare canonical forms.
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

async function zipBufferFor(item: Item): Promise<Buffer> {
  if (item.sourceDir) {
    const zip = new JSZip();
    for (const f of ["animation.html", "animation.css", "animation.js", "manifest.json", "trace.json"]) zip.file(f, readFileSync(path.join(item.sourceDir, f)));
    return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  }
  return readFileSync(item.zipPath as string);
}

async function attachOne(actorId: string, item: Item, packageId: string) {
  const extracted = await animationPackageService.extractZipPackage(await zipBufferFor(item));
  animationPackageService.assertAssetContentTypesAllowed(extracted.assets);
  const capabilities = (extracted.manifestFromZip?.capabilities ?? []).filter((c) => KNOWN_CAPS.has(c)) as any;
  const traceEvents = extracted.manifestFromZip?.traceEvents ?? [];
  if (!extracted.packageTrace) throw new Error(`${item.checkpointId}: no trace.json; refusing to attach without a Package Trace.`);
  animationPackageService.validatePackageTraceAgainstManifest(extracted.packageTrace, traceEvents);
  if (extracted.packageTrace.steps.length !== item.expectedSteps) {
    throw new Error(`${item.checkpointId}: expected ${item.expectedSteps} trace steps, found ${extracted.packageTrace.steps.length}.`);
  }
  const existing: any = await CmsAnimationPackage.findOne({ packageId, status: "draft" }).lean();
  if (!existing) throw new Error(`${item.checkpointId}: package ${packageId} has no draft revision to update (refusing to create new packages in this task).`);
  const input = {
    title: existing.title,
    manifest: { heightPx: extracted.manifestFromZip?.heightPx ?? 420, capabilities, traceEvents },
    html: extracted.html,
    css: extracted.css,
    js: extracted.js,
    packageTrace: extracted.packageTrace,
  };
  if (contentEquals(existing, input)) return { status: "REUSED" as const, steps: input.packageTrace.steps.length };
  await animationPackageService.savePackageDraftContent(packageId, actorId, { ...input, expectedRevision: existing.revision }, "zip", extracted.assets);
  return { status: "UPDATED" as const, steps: input.packageTrace.steps.length };
}

async function main(adminEmail: string | undefined) {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  try {
    const actorId = await resolveActorId(adminEmail);
    const pointerBefore = await CmsCourse.findOne({ courseId: COURSE }).lean();
    const draft = await cmsService.getDraft(COURSE);
    const before = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const after = JSON.parse(JSON.stringify(draft.zones)) as any[];
    const cpById = new Map<string, any>();
    for (const z of after) for (const m of z.modules) for (const c of m.checkpoints) cpById.set(c.id, c);

    const list = items();
    const ids = new Set(list.map((i) => i.checkpointId));
    if (list.length !== cpById.size || ![...cpById.keys()].every((id) => ids.has(id))) {
      throw new Error(`mapping covers ${list.length} checkpoints but the draft has ${cpById.size}`);
    }

    const counts = { CREATED: 0, UPDATED: 0, REUSED: 0 };
    const rows: { id: string; status: string; steps: number }[] = [];
    for (const item of list) {
      const cp = cpById.get(item.checkpointId);
      const animation = cp?.workspace?.animation;
      if (!animation || animation.kind !== "custom") throw new Error(`${item.checkpointId}: no custom animation in the draft`);
      const r = await attachOne(actorId, item, animation.packageId);
      counts[r.status]++;
      rows.push({ id: item.checkpointId, status: r.status, steps: r.steps });
      animation.revisionId = "draft";
    }

    // Safety: apart from the animation revision reference, nothing in the course may differ.
    const strip = (zones: any[]) => JSON.parse(JSON.stringify(zones, (k, v) => (k === "revisionId" ? undefined : v)));
    if (!sameJson(strip(before), strip(after))) throw new Error("safety check failed: something other than the animation revision would change; not saving.");
    const count = (zs: any[]) => ({ zones: zs.length, modules: zs.flatMap((z) => z.modules).length, checkpoints: zs.flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints)).length });
    const cb = count(before), ca = count(after);
    if (JSON.stringify(cb) !== JSON.stringify(ca)) throw new Error("safety check failed: course shape changed; not saving.");

    if (sameJson(before, after)) {
      console.log("[polish] draft already matches; not re-saved.");
    } else {
      await cmsService.saveDraft(COURSE, actorId, { zones: after, expectedRevision: draft.revision });
      console.log("[polish] draft saved (animation references only).");
    }

    const issues = await cmsService.validateDraft(COURSE);
    console.log(`[polish] draft validation: ${issues.length} issue(s)`, issues);
    const reread = await cmsService.getDraft(COURSE);
    const refs = (reread.zones as any[]).flatMap((z) => z.modules.flatMap((m: any) => m.checkpoints.map((c: any) => c.workspace.animation.revisionId)));
    const pointerAfter = await CmsCourse.findOne({ courseId: COURSE }).lean();
    console.log(`POLISH_ATTACH: CREATED ${counts.CREATED}  UPDATED ${counts.UPDATED}  REUSED ${counts.REUSED}  (of ${list.length})`);
    console.log("POLISH_DRAFT_SHAPE:", JSON.stringify(count(reread.zones as any[])), " animation revision refs:", JSON.stringify([...new Set(refs)]));
    console.log("CMS_VALIDATION_ISSUES:", issues.length);
    console.log("PUBLISHED_VERSION_BEFORE:", pointerBefore?.latestPublishedVersion, " AFTER:", pointerAfter?.latestPublishedVersion);
    void rows;
  } finally {
    await mongoose.disconnect();
  }
}

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("attachMlAnimationPolish.ts");
if (isEntrypoint) {
  const emailArg = process.argv.find((a) => a.startsWith("--admin-email="));
  main(emailArg?.slice("--admin-email=".length)).catch((err) => {
    console.error("[polish] failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
