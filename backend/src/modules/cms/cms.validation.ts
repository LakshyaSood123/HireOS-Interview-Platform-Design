/**
 * Server-side structural validation for a CMS course version — the
 * authoritative check. The frontend's `src/creator/dsa/dsaDraftValidation.ts`
 * runs the same checks for editor UX, but a client can be bypassed, so
 * `publishDraft` (cms.service.ts) always re-runs this before writing an
 * immutable published version. Never trust frontend validation alone
 * (Phase 3B plan §10).
 */

import { isKnownAnimationId } from "./animationIds.js";
import { isApprovedPistonHarnessKey } from "./pistonHarnessKeys.js";
import type { CmsVersionContent } from "./cms.types.js";

export interface CmsValidationIssue {
  entityType: "course" | "zone" | "module" | "checkpoint";
  entityId: string;
  field?: string;
  message: string;
}

export function validateCmsVersionContent(content: CmsVersionContent): CmsValidationIssue[] {
  const issues: CmsValidationIssue[] = [];

  if (content.courseType === "standard") {
    // Phase 3B only implements structured-DSA persistence in depth (plan §20)
    // — a standard course's `zones` stays empty and needs no further check.
    return issues;
  }

  const zoneIds = new Map<string, number>();
  const moduleIds = new Map<string, number>();
  const checkpointIds = new Map<string, number>();

  for (const zone of content.zones) {
    zoneIds.set(zone.id, (zoneIds.get(zone.id) ?? 0) + 1);
    if (!zone.title.trim()) issues.push({ entityType: "zone", entityId: zone.id, field: "title", message: "Zone title is required." });

    const moduleOrders = new Set<number>();
    for (const zoneModule of zone.modules) {
      moduleIds.set(zoneModule.id, (moduleIds.get(zoneModule.id) ?? 0) + 1);

      if (zoneModule.zoneId !== zone.id) {
        issues.push({
          entityType: "module",
          entityId: zoneModule.id,
          field: "zoneId",
          message: `References zoneId "${zoneModule.zoneId}" but is nested under zone "${zone.id}".`,
        });
      }
      if (moduleOrders.has(zoneModule.order)) {
        issues.push({ entityType: "module", entityId: zoneModule.id, field: "order", message: `Duplicate module order ${zoneModule.order} in zone "${zone.id}".` });
      }
      moduleOrders.add(zoneModule.order);
      if (!zoneModule.title.trim()) issues.push({ entityType: "module", entityId: zoneModule.id, field: "title", message: "Module title is required." });

      const checkpointOrders = new Set<number>();
      for (const checkpoint of zoneModule.checkpoints) {
        checkpointIds.set(checkpoint.id, (checkpointIds.get(checkpoint.id) ?? 0) + 1);

        if (checkpoint.moduleId !== zoneModule.id) {
          issues.push({
            entityType: "checkpoint",
            entityId: checkpoint.id,
            field: "moduleId",
            message: `References moduleId "${checkpoint.moduleId}" but is nested under module "${zoneModule.id}".`,
          });
        }
        if (checkpointOrders.has(checkpoint.order)) {
          issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "order", message: `Duplicate checkpoint order ${checkpoint.order} in module "${zoneModule.id}".` });
        }
        checkpointOrders.add(checkpoint.order);
        if (!checkpoint.title.trim()) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "title", message: "Checkpoint title is required." });

        if (!checkpoint.workspace) {
          issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace", message: "Checkpoint has no lesson content." });
        } else {
          const ws = checkpoint.workspace;
          if (!ws.title.trim()) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.title", message: "Workspace title is required." });

          if (ws.animation && !isKnownAnimationId(ws.animation.id)) {
            issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation.id", message: `Unknown animation id "${ws.animation.id}".` });
          }

          if (ws.quickCheck) {
            const qc = ws.quickCheck;
            if (!qc.question.trim()) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.quickCheck.question", message: "Quick Check question is required." });
            if (qc.options.length < 2) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.quickCheck.options", message: "Quick Check needs at least 2 options." });
            if (qc.correctIndex < 0 || qc.correctIndex >= qc.options.length) {
              issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.quickCheck.correctIndex", message: `correctIndex ${qc.correctIndex} is out of range for ${qc.options.length} option(s).` });
            }
          }

          if (ws.codingActivity) {
            const coding = ws.codingActivity;
            if (!coding.functionName.trim()) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.codingActivity.functionName", message: "Function name is required." });
            if (!coding.prompt.trim()) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.codingActivity.prompt", message: "Problem prompt is required." });
            if (coding.languages.length === 0) issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.codingActivity.languages", message: "At least one supported language is required." });

            if (coding.executionMode === "piston") {
              if (!coding.harnessKey) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.codingActivity.harnessKey", message: 'executionMode "piston" requires a harnessKey.' });
              } else if (!isApprovedPistonHarnessKey(coding.harnessKey)) {
                issues.push({
                  entityType: "checkpoint",
                  entityId: checkpoint.id,
                  field: "workspace.codingActivity.harnessKey",
                  message: `harnessKey "${coding.harnessKey}" is not an approved Piston harness. New CMS coding activities must use executionMode "disabled" or "mock".`,
                });
              }
            }
          }
        }

        for (const prereqId of checkpoint.prerequisites) {
          if (prereqId === checkpoint.id) {
            issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "prerequisites", message: "A checkpoint cannot be its own prerequisite." });
          }
        }
      }
    }
  }

  for (const [id, count] of zoneIds) if (count > 1) issues.push({ entityType: "zone", entityId: id, message: `Duplicate zone id "${id}".` });
  for (const [id, count] of moduleIds) if (count > 1) issues.push({ entityType: "module", entityId: id, message: `Duplicate module id "${id}".` });
  for (const [id, count] of checkpointIds) if (count > 1) issues.push({ entityType: "checkpoint", entityId: id, message: `Duplicate checkpoint id "${id}".` });

  const allCheckpointIds = new Set(checkpointIds.keys());
  for (const zone of content.zones) {
    for (const zoneModule of zone.modules) {
      for (const checkpoint of zoneModule.checkpoints) {
        for (const prereqId of checkpoint.prerequisites) {
          if (prereqId !== checkpoint.id && !allCheckpointIds.has(prereqId)) {
            issues.push({
              entityType: "checkpoint",
              entityId: checkpoint.id,
              field: "prerequisites",
              message: `Prerequisite "${prereqId}" does not exist in this version.`,
            });
          }
        }
      }
    }
  }

  return issues;
}
