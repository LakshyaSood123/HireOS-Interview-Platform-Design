// ZONE 3 — PROBABILITY GROVE. Modules: Probability Foundations (11 checkpoints)
// and Estimation & Uncertainty (8 checkpoints).

import type { CheckpointSpec } from "./builder.js";

// Probability Foundations (Module 4) is authored in zone-probability-foundations.ts.
import { probabilityFoundationsSpecs } from "./zone-probability-foundations.js";
export const probabilitySpecs: CheckpointSpec[] = probabilityFoundationsSpecs;

// Estimation & Uncertainty (Module 5) is authored in zone-estimation-uncertainty.ts.
import { estimationUncertaintySpecs } from "./zone-estimation-uncertainty.js";
export const estimationSpecs: CheckpointSpec[] = estimationUncertaintySpecs;
