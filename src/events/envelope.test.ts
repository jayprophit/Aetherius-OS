import { describe, expect, it } from "vitest";
import {
  canonicalEnvelope,
  envelopeBridgeAction,
  envelopeRealtimeEvent,
  envelopeSchedulerEvent,
  envelopeStewardReport,
  envelopeWorkflowEvent,
  epochMs,
  validateEnvelope,
} from "./envelope";
import type { EventEnvelope } from "./envelope";

describe("unified event envelope", () => {
  it("wraps the scheduler seed preserving identity and dual timestamps", () => {
    const enveloped = envelopeSchedulerEvent({
      event_id: "pr13",
      event_type: "REVIEW.PR_OPENED",
      source: "test",
      occurred_at: 1000,
      received_at: 1005,
      payload: { n: 13 },
      provenance: "fixture",
      correlation_id: "c1",
    });
    expect(enveloped.eventId).toBe("pr13");
    expect(enveloped.eventType).toBe("scheduler:REVIEW.PR_OPENED");
    expect(enveloped.occurredAt).toBe(1000);
    expect(enveloped.receivedAt).toBe(1005);
    expect(enveloped.correlationId).toBe("c1");
    expect(enveloped.causationId).toBeUndefined();
    expect(enveloped.payload).toEqual({ n: 13 });
    expect(validateEnvelope(enveloped)).toEqual([]);
  });

  it("wraps realtime events with deterministic channel:seq identity", () => {
    const enveloped = envelopeRealtimeEvent({ seq: 7, channel: "news", kind: "item", payload: { n: 1 }, at: "2026-09-24T00:00:00.000Z" });
    expect(enveloped.eventId).toBe("news:7");
    expect(enveloped.eventType).toBe("realtime:item");
    expect(enveloped.occurredAt).toBe(Date.parse("2026-09-24T00:00:00.000Z"));
    expect(enveloped.receivedAt).toBeUndefined();
    expect(validateEnvelope(enveloped)).toEqual([]);
  });

  it("wraps workflow history with run linkage", () => {
    const enveloped = envelopeWorkflowEvent("run-1", { at: "2026-09-24T00:00:01.000Z", seq: 3, kind: "step.succeeded", step_id: "s", detail: "ok" });
    expect(enveloped.eventId).toBe("run-1:3");
    expect(enveloped.workflowRunId).toBe("run-1");
    expect(enveloped.stepRunId).toBe("run-1:s");
    expect(enveloped.payload).toEqual({ stepId: "s", detail: "ok" });
    expect(validateEnvelope(enveloped)).toEqual([]);
  });

  it("wraps steward reports keeping the deterministic id and trigger class", () => {
    const enveloped = envelopeStewardReport({
      id: "steward-r-pull1",
      target: { repo: "r", kind: "pull", number: 1 },
      findings: [],
      readiness: { verdict: "ready", blockingCount: 0, warningCount: 0, reasons: [], merge_authority: false },
      trigger: "scheduled",
      generatedAt: "2026-09-24T00:00:00.000Z",
    });
    expect(enveloped.eventId).toBe("steward-r-pull1");
    expect(enveloped.eventType).toBe("steward:review-ready");
    expect(enveloped.causationId).toBe("steward-trigger:scheduled");
    expect(enveloped.payload.target).toEqual({ repo: "r", kind: "pull", number: 1 });
    expect(validateEnvelope(enveloped)).toEqual([]);
  });

  it("wraps bridge actions with explicit run/step causation and caller time", () => {
    const enveloped = envelopeBridgeAction(
      {
        actionId: "run-1:s1",
        principal: "genesis",
        sessionId: "sess",
        workspace: "ws",
        action: "bridge:fs:read",
        resource: "f",
        ownerMode: "standard",
        provenance: { runId: "run-1", stepId: "s1", attempt: 1 },
        timeoutMs: 1000,
      },
      2000,
    );
    expect(enveloped.eventId).toBe("run-1:s1");
    expect(enveloped.causationId).toBe("run-1:s1");
    expect(enveloped.workflowRunId).toBe("run-1");
    expect(enveloped.principalId).toBe("genesis");
    expect(enveloped.occurredAt).toBe(2000);
    expect(validateEnvelope(enveloped)).toEqual([]);
  });

  it("missing optional correlation stays absent, never guessed", () => {
    const enveloped = envelopeRealtimeEvent({ seq: 1, channel: "c", kind: "k", payload: {}, at: "2026-09-24T00:00:00.000Z" });
    expect("correlationId" in enveloped).toBe(false);
    expect("causationId" in enveloped).toBe(false);
    expect("taskId" in enveloped).toBe(false);
  });

  it("rejects malformed envelopes and unparseable timestamps", () => {
    const base = envelopeRealtimeEvent({ seq: 1, channel: "c", kind: "k", payload: {}, at: "2026-09-24T00:00:00.000Z" });
    const bad: EventEnvelope = { ...base, eventId: "  ", eventType: "bad type!", occurredAt: -1, source: "", provenance: "" };
    expect(validateEnvelope(bad)).toEqual(
      expect.arrayContaining(["event-id", "event-type", "occurred-at", "source", "provenance"]),
    );
    expect(epochMs("not-a-date")).toBeNull();
    expect(epochMs(-5)).toBeNull();
    expect(epochMs(123)).toBe(123);
    expect(() =>
      envelopeWorkflowEvent("r", { at: "yesterday?", seq: 1, kind: "k" }),
    ).toThrowError(/unparseable occurredAt/);
  });

  it("serializes deterministically and preserves payloads byte-for-byte", () => {
    const payload = { nested: { a: [1, 2], b: "x" } };
    const a = envelopeSchedulerEvent({
      event_id: "e", event_type: "T", source: "s", occurred_at: 1, received_at: 2, payload, provenance: "p",
    });
    const b = envelopeSchedulerEvent({
      event_id: "e", event_type: "T", source: "s", occurred_at: 1, received_at: 2, payload, provenance: "p",
    });
    expect(canonicalEnvelope(a)).toBe(canonicalEnvelope(b));
    expect(JSON.parse(canonicalEnvelope(a)).payload).toEqual(payload);
  });
});
