import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { DurableEventLog } from "./log";
import { LoopbackTransport, WebSocketTransport } from "./transport";
import { TransportError } from "./types";
import type { LogEvent, Subscriber } from "./types";

function makeLog(retained = 1000): DurableEventLog {
  const root = mkdtempSync(join(tmpdir(), "rt-"));
  return new DurableEventLog(new FileStateStore(root, 1), "aetherius-os", {
    retained,
    now: () => "2026-09-23T00:00:00.000Z",
  });
}

const sub = (id: string, channels: readonly string[] = ["news"]): Subscriber => ({ subscriberId: id, channels });

describe("durable event log", () => {
  it("sequences monotonically and replays from any point", () => {
    const log = makeLog();
    const a = log.publish("news", "item", { n: 1 });
    const b = log.publish("news", "item", { n: 2 });
    expect(a.seq).toBe(1);
    expect(b.seq).toBe(2);
    expect(log.head("news")).toBe(2);
    expect(log.replay("news", 0).events.map((e) => e.seq)).toEqual([1, 2]);
    expect(log.replay("news", 1).events.map((e) => e.seq)).toEqual([2]);
    expect(log.replay("news", 2).events).toEqual([]);
  });

  it("sequences survive restarts via the store", () => {
    const root = mkdtempSync(join(tmpdir(), "rt-restart-"));
    const store = new FileStateStore(root, 1);
    const first = new DurableEventLog(store, "aetherius-os", { now: () => "2026-09-23T00:00:00.000Z" });
    first.publish("news", "item", { n: 1 });
    const second = new DurableEventLog(store, "aetherius-os", { now: () => "2026-09-23T00:00:00.000Z" });
    const resumed = second.publish("news", "item", { n: 2 });
    expect(resumed.seq).toBe(2);
    expect(second.replay("news", 0).events).toHaveLength(2);
  });

  it("retention floor fails honestly instead of skipping", () => {
    const log = makeLog(2);
    log.publish("news", "item", { n: 1 });
    log.publish("news", "item", { n: 2 });
    log.publish("news", "item", { n: 3 });
    expect(log.replay("news", 2).events.map((e) => e.seq)).toEqual([3]);
    expect(() => log.replay("news", 0)).toThrowError(/resync required/);
  });

  it("rejects malformed channels, events and seqs", () => {
    const log = makeLog();
    expect(() => log.publish("../evil", "item", {})).toThrowError(/invalid channel/);
    expect(() => log.publish("news", "  ", {})).toThrowError(/kind is required/);
    expect(() => log.publish("news", "item", [1])).toThrowError(/must be an object/);
    expect(() => log.replay("news", -1)).toThrowError(/non-negative integer/);
    expect(() => new DurableEventLog(new FileStateStore(mkdtempSync(join(tmpdir(), "rt-")), 1), "o", { retained: 0 })).toThrowError(/positive integer/);
  });
});

describe("loopback transport", () => {
  it("delivers live and replays backlog on resume", () => {
    const t = new LoopbackTransport(makeLog());
    const seen: LogEvent[] = [];
    t.on("news", (e) => seen.push(e));
    t.publish(sub("a"), "news", "item", { n: 1 });
    t.publish(sub("a"), "news", "item", { n: 2 });
    expect(seen.map((e) => e.seq)).toEqual([1, 2]);
    // Reconnect from scratch: full backlog, then incremental resume.
    expect(t.resume(sub("b"), "news", 0).events.map((e) => e.seq)).toEqual([1, 2]);
    const head = t.resume(sub("b"), "news", 0).head;
    expect(head).toBe(2);
    t.publish(sub("a"), "news", "item", { n: 3 });
    expect(t.resume(sub("b"), "news", head).events.map((e) => e.seq)).toEqual([3]);
  });

  it("enforces channel access control", () => {
    const t = new LoopbackTransport(makeLog());
    t.publish(sub("a"), "news", "item", {});
    expect(() => t.publish(sub("intruder", ["other"]), "news", "item", {})).toThrowError(/may not read news/);
    expect(() => t.resume(sub("intruder", ["other"]), "news", 0)).toThrowError(/may not read news/);
    expect(() => t.liveTail({ subscriberId: " ", channels: ["news"] }, "news")).toThrowError(/subscriber id is required/);
    expect(t.liveTail(sub("a"), "news", 1).map((e) => e.seq)).toEqual([1]);
  });
});

describe("websocket transport", () => {
  it("declares unavailability instead of pretending", () => {
    const t = new WebSocketTransport();
    expect(t.capabilities()).toMatchObject({ kind: "websocket", available: false });
    expect(() => t.publish(sub("a"), "news", "item", {})).toThrowError(TransportError);
    expect(() => t.resume(sub("a"), "news", 0)).toThrowError(/TRANSPORT_UNAVAILABLE|no realtime peer/);
  });
});
