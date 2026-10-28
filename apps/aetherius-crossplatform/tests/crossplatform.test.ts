import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

import { EventLedger } from "../../app-kit/src/index.ts";
import {
  CapabilitySandbox,
  ConfigService,
  ExtensionRegistry,
  ModuleRegistry,
  Packager,
  RuntimeKernel,
  Telemetry,
  WorkspaceLayout,
  type PackageManifest,
} from "../src/platform.ts";
import { runCli, type CliServices } from "../src/cli.ts";

function setup() {
  const ledger = new EventLedger();
  const telemetry = new Telemetry({ ledger });
  const kernel = new RuntimeKernel({ telemetry });
  const sandbox = new CapabilitySandbox();
  const modules = new ModuleRegistry({ sandbox, telemetry });
  const workspace = new WorkspaceLayout();
  const extensions = new ExtensionRegistry(workspace, { telemetry });
  const config = new ConfigService(
    [
      { key: "host", type: "string", required: true },
      { key: "port", type: "number", default: 8080 },
      { key: "tls", type: "boolean", default: false },
      { key: "token", type: "string", secret: true },
      { key: "mode", type: "string", enum: ["development", "production"] },
    ],
    { telemetry },
  );
  return { ledger, telemetry, kernel, sandbox, modules, workspace, extensions, config };
}

function services(overrides: Partial<CliServices> = {}): CliServices {
  const base = setup();
  base.kernel.boot();
  base.modules.startAll();
  base.extensions.install({
    id: "greeter",
    name: "Greeter",
    version: "1.0.0",
    commands: [
      {
        id: "greeter.hello",
        title: "Say hello",
        run: (args) => `hello ${String(args.name ?? "world")}`,
      },
    ],
    panels: [{ id: "greeter.panel", title: "Greeter", region: "right" }],
  });
  base.extensions.enable("greeter");
  return {
    kernel: base.kernel,
    modules: base.modules,
    config: base.config,
    workspace: base.workspace,
    extensions: base.extensions,
    telemetry: base.telemetry,
    ...overrides,
  };
}

test("PLT-001: the kernel schedules by priority then submission order and reports failures", () => {
  const { kernel, telemetry } = setup();
  kernel.boot();
  const ran: string[] = [];
  kernel.schedule("low", 10, () => ran.push("low"));
  kernel.schedule("high-a", 1, () => ran.push("high-a"));
  kernel.schedule("high-b", 1, () => ran.push("high-b"));
  kernel.schedule("broken", 2, () => {
    throw new Error("boom");
  });
  const result = kernel.run(10);
  assert.deepEqual(ran, ["high-a", "high-b", "low"]);
  assert.equal(result.executed.length, 3);
  assert.deepEqual(result.failures.map((failure) => failure.message), ["boom"]);
  assert.equal(result.remaining, 0);
  assert.equal(kernel.state, "running");
  assert.ok(telemetry.snapshot().logs.some((entry) => entry.level === "error"));
});

test("PLT-001: a task may schedule follow-up work and the step limit leaves work queued", () => {
  const { kernel } = setup();
  kernel.boot();
  kernel.schedule("first", 0, (self) => {
    self.schedule("second", 0, () => undefined);
  });
  const first = kernel.run(1);
  assert.equal(first.executed.length, 1);
  assert.equal(first.remaining, 1);
  assert.equal(kernel.snapshot().queued[0]?.label, "second");
  const second = kernel.run(10);
  assert.equal(second.executed.length, 1);
  assert.equal(second.remaining, 0);
});

test("PLT-001: shutdown hooks run in reverse and failures are reported", () => {
  const { kernel } = setup();
  kernel.boot();
  const ran: string[] = [];
  kernel.onShutdown(() => ran.push("first"));
  kernel.onShutdown(() => ran.push("second"));
  kernel.onShutdown(() => {
    throw new Error("hook failed");
  });
  const result = kernel.shutdown();
  assert.deepEqual(ran, ["second", "first"]);
  assert.equal(result.hooks, 3);
  assert.equal(result.failures.length, 1);
  assert.equal(kernel.state, "stopped");
});

test("PLT-002: modules start in dependency order and stop in reverse", () => {
  const { modules } = setup();
  const events: string[] = [];
  modules.register({
    id: "db",
    version: "1.0.0",
    dependencies: [],
    capabilities: ["storage"],
    start: () => events.push("start:db"),
    stop: () => events.push("stop:db"),
  });
  modules.register({
    id: "api",
    version: "1.0.0",
    dependencies: ["db"],
    capabilities: ["network"],
    start: () => events.push("start:api"),
    stop: () => events.push("stop:api"),
  });
  modules.register({
    id: "ui",
    version: "1.0.0",
    dependencies: ["api"],
    capabilities: ["render"],
    start: () => events.push("start:ui"),
    stop: () => events.push("stop:ui"),
  });
  assert.deepEqual(modules.order(), ["db", "api", "ui"]);
  const started = modules.startAll();
  assert.deepEqual(started.started, ["db", "api", "ui"]);
  assert.equal(modules.state("api"), "started");
  const stopped = modules.stopAll();
  assert.deepEqual(stopped.stopped, ["ui", "api", "db"]);
  assert.deepEqual(events, ["start:db", "start:api", "start:ui", "stop:ui", "stop:api", "stop:db"]);
});

test("PLT-002: a missing dependency, a cycle and a failed start are refused safely", () => {
  const missing = setup().modules;
  missing.register({ id: "app", version: "1.0.0", dependencies: ["absent"], capabilities: [] });
  assert.throws(() => missing.startAll(), /missing module/);

  const cyclic = setup().modules;
  cyclic.register({ id: "a", version: "1.0.0", dependencies: ["b"], capabilities: [] });
  cyclic.register({ id: "b", version: "1.0.0", dependencies: ["a"], capabilities: [] });
  assert.throws(() => cyclic.startAll(), /cycle/);

  const rollback = setup();
  const events: string[] = [];
  rollback.modules.register({
    id: "core",
    version: "1.0.0",
    dependencies: [],
    capabilities: ["core"],
    start: () => events.push("start:core"),
    stop: () => events.push("stop:core"),
  });
  rollback.modules.register({
    id: "app",
    version: "1.0.0",
    dependencies: ["core"],
    capabilities: [],
    start: () => {
      throw new Error("cannot start");
    },
  });
  assert.throws(() => rollback.modules.startAll(), /failed to start/);
  assert.deepEqual(events, ["start:core", "stop:core"]);
  assert.equal(rollback.modules.state("core"), "stopped");
  assert.equal(rollback.modules.state("app"), "failed");
  assert.deepEqual(rollback.sandbox.grantsFor("core"), []);
});

test("PLT-003: capabilities are denied by default and resources are namespaced", () => {
  const sandbox = new CapabilitySandbox();
  assert.throws(() => sandbox.assert("app", "network"), /capability denied/);
  sandbox.grant("app", ["network", "storage"]);
  sandbox.assert("app", "network");
  assert.deepEqual(sandbox.grantsFor("app"), ["network", "storage"]);
  sandbox.assertResource("app", "app/data.json");
  assert.throws(() => sandbox.assertResource("app", "other/data.json"), /resource denied/);
  sandbox.grant("app", ["resource:shared"]);
  sandbox.assertResource("app", "other/data.json");
  assert.throws(() => sandbox.assertResource("app", "app/../secret"), /invalid resource/);
  sandbox.revoke("app", "network");
  assert.equal(sandbox.has("app", "network"), false);
  sandbox.revoke("app");
  assert.deepEqual(sandbox.grantsFor("app"), []);
});

test("PLT-004: the workspace moves, clamps, hides and restores panels", () => {
  const workspace = new WorkspaceLayout();
  const left = workspace.addPanel({ id: "explorer", title: "Explorer", region: "left", size: 200 });
  const center = workspace.addPanel({ id: "editor", title: "Editor", region: "center", size: 800 });
  assert.equal(workspace.active, left.id);
  assert.equal(workspace.resizePanel(center.id, 50).size, 120);
  assert.equal(workspace.resizePanel(center.id, 5000).size, 1200);
  assert.equal(workspace.movePanel(center.id, "right", 0).region, "right");
  assert.equal(workspace.list("right").length, 1);
  assert.equal(workspace.togglePanel(center.id).visible, false);
  assert.equal(workspace.active, left.id);
  assert.throws(() => workspace.activate(center.id), /hidden/);
  assert.throws(() => workspace.addPanel({ id: "explorer", title: "Again", region: "left" }), /already exists/);

  const restored = WorkspaceLayout.restore(workspace.snapshot());
  assert.deepEqual(restored.snapshot(), workspace.snapshot());
  assert.throws(() => WorkspaceLayout.restore({ panels: [], activeId: "missing" }), /active panel/);
  assert.throws(() => WorkspaceLayout.restore("{bad json"), /JSON/);
});

test("PLT-005: extensions contribute and withdraw commands and panels exactly once", () => {
  const { workspace, extensions } = setup();
  extensions.install({
    id: "hello",
    name: "Hello",
    version: "1.0.0",
    commands: [{ id: "hello.run", title: "Run", run: (args) => `hi ${String(args.name)}` }],
    panels: [{ id: "hello.panel", title: "Hello", region: "left" }],
  });
  extensions.enable("hello");
  assert.equal(extensions.execute("hello.run", { name: "Ada" }), "hi Ada");
  assert.ok(workspace.list().some((panel) => panel.id === "hello.panel"));
  assert.equal(extensions.list()[0]?.enabled, true);

  extensions.disable("hello");
  assert.equal(workspace.list().some((panel) => panel.id === "hello.panel"), false);
  assert.throws(() => extensions.execute("hello.run"), /no enabled command/);

  assert.throws(
    () =>
      extensions.install({
        id: "other",
        name: "Other",
        version: "1.0.0",
        commands: [{ id: "hello.run", title: "Duplicate", run: () => "no" }],
      }),
    /already contributed/,
  );
  assert.throws(
    () =>
      extensions.install({
        id: "bad",
        name: "Bad",
        version: "1.0.0",
        panels: [{ id: "hello.panel", title: "Duplicate", region: "left" }],
      }),
    /already contributed/,
  );
});

test("PLT-006: configuration precedence, validation, coercion and redaction", () => {
  const { config } = setup();
  assert.equal(config.get("port")?.value, 8080);
  assert.equal(config.get("port")?.layer, "defaults");
  config.setLayer("profile", { host: "profile.example" });
  config.setLayer("user", { port: 9000 });
  config.setLayer("flags", { port: 9100, tls: true });
  assert.equal(config.get("host")?.value, "profile.example");
  assert.equal(config.get("port")?.value, 9100);
  assert.equal(config.get("port")?.layer, "flags");
  assert.equal(config.provenance("tls"), "flags");
  assert.equal(config.validate().ok, true);
  assert.throws(() => config.setLayer("user", { port: "9000" }), /expects number/);
  assert.throws(() => config.setLayer("user", { mode: "staging" }), /must be one of/);
  assert.throws(() => config.setLayer("user", { unknown: "x" }), /unknown config key/);
  assert.throws(() => config.get("unknown"), /unknown config key/);
  assert.equal(config.parse("port", "1234"), 1234);
  assert.equal(config.parse("tls", "false"), false);
  assert.throws(() => config.parse("port", "abc"), /expects a number/);
  config.setLayer("user", { token: "super-secret" });
  assert.equal(config.toJSON().token, "[redacted]");
  assert.equal(config.toJSON({ redactSecrets: false }).token, "super-secret");
});

test("PLT-006: a required value is reported missing until it is supplied", () => {
  const { config } = setup();
  assert.deepEqual(config.validate(), { ok: false, missing: ["host"] });
  config.setLayer("user", { host: "example.test" });
  assert.deepEqual(config.validate(), { ok: true, missing: [] });
});

test("PLT-007: telemetry filters levels, records spans, counters and audited errors", () => {
  const { telemetry, ledger } = setup();
  assert.equal(telemetry.log("debug", "ignored"), null);
  const info = telemetry.log("info", "started", { pid: 42 });
  assert.equal(info?.level, "info");
  const span = telemetry.startSpan("request", { route: "/health" });
  const ended = telemetry.endSpan(span);
  assert.equal(ended.status, "ok");
  assert.ok((ended.durationMs ?? -1) >= 0);
  telemetry.counter("requests");
  telemetry.counter("requests", 2);
  telemetry.gauge("queue", 3);
  const errorSpan = telemetry.startSpan("broken");
  telemetry.endSpan(errorSpan, "error");
  telemetry.log("error", "request failed", { route: "/health" });
  const snapshot = telemetry.snapshot();
  assert.equal(snapshot.counters.requests, 3);
  assert.equal(snapshot.gauges.queue, 3);
  assert.equal(snapshot.spans.length, 2);
  assert.equal(ledger.ofType("telemetry.log.error").length, 1);
  assert.equal(ledger.ofType("telemetry.span.error").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});

test("PLT-008: packaging creates a verifiable digest and refuses an untested stable release", () => {
  const packager = new Packager();
  const digest = createHash("sha256").update("artifact").digest("hex");
  const manifest = packager.create({
    id: "app",
    name: "App",
    version: "1.2.3",
    channel: "beta",
    artifacts: [{ path: "dist/app.zip", sha256: digest, bytes: 8 }],
    testsPassed: false,
    builtAt: "2026-10-27T00:00:00.000Z",
  });
  assert.equal(packager.verify(manifest).ok, true);
  assert.equal(packager.digest(manifest), packager.digest({ ...manifest }));
  assert.notEqual(packager.digest(manifest), packager.digest({ ...manifest, notes: ["changed"] }));

  assert.throws(
    () =>
      packager.create({
        id: "app",
        name: "App",
        version: "1.2.3",
        channel: "stable",
        artifacts: [{ path: "dist/app.zip", sha256: digest, bytes: 8 }],
        testsPassed: false,
      }),
    /stable release requires/,
  );
  assert.throws(
    () =>
      packager.create({
        id: "app",
        name: "App",
        version: "1.2.3",
        channel: "dev",
        artifacts: [{ path: "dist/app.zip", sha256: "not-a-digest", bytes: 8 }],
        testsPassed: false,
      }),
    /not SHA-256/,
  );
  assert.throws(
    () =>
      packager.create({
        id: "app",
        name: "App",
        version: "1.2.3",
        channel: "dev",
        artifacts: [
          { path: "same.zip", sha256: digest, bytes: 8 },
          { path: "same.zip", sha256: digest, bytes: 8 },
        ],
        testsPassed: false,
      }),
    /listed twice/,
  );

  const broken: PackageManifest = { ...manifest, version: "nope" };
  const check = packager.verify(broken);
  assert.equal(check.ok, false);
  assert.ok(check.reasons.some((reason) => reason.includes("semver")));
});

test("TLS-001..003: the CLI reports status, modules, config and extension commands as JSON", () => {
  const cli = services();
  const status = runCli(["status", "--json"], cli);
  assert.equal(status.exitCode, 0);
  const statusPayload = JSON.parse(status.stdout) as { phase: string; modules: { total: number }; panels: number };
  assert.equal(statusPayload.phase, "running");
  assert.equal(statusPayload.modules.total, 0);
  assert.equal(statusPayload.panels, 1);

  const modules = runCli(["modules"], cli);
  assert.equal(modules.exitCode, 0);

  const config = runCli(["config", "--config", "port=9090", "--json"], cli);
  const configPayload = JSON.parse(config.stdout) as { values: { port: number }; provenance: { port: string } };
  assert.equal(configPayload.values.port, 9090);
  assert.equal(configPayload.provenance.port, "flags");

  const run = runCli(["run", "greeter.hello", "--args", '{"name":"Ada"}', "--json"], cli);
  assert.equal(run.exitCode, 0);
  assert.equal((JSON.parse(run.stdout) as { result: string }).result, "hello Ada");

  const secret = runCli(["config", "token", "--json"], cli);
  assert.equal(secret.exitCode, 2);
  assert.match(secret.stderr, /no value/);
});

test("TLS-001: usage errors exit 2 and operational errors exit 1", () => {
  const cli = services();
  assert.equal(runCli(["nope"], cli).exitCode, 2);
  assert.equal(runCli(["--config", "missing=1"], cli).exitCode, 2);
  assert.equal(runCli(["--args", "[]", "run", "greeter.hello"], cli).exitCode, 2);
  assert.equal(runCli(["run"], cli).exitCode, 2);
  assert.equal(runCli(["run", "absent.command"], cli).exitCode, 1);
  assert.equal(runCli([], cli).exitCode, 2);
  assert.equal(runCli(["--help"], cli).exitCode, 0);
  assert.equal(runCli(["--version", "--json"], cli).exitCode, 0);
  assert.match(runCli(["--help"], cli).stdout, /Usage:/);
});

test("the runtime, modules, workspace, extensions and CLI compose end to end", () => {
  const base = setup();
  base.kernel.boot();
  base.modules.register({
    id: "core",
    version: "1.0.0",
    dependencies: [],
    capabilities: ["core"],
    start: () => undefined,
  });
  base.modules.register({
    id: "app",
    version: "1.0.0",
    dependencies: ["core"],
    capabilities: ["render"],
    start: () => undefined,
  });
  base.modules.startAll();
  base.kernel.schedule("warm", 1, () => base.telemetry.counter("warm"));
  assert.equal(base.kernel.run(10).executed.length, 1);

  const cli: CliServices = {
    kernel: base.kernel,
    modules: base.modules,
    config: base.config,
    workspace: base.workspace,
    extensions: base.extensions,
    telemetry: base.telemetry,
  };
  const status = JSON.parse(runCli(["status", "--json"], cli).stdout) as {
    modules: { total: number; started: number };
  };
  assert.deepEqual(status.modules, { total: 2, started: 2 });
  assert.equal(base.telemetry.snapshot().counters.warm, 1);

  const stopped = base.modules.stopAll();
  assert.deepEqual(stopped.stopped, ["app", "core"]);
  assert.equal(base.kernel.shutdown().failures.length, 0);
});
