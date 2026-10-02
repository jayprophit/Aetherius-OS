/**
 * BUILD70: acceptance-gate state through the canonical owned-state layer.
 *
 * Gate state is programme state, so it is persisted the way every other
 * Aetherius-owned state is: one StateEnvelope, integrity-hashed, atomically
 * replaced, with optimistic version checking. That is what makes two
 * concurrent evaluators safe -- the store refuses a stale writer instead of
 * letting whichever process wrote last win.
 *
 * Boundaries:
 * - The derived programme acceptance manifest is COMPUTED on read, never
 *   stored. A stored manifest could disagree with the gate states it claims
 *   to summarise, and then that disagreement would be the truth.
 * - A missing gate record is reported as missing, not quietly materialised as
 *   NOT_EVALUATED-and-therefore-fine. Absent evidence is not a passing gate.
 * - This layer persists and reports. It approves nothing and publishes
 *   nothing.
 */

import {
  ACCEPTANCE_GATE_IDS,
  deriveProgrammeAcceptance,
  gateDependencyIndex,
  gatesNeedingAttention,
  initialGateState,
  invalidateGates,
  isEvidenceCurrent,
  publishEvaluation,
  transitionGate,
} from "../programme/acceptanceGate";
import type {
  AcceptanceGateId,
  EvaluationInput,
  EvidenceFingerprint,
  GateState,
  ProgrammeAcceptance,
  TransitionOutcome,
} from "../programme/acceptanceGate";
import type { Requirement } from "../programme/types";
import { StateError } from "./types";
import type { StateEnvelope } from "./types";
import type { OwnedStore } from "./store";

export const ACCEPTANCE_STATE_ID = "acceptance-gates";
export const ACCEPTANCE_STATE_KIND = "acceptance";
export const ACCEPTANCE_SCHEMA_VERSION = 1;

export interface AcceptanceStatePayload {
  gates: GateState[];
}

export interface AcceptanceRecord extends StateEnvelope<AcceptanceStatePayload> {
  payload: AcceptanceStatePayload;
}

export interface AcceptanceLoad {
  record: AcceptanceRecord | null;
  gates: GateState[];
  /** Gates with no record at all. Distinct from NOT_EVALUATED. */
  absent: AcceptanceGateId[];
  storeRevision: number;
}

function emptyPayload(): AcceptanceStatePayload {
  return { gates: ACCEPTANCE_GATE_IDS.map((id) => initialGateState(id)) };
}

export function seedAcceptanceRecord(now: () => string): AcceptanceRecord {
  const ts = now();
  return {
    id: ACCEPTANCE_STATE_ID,
    kind: ACCEPTANCE_STATE_KIND,
    schemaVersion: ACCEPTANCE_SCHEMA_VERSION,
    recordVersion: 1,
    createdAt: ts,
    updatedAt: ts,
    owner: "aetherius-os",
    provenance: "BUILD70 acceptance-gate contract",
    sensitivity: "SYSTEM",
    integrity: "",
    payload: emptyPayload(),
  };
}

/**
 * Read gate state. A missing record yields every gate NOT_EVALUATED and the
 * full list of absent ids, so the caller can tell "nothing has been evaluated"
 * from "this one gate has no record".
 */
export function loadAcceptanceState(store: OwnedStore): AcceptanceLoad {
  if (!store.exists(ACCEPTANCE_STATE_ID)) {
    const seed = seedAcceptanceRecord(() => new Date(0).toISOString());
    return {
      record: null,
      gates: seed.payload.gates,
      absent: [...ACCEPTANCE_GATE_IDS],
      storeRevision: 0,
    };
  }
  const record = store.load<AcceptanceStatePayload>(ACCEPTANCE_STATE_ID) as AcceptanceRecord;
  const byId = new Map(record.payload.gates.map((g) => [g.gateId, g]));
  const absent = ACCEPTANCE_GATE_IDS.filter((id) => !byId.has(id));
  const gates = ACCEPTANCE_GATE_IDS.map(
    (id) => byId.get(id) ?? initialGateState(id),
  );
  return { record, gates, absent, storeRevision: record.recordVersion };
}

export interface SaveGateOptions {
  /** Required: without it a concurrent evaluator could silently overwrite. */
  expectedRecordVersion: number;
  actor: string;
  source: string;
  now?: () => string;
}

/**
 * Persist gate state through the owned store.
 *
 * The caller must state the record version it read. A mismatch raises rather
 * than merging, because two evaluators disagreeing about a gate's disposition
 * is a fact worth surfacing, not something to average away.
 */
export function saveAcceptanceState(
  store: OwnedStore,
  gates: readonly GateState[],
  options: SaveGateOptions,
): AcceptanceRecord {
  const now = options.now ?? (() => new Date().toISOString());
  const base = store.exists(ACCEPTANCE_STATE_ID)
    ? (store.load<AcceptanceStatePayload>(ACCEPTANCE_STATE_ID) as AcceptanceRecord)
    : seedAcceptanceRecord(now);
  const stamped: AcceptanceRecord = {
    ...base,
    recordVersion: base.recordVersion + 1,
    payload: { gates: [...gates] },
    causedBy: { actor: options.actor, source: options.source },
  };
  return store.save<AcceptanceStatePayload>(stamped, {
    expectedRecordVersion: options.expectedRecordVersion,
    causedBy: stamped.causedBy,
    now,
  });
}

/**
 * Run one legal lifecycle transition and persist it.
 *
 * Refusals are returned, not thrown: a refused promotion is information the
 * caller needs to see, and it is already recorded on the gate itself.
 */
export function applyTransitionAndSave(
  store: OwnedStore,
  request: Parameters<typeof transitionGate>[1],
  options: { actor: string; source: string; now?: () => string },
): { outcome: TransitionOutcome; record: AcceptanceRecord | null; persisted: boolean } {
  const load = loadAcceptanceState(store);
  const current = load.gates.find((g) => g.gateId === request.gateId);
  if (!current) {
    throw new StateError("STATE_NOT_FOUND", `no gate state for ${request.gateId}`);
  }
  const outcome = transitionGate(current, request);
  // A refusal still advances history, so it is persisted too.
  const next = load.gates.map((g) => (g.gateId === request.gateId ? outcome.state : g));
  const record = saveAcceptanceState(store, next, {
    expectedRecordVersion: load.storeRevision,
    actor: options.actor,
    source: options.source,
    now: options.now,
  });
  return { outcome, record, persisted: true };
}

export interface PublishOptions {
  actor: string;
  source: string;
  timestamp: string;
  fingerprintAtStart: EvidenceFingerprint;
  currentFingerprint: EvidenceFingerprint;
  /**
   * The GATE revision this evaluation began against. Distinct from the store's
   * recordVersion: the store guards the file, this guards the gate. Defaults
   * to the gate's current revision, which is what a single evaluator wants.
   */
  startedAtRevision?: number;
  now?: () => string;
}

/** Publish an evaluation for one gate through the canonical store. */
export function publishAndSave(
  store: OwnedStore,
  input: EvaluationInput,
  options: PublishOptions,
): { published: boolean; reason: string; record: AcceptanceRecord; gates: GateState[] } {
  const load = loadAcceptanceState(store);
  const current = load.gates.find((g) => g.gateId === input.gateId);
  if (!current) {
    throw new StateError("STATE_NOT_FOUND", `no gate state for ${input.gateId}`);
  }
  const out = publishEvaluation(
    current,
    options.currentFingerprint,
    input,
    options.fingerprintAtStart,
    options.actor,
    options.timestamp,
    options.startedAtRevision ?? current.revision,
  );
  const next = load.gates.map((g) => (g.gateId === input.gateId ? out.state : g));
  const record = saveAcceptanceState(store, next, {
    expectedRecordVersion: load.storeRevision,
    actor: options.actor,
    source: options.source,
    now: options.now,
  });
  return { published: out.published, reason: out.reason, record, gates: next };
}

export interface ProgrammeReport extends ProgrammeAcceptance {
  /** Gates with no persisted record. Absent is not the same as passing. */
  absentGates: AcceptanceGateId[];
  /** Gates whose recorded PASS is no longer supported by current evidence. */
  staleGates: AcceptanceGateId[];
  needsAttention: AcceptanceGateId[];
}

/**
 * Derive the programme acceptance manifest from stored gate state.
 *
 * Every claim is computed here from what the store actually holds. Two
 * additional honesty checks run on top of the contract's own derivation:
 * absent records are surfaced, and a gate whose fingerprint no longer matches
 * the current baseline is reported as stale even if its stored disposition
 * still says PASS.
 */
export function deriveProgrammeReport(input: {
  store: OwnedStore;
  requirements: readonly Requirement[];
  mandatoryGates?: readonly AcceptanceGateId[];
  releaseScope?: readonly AcceptanceGateId[];
  releaseScopeRef?: string | null;
  ownerPublicationApprovalRef?: string | null;
  unsupportedCompleteClaims?: readonly string[];
  currentFingerprints?: ReadonlyMap<AcceptanceGateId, EvidenceFingerprint>;
}): ProgrammeReport {
  const load = loadAcceptanceState(input.store);
  const mandatory = input.mandatoryGates ?? [...ACCEPTANCE_GATE_IDS];
  const base = deriveProgrammeAcceptance({
    states: load.gates,
    mandatoryGates: mandatory,
    releaseScope: input.releaseScope,
    releaseScopeRef: input.releaseScopeRef,
    ownerPublicationApprovalRef: input.ownerPublicationApprovalRef,
    unsupportedCompleteClaims: input.unsupportedCompleteClaims,
  });

  const staleGates = input.currentFingerprints
    ? load.gates
      .filter((g) => g.evidenceFingerprint
        && isEvidenceCurrent(g.evidenceFingerprint, input.currentFingerprints!.get(g.gateId)
          ?? g.evidenceFingerprint!) === false)
      .map((g) => g.gateId)
      .sort()
    : [];

  const staleSet = new Set(staleGates);
  const withStale: ProgrammeReport = {
    ...base,
    absentGates: [...load.absent].sort(),
    staleGates,
    needsAttention: gatesNeedingAttention(
      load.gates.filter((g) => !staleSet.has(g.gateId)),
    ).map((g) => g.gateId),
  };
  // A fingerprint that no longer matches must not leave machineComplete true,
  // even if every stored disposition happens to be PASS.
  if (staleGates.length > 0 && withStale.machineComplete) {
    return {
      ...withStale,
      machineComplete: false,
      nextRequiredAction: `re-evaluate ${staleGates[0]} against the current baseline`,
    };
  }
  return withStale;
}

/**
 * Mark gates stale whose requirements changed, then persist.
 *
 * Dependency propagation uses the requirement graph, so a change to an
 * upstream requirement cannot leave a downstream gate presenting current
 * evidence.
 */
export function invalidateAndSave(
  store: OwnedStore,
  changedRequirementIds: readonly string[],
  requirements: readonly Requirement[],
  reason: string,
  actor: string,
  timestamp: string,
  now?: () => string,
): { staled: AcceptanceGateId[]; affected: AcceptanceGateId[]; record: AcceptanceRecord } {
  const load = loadAcceptanceState(store);
  const index = gateDependencyIndex(requirements);
  const result = invalidateGates(
    load.gates,
    changedRequirementIds,
    index,
    new Map(),
    reason,
    actor,
    timestamp,
  );
  const record = saveAcceptanceState(store, result.states, {
    expectedRecordVersion: load.storeRevision,
    actor,
    source: "acceptance-invalidation",
    now,
  });
  return { staled: result.staled, affected: result.affected, record };
}

/** Human-readable rendering. No totals, no percentage, no global verdict. */
export function formatProgrammeReport(report: ProgrammeReport): string {
  const lines: string[] = [];
  lines.push(`PROGRAMME_ACCEPTANCE: ${report.programme}`);
  lines.push(`RELEASE_SCOPE_REF: ${report.releaseScopeRef ?? "none"}`);
  lines.push("");
  for (const [gateId, lifecycle] of Object.entries(report.gates).sort()) {
    const staled = report.staleGates.includes(gateId as AcceptanceGateId) ? " STALE" : "";
    const absent = report.absentGates.includes(gateId as AcceptanceGateId) ? " NO_RECORD" : "";
    lines.push(`  ${gateId}: ${lifecycle ?? "no state"}${staled}${absent}`);
  }
  lines.push("");
  lines.push(`MACHINE_COMPLETE: ${report.machineComplete}`);
  lines.push(`TECHNICALLY_QUALIFIED: ${report.technicallyQualified}`);
  lines.push(`OWNER_PUBLICATION_AUTHORIZED: ${report.ownerPublicationAuthorized}`);
  if (report.blockingIssues.length > 0) {
    lines.push("BLOCKING_ISSUES:");
    for (const b of report.blockingIssues) lines.push(`  - ${b}`);
  }
  if (report.outOfScopeDispositions.length > 0) {
    lines.push("OUT_OF_SCOPE_DISPOSITIONS:");
    for (const b of report.outOfScopeDispositions) lines.push(`  - ${b}`);
  }
  if (report.outstandingOwnerDecisions.length > 0) {
    lines.push("OUTSTANDING_OWNER_DECISIONS:");
    for (const b of report.outstandingOwnerDecisions) lines.push(`  - ${b}`);
  }
  if (report.nextRequiredAction) {
    lines.push(`NEXT_REQUIRED_ACTION: ${report.nextRequiredAction}`);
  }
  return lines.join("\n");
}