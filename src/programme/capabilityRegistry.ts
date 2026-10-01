import { parse as parseYaml } from "yaml";

/**
 * System Capability Registry: the programme's persistent capability/component
 * source of truth (BUILD61).
 *
 * Two layers, merged at load, never duplicated:
 *  - CAP-* nodes authored in docs/SYSTEM-CAPABILITY-REGISTRY.yaml
 *    (hierarchy, future/research concepts, cross-cutting architecture).
 *  - REQ-* nodes materialized from src/programme/requirements.json
 *    (execution truth stays in the requirements registry; this layer only
 *    maps state and attaches parents).
 *
 * The YAML file is authoritative for everything it contains. The generated
 * Markdown report (docs/SYSTEM-CAPABILITY-REGISTRY.md) is derived output and
 * must never be hand-edited: a sync test enforces byte-equality with the
 * generator.
 */

export const CAPABILITY_STATUSES = [
  "NOT_STARTED",
  "RESEARCH",
  "DESIGNED",
  "PARTIAL",
  "IMPLEMENTED",
  "VERIFIED",
  "LIVE",
  "BLOCKED",
  "DEPRECATED",
  "OBSOLETE",
  "REMOVED",
] as const;

export type CapabilityStatus = (typeof CAPABILITY_STATUSES)[number];

/** Leaf progress mapping (§10). PARTIAL leaves are an explicit estimate. */
export const STATUS_PROGRESS: Record<CapabilityStatus, number> = {
  NOT_STARTED: 0,
  RESEARCH: 10,
  DESIGNED: 25,
  PARTIAL: 50,
  IMPLEMENTED: 90,
  VERIFIED: 100,
  LIVE: 100,
  BLOCKED: 0,
  DEPRECATED: -1,
  OBSOLETE: -1,
  REMOVED: -1,
};

export interface CapabilityHistoryEntry {
  date: string;
  action: string;
  from?: string;
  to?: string;
  note?: string;
}

export interface CapabilityNode {
  id: string;
  name: string;
  aliases?: string[];
  type?: string;
  description?: string;
  domain?: string;
  primary_parent?: string | null;
  relationships?: {
    depends_on?: string[];
    used_by?: string[];
    provides?: string[];
    related_to?: string[];
    supersedes?: string[];
    superseded_by?: string[];
    derived_from?: string[];
    blocks?: string[];
    blocked_by?: string[];
  };
  status: CapabilityStatus;
  status_reason?: string;
  required?: boolean;
  phase?: string;
  milestone?: string;
  priority?: number;
  estimated_progress?: number;
  requirement_id?: string;
  implementation?: { paths?: string[] };
  evidence?: {
    tests?: string[];
    docs?: string[];
    runtime?: string[];
    benchmarks?: string[];
    hardware?: string[];
    notes?: string[];
  };
  source?: {
    type?: string;
    introduced_by?: string;
    source_document?: string;
    source_date?: string;
  };
  history?: CapabilityHistoryEntry[];
  notes?: string[];
}

export interface RegistryDoc {
  schema_version?: string;
  requirement_parents?: Record<string, string>;
  default_requirement_parent?: Record<string, string>;
  capabilities: CapabilityNode[];
}

export interface Registry {
  nodes: CapabilityNode[];
  byId: Map<string, CapabilityNode>;
  childrenOf: Map<string, string[]>;
}

/** Map requirement state onto the capability lifecycle (documented in ADR). */
export function mapRequirementStatus(
  status: string,
  workState: string,
): { status: CapabilityStatus; reason: string } {
  const base: Record<string, CapabilityStatus> = {
    PROVEN: "VERIFIED",
    SPECIFIED: "DESIGNED",
    RESEARCH: "RESEARCH",
    PARTIAL: "PARTIAL",
  };
  const mapped = base[status] ?? "RESEARCH";
  if (mapped === "RESEARCH") {
    return { status: "RESEARCH", reason: `requirement state ${status}` };
  }
  switch (workState) {
    case "COMPLETE":
      return { status: mapped, reason: `requirement ${status}/COMPLETE` };
    case "IN_PROGRESS":
      return { status: "PARTIAL", reason: "requirement IN_PROGRESS" };
    case "READY":
      return { status: "DESIGNED", reason: "requirement READY, not started" };
    case "BLOCKED":
      return { status: "BLOCKED", reason: "requirement BLOCKED" };
    case "OWNER_GATED":
      return { status: "BLOCKED", reason: "owner decision required" };
    case "DEFERRED":
      return {
        status: "NOT_STARTED",
        reason: "requirement DEFERRED, recorded not started",
      };
    default:
      return { status: "PARTIAL", reason: `unmapped work_state ${workState}` };
  }
}

const OWNER_REPO: Record<string, string> = {
  "aetherius-os": "Aetherius-OS",
  genesis: "Genesis",
  "agent-bridge": "Agent-Bridge",
  ide: "IDE-Workspace",
  mat: "Materials-Atlas-Table-Codex---MAT",
  poietek: "Poietek",
};

export interface RequirementRecord {
  id: string;
  title: string;
  description?: string;
  owner: string;
  phase: string;
  status: string;
  work_state: string;
  priority?: number;
  depends_on?: string[];
  implementation_refs?: string[];
  test_refs?: string[];
  evidence?: string[];
  provenance?: string;
}

function materializeRequirement(
  r: RequirementRecord,
  overrides: Record<string, string>,
  defaults: Record<string, string>,
): CapabilityNode {
  const { status, reason } = mapRequirementStatus(r.status, r.work_state);
  const repo = OWNER_REPO[r.owner] ?? "Aetherius-OS";
  const impl = (r.implementation_refs ?? []).map((p) =>
    p.includes("/") || p.includes("\\") ? `${repo}/${p}` : `${repo}/${p}`,
  );
  const tests = (r.test_refs ?? []).map((p) => `${repo}/${p}`);
  return {
    id: r.id,
    name: r.title,
    type: "requirement",
    description: r.description ?? "",
    domain: r.owner,
    primary_parent: overrides[r.id] ?? defaults[r.owner] ?? null,
    relationships: { depends_on: [...(r.depends_on ?? [])] },
    status,
    status_reason: reason,
    required: true,
    phase: r.phase,
    priority: r.priority,
    requirement_id: r.id,
    implementation: { paths: impl },
    evidence: {
      tests,
      notes: [...(r.evidence ?? [])],
    },
    source: { type: "requirement-registry", introduced_by: "requirements.json" },
    history: [
      {
        date: "2026-10-01",
        action: "imported",
        note: "materialized from requirements.json at load",
      },
    ],
    notes: r.provenance ? [`provenance: ${r.provenance}`] : [],
  };
}

export function loadRegistry(
  yamlText: string,
  requirements: RequirementRecord[],
): Registry {
  const doc = parseYaml(yamlText) as RegistryDoc;
  const nodes: CapabilityNode[] = [...(doc.capabilities ?? [])];
  const overrides = doc.requirement_parents ?? {};
  const defaults = doc.default_requirement_parent ?? {};
  const byReqId = new Map(requirements.map((r) => [r.id, r]));
  // Generated REQ entries carry their hierarchy and evidence in YAML but take
  // live state from the requirements registry: the requirement stays the
  // single source of truth for its own status.
  for (const n of nodes) {
    const withFlag = n as CapabilityNode & { status_from_requirement?: boolean };
    if (withFlag.status_from_requirement) {
      const r = n.requirement_id ? byReqId.get(n.requirement_id) : undefined;
      if (r) {
        const mapped = mapRequirementStatus(r.status, r.work_state);
        n.status = mapped.status;
        n.status_reason = mapped.reason;
      }
    }
  }
  for (const r of requirements) {
    if (!nodes.some((n) => n.id === r.id)) {
      nodes.push(materializeRequirement(r, overrides, defaults));
    }
  }
  const byId = new Map<string, CapabilityNode>();
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    if (!byId.has(n.id)) byId.set(n.id, n);
    if (n.primary_parent) {
      const list = childrenOf.get(n.primary_parent) ?? [];
      list.push(n.id);
      childrenOf.set(n.primary_parent, list);
    }
  }
  return { nodes, byId, childrenOf };
}

export type PathResolver = (repo: string, path: string) => boolean;

/**
 * Owner names the accountable PROJECT, not the repository holding the
 * implementation. Each owner is therefore searched in its own repository AND
 * in Aetherius-OS. This is the same convention as evidenceTrace's OwnerRoots
 * (verified fact about this registry: Genesis is a C++ tree, so the P22
 * TypeScript modules live under Aetherius-OS/src/genesis/).
 */
const OWNER_REPO_DIR: Record<string, string> = {
  "aetherius-os": "Aetherius-OS",
  genesis: "Genesis",
  "agent-bridge": "Agent-Bridge",
  ide: "IDE-Workspace",
  mat: "Materials-Atlas-Table-Codex---MAT",
  poietek: "Poietek",
};

function candidateRoots(explicit: string, domain: string | undefined): string[] {
  const out: string[] = [];
  for (const r of [explicit, domain ? OWNER_REPO_DIR[domain] : "", "Aetherius-OS"]) {
    if (r && !out.includes(r)) out.push(r);
  }
  return out;
}

export interface ValidationIssue {
  code: string;
  id: string;
  detail: string;
}

/** Split a "RepoDir/relative/path" implementation path. */
export function splitRepoPath(p: string): { repo: string; rest: string } {
  const slash = p.indexOf("/");
  if (slash < 0) return { repo: "", rest: p };
  return { repo: p.slice(0, slash), rest: p.slice(slash + 1) };
}

export function validateRegistry(
  reg: Registry,
  pathExists: PathResolver,
  availableRoots: (repo: string) => boolean,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const seen = new Map<string, number>();
  for (const n of reg.nodes) {
    seen.set(n.id, (seen.get(n.id) ?? 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) {
      issues.push({ code: "duplicate-id", id, detail: `appears ${count}x` });
    }
  }
  // name/alias index for duplicate detection (case-insensitive)
  const nameIndex = new Map<string, string[]>();
  const indexName = (label: string, id: string) => {
    const key = label.trim().toLowerCase();
    if (!key) return;
    const list = nameIndex.get(key) ?? [];
    list.push(id);
    nameIndex.set(key, list);
  };
  for (const n of reg.byId.values()) {
    indexName(n.name, n.id);
    for (const a of n.aliases ?? []) indexName(a, n.id);
  }
  for (const [label, ids] of nameIndex) {
    const uniq = [...new Set(ids)];
    if (uniq.length > 1) {
      issues.push({
        code: "duplicate-candidate",
        id: uniq[0],
        detail: `"${label}" also names ${uniq.slice(1).join(", ")}`,
      });
    }
  }
  const relKeys = [
    "depends_on",
    "used_by",
    "provides",
    "related_to",
    "supersedes",
    "superseded_by",
    "derived_from",
    "blocks",
    "blocked_by",
  ] as const;
  const visitState = new Map<string, number>();
  const stack: string[] = [];
  const cycleCheck = (id: string): boolean => {
    const st = visitState.get(id) ?? 0;
    if (st === 1) return true;
    if (st === 2) return false;
    visitState.set(id, 1);
    stack.push(id);
    const kids = reg.childrenOf.get(id) ?? [];
    for (const k of kids) {
      if (!reg.byId.has(k)) continue;
      if (cycleCheck(k)) return true;
    }
    stack.pop();
    visitState.set(id, 2);
    return false;
  };
  for (const n of reg.byId.values()) {
    if (!CAPABILITY_STATUSES.includes(n.status)) {
      issues.push({
        code: "invalid-status",
        id: n.id,
        detail: `unknown status ${(n as { status: string }).status}`,
      });
    }
    if (n.primary_parent && !reg.byId.has(n.primary_parent)) {
      issues.push({
        code: "missing-parent",
        id: n.id,
        detail: `parent ${n.primary_parent} not registered`,
      });
    }
    const rels = n.relationships ?? {};
    for (const key of relKeys) {
      for (const target of rels[key] ?? []) {
        if (!reg.byId.has(target)) {
          issues.push({
            code: "missing-reference",
            id: n.id,
            detail: `${key} -> ${target} not registered`,
          });
        }
      }
    }
    for (const sup of rels.superseded_by ?? []) {
      const other = reg.byId.get(sup);
      if (other && (other.relationships?.supersedes ?? []).includes(n.id)) {
        // mutual supersession link is consistent, not an error
      }
    }
    // implementation and test paths: owner-roots resolution (own repo, then
    // Aetherius-OS). A path is broken only when every AVAILABLE candidate
    // root lacks it; unavailable roots are skipped, never failed.
    const checkPath = (p: string, kind: string) => {
      const { repo, rest } = splitRepoPath(p);
      if (!repo || !rest) {
        issues.push({ code: "malformed-path", id: n.id, detail: `${kind}:${p}` });
        return;
      }
      const candidates = candidateRoots(repo, n.domain);
      const available = candidates.filter((c) => availableRoots(c));
      if (available.length === 0) return;
      if (!available.some((c) => pathExists(c, rest))) {
        issues.push({
          code: "broken-path",
          id: n.id,
          detail: `${kind}:${p} (not in ${available.join(" or ")})`,
        });
      }
    };
    for (const p of n.implementation?.paths ?? []) checkPath(p, "impl");
    for (const p of n.evidence?.tests ?? []) checkPath(p, "test");
    void stack;
  }
  for (const n of reg.byId.values()) {
    if (cycleCheck(n.id)) {
      issues.push({
        code: "circular-hierarchy",
        id: n.id,
        detail: "hierarchy cycle detected",
      });
      break;
    }
  }
  return issues;
}

export interface ProgressResult {
  percent: number;
  method: string;
  counted: number;
  excluded: number;
}

const EXCLUDED = new Set(["DEPRECATED", "OBSOLETE", "REMOVED"]);

/** Leaf progress: status mapping, with explicit estimates flagged. */
export function leafProgress(n: CapabilityNode): ProgressResult {
  if (EXCLUDED.has(n.status)) {
    return { percent: -1, method: "excluded", counted: 0, excluded: 1 };
  }
  if (n.status === "BLOCKED") {
    if (typeof n.estimated_progress === "number") {
      return {
        percent: n.estimated_progress,
        method: "blocked-with-estimate",
        counted: 1,
        excluded: 0,
      };
    }
    return { percent: 0, method: "blocked-unmeasured", counted: 1, excluded: 0 };
  }
  if (n.status === "PARTIAL" && n.estimated_progress === undefined) {
    return {
      percent: STATUS_PROGRESS.PARTIAL,
      method: "unmeasured-partial-estimate",
      counted: 1,
      excluded: 0,
    };
  }
  const base =
    n.estimated_progress ?? STATUS_PROGRESS[n.status] ?? 0;
  return {
    percent: base,
    method: n.estimated_progress !== undefined ? "explicit-estimate" : "status-map",
    counted: 1,
    excluded: 0,
  };
}

export function progressOf(
  reg: Registry,
  id: string,
  requiredOnly: boolean,
): ProgressResult {
  const node = reg.byId.get(id);
  if (!node) return { percent: 0, method: "missing", counted: 0, excluded: 1 };
  const kids = (reg.childrenOf.get(id) ?? [])
    .map((k) => reg.byId.get(k))
    .filter((k): k is CapabilityNode => !!k)
    .filter((k) => !EXCLUDED.has(k.status))
    .filter((k) => !requiredOnly || k.required !== false);
  if (kids.length === 0) return leafProgress(node);
  let sum = 0;
  let counted = 0;
  let excluded = 0;
  for (const k of kids) {
    const r = progressOf(reg, k.id, requiredOnly);
    if (r.percent < 0) {
      excluded += 1;
      continue;
    }
    sum += r.percent;
    counted += 1;
    excluded += r.excluded;
  }
  if (counted === 0) return leafProgress(node);
  return {
    percent: Math.round((sum / counted) * 10) / 10,
    method: `child-rollup(${counted}${requiredOnly ? ",required-only" : ""})`,
    counted,
    excluded,
  };
}

// -- queries ------------------------------------------------------------

export function childrenOf(reg: Registry, id: string): CapabilityNode[] {
  return (reg.childrenOf.get(id) ?? [])
    .map((k) => reg.byId.get(k))
    .filter((k): k is CapabilityNode => !!k);
}

export function subtreeIds(reg: Registry, id: string): string[] {
  const out: string[] = [];
  const walk = (nodeId: string) => {
    out.push(nodeId);
    for (const k of reg.childrenOf.get(nodeId) ?? []) walk(k);
  };
  if (reg.byId.has(id)) walk(id);
  return out;
}

export function searchRegistry(reg: Registry, query: string): CapabilityNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return reg.nodes.filter((n) => {
    const hit = [n.id, n.name, ...(n.aliases ?? [])].join("\n").toLowerCase();
    return hit.includes(q);
  });
}

export function dependentsOf(reg: Registry, id: string): string[] {
  const out = new Set<string>();
  for (const n of reg.nodes) {
    const rels = n.relationships ?? {};
    const targets = [
      ...(rels.depends_on ?? []),
      ...(rels.blocked_by ?? []),
      ...(rels.derived_from ?? []),
    ];
    if (targets.includes(id)) out.add(n.id);
    if ((n.primary_parent ?? "") === id) out.add(n.id);
  }
  return [...out].sort();
}

export function dependenciesOf(reg: Registry, id: string): string[] {
  const seen = new Set<string>();
  const walk = (nodeId: string) => {
    const n = reg.byId.get(nodeId);
    if (!n) return;
    for (const d of n.relationships?.depends_on ?? []) {
      if (!seen.has(d)) {
        seen.add(d);
        walk(d);
      }
    }
  };
  walk(id);
  seen.delete(id);
  return [...seen].sort();
}

export function blockedNodes(reg: Registry): CapabilityNode[] {
  return reg.nodes.filter((n) => n.status === "BLOCKED");
}

export function byStatus(reg: Registry, status: CapabilityStatus): CapabilityNode[] {
  return reg.nodes.filter((n) => n.status === status);
}

export function unimplementedRequired(reg: Registry): CapabilityNode[] {
  return reg.nodes.filter(
    (n) =>
      n.required !== false &&
      (n.status === "NOT_STARTED" ||
        n.status === "RESEARCH" ||
        n.status === "DESIGNED"),
  );
}

export function unverifiedImplementations(reg: Registry): CapabilityNode[] {
  return reg.nodes.filter((n) => n.status === "IMPLEMENTED");
}

export function changedSince(reg: Registry, isoDate: string): CapabilityNode[] {
  return reg.nodes.filter((n) =>
    (n.history ?? []).some((h) => h.date >= isoDate),
  );
}

export function relatedTo(reg: Registry, id: string): string[] {
  const n = reg.byId.get(id);
  if (!n) return [];
  const rels = n.relationships ?? {};
  const out = new Set<string>();
  for (const key of [
    "depends_on",
    "used_by",
    "provides",
    "related_to",
    "supersedes",
    "superseded_by",
    "derived_from",
    "blocks",
    "blocked_by",
  ] as const) {
    for (const t of rels[key] ?? []) out.add(t);
  }
  for (const kid of reg.childrenOf.get(id) ?? []) out.add(kid);
  if (n.primary_parent) out.add(n.primary_parent);
  return [...out].sort();
}

export function noEvidence(reg: Registry): CapabilityNode[] {
  return reg.nodes.filter((n) => {
    const hasImpl = (n.implementation?.paths ?? []).length > 0;
    const ev = n.evidence ?? {};
    const hasEv =
      (ev.tests ?? []).length > 0 ||
      (ev.docs ?? []).length > 0 ||
      (ev.runtime ?? []).length > 0 ||
      (ev.benchmarks ?? []).length > 0 ||
      (ev.hardware ?? []).length > 0;
    return !hasImpl && !hasEv;
  });
}
