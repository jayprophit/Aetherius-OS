# REQ-p25-supply-chain — Per-Artifact Supply-Chain Attestation Coverage

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Per-artifact SBOM/licence/hash/signature/provenance (SLSA/Sigstore patterns)
across apps/models/skills/plugins/workflows/datasets; package hashes +
licence gates exist, SBOM/signatures/coverage do not.

The requirement itself splits the world: package hashes
(`src/workflows/packages.ts`, sha256 + manifest integrity) and licence gates
(`src/programme/reference.ts`, licence-not-cleared rule) EXIST and were
reused, never duplicated. SBOM records, signature records, and per-artifact
coverage did not exist anywhere — that is what this unit adds.

## What was built

`src/supply/attestation.ts` — `recordArtifact()`, `addRecord()`,
`coverageByDomain()`, `createRegistry()`. `src/supply/attestation.test.ts` —
27 tests. The packages.ts `sha256HexBytes` helper is imported; the digest
algorithm stays sha256 because that is the approved algorithm already in use.

## Binding distinctions (tested)

- DIGEST != DIGITAL SIGNATURE; HASH PRESENT != SIGNATURE PRESENT — digests
  computed from bytes; signatures recorded as claims only.
- SIGNATURE CLAIM != VERIFIED SIGNATURE — `signatureVerified: false` always;
  no backend exists and none is faked (no hash-plus-label, no generated keys).
- SLSA-LIKE FIELDS != SLSA CONFORMANCE — SLSA-style shape, no level claimed.
- PROVENANCE RECORD != GUARANTEE / REPRODUCIBILITY PROOF / CLEAN-ROOM PROOF.
- DECLARED LINK != CRYPTOGRAPHIC BINDING — except the one binding the module
  itself checks (provenance digest equality); mismatches rejected.
- SBOM completeness DERIVED, never asserted — UNKNOWN licence or
  reference-only origin keeps PARTIAL; empty SBOM is UNAVAILABLE; PARTIAL
  requires named gaps; asserted-COMPLETE contradicting evidence rejected.
- PACKAGE EXISTS != LICENCE KNOWN — UNKNOWN licences preserved.
- SUPPLY-CHAIN EVIDENCE != RELEASE — no installers, releases, deploys,
  approvals, or permissions; release scope stays OWNER_GATED.
- SIGNED ARTIFACT != AUTHORIZED ARTIFACT; VERIFIED ARTIFACT != DEPLOYED.
- ARTIFACT NAME != ARTIFACT HASH; SAME PACKAGE NAME != SAME PACKAGE VERSION.
- BUILD EVIDENCE != BUILD EXECUTION; ROLLBACK REFERENCE != ROLLBACK EXECUTION.
- Provenance immutability per store conventions: identical content idempotent,
  changed content conflict, new build new record.
- Timestamps keep identity (source/build/artifact/signing never merged,
  caller-supplied, never invented).
- Deterministic canonical ordering; scrambled-input equality; duplicates by
  canonical identity without collapsing versions.
- Validation precedence: raw keys/authority/persona before generic
  unknown-field errors. Strict closed shapes. Malformed hashes rejected.
