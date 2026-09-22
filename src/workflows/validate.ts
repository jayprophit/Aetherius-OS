import { parseSkillRef, type SkillRegistry } from "./skills";
import type { Workflow, WorkflowStep } from "./types";

const STEP_KINDS = new Set([
  "skill",
  "condition",
  "approval",
  "wait",
  "subworkflow",
  "model-invoke",
  "bridge-action",
]);

function bindingRefs(value: string): string[] {
  const refs: string[] = [];
  const re = /\$(input|steps)\.[A-Za-z0-9_.]+/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) refs.push(match[0]);
  return refs;
}

function hasCycle(steps: WorkflowStep[]): string[] | null {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const visited = new Set<string>();
  const stack: string[] = [];
  const visit = (id: string): string[] | null => {
    if (stack.includes(id)) return [...stack.slice(stack.indexOf(id)), id];
    if (visited.has(id)) return null;
    visited.add(id);
    stack.push(id);
    for (const dep of byId.get(id)?.depends_on ?? []) {
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    return null;
  };
  for (const s of [...steps].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    const cycle = visit(s.id);
    if (cycle) return cycle;
  }
  return null;
}

/**
 * Validate a workflow BEFORE execution. Malformed definitions fail here,
 * never "try to run anyway". Pure + deterministic.
 */
export function validateWorkflow(workflow: Workflow, skills: SkillRegistry): string[] {
  const problems: string[] = [];
  if (!workflow.workflow_id.trim()) problems.push("workflow_id is required");
  if (!/^\d+\.\d+\.\d+$/.test(workflow.version)) {
    problems.push(`invalid version ${workflow.version} (x.y.z required)`);
  }
  const ids = workflow.steps.map((s) => s.id);
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (dupes.length > 0) {
    problems.push(`duplicate step ids: ${[...new Set(dupes)].sort().join(",")}`);
  }
  const byId = new Map(workflow.steps.map((s) => [s.id, s]));
  const declaredInputs = new Set(workflow.inputs);

  for (const step of workflow.steps) {
    if (!STEP_KINDS.has(step.kind)) {
      problems.push(`step ${step.id}: unsupported type ${step.kind}`);
      continue;
    }
    for (const dep of step.depends_on) {
      if (dep === step.id) problems.push(`step ${step.id}: self dependency`);
      else if (!byId.has(dep)) problems.push(`step ${step.id}: missing dependency ${dep}`);
    }
    if (step.kind === "skill") {
      const ref = parseSkillRef(step.ref);
      if (!ref) {
        problems.push(`step ${step.id}: bad skill ref ${step.ref} (skill:<id>@<x.y.z>)`);
      } else {
        const skill = skills.lookup(ref.skillId, ref.version);
        if (!skill) problems.push(`step ${step.id}: missing skill ${step.ref}`);
      }
    }
    if (step.retry) {
      if (!Number.isInteger(step.retry.max_attempts) || step.retry.max_attempts < 1 || step.retry.max_attempts > 10) {
        problems.push(`step ${step.id}: retry max_attempts must be an integer 1..10`);
      }
      if (!["transient", "all", "none"].includes(step.retry.retry_on)) {
        problems.push(`step ${step.id}: invalid retry_on ${step.retry.retry_on}`);
      }
    }
    if (step.timeout_ms !== undefined && (!Number.isFinite(step.timeout_ms) || step.timeout_ms <= 0)) {
      problems.push(`step ${step.id}: timeout_ms must be positive`);
    }
    if (step.kind === "approval" && (!step.approval || !step.approval.approver.trim())) {
      problems.push(`step ${step.id}: approval step needs an approver`);
    }
    // Binding references: $input.<name> must be declared; $steps.<id>.<path>
    // must target a DIRECT dependency (topological execution guarantees its
    // output exists; anything else is rejected here, never at runtime).
    const directDeps = new Set(step.depends_on);
    for (const value of Object.values(step.inputs)) {
      for (const ref of bindingRefs(value)) {
        if (ref.startsWith("$input.")) {
          const name = ref.slice("$input.".length).split(".")[0];
          if (!declaredInputs.has(name)) {
            problems.push(`step ${step.id}: undeclared workflow input ${name}`);
          }
        } else if (ref.startsWith("$steps.")) {
          const target = ref.slice("$steps.".length).split(".")[0];
          if (!byId.has(target)) {
            problems.push(`step ${step.id}: output binding references unknown step ${target}`);
          } else if (target === step.id) {
            problems.push(`step ${step.id}: output binding references itself`);
          } else if (!directDeps.has(target)) {
            problems.push(`step ${step.id}: output binding references non-dependency ${target}`);
          }
        }
      }
    }
  }

  const cycle = hasCycle(workflow.steps);
  if (cycle) problems.push(`dependency cycle: ${cycle.join(" -> ")}`);

  return [...problems].sort();
}
