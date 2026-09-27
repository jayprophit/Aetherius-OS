import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileStateStore } from "../state/store";
import { DurableEventLog } from "./log";
import { LoopbackTransport } from "./transport";
import type { Subscriber } from "./types";
import {
  ACK_LEVELS,
  COMPRESSIONS,
  DELIVERY_STATES,
  LINK_STATES,
  MESSAGE_DIGEST_ALGORITHM,
  acknowledge,
  createStore,
  drainEligible,
  dropMessage,
  enqueue,
  expireSweep,
  fragmentData,
  markSent,
  messageStatus,
  packData,
  reassembleGroup,
  retryEligible,
  snapshotStore,
  unpackData,
  verifyPayload,
} from "./degradedLink";
import type { EnqueueInput, MessageStore } from "./degradedLink";

const AT = "2026-09-27T13:00:00.000Z";
const NOW = 1_800_000_000_000;
const LATER = NOW + 60_000;

function makeTransport(): LoopbackTransport {
  const root = mkdtempSync(join(tmpdir(), "dl-"));
  const log = new DurableEventLog(new FileStateStore(root, 1), "aetherius-os", {
    now: () => AT,
  });
  return new LoopbackTransport(log);
}

const sub = (id = "op-1", channels: readonly string[] = ["work"]): Subscriber => ({
  subscriberId: id,
  channels,
});

/** Dimension-specific fixtures: every message declares its own fields. */
function message(over: Partial<EnqueueInput> = {}): EnqueueInput {
  return {
    messageId: "msg-1",
    sequence: 0,
    priority: 0,
    expiresAt: NOW + 600_000,
    compression: "none",
    payload: { kind: "ping" },
    signature: null,
    maxAttempts: 3,
    createdAt: AT,
    provenance: "test",
    observedAt: AT,
    ...over,
  };
}

function enqueued(over: Partial<EnqueueInput> = {}, nowMs = NOW): { store: MessageStore; transport: LoopbackTransport } {
  const transport = makeTransport();
  const { store } = enqueue(createStore(100), transport, sub(), "work", message(over), nowMs);
  return { store, transport };
}

describe("degraded link: registered vocabulary", () => {
  it("declares link states, delivery states, ack levels, compressions, and the digest algorithm", () => {
    expect([...LINK_STATES]).toEqual(["HEALTHY", "DEGRADED", "OFFLINE", "UNKNOWN"]);
    expect([...DELIVERY_STATES]).toEqual(["QUEUED", "SENT", "ACKNOWLEDGED", "DELAYED", "DROPPED", "EXPIRED"]);
    expect([...ACK_LEVELS]).toEqual(["TRANSPORT", "RELAY", "DESTINATION"]);
    expect([...COMPRESSIONS]).toEqual(["none", "gzip"]);
    expect(MESSAGE_DIGEST_ALGORITHM).toBe("sha256");
  });
});

describe("degraded link: store-and-forward enqueue", () => {
  it("stores, hashes, and publishes through the existing transport", () => {
    const transport = makeTransport();
    const { store, receipt } = enqueue(createStore(100), transport, sub(), "work", message(), NOW);
    expect(receipt.duplicate).toBe(false);
    expect(receipt.digest).toMatch(/^[0-9a-f]{64}$/);
    expect(receipt.logSeq).toBe(1);
    expect(store.messages["msg-1"]!.deliveryState).toBe("QUEUED");
    expect(store.messages["msg-1"]!.payloadHash).toBe(receipt.digest);
    expect(verifyPayload(store.messages["msg-1"]!)).toBe(true);
  });

  it("is idempotent for identical redelivery and conflicts on changed content", () => {
    const { store, transport } = enqueued();
    const same = enqueue(store, transport, sub(), "work", message(), NOW);
    expect(same.receipt.duplicate).toBe(true);
    expect(Object.keys(same.store.messages)).toHaveLength(1);
    expect(() => enqueue(store, transport, sub(), "work", message({ payload: { kind: "pong" } }), NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_CONFLICT" }),
    );
  });

  it("refuses already-expired mail and enforces the bound", () => {
    const { store, transport } = enqueued();
    expect(() =>
      enqueue(store, transport, sub(), "work", message({ messageId: "msg-old", expiresAt: NOW - 1 }), NOW),
    ).toThrowError(expect.objectContaining({ code: "DEGRADED_EXPIRED" }));
    const tiny = createStore(1);
    const first = enqueue(tiny, makeTransport(), sub(), "work", message(), NOW).store;
    expect(() =>
      enqueue(first, makeTransport(), sub(), "work", message({ messageId: "msg-2" }), NOW),
    ).toThrowError(expect.objectContaining({ code: "DEGRADED_BUFFER_FULL" }));
  });

  it("rejects malformed identity, sequence, TTL, and timestamps", () => {
    const { store, transport } = enqueued();
    expect(() => enqueue(store, transport, sub(), "work", message({ messageId: "" }), NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => enqueue(store, transport, sub(), "work", message({ sequence: -1 }), NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => enqueue(store, transport, sub(), "work", message({ maxAttempts: 0 }), NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => enqueue(store, transport, sub(), "work", { ...message(), observedAt: "" } as never, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_EVIDENCE_REQUIRED" }),
    );
  });

  it("rejects authority, secret, and persona keys on the envelope", () => {
    const { store, transport } = enqueued();
    expect(() => enqueue(store, transport, sub(), "work", { ...message(), authorized: true } as never, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_AUTHORITY_REJECTED" }),
    );
    expect(() => enqueue(store, transport, sub(), "work", { ...message(), signingKey: "sk" } as never, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_SECRET_REJECTED" }),
    );
    expect(() => enqueue(store, transport, sub(), "work", { ...message(), persona: "p" } as never, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown envelope fields and bad signature shapes", () => {
    const { store, transport } = enqueued();
    expect(() => enqueue(store, transport, sub(), "work", { ...message(), urgency: 1 } as never, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_UNKNOWN_FIELD" }),
    );
    expect(() =>
      enqueue(store, transport, sub(), "work", message({ messageId: "m2", signature: { algorithm: "x" } as never }), NOW),
    ).toThrowError(expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }));
  });
});

describe("degraded link: link-gated drain", () => {
  it("drains all queued on HEALTHY in priority then sequence order", () => {
    const transport = makeTransport();
    let store = createStore(100);
    for (const [id, seq, priority] of [["m-low", 0, 0], ["m-high", 1, 5], ["m-mid", 2, 5]] as const) {
      store = enqueue(store, transport, sub(), "work", message({ messageId: id, sequence: seq, priority }), NOW).store;
    }
    const eligible = drainEligible(store, { state: "HEALTHY", observedAt: AT }, NOW);
    expect(eligible.map((m) => m.messageId)).toEqual(["m-high", "m-mid", "m-low"]);
  });

  it("holds everything on OFFLINE and UNKNOWN", () => {
    const { store } = enqueued();
    expect(drainEligible(store, { state: "OFFLINE", observedAt: AT }, NOW)).toEqual([]);
    expect(drainEligible(store, { state: "UNKNOWN", observedAt: AT }, NOW)).toEqual([]);
  });

  it("requires an explicit caller-supplied floor under DEGRADED", () => {
    const { store } = enqueued({ priority: 3 });
    expect(() => drainEligible(store, { state: "DEGRADED", observedAt: AT }, NOW)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_BAD_PRIORITY_FLOOR" }),
    );
    const gated = drainEligible(store, { state: "DEGRADED", priorityFloor: 5, observedAt: AT }, NOW);
    expect(gated).toEqual([]);
    const open = drainEligible(store, { state: "DEGRADED", priorityFloor: 3, observedAt: AT }, NOW);
    expect(open.map((m) => m.messageId)).toEqual(["msg-1"]);
  });

  it("never drains expired messages and never mutates the store", () => {
    const { store } = enqueued();
    const snapshot = JSON.stringify(store);
    const eligible = drainEligible(store, { state: "HEALTHY", observedAt: AT }, LATER + 600_001);
    expect(eligible).toEqual([]);
    expect(JSON.stringify(store)).toBe(snapshot);
  });
});

describe("degraded link: send attempt is not delivery", () => {
  it("marks sent with an attempt counted, staying unacknowledged", () => {
    const { store } = enqueued();
    const next = markSent(store, "msg-1", AT);
    expect(next.messages["msg-1"]!.deliveryState).toBe("SENT");
    expect(next.messages["msg-1"]!.attemptsUsed).toBe(1);
  });

  it("rejects sends for unknown messages and exhausted budgets", () => {
    const { store } = enqueued({ maxAttempts: 1 });
    expect(() => markSent(store, "msg-ghost", AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_UNKNOWN_MESSAGE" }),
    );
    const sent = markSent(store, "msg-1", AT);
    expect(() => markSent(sent, "msg-1", AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_RETRY_EXHAUSTED" }),
    );
  });

  it("never mutates the caller store", () => {
    const { store } = enqueued();
    const snapshot = JSON.stringify(store);
    markSent(store, "msg-1", AT);
    expect(JSON.stringify(store)).toBe(snapshot);
  });
});

describe("degraded link: acknowledgements", () => {
  it("acknowledges at the declared level, idempotently", () => {
    const { store } = enqueued();
    const sent = markSent(store, "msg-1", AT);
    const acked = acknowledge(sent, "msg-1", "DESTINATION", AT);
    expect(acked.messages["msg-1"]!.deliveryState).toBe("ACKNOWLEDGED");
    expect(acked.messages["msg-1"]!.acks).toEqual([{ level: "DESTINATION", at: AT }]);
    expect(acknowledge(acked, "msg-1", "DESTINATION", AT)).toBe(acked);
  });

  it("accepts out-of-order levels independently", () => {
    const { store } = enqueued();
    const sent = markSent(store, "msg-1", AT);
    const acked = acknowledge(acknowledge(sent, "msg-1", "RELAY", AT), "msg-1", "TRANSPORT", AT);
    expect(acked.messages["msg-1"]!.acks.map((a) => a.level)).toEqual(["RELAY", "TRANSPORT"]);
  });

  it("rejects acks for unknown messages and unknown levels", () => {
    const { store } = enqueued();
    expect(() => acknowledge(store, "msg-ghost", "TRANSPORT", AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_UNKNOWN_ACK" }),
    );
    expect(() => acknowledge(store, "msg-1", "BUSINESS" as never, AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
  });
});

describe("degraded link: retry eligibility, never scheduling", () => {
  it("reports eligibility with reasons, scheduling nothing", () => {
    const { store } = enqueued({ maxAttempts: 1 });
    expect(retryEligible(store, "msg-1", NOW)).toEqual({ eligible: true, reason: "never attempted" });
    const sent = markSent(store, "msg-1", AT);
    expect(retryEligible(sent, "msg-1", NOW)).toEqual({ eligible: false, reason: "attempts exhausted 1/1" });
    const acked = acknowledge(sent, "msg-1", "TRANSPORT", AT);
    expect(retryEligible(acked, "msg-1", NOW)).toEqual({ eligible: false, reason: "already acknowledged" });
    expect(retryEligible(store, "msg-ghost", NOW)).toEqual({ eligible: false, reason: "unknown message msg-ghost" });
  });

  it("exposes no timer, daemon, scheduler, network, placement, or auth surface", async () => {
    // Behavioral verbs only: domain vocabulary (delivery states, store as
    // caller-held data) is legitimate and asserted separately by the
    // vocabulary test above.
    const module = await import("./degradedLink");
    const names = Object.keys(module);
    for (const banned of ["timer", "daemon", "interval", "schedule", "watch", "poll", "spawn", "execut", "fetch", "http", "socket", "place", "cloud", "approv", "authoriz", "grant", "deploy", "migrat", "upgrade", "publish", "subscrib", "persist", "server", "database"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});

describe("degraded link: expiry sweep and explicit drop", () => {
  it("expires lapsed messages on a caller-driven tick", () => {
    const { store } = enqueued();
    expect(expireSweep(store, NOW).messages["msg-1"]!.deliveryState).toBe("QUEUED");
    const swept = expireSweep(store, LATER + 600_001);
    expect(swept.messages["msg-1"]!.deliveryState).toBe("EXPIRED");
    expect(retryEligible(swept, "msg-1", LATER + 600_001).eligible).toBe(false);
  });

  it("never delivers expired messages through the drain", () => {
    const { store } = enqueued();
    const swept = expireSweep(store, LATER + 600_001);
    expect(drainEligible(swept, { state: "HEALTHY", observedAt: AT }, LATER + 600_001)).toEqual([]);
  });

  it("drops only with an explicit reason, and never an acknowledged message", () => {
    const { store } = enqueued();
    const dropped = dropMessage(store, "msg-1", "superseded by msg-2", AT);
    expect(dropped.messages["msg-1"]!.deliveryState).toBe("DROPPED");
    expect(dropped.dropped).toEqual([{ messageId: "msg-1", reason: "superseded by msg-2", at: AT }]);
    expect(() => dropMessage(store, "msg-1", "", AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_EVIDENCE_REQUIRED" }),
    );
    const acked = acknowledge(markSent(store, "msg-1", AT), "msg-1", "TRANSPORT", AT);
    expect(() => dropMessage(acked, "msg-1", "late", AT)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_BAD_TRANSITION" }),
    );
  });
});

describe("degraded link: fragments reassemble only when complete", () => {
  it("splits and rejoins exactly", () => {
    const fragments = fragmentData("g1", "abcdefghij", 4);
    expect(fragments).toHaveLength(3);
    expect(fragments.map((f) => f.fragmentIndex)).toEqual([0, 1, 2]);
    expect(fragments.every((f) => f.fragmentCount === 3)).toBe(true);
    expect(reassembleGroup([...fragments].reverse())).toBe("abcdefghij");
  });

  it("names missing indices instead of pretending completeness", () => {
    const fragments = fragmentData("g1", "abcdefghij", 4);
    expect(() => reassembleGroup([fragments[0]!, fragments[2]!])).toThrowError(
      expect.objectContaining({ code: "DEGRADED_FRAGMENT_GAP" }),
    );
    try {
      reassembleGroup([fragments[0]!, fragments[2]!]);
      throw new Error("expected gap");
    } catch (error) {
      expect((error as Error).message).toContain("1");
    }
  });

  it("rejects duplicate fragments and mixed groups", () => {
    const fragments = fragmentData("g1", "abcdefgh", 4);
    expect(() => reassembleGroup([...fragments, fragments[0]!])).toThrowError(
      expect.objectContaining({ code: "DEGRADED_DUPLICATE_MESSAGE" }),
    );
    expect(() => reassembleGroup([{ ...fragments[0]!, groupId: "g2" }, fragments[1]!])).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
  });

  it("validates fragment inputs", () => {
    expect(() => fragmentData("", "abc", 2)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => fragmentData("g1", "", 2)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => fragmentData("g1", "abc", 0)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => reassembleGroup([])).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
  });
});

describe("degraded link: compression is real or refused", () => {
  it("round-trips gzip and passes none through", () => {
    const packed = packData("hello world hello world", "gzip");
    expect(packed).not.toBe("hello world hello world");
    expect(unpackData(packed, "gzip")).toBe("hello world hello world");
    expect(unpackData("plain", "none")).toBe("plain");
  });

  it("rejects unknown algorithms and mismatched data", () => {
    expect(() => packData("x", "zstd" as never)).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
    expect(() => unpackData("not-gzip-bytes", "gzip")).toThrowError(
      expect.objectContaining({ code: "DEGRADED_INVALID_INPUT" }),
    );
  });
});

describe("degraded link: status views and snapshots", () => {
  it("reports UNKNOWN for unknown ids, never fabricated state", () => {
    const { store } = enqueued();
    expect(messageStatus(store, "msg-ghost")).toEqual({ messageId: "msg-ghost", state: "UNKNOWN", attemptsUsed: 0, acks: [] });
    const status = messageStatus(store, "msg-1");
    expect(status.state).toBe("QUEUED");
  });

  it("snapshots canonically by id", () => {
    const transport = makeTransport();
    let store = createStore(100);
    store = enqueue(store, transport, sub(), "work", message({ messageId: "m-b" }), NOW).store;
    store = enqueue(store, transport, sub(), "work", message({ messageId: "m-a" }), NOW).store;
    expect(snapshotStore(store).map((m) => m.messageId)).toEqual(["m-a", "m-b"]);
  });

  it("detects payload tampering through the recorded digest", () => {
    const { store } = enqueued();
    const tampered = {
      ...store,
      messages: { "msg-1": { ...store.messages["msg-1"]!, payload: { kind: "evil" } } },
    };
    expect(verifyPayload(tampered.messages["msg-1"]!)).toBe(false);
  });
});
