import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BenchmarkStore } from "./benchmarks";
import type { CapabilityRequest, ModelCard } from "./capabilities";
import {
  CodexProbe,
  ConfigProbe,
  LMStudioProbe,
  OllamaProbe,
  effectiveStatus,
  type HealthRecord,
} from "./health";
import { routeWithLiveState, type LiveModel } from "./live";
import { FileStateStore } from "../state/store";

function card(over: Partial<ModelCard> & { id: string }): ModelCard {
  return {
    providerId: "p",
    localRemote: "remote",
    capabilities: {
      contextLimit: 128000,
      modalities: ["text"],
      reasoning: true,
      coding: true,
      vision: false,
      audio: false,
      toolUse: true,
      structuredOutput: true,
    },
    costRank: 1,
    healthy: true,
    ...over,
  };
}

function health(over: Partial<HealthRecord> = {}): HealthRecord {
  return { status: "HEALTHY", observedAt: 1000, ttlMs: 60000, source: "LOCAL_PROBE", reason: "ok", ...over };
}

function live(m: ModelCard, h: HealthRecord): LiveModel {
  return { ...m, observed: h, observedFresh: true };
}

const request: CapabilityRequest = {
  minContext: 64000,
  modalities: ["text"],
  coding: true,
  privacy: "cloud-allowed",
};

describe("provider cards", () => {
  it("healthy local provider card", async () => {
    const probe = new OllamaProbe("http://127.0.0.1:9", 500, 60000);
    const r = await probe.probe(1000);
    // Port 9 is discard: nothing listens → honest UNAVAILABLE, never fabricated.
    expect(r.record.status).toBe("UNAVAILABLE");
    expect(r.record.source).toBe("LOCAL_PROBE");
    expect(r.detail).toEqual({ models: [] });
  });
  it("configured-but-not-running stays UNKNOWN, never HEALTHY", async () => {
    const r = await new ConfigProbe("openai", true).probe(1000);
    expect(r.record.status).toBe("UNKNOWN");
    expect(effectiveStatus(r.record, 1000)).toBe("UNKNOWN");
  });
  it("unknown and auth-required states are explicit", async () => {
    const unknown = await new ConfigProbe("gemini", false).probe(1000);
    expect(unknown.record.status).toBe("UNAVAILABLE");
    const auth: HealthRecord = health({ status: "AUTH_REQUIRED", reason: "login needed" });
    expect(effectiveStatus(auth, 1000)).toBe("AUTH_REQUIRED");
  });
  it("stale observations decay to UNKNOWN", () => {
    const fresh = health({ observedAt: 1000, ttlMs: 60000 });
    expect(effectiveStatus(fresh, 61000)).toBe("HEALTHY");
    expect(effectiveStatus(fresh, 61001)).toBe("UNKNOWN");
  });
  it("codex probe separates CLI from auth without reading secrets", async () => {
    const ok = new CodexProbe(async () => ({ stdout: "codex-cli 0.155.1\n", exitCode: 0 }));
    const r = await ok.probe(1000);
    expect(r.record.status).toBe("HEALTHY");
    expect(r.detail).toMatchObject({ cli: true, auth: "UNKNOWN" });
    const missing = new CodexProbe(async () => { throw new Error("spawn ENOENT"); });
    expect((await missing.probe(1000)).record.status).toBe("UNAVAILABLE");
  });
  it("same model through different runtimes stays distinct", () => {
    const a = live(card({ id: "m-ollama", providerId: "local" }), health());
    const b = live(card({ id: "m-lmstudio", providerId: "local" }), health());
    const r = routeWithLiveState([a, b], request, undefined, undefined, 1000);
    expect(r.ranked.map((m) => m.id).sort()).toEqual(["m-lmstudio", "m-ollama"]);
  });
  it("live card round-trips through P17 owned state", () => {
    const store = new FileStateStore(mkdtempSync(join(tmpdir(), "livecard-")), 1);
    const payload = { provider: "local", models: ["qwen"], observed: "HEALTHY" };
    const saved = store.save({
      id: "card-local", kind: "provider-card", schemaVersion: 1, recordVersion: 1,
      createdAt: "2026-09-22T00:00:00.000Z", updatedAt: "2026-09-22T00:00:00.000Z",
      owner: "aetherius-os", provenance: "unit test", sensitivity: "SYSTEM",
      integrity: "", payload,
    });
    expect(store.load("card-local").payload).toEqual(payload);
    expect(saved.integrity).toBeTruthy();
  });
});

describe("routing with live state", () => {
  it("best static candidate unavailable → next healthy selected", () => {
    const models = [
      live(card({ id: "best" }), health({ status: "UNAVAILABLE", reason: "down" })),
      live(card({ id: "next" }), health()),
    ];
    const r = routeWithLiveState(models, request, undefined, undefined, 1000);
    expect(r.ranked.map((m) => m.id)).toEqual(["next"]);
    expect(r.excluded[0]).toMatchObject({ model: "best", observedStatus: "UNAVAILABLE" });
  });
  it("pinned unhealthy provider fails explicitly", () => {
    const models = [live(card({ id: "p" }), health({ status: "UNAVAILABLE", reason: "down" }))];
    const r = routeWithLiveState(models, { ...request, pin: "p" }, undefined, undefined, 1000);
    expect(r.ranked).toEqual([]);
    expect(r.excluded[0].reason).toContain("unavailable");
  });
  it("privacy-required local task never selects cloud", () => {
    const models = [live(card({ id: "cloud" }), health())];
    const r = routeWithLiveState(models, { ...request, privacy: "local-only" }, undefined, undefined, 1000);
    expect(r.ranked).toEqual([]);
    expect(r.excluded[0].reason).toContain("local-only");
  });
  it("all unhealthy → explicit failure; stale never counts as healthy", () => {
    const models = [
      live(card({ id: "old" }), health({ observedAt: 1, ttlMs: 10 })),
      live(card({ id: "down" }), health({ status: "UNAVAILABLE", reason: "x" })),
    ];
    const r = routeWithLiveState(models, request, undefined, undefined, 100000);
    expect(r.ranked).toEqual([]);
    expect(r.excluded.find((e) => e.model === "old")?.reason).toContain("no fresh health");
  });
  it("fresh benchmark evidence deterministically outranks its absence", () => {
    const store = new BenchmarkStore(new Set(["a", "b"]));
    for (const id of ["a", "b"]) {
      store.add({
        provider: "p", model: id, runtime: "local", task: "code-fix", metric: "coding_success",
        value: 0.9, timestamp: 900, environment: "lab", source: "LOCAL_MEASURED", provenance: "t",
      });
    }
    const models = [live(card({ id: "a" }), health()), live(card({ id: "b" }), health())];
    const prefer = { metric: "coding_success", task: "code-fix" };
    const r1 = routeWithLiveState(models, request, store, prefer, 1000);
    // Both have hits → falls back to stable id order; still deterministic.
    expect(r1.ranked.map((m) => m.id)).toEqual(["a", "b"]);
    const store2 = new BenchmarkStore(new Set(["a", "b"]));
    store2.add({
      provider: "p", model: "b", runtime: "local", task: "code-fix", metric: "coding_success",
      value: 0.9, timestamp: 900, environment: "lab", source: "LOCAL_MEASURED", provenance: "t",
    });
    const r2 = routeWithLiveState(models, request, store2, prefer, 1000);
    expect(r2.ranked.map((m) => m.id)).toEqual(["b", "a"]);
    expect(r2.ranked[0].decision).toContain("fresh coding_success evidence");
  });
  it("repeatable: same state, same route", () => {
    const models = [live(card({ id: "a" }), health()), live(card({ id: "b" }), health())];
    const first = routeWithLiveState(models, request, undefined, undefined, 1000);
    for (let i = 0; i < 3; i++) {
      expect(routeWithLiveState(models, request, undefined, undefined, 1000).ranked.map((m) => m.id))
        .toEqual(first.ranked.map((m) => m.id));
    }
  });
});

describe("benchmark provenance", () => {
  it("local, vendor and historical evidence stay distinguishable and preserved", () => {
    const store = new BenchmarkStore();
    const mk = (source: "LOCAL_MEASURED" | "VENDOR_REPORTED" | "HISTORICAL", value: number) => ({
      provider: "p", model: "m", runtime: "r", task: "t", metric: "latency" as const,
      value, timestamp: 1000, environment: "lab", source, provenance: `${source}-doc`,
    });
    store.add(mk("VENDOR_REPORTED", 10));
    store.add(mk("LOCAL_MEASURED", 20));
    store.add(mk("HISTORICAL", 30));
    expect(store.list().map((r) => r.source)).toEqual(["VENDOR_REPORTED", "LOCAL_MEASURED", "HISTORICAL"]);
    expect(store.latestLocal("m", "latency", "t")?.value).toBe(20);
  });
  it("rejects invalid metric, non-finite value and unknown model refs", () => {
    const store = new BenchmarkStore(new Set(["known"]));
    const base = {
      provider: "p", model: "known", runtime: "r", task: "t", metric: "latency",
      value: 1, timestamp: 1, environment: "lab", source: "LOCAL_MEASURED" as const, provenance: "t",
    };
    expect(() => store.add({ ...base, metric: "vibes" })).toThrowError(/unknown metric/);
    expect(() => store.add({ ...base, value: NaN })).toThrowError(/finite/);
    expect(() => store.add({ ...base, model: "ghost" })).toThrowError(/unknown model/);
    expect(store.list()).toEqual([]);
  });
  it("adding never overwrites existing history", () => {
    const store = new BenchmarkStore();
    const base = {
      provider: "p", model: "m", runtime: "r", task: "t", metric: "latency",
      value: 1, timestamp: 1, environment: "lab", source: "LOCAL_MEASURED" as const, provenance: "t",
    };
    store.add(base);
    store.add({ ...base, value: 2, timestamp: 2 });
    expect(store.list().map((r) => r.value)).toEqual([1, 2]);
  });
});

describe("real workstation probes (safe, read-only)", () => {
  it("ollama probe reports truthfully without starting anything", async () => {
    const r = await new OllamaProbe().probe();
    expect(["HEALTHY", "UNAVAILABLE"]).toContain(r.record.status);
    expect(r.record.source).toBe("LOCAL_PROBE");
    expect(r.record.reason.length).toBeGreaterThan(0);
  }, 15000);
  it("lmstudio probe reports truthfully without launching models", async () => {
    const r = await new LMStudioProbe().probe();
    expect(["HEALTHY", "UNAVAILABLE"]).toContain(r.record.status);
    expect(r.record.source).toBe("LOCAL_PROBE");
  }, 15000);
});
