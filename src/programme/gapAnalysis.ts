import { parse as parseYaml } from "yaml";

/**
 * Gap analysis: what Genesis has, what it has not, and what a mature agent
 * platform has that Genesis does not.
 *
 * The owner asked for Genesis to be a first-party agent platform on the
 * scale of Claude Code, ChatGPT, Kimi, Copilot, Gemini, Hermes, OpenCode
 * and the rest. This module is the machine-readable answer to "how far
 * away is that, and what is the next real thing to build".
 *
 * Design rules, matching the rest of the programme:
 *
 *  - YAML is the source of truth. The Markdown report is derived output and
 *    a sync test enforces byte-equality.
 *  - READ-ONLY AUDIT. This module never edits Genesis, never changes a
 *    status, and never promotes anything. A gap is reported, not closed.
 *  - EVERY STATUS IS EVIDENCE-BACKED. A gap with no evidence reference is
 *    a finding, because "we think it is missing" is not the same as
 *    "it is missing".
 *  - CROSS-REFERENCES ARE CHECKED. A gap that names a Genesis requirement,
 *    a spec area, an acceptance test or a platform must point at something
 *    that actually exists. A dangling reference is reported rather than
 *    tolerated, because a gap analysis that cites things that do not exist
 *    is worse than none.
 */

/** The capability axes an agent platform is measured on. */
export const GAP_AXES = [
  "model_integration",
  "tool_execution",
  "planning",
  "memory_context",
  "multi_agent",
  "identity_persistence",
  "permissions_authority",
  "observability_audit",
  "workspace_files",
  "browser_computer",
  "knowledge_retrieval",
  "lifecycle_recovery",
  "interface_presence",
] as const;

export type GapAxis = (typeof GAP_AXES)[number];

/**
 * How far along a capability is.
 *
 * VERIFIED       implemented and proven by a repeatable test.
 * IMPLEMENTED    code exists and compiles, but no test proves it yet.
 * PARTIAL        some of it exists; the rest is named explicitly.
 * MISSING        nothing exists, and the gap is stated.
 * RESEARCH       studied, deliberately not built yet.
 * NOT_APPLICABLE the owner decided this does not apply to Genesis.
 */
export const GAP_STATUSES = [
  "VERIFIED",
  "IMPLEMENTED",
  "PARTIAL",
  "MISSING",
  "RESEARCH",
  "NOT_APPLICABLE",
] as const;

export type GapStatus = (typeof GAP_STATUSES)[number];

/** How urgent the gap is. 1 is the next thing to build. */
export type GapPriority = 1 | 2 | 3 | 4 | 5;

export interface GapRecord {
  /** Stable id. Never renumbered. */
  id: string;
  /** Short capability name. */
  name: string;
  /** The axis it belongs to. */
  axis: GapAxis;
  /** Which of the 35+ Genesis spec areas it maps onto, e.g. "28-MASTER-AI-HIVE". */
  spec_area?: string;
  /** The current state. */
  status: GapStatus;
  /** What is missing, stated plainly. */
  gap: string;
  /** What already exists for it. */
  present: string;
  /** Priority. 1 is the next thing to build. */
  priority: GapPriority;
  /** Genesis requirement ids this gap is evidenced by. */
  requirement_refs?: string[];
  /** Source files in the Genesis tree that evidence the current state. */
  implementation_refs?: string[];
  /** Test files that evidence the current state. */
  test_refs?: string[];
  /** The owner's acceptance tests this gap must satisfy, e.g. "AT-03". */
  acceptance_refs?: string[];
  /** The owner's canonical gap register category, e.g. "D04". */
  gap_register_refs?: string[];
  /** Platforms that have this capability, for comparison. */
  platform_refs?: string[];
  /** Where the judgement came from. */
  provenance: string;
  /** The command or document that produced the evidence. */
  evidence?: string;
  /** Owner decision, when the status is a choice rather than a fact. */
  decision?: string;
}

export interface GapRegistryDoc {
  schema_version?: string;
  source_date?: string;
  /** The Genesis requirement registry the gaps are cross-checked against. */
  genesis_requirement_registry?: string;
  /** The platform capability inventory the comparison comes from. */
  platform_inventory?: string;
  gaps?: GapRecord[];
}

export interface GapRegistry {
  schema_version: string;
  source_date: string;
  genesis_requirement_registry?: string;
  platform_inventory?: string;
  gaps: GapRecord[];
}

export type GapProblem =
  | "schema-version"
  | "gap-id"
  | "gap-name"
  | "gap-axis"
  | "gap-status"
  | "gap-gap"
  | "gap-present"
  | "gap-priority"
  | "gap-provenance"
  | "gap-evidence"
  | "gap-duplicate-id"
  | "gap-requirement-refs"
  | "gap-implementation-refs"
  | "gap-test-refs"
  | "gap-acceptance-refs"
  | "gap-gap-register-refs"
  | "gap-platform-refs"
  | "gap-decision";

export type GapRegistryProblem =
  | "registry-schema-version"
  | "registry-source-date"
  | "registry-gaps"
  | "registry-duplicate-id"
  | "registry-unknown-axis"
  | "registry-unknown-status"
  | "registry-dangling-requirement"
  | "registry-dangling-acceptance"
  | "registry-dangling-gap-register"
  | "registry-dangling-platform"
  | "registry-dangling-implementation"
  | "registry-dangling-test"
  | "registry-missing-evidence"
  | "registry-verified-without-test"
  | "registry-unknown-referenced-id";

/** Parse the gap registry from YAML text. */
export function loadGapRegistry(yamlText: string): GapRegistry {
  const doc = parseYaml(yamlText) as GapRegistryDoc;
  return {
    schema_version: doc.schema_version ?? "",
    source_date: doc.source_date ?? "",
    ...(doc.genesis_requirement_registry
      ? { genesis_requirement_registry: doc.genesis_requirement_registry }
      : {}),
    ...(doc.platform_inventory ? { platform_inventory: doc.platform_inventory } : {}),
    gaps: doc.gaps ?? [],
  };
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Validate one gap record. Returns the problems found; an empty array means
 * the record is well-formed. Never mutates the input.
 */
export function validateGapRecord(gap: GapRecord): GapProblem[] {
  const problems: GapProblem[] = [];
  if (!gap || typeof gap !== "object") return ["gap-id"];
  if (!nonEmpty(gap.id)) problems.push("gap-id");
  if (!nonEmpty(gap.name)) problems.push("gap-name");
  if (!GAP_AXES.includes(gap.axis)) problems.push("gap-axis");
  if (!GAP_STATUSES.includes(gap.status)) problems.push("gap-status");
  if (!nonEmpty(gap.gap)) problems.push("gap-gap");
  if (!nonEmpty(gap.present)) problems.push("gap-present");
  if (![1, 2, 3, 4, 5].includes(gap.priority)) problems.push("gap-priority");
  if (!nonEmpty(gap.provenance)) problems.push("gap-provenance");
  if (!nonEmpty(gap.evidence)) problems.push("gap-evidence");

  // A VERIFIED claim with no test is a claim without proof. The whole point
  // of this registry is that a status means something.
  if (gap.status === "VERIFIED" && (gap.test_refs ?? []).length === 0) {
    problems.push("gap-evidence");
  }

  for (const key of [
    "requirement_refs",
    "implementation_refs",
    "test_refs",
    "acceptance_refs",
    "gap_register_refs",
    "platform_refs",
  ] as const) {
    const value = gap[key];
    if (value === undefined) continue;
    if (!Array.isArray(value) || value.some((v) => !nonEmpty(v))) {
      problems.push(`gap-${key.replace("_refs", "")}-refs` as GapProblem);
    }
  }
  if (gap.decision !== undefined && !nonEmpty(gap.decision)) {
    problems.push("gap-decision");
  }
  return [...new Set(problems)].sort() as GapProblem[];
}

/**
 * The things a gap may reference, so a dangling citation can be detected.
 * Every list is optional: a caller that has none simply does not check
 * that dimension.
 */
export interface GapReferenceSets {
  /** Genesis requirement ids from registry/requirements.tsv. */
  requirements?: readonly string[];
  /** The owner's acceptance test ids, AT-01 to AT-20. */
  acceptanceTests?: readonly string[];
  /** The owner's canonical gap register categories, A01 to G04. */
  gapRegisterCategories?: readonly string[];
  /** Platform ids from the platform capability inventory. */
  platforms?: readonly string[];
  /** Source file paths, relative to the Genesis repository. */
  implementationPaths?: readonly string[];
  /** Test file paths, relative to the Genesis repository. */
  testPaths?: readonly string[];
}

export interface GapRegistryValidationIssue {
  code: GapRegistryProblem;
  id: string;
  detail: string;
}

/**
 * Validate the whole registry, including that every cross-reference points
 * at something that exists.
 *
 * A reference that cannot be resolved is reported rather than ignored. A
 * gap analysis whose citations do not resolve is a document, not evidence.
 */
export function validateGapRegistry(
  registry: GapRegistry,
  references: GapReferenceSets = {},
): GapRegistryValidationIssue[] {
  const issues: GapRegistryValidationIssue[] = [];
  if (!registry || typeof registry !== "object") {
    return [{ code: "registry-schema-version", id: "(registry)", detail: "registry is not an object" }];
  }
  if (!nonEmpty(registry.schema_version)) {
    issues.push({ code: "registry-schema-version", id: "(registry)", detail: "schema_version is empty" });
  }
  if (!nonEmpty(registry.source_date)) {
    issues.push({ code: "registry-source-date", id: "(registry)", detail: "source_date is empty" });
  }
  if (!Array.isArray(registry.gaps) || registry.gaps.length === 0) {
    issues.push({ code: "registry-gaps", id: "(registry)", detail: "no gaps listed" });
    return issues;
  }

  const seen = new Map<string, number>();
  for (const g of registry.gaps) seen.set(g.id, (seen.get(g.id) ?? 0) + 1);
  for (const [id, count] of seen) {
    if (count > 1) {
      issues.push({ code: "registry-duplicate-id", id, detail: `appears ${count}x` });
    }
  }

  const check = (
    values: readonly string[] | undefined,
    known: readonly string[] | undefined,
    code: GapRegistryProblem,
    label: string,
    ownerId: string,
  ): void => {
    if (!values || !known) return;
    for (const v of values) {
      if (!known.includes(v)) {
        issues.push({ code, id: ownerId, detail: `${label} ${v} is not registered` });
      }
    }
  };

  for (const gap of registry.gaps) {
    const problems = validateGapRecord(gap);
    if (problems.length > 0) {
      issues.push({
        code: problems.includes("gap-axis")
          ? "registry-unknown-axis"
          : problems.includes("gap-status")
            ? "registry-unknown-status"
            : "registry-missing-evidence",
        id: gap.id ?? "(unnamed)",
        detail: problems.join(", "),
      });
    }
    check(gap.requirement_refs, references.requirements, "registry-dangling-requirement", "requirement", gap.id);
    check(gap.acceptance_refs, references.acceptanceTests, "registry-dangling-acceptance", "acceptance test", gap.id);
    check(gap.gap_register_refs, references.gapRegisterCategories, "registry-dangling-gap-register", "gap register category", gap.id);
    check(gap.platform_refs, references.platforms, "registry-dangling-platform", "platform", gap.id);
    check(gap.implementation_refs, references.implementationPaths, "registry-dangling-implementation", "implementation path", gap.id);
    check(gap.test_refs, references.testPaths, "registry-dangling-test", "test path", gap.id);
  }

  return issues;
}

// -- queries ---------------------------------------------------------------

export interface AxisRollup {
  axis: GapAxis;
  total: number;
  byStatus: Record<GapStatus, number>;
  /** The single highest-priority open gap in this axis, if any. */
  nextGapId?: string;
}

export function rollupByAxis(registry: GapRegistry): AxisRollup[] {
  const byAxis = new Map<GapAxis, GapRecord[]>();
  for (const g of registry.gaps) {
    const list = byAxis.get(g.axis) ?? [];
    list.push(g);
    byAxis.set(g.axis, list);
  }
  return GAP_AXES.map((axis) => {
    const list = byAxis.get(axis) ?? [];
    const byStatus = {} as Record<GapStatus, number>;
    for (const s of GAP_STATUSES) byStatus[s] = 0;
    for (const g of list) byStatus[g.status] += 1;
    const open = list
      .filter((g) => g.status === "MISSING" || g.status === "PARTIAL")
      .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
    return { axis, total: list.length, byStatus, ...(open[0] ? { nextGapId: open[0].id } : {}) };
  });
}

export interface GapStatusSummary {
  total: number;
  byStatus: Record<GapStatus, number>;
  open: GapRecord[];
  verified: GapRecord[];
}

/** All gaps that are not closed, ordered by priority then id. */
export function openGaps(registry: GapRegistry): GapRecord[] {
  return registry.gaps
    .filter((g) => g.status === "MISSING" || g.status === "PARTIAL")
    .sort((a, b) => a.priority - b.priority || a.id.localeCompare(b.id));
}

export function summariseGapStatuses(registry: GapRegistry): GapStatusSummary {
  const byStatus = {} as Record<GapStatus, number>;
  for (const s of GAP_STATUSES) byStatus[s] = 0;
  for (const g of registry.gaps) byStatus[g.status] += 1;
  return {
    total: registry.gaps.length,
    byStatus,
    open: openGaps(registry),
    verified: registry.gaps.filter((g) => g.status === "VERIFIED"),
  };
}

/**
 * A readiness score per axis: the share of that axis's gaps that are
 * VERIFIED or IMPLEMENTED. It is a coverage measure, not a quality
 * judgement, and it is reported as such.
 */
export function axisReadiness(rollup: AxisRollup): number {
  if (rollup.total === 0) return 0;
  const closed = rollup.byStatus.VERIFIED + rollup.byStatus.IMPLEMENTED;
  return Math.round((closed / rollup.total) * 100);
}
