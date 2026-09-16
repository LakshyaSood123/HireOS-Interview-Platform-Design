// Real course registry. Before this, `AppStateContext` held exactly one
// `CourseData` object (`dsaCourseData`) and `startLearningTrail(courseId)`
// silently ignored its argument — every "Enter Trail" button opened the same
// DSA course regardless of which library card was clicked. This module is
// the single lookup-by-id surface that replaces that implicit assumption.
//
// DSA is the only course with real content today. Everything else in
// `libraryCourses` (src/data/reagvisCourses.ts) is intentionally left
// unregistered — `isCourseAvailable()` lets the UI show "Coming Soon"
// instead of faking content for DBMS/OS/Networks/etc.
//
// The DSA course itself is now the FULL 7-zone/~28-module skeleton (see
// content/dsaSkeleton.ts) — most modules have zero checkpoints (genuinely
// "locked", not faked) until they're authored. 7 have real content:
// Foundations, Linked Lists, Recursion, Trees (all in the new Lesson
// Workspace model) and Graphs, 1D DP, Final Mastery (still legacy
// TrailNode-derived — see LEARNING_ENGINE_ARCHITECTURE.md).

import { dsaCourseData } from "../data/reagvisCourses"
import type { Course, Module, Zone, Checkpoint, Lesson } from "./types"
import { treesModule } from "./content/treesModule"
import { foundationsModule } from "./content/complexityModule"
import { linkedListsModule } from "./content/linkedListsModule"
import { recursionModule } from "./content/recursionModule"
import { arraysStringsModule } from "./content/arraysStringsModule"
import { hashingModule } from "./content/hashingModule"
import { twoPointersModule } from "./content/twoPointersModule"
import { slidingWindowModule } from "./content/slidingWindowModule"
import { prefixSumModule } from "./content/prefixSumModule"
import { binarySearchModule } from "./content/binarySearchModule"
import { intervalsModule } from "./content/intervalsModule"
import { fullCurriculumModules } from "./content/fullCurriculumModules"
import { DSA_ZONES, buildSkeletonModule } from "./content/dsaSkeleton"

/** Modules authored directly in the new content model — these REPLACE
 * whatever the legacy-TrailNode loop below would have built for the same
 * id, entirely (not merged). */
const REAL_MODULES: Record<string, Module> = {
  foundations: foundationsModule,
  "arrays-strings": arraysStringsModule,
  hashing: hashingModule,
  "two-pointers": twoPointersModule,
  "sliding-window": slidingWindowModule,
  "prefix-sum": prefixSumModule,
  "binary-search": binarySearchModule,
  intervals: intervalsModule,
  "linked-structures": linkedListsModule,
  recursion: recursionModule,
  trees: treesModule,
  ...fullCurriculumModules,
}

/** Biome id (old BiomeZone) -> Module id, for the 3 modules that still
 * derive their checkpoints from legacy TrailNode/BiomeZone data (graphs, dp,
 * summit). Foundations/linked-structures/recursion/trees also have biome
 * entries here for building the id->name mapping below, but their TrailNode
 * checkpoints are discarded in favor of `REAL_MODULES`. */
const BIOME_TO_MODULE_ID: Record<string, string> = {
  grove: "foundations",
  river: "linked-structures",
  cave: "recursion",
  canopy: "trees",
  wilds: "graphs",
  caverns: "dp",
  summit: "summit",
}

/** TrailNode.biome (display name, e.g. "Trailhead Grove") -> Module id,
 * derived from `dsaCourseData.biomes` so the mapping can't drift out of sync
 * with the biome names actually used on the TrailNodes. */
const BIOME_NAME_TO_MODULE_ID: Record<string, string> = Object.fromEntries(
  dsaCourseData.biomes.map(biome => [biome.name, BIOME_TO_MODULE_ID[biome.id] ?? biome.id]),
)

/** Legacy module titles get replaced by the new full-course taxonomy's
 * naming even where the module id (and its TrailNode-derived checkpoints)
 * stays the same — e.g. module id "dp" now titled "1D Dynamic Programming"
 * instead of the old biome name "Dynamic Caverns". */
const LEGACY_MODULE_TITLE_OVERRIDE: Record<string, string> = {
  graphs: "Graph Fundamentals",
  dp: "1D Dynamic Programming",
  summit: "Final Mastery",
}

function buildLegacyDerivedModules(): Record<string, Module> {
  // Group the existing 18 TrailNodes into modules (by biome), preserving
  // TrailNode order — that order IS the prerequisite chain within a module:
  // each checkpoint depends on the one immediately before it.
  const checkpointsByModule = new Map<string, Checkpoint[]>()
  let previousCheckpointId: string | null = null

  for (const node of dsaCourseData.nodes) {
    const moduleId = BIOME_NAME_TO_MODULE_ID[node.biome]
    if (!moduleId) {
      throw new Error(`courseRegistry: no module mapping for biome "${node.biome}" (node ${node.id})`)
    }

    if (!checkpointsByModule.has(moduleId)) checkpointsByModule.set(moduleId, [])

    const checkpointId = String(node.id)
    const lesson: Lesson | undefined = node.lesson
      ? {
          id: `lesson-${checkpointId}`,
          title: node.lesson.title,
          content: node.lesson,
          activities: [
            { id: `${checkpointId}-reading`, type: "reading", title: "Concept Reading" },
            { id: `${checkpointId}-quick-check`, type: "quick-check", title: "Quick Check" },
            ...(node.lesson.challenge
              ? [{ id: `${checkpointId}-code`, type: "code" as const, title: node.lesson.challenge.title }]
              : []),
          ],
        }
      : undefined

    checkpointsByModule.get(moduleId)!.push({
      id: checkpointId,
      legacyNodeId: node.id,
      title: node.title,
      subtitle: node.subtitle,
      type: node.type,
      xp: node.xp,
      prerequisites: previousCheckpointId ? [previousCheckpointId] : [],
      lesson,
    })
    previousCheckpointId = checkpointId
  }

  const modules: Record<string, Module> = {}
  for (const [moduleId, checkpoints] of checkpointsByModule) {
    if (moduleId in REAL_MODULES) continue // superseded by new-model content

    const biome = dsaCourseData.biomes.find(b => BIOME_TO_MODULE_ID[b.id] === moduleId)
    modules[moduleId] = {
      id: moduleId,
      title: LEGACY_MODULE_TITLE_OVERRIDE[moduleId] ?? biome?.name ?? moduleId,
      description: biome?.description ?? "",
      icon: biome?.icon ?? "❔",
      accentColor: biome?.accentColor ?? "#1DB584",
      checkpoints,
    }
  }
  return modules
}

function buildDsaCourse(): Course {
  const legacyModules = buildLegacyDerivedModules()

  const zones: Zone[] = DSA_ZONES.map(zoneSkeleton => ({
    id: zoneSkeleton.id,
    title: zoneSkeleton.title,
    description: zoneSkeleton.description,
    modules: zoneSkeleton.moduleIds.map(
      moduleId => REAL_MODULES[moduleId] ?? legacyModules[moduleId] ?? buildSkeletonModule(moduleId),
    ),
  }))

  // Cross-module prerequisite graph. Not a single linear chain — Foundations
  // is a branch point (PART 23): one branch is the ORIGINAL demo-critical
  // sequence (Linked Structures -> Recursion -> Trees -> Graphs -> DP ->
  // Summit, unchanged so the existing demo bootstrap's "these are already
  // completed" state stays valid), the other is the NEW Basecamp-completion
  // branch (Arrays & Strings -> Hashing), which itself fans out into all 5
  // Pattern Meadows modules in PARALLEL (none of them depends on the
  // others — see LEARNING_ENGINE_ARCHITECTURE.md's prerequisite-graph note).
  const lastCheckpointOf = (module: Module) => module.checkpoints[module.checkpoints.length - 1]
  const firstCheckpointOf = (module: Module) => module.checkpoints[0]

  function chainSerially(modules: Module[]) {
    for (let i = 1; i < modules.length; i++) {
      const prevLast = lastCheckpointOf(modules[i - 1])
      const currFirst = firstCheckpointOf(modules[i])
      if (prevLast && currFirst) currFirst.prerequisites = [prevLast.id]
    }
  }

  function fanOutFrom(sourceModule: Module, targetModules: Module[]) {
    const sourceLast = lastCheckpointOf(sourceModule)
    if (!sourceLast) return
    for (const target of targetModules) {
      const targetFirst = firstCheckpointOf(target)
      if (targetFirst) targetFirst.prerequisites = [sourceLast.id]
    }
  }

  // Branch A: the pre-existing demo-critical chain (unchanged this task).
  chainSerially(
    [linkedListsModule, recursionModule, treesModule]
      .concat(legacyModules.graphs ? [legacyModules.graphs] : [])
      .concat(legacyModules.dp ? [legacyModules.dp] : [])
      .concat(legacyModules.summit ? [legacyModules.summit] : []),
  )
  fanOutFrom(foundationsModule, [linkedListsModule])

  // Branch B: Basecamp completion -> Pattern Meadows (new this task).
  chainSerially([foundationsModule, arraysStringsModule, hashingModule])
  fanOutFrom(hashingModule, [
    twoPointersModule,
    slidingWindowModule,
    prefixSumModule,
    binarySearchModule,
    intervalsModule,
  ])

  const moduleById = Object.fromEntries(zones.flatMap(zone => zone.modules.map(module => [module.id, module] as const)))
  const requireAfter = (sourceId: string, targetIds: string[]) => {
    const source = moduleById[sourceId]
    if (!source) return
    fanOutFrom(
      source,
      targetIds.map(id => moduleById[id]).filter((module): module is Module => Boolean(module)),
    )
  }

  requireAfter("linked-structures", ["stack-queue", "heap-priority-queue", "trie"])
  requireAfter("recursion", ["backtracking"])
  requireAfter("trees", ["binary-search-trees", "graphs"])
  requireAfter("graphs", ["dfs-bfs", "grid-graphs", "topological-sort", "union-find"])
  requireAfter("hashing", ["greedy"])
  requireAfter("recursion", ["dp"])
  requireAfter("dp", ["dp-2d", "dp-patterns"])
  requireAfter("dp-patterns", ["mixed-pattern-recognition", "timed-problems", "company-missions", "summit"])

  return {
    id: dsaCourseData.id,
    title: dsaCourseData.title,
    description: `${dsaCourseData.difficulty} • ${dsaCourseData.duration}`,
    provider: dsaCourseData.provider,
    zones,
  }
}

const dsaCourse = buildDsaCourse()

/** Only DSA has real content today — everything else is "Coming Soon". */
export const coursesById: Record<string, Course> = {
  [dsaCourse.id]: dsaCourse,
}

export function getCourseById(courseId: string): Course | undefined {
  return coursesById[courseId]
}

export function isCourseAvailable(courseId: string): boolean {
  return courseId in coursesById
}

export function getAllCheckpointsInOrder(course: Course): Checkpoint[] {
  return course.zones.flatMap(zone => zone.modules.flatMap(m => m.checkpoints))
}

export function findCheckpoint(course: Course, checkpointId: string): Checkpoint | undefined {
  return getAllCheckpointsInOrder(course).find(cp => cp.id === checkpointId)
}

export function findModuleForCheckpoint(course: Course, checkpointId: string): Module | undefined {
  for (const zone of course.zones) {
    for (const module of zone.modules) {
      if (module.checkpoints.some(cp => cp.id === checkpointId)) return module
    }
  }
  return undefined
}

export function findZoneForModule(course: Course, moduleId: string): Zone | undefined {
  return course.zones.find(zone => zone.modules.some(m => m.id === moduleId))
}
