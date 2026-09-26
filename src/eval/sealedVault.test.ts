import { describe, expect, it } from "vitest";
import {
  NO_TRAIN_STATES,
  SEALED_EVAL_KIND,
  VAULT_ENTRY_KINDS,
  buildSealedVault,
  createSealedEntry,
  fingerprintSealed,
  neverTrainedEntries,
  queryVault,
  sealedEvalEntries,
  validateEntry,
  vaultIdFor,
} from "./sealedVault";
import * as vault from "./sealedVault";
import type { SealedEntry } from "./sealedVault";

const FP = fingerprintSealed("sealed item 1");
const FP2 = fingerprintSealed("sealed item 2");

/**
 * Dimension-specific fixture. Each entry declares its own kind, dataset and
 * no-train state explicitly, so one entry's guarantee can never satisfy
 * another's query and a staging area cannot be mistaken for a sealed vault.
 */
function entry(over: Partial<SealedEntry> = {}): SealedEntry {
  return {
    vaultId: "vault-heldout-v3",
    kind: "SEALED_EVAL",
    datasetRef: "internal-bench",
    datasetVersion: "3.0.0",
    noTrain: "UNPROVEN",
    evidenceRefs: [],
    fingerprints: [FP],
    materialRef: "vault://bench/heldout-v3",
    notes: [],
    ...over,
  };
}

describe("only SEALED_EVAL is a sealed evaluation vault", () => {
  it("names staging areas and trust machines so their rejection is explicit", () => {
    expect([...VAULT_ENTRY_KINDS]).toEqual(["SEALED_EVAL", "STAGING_AREA", "TRUST_MACHINE"]);
    expect(SEALED_EVAL_KIND).toBe("SEALED_EVAL");
  });

  it("excludes staging areas and trust machines from the sealed eval set", () => {
    const manifest = buildSealedVault({
      entries: [
        entry({ vaultId: "vault-real" }),
        entry({ vaultId: "vault-stage", kind: "STAGING_AREA" }),
        entry({ vaultId: "vault-trust", kind: "TRUST_MACHINE" }),
      ],
    });
    expect(sealedEvalEntries(manifest).map((e) => e.vaultId)).toEqual(["vault-real"]);
    // They remain visible in the manifest rather than being deleted.
    expect(manifest.entries).toHaveLength(3);
  });

  it("still validates a staging entry as a well-formed record of the wrong kind", () => {
    // The entry is legitimate; it is simply not a sealed evaluation vault.
    expect(validateEntry(entry({ kind: "STAGING_AREA" }))).toEqual([]);
    expect(queryVault(buildSealedVault({ entries: [entry({ kind: "STAGING_AREA" })] }), { kind: "STAGING_AREA" })).toHaveLength(1);
  });

  it("rejects an unknown kind", () => {
    expect(validateEntry(entry({ kind: "attic" as never }))).toContain("kind");
  });
});

describe("SEALED LABEL is not a no-train guarantee", () => {
  it("defaults a sealed entry to UNPROVEN, never to never-trained", () => {
    const created = createSealedEntry(entry());
    expect(created.noTrain).toBe("UNPROVEN");
    expect(neverTrainedEntries(buildSealedVault({ entries: [created] }))).toEqual([]);
  });

  it("requires real evidence before EVIDENCED", () => {
    expect(validateEntry(entry({ noTrain: "EVIDENCED", evidenceRefs: [] }))).toContain("no-train-evidence");
    expect(validateEntry(entry({ noTrain: "EVIDENCED", evidenceRefs: ["corpus-manifest:1"] }))).toEqual([]);
  });

  it("counts only evidenced entries as never-trained", () => {
    const manifest = buildSealedVault({
      entries: [
        entry({ vaultId: "vault-proven", noTrain: "EVIDENCED", evidenceRefs: ["corpus-manifest:1"] }),
        entry({ vaultId: "vault-unproven" }),
        entry({ vaultId: "vault-violated", noTrain: "VIOLATED", evidenceRefs: ["leak-report:1"] }),
      ],
    });
    expect(neverTrainedEntries(manifest).map((e) => e.vaultId)).toEqual(["vault-proven"]);
  });

  it("keeps UNPROVEN distinct from VIOLATED: unknown is not a violation", () => {
    expect([...NO_TRAIN_STATES]).toEqual(["UNPROVEN", "EVIDENCED", "VIOLATED"]);
    const manifest = buildSealedVault({
      entries: [entry({ vaultId: "vault-a", noTrain: "UNPROVEN" }), entry({ vaultId: "vault-b", noTrain: "VIOLATED", evidenceRefs: ["r:1"] })],
    });
    expect(queryVault(manifest, { noTrain: "UNPROVEN" }).map((e) => e.vaultId)).toEqual(["vault-a"]);
    expect(queryVault(manifest, { noTrain: "VIOLATED" }).map((e) => e.vaultId)).toEqual(["vault-b"]);
  });
});

describe("sealed material is referenced, never inlined", () => {
  it("rejects any key that would carry content", () => {
    for (const key of ["items", "answers", "answerKey", "expected", "labels", "content", "secret", "apiKey", "value"]) {
      const hostile = { ...entry(), [key]: "leaked" } as SealedEntry;
      expect(validateEntry(hostile)).toContain("inline-content");
      expect(() => createSealedEntry(hostile)).toThrowError(/inline-content/);
    }
  });

  it("accepts the canonical vault:// secret-reference shape only", () => {
    expect(validateEntry(entry({ materialRef: "vault://bench/heldout-v3" }))).toEqual([]);
    expect(validateEntry(entry({ materialRef: "https://example.com/bench" }))).toContain("material-ref");
    expect(validateEntry(entry({ materialRef: "plain-path" }))).toContain("material-ref");
  });

  it("stores fingerprints, never the material they came from", () => {
    const created = createSealedEntry(entry());
    const serialized = JSON.stringify(created);
    expect(serialized).toContain(FP);
    expect(serialized).not.toContain("sealed item 1");
  });

  it("requires real sha256 fingerprints and rejects a similarity score", () => {
    expect(validateEntry(entry({ fingerprints: ["0.91"] }))).toContain("fingerprints");
    expect(validateEntry(entry({ fingerprints: [FP, FP2] }))).toEqual([]);
  });

  it("does not fabricate content: an absent materialRef stays absent", () => {
    const created = createSealedEntry(entry({ materialRef: undefined }));
    expect(created.materialRef).toBeUndefined();
  });
});

describe("access is observed, never granted", () => {
  it("records access observations against known entries only", () => {
    const manifest = buildSealedVault({
      entries: [entry({ vaultId: "vault-heldout-v3" })],
      access: [
        { vaultId: "vault-heldout-v3", at: 200, actorRef: "actor:a" },
        { vaultId: "vault-unknown", at: 100, actorRef: "actor:b" },
      ],
    });
    // An observation naming an unknown entry is dropped, not invented into one.
    expect(manifest.access).toHaveLength(1);
    expect(manifest.access[0]).toEqual({ vaultId: "vault-heldout-v3", at: 200, actorRef: "actor:a" });
  });

  it("orders access deterministically", () => {
    const manifest = buildSealedVault({
      entries: [entry({ vaultId: "vault-abc" })],
      access: [
        { vaultId: "vault-abc", at: 300, actorRef: "a" },
        { vaultId: "vault-abc", at: 100, actorRef: "b" },
      ],
    });
    expect(manifest.access.map((a) => a.at)).toEqual([100, 300]);
  });

  it("exposes no grant, authorize, unseal or decrypt surface", () => {
    const names = Object.keys(vault);
    for (const banned of ["grant", "authorize", "unseal", "decrypt", "reveal", "read", "open", "unlock", "policy"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("is not a general secret manager, a P25 plane or a P31 hardening implementation", () => {
    const names = Object.keys(vault);
    for (const banned of ["secret", "keychain", "keystore", "encrypt", "rotate", "p25", "p31", "hardening", "kms"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });
});

describe("validation, determinism and boundaries", () => {
  it("rejects malformed ids, refs and versions", () => {
    expect(validateEntry(entry({ vaultId: "not-a-vault" }))).toContain("vault-id");
    expect(validateEntry(entry({ datasetRef: "" }))).toContain("dataset-ref");
    expect(validateEntry(entry({ datasetVersion: "3.0" }))).toContain("dataset-version");
    expect(validateEntry(entry({ noTrain: "clean" as never }))).toContain("no-train");
    expect(validateEntry(entry({ evidenceRefs: ["a", "a"] }))).toContain("evidence-refs");
  });

  it("rejects unrecognised keys rather than silently dropping them", () => {
    expect(validateEntry({ ...entry(), rotatable: true } as never)).toContain("unknown-field");
  });

  it("rejects an empty manifest and a duplicate vault id", () => {
    expect(() => buildSealedVault({ entries: [] })).toThrowError(/at least one entry/);
    expect(() => buildSealedVault({ entries: [entry(), entry()] })).toThrowError(/duplicate vaultId/);
  });

  it("orders entries deterministically from scrambled input", () => {
    const manifest = buildSealedVault({
      entries: [entry({ vaultId: "vault-z" }), entry({ vaultId: "vault-a" }), entry({ vaultId: "vault-m" })],
    });
    expect(manifest.entries.map((e) => e.vaultId)).toEqual(["vault-a", "vault-m", "vault-z"]);
  });

  it("returns nothing for an unknown query key rather than everything", () => {
    const manifest = buildSealedVault({ entries: [entry()] });
    expect(queryVault(manifest, { datasetRef: "nope" })).toEqual([]);
    expect(queryVault(manifest, {})).toHaveLength(1);
  });

  it("derives a deterministic vault id, replacing every invalid span", () => {
    expect(vaultIdFor("Held Out v3")).toBe("vault-held-out-v3");
    expect(vaultIdFor("a  b   c")).toBe("vault-a-b-c");
    expect(vaultIdFor("--lead and trail--")).toBe("vault-lead-and-trail");
    expect(vaultIdFor("!!!")).toBe("vault-entry");
  });

  it("does not mutate its inputs and returns copies", () => {
    const source = entry();
    const before = JSON.stringify(source);
    const manifest = buildSealedVault({ entries: [source] });
    source.fingerprints.push(FP2);
    expect(manifest.entries[0]!.fingerprints).toEqual([FP]);
    expect(JSON.stringify(source)).not.toBe(before + "");
  });

  it("calls no clock: access timestamps are caller supplied", () => {
    const manifest = buildSealedVault({
      entries: [entry()],
      access: [{ vaultId: "vault-heldout-v3", at: 12345, actorRef: "a" }],
    });
    expect(manifest.access[0]!.at).toBe(12345);
  });
});
