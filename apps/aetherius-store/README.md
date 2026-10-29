# Aetherius Store

The package store core for Aetherius OS: a signed catalogue, semver resolution, dependency-aware install plans, update, rollback, uninstall and signing-key revocation.

**Built:** the store domain core and tests. **Not built:** a real signature verifier, artifact download or execution, a hosted catalogue, accounts/payments and a user interface.

## What is built

- Semver parsing, ordering and range matching.
- A catalogue of app listings and per-platform/per-architecture artifacts.
- Publishing with canonical version digests and a signature gate: a stable release must be signed.
- Resolution to the highest version that has an artifact for the requested platform and architecture.
- Dependency planning with dependency-first ordering, size totals and cycle refusal.
- Permission and entitlement gates before a plan is offered.
- Disk-space checks before install.
- Install, update and rollback with an auditable state history.
- Uninstall and post-uninstall verification.
- Signing-key revocation that invalidates installed stable packages.
- Every state change on the shared hash-chained `EventLedger`.

## Honest limits

- `DemoSignatureVerifier` accepts any non-empty signature. It is a port for a host verifier, not cryptography.
- `OwnsEverything` is a demo entitlement source, not an account or purchase system.
- An install is a plan and an in-memory record. No artifact is downloaded, unpacked, executed or written to an application directory.
- There is no store UI, HTTP service or hosted catalogue.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

Built as the owner's first-party store, following the request for an Aetherius Store with Apple/Linux/Microsoft-style packages. The desktop slice owns the per-OS package-format and installer planning.
