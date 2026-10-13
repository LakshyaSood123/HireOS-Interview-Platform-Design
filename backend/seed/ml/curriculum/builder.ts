// Small builder for the Machine Learning curriculum content. Produces the same
// CMS zone/module/checkpoint shape the backend's saveDraft schema accepts
// (cms.schema.ts). Content lives here, in the backend seed source, and is
// written into the CMS draft — it is never duplicated into frontend TypeScript.
//
// Checkpoints built here carry NO animation, NO trace source and NO layout.
// Animation-target checkpoints are attached later, manually, through Creator
// Studio's package upload flow (see animationTargets.ts).

export interface TheoryBlock {
  heading: string;
  body: string;
}

export interface QuickCheckSpec {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface CheckpointSpec {
  id: string;
  title: string;
  subtitle: string;
  prerequisites: string[];
  theory: TheoryBlock[];
  /** Concrete worked example, shown as "Learn more". */
  learnMore?: string;
  /** Plain-Python example(s). */
  python?: string;
  quickCheck: QuickCheckSpec;
}

export const CHECKPOINT_XP = 30;

export interface CmsCheckpointOut {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  type: "lesson";
  xp: number;
  prerequisites: string[];
  state: "active";
  workspace: {
    title: string;
    theory: TheoryBlock[];
    learnMore?: string;
    codeExamples?: { language: "python"; code: string }[];
    quickCheck: QuickCheckSpec;
    /** Only the three preserved, already-published checkpoints carry these. */
    animation?: Record<string, unknown>;
    traceSource?: Record<string, unknown>;
  };
}

export function checkpoint(moduleId: string, order: number, spec: CheckpointSpec): CmsCheckpointOut {
  const workspace: CmsCheckpointOut["workspace"] = {
    title: spec.title,
    theory: spec.theory,
    quickCheck: spec.quickCheck,
  };
  if (spec.learnMore) workspace.learnMore = spec.learnMore;
  if (spec.python) workspace.codeExamples = [{ language: "python", code: spec.python }];
  return {
    id: spec.id,
    moduleId,
    order,
    title: spec.title,
    subtitle: spec.subtitle,
    type: "lesson",
    xp: CHECKPOINT_XP,
    prerequisites: spec.prerequisites,
    state: "active",
    workspace,
  };
}

export interface ModuleOut {
  id: string;
  zoneId: string;
  order: number;
  title: string;
  description: string;
  icon: string;
  accentColor: string;
  state: "active";
  checkpoints: CmsCheckpointOut[];
}

export function moduleOf(
  zoneId: string,
  order: number,
  meta: { id: string; title: string; description: string; icon: string; accentColor: string },
  specs: CheckpointSpec[],
): ModuleOut {
  return {
    id: meta.id,
    zoneId,
    order,
    title: meta.title,
    description: meta.description,
    icon: meta.icon,
    accentColor: meta.accentColor,
    state: "active",
    checkpoints: specs.map((spec, i) => checkpoint(meta.id, i, spec)),
  };
}

export interface ZoneOut {
  id: string;
  order: number;
  title: string;
  description: string;
  state: "active";
  modules: ModuleOut[];
}

export function zoneOf(
  order: number,
  meta: { id: string; title: string; description: string },
  modules: ModuleOut[],
): ZoneOut {
  return { id: meta.id, order, title: meta.title, description: meta.description, state: "active", modules };
}
