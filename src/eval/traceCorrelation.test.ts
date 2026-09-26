import { describe, expect, it } from "vitest";
import type { EventEnvelope } from "../events/envelope";
import {
  LEG_STATES,
  TRACE_LEGS,
  correlateTrace,
  legsForEnvelope,
  normalizeAccounting,
  runTraceEvaluation,
} from "./traceCorrelation";
import * as traceCorrelation from "./traceCorrelation";
import type { AccountingInput, TraceCorrelation } from "./traceCorrelation";

const AT = "2026-09-26T00:00:00.000Z";

/**
 * Dimension-specific fixtures. Each envelope declares its own leg-bearing
 * eventType prefix, so no leg can be satisfied by an inherited default and
 * a shared builder cannot silently attribute one leg's event to another.
 */
function envelope(over: Partial<EventEnvelope> & { eventId: string; eventType: string }): EventEnvelope {
  return {
    schemaVersion: "1",
    domain: "workflow",
    occurredAt: 1_757_000_000_000,
    source: "test",
    payload: {},
    ...over,
  } as EventEnvelope;
}

function legEvent(leg: string, eventId: string, over: Partial<EventEnvelope> = {}): EventEnvelope {
  return envelope({ eventId, eventType: `${leg}:SOMETHING.HAPPENED`, ...over });
}

const CORR = "corr-1";

function trace(over: Partial<Parameters<typeof correlateTrace>[0]> = {}): TraceCorrelation {
  return correlateTrace({ correlationId: CORR, envelopes: [], ...over });
}

describe("leg vocabulary is the registered one", () => {
  it("declares exactly the ten legs the requirement names", () => {
    expect([...TRACE_LEGS]).toEqual([
      "reflex",
      "context",
      "model",
      "skill",
      "workflow",
      "worker",
      "policy",
      "approval",
      "action",
      "verification",
    ]);
  });

  it("keeps UNRECORDED distinct from OBSERVED, with no SKIPPED escape", () => {
    expect([...LEG_STATES]).toEqual(["OBSERVED", "UNRECORDED"]);
    expect(LEG_STATES).not.toContain("SKIPPED" as never);
    expect(LEG_STATES).not.toContain("PASSED" as never);
  });

  it("does not widen EventDomain, which has only five members", () => {
    // The ten trace legs are NOT event domains and must not become some.
    const names = Object.keys(traceCorrelation);
    expect(names).not.toContain("EVENT_DOMAINS");
    expect(names).not.toContain("EventDomain");
  });

  it("maps legs from the eventType prefix, and reports an unmappable envelope", () => {
    expect(legsForEnvelope(legEvent("reflex", "e1"))).toEqual(["reflex"]);
    expect(legsForEnvelope(envelope({ eventId: "e2", eventType: "totally:OTHER", domain: "nowhere" as never }))).toEqual([]);
  });
});

describe("correlation joins only what it names", () => {
  it("joins envelopes sharing the correlationId and excludes others", () => {
    const result = trace({
      envelopes: [
        legEvent("reflex", "e1", { correlationId: CORR }),
        legEvent("model", "e2", { correlationId: CORR }),
        legEvent("skill", "e3", { correlationId: "corr-OTHER" }),
      ],
    });
    expect(result.eventIds).toEqual(["e1", "e2"]);
    expect(result.legs.find((l) => l.leg === "reflex")!.state).toBe("OBSERVED");
    expect(result.legs.find((l) => l.leg === "model")!.state).toBe("OBSERVED");
    expect(result.legs.find((l) => l.leg === "skill")!.state).toBe("UNRECORDED");
  });

  it("never invents a correlation group for an envelope that lacks one", () => {
    const result = trace({ envelopes: [legEvent("reflex", "e1")] });
    expect(result.eventIds).toEqual([]);
    expect(result.legs.every((l) => l.state === "UNRECORDED")).toBe(true);
  });

  it("reports every registered leg, with UNRECORDED carrying a reason", () => {
    const result = trace({ envelopes: [legEvent("workflow", "e1", { correlationId: CORR })] });
    expect(result.legs.map((l) => l.leg)).toEqual([...TRACE_LEGS]);
    const reflex = result.legs.find((l) => l.leg === "reflex")!;
    expect(reflex.state).toBe("UNRECORDED");
    expect(reflex.reason).toContain("not evidence that the leg did not run");
    expect(result.incomplete).toBe(true);
  });

  it("orders events by occurrence time then id, not insertion order", () => {
    const result = trace({
      envelopes: [
        legEvent("model", "e3", { correlationId: CORR, occurredAt: 300 }),
        legEvent("reflex", "e1", { correlationId: CORR, occurredAt: 100 }),
        legEvent("skill", "e2", { correlationId: CORR, occurredAt: 200 }),
      ],
    });
    expect(result.eventIds).toEqual(["e1", "e2", "e3"]);
  });

  it("rejects a blank correlation id and duplicate event ids", () => {
    expect(() => trace({ correlationId: "" })).toThrowError(/correlation-id/);
    expect(() =>
      trace({ envelopes: [legEvent("reflex", "dup", { correlationId: CORR }), legEvent("model", "dup", { correlationId: CORR })] }),
    ).toThrowError(/event-id/);
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(() => trace({ vendor: "otel" } as never)).toThrowError(/unknown-field/);
  });
});

describe("correlation is not causation", () => {
  it("builds causation edges from causationId only", () => {
    const result = trace({
      envelopes: [
        legEvent("reflex", "e1", { correlationId: CORR, causationId: "e0" }),
        legEvent("model", "e2", { correlationId: CORR, causationId: "e1" }),
        legEvent("skill", "e3", { correlationId: CORR }),
      ],
    });
    // e0 is not in the group, so that edge is not asserted.
    expect(result.causationEdges).toEqual([{ from: "e1", to: "e2" }]);
  });

  it("reports no causal chain for a group that only correlates", () => {
    const result = trace({
      envelopes: [
        legEvent("reflex", "e1", { correlationId: CORR }),
        legEvent("model", "e2", { correlationId: CORR }),
      ],
    });
    expect(result.causationEdges).toEqual([]);
    expect(result.eventIds).toHaveLength(2);
  });
});

describe("token and cost accounting never fabricates", () => {
  it("reports both as UNAVAILABLE with reasons when nothing is supplied", () => {
    const accounting = normalizeAccounting(undefined);
    expect(accounting.tokens).toBeNull();
    expect(accounting.tokensState).toBe("UNAVAILABLE");
    expect(accounting.cost).toBeNull();
    expect(accounting.costState).toBe("UNAVAILABLE");
    expect(accounting.reason).toContain("no tokenizer runtime exists");
    expect(accounting.reason).toContain("not a zero cost");
  });

  it("OBSERVES a token count only with a value AND a source", () => {
    const withSource = normalizeAccounting({ tokens: 900, tokensSource: "instrumented" });
    expect(withSource.tokensState).toBe("OBSERVED");
    expect(withSource.tokens).toBe(900);
    // No source means not an observation, even with a value.
    const noSource = normalizeAccounting({ tokens: 900 });
    expect(noSource.tokensState).toBe("UNAVAILABLE");
    expect(noSource.tokens).toBeNull();
  });

  it("rejects NaN, Infinity and negative values rather than coercing them", () => {
    for (const bad of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const accounting = normalizeAccounting({ tokens: bad, tokensSource: "s" } as AccountingInput);
      expect(accounting.tokensState).toBe("UNAVAILABLE");
      expect(accounting.tokens).toBeNull();
    }
  });

  it("keeps an observed cost distinct from an invoiced one via its source", () => {
    const accounting = normalizeAccounting({ cost: 0.02, costSource: "provider-invoice:123" });
    expect(accounting.costState).toBe("OBSERVED");
    expect(accounting.costSource).toBe("provider-invoice:123");
  });
});

describe("eval runner", () => {
  function twoTraces(): TraceCorrelation[] {
    return [
      trace({
        correlationId: "corr-1",
        envelopes: [legEvent("reflex", "e1", { correlationId: "corr-1" }), legEvent("model", "e2", { correlationId: "corr-1" })],
        accounting: { tokens: 100, tokensSource: "s" },
      }),
      trace({
        correlationId: "corr-2",
        envelopes: [legEvent("skill", "e3", { correlationId: "corr-2" })],
        accounting: { tokens: 50, tokensSource: "s" },
      }),
    ];
  }

  it("orders traces deterministically from scrambled input", () => {
    const scrambled = [twoTraces()[1]!, twoTraces()[0]!];
    expect(runTraceEvaluation({ traces: scrambled }).traces.map((t) => t.correlationId)).toEqual(["corr-1", "corr-2"]);
  });

  it("counts per-leg coverage, including the unrecorded ones", () => {
    const evaluation = runTraceEvaluation({ traces: twoTraces() });
    expect(evaluation.legCoverage.map((c) => c.leg)).toEqual([...TRACE_LEGS]);
    const reflex = evaluation.legCoverage.find((c) => c.leg === "reflex")!;
    expect(reflex.observed).toBe(1);
    expect(reflex.unrecorded).toBe(1);
  });

  it("lists incomplete traces rather than dropping them", () => {
    const evaluation = runTraceEvaluation({ traces: twoTraces() });
    expect(evaluation.traces).toHaveLength(2);
    expect(evaluation.incompleteTraces).toEqual(["corr-1", "corr-2"]);
  });

  it("totals a dimension only when EVERY trace observed it", () => {
    // Both traces observed tokens, so the total is real.
    expect(runTraceEvaluation({ traces: twoTraces() }).totals.tokens).toBe(150);
    // Cost was never observed, so the aggregate is unavailable, not zero.
    expect(runTraceEvaluation({ traces: twoTraces() }).totals.cost).toBeNull();
  });

  it("does not subtotal a partially observed dimension", () => {
    const partial = [
      trace({ correlationId: "c1", envelopes: [], accounting: { tokens: 100, tokensSource: "s" } }),
      trace({ correlationId: "c2", envelopes: [] }),
    ];
    // Summing only c1 would silently understate, so the total is unavailable.
    const totals = runTraceEvaluation({ traces: partial }).totals;
    expect(totals.tokens).toBeNull();
    expect(totals.traces).toBe(2);
  });

  it("produces no composite score and no ranking", () => {
    const evaluation = runTraceEvaluation({ traces: twoTraces() });
    expect(evaluation.noCompositeScore).toBe(true);
    for (const banned of ["score", "rating", "rank", "winner", "best", "grade", "percent", "correlation"]) {
      expect(Object.keys(evaluation)).not.toContain(banned);
    }
  });

  it("rejects a non-array trace set", () => {
    expect(() => runTraceEvaluation({ traces: null as never })).toThrowError(/traces/);
  });
});

describe("vendor neutrality", () => {
  it("imports no external observability dependency", () => {
    const names = Object.keys(traceCorrelation);
    for (const banned of ["otel", "opentelemetry", "jaeger", "datadog", "zipkin", "prometheus", "export", "span"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("adds no provider, store, registry or runner of its own", () => {
    const names = Object.keys(traceCorrelation);
    for (const banned of ["provider", "store", "registry", "client", "sdk", "daemon", "service"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});
