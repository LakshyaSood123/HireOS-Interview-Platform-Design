// Data-driven scenic registry — one entry per zone, covering all 7. Only
// Pattern Meadows and Recursive Forest have hand-tuned coordinates rendered
// by a purpose-built meso component (`polished: true`); the other 5 are
// structured placeholders (`polished: false`) rendered generically by
// `PlaceholderZone.tsx` until separately designed — see PART 19.
//
// Coordinates are percentages of the zone viewport, matching the xPercent/
// yPercent convention the old BiomeTrailMap.tsx already used for its 7
// tiles — nothing here is hardcoded into JSX.

import type { ZoneScenicSpec } from "./types"

export const ZONE_SCENIC_SPECS: Record<string, ZoneScenicSpec> = {
  basecamp: {
    zoneId: "basecamp",
    title: "Basecamp",
    environment: "foothills",
    landmarks: [
      { moduleId: "foundations", landmarkType: "cabin", xPercent: 20, yPercent: 76, elevationTier: 0 },
      { moduleId: "arrays-strings", landmarkType: "cabin", xPercent: 45, yPercent: 56, elevationTier: 1 },
      { moduleId: "hashing", landmarkType: "cabin", xPercent: 72, yPercent: 34, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Timber Valley Gate",
      targetZoneId: "pattern-meadows",
      landmarkType: "timber-gate",
      xPercent: 90,
      yPercent: 16,
    },
    polished: false,
  },

  "pattern-meadows": {
    zoneId: "pattern-meadows",
    title: "Pattern Meadows",
    environment: "meadow",
    landmarks: [
      { moduleId: "two-pointers", landmarkType: "bridge", xPercent: 18, yPercent: 72, elevationTier: 0 },
      { moduleId: "sliding-window", landmarkType: "sluice", xPercent: 34, yPercent: 58, elevationTier: 1 },
      { moduleId: "prefix-sum", landmarkType: "terrace", xPercent: 48, yPercent: 44, elevationTier: 1 },
      { moduleId: "binary-search", landmarkType: "watchtower", xPercent: 68, yPercent: 38, elevationTier: 2 },
      { moduleId: "intervals", landmarkType: "gate", xPercent: 82, yPercent: 24, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Forest Gorge Entrance",
      targetZoneId: "structure-woods",
      landmarkType: "timber-gate",
      xPercent: 92,
      yPercent: 14,
    },
    polished: true,
  },

  "structure-woods": {
    zoneId: "structure-woods",
    title: "Structure Woods",
    environment: "montane-forest",
    landmarks: [
      { moduleId: "linked-structures", landmarkType: "bridge", xPercent: 18, yPercent: 74, elevationTier: 0 },
      { moduleId: "stack-queue", landmarkType: "cabin", xPercent: 40, yPercent: 56, elevationTier: 1 },
      { moduleId: "heap-priority-queue", landmarkType: "watchtower", xPercent: 62, yPercent: 40, elevationTier: 2 },
      { moduleId: "trie", landmarkType: "arboretum", xPercent: 82, yPercent: 24, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Stone Ravine Portal",
      targetZoneId: "recursive-forest",
      landmarkType: "stone-bridge",
      xPercent: 92,
      yPercent: 14,
    },
    polished: false,
  },

  "recursive-forest": {
    zoneId: "recursive-forest",
    title: "Recursive Forest",
    environment: "deep-forest",
    landmarks: [
      { moduleId: "recursion", landmarkType: "arch", xPercent: 20, yPercent: 76, elevationTier: 0 },
      { moduleId: "backtracking", landmarkType: "fork", xPercent: 38, yPercent: 58, elevationTier: 1 },
      { moduleId: "trees", landmarkType: "lodge", xPercent: 55, yPercent: 42, elevationTier: 1 },
      { moduleId: "binary-search-trees", landmarkType: "arboretum", xPercent: 75, yPercent: 26, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Highland Mountain Pass",
      targetZoneId: "graph-highlands",
      landmarkType: "mountain-pass",
      xPercent: 90,
      yPercent: 14,
    },
    polished: true,
  },

  "graph-highlands": {
    zoneId: "graph-highlands",
    title: "Graph Highlands",
    environment: "highlands",
    landmarks: [
      { moduleId: "graphs", landmarkType: "watchtower", xPercent: 16, yPercent: 74, elevationTier: 0 },
      { moduleId: "dfs-bfs", landmarkType: "cairn", xPercent: 34, yPercent: 58, elevationTier: 1 },
      { moduleId: "grid-graphs", landmarkType: "terrace", xPercent: 52, yPercent: 46, elevationTier: 1 },
      { moduleId: "topological-sort", landmarkType: "cairn", xPercent: 70, yPercent: 32, elevationTier: 2 },
      { moduleId: "union-find", landmarkType: "gate", xPercent: 86, yPercent: 20, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Glacial Col",
      targetZoneId: "optimization-peaks",
      landmarkType: "ice-tunnel",
      xPercent: 94,
      yPercent: 12,
    },
    polished: false,
  },

  "optimization-peaks": {
    zoneId: "optimization-peaks",
    title: "Optimization Peaks",
    environment: "peaks",
    landmarks: [
      { moduleId: "greedy", landmarkType: "cairn", xPercent: 20, yPercent: 74, elevationTier: 0 },
      { moduleId: "dp", landmarkType: "cabin", xPercent: 44, yPercent: 54, elevationTier: 1 },
      { moduleId: "dp-2d", landmarkType: "terrace", xPercent: 66, yPercent: 38, elevationTier: 2 },
      { moduleId: "dp-patterns", landmarkType: "observatory", xPercent: 84, yPercent: 22, elevationTier: 2 },
    ],
    exitThreshold: {
      title: "Summit Ridge",
      targetZoneId: "interview-summit",
      landmarkType: "summit-ridge",
      xPercent: 92,
      yPercent: 12,
    },
    polished: false,
  },

  "interview-summit": {
    zoneId: "interview-summit",
    title: "Interview Summit",
    environment: "summit",
    landmarks: [
      { moduleId: "mixed-pattern-recognition", landmarkType: "cairn", xPercent: 24, yPercent: 70, elevationTier: 0 },
      { moduleId: "timed-problems", landmarkType: "watchtower", xPercent: 46, yPercent: 52, elevationTier: 1 },
      { moduleId: "company-missions", landmarkType: "terrace", xPercent: 66, yPercent: 36, elevationTier: 2 },
      { moduleId: "summit", landmarkType: "observatory", xPercent: 84, yPercent: 20, elevationTier: 3 },
    ],
    // Final zone — no exit gateway.
    polished: false,
  },
}

export function getZoneScenicSpec(zoneId: string): ZoneScenicSpec | undefined {
  return ZONE_SCENIC_SPECS[zoneId]
}

/** Zone order for the Macro World Map — matches DSA_ZONES
 * (src/learning/content/dsaSkeleton.ts) but kept as its own constant since
 * the scenic registry shouldn't import the learning-engine content module
 * (presentation data staying decoupled from course content). */
export const ZONE_ORDER = [
  "basecamp",
  "pattern-meadows",
  "structure-woods",
  "recursive-forest",
  "graph-highlands",
  "optimization-peaks",
  "interview-summit",
]
