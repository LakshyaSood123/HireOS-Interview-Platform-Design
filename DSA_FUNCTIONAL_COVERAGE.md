# DSA Functional Coverage

Safety snapshot: `C:\Users\PREDATOR\.codex\safety-snapshots\hireos-dsa-20260916-211943`

Validation result: `Curriculum validation passed: 29 modules, 107 checkpoints.`

Build result: `pnpm build` passed. Vite reported the existing chunk-size warning.

Typecheck result: `pnpm exec tsc --noEmit` passed.

Protected frontend hashes: all six match the approved Phase 0 values exactly.

## Module Matrix

| Zone | Module | Actual module ID | Content file | Status | Checkpoints | Roadmap | Workspace | Quick Check | Visual | Code Activity | Review | Progress | Notes | Prerequisites | Remaining issue |
|---|---|---|---|---|---:|---|---|---|---|---|---|---|---|---|---|
| Basecamp | Complexity | `foundations` | `src/learning/content/complexityModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | None | None |
| Basecamp | Arrays & Strings | `arrays-strings` | `src/learning/content/arraysStringsModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `foundations-5` | None |
| Basecamp | Hashing | `hashing` | `src/learning/content/hashingModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `arrays-strings-5` | None |
| Pattern Meadows | Two Pointers | `two-pointers` | `src/learning/content/twoPointersModule.ts` | GREEN | 5 | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | `hashing-5` | Preview remains special and non-mutating |
| Pattern Meadows | Sliding Window | `sliding-window` | `src/learning/content/slidingWindowModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `hashing-5` | None |
| Pattern Meadows | Prefix Sum | `prefix-sum` | `src/learning/content/prefixSumModule.ts` | GREEN | 4 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `hashing-5` | None |
| Pattern Meadows | Binary Search | `binary-search` | `src/learning/content/binarySearchModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `hashing-5` | None |
| Pattern Meadows | Intervals | `intervals` | `src/learning/content/intervalsModule.ts` | GREEN | 4 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `hashing-5` | None |
| Structure Woods | Linked Lists | `linked-structures` | `src/learning/content/linkedListsModule.ts` | GREEN | 5 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `foundations-5` | Legacy scenic ID retained |
| Structure Woods | Stack & Queue | `stack-queue` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `linked-structures-5` | None |
| Structure Woods | Heap / Priority Queue | `heap-priority-queue` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `linked-structures-5` | None |
| Structure Woods | Trie | `trie` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `linked-structures-5` | None |
| Recursive Forest | Recursion | `recursion` | `src/learning/content/recursionModule.ts` | GREEN | 5 | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | `linked-structures-5` | None |
| Recursive Forest | Backtracking | `backtracking` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `recursion-5` | None |
| Recursive Forest | Trees | `trees` | `src/learning/content/treesModule.ts` | GREEN | 5 | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Yes | `recursion-5` | None |
| Recursive Forest | Binary Search Trees | `binary-search-trees` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `trees-5` | None |
| Graph Highlands | Graph Fundamentals | `graphs` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `trees-5` | Legacy scenic ID retained |
| Graph Highlands | DFS & BFS | `dfs-bfs` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `graphs-3` | None |
| Graph Highlands | Grid Graphs | `grid-graphs` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `graphs-3` | None |
| Graph Highlands | Topological Sort | `topological-sort` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `graphs-3` | None |
| Graph Highlands | Union-Find | `union-find` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `graphs-3` | None |
| Optimization Peaks | Greedy | `greedy` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `hashing-5` | None |
| Optimization Peaks | 1D Dynamic Programming | `dp` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `recursion-5` | Legacy scenic ID retained |
| Optimization Peaks | 2D Dynamic Programming | `dp-2d` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `dp-3` | None |
| Optimization Peaks | Common DP Patterns | `dp-patterns` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes | `dp-3` | None |
| Interview Summit | Mixed Pattern Recognition | `mixed-pattern-recognition` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes | `dp-patterns-3` | Application module, no compiler exercise by design |
| Interview Summit | Timed Problems | `timed-problems` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes | `dp-patterns-3` | Application module, no new timer engine |
| Interview Summit | Company Missions | `company-missions` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | N/A | Yes | Yes | Yes | `dp-patterns-3` | Metadata/planning module, no copied statements |
| Interview Summit | Final Mastery Challenge | `summit` | `src/learning/content/fullCurriculumModules.ts` | GREEN | 3 | Yes | Yes | Yes | N/A | Yes | Yes | Yes | Yes | `dp-patterns-3` | Legacy scenic ID retained |

## Files Created

- `src/learning/content/fullCurriculumModules.ts`
- `scripts/validateCurriculum.ts`
- `DSA_FUNCTIONAL_COVERAGE.md`

## Files Modified

- `src/learning/courseRegistry.ts`
- `src/state/AppStateContext.tsx`
- `src/pages/ReagvisTrailPage.tsx`

## New Prerequisites Introduced

- `linked-structures-5` unlocks `stack-queue`, `heap-priority-queue`, and `trie`.
- `recursion-5` unlocks `backtracking` and `dp`.
- `trees-5` unlocks `binary-search-trees` and `graphs`.
- `graphs-3` unlocks `dfs-bfs`, `grid-graphs`, `topological-sort`, and `union-find`.
- `hashing-5` unlocks `greedy`.
- `dp-3` unlocks `dp-2d` and `dp-patterns`.
- `dp-patterns-3` unlocks `mixed-pattern-recognition`, `timed-problems`, `company-missions`, and `summit`.

Existing Basecamp sequence and Pattern Meadows parallel unlock after Hashing were retained.

## Legacy Compatibility Retained

- Scenic legacy IDs `foundations`, `linked-structures`, `recursion`, `trees`, `graphs`, `dp`, and `summit` were not renamed.
- The existing Alpine map was not expanded to all 29 modules.
- The Two Pointers preview remains special, ephemeral, non-persistent, zero-XP, and non-mutating.

## Progression Semantics

- Completed checkpoints return review state and `completeCheckpointById` prevents duplicate XP.
- Current checkpoints resume through the existing active checkpoint pointer.
- Available modules open normally through Course Library and ModuleRoadmap.
- Locked modules are blocked by `enterModule` and `enterCheckpoint`; the only exception is the existing Two Pointers demo preview path.

## Verification Notes

- Trees, Recursion, and Two Pointers content files were not rewritten.
- `pnpm build` passed after the curriculum changes.
- `pnpm exec tsc --noEmit` passed after the curriculum changes.
- `pnpm exec vite build --ssr scripts/validateCurriculum.ts --outDir .tmp-validation-ssr` plus `node .tmp-validation-ssr\validateCurriculum.js` passed.
- Browser screenshot tooling was not available in this session, so no screenshot comparison was claimed.
