/**
 * Backup and restore on the canonical owned-state store.
 *
 * The property under test throughout is the refusal: a backup that cannot be
 * proven intact must not restore, and a restore must not quietly roll a record
 * back over newer state. A restore that looks successful while having silently
 * dropped or reverted records is worse than no restore at all.
 */
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  backupStore,
  listBackups,
  planRestore,
  restoreStore,
} from "./backup";
import { FileStateStore, sha256Hex, canonicalSerialize } from "./store";
import type { OwnedStore } from "./store";
import { StateError } from "./types";
import type { StateEnvelope } from "./types";

const CAUSE = { actor: "test", source: "backup.test" };
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

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "backup-"));
  store = new FileStateStore(root, 1);
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("taking a backup", () => {
  it("snapshots every record and lists them with hashes", () => {
    store.save(envelope("alpha", { a: 1 }));
    store.save(envelope("beta", { b: 2 }));
    const result = backupStore(store, "b1", CAUSE);
    expect(result.recordCount).toBe(2);
    expect(result.manifestHash).toMatch(/^[0-9a-f]{64}$/);
    const manifest = JSON.parse(
      readFileSync(join(result.path, "manifest.json"), "utf8"),
    ) as { entries: Array<{ id: string }>; causedBy: typeof CAUSE };
    expect(manifest.entries.map((e) => e.id).sort()).toEqual(["alpha", "beta"]);
    expect(manifest.causedBy).toEqual(CAUSE);
  });

  it("a backup of nothing is still a valid, restorable, empty backup", () => {
    const result = backupStore(store, "empty", CAUSE);
    expect(result.recordCount).toBe(0);
    expect(planRestore(store, "empty").restorable).toEqual([]);
  });

  it("rejects an unusable backup id rather than writing it into a path", () => {
    expect(() => backupStore(store, "../escape", CAUSE)).toThrowError(StateError);
    expect(() => backupStore(store, "a/b", CAUSE)).toThrowError(StateError);
  });

  it("lists what it took", () => {
    backupStore(store, "b1", CAUSE);
    backupStore(store, "b2", CAUSE);
    expect(listBackups(store)).toEqual(["b1", "b2"]);
  });
});

describe("a restore is refused unless the backup proves itself", () => {
  it("refuses to restore a backup that does not exist", () => {
    expect(() => planRestore(store, "nope")).toThrowError(/no backup/);
  });

  it("refuses when the manifest lists a record that was removed from it", () => {
    store.save(envelope("alpha", { a: 1 }));
    store.save(envelope("beta", { b: 2 }));
    const backup = backupStore(store, "b1", CAUSE);
    const manifestPath = join(backup.path, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      entries: Array<{ id: string }>;
    };
    manifest.entries = manifest.entries.filter((e) => e.id !== "beta");
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    // Dropping an entry from the list is how a restore would silently omit a
    // record while still reporting success. The manifest's own hash catches it.
    const plan = planRestore(store, "b1");
    expect(plan.manifestVerified).toBe(false);
    expect(plan.rejected[0].reason).toBe("backup-manifest-tampered");
    expect(() => restoreStore(store, "b1", CAUSE)).toThrowError(/does not verify/);
  });

  it("refuses when a stored record's payload was altered after the backup", () => {
    store.save(envelope("alpha", { a: 1 }));
    const backup = backupStore(store, "b1", CAUSE);
    const recordPath = join(backup.path, "alpha.json");
    const record = JSON.parse(readFileSync(recordPath, "utf8")) as StateEnvelope;
    record.payload = { a: 999 };
    writeFileSync(recordPath, JSON.stringify(record, null, 2));
    const plan = planRestore(store, "b1");
    expect(plan.restorable).toEqual([]);
    expect(plan.rejected[0]).toMatchObject({
      id: "alpha",
      reason: "record-content-tampered",
    });
  });

  it("refuses a record the current build cannot understand", () => {
    store.save(envelope("alpha", { a: 1 }));
    const backup = backupStore(store, "b1", CAUSE);
    const recordPath = join(backup.path, "alpha.json");
    const record = JSON.parse(readFileSync(recordPath, "utf8")) as StateEnvelope;
    record.schemaVersion = 99;
    record.integrity = sha256Hex(canonicalSerialize(record.payload));
    writeFileSync(recordPath, JSON.stringify(record, null, 2));
    // The manifest hash is over entries, not payloads, so re-stamping the
    // payload hash is not enough on its own -- but the entry hash must also be
    // recomputed or the manifest check fires first. Either way it must refuse.
    const manifestPath = join(backup.path, "manifest.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      entries: Array<{ id: string; schemaVersion: number }>;
      entriesHash: string;
    };
    manifest.entries[0].schemaVersion = 99;
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    const plan = planRestore(store, "b1");
    expect(plan.manifestVerified).toBe(false);
    expect(() => restoreStore(store, "b1", CAUSE)).toThrowError(/does not verify/);
  });
});

describe("a restore never quietly rolls state backwards", () => {
  it("restores into an empty store", () => {
    store.save(envelope("alpha", { a: 1 }));
    const backup = backupStore(store, "b1", CAUSE);
    store.remove("alpha");
    expect(store.exists("alpha")).toBe(false);
    const out = restoreStore(store, "b1", CAUSE);
    expect(out.restored).toEqual(["alpha"]);
    expect(store.load("alpha").payload).toEqual({ a: 1 });
  });

  it("refuses to overwrite a record that has moved past the backup", () => {
    store.save(envelope("alpha", { a: 1 }, 1));
    const backup = backupStore(store, "b1", CAUSE);
    store.save(envelope("alpha", { a: 2 }, 5));
    const plan = planRestore(store, "b1");
    expect(plan.rejected[0]).toMatchObject({
      id: "alpha",
      reason: "record-newer-than-backup",
    });
    const out = restoreStore(store, "b1", CAUSE);
    expect(out.restored).toEqual([]);
    // the newer live value survives untouched
    expect(store.load("alpha").payload).toEqual({ a: 2 });
  });

  it("rolls back only when the caller explicitly allows it, and sets the old record aside", () => {
    store.save(envelope("alpha", { a: 1 }, 1));
    const backup = backupStore(store, "b1", CAUSE);
    store.save(envelope("alpha", { a: 2 }, 5));
    const out = restoreStore(store, "b1", CAUSE, { allowDowngrade: true });
    expect(out.restored).toEqual(["alpha"]);
    expect(out.displaced).toEqual(["alpha"]);
    expect(store.load("alpha").payload).toEqual({ a: 1 });
    // and the displaced copy is on disk, so the rollback is itself reversible
    const aside = require("node:fs")
      .readdirSync(root) as string[];
    expect(aside.some((n) => n.startsWith("alpha.json.pre-restore-"))).toBe(true);
  });

  it("restoring the same backup twice is stable", () => {
    store.save(envelope("alpha", { a: 1 }));
    const backup = backupStore(store, "b1", CAUSE);
    store.remove("alpha");
    restoreStore(store, "b1", CAUSE);
    const first = store.load("alpha").payload;
    const second = restoreStore(store, "b1", CAUSE);
    expect(second.restored).toEqual(["alpha"]);
    expect(store.load("alpha").payload).toEqual(first);
  });

  it("a restore is recorded with its cause", () => {
    store.save(envelope("alpha", { a: 1 }));
    const backup = backupStore(store, "b1", CAUSE);
    store.remove("alpha");
    restoreStore(store, "b1", { actor: "operator", source: "incident-recovery" });
    expect(store.load("alpha").causedBy).toEqual({
      actor: "operator",
      source: "incident-recovery",
    });
    expect(existsSync(join(backup.path, "manifest.json"))).toBe(true);
  });
});

describe("round-trip fidelity", () => {
  it("restores payload, version and integrity exactly", () => {
    const payload = { nested: { list: [1, 2, 3] }, flag: true };
    store.save(envelope("alpha", payload, 7));
    const before = store.load("alpha");
    const backup = backupStore(store, "b1", CAUSE);
    store.remove("alpha");
    restoreStore(store, "b1", CAUSE);
    const after = store.load("alpha");
    expect(after.payload).toEqual(before.payload);
    expect(after.recordVersion).toBe(before.recordVersion);
    expect(after.schemaVersion).toBe(before.schemaVersion);
    expect(after.integrity).toBe(before.integrity);
  });

  it("restores every record of a multi-record store", () => {
    store.save(envelope("alpha", { a: 1 }));
    store.save(envelope("beta", { b: 2 }));
    store.save(envelope("gamma", { c: 3 }));
    backupStore(store, "b1", CAUSE);
    for (const id of ["alpha", "beta", "gamma"]) store.remove(id);
    const out = restoreStore(store, "b1", CAUSE);
    expect(out.restored.sort()).toEqual(["alpha", "beta", "gamma"]);
    expect(store.load("gamma").payload).toEqual({ c: 3 });
  });
});