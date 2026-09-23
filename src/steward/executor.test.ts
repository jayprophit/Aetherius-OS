import { describe, expect, it } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStateStore } from "../state/store";
import { StewardReportStore, reportStateId } from "./reports";
import { StewardReviewExecutor, validateStewardStepDef } from "./executor";
import type { ExecContext } from "../workflows/executors";
import type { WorkflowStep } from "../workflows/types";
import type { ReviewFinding, StewardReport } from "./types";

function stewardStep(overrides: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id: "review",
    kind: "steward-review",
    ref: "steward:review",
    depends_on: [],
    inputs: {
      repo: "aetherius-os",
      kind: "pull",
      number: "12",
      trigger: "scheduled",
      findings: "$input.findings",
    },
    outputs: [],
    retry_safety: "safe",
    ...overrides,
  };
}

function setup(): { executor: StewardReviewExecutor; store: FileStateStore; reports: StewardReportStore } {
  const root = mkdtempSync(join(tmpdir(), "steward-ex-"));
  const store = new FileStateStore(root, 1);
  const reports = new StewardReportStore(store, "aetherius-os");
  const executor = new StewardReviewExecutor({ reports, now: () => "2026-09-22T12:00:00.000Z" });
  return { executor, store, reports };
}

function ctx(inputs: Record<string, unknown>, runId = "run-1"): ExecContext {
  return {
    runId,
    workflowId: "steward-wf",
    workflowVersion: "1.0.0",
    step: stewardStep(),
    inputs,
    declaredPermissions: [],
    attempt: 1,
    signal: new AbortController().signal,
  } as ExecContext;
}

const blocking: ReviewFinding[] = [{ code: "E1", severity: "error", message: "tests fail" }];
const advisory: ReviewFinding[] = [{ code: "W1", severity: "warning", message: "nit" }];

describe("steward-review step validation", () => {
  it("accepts a correct definition", () => {
    expect(validateStewardStepDef(stewardStep())).toEqual([]);
  });

  it("flags wrong kind, bad literals and missing findings binding", () => {
    const problems = validateStewardStepDef(
      stewardStep({
        kind: "skill",
        inputs: { repo: "bad repo!", kind: "branch", number: "0", trigger: "always", findings: "[]; rm -rf" },
      }),
    );
    expect(problems).toEqual(
      expect.arrayContaining([
        expect.stringContaining("kind steward-review"),
        expect.stringContaining("repo must be an id-safe"),
        expect.stringContaining("kind must be issue or pull"),
        expect.stringContaining("positive integer"),
        expect.stringContaining("trigger must be"),
        expect.stringContaining("findings must be a runtime binding"),
      ]),
    );
    const missing = validateStewardStepDef(stewardStep({ inputs: { repo: "r" } }));
    expect(missing).toEqual(expect.arrayContaining([expect.stringContaining("requires a findings input binding")]));
  });
});

describe("steward-review executor", () => {
  it("persists a durable report and reports readiness without merge authority", async () => {
    const { executor, reports } = setup();
    const outcome = await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, findings: [...blocking, ...advisory] }));
    expect(outcome.ok).toBe(true);
    const output = outcome.output as Record<string, unknown>;
    expect(output["verdict"]).toBe("not_ready");
    expect(output["blocking_count"]).toBe(1);
    expect(output["warning_count"]).toBe(1);
    expect(output["merge_authority"]).toBe(false);
    expect(output["report_id"]).toBe("steward-aetherius-os-pull12");

    const report = reports.load(reportStateId({ repo: "aetherius-os", kind: "pull", number: 12 }));
    expect(report.findings).toHaveLength(2);
    expect(report.readiness.merge_authority).toBe(false);
    expect(report.trigger).toBe("scheduled");
  });

  it("re-running the same target bumps the durable version", async () => {
    const { executor, store } = setup();
    await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, findings: blocking }, "run-1"));
    await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, findings: [] }, "run-2"));
    const envelope = store.load<StewardReport>(reportStateId({ repo: "aetherius-os", kind: "pull", number: 12 }));
    expect(envelope.recordVersion).toBe(2);
    expect(envelope.payload.findings).toHaveLength(0);
    expect(envelope.payload.readiness.verdict).toBe("ready");
    expect(envelope.payload.readiness.merge_authority).toBe(false);
  });

  it("readiness with only warnings stays ready and authority-free", async () => {
    const { executor } = setup();
    const outcome = await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, findings: advisory }));
    const output = outcome.output as Record<string, unknown>;
    expect(output["verdict"]).toBe("ready");
    expect(output["merge_authority"]).toBe(false);
  });

  it("rejects malformed resolved inputs honestly (non-retryable)", async () => {
    const { executor } = setup();
    const notArray = await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, findings: "nope" }));
    expect(notArray.ok).toBe(false);
    expect(notArray.retryable).toBe(false);

    const badSeverity = await executor.execute(
      stewardStep(),
      ctx({ ...stewardStep().inputs, findings: [{ code: "X", severity: "fatal", message: "m" }] }),
    );
    expect(badSeverity.ok).toBe(false);
    expect(badSeverity.retryable).toBe(false);

    const badRepo = await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, repo: "no spaces" }));
    expect(badRepo.ok).toBe(false);
    expect(badRepo.retryable).toBe(false);

    const badNumber = await executor.execute(stewardStep(), ctx({ ...stewardStep().inputs, number: 0 }));
    expect(badNumber.ok).toBe(false);

    const badTrigger = await executor.execute(
      stewardStep(),
      ctx({ ...stewardStep().inputs, trigger: "whenever", findings: [] }),
    );
    expect(badTrigger.ok).toBe(false);
    expect(badTrigger.retryable).toBe(false);
  });

  it("fails invalid step definitions before touching state", async () => {
    const { executor, store } = setup();
    const bad = stewardStep({ inputs: { repo: "r", kind: "pull", number: "1", trigger: "manual" } });
    const outcome = await executor.execute(bad, ctx({}));
    expect(outcome.ok).toBe(false);
    expect(outcome.retryable).toBe(false);
    expect(outcome.error).toContain("requires a findings input binding");
    expect(store.listIds("steward-")).toEqual([]);
  });
});
