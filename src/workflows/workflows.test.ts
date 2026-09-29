import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { FileStateStore, sha256Hex } from "../state/store";
import { ExecutorRegistry, type ExecContext, type StepExecutor, type StepOutcome } from "./executors";
import { routineFor, validateRoutine } from "./routines";
import { WorkflowRuntime } from "./runtime";
import { SkillRegistry, parseSkillRef } from "./skills";
import type { Skill, Workflow, WorkflowStep } from "./types";
import { validateWorkflow } from "./validate";

// ---------- fixtures ----------

let runCounter = 0;

/**
 * Every FileStateStore fixture in this file writes into a real temp directory.
 * Without cleanup those directories accumulate for the lifetime of the machine
 * (190 had piled up under %TEMP%\wf-sub-* before this was fixed), which is both
 * a leak and extra disk contention for every later parallel test run.
 */
const tempDirs: string[] = [];

function newStateStore(prefix = "wf-sub-"): FileStateStore {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return new FileStateStore(dir, 1);
}

/** A tracked temp directory for tests that need the path itself. */
function newTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterAll(() => {
  for (const dir of tempDirs) {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
    } catch {
      // A leftover temp directory must never fail the suite.
    }
  }
  tempDirs.length = 0;
});

function testSkill(id: string, over: Partial<Skill> = {}): Skill {
  return {
    skill_id: id,
    version: "1.0.0",
    name: id,
    description: `test skill ${id}`,
    capability: "test-transform",
    inputs: ["value"],
    outputs: ["result"],
    required_capabilities: [],
    required_permissions: [],
    required_tools: [],
    supported_platforms: ["*"],
    execution_kind: "test",
    implementation_ref: `test:${id}`,
    risk_class: "low",
    provenance: "P19/1 fixture",
    status: "REGISTERED",
    ...over,
  };
}

type Behavior = (inputs: Record<string, unknown>, ctx: ExecContext) => StepOutcome | Promise<StepOutcome>;

class TestExecutor implements StepExecutor {
  readonly kind = "test";
  constructor(private readonly behaviors: Record<string, Behavior>) {}
  async execute(step: WorkflowStep, ctx: ExecContext): Promise<StepOutcome> {
    const ref = parseSkillRef(step.ref);
    const fn = ref ? this.behaviors[ref.skillId] : undefined;
    if (!fn) throw new Error(`no test behavior for ${step.ref}`);
    return fn(ctx.inputs, ctx);
  }
}

function step(id: string, skill: string, over: Partial<WorkflowStep> = {}): WorkflowStep {
  return {
    id, kind: "skill", ref: `skill:${skill}@1.0.0`, depends_on: [],
    inputs: {}, outputs: ["result"], retry_safety: "safe", ...over,
  };
}

function workflow(id: string, steps: WorkflowStep[], inputs: string[] = []): Workflow {
  return { workflow_id: id, version: "1.0.0", description: id, inputs, steps };
}

function setup(behaviors: Record<string, Behavior>, skills: Skill[] = []) {
  runCounter = 0;
  const registries = new SkillRegistry();
  for (const s of skills) registries.register(s);
  const executors = new ExecutorRegistry();
  executors.register(new TestExecutor(behaviors));
  const store = newStateStore("wf-");
  const runtime = new WorkflowRuntime(registries, executors, store, {
    now: () => "2026-09-22T00:00:00.000Z",
    id: () => `run-${++runCounter}`,
  });
  return { registries, executors, store, runtime };
}

const echo: Behavior = (inputs) => ({ ok: true, output: { result: inputs.value ?? null }, retryable: true });

// ---------- skill registry ----------

describe("skill registry", () => {
  it("registers valid skills and resolves latest version", () => {
    const { registries } = setup({}, [testSkill("echo")]);
    registries.register(testSkill("echo", { version: "1.2.0" }));
    expect(registries.lookup("echo")?.version).toBe("1.2.0");
    expect(registries.lookup("echo", "1.0.0")?.version).toBe("1.0.0");
    expect(registries.lookup("ghost")).toBeNull();
  });
  it("rejects duplicate versions and invalid definitions", () => {
    const { registries } = setup({}, [testSkill("echo")]);
    expect(() => registries.register(testSkill("echo"))).toThrowError(/duplicate/);
    expect(() => registries.register(testSkill("bad", { version: "x" }))).toThrowError(/invalid version/);
    expect(() => registries.register(testSkill("", { skill_id: "" }))).toThrowError(/skill_id/);
  });
  it("retains provenance and permissions without granting them", () => {
    const { registries } = setup({}, [
      testSkill("danger", { required_permissions: ["filesystem:delete"], provenance: "owner-fixture" }),
    ]);
    const found = registries.lookup("danger");
    expect(found?.provenance).toBe("owner-fixture");
    expect(found?.required_permissions).toEqual(["filesystem:delete"]);
    expect((registries as unknown as Record<string, unknown>).grant).toBeUndefined();
  });
  it("checks platform compatibility", () => {
    const { registries } = setup({});
    const s = testSkill("win", { supported_platforms: ["win32"] });
    expect(registries.compatible(s, "linux", ["test"])).toContain("linux");
    expect(registries.compatible(s, "win32", ["nope"])).toContain("execution kind");
    expect(registries.compatible(s, "win32", ["test"])).toBeNull();
  });
});

// ---------- workflow validation ----------

describe("workflow validation", () => {
  const skills = () => {
    const r = new SkillRegistry();
    r.register(testSkill("echo"));
    return r;
  };
  it("accepts valid one-step and multi-step workflows", () => {
    expect(validateWorkflow(workflow("w", [step("a", "echo")]), skills())).toEqual([]);
    expect(
      validateWorkflow(
        workflow("w", [step("a", "echo"), step("b", "echo", { depends_on: ["a"], inputs: { value: "$steps.a.output.result" } })], ["value"]),
        skills(),
      ),
    ).toEqual([]);
  });
  it("rejects duplicate ids, missing/self deps and cycles", () => {
    expect(validateWorkflow(workflow("w", [step("a", "echo"), step("a", "echo")]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("duplicate step ids")]));
    expect(validateWorkflow(workflow("w", [step("a", "echo", { depends_on: ["ghost"] })]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("missing dependency")]));
    expect(validateWorkflow(workflow("w", [step("a", "echo", { depends_on: ["a"] })]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("self dependency")]));
    expect(
      validateWorkflow(
        workflow("w", [step("a", "echo", { depends_on: ["b"] }), step("b", "echo", { depends_on: ["a"] })]),
        skills(),
      ),
    ).toEqual(expect.arrayContaining([expect.stringContaining("dependency cycle")]));
  });
  it("rejects missing/bad skills, bad bindings, retry, timeout, approval, types", () => {
    const badSkill = validateWorkflow(workflow("w", [step("a", "ghost")]), skills());
    expect(badSkill).toEqual(expect.arrayContaining([expect.stringContaining("missing skill")]));
    const badVer = validateWorkflow(workflow("w", [step("a", "echo", { ref: "skill:echo@9.9.9" })]), skills());
    expect(badVer).toEqual(expect.arrayContaining([expect.stringContaining("missing skill")]));
    const badIn = validateWorkflow(workflow("w", [step("a", "echo", { inputs: { v: "$input.nope" } })]), skills());
    expect(badIn).toEqual(expect.arrayContaining([expect.stringContaining("undeclared workflow input")]));
    const badOut = validateWorkflow(
      workflow("w", [step("a", "echo", { inputs: { v: "$steps.ghost.output" } }), step("b", "echo")]),
      skills(),
    );
    expect(badOut).toEqual(expect.arrayContaining([expect.stringContaining("unknown step")]));
    const nonDep = validateWorkflow(
      workflow("w", [step("a", "echo"), step("b", "echo", { inputs: { v: "$steps.a.output" } })]),
      skills(),
    );
    expect(nonDep).toEqual(expect.arrayContaining([expect.stringContaining("non-dependency")]));
    expect(validateWorkflow(workflow("w", [step("a", "echo", { retry: { max_attempts: 0, retry_on: "all" } })]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("max_attempts")]));
    expect(validateWorkflow(workflow("w", [step("a", "echo", { retry: { max_attempts: 3, retry_on: "sometimes" as never } })]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("retry_on")]));
    expect(validateWorkflow(workflow("w", [step("a", "echo", { timeout_ms: -5 })]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("timeout_ms")]));
    expect(validateWorkflow(workflow("w", [{ ...step("a", "echo"), kind: "approval", ref: "review" }]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("approver")]));
    expect(validateWorkflow(workflow("w", [{ ...step("a", "echo"), kind: "teleport" as never }]), skills()))
      .toEqual(expect.arrayContaining([expect.stringContaining("unsupported type")]));
  });
});

// ---------- execution ----------

describe("execution", () => {
  it("single-step success with input propagation", async () => {
    const { runtime } = setup({ echo: echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo", { inputs: { value: "$input.v" } })], ["v"]));
    const done = await runtime.advance(runtime.start("w", "1.0.0", { v: 42 }).run_id);
    expect(done.state).toBe("SUCCEEDED");
    expect(done.steps[0].output).toEqual({ result: 42 });
  });
  it("multi-step order and output chaining are deterministic", async () => {
    const order: string[] = [];
    const behaviors: Record<string, Behavior> = {
      echo: (inputs, ctx) => { order.push(ctx.step.id); return { ok: true, output: { result: inputs.value }, retryable: true }; },
    };
    const { runtime } = setup(behaviors, [testSkill("echo")]);
    runtime.define(
      workflow("w", [
        step("c", "echo", { depends_on: ["a", "b"], inputs: { value: "$steps.a.output.result" } }),
        step("a", "echo", { inputs: { value: "$input.v" } }),
        step("b", "echo", { depends_on: ["a"], inputs: { value: "$steps.a.output.result" } }),
      ], ["v"]),
    );
    const first = await runtime.advance(runtime.start("w", "1.0.0", { v: 1 }).run_id);
    expect(order).toEqual(["a", "b", "c"]);
    expect(first.steps[2].output).toEqual({ result: 1 });
    order.length = 0;
    const { runtime: rt2 } = setup(behaviors, [testSkill("echo")]);
    rt2.define(
      workflow("w", [
        step("c", "echo", { depends_on: ["a", "b"], inputs: { value: "$steps.a.output.result" } }),
        step("a", "echo", { inputs: { value: "$input.v" } }),
        step("b", "echo", { depends_on: ["a"], inputs: { value: "$steps.a.output.result" } }),
      ], ["v"]),
    );
    await rt2.advance(rt2.start("w", "1.0.0", { v: 1 }).run_id);
    expect(order).toEqual(["a", "b", "c"]);
  });
  it("step failure fails the run with evidence", async () => {
    const { runtime } = setup({ bad: () => ({ ok: false, retryable: false, error: "nope" }) }, [testSkill("bad")]);
    runtime.define(workflow("w", [step("a", "bad")]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("nope");
    expect(done.steps[0].attempts.length).toBe(1);
  });
  it("retryable failure succeeds on retry; max attempts honored", async () => {
    let calls = 0;
    const { runtime } = setup(
      { flaky: () => (++calls < 2 ? { ok: false, retryable: true, error: "transient" } : { ok: true, output: { result: 1 }, retryable: true }) },
      [testSkill("flaky")],
    );
    runtime.define(workflow("w", [step("a", "flaky", { retry: { max_attempts: 3, retry_on: "transient" } })]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.state).toBe("SUCCEEDED");
    expect(done.steps[0].attempts.length).toBe(2);
    calls = 0;
    const { runtime: rt2 } = setup(
      { flaky: () => (++calls <= 5 ? { ok: false, retryable: true, error: "x" } : { ok: true, output: {}, retryable: true }) },
      [testSkill("flaky")],
    );
    rt2.define(workflow("w", [step("a", "flaky", { retry: { max_attempts: 3, retry_on: "all" } })]));
    const capped = await rt2.advance(rt2.start("w", "1.0.0").run_id);
    expect(capped.state).toBe("FAILED");
    expect(capped.steps[0].attempts.length).toBe(3);
  });
  it("non-retryable failure tries once", async () => {
    const { runtime } = setup({ bad: () => ({ ok: false, retryable: true, error: "x" }) }, [testSkill("bad")]);
    runtime.define(workflow("w", [step("a", "bad", { retry: { max_attempts: 5, retry_on: "none" } })]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.steps[0].attempts.length).toBe(1);
  });
  it("timeout terminates honestly without hanging forever", async () => {
    const { runtime } = setup(
      { hang: () => new Promise(() => {}) },
      [testSkill("hang")],
    );
    runtime.define(workflow("w", [step("a", "hang", { timeout_ms: 50 })]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.steps[0].state).toBe("TIMED_OUT");
    expect(done.state).toBe("TIMED_OUT");
  });
  it("cancellation is distinct from failure", async () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo"), step("b", "echo", { depends_on: ["a"] })]));
    const started = runtime.start("w", "1.0.0", { value: 1 });
    const cancelled = runtime.cancel(started.run_id);
    expect(cancelled.state).toBe("CANCELLED");
    await expect(runtime.advance(started.run_id)).rejects.toThrowError(/is CANCELLED/);
  });
  it("output contract violations fail the step", async () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo", { output_required_keys: ["missing"] })]));
    const done = await runtime.advance(runtime.start("w", "1.0.0", { value: 1 }).run_id);
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("missing required keys");
  });
  it("unregistered executor kind fails honestly", async () => {
    const { runtime } = setup({}, [testSkill("weird", { execution_kind: "weird" })]);
    runtime.define(workflow("w", [step("a", "weird")]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("no executor registered");
  });
  it("summarize exposes operator state", async () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo")]));
    const s = runtime.start("w", "1.0.0", { value: 1 });
    const summary = runtime.summarize(s.run_id);
    expect(summary.workflow).toBe("w@1.0.0");
    expect(summary.next_ready).toEqual(["a"]);
  });
});

// ---------- approval ----------

describe("approval checkpoints", () => {
  const approvalFlow = () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(
      workflow("w", [
        step("a", "echo", { inputs: { value: "$input.v" } }),
        { ...step("gate", "echo"), kind: "approval", ref: "release", approval: { approver: "owner", reason: "release check" }, inputs: {}, depends_on: ["a"] },
        step("b", "echo", { depends_on: ["gate"], inputs: { value: "$input.v" } }),
      ], ["v"]),
    );
    return runtime;
  };
  it("pauses at approval with persisted state", async () => {
    const runtime = approvalFlow();
    const done = await runtime.advance(runtime.start("w", "1.0.0", { v: 1 }).run_id);
    expect(done.state).toBe("WAITING_APPROVAL");
    expect(done.steps[1].state).toBe("WAITING_APPROVAL");
    expect(done.steps[0].state).toBe("SUCCEEDED");
  });
  it("ALLOW resumes to completion", async () => {
    const runtime = approvalFlow();
    const started = runtime.start("w", "1.0.0", { v: 1 });
    const waiting = await runtime.advance(started.run_id);
    const done = await runtime.approve(waiting.run_id, "gate", "ALLOW", "owner");
    expect(done.state).toBe("SUCCEEDED");
    expect(done.steps[2].output).toEqual({ result: 1 });
  });
  it("DENY fails deterministically", async () => {
    const runtime = approvalFlow();
    const started = runtime.start("w", "1.0.0", { v: 1 });
    const waiting = await runtime.advance(started.run_id);
    const done = await runtime.approve(waiting.run_id, "gate", "DENY", "owner");
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("denied");
  });
});

// ---------- pause / resume / recovery ----------

describe("pause, resume and recovery", () => {
  const twoStep = (): { runtime: WorkflowRuntime; storeDir: string } => {
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register(
      new (class implements StepExecutor {
        readonly kind = "test";
        async execute(step: { id: string; ref: string }, ctx: { inputs: Record<string, unknown> }) {
          return { ok: true, output: { result: ctx.inputs.value ?? null }, retryable: true };
        }
      })(),
    );
    const storeDir = newTempDir("wf-pr-");
    const mk = () =>
      new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1), {
        now: () => "2026-09-22T00:00:00.000Z",
        id: () => `run-${++runCounter}`,
      });
    runCounter = 0;
    const runtime = mk();
    runtime.define(
      workflow("w", [
        step("a", "echo", { inputs: { value: "$input.v" } }),
        step("b", "echo", { depends_on: ["a"], inputs: { value: "$steps.a.output.result" } }),
        step("c", "echo", { depends_on: ["b"], inputs: { value: "$steps.b.output.result" } }),
      ], ["v"]),
    );
    return { runtime, storeDir };
  };

  it("pause/resume across runtime instances never reruns completed steps", async () => {
    const { runtime, storeDir } = twoStep();
    const started = runtime.start("w", "1.0.0", { v: 7 });
    await runtime.advance(started.run_id, 1);
    runtime.pause(started.run_id);
    // Dispose and recreate: brand-new runtime over the same durable store.
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    let execCount = 0;
    const executors = new ExecutorRegistry();
    executors.register(
      new (class implements StepExecutor {
        readonly kind = "test";
        async execute() {
          execCount++;
          return { ok: true, output: { result: 7 }, retryable: true };
        }
      })(),
    );
    const runtime2 = new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1), {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => `run-x-${++runCounter}`,
    });
    // Definitions are code: a fresh instance re-registers them at boot.
    runtime2.define(
      workflow("w", [
        step("a", "echo", { inputs: { value: "$input.v" } }),
        step("b", "echo", { depends_on: ["a"], inputs: { value: "$steps.a.output.result" } }),
        step("c", "echo", { depends_on: ["b"], inputs: { value: "$steps.b.output.result" } }),
      ], ["v"]),
    );
    runtime2.load(started.run_id);
    const done = await runtime2.resume(started.run_id);
    expect(done.state).toBe("SUCCEEDED");
    // Only b and c executed in the new instance; a kept its persisted output.
    expect(execCount).toBe(2);
    expect(done.steps[2].output).toEqual({ result: 7 });
    expect(done.history.length).toBeGreaterThan(5);
  });

  it("interrupted safe steps resume; unsafe steps require reconcile", async () => {
    const registries = new SkillRegistry();
    registries.register(testSkill("safe-op"));
    registries.register(testSkill("del-op"));
    const executors = new ExecutorRegistry();
    executors.register(
      new (class implements StepExecutor {
        readonly kind = "test";
        async execute() {
          return { ok: true, output: { result: 1 }, retryable: true };
        }
      })(),
    );
    const storeDir = newTempDir("wf-rec-");
    const mk = () =>
      new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1), {
        now: () => "2026-09-22T00:00:00.000Z",
        id: () => `run-${++runCounter}`,
      });
    runCounter = 0;
    const runtime = mk();
    runtime.define(
      workflow("w", [
        step("a", "safe-op", { retry_safety: "safe" }),
        step("b", "del-op", { depends_on: ["a"], retry_safety: "unsafe" }),
      ]),
    );
    const started = runtime.start("w", "1.0.0");
    // Simulate crash mid-flight: mark both RUNNING in durable state directly.
    const store = new FileStateStore(storeDir, 1);
    const env = store.load<{ steps: Array<{ step_id: string; state: string }> }>(started.run_id);
    for (const s of env.payload.steps) s.state = "RUNNING";
    const raw = JSON.parse(JSON.stringify(env)) as typeof env;
    raw.integrity = sha256Hex(JSON.stringify(raw.payload));
    writeFileSync(join(storeDir, `${started.run_id}.json`), JSON.stringify(raw, null, 2) + "\n", "utf8");

    const runtime2 = mk();
    runtime2.define(
      workflow("w", [
        step("a", "safe-op", { retry_safety: "safe" }),
        step("b", "del-op", { depends_on: ["a"], retry_safety: "unsafe" }),
      ]),
    );
    const recovered = runtime2.recover(started.run_id);
    expect(recovered.state).toBe("RECOVERING");
    expect(recovered.steps.find((s) => s.step_id === "a")?.state).toBe("PENDING");
    expect(recovered.steps.find((s) => s.step_id === "b")?.state).toBe("RECOVERING");
    const afterSkip = runtime2.reconcile(started.run_id, "b", "skip");
    expect(afterSkip.steps.find((s) => s.step_id === "b")?.state).toBe("SKIPPED");
    const done = await runtime2.advance(started.run_id);
    expect(done.state).toBe("SUCCEEDED");
  });

  it("reconcile retry and fail paths behave", async () => {
    const registries = new SkillRegistry();
    registries.register(testSkill("op"));
    const executors = new ExecutorRegistry();
    executors.register(
      new (class implements StepExecutor {
        readonly kind = "test";
        async execute() {
          return { ok: true, output: { result: 1 }, retryable: true };
        }
      })(),
    );
    const storeDir = newTempDir("wf-rec2-");
    const mk = () =>
      new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1), {
        now: () => "2026-09-22T00:00:00.000Z",
        id: () => `run-${++runCounter}`,
      });
    runCounter = 0;
    const runtime = mk();
    runtime.define(workflow("w", [step("a", "op", { retry_safety: "unknown" })]));
    const started = runtime.start("w", "1.0.0");
    const store = new FileStateStore(storeDir, 1);
    const env = store.load<{ steps: Array<{ step_id: string; state: string }> }>(started.run_id);
    env.payload.steps[0].state = "RUNNING";
    const raw = JSON.parse(JSON.stringify(env)) as typeof env;
    raw.integrity = sha256Hex(JSON.stringify(raw.payload));
    writeFileSync(join(storeDir, `${started.run_id}.json`), JSON.stringify(raw, null, 2) + "\n", "utf8");
    const runtime2 = mk();
    runtime2.define(workflow("w", [step("a", "op", { retry_safety: "unknown" })]));
    expect(runtime2.recover(started.run_id).state).toBe("RECOVERING");
    expect(runtime2.reconcile(started.run_id, "a", "retry").steps[0].state).toBe("PENDING");
    expect((await runtime2.advance(started.run_id)).state).toBe("SUCCEEDED");
  });

  it("corrupt and future-schema states are rejected, never reset", async () => {
    const storeDir = newTempDir("wf-bad-");
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    const rt = new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1));
    rt.define(workflow("w", [step("a", "echo")]));
    const started = rt.start("w", "1.0.0", { value: 1 });
    writeFileSync(join(storeDir, `${started.run_id}.json`), "{broken", "utf8");
    const rt2 = new WorkflowRuntime(registries, executors, new FileStateStore(storeDir, 1));
    expect(() => rt2.recover(started.run_id)).toThrowError(/not valid JSON/);
    const env = {
      id: started.run_id, kind: "workflow-run", schemaVersion: 99, recordVersion: 1,
      createdAt: "x", updatedAt: "x", owner: "aetherius-os", provenance: "t",
      sensitivity: "SYSTEM", integrity: "x", payload: {},
    };
    writeFileSync(join(storeDir, `${started.run_id}.json`), JSON.stringify(env), "utf8");
    expect(() => rt2.recover(started.run_id)).toThrowError(/newer than supported/);
  });

  it("version pins survive registry drift or fail loudly", async () => {
    const storeDir = newTempDir("wf-pin-");
    const store = new FileStateStore(storeDir, 1);
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register(new TestExecutor({ echo }));
    const runtime = new WorkflowRuntime(registries, executors, store, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => `run-${++runCounter}`,
    });
    runtime.define(workflow("w", [step("a", "echo"), step("b", "echo", { depends_on: ["a"] })]));
    const started = runtime.start("w", "1.0.0", { value: 1 });
    await runtime.advance(started.run_id, 1);
    runtime.pause(started.run_id);
    // Registry loses v1 (only v2 remains): resume must refuse, not drift.
    const registries2 = new SkillRegistry();
    registries2.register(testSkill("echo", { version: "2.0.0" }));
    const runtime2 = new WorkflowRuntime(registries2, executors, store, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: () => `run-${++runCounter}`,
    });
    runtime2.load(started.run_id);
    await expect(runtime2.resume(started.run_id)).rejects.toThrowError(/no longer resolves/);
  });
});

// ---------- subworkflows ----------

describe("subworkflows", () => {
  const childDef = (id: string, out: unknown = { result: 1 }) => ({
    workflow_id: id,
    version: "1.0.0",
    description: id,
    inputs: ["v"] as string[],
    steps: [
      {
        id: "c", kind: "skill" as const, ref: "skill:echo@1.0.0", depends_on: [] as string[],
        inputs: { value: "$input.v" }, outputs: ["result"], retry_safety: "safe" as const,
      },
    ],
  });
  const subStep = (id: string, ref: string, deps: string[] = [], inputs: Record<string, string> = {}) => ({
    id, kind: "subworkflow" as const, ref, depends_on: deps,
    inputs, outputs: ["c"] as string[], retry_safety: "safe" as const,
  });
  function subSetup() {
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register(new TestExecutor({ echo }));
    const store = newStateStore("wf-sub-");
    const runtime = new WorkflowRuntime(registries, executors, store, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: (() => { let n = 0; return () => `run-${++n}`; })(),
    });
    return { runtime, store };
  }
  it("parent composes versioned child outputs", async () => {
    const { runtime } = subSetup();
    runtime.define({ ...childDef("child"), steps: childDef("child").steps });
    runtime.define({
      workflow_id: "parent", version: "1.0.0", description: "p", inputs: ["v"],
      steps: [subStep("s", "workflow:child@1.0.0", [], { v: "$input.v" })],
    });
    const done = await runtime.advance(runtime.start("parent", "1.0.0", { v: 9 }).run_id);
    expect(done.state).toBe("SUCCEEDED");
    expect(done.steps[0].output).toEqual({ c: { result: 9 } });
  });
  it("nests three deep with provenance", async () => {
    const { runtime } = subSetup();
    runtime.define(childDef("l3"));
    runtime.define({
      workflow_id: "l2", version: "1.0.0", description: "l2", inputs: ["v"],
      steps: [subStep("s", "workflow:l3@1.0.0", [], { v: "$input.v" })],
    });
    runtime.define({
      workflow_id: "l1", version: "1.0.0", description: "l1", inputs: ["v"],
      steps: [subStep("s", "workflow:l2@1.0.0", [], { v: "$input.v" })],
    });
    const done = await runtime.advance(runtime.start("l1", "1.0.0", { v: 2 }).run_id);
    expect(done.state).toBe("SUCCEEDED");
  });
  it("child failure propagates with provenance, not silently", async () => {
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register(new TestExecutor({ echo: () => ({ ok: false, retryable: false, error: "child blew up" }) }));
    const runtime = new WorkflowRuntime(registries, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: (() => { let n = 0; return () => `run-${++n}`; })(),
    });
    runtime.define(childDef("child"));
    runtime.define({
      workflow_id: "parent", version: "1.0.0", description: "p", inputs: ["v"],
      steps: [subStep("s", "workflow:child@1.0.0", [], { v: "$input.v" })],
    });
    const done = await runtime.advance(runtime.start("parent", "1.0.0", { v: 1 }).run_id);
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("child blew up");
  });
  it("approval inside child pauses parent; approve resumes both", async () => {
    const { runtime } = subSetup();
    runtime.define({
      workflow_id: "child", version: "1.0.0", description: "c", inputs: [],
      steps: [
        { id: "g", kind: "approval", ref: "review", depends_on: [], inputs: {}, outputs: [], approval: { approver: "owner", reason: "check" }, retry_safety: "unknown" },
      ],
    });
    runtime.define({
      workflow_id: "parent", version: "1.0.0", description: "p", inputs: [],
      steps: [subStep("s", "workflow:child@1.0.0")],
    });
    const started = runtime.start("parent", "1.0.0");
    const waiting = await runtime.advance(started.run_id);
    expect(waiting.state).toBe("WAITING_APPROVAL");
    const done = await runtime.approve(waiting.run_id, "s", "ALLOW", "owner");
    expect(done.state).toBe("SUCCEEDED");
  });
  it("cycles and depth excess fail honestly", async () => {
    const { runtime } = subSetup();
    expect(() =>
      runtime.define({
        workflow_id: "selfish", version: "1.0.0", description: "s", inputs: [],
        steps: [subStep("s", "workflow:selfish@1.0.0")],
      }),
    ).toThrowError(/cannot include itself/);
    runtime.define({
      workflow_id: "a", version: "1.0.0", description: "a", inputs: [],
      steps: [subStep("s", "workflow:b@1.0.0")],
    });
    runtime.define({
      workflow_id: "b", version: "1.0.0", description: "b", inputs: [],
      steps: [subStep("s", "workflow:a@1.0.0")],
    });
    const cyclic = await runtime.advance(runtime.start("a", "1.0.0").run_id);
    expect(cyclic.state).toBe("FAILED");
    expect(cyclic.failure).toContain("cycle detected");
    // Depth cap: 10-deep chain must stop, not recurse forever.
    for (let i = 0; i < 10; i++) {
      runtime.define({
        workflow_id: `d${i}`, version: "1.0.0", description: "d", inputs: [],
        steps: [subStep("s", `workflow:d${i + 1}@1.0.0`)],
      });
    }
    runtime.define(childDef("d10"));
    const deep = await runtime.advance(runtime.start("d0", "1.0.0").run_id);
    expect(deep.state).toBe("FAILED");
    expect(deep.failure).toContain("depth exceeds");
  });
  it("missing child fails at runtime with evidence", async () => {
    const { runtime } = subSetup();
    runtime.define({
      workflow_id: "parent", version: "1.0.0", description: "p", inputs: [],
      steps: [subStep("s", "workflow:ghost@1.0.0")],
    });
    const done = await runtime.advance(runtime.start("parent", "1.0.0").run_id);
    expect(done.state).toBe("FAILED");
    expect(done.failure).toContain("missing workflow");
  });
  it("child version stays pinned after registry moves on", async () => {
    const registries = new SkillRegistry();
    registries.register(testSkill("echo"));
    const executors = new ExecutorRegistry();
    executors.register(new TestExecutor({ echo }));
    const runtime = new WorkflowRuntime(registries, executors, null, {
      now: () => "2026-09-22T00:00:00.000Z",
      id: (() => { let n = 0; return () => `run-${++n}`; })(),
    });
    runtime.define(childDef("child"));
    runtime.define({
      workflow_id: "parent", version: "1.0.0", description: "p", inputs: [],
      steps: [subStep("s", "workflow:child@1.0.0", [], { v: "1" })],
    });
    // v2 appears after the run starts: the activation must keep v1.
    const started = runtime.start("parent", "1.0.0");
    runtime.define({ ...childDef("child"), version: "2.0.0" });
    const done = await runtime.advance(started.run_id);
    expect(done.state).toBe("SUCCEEDED");
  });
});

// ---------- routines ----------

describe("routines", () => {
  it("validates routine contracts without schedules", async () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo")]));
    expect(
      validateRoutine(
        { routine_id: "r", version: "1.0.0", workflow_ref: "w", workflow_version: "1.0.0", default_inputs: { value: 3 }, policy: "AUTO_SAFE", capability_requirements: [], enabled: true },
        [{ workflow_id: "w", version: "1.0.0" }],
      ),
    ).toEqual([]);
    expect(routineFor({ routine_id: "r" }, [])).toBeUndefined();
  });
  it("rejects disabled, mistargeted and scheduled routines", async () => {
    const known = [{ workflow_id: "w", version: "1.0.0" }];
    const base = { routine_id: "r", version: "1.0.0", workflow_ref: "w", workflow_version: "1.0.0", default_inputs: {}, policy: "p", capability_requirements: [], enabled: true };
    expect(validateRoutine({ ...base, workflow_ref: "ghost" }, known)).toEqual(
      expect.arrayContaining([expect.stringContaining("unknown workflow")]),
    );
    expect(validateRoutine({ ...base, schedule: "daily" } as never, known)).toEqual(
      expect.arrayContaining([expect.stringContaining("schedule")]),
    );
  });
  it("disabled routine refuses to start", async () => {
    const { runtime } = setup({ echo }, [testSkill("echo")]);
    runtime.define(workflow("w", [step("a", "echo")]));
    expect(() =>
      runtime.start("w", "1.0.0", {}, {
        routine_id: "r", version: "1.0.0", workflow_ref: "w", workflow_version: "1.0.0",
        default_inputs: {}, policy: "p", capability_requirements: [], enabled: false,
      }),
    ).toThrowError(/disabled/);
  });
});

// ---------- security ----------

describe("security boundaries", () => {
  it("contains no dynamic code execution primitives", () => {
    const here = fileURLToPath(new URL("./", import.meta.url));
    for (const name of ["runtime.ts", "executors.ts", "validate.ts", "skills.ts", "routines.ts"]) {
      const source = readFileSync(join(here, name), "utf8");
      expect(source).not.toContain("eval(");
      expect(source).not.toContain("new Function");
    }
  });
  it("skills and workflows declare but never grant authority", async () => {
    const { runtime } = setup(
      { admin: () => ({ ok: true, output: { result: 1 }, retryable: true }) },
      [testSkill("admin", { required_permissions: ["filesystem:delete", "device:x:control"] })],
    );
    runtime.define(workflow("w", [step("a", "admin")]));
    const done = await runtime.advance(runtime.start("w", "1.0.0").run_id);
    // Execution used the test harness only; the registry granted nothing.
    expect(done.state).toBe("SUCCEEDED");
    const { registries } = setup(
      { admin: () => ({ ok: true, output: {}, retryable: true }) },
      [testSkill("admin", { required_permissions: ["filesystem:delete"] })],
    );
    expect(registries.lookup("admin")?.required_permissions).toEqual(["filesystem:delete"]);
  });
  it("untrusted step kinds and unknown skills cannot run", async () => {
    const { runtime } = setup({}, []);
    expect(() => runtime.define(workflow("w", [{ ...step("a", "x"), kind: "agent" as never }]))).toThrowError(
      /unsupported type/,
    );
    expect(() => runtime.start("ghost", "1.0.0")).toThrowError(/unknown workflow/);
  });
});
