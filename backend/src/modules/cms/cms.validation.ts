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
import { normalizeAnimationSource } from "./cms.types.js";
import { CmsAnimationPackage } from "./animationPackage.model.js";
import type { CmsVersionContent } from "./cms.types.js";
import { extractExplanations } from "./narration/narration.text.js";
import type { PackageNarration } from "./narration/narration.types.js";
import { validateNarration } from "./narration/narration.validation.js";

export interface CmsValidationIssue {
  entityType: "course" | "zone" | "module" | "checkpoint";
  entityId: string;
  field?: string;
  message: string;
  /** Absent = error (blocks publishing). "warning" is informational and never blocks. */
  severity?: "error" | "warning";
}

export function validateCmsVersionContent(content: CmsVersionContent): CmsValidationIssue[] {
  const issues: CmsValidationIssue[] = [];

  // Every course type runs the generic structure/content checks below.
  // DSA-only checks (registered animation allowlist, approved Piston
  // harnesses) are gated on `structured-dsa`; a `standard` course may not
  // use them at all — see the `isDsa` guards further down.
  const isDsa = content.courseType === "structured-dsa";

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

          if (ws.animation) {
            const anim = normalizeAnimationSource(ws.animation);
            if (!anim) {
              issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation", message: "Animation source is malformed." });
            } else if (anim.kind === "registered") {
              if (!isDsa) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation", message: "Registered animations are only available for the structured-dsa course type. Use a custom animation package." });
              } else if (!isKnownAnimationId(anim.id)) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation.id", message: `Unknown animation id "${anim.id}".` });
              }
            } else {
              // Custom package: structural checks only here — actual
              // existence of `packageId`/`revisionId` in Mongo is enforced
              // at publish time by `freezePackageRevisionIfNeeded`
              // (cms.service.ts), which throws a clear not-found error
              // rather than duplicating a DB read inside this otherwise
              // synchronous, DB-free validation pass.
              if (!anim.packageId.trim()) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation.packageId", message: "Custom animation is missing a packageId." });
              }
              if (!anim.revisionId.trim()) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.animation.revisionId", message: "Custom animation is missing a revisionId." });
              }
            }
          }

          if (ws.traceSource?.kind === "cms") {
            const steps = ws.traceSource.steps ?? [];
            const stepIds = new Set<string>();
            for (const step of steps) {
              if (stepIds.has(step.stepId)) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.traceSource.steps", message: `Duplicate trace step id "${step.stepId}".` });
              }
              stepIds.add(step.stepId);
              if (!step.pseudocode.trim()) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.traceSource.steps", message: `Trace step "${step.stepId}" is missing required pseudocode.` });
              }
            }
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

            if (coding.executionMode === "piston" && !isDsa) {
              issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "workspace.codingActivity.executionMode", message: 'Graded Piston execution is only available for the structured-dsa course type.' });
            } else if (coding.executionMode === "piston") {
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

        if (checkpoint.layout) {
          if (checkpoint.layout.version !== 1) {
            issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "layout.version", message: `Unknown layout version ${checkpoint.layout.version}.` });
          }
          const seenBlockTypes = new Set<string>();
          for (const row of checkpoint.layout.rows) {
            let rowSpan = 0;
            for (const block of row.blocks) {
              if (seenBlockTypes.has(block.type)) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "layout", message: `Block type "${block.type}" appears more than once in the layout.` });
              }
              seenBlockTypes.add(block.type);
              if (block.span < 1 || block.span > 12) {
                issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "layout", message: `Block "${block.type}" has an invalid span ${block.span} (must be 1-12).` });
              }
              rowSpan += block.hidden ? 0 : block.span;
            }
            if (rowSpan > 12) {
              issues.push({ entityType: "checkpoint", entityId: checkpoint.id, field: "layout", message: `A layout row's visible block spans sum to ${rowSpan}, exceeding the 12-column grid.` });
            }
          }
        }
      }
    }
  }

  for (const [id, count] of zoneIds) if (count > 1) issues.push({ entityType: "zone", entityId: id, message: `Duplicate zone id "${id}".` });
  for (const [id, count] of moduleIds) if (count > 1) issues.push({ entityType: "module", entityId: id, message: `Duplicate module id "${id}".` });
  for (const [id, count] of checkpointIds) if (count > 1) issues.push({ entityType: "checkpoint", entityId: id, message: `Duplicate checkpoint id "${id}".` });

  // Structure completeness (every course type): a brand-new course starts empty (just Basecamp), and an empty course, zone or module is
  // an authoring-in-progress state that must not be published. Archived structure is ignored.
  let activeCheckpoints = 0;
  for (const zone of content.zones.filter((z) => z.state === "active")) {
    const activeModules = zone.modules.filter((m) => m.state === "active");
    if (activeModules.length === 0) issues.push({ entityType: "zone", entityId: zone.id, message: `Zone "${zone.title}" has no modules yet.` });
    for (const zoneModule of activeModules) {
      const count = zoneModule.checkpoints.filter((c) => c.state === "active").length;
      activeCheckpoints += count;
      if (count === 0) issues.push({ entityType: "module", entityId: zoneModule.id, message: `Module "${zoneModule.title}" has no checkpoints yet.` });
    }
  }
  if (activeCheckpoints === 0) issues.push({ entityType: "course", entityId: content.courseId, message: "The course has no checkpoints yet." });

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

  const prereqsById = new Map<string, string[]>();
  for (const zone of content.zones) for (const zm of zone.modules) for (const cp of zm.checkpoints) prereqsById.set(cp.id, cp.prerequisites);
  const cycleMembers = findPrerequisiteCycle(prereqsById);
  if (cycleMembers) {
    issues.push({ entityType: "checkpoint", entityId: cycleMembers[0]!, field: "prerequisites", message: `Prerequisite cycle detected: ${cycleMembers.join(" -> ")}.` });
  }

  if (!isDsa) {
    for (const zone of content.zones) {
      for (const zm of zone.modules) {
        for (const cp of zm.checkpoints) {
          if (cp.type === "lesson" && cp.workspace && cp.workspace.theory.length === 0) {
            issues.push({ entityType: "checkpoint", entityId: cp.id, field: "workspace.theory", message: "A lesson checkpoint needs at least one concept block." });
          }
          for (const [i, block] of (cp.workspace?.theory ?? []).entries()) {
            if (!block.heading.trim() || !block.body.trim()) {
              issues.push({ entityType: "checkpoint", entityId: cp.id, field: `workspace.theory.${i}`, message: `Concept block ${i + 1} needs both a heading and body text.` });
            }
          }
        }
      }
    }
  }

  return issues;
}

/** Returns one cycle's ids (in order) if the prerequisite graph has one, else null. */
function findPrerequisiteCycle(prereqsById: Map<string, string[]>): string[] | null {
  const state = new Map<string, 1 | 2>(); // 1 = on stack, 2 = done
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    const s = state.get(id);
    if (s === 2) return null;
    if (s === 1) {
      const start = stack.indexOf(id);
      return [...stack.slice(start), id];
    }
    state.set(id, 1);
    stack.push(id);
    for (const dep of prereqsById.get(id) ?? []) {
      if (!prereqsById.has(dep)) continue;
      const found = visit(dep);
      if (found) return found;
    }
    stack.pop();
    state.set(id, 2);
    return null;
  };
  for (const id of prereqsById.keys()) {
    const found = visit(id);
    if (found) return found;
  }
  return null;
}

/**
 * Async, DB-backed half of publish validation: every custom animation
 * reference must name a package and revision that exists. A `"draft"`
 * revision must exist as the package's mutable draft; a frozen `rN` must
 * exist as a frozen revision. Kept separate from the pure validator above.
 */
export async function validatePackageReferences(zones: CmsVersionContent["zones"]): Promise<CmsValidationIssue[]> {
  const issues: CmsValidationIssue[] = [];
  const refs = new Map<string, { checkpointId: string; packageId: string; revisionId: string }>();
  for (const zone of zones) for (const zm of zone.modules) for (const cp of zm.checkpoints) {
    const anim = normalizeAnimationSource(cp.workspace?.animation);
    if (anim?.kind === "custom") refs.set(`${cp.id}`, { checkpointId: cp.id, packageId: anim.packageId, revisionId: anim.revisionId });
  }
  for (const ref of refs.values()) {
    const found = await CmsAnimationPackage.exists({ packageId: ref.packageId, revisionId: ref.revisionId });
    if (!found) {
      issues.push({
        entityType: "checkpoint",
        entityId: ref.checkpointId,
        field: "workspace.animation",
        message: `Custom animation package "${ref.packageId}" revision "${ref.revisionId}" does not exist.`,
      });
    }
  }
  return issues;
}

/**
 * Narration checks for the custom animation packages a course version references (see narration/narration.validation.ts
 * for the policy). Errors block publishing; warnings (never-generated or stale narration) are reported but do not.
 * A package with narration disabled/absent contributes nothing, so existing courses validate exactly as before.
 */
export async function validateNarrationReferences(zones: CmsVersionContent["zones"]): Promise<CmsValidationIssue[]> {
  const issues: CmsValidationIssue[] = [];
  const seen = new Map<string, CmsValidationIssue[]>();
  for (const zone of zones) for (const zm of zone.modules) for (const cp of zm.checkpoints) {
    const anim = normalizeAnimationSource(cp.workspace?.animation);
    if (anim?.kind !== "custom") continue;
    const key = `${anim.packageId}@${anim.revisionId}`;
    let found = seen.get(key);
    if (!found) {
      found = [];
      const pkg = await CmsAnimationPackage.findOne({ packageId: anim.packageId, revisionId: anim.revisionId }, { narration: 1, js: 1, manifest: 1 }).lean();
      const narration = (pkg as { narration?: PackageNarration | null } | null)?.narration;
      if (pkg && narration && narration.enabled) {
        const stepIds = (pkg.manifest as { traceEvents: string[] }).traceEvents;
        for (const n of validateNarration(narration, { stepIds, explanations: extractExplanations(pkg.js) })) {
          found.push({ entityType: "checkpoint", entityId: cp.id, field: "workspace.animation.narration", severity: n.severity, message: `Narration${n.stepId ? ` (step "${n.stepId}")` : ""}: ${n.message}` });
        }
      }
      seen.set(key, found);
    }
    // report once per checkpoint that uses the package, re-targeted at this checkpoint
    for (const i of found) issues.push({ ...i, entityId: cp.id });
  }
  return issues;
}
