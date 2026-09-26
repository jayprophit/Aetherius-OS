import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStateStore } from "../state/store";
import {
  PROPOSAL_STAGES,
  ProposalStore,
  listProposals,
  proposalDecision,
  proposalIdFor,
  proposalStateId,
  proposalVersionRef,
  proposalsByEvidence,
  proposalsByProposer,
  proposalsByProtectedCategory,
  proposalsByRequirement,
  proposalsByStage,
  proposalsByTarget,
  registerProposal,
  supersessionChain,
  validateProposal,
} from "./proposals";
import * as proposals from "./proposals";
import type { ProposalInput, ProposalRecord } from "./proposals";

const AT = "2026-09-26T00:00:00.000Z";
const LATER = "2026-09-27T00:00:00.000Z";
const KNOWN = ["REQ-p16-governance-proposals", "REQ-p31-release-scope"];

function input(over: Partial<ProposalInput> = {}): ProposalInput {
  return {
    proposalId: "gov-release-scope",
    version: 1,
    title: "Define release scope",
    rationale: "No release scope is defined; the owner has not decided one.",
    scope: "public release contents",
    proposerRef: "agent:steward",
    stage: "PROPOSED",
    createdAt: AT,
    ...over,
  };
}

function decision(over: Partial<NonNullable<ProposalInput["decision"]>> = {}) {
  return {
    decisionRef: "decision:owner-2026-09-27",
    decidedByRef: "owner-profile:aetherius-os",
    decidedAt: LATER,
    outcome: "SUPPORTED" as const,
    ...over,
  };
}

function recordOf(over: Partial<ProposalInput> = {}): ProposalRecord {
  return registerProposal([], input(over)).outcome.status === "registered"
    ? (registerProposal([], input(over)).outcome as { record: ProposalRecord }).record
    : (() => {
        throw new Error("fixture did not register");
      })();
}

describe("proposal validation", () => {
  it("accepts a minimal valid proposal and a full one", () => {
    expect(validateProposal(input(), KNOWN)).toEqual([]);
    expect(
      validateProposal(
        input({
          stage: "VOTE",
          decision: decision(),
          targetRefs: ["REQ-p31-release-scope"],
          requirementRefs: ["REQ-p31-release-scope"],
          evidenceRefs: ["human-release-validation.md"],
          risk: { category: "PUBLICATION", note: "affects what ships" },
          supersedesRef: proposalVersionRef("gov-release-scope", 0),
        }),
        KNOWN,
      ),
    ).toEqual([]);
  });

  it("rejects malformed ids, versions, text, stages and timestamps", () => {
    const cases: Record<string, Partial<ProposalInput>> = {
      "proposal-id": { proposalId: "REQ-p16-governance-proposals" },
      version: { version: 0 },
      title: { title: "  " },
      rationale: { rationale: "" },
      scope: { scope: "" },
      "proposer-ref": { proposerRef: "" },
      stage: { stage: "APPROVED" as never },
      "created-at": { createdAt: "yesterday" },
      "risk-category": { risk: { category: "crypto" as never } },
    };
    for (const [problem, over] of Object.entries(cases)) {
      expect(validateProposal(input(over))).toContain(problem);
    }
  });

  it("rejects blank, duplicate and self-superseding references", () => {
    expect(validateProposal(input({ supersedesRef: "" }))).toContain("supersedes");
    expect(validateProposal(input({ supersedesRef: proposalVersionRef("gov-release-scope", 1) }))).toContain("supersedes");
    expect(validateProposal(input({ targetRefs: [""] }))).toContain("refs");
    expect(validateProposal(input({ targetRefs: ["a", "a"] }))).toContain("refs");
  });

  it("reports unknown requirement refs only when the known set is supplied", () => {
    expect(validateProposal(input({ requirementRefs: ["REQ-ghost"] }))).toEqual([]);
    expect(validateProposal(input({ requirementRefs: ["REQ-ghost"] }), KNOWN)).toContain("requirement-refs");
  });

  it("requires a decision at the VOTE stage and forbids it elsewhere", () => {
    expect(validateProposal(input({ stage: "VOTE" }))).toContain("decision");
    expect(validateProposal(input({ stage: "VOTE", decision: decision({ decisionRef: "" }) }))).toContain("decision");
    expect(validateProposal(input({ stage: "REVIEW", decision: decision() }))).toContain("decision");
    expect(validateProposal(input({ stage: "PROPOSED", decision: decision() }))).toContain("decision");
  });

  it("rejects a decision dated before the proposal existed", () => {
    expect(validateProposal(input({ stage: "VOTE", decision: decision({ decidedAt: "2026-09-01T00:00:00.000Z" }) }))).toContain(
      "decision-temporal",
    );
    // Equal timestamps are not a conflict: a decision can land in the same instant.
    expect(validateProposal(input({ stage: "VOTE", decision: decision({ decidedAt: AT }) }))).toEqual([]);
  });

  it("rejects authority fields and raw secrets instead of storing them", () => {
    for (const key of ["authorized", "canMerge", "policyBypass", "ownerOverride", "applied"]) {
      const hostile = { ...input(), [key]: true } as ProposalInput;
      expect(validateProposal(hostile)).toContain("authority-field");
    }
    for (const key of ["apiKey", "token", "privateKey", "password"]) {
      const hostile = { ...input(), [key]: "x" } as ProposalInput;
      expect(validateProposal(hostile)).toContain("authority-field");
    }
    expect(validateProposal(input({ rationale: 'api_key: "sk-live-1234567890"' }))).toContain("raw-secret");
    expect(validateProposal(input({ rationale: "Bearer eyJhbGciOiJIUzI1NiJ9.abc" }))).toContain("raw-secret");
    expect(validateProposal(input({ rationale: 'password: "hunter2"' }))).toContain("raw-secret");
  });

  it("never repairs malformed input into a valid proposal", () => {
    const outcome = registerProposal([], input({ version: 0 }));
    expect(outcome.outcome.status).toBe("rejected");
    expect(outcome.records).toEqual([]);
  });
});

describe("proposal registration", () => {
  it("is idempotent for identical content", () => {
    const first = registerProposal([], input(), KNOWN);
    expect(first.outcome.status).toBe("registered");
    const again = registerProposal(first.records, input(), KNOWN);
    expect(again.outcome.status).toBe("identical");
    expect(again.records).toHaveLength(1);
  });

  it("conflicts on same id and version with different content", () => {
    const first = registerProposal([], input(), KNOWN);
    const clash = registerProposal(first.records, input({ rationale: "A different rationale entirely." }), KNOWN);
    expect(clash.outcome.status).toBe("conflict");
    expect(clash.records).toHaveLength(1);
    if (clash.outcome.status !== "conflict") throw new Error("expected conflict");
    expect(clash.outcome.reason).toContain("immutable");
  });

  it("treats a different createdAt as different content, because time is evidence", () => {
    const first = registerProposal([], input(), KNOWN);
    const clash = registerProposal(first.records, input({ createdAt: LATER }), KNOWN);
    expect(clash.outcome.status).toBe("conflict");
  });

  it("records an amendment as a new version and retains the prior one", () => {
    const first = registerProposal([], input(), KNOWN);
    const amended = registerProposal(
      first.records,
      input({ version: 2, supersedesRef: proposalVersionRef("gov-release-scope", 1), rationale: "Narrowed scope." }),
      KNOWN,
    );
    expect(amended.outcome.status).toBe("registered");
    expect(amended.records).toHaveLength(2);
    const chain = supersessionChain(amended.records, "gov-release-scope");
    expect(chain.map((r) => r.version)).toEqual([1, 2]);
    // Amendment is not silent overwrite: version 1 survives verbatim.
    expect(chain[0]!.rationale).toBe("No release scope is defined; the owner has not decided one.");
  });

  it("refuses an amendment that moves the version backwards", () => {
    const first = registerProposal([], input({ version: 2 }), KNOWN);
    const older = registerProposal(first.records, input({ version: 1 }), KNOWN);
    expect(older.outcome.status).toBe("conflict");
    if (older.outcome.status !== "conflict") throw new Error("expected conflict");
    expect(older.outcome.reason).toContain("later version");
  });

  it("never mutates the input record list", () => {
    const first = registerProposal([], input(), KNOWN);
    const snapshot = JSON.stringify(first.records);
    registerProposal(first.records, input({ version: 2, supersedesRef: proposalVersionRef("gov-release-scope", 1) }), KNOWN);
    proposalsByStage(first.records, "VOTE");
    expect(JSON.stringify(first.records)).toBe(snapshot);
  });
});

describe("proposal decision semantics", () => {
  it("reads a recorded decision at the VOTE stage", () => {
    const { records } = registerProposal([], input({ stage: "VOTE", decision: decision() }), KNOWN);
    const decided = proposalDecision(records[0]!);
    if (decided === "NO_DECISION_RECORDED") throw new Error("expected a decision");
    expect(decided.outcome).toBe("SUPPORTED");
    // A supporting decision is still not authorization.
    expect(records[0]!).not.toHaveProperty("authorized");
    expect(records[0]!).not.toHaveProperty("merge_authority");
  });

  it("reports an absent decision as undecided, never as approved", () => {
    const { records } = registerProposal([], input({ stage: "REVIEW" }), KNOWN);
    expect(proposalDecision(records[0]!)).toBe("NO_DECISION_RECORDED");
  });

  it("records an opposing decision without deleting the proposal", () => {
    const { records } = registerProposal([], input({ stage: "VOTE", decision: decision({ outcome: "OPPOSED" }) }), KNOWN);
    expect(records).toHaveLength(1);
    const recorded = proposalDecision(records[0]!);
    if (recorded === "NO_DECISION_RECORDED") throw new Error("expected a decision");
    expect(recorded.outcome).toBe("OPPOSED");
  });

  it("retains withdrawn and superseded proposals in history", () => {
    const first = registerProposal([], input(), KNOWN);
    const withdrawn = registerProposal(
      first.records,
      input({ version: 2, stage: "WITHDRAWN", supersedesRef: proposalVersionRef("gov-release-scope", 1) }),
      KNOWN,
    );
    expect(withdrawn.records).toHaveLength(2);
    expect(proposalsByStage(withdrawn.records, "WITHDRAWN")).toHaveLength(1);
    expect(listProposals(withdrawn.records)).toHaveLength(2);
  });
});

describe("proposal identity and queries", () => {
  it("derives a deterministic gov- id from a title", () => {
    expect(proposalIdFor("Define release scope")).toBe("gov-define-release-scope");
    expect(proposalIdFor("Define release scope")).toBe(proposalIdFor("  define   RELEASE scope "));
    expect(proposalIdFor("!!!")).toBe("gov-proposal");
  });

  it("cannot masquerade as a requirement, decision, vote or execution id", () => {
    for (const id of ["REQ-p16-governance-proposals", "decision:1", "vote:1", "run:1", "worker:1", "gov"]) {
      expect(validateProposal(input({ proposalId: id }))).toContain("proposal-id");
    }
  });

  it("orders deterministically by id then version and deep-copies reads", () => {
    const a = registerProposal([], input({ proposalId: "gov-a" }), KNOWN);
    const b = registerProposal(a.records, input({ proposalId: "gov-b" }), KNOWN);
    const c = registerProposal(b.records, input({ proposalId: "gov-a", version: 2 }), KNOWN);
    const ids = listProposals(c.records).map((r) => proposalVersionRef(r.proposalId, r.version));
    expect(ids).toEqual(["gov-a@1", "gov-a@2", "gov-b@1"]);
    expect(listProposals(c.records)).toEqual(listProposals(c.records));
    const read = listProposals(c.records);
    read[0]!.rationale = "mutated by the caller";
    expect(listProposals(c.records)[0]!.rationale).toBe(
      "No release scope is defined; the owner has not decided one.",
    );
  });

  it("queries by stage, proposer, requirement, target, evidence and risk category", () => {
    const first = registerProposal(
      [],
      input({
        proposerRef: "agent:steward",
        targetRefs: ["REQ-p31-release-scope"],
        requirementRefs: ["REQ-p31-release-scope"],
        evidenceRefs: ["cohort:release-train"],
        risk: { category: "PUBLICATION", note: "ships" },
      }),
      KNOWN,
    );
    const second = registerProposal(
      first.records,
      input({ proposalId: "gov-toolchain", proposerRef: "user:jpowe", risk: { category: "NONE" } }),
      KNOWN,
    );
    const records = second.records;
    expect(proposalsByStage(records, "PROPOSED")).toHaveLength(2);
    expect(proposalsByProposer(records, "agent:steward")).toHaveLength(1);
    expect(proposalsByRequirement(records, "REQ-p31-release-scope")).toHaveLength(1);
    expect(proposalsByTarget(records, "REQ-p31-release-scope")).toHaveLength(1);
    expect(proposalsByEvidence(records, "cohort:release-train")).toHaveLength(1);
    expect(proposalsByProtectedCategory(records, "PUBLICATION")).toHaveLength(1);
    // Unknown keys return nothing rather than everything.
    expect(proposalsByStage(records, "VOTE")).toEqual([]);
    expect(proposalsByProposer(records, "nobody")).toEqual([]);
  });
});

describe("durable governance proposals", () => {
  function makeStore(): { store: FileStateStore; proposals: ProposalStore } {
    const root = mkdtempSync(join(tmpdir(), "gov-proposal-"));
    const store = new FileStateStore(root, 1);
    return { store, proposals: new ProposalStore(store, "aetherius-os") };
  }

  it("round-trips with integrity and bumps record versions", () => {
    const { store, proposals: registry } = makeStore();
    const record = recordOf();
    registry.save(record);
    const id = proposalStateId(record.proposalId, record.version);
    const first = store.load<ProposalRecord>(id);
    expect(first.kind).toBe("governance.proposal");
    expect(first.recordVersion).toBe(1);
    expect(first.integrity).toHaveLength(64);

    registry.save({ ...record, rationale: "Amended rationale." });
    const second = store.load<ProposalRecord>(id);
    expect(second.recordVersion).toBe(2);
    expect(second.createdAt).toBe(AT);
    expect(registry.load(id).rationale).toBe("Amended rationale.");
    expect(registry.listIds()).toContain(id);
  });

  it("detects tampered proposal payloads", () => {
    const { store, proposals: registry } = makeStore();
    const record = recordOf();
    registry.save(record);
    const path = join(store.root, `${proposalStateId(record.proposalId, record.version)}.json`);
    const raw = JSON.parse(readFileSync(path, "utf8")) as { payload: { stage: string } };
    raw.payload.stage = "APPROVED";
    writeFileSync(path, JSON.stringify(raw), "utf8");
    expect(() => registry.load(proposalStateId(record.proposalId, record.version))).toThrowError(/integrity/);
  });

  it("refuses to persist an invalid proposal and writes nothing", () => {
    const { store, proposals: registry } = makeStore();
    expect(() => registry.save({ ...recordOf(), version: 0 })).toThrowError(/version/);
    expect(store.listIds()).toEqual([]);
  });

  it("rejects a non-proposal record on load", () => {
    const { store, proposals: registry } = makeStore();
    store.save({
      id: "gov-foreign-v1",
      kind: "steward.report",
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: AT,
      updatedAt: AT,
      owner: "aetherius-os",
      provenance: "p16-governance-proposals",
      sensitivity: "USER",
      integrity: "",
      payload: recordOf(),
    });
    expect(() => registry.load("gov-foreign-v1")).toThrowError(/not a governance proposal/);
  });
});

describe("governance authority invariants", () => {
  it("the stage vocabulary contains no approved, authorized, applied or promoted state", () => {
    for (const banned of ["APPROVED", "AUTHORIZED", "APPLIED", "PROMOTED", "EXECUTED", "GRANTED", "FUNDED", "RELEASED"]) {
      expect(PROPOSAL_STAGES).not.toContain(banned as never);
    }
    // The requirement's later chain links are named but not implemented.
    for (const outOfScope of ["FUNDING", "MILESTONES", "EVIDENCE", "STAGED_RELEASE"]) {
      expect(PROPOSAL_STAGES).not.toContain(outOfScope as never);
    }
  });

  it("exposes no apply, authorize, execute, vote-count or quorum surface", () => {
    const names = Object.keys(proposals);
    for (const banned of [
      "authorize",
      "execute",
      "apply",
      "approve",
      "merge",
      "deploy",
      "promote",
      "tally",
      "quorum",
      "ballot",
      "voter",
      "delegate",
      "stake",
    ]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("the store prototype exposes no effect surface", () => {
    const root = mkdtempSync(join(tmpdir(), "gov-proposal-surface-"));
    const registry = new ProposalStore(new FileStateStore(root, 1), "aetherius-os");
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(registry));
    for (const banned of ["authorize", "execute", "apply", "approve", "merge", "delete", "promote"]) {
      expect(methods.some((m) => m.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("a SUPPORTED decision changes nothing: no requirement, P25 or policy object is reachable", () => {
    const { records } = registerProposal(
      [],
      input({ stage: "VOTE", decision: decision(), requirementRefs: ["REQ-p31-release-scope"] }),
      KNOWN,
    );
    // The registry holds proposal records only. It cannot express, let alone
    // perform, a requirement transition or a P25 authorization.
    expect(records).toHaveLength(1);
    const keys = Object.keys(records[0]!).sort();
    expect(keys).toEqual([
      "createdAt",
      "decision",
      "evidenceRefs",
      "proposalId",
      "proposerRef",
      "provenance",
      "rationale",
      "requirementRefs",
      "risk",
      "scope",
      "stage",
      "targetRefs",
      "title",
      "version",
    ]);
  });

  it("a proposal referencing an owner-gated requirement does not clear its gate", () => {
    // REQ-p31-release-scope is OWNER_GATED. Recording a proposal about it,
    // even a SUPPORTED one, is not a decision by the owner.
    const { records } = registerProposal(
      [],
      input({
        stage: "VOTE",
        decision: decision(),
        requirementRefs: ["REQ-p31-release-scope"],
        risk: { category: "PUBLICATION", note: "owner-gated scope" },
      }),
      KNOWN,
    );
    expect(proposalsByRequirement(records, "REQ-p31-release-scope")).toHaveLength(1);
    // Nothing in the record claims the gate was resolved.
    expect(JSON.stringify(records[0]!)).not.toContain("owner_gate");
    expect(JSON.stringify(records[0]!)).not.toContain("work_state");
  });

  it("proposer identity carries no authority", () => {
    const { records } = registerProposal([], input({ proposerRef: "user:owner" }), KNOWN);
    const record = records[0]!;
    expect(record.proposerRef).toBe("user:owner");
    // A proposer named "owner" grants nothing: no authority field exists.
    expect(Object.keys(record)).not.toContain("authority");
    expect(record.stage).toBe("PROPOSED");
  });
});
