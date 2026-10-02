/**
 * BUILD70: the one canonical acceptance-gate status contract (G00-G12).
 *
 * Platform rule: no gate changes status because an agent said the work is
 * finished. A gate has a lifecycle (where it is in evaluation) and a
 * disposition (what its last completed evaluation found), and the two are
 * deliberately separate fields so a historical PASS can never masquerade as
 * a current one.
 *
 * Boundaries (structural):
 * - This module derives status. It never approves, releases, publishes or
 *   executes anything, and it never invents an authorization that is absent.
 * - A gate is NOT a second requirement registry. Every criterion names a
 *   requirement in programme/requirements.json, and `resolveGateRequirements`
 *   refuses definitions referencing requirements the canonical registry does
 *   not contain. Evidence completeness reuses workflows/evidenceGate.
 * - No aggregate score, percentage or global verdict. A list of problems and
 *   the gates that need attention, nothing that can be summed into a number.
 * - CLOSED is not PASS. A closed gate may hold FAIL, BLOCKED_* or DEFERRED.
 * - Stale evidence cannot support a current PASS, and a superseded evaluation
 *   cannot overwrite a newer one.
 */

import { checkEvidenceGate } from "../workflows/evidenceGate";
import type { EvidenceProvided, EvidenceRequirement } from "../workflows/evidenceGate";
import type { Requirement } from "./types";

// ---------------------------------------------------------------------------
// Vocabulary (canonical; the only place these strings are defined)
// ---------------------------------------------------------------------------

/** Where a gate sits in the evaluation process. */
export const GATE_LIFECYCLES = [
  "NOT_EVALUATED",
  "IN_PROGRESS",
  "STALE",
  "CLOSED",
] as const;
export type GateLifecycle = (typeof GATE_LIFECYCLES)[number];

/** What the last completed evaluation found. */
export const GATE_DISPOSITIONS = [
  "PASS",
  "FAIL",
  "BLOCKED_OWNER",
  "BLOCKED_EXTERNAL",
  "NOT_APPLICABLE",
  "DEFERRED_BY_APPROVED_SCOPE",
] as const;
export type GateDisposition = (typeof GATE_DISPOSITIONS)[number];

/** Per-criterion result. Criterion status determines gate eligibility. */
export const CRITERION_RESULTS = [
  "NOT_TESTED",
  "IN_PROGRESS",
  "PASS",
  "FAIL",
  "BLOCKED",
  "NOT_APPLICABLE",
] as const;
export type CriterionResult = (typeof CRITERION_RESULTS)[number];

export const ACCEPTANCE_GATE_IDS = [
  "G00", "G01", "G02", "G03", "G04", "G05",
  "G06", "G07", "G08", "G09", "G10", "G11", "G12",
] as const;
export type AcceptanceGateId = (typeof ACCEPTANCE_GATE_IDS)[number];

// ---------------------------------------------------------------------------
// Gate definitions: ids, minimum evidence, and canonical requirement links
// ---------------------------------------------------------------------------

export interface GateDefinition {
  id: AcceptanceGateId;
  title: string;
  /** Minimum evidence keys. Presence is enforced by the existing evidence gate. */
  evidence: readonly EvidenceRequirement[];
  /** Mandatory acceptance criteria, named as canonical requirement ids. */
  requirements: readonly string[];
}

const E = (key: string, description: string): EvidenceRequirement => ({ key, description });

/**
 * The G00-G12 acceptance gates. Each criterion resolves against
 * programme/requirements.json; nothing here invents a requirement, a
 * criterion or an authority that the canonical programme does not already hold.
 */
export const ACCEPTANCE_GATE_DEFINITIONS: readonly GateDefinition[] = [
  {
    id: "G00",
    title: "BASELINE",
    evidence: [
      E("git-state", "Working-tree state and commit list per repository"),
      E("baseline-commands", "The exact commands that constitute the baseline gate"),
      E("build-environment", "Dependency and build environment identification"),
    ],
    requirements: ["REQ-p16-registry", "REQ-p16-steward-automation",
                   "REQ-p16-control", "REQ-p17-owned-state"],
  },
  {
    id: "G01",
    title: "REGISTRY",
    evidence: [
      E("registry-validation", "Registry validation output"),
      E("requirement-integrity", "Requirement integrity check output"),
      E("report-synchronization", "Generated reports regenerated and compared"),
    ],
    requirements: ["REQ-p16-registry", "REQ-mat-claim-registry",
                   "REQ-omniagent-reference-index"],
  },
  {
    id: "G02",
    title: "WORKFLOW",
    evidence: [
      E("workflow-trace", "Complete real-workflow trace, end to end"),
      E("world-state-readback", "Initial and final world state"),
      E("independent-verification", "Verification not produced by the acting component"),
    ],
    requirements: ["REQ-ide-genesis-task-loop", "REQ-p23-work-monitoring",
                   "REQ-p24-service-orchestrator"],
  },
  {
    id: "G03",
    title: "REGRESSION",
    evidence: [
      E("regression-tests", "Regression suite results"),
      E("concurrency-results", "Concurrency results under contention"),
      E("negative-control", "Mutation or negative-control evidence"),
    ],
    requirements: ["REQ-p17-verification-continuity", "REQ-p21-test-impact",
                   "REQ-p20-expected-touch-set"],
  },
  {
    id: "G04",
    title: "SECURITY",
    evidence: [
      E("attack-matrix", "Security attack matrix, each cell executed"),
      E("authority-decisions", "Recorded authority decisions"),
      E("actual-service-tests", "Tests against the actual service, not a stub"),
    ],
    requirements: ["REQ-p20-clean-room", "REQ-p25-supply-chain",
                   "REQ-owner-full-control", "REQ-p21-sandbox-runners"],
  },
  {
    id: "G05",
    title: "RECOVERY",
    evidence: [
      E("fault-injection", "Fault-injection results"),
      E("journal-state", "Journal and checkpoint state after interruption"),
      E("replay-evidence", "Recovery and replay evidence"),
    ],
    requirements: ["REQ-p17-verification-continuity", "REQ-cloud-persistent-exec",
                   "REQ-p30-repo-relay"],
  },
  {
    id: "G06",
    title: "PRIVACY",
    evidence: [
      E("data-flow-traces", "Observed data-flow traces"),
      E("privacy-tests", "Privacy test results"),
      E("retention-findings", "Retention and access-control findings"),
    ],
    requirements: ["REQ-regulated-evidence", "REQ-p17-owned-state",
                   "REQ-p27-multichannel-messaging"],
  },
  {
    id: "G07",
    title: "BENCHMARK",
    evidence: [
      E("benchmark-results", "Reproducible measurement results"),
      E("environment-details", "The environment the measurement describes"),
      E("regression-analysis", "Regression analysis against the prior baseline"),
    ],
    requirements: ["REQ-p18-model-fabric", "REQ-p22-reflex-calibration"],
  },
  {
    id: "G08",
    title: "WORKER",
    evidence: [
      E("worker-lifecycle", "Reachable worker lifecycle, exercised not declared"),
      E("scoped-delegation", "Delegation confined to its scope"),
      E("crash-cleanup", "Crash, recovery and cleanup results"),
    ],
    requirements: ["REQ-parallel-temp-workers", "REQ-p20-worker-profiles",
                   "REQ-p20-spine-branch"],
  },
  {
    id: "G09",
    title: "ORGANISM",
    evidence: [
      E("architecture-mapping", "Organism architecture mapping"),
      E("kernel-genesis-contracts", "Kernel-Genesis contract evidence"),
      E("identity-authority-tests", "Identity and authority tests"),
    ],
    requirements: ["REQ-genesis-identity-rule", "REQ-genesis-actuator",
                   "REQ-p22-reflex-fabric"],
  },
  {
    id: "G10",
    title: "INTEGRATION",
    evidence: [
      E("interface-evidence", "Stable interface evidence"),
      E("compatibility-tests", "Compatibility and migration tests"),
      E("post-abstraction-regression", "Regression results after abstraction"),
    ],
    requirements: ["REQ-bridge-gate-compat", "REQ-mcp-adapter-boundary",
                   "REQ-p17-shared-schemas", "REQ-p17-service-primitives"],
  },
  {
    id: "G11",
    title: "TRACEABILITY",
    evidence: [
      E("claim-dispositions", "An explicit disposition per individual claim"),
      E("corrected-citations", "Corrected citations and states"),
      E("registry-validation", "Registry validation after correction"),
    ],
    requirements: ["REQ-mat-claim-registry", "REQ-p23-chat-work-depths",
                   "REQ-cert-regeneration", "REQ-codex-review",
                   "REQ-refmap-followup", "REQ-mat-derived-matrices"],
  },
  {
    id: "G12",
    title: "RELEASE",
    evidence: [
      E("clean-installation", "Clean installation from the packaged artifact"),
      E("integrated-operation", "Startup and integrated operation"),
      E("supply-chain-packaging", "Supply-chain and packaging evidence"),
    ],
    requirements: ["REQ-p31-release-packaging", "REQ-p31-release-scope",
                   "REQ-p31-deployment-profile", "REQ-p25-supply-chain"],
  },
] as const;

const GATE_BY_ID = new Map<string, GateDefinition>(
  ACCEPTANCE_GATE_DEFINITIONS.map((g) => [g.id, g]),
);

export function gateDefinition(id: string): GateDefinition | undefined {
  return GATE_BY_ID.get(id);
}

/**
 * Resolve every gate criterion against the canonical requirement registry.
 *
 * A definition naming a requirement the programme does not contain is a
 * traceability failure, not a licence to accept the gate: without this the
 * gates could quietly certify work that was never registered anywhere.
 */
export function resolveGateRequirements(
  requirements: readonly Requirement[],
  definitions: readonly GateDefinition[] = ACCEPTANCE_GATE_DEFINITIONS,
): { missing: Array<{ gateId: string; requirementId: string }>; resolved: Map<string, string[]> } {
  const known = new Set(requirements.map((r) => r.id));
  const missing: Array<{ gateId: string; requirementId: string }> = [];
  const resolved = new Map<string, string[]>();
  for (const def of definitions) {
    const ok: string[] = [];
    for (const id of def.requirements) {
      if (known.has(id)) ok.push(id);
      else missing.push({ gateId: def.id, requirementId: id });
    }
    resolved.set(def.id, ok);
  }
  return { missing, resolved };
}

// ---------------------------------------------------------------------------
// Evidence fingerprint: what the evidence was actually taken against
// ---------------------------------------------------------------------------

export interface EvidenceFingerprint {
  sourceCommits: Record<string, string>;
  relevantSourceHashes: Record<string, string>;
  dependencyHashes: Record<string, string>;
  configurationHashes: Record<string, string>;
  schemaVersions: Record<string, number>;
  requirementRevision: string | null;
  acceptanceCriteriaRevision: string | null;
  testSuiteRevision: string | null;
  testEnvironmentRef: string | null;
  upstreamGateRevisions: Record<string, number>;
}

export type FingerprintField =
  | "sourceCommits" | "relevantSourceHashes" | "dependencyHashes"
  | "configurationHashes" | "schemaVersions" | "requirementRevision"
  | "acceptanceCriteriaRevision" | "testSuiteRevision" | "testEnvironmentRef"
  | "upstreamGateRevisions";

const FINGERPRINT_FIELDS: readonly FingerprintField[] = [
  "sourceCommits", "relevantSourceHashes", "dependencyHashes",
  "configurationHashes", "schemaVersions", "requirementRevision",
  "acceptanceCriteriaRevision", "testSuiteRevision", "testEnvironmentRef",
  "upstreamGateRevisions",
];

export function emptyFingerprint(): EvidenceFingerprint {
  return {
    sourceCommits: {},
    relevantSourceHashes: {},
    dependencyHashes: {},
    configurationHashes: {},
    schemaVersions: {},
    requirementRevision: null,
    acceptanceCriteriaRevision: null,
    testSuiteRevision: null,
    testEnvironmentRef: null,
    upstreamGateRevisions: {},
  };
}

/**
 * Decide whether a fingerprint's evidence still applies to the world.
 *
 * Deliberately asymmetric and conservative: any difference in any tracked
 * field means the evidence no longer describes the current baseline. Guessing
 * that a change is irrelevant is how stale evidence survives, and the cost of
 * being wrong here is a re-evaluation, not a false completion.
 */
export function fingerprintDifferences(
  taken: EvidenceFingerprint,
  current: EvidenceFingerprint,
): FingerprintField[] {
  const differs: FingerprintField[] = [];
  for (const field of FINGERPRINT_FIELDS) {
    const a = taken[field];
    const b = current[field];
    if (field === "sourceCommits" || field === "relevantSourceHashes"
      || field === "dependencyHashes" || field === "configurationHashes"
      || field === "schemaVersions" || field === "upstreamGateRevisions") {
      const ka = Object.keys(a as Record<string, unknown>).sort();
      const kb = Object.keys(b as Record<string, unknown>).sort();
      if (ka.length !== kb.length || ka.some((k, i) => k !== kb[i])) {
        differs.push(field);
      } else if (ka.some((k) => (a as Record<string, unknown>)[k] !== (b as Record<string, unknown>)[k])) {
        differs.push(field);
      }
    } else if (a !== b) {
      differs.push(field);
    }
  }
  return differs;
}

export function isEvidenceCurrent(
  taken: EvidenceFingerprint,
  current: EvidenceFingerprint,
): boolean {
  return fingerprintDifferences(taken, current).length === 0;
}

// ---------------------------------------------------------------------------
// Gate state, transitions, history
// ---------------------------------------------------------------------------

export interface CriterionOutcome {
  requirementId: string;
  result: CriterionResult;
  /** Required for NOT_APPLICABLE. */
  justification?: string;
  /** Required when a blocker prevented the test. */
  blockerRef?: string;
  evidenceRefs?: string[];
}

export interface GateTransition {
  transitionId: string;
  gateId: AcceptanceGateId;
  previousLifecycle: GateLifecycle;
  newLifecycle: GateLifecycle;
  previousDisposition: GateDisposition | null;
  newDisposition: GateDisposition | null;
  previousRevision: number;
  newRevision: number;
  trigger: string;
  reason: string;
  initiatedBy: string;
  evaluatedBy: string | null;
  sourceBaselineRef: string | null;
  evidenceFingerprintRef: string | null;
  supportingEvidenceRefs: string[];
  invalidatedEvidenceRefs: string[];
  affectedDependencyGates: AcceptanceGateId[];
  ownerApprovalRef: string | null;
  externalBlockerRef: string | null;
  timestamp: string;
  transitionRecordHash: string;
  /** Present when a transition was refused: the refusal is history too. */
  refusal?: { from: GateLifecycle; to: GateLifecycle; reason: string };
}

export interface GateState {
  gateId: AcceptanceGateId;
  lifecycle: GateLifecycle;
  /** Historical disposition. Does not count while lifecycle is STALE. */
  disposition: GateDisposition | null;
  revision: number;
  criteria: CriterionOutcome[];
  evidenceFingerprint: EvidenceFingerprint | null;
  transitions: GateTransition[];
  refusalCount: number;
}

export function initialGateState(gateId: AcceptanceGateId): GateState {
  return {
    gateId,
    lifecycle: "NOT_EVALUATED",
    disposition: null,
    revision: 0,
    criteria: [],
    evidenceFingerprint: null,
    transitions: [],
    refusalCount: 0,
  };
}

/**
 * Permitted lifecycle transitions and the condition each one carries.
 *
 * Everything absent from this table is refused. That is the point: the
 * default answer to "can this gate move?" is no.
 */
export const PERMITTED_LIFECYCLE_TRANSITIONS: Readonly<
  Record<GateLifecycle, readonly GateLifecycle[]>
> = {
  NOT_EVALUATED: ["IN_PROGRESS"],
  IN_PROGRESS: ["CLOSED", "STALE"],
  CLOSED: ["STALE", "IN_PROGRESS"],
  STALE: ["IN_PROGRESS"],
};

export type TransitionTrigger =
  | "EVALUATION_STARTED"
  | "EVALUATION_COMPLETED"
  | "BASELINE_CHANGED_DURING_EVALUATION"
  | "EVIDENCE_INVALIDATED"
  | "REEVALUATION_STARTED"
  | "GATE_REOPENED";

export interface TransitionRequest {
  gateId: AcceptanceGateId;
  to: GateLifecycle;
  trigger: TransitionTrigger;
  reason: string;
  initiatedBy: string;
  evaluatedBy?: string | null;
  disposition?: GateDisposition | null;
  criteria?: CriterionOutcome[];
  evidenceFingerprint?: EvidenceFingerprint | null;
  supportingEvidenceRefs?: string[];
  invalidatedEvidenceRefs?: string[];
  affectedDependencyGates?: AcceptanceGateId[];
  ownerApprovalRef?: string | null;
  externalBlockerRef?: string | null;
  timestamp: string;
  expectedRevision?: number;
}

export type TransitionOutcome =
  | { accepted: true; reason: string; state: GateState; transition: GateTransition }
  | { accepted: false; reason: string; state: GateState };

function hashRecord(value: unknown): string {
  const json = JSON.stringify(value, Object.keys(value as object).sort());
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < json.length; i += 1) {
    const c = json.charCodeAt(i);
    h1 = ((h1 ^ c) * 0x01000193) >>> 0;
    h2 = ((h2 + c) * 0x85ebca6b) >>> 0;
  }
  return `${h1.toString(16).padStart(8, "0")}${h2.toString(16).padStart(8, "0")}`;
}

export type RefusalReason =
  | "transition-not-permitted"
  | "closed-requires-evidence"
  | "pass-requires-evidence"
  | "blocked-requires-blocker-ref"
  | "owner-disposition-requires-approval"
  | "deferred-requires-approved-scope"
  | "not-applicable-requires-justification"
  | "mandatory-criterion-not-passing"
  | "criterion-not-applicable-unjustified"
  | "revision-conflict";

/**
 * Apply one lifecycle transition, or refuse it with a reason.
 *
 * A refusal is recorded on the gate rather than thrown away: "we tried to
 * promote this and were stopped" is exactly the audit trail a false
 * completion attempt leaves behind.
 */
export function transitionGate(
  current: GateState,
  request: TransitionRequest,
): TransitionOutcome {
  const permitted = PERMITTED_LIFECYCLE_TRANSITIONS[current.lifecycle];
  const recordRefusal = (reason: string): TransitionOutcome => {
    const stamp: GateTransition = {
      transitionId: `${current.gateId}-r${current.revision}-refuse-${current.refusalCount + 1}`,
      gateId: current.gateId,
      previousLifecycle: current.lifecycle,
      newLifecycle: current.lifecycle,
      previousDisposition: current.disposition,
      newDisposition: current.disposition,
      previousRevision: current.revision,
      newRevision: current.revision,
      trigger: request.trigger,
      reason,
      initiatedBy: request.initiatedBy,
      evaluatedBy: request.evaluatedBy ?? null,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: request.supportingEvidenceRefs ?? [],
      invalidatedEvidenceRefs: request.invalidatedEvidenceRefs ?? [],
      affectedDependencyGates: request.affectedDependencyGates ?? [],
      ownerApprovalRef: request.ownerApprovalRef ?? null,
      externalBlockerRef: request.externalBlockerRef ?? null,
      timestamp: request.timestamp,
      transitionRecordHash: "",
      refusal: { from: current.lifecycle, to: request.to, reason },
    };
    stamp.transitionRecordHash = hashRecord({ ...stamp, transitionRecordHash: "" });
    return {
      accepted: false,
      reason,
      state: { ...current, refusalCount: current.refusalCount + 1, transitions: [...current.transitions, stamp] },
    };
  };

  if (request.expectedRevision !== undefined && request.expectedRevision !== current.revision) {
    return recordRefusal("revision-conflict");
  }
  if (!permitted.includes(request.to)) {
    return recordRefusal("transition-not-permitted");
  }

  const nextDisposition = request.disposition ?? current.disposition;
  const criteria = request.criteria ?? current.criteria;

  if (request.to === "CLOSED") {
    const blocking = dispositionProblems(
      request.gateId,
      nextDisposition,
      criteria,
      request,
    );
    if (blocking.length > 0) {
      return recordRefusal(blocking[0]);
    }
  }

  const stamp: GateTransition = {
    transitionId: `${current.gateId}-r${current.revision + 1}`,
    gateId: request.gateId,
    previousLifecycle: current.lifecycle,
    newLifecycle: request.to,
    previousDisposition: current.disposition,
    newDisposition: request.to === "CLOSED" ? nextDisposition : current.disposition,
    previousRevision: current.revision,
    newRevision: current.revision + 1,
    trigger: request.trigger,
    reason: request.reason,
    initiatedBy: request.initiatedBy,
    evaluatedBy: request.evaluatedBy ?? null,
    sourceBaselineRef: null,
    evidenceFingerprintRef: null,
    supportingEvidenceRefs: request.supportingEvidenceRefs ?? [],
    invalidatedEvidenceRefs: request.invalidatedEvidenceRefs ?? [],
    affectedDependencyGates: request.affectedDependencyGates ?? [],
    ownerApprovalRef: request.ownerApprovalRef ?? null,
    externalBlockerRef: request.externalBlockerRef ?? null,
    timestamp: request.timestamp,
    transitionRecordHash: "",
  };
  stamp.transitionRecordHash = hashRecord({ ...stamp, transitionRecordHash: "" });

  return {
    accepted: true,
    reason: "accepted",
    transition: stamp,
    state: {
      ...current,
      lifecycle: request.to,
      disposition: request.to === "CLOSED" ? nextDisposition : current.disposition,
      revision: current.revision + 1,
      criteria,
      evidenceFingerprint:
        request.evidenceFingerprint === undefined
          ? current.evidenceFingerprint
          : request.evidenceFingerprint,
      transitions: [...current.transitions, stamp],
    },
  };
}

/**
 * Why a gate may not be closed with this disposition. Empty means permitted.
 *
 * Every rule here exists because the corresponding false completion is
 * possible without it: an untested criterion counted as passing, a blocker
 * counted as a decision, a scope deferral standing in for an implementation.
 */
export function dispositionProblems(
  gateId: AcceptanceGateId,
  disposition: GateDisposition | null,
  criteria: readonly CriterionOutcome[],
  request: Partial<TransitionRequest> = {},
): RefusalReason[] {
  const problems: RefusalReason[] = [];
  if (disposition === null) {
    problems.push("closed-requires-evidence");
    return problems;
  }
  if (disposition === "PASS") {
    if ((request.supportingEvidenceRefs ?? []).length === 0) problems.push("pass-requires-evidence");
    for (const c of criteria) {
      if (c.result === "NOT_APPLICABLE" && !c.justification?.trim()) {
        problems.push("not-applicable-requires-justification");
      }
      if (c.result !== "PASS" && c.result !== "NOT_APPLICABLE") {
        problems.push("mandatory-criterion-not-passing");
      }
    }
    if (problems.length === 0) {
      const def = gateDefinition(gateId);
      if (def) {
        for (const reqId of def.requirements) {
          const outcome = criteria.find((c) => c.requirementId === reqId);
          if (!outcome) problems.push("mandatory-criterion-not-passing");
        }
      }
    }
  }
  if (disposition === "BLOCKED_OWNER" || disposition === "BLOCKED_EXTERNAL") {
    if (!request.externalBlockerRef && !request.ownerApprovalRef) {
      problems.push("blocked-requires-blocker-ref");
    }
  }
  if (disposition === "DEFERRED_BY_APPROVED_SCOPE" && !request.ownerApprovalRef) {
    problems.push("deferred-requires-approved-scope");
  }
  return [...new Set(problems)] as RefusalReason[];
}

// ---------------------------------------------------------------------------
// Deriving a disposition from an actual evaluation
// ---------------------------------------------------------------------------

/**
 * Derived disposition. Every variant carries `missing` and `reason` so the
 * shape is total: callers read one shape, and no consumer has to narrow to
 * find out why a gate did not pass.
 */
export type DerivedOutcome =
  | { disposition: "PASS"; criteria: CriterionOutcome[]; basis: "all-mandatory-criteria-pass"; missing: string[] }
  | { disposition: "FAIL"; criteria: CriterionOutcome[]; basis: "criterion-failed"; failed: string[]; missing: string[] }
  | { disposition: "BLOCKED_OWNER"; criteria: CriterionOutcome[]; basis: "owner-dependency"; missing: string[] }
  | { disposition: "BLOCKED_EXTERNAL"; criteria: CriterionOutcome[]; basis: "external-dependency"; missing: string[] }
  | { disposition: null; criteria: CriterionOutcome[]; basis: "not-evaluated"; missing: string[] };

export interface EvaluationInput {
  gateId: AcceptanceGateId;
  /** Per-criterion results as actually observed. Nothing is inferred. */
  criteria: CriterionOutcome[];
  provided: readonly EvidenceProvided[];
  /** Blockers actually established, with the artifact that establishes them. */
  blockers?: Array<{ kind: "OWNER" | "EXTERNAL"; ref: string; requirementIds: string[] }>;
  fingerprint?: EvidenceFingerprint;
}

/**
 * Derive a gate's disposition from an evaluation. Pure and total.
 *
 * Order of precedence is deliberate and load-bearing: a demonstrated failure
 * outranks a blocker, because a blocker must not be usable to hide a defect
 * that has already been shown. NOT_EVALUATED wins over nothing at all, and an
 * untested criterion is never quietly upgraded.
 */
export function deriveDisposition(input: EvaluationInput): DerivedOutcome {
  const def = gateDefinition(input.gateId);
  const mandatory = new Set(def?.requirements ?? []);
  const evaluated = new Set(input.criteria.map((c) => c.requirementId));
  const missing = [...mandatory].filter((id) => !evaluated.has(id)).sort();

  const failed = input.criteria
    .filter((c) => c.result === "FAIL")
    .map((c) => c.requirementId)
    .sort();
  if (failed.length > 0) {
    return { disposition: "FAIL", criteria: input.criteria, basis: "criterion-failed", failed, missing: [] };
  }

  const blockers = input.blockers ?? [];
  const ownerBlocker = blockers.find((b) => b.kind === "OWNER");
  if (ownerBlocker) {
    return { disposition: "BLOCKED_OWNER", criteria: input.criteria, basis: "owner-dependency", missing: [] };
  }
  const externalBlocker = blockers.find((b) => b.kind === "EXTERNAL");
  if (externalBlocker) {
    return { disposition: "BLOCKED_EXTERNAL", criteria: input.criteria, basis: "external-dependency", missing: [] };
  }

  // A criterion that was never resolved cannot support a PASS, and a
  // criterion-level blocker is not the same as a gate-level one: the test
  // could not be run, so there is no evidence either way. Both stop here.
  const untested = input.criteria
    .filter((c) => c.result === "NOT_TESTED" || c.result === "IN_PROGRESS"
      || c.result === "BLOCKED")
    .map((c) => c.requirementId)
    .sort();
  if (missing.length > 0 || untested.length > 0) {
    return {
      disposition: null,
      criteria: input.criteria,
      basis: "not-evaluated",
      missing: [...missing, ...untested].sort(),
    };
  }

  const unjustified = input.criteria.filter(
    (c) => c.result === "NOT_APPLICABLE" && !c.justification?.trim(),
  );
  if (unjustified.length > 0) {
    return {
      disposition: null,
      criteria: input.criteria,
      basis: "not-evaluated",
      missing: unjustified.map((c) => c.requirementId).sort(),
    };
  }

  const gate = def ? checkEvidenceGate(def.evidence, input.provided) : null;
  if (gate && gate.verdict !== "COMPLETE") {
    return {
      disposition: null,
      criteria: input.criteria,
      basis: "not-evaluated",
      missing: [...gate.missing, ...gate.failed].sort(),
    };
  }

  return { disposition: "PASS", criteria: input.criteria, basis: "all-mandatory-criteria-pass", missing: [] };
}

// ---------------------------------------------------------------------------
// Concurrency: a superseded evaluation cannot overwrite a newer result
// ---------------------------------------------------------------------------

export type PublishOutcome =
  | { published: true; reason: string; state: GateState; transition: GateTransition }
  | { published: false; reason: "revision-conflict" | "stale-evaluation"; state: GateState };

/**
 * Publish a completed evaluation, if and only if it is still the newest one.
 *
 * LAST RESULT TO FINISH IS NOT CURRENT AUTHORITATIVE RESULT. The candidate
 * carries the baseline it started against; if the gate has moved on, or the
 * world has, the result is kept as history and refused as current.
 */
export function publishEvaluation(
  current: GateState,
  currentFingerprint: EvidenceFingerprint,
  input: EvaluationInput,
  fingerprintAtStart: EvidenceFingerprint,
  actor: string,
  timestamp: string,
  /**
   * The gate revision this evaluation began against. Supplying a revision
   * other than the gate's current one is how a superseded evaluator is
   * detected; the fingerprint comparison alone cannot see a concurrent
   * evaluation that finished against the same baseline.
   */
  startedAtRevision?: number,
): PublishOutcome {
  const startedRev = startedAtRevision ?? current.revision;

  if (startedRev !== current.revision) {
    const refusal: GateTransition = {
      transitionId: `${current.gateId}-r${startedRev}-superseded`,
      gateId: current.gateId,
      previousLifecycle: current.lifecycle,
      newLifecycle: current.lifecycle,
      previousDisposition: current.disposition,
      newDisposition: current.disposition,
      previousRevision: startedRev,
      newRevision: current.revision,
      trigger: "EVALUATION_COMPLETED",
      reason: "a newer evaluation has already advanced this gate",
      initiatedBy: actor,
      evaluatedBy: actor,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: input.provided.map((p) => p.ref),
      invalidatedEvidenceRefs: [],
      affectedDependencyGates: [],
      ownerApprovalRef: null,
      externalBlockerRef: null,
      timestamp,
      transitionRecordHash: "",
      refusal: { from: current.lifecycle, to: current.lifecycle, reason: "revision-conflict" },
    };
    refusal.transitionRecordHash = hashRecord({ ...refusal, transitionRecordHash: "" });
    return {
      published: false,
      reason: "revision-conflict",
      state: {
        ...current,
        refusalCount: current.refusalCount + 1,
        transitions: [...current.transitions, refusal],
      },
    };
  }

  const derived = deriveDisposition(input);

  if (!isEvidenceCurrent(fingerprintAtStart, currentFingerprint)) {
    const refusal: GateTransition = {
      transitionId: `${current.gateId}-r${startedRev}-stale-eval`,
      gateId: current.gateId,
      previousLifecycle: current.lifecycle,
      newLifecycle: current.lifecycle,
      previousDisposition: current.disposition,
      newDisposition: current.disposition,
      previousRevision: startedRev,
      newRevision: startedRev,
      trigger: "EVALUATION_COMPLETED",
      reason: "evaluation finished against a baseline that no longer holds",
      initiatedBy: actor,
      evaluatedBy: actor,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: input.provided.map((p) => p.ref),
      invalidatedEvidenceRefs: [],
      affectedDependencyGates: [],
      ownerApprovalRef: null,
      externalBlockerRef: null,
      timestamp,
      transitionRecordHash: "",
      refusal: { from: current.lifecycle, to: current.lifecycle, reason: "stale-evaluation" },
    };
    refusal.transitionRecordHash = hashRecord({ ...refusal, transitionRecordHash: "" });
    return {
      published: false,
      reason: "stale-evaluation",
      state: { ...current, refusalCount: current.refusalCount + 1, transitions: [...current.transitions, refusal] },
    };
  }

  if (derived.disposition === null) {
    const stamp: GateTransition = {
      transitionId: `${current.gateId}-r${startedRev + 1}`,
      gateId: current.gateId,
      previousLifecycle: current.lifecycle,
      newLifecycle: "IN_PROGRESS",
      previousDisposition: current.disposition,
      newDisposition: current.disposition,
      previousRevision: startedRev,
      newRevision: startedRev + 1,
      trigger: "EVALUATION_COMPLETED",
      reason: `evaluation incomplete: ${derived.missing.join(", ") || "unspecified"}`,
      initiatedBy: actor,
      evaluatedBy: actor,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: input.provided.map((p) => p.ref),
      invalidatedEvidenceRefs: [],
      affectedDependencyGates: [],
      ownerApprovalRef: null,
      externalBlockerRef: null,
      timestamp,
      transitionRecordHash: "",
    };
    stamp.transitionRecordHash = hashRecord({ ...stamp, transitionRecordHash: "" });
    return {
      published: true,
      reason: "published",
      transition: stamp,
      state: {
        ...current,
        lifecycle: "IN_PROGRESS",
        revision: startedRev + 1,
        criteria: input.criteria,
        evidenceFingerprint: input.fingerprint ?? currentFingerprint,
        transitions: [...current.transitions, stamp],
      },
    };
  }

  const outcome = transitionGate(
    { ...current, lifecycle: "IN_PROGRESS" },
    {
      gateId: current.gateId,
      to: "CLOSED",
      trigger: "EVALUATION_COMPLETED",
      reason: `evaluation completed: ${derived.basis}`,
      initiatedBy: actor,
      evaluatedBy: actor,
      disposition: derived.disposition,
      criteria: input.criteria,
      evidenceFingerprint: input.fingerprint ?? currentFingerprint,
      supportingEvidenceRefs: input.provided.map((p) => p.ref),
      externalBlockerRef: input.blockers?.[0]?.ref ?? null,
      timestamp,
      expectedRevision: startedRev,
    },
  );
  if (!outcome.accepted) {
    const refusal: GateTransition = {
      transitionId: `${current.gateId}-r${startedRev}-publish-refused`,
      gateId: current.gateId,
      previousLifecycle: current.lifecycle,
      newLifecycle: current.lifecycle,
      previousDisposition: current.disposition,
      newDisposition: current.disposition,
      previousRevision: startedRev,
      newRevision: startedRev,
      trigger: "EVALUATION_COMPLETED",
      reason: outcome.reason,
      initiatedBy: actor,
      evaluatedBy: actor,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: input.provided.map((p) => p.ref),
      invalidatedEvidenceRefs: [],
      affectedDependencyGates: [],
      ownerApprovalRef: null,
      externalBlockerRef: null,
      timestamp,
      transitionRecordHash: "",
      refusal: { from: current.lifecycle, to: current.lifecycle, reason: outcome.reason },
    };
    refusal.transitionRecordHash = hashRecord({ ...refusal, transitionRecordHash: "" });
    return {
      published: false,
      reason: "revision-conflict",
      state: { ...current, refusalCount: current.refusalCount + 1, transitions: [...current.transitions, refusal] },
    };
  }
  return { published: true, reason: "published", state: outcome.state, transition: outcome.transition };
}

// ---------------------------------------------------------------------------
// Dependency-aware invalidation, derived from the canonical programme
// ---------------------------------------------------------------------------

/**
 * Build gate -> gate edges from the canonical requirement graph.
 *
 * Derived, never hand-listed: if requirement A depends on requirement B, and A
 * and B sit under different gates, a change to B's evidence puts A's gate in
 * question. The prompt's example arrows are exactly this rule; writing them
 * down separately would be a second dependency model that can disagree.
 */
export function gateDependencyIndex(
  requirements: readonly Requirement[],
  definitions: readonly GateDefinition[] = ACCEPTANCE_GATE_DEFINITIONS,
): Map<AcceptanceGateId, AcceptanceGateId[]> {
  const reqToGate = new Map<string, AcceptanceGateId>();
  for (const def of definitions) {
    for (const id of def.requirements) reqToGate.set(id, def.id);
  }
  const out = new Map<AcceptanceGateId, Set<AcceptanceGateId>>();
  for (const def of definitions) out.set(def.id, new Set());
  for (const req of requirements) {
    const gate = reqToGate.get(req.id);
    if (!gate) continue;
    for (const dep of req.depends_on ?? []) {
      const depGate = reqToGate.get(dep);
      if (depGate && depGate !== gate) out.get(gate)!.add(depGate);
    }
  }
  return new Map(
    [...out.entries()].map(([k, v]) => [k, [...v].sort() as AcceptanceGateId[]]),
  );
}

export interface InvalidationResult {
  states: GateState[];
  staled: AcceptanceGateId[];
  /** Gates whose dependency was staled, even though they were never CLOSED. */
  affected: AcceptanceGateId[];
}

/**
 * Mark gates STALE whose evidence no longer applies, then walk the dependency
 * graph so downstream gates stop being treated as current either.
 *
 * A PASS whose evidence is known invalid is not preserved. That is the whole
 * point: keeping it would let a change silently detach from its proof.
 */
export function invalidateGates(
  states: readonly GateState[],
  changedRequirementIds: readonly string[],
  dependencyIndex: ReadonlyMap<AcceptanceGateId, AcceptanceGateId[]>,
  currentFingerprints: ReadonlyMap<AcceptanceGateId, EvidenceFingerprint>,
  reason: string,
  actor: string,
  timestamp: string,
  definitions: readonly GateDefinition[] = ACCEPTANCE_GATE_DEFINITIONS,
): InvalidationResult {
  const defById = new Map(definitions.map((d) => [d.id, d]));
  const directly = new Set<AcceptanceGateId>();
  for (const state of states) {
    const def = defById.get(state.gateId);
    if (!def) continue;
    if (def.requirements.some((r) => changedRequirementIds.includes(r))) {
      directly.add(state.gateId);
    }
  }

  const staled = new Set<AcceptanceGateId>(directly);
  const queue = [...directly];
  while (queue.length > 0) {
    const gateId = queue.shift()!;
    for (const dependent of dependentGates(dependencyIndex, gateId)) {
      if (!staled.has(dependent)) {
        staled.add(dependent);
        queue.push(dependent);
      }
    }
  }

  const out: GateState[] = [];
  for (const state of states) {
    if (!staled.has(state.gateId) || state.lifecycle === "NOT_EVALUATED") {
      out.push(state);
      continue;
    }
    const currentFp = currentFingerprints.get(state.gateId) ?? null;
    if (currentFp && state.evidenceFingerprint
      && isEvidenceCurrent(state.evidenceFingerprint, currentFp)
      && !directly.has(state.gateId)) {
      out.push(state);
      continue;
    }
    const stamp: GateTransition = {
      transitionId: `${state.gateId}-r${state.revision + 1}-stale`,
      gateId: state.gateId,
      previousLifecycle: state.lifecycle,
      newLifecycle: "STALE",
      previousDisposition: state.disposition,
      newDisposition: state.disposition,
      previousRevision: state.revision,
      newRevision: state.revision + 1,
      trigger: "EVIDENCE_INVALIDATED",
      reason,
      initiatedBy: actor,
      evaluatedBy: null,
      sourceBaselineRef: null,
      evidenceFingerprintRef: null,
      supportingEvidenceRefs: [],
      invalidatedEvidenceRefs: state.evidenceFingerprint
        ? Object.values(state.evidenceFingerprint.sourceCommits)
        : [],
      affectedDependencyGates: directly.has(state.gateId)
        ? dependentGates(dependencyIndex, state.gateId)
        : [],
      ownerApprovalRef: null,
      externalBlockerRef: null,
      timestamp,
      transitionRecordHash: "",
    };
    stamp.transitionRecordHash = hashRecord({ ...stamp, transitionRecordHash: "" });
    out.push({
      ...state,
      lifecycle: "STALE",
      revision: state.revision + 1,
      transitions: [...state.transitions, stamp],
    });
  }
  return {
    states: out,
    staled: [...staled].sort() as AcceptanceGateId[],
    affected: [...staled].filter((g) => !directly.has(g)).sort() as AcceptanceGateId[],
  };
}

function dependentGates(
  index: ReadonlyMap<AcceptanceGateId, AcceptanceGateId[]>,
  gateId: AcceptanceGateId,
): AcceptanceGateId[] {
  const out: AcceptanceGateId[] = [];
  for (const [dependent, deps] of index) {
    if (deps.includes(gateId)) out.push(dependent);
  }
  return out.sort();
}

// ---------------------------------------------------------------------------
// Stage and programme derivation
// ---------------------------------------------------------------------------

export type StageStatus = "PASS" | "FAIL" | "BLOCKED" | "IN_PROGRESS" | "STALE";

/**
 * A stage passes only when its mandatory gates are CURRENTLY PASS.
 *
 * Note what is not enough: CLOSED is not PASS, a historical PASS under STALE
 * is not a current PASS, and a count of closed gates is not a verdict.
 */
export function deriveStageStatus(
  states: readonly GateState[],
  mandatory: readonly AcceptanceGateId[],
  scope: readonly AcceptanceGateId[] = [],
): StageStatus {
  const byId = new Map(states.map((s) => [s.gateId, s]));
  const inScope = (id: AcceptanceGateId) => scope.length === 0 || scope.includes(id);
  let sawStale = false;
  let sawBlocked = false;
  for (const id of mandatory) {
    const s = byId.get(id);
    if (!s) return "IN_PROGRESS";
    if (s.lifecycle === "STALE") {
      sawStale = true;
      continue;
    }
    if (s.disposition === "FAIL") return "FAIL";
    if (s.disposition === "BLOCKED_OWNER" || s.disposition === "BLOCKED_EXTERNAL") {
      sawBlocked = true;
      continue;
    }
    if (s.lifecycle === "CLOSED" && s.disposition === "PASS") continue;
    if (s.lifecycle === "CLOSED" && s.disposition === "DEFERRED_BY_APPROVED_SCOPE"
      && !inScope(id)) {
      continue;
    }
    if (s.lifecycle === "CLOSED" && s.disposition === "NOT_APPLICABLE" && !inScope(id)) {
      continue;
    }
    return "IN_PROGRESS";
  }
  if (sawStale) return "STALE";
  if (sawBlocked) return "BLOCKED";
  return "PASS";
}

export interface ProgrammeAcceptance {
  programme: "AETHERIUS_GENESIS_CORE";
  releaseScopeRef: string | null;
  gates: Record<string, GateLifecycle | null>;
  currentPassing: AcceptanceGateId[];
  blockingIssues: string[];
  /** Gates excluded by approved scope. Visible, but not blocking. */
  outOfScopeDispositions: string[];
  outstandingOwnerDecisions: string[];
  /** Never derived from counts. Only ever true with an explicit owner approval. */
  machineComplete: boolean;
  technicallyQualified: boolean;
  ownerPublicationAuthorized: boolean;
  nextRequiredAction: string | null;
}

export interface DeriveProgrammeInput {
  states: readonly GateState[];
  mandatoryGates: readonly AcceptanceGateId[];
  releaseScope?: readonly AcceptanceGateId[];
  releaseScopeRef?: string | null;
  /** The only input that can ever authorize publication. Absent means false. */
  ownerPublicationApprovalRef?: string | null;
  unsupportedCompleteClaims?: readonly string[];
}

/**
 * Derive the programme-level acceptance manifest from current gate states.
 *
 * machineComplete is a conjunction of per-gate conditions, not a tally: it is
 * true only when every mandatory gate is CLOSED/PASS against current evidence.
 * technicallyQualified additionally requires that nothing is blocked, which is
 * the state BUILD70 calls CORE TECHNICALLY QUALIFIED - OWNER-GATED.
 */
export function deriveProgrammeAcceptance(input: DeriveProgrammeInput): ProgrammeAcceptance {
  const byId = new Map(input.states.map((s) => [s.gateId, s]));
  const gates: Record<string, GateLifecycle | null> = {};
  const blockingIssues: string[] = [];
  const outOfScopeDispositions: string[] = [];
  const outstandingOwnerDecisions: string[] = [];
  const currentPassing: AcceptanceGateId[] = [];

  for (const id of input.mandatoryGates) {
    const s = byId.get(id);
    gates[id] = s ? s.lifecycle : null;
    if (!s) {
      blockingIssues.push(`${id}: no gate state exists`);
      continue;
    }
    if (s.lifecycle === "CLOSED" && s.disposition === "PASS") {
      currentPassing.push(id);
      continue;
    }
    if (s.lifecycle === "STALE") {
      blockingIssues.push(`${id}: evidence is stale; reevaluation required before completion counts`);
      continue;
    }
    if (s.disposition === "FAIL") {
      blockingIssues.push(`${id}: FAIL is unresolved`);
      continue;
    }
    if (s.disposition === "BLOCKED_OWNER") {
      blockingIssues.push(`${id}: BLOCKED_OWNER`);
      outstandingOwnerDecisions.push(`${id}: owner decision required`);
      continue;
    }
    if (s.disposition === "BLOCKED_EXTERNAL") {
      blockingIssues.push(`${id}: BLOCKED_EXTERNAL`);
      continue;
    }
    const inScope = !input.releaseScope || input.releaseScope.includes(id);
    if (s.disposition === "DEFERRED_BY_APPROVED_SCOPE") {
      if (inScope) {
        blockingIssues.push(`${id}: deferred by approved scope but still inside the release scope`);
      } else {
        outOfScopeDispositions.push(`${id}: deferred by approved scope, outside the release scope`);
      }
      continue;
    }
    if (s.disposition === "NOT_APPLICABLE") {
      if (inScope) {
        blockingIssues.push(`${id}: NOT_APPLICABLE but still inside the release scope`);
      } else {
        outOfScopeDispositions.push(`${id}: NOT_APPLICABLE, outside the release scope`);
      }
      continue;
    }
    blockingIssues.push(`${id}: ${s.lifecycle}, no current disposition`);
  }

  for (const claim of input.unsupportedCompleteClaims ?? []) {
    blockingIssues.push(`unsupported COMPLETE claim: ${claim}`);
  }

  const machineComplete =
    blockingIssues.length === 0
    && currentPassing.length === input.mandatoryGates.length;

  const hasBlocker = blockingIssues.some((b) => b.includes("BLOCKED"));
  const technicallyQualified =
    machineComplete || (currentPassing.length === input.mandatoryGates.length && hasBlocker);

  const ownerPublicationAuthorized =
    Boolean(input.ownerPublicationApprovalRef) && machineComplete;

  let nextRequiredAction: string | null = null;
  if (!machineComplete) {
    const first = input.mandatoryGates.find((id) => !currentPassing.includes(id));
    nextRequiredAction = first
      ? `evaluate ${first} against the current baseline`
      : "resolve the blocking issues above";
  } else if (!ownerPublicationAuthorized) {
    nextRequiredAction = "publication requires explicit owner authorization; none is recorded";
  }

  return {
    programme: "AETHERIUS_GENESIS_CORE",
    releaseScopeRef: input.releaseScopeRef ?? null,
    gates,
    currentPassing,
    blockingIssues: [...blockingIssues].sort(),
    outOfScopeDispositions: [...outOfScopeDispositions].sort(),
    outstandingOwnerDecisions: [...new Set(outstandingOwnerDecisions)].sort(),
    machineComplete,
    technicallyQualified,
    ownerPublicationAuthorized,
    nextRequiredAction,
  };
}

/** Gates that are not currently a valid PASS. A list to work through, never a score. */
export function gatesNeedingAttention(states: readonly GateState[]): GateState[] {
  return states
    .filter((s) => !(s.lifecycle === "CLOSED" && s.disposition === "PASS"))
    .sort((a, b) => (a.gateId < b.gateId ? -1 : 1));
}