// Draft curriculum validation (PART 19 of the task) — read-only, pure
// function of a CreatorCourse. Never mutates the draft, never publishes
// anything. Every issue links back to the affected zone/module/checkpoint
// id so the UI can jump straight to it.

import type { CreatorCourse } from "../types"
import { codeTraceRegistry } from "../../learning/animations/codeTraceRegistry"
import { findDuplicateIds } from "./dsaId"

export type DsaValidationSeverity = "error" | "warning"

export interface DsaValidationIssue {
  severity: DsaValidationSeverity
  message: string
  zoneId?: string
  moduleId?: string
  checkpointId?: string
}

const VALID_ANIMATION_IDS = new Set(Object.keys(codeTraceRegistry))

export function validateDsaDraft(course: CreatorCourse): DsaValidationIssue[] {
  const issues: DsaValidationIssue[] = []
  const zones = course.dsaZones ?? []

  for (const collision of findDuplicateIds(course)) {
    issues.push({ severity: "error", message: `Duplicate ${collision.kind} id "${collision.id}" — every id must be unique across the draft.` })
  }

  const allCheckpointIds = new Set(zones.flatMap(z => z.modules.flatMap(m => m.checkpoints.map(cp => cp.id))))

  for (const zone of zones) {
    if (!zone.title.trim()) {
      issues.push({ severity: "error", message: "Zone has an empty title.", zoneId: zone.id })
    }

    const moduleOrders = new Set<number>()
    for (const module of zone.modules) {
      if (module.zoneId !== zone.id) {
        issues.push({ severity: "error", message: `Module "${module.id}" references zoneId "${module.zoneId}" but is nested under zone "${zone.id}".`, zoneId: zone.id, moduleId: module.id })
      }
      if (moduleOrders.has(module.order)) {
        issues.push({ severity: "error", message: `Duplicate module order value ${module.order} inside zone "${zone.title}".`, zoneId: zone.id, moduleId: module.id })
      }
      moduleOrders.add(module.order)

      if (!module.title.trim()) {
        issues.push({ severity: "error", message: "Module has an empty title.", zoneId: zone.id, moduleId: module.id })
      }

      const checkpointOrders = new Set<number>()
      for (const checkpoint of module.checkpoints) {
        const loc = { zoneId: zone.id, moduleId: module.id, checkpointId: checkpoint.id }

        if (checkpoint.moduleId !== module.id) {
          issues.push({ severity: "error", message: `Checkpoint "${checkpoint.id}" references moduleId "${checkpoint.moduleId}" but is nested under module "${module.id}".`, ...loc })
        }
        if (checkpointOrders.has(checkpoint.order)) {
          issues.push({ severity: "error", message: `Duplicate checkpoint order value ${checkpoint.order} inside module "${module.title}".`, ...loc })
        }
        checkpointOrders.add(checkpoint.order)

        if (!checkpoint.title.trim()) {
          issues.push({ severity: "error", message: "Checkpoint has an empty title.", ...loc })
        }

        if (!checkpoint.lesson && !checkpoint.workspace) {
          issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" has no lesson content at all (neither legacy lesson nor workspace).`, ...loc })
        }
        if (checkpoint.lesson && checkpoint.workspace) {
          issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" has BOTH legacy lesson and workspace content — a checkpoint must have exactly one.`, ...loc })
        }

        if (checkpoint.workspace) {
          if (!checkpoint.workspace.title.trim()) {
            issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" workspace content is missing a title.`, ...loc })
          }

          const animationId = checkpoint.workspace.animation?.id
          if (animationId && !VALID_ANIMATION_IDS.has(animationId)) {
            issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" references unknown animation id "${animationId}".`, ...loc })
          }

          const qc = checkpoint.workspace.quickCheck
          if (qc) {
            if (qc.options.length < 2) {
              issues.push({ severity: "error", message: `Quick Check on "${checkpoint.title}" needs at least 2 options.`, ...loc })
            }
            if (qc.correctIndex < 0 || qc.correctIndex >= qc.options.length) {
              issues.push({ severity: "error", message: `Quick Check on "${checkpoint.title}" has correctIndex ${qc.correctIndex}, which is out of range for ${qc.options.length} option(s).`, ...loc })
            }
            if (qc.options.some(o => !o.trim())) {
              issues.push({ severity: "warning", message: `Quick Check on "${checkpoint.title}" has one or more empty options.`, ...loc })
            }
            if (!qc.question.trim()) {
              issues.push({ severity: "error", message: `Quick Check on "${checkpoint.title}" has an empty question.`, ...loc })
            }
          }

          const coding = checkpoint.workspace.codingActivity
          if (coding) {
            if (!coding.functionName.trim()) {
              issues.push({ severity: "error", message: `Coding activity on "${checkpoint.title}" is missing a function name.`, ...loc })
            }
            if (!coding.prompt.trim()) {
              issues.push({ severity: "error", message: `Coding activity on "${checkpoint.title}" is missing a problem prompt.`, ...loc })
            }
            if (coding.languages.length === 0) {
              issues.push({ severity: "error", message: `Coding activity on "${checkpoint.title}" declares no supported languages.`, ...loc })
            }
            for (const lang of coding.languages) {
              if (!coding.starterCode[lang]) {
                issues.push({ severity: "warning", message: `Coding activity on "${checkpoint.title}" has no starter code for declared language "${lang}".`, ...loc })
              }
            }
          }
        }

        for (const prereqId of checkpoint.prerequisites) {
          if (prereqId === checkpoint.id) {
            issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" lists itself as its own prerequisite.`, ...loc })
          } else if (!allCheckpointIds.has(prereqId)) {
            issues.push({ severity: "error", message: `Checkpoint "${checkpoint.title}" has a prerequisite "${prereqId}" that doesn't exist in the draft.`, ...loc })
          }
        }
      }
    }
  }

  return issues
}
