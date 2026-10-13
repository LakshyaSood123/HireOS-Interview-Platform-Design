// Assembles the full Machine Learning Foundations curriculum (7 zones, 115
// checkpoints) and audits it before it is saved to the CMS draft.
//
// The first three checkpoints are NOT re-authored here. They are taken from the
// currently published v1 (passed in), so their package references and content
// stay byte-for-byte identical. Everything else comes from this directory.

import { checkpoint, moduleOf, zoneOf, type CheckpointSpec, type ZoneOut, type ModuleOut, type CmsCheckpointOut } from "./builder.js";
import { basecampAdditions } from "./zone-basecamp.js";
import { MODULE1_PUBLISHED_OVERRIDES } from "./module1-overrides.js";
import { calculusSpecs } from "./zone-mathematics.js";
import { linearAlgebraSpecs } from "./zone-linear-algebra.js";
import { probabilitySpecs, estimationSpecs } from "./zone-probability.js";
import { optimizationSpecs, regressionPracticeSpecs } from "./zone-optimization.js";

// DEMO SCOPE: Zones 1–4 only. Zones 5–7 (zone-classification.ts,
// zone-unsupervised.ts, zone-summit.ts) are kept on disk, unchanged, and are
// NOT assembled until the full curriculum resumes.
export const EXPECTED_COUNTS = { zones: 4, modules: 7, checkpoints: 64 } as const;

/** Existing checkpoints (published v1) that must be kept as they are. */
const PRESERVED_IDS = ["ml-foundations-1", "ml-foundations-2", "ml-foundations-3"] as const;

export function buildExpandedMlZones(publishedFirstThree: CmsCheckpointOut[]): ZoneOut[] {
  // Published content is kept; only the text/quick check overrides are applied.
  // The existing animation and trace references are never touched here.
  const preserved = PRESERVED_IDS.map(id => {
    const found = publishedFirstThree.find(cp => cp.id === id);
    if (!found) throw new Error(`expandMl: published checkpoint ${id} is missing; refusing to expand.`);
    const override = MODULE1_PUBLISHED_OVERRIDES[id];
    if (!override) throw new Error(`expandMl: no Module 1 override defined for ${id}.`);
    return { ...found, workspace: { ...found.workspace, ...override } };
  });

  const basecampCheckpoints: CmsCheckpointOut[] = [
    ...preserved.map((cp, i) => ({ ...cp, moduleId: "ml-foundations", order: i })),
    ...basecampAdditions.map((spec, i) => checkpoint("ml-foundations", 3 + i, spec)),
  ];

  const basecampModule: ModuleOut = {
    id: "ml-foundations",
    zoneId: "ml-basecamp",
    order: 0,
    title: "Machine Learning Foundations",
    description: "Understand how machines learn from data before building your first model.",
    icon: "🧠",
    accentColor: "#38BDF8",
    state: "active",
    checkpoints: basecampCheckpoints,
  };

  const mod = (
    zoneId: string,
    order: number,
    meta: { id: string; title: string; description: string; icon: string; accentColor: string },
    specs: CheckpointSpec[],
  ) => moduleOf(zoneId, order, meta, specs);

  return [
    zoneOf(0, { id: "ml-basecamp", title: "ML Basecamp", description: "Learn the fundamental ideas behind data, models, learning and prediction." }, [basecampModule]),
    zoneOf(1, { id: "mathematics-meadow", title: "Mathematics Meadow", description: "The linear algebra and calculus that every learning algorithm relies on." }, [
      mod("mathematics-meadow", 0, { id: "linear-algebra", title: "Linear Algebra for Machine Learning", description: "Vectors, projections, eigenvalues and SVD, the language of data.", icon: "🧭", accentColor: "#34D399" }, linearAlgebraSpecs),
      mod("mathematics-meadow", 1, { id: "calculus", title: "Calculus for Learning", description: "Derivatives and gradients, the direction a model should move.", icon: "📈", accentColor: "#60A5FA" }, calculusSpecs),
    ]),
    zoneOf(2, { id: "probability-grove", title: "Probability Grove", description: "Uncertainty, distributions and estimating unknown parameters from data." }, [
      mod("probability-grove", 0, { id: "probability-foundations", title: "Probability Foundations", description: "Events, conditioning, random variables and the distributions models assume.", icon: "🎲", accentColor: "#A78BFA" }, probabilitySpecs),
      mod("probability-grove", 1, { id: "estimation-uncertainty", title: "Estimation & Uncertainty", description: "MLE, Bayesian thinking and MAP: how to estimate with honest uncertainty.", icon: "🔍", accentColor: "#F472B6" }, estimationSpecs),
    ]),
    zoneOf(3, { id: "optimization-ridge", title: "Optimization Ridge", description: "How training actually finds good parameters, and how regression is made to work in practice." }, [
      mod("optimization-ridge", 0, { id: "optimization", title: "Optimization for Machine Learning", description: "Objectives, gradient descent, convexity and constraints.", icon: "⛰️", accentColor: "#FBBF24" }, optimizationSpecs),
      mod("optimization-ridge", 1, { id: "regression-practice", title: "Regression in Practice", description: "Least squares, regularization and choosing a model you can trust.", icon: "📏", accentColor: "#FB923C" }, regressionPracticeSpecs),
    ]),
  ];
}

export interface AuditIssue {
  severity: "critical" | "warning";
  message: string;
}

const PLACEHOLDER_PATTERN = /\b(TODO|TBD|placeholder|lorem ipsum)\b/i;

export function auditMlZones(zones: ZoneOut[]): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const push = (severity: AuditIssue["severity"], message: string) => issues.push({ severity, message });

  const zoneIds = zones.map(z => z.id);
  const allModules = zones.flatMap(z => z.modules.map(m => ({ zone: z, module: m })));
  const allCheckpoints = allModules.flatMap(({ module }) => module.checkpoints.map(cp => ({ module, cp })));
  const checkpointIds = allCheckpoints.map(x => x.cp.id);

  const dupes = (items: string[]) => items.filter((v, i) => items.indexOf(v) !== i);
  for (const id of dupes(zoneIds)) push("critical", `duplicate zone id "${id}"`);
  for (const id of dupes(allModules.map(x => x.module.id))) push("critical", `duplicate module id "${id}"`);
  for (const id of dupes(checkpointIds)) push("critical", `duplicate checkpoint id "${id}"`);
  for (const title of dupes(allCheckpoints.map(x => x.cp.title))) push("warning", `duplicate checkpoint title "${title}"`);

  const checkpointSet = new Set(checkpointIds);
  for (const { zone, module } of allModules) {
    if (module.checkpoints.length === 0) push("critical", `orphan module "${module.id}" has no checkpoints`);
    if (module.zoneId !== zone.id) push("critical", `module "${module.id}" declares zone "${module.zoneId}" but sits in "${zone.id}"`);
  }

  for (const { module, cp } of allCheckpoints) {
    const where = `checkpoint "${cp.id}"`;
    if (cp.moduleId !== module.id) push("critical", `${where} declares module "${cp.moduleId}" but sits in "${module.id}"`);
    if (cp.xp <= 0) push("critical", `${where} has non-positive XP`);
    for (const prereq of cp.prerequisites) {
      if (!checkpointSet.has(prereq)) push("critical", `${where} requires unknown prerequisite "${prereq}"`);
      if (prereq === cp.id) push("critical", `${where} requires itself`);
    }
    const ws = cp.workspace;
    if (!ws.title.trim()) push("critical", `${where} has an empty title`);
    if (ws.theory.length < 3 || ws.theory.length > 5) push("warning", `${where} has ${ws.theory.length} concept blocks (expected 3–5)`);
    for (const block of ws.theory) {
      if (!block.heading.trim() || !block.body.trim()) push("critical", `${where} has an empty theory block`);
      if (PLACEHOLDER_PATTERN.test(`${block.heading} ${block.body}`)) push("critical", `${where} contains placeholder text`);
    }
    if (ws.learnMore !== undefined && PLACEHOLDER_PATTERN.test(ws.learnMore)) push("critical", `${where} contains placeholder text`);
    if (!ws.learnMore) push("warning", `${where} has no worked example`);

    const qc = ws.quickCheck;
    if (!qc) {
      push("critical", `${where} has no quick check`);
    } else {
      if (!qc.question.trim()) push("critical", `${where} quick check has no question`);
      if (qc.options.length < 2 || qc.options.length > 6) push("critical", `${where} quick check has ${qc.options.length} options`);
      if (!Number.isInteger(qc.correctIndex) || qc.correctIndex < 0 || qc.correctIndex >= qc.options.length) {
        push("critical", `${where} quick check correctIndex ${qc.correctIndex} is out of range`);
      }
      if (!qc.explanation.trim()) push("critical", `${where} quick check has no explanation`);
      if (new Set(qc.options).size !== qc.options.length) push("critical", `${where} quick check has duplicate options`);
      if (PLACEHOLDER_PATTERN.test(`${qc.question} ${qc.options.join(" ")} ${qc.explanation}`)) push("critical", `${where} quick check contains placeholder text`);
    }
    if (ws.animation !== undefined || ws.traceSource !== undefined) {
      // Only the three preserved checkpoints may carry packages; they are published v1 content.
      if (!(PRESERVED_IDS as readonly string[]).includes(cp.id)) push("critical", `${where} carries an animation or trace reference that was not planned`);
    }
  }

  // Cycle detection over the prerequisite graph (DFS with colouring).
  const prereqsById = new Map(allCheckpoints.map(x => [x.cp.id, x.cp.prerequisites] as const));
  const state = new Map<string, "visiting" | "done">();
  const visit = (id: string, path: string[]): void => {
    if (state.get(id) === "done") return;
    if (state.get(id) === "visiting") {
      push("critical", `prerequisite cycle: ${[...path, id].join(" → ")}`);
      return;
    }
    state.set(id, "visiting");
    for (const next of prereqsById.get(id) ?? []) visit(next, [...path, id]);
    state.set(id, "done");
  };
  for (const id of checkpointIds) visit(id, []);

  return issues;
}

export function countCurriculum(zones: ZoneOut[]) {
  const modules = zones.flatMap(z => z.modules);
  const checkpoints = modules.flatMap(m => m.checkpoints);
  const quickChecks = checkpoints.filter(cp => cp.workspace.quickCheck).length;
  const pythonExamples = checkpoints.filter(cp => cp.workspace.codeExamples?.some(c => c.language === "python")).length;
  return {
    zones: zones.length,
    modules: modules.length,
    checkpoints: checkpoints.length,
    quickChecks,
    pythonExamples,
    checkpointsPerModule: modules.map(m => ({ module: m.id, count: m.checkpoints.length })),
  };
}
