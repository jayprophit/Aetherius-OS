/**
 * BUILD70 §38: the gate evaluator's own invariants.
 *
 * Each test here corresponds to one line of the required implementation
 * checks. They are written adversarially: the interesting cases are the ones
 * where the honest answer is "refuse" and a careless implementation would
 * return PASS, a tally, or a silent success.
 */
import { describe, expect, it } from "vitest";

import {
  ACCEPTANCE_GATE_DEFINITIONS,
  ACCEPTANCE_GATE_IDS,
  CRITERION_RESULTS,
  GATE_DISPOSITIONS,
  GATE_LIFECYCLES,
  PERMITTED_LIFECYCLE_TRANSITIONS,
  deriveDisposition,
  deriveProgrammeAcceptance,
  deriveStageStatus,
  dispositionProblems,
  emptyFingerprint,
  fingerprintDifferences,
  gateDependencyIndex,
  gateDefinition,
  gatesNeedingAttention,
  initialGateState,
  invalidateGates,
  isEvidenceCurrent,
  publishEvaluation,
  resolveGateRequirements,
  transitionGate,
} from "./acceptanceGate";
import type {
  AcceptanceGateId,
  CriterionOutcome,
  EvaluationInput,
  EvidenceFingerprint,
  GateState,
} from "./acceptanceGate";
import type { EvidenceProvided } from "../workflows/evidenceGate";
import type { Requirement } from "./types";
import requirementsJson from "./requirements.json";

const requirements = requirementsJson.requirements as Requirement[];

const AT = "2026-10-02T00:00:00.000Z";

function allPassing(gateId: AcceptanceGateId): CriterionOutcome[] {
  const def = gateDefinition(gateId)!;
  return def.requirements.map((requirementId) => ({
    requirementId,
    result: "PASS" as const,
    evidenceRefs: [`test:${requirementId}`],
  }));
}

function providedFor(gateId: AcceptanceGateId): EvidenceProvided[] {
  const def = gateDefinition(gateId)!;
  return def.evidence.map((e) => ({
    key: e.key,
    kind: "test-report" as const,
    passed: true,
    ref: `artifact://${gateId}/${e.key}`,
  }));
}

function passingEvaluation(gateId: AcceptanceGateId): EvaluationInput {
  return {
    gateId,
    criteria: allPassing(gateId),
    provided: providedFor(gateId),
  };
}

/** Drive a gate from nothing to CLOSED/PASS through legal transitions only. */
function closedPassing(gateId: AcceptanceGateId, fingerprint: EvidenceFingerprint): GateState {
  let state = initialGateState(gateId);
  const started = transitionGate(state, {
    gateId, to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
    reason: "baseline recorded", initiatedBy: "evaluator", timestamp: AT,
  });
  expect(started.accepted).toBe(true);
  if (!started.accepted) throw new Error("unreachable");
  state = started.state;

  const published = publishEvaluation(
    state, fingerprint, passingEvaluation(gateId), fingerprint, "evaluator", AT,
  );
  expect(published.published).toBe(true);
  if (!published.published) throw new Error("unreachable");
  return published.state;
}

const BASE = (): EvidenceFingerprint => ({
  ...emptyFingerprint(),
  sourceCommits: { "agent-bridge": "abc1234" },
});

describe("canonical vocabulary", () => {
  it("defines exactly G00-G12", () => {
    expect([...ACCEPTANCE_GATE_IDS]).toEqual([
      "G00", "G01", "G02", "G03", "G04", "G05",
      "G06", "G07", "G08", "G09", "G10", "G11", "G12",
    ]);
    expect(ACCEPTANCE_GATE_DEFINITIONS.map((g) => g.id)).toEqual([...ACCEPTANCE_GATE_IDS]);
  });

  it("uses the exact lifecycle and disposition vocabularies", () => {
    expect([...GATE_LIFECYCLES]).toEqual(["NOT_EVALUATED", "IN_PROGRESS", "STALE", "CLOSED"]);
    expect([...GATE_DISPOSITIONS]).toEqual([
      "PASS", "FAIL", "BLOCKED_OWNER", "BLOCKED_EXTERNAL",
      "NOT_APPLICABLE", "DEFERRED_BY_APPROVED_SCOPE",
    ]);
    expect([...CRITERION_RESULTS]).toEqual([
      "NOT_TESTED", "IN_PROGRESS", "PASS", "FAIL", "BLOCKED", "NOT_APPLICABLE",
    ]);
  });

  it("resolves every gate criterion against the canonical requirement registry", () => {
    const { missing } = resolveGateRequirements(requirements);
    expect(missing).toEqual([]);
  });

  it("refuses a definition naming a requirement the programme does not contain", () => {
    const bogus = [{
      id: "G00" as AcceptanceGateId,
      title: "BOGUS",
      evidence: [],
      requirements: ["REQ-does-not-exist"],
    }];
    const { missing } = resolveGateRequirements(requirements, bogus);
    expect(missing).toEqual([
      { gateId: "G00", requirementId: "REQ-does-not-exist" },
    ]);
  });

  it("does not re-implement the evidence gate", async () => {
    const mod = await import("./acceptanceGate");
    expect(Object.keys(mod)).not.toContain("checkEvidenceGate");
    expect(Object.keys(mod)).not.toContain("GateResult");
  });

  it("carries no aggregate numeric figure", () => {
    const out = deriveProgrammeAcceptance({
      states: [initialGateState("G00")],
      mandatoryGates: ["G00"],
    });
    const numeric = Object.entries(out).filter(
      ([, v]) => typeof v === "number" || (typeof v === "string" && /^\d+(\.\d+)?\s*%?$/.test(v)),
    );
    expect(numeric).toEqual([]);
  });
});

describe("NOT_EVALUATED cannot become PASS without evidence", () => {
  it("refuses NOT_EVALUATED -> CLOSED outright", () => {
    const out = transitionGate(initialGateState("G00"), {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "trust me", initiatedBy: "agent", disposition: "PASS",
      supportingEvidenceRefs: ["artifact://x"], timestamp: AT,
    });
    expect(out.accepted).toBe(false);
  });

  it("refuses CLOSED with PASS but no evidence refs", () => {
    let state = initialGateState("G00");
    const started = transitionGate(state, {
      gateId: "G00", to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline", initiatedBy: "e", timestamp: AT,
    });
    expect(started.accepted).toBe(true);
    if (!started.accepted) return;
    const closed = transitionGate(started.state, {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "done", initiatedBy: "e", disposition: "PASS",
      criteria: allPassing("G00"), supportingEvidenceRefs: [], timestamp: AT,
    });
    expect(closed.accepted).toBe(false);
    if (closed.accepted) return;
    expect(closed.reason).toBe("pass-requires-evidence");
  });

  it("refuses CLOSED with no disposition at all", () => {
    let state = initialGateState("G00");
    const started = transitionGate(state, {
      gateId: "G00", to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline", initiatedBy: "e", timestamp: AT,
    });
    if (!started.accepted) throw new Error("unreachable");
    const closed = transitionGate(started.state, {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "done", initiatedBy: "e", disposition: null, timestamp: AT,
    });
    expect(closed.accepted).toBe(false);
    if (closed.accepted) return;
    expect(closed.reason).toBe("closed-requires-evidence");
  });

  it("records the refusal as history rather than discarding it", () => {
    const out = transitionGate(initialGateState("G00"), {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "trust me", initiatedBy: "agent", disposition: "PASS", timestamp: AT,
    });
    expect(out.state.refusalCount).toBe(1);
    expect(out.state.transitions).toHaveLength(1);
    expect(out.state.transitions[0].refusal).toBeDefined();
    expect(out.state.transitions[0].transitionRecordHash).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe("STALE evidence cannot support current PASS", () => {
  it("STALE -> CLOSED directly is not permitted", () => {
    expect(PERMITTED_LIFECYCLE_TRANSITIONS.STALE).toEqual(["IN_PROGRESS"]);
    const state: GateState = {
      ...initialGateState("G00"),
      lifecycle: "STALE",
      disposition: "PASS",
      revision: 4,
    };
    const out = transitionGate(state, {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "reuse the old evidence", initiatedBy: "e",
      supportingEvidenceRefs: ["artifact://old"], timestamp: AT,
    });
    expect(out.accepted).toBe(false);
    if (out.accepted) return;
    expect(out.reason).toBe("transition-not-permitted");
  });

  it("a historical PASS under STALE is not counted by the stage derivation", () => {
    const state: GateState = {
      ...initialGateState("G00"),
      lifecycle: "STALE",
      disposition: "PASS",
      revision: 4,
    };
    expect(deriveStageStatus([state], ["G00"])).toBe("STALE");
  });

  it("a historical PASS under STALE blocks programme completion", () => {
    const state: GateState = {
      ...initialGateState("G00"),
      lifecycle: "STALE",
      disposition: "PASS",
      revision: 4,
    };
    const out = deriveProgrammeAcceptance({ states: [state], mandatoryGates: ["G00"] });
    expect(out.machineComplete).toBe(false);
    expect(out.blockingIssues.join(" ")).toMatch(/stale/);
  });

  it("detects a changed baseline in any tracked fingerprint field", () => {
    const taken = BASE();
    expect(isEvidenceCurrent(taken, BASE())).toBe(true);
    for (const mutate of [
      (f: EvidenceFingerprint) => ({ ...f, sourceCommits: { "agent-bridge": "def5678" } }),
      (f: EvidenceFingerprint) => ({ ...f, relevantSourceHashes: { "executor.py": "h" } }),
      (f: EvidenceFingerprint) => ({ ...f, dependencyHashes: { "reqs.txt": "h" } }),
      (f: EvidenceFingerprint) => ({ ...f, configurationHashes: { "pyproject": "h" } }),
      (f: EvidenceFingerprint) => ({ ...f, schemaVersions: { programme: 2 } }),
      (f: EvidenceFingerprint) => ({ ...f, requirementRevision: "r2" }),
      (f: EvidenceFingerprint) => ({ ...f, acceptanceCriteriaRevision: "r2" }),
      (f: EvidenceFingerprint) => ({ ...f, testSuiteRevision: "r2" }),
      (f: EvidenceFingerprint) => ({ ...f, testEnvironmentRef: "other-host" }),
      (f: EvidenceFingerprint) => ({ ...f, upstreamGateRevisions: { G04: 2 } }),
    ]) {
      expect(isEvidenceCurrent(taken, mutate(BASE()))).toBe(false);
      expect(fingerprintDifferences(taken, mutate(BASE())).length).toBeGreaterThan(0);
    }
  });
});

describe("FAIL cannot disappear without a recorded reevaluation", () => {
  it("a FAIL disposition does not count toward stage or programme completion", () => {
    const state: GateState = {
      ...initialGateState("G03"),
      lifecycle: "CLOSED",
      disposition: "FAIL",
      revision: 2,
    };
    expect(deriveStageStatus([state], ["G03"])).toBe("FAIL");
    const out = deriveProgrammeAcceptance({ states: [state], mandatoryGates: ["G03"] });
    expect(out.machineComplete).toBe(false);
    expect(out.blockingIssues.join(" ")).toMatch(/FAIL is unresolved/);
  });

  it("reopening preserves the failure in history", () => {
    const failed: GateState = {
      ...initialGateState("G03"),
      lifecycle: "CLOSED",
      disposition: "FAIL",
      revision: 2,
      transitions: [],
    };
    const reopened = transitionGate(failed, {
      gateId: "G03", to: "IN_PROGRESS", trigger: "GATE_REOPENED",
      reason: "new finding", initiatedBy: "e", timestamp: AT,
    });
    expect(reopened.accepted).toBe(true);
    if (!reopened.accepted) return;
    expect(reopened.state.disposition).toBe("FAIL");
    expect(reopened.state.transitions[0].previousDisposition).toBe("FAIL");
    expect(reopened.state.transitions[0].newDisposition).toBe("FAIL");
  });

  it("a demonstrated failure outranks a blocker", () => {
    const out = deriveDisposition({
      gateId: "G03",
      criteria: [
        { requirementId: "REQ-p17-verification-continuity", result: "FAIL" },
        { requirementId: "REQ-p21-test-impact", result: "NOT_TESTED" },
      ],
      provided: [],
      blockers: [{ kind: "EXTERNAL", ref: "artifact://down", requirementIds: [] }],
    });
    expect(out.disposition).toBe("FAIL");
  });

  it("passes only when every mandatory criterion is actually present and passing", () => {
    const withoutOne = allPassing("G04").slice(1);
    const out = deriveDisposition({
      gateId: "G04", criteria: withoutOne, provided: providedFor("G04"),
    });
    expect(out.disposition).toBeNull();
    expect(out.basis).toBe("not-evaluated");
  });

  it("an untested criterion cannot be reported as PASS", () => {
    const criteria = allPassing("G02");
    criteria[0] = { requirementId: criteria[0].requirementId, result: "NOT_TESTED" };
    expect(deriveDisposition({ gateId: "G02", criteria, provided: providedFor("G02") }).disposition)
      .toBeNull();
    criteria[0] = { requirementId: criteria[0].requirementId, result: "IN_PROGRESS" };
    expect(deriveDisposition({ gateId: "G02", criteria, provided: providedFor("G02") }).disposition)
      .toBeNull();
    criteria[0] = { requirementId: criteria[0].requirementId, result: "BLOCKED" };
    expect(deriveDisposition({ gateId: "G02", criteria, provided: providedFor("G02") }).disposition)
      .toBeNull();
  });

  it("missing required evidence prevents PASS", () => {
    const out = deriveDisposition({
      gateId: "G02", criteria: allPassing("G02"), provided: [],
    });
    expect(out.disposition).toBeNull();
  });

  it("a failed evidence item prevents PASS", () => {
    const provided = providedFor("G02").map((p, i) => (i === 0 ? { ...p, passed: false } : p));
    const out = deriveDisposition({ gateId: "G02", criteria: allPassing("G02"), provided });
    expect(out.disposition).toBeNull();
  });
});

describe("BLOCKED cannot automatically become PASS", () => {
  it("a blocker without a reference is refused", () => {
    const problems = dispositionProblems("G08", "BLOCKED_EXTERNAL", [], {});
    expect(problems).toContain("blocked-requires-blocker-ref");
  });

  it("a blocker with a reference is permitted but still not PASS", () => {
    const problems = dispositionProblems("G08", "BLOCKED_EXTERNAL", [], {
      externalBlockerRef: "artifact://gpu-absent",
    });
    expect(problems).toEqual([]);
  });

  it("resolving a dependency does not itself promote the gate", () => {
    let state: GateState = {
      ...initialGateState("G08"),
      lifecycle: "IN_PROGRESS",
      disposition: null,
      revision: 1,
    };
    const blocked = transitionGate(state, {
      gateId: "G08", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "no GPU", initiatedBy: "e", disposition: "BLOCKED_EXTERNAL",
      externalBlockerRef: "artifact://gpu-absent", timestamp: AT,
    });
    expect(blocked.accepted).toBe(true);
    if (!blocked.accepted) return;
    state = blocked.state;
    expect(state.disposition).toBe("BLOCKED_EXTERNAL");
    // the dependency becoming available changes nothing by itself
    const after = publishEvaluation(state, BASE(), passingEvaluation("G08"), BASE(), "e", AT);
    expect(after.published).toBe(true);
    if (!after.published) return;
    expect(after.state.transitions.length).toBeGreaterThan(state.transitions.length);
  });

  it("BLOCKED_OWNER records the outstanding decision at programme level", () => {
    const state: GateState = {
      ...initialGateState("G09"),
      lifecycle: "CLOSED",
      disposition: "BLOCKED_OWNER",
      revision: 1,
    };
    const out = deriveProgrammeAcceptance({ states: [state], mandatoryGates: ["G09"] });
    expect(out.machineComplete).toBe(false);
    expect(out.outstandingOwnerDecisions.join(" ")).toMatch(/G09/);
  });
});

describe("NOT_APPLICABLE and DEFERRED both need justification", () => {
  it("NOT_APPLICABLE without a justification is refused", () => {
    const problems = dispositionProblems(
      "G07",
      "PASS",
      [{ requirementId: "REQ-p18-model-fabric", result: "NOT_APPLICABLE" }],
      { supportingEvidenceRefs: ["artifact://x"] },
    );
    expect(problems).toContain("not-applicable-requires-justification");
  });

  it("NOT_APPLICABLE with a justification is a legal PASS criterion", () => {
    const problems = dispositionProblems(
      "G07",
      "PASS",
      [
        { requirementId: "REQ-p18-model-fabric", result: "NOT_APPLICABLE", justification: "not in release scope" },
        { requirementId: "REQ-p22-reflex-calibration", result: "PASS" },
      ],
      { supportingEvidenceRefs: ["artifact://x"] },
    );
    expect(problems).toEqual([]);
  });

  it("DEFERRED without an approved scope reference is refused", () => {
    expect(dispositionProblems("G08", "DEFERRED_BY_APPROVED_SCOPE", [], {}))
      .toContain("deferred-requires-approved-scope");
    expect(dispositionProblems("G08", "DEFERRED_BY_APPROVED_SCOPE", [], {
      ownerApprovalRef: "owner://decision-1",
    })).toEqual([]);
  });

  it("a scope change cannot turn untested work into a completed gate", () => {
    const deferred: GateState = {
      ...initialGateState("G08"),
      lifecycle: "CLOSED",
      disposition: "DEFERRED_BY_APPROVED_SCOPE",
      revision: 1,
    };
    const out = deriveProgrammeAcceptance({
      states: [deferred], mandatoryGates: ["G08"], releaseScopeRef: "scope://core",
    });
    expect(out.machineComplete).toBe(false);
    expect(out.blockingIssues.join(" ")).toMatch(/deferred by approved scope but still inside/);
  });

  it("a deferral outside the release scope stops blocking", () => {
    const deferred: GateState = {
      ...initialGateState("G08"),
      lifecycle: "CLOSED",
      disposition: "DEFERRED_BY_APPROVED_SCOPE",
      revision: 1,
    };
    const passing = closedPassing("G09", BASE());
    const out = deriveProgrammeAcceptance({
      states: [deferred, passing],
      mandatoryGates: ["G08", "G09"],
      releaseScope: ["G09"],
      releaseScopeRef: "scope://core",
    });
    expect(out.blockingIssues).toEqual([]);
    // still visible: an out-of-scope deferral is recorded, not erased
    expect(out.outOfScopeDispositions.join(" ")).toMatch(/G08/);
  });
});

describe("a relevant upstream regression invalidates affected downstream evidence", () => {
  it("derives gate-to-gate edges from the canonical requirement graph", () => {
    const index = gateDependencyIndex(requirements);
    for (const [, deps] of index) {
      for (const d of deps) expect(ACCEPTANCE_GATE_IDS).toContain(d);
    }
  });

  it("staling an upstream gate walks the graph downstream", () => {
    const synthetic: Requirement[] = [
      {
        id: "REQ-up", title: "up", description: "", source: { class: "BUILD_TODO", ref: "x" },
        owner: "aetherius-os", phase: "P16", status: "IMPLEMENTED", priority: 3,
        depends_on: [], blockers: [], evidence: ["e"], provenance: "test",
        owner_gate: false, work_state: "COMPLETE",
      },
      {
        id: "REQ-down", title: "down", description: "", source: { class: "BUILD_TODO", ref: "x" },
        owner: "aetherius-os", phase: "P16", status: "IMPLEMENTED", priority: 3,
        depends_on: ["REQ-up"], blockers: [], evidence: ["e"], provenance: "test",
        owner_gate: false, work_state: "COMPLETE",
      },
    ];
    const defs = [
      { id: "G04" as AcceptanceGateId, title: "UP", evidence: [], requirements: ["REQ-up"] },
      { id: "G10" as AcceptanceGateId, title: "DOWN", evidence: [], requirements: ["REQ-down"] },
    ];
    const index = gateDependencyIndex(synthetic, defs);
    expect(index.get("G10")).toEqual(["G04"]);

    const up = closedPassing("G04", BASE());
    const down = closedPassing("G10", BASE());
    const result = invalidateGates(
      [up, down], ["REQ-up"], index, new Map(), "upstream evidence invalidated",
      "e", AT, defs,
    );
    expect(result.staled).toContain("G04");
    expect(result.affected).toContain("G10");
    const after = new Map(result.states.map((s) => [s.gateId, s]));
    expect(after.get("G04")!.lifecycle).toBe("STALE");
    expect(after.get("G10")!.lifecycle).toBe("STALE");
  });

  it("preserves the disposition while staling, so the history stays honest", () => {
    const up = closedPassing("G04", BASE());
    const index = gateDependencyIndex(requirements);
    const result = invalidateGates(
      [up], ["REQ-p20-clean-room"], index, new Map(), "changed", "e", AT,
    );
    const after = result.states[0];
    expect(after.lifecycle).toBe("STALE");
    expect(after.disposition).toBe("PASS");
    expect(after.transitions[after.transitions.length - 1].newLifecycle).toBe("STALE");
  });
});

describe("a superseded concurrent evaluation cannot overwrite a newer result", () => {
  it("refuses a result whose starting baseline no longer holds", () => {
    const started = transitionGate(initialGateState("G02"), {
      gateId: "G02", to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline", initiatedBy: "A", timestamp: AT,
    });
    if (!started.accepted) throw new Error("unreachable");
    const oldBaseline = { ...emptyFingerprint(), sourceCommits: { "agent-bridge": "old" } };
    const newBaseline = { ...emptyFingerprint(), sourceCommits: { "agent-bridge": "new" } };
    const out = publishEvaluation(
      started.state, newBaseline, passingEvaluation("G02"), oldBaseline, "A", AT,
    );
    expect(out.published).toBe(false);
    if (out.published) return;
    expect(out.reason).toBe("stale-evaluation");
  });

  it("refuses a result whose expected revision has moved on", () => {
    const state = closedPassing("G02", BASE());
    expect(state.revision).toBeGreaterThan(0);
    const out = publishEvaluation(
      state, BASE(), passingEvaluation("G02"), BASE(), "B", AT, 1,
    );
    // the gate has moved on, so this evaluation is superseded
    expect(out.published).toBe(false);
    if (out.published) return;
    expect(out.reason).toBe("revision-conflict");
    expect(out.state.revision).toBe(state.revision);
  });

  it("a superseded evaluation cannot overwrite a newer authoritative result", () => {
    const older = closedPassing("G02", BASE());
    const newer = { ...older, revision: older.revision + 1 };
    const out = publishEvaluation(
      newer, BASE(), passingEvaluation("G02"), BASE(), "A", AT, older.revision,
    );
    expect(out.published).toBe(false);
    if (out.published) return;
    expect(out.state.revision).toBe(newer.revision);
    expect(out.state.transitions.at(-1)!.refusal?.reason).toBe("revision-conflict");
  });

  it("keeps the superseded evaluation as history", () => {
    const started = transitionGate(initialGateState("G02"), {
      gateId: "G02", to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline", initiatedBy: "A", timestamp: AT,
    });
    if (!started.accepted) throw new Error("unreachable");
    const old = { ...emptyFingerprint(), sourceCommits: { r: "old" } };
    const now = { ...emptyFingerprint(), sourceCommits: { r: "new" } };
    const out = publishEvaluation(
      started.state, now, passingEvaluation("G02"), old, "A", AT,
    );
    expect(out.published).toBe(false);
    expect(out.state.refusalCount).toBe(1);
    expect(out.state.transitions.at(-1)!.refusal?.reason).toBe("stale-evaluation");
  });
});

describe("CLOSED does not mean PASS", () => {
  it("every closed-but-not-passing gate keeps the stage out of PASS", () => {
    for (const disposition of [
      "FAIL", "BLOCKED_OWNER", "BLOCKED_EXTERNAL",
      "DEFERRED_BY_APPROVED_SCOPE", "NOT_APPLICABLE",
    ] as const) {
      const state: GateState = {
        ...initialGateState("G12"),
        lifecycle: "CLOSED",
        disposition,
        revision: 1,
      };
      expect(deriveStageStatus([state], ["G12"])).not.toBe("PASS");
    }
  });

  it("gatesNeedingAttention lists closed gates that are not PASS", () => {
    const ok = closedPassing("G00", BASE());
    const closedFail: GateState = {
      ...initialGateState("G01"), lifecycle: "CLOSED", disposition: "FAIL", revision: 1,
    };
    const attention = gatesNeedingAttention([ok, closedFail]);
    expect(attention.map((s) => s.gateId)).toEqual(["G01"]);
  });
});

describe("a green test count does not mean all mandatory criteria passed", () => {
  it("one passing criterion out of many does not complete a gate", () => {
    const out = deriveDisposition({
      gateId: "G11",
      criteria: [{ requirementId: "REQ-mat-claim-registry", result: "PASS" }],
      provided: providedFor("G11"),
    });
    expect(out.disposition).toBeNull();
    expect(out.basis).toBe("not-evaluated");
  });

  it("programme completion needs every mandatory gate currently passing", () => {
    const ok = closedPassing("G00", BASE());
    const neverRun = initialGateState("G01");
    const out = deriveProgrammeAcceptance({
      states: [ok, neverRun], mandatoryGates: ["G00", "G01"],
    });
    expect(out.currentPassing).toEqual(["G00"]);
    expect(out.machineComplete).toBe(false);
    expect(out.nextRequiredAction).toMatch(/G01/);
  });

  it("publication is never authorized without an explicit owner approval", () => {
    const all = ACCEPTANCE_GATE_IDS.map((g) => closedPassing(g, BASE()));
    const withoutApproval = deriveProgrammeAcceptance({
      states: all, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    });
    expect(withoutApproval.machineComplete).toBe(true);
    expect(withoutApproval.ownerPublicationAuthorized).toBe(false);
    expect(withoutApproval.nextRequiredAction).toMatch(/owner authorization/);

    const withApproval = deriveProgrammeAcceptance({
      states: all, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
      ownerPublicationApprovalRef: "owner://release-approval",
    });
    expect(withApproval.ownerPublicationAuthorized).toBe(true);
  });

  it("an unsupported COMPLETE claim blocks completion", () => {
    const all = ACCEPTANCE_GATE_IDS.map((g) => closedPassing(g, BASE()));
    const out = deriveProgrammeAcceptance({
      states: all, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
      unsupportedCompleteClaims: ["REQ-p23-chat-work-depths"],
    });
    expect(out.machineComplete).toBe(false);
    expect(out.blockingIssues.join(" ")).toMatch(/unsupported COMPLETE claim/);
  });

  it("a gate missing entirely is IN_PROGRESS, never silently fine", () => {
    const out = deriveStageStatus([], ["G00"]);
    expect(out).toBe("IN_PROGRESS");
  });
});

describe("transition history is append-only and auditable", () => {
  it("every accepted transition carries a distinct hash and revision", () => {
    let state = initialGateState("G00");
    const hashes = new Set<string>();
    for (const [to, trigger] of [
      ["IN_PROGRESS", "EVALUATION_STARTED"],
      ["CLOSED", "EVALUATION_COMPLETED"],
      ["STALE", "EVIDENCE_INVALIDATED"],
      ["IN_PROGRESS", "REEVALUATION_STARTED"],
    ] as const) {
      const out = transitionGate(state, {
        gateId: "G00", to, trigger, reason: `${trigger}`, initiatedBy: "e",
        disposition: to === "CLOSED" ? "PASS" : undefined,
        criteria: to === "CLOSED" ? allPassing("G00") : undefined,
        supportingEvidenceRefs: to === "CLOSED" ? ["artifact://x"] : undefined,
        timestamp: AT,
      });
      expect(out.accepted).toBe(true);
      if (!out.accepted) return;
      state = out.state;
      hashes.add(out.transition.transitionRecordHash);
    }
    expect(state.revision).toBe(4);
    expect(hashes.size).toBe(4);
    expect(state.transitions.map((t) => t.newRevision)).toEqual([1, 2, 3, 4]);
  });

  it("preserves the actor, trigger and reason on every record", () => {
    const out = transitionGate(initialGateState("G06"), {
      gateId: "G06", to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline recorded at commit X", initiatedBy: "evaluator-1", timestamp: AT,
    });
    expect(out.accepted).toBe(true);
    if (!out.accepted) return;
    const t = out.transition;
    expect(t.initiatedBy).toBe("evaluator-1");
    expect(t.trigger).toBe("EVALUATION_STARTED");
    expect(t.reason).toContain("commit X");
  });
});