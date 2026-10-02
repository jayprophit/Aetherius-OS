/**
 * The acceptance gate layer, proven through the real store on disk.
 *
 * These tests use a real FileStateStore in a temp directory. A fake store
 * would not exercise the two properties that matter here: the optimistic
 * version check and the integrity hash.
 */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ACCEPTANCE_GATE_DEFINITIONS,
  ACCEPTANCE_GATE_IDS,
  deriveDisposition,
  emptyFingerprint,
  gateDefinition,
  gateDependencyIndex,
  initialGateState,
} from "../programme/acceptanceGate";
import type {
  AcceptanceGateId,
  CriterionOutcome,
  EvaluationInput,
  EvidenceFingerprint,
} from "../programme/acceptanceGate";
import requirementsJson from "../programme/requirements.json";
import type { Requirement } from "../programme/types";
import {
  ACCEPTANCE_SCHEMA_VERSION,
  ACCEPTANCE_STATE_ID,
  applyTransitionAndSave,
  deriveProgrammeReport,
  formatProgrammeReport,
  invalidateAndSave,
  loadAcceptanceState,
  publishAndSave,
  saveAcceptanceState,
} from "./acceptanceState";
import { FileStateStore } from "./store";
import type { OwnedStore } from "./store";
import { StateError } from "./types";

const requirements = requirementsJson.requirements as Requirement[];
const AT = "2026-10-02T00:00:00.000Z";
const FP = (commit = "abc1234"): EvidenceFingerprint => ({
  ...emptyFingerprint(),
  sourceCommits: { "agent-bridge": commit },
});

let root = "";
let store: OwnedStore;

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "acceptance-"));
  store = new FileStateStore(root, ACCEPTANCE_SCHEMA_VERSION);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function passingEvaluation(gateId: AcceptanceGateId): EvaluationInput {
  const def = gateDefinition(gateId)!;
  const criteria: CriterionOutcome[] = def.requirements.map((requirementId) => ({
    requirementId,
    result: "PASS",
    evidenceRefs: [`test:${requirementId}`],
  }));
  return {
    gateId,
    criteria,
    provided: def.evidence.map((e) => ({
      key: e.key,
      kind: "test-report" as const,
      passed: true,
      ref: `artifact://${gateId}/${e.key}`,
    })),
  };
}

/** Close a gate legitimately: start, evaluate, publish. */
function closePassing(gateId: AcceptanceGateId, fingerprint = FP()): void {
  const load = loadAcceptanceState(store);
  const current = load.gates.find((g) => g.gateId === gateId)!;
  if (current.lifecycle === "NOT_EVALUATED") {
    applyTransitionAndSave(store, {
      gateId, to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
      reason: "baseline recorded", initiatedBy: "evaluator", timestamp: AT,
    }, { actor: "evaluator", source: "test", now: () => AT });
  }
  const after = loadAcceptanceState(store);
  const started = after.gates.find((g) => g.gateId === gateId)!;
  const out = publishAndSave(store, passingEvaluation(gateId), {
    actor: "evaluator", source: "test", timestamp: AT,
    fingerprintAtStart: fingerprint, currentFingerprint: fingerprint,
    startedAtRevision: started.revision,
    now: () => AT,
  });
  expect(out.published).toBe(true);
}

function closeAllPassing(fingerprint = FP()): void {
  for (const gateId of ACCEPTANCE_GATE_IDS) closePassing(gateId, fingerprint);
}

describe("persistence through the canonical owned-state store", () => {
  it("reports every gate as absent when no record exists", () => {
    const load = loadAcceptanceState(store);
    expect(load.record).toBeNull();
    expect(load.absent).toEqual([...ACCEPTANCE_GATE_IDS]);
    expect(load.gates.every((g) => g.lifecycle === "NOT_EVALUATED")).toBe(true);
  });

  it("survives a reload with lifecycle and history intact", () => {
    closePassing("G02");
    const load = loadAcceptanceState(store);
    const g02 = load.gates.find((g) => g.gateId === "G02")!;
    expect(g02.lifecycle).toBe("CLOSED");
    expect(g02.disposition).toBe("PASS");
    expect(g02.transitions.length).toBeGreaterThanOrEqual(2);
    expect(g02.transitions.every((t) => t.transitionRecordHash.length === 16)).toBe(true);
  });

  it("detects tampering with the payload rather than trusting it", () => {
    closePassing("G02");
    const path = join(root, `${ACCEPTANCE_STATE_ID}.json`);
    const raw = JSON.parse(readFileSync(path, "utf8"));
    // rewrite history: claim G05 was never evaluated and G06 was rejected
    raw.payload.gates = raw.payload.gates.map((g: { gateId: string }) => {
      if (g.gateId === "G05") return { ...g, lifecycle: "CLOSED", disposition: "PASS" };
      if (g.gateId === "G06") return { ...g, lifecycle: "CLOSED", disposition: "FAIL" };
      return g;
    });
    writeFileSync(path, JSON.stringify(raw, null, 2));
    expect(() => loadAcceptanceState(store)).toThrowError(/integrity/i);
  });

  it("refuses a stale writer instead of letting the last write win", () => {
    closePassing("G02");
    const load = loadAcceptanceState(store);
    expect(() => saveAcceptanceState(store, load.gates, {
      expectedRecordVersion: load.storeRevision - 1,
      actor: "a", source: "test",
    })).toThrowError(StateError);
  });

  it("keeps gates whose evidence has not been evaluated", () => {
    closePassing("G02");
    const report = deriveProgrammeReport({
      store, requirements, mandatoryGates: ["G02"],
    });
    expect(report.machineComplete).toBe(true);
    expect(report.absentGates).toEqual([]);
  });
});

describe("publication is refused when it must be", () => {
  it("refuses a stale store write and leaves the newer state intact", () => {
    closePassing("G02");
    const before = loadAcceptanceState(store);
    const g02Before = before.gates.find((g) => g.gateId === "G02")!;
    expect(() => saveAcceptanceState(store, before.gates, {
      expectedRecordVersion: before.storeRevision - 1,
      actor: "stale-writer", source: "test",
    })).toThrowError(/stale write/i);
    const after = loadAcceptanceState(store);
    expect(after.storeRevision).toBe(before.storeRevision);
    expect(after.gates.find((g) => g.gateId === "G02")!.revision).toBe(g02Before.revision);
  });

  it("refuses an evaluation that a newer evaluation has superseded", () => {
    closePassing("G02");
    const before = loadAcceptanceState(store);
    const g02Before = before.gates.find((g) => g.gateId === "G02")!;
    const out = publishAndSave(store, passingEvaluation("G02"), {
      actor: "stale-evaluator", source: "test", timestamp: AT,
      fingerprintAtStart: FP(), currentFingerprint: FP(),
      startedAtRevision: Math.max(0, g02Before.revision - 1),
      now: () => AT,
    });
    expect(out.published).toBe(false);
    expect(out.reason).toBe("revision-conflict");
    const after = loadAcceptanceState(store).gates.find((g) => g.gateId === "G02")!;
    expect(after.disposition).toBe("PASS");
    expect(after.refusalCount).toBe(g02Before.refusalCount + 1);
  });

  it("an incomplete evaluation leaves the gate IN_PROGRESS, never PASS", () => {
    const def = gateDefinition("G04")!;
    publishAndSave(store, {
      gateId: "G04",
      criteria: def.requirements.slice(0, 1).map((requirementId) => ({
        requirementId, result: "PASS" as const,
      })),
      provided: [],
    }, {
      actor: "evaluator", source: "test", timestamp: AT,
      fingerprintAtStart: FP(), currentFingerprint: FP(), now: () => AT,
    });
    const g04 = loadAcceptanceState(store).gates.find((g) => g.gateId === "G04")!;
    expect(g04.lifecycle).toBe("IN_PROGRESS");
    expect(g04.disposition).toBeNull();
    const report = deriveProgrammeReport({ store, requirements, mandatoryGates: ["G04"] });
    expect(report.machineComplete).toBe(false);
  });

  it("a demonstration of failure is recorded as FAIL and persists", () => {
    const def = gateDefinition("G03")!;
    const failed = publishAndSave(store, {
      gateId: "G03",
      criteria: [
        { requirementId: def.requirements[0], result: "FAIL" as const },
        ...def.requirements.slice(1).map((requirementId) => ({
          requirementId, result: "PASS" as const,
        })),
      ],
      provided: def.evidence.map((e) => ({
        key: e.key, kind: "test-report" as const, passed: true, ref: `artifact://${e.key}`,
      })),
    }, {
      actor: "evaluator", source: "test", timestamp: AT,
      fingerprintAtStart: FP(), currentFingerprint: FP(), now: () => AT,
    });
    expect(failed.published).toBe(true);
    const g03 = loadAcceptanceState(store).gates.find((g) => g.gateId === "G03")!;
    expect(g03.disposition).toBe("FAIL");
    const report = deriveProgrammeReport({ store, requirements, mandatoryGates: ["G03"] });
    expect(report.machineComplete).toBe(false);
    expect(report.blockingIssues.join(" ")).toMatch(/FAIL is unresolved/);
  });

  it("a refused transition is persisted as history, not discarded", () => {
    const { outcome } = applyTransitionAndSave(store, {
      gateId: "G00", to: "CLOSED", trigger: "EVALUATION_COMPLETED",
      reason: "trust me", initiatedBy: "agent", disposition: "PASS",
      supportingEvidenceRefs: ["artifact://x"], timestamp: AT,
    }, { actor: "agent", source: "test", now: () => AT });
    expect(outcome.accepted).toBe(false);
    const g00 = loadAcceptanceState(store).gates.find((g) => g.gateId === "G00")!;
    expect(g00.lifecycle).toBe("NOT_EVALUATED");
    expect(g00.refusalCount).toBe(1);
    expect(g00.transitions.at(-1)!.refusal).toBeDefined();
  });
});

describe("invalidation propagates and is persisted", () => {
  it("stales a gate whose requirement changed and keeps the disposition visible", () => {
    closePassing("G04");
    const before = loadAcceptanceState(store).gates.find((g) => g.gateId === "G04")!;
    expect(before.lifecycle).toBe("CLOSED");
    const out = invalidateAndSave(
      store, ["REQ-p20-clean-room"], requirements, "requirement changed", "e", AT,
    );
    expect(out.staled).toContain("G04");
    const after = loadAcceptanceState(store).gates.find((g) => g.gateId === "G04")!;
    expect(after.lifecycle).toBe("STALE");
    expect(after.disposition).toBe("PASS");
  });

  it("a staled PASS no longer completes the programme", () => {
    closePassing("G04");
    invalidateAndSave(store, ["REQ-p20-clean-room"], requirements, "changed", "e", AT);
    const report = deriveProgrammeReport({ store, requirements, mandatoryGates: ["G04"] });
    expect(report.machineComplete).toBe(false);
    expect(report.blockingIssues.join(" ")).toMatch(/stale/);
  });

  it("stales downstream gates that relied on the invalidated evidence", () => {
    // G10's REQ-bridge-gate-compat is a dependency of G02's
    // REQ-ide-genesis-task-loop, so the edge is real and derived, not chosen.
    const index = gateDependencyIndex(requirements);
    expect(index.get("G02")).toContain("G10");
    closePassing("G10");
    closePassing("G02");
    const out = invalidateAndSave(
      store, ["REQ-bridge-gate-compat"], requirements, "integration contract change", "e", AT,
    );
    expect(out.staled).toContain("G10");
    expect(out.affected).toContain("G02");
    const gates = new Map(loadAcceptanceState(store).gates.map((g) => [g.gateId, g]));
    expect(gates.get("G10")!.lifecycle).toBe("STALE");
    expect(gates.get("G02")!.lifecycle).toBe("STALE");
  });

  it("a broad baseline change stales everything downstream of it", () => {
    closePassing("G00");
    const out = invalidateAndSave(
      store, ["REQ-p16-control"], requirements, "baseline change", "e", AT,
    );
    // REQ-p16-control underpins most of the programme
    expect(out.staled.length).toBeGreaterThan(1);
  });
});

describe("the programme report is honest about what it does not know", () => {
  it("reports absent records separately from NOT_EVALUATED gates", () => {
    // With no record at all, absence is explicit and distinct from having been
    // evaluated and found unevaluated.
    const fresh = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    });
    expect(fresh.absentGates).toEqual([...ACCEPTANCE_GATE_IDS].sort());
    expect(fresh.machineComplete).toBe(false);

    // Once a record exists, every gate is accounted for and the report is
    // driven by disposition rather than absence.
    closePassing("G02");
    const partial = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    });
    expect(partial.absentGates).toEqual([]);
    expect(partial.currentPassing).toEqual(["G02"]);
    expect(partial.machineComplete).toBe(false);
  });

  // Closing all 13 gates is 26 store saves, each fsynced on Windows. Real
  // durability, so the honest fix is an honest timeout rather than a mocked
  // store that would stop exercising the version check and integrity hash.
  it("only reports machine-complete when every mandatory gate currently passes", { timeout: 30_000 }, () => {
    closeAllPassing();
    const report = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    });
    expect(report.machineComplete).toBe(true);
    expect(report.currentPassing).toHaveLength(ACCEPTANCE_GATE_IDS.length);
    expect(report.ownerPublicationAuthorized).toBe(false);
  });

  it("authorization requires an explicit owner approval reference", { timeout: 30_000 }, () => {
    closeAllPassing();
    const without = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    });
    expect(without.ownerPublicationAuthorized).toBe(false);
    const with_ = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
      ownerPublicationApprovalRef: "owner://release",
    });
    expect(with_.ownerPublicationAuthorized).toBe(true);
  });

  it("an unsupported COMPLETE claim blocks the programme", { timeout: 30_000 }, () => {
    closeAllPassing();
    const report = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
      unsupportedCompleteClaims: ["REQ-cert-regeneration"],
    });
    expect(report.machineComplete).toBe(false);
    expect(report.blockingIssues.join(" ")).toMatch(/REQ-cert-regeneration/);
  });

  it("a fingerprint that no longer matches overrides a stored PASS", { timeout: 30_000 }, () => {
    closeAllPassing(FP("old"));
    const current = new Map<AcceptanceGateId, EvidenceFingerprint>(
      ACCEPTANCE_GATE_IDS.map((g) => [g, FP("new")]),
    );
    const report = deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
      currentFingerprints: current,
    });
    expect(report.staleGates.length).toBeGreaterThan(0);
    expect(report.machineComplete).toBe(false);
    expect(report.nextRequiredAction).toMatch(/re-evaluate/);
  });

  it("renders a report with no aggregate number anywhere", { timeout: 30_000 }, () => {
    closeAllPassing();
    const text = formatProgrammeReport(deriveProgrammeReport({
      store, requirements, mandatoryGates: [...ACCEPTANCE_GATE_IDS],
    }));
    expect(text).toContain("MACHINE_COMPLETE: true");
    expect(text).toContain("OWNER_PUBLICATION_AUTHORIZED: false");
    expect(text).not.toMatch(/\d+(\.\d+)?%/);
  });

  it("the report never says a gate is fine when it has no record", () => {
    const report = deriveProgrammeReport({
      store, requirements, mandatoryGates: ["G12"],
    });
    expect(report.machineComplete).toBe(false);
    expect(report.absentGates).toContain("G12");
    expect(report.nextRequiredAction).toMatch(/G12/);
  });
});

describe("it does not become a second status system", () => {
  it("reuses the contract's gate definitions rather than restating them", () => {
    expect(ACCEPTANCE_GATE_DEFINITIONS.map((g) => g.id)).toEqual([...ACCEPTANCE_GATE_IDS]);
  });

  it("derives the same disposition the contract does, from the same evidence", () => {
    const input = passingEvaluation("G02");
    expect(deriveDisposition(input).disposition).toBe("PASS");
  });

  it("initialises every gate to the contract's own NOT_EVALUATED state", () => {
    const gates = ACCEPTANCE_GATE_IDS.map(initialGateState);
    expect(gates.every((g) => g.lifecycle === "NOT_EVALUATED" && g.disposition === null))
      .toBe(true);
  });
});