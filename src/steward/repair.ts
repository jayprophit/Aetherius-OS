import { evaluateReadiness } from "./readiness";
import { StewardError } from "./types";
import type {
  RepairDecision,
  RepairOutcome,
  RepairProposal,
  ReviewFinding,
} from "./types";

/**
 * Guarded repair: a proposal changes findings only when a separate policy
 * decision allows it. Deny leaves state untouched. Apply never merges —
 * there is no merge path in this module; readiness after repair still
 * reports merge_authority: false.
 */
export function guardedRepair(
  proposal: RepairProposal,
  currentFindings: readonly ReviewFinding[],
  decision: RepairDecision,
): RepairOutcome {
  if (!proposal.id || typeof proposal.id !== "string") {
    throw new StewardError("REPAIR_INVALID", "repair proposal requires an id");
  }
  if (!Array.isArray(proposal.fixesFindingCodes) || proposal.fixesFindingCodes.length === 0) {
    throw new StewardError("REPAIR_INVALID", "repair proposal must list codes it fixes");
  }
  const findings = [...currentFindings];
  if (!decision.allowed) {
    return {
      status: "denied",
      proposal,
      reason: decision.reason ?? "policy denied repair",
      findings,
      readiness: evaluateReadiness(findings),
    };
  }
  const fixSet = new Set(proposal.fixesFindingCodes);
  const remaining = findings.filter((f) => !fixSet.has(f.code));
  return {
    status: "applied",
    proposal,
    resolvedCodes: findings.filter((f) => fixSet.has(f.code)).map((f) => f.code),
    findings: remaining,
    readiness: evaluateReadiness(remaining),
  };
}
