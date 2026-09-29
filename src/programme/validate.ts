/**
 * REQ-p16-registry: machine-readable programme, dependency and requirement
 * registries.
 *
 * Validation is structural and read-only. It never repairs a registry and
 * never decides whether work was actually done; evidence quality is a
 * separate question, audited by evidenceTrace.
 */
import type { ProgrammeBundle, Requirement, ValidationIssue, WorkState } from "./types";

const VALID_STATUSES = new Set([
  "RESEARCH", "ARCHITECTED", "SPECIFIED", "SCAFFOLDED", "PARTIAL",
  "IMPLEMENTED", "COMPILED", "UNIT_TESTED", "INTEGRATION_TESTED",
  "E2E_TESTED", "BENCHMARKED", "SECURITY_TESTED", "PROVEN",
  "OPTIMIZED", "STABLE", "PRODUCTION_READY",
]);

const VALID_WORK_STATES: WorkState[] = [
  "READY", "BLOCKED", "IN_PROGRESS", "COMPLETE", "DEFERRED", "OWNER_GATED",
];

function issue(code: string, message: string, refs: string[] = []): ValidationIssue {
  return { code, message, refs: [...refs].sort() };
}

function hasDependCycle(reqs: Requirement[]): string[][] {
  const byId = new Map(reqs.map((r) => [r.id, r]));
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack: string[] = [];
  const visit = (id: string): void => {
    if (stack.includes(id)) {
      cycles.push([...stack.slice(stack.indexOf(id)), id]);
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    stack.push(id);
    for (const dep of byId.get(id)?.depends_on ?? []) {
      if (byId.has(dep)) visit(dep);
    }
    stack.pop();
  };
  for (const r of [...reqs].sort((a, b) => (a.id < b.id ? -1 : 1))) visit(r.id);
  return cycles;
}

/**
 * Validate programme + depgraph + requirement registries.
 * Pure + deterministic. Never mutates input; failures are diagnostics.
 */
export function validateProgramme(bundle: ProgrammeBundle): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { programme, depgraph, requirements } = bundle;

  // --- phases ---
  const phaseIds = programme.phases.map((p) => p.id);
  const dupPhases = phaseIds.filter((id, i) => phaseIds.indexOf(id) !== i);
  if (dupPhases.length > 0) {
    issues.push(issue("duplicate-phase-id", `duplicate phase ids: ${[...new Set(dupPhases)].sort().join(", ")}`));
  }
  const expected = [...Array.from({ length: 32 }, (_, i) => `P${i}`)];
  const missing = expected.filter((id) => !phaseIds.includes(id));
  if (missing.length > 0) {
    issues.push(issue("missing-phase", `programme must define P0-P31; missing: ${missing.join(", ")}`));
  }

  // --- projects ---
  const projectIds = new Set(programme.projects.map((p) => p.id));

  // --- placements resolve ---
  for (const [key, targets] of Object.entries(programme.placements).sort(([a], [b]) =>
    a < b ? -1 : 1,
  )) {
    for (const t of targets) {
      if (!phaseIds.includes(t)) {
        issues.push(issue("orphan-placement", `placement ${key} targets unknown phase ${t}`, [key]));
      }
    }
  }

  // --- depgraph ---
  const nodeIds = new Set(depgraph.nodes.map((n) => n.id));
  for (const e of depgraph.edges) {
    if (!nodeIds.has(e.from)) {
      issues.push(issue("unknown-dependency", `edge from unknown node ${e.from}`, [e.from]));
    }
    if (!nodeIds.has(e.to)) {
      issues.push(issue("unknown-dependency", `edge to unknown node ${e.to}`, [e.to]));
    }
    if (e.from === e.to) {
      issues.push(issue("self-loop", `self-loop edge on ${e.from}`, [e.from]));
    }
  }

  // --- requirements ---
  const reqIds = requirements.map((r) => r.id);
  const dupReqs = reqIds.filter((id, i) => reqIds.indexOf(id) !== i);
  if (dupReqs.length > 0) {
    issues.push(
      issue("duplicate-requirement-id", `duplicate requirement ids: ${[...new Set(dupReqs)].sort().join(", ")}`),
    );
  }
  const byId = new Map(requirements.map((r) => [r.id, r]));

  for (const r of [...requirements].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (!VALID_STATUSES.has(r.status)) {
      issues.push(issue("invalid-status", `${r.id} has invalid status ${r.status}`, [r.id]));
    }
    if (!VALID_WORK_STATES.includes(r.work_state)) {
      issues.push(issue("invalid-work-state", `${r.id} has invalid work_state ${r.work_state}`, [r.id]));
    }
    if (!Number.isInteger(r.priority) || r.priority < 1 || r.priority > 5) {
      issues.push(
        issue("invalid-priority", `${r.id} priority must be an integer 1..5`, [r.id]),
      );
    }
    if (!phaseIds.includes(r.phase)) {
      issues.push(issue("unknown-phase", `${r.id} references unknown phase ${r.phase}`, [r.id]));
    }
    if (!projectIds.has(r.owner) && !r.owner.startsWith("external:")) {
      issues.push(issue("unknown-project-owner", `${r.id} owner ${r.owner} is not a canonical project`, [r.id]));
    }
    if (r.owner.startsWith("external:")) {
      issues.push(
        issue("external-owner", `${r.id} assigns canonical ownership to external runtime ${r.owner}`, [r.id]),
      );
    }
    if (!Array.isArray(r.evidence) || r.evidence.length === 0 || r.evidence.some((e) => !e.trim())) {
      issues.push(issue("malformed-evidence", `${r.id} evidence must be a non-empty string array`, [r.id]));
    }
    if (!r.provenance || !r.provenance.trim()) {
      issues.push(issue("missing-provenance", `${r.id} provenance is empty`, [r.id]));
    }
    for (const dep of r.depends_on) {
      if (dep === r.id) {
        issues.push(issue("self-dependency", `${r.id} depends on itself`, [r.id]));
      } else if (!byId.has(dep)) {
        issues.push(issue("unknown-dependency", `${r.id} depends on unknown ${dep}`, [r.id]));
      }
    }
    for (const [field, list] of [
      ["supersedes", r.supersedes],
      ["duplicates", r.duplicates],
      ["conflicts", r.conflicts],
    ] as const) {
      for (const ref of list ?? []) {
        if (!byId.has(ref)) {
          issues.push(issue(`invalid-${field}-reference`, `${r.id} ${field} unknown ${ref}`, [r.id]));
        }
      }
    }
    if (r.superseded_by) {
      for (const ref of r.superseded_by) {
        if (!byId.has(ref)) {
          issues.push(issue("invalid-superseded_by-reference", `${r.id} superseded_by unknown ${ref}`, [r.id]));
        }
      }
    }
  }

  for (const cycle of hasDependCycle(requirements)) {
    issues.push(issue("dependency-cycle", `depends_on cycle: ${cycle.join(" -> ")}`, cycle));
  }

  return [...issues].sort((a, b) =>
    a.code === b.code ? a.message.localeCompare(b.message) : a.code.localeCompare(b.code),
  );
}
