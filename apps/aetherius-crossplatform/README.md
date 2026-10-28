# Crossplatform---multiplatform

A host-neutral cross-platform runtime library: a cooperative scheduler and lifecycle core, a dependency-aware module system, capability isolation, a workspace layout model, an extension registry, layered configuration, telemetry and release packaging, with a CLI.

**Built:** the runtime library, CLI and tests. **Not built:** a native or web renderer, an installer, code signing and artifact publication.

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

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

This slice replaces the README-and-licence-only `ecosystem/crossplatform---multiplatform` folder.
