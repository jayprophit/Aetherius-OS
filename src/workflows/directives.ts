import { parseSkillRef, type SkillRegistry } from "./skills";
import type { Workflow } from "./types";

/**
 * REQ-directive-artifact assessment: does a Directive (objective /
 * constraints / definition-of-done / recommended skills, after the DOE
 * research pattern) belong as a new P19/Genesis planning artifact, or is it
 * covered by existing Skill/Workflow/Routine contracts?
 *
 * This module answers that question per directive, mechanically, against
 * the live registry contents. It is assessment tooling, NOT a workflow
 * engine: no steps run here, nothing executes, nothing is scheduled.
 *
 * Reference grammar (all checks are exact, structural, evidenced):
 * - recommended skill: `skill:<id>@<x.y.z>` (pinned) or bare `<id>`
 *   (latest). Must resolve in the SkillRegistry and not be DEPRECATED.
 * - constraint: `policy:<name>` (must be in the known routine-policy
 *   vocabulary) or `approval:<approver>` (some known workflow must carry
 *   an approval step with that approver). Untyped prose is a GAP: it
 *   cannot be enforced by any contract.
 * - definition of done: `<workflow-id>:<step-id>.<output>` (the step must
 *   declare that output) or `<workflow-id>:<step-id>#approval` (the step
 *   must be an approval step with an approver). Anything else is a GAP:
 *   completion must be verifiable against declared outputs or gates.
 * - objective: non-empty prose, covered by Workflow.description
 *   convention (documented mapping, not a mechanical check).
 */

export interface DirectiveSpec {
  id: string;
  objective: string;
  constraints: readonly string[];
  definitionOfDone: readonly string[];
  recommendedSkills: readonly string[];
}

export interface DirectiveContext {
  skills: SkillRegistry;
  workflows: readonly Workflow[];
  /** Known routine-policy vocabulary. */
  policies: readonly string[];
}

export type FieldStatus = "COVERED" | "GAP";

export interface FieldCoverage {
  field: "objective" | "constraint" | "definitionOfDone" | "recommendedSkill";
  item: string;
  status: FieldStatus;
  /** Which existing contract covers it, or why nothing does. */
  via: string;
}

export interface DirectiveAssessment {
  directiveId: string;
  verdict: "COVERED" | "GAP";
  fields: FieldCoverage[];
  gaps: string[];
  /**
   * Standing decision while verdict is COVERED: directives are P19
   * planning artifacts realized through Workflow + Routine + Skill.
   * No new artifact, no second workflow engine.
   */
  decision: string;
}

const COVERED_DECISION =
  "Directive is expressible in P19 Skill/Workflow/Routine contracts; no new artifact, no second workflow engine.";

function findWorkflow(workflows: readonly Workflow[], id: string): Workflow | undefined {
  return workflows.find((w) => w.workflow_id === id);
}

function approvalApprovers(workflows: readonly Workflow[]): Set<string> {
  const out = new Set<string>();
  for (const w of workflows) {
    for (const s of w.steps) {
      if (s.kind === "approval" && s.approval?.approver.trim()) {
        out.add(s.approval.approver.trim());
      }
    }
  }
  return out;
}

export function assessDirective(spec: DirectiveSpec, ctx: DirectiveContext): DirectiveAssessment {
  const fields: FieldCoverage[] = [];

  if (spec.objective.trim()) {
    fields.push({
      field: "objective",
      item: spec.objective,
      status: "COVERED",
      via: "Workflow.description convention: the objective is the workflow's stated purpose",
    });
  } else {
    fields.push({ field: "objective", item: "(empty)", status: "GAP", via: "a directive without an objective maps to nothing" });
  }

  for (const constraint of spec.constraints) {
    const policyMatch = /^policy:([A-Za-z0-9_.-]+)$/.exec(constraint.trim());
    const approvalMatch = /^approval:(\S+)$/.exec(constraint.trim());
    if (policyMatch) {
      const name = policyMatch[1]!;
      if (ctx.policies.includes(name)) {
        fields.push({ field: "constraint", item: constraint, status: "COVERED", via: `Routine.policy=${name}` });
      } else {
        fields.push({ field: "constraint", item: constraint, status: "GAP", via: `unknown routine policy ${name}` });
      }
    } else if (approvalMatch) {
      const approver = approvalMatch[1]!;
      if (approvalApprovers(ctx.workflows).has(approver)) {
        fields.push({ field: "constraint", item: constraint, status: "COVERED", via: `approval checkpoint by ${approver}` });
      } else {
        fields.push({ field: "constraint", item: constraint, status: "GAP", via: `no approval checkpoint by ${approver} in known workflows` });
      }
    } else {
      fields.push({
        field: "constraint",
        item: constraint,
        status: "GAP",
        via: "untyped constraint; express as policy:<name> or approval:<approver> so a contract can enforce it",
      });
    }
  }

  for (const item of spec.definitionOfDone) {
    const outputMatch = /^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)\.([A-Za-z0-9_.-]+)$/.exec(item.trim());
    const approvalMatch = /^([A-Za-z0-9_.-]+):([A-Za-z0-9_.-]+)#approval$/.exec(item.trim());
    if (outputMatch) {
      const [, workflowId, stepId, output] = outputMatch as unknown as [string, string, string, string];
      const workflow = findWorkflow(ctx.workflows, workflowId);
      const step = workflow?.steps.find((s) => s.id === stepId);
      if (step && step.outputs.includes(output)) {
        fields.push({ field: "definitionOfDone", item, status: "COVERED", via: `declared output ${workflowId}:${stepId}.${output}` });
      } else if (!workflow) {
        fields.push({ field: "definitionOfDone", item, status: "GAP", via: `unknown workflow ${workflowId}` });
      } else if (!step) {
        fields.push({ field: "definitionOfDone", item, status: "GAP", via: `unknown step ${workflowId}:${stepId}` });
      } else {
        fields.push({ field: "definitionOfDone", item, status: "GAP", via: `step ${workflowId}:${stepId} does not declare output ${output}` });
      }
    } else if (approvalMatch) {
      const [, workflowId, stepId] = approvalMatch as unknown as [string, string, string];
      const step = findWorkflow(ctx.workflows, workflowId)?.steps.find((s) => s.id === stepId);
      if (step && step.kind === "approval" && step.approval?.approver.trim()) {
        fields.push({
          field: "definitionOfDone",
          item,
          status: "COVERED",
          via: `approval gate ${workflowId}:${stepId} by ${step.approval.approver.trim()}`,
        });
      } else {
        fields.push({ field: "definitionOfDone", item, status: "GAP", via: `${workflowId}:${stepId} is not an approval gate` });
      }
    } else {
      fields.push({
        field: "definitionOfDone",
        item,
        status: "GAP",
        via: "unverifiable completion; use <workflow>:<step>.<output> or <workflow>:<step>#approval",
      });
    }
  }

  for (const entry of spec.recommendedSkills) {
    const trimmed = entry.trim();
    const parsed = parseSkillRef(trimmed) ?? (/^[A-Za-z0-9_.-]+$/.test(trimmed) ? { skillId: trimmed } : null);
    if (!parsed) {
      fields.push({ field: "recommendedSkill", item: entry, status: "GAP", via: "not a skill reference (skill:<id>@<x.y.z> or <id>)" });
      continue;
    }
    const skill = ctx.skills.lookup(parsed.skillId, parsed.version);
    if (!skill) {
      fields.push({
        field: "recommendedSkill",
        item: entry,
        status: "GAP",
        via: parsed.version ? `missing skill ${parsed.skillId}@${parsed.version}` : `missing skill ${parsed.skillId}`,
      });
    } else if (skill.status === "DEPRECATED") {
      fields.push({ field: "recommendedSkill", item: entry, status: "GAP", via: `skill ${parsed.skillId} is DEPRECATED` });
    } else {
      fields.push({
        field: "recommendedSkill",
        item: entry,
        status: "COVERED",
        via: `Skill ${skill.skill_id}@${skill.version} (${skill.status})`,
      });
    }
  }

  const gaps = fields.filter((f) => f.status === "GAP").map((f) => `${f.field}: ${f.item} — ${f.via}`);
  const verdict = gaps.length === 0 ? "COVERED" : "GAP";
  return {
    directiveId: spec.id,
    verdict,
    fields,
    gaps,
    decision: verdict === "COVERED" ? COVERED_DECISION : "Directive has gaps against P19 contracts; close the gaps, do not invent a parallel engine.",
  };
}
