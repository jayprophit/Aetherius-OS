import { EventLedger, MemoryRepository, PermissionEngine, basePolicies, newId, nowIso } from "../../app-kit/src/index.ts";
import type { Account, Repository } from "../../app-kit/src/index.ts";

/**
 * Athena intelligence runtime.
 *
 * Athena has no recovered requirements in the supplied corpus. This slice is
 * the candidate scope implied by the intelligence capability family
 * (INT-001..INT-010), implemented as deterministic, inspectable mechanisms.
 * It does not claim a trained model, a live provider connection or a deployed
 * multi-agent swarm.
 */

export interface ModelSpec {
  id: string;
  providerId: string;
  contextWindow: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  capabilities: string[];
  offline: boolean;
}

export interface Provider {
  id: string;
  kind: "local" | "hosted";
  models: ModelSpec[];
  available: boolean;
}

export interface RouteRequest {
  needs: string[];
  minContext?: number;
  mode?: "cost" | "quality" | "offline";
}

/** INT-001: deterministic routing across registered providers. */
export class ModelRouter {
  private readonly providers = new Map<string, Provider>();

  register(provider: Provider): void {
    if (this.providers.has(provider.id)) throw new Error(`provider is already registered: ${provider.id}`);
    if (provider.models.some((model) => model.providerId !== provider.id)) {
      throw new Error(`provider ${provider.id} has a model from another provider`);
    }
    this.providers.set(provider.id, structuredClone(provider));
  }

  setAvailable(providerId: string, available: boolean): void {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`no provider: ${providerId}`);
    provider.available = available;
  }

  models(): ModelSpec[] {
    return [...this.providers.values()]
      .filter((provider) => provider.available)
      .flatMap((provider) => provider.models.map((model) => structuredClone(model)));
  }

  route(request: RouteRequest): ModelSpec {
    const minContext = request.minContext ?? 0;
    const mode = request.mode ?? "cost";
    const candidates = this.models()
      .filter((model) => request.needs.every((need) => model.capabilities.includes(need)))
      .filter((model) => model.contextWindow >= minContext)
      .filter((model) => mode !== "offline" || model.offline);
    if (candidates.length === 0) {
      throw new Error(`no model satisfies: ${request.needs.join(", ") || "any capability"}`);
    }
    return candidates.sort((a, b) => {
      if (mode === "quality") {
        return b.contextWindow - a.contextWindow || a.costPer1kInput - b.costPer1kInput || a.id.localeCompare(b.id);
      }
      return a.costPer1kInput - b.costPer1kInput || b.contextWindow - a.contextWindow || a.id.localeCompare(b.id);
    })[0]!;
  }
}

export interface ToolParameter {
  name: string;
  type: "string" | "number" | "boolean" | "object";
  required?: boolean;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: ToolParameter[];
  allowedRoles: string[];
  handler: (args: Record<string, unknown>, context: { account: Account; at: string }) => unknown;
}

export interface ToolResult {
  tool: string;
  ok: boolean;
  output: unknown;
  at: string;
}

/** INT-002 and INT-007: tool execution behind the shared default-deny policy engine. */
export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition>();
  private readonly permissions: PermissionEngine;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: { permissions?: PermissionEngine; ledger?: EventLedger; clock?: () => Date } = {}) {
    this.permissions = options.permissions ?? new PermissionEngine(basePolicies());
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  register(tool: ToolDefinition): void {
    if (!/^[a-z][a-z0-9_.-]*$/.test(tool.name)) throw new Error(`invalid tool name: ${tool.name}`);
    if (this.tools.has(tool.name)) throw new Error(`tool is already registered: ${tool.name}`);
    if (tool.allowedRoles.length === 0) throw new Error(`tool ${tool.name} allows no role`);
    this.tools.set(tool.name, tool);
    this.permissions.add({
      id: `tool:${tool.name}`,
      resource: `tool:${tool.name}`,
      action: "execute",
      effect: "allow",
      roles: [...tool.allowedRoles],
    });
  }

  list(): { name: string; description: string; parameters: ToolParameter[] }[] {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters.map((parameter) => ({ ...parameter })),
    }));
  }

  execute(account: Account, name: string, args: Record<string, unknown> = {}): ToolResult {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`no tool: ${name}`);
    this.permissions.assert(account, "execute", `tool:${name}`);
    validateArguments(tool, args);
    const at = nowIso(this.clock);
    const output = tool.handler(args, { account, at });
    this.ledger.append({
      type: "athena.tool.executed",
      actor: account.id,
      subject: name,
      data: { arguments: Object.keys(args).sort() },
    });
    return { tool: name, ok: true, output, at };
  }
}

function validateArguments(tool: ToolDefinition, args: Record<string, unknown>): void {
  for (const parameter of tool.parameters) {
    const value = args[parameter.name];
    if (value === undefined) {
      if (parameter.required) throw new Error(`tool ${tool.name} needs ${parameter.name}`);
      continue;
    }
    const actual = Array.isArray(value) ? "object" : typeof value;
    if (actual !== parameter.type) {
      throw new Error(`tool ${tool.name} parameter ${parameter.name} must be ${parameter.type}`);
    }
  }
}

export interface PlanStep {
  id: string;
  description: string;
  tool: string | null;
  dependsOn: string[];
}

/** INT-003: deterministic decomposition, not a hidden model call. */
export class Planner {
  plan(goal: string, availableTools: readonly string[]): PlanStep[] {
    const parts = goal
      .split(/\s+then\s+|;\s*/i)
      .map((part) => part.trim())
      .filter(Boolean);
    if (parts.length === 0) throw new Error("a goal is empty");
    return parts.map((description, index) => {
      const tool = availableTools.find((candidate) => description.toLowerCase().includes(candidate.toLowerCase())) ?? null;
      return {
        id: `step-${index + 1}`,
        description,
        tool,
        dependsOn: index === 0 ? [] : [`step-${index}`],
      };
    });
  }
}

export interface MemoryTurn {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  at: string;
}

/** INT-004: bounded working memory with an explicit token estimate. */
export class WorkingMemory {
  private readonly turns: MemoryTurn[] = [];
  private readonly maxTokens: number;
  private readonly clock: () => Date;

  constructor(maxTokens = 512, clock: () => Date = () => new Date()) {
    this.maxTokens = maxTokens;
    this.clock = clock;
  }

  add(role: MemoryTurn["role"], content: string): void {
    if (!content.trim()) throw new Error("a memory turn is empty");
    this.turns.push({ role, content: content.trim(), at: nowIso(this.clock) });
    this.trim();
  }

  context(): MemoryTurn[] {
    return this.turns.map((turn) => ({ ...turn }));
  }

  tokens(): number {
    return this.turns.reduce((total, turn) => total + estimateTokens(turn.content), 0);
  }

  private trim(): void {
    while (this.tokens() > this.maxTokens && this.turns.length > 1) {
      const removable = this.turns.findIndex((turn) => turn.role !== "system");
      if (removable === -1) break;
      this.turns.splice(removable, 1);
    }
  }
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export interface LongTermRecord {
  id: string;
  text: string;
  metadata: Record<string, string>;
  embedding: number[];
  at: string;
}

export interface RecallHit {
  record: LongTermRecord;
  score: number;
}

/**
 * INT-005: a long-term store with a deterministic lexical embedding.
 *
 * This is a real vector index, but the vector is a hashed bag of words, not a
 * trained embedding model. It is labelled that way so no one mistakes it for
 * semantic understanding.
 */
export class LongTermMemory {
  private readonly records: Repository<LongTermRecord>;
  private readonly clock: () => Date;
  private readonly dimensions: number;

  constructor(records: Repository<LongTermRecord>, options: { clock?: () => Date; dimensions?: number } = {}) {
    this.records = records;
    this.clock = options.clock ?? (() => new Date());
    this.dimensions = options.dimensions ?? 1024;
  }

  remember(text: string, metadata: Record<string, string> = {}): LongTermRecord {
    if (!text.trim()) throw new Error("a memory is empty");
    const record: LongTermRecord = {
      id: newId("mem"),
      text: text.trim(),
      metadata: { ...metadata },
      embedding: embed(text, this.dimensions),
      at: nowIso(this.clock),
    };
    this.records.put(record);
    return structuredClone(record);
  }

  recall(query: string, limit = 5): RecallHit[] {
    const wanted = embed(query, this.dimensions);
    return this.records
      .all()
      .map((record) => ({ record, score: cosine(wanted, record.embedding) }))
      .filter((hit) => hit.score > 0)
      .sort((a, b) => b.score - a.score || a.record.id.localeCompare(b.record.id))
      .slice(0, Math.max(0, limit))
      .map((hit) => ({ record: structuredClone(hit.record), score: hit.score }));
  }

  size(): number {
    return this.records.all().length;
  }
}

function embed(text: string, dimensions: number): number[] {
  const vector = new Array<number>(dimensions).fill(0);
  for (const token of text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)) {
    let hash = 2166136261;
    for (let index = 0; index < token.length; index += 1) {
      hash ^= token.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    vector[Math.abs(hash) % dimensions] += 1;
  }
  const length = Math.sqrt(vector.reduce((total, value) => total + value * value, 0));
  return length === 0 ? vector : vector.map((value) => value / length);
}

function cosine(a: readonly number[], b: readonly number[]): number {
  let total = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) total += a[index]! * b[index]!;
  return total;
}

export interface Agent {
  id: string;
  name: string;
  capabilities: string[];
  load: number;
}

export interface Delegation {
  task: string;
  agentId: string;
  at: string;
}

/** INT-006: capability-based delegation with a visible load counter. */
export class AgentCoordinator {
  private readonly agents = new Map<string, Agent>();
  private readonly delegations: Delegation[] = [];
  private readonly clock: () => Date;

  constructor(clock: () => Date = () => new Date()) {
    this.clock = clock;
  }

  register(agent: Agent): void {
    if (this.agents.has(agent.id)) throw new Error(`agent is already registered: ${agent.id}`);
    if (agent.capabilities.length === 0) throw new Error(`agent ${agent.id} has no capabilities`);
    this.agents.set(agent.id, { ...agent, capabilities: [...agent.capabilities] });
  }

  delegate(task: string, capability: string): Delegation {
    if (!task.trim()) throw new Error("a delegated task is empty");
    const candidates = [...this.agents.values()]
      .filter((agent) => agent.capabilities.includes(capability))
      .sort((a, b) => a.load - b.load || a.id.localeCompare(b.id));
    const agent = candidates[0];
    if (!agent) throw new Error(`no agent can do: ${capability}`);
    agent.load += 1;
    const delegation: Delegation = { task: task.trim(), agentId: agent.id, at: nowIso(this.clock) };
    this.delegations.push(delegation);
    return structuredClone(delegation);
  }

  complete(agentId: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`no agent: ${agentId}`);
    agent.load = Math.max(0, agent.load - 1);
  }

  agentsSnapshot(): Agent[] {
    return [...this.agents.values()].map((agent) => ({ ...agent, capabilities: [...agent.capabilities] }));
  }

  history(): Delegation[] {
    return this.delegations.map((delegation) => structuredClone(delegation));
  }
}

export interface TaskState {
  id: string;
  goal: string;
  status: "running" | "paused" | "complete" | "failed";
  cursor: number;
  steps: PlanStep[];
  results: ToolResult[];
  updatedAt: string;
}

/** INT-008: durable task state that survives a new service instance. */
export class TaskStore {
  private readonly tasks: Repository<TaskState>;
  private readonly clock: () => Date;

  constructor(tasks: Repository<TaskState>, clock: () => Date = () => new Date()) {
    this.tasks = tasks;
    this.clock = clock;
  }

  start(goal: string, steps: PlanStep[]): TaskState {
    const task: TaskState = {
      id: newId("tsk"),
      goal: goal.trim(),
      status: "running",
      cursor: 0,
      steps: structuredClone(steps),
      results: [],
      updatedAt: nowIso(this.clock),
    };
    this.tasks.put(task);
    return structuredClone(task);
  }

  checkpoint(taskId: string, cursor: number, result: ToolResult): TaskState {
    const task = this.require(taskId);
    task.cursor = cursor;
    task.results.push(structuredClone(result));
    task.updatedAt = nowIso(this.clock);
    this.tasks.put(task);
    return structuredClone(task);
  }

  finish(taskId: string, status: "complete" | "failed" = "complete"): TaskState {
    const task = this.require(taskId);
    task.status = status;
    task.updatedAt = nowIso(this.clock);
    this.tasks.put(task);
    return structuredClone(task);
  }

  resume(taskId: string): TaskState {
    return this.require(taskId);
  }

  private require(taskId: string): TaskState {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`no task: ${taskId}`);
    return structuredClone(task);
  }
}

export interface EvalCase {
  name: string;
  input: string;
  expected: string;
}

export interface EvalResult {
  name: string;
  passed: boolean;
  output: string;
  reason: string;
}

/** INT-009: a deterministic evaluation harness. */
export class EvaluationSuite {
  private readonly cases: EvalCase[];

  constructor(cases: readonly EvalCase[]) {
    this.cases = cases.map((testCase) => ({ ...testCase }));
  }

  run(run: (input: string) => string): { passed: number; failed: number; results: EvalResult[] } {
    const results = this.cases.map((testCase) => {
      let output = "";
      let error = "";
      try {
        output = run(testCase.input);
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught);
      }
      const passed = error === "" && output.includes(testCase.expected);
      return {
        name: testCase.name,
        passed,
        output,
        reason: passed ? "contains the expected text" : error || `expected to contain: ${testCase.expected}`,
      };
    });
    return {
      passed: results.filter((result) => result.passed).length,
      failed: results.filter((result) => !result.passed).length,
      results,
    };
  }
}

export interface ModelAdapter {
  readonly id: string;
  readonly offline: boolean;
  generate(prompt: string, options?: { maxTokens?: number }): string;
}

/**
 * INT-010: the local-model contract.
 *
 * A host supplies an adapter (for example an Ollama HTTP adapter). This slice
 * ships only a deterministic scripted adapter for tests; it does not pretend
 * to have run a local LLM.
 */
export class ScriptedModel implements ModelAdapter {
  readonly id: string;
  readonly offline: boolean;
  private readonly response: string;

  constructor(id: string, response: string, offline = true) {
    this.id = id;
    this.response = response;
    this.offline = offline;
  }

  generate(): string {
    return this.response;
  }
}

export interface RunResult {
  taskId: string;
  modelId: string;
  plan: PlanStep[];
  results: ToolResult[];
  recalled: RecallHit[];
  status: TaskState["status"];
}

/** The composition of the capability set into one inspectable run. */
export class AthenaRuntime {
  private readonly router: ModelRouter;
  private readonly tools: ToolRegistry;
  private readonly planner: Planner;
  private readonly working: WorkingMemory;
  private readonly longTerm: LongTermMemory;
  private readonly coordinator: AgentCoordinator;
  private readonly tasks: TaskStore;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: {
    router: ModelRouter;
    tools: ToolRegistry;
    planner?: Planner;
    working?: WorkingMemory;
    longTerm: LongTermMemory;
    coordinator?: AgentCoordinator;
    tasks: TaskStore;
    ledger?: EventLedger;
    clock?: () => Date;
  }) {
    this.router = options.router;
    this.tools = options.tools;
    this.planner = options.planner ?? new Planner();
    this.working = options.working ?? new WorkingMemory();
    this.longTerm = options.longTerm;
    this.coordinator = options.coordinator ?? new AgentCoordinator();
    this.tasks = options.tasks;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  run(account: Account, goal: string, options: { mode?: RouteRequest["mode"]; capability?: string } = {}): RunResult {
    const model = this.router.route({
      needs: options.capability ? [options.capability] : [],
      mode: options.mode ?? "offline",
    });
    const plan = this.planner.plan(goal, this.tools.list().map((tool) => tool.name));
    this.working.add("user", goal);
    const recalled = this.longTerm.recall(goal, 3);
    const task = this.tasks.start(goal, plan);
    const results: ToolResult[] = [];

    for (const step of plan) {
      if (step.tool) {
        const result = this.tools.execute(account, step.tool, { query: step.description });
        results.push(result);
        this.tasks.checkpoint(task.id, plan.indexOf(step) + 1, result);
      }
    }

    const summary = `planned ${plan.length} step(s) on ${model.id}`;
    this.working.add("assistant", summary);
    this.longTerm.remember(`${goal} -> ${summary}`, { taskId: task.id, model: model.id });
    this.tasks.finish(task.id);
    this.ledger.append({
      type: "athena.run.completed",
      actor: account.id,
      subject: task.id,
      data: { model: model.id, steps: plan.length, tools: results.length },
    });
    return {
      taskId: task.id,
      modelId: model.id,
      plan,
      results,
      recalled,
      status: "complete",
    };
  }
}

export function createAthena(): {
  runtime: AthenaRuntime;
  router: ModelRouter;
  tools: ToolRegistry;
  longTerm: LongTermMemory;
  tasks: TaskStore;
} {
  const router = new ModelRouter();
  router.register({
    id: "local",
    kind: "local",
    available: true,
    models: [
      {
        id: "local/small",
        providerId: "local",
        contextWindow: 8192,
        costPer1kInput: 0,
        costPer1kOutput: 0,
        capabilities: ["chat", "summarise"],
        offline: true,
      },
    ],
  });
  const tools = new ToolRegistry();
  const longTerm = new LongTermMemory(new MemoryRepository());
  const tasks = new TaskStore(new MemoryRepository());
  const runtime = new AthenaRuntime({ router, tools, longTerm, tasks });
  return { runtime, router, tools, longTerm, tasks };
}
