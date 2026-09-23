import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { migrateEnvelope } from "./migrate";
import { loadProgrammeState, loadSeedRequirements, selectFromState } from "./programmeState";
import { FileStateStore, sha256Hex } from "./store";
import { StateError } from "./types";
import type { StateEnvelope } from "./types";

function dir(): string {
  return mkdtempSync(join(tmpdir(), "aetherius-state-"));
}

function envelope(over: Partial<StateEnvelope<{ n: number }>> = {}): StateEnvelope<{ n: number }> {
  return {
    id: "probe",
    kind: "registry",
    schemaVersion: 1,
    recordVersion: 1,
    createdAt: "2026-09-22T00:00:00.000Z",
    updatedAt: "2026-09-22T00:00:00.000Z",
    owner: "aetherius-os",
    provenance: "synthetic fixture",
    sensitivity: "PUBLIC",
    integrity: "",
    payload: { n: 1 },
    ...over,
  };
}

describe("file state store", () => {
  it("round-trips payload with schema/version preserved", () => {
    const store = new FileStateStore(dir(), 1);
    const saved = store.save(envelope());
    expect(saved.recordVersion).toBe(1);
    expect(saved.integrity).toBe(sha256Hex(JSON.stringify({ n: 1 })));
    const loaded = store.load<{ n: number }>("probe");
    expect(loaded.payload).toEqual({ n: 1 });
    expect(loaded.schemaVersion).toBe(1);
  });
  it("serializes deterministically", () => {
    const store = new FileStateStore(dir(), 1);
    const a = store.save(envelope({ id: "a" }));
    const b = store.save(envelope({ id: "b", payload: { n: 1 } }));
    expect(a.integrity).toBe(b.integrity);
  });
  it("rejects missing, malformed and tampered state without resetting", () => {
    const root = dir();
    const store = new FileStateStore(root, 1);
    expect(() => store.load("ghost")).toThrowError(StateError);
    writeFileSync(join(root, "bad.json"), "{not json", "utf8");
    expect(() => store.load("bad")).toThrowError(/not valid JSON/);
    store.save(envelope({ id: "good" }));
    const path = join(root, "good.json");
    const raw = JSON.parse(readFileSync(path, "utf8")) as { payload: { n: number } };
    raw.payload.n = 999;
    writeFileSync(path, JSON.stringify(raw), "utf8");
    expect(() => store.load("good")).toThrowError(/integrity/);
    // Original file untouched by the failed load; no silent reset occurred.
    expect(JSON.parse(readFileSync(path, "utf8")).payload.n).toBe(999);
  });
  it("rejects unknown and future schema versions", () => {
    const store = new FileStateStore(dir(), 2);
    expect(store.judgeSchema(0, 2)).toBe("CORRUPT_OR_INVALID_STATE");
    expect(store.judgeSchema(2, 2)).toBe("CURRENT_SCHEMA");
    expect(store.judgeSchema(1, 2)).toBe("MIGRATABLE_SCHEMA");
    expect(store.judgeSchema(9, 2)).toBe("UNSUPPORTED_FUTURE_SCHEMA");
    const root = dir();
    const future = new FileStateStore(root, 2);
    const env = envelope({ id: "f", schemaVersion: 9 });
    env.integrity = sha256Hex(JSON.stringify(env.payload));
    writeFileSync(join(root, "f.json"), JSON.stringify(env), "utf8");
    expect(() => future.load("f")).toThrowError(/newer than supported/);
  });
  it("failed validation never overwrites the good file (atomic fail-safe)", () => {
    const store = new FileStateStore(dir(), 1);
    store.save(envelope({ id: "k", payload: { n: 1 } }));
    expect(() =>
      store.save(envelope({ id: "k", sensitivity: "SECRET_REFERENCE", payload: { n: 1 } as unknown as { n: number } })),
    ).toThrowError(/SECRET_REFERENCE/);
    expect(store.load<{ n: number }>("k").payload).toEqual({ n: 1 });
  });
  it("detects stale writers instead of last-write-wins", () => {
    const store = new FileStateStore(dir(), 1);
    store.save(envelope({ id: "w", recordVersion: 1 }));
    store.save(envelope({ id: "w", recordVersion: 2, payload: { n: 2 } }));
    expect(() =>
      store.save(envelope({ id: "w", recordVersion: 3, payload: { n: 3 } }), { expectedRecordVersion: 1 }),
    ).toThrowError(/stale write/);
    expect(store.load<{ n: number }>("w").payload).toEqual({ n: 2 });
  });
  it("rejects invalid ids and enforces secret-reference shape", () => {
    const store = new FileStateStore(dir(), 1);
    expect(() => store.save(envelope({ id: "../escape" }))).toThrowError(/invalid state id/);
    expect(() =>
      store.save(envelope({ id: "s", sensitivity: "SECRET_REFERENCE", payload: { ref: "vault://x", token: "raw" } as unknown as { n: number } })),
    ).toThrowError(/must not contain raw credential/);
    const ok = store.save(
      envelope({ id: "s", sensitivity: "SECRET_REFERENCE", payload: { ref: "vault://x" } as unknown as { n: number } }),
    );
    expect(ok.integrity).toBeTruthy();
  });
});

describe("migrations", () => {
  it("migrates step by step with backup and history", () => {
    const env = envelope({ schemaVersion: 1 });
    const { envelope: out, backup } = migrateEnvelope<{ n: number; label: string }>(env, 3, [
      { from: 1, to: 2, migrate: (p) => ({ ...(p as object), label: "v2" }) },
      { from: 2, to: 3, migrate: (p) => ({ ...(p as object), checked: true }) },
    ]);
    expect(out.schemaVersion).toBe(3);
    expect(backup.schemaVersion).toBe(1);
    expect(backup.payload).toEqual({ n: 1 });
    expect(out.migrationHistory?.length).toBe(2);
    expect(out.payload).toMatchObject({ n: 1, label: "v2" });
  });
  it("fails visibly on missing steps and failing transforms", () => {
    expect(() => migrateEnvelope(envelope(), 2, [])).toThrowError(/no migration registered/);
    expect(() =>
      migrateEnvelope(envelope(), 2, [
        { from: 1, to: 2, migrate: () => { throw new Error("boom"); } },
      ]),
    ).toThrowError(/migration v1->v2 failed: boom/);
    expect(() => migrateEnvelope(envelope({ schemaVersion: 5 }), 2, [])).toThrowError(/newer than target/);
  });
});

describe("programme integration", () => {
  const registryRoot = new URL("../../registry/", import.meta.url);
  it("loads real registries through the state layer", () => {
    const state = loadProgrammeState(registryRoot);
    expect(state.bundle.programme.phases.length).toBe(32);
  });
  it("selector stays compatible after state reload with real seed", () => {
    const state = loadProgrammeState(registryRoot);
    const requirements = loadSeedRequirements(new URL("../programme/requirements.json", import.meta.url));
    const result = selectFromState({ bundle: { ...state.bundle, requirements } });
    // Repo-relay COMPLETE leaves nothing executable: reload path agrees.
    expect(result.selected_task).toBeNull();
  });
  it("rejects missing and malformed registry input", () => {
    expect(() => loadProgrammeState(new URL("./nope/", import.meta.url))).toThrowError(/missing/);
    expect(() => loadSeedRequirements(new URL("programme.test.ts", new URL("./", import.meta.url)))).toThrowError();
  });
});
