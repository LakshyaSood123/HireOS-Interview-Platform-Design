/**
 * Deterministic, idempotent seed for the Machine Learning Foundations course.
 *
 * Goes through the EXISTING CMS paths — no hand-written Mongo documents:
 *   1. ensure the course pointer + an empty draft exist
 *   2. for each animation source under seed/ml/animations/: zip it in memory,
 *      run it through the real ZIP extractor (same validation as an upload),
 *      and save it as that package's draft revision
 *   3. write the zones/module/checkpoints draft referencing those packages
 *   4. saveDraft -> validateDraft -> publishDraft (freezes package revisions,
 *      creates CurriculumSnapshot, flips the active pointer)
 *
 * Re-running after a publish is a no-op for the course (never publishes a
 * second version). Package drafts are matched by title and reused.
 *
 *   npm run seed:ml-course -- --admin-email=<admin email>
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import JSZip from "jszip";
import mongoose from "mongoose";

import { env } from "../src/config/env.js";
import { CmsCourse } from "../src/modules/cms/cmsCourse.model.js";
import { CmsCourseVersion } from "../src/modules/cms/cmsCourseVersion.model.js";
import { CmsAnimationPackage } from "../src/modules/cms/animationPackage.model.js";
import * as animationPackageService from "../src/modules/cms/animationPackage.service.js";
import * as cmsService from "../src/modules/cms/cms.service.js";
import type { CmsZone } from "../src/modules/cms/cms.types.js";
import { resolveActorId } from "./lib/resolveActorId.js";
import { printApiCacheNotice } from "./lib/apiCacheNotice.js";

export const ML_COURSE_ID = "machine-learning-foundations";
const ML_TITLE = "Machine Learning Foundations";

const here = path.dirname(fileURLToPath(import.meta.url));
const SEED_ANIMATIONS_ROOT = path.resolve(here, "..", "..", "seed", "ml", "animations");

/** Animation source folder -> the package title used to find/reuse its draft. */
const PACKAGES = {
  "what-is-machine-learning": "ML Seed — What is Machine Learning?",
  "features-and-labels": "ML Seed — Features and Labels",
  "linear-regression-learning": "ML Seed — Linear Regression: The Line That Learns",
} as const;

const SINGLE_FILES = ["animation.html", "animation.css", "animation.js", "manifest.json", "trace.json"] as const;

async function buildZipFromDir(dir: string): Promise<Buffer> {
  const zip = new JSZip();
  for (const name of SINGLE_FILES) {
    const full = path.join(dir, name);
    if (statSync(full, { throwIfNoEntry: false })?.isFile()) zip.file(name, readFileSync(full, "utf8"));
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

async function ensurePackageDraft(folder: keyof typeof PACKAGES, actorId: string): Promise<string> {
  const title = PACKAGES[folder];
  const dir = path.join(SEED_ANIMATIONS_ROOT, folder);
  const zipBuffer = await buildZipFromDir(dir);
  // Same validation path the upload route uses: extractZipPackage enforces
  // every file/size/path/trace rule; validatePackageTraceAgainstManifest is
  // the cross-field check the route runs after extraction.
  const extracted = await animationPackageService.extractZipPackage(zipBuffer);
  animationPackageService.assertAssetContentTypesAllowed(extracted.assets);
  const manifestTraceEvents = extracted.manifestFromZip?.traceEvents ?? [];
  if (extracted.packageTrace) animationPackageService.validatePackageTraceAgainstManifest(extracted.packageTrace, manifestTraceEvents);

  const existing = await CmsAnimationPackage.findOne({ title, status: "draft" }).lean();
  const knownCaps = new Set(["play", "pause", "next", "previous", "reset", "gotoStep"]);
  const capabilities = (extracted.manifestFromZip?.capabilities ?? []).filter((c) => knownCaps.has(c)) as ("play" | "pause" | "next" | "previous" | "reset" | "gotoStep")[];
  const input = {
    title,
    manifest: { heightPx: extracted.manifestFromZip?.heightPx ?? 420, capabilities, traceEvents: manifestTraceEvents },
    html: extracted.html,
    css: extracted.css,
    js: extracted.js,
    packageTrace: extracted.packageTrace,
  };

  if (existing) {
    const saved = await animationPackageService.savePackageDraftContent(existing.packageId, actorId, { ...input, expectedRevision: existing.revision }, "zip", extracted.assets);
    return saved.packageId;
  }
  const created = await animationPackageService.createDraftPackage(actorId, title);
  const saved = await animationPackageService.savePackageDraftContent(created.packageId, actorId, { ...input, expectedRevision: created.revision }, "zip", extracted.assets);
  return saved.packageId;
}

function customAnimation(packageId: string, title: string) {
  return { kind: "custom" as const, packageId, revisionId: "draft", title, bridgeMode: "synchronized" as const };
}

export function buildMlZones(packageIds: Record<keyof typeof PACKAGES, string>): CmsZone[] {
  const cp = (
    order: number,
    id: string,
    title: string,
    subtitle: string,
    prerequisites: string[],
    workspace: NonNullable<CmsZone["modules"][number]["checkpoints"][number]["workspace"]>,
  ) => ({
    id,
    moduleId: "ml-foundations",
    order,
    title,
    subtitle,
    type: "lesson" as const,
    xp: 30,
    prerequisites,
    workspace,
    state: "active" as const,
  });

  return [
    {
      id: "ml-basecamp",
      order: 0,
      title: "ML Basecamp",
      description: "Learn the fundamental ideas behind data, models, learning and prediction.",
      state: "active",
      modules: [
        {
          id: "ml-foundations",
          zoneId: "ml-basecamp",
          order: 0,
          title: "Machine Learning Foundations",
          description: "Understand how machines learn from data before building your first model.",
          icon: "🧠",
          accentColor: "#38BDF8",
          state: "active",
          checkpoints: [
            cp(0, "ml-foundations-1", "What is Machine Learning?", "From rules to systems that learn from data", [], {
              title: "What is Machine Learning?",
              theory: [
                {
                  heading: "Rules vs Learning",
                  body: "Traditional software: rules + input → program → output. Machine learning: data → learning algorithm → model. A new input then goes through the model to produce a prediction. ML learns useful patterns instead of requiring every rule to be written by hand.",
                },
                {
                  heading: "Training and Inference",
                  body: "Training: the system learns model parameters from examples. Inference: the trained model receives a new example and makes a prediction. Everyday example: a spam filter is trained on emails already marked spam or not, then classifies new mail.",
                },
                {
                  heading: "Supervised and Unsupervised Learning",
                  body: "Supervised: each input x comes with a known target y, as in spam classification or house-price prediction. Unsupervised: only inputs x are given with no target labels, as in grouping customers or grouping similar images.",
                },
                {
                  heading: "Generalization",
                  body: "A model can memorize its training examples, or it can learn a pattern that also works on examples it has not seen. A useful machine-learning model must perform well on data it did not memorize.",
                },
              ],
              quickCheck: {
                question: "Which of the following is a supervised-learning problem?",
                options: [
                  "Group customers into similar groups without labels",
                  "Predict house prices using examples with known sale prices",
                  "Discover hidden structure in unlabeled images",
                  "Compress a dataset without target values",
                ],
                correctIndex: 1,
                explanation: "Supervised learning uses examples where the desired output is already known.",
              },
              animation: customAnimation(packageIds["what-is-machine-learning"], "What is Machine Learning?"),
              traceSource: { kind: "package" },
            }),
            cp(1, "ml-foundations-2", "Data, Features & Labels", "Turn real-world examples into something a model can learn from", ["ml-foundations-1"], {
              title: "Data, Features & Labels",
              theory: [
                {
                  heading: "Samples and Datasets",
                  body: "A dataset is a table of examples. Each row is one sample. Example (house prices): Area 1200, Bedrooms 2, Age 10 → Price 45; Area 1800, Bedrooms 3, Age 4 → Price 72; Area 900, Bedrooms 1, Age 15 → Price 32.",
                },
                {
                  heading: "Features",
                  body: "Features are the pieces of information the model receives. For house-price prediction the features are Area, Bedrooms and Age, so one example is represented as x = [1200, 2, 10].",
                },
                {
                  heading: "Labels",
                  body: "The label (target) is what the model should learn to predict. For house prices the label is Price, so y = Price. In short: X holds the input features, y holds the target.",
                },
                {
                  heading: "The Learning Dataset",
                  body: "X + y go into a training algorithm, which produces a model. A new X goes into the model, and the model outputs a predicted y.",
                },
              ],
              codeExamples: [
                {
                  language: "python",
                  code: "dataset = [\n    [1200, 2, 10, 45],\n    [1800, 3, 4, 72],\n    [900, 1, 15, 32],\n]\n\nX = [row[:-1] for row in dataset]\ny = [row[-1] for row in dataset]",
                },
              ],
              quickCheck: {
                question: "For a house-price prediction dataset containing Area, Bedrooms, Age and Sale Price, which field is normally the label?",
                options: ["Area", "Bedrooms", "Age", "Sale Price"],
                correctIndex: 3,
                explanation: "The label is the value the model is trying to predict.",
              },
              animation: customAnimation(packageIds["features-and-labels"], "Features and Labels"),
              traceSource: { kind: "package" },
            }),
            cp(2, "ml-foundations-3", "Linear Regression — The Line That Learns", "Build your first model by minimizing prediction error", ["ml-foundations-2"], {
              title: "Linear Regression — The Line That Learns",
              theory: [
                {
                  heading: "A Line as a Model",
                  body: "ŷ = w·x + b. x is the input, ŷ is the prediction, w is the slope (weight), b is the bias (intercept). Example: study hours → predicted exam score.",
                },
                {
                  heading: "Prediction Error",
                  body: "error = actual − predicted. A line that predicts points badly should receive a larger loss.",
                },
                {
                  heading: "Mean Squared Error",
                  body: "MSE = average((prediction − actual)²). Squaring stops positive and negative errors from cancelling, and larger mistakes receive a heavier penalty.",
                },
                {
                  heading: "Gradient Descent",
                  body: "Loop: predict → measure loss → calculate the direction of improvement → update w and b → repeat. Update rule: w = w − learning_rate × dw and b = b − learning_rate × db. The learning rate sets how large each update step is.",
                },
              ],
              codeExamples: [
                {
                  language: "python",
                  code: "X = [1, 2, 3, 4, 5]\ny = [42, 51, 61, 68, 78]\n\nw = 0.0\nb = 0.0\nlearning_rate = 0.01\n\nfor epoch in range(100):\n    predictions = [w * x + b for x in X]\n    dw = 0.0\n    db = 0.0\n    for x, actual, predicted in zip(X, y, predictions):\n        error = predicted - actual\n        dw += 2 * error * x\n        db += 2 * error\n    dw /= len(X)\n    db /= len(X)\n    w -= learning_rate * dw\n    b -= learning_rate * db",
                },
              ],
              quickCheck: {
                question: "What is the main training objective in basic linear regression when using mean squared error?",
                options: ["Maximize the mean squared error", "Minimize the mean squared error", "Increase the number of training samples", "Force every prediction to be an integer"],
                correctIndex: 1,
                explanation: "Training searches for parameters that make model predictions closer to the observed targets.",
              },
              animation: customAnimation(packageIds["linear-regression-learning"], "Linear Regression — The Line That Learns"),
              traceSource: { kind: "package" },
            }),
          ],
        },
      ],
    },
  ];
}

async function ensureCourseAndDraft(actorId: string): Promise<"created" | "existing"> {
  const existing = await CmsCourse.findOne({ courseId: ML_COURSE_ID }).lean();
  if (existing) return "existing";
  await CmsCourse.create({ courseId: ML_COURSE_ID, title: ML_TITLE, courseType: "standard", latestDraftVersion: "draft", latestPublishedVersion: null });
  await CmsCourseVersion.create({
    courseId: ML_COURSE_ID,
    versionId: "draft",
    status: "draft",
    createdFromVersion: null,
    createdBy: actorId,
    updatedBy: actorId,
    revision: 1,
    title: ML_TITLE,
    courseType: "standard",
    zones: [],
  });
  return "created";
}

export async function runSeed(adminEmail: string | undefined): Promise<void> {
  await mongoose.connect(env.MONGO_URI, { dbName: env.MONGO_DB_NAME, autoIndex: false });
  await Promise.all([CmsCourse.createIndexes(), CmsCourseVersion.createIndexes(), CmsAnimationPackage.createIndexes()]);

  const published = await CmsCourse.findOne({ courseId: ML_COURSE_ID }).lean();
  if (published?.latestPublishedVersion) {
    console.log(`[seed-ml] already published as ${published.latestPublishedVersion} — nothing to do (idempotent).`);
    return;
  }

  const actorId = await resolveActorId(adminEmail);
  const pointer = await ensureCourseAndDraft(actorId);
  console.log(`[seed-ml] course pointer: ${pointer}`);

  const packageIds = {
    "what-is-machine-learning": await ensurePackageDraft("what-is-machine-learning", actorId),
    "features-and-labels": await ensurePackageDraft("features-and-labels", actorId),
    "linear-regression-learning": await ensurePackageDraft("linear-regression-learning", actorId),
  };
  console.log("[seed-ml] package draft ids:", packageIds);

  const draft = await CmsCourseVersion.findOne({ courseId: ML_COURSE_ID, status: "draft" }).lean();
  if (!draft) throw new Error("seed-ml: draft missing after ensureCourseAndDraft");

  await cmsService.saveDraft(ML_COURSE_ID, actorId, { zones: buildMlZones(packageIds), expectedRevision: draft.revision });

  const issues = await cmsService.validateDraft(ML_COURSE_ID);
  console.log(`[seed-ml] validation: ${issues.length} issue(s)`, issues);
  if (issues.length > 0) throw new Error("seed-ml: draft has validation issues; not publishing.");

  const result = await cmsService.publishDraft(ML_COURSE_ID, actorId);
  console.log(`[seed-ml] published ${result.version.versionId}, snapshot ${result.snapshotVersion}, checkpoints ${result.snapshotCheckpointCount}`);
  printApiCacheNotice("seedMlCourse");
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntrypoint) {
  const emailArg = process.argv.find((a) => a.startsWith("--admin-email="));
  runSeed(emailArg?.slice("--admin-email=".length))
    .catch((err) => {
      console.error("[seed-ml] failed:", err);
      process.exitCode = 1;
    })
    .finally(() => mongoose.disconnect());
}
