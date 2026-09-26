import { sha256HexBytes } from "../runners/sync";

/**
 * REQ-p19-sealed-vault: sealed benchmark vault.
 *
 * The registered requirement is the scope authority:
 *
 *   "Sealed never-trained test store with no-train guarantee (P25 secrecy +
 *    P31 hardening); staging areas and trust machines are not sealed eval
 *    vaults."
 *
 * What this is: a MANIFEST of sealed evaluation material and the evidence
 * state of its no-train guarantee. It holds identities, fingerprints and
 * custody references. It never holds benchmark content, never holds an
 * answer key, and never grants access.
 *
 * The requirement's own anti-confusion clause is load-bearing and enforced:
 * a STAGING area or a TRUST MACHINE is not a sealed evaluation vault, so
 * those kinds are REFUSED at the type boundary rather than merely
 * discouraged in a comment.
 *
 * Distinctions this module exists to hold:
 *
 *   SEALED LABEL      != PROVEN NEVER TRAINED
 *   SEALED DATA       != CLEAN-ROOM PROOF
 *   ACCESS GRANT      != DATA CONTENT
 *   SEALED VAULT      != GENERAL SECRET MANAGER
 *   SEALED VAULT      != P25 AUTHORITY PLANE
 *   SEALED VAULT      != P31 HARDENING
 *   STAGING AREA      != SEALED EVAL VAULT
 *   TRUST MACHINE     != SEALED EVAL VAULT
 *   ENTRY SEALED      != NO-TRAIN GUARANTEE EVIDENCED
 *   UNKNOWN           != VIOLATED
 */

/**
 * What a vault entry may be. `SEALED_EVAL` is the only kind that
 * qualifies; the other two are named so their rejection is explicit and
 * testable rather than implicit.
 */
export const VAULT_ENTRY_KINDS = ["SEALED_EVAL", "STAGING_AREA", "TRUST_MACHINE"] as const;
export type VaultEntryKind = (typeof VAULT_ENTRY_KINDS)[number];

/** Only this kind is a sealed evaluation vault. */
export const SEALED_EVAL_KIND: VaultEntryKind = "SEALED_EVAL";

/**
 * No-train guarantee state.
 *
 * `UNPROVEN` is the default and the common case: sealing a dataset says
 * nothing about whether it was trained on. Only actual evidence — corpus
 * manifests, custody logs, exclusion attestations — moves it to `EVIDENCED`.
 */
export const NO_TRAIN_STATES = ["UNPROVEN", "EVIDENCED", "VIOLATED"] as const;
export type NoTrainState = (typeof NO_TRAIN_STATES)[number];

export interface SealedEntry {
  /** Deterministic vault id, "vault-<slug>". */
  vaultId: string;
  kind: VaultEntryKind;
  /** Sealed dataset identity, reusing the id@version convention. */
  datasetRef: string;
  datasetVersion: string;
  noTrain: NoTrainState;
  /** Required when noTrain is EVIDENCED: what actually backs the guarantee. */
  evidenceRefs: string[];
  /** Opaque custody log reference. Never custody content. */
  custodyLogRef?: string;
  /** Deterministic content fingerprints. NEVER the content itself. */
  fingerprints: string[];
  /**
   * An opaque secret reference in the repository's canonical
   * `SECRET_REFERENCE` shape, e.g. "vault://bench/heldout-v3". Sealed
   * material is REFERENCED, never inlined.
   */
  materialRef?: string;
  notes: string[];
}

export type VaultProblem =
  | "vault-id"
  | "kind"
  | "dataset-ref"
  | "dataset-version"
  | "no-train"
  | "no-train-evidence"
  | "evidence-refs"
  | "custody-ref"
  | "fingerprints"
  | "material-ref"
  | "inline-content"
  | "notes"
  | "unknown-field";

const VAULT_PROVENANCE = "p19-sealed-vault";
const ALLOWED_KEYS: ReadonlySet<string> = new Set([
  "vaultId",
  "kind",
  "datasetRef",
  "datasetVersion",
  "noTrain",
  "evidenceRefs",
  "custodyLogRef",
  "fingerprints",
  "materialRef",
  "notes",
]);
const VAULT_ID_RE = /^vault-[a-z0-9][a-z0-9-]*$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;
const SHA256_HEX_RE = /^[0-9a-f]{64}$/;
const MATERIAL_REF_RE = /^vault:\/\/\S+$/;

/**
 * Keys that would mean sealed CONTENT was inlined into a record. Rejected
 * outright: a vault manifest that carries items, answers or labels is a
 * leak, not a manifest.
 */
const INLINE_CONTENT_KEYS = [
  "items",
  "answers",
  "answerKey",
  "expected",
  "labels",
  "content",
  "payload",
  "secret",
  "token",
  "apiKey",
  "privateKey",
  "value",
];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** Real comparator (never a factory): a factory passed to sort yields NaN. */
function compareEntries(a: SealedEntry, b: SealedEntry): number {
  return compareStrings(a.vaultId, b.vaultId);
}

/** Deterministic vault id from a slug. */
export function vaultIdFor(slug: string): string {
  const normalized = slug
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `vault-${normalized.length > 0 ? normalized : "entry"}`;
}

/** Deterministic fingerprint of sealed material. The content is never stored. */
export function fingerprintSealed(content: string): string {
  return sha256HexBytes(new TextEncoder().encode(content));
}

export function validateEntry(entry: SealedEntry): VaultProblem[] {
  const problems: VaultProblem[] = [];
  for (const key of Object.keys(entry ?? {})) {
    if (!ALLOWED_KEYS.has(key)) problems.push("unknown-field");
    if (INLINE_CONTENT_KEYS.includes(key)) problems.push("inline-content");
  }
  if (!nonEmpty(entry?.vaultId) || !VAULT_ID_RE.test(entry.vaultId)) problems.push("vault-id");
  if (!VAULT_ENTRY_KINDS.includes(entry?.kind)) problems.push("kind");
  if (!nonEmpty(entry?.datasetRef)) problems.push("dataset-ref");
  if (!nonEmpty(entry?.datasetVersion) || !VERSION_RE.test(entry.datasetVersion)) problems.push("dataset-version");
  if (!NO_TRAIN_STATES.includes(entry?.noTrain)) problems.push("no-train");
  if (!Array.isArray(entry?.evidenceRefs) || entry.evidenceRefs.some((r) => !nonEmpty(r))) problems.push("evidence-refs");
  if (entry?.evidenceRefs !== undefined && new Set(entry.evidenceRefs).size !== entry.evidenceRefs.length) {
    problems.push("evidence-refs");
  }
  if (entry?.custodyLogRef !== undefined && !nonEmpty(entry.custodyLogRef)) problems.push("custody-ref");
  if (!Array.isArray(entry?.fingerprints) || entry.fingerprints.some((f) => typeof f !== "string" || !SHA256_HEX_RE.test(f))) {
    problems.push("fingerprints");
  }
  if (entry?.materialRef !== undefined && !MATERIAL_REF_RE.test(entry.materialRef)) problems.push("material-ref");
  if (entry?.notes !== undefined && (!Array.isArray(entry.notes) || entry.notes.some((n) => !nonEmpty(n)))) {
    problems.push("notes");
  }

  // A guarantee with nothing behind it is not a guarantee. EVIDENCED requires
  // evidence, and the SEALED LABEL alone never satisfies it.
  if (entry?.noTrain === "EVIDENCED" && (entry.evidenceRefs ?? []).length === 0) {
    problems.push("no-train-evidence");
  }
  return [...new Set(problems)].sort() as VaultProblem[];
}

export function createSealedEntry(entry: SealedEntry): SealedEntry {
  const problems = validateEntry(entry);
  if (problems.length > 0) {
    throw new Error(`invalid sealed vault entry ${String(entry?.vaultId)}: ${problems.join(",")}`);
  }
  return {
    vaultId: entry.vaultId,
    kind: entry.kind,
    datasetRef: entry.datasetRef,
    datasetVersion: entry.datasetVersion,
    noTrain: entry.noTrain,
    evidenceRefs: [...entry.evidenceRefs].sort(compareStrings),
    ...(entry.custodyLogRef === undefined ? {} : { custodyLogRef: entry.custodyLogRef }),
    fingerprints: [...entry.fingerprints].sort(compareStrings),
    ...(entry.materialRef === undefined ? {} : { materialRef: entry.materialRef }),
    notes: [...(entry.notes ?? [])].sort(compareStrings),
  };
}

export interface AccessObservation {
  vaultId: string;
  /** Epoch ms supplied by the caller. */
  at: number;
  /** Who was observed accessing. An OBSERVATION, not a grant. */
  actorRef: string;
  /** Opaque reference to whatever permitted it, if anything did. */
  authorityRef?: string;
}

export interface SealedVault {
  entries: SealedEntry[];
  access: AccessObservation[];
  provenance: string;
}

/**
 * A vault manifest plus observed access. This RECORDS access; it never
 * authorises it. P25 remains the authority plane, and P31 hardening is a
 * separate requirement — neither is implemented, extended or satisfied here.
 */
export function buildSealedVault(input: {
  entries: readonly SealedEntry[];
  access?: readonly AccessObservation[];
  provenance?: string;
}): SealedVault {
  if (!Array.isArray(input?.entries) || input.entries.length === 0) {
    throw new Error("invalid sealed vault: at least one entry is required");
  }
  const entries = input.entries.map(createSealedEntry).sort(compareEntries);
  const ids = entries.map((e) => e.vaultId);
  if (new Set(ids).size !== ids.length) {
    throw new Error(`invalid sealed vault: duplicate vaultId in ${ids.join(",")}`);
  }
  const known = new Set(ids);
  const access = (input.access ?? []).filter((a) => known.has(a.vaultId));
  return {
    entries,
    access: [...access].sort(
      (a, b) => compareStrings(a.vaultId, b.vaultId) || a.at - b.at || compareStrings(a.actorRef, b.actorRef),
    ),
    provenance: input.provenance ?? VAULT_PROVENANCE,
  };
}

export type VaultQuery = {
  kind?: VaultEntryKind;
  noTrain?: NoTrainState;
  datasetRef?: string;
  /** Only entries whose no-train guarantee is actually evidenced. */
  neverTrainedOnly?: boolean;
};

function matches(entry: SealedEntry, query: VaultQuery): boolean {
  if (query.kind !== undefined && entry.kind !== query.kind) return false;
  if (query.noTrain !== undefined && entry.noTrain !== query.noTrain) return false;
  if (query.datasetRef !== undefined && entry.datasetRef !== query.datasetRef) return false;
  if (query.neverTrainedOnly === true && entry.noTrain !== "EVIDENCED") return false;
  return true;
}

/** Deterministically ordered query. An unknown key returns nothing. */
export function queryVault(vault: SealedVault, query: VaultQuery = {}): SealedEntry[] {
  return [...vault.entries].sort(compareEntries).filter((e) => matches(e, query));
}

/**
 * The only entries that qualify as sealed EVALUATION vaults. A staging area
 * or a trust machine is filtered out here, which is the requirement's own
 * anti-confusion rule made executable.
 */
export function sealedEvalEntries(vault: SealedVault): SealedEntry[] {
  return queryVault(vault, { kind: SEALED_EVAL_KIND });
}

/** Entries whose no-train guarantee is actually evidenced. Never a label. */
export function neverTrainedEntries(vault: SealedVault): SealedEntry[] {
  return queryVault(vault, { kind: SEALED_EVAL_KIND, neverTrainedOnly: true });
}
