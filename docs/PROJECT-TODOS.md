# Project Todos — outstanding work across the workspace

> Generated from `docs/PROJECT-TODOS.yaml`. Do not hand-edit this
> file; edit the YAML and regenerate.

- Source date: 2026-10-20
- Tasks: **121** (110 open, 11 done)

## By project

| Project | Open | Done |
|---|---|---|
| aetherius-os | 38 | 5 |
| agent-bridge | 8 | 0 |
| agent-bridge-cloudhybrid | 2 | 0 |
| agent-bridge-dashboard | 6 | 0 |
| agent-bridge-runtimesafety | 2 | 0 |
| architecture-of-shadows-book | 2 | 0 |
| athena | 2 | 0 |
| decentralized-messaging-app | 2 | 0 |
| food-wiki-app | 3 | 0 |
| genesis | 5 | 3 |
| hermes-config-audit | 12 | 0 |
| ide-workspace | 4 | 0 |
| ide-workspace-dashboard | 3 | 0 |
| ledgerlands | 6 | 2 |
| mat | 11 | 0 |
| poietek | 2 | 0 |
| universal-bridge | 2 | 1 |

## P1 blocking

### ⬜ TODO-AOS-003 — Make the HTTP bridge transport test deterministic

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — npm test, 2026-10-20

Two tests are timing-sensitive under CPU contention on this four-core host. The bridge transport test times out at the default 5000ms limit, and the shared schema envelope test failed once in a full-suite run. Both pass in isolation and in three consecutive unopposed full-suite runs, so the faults are load sensitivity rather than behaviour faults, but a suite that fails intermittently cannot be used as a gate.

Evidence:

```
src/workflows/bridgeAction.test.ts:339 "maps success, deny, approval and malformed responses" -> Test timed out in 5000ms. src/state/sharedSchemas.test.ts "carries every domain inside a P17 envelope without replacing storage" -> failed once in a full-suite run. Three consecutive unopposed full-suite runs each reported 1771 of 1771 passing on 2026-10-20.
```

Acceptance:

- [ ] The test passes repeatedly without an elevated timeout
- [ ] The fix distinguishes a real hang from a slow cold start

### ⬜ TODO-APP-002 — Decide what Aetherius must be able to control, and build the control

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — 2026-10-20: they can help understand apps, give control over apps, tools, others
- **Depends on:** TODO-APP-001, TODO-GAP-001

The application registry records what is there. The work is to decide, per application, what Aetherius needs to do with it: understand it, launch it, drive it, or integrate with it. The installed set is a mix of agents, browsers, editors, CAD tools, a game engine and an audio suite, and each class needs a different answer. A browser needs a CDP or extension surface; a desktop application needs an accessibility-tree or UI-automation surface; a plugin host needs a file and IPC contract.

Evidence:

```
docs/APPLICATION-REGISTRY.yaml records 159 shortcuts across 12 categories. The gap analysis records the current state: GAP-BROW-001 "Genesis has no way to see or drive a computer" and GAP-TOOL-003 "No computer-use or browser automation capability exists in Genesis", both MISSING.
```

Acceptance:

- [ ] Every application category has a stated control strategy
- [ ] The strategy is recorded against the application registry
- [ ] The first control surface is implemented and proven

### ⬜ TODO-KRN-001 — Write the machine-level modules of the C kernel

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — ADR-001-KERNEL-IN-C.md, Implementation

The C kernel's pure logic is written and proven. The modules that touch the CPU are not: the GDT and TSS installation, the IDT installation, the interrupt stubs, the syscall entry path, the context switch, the serial driver, the framebuffer report, the firmware memory map handover and the UEFI entry point. These are specified in the Rust original and referenced by the build, and they are the reason the UEFI image does not build yet.

Evidence:

```
ADR-001: "The machine-level modules (gdt_install.c, idt_install.c, isr.c, entry.S, main.c) are specified and referenced by the build but not yet written." The Rust originals to port are native/aether-boot/src/gdt.rs, idt.rs, sched.rs and main.rs.
```

Acceptance:

- [ ] The C kernel boots under QEMU and reports the same evidence markers as the Rust kernel
- [ ] The Rust and C kernels produce the same marker sequence

### ⬜ TODO-KRN-002 — Install gnu-efi so the UEFI kernel image can be built

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — ADR-001-KERNEL-IN-C.md, What is not yet done

The UEFI image needs gnu-efi, the open-source UEFI toolchain. It is not installed on this host, and the build script reports that plainly rather than producing an unverified image or pretending the build succeeded.

Evidence:

```
"The UEFI image does not build yet: gnu-efi is not installed on this host, and the build script says so rather than pretending otherwise."
```

Acceptance:

- [ ] gnu-efi is installed and the UEFI image builds
- [ ] The image is linked with a versioned linker script and a known-good entry point

### ⬜ TODO-KRN-003 — Prove the C kernel under the QEMU boot harness

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — ADR-001-KERNEL-IN-C.md, Verification
- **Depends on:** TODO-KRN-001, TODO-KRN-002

The Rust kernel is proven by booting it and reading the marker sequence off the serial port: the IDT self-test, the timer tick count, the scheduler switch count and the controlled halt. The C kernel must produce the same markers before the Rust layer is retired, because a kernel that compiles is not a kernel that boots.

Evidence:

```
The Rust proof markers are recorded in native/BUILD-TODO.md: "INT: breakpoint OK", "TIMER: irq_ticks=200 firmware_ticks=0 spins=200", "SCHED: switches=9 all_done=true", "AETHERIUS-HALT: controlled halt".
```

Acceptance:

- [ ] The C kernel produces every marker the Rust kernel produces
- [ ] The marker comparison is automated, not read by eye

### ⬜ TODO-SEC-001 — Add the secret scan to the build gate

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — 2026-10-20 conversation extraction, 12 OpenRouter keys found

The conversation corpus held twelve live-looking OpenRouter keys that had been pasted into chat. The extractor now redacts before writing, and the corpus is clean, but the scan that found them is a one-off script rather than a gate. The repositories are public, so a credential that reaches a commit is published, and the conversation material is exactly the kind of place credentials end up.

Evidence:

```
"12 hit(s)" for openrouter_key across research/codex-history/index.jsonl and threads.json, before the extractor was taught to redact.
```

Acceptance:

- [ ] A scan runs as part of the build gate
- [ ] The scan covers the tracked tree, not only the conversation corpus
- [ ] A finding fails the build rather than printing a warning

### ✅ TODO-WS-001 — Register the six unlisted project folders in the workspace hygiene guard

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** build-audit — npm test, 2026-10-20

The canonical project list in docs/workspace-hygiene.test.ts named twelve projects while seventeen exist on disk. The guard therefore reported six real project folders as strays and failed the suite. The guard is the friction that forces a new project to be classified, and it is doing its job: the list simply had not been updated.

Evidence:

```
expected [ 'Aetherius-OS', ...(11) ] to deeply equal [ 'Aetherius-OS', ...(17) ]; missing entries were Agent-Bridge-cloudhybrid, Agent-Bridge-dashboard, Agent-Bridge-runtimesafety, Hermes-Config-Audit, IDE-Workspace-dashboard and the REA research tree, which was folded into Aetherius-OS rather than left as a competing standalone project.
```

Resolution:

Resolved 2026-10-20. The five sibling project folders were added to KNOWN_PROJECTS, and the REA research tree was moved to Aetherius-OS/research/rea with the adapter at Aetherius-OS/src/analysis/rea, so no new project folder was needed. docs/workspace-hygiene.test.ts now passes 13 of 13.

Acceptance:

- [ ] The KNOWN_PROJECTS list matches the folders on disk
- [ ] docs/workspace-hygiene.test.ts passes

### ⬜ TODO-GAP-001 — Close the eight priority-one Genesis gaps

- **Project:** genesis
- **Status:** OPEN
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.md, Next to build

The gap analysis assessed 31 agent-platform capabilities against the Genesis registries and found 27 open, 8 of them priority one: capability-scoped authority, delegation with narrowing scope, hive communication, crash recovery and resume, the free-first admission guard, task decomposition, durable task state, and tool execution with sandboxing. Those eight are the difference between Genesis being an organism runtime and Genesis being an agent platform.

Evidence:

```
"Open (missing or partial): 27 (87% of assessed capabilities)" with eight priority-1 entries. The underlying requirement registry shows 170 requirements of which 84 are proven.
```

Acceptance:

- [ ] Each priority-one gap moves to IMPLEMENTED or VERIFIED with a test that proves it
- [ ] The gap registry is regenerated and the report shows the change

### ✅ TODO-GEN-001 — Discard the stale CMake cache in the Genesis build tree

- **Project:** genesis
- **Status:** DONE
- **Source:** build-audit — cmake -S . -B build, 2026-10-20

build/CMakeCache.txt was generated when the repository lived at C:\Users\jpowe\Desktop\Genesis and was moved into the Projects folder afterwards. CMake refuses to reuse a cache whose source or binary directory no longer matches, so nothing compiles and nothing is even attempted.

Evidence:

```
CMake Error: The source "C:/Users/jpowe/Desktop/Projects/Genesis/CMakeLists.txt" does not match the source "C:/Users/jpowe/Desktop/Genesis/CMakeLists.txt" used to generate cache.
```

Resolution:

Resolved 2026-10-20. The stale CMakeCache.txt and CMakeFiles were discarded and the tree reconfigured at its current path. The build now links 119 of 119 targets and all 22 registered CTest gates pass. The repository content manifest was regenerated afterwards, because that guard correctly detected the source change rather than letting it through silently.

Acceptance:

- [ ] cmake --preset local-release configures without a path-mismatch error
- [ ] cmake --build --preset local-release compiles every target
- [ ] ctest --preset local-release reports the full registered suite

### ✅ TODO-GEN-002 — Remove the duplicated security sources from the Genesis CMake target

- **Project:** genesis
- **Status:** DONE
- **Source:** build-audit — CMakeLists.txt lines 52-65, 2026-10-20

The genesis_core source list names eight security translation units twice, so the same files are handed to the compiler twice for one target.

Evidence:

```
src/security/crypto_provider.cpp, crypto_persistence.cpp, key_custody.cpp, key_custody_persistence.cpp, platform_crypto_inventory.cpp, platform_crypto_inventory_native.cpp, provider_open_observation.cpp and provider_open_observation_native.cpp each appear twice in add_library(genesis_core STATIC ...).
```

Resolution:

Resolved 2026-10-20. The duplicate block was removed from the genesis_core source list and the build links cleanly.

Acceptance:

- [ ] No source path appears twice in the genesis_core source list
- [ ] The build succeeds and the registered test count is unchanged

### ✅ TODO-GEN-006 — Untrack the unlicensed OmniAgent reference source from Genesis

- **Project:** genesis
- **Status:** DONE
- **Source:** build-audit — docs/omniagent-reference.provenance.test.ts, 2026-10-20

Forty-seven files of unlicensed Google AI Studio applet source were tracked in the Genesis repository. The Aetherius-OS provenance guard exists precisely to catch this, and it did: a commit titled "Fix: commit pending changes from workspace cleanup" had added the whole tree. The directory carries no LICENSE, LICENCE, NOTICE or COPYING file, so there is no evidence of a right to redistribute it.

Evidence:

```
"unlicensed third-party source is tracked: references/omniagent-runtime-&-workspace/.env.example, ... (47 files)". The introducing commit is 19dc2c8.
```

Resolution:

Resolved 2026-10-20 in commit 58de72f. The files were untracked with git rm --cached and remain on disk so the guard can still inspect them. references/ is deliberately still not gitignored, so the guard is not the only thing standing between the tree and a future careless add. The guard now passes 11 of 11.

Acceptance:

- [ ] The vendored tree is not tracked by Genesis or Aetherius-OS
- [ ] The files remain on disk and the guard can still inspect them
- [ ] references/ is still not gitignored

### ✅ TODO-LL-001 — Remove the baseUrl option that TypeScript 7 deleted

- **Project:** ledgerlands
- **Status:** DONE
- **Source:** build-audit — npm run typecheck, 2026-10-20

The installed TypeScript is 7.0.2, which removed the baseUrl compiler option outright. The shared base config still declares it, so every workspace package that extends it fails to typecheck before compiling a single file.

Evidence:

```
tsconfig.json(3,3): error TS5090: Non-relative paths are not allowed. Did you forget a leading './'?  /  tsconfig.json(3,3): error TS5102: Option 'baseUrl' has been removed. Please remove it from your configuration.
```

Resolution:

Resolved 2026-10-20. baseUrl was removed from the shared base config and the path aliases were rewritten as explicitly relative paths to the package sources, which is what TypeScript 7 requires.

Acceptance:

- [ ] npm run typecheck completes with no TS5090 or TS5102 diagnostics
- [ ] No tsconfig in the workspace sets baseUrl

### ✅ TODO-LL-002 — Give the LedgerLands packages a resolvable build order

- **Project:** ledgerlands
- **Status:** DONE
- **Source:** build-audit — tsconfig.base.json paths, 2026-10-20
- **Depends on:** TODO-LL-001

Package path aliases point at dist output that has never been produced, so there is no order in which the packages can compile against each other. TypeScript project references, or aliases that resolve to source, are needed to break the deadlock.

Evidence:

```
tsconfig.base.json maps @ledgerlands/shared-types to packages/shared-types/dist/index.d.ts; no dist directory exists under any package.
```

Resolution:

Resolved 2026-10-20 with TypeScript project references. Every package is composite, each declares its dependencies as references, a root solution tsconfig.json lists all eight projects, and the typecheck scripts use build mode so the compiler enforces the dependency order rather than it being a matter of luck. npx tsc -b, npm run typecheck, npm run build and npm test all now exit 0.

Acceptance:

- [ ] npm run build produces dist output for every package
- [ ] npm run typecheck passes with no missing-module diagnostics

### ✅ TODO-UB-001 — Discard the stale CMake caches in the Universal-Bridge build trees

- **Project:** universal-bridge
- **Status:** DONE
- **Source:** build-audit — cmake -S . -B build -G Ninja, 2026-10-20

The top-level build/ tree was generated when the repository lived at C:\Users\jpowe\Desktop\universal-bridge. The same directory also holds thirteen sibling build trees, each with its own cache, and any of them may carry the same problem.

Evidence:

```
CMake Error: the current CMakeCache.txt directory C:/Users/jpowe/Desktop/Projects/Universal-Bridge/build/CMakeCache.txt is different than the directory c:/Users/jpowe/Desktop/universal-bridge/build where CMakeCache.txt was created.
```

Resolution:

Resolved 2026-10-20. Eleven build trees held caches bound to the pre-move path and were cleared; the p0-verify tree was already correct and was left alone. The tree now configures, re-fetches zlib and nlohmann_json by their pinned hashes, links 41 of 41 targets, and passes all 11 CTest gates.

Acceptance:

- [ ] cmake -S . -B build -G Ninja configures without a path-mismatch error
- [ ] The full ctest suite passes, including the offline and Python gates

## P2 high

### ⬜ TODO-AOS-001 — Recover the P16 to P31 canonical phase names and requirements

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, MASTER PROGRAMME header

The master programme header records that P16 through P31 are reserved existing canonical phases requiring source recovery, and that the registry must be recovered from BUILD-TODO.md, docs, git history, milestones, handoffs and READMEs without renumbering. The recovery is a bounded documentation unit and must not preempt engineering.

Evidence:

```
"P16-P31-RECOVERY - PENDING (low): search BUILD-TODO.md, docs, .git history, milestones, handoffs, READMEs for exact P16..P31 names/requirements; record registry without renumbering."
```

Acceptance:

- [ ] Every P16 to P31 phase has a recorded name and requirement set
- [ ] No phase is renumbered during the recovery

### ⬜ TODO-AOS-002 — Complete the P12 application ecosystem integration

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, P12-APPLICATION-ECOSYSTEM

P12 is recorded as IN_PROGRESS with the football-card-game registered as a fourth canonical app. The remaining P12 work is to bring the other canonical applications onto the same shared-service endpoints.

Evidence:

```
"### P12-APPLICATION-ECOSYSTEM = IN_PROGRESS (first proof: football-card-game)"
```

Acceptance:

- [ ] Every canonical application is registered with the shared services
- [ ] The host test count grows with the coverage and stays green

### ⬜ TODO-AOS-004 — Complete the BRIDGE-GATE-COMPAT session-scoped grant work

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, CONTINUOUS BUILD STATE

The continuous build controller names the next executable todo as BRIDGE-GATE-COMPAT: design session-scoped workspace grants at session start under owner pre-authorisation, then update the failing runtime tests file by file, then re-measure the full suite.

Evidence:

```
"NEXT_EXECUTABLE_TODO = BRIDGE-GATE-COMPAT/1: design session-scoped workspace grants at session start (approval mode = owner pre-auth); then update failing runtime tests file-by-file; full-suite re-measure at end"
```

Acceptance:

- [ ] Session-scoped grants issue at session start under owner pre-auth
- [ ] The full runtime suite is re-measured and recorded

### ⬜ TODO-AOS-005 — Adopt the 42-category canonical gap register into the capability registry

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 5

The handoff carries a deduplicated 42-category register compiled from earlier G01-G28 and Genesis GT-01-GT-20 analyses, in seven groups: A architecture and ownership, B free models and providers, C cloud continuity and execution, D Genesis and the active hive, E language and interoperability, F automated setup and data protection, G proof and continuous quality. Forty-two new services must not be created from it. The old identifiers must be preserved and mapped rather than dropped, and every entry needs exact evidence, status, severity, owner, workaround, dependencies and test ids.

Evidence:

```
"This is the deduplicated register compiled in the chat from earlier G01-G28 and Genesis GT-01-GT-20 analyses. Do not create 42 new services. Preserve mappings from old identifiers and add exact evidence, status, severity, owner, workaround, dependencies and test IDs."
```

Acceptance:

- [ ] Every category is registered with its old-to-new mapping
- [ ] No category results in a new service without a reconciliation step

### ⬜ TODO-AOS-006 — Implement the twenty end-to-end acceptance tests AT-01 to AT-20

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 8

Twenty repeatable, evidence-producing acceptance tests, from Genesis Solo through to No-Aetherius-Dependency-on-Hermes. Each must record the test name, repository commit and version, exact environment, model and provider, timestamp, redacted input, expected, actual, artifact links, run id, pass or fail, cause and fix.

Evidence:

```
"Implement repeatable, evidence-producing tests. At minimum: AT-01 Genesis Solo ... AT-20 No-Aetherius-Dependency-on-Hermes. For each test, record: test name, repository commit/version, exact environment, model/provider, timestamp, input (redacted where necessary), expected, actual, artifact links, run ID, pass/fail, cause and fix."
```

Acceptance:

- [ ] Each acceptance test is implemented and produces its full evidence record
- [ ] A failing test is reported as failing, not explained away

### ⬜ TODO-AOS-007 — Prove that Genesis, IDE and Agent Bridge work without Hermes or OpenCode

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 8 AT-20

The first architectural principle of the handoff is that this is a first-party Aetherius platform project and not a Hermes product. Hermes and OpenCode are temporary bootstrap operators and may be clients of the infrastructure while they build Aetherius. Aetherius OS, Genesis, the first-party IDE, Agent Bridge and all current and future projects must remain able to use the infrastructure without Hermes or OpenCode.

Evidence:

```
"AT-20 No-Aetherius-Dependency-on-Hermes: Prove representative Genesis/IDE model/tool tasks work when Hermes and OpenCode are not running."
```

Acceptance:

- [ ] Representative Genesis and IDE model and tool tasks complete with both bootstrap operators stopped

### ⬜ TODO-AOS-008 — Apply the exact evidence vocabulary to every status claim

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 10

The handoff fixes an evidence vocabulary that must be used across the programme: PROPOSED, FOUND, IMPLEMENTED, TESTED, INTEGRATED, DEPLOYED, INDEPENDENTLY_VERIFIED, NOT_LOCATED, BLOCKED. A source or runtime that was not accessible must be classified NOT_LOCATED, never assumed not to exist. The ten-point output contract must also be honoured at each material milestone.

Evidence:

```
"Use an exact evidence vocabulary: PROPOSED, FOUND, IMPLEMENTED, TESTED, INTEGRATED, DEPLOYED, INDEPENDENTLY_VERIFIED, NOT_LOCATED, BLOCKED." and "Do not claim that something has been installed, deployed, integrated or verified unless it really has."
```

Acceptance:

- [ ] Status claims across the registries use only the approved vocabulary
- [ ] Nothing is recorded as deployed without a running instance

### ⬜ TODO-AOS-010 — Build the deny-by-default zero-spend admission policy

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 2A and gaps B01-B07

Default deny for unknown or paid endpoints, quota accounting and limit-aware admission control. If every eligible provider fails, tasks queue, pause or fail transparently rather than automatically calling a paid model. The hosted model catalogue is provisional and must be re-verified live rather than embedded as truth, and free consumer app usage is not a licence to proxy a commercial model as a general-purpose API.

Evidence:

```
"Default deny for unknown or paid endpoints, quota accounting and limit-aware admission control. If every eligible provider fails, queue/pause or fail transparently rather than automatically calling a paid model." and "Critical caution: The following names, promotional offers, limits and access methods came up in the 14 October 2026 conversation. None guarantees ongoing zero-cost entitlement."
```

Acceptance:

- [ ] A paid endpoint is refused by the router, not merely by convention
- [ ] Provider entitlements are re-verified live and carry an expiry

### ⬜ TODO-AOS-013 — Enforce one autonomous writer per canonical checkout

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — OpenCode-Multi-Agent-Setup-Prompt.txt section 11

Only one autonomous writer may work in a canonical checkout at a time. When a second writer is needed it must use a separate Git worktree or branch, be given a bounded task, run its tests there, return a diff and evidence, and be integrated by the supervisor. Current local Agent-Bridge and Genesis work must never be reset or overwritten to simplify auxiliary-agent setup.

Evidence:

```
"Only one autonomous writer per canonical checkout at a time. ... Never reset or overwrite current local Agent-Bridge/Genesis work just to simplify auxiliary-agent setup."
```

Acceptance:

- [ ] Concurrent writers are always on separate worktrees
- [ ] No local work has been reset to simplify an auxiliary setup

### ✅ TODO-APP-001 — Build the workspace application registry

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-decision — 2026-10-20: check the computer's apps, the Start menu, and the Programming & Code, CAD, Browsers and Audio Production folders

What is installed on the machine and what the owner has chosen to surface is now recorded, so the capability analysis is made against the real workstation rather than a guess. Two views are kept deliberately separate: the Start Menu shortcuts, which are what the owner actually launches, and the Windows uninstall registry, which is what is actually installed. A shortcut with no install record is a stale link; an install with no shortcut is something not yet surfaced.

Evidence:

```
159 shortcuts, 738 installed applications and 4 tool folders, recorded in docs/APPLICATION-REGISTRY.yaml. By category: 16 AI agents, 24 audio and music, 8 data and analytics, 7 IDEs and editors, 7 browsers, 3 CAD and manufacturing, 3 game engines, 2 model runtimes, 1 container runtime, 5 source control, 6 utilities and 77 other. The tool folders are Godot 4.7.2 Mono (programming), FreeCAD 1.0 and UltiMaker Cura 5.13 (CAD), five browsers, and a twenty-four entry audio production suite including Cubase 15, FL Studio 2026, HALion Sonic, Groove Agent SE 6 and KRISTAL.
```

Resolution:

Resolved 2026-10-20. Generated by tools/generate_application_registry.py.

Acceptance:

- [ ] Every installed application and surfaced shortcut is recorded with its category
- [ ] The tool folders are recorded with their contents

### ⬜ TODO-ARC-001 — Decide where the two gigabytes of research artefacts should live

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — git push origin master, 2026-10-20, HTTP 408

The Aetherius-OS repository was carrying about two gigabytes of research artefacts that had never been pushed: a 125M-parameter model's safetensors, its packed int2 and int4 forms, and the numpy pattern and residual arrays from the build84 and build85 research runs. The result was that no push of this repository could complete; the transfer was a two-gigabyte pack that timed out. The artefacts are now untracked and ignored, and the unpushed history was rewritten to drop them, which brought the push down to seventeen megabytes. But they still sit in the working tree, and a machine that needs them has to fetch or regenerate them.

Evidence:

```
"objects: 304 / total new bytes: 2,140,178,199" before the rewrite, and "objects: 271 / total new bytes: 18,123,765" after. The files remain on disk: 22 arrays under research/build84/storage and the model under research/lm-compression/gpt-neo-125M-fp32.
```

Acceptance:

- [ ] A place is chosen for the artefacts that is not the git repository
- [ ] A script can restore them from that place on a fresh machine

### ⬜ TODO-GAP-002 — Write the platform capability inventory the gap analysis compares against

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** gap-analysis — GAP-ANALYSIS-REGISTRY.yaml, platform_inventory

The gap registry names the platforms each capability was observed in, and the registry points at a platform capability inventory that does not exist yet. It has to be written from evidence rather than from general knowledge: the owner's own conversations, the Agent Bridge capability checklist, the handoff's provider catalogue and the predecessor build's task surface.

Evidence:

```
The gap registry records platform_inventory: "Aetherius-OS/research/platform-capability-inventory.md", which does not yet exist.
```

Acceptance:

- [ ] The inventory exists and every platform claim in the gap registry traces to it

### ⬜ TODO-KRN-005 — Generate language bindings from the syscall ABI

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — SYSCALL-ABI.md, Binding from other languages

The ABI is the thing that makes "other languages built with it" real. The C header is the contract; each language needs a binding that cannot drift from it. The bindings are generated from the header rather than hand-written, so a new syscall number reaches every language at once.

Evidence:

```
SYSCALL-ABI.md: "The requirement is only that it can express the register convention." and "A binding is four instructions".
```

Acceptance:

- [ ] A Rust, a TypeScript and a Python binding are generated from the same header
- [ ] A test proves the generated number table matches the header

### ⬜ TODO-KRN-006 — Add the C kernel host test suite to the Aetherius-OS build gate

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — native/kernel/build.ps1, 2026-10-20

The C kernel's host suite runs in under a second and covers the kernel's pure logic. It belongs in the Aetherius-OS verify command so that a change to the kernel cannot land without its tests running.

Evidence:

```
"126 checks, 0 failures" from native/kernel/build.ps1, run outside the Aetherius-OS gate.
```

Acceptance:

- [ ] npm run verify in Aetherius-OS runs the kernel host suite
- [ ] A kernel change that breaks the host suite fails the build

### ✅ TODO-REPO-001 — Build the GitHub repository registry as the reverse-engineering corpus

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-decision — 2026-10-20: here are my GitHub repos, please use them to help finish my projects

The account holds two kinds of repository doing different jobs. Own repositories are the upstream for the local projects, so a local project that has drifted from its remote is a finding. Forked repositories are the prior art: reference implementations of mechanisms somebody else built, kept locally to be read and compared against. The forks are what the reverse-engineering work reads from, and they are the reason there are hundreds of them.

Evidence:

```
600 repositories: 256 own and 344 forks, recorded in docs/REPO-REGISTRY.yaml with the capability axis each fork informs. By axis: 28 AI agents, 25 networking and security, 14 kernel and operating system, 11 simulation and science, 10 audio engines, 8 distributed systems, 7 build tooling, 7 data science, 7 observability, 4 desktop shell, 4 language parsing, 4 media pipeline, and 215 unclassified.
```

Resolution:

Resolved 2026-10-20. Generated by tools/generate_repo_registry.py.

Acceptance:

- [ ] Every repository is recorded with its kind, language and axis
- [ ] The own repositories name the local project each is upstream of

### ⬜ TODO-REPO-003 — Keep the local projects and their GitHub upstreams in step

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — 2026-10-20: you can now push and pull the data to and from GitHub

The push blocker recorded across the programme is gone and the remotes are reachable, but nothing yet keeps a local project and its upstream in step. The four Agent-Bridge trees and the two IDE-Workspace trees are separate branches of the same remote, so their divergence is invisible from the remote side. A registry that records the local commit, the remote commit and the divergence between them is the thing that would notice.

Evidence:

```
2026-10-20: Aetherius-OS was 1 ahead, Genesis 1 ahead, IDE-Workspace 1 ahead and Poietek 4 ahead. The Agent-Bridge and IDE-Workspace variant branches are on branches of the same remote and were not ahead of their own remotes.
```

Acceptance:

- [ ] Every local project records its upstream, its local commit and its divergence
- [ ] A check reports a project that has drifted

### ✅ TODO-SRC-001 — Build the machine-checked owner source registry

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-decision — 2026-10-20 instruction: all data should be added to the yaml file to check that everything is recorded

Every hand-authored document behind the programme is now recorded in docs/SOURCE-REGISTRY.yaml with a content digest, and a gate walks the declared scope on disk and fails when a document is unregistered, has gone missing, or has changed. The scope is declared explicitly, and tool installs, caches and downloaded third-party source trees are excluded because they are outputs of the programme rather than sources for it.

Evidence:

```
408 documents and 21,489,048 bytes across five scopes: documents-root 143, documents-master-prompt 25, documents-master-prompt-project 90, documents-opencde 127 and downloads 23. The coverage gate is src/programme/sourceRegistry.test.ts, 14 tests, all passing.
```

Resolution:

Resolved 2026-10-20. The registry is generated by tools/generate_source_registry.py and the disk walk by tools/scan_source_documents.py, which share one set of scope rules so they cannot drift apart.

Acceptance:

- [ ] Every document in the declared scope appears in the registry
- [ ] A document that appears, disappears or changes is a finding

### ⬜ TODO-SRC-003 — Read the master prompt corpus and fold the new material into the registries

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — Documents/master prompt, 2026-10-20

The master prompt folder holds 25 documents and the project folder holds 90 more, covering the Genesis digital organism, the nanobrain and virtual compute architecture, the Aetherius ecosystem handoffs, the engineering and manufacturing fabric, and the agent bridge material. Much of it is already implemented and the registries already record it. The work is to read it against the registries, confirm what is genuinely new, and record only what is not already captured.

Evidence:

```
"documents-master-prompt: 25" and "documents-master-prompt-project: 90" in docs/SOURCE-REGISTRY.yaml, including "GENESIS DIGITAL ORGANISM, NANOBRAIN & VIRTUAL COMPUTE ARCHITECTURE" (76,485 bytes), "GENESIS + AETHERIUS OS + AGENT BRIDGE + MAT" (38,187 bytes) and "AETHERIUS ECOSYSTEM - MASTER CONVERSATION HANDOFF" (53,619 bytes).
```

Acceptance:

- [ ] Every document in the master prompt corpus is checked against the registries
- [ ] Anything genuinely new is registered with its source, and anything already implemented is confirmed rather than re-added

### ⬜ TODO-AB-003 — Reconcile the 4,066 UNKNOWN requirements

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-report — Agent-Bridge/SUBTASK_G_FINAL_REPORT.md, NEXT

4,066 requirements were flagged as UNKNOWN and explicitly not treated as repository candidates. They need classification before any repository creation is derived from them.

Evidence:

```
"UNKNOWN requirements (4,066) flagged for UNKNOWN_REQUIREMENT_RECONCILIATION - NOT repo candidates" and "NEXT: UNKNOWN_REQUIREMENT_RECONCILIATION Priority: HIGH".
```

Acceptance:

- [ ] Every UNKNOWN requirement carries a classification
- [ ] No UNKNOWN requirement is silently used as a repository candidate

### ⬜ TODO-AB-004 — Record a concrete reuse decision for each PARTIAL_REUSE fork

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, T-PROV-1

For the sixty-three PARTIAL_REUSE forks, record what would be taken, what is LICENCE_INCOMPATIBLE and what is REDUNDANT. Accounted for is not the same as dispositioned with a decision.

Evidence:

```
T-PROV-1 "'accounted for' is not yet 'dispositioned with a decision'."
```

Acceptance:

- [ ] Each of the sixty-three forks carries a reuse decision

### ⬜ TODO-AB-005 — Establish one merge strategy for the four Agent-Bridge trees

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-audit — Projects folder survey, 2026-10-20

Four trees carry the same v0.8.1 codebase on divergent branches with no recorded merge strategy. A defect fixed in one may be unfixed in another, and nothing detects that.

Evidence:

```
Agent-Bridge (main), Agent-Bridge-cloudhybrid (unit/cloud-hybrid-runtime), Agent-Bridge-dashboard (unit/external-worker-telemetry), Agent-Bridge-runtimesafety (unit/runtime-safety-fixes) all report version 0.8.1.
```

Acceptance:

- [ ] A written strategy says which tree is canonical and how the others sync
- [ ] A check exists that reports divergence between the trees

### ⬜ TODO-ABD-001 — Build the supervisor UI avatar system, worker cards and team room

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, G1/G4 and T-UI-1

Workers are rows rather than team members. A deterministic offline avatar generator, a WorkerCard component and a TeamRoom view are required. Where no real endpoint exists behind a worker action, the honest NOT_IMPLEMENTED or DEFERRED_INTERFACE state must be emitted rather than a fake success.

Evidence:

```
GAP LIST G1 "NO AVATAR SYSTEM - workers are rows, not team members" and G4 "NO TEAM ROOM"; SCORECARD rates avatar integration 1 of 5.
```

Acceptance:

- [ ] The three real workers render with avatars in LIVE mode
- [ ] Every worker action is wired to a real endpoint or reports an honest state
- [ ] At least twelve new tests pass and the existing ninety-seven still pass
- [ ] The visual scorecard is re-run and recorded

### ⬜ TODO-ABD-002 — Build the supervisor navigation shell and mission control home

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, G2/G3 and T-UI-2

A persistent navigation shell over the seventeen documented areas, a mission control home with the seventeen owner-overview tiles, the supervisor health bar, and a LIVE to DESIGN switch with unmistakable demo labelling. Every tile must be a live-verified fact or an honest NOT_EXPOSED, never a zero derived from nothing.

Evidence:

```
GAP LIST G2 "NO NAVIGATION SHELL" and G3 "NO MISSION CONTROL HOME"; navigation is scored 1 of 5.
```

Acceptance:

- [ ] The navigation shell lists every documented area with active state
- [ ] Every mission control tile is a live fact or an honest NOT_EXPOSED
- [ ] The LIVE to DESIGN switch is unmistakable

### ⬜ TODO-ABD-003 — Prove theme coverage for the new supervisor components

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, G12

Theme coverage for ABYSS, AURORA, EMBER, GRAPHITE and FROST is unproven on the new components. No raw colours are permitted; tokens are the only source.

Evidence:

```
GAP LIST G12 "THEME COVERAGE UNPROVEN for ABYSS/AURORA/EMBER/GRAPHITE/ FROST on the new components."
```

Acceptance:

- [ ] Every new component renders correctly in all five themes
- [ ] A token check proves no raw colour reaches a component

### ⬜ TODO-ABD-004 — Produce the supervisor reuse architecture decision record

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, T-ARCH-1

The conference grid, messaging and IDE surface must be one component family with the avatar system rather than three one-offs. A short ADR covering the component tree, state ownership and which seams are DEFERRED_INTERFACE has to exist before the next increment starts.

Evidence:

```
T-ARCH-1 "Deliver a short ADR in docs/ ... BEFORE OpenCode starts M2-C."
```

Acceptance:

- [ ] An ADR exists in docs/ and names the component tree and state ownership
- [ ] The deferred interfaces are named explicitly

### ⬜ TODO-ABD-005 — Script the visual QA harness instead of scoring by eye

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, T-QA-1

The scorecard must be run against the live UI by script - render, screenshot, DOM assertions on avatar presence, navigation landmarks and contrast - so that every future increment is scored automatically.

Evidence:

```
T-QA-1 "so every future increment is scored automatically rather than by eye."
```

Acceptance:

- [ ] A script produces the scorecard from a running UI
- [ ] The scorecard is recorded as part of the verification run

### ⬜ TODO-ABD-006 — Raise WORKER_IDLE_REVIEW for a nominally running but idle worker

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** gap-list — docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md, T-DEV-1

A worker nominally RUNNING with no new session advance, file write or commit for N cycles must raise WORKER_IDLE_REVIEW rather than stay silent. This is the root cause of SUPERVISOR_MISSED_IDLE_EVENT.

Evidence:

```
T-DEV-1 "Root cause of SUPERVISOR_MISSED_IDLE_EVENT."
```

Acceptance:

- [ ] A worker idle across N cycles raises WORKER_IDLE_REVIEW
- [ ] The event is covered by a test

### ⬜ TODO-GEN-003 — Implement the missing Genesis plan and action stages

- **Project:** genesis
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, P4-MENTAL

The organism loop has nine stages wired and two missing. The plan stage is blocked on an action catalog and an actuator repertoire, which is a genuine architecture decision. The action stage is missing by design because there is no actuator.

Evidence:

```
"Missing set now exactly 2 _na: plan (BLOCKED: needs action catalog/actuator repertoire - genuine architecture decision), action (missing by design: no actuator)."
```

Acceptance:

- [ ] An action catalog and actuator repertoire are decided and recorded
- [ ] The plan stage is wired with a real test

### ⬜ TODO-GEN-004 — Close the remaining Genesis V0 directive gaps

- **Project:** genesis
- **Status:** OPEN
- **Source:** gap-analysis — Genesis/GENESIS_V0_GAP_ANALYSIS.md, sections 7-31

The V0 gap analysis records these as MISSING or NOT_STARTED: neural timing and oscillation, glia and non-neuronal support, the virtual nanomachine and digital immune layer, resource tiers, partitioned compute, binary/ternary/quantum support, the time-crystal module, the smart compute mesh, the default computer specification, configuration templates, state migration, the avatar-first user interface, safety and failure domains, the required testing set, and the required documentation.

Evidence:

```
GENESIS_V0_GAP_ANALYSIS.md gap table marks sections 7, 8, 10, 16, 17, 18, 19, 20, 21, 22, 23, 25, 28, 29 and 31 as MISSING.
```

Acceptance:

- [ ] Each recorded gap is either implemented and tested, or explicitly re-scoped with a reason

### ⬜ TODO-HERM-001 — Fix the Hermes model and provider routing mismatch

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 1

The Hermes configuration is materially inconsistent. model.default is poolside/laguna-s-2.1:free while model.provider is nous and model.base_url points at the Nous inference endpoint. Old fallback and routing rules and update lock files are also present. This mismatch is a plausible explanation for Hermes selecting an unusable agent, but it was never fixed or validated, so it stays a hypothesis.

Evidence:

```
"The existing Hermes configuration was materially inconsistent: model.default was poolside/laguna-s-2.1:free, while model.provider and model.base_url pointed to the Nous inference endpoint ... This mismatch is a plausible explanation for Hermes selecting or switching to an unusable agent, but it was not fixed or validated."
```

Acceptance:

- [ ] The default model and the provider route resolve to one reachable model
- [ ] A read-only smoke test confirms the active profile answers

### ⬜ TODO-HERM-002 — Build and verify the DPAPI-protected provider key store

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 2

A key-entry GUI script was written to save provider keys as DPAPI-protected values at %LOCALAPPDATA%\AI-Agent-Setup\provider-keys.dpapi.json, but verification reported "No provider keys saved yet" and the file was absent. A rebuilt implementation must confirm the file exists, contains only encrypted values, has restricted ACLs, and is actually consumed by the target application, without ever printing a secret.

Evidence:

```
"The rollout created a GUI script using icacls.exe and DPAPI but did not verify its secure file permissions, successful save, or integration with Hermes/OpenCode. A future implementation must validate the file exists, contains only encrypted values, has restricted ACLs, and is actually consumed by the target application without printing secrets."
```

Acceptance:

- [ ] The DPAPI file exists, contains only encrypted values and has restricted ACLs
- [ ] The target application consumes it and no secret is ever printed

### ⬜ TODO-HERM-003 — Complete the OpenCode V2 fresh install with worker subagents

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 2

The main requested deliverable was not completed. No OpenCode reset, Hermes reset, worker configuration, agent smoke test, paid-provider gating or shortcut was verified. A free-provider policy needs more than an allowlist: free model IDs, empty paid credentials and payment methods, provider allowlists, and request price ceilings where supported.

Evidence:

```
"No OpenCode reset, Hermes reset, worker configuration, agent testing, paid-provider gating, Start-menu shortcut, or requested folder shortcut was completed." and "A free-provider policy needs multiple controls: free model IDs, empty paid credentials/payment methods, provider allowlists, and where supported, request price ceilings."
```

Acceptance:

- [ ] opencode --version and opencode debug paths report a clean resolved state
- [ ] The build and plan agents answer a no-tool smoke test
- [ ] A worker subagent answers a delegation smoke test
- [ ] A paid model is refused by the provider gate

### ⬜ TODO-HERM-005 — Inspect the AetheriusSupervisorRuntime startup shortcut for interference

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 2

A startup shortcut at C:\Users\jpowe\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\AetheriusSupervisorRuntime.lnk targets C:\Users\jpowe\Desktop\Projects\Agent-Bridge-dashboard\supervisor_runtime.cmd. It may rewrite or interfere with agent configuration. It was only discovered, never proven to be the cause and never disabled. It must be inspected before any setup is called fresh.

Evidence:

```
"The existing startup shortcut ... targets C:\Users\jpowe\Desktop\Projects\Agent-Bridge-dashboard\supervisor_runtime.cmd; this may rewrite or interfere with agent configuration. It was only discovered, not proven to be the cause or disabled. Inspect its behavior before calling the setup 'fresh.'"
```

Acceptance:

- [ ] The shortcut's effect on agent configuration is known and recorded
- [ ] It is either disabled or proven harmless

### ⬜ TODO-LL-003 — Complete the LedgerLands LL-P2 persistent authoritative runtime

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-todo — crypto-property-game-mvp/BUILD-TODO.md, LL-P2

The active phase. Replace the in-memory MatchStore with a PostgreSQL repository, persist every match event transactionally, rebuild match state deterministically from the event log, add optimistic revision and concurrency protection, add idempotency keys for commands, add reconnect and resume tokens with state snapshots, add match timeouts and surrender rules, and add persistence integration tests.

Evidence:

```
"CURRENT_ACTIVE_PHASE = LL-P2-PERSISTENCE (PostgreSQL event-sourced MatchStore)" with eight unchecked items under LL-P2.
```

Acceptance:

- [ ] Match state is rebuilt deterministically from the event log
- [ ] Persistence integration tests pass
- [ ] npm run verify passes

### ⬜ TODO-LL-004 — Complete the LedgerLands LL-P3 property-trading rules

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-todo — crypto-property-game-mvp/BUILD-TODO.md, LL-P3

Twelve rule areas remain: the auction state machine for declined and unowned properties, mortgage and unmortgage rules, player-to-player trade offers with counter, accept and reject, property-group ownership validation, even-building and development rules where configured, house and hotel inventory with configurable development limits, liquidation before bankruptcy, creditor-aware bankruptcy settlement, data-driven event-card decks, transit and service ownership-scaled rent, ruleset versioning with signed board and rules configuration, and extensive deterministic simulation, fuzz and property tests.

Evidence:

```
BUILD-TODO.md LL-P3 lists twelve unchecked items.
```

Acceptance:

- [ ] Every LL-P3 rule is implemented and covered by a deterministic test

### ⬜ TODO-LL-005 — Decide which LedgerLands tree is authoritative

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-audit — LedgerLands folder survey, 2026-10-20

Three related trees are present - crypto-property-game-mvp, LedgerLands-Aetherius-App-Repo and LedgerLands-source - plus a .zip and a .bundle of the MVP, with no statement of which is authoritative.

Evidence:

```
Folder root listing: crypto-property-game-mvp/, LedgerLands-Aetherius-App-Repo/, LedgerLands-source/, crypto-property-game-mvp.zip (190 KB), LedgerLands.bundle (36 KB).
```

Acceptance:

- [ ] One tree is named authoritative in the build manifest
- [ ] The others are marked as derived or archived

### ⬜ TODO-MAT-004 — Fix the Studio publication data route

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-09-08 mat_ebookcraft, Task 3

The Studio E2E suite fails with "Server returned a page instead of publication data. Rebuild Studio." The Studio dev server has publicDir set to ../book while the publication data lives under the root data/ directory, so a request for /data/publication/generated/*.json returns HTML. This is a routing and content-type fault, not a selector fault, and the selectors must not be changed to work around it.

Evidence:

```
"E2E symptom: expect(locator('#manuscript')).toBeVisible() fails ... inspect URL, response content type, and /data/publication/generated/*.json routing before changing selectors. studio/vite.config.ts has publicDir at ../book while publication data is under root data/"
```

Acceptance:

- [ ] The publication JSON route returns JSON in dev and preview
- [ ] The Studio E2E manuscript assertions pass

### ⬜ TODO-MAT-005 — Widen the MAT record schema to accept MAT:0100 to MAT:0118

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 2 failures

The record schema rejects every element identifier from MAT:0100 upwards because its regular expression only accepts through MAT:0099. Eighteen of the one hundred and eighteen elements are therefore ungeneratable, which also means the 143-section master update can never be fully validated.

Evidence:

```
"data/schema/1.0.0/mat-record.schema.json rejected MAT:0100-MAT:0118 because its regex accepted only through MAT:0099 -> widen the schema and run npm run validate:records after generation."
```

Acceptance:

- [ ] npm run validate:records accepts MAT:0100 through MAT:0118
- [ ] Generated front matter includes record_name, record_class and status

### ⬜ TODO-MAT-007 — Work the 143 owner-requirement-review and 13 reference-image-review items

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 11

MAT-TODO.json holds 143 OWNER-REQUIREMENT-REVIEW items and 13 REFERENCE-IMAGE-REVIEW items open, and the intake manifest records all 143 numbered sections across 4,878 lines. The 16-panel dashboard image is layout and reference input only and earns no automatic completion credit; the two original image sets of nine and thirteen standalone images per element are the actual assets.

Evidence:

```
"MAT-TODO.json keeps 143 OWNER-REQUIREMENT-REVIEW and 13 REFERENCE-IMAGE-REVIEW items open." and "The user requires both original image sets, 9 + 13 = 22 standalone images per element -> a 16-panel dashboard is layout/reference input only."
```

Acceptance:

- [ ] Every open review item is resolved or explicitly deferred with a reason
- [ ] The dashboard is not treated as scientific truth

### ⬜ TODO-MAT-008 — Capture the MAT terminal build, validation and browser results

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 14

The last run recorded 115 passing tests and a completed audit refresh, but the terminal result of npm run validate and npm run build:studio was never captured, and the browser checks were not run. A partial log does not prove the remaining gates.

Evidence:

```
"The latest run recorded npm test 115 passing tests and a completed audit refresh, but npm run validate and npm run build:studio lacked a captured terminal result. Resume by checking .mat-local/master-update-validation.log and .mat-local/master-update-build.log, then run missing browser checks and git diff --cached --check before committing."
```

Acceptance:

- [ ] npm run validate, npm run build:studio and the browser suite all have captured terminal results

## P3 medium

### ⬜ TODO-AOS-009 — Define the first-party versioned semantic message contract

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 2E and gap E01

A first-party, versioned and inspectable semantic message contract expressing sender and receiver and team, task and parent ids, intent, objective, hypotheses, evidence references, assertions with confidence, dependencies, permissions, status, requested actions, timestamps, causal trace and schema version. Strong typed representation for low-overhead processing, with A2A for external task interoperability, MCP for tools and resources, and HTTP, WebSocket or gRPC as network transports. Agent Bridge enforces identity and authorization.

Evidence:

```
"E01 [P0] No verified canonical typed semantic contract -> schema with tasks/evidence/intent/permissions/provenance." and "Create a first-party, versioned and inspectable semantic message contract."
```

Acceptance:

- [ ] A versioned schema exists and validates real agent traffic
- [ ] The contract translates to a human-readable, replayable record

### ⬜ TODO-AOS-011 — Prove real remote execution with the PC powered off

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 2D and AT-05

A real remote job must progress while the Windows PC is shut down, with evidence from remote provider logs and events rather than self-report. The control plane, execution plane and data plane must be separable, and resume must survive browser disconnection, local power off and recoverable worker failure. Provisioning external accounts and infrastructure is an owner approval gate.

Evidence:

```
"AT-05 PC-Off Cloud: A real remote job progresses while Windows PC is shut down; evidence from remote provider logs/events, not self-report." and "Phase 4 - Real remote worker: With explicit approval/account access, deploy one true independent cloud worker or external cloud coding agent."
```

Acceptance:

- [ ] A job demonstrably progresses with the machine powered off
- [ ] The evidence is remote provider logs, not agent self-report

### ⬜ TODO-AOS-012 — Classify every workstation tool with its health and next action

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — OpenCode-Multi-Agent-Setup-Prompt.txt section 14

Each tool on the workstation is to be classified INSTALLED, HEALTHY, LOGIN_REQUIRED, UPDATE_DEFERRED, BROKEN, OPTIONAL or NOT_NEEDED, and for each tool the exact version, command and path, provider and login status, role in the architecture, write permissions, project scope, integration method, health check and next action are to be captured in a durable report under the existing documentation area, not a new top-level architecture.

Evidence:

```
"Create/update a durable local report under the existing documentation area, not a new top-level architecture. Classify each tool: INSTALLED / HEALTHY / LOGIN_REQUIRED / UPDATE_DEFERRED / BROKEN / OPTIONAL / NOT_NEEDED."
```

Acceptance:

- [ ] Every tool in the audited set has a classification and a next action
- [ ] The report lives under the existing documentation area

### ⬜ TODO-AOS-014 — Record the AT-19 replay and observability link for every tool call

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** handoff — AETHERIUS_GENESIS_AI_CLOUD_MASTER_HANDOFF.txt section 8 AT-19

Every actual tool call has to tie to an agent id, a task id, a model id, an outcome, a trace and its artifacts. This is the observability requirement that makes the hive auditable and that the supervisor UI live-versus-design separation depends on.

Evidence:

```
"AT-19 Replay and Observability: Every actual tool call ties to agent ID, task ID, model ID, outcome, trace and artifacts."
```

Acceptance:

- [ ] A tool call can be replayed from its recorded identity and outcome

### ⬜ TODO-GAP-003 — Register the gap analysis in the Aetherius capability registry

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml

The gap analysis is a separate registry from the system capability registry. The two have to be reconciled so that a capability is not simultaneously claimed by one and denied by the other, and so that the roll-up numbers in the programme report are not two different answers to the same question.

Evidence:

```
The capability registry and the gap registry both describe Genesis, from different angles: capability by capability, and requirement by requirement.
```

Acceptance:

- [ ] Every gap maps to a capability node or is recorded as genuinely outside the registry
- [ ] A test proves the two registries do not contradict each other

### ⬜ TODO-KRN-004 — Retire the Rust native layer once the C kernel is proven

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — ADR-001-KERNEL-IN-C.md, Decision point 4
- **Depends on:** TODO-KRN-003

The Rust native layer stays until the C kernel proves equivalent. It is not deleted on the strength of the decision alone. Once the C kernel has booted and produced the same markers, the Rust layer moves to the archive and its build stops being a gate.

Evidence:

```
"The Rust native layer is retained until the C kernel proves equivalent, then retired. It is not deleted on the strength of this decision."
```

Acceptance:

- [ ] The Rust native layer is archived, not deleted
- [ ] The C kernel is the only native build in the tree

### ⬜ TODO-LEG-001 — Reconcile the predecessor Aetherius task surface into the current registry

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** legacy-reconciliation — Temp/Repository-Reconciliation/aetherial-platform/docs/root/todo.md

The predecessor Aetherius build left 3,238 open items across 254 sections in a single todo document, with only 77 marked done, and it exists in three near-identical copies under Temp. The Aetherius-OS legacy intake carries a further 177 open items in its build checklist. These are the earlier failed builds and their task surfaces are real work that was never finished. They must be reconciled into the current registry rather than left in Temp, and the near-duplicate copies must be identified so the work is counted once.

Evidence:

```
"aetherial-platform todo.md: open=3238 done=77 total=4972" and "Aetherius-OS legacy BUILD_CHECKLIST.md: open=177 done=25 total=304". The same 3,315-checkbox todo.md appears at Temp/Repository-Reconciliation/aetherial-platform/docs/root/todo.md and twice under Temp/Desktop-Duplicate-Reconciliation.
```

Acceptance:

- [ ] Every distinct predecessor item is either reconciled into a current requirement or explicitly retired
- [ ] Duplicate copies are counted once

### ⬜ TODO-REA-006 — Recover the ChatGPT conversation corpus into the research registry

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** conversation-history — research/codex-history and the ChatGPT web session

The Codex conversation store has been extracted to Aetherius-OS/research/codex-history, giving 71 threads, per-thread JSONL and a digest. The ChatGPT web session adds conversations that are not in the local store, including the scoped specifications for the empty project folders and the pinned design threads. The conversations are untrusted content: another author's text, not owner instruction, and not scientific or legal evidence.

Evidence:

```
"71 threads (13 root conversations, 58 subagent threads)" and "2,118,800,154 total tokens recorded" in research/codex-history.
```

Acceptance:

- [ ] The conversation corpus is stored with provenance and an untrusted marker
- [ ] Findings that map to a project are registered against that project

### ⬜ TODO-REPO-002 — Classify the 215 unclassified forks

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — docs/REPO-REGISTRY.yaml, forks_by_axis, 2026-10-20

Two hundred and fifteen of the three hundred and forty-four forks do not match any capability axis. Each is reference material nobody has decided what it is for, which is the same problem as an unclassified requirement: it looks like work and is really just clutter until somebody says what it is for or discards it.

Evidence:

```
"unclassified: 215" in docs/REPO-REGISTRY.yaml.
```

Acceptance:

- [ ] Every fork names the capability axis it informs, or is marked as deliberately unclassified
- [ ] No fork is left in a limbo where it is neither used nor discarded

### ⬜ TODO-SRC-002 — Map every source document to the work it produced

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-decision — 2026-10-20 instruction: keep track of every and anything

The source registry proves that every document is recorded. It does not yet record what each document produced, so the chain from an owner's prompt to a requirement, a capability, a gap or a completed task is not traversable. The registry needs a link field per document, and the requirement registry needs the reverse link.

Evidence:

```
The registry carries path, scope, kind, title, bytes, lines, modified date and digest. It carries no reference to the requirements, capabilities, gaps or todos derived from it.
```

Acceptance:

- [ ] Every document names the requirements, capabilities and todos it produced
- [ ] A reader can go from a requirement back to the document it came from

### ✅ TODO-WS-002 — Move the two stray root documents into the project that owns them

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** build-audit — npm test, 2026-10-20
- **Depends on:** TODO-WS-001

Two documents sat at the Projects root instead of inside a project. The hygiene guard classifies anything at the root that is not a project folder or the user tool configuration as a stray, and the rule exists because generated reports have previously accumulated there and been mistaken for project content.

Evidence:

```
HERMES_MODEL_PROVIDER_ENVIRONMENT_GATE_2026-10-07.md and inventory_output.txt at C:\Users\jpowe\Desktop\Projects.
```

Resolution:

Resolved 2026-10-20. The gate document moved to Hermes-Config-Audit, which owns the Hermes configuration audit, and the BUILD86-R7B inventory moved to Aetherius-OS, which is the project it inventoried. The Projects root now holds only project folders, Temp and opencode.json.

Acceptance:

- [ ] The Projects root holds only project folders, Temp and opencode.json
- [ ] docs/workspace-hygiene.test.ts passes

### ⬜ TODO-WS-003 — Decide the fate of the four reserved but empty project folders

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** build-audit — Projects folder survey, 2026-10-20

Athena, Architecture of Shadows Book, Decentralized Messaging App and Food Wiki App hold no content. Each is now registered with a build manifest that records the emptiness honestly, but an empty folder with no recorded scope is not a project. Each needs either a stated scope or a decision to remove it.

Evidence:

```
Folder survey: Athena, Architecture of Shadows Book and Decentralized Messaging App report 0 items; Food Wiki App reports 1 empty directory.
```

Acceptance:

- [ ] Each folder has a recorded scope or is removed from the registry

### ⬜ TODO-AB-001 — Make the Agent-Bridge full-suite gate fit inside a practical window

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-audit — Agent-Bridge pyproject.toml, 2026-10-20

The full suite copies the repository 23 times and runs 6 test files per copy at about 85 seconds each, so the complete gate takes roughly 35 to 40 minutes. The slow marker makes the cost visible, and the 2026-10-20 run of the fast path did not complete inside 15 minutes either, so the cost applies to both paths.

Evidence:

```
Measured per file on 2026-10-20: test_actions_intake_mutations.py, test_approved_grant_mutations.py, test_blender_adapter.py, test_browser.py and test_collision_oracle.py each exceeded a 45 second per-file budget, and test_actions_intake.py takes 34.3s on its own. The remaining files run in 1 to 13 seconds. A 20-file subset did not complete within 15 minutes and the full suite did not complete within 30 minutes. Only test_actions_intake_mutations.py carries the slow marker, so the other four external-process files are unannounced, and deselecting the marker does not avoid them.
```

Acceptance:

- [ ] The fast gate completes in a bounded and recorded time
- [ ] The full gate is scheduled or otherwise bounded

### ⬜ TODO-AB-002 — Move the one-off Agent-Bridge analysis scripts off the repository root

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-audit — Agent-Bridge root listing, 2026-10-20

Around sixty analysis and classification scripts sit at the repository root. Many read machine-specific absolute paths and are not covered by the test suite, so they are neither library code nor verified tooling.

Evidence:

```
analyze_repos.py reads E:\OpenCode-Data\Repository-Governance\github_repos.txt by absolute path; classify_gaps_comprehensive.py requires AGENT_BRIDGE_REQUIREMENTS_SRC and AGENT_BRIDGE_INVENTORY_JSON environment variables. Files include analyze_repos_v2/v3/v4.py, compare_true_gaps.py, pass2_context_enrichment.py, probe_dat_json.py and many more.
```

Acceptance:

- [ ] Every script lives under a tools/ or scripts/ directory
- [ ] No script reads a hard-coded machine-specific path

### ⬜ TODO-AB-006 — Record the bridge gate compat session-scoped grant design

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, BRIDGE-GATE-COMPAT

Session-scoped workspace grants are to be designed at session start under owner pre-authorisation, and the failing runtime tests updated file by file afterwards.

Evidence:

```
"CURRENT_ACTIVE_TODO = BRIDGE-HANG verdict recorded; NEXT = BRIDGE-GATE-COMPAT (session-scoped grants + test updates, landed together)"
```

Acceptance:

- [ ] The design is recorded and the tests are updated in the same landing

### ⬜ TODO-AB-007 — Reduce the Agent-Bridge full-suite verification cost

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-todo — Agent-Bridge/pyproject.toml, pytest markers

The full suite copies the repository 23 times and runs 6 test files per copy at about 85s each, so it takes roughly 35-40 minutes on this host. The slow marker makes the cost visible, but the cost itself is the problem.

Evidence:

```
pyproject.toml: "It copies the repository 23 times and runs 6 test files per copy (~85s each), so it takes roughly 35-40 minutes on this host."
```

Acceptance:

- [ ] The full gate runs materially faster, or its cost is bounded and scheduled

### ⬜ TODO-ABCH-001 — Record the cloud-hybrid dependency resolution

- **Project:** agent-bridge-cloudhybrid
- **Status:** OPEN
- **Source:** build-audit — git status, 2026-10-20

A uv.lock is present but untracked, so the dependency resolution this branch was developed against is not recorded.

Evidence:

```
git status --porcelain -> "?? uv.lock"
```

Acceptance:

- [ ] The lock file is tracked, or the branch's resolution is recorded another way

### ⬜ TODO-ABCH-002 — Decide whether the cloud-hybrid audit becomes a working runtime

- **Project:** agent-bridge-cloudhybrid
- **Status:** OPEN
- **Source:** build-audit — git log -1, 2026-10-20

The branch head is a documentation commit recording a local, cloud and hybrid runtime readiness audit, not a working runtime. The branch has also diverged from main with no recorded reconciliation.

Evidence:

```
HEAD commit subject is "docs: Genesis Local/Cloud/Hybrid runtime readiness audit (reconciliation unit)".
```

Acceptance:

- [ ] The branch either lands as a runtime or is recorded as audit-only

### ⬜ TODO-ABRS-001 — Reconcile the runtime safety fixes back to the parent project

- **Project:** agent-bridge-runtimesafety
- **Status:** OPEN
- **Source:** build-audit — git log -1, 2026-10-20

The runtime safety fixes on this branch are not reconciled with the parent project, so the same defect may be fixed in one tree and not the other.

Evidence:

```
The branch head is a documentation commit; the fix commits preceding it are not present on the parent main branch.
```

Acceptance:

- [ ] Each fix is either present on the parent project or recorded as branch-only

### ⬜ TODO-ABRS-002 — Move the cloud/hybrid remaining states into a shared register

- **Project:** agent-bridge-runtimesafety
- **Status:** OPEN
- **Source:** build-audit — git log -1, 2026-10-20

The cloud and hybrid audit is recorded as resolved into fixed and remaining states, but the remaining states are tracked only in a branch-local document.

Evidence:

```
HEAD commit subject is "docs: Cloud/Hybrid audit RESOLUTION - fixed vs remaining states".
```

Acceptance:

- [ ] The remaining states are visible from the parent project

### ⬜ TODO-AOSB-001 — Record the scope of the Architecture of Shadows book project

- **Project:** architecture-of-shadows-book
- **Status:** OPEN
- **Source:** build-audit — Architecture of Shadows Book folder survey, 2026-10-20

The project has no recorded scope, no outline, no format decision and no authoring pipeline of its own. The recovered conversation gives the chapter structure and image batches, and the MAT publication toolchain supplies the build, so the manifest needs to state which of those it uses.

Evidence:

```
Architecture of Shadows Book -> 0 items total.
```

Acceptance:

- [ ] The project manifest states the scope, the chapter structure and the authoring pipeline

### ⬜ TODO-AOSB-002 — Recover the Architecture of Shadows book structure and image batches

- **Project:** architecture-of-shadows-book
- **Status:** OPEN
- **Source:** conversation-history — chatgpt conversation /c/6a415e55-8ba4-83eb-b67a-c96004d46dcf

The Architecture of Shadows conversation is an illustrated book delivered as numbered image batches. Batch 3 was split into ten individual PNG files with a manifest of filename, byte size and sha256 prefix, plus the original contact sheet for reference, and zipped. The batch naming pattern is batch_N_<number>_<slug>.png, and the user asked explicitly for individual images rather than contact sheets. The chapter range visible in Batch 3 runs 21 to 30, ending at "30_checkmate", so the book is at least thirty chapters long.

Evidence:

```
"For the next batch, I'll continue with single image files only, not collage sheets." and the Batch 3 manifest listing chapters 21_the_pyramid_of_power through 30_checkmate.
```

Acceptance:

- [ ] The full chapter list and the image batch inventory are recovered
- [ ] The MAT publication toolchain is used rather than a new book pipeline

### ⬜ TODO-ATH-001 — Record the scope of the Athena project

- **Project:** athena
- **Status:** OPEN
- **Source:** build-audit — Athena folder survey, 2026-10-20

The project has no recorded scope of its own, so the folder can only be classified, not worked. The scope recovered from the ChatGPT project is the candidate, and the manifest needs to state it.

Evidence:

```
Athena -> 0 items total.
```

Acceptance:

- [ ] The project manifest states what Athena is and what its first vertical slice is

### ⬜ TODO-ATH-002 — Recover the Athena project requirements from its ChatGPT project

- **Project:** athena
- **Status:** OPEN
- **Source:** conversation-history — chatgpt project 'Athena' -> conversation 'Athena Project Requirements'

A ChatGPT project named Athena exists and contains a conversation titled "Athena Project Requirements", alongside other conversations such as "Calisthenics explanation". The local Athena folder is empty, so the requirements held in that conversation are the only recorded scope for the project. The Agent-Bridge governance records also list ATHEENA as a canonical repository name.

Evidence:

```
"Projects ... Athena ... Athena Project Requirements" observed in the ChatGPT project sidebar, against a local Athena folder with zero items.
```

Acceptance:

- [ ] The Athena requirements are recovered and recorded in the project
- [ ] The recovered scope is attributed to its source

### ⬜ TODO-DMA-001 — Record the scope of the decentralised messaging application

- **Project:** decentralized-messaging-app
- **Status:** OPEN
- **Source:** build-audit — Decentralized Messaging App folder survey, 2026-10-20

The project has no recorded scope, no transport decision and no threat model. A decentralised messaging application carries real security and privacy obligations, so an empty folder is a risk if it is mistaken for progress.

Evidence:

```
Decentralized Messaging App -> 0 items total.
```

Acceptance:

- [ ] The project manifest states the scope and the transport decision
- [ ] A threat model exists before any transport is implemented

### ⬜ TODO-FWA-001 — Record the scope of the Food Wiki project

- **Project:** food-wiki-app
- **Status:** OPEN
- **Source:** build-audit — Food Wiki App folder survey, 2026-10-20

The project has no recorded scope of its own. The scope now recovered from the ChatGPT conversations is recorded separately, so the project needs a manifest that states what it is and what its first vertical slice is.

Evidence:

```
Food Wiki App -> 1 item: "AI System Desisgn for FaturaWiki" (empty).
```

Acceptance:

- [ ] The project manifest states the scope and a first vertical slice

### ⬜ TODO-FWA-002 — Correct the misspelled FaturaWiki design directory

- **Project:** food-wiki-app
- **Status:** OPEN
- **Source:** build-audit — Food Wiki App folder survey, 2026-10-20

The only artefact in the project is a directory named "AI System Desisgn for FaturaWiki". Correcting it now costs one rename, before any content lands in it.

Evidence:

```
Directory name is "AI System Desisgn for FaturaWiki".
```

Acceptance:

- [ ] The directory name is spelled correctly

### ⬜ TODO-FWA-003 — Implement the NaturaWiki food and health application specification

- **Project:** food-wiki-app
- **Status:** OPEN
- **Source:** conversation-history — chatgpt conversations /c/6970c854... (design) and /c/696e0993... (plan)

The scope for this empty project is fully specified in two ChatGPT conversations. NaturaWiki is a cross-platform offline-first food and health intelligence app: one locally owned AI brain made of an Ollama LLM (Qwen 2.5 1.5B instruct Q4 primary, Mistral fallback), a deterministic rules and constraints layer for allergy warnings and medical flags, a RAG layer over SQLite plus a vector index, and pluggable vision and speech. Tauri desktop plus a PWA mobile companion, SQLite and ChromaDB with all-MiniLM-L6-v2 embeddings, ZXing barcode scanning throttled to one frame per second with no AI in the scan path, and vision deferred to an optional cloud worker so mobile cameras do not crash. It must never diagnose, must warn on allergens, must log explainable decisions, and must be auditable.

Evidence:

```
"Aetherius/genesis design: AI SYSTEM (Owned) LLM + LRM + RAG + Vision + Speech ... The build plan: Tauri + Web App, ChromaDB, qwen2.5:1.5b- instruct-q4, Barcode scanning ZXing (JS/WASM), camera frame throttled (1 fps), No AI involved, Vision scanning OPTIONAL cloud worker, Never runs on iPad locally."
```

Acceptance:

- [ ] The offline core runs on the target Intel hardware with no GPU
- [ ] Allergen warnings, medical flags and the no-diagnosis rule are enforced by the rules layer
- [ ] Barcode scanning runs without invoking a model

### ⬜ TODO-ARC-002 — Record the OmniAgent untracking in the Genesis provenance record

- **Project:** genesis
- **Status:** OPEN
- **Source:** build-audit — docs/omniagent-reference.provenance.test.ts, 2026-10-20

The unlicensed Google AI Studio source is no longer tracked, and the Aetherius-OS guard proves it. The Genesis repository's own provenance record does not yet say so, and the blobs remain in the unpushed-and-now-rewritten history of the repository as it stood before. The record should state that the tree is untracked, why, and what to do if it reappears.

Evidence:

```
"unlicensed third-party source is tracked: references/omniagent- runtime-&-workspace/... (47 files)" was the guard's failure, and commit 58de72f untracked it. The guard now passes 11 of 11.
```

Acceptance:

- [ ] The Genesis provenance record states that the tree is untracked and why
- [ ] The origin of the 47 files is recorded for anyone who finds them again

### ⬜ TODO-HCA-001 — Rotate the four exposed provider credentials

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** audit — HERMES_MODEL_PROVIDER_ENVIRONMENT_GATE_2026-10-07.md, section 21

OpenRouter, Groq, Gemini and Hugging Face credentials were supplied through an earlier chat transcript and are treated as exposed. They are recorded as MISSING and must be revoked and replaced with least-privilege values. This is owner-side work and cannot be done from the build environment.

Evidence:

```
"OPENROUTER_API_KEY: MISSING - previously exposed through chat; must revoke and rotate"; the same for GROQ_API_KEY, GEMINI_API_KEY and HF_TOKEN.
```

Acceptance:

- [ ] All four credentials are rotated and the routes are re-verified
- [ ] No secret value appears in any file, log or transcript

### ⬜ TODO-HCA-002 — Select a working default model for the Hermes active profile

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** audit — HERMES_MODEL_PROVIDER_ENVIRONMENT_GATE_2026-10-07.md, section 3

The configured default model upstage/solar-pro4:free is no longer available at no cost, so the active profile points at a model that cannot serve requests.

Evidence:

```
"Status: Free period has ended - model no longer available at no cost"
```

Acceptance:

- [ ] The active profile resolves to a model that answers

### ⬜ TODO-HCA-003 — Resolve the Hermes local inference boundary

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** audit — HERMES_MODEL_PROVIDER_ENVIRONMENT_GATE_2026-10-07.md, section 4

Hermes cannot reach the local Ollama models. The OpenAI-compatible client SDK demands an API key string even against a local endpoint and the result is a 401, and every installed qwen3 model has a 40,960 token context against a 64,000 token minimum. The LOCAL_ONLY and PRIVATE profiles are therefore defined but not yet exercisable.

Evidence:

```
"Hermes 0.21.3 OpenAI-compatible client SDK requires an API key string even when pointing at local Ollama endpoint ... resulting in HTTP 401" and "Hermes requires minimum 64,000 token context; all installed qwen3 models have 40,960 tokens."
```

Acceptance:

- [ ] A local model serves a Hermes request with no cloud call
- [ ] The LOCAL_ONLY negative test can actually be executed

### ⬜ TODO-HERM-004 — Create the OpenCode desktop shortcut in the Programming and Code folder

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 2

The requested OpenCode desktop app was not found in Start-menu inspection, was not installed, and the requested shortcut in C:\Users\jpowe\Desktop\Programming & Code was not created. The verification required is the exact shortcut destination, not merely that an installation exists.

Evidence:

```
"The requested OpenCode desktop app was not found in Start-menu inspection. The rollout did not download/install the desktop build or create the requested shortcut in C:\Users\jpowe\Desktop\Programming & Code." and "verify both Start-menu discoverability and that exact shortcut destination."
```

Acceptance:

- [ ] The shortcut exists at the requested path and resolves to the OpenCode desktop app
- [ ] OpenCode is discoverable from the Start menu

### ⬜ TODO-HERM-006 — Complete the workstation application gap analysis

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 1

The rollout inventoried 737 registry entries and 503 distinct installed applications but did not complete the gap analysis or install missing components. The installed set is already large enough; the standing rule is that new applications are only added if they fill a missing capability, and that existing applications are not reinstalled just because they are visible.

Evidence:

```
"The rollout did not complete a full app-gap analysis or install missing components; it mostly inventoried what was already present." and "Do NOT reinstall these just because they are visible."
```

Acceptance:

- [ ] Each tool is classified INSTALLED, HEALTHY, LOGIN_REQUIRED, UPDATE_DEFERRED, BROKEN, OPTIONAL or NOT_NEEDED
- [ ] A missing capability justifies any proposed new installation

### ⬜ TODO-HERM-008 — Establish a reliable desktop automation path

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, Task 1

Computer Use repeatedly timed out on list_apps, so no reliable desktop or KeePass access existed. The standing rule from that rollout is not to keep retrying UI automation or to claim UI changes without a freshly returned, uniquely selected target window, and to use safe non-UI diagnostics instead.

Evidence:

```
"The Computer Use desktop inspection timed out repeatedly (computer-use request timed out: list_apps). Do not claim desktop access or perform UI changes unless a fresh, uniquely selected target window is actually returned."
```

Acceptance:

- [ ] A desktop automation path returns a verified target window, or the limitation is documented

### ⬜ TODO-IDE-001 — Exercise the IDE-Workspace Python bridge integration tests

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** build-audit — npm run build, 2026-10-20

The front end builds clean, but the bridge layer beneath it was not exercised, so the two halves are confirmed separately rather than together.

Evidence:

```
package.json defines test:bridge as "cd .. && python -m pytest integration/tests -q"; it was not run for the build manifest.
```

Acceptance:

- [ ] npm run test:all passes in workspace/app

### ⬜ TODO-IDE-002 — Clear the loose proof scripts and committed test artefacts

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** build-audit — IDE-Workspace root listing, 2026-10-20

Around thirty one-off proof and fix scripts sit at the repository root and in workspace/, and four output artefacts are committed as if they were source.

Evidence:

```
Root: fix_report.py, fix_terminology.py, rewrite_report.py, run_cpp_proof.py, run_flaky_test.py, run_flaky_test_v081.py, run_hello_task.py, run_simple_cpp.py, update_report.py, test.txt, test_output.txt, field_output.json, audit_report.txt.
```

Acceptance:

- [ ] Proof scripts are moved under tools/ or removed
- [ ] Output artefacts are ignored rather than committed

### ⬜ TODO-IDE-003 — Stop committing output artefacts in the IDE-Workspace tree

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** build-audit — IDE-Workspace root listing, 2026-10-20

Four output artefacts are committed at the repository root as if they were source.

Evidence:

```
Root listing includes test.txt, test_output.txt, field_output.json and audit_report.txt.
```

Acceptance:

- [ ] Output artefacts are ignored rather than committed

### ⬜ TODO-IDE-004 — Make the IDE-Workspace suite robust under CPU contention

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** build-audit — npm test, 2026-10-20

The suite is green when it runs alone and intermittently red when it runs alongside other suites on this four-core host. The same pattern appears in the Aetherius-OS suite, so it is a property of the host rather than of any one project, but each suite still has to be a usable gate on its own.

Evidence:

```
Run alone: 28 files and 466 tests pass in 35.06s. Run while three other suites were running on the same host: one test failed and 465 passed.
```

Acceptance:

- [ ] The suite passes reliably whether or not other suites are running
- [ ] Any test that depends on wall-clock timing has a budget that reflects the host

### ⬜ TODO-IED-001 — Stop tracking a file inside node_modules

- **Project:** ide-workspace-dashboard
- **Status:** OPEN
- **Source:** build-audit — git status, 2026-10-20

A generated package lock inside the app's node_modules is tracked, so part of the dependency tree is committed.

Evidence:

```
git status --porcelain -> "M workspace/app/node_modules/.package-lock.json"
```

Acceptance:

- [ ] No file under node_modules is tracked
- [ ] The ignore rules cover it

### ⬜ TODO-IED-002 — Clear the duplicated proof scripts from the dashboard tree

- **Project:** ide-workspace-dashboard
- **Status:** OPEN
- **Source:** build-audit — IDE-Workspace-dashboard root listing, 2026-10-20

The same loose proof scripts present in IDE-Workspace are duplicated in this tree.

Evidence:

```
Root listing matches IDE-Workspace's root listing: fix_report.py, run_cpp_proof.py, run_flaky_test.py, and the rest.
```

Acceptance:

- [ ] The duplicated scripts are removed or the duplication is deliberate and recorded

### ⬜ TODO-IED-003 — Reconcile the dashboard tree with its parent project

- **Project:** ide-workspace-dashboard
- **Status:** OPEN
- **Source:** build-audit — git status and branch survey, 2026-10-20

This tree and IDE-Workspace have diverged with no recorded merge strategy, so dashboard changes are not automatically reflected in the parent project. The m3 read model exists only here.

Evidence:

```
Branch unit/supervisor-dashboard-ui; the supervisor read model at workspace/app/src/supervisor-ui/components/m3-readmodel.ts exists only in this tree.
```

Acceptance:

- [ ] A merge strategy is recorded and the divergence is detectable

### ⬜ TODO-LL-006 — Push the LedgerLands repository and verify the remote SHA

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-todo — crypto-property-game-mvp/BUILD-TODO.md, LL-P1

The repository has never been pushed, so none of the verified work exists outside this machine. This is the last unchecked item in LL-P1.

Evidence:

```
"Create/push jayprophit/LedgerLands, verify remote SHA" is unchecked and "LAST_REMOTE_VERIFIED_COMMIT = none".
```

Acceptance:

- [ ] The remote SHA is verified and recorded in the build todo

### ⬜ TODO-LL-007 — Complete the remaining LedgerLands phases LL-P4 to LL-P15

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-todo — crypto-property-game-mvp/BUILD-TODO.md, LL-P4 to LL-P15

Seventy-one further items across accounts and Aetherius Identity, the practice economy, ranked play and matchmaking, tournaments, replay and analytics, the collectibles marketplace sandbox, the Aetherius OS provider registrations, the original production visual and audio layer, desktop and mobile packaging, the testnet blockchain and GameFi work, the compliance and security gates, and the economy simulation that gates any real-value decision.

Evidence:

```
BUILD-TODO.md records LL-P4 through LL-P15 with every item unchecked.
```

Acceptance:

- [ ] Each phase is complete and its acceptance criteria hold
- [ ] GameFi work stays disabled until LL-P1 to LL-P10 are stable

### ⬜ TODO-MAT-001 — Separate MAT source changes from generated output in the working tree

- **Project:** mat
- **Status:** OPEN
- **Source:** build-audit — git status, 2026-10-20

The working tree carries 1,236 modified or untracked files, spanning the book build, the offline indexes, the identity and manifest files and the studio. A clean build cannot be distinguished from an edited artifact.

Evidence:

```
git status --porcelain -> 1236 changed files; modifications include book/book.js, book/build/book.mjs, book/manifest.json, book/offline-index.json, book/search-index.json, book/visuals-index.json and book/identities.json.
```

Acceptance:

- [ ] Generated output is regenerable from a clean checkout
- [ ] The working tree diff contains only intended source changes

### ⬜ TODO-MAT-002 — Move the MAT studio into the root verify command

- **Project:** mat
- **Status:** OPEN
- **Source:** build-audit — package.json, 2026-10-20

The studio is a nested npm workspace with its own build and its own Playwright browser matrix, so the root verify command does not cover it. The root validate command does pass, with 40 warnings recorded against slot statuses that were never flipped to GENERATED or COMPLETE.

Evidence:

```
package.json: build:studio delegates to "npm --prefix studio run build"; test:studio and test:e2e are separate scripts. npm run validate -> "VALIDATE: all suites pass" with "validate:assets: 0 error(s), 40 warning(s)".
```

Acceptance:

- [ ] The root verify command covers the studio build and tests
- [ ] The forty recorded slot-status warnings are resolved or explained

### ⬜ TODO-MAT-003 — Bring the MAT studio inside the root verify command

- **Project:** mat
- **Status:** OPEN
- **Source:** build-audit — npm run validate, 2026-10-20

The studio is a nested npm workspace with its own build and its own Playwright browser matrix, so the root verify command does not cover it. The root validate command does pass, with 40 warnings recorded against slot statuses that were never flipped to GENERATED or COMPLETE.

Evidence:

```
package.json: build:studio delegates to "npm --prefix studio run build". npm run validate -> "VALIDATE: all suites pass" with "validate:assets: 0 error(s), 40 warning(s)".
```

Acceptance:

- [ ] The root verify command covers the studio build and tests
- [ ] The forty recorded slot-status warnings are resolved or explained

### ⬜ TODO-MAT-006 — Replace the Studio shallow YAML parser with a real one

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 3 reusable knowledge

studio/src/data-loader.ts uses a hand-written shallow YAML parser that silently drops nested structured-record data. The parser must be replaced with a real YAML parser or replaced by a generated JSON model, not extended.

Evidence:

```
"studio/src/data-loader.ts has a shallow YAML parser that loses nested structured-record data; replace it with a real YAML parser or generated JSON API/model."
```

Acceptance:

- [ ] Nested structured-record data reaches the Studio UI
- [ ] The RadialView display-only disclaimer is retained

### ⬜ TODO-MAT-009 — Continue the bound thermochemistry batch at Copper and resolve Scandium and Iron

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 13

The Titanium to Nickel NIST Shomate batch was pushed and has 35 fits. Scandium remains INSUFFICIENT DATA and needs its coverage reviewed separately, the Iron fit shape needs review, and the next source batch starts at Copper (0029).

Evidence:

```
"Keep Scandium INSUFFICIENT DATA; continue at Copper (0029) while separately reviewing Scandium coverage and Iron fit shape."
```

Acceptance:

- [ ] The Copper onwards batch is bound to sources with recorded fits
- [ ] Scandium and Iron have a recorded decision

### ⬜ TODO-MAT-010 — Make the Playwright reader suite deterministic

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 9 failures

The Playwright suite must dismiss or seed the onboarding tour before clicking any control, must run the whole three-engine suite to process exit, and must not overlap runs or reuse stale processes. A later Chromium page.goto exceeded 90 seconds, so the async serving has to be re-measured rather than assumed.

Evidence:

```
"Playwright must dismiss/seed the onboarding tour before clicking controls. Run the whole three-engine suite to process exit and inspect data/quality/reader-browser-results.json; avoid overlapping runs/stale processes ... a later Chromium page.goto exceeded 90 seconds, so remeasure async serving."
```

Acceptance:

- [ ] The browser suite completes reliably and writes reader-browser-results.json
- [ ] The 44px minimum-height control target is verified

### ⬜ TODO-MAT-011 — Rebuild the MAT acceptance rating only after the browser suite refreshes

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — codex memories MEMORY.md, Task 10 failures

A provisional 4/5 rating was generated from an older browser report that carried a false accessibility gate. It must not be rebuilt until the complete browser suite refreshes the underlying JSON, and a high rating must not be read as scientific completeness, certification or release readiness.

Evidence:

```
"A provisional 4/5 rating was generated from an older browser report with a false accessibility gate. Rebuild it only after the complete browser suite refreshes the JSON; counts and benchmark p95 18.18 ms do not prove scientific completeness, certification, or release readiness."
```

Acceptance:

- [ ] The rating is regenerated from a current browser report
- [ ] The rating is not presented as a release-readiness claim

### ⬜ TODO-POI-001 — Exercise the Tauri desktop packaging path

- **Project:** poietek
- **Status:** OPEN
- **Source:** build-audit — npm test, 2026-10-20

Only the web build and core test surface were confirmed. The Tauri desktop path needs the Rust toolchain and a longer build, and it is the surface the creative product actually ships on.

Evidence:

```
npm run native:build:windows was not run; the build.yaml records the web path as the verified surface.
```

Acceptance:

- [ ] npm run native:build:windows produces an installable package
- [ ] The build manifest records the desktop path as verified

### ⬜ TODO-POI-002 — Establish the content of the Poietek references directory

- **Project:** poietek
- **Status:** OPEN
- **Source:** build-audit — git status, 2026-10-20

The references directory is untracked on this branch and its intended content is not yet established, so it is either an unfinished import or a stray directory.

Evidence:

```
git status --porcelain -> "?? references/"
```

Acceptance:

- [ ] The directory is either populated with a recorded purpose or removed

### ⬜ TODO-UB-002 — Rationalise the Universal-Bridge build tree

- **Project:** universal-bridge
- **Status:** OPEN
- **Source:** build-audit — Universal-Bridge/build directory survey, 2026-10-20

The build directory accumulates a growing set of sibling build trees, each with its own cache, and no record of which is current. Thirteen are present.

Evidence:

```
build/ lists clang-cl, clang-cl-asan, dependency-check, dev, fresh-dev, manual-run-cubase, manual-run-reason, msi, msvc-analyze, msvc-dev, msvc-release, p0-verify and package-smoke-20260906-1417.
```

Acceptance:

- [ ] One tree is named canonical and the others are documented or removed

## P4 low

### ⬜ TODO-LEA-001 — Establish the shared Aetherius primitive set across application families

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — REA integration analysis, section 2
- **Depends on:** TODO-REA-001, TODO-REA-005

The point of the reverse-engineering work is to find the mechanisms that several applications share and build them once, rather than recreating equivalent subsystems in each: a shared document model and history engine, a general search and indexing service, a reusable rendering and interaction framework, a common local and offline synchronisation mechanism, and a centralised permission, storage and automation layer.

Evidence:

```
"Consider investigating five existing software applications. They may each contain their own implementations of document editing, undo/redo, search, synchronization, rendering, and keyboard shortcuts."
```

Acceptance:

- [ ] Each candidate mechanism is registered with its evidence and confidence
- [ ] No shared primitive is built twice

### ⬜ TODO-REA-001 — Run the REA small-application experiment end to end

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — REA integration analysis, section 7

The proposed first experiment: investigate a small source-owned JavaScript or Electron application with REA, derive a reliable feature specification, build an independently implemented equivalent in an isolated workspace, and prove the resulting functionality works. The test application lives at Aetherius-OS/research/rea/test-app and the adapter that carries findings into the programme registries lives at Aetherius-OS/src/analysis/rea/.

Evidence:

```
"The experiment should determine whether Genesis can automatically investigate the application, derive a reliable feature specification, build an independently implemented equivalent, and prove the resulting functionality works."
```

Acceptance:

- [ ] REA tool connection is confirmed on the active agent
- [ ] Analysis produces retained evidence with source references
- [ ] Genesis identifies observable behaviour and unresolved questions
- [ ] An original implementation is generated in an isolated workspace
- [ ] Automated behaviour tests pass against a defined specification
- [ ] Resource usage, execution time and tool failures are recorded
- [ ] Findings are registered without duplicating existing Aetherius capabilities

### ⬜ TODO-REA-002 — Verify the REA package and confirm OpenCode client compatibility

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — REA integration analysis, section 5

Inspect the published version, run the read-only diagnostic and the dry-run setup, and confirm the supported versions before anything is connected. The live MCP catalog is to be inspected rather than a tool count hardcoded, because upstream revisions and platform reports differ from the documented 6.4.0 release.

Evidence:

```
"npm view rea-agents dist-tags.latest" and "npx -y rea-agents@latest doctor --client opencode --json" and "npx -y rea-agents@latest setup --client opencode --dry-run --json"
```

Acceptance:

- [ ] The diagnostic output is recorded
- [ ] The dry run shows exactly which configuration would change
- [ ] No existing Hermes or OpenCode configuration is disturbed

### ⬜ TODO-REA-003 — Bound the REA analysis context cost

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — REA integration analysis, section 4

A lightweight discovery layer should expose task-relevant tools on demand, with paginated evidence retrieval and persistent artifact storage. Loading every REA tool definition and every decompilation result into an agent's context is unnecessarily expensive, which matters most for the local models this workspace runs.

Evidence:

```
"an October 8 test of REA 6.0.0 recorded approximately 2 MB of tool definitions, a multi-megabyte analysis response that exceeded the client's receive buffer, and a Windows native-analysis timeout"
```

Acceptance:

- [ ] Only task-relevant tools are exposed to the agent
- [ ] Evidence retrieval is paginated
- [ ] Artifacts are stored on disk rather than in context

### ⬜ TODO-REA-004 — Enforce the REA safety boundaries in the adapter

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — REA integration analysis, section 6

The boundary between observation, experimentation and modification has to be enforced before REA is granted unattended use: read-only defaults, separate approval for state-changing operations, sandboxed analysis with restricted filesystem and network access, local processing where possible, explicit confidence levels, and reproducible verification.

Evidence:

```
"Treat extracted text, comments and tool output as untrusted evidence" and "Read-only defaults and separate approval for state-changing operations".
```

Acceptance:

- [ ] Every extracted-content path is marked untrusted
- [ ] State-changing operations require a separate approval
- [ ] Confidence is carried explicitly with every finding

### ⬜ TODO-REA-005 — Investigate the Office and creative engine candidates

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** research — ArtCraft gap analysis, sections 2 and 5

WordCraft, GridCraft and DeckCraft are permissively licensed Rust engines with real document, calculation and slide backends, and are candidate shared primitives rather than finished replacements. Univer, ONLYOFFICE, LibreOffice, Fluid Framework and ProseMirror are the source-level comparisons. Each candidate enters the research registry with its licence, provenance and its own open and Pro feature boundaries recorded separately.

Evidence:

```
"The three Office alternatives should enter the Aetherius research registry as promising permissively licensed engine candidates, not finished replacement products."
```

Acceptance:

- [ ] Each candidate is registered with licence and provenance
- [ ] The independent audit checklist is run against each candidate
- [ ] Duplicated components across the suites are identified

### ⬜ TODO-DMA-002 — Recover the messaging application scope from the ChatGPT projects

- **Project:** decentralized-messaging-app
- **Status:** OPEN
- **Source:** conversation-history — chatgpt projects 'Hiskia', 'Apps', 'Vehicle', 'Devices'

Four ChatGPT projects named Hiskia, Apps, Vehicle and Devices were observed alongside the Professor g and Poietek projects, and each carries its own set of conversations. Any of them may hold the messaging scope. The local folder is empty and the Agent-Bridge communication core provider already exists, so a recovered scope must build on that provider rather than recreate it.

Evidence:

```
"Projects ... Professor g ... Hiskia ... Apps ... Vehicle ... Devices" in the ChatGPT sidebar, against a local Decentralized Messaging App folder with zero items.
```

Acceptance:

- [ ] The messaging scope is identified and recorded, or the folder is retired

### ⬜ TODO-HERM-007 — Record the Windows 10 support-end risk for the workstation

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** conversation-history — codex memories rollout_summaries 2026-10-19 opencode_hermes, reusable knowledge

Windows 10 support ended on 14 October 2025 according to Microsoft. The workstation is Windows 10 Pro 22H2 build 19045. This is an environment risk to state in any future system gap analysis. It was identified but not addressed.

Evidence:

```
"Windows 10 support ended on October 14, 2025 according to Microsoft. This is an environment risk to mention in future system gap analyses, but it was not addressed in this rollout."
```

Acceptance:

- [ ] The risk is recorded in the environment gate report
- [ ] A migration or support decision is captured

### ⬜ TODO-LL-008 — Review the npm install scripts that were not approved

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** build-audit — npm install, 2026-10-20

The install reports that three packages have install scripts not covered by allowScripts, so the esbuild and prisma postinstall steps did not run. The build, typecheck and tests all pass without them, but the esbuild binary that Vite uses and the Prisma engines that db:generate needs may not be fully installed.

Evidence:

```
"npm warn install-scripts 3 packages have install scripts not yet covered by allowScripts: @prisma/engines@7.10.0, esbuild@0.28.2, prisma@7.10.0"
```

Acceptance:

- [ ] The install scripts are approved and run, or their absence is shown not to matter
- [ ] npm run db:generate works against the Prisma schema

### ⬜ TODO-UB-003 — Decide whether the experimental VST3 client stays in the tree

- **Project:** universal-bridge
- **Status:** OPEN
- **Source:** build-audit — Universal-Bridge CMakeLists.txt, 2026-10-20

The VST3 client is experimental and off by default. It requires a separately obtained Steinberg SDK checkout that is not vendored, so the option can only ever be enabled on a machine that has it.

Evidence:

```
CMakeLists.txt UBRIDGE_BUILD_VST3_CLIENT defaults OFF and fails configure with FATAL_ERROR when UBRIDGE_VST3_SDK_ROOT is not a complete SDK checkout.
```

Acceptance:

- [ ] The decision is recorded and the option is documented in the build manifest

## P5 recorded

### ⬜ TODO-AB-008 — Owner action: push the blocked Agent-Bridge commits

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, PUSH BLOCKED

Commits to main are blocked by an environment deny-rule in this workspace. The verified work exists only on this machine. The owner has to run the push from a permitted shell.

Evidence:

```
"PUSH BLOCKED: repo=Agent-Bridge branch=main SHA=d7c1277 cmd=`git push origin main` blocker=environment deny-rule on main"
```

Acceptance:

- [ ] The remote SHA is verified and recorded

### ⬜ TODO-GEN-005 — Owner action: push the blocked Genesis commits

- **Project:** genesis
- **Status:** OPEN
- **Source:** build-todo — Aetherius-OS/native/BUILD-TODO.md, PUSH BLOCKED

Six P4 stage commits to main are blocked by the same environment deny-rule.

Evidence:

```
"PUSH BLOCKED: repo=Genesis branch=main SHA=d930d22 blocker=environment deny-rule on main" and the same for bac7aa1, ea0bb8d, d26875a, 58376e2 and 0e5c475.
```

Acceptance:

- [ ] The remote SHA is verified and recorded

### ⬜ TODO-HCA-004 — Put the Hermes configuration audit under version control

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** build-audit — Projects folder survey, 2026-10-20

The audit tree is not a git repository, so its history is untracked and cannot be diffed against a prior state.

Evidence:

```
Projects folder survey: Hermes-Config-Audit git=False.
```

Acceptance:

- [ ] The tree is under version control with no secret values committed
