# Project language graph

`REQ-p20-language-graph` — P20, owner `aetherius-os`, status PROVEN.

Implementation: `src/analysis/languageGraph.ts`
Tests: `src/analysis/languageGraph.test.ts` (58)

## Registered scope

The registry is the scope authority:

> Whole-project dependency graph across C/C++/Rust/Python/JS-TS/shell/
> build-files/manifests; distinct from the Python-only test-impact import
> graph and the programme system graph.

So this unit is the project source graph across the registered families. Note
why the parser-adjacent scope that was ruled *out* for `REQ-p20-change-impact`
is in scope *here*: change-impact is registered as a **join** over
caller-supplied edges, while this requirement is registered as **the graph
itself**. The change-impact correction is not resurrected.

## The two neighbours it must stay distinct from

- The **Python-only test-impact import graph** is Agent-Bridge TestImpact. It is
  not in this repository and is not extended, wrapped or reimplemented.
- The **programme system graph** is `registry/depgraph.json`: ten system-level
  nodes with no file, module or symbol ids. Untouched.

```
WHOLE-PROJECT GRAPH != PYTHON-ONLY TEST-IMPACT IMPORT GRAPH
WHOLE-PROJECT GRAPH != PROGRAMME SYSTEM GRAPH
```

## What this is not

The extractors read the literal reference text a file declares. They are not a
language server, not a type checker, not a preprocessor and not a compiler.

```
STATIC DECLARED GRAPH != COMPLETE RUNTIME CAUSAL GRAPH
DECLARED IMPORT       != RESOLVED LOAD
```

Dynamic dispatch, macro-generated includes, plugin registration and reflection
are not represented. That absence is a stated limitation, not a claim that no
dependency exists.

## No similarity inference

A reference becomes an edge only when the file literally declares it **and**
resolution succeeds under an explicit named rule. Filenames, symbol names,
shared prefixes and shared directories never create an edge:

```
SIMILARITY != DEPENDENCY
SAME NAME  != DEPENDENCY
SAME DIRECTORY != DEPENDENCY
```

A reference that is found but cannot be resolved is reported in `unresolved[]`
with a reason. It is never dropped and never reported as "no dependency":

```
UNRESOLVED != NO DEPENDENCY
NOT FOUND IN GRAPH != PROVEN ISOLATED
```

## Resolution is auditable

Every edge records the named rule that produced it, the literal construct and
the 1-based line, so a reviewer can see whether a target was named outright,
completed from a name, or listed by a build file.

| Rule | Meaning |
| --- | --- |
| `RELATIVE_PATH` | The reference named a path and that path exists. |
| `EXTENSION_COMPLETION` | A C/C++ include-path search completed a bare name. |
| `MODULE_NAME` | Python or JS/TS mapped a bare module name onto a sibling file. |
| `BUILD_LISTING` | A build file listed the source. |
| `DECLARED_PACKAGE` | A dependency declared by name, with no project file. |

**Ambiguity is reported, not resolved.** Two candidate files for one name
yields `AMBIGUOUS_EXTENSION_COMPLETION` rather than a coin flip. By contrast,
`#include "util.h"` beside a `util.hpp` is *not* ambiguous: the include names a
file, and `util.hpp` is not a candidate to be weighed against it.

## Node kinds are deliberately incompatible

`FILE`, `PACKAGE` and `BUILD_TARGET` cannot be confused. A third-party import or
a manifest dependency entry becomes a `PACKAGE`; a CMake or Make target becomes
a `BUILD_TARGET`; a project source stays a `FILE`. A bare specifier is a package
even when a project file shares its name, and the two are never merged.

Python is the one family with a documented ambiguity: a bare name is resolved
against the importer's own package first, and falls back to a package node when
no sibling module exists. A local module that is not reachable from the
importer's directory cannot be told apart from a third-party distribution
without a package index, so it is reported as a package. That limitation is
stated rather than guessed around.

## Python leading dots are package levels

`.helper` is a sibling module and `..pkg.mod` climbs one directory. They are
translated into an explicit level count, not treated as literal dot-prefixed
filenames.

## Manifests are scanned section-aware

A line-based `"key": "value"` match would turn `"name": "my-app"` into a false
dependency on a package called `my-app`. So:

- `package.json` is read only inside a real `dependencies`-style block;
- `Cargo.toml` only inside a dependency table;
- `requirements.txt` line by line, skipping comments and flags;
- `pyproject.toml` is **deliberately not scanned**, because its PEP 621 inline
  array cannot be attributed to a table with confidence. Emitting nothing is
  honest; guessing is not.

## Build files

CMake `add_executable`/`add_library` source lists produce `SOURCE_OF` edges to
real project files, and `target_link_libraries` produces `LINK` edges to
`PACKAGE` nodes. A listed source absent from the file set is reported
unresolved. A Make prerequisite written as `$(VAR)` is reported as
`BUILD_VARIABLE_NOT_EXPANDED` rather than dropped — dropping it would claim the
target has no build dependency.

## Composition, not ownership merge

This module **produces** edges. `src/programme/changeImpact.ts` remains the
owner of impact querying and consumes caller-supplied edges; it was not
modified. No dependency query, impact traversal or change scoring lives here.

## Inputs

File contents are supplied by the caller, so the graph is a pure function of the
declared file set. No filesystem read, no clock, no network. Output is
deterministic from scrambled input, and caller input is never mutated. A file
whose family cannot be determined is reported via `unclassifiedFiles` rather
than guessed at.

## Defects found and fixed in this unit

1. `extensionOf` treated a leading dot as an extension separator, so the Python
   specifier `.helper` parsed as a file named `helper` with extension `.helper`.
2. `use ::serde::Serialize;` parsed to an **empty** crate root because the
   leading `::` was not stripped before splitting.
3. A CMake `target_link_libraries` entry fell through to file resolution and was
   reported as a missing file instead of a library dependency.
4. A Make prerequisite written as `$(VAR)` was filtered out and **silently
   dropped**, claiming the target had no build dependency.
5. A relative specifier without an extension never received completion, and the
   relative branch used the repository root as its base instead of the
   importer's directory, so `./b` from `src/` resolved against the root.

Two further findings were **wrong test expectations of my own**, and the tests
were corrected rather than the code: the `#include "util.h"` ambiguity case
above, and an extensionless `./b` import which is `MODULE_NAME` in both
directions rather than `RELATIVE_PATH` in one. A failing test is not
automatically a failing implementation.

## Registry-editing defect

`requirements.json` repeats the boilerplate evidence string `legacy audit:
genuine uncovered delta, still relevant` across five records. An anchor-based
edit matched `REQ-p20-spine-branch` instead of this one and overwrote that
unrelated requirement's evidence, provenance, notes, status and work state. It
was caught with `git diff`, reverted with `git checkout`, and re-applied by
locating the record by its unique id.

**Anchor edits on the unique id and verify the diff. A successful edit message
is not proof the intended record changed.**

## Gates

- `src/analysis/languageGraph.test.ts` — 58/58
- related (`src/analysis`, `src/programme`, `src/state`, `src/workers`,
  `src/runners`) — 355/355
- `npm run typecheck` — clean
- `npm run build` — clean, 46 modules
- `npm run registry:validate` — clean, 243
- lint — `NOT_APPLICABLE`; no lint script and no
  eslint/biome/oxlint/tslint/stylelint/prettier config in the repository. No
  linter introduced.
- full suite — **not a clean pass**: 949 tests, 946 passed, 3 timeouts,
  **0 assertion failures**, all in pre-existing filesystem-heavy tests this unit
  never touched. Both affected files are fully green in isolation (65/65); see
  the open timing item in `native/BUILD-TODO.md`.

Source: `RESEARCH_NOTE` "legacy directives (mixed-language project graph)",
legacy coverage audit 2026-09-25. `RESEARCH_NOTE != CITATION`.
