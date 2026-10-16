import { ApiError } from "../../../shared/errors.js";
import { logger } from "../../../shared/logger.js";
import { CmsAnimationPackage } from "../animationPackage.model.js";
import { CmsCourseVersion } from "../cmsCourseVersion.model.js";
import { getNarrationProvider, narrationProviderInfo, type NarrationProvider } from "./narration.provider.js";
import { stepStatus, summarize, type StepStatusView } from "./narration.status.js";
import { PRONUNCIATION_VERSION, extractExplanations, generationHash, narrationTextOf, normalizeForSpeech, sourceTextHash, type StepExplanation } from "./narration.text.js";
import { DEFAULT_NARRATION_DEFAULTS, emptyNarration, NARRATION_LIMITS, type NarrationDefaults, type NarrationStatus, type PackageNarration } from "./narration.types.js";
import { validateNarration, type NarrationIssue } from "./narration.validation.js";

const DRAFT = "draft";

interface PackageDoc {
  packageId: string;
  revisionId: string;
  title: string;
  js?: string | null;
  manifest: { traceEvents: string[] };
  packageTrace?: { steps: { id: string; label: string; animationEvent?: string | null }[] } | null;
  narration?: PackageNarration | null;
}

/** Steps of an animation, in play order, with the label shown to authors. Trace steps are authoritative when present. */
function stepsOf(pkg: PackageDoc): { id: string; label: string }[] {
  const trace = pkg.packageTrace?.steps ?? [];
  const labels = new Map(trace.map((s) => [s.animationEvent || s.id, s.label]));
  return pkg.manifest.traceEvents.map((id) => ({ id, label: labels.get(id) ?? id }));
}

/** Mongo may store an empty `steps: {}` / `audio: []` as absent; always hand callers the full shape. */
function withShape(n: PackageNarration | null | undefined): PackageNarration | null {
  return n ? { ...n, steps: n.steps ?? {}, audio: n.audio ?? [] } : null;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export interface NarrationOverview {
  packageId: string;
  revisionId: string;
  title: string;
  enabled: boolean;
  defaults: NarrationDefaults;
  provider: { configured: string; isProduction: boolean; available: boolean; problem?: string; defaultVoice?: string };
  counts: Record<NarrationStatus, number> & { total: number };
  totalAudioBytes: number;
  steps: StepStatusView[];
  issues: NarrationIssue[];
}

export function buildOverview(pkg: PackageDoc): NarrationOverview {
  const narration = withShape(pkg.narration as PackageNarration | null | undefined);
  const explanations = extractExplanations(pkg.js);
  const steps = stepsOf(pkg);
  const views: StepStatusView[] = steps.map((s) => {
    const ex: StepExplanation | undefined = explanations[s.id];
    const rec = narration?.steps[s.id];
    return {
      stepId: s.id,
      label: s.label,
      heading: ex?.h ?? "",
      explanation: ex ? narrationTextOf(ex) : "",
      status: stepStatus(narration, s.id, ex),
      enabled: Boolean(narration?.enabled && rec?.enabled !== false),
      voice: rec?.voice,
      language: rec?.language,
      speed: rec?.speed,
      durationMs: rec?.durationMs,
      generatedAt: rec?.generatedAt,
      provider: rec?.provider,
      asset: rec?.asset,
      bytes: rec?.bytes,
      error: rec?.error,
    };
  });
  const sum = summarize(views);
  return {
    packageId: pkg.packageId,
    revisionId: pkg.revisionId,
    title: pkg.title,
    enabled: Boolean(narration?.enabled),
    defaults: narration?.defaults ?? { ...DEFAULT_NARRATION_DEFAULTS },
    provider: narrationProviderInfo(),
    counts: { ...sum, total: views.length },
    totalAudioBytes: (narration?.audio ?? []).reduce((a, f) => a + Buffer.byteLength(f.dataBase64, "base64"), 0),
    steps: views,
    issues: validateNarration(narration, { stepIds: steps.map((s) => s.id), explanations }),
  };
}

async function loadRevision(packageId: string, revisionId: string): Promise<PackageDoc> {
  const doc = await CmsAnimationPackage.findOne({ packageId, revisionId }).lean();
  if (!doc) throw ApiError.notFound(`Animation package "${packageId}" revision "${revisionId}" not found.`);
  return doc as unknown as PackageDoc;
}

export async function getNarrationOverview(packageId: string, revisionId = DRAFT): Promise<NarrationOverview> {
  return buildOverview(await loadRevision(packageId, revisionId));
}

export async function getNarrationAudio(packageId: string, revisionId: string, stepId: string): Promise<{ contentType: string; dataBase64: string; durationMs: number | null }> {
  const pkg = await loadRevision(packageId, revisionId);
  const rec = withShape(pkg.narration as PackageNarration | null | undefined)?.steps[stepId];
  const file = rec?.asset ? (pkg.narration?.audio ?? []).find((a) => a.path === rec.asset) : undefined;
  if (!rec || !file) throw ApiError.notFound(`No narration audio for step "${stepId}".`);
  return { contentType: file.contentType, dataBase64: file.dataBase64, durationMs: rec.durationMs ?? null };
}

export interface NarrationSettingsPatch {
  enabled?: boolean;
  defaults?: Partial<NarrationDefaults>;
  steps?: Record<string, { enabled?: boolean }>;
}

/** Edits narration settings on the package's DRAFT revision only. Frozen revisions are never touched. */
export async function updateNarrationSettings(packageId: string, patch: NarrationSettingsPatch): Promise<NarrationOverview> {
  const doc = await CmsAnimationPackage.findOne({ packageId, status: "draft" });
  if (!doc) throw ApiError.notFound(`No draft revision exists for animation package "${packageId}".`);
  const narration: PackageNarration = doc.narration ? withShape(clone(doc.narration as PackageNarration))! : emptyNarration();
  const known = new Set((doc.manifest as { traceEvents: string[] }).traceEvents);
  if (patch.enabled !== undefined) narration.enabled = patch.enabled;
  if (patch.defaults) narration.defaults = { ...narration.defaults, ...patch.defaults };
  for (const [stepId, change] of Object.entries(patch.steps ?? {})) {
    if (!known.has(stepId)) throw ApiError.validation(`"${stepId}" is not a step of this animation.`);
    const rec = narration.steps[stepId] ?? { enabled: true };
    if (change.enabled !== undefined) rec.enabled = change.enabled;
    narration.steps[stepId] = rec;
  }
  doc.narration = narration as never;
  doc.markModified("narration");
  await doc.save();
  return buildOverview(doc.toObject() as unknown as PackageDoc);
}

export type GenerationMode = "missing" | "stale" | "missing-and-stale" | "step";

export interface StepOutcome {
  stepId: string;
  outcome: "generated" | "reused" | "skipped" | "failed";
  reason?: string;
  durationMs?: number;
}

export interface GenerationSummary {
  packageId: string;
  provider: string;
  mode: GenerationMode;
  generated: number;
  reused: number;
  skipped: number;
  failed: number;
  steps: StepOutcome[];
}

function wantsStep(mode: GenerationMode, status: NarrationStatus): boolean {
  if (mode === "step") return true;
  if (mode === "missing") return status === "MISSING" || status === "ERROR";
  if (mode === "stale") return status === "STALE";
  return status === "MISSING" || status === "ERROR" || status === "STALE";
}

/**
 * Generates narration audio for steps of a package's DRAFT revision.
 *  - sequential (one provider call at a time), so a provider is never flooded;
 *  - idempotent: a step whose generation hash (text + provider + voice + language + speed) is unchanged and whose audio is
 *    present is REUSED without calling the provider (unless `force`);
 *  - each step is saved as soon as it succeeds, so one failure never loses earlier results, and a re-run resumes where it stopped;
 *  - provider failures are recorded per step (status ERROR) and do not abort the batch.
 */
export async function generateNarration(
  packageId: string,
  opts: { mode: GenerationMode; stepId?: string; force?: boolean; provider?: NarrationProvider },
): Promise<GenerationSummary> {
  const provider = opts.provider ?? getNarrationProvider();
  const first = await loadRevision(packageId, DRAFT);
  const explanations = extractExplanations(first.js);
  const allSteps = stepsOf(first);
  if (opts.mode === "step") {
    if (!opts.stepId || !allSteps.some((s) => s.id === opts.stepId)) throw ApiError.validation("stepId is required and must be a step of this animation.");
  }
  const targets = opts.mode === "step" ? allSteps.filter((s) => s.id === opts.stepId) : allSteps;

  const summary: GenerationSummary = { packageId, provider: provider.providerId, mode: opts.mode, generated: 0, reused: 0, skipped: 0, failed: 0, steps: [] };

  for (const step of targets) {
    const explanation = explanations[step.id];
    const doc = await CmsAnimationPackage.findOne({ packageId, status: "draft" });
    if (!doc) throw ApiError.notFound(`No draft revision exists for animation package "${packageId}".`);
    const narration: PackageNarration = doc.narration ? withShape(clone(doc.narration as PackageNarration))! : emptyNarration();
    // Requesting generation switches narration on for the package.
    narration.enabled = true;
    const rec = narration.steps[step.id] ?? { enabled: true };
    narration.steps[step.id] = rec;

    if (rec.enabled === false && opts.mode !== "step") {
      summary.skipped++;
      summary.steps.push({ stepId: step.id, outcome: "skipped", reason: "step narration disabled" });
      continue;
    }
    if (!explanation) {
      summary.skipped++;
      summary.steps.push({ stepId: step.id, outcome: "skipped", reason: "no explanation text" });
      continue;
    }
    const status = stepStatus(narration, step.id, explanation);
    if (!wantsStep(opts.mode, status)) {
      summary.skipped++;
      summary.steps.push({ stepId: step.id, outcome: "skipped", reason: `status ${status}` });
      continue;
    }

    const text = narrationTextOf(explanation);
    const voice = rec.voice ?? narration.defaults.voice;
    const language = rec.language ?? narration.defaults.language;
    const speed = rec.speed ?? narration.defaults.speed;
    const spoken = normalizeForSpeech(text); // narration-only; the visible text and sourceTextHash are untouched
    const genHash = generationHash({ text: spoken, pronunciation: spoken !== text ? PRONUNCIATION_VERSION : undefined, provider: provider.providerId, providerVersion: provider.providerVersion, voice, language, speed });
    const audioPresent = Boolean(rec.asset && narration.audio.some((a) => a.path === rec.asset));
    if (!opts.force && status === "GENERATED" && audioPresent && rec.generationHash === genHash) {
      summary.reused++;
      summary.steps.push({ stepId: step.id, outcome: "reused", durationMs: rec.durationMs });
      continue;
    }

    try {
      rec.enabled = true;
      const result = await provider.generate({ text: spoken, voice, language, speed });
      if (result.audio.byteLength > NARRATION_LIMITS.maxAudioBytes) throw new Error(`provider returned ${result.audio.byteLength} bytes (max ${NARRATION_LIMITS.maxAudioBytes})`);
      const path = `${NARRATION_LIMITS.pathPrefix}${step.id}${result.extension}`;
      narration.audio = narration.audio.filter((a) => a.path !== path && a.path !== rec.asset);
      narration.audio.push({ path, contentType: result.contentType, dataBase64: result.audio.toString("base64") });
      Object.assign(rec, {
        asset: path,
        durationMs: result.durationMs,
        provider: provider.providerId,
        voice,
        language,
        speed,
        sourceTextHash: sourceTextHash(text),
        generationHash: genHash,
        generatedAt: new Date().toISOString(),
        bytes: result.audio.byteLength,
      });
      delete rec.error;
      summary.generated++;
      summary.steps.push({ stepId: step.id, outcome: "generated", durationMs: result.durationMs });
    } catch (err) {
      rec.error = (err instanceof Error ? err.message : String(err)).slice(0, 400);
      summary.failed++;
      summary.steps.push({ stepId: step.id, outcome: "failed", reason: rec.error });
      logger.warn({ packageId, stepId: step.id, err: rec.error }, "narration: step generation failed");
    }
    doc.narration = narration as never;
    doc.markModified("narration");
    await doc.save(); // persist after EVERY step: partial progress survives any later failure
  }
  return summary;
}

/** Generates for every custom-animation package referenced by a course DRAFT, one package at a time. */
export async function generateCourseNarration(
  courseId: string,
  mode: Exclude<GenerationMode, "step">,
  opts: { force?: boolean; provider?: NarrationProvider; onPackage?: (summary: GenerationSummary, index: number, total: number) => void } = {},
) {
  const draft = await CmsCourseVersion.findOne({ courseId, status: "draft" }).lean();
  if (!draft) throw ApiError.notFound(`No draft exists for course "${courseId}".`);
  const ids = new Set<string>();
  for (const z of draft.zones as { modules: { checkpoints: { workspace?: { animation?: { kind?: string; packageId?: string } } }[] }[] }[])
    for (const m of z.modules) for (const c of m.checkpoints) {
      const a = c.workspace?.animation;
      if (a?.kind === "custom" && a.packageId) ids.add(a.packageId);
    }
  const results: GenerationSummary[] = [];
  const totals = { packages: 0, generated: 0, reused: 0, skipped: 0, failed: 0 };
  const ordered = [...ids].sort();
  for (const [index, packageId] of ordered.entries()) {
    let r: GenerationSummary;
    try {
      r = await generateNarration(packageId, { mode, force: opts.force, provider: opts.provider });
    } catch (err) {
      // A package-level failure (e.g. the engine is down) is recorded and the course run continues; finished work stays saved.
      const reason = (err instanceof Error ? err.message : String(err)).slice(0, 300);
      logger.warn({ packageId, err: reason }, "narration: package generation failed");
      r = { packageId, provider: opts.provider?.providerId ?? "unknown", mode, generated: 0, reused: 0, skipped: 0, failed: 1, steps: [{ stepId: "*", outcome: "failed", reason }] };
    }
    results.push(r);
    totals.packages++;
    totals.generated += r.generated;
    totals.reused += r.reused;
    totals.skipped += r.skipped;
    totals.failed += r.failed;
    opts.onPackage?.(r, index + 1, ordered.length);
  }
  return { courseId, mode, totals, results };
}
