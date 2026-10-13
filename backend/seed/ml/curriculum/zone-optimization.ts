// ZONE 4 — OPTIMIZATION RIDGE. Modules: Optimization for Machine Learning
// (11 checkpoints) and Regression in Practice (10 checkpoints).

import type { CheckpointSpec } from "./builder.js";

// Optimization for Machine Learning (Module 6) is authored in zone-optimization-foundations.ts.
import { optimizationModuleSpecs } from "./zone-optimization-foundations.js";
export const optimizationSpecs: CheckpointSpec[] = optimizationModuleSpecs;

// Regression in Practice (Module 7) is authored in zone-regression-practice.ts.
import { regressionPracticeModuleSpecs } from "./zone-regression-practice.js";
export const regressionPracticeSpecs: CheckpointSpec[] = regressionPracticeModuleSpecs;
