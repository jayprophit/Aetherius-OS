# Sealed Benchmark Vault (REQ-p19-sealed-vault, P19)

A **sealed never-trained test store** manifest with an evidence-backed
no-train guarantee. Implementation: `src/eval/sealedVault.ts`.

The registered requirement is the scope authority:

> Sealed never-trained test store with no-train guarantee (P25 secrecy + P31
> hardening); staging areas and trust machines are not sealed eval vaults.

## What this is — and is not

A **manifest** of sealed evaluation material: identities, fingerprints,
custody references, and the evidence state of each no-train guarantee. It
never holds benchmark content, never holds an answer key, and never grants
access.

## The requirement's own anti-confusion clause, enforced

`VAULT_ENTRY_KINDS` is deliberately `SEALED_EVAL | STAGING_AREA |
TRUST_MACHINE`. Naming the two wrong kinds makes their rejection **executable
rather than advisory**:

- a `STAGING_AREA` or `TRUST_MACHINE` entry is a **valid record of the wrong
  kind** — it validates cleanly and stays visible in the manifest
- `sealedEvalEntries(vault)` excludes both, so they can never be mistaken for
  a sealed evaluation vault

```
STAGING AREA  != SEALED EVAL VAULT
TRUST MACHINE != SEALED EVAL VAULT
```

## Sealing is not a guarantee

`noTrain` is `UNPROVEN | EVIDENCED | VIOLATED`, and a sealed entry
**defaults to `UNPROVEN`**. Declaring `EVIDENCED` **without evidence refs is
refused**. `neverTrainedEntries` counts only evidenced entries, so a label
alone never makes a dataset never-trained.

```
SEALED LABEL        != PROVEN NEVER TRAINED
ENTRY SEALED        != NO-TRAIN GUARANTEE EVIDENCED
UNKNOWN             != VIOLATED
SEALED DATA         != CLEAN-ROOM PROOF
```

`UNPROVEN` and `VIOLATED` stay distinct states, so an unexamined dataset is
never reported as a violation either.

## Sealed material is referenced, never inlined

`INLINE_CONTENT_KEYS` — `items`, `answers`, `answerKey`, `expected`,
`labels`, `content`, `payload`, `secret`, `token`, `apiKey`, `privateKey`,
`value` — are **rejected outright** as `inline-content`. A manifest that
carries answers or labels is a leak, not a manifest.

`materialRef` must match the repository's canonical `vault://`
`SECRET_REFERENCE` shape (the same convention used by the context layers).
Fingerprints must be real 64-char sha256 hex; a similarity score is
rejected, because `SIMILARITY != EVIDENCE`. A test asserts the fingerprint
is present in the serialization while the material text is not.

## Access is observed, never granted

There is no `grant`, `authorize`, `unseal`, `decrypt`, `reveal`, `read`,
`open` or `unlock` surface. `buildSealedVault` records
`AccessObservation` records — who was observed accessing what, and any
opaque `authorityRef` — and an observation naming an **unknown** entry is
dropped rather than invented into one. Timestamps are caller-supplied; no
clock is called.

```
ACCESS GRANT != DATA CONTENT
```

## Not a secret manager, not P25, not P31

The requirement names "P25 secrecy + P31 hardening" as the *intent* behind
the guarantee. Neither is implemented, extended or satisfied here, and there
is no `secret`, `keychain`, `keystore`, `encrypt`, `rotate`, `p25`, `p31`,
`hardening` or `kms` surface. P25 remains the authority plane and P31
hardening is a separate requirement.

```
SEALED VAULT != GENERAL SECRET MANAGER
SEALED VAULT != P25 AUTHORITY PLANE
SEALED VAULT != P31 HARDENING
```

`REQ-p20-clean-room` stays `BLOCKED`; sealing data does not supply an
isolated backend.

## Other boundaries

- `vaultId` is `vault-<slug>`, structurally distinct from dataset,
  contamination assessment (`bcont-`), governance proposal (`gov-`),
  review pack (`rcp-`) and review gate (`irev-`) ids.
- `datasetVersion` is **required** and strict `x.y.z`:
  `DATASET NAME != DATASET VERSION`.
- Entries and access order deterministically with a **real comparator**;
  an unknown query key returns nothing rather than everything.
- Unrecognised input keys are rejected rather than silently dropped.
- No storage backend, no key custody, no decryption, no retention or
  expiry policy — those are not in the registered scope.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"benchmark
research"*). **No primary source document exists in this repository**, so no
citation is claimed. `RESEARCH_NOTE != CITATION`.

## Release effect

**NONE.** No release gate is re-scored; public release remains
`NOT YET RELEASE-PROVEN`, scope `UNDEFINED`, `REQ-p31-release-scope`
`OWNER_GATED`.

Tests: `src/eval/sealedVault.test.ts` (25 tests).
