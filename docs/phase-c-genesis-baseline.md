# Phase C — Genesis clean-clone native baseline

Date: 2026-09-30
Genesis commit proved: `fa13316` (worktree of `8343005` plus two content-audit fixes)
State: TESTED from a clean clone — this is a build/test baseline, not integration

Genesis had never been proven from a clean clone. It is now.

## How it was proved

An isolated worktree of the committed tree (no untracked files, `git status`
clean), configured and built with the repo's own CMake:

```
cmake -S <worktree> -B <worktree>/build -G Ninja -DCMAKE_BUILD_TYPE=Debug
cmake --build <worktree>/build
ctest --test-dir <worktree>/build --output-on-failure
```

- Compiler: GNU 16.1.0 (MinGW), C++20, `CMAKE_CXX_STANDARD_REQUIRED ON`
- Toolchain present: `cmake`, `ninja`, `g++`, `clang`, `ctest`, `pwsh`
- Build: **116/116 targets**, no errors
- Tests: **21/21 ctest gates passed**, 179 s total

The one-Genesis identity gates are green from clean state, in both of their
suites: `genesis_identity_tests`, `genesis_genesis_identity_tests`, plus
`genesis_life_record_tests` alongside them. That is the identity baseline for
the `one Genesis identity across models, workers and modes` requirement, proven
by the C++ suite in the owning repository rather than by a TypeScript mirror.

## What the baseline exposed: the content audit was not reproducible

`genesis_repository_content_tests` failed from the clean clone with "manifest is
stale", and it turned out to be four real defects, none of which a working-tree
run could see:

1. **The inventory walked the filesystem**, so it recorded whatever a developer
   had locally. The committed manifest listed 20 untracked `__pycache__` `.pyc`
   files, and the deliberately untracked OmniAgent reference tree changed the
   recorded audit. The audit described a machine, not a repository.
2. **The manifest was stale against the committed tree** by 39 files — including
   `include/genesis/identity/genesis_identity.hpp` and
   `include/genesis/organism/loop.hpp` — and 136 content hashes.
3. **Row order was not canonical.** `Sort-Object` compares with the current
   culture; under culture rules `affect.hpp` and `affect_persistence.hpp` tie
   at the primary weight, so their order fell back to enumeration order. `git`
   returns paths in byte order and a filesystem walk does not, so identical
   content serialized two ways and compared unequal to itself.
4. **Text was classified by extension allow-list, not by content.**
   `core.autocrlf=true` rewrites LF to CRLF on checkout, so every `.ts` and
   `.tsx` file — all 136 of them — hashed differently between a working tree and
   a fresh clone of the same commit. `media_class` and `hash_mode` were also
   conflated, which is why the two governed `.svg` assets disagreed too.

The fixes live in the owning repository: the inventory enumerates tracked paths
read as raw UTF-8 from `git ls-files -z` (text output is not safe —
`core.quotepath` escapes non-ASCII names to octal, producing paths that cannot
be opened), a missing tracked path is a hard error, rows sort with
`[StringComparer]::Ordinal`, and text is detected by content and always hashed
as canonical LF.

A new gate, `genesis_repository_content_inventory_tests`, proves the properties
that were broken: untracked and generated files do not change the inventory,
repeated runs are byte-identical, and the manifest is in strict ordinal order —
including a check that the corpus still contains a case where ordinal and
culture order disagree, so the gate cannot silently stop proving anything. Both
defect mutations were proven caught against scratch copies of the tracked tree.

`CMakeLists.txt` now warns at configure time when `pwsh` is absent. Previously
the three content gates were not merely failing on such a machine: they were
never registered, and the run looked clean.

## State after the fixes

| Gate | Working tree (untracked references present) | Clean clone |
| --- | --- | --- |
| `genesis_repository_content_tests` | pass | pass |
| `genesis_repository_content_inventory_tests` | pass | pass |
| Inventory byte output | identical to the clean clone (106 650 bytes) | — |

Manifest: 548 tracked files, 509 text, 37 images, 85 477 115 bytes.

## What is still not proven

- Genesis is **not yet in the IDE vertical slice**. Nothing here shows Genesis
  driving a task through the IDE; the harness hosts a Bridge session, and
  Genesis's own seams have not been exercised through it.
- Worker lifecycle — startup, heartbeat, timeout, crash, cancellation, result
  reconciliation, cleanup, checkpoint interaction — is unproven. Agent Bridge
  was shown not to own it, so it is Genesis/execution-owned and still open.
- The build was proven with GCC/MinGW. `cl` is not present on this machine, so
  the MSVC configuration (the one the repo's own `build/` tree suggests has been
  used historically, including `build/p0-verify/*.vcxproj` artefacts) is
  unproven and is not claimed.
- Sanitizers exist behind `GENESIS_ENABLE_SANITIZERS` and were not enabled for
  this baseline.
- No Genesis-in-IDE scenario has been run, and one clean clone is not
  reproducibility across environments.
