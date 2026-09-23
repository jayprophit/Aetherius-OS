/**
 * REQ-doe-mapping (P22): DOE agentic-workflow reference mapping, attributed.
 *
 * Nick Saraev "Agentic Workflows" (2026) describes a Directive →
 * Orchestration → Execution layering with host governance. That research
 * is STUDY_ONLY external material, not Aetherius IP. This module records
 * the canonical mapping as a machine-checked architecture decision:
 *
 * - Directive (what to do) → P19 Skill/Workflow/Routine contracts.
 * - Orchestration (probabilistic routing) → P22 Genesis cognition.
 * - Execution (deterministic work) → P21 Agent Bridge + typed executors.
 * - Host/Governance (policy, identity, audit) → Aetherius P16/P25.
 *
 * Invariants (tested): every DOE layer maps to exactly one canonical
 * owner; owners are first-party phases/systems, never reference systems;
 * attribution and STUDY_ONLY marking are mandatory. No DOE runtime is
 * created or implied by this mapping.
 */

export type DoeLayer = "directive" | "orchestration" | "execution" | "host-governance";

export const DOE_LAYERS: readonly DoeLayer[] = ["directive", "orchestration", "execution", "host-governance"];

export const DOE_ATTRIBUTION = "Nick Saraev - AGENTIC WORKFLOWS: Build & Sell AI Automations (2026); STUDY_ONLY reference";

export interface DoeMappingEntry {
  layer: DoeLayer;
  /** Canonical first-party owner: P16-P31 phase id or genesis/bridge/aetherius system. */
  owner: string;
  phases: string[];
  notes: string;
}

export interface DoeMapping {
  attribution: string;
  studyOnly: boolean;
  entries: DoeMappingEntry[];
}

const CANONICAL_OWNERS = new Set(["genesis", "bridge", "aetherius"]);

function isCanonicalOwner(owner: string): boolean {
  if (CANONICAL_OWNERS.has(owner)) return true;
  const phase = /^P([0-9]|[12][0-9]|3[01])$/.exec(owner);
  return phase !== null;
}

/** The standing canonical mapping. */
export function canonicalDoeMapping(): DoeMapping {
  return {
    attribution: DOE_ATTRIBUTION,
    studyOnly: true,
    entries: [
      {
        layer: "directive",
        owner: "P19",
        phases: ["P19"],
        notes: "Directives are P19 planning artifacts: Workflow + Routine + Skill (see docs/directive-assessment.md).",
      },
      {
        layer: "orchestration",
        owner: "P22",
        phases: ["P22"],
        notes: "Probabilistic routing over directives belongs to Genesis cognition; models route, they do not execute.",
      },
      {
        layer: "execution",
        owner: "P21",
        phases: ["P21"],
        notes: "Deterministic work runs through Agent Bridge typed executors under the detexec principle.",
      },
      {
        layer: "host-governance",
        owner: "aetherius",
        phases: ["P16", "P25"],
        notes: "Programme truth (P16) and principals/policy (P25) govern every layer; no layer self-authorizes.",
      },
    ],
  };
}

/**
 * Validate a DOE mapping: complete layer coverage exactly once,
 * first-party owners only, mandatory attribution and STUDY_ONLY flag.
 */
export function validateDoeMapping(mapping: DoeMapping): string[] {
  const problems: string[] = [];
  if (!mapping.attribution.trim()) {
    problems.push("DOE mapping requires attribution to the external research");
  }
  if (mapping.studyOnly !== true) {
    problems.push("DOE mapping must stay marked STUDY_ONLY (external research, not Aetherius IP)");
  }
  const seen = new Map<DoeLayer, number>();
  for (const entry of mapping.entries) {
    seen.set(entry.layer, (seen.get(entry.layer) ?? 0) + 1);
    if (!DOE_LAYERS.includes(entry.layer)) {
      problems.push(`unknown DOE layer ${entry.layer}`);
    }
    if (!isCanonicalOwner(entry.owner)) {
      problems.push(`layer ${entry.layer} maps to non-canonical owner ${entry.owner} (reference systems are STUDY_ONLY, never owners)`);
    }
    for (const phase of entry.phases) {
      if (!isCanonicalOwner(phase)) {
        problems.push(`layer ${entry.layer} cites non-canonical phase ${phase}`);
      }
    }
    if (!entry.notes.trim()) {
      problems.push(`layer ${entry.layer} needs a mapping note`);
    }
  }
  for (const layer of DOE_LAYERS) {
    const count = seen.get(layer) ?? 0;
    if (count === 0) problems.push(`DOE layer ${layer} is unmapped`);
    if (count > 1) problems.push(`DOE layer ${layer} is mapped ${count} times (exactly once required)`);
  }
  return [...problems].sort();
}
