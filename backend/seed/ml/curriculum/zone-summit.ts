// ZONE 7 — MODEL SUMMIT. Module: Building Reliable ML Systems (11 checkpoints).
// Ties the whole course into one practical workflow. Cross-zone prerequisites
// only point backwards, so the graph stays acyclic.

import type { CheckpointSpec } from "./builder.js";

// Building Reliable ML Systems (Module 13) is authored in zone-reliable-ml-systems.ts.
import { reliableMlSystemsModuleSpecs } from "./zone-reliable-ml-systems.js";

export const summitSpecs: CheckpointSpec[] = reliableMlSystemsModuleSpecs;
