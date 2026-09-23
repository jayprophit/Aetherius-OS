import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { ExecutorRegistry } from "../workflows/executors";
import { WorkflowRuntime } from "../workflows/runtime";
import { SkillRegistry } from "../workflows/skills";
import { RoutineScheduler } from "../scheduler/scheduler";
import type { RoutineBinding } from "../scheduler/scheduler";
import type { Schedule } from "../scheduler/types";
import { StewardReviewExecutor } from "./executor";
import { StewardReportStore, reportStateId } from "./reports";
import type { StewardReport } from "./types";

const T0 = Date.UTC(2026, 8, 22, 12, 0, 0);
const MIN = 60 * 1000;

function schedule(over: Partial<Schedule> & { schedule_id: string }): Schedule {
  return {
    version: "1.0.0", kind: "ONE_TIME", startAt: T0 + 10 * MIN, enabled: true, ...over,
  } as Schedule;
}

function routine(id: string, over: Partial<RoutineBinding> = {}): RoutineBinding {
  return {
    routine_id: id, version: "1.0.0", workflow_ref: "steward-scheduled", workflow_version: "1.0.0",
    policy: "AUTO_SAFE", enabled: true, ...over,
  };
}

describe("steward scheduled/event review integration", () => {
  function makeStack() {
    const stateRoot = mkdtempSync(join(tmpdir(), "steward-int-wf-"));
    const reportRoot = mkdtempSync(join(tmpdir(), "steward-int-rep-"));
    const store = new FileStateStore(stateRoot, 1);
    const reports = new StewardReportStore(new FileStateStore(reportRoot, 1), "aetherius-os");
    const executors = new ExecutorRegistry();
    executors.register(new StewardReviewExecutor({ reports, now: () => "2026-09-22T12:10:00.000Z" }));
    const runtime = new WorkflowRuntime(new SkillRegistry(), executors, store, {
      now: () => "2026-09-22T12:10:00.000Z",
      id: (() => { let n = 0; return () => `srun-${++n}`; })(),
    });
    runtime.define({
      workflow_id: "steward-scheduled", version: "1.0.0", description: "scheduled steward review",
      inputs: ["findings"],
      steps: [
        {
          id: "review", kind: "steward-review", ref: "steward:review", depends_on: [],
          inputs: { repo: "aetherius-os", kind: "pull", number: "12", trigger: "scheduled", findings: "$input.findings" },
          outputs: ["report_id"], retry_safety: "safe",
        },
      ],
    });
    runtime.define({
      workflow_id: "steward-event", version: "1.0.0", description: "event steward review",
      inputs: ["findings"],
      steps: [
        {
          id: "review", kind: "steward-review", ref: "steward:review", depends_on: [],
          inputs: { repo: "aetherius-os", kind: "pull", number: "13", trigger: "event", findings: "$input.findings" },
          outputs: ["report_id"], retry_safety: "safe",
        },
      ],
    });
    const calls: string[] = [];
    const scheduler = new RoutineScheduler(
      new FileStateStore(mkdtempSync(join(tmpdir(), "steward-int-sched-")), 1),
      async (r) => {
        const findings = r.routine_id === "nightly"
          ? [{ code: "E1", severity: "error", message: "ci failing" }]
          : [];
        const run = runtime.start(r.workflow_ref, r.workflow_version, { findings });
        const done = await runtime.advance(run.run_id);
        calls.push(`${r.routine_id}:${done.state}`);
        return { runId: done.run_id };
      },
      "steward-int",
    );
    return { runtime, scheduler, reports, calls, store };
  }

  it("scheduled due → activation → durable steward report (ready path stays authority-free)", async () => {
    const { scheduler, reports, calls } = makeStack();
    scheduler.registerRoutine(
      routine("clean", { workflow_ref: "steward-scheduled", schedule: schedule({ schedule_id: "s", startAt: T0 + 10 * MIN }) }),
    );
    const tick = await scheduler.tick(T0 + 10 * MIN);
    expect(tick.activated.length).toBe(1);
    expect(calls).toEqual(["clean:SUCCEEDED"]);
    const report = reports.load(reportStateId({ repo: "aetherius-os", kind: "pull", number: 12 }));
    expect(report.readiness.verdict).toBe("ready");
    expect(report.readiness.merge_authority).toBe(false);
    expect(report.trigger).toBe("scheduled");
  });

  it("scheduled due with blocking findings yields not_ready report, still no authority", async () => {
    const { scheduler, reports, calls } = makeStack();
    scheduler.registerRoutine(
      routine("nightly", { workflow_ref: "steward-scheduled", schedule: schedule({ schedule_id: "n", startAt: T0 + 10 * MIN }) }),
    );
    const tick = await scheduler.tick(T0 + 10 * MIN);
    expect(tick.activated.length).toBe(1);
    expect(calls).toEqual(["nightly:SUCCEEDED"]);
    const report = reports.load(reportStateId({ repo: "aetherius-os", kind: "pull", number: 12 }));
    expect(report.readiness.verdict).toBe("not_ready");
    expect(report.readiness.blockingCount).toBe(1);
    expect(report.readiness.merge_authority).toBe(false);
  });

  it("event trigger → activation → durable steward report with event provenance", async () => {
    const { scheduler, reports, calls } = makeStack();
    scheduler.registerRoutine(
      routine("on-pr", {
        workflow_ref: "steward-event",
        triggers: [{
          trigger_id: "t", version: "1.0.0", event_type: "REVIEW.PR_OPENED",
          routine_id: "on-pr", routine_version: "1.0.0", enabled: true,
        }],
      }),
    );
    const report = await scheduler.dispatchEvent(
      {
        event_id: "pr13", event_type: "REVIEW.PR_OPENED", source: "test",
        occurred_at: T0, received_at: T0, payload: {}, provenance: "fixture",
      },
      T0,
    );
    expect(report.activated.length).toBe(1);
    expect(calls).toEqual(["on-pr:SUCCEEDED"]);
    const stored = reports.load(reportStateId({ repo: "aetherius-os", kind: "pull", number: 13 }));
    expect(stored.trigger).toBe("event");
    expect(stored.readiness.merge_authority).toBe(false);
    expect(stored.target.number).toBe(13);
  });

  it("activation surface grants no merge or authority", () => {
    const { scheduler } = makeStack();
    const surface = scheduler as unknown as Record<string, unknown>;
    for (const key of ["merge", "autoMerge", "grant", "authorize", "approve"]) {
      expect(surface[key]).toBeUndefined();
    }
  });
});
