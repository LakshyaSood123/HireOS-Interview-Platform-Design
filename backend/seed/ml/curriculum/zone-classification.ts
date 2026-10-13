// ZONE 5 — CLASSIFICATION WOODS. Modules: Classification Foundations (7
// checkpoints) and Model Evaluation (8 checkpoints).

import type { CheckpointSpec } from "./builder.js";

// Classification Foundations (Module 8) is authored in zone-classification-foundations.ts.
import { classificationFoundationsModuleSpecs } from "./zone-classification-foundations.js";
export const classificationSpecs: CheckpointSpec[] = classificationFoundationsModuleSpecs;

// Model Evaluation (Module 9) is authored in zone-model-evaluation.ts.
import { modelEvaluationModuleSpecs } from "./zone-model-evaluation.js";
export const evaluationSpecs: CheckpointSpec[] = modelEvaluationModuleSpecs;
