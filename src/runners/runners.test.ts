import { describe, expect, it } from "vitest";
import { ContainerRunner, LocalDirectoryRunner, SshRunner } from "./backends";
import { requireTornDown, teardownOwed, transition } from "./lifecycle";
import { applySync, diffManifests, manifestOf } from "./sync";
import { RunnerError } from "./types";
import type { RunRecord, RunSpec, WorkspaceSpec } from "./types";

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

function workspace(): WorkspaceSpec {
  return { workspaceId: "ws-1", manifest: {} };
}

function spec(over: Partial<RunSpec> = {}): RunSpec {
  return {
    argv: ["build"],
    env: {},
    timeoutMs: 5000,
    isolation: { network: "none", filesystem: "temp-only", label: "test" },
    simulatedResult: { exitCode: 0, stdout: "ok\n" },
    ...over,
  };
}

describe("runner lifecycle", () => {
  function defined(): RunRecord {
    return {
      runId: "r1", runnerId: "local-sim", kind: "local-directory", simulated: true,
      workspace: workspace(), spec: spec(), state: "DEFINED", events: [], tornDown: false,
    };
  }

  it("advances only through declared transitions", () => {
    let r = defined();
    r = transition(r, "PROVISIONING");
    r = transition(r, "READY");
    r = transition(r, "RUNNING");
    r = transition(r, "SUCCEEDED");
    expect(teardownOwed(r)).toBe(true);
    expect(() => requireTornDown(r)).toThrowError(RunnerError);
    r = transition(r, "TEARDOWN");
    r = transition(r, "TORN_DOWN");
    expect(r.tornDown).toBe(true);
    expect(teardownOwed(r)).toBe(false);
    expect(() => requireTornDown(r)).not.toThrow();
  });

  it("rejects skips and backwards moves", () => {
    expect(() => transition(defined(), "RUNNING")).toThrowError(/not allowed/);
    expect(() => transition(defined(), "TORN_DOWN")).toThrowError(/not allowed/);
    const ready = transition(transition(defined(), "PROVISIONING"), "READY");
    expect(() => transition(ready, "SUCCEEDED")).toThrowError(/not allowed/);
  });
});

describe("workspace sync", () => {
  it("computes added/modified/deleted deterministically", () => {
    const before = manifestOf(new Map([["a.txt", enc("1")], ["b.txt", enc("2")], ["gone.txt", enc("x")]]));
    const after = manifestOf(new Map([["a.txt", enc("1")] , ["b.txt", enc("CHANGED")], ["new.txt", enc("n")]]));
    expect(diffManifests(before, after)).toEqual({ added: ["new.txt"], modified: ["b.txt"], deleted: ["gone.txt"] });
  });

  it("rejects paths escaping the workspace", () => {
    expect(() => manifestOf(new Map([["../evil", enc("x")]]))).toThrowError(/unsafe/);
    expect(() => manifestOf(new Map([["/abs", enc("x")]]))).toThrowError(/unsafe/);
  });

  it("merges per conflict policy", () => {
    const base = new Map([["f.txt", enc("base")], ["keep.txt", enc("k")]]);
    const existing = new Map([["f.txt", enc("mine")], ["keep.txt", enc("k")]]);
    const incoming = new Map([["f.txt", enc("theirs")], ["keep.txt", enc("k")], ["new.txt", enc("n")]]);
    expect(() => applySync(base, existing, incoming, "error")).toThrowError(/sync conflicts on f\.txt/);
    const theirs = applySync(base, existing, incoming, "incoming-wins");
    expect(new TextDecoder().decode(theirs.merged.get("f.txt"))).toBe("theirs");
    expect(theirs.diff.added).toEqual(["new.txt"]);
    const mine = applySync(base, existing, incoming, "existing-wins");
    expect(new TextDecoder().decode(mine.merged.get("f.txt"))).toBe("mine");
    expect(mine.merged.get("new.txt")).toBeDefined();
  });
});

describe("local honest-sim runner", () => {
  it("provisions, syncs, runs declared results and tears down", async () => {
    const runner = new LocalDirectoryRunner({ now: () => "2026-09-23T00:00:00.000Z" });
    expect(runner.capabilities()).toMatchObject({ simulated: true, available: true });
    let record = await runner.provision(workspace());
    expect(record.state).toBe("READY");
    expect(record.simulated).toBe(true);

    const diff = await runner.sync("ws-1", new Map([["src/a.ts", enc("x")]]));
    expect(diff).toEqual({ added: ["src/a.ts"], modified: [], deleted: [] });
    const diff2 = await runner.sync("ws-1", new Map([["src/a.ts", enc("y")]]));
    expect(diff2).toEqual({ added: [], modified: ["src/a.ts"], deleted: [] });

    record = await runner.run(record, spec());
    expect(record.state).toBe("SUCCEEDED");
    expect(record.exitCode).toBe(0);
    expect(record.events.map((e) => e.kind)).toEqual(["provisioned", "stream", "exited"]);
    expect(teardownOwed(record)).toBe(true);

    record = await runner.teardown(record);
    expect(record.state).toBe("TORN_DOWN");
    expect(record.tornDown).toBe(true);
  });

  it("replays nonzero exits as FAILED and enforces guards", async () => {
    const runner = new LocalDirectoryRunner({ now: () => "2026-09-23T00:00:00.000Z" });
    let record = await runner.provision(workspace());
    record = await runner.run(record, spec({ simulatedResult: { exitCode: 3, stderr: "boom\n" } }));
    expect(record.state).toBe("FAILED");
    expect(record.exitCode).toBe(3);

    const fresh = await runner.provision(workspace());
    await expect(runner.run(fresh, spec({ argv: [] }))).rejects.toThrowError(/non-empty argv/);
    await expect(runner.run(fresh, spec({ timeoutMs: 0 }))).rejects.toThrowError(/timeout/);
    await expect(
      runner.run(fresh, spec({ isolation: { network: "none", filesystem: "workspace-rw", label: "x" } })),
    ).rejects.toThrowError(/temp-only/);
    await expect(runner.run(fresh, spec({ simulatedResult: undefined }))).rejects.toThrowError(/declared/);
    await expect(runner.sync("ws-1", new Map([["../evil", enc("x")]]))).rejects.toThrowError(/unsafe/);
  });
});

describe("unavailable backends", () => {
  it("ssh and container runners declare unavailability and refuse work", async () => {
    for (const runner of [new SshRunner(), new ContainerRunner()]) {
      expect(runner.capabilities().available).toBe(false);
      expect(runner.capabilities().unavailableReason).toBeTruthy();
      const failure = await runner.provision(workspace()).catch((err: unknown) => err);
      expect(failure).toBeInstanceOf(RunnerError);
      expect((failure as RunnerError).code).toBe("RUNNER_UNAVAILABLE");
    }
    expect(new ContainerRunner().capabilities().unavailableReason).toContain("Docker");
  });

  it("running a non-READY record fails", async () => {
    const runner = new LocalDirectoryRunner();
    const record = await runner.provision(workspace());
    const running = { ...record, state: "RUNNING" as const };
    await expect(runner.run(running, spec())).rejects.toThrowError(/not READY/);
  });
});
