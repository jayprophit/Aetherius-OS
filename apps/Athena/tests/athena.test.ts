import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger, MemoryRepository } from "../../app-kit/src/index.ts";
import type { Account } from "../../app-kit/src/index.ts";
import {
  AgentCoordinator,
  AthenaRuntime,
  EvaluationSuite,
  LongTermMemory,
  ModelRouter,
  Planner,
  ScriptedModel,
  TaskStore,
  ToolRegistry,
  WorkingMemory,
  createAthena,
  estimateTokens,
  type TaskState,
} from "../src/athena.ts";

const ACCOUNT: Account = {
  id: "acc_alice",
  handle: "alice",
  displayName: "Alice",
  email: null,
  roles: ["member"],
  status: "active",
  createdAt: "2026-10-27T00:00:00.000Z",
};

function router() {
  const instance = new ModelRouter();
  instance.register({
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
        capabilities: ["chat"],
        offline: true,
      },
    ],
  });
  instance.register({
    id: "hosted",
    kind: "hosted",
    available: true,
    models: [
      {
        id: "hosted/large",
        providerId: "hosted",
        contextWindow: 128000,
        costPer1kInput: 0.01,
        costPer1kOutput: 0.03,
        capabilities: ["chat", "vision"],
        offline: false,
      },
    ],
  });
  return instance;
}

test("INT-001: routing honours capability, context, cost and offline mode", () => {
  const models = router();
  assert.equal(models.route({ needs: ["chat"], mode: "offline" }).id, "local/small");
  assert.equal(models.route({ needs: ["chat"], mode: "cost" }).id, "local/small");
  assert.equal(models.route({ needs: ["chat"], mode: "quality" }).id, "hosted/large");
  assert.equal(models.route({ needs: ["vision"] }).id, "hosted/large");
  assert.throws(() => models.route({ needs: ["vision"], mode: "offline" }), /no model/);
  assert.throws(() => models.route({ needs: ["telepathy"] }), /no model/);
});

test("INT-002 and INT-007: a tool runs through default-deny authority and is audited", () => {
  const ledger = new EventLedger();
  const tools = new ToolRegistry({ ledger });
  tools.register({
    name: "echo",
    description: "Echo a query",
    parameters: [{ name: "query", type: "string", required: true }],
    allowedRoles: ["member"],
    handler: (args) => `echo:${String(args.query)}`,
  });
  const result = tools.execute(ACCOUNT, "echo", { query: "hello" });
  assert.equal(result.output, "echo:hello");
  assert.equal(ledger.ofType("athena.tool.executed").length, 1);
  assert.throws(
    () => tools.execute({ ...ACCOUNT, roles: ["guest"] }, "echo", { query: "no" }),
    /permission denied/,
  );
  assert.throws(() => tools.execute(ACCOUNT, "echo", { query: 42 }), /must be string/);
  assert.throws(() => tools.execute(ACCOUNT, "echo", {}), /needs query/);
});

test("INT-003: the planner decomposes a goal and binds known tools", () => {
  const plan = new Planner().plan("search for apples then summarise the results", ["search", "summarise"]);
  assert.equal(plan.length, 2);
  assert.equal(plan[0]?.tool, "search");
  assert.equal(plan[1]?.tool, "summarise");
  assert.deepEqual(plan[1]?.dependsOn, ["step-1"]);
});

test("INT-004: working memory is bounded and keeps the system turn", () => {
  const memory = new WorkingMemory(20);
  memory.add("system", "You are Athena.");
  memory.add("user", "x".repeat(200));
  memory.add("assistant", "short");
  assert.ok(memory.tokens() <= 40);
  assert.ok(memory.context().some((turn) => turn.role === "system"));
  assert.ok(memory.context().length < 3);
  assert.equal(estimateTokens("12345678"), 2);
});

test("INT-005: long term memory vector store embedding episodic recall ranks lexically relevant memory first", () => {
  const memory = new LongTermMemory(new MemoryRepository());
  memory.remember("Apples are red and grow on trees", { kind: "fruit" });
  memory.remember("Bananas are yellow", { kind: "fruit" });
  memory.remember("The server is in the basement", { kind: "ops" });
  const hits = memory.recall("apples", 2);
  assert.ok(hits.length >= 1);
  assert.match(hits[0]!.record.text, /Apples/);
  assert.equal(memory.size(), 3);
});

test("INT-006: multi agent coordination agent pool delegate swarm hive picks least loaded capable agent", () => {
  const coordinator = new AgentCoordinator();
  coordinator.register({ id: "agent-a", name: "A", capabilities: ["research"], load: 2 });
  coordinator.register({ id: "agent-b", name: "B", capabilities: ["research"], load: 0 });
  coordinator.register({ id: "agent-c", name: "C", capabilities: ["coding"], load: 0 });
  const first = coordinator.delegate("find sources", "research");
  assert.equal(first.agentId, "agent-b");
  const second = coordinator.delegate("find more", "research");
  assert.equal(second.agentId, "agent-b");
  const third = coordinator.delegate("find even more", "research");
  assert.equal(third.agentId, "agent-a");
  coordinator.complete("agent-a");
  assert.equal(coordinator.delegate("again", "research").agentId, "agent-a");
  assert.throws(() => coordinator.delegate("paint", "art"), /no agent/);
});

test("INT-008: a task checkpoint resumes in a new service instance", () => {
  const repository = new MemoryRepository<TaskState>();
  const first = new TaskStore(repository);
  const task = first.start("do the thing", [{ id: "step-1", description: "do the thing", tool: null, dependsOn: [] }]);
  first.checkpoint(task.id, 1, { tool: "echo", ok: true, output: "done", at: "2026-10-27T00:00:00.000Z" });
  const second = new TaskStore(repository);
  const resumed = second.resume(task.id);
  assert.equal(resumed.cursor, 1);
  assert.equal(resumed.results.length, 1);
  assert.equal(second.finish(task.id).status, "complete");
});

test("INT-009: the evaluation suite reports pass and fail without hiding errors", () => {
  const suite = new EvaluationSuite([
    { name: "greets", input: "alice", expected: "hello alice" },
    { name: "fails", input: "bob", expected: "hello carol" },
  ]);
  const result = suite.run((input) => `hello ${input}`);
  assert.equal(result.passed, 1);
  assert.equal(result.failed, 1);
  assert.equal(result.results[1]?.passed, false);
});

test("INT-010: the local model contract is explicit and offline", () => {
  const model = new ScriptedModel("local/scripted", "local answer");
  assert.equal(model.offline, true);
  assert.equal(model.generate(), "local answer");
});

test("the runtime composes routing, planning, tools, memory and durable state", () => {
  const ledger = new EventLedger();
  const modelRouter = router();
  const tools = new ToolRegistry({ ledger });
  tools.register({
    name: "search",
    description: "Search the corpus",
    parameters: [{ name: "query", type: "string", required: true }],
    allowedRoles: ["member"],
    handler: (args) => ({ hits: [`result for ${String(args.query)}`] }),
  });
  tools.register({
    name: "summarise",
    description: "Summarise results",
    parameters: [{ name: "query", type: "string", required: true }],
    allowedRoles: ["member"],
    handler: () => "a short summary",
  });
  const longTerm = new LongTermMemory(new MemoryRepository());
  const tasks = new TaskStore(new MemoryRepository());
  const runtime = new AthenaRuntime({ router: modelRouter, tools, longTerm, tasks, ledger });

  const result = runtime.run(ACCOUNT, "search for apples then summarise", { mode: "offline" });
  assert.equal(result.modelId, "local/small");
  assert.equal(result.plan.length, 2);
  assert.equal(result.results.length, 2);
  assert.equal(result.status, "complete");
  assert.equal(tasks.resume(result.taskId).cursor, 2);
  assert.equal(longTerm.size(), 1);
  assert.equal(ledger.ofType("athena.run.completed").length, 1);

  const second = runtime.run(ACCOUNT, "search for apples again", { mode: "offline" });
  assert.ok(second.recalled.length >= 1);
});

test("the default factory ships one offline local model and an empty tool set", () => {
  const athena = createAthena();
  assert.equal(athena.router.route({ needs: ["chat"], mode: "offline" }).id, "local/small");
  assert.deepEqual(athena.tools.list(), []);
});
