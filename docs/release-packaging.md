# REQ-p31-release-packaging — Release Package Records and Lifecycle Plans (no execution)

Status: PROVEN / COMPLETE. Owner: aetherius-os.

## Registered scope

Public installer/packaging with first-run setup, update/migration/rollback
and uninstall for the defined release scope; developer checkout is not an
installer. SBOM/signing compose with supply-chain attestation, not
duplicated.

Prior state: no installer/packaging/update-path code existed anywhere;
`package.json` carries version 0.0.0. Lifecycle rollback
(`workflows/lifecycle.ts`) and state schema migrations (`state/migrate.ts`)
are separate owners, referenced never reimplemented.

## What was built

`src/release/packaging.ts` — `recordPackage()`, `parseSemver()`,
`compareSemver()`, `semverToString()`. `src/release/packaging.test.ts` —
19 tests.

## Binding distinctions (tested)

- PACKAGE RECORD != INSTALLER EXECUTION; UPDATE/ROLLBACK/UNINSTALL PLANS !=
  EXECUTION/DELETION. No downloader, installer runner, migration executor,
  shell, network, or timers anywhere.
- SCOPE REFERENCE != SCOPE DECISION — scopeRef required; scope stays
  OWNER_GATED and is never chosen, widened, or narrowed here.
- 0.0.0 != A RELEASE — refused with explicit reason, never silently
  accepted; strict X.Y.Z only (no ranges/wildcards/latest).
- ATTESTATION REF != ATTESTATION COPY — digests VERIFIED only against a
  caller-supplied lookup, otherwise recorded ASSERTED and marked as such;
  mismatches rejected.
- ROLLBACK POINTS BACKWARD — targets must be strictly older (rolling back
  to fromVersion is the normal case); unknown-history targets refused.
- Migration refs reference P17 (never executed here); uninstall states
  preserved data explicitly.
- Duplicate attestation refs rejected (DUPLICATE REFERENCE != ADDITIONAL
  EVIDENCE). Deterministic canonical ordering; no caller mutation; no
  clock/network.
- Validation precedence: authority/secret/persona violations before generic
  unknown-field errors. Strict closed shapes.
