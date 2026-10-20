import { createHash } from "node:crypto";

import { ingestCandidate, type RequirementCandidate, type IngestOutcome } from "../../programme/ingest";
import { registerInvention, type InventionInput, type InventionRecord } from "../../programme/inventions";
import {
  auditEvidenceTrace,
  summariseEvidenceTrace,
  type EvidenceTrace,
  type OwnerRoots,
  type PathResolver,
  type TraceSummary,
} from "../../programme/evidenceTrace";
import type { Requirement, SourceRef } from "../../programme/types";
import type { CapabilityNode } from "../../programme/capabilityGraph";
import type { ReuseClass } from "../../programme/types";

/**
 * REA adapter: turn a reverse-engineering analysis into Aetherius
 * programme records.
 *
 * REA (Reverse Engineer Anything, morluto/rea) supplies analysis tools and
 * structured evidence. It is not itself a coding agent: something like
 * Genesis or OpenCode has to interpret the findings, make the engineering
 * decision, write the implementation and test it. This module is the seam
 * where that boundary is drawn.
 *
 * It deliberately owns no registry of its own. A REA finding becomes:
 *
 *   - a Requirement   via the programme's own ingest rules, so duplicate
 *                      detection, supersession and source linking behave
 *                      exactly as they do for every other requirement; and
 *   - an Invention    via the programme's invention registry, so mechanisms
 *                      recovered from other software keep their external
 *                      attribution and never masquerade as first-party.
 *
 * Both paths reuse the existing modules. Nothing here re-implements
 * validation, and nothing here can promote a status on its own.
 *
 * Safety, from the REA integration analysis:
 *
 *   - ANALYSED SOFTWARE IS UNTRUSTED. Strings, comments and tool output
 *     lifted out of a target are data, never instructions. `markUntrusted`
 *     wraps such content so a downstream reader can see it was not authored
 *     by the owner.
 *   - A finding is evidence, not a verdict. Confidence is explicit and
 *     carried with the finding rather than being implied by its presence.
 *   - Decompilation produces approximations. Nothing here asserts that a
 *     recovered mechanism is correct, only that it was observed.
 */

export const REA_EVIDENCE_TYPES = [
  "source",
  "interface",
  "behaviour",
  "binary",
  "network",
  "resource",
] as const;

export type ReaEvidenceType = (typeof REA_EVIDENCE_TYPES)[number];

export const REA_CONFIDENCE_LEVELS = ["high", "medium", "low"] as const;
export type ReaConfidence = (typeof REA_CONFIDENCE_LEVELS)[number];

export interface ReaEvidence {
  /** What kind of observation this is. */
  type: ReaEvidenceType;
  /** The observation itself. May be untrusted content lifted from a target. */
  content: string;
  /** Where it was observed: a file, a function, a captured request. */
  sourceRef: string;
  /** Confidence in this specific observation. */
  confidence: ReaConfidence;
}

export interface ReaMechanism {
  /** Stable name for the mechanism. */
  name: string;
  /** What the mechanism does. */
  description: string;
  /** Where it was found. */
  location: string;
  /** Confidence that this mechanism is what was identified. */
  confidence: ReaConfidence;
  /** Related mechanisms, prior art, or equivalent first-party components. */
  related?: string[];
}

export interface ReaPriorArt {
  /** Reference identifier. */
  ref: string;
  /** Relationship to the analysed target. */
  relation: string;
  /** Where the reference comes from. */
  source: string;
}

export interface ReaImplementationSuggestion {
  /** High-level approach. */
  approach: string;
  /** Components the implementation would need. */
  keyComponents: string[];
  /** How the finding is expected to be reused. */
  reuseClass: ReuseClass;
  confidence: ReaConfidence;
}

export interface ReaToolResult {
  /** Stable id for this analysis. */
  resultId: string;
  /** The target that was analysed. */
  target: string;
  /** ISO timestamp of the analysis. */
  analysedAt: string;
  /** Version of the analysis tool that produced the result. */
  toolVersion?: string;
  /** One-paragraph statement of what was found. */
  summary: string;
  /** The supporting observations. */
  evidence: ReaEvidence[];
  /** The mechanisms identified. */
  mechanisms: ReaMechanism[];
  /** Confidence, overall and per item. */
  confidence: {
    overall: ReaConfidence;
    byMechanism: Record<string, ReaConfidence>;
    byEvidence: Record<string, ReaConfidence>;
  };
  /** Prior art or related existing work. */
  priorArt?: ReaPriorArt[];
  /** What an independent implementation would look like. */
  implementationSuggestion?: ReaImplementationSuggestion;
}

// -- construction -----------------------------------------------------------

/** Marker prefix for content that came from analysed software. */
const UNTRUSTED_MARKER = "[untrusted:analysed-target]";

/**
 * Wrap content extracted from an analysed target so that a reader can see
 * it was not authored by the owner and must not be treated as an
 * instruction. This is a provenance marker, not a sanitiser: it does not
 * remove prompt-injection text, it records that the text is untrusted.
 */
export function markUntrusted(content: string): string {
  const trimmed = content.trim();
  if (trimmed.startsWith(UNTRUSTED_MARKER)) return trimmed;
  return `${UNTRUSTED_MARKER} ${trimmed}`;
}

/** True when the content carries the untrusted-provenance marker. */
export function isUntrusted(content: string): boolean {
  return content.trim().startsWith(UNTRUSTED_MARKER);
}

/** Deterministic result id: same target and summary always give the same id. */
export function reaResultId(target: string, summary: string): string {
  const hash = createHash("sha256")
    .update(`${target.trim()}\n${summary.trim()}`, "utf8")
    .digest("hex")
    .slice(0, 8);
  return `rea-${hash}`;
}

export interface CreateReaResultInput {
  target: string;
  summary: string;
  evidence: ReaEvidence[];
  mechanisms: ReaMechanism[];
  priorArt?: ReaPriorArt[];
  implementationSuggestion?: ReaImplementationSuggestion;
  toolVersion?: string;
  analysedAt?: string;
}

/**
 * Build a REA result, deriving the confidence map from the items
 * themselves so the per-item and overall figures cannot drift apart.
 */
export function createReaResult(input: CreateReaResultInput): ReaToolResult {
  const byMechanism: Record<string, ReaConfidence> = {};
  for (const m of input.mechanisms) byMechanism[m.name] = m.confidence;
  const byEvidence: Record<string, ReaConfidence> = {};
  for (const e of input.evidence) byEvidence[e.sourceRef] = e.confidence;

  // Overall confidence is the lowest item confidence, not an average: a
  // single low-confidence mechanism must not be averaged away by a pile of
  // confident ones.
  const all = [...input.mechanisms.map((m) => m.confidence), ...input.evidence.map((e) => e.confidence)];
  const overall: ReaConfidence = all.length === 0
    ? "low"
    : all.includes("low")
      ? "low"
      : all.includes("medium")
        ? "medium"
        : "high";

  return {
    resultId: reaResultId(input.target, input.summary),
    target: input.target.trim(),
    analysedAt: input.analysedAt ?? new Date().toISOString(),
    ...(input.toolVersion ? { toolVersion: input.toolVersion } : {}),
    summary: input.summary.trim(),
    evidence: [...input.evidence],
    mechanisms: [...input.mechanisms],
    confidence: { overall, byMechanism, byEvidence },
    ...(input.priorArt ? { priorArt: [...input.priorArt] } : {}),
    ...(input.implementationSuggestion ? { implementationSuggestion: input.implementationSuggestion } : {}),
  };
}

// -- validation -------------------------------------------------------------

export type ReaProblem =
  | "result-id"
  | "result-target"
  | "result-summary"
  | "result-evidence"
  | "result-mechanisms"
  | "result-confidence"
  | "evidence-type"
  | "evidence-content"
  | "evidence-source"
  | "evidence-confidence"
  | "mechanism-name"
  | "mechanism-description"
  | "mechanism-location"
  | "mechanism-confidence"
  | "prior-art"
  | "suggestion-reuse-class";

const REUSE_CLASSES: readonly string[] = [
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

/**
 * Validate a REA result. An empty array means the result is well-formed.
 * Never mutates the input.
 */
export function validateReaResult(result: ReaToolResult): ReaProblem[] {
  const problems: ReaProblem[] = [];
  if (!result || typeof result !== "object") return ["result-id"];

  if (!result.resultId || !result.resultId.trim()) problems.push("result-id");
  if (!result.target || !result.target.trim()) problems.push("result-target");
  if (!result.summary || !result.summary.trim()) problems.push("result-summary");

  if (!Array.isArray(result.evidence) || result.evidence.length === 0) {
    problems.push("result-evidence");
  } else {
    for (const e of result.evidence) {
      if (!e || !REA_EVIDENCE_TYPES.includes(e.type)) {
        problems.push("evidence-type");
        continue;
      }
      if (!e.content || !e.content.trim()) problems.push("evidence-content");
      if (!e.sourceRef || !e.sourceRef.trim()) problems.push("evidence-source");
      if (!REA_CONFIDENCE_LEVELS.includes(e.confidence)) problems.push("evidence-confidence");
    }
  }

  if (!Array.isArray(result.mechanisms) || result.mechanisms.length === 0) {
    problems.push("result-mechanisms");
  } else {
    for (const m of result.mechanisms) {
      if (!m || !m.name || !m.name.trim()) {
        problems.push("mechanism-name");
        continue;
      }
      if (!m.description || !m.description.trim()) problems.push("mechanism-description");
      if (!m.location || !m.location.trim()) problems.push("mechanism-location");
      if (!REA_CONFIDENCE_LEVELS.includes(m.confidence)) problems.push("mechanism-confidence");
    }
  }

  if (!result.confidence || !REA_CONFIDENCE_LEVELS.includes(result.confidence.overall)) {
    problems.push("result-confidence");
  }

  for (const art of result.priorArt ?? []) {
    if (!art || !art.ref || !art.relation || !art.source) {
      problems.push("prior-art");
      break;
    }
  }

  const s = result.implementationSuggestion;
  if (s && (!s.approach || !s.reuseClass || !REUSE_CLASSES.includes(s.reuseClass))) {
    problems.push("suggestion-reuse-class");
  }

  return [...new Set(problems)].sort() as ReaProblem[];
}

// -- programme integration --------------------------------------------------

export interface ReaIngestOptions {
  /** The accountable project, e.g. "aetherius-os". */
  owner: string;
  /** Phase the finding belongs to. */
  phase: string;
  /** Programme priority, 1..5 (5 = most urgent). */
  priority: number;
  /** Source class for the requirement. Defaults to RESEARCH_NOTE. */
  sourceClass?: SourceRef["class"];
  /** Where the source lives, e.g. a repository and path. */
  sourceRef?: string;
  /** Source date. Defaults to the analysis timestamp. */
  sourceDate?: string;
  /** Id prefix for a generated requirement. Defaults to "REQ". */
  idPrefix?: string;
}

/**
 * Map a REA result onto the programme's requirement candidate shape.
 * Pure: the caller decides whether to ingest it.
 */
export function reaResultToCandidate(
  result: ReaToolResult,
  options: ReaIngestOptions,
): RequirementCandidate {
  const source: SourceRef = {
    class: options.sourceClass ?? "RESEARCH_NOTE",
    ref: options.sourceRef ?? `rea:${result.resultId}`,
    location: result.target,
    date: options.sourceDate ?? result.analysedAt,
  };
  const mechanismNames = result.mechanisms.map((m) => m.name);
  const description = [
    result.summary,
    "",
    `Mechanisms observed: ${mechanismNames.join(", ") || "none"}.`,
    `Confidence: ${result.confidence.overall}.`,
  ].join("\n");

  return {
    title: `REA analysis: ${result.target}`,
    description,
    source,
    owner: options.owner,
    phase: options.phase,
    priority: options.priority,
    evidence: result.evidence.map((e) => `${e.type}: ${e.sourceRef} — ${e.content}`),
    provenance: `rea-analysis:${result.resultId}${result.toolVersion ? `@${result.toolVersion}` : ""}`,
    status: "RESEARCH",
    work_state: "READY",
    owner_gate: false,
    notes: result.mechanisms
      .map((m) => `${m.name} (${m.confidence}) at ${m.location}: ${m.description}`)
      .join("\n"),
  };
}

/**
 * Ingest a REA result into the requirement set using the programme's own
 * rules, so a REA finding that restates an existing requirement is merged
 * rather than duplicated.
 */
export function ingestReaResult(
  existing: Requirement[],
  result: ReaToolResult,
  options: ReaIngestOptions,
): IngestOutcome {
  return ingestCandidate(existing, reaResultToCandidate(result, options), options.idPrefix ?? "REQ");
}

export interface ReaInventionOptions {
  /** The accountable project. */
  projects: string[];
  /** Inventors. Defaults to the analysis author if supplied. */
  inventors?: string[];
  /** The problem the observed mechanism would solve. */
  problem: string;
  /** What was already tried. */
  priorApproaches?: string;
  /** The effect of adopting the mechanism. */
  effect: string;
  /** Related requirement ids. */
  relatedRequirements?: string[];
  /** Date the mechanism was first conceived. Defaults to the analysis date. */
  dateConceived?: string;
  /** Prototype evidence: paths, tests, measurements. */
  prototypeEvidence?: string[];
  /** True when the mechanism was recovered from external work. */
  derivedFromExternal?: boolean;
  /** Attribution for externally derived mechanisms. */
  externalAttribution?: string;
}

/**
 * Map a REA result onto the programme's invention input shape.
 *
 * The mechanism text is the observed mechanism descriptions, attributed to
 * the analysed target. A mechanism recovered from someone else's software
 * must declare `derivedFromExternal` and name the attribution, or the
 * invention registry rejects it: that is the rule that stops a recovered
 * design from being recorded as first-party.
 */
export function reaResultToInventionInput(
  result: ReaToolResult,
  options: ReaInventionOptions,
): InventionInput {
  const mechanism = result.mechanisms
    .map((m) => `${m.name} (confidence: ${m.confidence}, observed at ${m.location}): ${m.description}`)
    .join("\n");

  return {
    title: `REA-derived mechanism: ${result.target}`,
    // The inventors of a recovered mechanism are the people who conceived it.
    // When they are not known, the analysed target is the honest attribution;
    // the caller should supply the real authors when they are known. An
    // anonymous record is not permitted by the invention registry.
    inventors: options.inventors ?? [result.target],
    dateConceived: options.dateConceived ?? result.analysedAt.slice(0, 10),
    problem: options.problem,
    priorApproaches: options.priorApproaches ?? "",
    mechanism,
    effect: options.effect,
    projects: options.projects,
    sources: [result.target, ...(result.priorArt ?? []).map((a) => a.ref)],
    prototypeEvidence: options.prototypeEvidence ?? result.evidence.map((e) => e.sourceRef),
    priorArt: (result.priorArt ?? []).map((a) => ({ ref: a.ref, relation: a.relation })),
    status: "CANDIDATE",
    evidenceRefs: [],
    relatedRequirements: options.relatedRequirements ?? [],
    provenance: `rea-analysis:${result.resultId}`,
    ...(options.derivedFromExternal !== undefined
      ? { derivedFromExternal: options.derivedFromExternal }
      : {}),
    ...(options.externalAttribution !== undefined
      ? { externalAttribution: options.externalAttribution }
      : {}),
  };
}

/**
 * Register a REA finding as an invention, through the programme's own
 * registry. Same content is idempotent; the same id with different content
 * is a conflict and is never silently overwritten.
 */
export function registerReaFinding(
  records: readonly InventionRecord[],
  result: ReaToolResult,
  options: ReaInventionOptions,
  knownRequirements: readonly string[] = [],
): { records: InventionRecord[]; outcome: ReturnType<typeof registerInvention>["outcome"] } {
  return registerInvention(
    records,
    reaResultToInventionInput(result, options),
    knownRequirements,
  );
}

// -- evidence traceability --------------------------------------------------

/**
 * Audit a REA result against the same evidence-traceability rules the
 * programme applies to its own requirements, by projecting the result onto
 * a requirement shape and reusing the existing auditor.
 *
 * The projection is deliberate: a REA finding that cites a path should be
 * held to exactly the same standard as a requirement that does. A citation
 * that resolves is real; a citation that does not is reported, not
 * repaired.
 */
export function auditReaResult(
  result: ReaToolResult,
  roots: OwnerRoots,
  resolve: PathResolver,
): EvidenceTrace[] {
  const projected: Requirement = {
    id: result.resultId,
    title: `REA analysis: ${result.target}`,
    description: result.summary,
    source: { class: "RESEARCH_NOTE", ref: `rea:${result.resultId}` },
    owner: "rea",
    phase: "research",
    status: "RESEARCH",
    priority: 3,
    depends_on: [],
    blockers: [],
    evidence: result.evidence.map((e) => `${e.sourceRef}: ${e.content}`),
    implementation_refs: result.mechanisms.map((m) => m.location),
    test_refs: [],
    provenance: `rea-analysis:${result.resultId}`,
    owner_gate: false,
    work_state: "READY",
  };
  return auditEvidenceTrace([projected], roots, resolve);
}

/** Summarise a set of REA evidence traces with the programme's own summary. */
export function summariseReaEvidence(traces: readonly EvidenceTrace[]): TraceSummary {
  return summariseEvidenceTrace(traces);
}

// -- capability graph -------------------------------------------------------

/**
 * Project a REA result onto a capability-graph node, so a recovered
 * mechanism can be compared against existing Aetherius capabilities and
 * recognised as a duplicate rather than built twice.
 *
 * The node is only a view. It mints no capability identity: the caller
 * decides whether this becomes a new capability, an extension of an
 * existing one, or evidence for one already registered.
 */
export function reaCapabilityNode(
  result: ReaToolResult,
  options: {
    owner: string;
    requirementRefs?: readonly string[];
    evidenceRefs?: readonly string[];
    risk?: CapabilityNode["risk"];
  },
): CapabilityNode {
  return {
    capabilityId: `rea:${result.resultId}`,
    owner: options.owner,
    requirementRefs: [...(options.requirementRefs ?? [])].sort(),
    risk: options.risk ?? "unknown",
    grantRefs: [],
    adapterRefs: [],
    targetRefs: [],
    verificationRefs: [],
    evidenceRefs: [...(options.evidenceRefs ?? result.evidence.map((e) => e.sourceRef))].sort(),
    benchmarkRefs: [],
    provenance: `rea-analysis:${result.resultId}`,
  };
}

// -- reuse classification ----------------------------------------------------

export type ReaCoverage = "full" | "partial" | "minimal";

/**
 * Map a REA finding's coverage and confidence onto the programme's reuse
 * vocabulary. Coverage is how much of the target was understood, not how
 * much of it was reproduced.
 */
export function mapReaReuseClass(
  coverage: ReaCoverage,
  confidence: ReaConfidence,
  hasPriorArt: boolean,
): ReuseClass {
  if (coverage === "full" && confidence === "high" && hasPriorArt) return "REUSE_DIRECTLY";
  if (coverage === "full" && confidence === "high") return "INTEGRATE_DEPENDENCY";
  if (coverage === "partial" && confidence === "high") return "FORK_AND_ADAPT";
  if (coverage === "partial" && confidence === "medium") return "STUDY_ONLY";
  if (coverage === "minimal") return "STUDY_ONLY";
  return "BUILD_FROM_SCRATCH";
}
