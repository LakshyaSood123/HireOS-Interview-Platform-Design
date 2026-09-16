import { getCourseById, getAllCheckpointsInOrder } from "../src/learning/courseRegistry.js"
import { questionMeta } from "../src/learning/content/questionMeta.js"

const canonicalModules = [
  "foundations",
  "arrays-strings",
  "hashing",
  "two-pointers",
  "sliding-window",
  "prefix-sum",
  "binary-search",
  "intervals",
  "linked-structures",
  "stack-queue",
  "heap-priority-queue",
  "trie",
  "recursion",
  "backtracking",
  "trees",
  "binary-search-trees",
  "graphs",
  "dfs-bfs",
  "grid-graphs",
  "topological-sort",
  "union-find",
  "greedy",
  "dp",
  "dp-2d",
  "dp-patterns",
  "mixed-pattern-recognition",
  "timed-problems",
  "company-missions",
  "summit",
]

const errors: string[] = []
const course = getCourseById("dsa-foundations")

if (!course) {
  errors.push("DSA course is not registered")
} else {
  const modules = course.zones.flatMap(zone => zone.modules.map(module => ({ zone, module })))
  const moduleIds = modules.map(({ module }) => module.id)
  const checkpoints = getAllCheckpointsInOrder(course)
  const checkpointIds = new Set(checkpoints.map(checkpoint => checkpoint.id))

  for (const id of canonicalModules) {
    if (!moduleIds.includes(id)) errors.push(`Missing canonical module: ${id}`)
  }

  if (moduleIds.length !== canonicalModules.length) {
    errors.push(`Expected ${canonicalModules.length} modules, found ${moduleIds.length}`)
  }

  const duplicateModules = moduleIds.filter((id, index) => moduleIds.indexOf(id) !== index)
  for (const id of duplicateModules) errors.push(`Duplicate module id: ${id}`)

  for (const { zone, module } of modules) {
    if (!zone.id) errors.push(`Module ${module.id} has invalid zone`)
    if (module.checkpoints.length === 0) errors.push(`Module ${module.id} has no checkpoints`)

    const localIds = module.checkpoints.map(checkpoint => checkpoint.id)
    const duplicateLocalIds = localIds.filter((id, index) => localIds.indexOf(id) !== index)
    for (const id of duplicateLocalIds) errors.push(`Duplicate checkpoint id ${id} in module ${module.id}`)

    for (const checkpoint of module.checkpoints) {
      if (!checkpoint.workspace && !checkpoint.lesson) errors.push(`Checkpoint ${checkpoint.id} has no lesson/workspace content`)
      if (checkpoint.workspace && checkpoint.workspace.theory.length === 0) errors.push(`Checkpoint ${checkpoint.id} has empty theory`)
      if (!checkpoint.id) errors.push(`Checkpoint in module ${module.id} has missing id`)
      for (const prerequisite of checkpoint.prerequisites) {
        if (!checkpointIds.has(prerequisite)) errors.push(`Checkpoint ${checkpoint.id} has bad prerequisite ${prerequisite}`)
      }
      for (const questionId of checkpoint.questionIds ?? []) {
        if (!questionMeta.some(question => question.id === questionId)) errors.push(`Checkpoint ${checkpoint.id} references missing question ${questionId}`)
      }
    }
  }

  for (const question of questionMeta) {
    if (!moduleIds.includes(question.moduleId)) errors.push(`Question ${question.id} points to missing module ${question.moduleId}`)
  }

  const visiting = new Set<string>()
  const visited = new Set<string>()
  const byId = Object.fromEntries(checkpoints.map(checkpoint => [checkpoint.id, checkpoint]))

  const visit = (id: string): boolean => {
    if (visiting.has(id)) return false
    if (visited.has(id)) return true
    visiting.add(id)
    for (const prerequisite of byId[id]?.prerequisites ?? []) {
      if (!visit(prerequisite)) return false
    }
    visiting.delete(id)
    visited.add(id)
    return true
  }

  for (const checkpoint of checkpoints) {
    if (!visit(checkpoint.id)) errors.push(`Prerequisite cycle reaches ${checkpoint.id}`)
  }
}

if (errors.length > 0) {
  console.error("Curriculum validation failed:")
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Curriculum validation passed: ${canonicalModules.length} modules, ${course ? getAllCheckpointsInOrder(course).length : 0} checkpoints.`)
