import { describe, expect, it } from "vitest";
import { escalationSignal, makeAbstention } from "./abstain";
import type { AbstainReason } from "./abstain";
import {
  ESCALATION_REASONS,
  HUMAN_ONLY_REASONS,
  RESOLVER_KINDS,
  decideEscalation,
} from "./escalation";
import type { EscalationInput } from "./escalation";

/** Built through the REAL escalationSignal seam — no duplication, no mock. */
function signal(reasons: AbstainReason[] = ["AMBIGUOUS"], probability = 0.62) {
  return escalationSignal(
    makeAbstention({
      decisionId: "dec-1",
      taskType: "intent/classify",
      inputFingerprint: "fp-abc",
      abstainProbability: probability,
      reasons,
      backend: "s1-test",
      backendVersion: "0",
      provenance: "test",
    }),
  );
}

/** Dimension-specific fixtures: every input declares its own fields. */
function input(over: Partial<EscalationInput> = {}): EscalationInput {
  return {
    signal: signal(),
    decisionId: "esc-1",
    missing: [],
    ambiguous: [],
    contradictory: [],
    resolvers: [],
    humanReasons: [],
    confidence: { value: 0.7, meaning: "COMPLETENESS_OF_THIS_DECISION", calibrated: false },
    provenance: "test",
    ...over,
  };
}

describe("escalation: registered vocabulary", () => {
  it("declares the escalation reason classes", () => {
    expect([...ESCALATION_REASONS]).toEqual([
      "MISSING_INFORMATION",
      "AMBIGUITY",
      "CONTRADICTION",
      "UNAVAILABLE_RESOLVER",
      "HUMAN_ONLY",
    ]);
  });

  it("declares the closed human-only vocabulary", () => {
    expect([...HUMAN_ONLY_REASONS]).toEqual([
      "OWNER_DECISION_REQUIRED",
      "IRREDUCIBLE_AMBIGUITY",
      "CONFLICTING_PROTECTED_POLICY",
      "HUMAN_ONLY_EVIDENCE",
      "UNRESOLVED_AUTHORIZATION",
    ]);
  });

  it("declares the resolver route kinds", () => {
    expect([...RESOLVER_KINDS]).toEqual([
      "SEARCH",
      "DETERMINISTIC_TOOL",
      "DEEPER_REASONING",
      "TEMPORARY_WORKER",
      "VERIFICATION",
      "MODEL_FABRIC",
      "HUMAN",
      "OWNER_DECISION",
    ]);
  });
});

describe("escalation: composed from the existing signal, never re-derived", () => {
  it("carries signal facts through unchanged", () => {
    const decision = decideEscalation(input());
    expect(decision.fromSignal.taskType).toBe("intent/classify");
    expect(decision.fromSignal.inputFingerprint).toBe("fp-abc");
    expect(decision.fromSignal.abstainProbability).toBe(0.62);
    expect(decision.fromSignal.abstainReasons).toEqual(["AMBIGUOUS"]);
  });

  it("does not reinterpret the abstain probability as an error rate", () => {
    const decision = decideEscalation(input()) as unknown as Record<string, unknown>;
    for (const key of ["errorRate", "errorProbability", "unsafety", "unsafetyProbability"]) {
      expect(Object.keys(decision)).not.toContain(key);
      expect(Object.keys(decision.confidence as Record<string, unknown>)).not.toContain(key);
    }
  });

  it("rejects a signal that never abstained", () => {
    const bad = { ...signal(), abstained: false };
    expect(() => decideEscalation(input({ signal: bad as never }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_FROM_NON_ABSTAINED" }),
    );
  });

  it("rejects signal reasons outside the closed abstention vocabulary", () => {
    const bad = { ...signal(), reasons: ["LOW_CONFIDENCE"] };
    expect(() => decideEscalation(input({ signal: bad as never }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_BAD_REASON" }),
    );
  });

  it("rejects a non-object or missing signal", () => {
    expect(() => decideEscalation(input({ signal: undefined as never }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_INVALID_INPUT" }),
    );
  });
});

describe("escalation: can_continue is derived, never supplied", () => {
  it("continues when nothing is missing, ambiguous, contradictory, or human", () => {
    const decision = decideEscalation(input());
    expect(decision.can_continue).toBe(true);
    expect(decision.requires_human).toBe(false);
  });

  it("blocks on missing information even at high confidence", () => {
    const decision = decideEscalation(
      input({
        missing: [{ id: "m1", description: "owner policy text" }],
        confidence: { value: 0.99, meaning: "COMPLETENESS_OF_THIS_DECISION", calibrated: false },
      }),
    );
    expect(decision.can_continue).toBe(false);
  });

  it("blocks on ambiguity", () => {
    const decision = decideEscalation(
      input({ ambiguous: [{ id: "a1", description: "two readings", options: ["x", "y"] }] }),
    );
    expect(decision.can_continue).toBe(false);
  });

  it("blocks on a preserved contradiction", () => {
    const decision = decideEscalation(
      input({
        contradictory: [
          {
            id: "c1",
            description: "two sources disagree",
            claims: [
              { claim: "allow", source: "policy-a" },
              { claim: "deny", source: "policy-b" },
            ],
          },
        ],
      }),
    );
    expect(decision.can_continue).toBe(false);
  });

  it("rejects a caller-supplied verdict", () => {
    for (const key of ["can_continue", "requires_human", "disposition", "disposedBy", "p25Disposition"]) {
      expect(() => decideEscalation({ ...input(), [key]: true } as never)).toThrowError(
        expect.objectContaining({ code: "ESCALATION_DERIVED_FIELD_REJECTED" }),
      );
    }
  });
});

describe("escalation: requires_human means one thing", () => {
  it("is false at rock-bottom confidence with no human-only reason", () => {
    const decision = decideEscalation(
      input({ confidence: { value: 0.01, meaning: "COMPLETENESS_OF_THIS_DECISION", calibrated: false } }),
    );
    expect(decision.requires_human).toBe(false);
    expect(decision.can_continue).toBe(true);
  });

  it("is true exactly when a human-only reason is recorded", () => {
    const decision = decideEscalation(input({ humanReasons: ["OWNER_DECISION_REQUIRED"] }));
    expect(decision.requires_human).toBe(true);
    expect(decision.can_continue).toBe(false);
    expect(decision.humanReasons).toEqual(["OWNER_DECISION_REQUIRED"]);
  });

  it("rejects a human reason outside the closed vocabulary", () => {
    expect(() => decideEscalation(input({ humanReasons: ["SEEMS_RISKY"] as never }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_HUMAN_REASON_REQUIRED" }),
    );
  });

  it("carries no approval semantics", () => {
    const decision = decideEscalation(input({ humanReasons: ["HUMAN_ONLY_EVIDENCE"] }));
    const keys = Object.keys(decision as unknown as Record<string, unknown>);
    for (const banned of ["humanApproval", "approved", "approval", "ownerApproval"]) {
      expect(keys).not.toContain(banned);
    }
  });
});

describe("escalation: missing, ambiguity, contradiction stay explicit", () => {
  it("preserves missing items with their evidence refs", () => {
    const decision = decideEscalation(
      input({ missing: [{ id: "m1", description: "policy text", evidenceRef: "ev-9" }] }),
    );
    expect(decision.missing).toEqual([{ id: "m1", description: "policy text", evidenceRef: "ev-9" }]);
  });

  it("never encodes missing as complete", () => {
    const decision = decideEscalation(input({ missing: [{ id: "m1", description: "x" }] }));
    const keys = Object.keys(decision as unknown as Record<string, unknown>);
    for (const banned of ["complete", "provenComplete", "noMissing"]) {
      expect(keys).not.toContain(banned);
    }
  });

  it("rejects an ambiguity with fewer than two options", () => {
    expect(() =>
      decideEscalation(input({ ambiguous: [{ id: "a1", description: "one reading", options: ["x"] }] })),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_AMBIGUITY_NEEDS_OPTIONS" }));
  });

  it("rejects a contradiction with a single claim", () => {
    expect(() =>
      decideEscalation(
        input({
          contradictory: [{ id: "c1", description: "solo", claims: [{ claim: "x", source: "s" }] }],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_CONTRADICTION_NEEDS_CLAIMS" }));
  });

  it("rejects an unsourced claim", () => {
    expect(() =>
      decideEscalation(
        input({
          contradictory: [
            { id: "c1", description: "d", claims: [{ claim: "x", source: "s" }, { claim: "y", source: "" }] },
          ],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_CONTRADICTION_NEEDS_CLAIMS" }));
  });

  it("preserves both sides with no winner", () => {
    const decision = decideEscalation(
      input({
        contradictory: [
          {
            id: "c1",
            description: "d",
            claims: [
              { claim: "allow", source: "policy-a" },
              { claim: "deny", source: "policy-b" },
            ],
          },
        ],
      }),
    );
    expect(decision.contradictory[0]!.claims).toHaveLength(2);
    const keys = Object.keys(decision as unknown as Record<string, unknown>);
    for (const banned of ["winner", "resolution", "resolved", "chosenClaim"]) {
      expect(keys).not.toContain(banned);
    }
  });

  it("rejects malformed items", () => {
    expect(() => decideEscalation(input({ missing: [{ id: "", description: "x" }] }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_BAD_ITEM" }),
    );
    expect(() => decideEscalation(input({ missing: "none" as never }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_INVALID_INPUT" }),
    );
  });
});

describe("escalation: resolvers recommend, never run", () => {
  it("records a machine resolver as a recommendation only", () => {
    const decision = decideEscalation(
      input({
        resolvers: [{ kind: "SEARCH", target: "policy-index", description: "look up the text", availability: "AVAILABLE" }],
      }),
    );
    expect(decision.resolvers).toHaveLength(1);
    expect(decision.can_continue).toBe(true);
  });

  it("keeps an unavailable resolver unavailable with its blocker", () => {
    const decision = decideEscalation(
      input({
        resolvers: [
          {
            kind: "MODEL_FABRIC",
            target: "frontier-review",
            description: "needs blocked fabric",
            availability: "UNAVAILABLE",
            blockerRef: "REQ-p18-model-fabric",
          },
        ],
      }),
    );
    expect(decision.resolvers[0]!.availability).toBe("UNAVAILABLE");
    expect(decision.resolvers[0]!.blockerRef).toBe("REQ-p18-model-fabric");
  });

  it("rejects an unavailable resolver with no blocker", () => {
    expect(() =>
      decideEscalation(
        input({
          resolvers: [{ kind: "HUMAN", target: "owner", description: "ask", availability: "UNAVAILABLE" }],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_UNAVAILABLE_NEEDS_BLOCKER" }));
  });

  it("rejects an unregistered resolver kind", () => {
    expect(() =>
      decideEscalation(
        input({
          resolvers: [{ kind: "ASK_ORACLE", target: "x", description: "y", availability: "AVAILABLE" } as never],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_BAD_ITEM" }));
  });

  it("sorts resolvers canonically from scrambled input", () => {
    const routes = [
      { kind: "VERIFICATION" as const, target: "v", description: "v", availability: "AVAILABLE" as const },
      { kind: "SEARCH" as const, target: "s", description: "s", availability: "AVAILABLE" as const },
    ];
    const a = decideEscalation(input({ resolvers: routes }));
    const b = decideEscalation(input({ resolvers: [...routes].reverse() }));
    expect(a.resolvers.map((r) => r.kind)).toEqual(b.resolvers.map((r) => r.kind));
    expect(a.resolvers.map((r) => r.kind)).toEqual(["SEARCH", "VERIFICATION"]);
  });
});

describe("escalation: authority, execution, persona, secrets rejected first", () => {
  it("rejects authority claims with their own code", () => {
    for (const key of ["authorized", "approved", "canExecute", "executeNow", "policyBypass", "ownerOverride", "mergeAuthority", "grantApproved", "p25Approved"]) {
      expect(() => decideEscalation({ ...input(), [key]: true } as never)).toThrowError(
        expect.objectContaining({ code: "ESCALATION_AUTHORITY_REJECTED" }),
      );
    }
  });

  it("rejects execution residue with its own code", () => {
    for (const key of ["spawnWorker", "runTool", "toolResult", "messagedHuman", "executed", "escalated"]) {
      expect(() => decideEscalation({ ...input(), [key]: "x" } as never)).toThrowError(
        expect.objectContaining({ code: "ESCALATION_EXECUTION_REJECTED" }),
      );
    }
  });

  it("finds violations nested inside resolvers, not only at the top level", () => {
    expect(() =>
      decideEscalation(
        input({
          resolvers: [
            { kind: "HUMAN", target: "owner", description: "ask", availability: "AVAILABLE", ownerOverride: true } as never,
          ],
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_AUTHORITY_REJECTED" }));
  });

  it("rejects stored persona and raw secrets", () => {
    expect(() => decideEscalation({ ...input(), persona: "careful" } as never)).toThrowError(
      expect.objectContaining({ code: "ESCALATION_PERSONALITY_REJECTED" }),
    );
    expect(() => decideEscalation({ ...input(), apiKey: "sk-x" } as never)).toThrowError(
      expect.objectContaining({ code: "ESCALATION_SECRET_REJECTED" }),
    );
  });

  it("reports a smuggled authority claim as itself, never as an extra key", () => {
    try {
      decideEscalation({ ...input(), policyBypass: true } as never);
      throw new Error("expected rejection");
    } catch (error) {
      expect((error as { code?: string }).code).toBe("ESCALATION_AUTHORITY_REJECTED");
    }
  });

  it("rejects genuinely unknown fields", () => {
    expect(() => decideEscalation({ ...input(), urgency: 9 } as never)).toThrowError(
      expect.objectContaining({ code: "ESCALATION_UNKNOWN_FIELD" }),
    );
  });

  it("emits no composite score anywhere", () => {
    const keys = JSON.stringify(decideEscalation(input()));
    for (const banned of ["urgency", "escalationScore", "safetyScore", "humanScore", "severity"]) {
      expect(keys).not.toContain(banned);
    }
  });
});

describe("escalation: confidence has one meaning", () => {
  it("rejects a foreign meaning", () => {
    expect(() =>
      decideEscalation(input({ confidence: { value: 0.5, meaning: "ERROR_RATE", calibrated: false } as never })),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_CONFIDENCE_INVALID" }));
  });

  it("rejects non-finite and out-of-range values", () => {
    for (const value of [0, -0.1, 1.1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() =>
        decideEscalation(input({ confidence: { value, meaning: "COMPLETENESS_OF_THIS_DECISION", calibrated: false } })),
      ).toThrowError(expect.objectContaining({ code: "ESCALATION_CONFIDENCE_INVALID" }));
    }
  });

  it("accepts raw confidence that says it is raw", () => {
    const decision = decideEscalation(input());
    expect(decision.confidence.calibrated).toBe(false);
    expect(decision.confidence.meaning).toBe("COMPLETENESS_OF_THIS_DECISION");
  });

  it("requires a calibration ref for a calibrated claim", () => {
    expect(() =>
      decideEscalation(
        input({ confidence: { value: 0.8, meaning: "COMPLETENESS_OF_THIS_DECISION", calibrated: true } }),
      ),
    ).toThrowError(expect.objectContaining({ code: "ESCALATION_CALIBRATION_REF_REQUIRED" }));
  });

  it("accepts calibrated confidence with its evidence ref", () => {
    const decision = decideEscalation(
      input({
        confidence: {
          value: 0.8,
          meaning: "COMPLETENESS_OF_THIS_DECISION",
          calibrated: true,
          calibrationRef: "calibration:fit-temperature-scaling",
        },
      }),
    );
    expect(decision.confidence.calibrated).toBe(true);
  });
});

describe("escalation: proposal only, determinism, shape", () => {
  it("always proposes and leaves disposal to P25", () => {
    const decision = decideEscalation(input());
    expect(decision.disposition).toBe("PROPOSED");
    expect(decision.disposedBy).toBe("P25");
    expect(decision.p25Disposition).toBe("PENDING");
  });

  it("is deterministic from scrambled input", () => {
    const base = input({
      missing: [
        { id: "m2", description: "b" },
        { id: "m1", description: "a" },
      ],
      humanReasons: ["UNRESOLVED_AUTHORIZATION", "OWNER_DECISION_REQUIRED"],
      evidenceRefs: ["ev-2", "ev-1"],
    });
    const scrambled: EscalationInput = {
      ...base,
      missing: [...base.missing].reverse(),
      humanReasons: [...base.humanReasons].reverse(),
      evidenceRefs: [...(base.evidenceRefs ?? [])].reverse(),
    };
    expect(JSON.stringify(decideEscalation(base))).toBe(JSON.stringify(decideEscalation(scrambled)));
  });

  it("does not mutate caller input", () => {
    const given = input({ missing: [{ id: "m1", description: "x" }] });
    const snapshot = JSON.stringify(given);
    decideEscalation(given);
    expect(JSON.stringify(given)).toBe(snapshot);
  });

  it("rejects empty decisionId, provenance, and malformed evidenceRefs", () => {
    expect(() => decideEscalation(input({ decisionId: "" }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_INVALID_INPUT" }),
    );
    expect(() => decideEscalation(input({ provenance: "  " }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_INVALID_INPUT" }),
    );
    expect(() => decideEscalation(input({ evidenceRefs: [""] }))).toThrowError(
      expect.objectContaining({ code: "ESCALATION_INVALID_INPUT" }),
    );
  });

  it("emits no verdict, grant, or execution field", () => {
    const keys = Object.keys(decideEscalation(input()) as unknown as Record<string, unknown>);
    for (const banned of ["verdict", "grant", "permission", "approved", "winner", "route", "spawn"]) {
      expect(keys).not.toContain(banned);
    }
  });
});
