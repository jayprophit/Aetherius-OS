# Crossplatform---multiplatform

A host-neutral cross-platform runtime library: a cooperative scheduler and lifecycle core, a dependency-aware module system, capability isolation, a workspace layout model, an extension registry, layered configuration, telemetry and release packaging, with a CLI. It also provides the host-neutral Genesis bridge for scoped browser, file, app, input and screen automation.

**Built:** the runtime library, CLI, Genesis bridge and tests. **Not built:** a native or web renderer, an installer, code signing, artifact publication, a live browser driver, a screen-capture implementation or an OS-level input injector.

This is a runtime library, not an operating-system kernel and not a native windowing toolkit. "Kernel" here means the scheduler and lifecycle core.

## What is built

- PLT-001: a deterministic cooperative scheduler with priority ordering, follow-up work and shutdown hooks.
- PLT-002: a dependency-aware module registry with lifecycle, rollback and cycle detection.
- PLT-003: capability isolation with namespaced resources and deny-by-default grants.
- PLT-004: a workspace layout model with regions, panels, sizing, visibility and restore.
- PLT-005: an extension registry with command and panel contribution points.
- PLT-006: layered configuration with provenance, validation, coercion and secret redaction.
- PLT-007: telemetry with logs, spans, counters, gauges and audited errors.
- PLT-008: release manifest creation, canonical digests and stable-release checks.
- TLS-001..TLS-004: a CLI, configuration flags, structured JSON output and tests.

## Genesis bridge

The bridge is the policy layer the ecosystem apps use to request "kernel-level" access without receiving ambient authority. A host supplies the ports; the bridge enforces the grant.

- Nine explicit capabilities: `browser.navigate`, `browser.paginate`, `files.read`, `files.write`, `apps.launch`, `apps.control`, `input.pointer`, `input.keyboard` and `screen.capture`.
- Grants name a subject, file roots, exact or `*.example.com` browser hosts, app ids and an optional expiry.
- File paths are absolute, normalised, traversal-free and confined to the granted roots; reads, writes, directory listings and searches have byte and entry limits.
- Browser pages are host-checked before and after a host call (redirects are refused), page-size limited, and pagination follows `rel=next`/`rel=prev` or numeric anchors with page limits and cycle detection.
- App control can list, launch, focus, close, enumerate commands, invoke a declared command and run a front-to-back sequence that stops on the first failure.
- Pointer and keyboard input is coordinate-checked, key-name-checked and length-limited. Typed text is journaled as a length and SHA-256 digest, never plaintext.
- Every call is written to an `AuditJournal` and the shared hash-chained `EventLedger`; secret-looking keys are redacted.

The tests use in-memory ports. There is no live browser driver, screen-capture implementation or OS-level input injector in this repository, so live desktop automation is not claimed.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

This slice replaces the README-and-licence-only `ecosystem/crossplatform---multiplatform` folder.
