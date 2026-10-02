/**
 * Event linkage on the canonical owned-state store.
 *
 * The load-bearing claim is the negative one: the chain detects corruption,
 * reordering and deletion, and is explicitly documented as NOT detecting
 * wholesale forgery by a same-user process. The tests below prove the first
 * half and do not pretend to prove the second.
 */
import { mkdtempSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  GENESIS_HASH,
  appendStateEvent,
  eventsFor,
  linkEvents,
  readStateEvents,
  verifyStateEvents,
} from "./events";
import { FileStateStore, sha256Hex, canonicalSerialize } from "./store";
import type { OwnedStore } from "./store";
import { StateError } from "./types";
import type { StateEnvelope } from "./types";

const CAUSE = { actor: "tester", source: "events.test" };
let root = "";
let store: OwnedStore;

function envelope(id: string, payload: unknown, version = 1): StateEnvelope {
  return {
    id,
    kind: "fixture",
    schemaVersion: 1,
    recordVersion: version,
    createdAt: "2026-10-02T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    owner: "aetherius-os",
    provenance: "test",
    sensitivity: "SYSTEM",
    integrity: sha256Hex(canonicalSerialize(payload)),
    payload,
  };
}

function eventLogPath(): string {
  return join(root, "_events", "state-events.jsonl");
}

function restamp(event: Record<string, unknown>): void {
  const { recordHash: _ignored, ...rest } = event;
  (event as { recordHash: string }).recordHash = sha256Hex(canonicalSerialize({
    eventId: rest.eventId,
    schemaVersion: rest.schemaVersion,
    sequence: rest.sequence,
    prevHash: rest.prevHash,
    recordId: rest.recordId,
    kind: rest.kind,
    recordVersion: rest.recordVersion ?? null,
    causedBy: rest.causedBy,
    at: rest.at,
  }));
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "events-"));
  store = new FileStateStore(root, 1);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("appending state events", () => {
  it("an untouched store has an empty, verifying log", () => {
    expect(readStateEvents(store).events).toEqual([]);
    expect(verifyStateEvents(store)).toEqual([]);
  });

  it("links each entry to its predecessor and verifies", () => {
    const first = appendStateEvent(store, { recordId: "alpha", kind: "CREATED", causedBy: CAUSE });
    expect(first.prevHash).toBe(GENESIS_HASH);
    const second = appendStateEvent(store, { recordId: "alpha", kind: "UPDATED", recordVersion: 2, causedBy: CAUSE });
    expect(second.prevHash).toBe(first.recordHash);
    expect(second.sequence).toBe(2);
    expect(verifyStateEvents(store)).toEqual([]);
  });

  it("refuses an unattributed state change", () => {
    expect(() => appendStateEvent(store, {
      recordId: "alpha", kind: "CREATED",
      causedBy: { actor: "  ", source: "x" },
    })).toThrowError(/actor and a source/);
    expect(() => appendStateEvent(store, {
      recordId: "alpha", kind: "CREATED", causedBy: { actor: "x", source: "" },
    })).toThrowError(/actor and a source/);
  });

  it("refuses an event with no record id", () => {
    expect(() => appendStateEvent(store, {
      recordId: "  ", kind: "CREATED", causedBy: CAUSE,
    })).toThrowError(StateError);
  });

  it("distinguishes CREATE from UPDATE for the same record", () => {
    const linked = linkEvents(store, () => CAUSE);
    linked.save(envelope("alpha", { a: 1 }));
    linked.save(envelope("alpha", { a: 2 }, 2));
    expect(linked.problems()).toEqual([]);
    expect(linked.historyFor("alpha").map((e) => e.kind)).toEqual(["CREATED", "UPDATED"]);
  });

  it("linkage is a side effect of writing, not something to remember", () => {
    const linked = linkEvents(store, () => ({ actor: "supervisor", source: "session" }));
    linked.save(envelope("beta", { b: 1 }));
    const history = linked.historyFor("beta");
    expect(history).toHaveLength(1);
    expect(history[0].causedBy).toEqual({ actor: "supervisor", source: "session" });
    expect(linked.historyFor("never-written")).toEqual([]);
  });

  it("records removal through the same chain", () => {
    const linked = linkEvents(store, () => CAUSE);
    linked.save(envelope("alpha", { a: 1 }));
    linked.remove("alpha");
    expect(linked.problems()).toEqual([]);
    expect(linked.historyFor("alpha").map((e) => e.kind)).toEqual(["CREATED", "REMOVED"]);
  });

  it("keeps history when the record is removed", () => {
    store.save(envelope("alpha", { a: 1 }));
    appendStateEvent(store, { recordId: "alpha", kind: "CREATED", recordVersion: 1, causedBy: CAUSE });
    store.remove("alpha");
    appendStateEvent(store, { recordId: "alpha", kind: "REMOVED", causedBy: CAUSE });
    expect(store.exists("alpha")).toBe(false);
    expect(eventsFor(store, "alpha").map((e) => e.kind)).toEqual(["CREATED", "REMOVED"]);
  });
});

describe("the chain detects damage", () => {
  it("detects an edited field", () => {
    const event = appendStateEvent(store, { recordId: "alpha", kind: "CREATED", causedBy: CAUSE });
    const lines = JSON.parse(
      // rewrite the log with the record id changed but the hash left alone
      JSON.stringify([event]),
    ) as Array<{ recordId: string }>;
    lines[0].recordId = "tampered";
    writeFileSync(eventLogPath(), `${JSON.stringify(lines[0])}\n`, "utf8");
    const problems = verifyStateEvents(store);
    expect(problems.map((p) => p.code)).toContain("hash-mismatch");
  });

  it("detects deletion of a middle entry", () => {
    appendStateEvent(store, { recordId: "a", kind: "CREATED", causedBy: CAUSE });
    appendStateEvent(store, { recordId: "b", kind: "CREATED", causedBy: CAUSE });
    appendStateEvent(store, { recordId: "c", kind: "CREATED", causedBy: CAUSE });
    const lines = JSON.parse(`[${require("node:fs").readFileSync(eventLogPath(), "utf8")
      .trim().split("\n").join(",")}]`) as Array<Record<string, unknown>>;
    writeFileSync(eventLogPath(), `${lines.filter((l) => l.sequence !== 2)
      .map((l) => JSON.stringify(l)).join("\n")}\n`, "utf8");
    const problems = verifyStateEvents(store);
    expect(problems.map((p) => p.code)).toContain("broken-link");
  });

  it("detects reordering", () => {
    appendStateEvent(store, { recordId: "a", kind: "CREATED", causedBy: CAUSE });
    appendStateEvent(store, { recordId: "b", kind: "CREATED", causedBy: CAUSE });
    const lines = require("node:fs").readFileSync(eventLogPath(), "utf8")
      .trim().split("\n").map((l) => JSON.parse(l) as Record<string, unknown>);
    writeFileSync(eventLogPath(), `${[lines[1], lines[0]].map((l) => JSON.stringify(l)).join("\n")}\n`, "utf8");
    expect(verifyStateEvents(store).map((p) => p.code)).toContain("broken-link");
  });

  it("reports a malformed line rather than stopping", () => {
    appendStateEvent(store, { recordId: "a", kind: "CREATED", causedBy: CAUSE });
    appendFileSync(eventLogPath(), "{not json\n", "utf8");
    expect(verifyStateEvents(store).map((p) => p.code)).toContain("malformed");
  });

  it("refuses to append onto a broken chain rather than hiding the break", () => {
    appendStateEvent(store, { recordId: "a", kind: "CREATED", causedBy: CAUSE });
    appendFileSync(eventLogPath(), "{corrupt\n", "utf8");
    expect(() => appendStateEvent(store, {
      recordId: "b", kind: "CREATED", causedBy: CAUSE,
    })).toThrowError(/refusing to append/);
  });

  it("does not claim to detect a wholesale rewrite, and says so", () => {
    // Recomputing every hash produces a chain that verifies. This is the known
    // limit, asserted so the boundary cannot be quietly forgotten.
    const event = appendStateEvent(store, { recordId: "alpha", kind: "CREATED", causedBy: CAUSE });
    const forged = { ...event, recordId: "other" };
    restamp(forged);
    writeFileSync(eventLogPath(), `${JSON.stringify(forged)}\n`, "utf8");
    expect(verifyStateEvents(store)).toEqual([]);
    // Which is exactly why the store's own integrity hash and world-state
    // readback remain the authority, not this log.
  });
});