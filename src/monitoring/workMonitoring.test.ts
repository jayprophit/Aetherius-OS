import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { DurableEventLog } from "../realtime/log";
import { LoopbackTransport } from "../realtime/transport";
import type { Subscriber } from "../realtime/types";
import {
  composeWorkView,
  evaluateAlerts,
  streamProgress,
  subscribe,
} from "./workMonitoring";
import type { ThresholdRule, WorkSubscription } from "./workMonitoring";

const AT = "2026-09-27T10:00:00.000Z";

function makeTransport(): LoopbackTransport {
  const root = mkdtempSync(join(tmpdir(), "wm-"));
  const log = new DurableEventLog(new FileStateStore(root, 1), "aetherius-os", {
    now: () => AT,
  });
  return new LoopbackTransport(log);
}

const sub = (id = "op-1", channels: readonly string[] = ["work"]): Subscriber => ({
  subscriberId: id,
  channels,
});

function subscription(over: Partial<WorkSubscription> = {}): WorkSubscription {
  return subscribe({
    subscriptionId: "sub-1",
    subscriber: sub(),
    runIds: [],
    routineIds: [],
    channels: ["work"],
    thresholds: [],
    ...over,
  } as unknown as Record<string, unknown>);
}

function publishWork(
  transport: LoopbackTransport,
  events: Array<{ kind: string; payload: Record<string, unknown> }>,
): void {
  for (const event of events) {
    transport.publish(sub(), "work", event.kind, event.payload);
  }
}

const summarizeOf = (runs: Record<string, { state: string; failed: number; waiting: number; ready: number; attempts: number }>) =>
  (runId: string) => {
    const run = runs[runId];
    if (run === undefined) return null;
    return {
      state: run.state,
      steps: [{ state: "FAILED", attempts: run.attempts }, { state: "DONE", attempts: 1 }].slice(0, run.failed > 0 ? 2 : 1),
      waiting_approval: Array.from({ length: run.waiting }, (_, i) => `s${i}`),
      next_ready: Array.from({ length: run.ready }, (_, i) => `r${i}`),
    };
  };

const inspectOf = (routines: Array<{ routine_id: string; enabled: boolean; last_state: string | null }>) => () =>
  routines.map((r) => ({ routine_id: r.routine_id, enabled: r.enabled, last_state: r.last_state }));

describe("work monitoring: subscribe binds without storing", () => {
  it("validates and returns the subscription for the caller to hold", () => {
    const bound = subscription({ runIds: ["run-2", "run-1"], routineIds: ["rt-1"] });
    expect(bound.subscriptionId).toBe("sub-1");
    expect(bound.runIds).toEqual(["run-1", "run-2"]);
    expect(bound.routineIds).toEqual(["rt-1"]);
  });

  it("refuses channels outside the subscriber allowlist", () => {
    expect(() => subscription({ channels: ["work", "secret"] })).toThrowError(
      expect.objectContaining({ code: "MONITOR_CHANNEL_DENIED" }),
    );
  });

  it("rejects unknown subscription fields", () => {
    expect(() => subscribe({ subscriptionId: "s", subscriber: sub(), pollIntervalMs: 500 } as never)).toThrowError(
      expect.objectContaining({ code: "MONITOR_EXECUTION_REJECTED" }),
    );
  });

  it("rejects invented telemetry and progress fields before shape errors", () => {
    for (const key of ["percentComplete", "eta", "cpuUsage", "tokenUsage", "costUsd"]) {
      expect(() =>
        subscribe({ subscriptionId: "s", subscriber: sub(), [key]: 1 } as never),
      ).toThrowError(expect.objectContaining({ code: "MONITOR_TELEMETRY_REJECTED" }));
    }
  });

  it("rejects authority, execution, persona, and secret keys with their own codes", () => {
    expect(() => subscribe({ subscriptionId: "s", subscriber: sub(), authorized: true } as never)).toThrowError(
      expect.objectContaining({ code: "MONITOR_AUTHORITY_REJECTED" }),
    );
    expect(() => subscribe({ subscriptionId: "s", subscriber: sub(), spawnWorker: "w" } as never)).toThrowError(
      expect.objectContaining({ code: "MONITOR_EXECUTION_REJECTED" }),
    );
    expect(() => subscribe({ subscriptionId: "s", subscriber: sub(), persona: "x" } as never)).toThrowError(
      expect.objectContaining({ code: "MONITOR_PERSONALITY_REJECTED" }),
    );
    expect(() => subscribe({ subscriptionId: "s", subscriber: sub(), apiKey: "k" } as never)).toThrowError(
      expect.objectContaining({ code: "MONITOR_SECRET_REJECTED" }),
    );
  });

  it("rejects duplicate ruleIds and unknown rule fields", () => {
    const rule: ThresholdRule = { ruleId: "r1", scope: "run", field: "state", operator: "==", value: "FAILED" };
    expect(() => subscription({ thresholds: [rule, rule] })).toThrowError(
      expect.objectContaining({ code: "MONITOR_BAD_THRESHOLD" }),
    );
    expect(() => subscription({ thresholds: [{ ...rule, window: 5 } as never] })).toThrowError(
      expect.objectContaining({ code: "MONITOR_UNKNOWN_FIELD" }),
    );
  });

  it("rejects unregistered operators and non-registered fields", () => {
    expect(() =>
      subscription({ thresholds: [{ ruleId: "r1", scope: "run", field: "state", operator: "~=", value: "x" } as never] }),
    ).toThrowError(expect.objectContaining({ code: "MONITOR_BAD_THRESHOLD" }));
    expect(() =>
      subscription({ thresholds: [{ ruleId: "r1", scope: "run", field: "progress", operator: "==", value: 1 }] }),
    ).toThrowError(expect.objectContaining({ code: "MONITOR_UNKNOWN_THRESHOLD_FIELD" }));
    expect(() =>
      subscription({ thresholds: [{ ruleId: "r1", scope: "run", field: "state", operator: "==", value: Number.NaN }] }),
    ).toThrowError(expect.objectContaining({ code: "MONITOR_BAD_THRESHOLD" }));
  });
});

describe("work monitoring: progress stream is pull, not a poller", () => {
  it("streams backlog frames in channel/seq order with both timestamps", () => {
    const transport = makeTransport();
    publishWork(transport, [
      { kind: "work.step", payload: { subject: "run-1", n: 1 } },
      { kind: "work.state", payload: { subject: "run-1", n: 2 } },
      { kind: "work.step", payload: { n: 3 } },
    ]);
    const bound = subscription();
    const { frames, headByChannel } = streamProgress({ subscription: bound, transport, observedAt: AT });
    expect(frames).toHaveLength(3);
    expect(frames.map((f) => f.seq)).toEqual([1, 2, 3]);
    expect(frames[2]!.subject).toBe("UNKNOWN");
    expect(frames[0]!.eventAt).toBe(AT);
    expect(frames[0]!.observedAt).toBe(AT);
    expect(headByChannel).toEqual({ work: 3 });
  });

  it("resumes strictly after the caller-supplied cursor", () => {
    const transport = makeTransport();
    publishWork(transport, [
      { kind: "work.step", payload: { subject: "run-1" } },
      { kind: "work.step", payload: { subject: "run-1" } },
    ]);
    const bound = subscription();
    const second = streamProgress({ subscription: bound, transport, fromSeq: { work: 1 }, observedAt: AT });
    expect(second.frames.map((f) => f.seq)).toEqual([2]);
  });

  it("returns no frames — not completion — when nothing new arrived", () => {
    const transport = makeTransport();
    const bound = subscription();
    const { frames } = streamProgress({ subscription: bound, transport, observedAt: AT });
    expect(frames).toEqual([]);
  });

  it("requires caller-supplied observation time and a sane limit", () => {
    const transport = makeTransport();
    const bound = subscription();
    expect(() => streamProgress({ subscription: bound, transport, observedAt: "" })).toThrowError(
      expect.objectContaining({ code: "MONITOR_OBSERVED_AT_REQUIRED" }),
    );
    expect(() => streamProgress({ subscription: bound, transport, observedAt: AT, limit: 0 })).toThrowError(
      expect.objectContaining({ code: "MONITOR_BAD_LIMIT" }),
    );
  });

  it("never dumps full payloads into frames", () => {
    const transport = makeTransport();
    transport.publish(sub(), "work", "work.step", { subject: "run-1", secretRef: "ref:tok", token: "SHOULD-NOT-APPEAR" });
    const bound = subscription();
    const { frames } = streamProgress({ subscription: bound, transport, observedAt: AT });
    expect(JSON.stringify(frames)).not.toContain("SHOULD-NOT-APPEAR");
  });
});

describe("work monitoring: unknown stays unknown", () => {
  it("marks a run with no summary UNKNOWN, never complete", () => {
    const bound = subscription({ runIds: ["run-ghost"] });
    const view = composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({}),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    expect(view.runs).toEqual([{ runId: "run-ghost", status: "UNKNOWN" }]);
  });

  it("marks a routine with no inspection UNKNOWN", () => {
    const bound = subscription({ routineIds: ["rt-ghost"] });
    const view = composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({}),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    expect(view.routines).toEqual([{ routineId: "rt-ghost", status: "UNKNOWN" }]);
  });

  it("an unobserved subject never fires a threshold", () => {
    const bound = subscription({
      runIds: ["run-ghost"],
      thresholds: [{ ruleId: "r1", scope: "run", field: "failedStepCount", operator: ">=", value: 0 }],
    });
    const alerts = evaluateAlerts(bound, [{ runId: "run-ghost", status: "UNKNOWN" }], [], AT);
    expect(alerts).toEqual([]);
  });
});

describe("work monitoring: alerts from thresholds, not inference", () => {
  it("fires when a failed step count crosses the threshold", () => {
    const bound = subscription({
      runIds: ["run-1"],
      thresholds: [{ ruleId: "r-fail", scope: "run", field: "failedStepCount", operator: ">=", value: 1 }],
    });
    const view = composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({ "run-1": { state: "RUNNING", failed: 1, waiting: 0, ready: 2, attempts: 3 } }),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    expect(view.alerts).toHaveLength(1);
    expect(view.alerts[0]!.alertId).toBe("sub-1:r-fail:run-1");
    expect(view.alerts[0]!.observedAt).toBe(AT);
  });

  it("stays silent below the threshold", () => {
    const bound = subscription({
      runIds: ["run-1"],
      thresholds: [{ ruleId: "r-fail", scope: "run", field: "failedStepCount", operator: ">=", value: 2 }],
    });
    const alerts = evaluateAlerts(
      bound,
      [{ runId: "run-1", status: "REPORTED", summary: { state: "RUNNING", failedStepCount: 1, waitingApprovalCount: 0, nextReadyCount: 1, maxAttempts: 2 } }],
      [],
      AT,
    );
    expect(alerts).toEqual([]);
  });

  it("fires routine alerts on projected routine state", () => {
    const bound = subscription({
      routineIds: ["rt-1"],
      thresholds: [{ ruleId: "r-dis", scope: "routine", field: "enabled", operator: "==", value: false }],
    });
    const view = composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({}),
      inspectRoutines: inspectOf([{ routine_id: "rt-1", enabled: false, last_state: "PAUSED" }]),
      observedAt: AT,
    });
    expect(view.alerts).toHaveLength(1);
    expect(view.alerts[0]!.subject).toBe("rt-1");
  });

  it("never coerces across types: a string threshold does not match a number", () => {
    const bound = subscription({
      runIds: ["run-1"],
      thresholds: [{ ruleId: "r-x", scope: "run", field: "failedStepCount", operator: "==", value: "1" }],
    });
    const view = composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({ "run-1": { state: "RUNNING", failed: 1, waiting: 0, ready: 0, attempts: 1 } }),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    expect(view.alerts).toEqual([]);
  });
});

describe("work monitoring: the join composes without duplicating", () => {
  it("composes frames, summaries, routines, and alerts in one view", () => {
    const transport = makeTransport();
    publishWork(transport, [{ kind: "work.state", payload: { subject: "run-1" } }]);
    const bound = subscription({
      runIds: ["run-1"],
      routineIds: ["rt-1"],
      thresholds: [{ ruleId: "r-w", scope: "run", field: "waitingApprovalCount", operator: ">=", value: 1 }],
    });
    const view = composeWorkView({
      subscription: bound,
      transport,
      summarize: summarizeOf({ "run-1": { state: "WAITING", failed: 0, waiting: 2, ready: 0, attempts: 1 } }),
      inspectRoutines: inspectOf([{ routine_id: "rt-1", enabled: true, last_state: "OK" }]),
      observedAt: AT,
    });
    expect(view.frames).toHaveLength(1);
    expect(view.runs[0]!.status).toBe("REPORTED");
    expect(view.routines[0]!.status).toBe("REPORTED");
    expect(view.alerts).toHaveLength(1);
    expect(view.subscriptionId).toBe("sub-1");
  });

  it("carries no execution, scheduling, auth, or verdict surface", () => {
    const view = composeWorkView({
      subscription: subscription(),
      transport: makeTransport(),
      summarize: summarizeOf({}),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    const keys = JSON.stringify(view);
    for (const banned of ["spawn", "terminate", "schedule", "authorized", "approved", "verdict", "percent", "eta", "cpu", "token"]) {
      expect(keys.toLowerCase()).not.toContain(banned);
    }
  });

  it("is deterministic from scrambled input", () => {
    const transport = makeTransport();
    publishWork(transport, [
      { kind: "work.step", payload: { subject: "run-2" } },
      { kind: "work.step", payload: { subject: "run-1" } },
    ]);
    const forward = subscription({ runIds: ["run-1", "run-2"] });
    const reversed = subscription({ runIds: ["run-2", "run-1"] });
    const summarize = summarizeOf({
      "run-1": { state: "RUNNING", failed: 0, waiting: 0, ready: 1, attempts: 1 },
      "run-2": { state: "DONE", failed: 0, waiting: 0, ready: 0, attempts: 1 },
    });
    const base = { transport, summarize, inspectRoutines: inspectOf([]), observedAt: AT } as const;
    expect(JSON.stringify(composeWorkView({ subscription: forward, ...base }))).toBe(
      JSON.stringify(composeWorkView({ subscription: reversed, ...base })),
    );
  });

  it("does not mutate the subscription or caller data", () => {
    const bound = subscription({ runIds: ["run-1"] });
    const snapshot = JSON.stringify(bound);
    composeWorkView({
      subscription: bound,
      transport: makeTransport(),
      summarize: summarizeOf({ "run-1": { state: "RUNNING", failed: 0, waiting: 0, ready: 0, attempts: 1 } }),
      inspectRoutines: inspectOf([]),
      observedAt: AT,
    });
    expect(JSON.stringify(bound)).toBe(snapshot);
  });
});
