import type {
  ExistenceClass,
  ProgrammeBundle,
  ReuseClass,
  ValidationIssue,
} from "./types";

export type SystemReuseDecision =
  | "STUDY_ONLY"
  | "REFERENCE_IMPLEMENTATION"
  | "OPTIONAL_EXTERNAL_TOOL"
  | "POSSIBLE_FORK"
  | "DEPENDENCY"
  | "REJECT";

export type MatrixCell = "SUPPORTED" | "PARTIAL" | "NOT_PRESENT" | "UNKNOWN" | "NOT_APPLICABLE";

export interface ReferenceSystem {
  id: string;
  name: string;
  repo: string;
  branch: string;
  release: string;
  pushed_at: string;
  license: string;
  license_source: string;
  description: string;
  audit_date: string;
  system_reuse: SystemReuseDecision;
  notes: string;
}

export interface ReferenceCapability {
  id: string;
  system: string;
  name: string;
  description: string;
  category: string;
  security_notes: string;
  our_status: ExistenceClass;
  owner_project?: string;
  owner_phase?: string;
  reuse: ReuseClass;
  rationale: string;
  evidence_refs: string[];
  requirement_ids: string[];
  conflicts: string[];
}

export interface ReferenceAudit {
  systems: ReferenceSystem[];
  capabilities: ReferenceCapability[];
}

const SYSTEM_REUSE: SystemReuseDecision[] = [
  "STUDY_ONLY",
  "REFERENCE_IMPLEMENTATION",
  "OPTIONAL_EXTERNAL_TOOL",
  "POSSIBLE_FORK",
  "DEPENDENCY",
  "REJECT",
];

const REUSE_CLASSES: ReuseClass[] = [
  "BUILD_FROM_SCRATCH",
  "FORK_AND_ADAPT",
  "STUDY_ONLY",
  "REPLACEABLE_PROVIDER_ADAPTER",
  "REUSE_DIRECTLY",
  "INTEGRATE_DEPENDENCY",
  "FORK_AND_EXTEND",
  "PORT",
  "ADAPT",
  "MERGE_SELECTIVELY",
  "REFERENCE_ONLY",
  "REJECT",
  "SUPERSEDED",
];

const EXISTENCE: ExistenceClass[] = [
  "EXISTS",
  "PARTIAL",
  "MISSING",
  "DUPLICATE",
  "LEGACY",
  "CONFLICTING",
  "EXPERIMENTAL",
  "RESEARCH",
  "DEFERRED",
];

function issue(code: string, message: string, refs: string[] = []): ValidationIssue {
  return { code, message, refs: [...refs].sort() };
}

/**
 * Validate a reference audit against programme truth. Pure + deterministic.
 * Licence rule: a missing/unknown licence forces REFERENCE_ONLY or REJECT
 * at system level — never a dependency or fork.
 */
export function validateReferenceAudit(
  audit: ReferenceAudit,
  bundle: Pick<ProgrammeBundle, "programme"> & { requirements: Array<{ id: string }> },
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const phaseIds = new Set(bundle.programme.phases.map((p) => p.id));
  const projectIds = new Set(bundle.programme.projects.map((p) => p.id));
  const requirementIds = new Set(bundle.requirements.map((r) => r.id));

  const systemIds = audit.systems.map((s) => s.id);
  const dupSystems = systemIds.filter((id, i) => systemIds.indexOf(id) !== i);
  if (dupSystems.length > 0) {
    issues.push(issue("duplicate-system-id", `duplicate system ids: ${[...new Set(dupSystems)].sort().join(",")}`));
  }
  for (const system of [...audit.systems].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (!SYSTEM_REUSE.includes(system.system_reuse)) {
      issues.push(issue("invalid-system-reuse", `${system.id} has invalid system reuse ${system.system_reuse}`, [system.id]));
    }
    if (!system.license.trim() || system.license === "UNKNOWN") {
      const cleared: ReadonlySet<string> = new Set(["REFERENCE_ONLY", "REJECT", "STUDY_ONLY"]);
      if (!cleared.has(system.system_reuse)) {
        issues.push(issue("licence-not-cleared", `${system.id} licence unclear but reuse is ${system.system_reuse}`, [system.id]));
      }
    }
    if (!system.repo.trim() || !system.branch.trim()) {
      issues.push(issue("missing-source", `${system.id} lacks repo/branch pinning`, [system.id]));
    }
  }

  const capIds = audit.capabilities.map((c) => c.id);
  const dupCaps = capIds.filter((id, i) => capIds.indexOf(id) !== i);
  if (dupCaps.length > 0) {
    issues.push(issue("duplicate-capability-id", `duplicate capability ids: ${[...new Set(dupCaps)].sort().join(",")}`));
  }
  for (const cap of [...audit.capabilities].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    if (!systemIds.includes(cap.system)) {
      issues.push(issue("unknown-system", `${cap.id} references unknown system ${cap.system}`, [cap.id]));
    }
    if (!REUSE_CLASSES.includes(cap.reuse)) {
      issues.push(issue("invalid-reuse-class", `${cap.id} has invalid reuse ${cap.reuse}`, [cap.id]));
    }
    if (!EXISTENCE.includes(cap.our_status)) {
      issues.push(issue("invalid-implementation-status", `${cap.id} has invalid status ${cap.our_status}`, [cap.id]));
    }
    if (!cap.description.trim() || !cap.rationale.trim()) {
      issues.push(issue("missing-source", `${cap.id} lacks description or rationale`, [cap.id]));
    }
    if (cap.evidence_refs.length === 0 || cap.evidence_refs.some((e) => !e.trim())) {
      issues.push(issue("missing-source", `${cap.id} lacks evidence references`, [cap.id]));
    }
    if (cap.owner_project !== undefined && !projectIds.has(cap.owner_project)) {
      issues.push(issue("unknown-project-owner", `${cap.id} owner ${cap.owner_project} is not canonical`, [cap.id]));
    }
    if (cap.owner_phase !== undefined && !phaseIds.has(cap.owner_phase)) {
      issues.push(issue("unknown-phase", `${cap.id} references unknown phase ${cap.owner_phase}`, [cap.id]));
    }
    for (const req of cap.requirement_ids) {
      if (!requirementIds.has(req)) {
        issues.push(issue("dangling-requirement", `${cap.id} links unknown requirement ${req}`, [cap.id]));
      }
    }
    for (const conflict of cap.conflicts) {
      if (conflict === cap.id) {
        issues.push(issue("self-conflict", `${cap.id} conflicts with itself`, [cap.id]));
      } else if (!capIds.includes(conflict)) {
        issues.push(issue("dangling-conflict", `${cap.id} conflicts with unknown ${conflict}`, [cap.id]));
      }
    }
  }

  return [...issues].sort((a, b) =>
    a.code === b.code ? a.message.localeCompare(b.message) : a.code.localeCompare(b.code),
  );
}

export interface MatrixRow {
  capability: string;
  system: string;
  name: string;
  refsys: MatrixCell;
  aetherius: MatrixCell;
  owner: string;
}

function existenceToCell(status: ExistenceClass): MatrixCell {
  switch (status) {
    case "EXISTS":
      return "SUPPORTED";
    case "PARTIAL":
      return "PARTIAL";
    case "MISSING":
    case "RESEARCH":
    case "DEFERRED":
    case "EXPERIMENTAL":
      return "NOT_PRESENT";
    case "DUPLICATE":
    case "LEGACY":
    case "CONFLICTING":
      return "PARTIAL";
  }
}

/**
 * Capability × system matrix. Deterministic: rows sorted by capability id.
 * The reference system column is SUPPORTED (the capability was inventoried
 * there); cross-system presence is UNKNOWN unless another capability record
 * says otherwise — never guessed. Aetherius column derives from our_status.
 */
export function buildMatrix(audit: ReferenceAudit): MatrixRow[] {
  return [...audit.capabilities]
    .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .map((cap) => ({
      capability: cap.id,
      system: cap.system,
      name: cap.name,
      refsys: "SUPPORTED" as MatrixCell,
      aetherius: existenceToCell(cap.our_status),
      owner:
        cap.owner_project !== undefined && cap.owner_phase !== undefined
          ? `${cap.owner_project}/${cap.owner_phase}`
          : "unassigned",
    }));
}
