// The complete DSA course skeleton — all 7 zones, ~28 modules. 14 have real
// checkpoints today: Foundations, Arrays & Strings, Hashing (Basecamp, all
// 3); Two Pointers, Sliding Window, Prefix Sum, Binary Search, Intervals
// (all of Pattern Meadows); Linked Lists, Recursion, Trees (Structure
// Woods/Recursive Forest); Graphs, 1D DP, Final Mastery (legacy). Everything
// else is a genuine `Module` with ZERO checkpoints, which the progress
// engine already resolves to `"locked"` (see progressEngine.ts's
// resolveModuleState — a module with no checkpoints returns "locked"
// without any special-casing). That's intentional: this proves the data
// model supports the full course without fabricating content for modules
// nobody has authored yet.
//
// Module ids for the 7 modules that existed before this task (foundations,
// linked-structures, recursion, trees, graphs, dp, summit) are UNCHANGED —
// BiomeTrailMap.tsx's scenic tiles hardcode exactly those 7 ids, and
// renaming them would silently break the existing scenic map's status
// badges. New skeleton modules get fresh ids that don't collide with
// anything the scenic map currently renders. See
// LEARNING_ENGINE_ARCHITECTURE.md's "module ids preserved" note.

import type { Module } from "../types"

export interface ZoneSkeleton {
  id: string
  title: string
  description: string
  /** Module ids, in course order, that belong to this zone. Populated with
   * real Module objects by courseRegistry.ts (some real content, most
   * skeleton stubs from `skeletonModule` below). */
  moduleIds: string[]
}

export const DSA_ZONES: ZoneSkeleton[] = [
  {
    id: "basecamp",
    title: "Basecamp",
    description: "Complexity foundations, arrays, and hashing — where every trail begins.",
    moduleIds: ["foundations", "arrays-strings", "hashing"],
  },
  {
    id: "pattern-meadows",
    title: "Pattern Meadows",
    description: "Two pointers, sliding windows, prefix sums, binary search, and intervals.",
    moduleIds: ["two-pointers", "sliding-window", "prefix-sum", "binary-search", "intervals"],
  },
  {
    id: "structure-woods",
    title: "Structure Woods",
    description: "Linked lists, stacks, queues, heaps, and tries.",
    moduleIds: ["linked-structures", "stack-queue", "heap-priority-queue", "trie"],
  },
  {
    id: "recursive-forest",
    title: "Recursive Forest",
    description: "Recursion, backtracking, trees, and binary search trees.",
    moduleIds: ["recursion", "backtracking", "trees", "binary-search-trees"],
  },
  {
    id: "graph-highlands",
    title: "Graph Highlands",
    description: "Graph traversal, grid graphs, topological sort, and union-find.",
    moduleIds: ["graphs", "dfs-bfs", "grid-graphs", "topological-sort", "union-find"],
  },
  {
    id: "optimization-peaks",
    title: "Optimization Peaks",
    description: "Greedy algorithms and dynamic programming, one dimension at a time.",
    moduleIds: ["greedy", "dp", "dp-2d", "dp-patterns"],
  },
  {
    id: "interview-summit",
    title: "Interview Summit",
    description: "Mixed pattern recognition, timed problems, company missions, and final mastery.",
    moduleIds: ["mixed-pattern-recognition", "timed-problems", "company-missions", "summit"],
  },
]

interface SkeletonModuleMeta {
  id: string
  title: string
  icon: string
  accentColor: string
  description: string
}

/** Metadata for every module that doesn't have real content yet. Building
 * out one of these into a real module later means: write a
 * `src/learning/content/<name>Module.ts` following complexityModule.ts /
 * linkedListsModule.ts / recursionModule.ts as the reference pattern, then
 * swap its entry in courseRegistry.ts's `REAL_MODULES` map — nothing about
 * this skeleton list needs to change. */
const SKELETON_MODULE_META: SkeletonModuleMeta[] = [
  // Arrays & Strings, Hashing, and all 5 Pattern Meadows modules were
  // authored this task — removed from here, registered in
  // courseRegistry.ts's REAL_MODULES instead. Every remaining entry below
  // is still a genuine zero-checkpoint skeleton.
  { id: "stack-queue", title: "Stack & Queue", icon: "📚", accentColor: "#38BDF8", description: "LIFO/FIFO structures and monotonic stacks." },
  { id: "heap-priority-queue", title: "Heap / Priority Queue", icon: "⛰️", accentColor: "#38BDF8", description: "Always-know-the-min/max structures." },
  { id: "trie", title: "Trie", icon: "🌿", accentColor: "#38BDF8", description: "Prefix trees for string search." },
  { id: "backtracking", title: "Backtracking", icon: "🧭", accentColor: "#A855F7", description: "Recursive search with undo." },
  { id: "binary-search-trees", title: "Binary Search Trees", icon: "🌲", accentColor: "#A855F7", description: "BST-specific structure and balance." },
  { id: "dfs-bfs", title: "DFS / BFS on Graphs", icon: "🕸️", accentColor: "#F59E0B", description: "Graph traversal beyond trees." },
  { id: "grid-graphs", title: "Grid Graphs", icon: "🗺️", accentColor: "#F59E0B", description: "2D grids as implicit graphs." },
  { id: "topological-sort", title: "Topological Sort", icon: "📶", accentColor: "#F59E0B", description: "Ordering with dependencies." },
  { id: "union-find", title: "Union-Find", icon: "🔗", accentColor: "#F59E0B", description: "Disjoint-set components." },
  { id: "greedy", title: "Greedy", icon: "🪙", accentColor: "#EC4899", description: "Locally optimal choices that hold up globally." },
  { id: "dp-2d", title: "2D Dynamic Programming", icon: "⚡", accentColor: "#EC4899", description: "Grid/table-based DP." },
  { id: "dp-patterns", title: "Common DP Patterns", icon: "⚡", accentColor: "#EC4899", description: "Recognizing DP shapes quickly." },
  { id: "mixed-pattern-recognition", title: "Mixed Pattern Recognition", icon: "🧩", accentColor: "#E2B44A", description: "Identifying the right pattern under ambiguity." },
  { id: "timed-problems", title: "Timed Problems", icon: "⏱️", accentColor: "#E2B44A", description: "Interview-paced practice." },
  { id: "company-missions", title: "Company Missions", icon: "🏢", accentColor: "#E2B44A", description: "Curated sets by target company (not yet populated)." },
]

export function buildSkeletonModule(id: string): Module {
  const meta = SKELETON_MODULE_META.find(m => m.id === id)
  return {
    id,
    title: meta?.title ?? id,
    description: meta?.description ?? "Coming soon.",
    icon: meta?.icon ?? "🔒",
    accentColor: meta?.accentColor ?? "#94A3B8",
    contentKind: "workspace",
    checkpoints: [],
  }
}
