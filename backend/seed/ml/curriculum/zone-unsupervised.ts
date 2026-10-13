// ZONE 6 — UNSUPERVISED VALLEY. Modules: Clustering (7), Gaussian Mixture
// Models (9) and Dimensionality Reduction (9).

import type { CheckpointSpec } from "./builder.js";

// Clustering (Module 10) is authored in zone-clustering.ts.
import { clusteringModuleSpecs } from "./zone-clustering.js";
export const clusteringSpecs: CheckpointSpec[] = clusteringModuleSpecs;

// Gaussian Mixture Models (Module 11) is authored in zone-gmm.ts.
import { gaussianMixtureModuleSpecs } from "./zone-gmm.js";
export const gaussianMixtureSpecs: CheckpointSpec[] = gaussianMixtureModuleSpecs;

// Dimensionality Reduction (Module 12) is authored in zone-dimensionality-reduction.ts.
import { dimensionalityReductionModuleSpecs } from "./zone-dimensionality-reduction.js";
export const dimensionalitySpecs: CheckpointSpec[] = dimensionalityReductionModuleSpecs;
