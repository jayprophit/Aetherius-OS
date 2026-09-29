/**
 * REQ-p19-workflows: skills, workflows and routines runtime.
 *
 * Workflow runs are recorded state machines advanced explicitly; cycle and
 * depth violations fail with evidence rather than recursing.
 */
import type { FileStateStore } from "../state/store";
import { parseSkillRef, type SkillRegistry } from "./skills";
import { parseWorkflowRef, validateWorkflow } from "./validate";
import type { ExecutorRegistry, StepOutcome } from "./executors";
import type {
  Routine,
  StepRun,
  Workflow,
  WorkflowRun,
  WorkflowStep,
} from "./types";

export interface RuntimeOptions {
  now?: () => string;
  id?: () => string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getPath(root: unknown, path: string[]): unknown {
  let current = root;
  for (const seg of path) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as Record<string, unknown>)[seg];
  }
  return current;
}

const BINDING_RE = /^\$(input|steps)\.([A-Za-z0-9_.-]+)$/;

interface TimeoutResult {
  outcome?: StepOutcome;
  timedOut: boolean;
}

function runWithTimeout(
  task: Promise<StepOutcome>,
  timeoutMs: number,
  controller: AbortController,
): Promise<TimeoutResult> {
  if (timeoutMs <= 0) {
    return task.then(
      (outcome) => ({ outcome, timedOut: false }),
      (error: unknown) => { throw error; },
    );
  }
  return new Promise<TimeoutResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort(new Error("step timeout"));
      resolve({ timedOut: true });
    }, timeoutMs);
    task.then(
      (outcome) => { clearTimeout(timer); resolve({ outcome, timedOut: false }); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

/**
 * Deterministic workflow runtime. Sequential execution in declared order;
 * no randomness, no wall-clock races, no model calls. Durable state flows
 * through the P17 store when provided.
 */
export class WorkflowRuntime {
  private readonly skills: SkillRegistry;
  private readonly executors: ExecutorRegistry;
  private readonly store: FileStateStore | null;
  private readonly workflows = new Map<string, Workflow>();
  private readonly runs = new Map<string, WorkflowRun>();
  private readonly now: () => string;
  private readonly makeId: () => string;
  private seq = 0;
  private cancelledRuns = new Set<string>();
  private readonly aborters = new Map<string, AbortController>();

  constructor(
    skills: SkillRegistry,
    executors: ExecutorRegistry,
    store: FileStateStore | null = null,
    options: RuntimeOptions = {},
  ) {
    this.skills = skills;
    this.executors = executors;
    this.store = store;
    this.now = options.now ?? (() => new Date().toISOString());
    this.makeId =
      options.id ??
      (() => `run-${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`);
  }

  define(workflow: Workflow): Workflow {
    const problems = validateWorkflow(workflow, this.skills);
    if (problems.length > 0) {
      throw new Error(`invalid workflow: ${problems.join("; ")}`);
    }
    const key = `${workflow.workflow_id}@${workflow.version}`;
    this.workflows.set(key, JSON.parse(JSON.stringify(workflow)) as Workflow);
    return workflow;
  }

  getWorkflow(id: string, version: string): Workflow | null {
    return this.workflows.get(`${id}@${version}`) ?? null;
  }

  start(
    workflowId: string,
    version: string,
    inputs: Record<string, unknown> = {},
    routine?: Routine,
  ): WorkflowRun {
    const workflow = this.getWorkflow(workflowId, version);
    if (!workflow) throw new Error(`unknown workflow ${workflowId}@${version}`);
    if (routine && (routine.workflow_ref !== workflowId || routine.workflow_version !== version)) {
      throw new Error(`routine ${routine.routine_id} does not target ${workflowId}@${version}`);
    }
    if (routine && !routine.enabled) throw new Error(`routine ${routine.routine_id} is disabled`);
    // Pin skill versions at start so later registry changes cannot move a run.
    const skillPins: Record<string, string> = {};
    for (const step of workflow.steps) {
      if (step.kind !== "skill") continue;
      const ref = parseSkillRef(step.ref);
      if (!ref) throw new Error(`bad skill ref ${step.ref}`);
      const skill = this.skills.lookup(ref.skillId, ref.version);
      if (!skill) throw new Error(`missing skill ${step.ref}`);
      skillPins[ref.skillId] = skill.version;
    }
    const run: WorkflowRun = {
      run_id: this.makeId(),
      workflow_id: workflowId,
      workflow_version: version,
      routine_id: routine?.routine_id,
      skill_pins: skillPins,
      inputs: JSON.parse(JSON.stringify(inputs)) as Record<string, unknown>,
      state: "READY",
      steps: workflow.steps.map((s) => ({
        step_id: s.id,
        state: "PENDING",
        attempts: [],
        approvals: [],
      })),
      history: [],
      created_at: this.now(),
      updated_at: this.now(),
    };
    this.emit(run, "run.defined", undefined, `workflow ${workflowId}@${version}`);
    run.state = "RUNNING";
    this.emit(run, "run.started");
    this.runs.set(run.run_id, run);
    this.persist(run);
    return this.snapshot(run.run_id);
  }

  get(runId: string): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    return JSON.parse(JSON.stringify(run)) as WorkflowRun;
  }

  /** Attach a persisted run (e.g. after recreating the runtime) without mutating it. */
  load(runId: string): WorkflowRun {
    const persisted = this.loadPersisted(runId);
    this.runs.set(runId, persisted);
    return this.snapshot(runId);
  }

  /** Advance until waiting, terminal, or step budget exhausted. */
  async advance(runId: string, maxSteps = 1000): Promise<WorkflowRun> {
    const run = this.requireLive(runId, ["RUNNING", "RECOVERING"]);
    let budget = maxSteps;
    while (budget-- > 0) {
      if (run.state !== "RUNNING" && run.state !== "RECOVERING") break;
      const next = this.nextReady(run);
      if (!next) {
        this.finishIfDone(run);
        break;
      }
      await this.executeStep(run, next.step_id);
    }
    this.persist(run);
    return this.snapshot(runId);
  }

  pause(runId: string): WorkflowRun {
    const run = this.requireLive(runId, ["RUNNING", "WAITING_APPROVAL", "RECOVERING"]);
    run.state = "PAUSED";
    this.emit(run, "run.paused");
    this.persist(run);
    return this.snapshot(runId);
  }

  async resume(runId: string): Promise<WorkflowRun> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    if (run.state !== "PAUSED") throw new Error(`cannot resume from ${run.state}`);
    // Stability: pinned versions must still resolve; registry drift fails loudly.
    for (const [skillId, version] of Object.entries(run.skill_pins)) {
      if (!this.skills.lookup(skillId, version)) {
        throw new Error(`pinned skill no longer resolves: ${skillId}@${version}`);
      }
    }
    run.state = "RUNNING";
    this.emit(run, "run.resumed");
    this.persist(run);
    return this.advance(runId);
  }

  async approve(runId: string, stepId: string, decision: "ALLOW" | "DENY", by: string): Promise<WorkflowRun> {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    if (run.state !== "WAITING_APPROVAL") throw new Error(`run is ${run.state}, not waiting approval`);
    const step = run.steps.find((s) => s.step_id === stepId);
    if (!step || step.state !== "WAITING_APPROVAL") {
      throw new Error(`step ${stepId} is not waiting approval`);
    }
    step.approvals.push({ decision, at: this.now(), by });
    if (decision === "ALLOW") {
      const def = this.stepDef(run, stepId);
      if (def.kind === "approval" || def.approval) {
        // Approval checkpoint passed: the approval itself was the work.
        step.state = "SUCCEEDED";
        this.emit(run, "step.approved", stepId, `approved by ${by}`);
      } else if (def.kind === "subworkflow" && step.child_run_id) {
        // Approval propagates INTO the waiting child run first (recursive:
        // nesting of any depth resolves bottom-up), then the parent
        // re-executes to reconcile the completed child exactly once.
        const child = this.runs.get(step.child_run_id);
        const waitingChildStep = child?.steps.find((s) => s.state === "WAITING_APPROVAL");
        if (child && waitingChildStep) {
          await this.approve(child.run_id, waitingChildStep.step_id, decision, by);
        }
        step.state = "PENDING";
        this.emit(run, "step.approved-will-execute", stepId, `approved by ${by}; resuming child`);
      } else {
        // Executor-signalled approval (e.g. bridge action): the approved
        // action must now execute exactly once. Re-queue so advance
        // re-executes it; downstream idempotency (same action/request id)
        // guarantees single execution.
        step.state = "PENDING";
        this.emit(run, "step.approved-will-execute", stepId, `approved by ${by}; re-executing once`);
      }
      run.state = "RUNNING";
      this.persist(run);
      return this.advance(runId);
    }
    step.state = "FAILED";
    run.state = "FAILED";
    run.failure = `approval denied at step ${stepId} by ${by}`;
    this.emit(run, "step.denied", stepId, run.failure);
    this.persist(run);
    return this.snapshot(runId);
  }

  cancel(runId: string): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    if (["SUCCEEDED", "FAILED", "CANCELLED", "TIMED_OUT"].includes(run.state)) {
      throw new Error(`run already terminal: ${run.state}`);
    }
    this.cancelledRuns.add(runId);
    this.aborters.get(runId)?.abort(new Error("run cancelled"));
    for (const step of run.steps) {
      if (step.state === "RUNNING" || step.state === "WAITING_APPROVAL" || step.state === "RETRY_WAIT") {
        step.state = "CANCELLED";
      }
    }
    run.state = "CANCELLED";
    this.emit(run, "run.cancelled");
    this.persist(run);
    return this.snapshot(runId);
  }

  /**
   * Recover a persisted run after interruption. RUNNING steps are never
   * assumed successful: retry-safe steps return to PENDING, others become
   * RECOVERING and require explicit reconcile().
   */
  recover(runId: string): WorkflowRun {
    const persisted = this.loadPersisted(runId);
    this.runs.set(runId, persisted);
    const run = persisted;
    let needsOwner = false;
    for (const step of run.steps) {
      if (step.state !== "RUNNING") continue;
      const def = this.stepDef(run, step.step_id);
      if (def.retry_safety === "safe") {
        step.state = "PENDING";
        this.emit(run, "step.recovered-retry", step.step_id, "retry-safe: will rerun");
      } else {
        step.state = "RECOVERING";
        needsOwner = true;
        this.emit(
          run, "step.recovered-unknown", step.step_id,
          `retry safety ${def.retry_safety}: outcome unknown, reconcile required`,
        );
      }
    }
    run.state = needsOwner ? "RECOVERING" : "RUNNING";
    this.emit(run, "run.recovered", undefined, needsOwner ? "owner reconcile required" : "clean resume");
    this.persist(run);
    return this.snapshot(runId);
  }

  reconcile(runId: string, stepId: string, decision: "retry" | "skip" | "fail"): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    if (run.state !== "RECOVERING") throw new Error(`run is ${run.state}, nothing to reconcile`);
    const step = run.steps.find((s) => s.step_id === stepId);
    if (!step || step.state !== "RECOVERING") {
      throw new Error(`step ${stepId} is not awaiting reconcile`);
    }
    if (decision === "retry") {
      step.state = "PENDING";
      this.emit(run, "step.reconciled-retry", stepId, "explicit owner decision");
    } else if (decision === "skip") {
      step.state = "SKIPPED";
      this.emit(run, "step.reconciled-skip", stepId, "explicit owner decision");
    } else {
      step.state = "FAILED";
      run.state = "FAILED";
      run.failure = `reconciled as failed at step ${stepId} by explicit decision`;
      this.emit(run, "step.reconciled-fail", stepId, run.failure);
      this.persist(run);
      return this.snapshot(runId);
    }
    const remaining = run.steps.some((s) => s.state === "RECOVERING");
    run.state = remaining ? "RECOVERING" : "RUNNING";
    this.persist(run);
    return this.snapshot(runId);
  }

  /** Inspectable execution state for operators/IDE/Genesis tooling. */
  summarize(runId: string): {
    run_id: string; workflow: string; state: string;
    steps: Array<{ step_id: string; state: string; attempts: number }>;
    waiting_approval: string[]; next_ready: string[];
  } {
    const run = this.get(runId);
    return {
      run_id: run.run_id,
      workflow: `${run.workflow_id}@${run.workflow_version}`,
      state: run.state,
      steps: run.steps.map((s) => ({ step_id: s.step_id, state: s.state, attempts: s.attempts.length })),
      waiting_approval: run.steps.filter((s) => s.state === "WAITING_APPROVAL").map((s) => s.step_id),
      next_ready: this.nextReadyIds(run),
    };
  }

  // -- internals ----------------------------------------------------------

  private workflowOf(run: WorkflowRun): Workflow {
    const workflow = this.getWorkflow(run.workflow_id, run.workflow_version);
    if (!workflow) throw new Error(`workflow ${run.workflow_id}@${run.workflow_version} no longer defined`);
    return workflow;
  }

  private stepDef(run: WorkflowRun, stepId: string): WorkflowStep {
    const def = this.workflowOf(run).steps.find((s) => s.id === stepId);
    if (!def) throw new Error(`unknown step ${stepId}`);
    return def;
  }

  private requireLive(runId: string, states: string[]): WorkflowRun {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`unknown run ${runId}`);
    if (!states.includes(run.state)) throw new Error(`run is ${run.state}`);
    return run;
  }

  private emit(run: WorkflowRun, kind: string, stepId?: string, detail?: string): void {
    run.history.push({ at: this.now(), seq: this.seq++, kind, step_id: stepId, detail });
    run.updated_at = this.now();
  }

  private snapshot(runId: string): WorkflowRun {
    return this.get(runId);
  }

  private persist(run: WorkflowRun): void {
    if (!this.store) return;
    const recordVersion = this.store.exists(run.run_id)
      ? this.store.load<WorkflowRun>(run.run_id).recordVersion + 1
      : 1;
    this.store.save(
      {
        id: run.run_id,
        kind: "workflow-run",
        schemaVersion: 1,
        recordVersion,
        createdAt: run.created_at,
        updatedAt: this.now(),
        owner: "aetherius-os",
        provenance: `workflow ${run.workflow_id}@${run.workflow_version}`,
        sensitivity: "SYSTEM",
        integrity: "",
        payload: JSON.parse(JSON.stringify(run)) as unknown,
      },
      { expectedRecordVersion: recordVersion > 1 ? recordVersion - 1 : undefined },
    );
  }

  private loadPersisted(runId: string): WorkflowRun {
    if (!this.store) throw new Error("no durable store configured");
    return this.store.load<WorkflowRun>(runId).payload;
  }

  private finishIfDone(run: WorkflowRun): void {
    const states = new Set(run.steps.map((s) => s.state));
    if (states.size > 0 && [...states].every((s) => s === "SUCCEEDED" || s === "SKIPPED")) {
      run.state = "SUCCEEDED";
      this.emit(run, "run.succeeded");
    }
  }

  private nextReadyIds(run: WorkflowRun): string[] {
    const workflow = this.workflowOf(run);
    const done = new Map(run.steps.map((s) => [s.step_id, s.state]));
    const out: string[] = [];
    for (const def of workflow.steps) {
      const state = done.get(def.id);
      if (state !== "PENDING" && state !== "READY") continue;
      if (def.depends_on.every((d) => done.get(d) === "SUCCEEDED" || done.get(d) === "SKIPPED")) {
        out.push(def.id);
      }
    }
    return out;
  }

  private nextReady(run: WorkflowRun): { step_id: string } | null {
    const ids = this.nextReadyIds(run);
    return ids.length > 0 ? { step_id: ids[0] } : null;
  }

  private resolveInputs(run: WorkflowRun, stepId: string, template: Record<string, string>): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(template)) {
      const match = BINDING_RE.exec(raw.trim());
      if (!match) {
        out[key] = raw;
        continue;
      }
      const [, scope, path] = match;
      if (scope === "input") {
        const [name, ...rest] = path.split(".");
        if (!(name in run.inputs)) throw new Error(`step ${stepId}: missing input ${name}`);
        out[key] = rest.length === 0 ? run.inputs[name] : getPath(run.inputs[name], rest);
      } else {
        const [target, ...rest] = path.split(".");
        const step = run.steps.find((s) => s.step_id === target);
        if (!step || step.state !== "SUCCEEDED" || step.output === undefined) {
          throw new Error(`step ${stepId}: output of ${target} unavailable`);
        }
        // Convention: $steps.<id>.output.<path> — the literal output
        // segment addresses the step's output object.
        if (rest.length === 0 || rest[0] !== "output") {
          throw new Error(`step ${stepId}: step binding must address ${target}.output.<path>`);
        }
        out[key] = rest.length === 1 ? step.output : getPath(step.output, rest.slice(1));
      }
    }
    return out;
  }

  private skillExecutorKind(def: WorkflowStep): string {
    const ref = parseSkillRef(def.ref);
    const skill = ref ? this.skills.lookup(ref.skillId, ref.version) : null;
    if (!skill) throw new Error(`missing skill ${def.ref}`);
    return skill.execution_kind;
  }

  /** Maximum subworkflow nesting depth (cycle + runaway protection). */
  private static readonly MAX_DEPTH = 8;

  /**
   * Compose a versioned child workflow as one parent step. The child runs
   * through the same runtime (same policy, history and persistence); its
   * outputs become the step output. Approval pauses propagate upward and
   * resume downward; failures propagate with provenance.
   */
  private async executeSubworkflow(run: WorkflowRun, step: StepRun, def: WorkflowStep): Promise<void> {
    const ref = parseWorkflowRef(def.ref);
    if (!ref) {
      return this.failStep(run, step, def.id, `bad workflow ref ${def.ref}`);
    }
    const ancestors = [...(run.ancestors ?? []), run.workflow_id];
    if (ancestors.includes(ref.workflowId)) {
      return this.failStep(run, step, def.id, `subworkflow cycle detected: ${[...ancestors, ref.workflowId].join(" -> ")}`);
    }
    if (ancestors.length > WorkflowRuntime.MAX_DEPTH) {
      return this.failStep(run, step, def.id, `subworkflow depth exceeds ${WorkflowRuntime.MAX_DEPTH}`);
    }
    const childDef = this.getWorkflow(ref.workflowId, ref.version ?? this.latestWorkflowVersion(ref.workflowId));
    if (!childDef) {
      return this.failStep(run, step, def.id, `missing workflow ${def.ref}`);
    }
    let inputs: Record<string, unknown>;
    try {
      inputs = this.resolveInputs(run, step.step_id, def.inputs);
    } catch (error) {
      return this.failStep(run, step, def.id, error instanceof Error ? error.message : String(error));
    }
    // Reuse an existing child across resume/retry instead of spawning anew.
    let child = step.child_run_id ? this.runs.get(step.child_run_id) ?? null : null;
    if (!child) {
      // Child ids must satisfy P17 state-id charset: sanitize separators.
      const childRunId = `${run.run_id}-${def.id}`.replace(/[^A-Za-z0-9_-]+/g, "-");
      const childRun: WorkflowRun = {
        run_id: childRunId,
        workflow_id: childDef.workflow_id,
        workflow_version: childDef.version,
        ancestors,
        skill_pins: {},
        inputs,
        state: "READY",
        steps: childDef.steps.map((s) => ({ step_id: s.id, state: "PENDING", attempts: [], approvals: [] })),
        history: [],
        created_at: this.now(),
        updated_at: this.now(),
      };
      for (const s of childDef.steps) {
        if (s.kind !== "skill") continue;
        const skillRef = parseSkillRef(s.ref);
        const skill = skillRef ? this.skills.lookup(skillRef.skillId, skillRef.version) : null;
        if (!skill) {
          return this.failStep(run, step, def.id, `missing skill ${s.ref} in child ${childDef.workflow_id}`);
        }
        childRun.skill_pins[skillRef?.skillId ?? s.id] = skill.version;
      }
      childRun.state = "RUNNING";
      this.emit(childRun, "run.defined", undefined, `subworkflow of ${run.run_id}`);
      this.emit(childRun, "run.started");
      this.runs.set(childRun.run_id, childRun);
      step.child_run_id = childRun.run_id;
      this.persist(childRun);
      child = childRun;
    }
    step.state = "RUNNING";
    this.emit(run, "step.subworkflow-started", step.step_id, `child ${child.run_id}`);
    const childLive = (this.runs.get(child.run_id) as WorkflowRun).state;
    if (childLive === "PAUSED") {
      // The parent owns the child: advancing the parent resumes a paused
      // child explicitly (recorded), never silently.
      const pausedChild = this.runs.get(child.run_id) as WorkflowRun;
      pausedChild.state = "RUNNING";
      this.emit(pausedChild, "run.resumed", undefined, `resumed by parent ${run.run_id}`);
      this.persist(pausedChild);
    }
    if (["RUNNING", "RECOVERING"].includes((this.runs.get(child.run_id) as WorkflowRun).state)) {
      await this.advance(child.run_id);
    }
    const finished = this.runs.get(child.run_id) as WorkflowRun;
    this.persist(run);
    if (finished.state === "SUCCEEDED") {
      const outputs: Record<string, unknown> = {};
      for (const s of finished.steps) {
        if (s.output !== undefined) outputs[s.step_id] = s.output;
      }
      if (def.output_required_keys && def.output_required_keys.length > 0) {
        const missing = def.output_required_keys.filter((k) => !(k in outputs));
        if (missing.length > 0) {
          return this.failStep(run, step, def.id, `child outputs missing required keys ${missing.join(",")}`);
        }
      }
      step.output = outputs;
      step.state = "SUCCEEDED";
      this.emit(run, "step.succeeded", step.step_id, `child ${child.run_id} succeeded`);
      return;
    }
    if (finished.state === "WAITING_APPROVAL") {
      step.state = "WAITING_APPROVAL";
      run.state = "WAITING_APPROVAL";
      this.emit(run, "step.subworkflow-waiting", step.step_id, `child ${child.run_id} is waiting approval`);
      this.persist(run);
      return;
    }
    step.state = "FAILED";
    run.state = "FAILED";
    run.failure = `subworkflow ${child.run_id} ended ${finished.state}: ${finished.failure ?? "failed"}`;
    this.emit(run, "step.failed", step.step_id, run.failure);
    this.persist(run);
  }

  private failStep(run: WorkflowRun, step: StepRun, stepId: string, message: string): void {
    step.state = "FAILED";
    run.state = "FAILED";
    run.failure = message;
    this.emit(run, "step.failed", stepId, message);
    this.persist(run);
  }

  private latestWorkflowVersion(workflowId: string): string {
    const versions: string[] = [];
    for (const key of this.workflows.keys()) {
      const at = key.lastIndexOf("@");
      if (key.slice(0, at) === workflowId) versions.push(key.slice(at + 1));
    }
    versions.sort();
    if (versions.length === 0) throw new Error(`unknown workflow ${workflowId}`);
    return versions[versions.length - 1];
  }

  private async executeStep(run: WorkflowRun, stepId: string): Promise<void> {
    const def = this.stepDef(run, stepId);
    const step = run.steps.find((s) => s.step_id === stepId) as StepRun;
    if (this.cancelledRuns.has(run.run_id)) {
      step.state = "CANCELLED";
      run.state = "CANCELLED";
      this.emit(run, "run.cancelled", stepId);
      return;
    }

    if (def.kind === "approval" || def.approval) {
      step.state = "WAITING_APPROVAL";
      run.state = "WAITING_APPROVAL";
      this.emit(run, "step.waiting-approval", stepId, def.approval?.reason ?? def.ref);
      this.persist(run);
      return;
    }

    if (def.kind === "subworkflow") {
      await this.executeSubworkflow(run, step, def);
      return;
    }

    const kind = def.kind === "skill" ? this.skillExecutorKind(def) : def.kind;
    const executor = this.executors.get(kind);
    if (!executor) {
      step.state = "FAILED";
      run.state = "FAILED";
      run.failure = `no executor registered for kind ${def.kind}`;
      this.emit(run, "step.failed", stepId, run.failure);
      this.persist(run);
      return;
    }

    let inputs: Record<string, unknown>;
    try {
      inputs = this.resolveInputs(run, stepId, def.inputs);
    } catch (error) {
      step.state = "FAILED";
      run.state = "FAILED";
      run.failure = error instanceof Error ? error.message : String(error);
      this.emit(run, "step.failed", stepId, run.failure);
      this.persist(run);
      return;
    }

    const declaredPermissions =
      def.kind === "skill"
        ? (this.skills.lookup(parseSkillRef(def.ref)?.skillId ?? "", parseSkillRef(def.ref)?.version)?.required_permissions ?? [])
        : [];
    const maxAttempts = def.retry?.max_attempts ?? 1;
    const controller = new AbortController();
    this.aborters.set(run.run_id, controller);
    step.state = "RUNNING";
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (this.cancelledRuns.has(run.run_id)) {
          step.state = "CANCELLED";
          run.state = "CANCELLED";
          this.emit(run, "run.cancelled", stepId);
          return;
        }
        const started = this.now();
        let outcome;
        try {
          const task = executor.execute(
            def,
            {
              runId: run.run_id, workflowId: run.workflow_id, workflowVersion: run.workflow_version,
              step: def, inputs, declaredPermissions, attempt, signal: controller.signal,
            },
          );
          if (def.timeout_ms && def.timeout_ms > 0) {
            const raced = await this.withTimeout(task, def.timeout_ms, controller);
            if (typeof raced === "object" && raced !== null && "__timedOut" in raced) {
              step.attempts.push({
                attempt, started_at: started, ended_at: this.now(),
                ok: false, retryable: def.retry_safety === "safe", error: `timeout after ${def.timeout_ms}ms`,
              });
              step.state = "TIMED_OUT";
              run.state = "TIMED_OUT";
              run.failure = `step ${stepId} timed out after ${def.timeout_ms}ms`;
              this.emit(run, "step.timed-out", stepId, run.failure);
              return;
            }
            outcome = raced;
          } else {
            outcome = await task;
          }
        } catch (error) {
          outcome = { ok: false, retryable: false, error: errorMessage(error) };
        }
        step.attempts.push({
          attempt, started_at: started, ended_at: this.now(),
          ok: outcome.ok, retryable: outcome.retryable, error: outcome.error,
        });
        // Executor-signalled states take precedence over ok/failed.
        if (outcome.waitingApproval) {
          step.state = "WAITING_APPROVAL";
          run.state = "WAITING_APPROVAL";
          this.emit(run, "step.waiting-approval", stepId, outcome.approvalId ?? outcome.error ?? "external approval");
          this.persist(run);
          return;
        }
        if (outcome.unknownOutcome) {
          // Transmitted but unconfirmed: never assume success or failure.
          step.state = "RECOVERING";
          run.state = "RECOVERING";
          this.emit(run, "step.unknown-outcome", stepId, outcome.error ?? "unknown outcome; reconcile required");
          this.persist(run);
          return;
        }
        if (outcome.ok) {
          if (def.output_required_keys && def.output_required_keys.length > 0) {
            const missing = def.output_required_keys.filter(
              (k) => typeof outcome.output !== "object" || outcome.output === null ||
                !(k in (outcome.output as Record<string, unknown>)),
            );
            if (missing.length > 0) {
              step.state = "FAILED";
              run.state = "FAILED";
              run.failure = `step ${stepId}: output missing required keys ${missing.join(",")}`;
              this.emit(run, "step.failed", stepId, run.failure);
              return;
            }
          }
          step.output = outcome.output;
          step.state = "SUCCEEDED";
          this.emit(run, "step.succeeded", stepId, `attempt ${attempt}`);
          return;
        }
        const retryable =
          outcome.retryable && def.retry !== undefined && def.retry.retry_on !== "none";
        this.emit(run, "step.attempt-failed", stepId, `attempt ${attempt}: ${outcome.error ?? "failed"}`);
        if (!retryable || attempt >= maxAttempts) {
          step.state = "FAILED";
          run.state = "FAILED";
          run.failure = `step ${stepId} failed after ${attempt} attempt(s): ${outcome.error ?? "failed"}`;
          this.emit(run, "step.failed", stepId, run.failure);
          return;
        }
        step.state = "RETRY_WAIT";
        this.emit(run, "step.retry-wait", stepId, `attempt ${attempt + 1} of ${maxAttempts}`);
      }
    } finally {
      this.aborters.delete(run.run_id);
    }
  }

  private withTimeout<T>(
    task: Promise<T>,
    timeoutMs: number,
    controller: AbortController,
  ): Promise<T | { __timedOut: true }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        controller.abort(new Error("step timeout"));
        resolve({ __timedOut: true });
      }, timeoutMs);
      task.then(
        (value) => { clearTimeout(timer); resolve(value); },
        (error: unknown) => { clearTimeout(timer); reject(error); },
      );
    });
  }
}

export interface WorkflowRunSummary {
  run_id: string;
  state: string;
  steps: Array<{ step_id: string; state: string; attempts: number }>;
}
