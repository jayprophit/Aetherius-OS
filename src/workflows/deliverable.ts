import { checkEvidenceGate } from "./evidenceGate";
import type { EvidenceProvided, EvidenceRequirement, GateResult } from "./evidenceGate";

/**
 * REQ-p19-deliverable-contract: generic finished-deliverable contract,
 * platform-wide. Skill packages and Bridge handoffs prove their scopes
 * only; this module states what counts as delivered anywhere:
 * declared artifacts present (hash-checked when hashes are declared)
 * AND required evidence complete (via the evidence gate) AND an
 * explicit verifier attestation for VERIFIED.
 *
 * verification_state machine (per fresh assessment): UNVERIFIED →
 * EVIDENCE_COMPLETE (gate passes) → VERIFIED (explicit attestation only,
 * never automatic). A failed gate never advances state, except that a
 * previously advanced state with newly failing inputs regresses to
 * FAILED; attestation without a passing gate is rejected.
 */

export type VerificationState = "UNVERIFIED" | "EVIDENCE_COMPLETE" | "VERIFIED" | "FAILED";

export interface DeliverableArtifact {
  key: string;
  /** Expected sha256 hex when the producer declares one. */
  sha256?: string;
}

export interface Deliverable {
  deliverableId: string;
  taskId?: string;
  workflowRunId?: string;
  artifacts: DeliverableArtifact[];
  requiredEvidence: EvidenceRequirement[];
  verificationState: VerificationState;
}

export interface ProvidedArtifact {
  key: string;
  sha256?: string;
}

export interface Attestation {
  verifier: string;
  method: string;
  at: string;
}

export interface DeliverableAssessment {
  deliverableId: string;
  delivered: boolean;
  verificationState: VerificationState;
  gate: GateResult;
  missingArtifacts: string[];
  hashMismatches: string[];
}

export type DeliverableProblem =
  | "deliverable-id"
  | "artifacts-invalid"
  | "verification-state";

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const STATES: readonly VerificationState[] = ["UNVERIFIED", "EVIDENCE_COMPLETE", "VERIFIED", "FAILED"];

function validateDeliverable(deliverable: Deliverable): DeliverableProblem[] {
  const problems: DeliverableProblem[] = [];
  if (!nonEmpty(deliverable.deliverableId)) problems.push("deliverable-id");
  if (!Array.isArray(deliverable.artifacts)) {
    problems.push("artifacts-invalid");
  } else {
    const keys = new Set<string>();
    for (const artifact of deliverable.artifacts) {
      if (!nonEmpty(artifact?.key) || keys.has(artifact.key.trim())) {
        problems.push("artifacts-invalid");
        break;
      }
      keys.add(artifact.key.trim());
      if (artifact.sha256 !== undefined && !/^[0-9a-f]{64}$/.test(artifact.sha256)) {
        problems.push("artifacts-invalid");
        break;
      }
    }
  }
  if (!STATES.includes(deliverable.verificationState)) problems.push("verification-state");
  return [...new Set(problems)].sort() as DeliverableProblem[];
}

/**
 * Assess a deliverable: artifacts present (hash-checked when declared)
 * plus evidence gate. Pure; never mutates the deliverable.
 */
export function assessDeliverable(
  deliverable: Deliverable,
  artifacts: readonly ProvidedArtifact[],
  evidence: readonly EvidenceProvided[],
): DeliverableAssessment {
  const problems = validateDeliverable(deliverable);
  if (problems.length > 0) throw new Error(`invalid deliverable: ${problems.join(",")}`);
  const gate = checkEvidenceGate(deliverable.requiredEvidence, evidence);
  const providedByKey = new Map(artifacts.map((a) => [a.key, a]));
  const missingArtifacts: string[] = [];
  const hashMismatches: string[] = [];
  for (const declared of deliverable.artifacts) {
    const provided = providedByKey.get(declared.key);
    if (!provided) {
      missingArtifacts.push(declared.key);
      continue;
    }
    if (declared.sha256 !== undefined && provided.sha256 !== undefined && provided.sha256 !== declared.sha256) {
      hashMismatches.push(declared.key);
    }
  }
  const delivered = gate.verdict === "COMPLETE" && missingArtifacts.length === 0 && hashMismatches.length === 0;
  let verificationState: VerificationState;
  if (delivered) {
    verificationState = deliverable.verificationState === "VERIFIED" ? "VERIFIED" : "EVIDENCE_COMPLETE";
  } else if (deliverable.verificationState === "UNVERIFIED" || deliverable.verificationState === "FAILED") {
    verificationState = deliverable.verificationState;
  } else {
    verificationState = "FAILED";
  }
  return {
    deliverableId: deliverable.deliverableId,
    delivered,
    verificationState,
    gate,
    missingArtifacts: [...missingArtifacts].sort(),
    hashMismatches: [...hashMismatches].sort(),
  };
}

/**
 * Explicit verifier attestation: EVIDENCE_COMPLETE → VERIFIED only.
 * Requires a non-empty verifier, method and timestamp; anything else
 * (including already-VERIFIED or FAILED) is rejected, never auto-passed.
 */
export function attestVerification(
  assessment: DeliverableAssessment,
  attestation: Attestation,
): DeliverableAssessment {
  if (assessment.verificationState !== "EVIDENCE_COMPLETE") {
    throw new Error(`attestation requires EVIDENCE_COMPLETE, got ${assessment.verificationState}`);
  }
  if (!nonEmpty(attestation.verifier) || !nonEmpty(attestation.method) || !nonEmpty(attestation.at)) {
    throw new Error("attestation requires verifier, method and timestamp");
  }
  return { ...assessment, verificationState: "VERIFIED" };
}
