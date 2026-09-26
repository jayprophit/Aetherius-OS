# Toolchain inventory registry

`REQ-p20-toolchain-registry` — P20, owner `aetherius-os`, status PROVEN.

Implementation: `src/toolchain/registry.ts`
Tests: `src/toolchain/registry.test.ts` (40)

## Registered scope

The registry is the scope authority:

> Versioned inventory of compilers, interpreters, SDKs, package managers, build
> systems and language runtimes with versions, executable paths, availability
> and provenance; generic tool capability refs do not satisfy this.

So this is a concrete, **versioned** inventory over six registered kinds —
`COMPILER`, `INTERPRETER`, `SDK`, `PACKAGE_MANAGER`, `BUILD_SYSTEM`, `RUNTIME` —
where every tool carries the four things the requirement names: a version, an
executable path, an availability, and provenance for each fact.

## Generic tool capability refs do not satisfy this

`src/providers/capabilities.ts` is exactly that ref: a model card carrying
boolean capability flags (`toolUse`, `structuredOutput`, `coding`, ...). A
boolean says a model *claims* a capability. It says nothing about which compiler
is installed, at which version, at which path, or whether that path exists.

```
GENERIC TOOL CAPABILITY REF != TOOLCHAIN INVENTORY
CAPABILITY FLAG != VERSION
CAPABILITY FLAG != EXECUTABLE PATH
"CLAIMS toolUse" != "gcc 13.2 is on disk at /usr/bin/gcc"
```

An entry carrying capability-shaped keys (`capabilities`, `toolUse`,
`structuredOutput`, `supportsTools`, `healthy`, `costRank`, ...) is **rejected by
name**, not stored. `auditAgainstRegisteredScope` separates a mixed list into
concrete tools and rejected generic refs, and a record with a version but no
path is rejected too — half an inventory is not an inventory.

## Availability is derived, never asserted

A caller cannot declare a tool `AVAILABLE`; supplying the field is rejected as
`TOOLCHAIN_DERIVED_FIELD_REJECTED`. Availability follows from evidence:

```
AVAILABLE iff version REPORTED and path REPORTED and path VERIFIED
```

```
UNKNOWN VERSION != AVAILABLE TOOL
UNKNOWN VERSION != "latest"
CLAIMED PATH  != VERIFIED PATH
NEVER INVENTED VERSION, NEVER "latest", NEVER A DEFAULT
```

A reported version of `"latest"` or `"unknown"` is rejected outright, and a
reported path requires an explicit `verified` boolean with provenance.

The four reasons a tool is not available stay distinct, because they call for
different responses: `VERSION_UNKNOWN`, `PATH_UNKNOWN`, `PATH_UNVERIFIED`,
`NOT_INSTALLED`.

## Absent is not unknown

A tool that was never recorded is `NOT_FOUND` — a different fact from a recorded
tool whose version is unknown.

```
NOT_FOUND != RECORDED_BUT_UNKNOWN
NOT_FOUND != UNAVAILABLE
```

`summarizeInventory` reports `kindsWithNothingRecorded` separately from
`unavailableByReason`, so a kind nobody probed never collapses into a count of
broken tools.

## Names never resolve

Resolution is by explicit `toolId`, or by asking for the single tool of a kind.
Two compilers in one inventory is a real situation, not something to guess
through: `requireSingleTool` raises `TOOLCHAIN_AMBIGUOUS` and names both
candidates. A name lookup is simply not found.

```
SIMILARITY != RESOLUTION
NAME != IDENTITY
TWO CANDIDATES != PICK ONE
```

## Inventory only

```
INVENTORY != EXECUTION AUTHORITY
TOOL PRESENT != AUTHORIZED TO EXECUTE
INVENTORY != PROVISIONING
```

It is not an installer, a downloader or a resolver. Nothing fetches, installs,
downloads, shells out or repairs a missing tool — a missing tool is reported
`UNAVAILABLE` with a reason and the registry does not go and get it. The summary
carries `authorizesExecution: false` and `provisionsTools: false` as literal
values, and the module exposes no `run`, `exec`, `spawn`, `install`,
`download`, `fetch`, `repair` or `provision` surface.

```
REGISTRY != DURABLE STORE
```

The registry is in-memory and caller-constructed: no database, cache, service,
scheduler or server. It reads no clock, no filesystem and no network, so the
only executable facts come from the caller.

## Strict input shape and determinism

Unknown fields are rejected at the registry, entry, version and path levels
rather than dropped. Duplicate `toolId`s are refused. Output is deterministic
from scrambled input (entries sorted by id), and recording a tool never mutates
the registry it was given. No score, rating, verdict, recommendation,
confidence, percent or quality field is emitted — an inventory is a count, not a
judgement.

## Gates

- `src/toolchain/registry.test.ts` — 40/40
- related (toolchain, workers, analysis, programme, state, runners, providers)
  — 519/519
- `npm run typecheck` — clean
- `npm run build` — clean, 46 modules
- `npm run registry:validate` — clean, 243
- lint — `NOT_APPLICABLE`; no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config in the repository. **Not
  a pass.**
- full suite — **not a clean pass**: 1023 tests, 1020 passed, 3 timeouts,
  **0 assertion failures**, in pre-existing filesystem-heavy tests this unit
  never touched. The failing set *changed* between the full run and an isolation
  re-run of the same two files (promotion failed two different cases), which is
  the load signature rather than a logic defect. Open timing item; see
  `native/BUILD-TODO.md`.

Source: `RESEARCH_NOTE` "legacy directives (toolchain registry)", legacy coverage
audit 2026-09-25. `RESEARCH_NOTE != CITATION`.
