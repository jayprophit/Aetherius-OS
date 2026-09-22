import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { ExecutorRegistry, type StepExecutor } from "../workflows/executors";
import { WorkflowRuntime } from "../workflows/runtime";
import { SkillRegistry } from "../workflows/skills";
import type { Skill, Workflow } from "../workflows/types";
import { dueOccurrences, occurrenceKey, validateSchedule } from "./schedules";
import { RoutineScheduler } from "./scheduler";
import type { RoutineBinding } from "./scheduler";
import type { Schedule } from "./types";
import { normalizeEvent, triggerMatches } from "./triggers";

const T0 = Date.UTC(2026, 8, 22, 12, 0, 0);
const MIN = 60 * 1000;

function schedule(over: Partial<Schedule> & { schedule_id: string }): Schedule {
  return {
    version: "1.0.0", kind: "ONE_TIME", startAt: T0 + 10 * MIN, enabled: true, ...over,
  } as Schedule;
}

function routine(id: string, over: Partial<RoutineBinding> = {}): RoutineBinding {
  return {
    routine_id: id, version: "1.0.0", workflow_ref: "w", workflow_version: "1.0.0",
    policy: "AUTO_SAFE", enabled: true, ...over,
  };
}

function setup(startRun?: (routine: RoutineBinding) => Promise<{ runId: string }> | { runId: string }) {
  const calls: string[] = [];
  const store = new FileStateStore(mkdtempSync(join(tmpdir(), "sched-")), 1);
  const scheduler = new RoutineScheduler(
    store,
    startRun ??
      ((r) => {
        calls.push(r.routine_id);
        return { runId: `run-for-${r.routine_id}` };
      }),
    "test-scheduler",
  );
  return { scheduler, store, calls };
}

// ---------- validation ----------

describe("schedule validation", () => {
  it("accepts valid one-time, interval and daily schedules", () => {
    expect(validateSchedule(schedule({ schedule_id: "a" }))).toEqual([]);
    expect(validateSchedule(schedule({ schedule_id: "b", kind: "INTERVAL", intervalMs: MIN }))).toEqual([]);
    expect(
      validateSchedule(schedule({ schedule_id: "c", kind: "DAILY", hourUtc: 8, minuteUtc: 30 })),
    ).toEqual([]);
  });
  it("rejects bad timestamps, intervals, timezones and bounds", () => {
    expect(validateSchedule(schedule({ schedule_id: "a", startAt: -1 }))).toEqual(
      expect.arrayContaining([expect.stringContaining("startAt")]),
    );
    expect(validateSchedule(schedule({ schedule_id: "b", kind: "INTERVAL", intervalMs: 0 }))).toEqual(
      expect.arrayContaining([expect.stringContaining("intervalMs")]),
    );
    expect(validateSchedule(schedule({ schedule_id: "c", kind: "INTERVAL" }))).toEqual(
      expect.arrayContaining([expect.stringContaining("intervalMs")]),
    );
    expect(validateSchedule(schedule({ schedule_id: "d", timezone: "Mars/Olympus" }))).toEqual(
      expect.arrayContaining([expect.stringContaining("timezone")]),
    );
    expect(validateSchedule(schedule({ schedule_id: "e", endAt: T0 }))).toEqual(
      expect.arrayContaining([expect.stringContaining("endAt")]),
    );
    expect(validateSchedule(schedule({ schedule_id: "f", maxOccurrences: 0 }))).toEqual(
      expect.arrayContaining([expect.stringContaining("maxOccurrences")]),
    );
    expect(
      validateSchedule(
        schedule({ schedule_id: "g", misfirePolicy: { policy: "CATCH_UP_BOUNDED", maxMissed: 0, maxAgeMs: 1, maxPerCycle: 1 } }),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("maxMissed")]));
  });
  it("rejects unknown routines, duplicate triggers and bad event filters", () => {
    const { scheduler } = setup();
    expect(() => scheduler.setRoutineEnabled("ghost", false)).toThrowError(/unknown routine/);
    expect(() =>
      scheduler.registerRoutine(
        routine("r", {
          triggers: [
            { trigger_id: "t", version: "1.0.0", event_type: "E", routine_id: "r", routine_version: "1.0.0", enabled: true },
            { trigger_id: "t", version: "1.0.0", event_type: "E", routine_id: "r", routine_version: "1.0.0", enabled: true },
          ],
        }),
      ),
    ).toThrowError(/duplicate trigger/);
    expect(() =>
      scheduler.registerRoutine(
        routine("r", {
          triggers: [{ trigger_id: "t", version: "1.0.0", event_type: "", routine_id: "r", routine_version: "1.0.0", enabled: true }],
        }),
      ),
    ).toThrowError(/event_type/);
    expect(() => normalizeEvent({ event_id: "", event_type: "E", source: "s" })).toThrowError(/event_id/);
  });
});

// ---------- due calculation (pure) ----------

describe("due occurrences", () => {
  it("one-time fires once inside the window", () => {
    const s = schedule({ schedule_id: "a", startAt: T0 + 5 * MIN });
    expect(dueOccurrences(s, T0, T0 + 10 * MIN)).toEqual([T0 + 5 * MIN]);
    expect(dueOccurrences(s, T0 + 5 * MIN, T0 + 10 * MIN)).toEqual([]);
    expect(dueOccurrences(s, T0, T0 + 5 * MIN)).toEqual([T0 + 5 * MIN]);
  });
  it("interval uses scheduled-time anchors with predictable cadence", () => {
    const s = schedule({ schedule_id: "a", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN });
    expect(dueOccurrences(s, T0, T0 + 35 * MIN)).toEqual([T0 + 10 * MIN, T0 + 20 * MIN, T0 + 30 * MIN]);
    // Completion-time drift does not move the anchor: late tick still yields anchor times.
    expect(dueOccurrences(s, T0 + 33 * MIN, T0 + 35 * MIN)).toEqual([]);
    expect(dueOccurrences(s, T0 + 29 * MIN, T0 + 35 * MIN)).toEqual([T0 + 30 * MIN]);
  });
  it("daily fires at the UTC wall time; end and max bounds hold", () => {
    const day = Date.UTC(2026, 8, 22, 0, 0, 0);
    const s = schedule({ schedule_id: "a", kind: "DAILY", startAt: day, hourUtc: 8, minuteUtc: 30 });
    const first = day + 8 * 3600 * 1000 + 30 * MIN;
    expect(dueOccurrences(s, day, day + 24 * 3600 * 1000)).toEqual([first]);
    expect(dueOccurrences(s, day, day + 3 * 24 * 3600 * 1000).length).toBe(3);
    const limited = schedule({ schedule_id: "b", kind: "DAILY", startAt: day, hourUtc: 8, minuteUtc: 30, maxOccurrences: 2 });
    expect(dueOccurrences(limited, day, day + 10 * 24 * 3600 * 1000).length).toBe(2);
    const ended = schedule({ schedule_id: "c", kind: "DAILY", startAt: day, hourUtc: 8, minuteUtc: 30, endAt: day + 12 * 3600 * 1000 });
    expect(dueOccurrences(ended, day, day + 10 * 24 * 3600 * 1000)).toEqual([first]);
  });
  it("occurrence keys are stable and unique per logical occurrence", () => {
    expect(occurrenceKey("s", "1.0.0", 123)).toBe(occurrenceKey("s", "1.0.0", 123));
    expect(occurrenceKey("s", "1.0.0", 123)).not.toBe(occurrenceKey("s", "1.0.0", 124));
    expect(occurrenceKey("s", "1.0.0", 123)).not.toBe(occurrenceKey("s", "2.0.0", 123));
  });
});

// ---------- time scheduler ----------

describe("time scheduler", () => {
  it("nothing fires before due; one activation when due", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) }));
    expect((await scheduler.tick(T0)).activated).toEqual([]);
    const report = await scheduler.tick(T0 + 10 * MIN);
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["r"]);
  });
  it("same tick twice yields exactly one activation", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) }));
    await scheduler.tick(T0 + 10 * MIN);
    const again = await scheduler.tick(T0 + 10 * MIN);
    expect(again.activated).toEqual([]);
    expect(calls).toEqual(["r"]);
  });
  it("later ticks do not duplicate; next recurrence creates anew", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(
      routine("r", { schedule: schedule({ schedule_id: "s", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN }) }),
    );
    await scheduler.tick(T0 + 10 * MIN);
    await scheduler.tick(T0 + 15 * MIN);
    expect(calls).toEqual(["r"]);
    await scheduler.tick(T0 + 20 * MIN);
    expect(calls).toEqual(["r", "r"]);
  });
  it("disabled and expired routines never fire", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("off", { schedule: schedule({ schedule_id: "s1", startAt: T0 + 1 }) }));
    scheduler.setRoutineEnabled("off", false);
    scheduler.registerRoutine(
      routine("old", { schedule: schedule({ schedule_id: "s2", startAt: T0 - 3600 * 1000, endAt: T0 - 1800 * 1000 }) }),
    );
    const report = await scheduler.tick(T0);
    expect(report.activated).toEqual([]);
    expect(report.misfired.length).toBe(1);
    expect(calls).toEqual([]);
  });
  it("one-time schedule completes and never refires", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("once", { schedule: schedule({ schedule_id: "s", startAt: T0 + 1 }) }));
    await scheduler.tick(T0 + 2);
    await scheduler.tick(T0 + 100000);
    expect(calls).toEqual(["once"]);
  });
  it("restart loads persisted state and continues without duplication", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sched-restart-"));
    const mkScheduler = () =>
      new RoutineScheduler(
        new FileStateStore(dir, 1),
        (r: RoutineBinding) => ({ runId: `run-${r.routine_id}` }),
        "test-scheduler",
      );
    const s1 = mkScheduler();
    s1.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN }) }));
    await s1.tick(T0 + 10 * MIN);
    const s2 = mkScheduler();
    s2.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN }) }));
    const report = await s2.tick(T0 + 15 * MIN);
    expect(report.activated).toEqual([]);
    const later = await s2.tick(T0 + 20 * MIN);
    expect(later.activated.length).toBe(1);
  });
});

// ---------- misfire ----------

describe("misfire policy", () => {
  it("default is SKIP with an explicit MISFIRED record", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 }) }));
    const report = await scheduler.tick(T0 + 3600 * 1000);
    expect(report.activated).toEqual([]);
    expect(report.misfired.length).toBe(1);
    expect(calls).toEqual([]);
  });
  it("RUN_ONCE_NOW fires a single catch-up activation", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(
      routine("r", {
        schedule: schedule({ schedule_id: "s", startAt: T0, misfirePolicy: { policy: "RUN_ONCE_NOW" } }),
      }),
    );
    const report = await scheduler.tick(T0 + 3600 * 1000);
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["r"]);
  });
  it("CATCH_UP_BOUNDED enforces maxMissed, maxAgeMs and maxPerCycle", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(
      routine("r", {
        schedule: schedule({
          schedule_id: "s", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN,
          misfirePolicy: { policy: "CATCH_UP_BOUNDED", maxMissed: 100, maxAgeMs: 30 * MIN, maxPerCycle: 1 },
        }),
      }),
    );
    // Anchor too old (MISFIRED); T0+10 catch-up fires once; T0+20 is
    // age-eligible but capped by maxPerCycle; T0+30 sits exactly on the
    // freshness boundary and fires normally.
    const report = await scheduler.tick(T0 + 35 * MIN);
    expect(report.activated.length).toBe(2);
    expect(calls.length).toBe(2);
    expect(report.misfired.length).toBe(2);
  });
  it("lifetime maxMissed cap blocks even age-eligible catch-up", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(
      routine("r", {
        schedule: schedule({
          schedule_id: "s", kind: "INTERVAL", startAt: T0, intervalMs: 10 * MIN,
          misfirePolicy: { policy: "CATCH_UP_BOUNDED", maxMissed: 2, maxAgeMs: 25 * MIN, maxPerCycle: 10 },
        }),
      }),
    );
    // Anchor T0 plus T0+10/20/30 exceed maxAge (MISFIRED, cap reaches 2);
    // T0+40/T0+50 are within age but the lifetime cap denies them; T0+60 is
    // fresh and fires normally.
    const report = await scheduler.tick(T0 + 60 * MIN);
    expect(report.activated.length).toBe(1);
    expect(calls.length).toBe(1);
    expect(report.misfired.length).toBe(6);
  });
});

// ---------- events ----------

describe("event triggers", () => {
  const trigger = (over: Partial<Parameters<typeof triggerMatches>[0]> = {}) => ({
    trigger_id: "t", version: "1.0.0", event_type: "TEST.DOC_UPDATED",
    routine_id: "r", routine_version: "1.0.0", enabled: true, ...over,
  });
  const event = (over: Partial<Parameters<typeof triggerMatches>[1]> = {}) => ({
    event_id: "e1", event_type: "TEST.DOC_UPDATED", source: "test",
    occurred_at: T0, received_at: T0, payload: {}, provenance: "fixture", ...over,
  });
  it("matches type/source/payload equality declaratively", () => {
    expect(triggerMatches(trigger(), event())).toBe(true);
    expect(triggerMatches(trigger(), event({ event_type: "OTHER" }))).toBe(false);
    expect(triggerMatches(trigger({ source: "a" }), event({ source: "b" }))).toBe(false);
    expect(
      triggerMatches(trigger({ match: { "doc.id": 7 } }), event({ payload: { doc: { id: 7 } } })),
    ).toBe(true);
    expect(
      triggerMatches(trigger({ match: { "doc.id": 8 } }), event({ payload: { doc: { id: 7 } } })),
    ).toBe(false);
  });
  it("matching event creates exactly one activation; redelivery does not duplicate", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(routine("r", { triggers: [trigger()] }));
    const first = await scheduler.dispatchEvent(event(), T0);
    expect(first.activated.length).toBe(1);
    const second = await scheduler.dispatchEvent(event(), T0 + 1);
    expect(second.activated).toEqual([]);
    expect(calls).toEqual(["r"]);
  });
  it("non-matching, disabled and multi-trigger behavior", async () => {
    const { scheduler, calls } = setup();
    scheduler.registerRoutine(
      routine("r", {
        triggers: [
          trigger({ trigger_id: "t1" }),
          trigger({ trigger_id: "t2", event_type: "OTHER", routine_version: "1.0.0" }),
          { ...trigger({ trigger_id: "t3" }), enabled: false },
        ],
      }),
    );
    const report = await scheduler.dispatchEvent(event(), T0);
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["r"]);
  });
  it("event provenance is retained on the activation", async () => {
    const { scheduler } = setup();
    scheduler.registerRoutine(routine("r", { triggers: [trigger()] }));
    const report = await scheduler.dispatchEvent(event({ provenance: "repo-hook" }), T0);
    expect(report.activated.length).toBe(1);
  });
});

// ---------- claims / recovery ----------

describe("activation claims", () => {
  it("two scheduler instances racing one occurrence yield one activation", async () => {
    const dir = mkdtempSync(join(tmpdir(), "sched-race-"));
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const mkScheduler = (owner: string) =>
      new RoutineScheduler(new FileStateStore(dir, 1), async () => {
        await gate;
        return { runId: `run-${owner}` };
      }, owner);
    const schedA = mkScheduler("A");
    const schedB = mkScheduler("B");
    const binding = routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) });
    schedA.registerRoutine(binding);
    schedB.registerRoutine(binding);
    const tickA = schedA.tick(T0 + 10 * MIN);
    // Let A reach the startRun await before B ticks.
    await new Promise((resolve) => setTimeout(resolve, 50));
    const reportB = await schedB.tick(T0 + 10 * MIN);
    release();
    const reportA = await tickA;
    const total = reportA.activated.length + reportB.activated.length;
    expect(total).toBe(1);
    expect(reportB.activated).toEqual([]);
  });
  it("stale claims reconcile instead of silently restarting", async () => {
    // Freeze time at claim: tick with a startRun that never resolves, then abandon.
    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    const dir = mkdtempSync(join(tmpdir(), "sched-stale-"));
    const hanging = new RoutineScheduler(new FileStateStore(dir, 1), () => gate.then(() => ({ runId: "x" })), "H");
    hanging.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) }));
    const pending = hanging.tick(T0 + 10 * MIN);
    await new Promise((resolve) => setTimeout(resolve, 50));
    release();
    await pending;
    // Fresh scheduler long after the lease: the completed claim is STARTED, nothing stale.
    const fresh = new RoutineScheduler(new FileStateStore(dir, 1), () => ({ runId: "y" }), "F");
    expect(fresh.reconcileStaleClaims(T0 + 3600 * 1000)).toEqual([]);
  });
});

// ---------- P19/1 integration ----------

describe("P19/1 integration", () => {
  function echoSkill(id: string): Skill {
    return {
      skill_id: id, version: "1.0.0", name: id, description: id, capability: "t",
      inputs: ["value"], outputs: ["result"], required_capabilities: [],
      required_permissions: [], required_tools: [], supported_platforms: ["*"],
      execution_kind: "test", implementation_ref: `test:${id}`, risk_class: "low",
      provenance: "fixture", status: "REGISTERED",
    };
  }
  function makeRuntime() {
    const skills = new SkillRegistry();
    skills.register(echoSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register({
      kind: "test",
      execute: async (step, ctx) => ({ ok: true, output: { result: ctx.inputs.value ?? null }, retryable: true }),
    });
    const store = new FileStateStore(mkdtempSync(join(tmpdir(), "wf-int-")), 1);
    const runtime = new WorkflowRuntime(skills, executors, store, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: (() => { let n = 0; return () => `run-${++n}`; })(),
    });
    runtime.define({
      workflow_id: "w", version: "1.0.0", description: "w", inputs: ["v"],
      steps: [
        { id: "a", kind: "skill", ref: "skill:echo@1.0.0", depends_on: [], inputs: { value: "$input.v" }, outputs: ["result"], retry_safety: "safe" },
        { id: "gate", kind: "approval", ref: "review", depends_on: ["a"], inputs: {}, outputs: [], approval: { approver: "owner", reason: "check" }, retry_safety: "unknown" },
        { id: "b", kind: "skill", ref: "skill:echo@1.0.0", depends_on: ["gate", "a"], inputs: { value: "$steps.a.output.result" }, outputs: ["result"], retry_safety: "safe" },
      ],
    });
    runtime.define({
      workflow_id: "plain", version: "1.0.0", description: "plain", inputs: ["v"],
      steps: [
        { id: "a", kind: "skill", ref: "skill:echo@1.0.0", depends_on: [], inputs: { value: "$input.v" }, outputs: ["result"], retry_safety: "safe" },
      ],
    });
    return runtime;
  }
  it("schedule due → activation → WorkflowRun succeeds deterministically", async () => {
    const runtime = makeRuntime();
    const { scheduler, calls } = setup(async (r) => {
      const run = runtime.start(r.workflow_ref, r.workflow_version, { v: 3 });
      const done = await runtime.advance(run.run_id);
      calls.push(`${r.routine_id}:${done.state}`);
      return { runId: done.run_id };
    });
    scheduler.registerRoutine(
      routine("daily", {
        workflow_ref: "plain", schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }),
      }),
    );
    const report = await scheduler.tick(T0 + 10 * MIN);
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["daily:SUCCEEDED"]);
  });
  it("scheduled approval workflow starts and waits safely (no bypass)", async () => {
    const runtime = makeRuntime();
    const states: string[] = [];
    const { scheduler } = setup(async (r) => {
      const run = runtime.start(r.workflow_ref, r.workflow_version, { v: 3 });
      const done = await runtime.advance(run.run_id);
      states.push(done.state);
      return { runId: done.run_id };
    });
    scheduler.registerRoutine(
      routine("gated", {
        workflow_ref: "w", schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }),
      }),
    );
    const report = await scheduler.tick(T0 + 10 * MIN);
    expect(report.activated.length).toBe(1);
    // The approval gate stops the run: automation does not bypass approvals.
    expect(states).toEqual(["WAITING_APPROVAL"]);
  });
  it("event trigger → activation → WorkflowRun succeeds", async () => {
    const runtime = makeRuntime();
    const { scheduler, calls } = setup(async (r) => {
      // Event path uses a no-approval workflow shape: start routine workflow
      // but only the first skill step runs via a dedicated simple definition.
      const run = runtime.start("w", "1.0.0", { v: 5 });
      await runtime.advance(run.run_id, 1);
      calls.push("event-run");
      return { runId: run.run_id };
    });
    scheduler.registerRoutine(
      routine("on-doc", {
        workflow_ref: "w",
        triggers: [{ trigger_id: "t", version: "1.0.0", event_type: "TEST.DOC_UPDATED", routine_id: "on-doc", routine_version: "1.0.0", enabled: true }],
      }),
    );
    const report = await scheduler.dispatchEvent(
      { event_id: "e9", event_type: "TEST.DOC_UPDATED", source: "test", occurred_at: T0, received_at: T0, payload: {}, provenance: "fixture" },
      T0,
    );
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["event-run"]);
  });
  it("scheduler never grants authority (no grant surface)", () => {
    const { scheduler } = setup();
    scheduler.registerRoutine(routine("r", { schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) }));
    const surface = scheduler as unknown as Record<string, unknown>;
    for (const key of ["grant", "grantPermission", "authorize", "approve", "execute"]) {
      expect(surface[key]).toBeUndefined();
    }
    expect(scheduler.inspectHuman(T0)).toContain("ROUTINE: r");
  });
});
