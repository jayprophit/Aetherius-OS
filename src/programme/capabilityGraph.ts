import type { AppEntry } from "../apps/registry";
import type { ExecutionTargetProfile } from "../runners/targets";
import type { HardwareProfile } from "../providers/hardware";
import type { Skill } from "../workflows/types";

/**
 * REQ-p16-capability-graph: read-only cross-reference capability view.
 *
 * Answers what capabilities exist, who owns them, and what governs
 * them — by projecting authoritative systems, never by owning data.
 * View != registry (no canonical records here), != execution fabric
 * (no invoke/authorize/schedule), != authorization engine (P25
 * decides). REQ-desktop-capability-fabric owns execution and is never
 * touched: this module only references stable capability ids.
 *
 * Capability identity is never minted here: skill nodes reuse
 * skill:<id>@<version>, app nodes reuse app:<id>:<capability>,
 * worker/tool/model refs pass through verbatim.
 */

export type CapabilityRisk = "low" | "medium" | "high" | "critical" | "unknown";

const RISKS: readonly string[] = ["low", "medium", "high", "critical", "unknown"];

export interface CapabilityNode {
  capabilityId: string;
  owner: string;
  schemaRef?: string;
  requirementRefs: string[];
  risk: CapabilityRisk;
  grantRefs: string[];
  adapterRefs: string[];
  targetRefs: string[];
  verificationRefs: string[];
  privacyNote?: string;
  /** Measured latency evidence only (value + source); absent stays absent. */
  latencyMs?: number;
  latencySource?: string;
  evidenceRefs: string[];
  benchmarkRefs: string[];
  provenance: string;
}

export type CapabilityProblem =
  | "capability-id"
  | "owner"
  | "requirement-refs"
  | "risk"
  | "provenance"
  | "latency";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Validate a node. Refs are opaque strings here; staleness is checked by lintView. */
export function validateCapabilityNode(node: CapabilityNode): CapabilityProblem[] {
  const problems: CapabilityProblem[] = [];
  if (!nonEmpty(node.capabilityId)) problems.push("capability-id");
  if (!nonEmpty(node.owner)) problems.push("owner");
  if (!Array.isArray(node.requirementRefs) || node.requirementRefs.some((r) => !nonEmpty(r))) {
    problems.push("requirement-refs");
  }
  if (!RISKS.includes(node.risk)) problems.push("risk");
  if (!nonEmpty(node.provenance)) problems.push("provenance");
  if (node.latencyMs !== undefined &&
      (typeof node.latencyMs !== "number" || !Number.isFinite(node.latencyMs) || node.latencyMs < 0)) {
    problems.push("latency");
  }
  if (node.latencyMs !== undefined && !nonEmpty(node.latencySource)) problems.push("latency");
  return [...new Set(problems)].sort() as CapabilityProblem[];
}

export interface CapabilityViewInput {
  nodes: CapabilityNode[];
}

/**
 * Read-only view over capability nodes. Exposes queries only — no
 * mutate/authorize/execute/install/provision/grant surface exists on
 * this class by construction (tested).
 */
export class CapabilityView {
  private readonly nodes: CapabilityNode[];

  constructor(input: CapabilityViewInput) {
    for (const node of input.nodes) {
      const problems = validateCapabilityNode(node);
      if (problems.length > 0) {
        throw new Error(`invalid capability node ${node?.capabilityId ?? "(unknown)"}: ${problems.join(",")}`);
      }
    }
    const ids = input.nodes.map((n) => n.capabilityId);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      throw new Error(`duplicate capability ids: ${[...new Set(duplicates)].sort().join(",")}`);
    }
    this.nodes = input.nodes.map((n) => JSON.parse(JSON.stringify(n)) as CapabilityNode);
  }

  list(): CapabilityNode[] {
    return this.nodes
      .map((n) => JSON.parse(JSON.stringify(n)) as CapabilityNode)
      .sort((a, b) => (a.capabilityId < b.capabilityId ? -1 : 1));
  }

  byId(capabilityId: string): CapabilityNode | null {
    const found = this.nodes.find((n) => n.capabilityId === capabilityId);
    return found ? (JSON.parse(JSON.stringify(found)) as CapabilityNode) : null;
  }

  byOwner(owner: string): CapabilityNode[] {
    return this.list().filter((n) => n.owner === owner);
  }

  byRequirement(requirementId: string): CapabilityNode[] {
    return this.list().filter((n) => n.requirementRefs.includes(requirementId));
  }

  byAdapter(adapterRef: string): CapabilityNode[] {
    return this.list().filter((n) => n.adapterRefs.includes(adapterRef));
  }

  byTarget(targetRef: string): CapabilityNode[] {
    return this.list().filter((n) => n.targetRefs.includes(targetRef));
  }

  byGrant(grantRef: string): CapabilityNode[] {
    return this.list().filter((n) => n.grantRefs.includes(grantRef));
  }

  withEvidence(): CapabilityNode[] {
    return this.list().filter((n) => n.evidenceRefs.length > 0);
  }

  withoutEvidence(): CapabilityNode[] {
    return this.list().filter((n) => n.evidenceRefs.length === 0);
  }
}

export interface UnresolvedRefs {
  requirementRefs: string[];
  adapterRefs: string[];
  targetRefs: string[];
}

/**
 * Report references that resolve against nothing known. Missing links
 * are unknown, never negative facts: reported, never silently dropped
 * or auto-filled.
 */
export function lintView(
  view: CapabilityView,
  known: { requirements?: readonly string[]; adapters?: readonly string[]; targets?: readonly string[] },
): UnresolvedRefs {
  const missing = (values: string[], knownList: readonly string[] | undefined): string[] => {
    if (knownList === undefined) return [];
    return [...new Set(values.filter((v) => !knownList.includes(v)))].sort();
  };
  const nodes = view.list();
  return {
    requirementRefs: missing(nodes.flatMap((n) => n.requirementRefs), known.requirements),
    adapterRefs: missing(nodes.flatMap((n) => n.adapterRefs), known.adapters),
    targetRefs: missing(nodes.flatMap((n) => n.targetRefs), known.targets),
  };
}

/**
 * Compose a view from authoritative registries. Skills contribute
 * skill:<id>@<version> nodes (risk from risk_class, grants from
 * required_permissions as refs); apps contribute app:<id>:<capability>
 * nodes; targets contribute target:<id> hosting nodes. Nothing is
 * minted; desktop-capability-fabric data is never read or written.
 */
export function composeCapabilityView(input: {
  skills?: readonly Skill[];
  apps?: readonly AppEntry[];
  targets?: readonly ExecutionTargetProfile[];
  hardware?: readonly HardwareProfile[];
}): CapabilityView {
  const nodes: CapabilityNode[] = [];
  for (const skill of [...(input.skills ?? [])].sort((a, b) => (a.skill_id < b.skill_id ? -1 : 1))) {
    nodes.push({
      capabilityId: `skill:${skill.skill_id}@${skill.version}`,
      owner: "P19",
      schemaRef: "Skill",
      requirementRefs: [],
      risk: (["low", "medium", "high", "critical"] as const).includes(skill.risk_class as never)
        ? (skill.risk_class as CapabilityNode["risk"])
        : "unknown",
      grantRefs: [...skill.required_permissions].sort(),
      adapterRefs: [],
      targetRefs: [],
      verificationRefs: [],
      evidenceRefs: [],
      benchmarkRefs: [],
      provenance: skill.provenance,
    });
  }
  for (const app of [...(input.apps ?? [])].sort((a, b) => (a.id < b.id ? -1 : 1))) {
    for (const capability of [...app.capabilities].sort()) {
      nodes.push({
        capabilityId: `app:${app.id}:${capability}`,
        owner: "P10",
        schemaRef: "AppEntry",
        requirementRefs: [],
        risk: "unknown",
        grantRefs: [...app.permissions].sort(),
        adapterRefs: [],
        targetRefs: [],
        verificationRefs: [],
        evidenceRefs: [],
        benchmarkRefs: [],
        provenance: `app-registry:${app.id}@${app.version}`,
      });
    }
  }
  for (const target of [...(input.targets ?? [])].sort((a, b) => (a.targetProfileId < b.targetProfileId ? -1 : 1))) {
    nodes.push({
      capabilityId: `target:${target.targetProfileId}`,
      owner: "P20",
      schemaRef: "ExecutionTargetProfile",
      requirementRefs: ["REQ-p20-execution-target-profile"],
      risk: "unknown",
      grantRefs: target.secrets ? [...target.secrets.classes].sort() : [],
      adapterRefs: [],
      targetRefs: [],
      verificationRefs: [],
      evidenceRefs: [],
      benchmarkRefs: [],
      provenance: `target-profile:${target.provenance}`,
    });
  }
  for (const hardware of [...(input.hardware ?? [])].sort((a, b) => (a.profileId < b.profileId ? -1 : 1))) {
    const measured = hardware.precisions.filter((p) => p.support === "MEASURED" && p.latencyMs !== undefined);
    nodes.push({
      capabilityId: `hardware:${hardware.profileId}`,
      owner: "P18",
      schemaRef: "HardwareProfile",
      requirementRefs: ["REQ-p18-hardware-profiles"],
      risk: "unknown",
      grantRefs: [],
      adapterRefs: [],
      targetRefs: [],
      verificationRefs: [],
      ...(measured.length > 0 && measured[0]!.latencyMs !== undefined
        ? { latencyMs: measured[0]!.latencyMs, latencySource: `hardware:${hardware.profileId}` }
        : {}),
      evidenceRefs: [],
      benchmarkRefs: [],
      provenance: `hardware-profile:${hardware.provenance}`,
    });
  }
  return new CapabilityView({ nodes });
}
