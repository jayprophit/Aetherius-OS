# Evidence traceability

`REQ-p16-evidence-traceability` — what "COMPLETE" is backed by, and how to check.

## The gap this closed

`validateProgramme` required only that `evidence` be a non-empty array of
non-blank strings. Prose satisfies that. Nothing in the codebase could tell a
completion claim backed by a real test apart from one whose every named path
points at nothing.

The `Requirement` type already declared the fields meant to carry
machine-checkable evidence:

```ts
implementation_refs?: string[];
test_refs?: string[];
```

Measured before anything was changed: **0 of 107 requirements populated either
one.** All 92 COMPLETE claims rested on prose alone.

## The audit

```ts
auditEvidenceTrace(requirements, roots, resolve, options?) -> EvidenceTrace[]
summariseEvidenceTrace(traces) -> TraceSummary
extractPathCitations(text) -> string[]
```

| Class | Meaning |
| --- | --- |
| `MACHINE_REFS` | a declared `implementation_refs` / `test_refs` entry, all resolving |
| `CITED_PATHS` | evidence names a path that resolves |
| `PROSE_ONLY` | prose, no path-shaped citation, no machine refs |
| `DANGLING_CITATION` | evidence names a path that resolves nowhere searched |
| `NO_EVIDENCE` | evidence empty or blank only |

`TraceClass` is a recorded structural fact about the *shape of a claim*. It is
not a score, a verdict, or a judgement of whether the work was done.

## Boundaries

- **Read-only.** The auditor never edits a requirement, never proposes a
  `work_state` change, never repairs a dangling citation. A dangling citation
  is reported for a human to classify.
- **No authority, no promotion, no ranking.**
- **No filesystem access.** Path resolution is injected via `PathResolver`, so
  the module is pure, deterministic and testable without a disk.
- **Never silently skipped.** The audit is exhaustive: a COMPLETE requirement
  is always either traceable or explicitly reported `untraceableComplete`.

## Two rules the tests pinned

**A declared ref that does not exist is not a ref.** The first implementation
counted `test_refs` entries as test citations regardless of whether the file
existed, so a requirement could pass itself a citation by naming a missing
path. Its own test caught it. `hasTestCitation` now counts only *resolved*
test paths.

**Prose is not a path.** A citation is only treated as path-shaped when it
actually has a directory separator and an extension. `19 tests in packaging`
yields nothing.

## Two conventions, both declared

The registry really does use two path conventions, found by audit rather than
assumed:

- repo-root-relative — `src/release/packaging.ts`
- src-relative shorthand — `runners/sync.ts` (six occurrences, older prose)

`DEFAULT_SEARCH_PREFIXES` searches exactly `["", "src/"]` and records
`matchedPrefix` and `resolvedPath` for every hit, so a reader can always tell
which convention a citation used. An undeclared convention is reported, never
inferred.

## Owner is a project, not a repository

`owner` names the accountable **project**, not the repository holding the
implementation. Eight requirements owned by `genesis`, `ide` or `mat` resolve
inside the Aetherius-OS monorepo:

- Genesis is a C++ tree (`cmake`, `include`, `components`) with no
  TypeScript reflex/calibration/orchestrator module — those live in
  `Aetherius-OS/src/genesis/`.
- IDE-Workspace has no `src/monitoring`.
- MAT has neither `docs/context-layers.md` nor `src/context/layers.ts`.

So the audit searches each project's own repository *and* the monorepo. That
mapping is stated in the audit test with this reasoning, so a reader can check
it rather than trust it.

## Measured baseline (2026-09-29)

| Measure | Value |
| --- | --- |
| Requirements | 108 |
| COMPLETE | 93 |
| COMPLETE with no resolvable test citation | **70** |
| Using `implementation_refs` / `test_refs` | 1 (this requirement) |
| Dangling citations | 4 |

The 4 dangling citations are `src/user.ts`, `src/userService.ts`,
`src/userServiceHelper.ts` and `src/consumer.ts` — fixture filenames quoted
inside the evidence prose of `REQ-p20-change-impact` and
`REQ-p20-collision-predictor`, describing defects that tests found. They were
left unrewritten: rewriting them into `src/`-relative paths would fabricate
files. Classification belongs to a human, not to the auditor.

## Open finding, not a remediation

70 of 93 COMPLETE claims have no resolvable test citation, and 107 of 108
requirements still populate neither machine-readable field. This unit measures
the problem; it does not fix it. Closing it means, per requirement,
confirming that a named test actually proves that requirement before citing
it — which is verification work, not a bulk edit. No evidence was invented to
make the number smaller.

## Prose warning

Quoting a file-like name inside evidence creates a citation candidate. While
writing this requirement, naming `src/user.ts` in prose made the requirement
manufacture four fresh dangling citations against itself. The prose was
reworded to bare fixture names. Cite real paths deliberately; the auditor will
take you at your word.
