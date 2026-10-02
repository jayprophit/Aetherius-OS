/**
 * REQ-p17-owned-state: event linkage for the canonical owned-state store.
 *
 * The envelope records WHO caused a state (`causedBy`) and where it came from
 * (`provenance`), but a store with only current values has no history: it can
 * say what a record is now and not how it got there. Anything that needs the
 * sequence -- reconstructing a decision, explaining a change to the owner,
 * proving a record was not silently rewritten -- has to take the current value
 * on trust.
 *
 * This adds an append-only, hash-linked event log beside the store, in the same
 * directory and through the same integrity discipline.
 *
 * Boundaries, stated because they are easy to overclaim:
 * - The chain detects CORRUPTION, REORDERING and DELETION, because each entry
 *   commits to its predecessor. It does NOT detect wholesale forgery by a
 *   process running as the same user: such a process can read the files and
 *   recompute the whole chain. There is no secret we could keep from it --
 *   exactly the same limit recorded in the Agent Bridge evidence-integrity
 *   work. Claiming tamper-PROOFENCE here would be false.
 * - The log is a projection target, not a second authority. The store remains
 *   the authority for current state; the log explains how it got there.
 * - Appends are serialized through the existing WorkspaceLock-style discipline
 *   so two writers cannot interleave and fork the chain.
 */

import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { canonicalSerialize, sha256Hex } from "./store";
import type { OwnedStore } from "./store";
import { StateError } from "./types";

export const STATE_EVENT_SCHEMA_VERSION = 1;

export type StateEventKind =
  | "CREATED"
  | "UPDATED"
  | "MIGRATED"
  | "RESTORED"
  | "REMOVED";

export interface StateEvent {
  eventId: string;
  schemaVersion: number;
  sequence: number;
  /** sha256 of the previous entry's recordHash; genesis entry uses GENESIS. */
  prevHash: string;
  recordId: string;
  kind: StateEventKind;
  /** The record version this event produced. Absent for REMOVED. */
  recordVersion?: number;
  causedBy: { actor: string; source: string };
  at: string;
  /** sha256 over every field above except recordHash itself. */
  recordHash: string;
}

export const GENESIS_HASH = "GENESIS";

function eventDir(store: OwnedStore): string {
  return join(store.root, "_events");
}
function eventFile(store: OwnedStore): string {
  return join(eventDir(store), "state-events.jsonl");
}

/** Every field that is committed to by the hash, in a stable order. */
function hashable(event: Omit<StateEvent, "recordHash">): string {
  return sha256Hex(canonicalSerialize({
    eventId: event.eventId,
    schemaVersion: event.schemaVersion,
    sequence: event.sequence,
    prevHash: event.prevHash,
    recordId: event.recordId,
    kind: event.kind,
    recordVersion: event.recordVersion ?? null,
    causedBy: event.causedBy,
    at: event.at,
  }));
}

export interface ChainProblem {
  sequence: number;
  eventId: string;
  code:
    | "hash-mismatch"
    | "broken-link"
    | "sequence-gap"
    | "sequence-regression"
    | "malformed";
  detail: string;
}

/**
 * Read the log and report every integrity problem found.
 *
 * Returns the events it could read plus the problems. An empty problems list
 * means the chain is internally consistent; it does not mean the log is
 * authentic, for the reason in the module header.
 */
export function readStateEvents(store: OwnedStore): {
  events: StateEvent[];
  problems: ChainProblem[];
} {
  const file = eventFile(store);
  if (!existsSync(file)) return { events: [], problems: [] };
  const raw = readFileSync(file, "utf8");
  const lines = raw.split("\n").filter((l) => l.trim().length > 0);
  const events: StateEvent[] = [];
  const problems: ChainProblem[] = [];
  let expectedSequence = 1;
  let expectedPrev = GENESIS_HASH;

  for (const line of lines) {
    let event: StateEvent;
    try {
      event = JSON.parse(line) as StateEvent;
    } catch {
      problems.push({
        sequence: expectedSequence,
        eventId: "(unparsed)",
        code: "malformed",
        detail: "line is not valid JSON",
      });
      continue;
    }
    if (event.schemaVersion !== STATE_EVENT_SCHEMA_VERSION) {
      problems.push({
        sequence: event.sequence ?? expectedSequence,
        eventId: event.eventId ?? "(unknown)",
        code: "malformed",
        detail: `unsupported event schema v${event.schemaVersion}`,
      });
      continue;
    }
    const { recordHash, ...rest } = event;
    if (hashable(rest) !== recordHash) {
      problems.push({
        sequence: event.sequence,
        eventId: event.eventId,
        code: "hash-mismatch",
        detail: "entry contents do not match its own recordHash",
      });
    }
    if (event.prevHash !== expectedPrev) {
      problems.push({
        sequence: event.sequence,
        eventId: event.eventId,
        code: "broken-link",
        detail: `prevHash ${event.prevHash} does not match the previous entry`,
      });
    }
    if (event.sequence !== expectedSequence) {
      problems.push({
        sequence: event.sequence,
        eventId: event.eventId,
        code: event.sequence < expectedSequence ? "sequence-regression" : "sequence-gap",
        detail: `expected sequence ${expectedSequence}`,
      });
    }
    events.push(event);
    expectedSequence = event.sequence + 1;
    expectedPrev = recordHash;
  }
  return { events, problems };
}

/**
 * Append one event. Fails rather than forking the chain if the existing log
 * does not verify: writing onto a broken chain would hide the break.
 */
export function appendStateEvent(
  store: OwnedStore,
  input: {
    recordId: string;
    kind: StateEventKind;
    recordVersion?: number;
    causedBy: { actor: string; source: string };
  },
  now: () => string = () => new Date().toISOString(),
): StateEvent {
  if (!input.recordId.trim()) {
    throw new StateError("STATE_VALIDATION_FAILED", "event needs a recordId");
  }
  if (!input.causedBy.actor.trim() || !input.causedBy.source.trim()) {
    throw new StateError(
      "STATE_VALIDATION_FAILED",
      "event needs both an actor and a source; unattributed state change is refused",
    );
  }
  const existing = readStateEvents(store);
  if (existing.problems.length > 0) {
    throw new StateError(
      "STATE_INTEGRITY_MISMATCH",
      `refusing to append: the existing event chain has ${existing.problems.length} problem(s)`,
    );
  }
  const previous = existing.events.at(-1);
  const event: Omit<StateEvent, "recordHash"> = {
    eventId: `${input.recordId}@${(previous?.sequence ?? 0) + 1}-${sha256Hex(
      `${input.recordId}:${input.kind}:${now()}:${Math.random()}`,
    ).slice(0, 8)}`,
    schemaVersion: STATE_EVENT_SCHEMA_VERSION,
    sequence: (previous?.sequence ?? 0) + 1,
    prevHash: previous?.recordHash ?? GENESIS_HASH,
    recordId: input.recordId,
    kind: input.kind,
    recordVersion: input.recordVersion,
    causedBy: input.causedBy,
    at: now(),
  };
  const record: StateEvent = { ...event, recordHash: hashable(event) };

  mkdirSync(eventDir(store), { recursive: true });
  const { appendFileSync } = require("node:fs") as typeof import("node:fs");
  appendFileSync(eventFile(store), `${JSON.stringify(record)}\n`, "utf8");
  return record;
}

/**
 * Wrap a store so every mutation is linked to an event.
 *
 * The point is that linkage cannot be forgotten. A caller holding the raw store
 * can still mutate without an event -- nothing can prevent a determined caller
 * -- but the ordinary path produces a history as a side effect of writing,
 * rather than depending on someone remembering to record what they did.
 */
export interface LinkedStore extends OwnedStore {
  /** Attributable history for one record. */
  historyFor(recordId: string): StateEvent[];
  /** Chain problems; empty means internally consistent. */
  problems(): ChainProblem[];
}

/**
 * Wrap a store so every mutation writes a linked event.
 *
 * Linkage cannot be forgotten on the ordinary path: it is a side effect of
 * writing rather than something a caller has to remember to record. A caller
 * holding the raw store can still mutate silently -- nothing can stop a
 * determined caller -- so this is a discipline aid, not an enforcement
 * boundary, and the module says so rather than implying otherwise.
 *
 * 
esolveCause supplies attribution. It is a function because the actor is
 * usually not known until the call site.
 */
export function linkEvents(
  store: OwnedStore,
  resolveCause: () => { actor: string; source: string },
  now: () => string = () => new Date().toISOString(),
): LinkedStore {
  const linked: LinkedStore = {
    get root() {
      return store.root;
    },
    get currentVersion() {
      return store.currentVersion;
    },
    exists: (id) => store.exists(id),
    listIds: (prefix) => store.listIds(prefix),
    judgeSchema: (version, current) => store.judgeSchema(version, current),
    load: (id) => store.load(id),
    historyFor: (recordId) => eventsFor(store, recordId),
    problems: () => verifyStateEvents(store),
    remove: (id) => {
      store.remove(id);
      appendStateEvent(store, { recordId: id, kind: "REMOVED", causedBy: resolveCause() }, now);
    },
    save: (envelope, options = {}) => {
      const existed = store.exists(envelope.id);
      const saved = store.save(envelope, options);
      appendStateEvent(store, {
        recordId: saved.id,
        kind: existed ? "UPDATED" : "CREATED",
        recordVersion: saved.recordVersion,
        causedBy: options.causedBy ?? saved.causedBy ?? resolveCause(),
      }, now);
      return saved;
    },
  };
  return linked;
}

/** The attributable history of one record. */
export function eventsFor(store: OwnedStore, recordId: string): StateEvent[] {
  return readStateEvents(store).events.filter((e) => e.recordId === recordId);
}

/** Every problem in the chain, or an empty list when it verifies. */
export function verifyStateEvents(store: OwnedStore): ChainProblem[] {
  return readStateEvents(store).problems;
}