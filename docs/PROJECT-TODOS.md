# Project Todos — outstanding work across the workspace

> Generated from `docs/PROJECT-TODOS.yaml`. Do not hand-edit this
> file; edit the YAML and regenerate.

- Source date: 2026-10-21
- Tasks: **288** (241 open, 47 done)

## By project

| Project | Open | Done |
|---|---|---|
| aetherial | 3 | 0 |
| aetherial-platform | 6 | 0 |
| aetherion-engine | 2 | 0 |
| aetherium | 2 | 0 |
| aetherius-health-library | 4 | 0 |
| aetherius-os | 54 | 16 |
| aetherius-os-prototype | 2 | 0 |
| aetherius-os-worldclass-prototype | 2 | 0 |
| agent-bridge | 19 | 6 |
| agent-bridge-cloudhybrid | 5 | 0 |
| agent-bridge-dashboard | 10 | 0 |
| agent-bridge-runtimesafety | 5 | 0 |
| ai-digital-twin | 4 | 0 |
| architecture-of-shadows-book | 3 | 1 |
| athena | 4 | 0 |
| crossplatform | 2 | 0 |
| decentralized-messaging-app | 4 | 0 |
| food-wiki-app | 5 | 0 |
| football-card-game | 2 | 0 |
| genesis | 7 | 11 |
| hermes-config-audit | 14 | 0 |
| holonav-os | 2 | 0 |
| ide-workspace | 10 | 8 |
| ledgerlands | 11 | 2 |
| mat | 13 | 0 |
| niche-platform | 3 | 0 |
| poietek | 13 | 1 |
| quantum-ai-assistant | 2 | 0 |
| quantum-os | 2 | 0 |
| qva-merged | 3 | 0 |
| self-building-ai | 2 | 0 |
| sovereign-financial-os | 2 | 0 |
| trading-bot | 5 | 0 |
| universal-bridge | 5 | 2 |
| veyra | 3 | 0 |
| virtual-assistant | 2 | 0 |
| web-platform | 4 | 0 |

## P1 blocking

### ⬜ TODO-AETHERIAL-000 — Build the Aetherial project the manifest describes

- **Project:** aetherial
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Aetherial is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AETHERIAL-001 — Give Aetherial a test suite

- **Project:** aetherial
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Aetherial holds 276820 lines of its own source with no tests. Without tests the build gate proves nothing about it.

Evidence:

```
Measured own source lines: 276820, test files: 0.
```

Acceptance:

- [ ] Tests exist and run
- [ ] The build manifest runs them
- [ ] A failure in the suite fails the gate

### ⬜ TODO-AETHERIAL-PLATFORM-000 — Build the aetherial-platform project the manifest describes

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherial-platform is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AETHERIAL-PLATFORM-002 — Rotate and remove the credentials in aetherial-platform

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive. The history scan of 21 October 2026 found the credential the audit had flagged: the GitHub token was removed from the tip by the redaction commit of 20 October 2026, but the earlier version of the file is still reachable from main, so the token is still published in the account's history. It is a working credential of the right shape and the right length, so this is a revocation and not a deletion. The report is at docs/evidence/credential-exposure-report.yaml.

Evidence:

```
Files: ['tests/auth/validators/auth.validators.spec.ts'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ⬜ TODO-AETHERIAL-PLATFORM-004 — aetherial-platform is a confirmed predecessor, and its material is not extracted

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** owner-directive — AETHERIUS_PREDECESSOR_ABSORPTION_MASTER_PLAN_2026-10-21.md, section 1 and P0-2

The owner confirmed this repository as a predecessor of Aetherius OS, with the cross-cutting functionality allowed to land in the correct shared subsystem. The plan is explicit that a name, a size or a fork-like appearance never establishes predecessor status, so the classification comes from the owner rather than from an inference. The repository holds about 200,070 lines across accounts and permissions, social, commerce, education, jobs, content, the marketplace, the dashboard and unified data types, and its CI stops at the Node setup because the workflow expects a root lockfile that is not there.

Evidence:

```
The owner's plan of 21 October 2026 names the repository and its destination, and says the destination is Aetherius OS application and platform capabilities, with model and API features owned by Genesis or Agent Bridge becoming shared first-party capabilities under their legitimate owner. The plan also states that this is not proof that any extraction has happened, and none has.
```

Resolution:

It follows the predecessor path in the register: capture, classify, map, integrate, test, verify, archive, and only then an approved deletion. The register entry says where it is in that sequence, and the deletion gate is closed until the capture and the integration are both proven.

Acceptance:

- [ ] The repository's whole history is captured and the capture is restore-tested
- [ ] Every tracked file has a disposition, and the counting reconciles exactly
- [ ] The capabilities that are adopted land in their correct owner with tests
- [ ] The licence review is closed before anything is integrated
- [ ] The CI runs, so the repository is not a build that cannot be built

### ⬜ TODO-PRED-004 — The archived absorption claims have never been checked

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md P0-3

Two repositories are archived with an ABSORBED.md notice. The directive is clear that the notice is a claim and not proof of incorporation, and that one of them is GPLv3, so it cannot be integrated into a proprietary product without rights clearance.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

Both are recorded in the register as PREDECESSOR_CANDIDATE with the absorption claim UNVERIFIED, and the licence review is an open gate on deletion.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-AETHERION-ENGINE-000 — Build the aetherion-engine project the manifest describes

- **Project:** aetherion-engine
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherion-engine is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AETHERIUM-000 — Build the aetherium project the manifest describes

- **Project:** aetherium
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherium is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-HEALTH-LIBRARY-000 — Build the aetherius-health-library project the manifest describes

- **Project:** aetherius-health-library
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-health-library is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AETHERIUS-OS-002 — Rotate and remove the credentials in Aetherius-OS

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['apps/LedgerLands/LedgerLands-Aetherius-App-Repo/LedgerLands/generated/prisma/internal/class.ts', 'apps/Multi-Cross-Platform-Trading-Bot/production/AI-Voice-assistant/assistant.py', 'apps/Multi-Cross-Platform-Trading-Bot/production/Facial_Authentication/backend/app.js', 'ecosystem/aetherial-platform/tests/auth/validators/auth.validators.spec.ts', 'predecessors/Veyra/tests/integration/tests/conftest.py'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ✅ TODO-AOS-003 — Make the HTTP bridge transport test deterministic

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** build-audit — npm test, 2026-10-20

Three tests were timing-sensitive under CPU contention on this four-core host: the bridge transport test, the shared schema envelope test and the capability registry audit. Each passed when its own file was run alone. The cause was the suite running one worker per test file, which put a hundred workers on four cores.

Evidence:

```
src/workflows/bridgeAction.test.ts:339 -> Test timed out in 5000ms. src/state/sharedSchemas.test.ts -> failed in a full-suite run. src/programme/capabilityRegistry.test.ts "has no structural integrity errors" -> failed in a full-suite run. The suite reported "100 workers spawned" on a four-core machine.
```

Resolution:

Resolved 2026-10-20. The Vitest pool is limited to eight forks and the timeouts are raised only enough to cover the slowest real operation, the registry audit that walks the whole programme. Two consecutive full-suite runs after the change each reported 1800 of 1800 passing in 36 and 39 seconds. Raising a timeout would have hidden the problem; stopping the machine being oversubscribed fixes it.

Acceptance:

- [ ] The suite passes repeatedly under full parallelism
- [ ] The cause is fixed at the root rather than by raising timeouts

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

### ✅ TODO-BRN-001 — Freeze the authoritative branch matrix for every active project

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-001

The audit asked for a matrix: repository, branch, SHA, upstream, ahead and behind, the production selection and the owner of the write set. Nine product repositories had more than one branch and no statement of which one was canonical.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

docs/BRANCH-MATRIX.yaml holds the matrix, and the decisions are checked against the live account so the register cannot go stale.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-BRN-002 — Aetherius OS's default branch was a separate outdated lineage

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-004

The default branch was a December 2025 React and Vite shell with no common ancestor with the active branch, so an agent reading the repository saw an old shell rather than the programme. Three unrelated lineages sat in the repository and the oldest was the default.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The canonical branch is now the default and every other branch is preserved unchanged. No history was rewritten.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-CI-001 — Neither Aetherius OS nor the IDE had any product CI at all

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-009

Neither repository had a workflows directory. The only runs on the account were Dependabot's dependency updates, which say nothing about whether the product works, and the IDE's own manifest said the Python Bridge integration was not exercised.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

Aetherius OS now has a workflow that type checks, tests, builds, validates the registers and scans both the tracked tree and the published history. The IDE has one that type checks, tests and builds, and a second that runs the Bridge integration tests.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-CI-002 — The gates were green on the owner's machine and red in CI, for reasons that had nothing to do with the code

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** build-gate — the programme's own CI, 2026-10-21

The first CI run found this. The build manifest registry, the gap analysis, the capability registry, the evidence audit and the source registry all read the working tree, and the working tree on the owner's machine holds thirty sibling repositories and the owner's own Documents and Downloads, none of which a clean checkout has. So every gate that compared a register to the disk was green at home and red in CI, and the red said the register was wrong when the register was right. That is the worst direction for a gate to fail in: it teaches a person that the gate is noise.

Evidence:

```
The CI's first run reported thirty-one 'manifest not found' findings for projects that are present on the owner's machine and absent from the checkout, and the source registry reported all four hundred and eleven of the owner's documents as deleted. The gap analysis reported every requirement as dangling. The capability registry reported paths in Agent-Bridge as broken after looking for them in Aetherius-OS. The evidence audit's sibling check counted the repository's own name as a sibling, so it never skipped.
```

Resolution:

Resolved 2026-10-21. The distinction is now explicit everywhere it is needed: the build manifest registry reports an absent project as unchecked and the gate asserts that the set of unchecked projects is exactly the set of absent ones, so nothing is quietly skipped; it tells an absent project from a present one by the project's own folder rather than by the first segment of the path, because most paths start with this repository's own name; the build report is generated from the manifests this repository tracks and says how many of the registry's projects it covers; the gap analysis skips the cross-reference checks when the Genesis requirement registry is not here rather than reporting every requirement as dangling; the capability registry no longer looks for a file in one repository in another one; the evidence audit's sibling check no longer counts this repository's own name; and the source registry's coverage checks are local and skip where the owner's material is absent. RULE-26 states the discipline. The suite passes in both places: one thousand eight hundred and three tests on the owner's machine, one thousand seven hundred and eighty six with seventeen skipped on a clean clone, and the CI is green on both repositories.

Acceptance:

- [ ] The full suite passes on a clean clone with no siblings and no local material
- [ ] The full suite passes on the owner's machine
- [ ] An absent thing is reported as unchecked and named, never as broken
- [ ] A thing that is present and does not agree is still a finding

### ✅ TODO-GAP-002 — Close the hive gaps: delegation with narrowing scope, and hive messaging

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** gap-analysis — GAP-ANALYSIS-REGISTRY.yaml, platform_inventory

The hive is the delegation and messaging layer of the agent platform. Delegation may only narrow: a parent hands a child a scope that is within its own, through the authority engine, so there is one rule about grants rather than two, and a chain of delegations can only subtract. A message is authorised before it is sent: the sender must hold a live grant permitting the action the message exercises, and a message from an agent that holds nothing is refused and is neither delivered nor recorded.

Evidence:

```
Genesis includes/genesis/agents/hive.hpp and src/agents/hive.cpp, with tests/hive_tests.cpp proving it in sixty-two checks that run in the build gate. The gap analysis records GAP-HIVE-001 and GAP-HIVE-002 as VERIFIED and cites the hive. The whole Genesis suite passes, twenty-four of twenty-four.
```

Resolution:

Resolved 2026-10-20. The hive closes both hive gaps: delegation with narrowing scope, and hive communication and messaging. Sixty-two checks in tests/hive_tests.cpp prove the rules, and the whole Genesis suite passes.

Acceptance:

- [ ] GAP-HIVE-001 is VERIFIED and cites the hive
- [ ] GAP-HIVE-002 is VERIFIED and cites the hive
- [ ] The hive's tests run in the Genesis build gate

### ✅ TODO-GAP-003 — Close the durable task state and crash recovery gaps

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml

The durable task registry is the work that survives a restart. An idempotency key makes a submission idempotent, so a retry after a network failure cannot do the work twice. A bounded lease gives one worker the task, so a second worker cannot take it while it is live and a worker that dies does not hold it for ever. A checkpoint records the progress, opaque to the registry, which stores it and hands it back without pretending to understand it. A task whose lease has expired is recoverable, and resuming it keeps the checkpoint, so the work continues from where it stopped rather than from the beginning.

Evidence:

```
Genesis includes/genesis/agents/tasks.hpp and src/agents/tasks.cpp, with tests/task_tests.cpp proving it in a hundred and thirty-four checks that run in the build gate, including the whole crash end to end. The requirement registry carries REQ-TASK-DURABLE-001, and the gap analysis records GAP-PLAN-002 and GAP-LIFE-001 as VERIFIED and cites the registry. The whole Genesis suite passes, twenty-five of twenty-five.
```

Resolution:

Resolved 2026-10-20. The durable task registry closes both task gaps. A hundred and thirty-four checks in tests/task_tests.cpp prove it, and the whole Genesis suite passes.

Acceptance:

- [ ] Every gap maps to a capability node or is recorded as genuinely outside the registry
- [ ] A test proves the two registries do not contradict each other

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

### ⬜ TODO-OM-001 — Work through the owner's material, source by source

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — Aetherius-OS/docs/OWNER-MATERIAL-SOURCES.yaml

The owner has provided thirty-two sources: the master handoffs, the fork catalogue, the prompt documents, the ChatGPT library files, and the reference trees. They are now inventoried and the decisions and capability asks are extracted, but the material has not been worked through source by source into the requirement and todo registers. The master inheritance packet is the continuity layer and it names the rules the programme runs on: the status vocabulary, the source precedence law, the integration modes, and the closure rule that a research-only capability is not completion.

Evidence:

```
The owner material register, docs/OWNER-MATERIAL-SOURCES.yaml, and the extraction in research/owner-material/. Thirty-two sources are declared and present, and the ingestion recorded three hundred and eighty decisions and eighty-five capability asks from the documents that could be read.
```

Acceptance:

- [ ] Each source's decisions are in the directives or the requirement registry
- [ ] Each capability ask is a todo or a requirement
- [ ] The ChatGPT library files are read, which closes the open question about them

### ⬜ TODO-OM-002 — Read the ChatGPT library files, which the API could not reach

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — Aetherius-OS/docs/OWNER-MATERIAL-SOURCES.yaml

The owner's ChatGPT library held seven hundred and sixty-eight files that the library API refused to serve, and one of them was the named master inheritance file. The owner has now supplied the library files directly, so they can be read. This closes the open question about the library.

Evidence:

```
The owner material register records the library as an inventoried source of 768 files, and the inheritance packet it contains is already read and extracted.
```

Acceptance:

- [ ] Every library file is read and classified
- [ ] The content is routed to the project it belongs to

### ⬜ TODO-PRED-001 — The predecessor migration register does not exist yet

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md P0-1

The directive gives a state machine, a relation vocabulary, a disposition vocabulary and a registry contract, and the programme had none of it. The fork routing register classifies forks by how they are used; it does not track a predecessor's journey from identified to deleted and reconciled.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

docs/PREDECESSOR-MIGRATION-REGISTRY.yaml holds one entry per predecessor in the contract the directive specifies, and every field is either filled in with evidence or explicitly null with the reason it is null.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-PRED-002 — The current target branch identity has to be settled before any integration

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md P0-4

The directive says plainly: never build on the wrong target. Three branch decisions have been made and recorded, and the remaining one, the Agent Bridge communications branch, is an integration rather than a branch decision.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The branch matrix records the decision for each repository and checks it against the live account.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-PRED-003 — Nothing has been captured for a predecessor yet

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md P0-2

The directive requires a full mirror and bundle, a SHA-256 of each, a git fsck, the LFS objects verified separately, the issues, pull requests, wiki and releases inventoried, a secret scan of the tree, the history and the artifacts, two independent verified copies, a test restoration, and an immutable evidence manifest. None of it had been done for any predecessor.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

tools/capture_predecessor.py does the capture and writes the evidence manifest, including a test restoration into a separate directory.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-PUB-002 — Two hundred and twelve first-party repositories were private, and had never been scanned

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-instruction — owner instruction 2026-10-20: all repositories public so external agents can read the data

The owner asked for every repository to be public so that external agents can read the programme's data without special access. Two hundred and twelve first-party repositories were still private, and most had never been scanned, because a private repository is not published by committing to it. Publishing them was therefore two steps rather than one: scan first, then publish. A credential that reaches a public commit cannot be un-published, only rotated.

Evidence:

```
The fork routing register classified every repository on the account. The account held six hundred and nine repositories: three hundred and fifty two third-party forks, twenty-four first-party learning repositories, eighteen first-party programme repositories, four first-party applications and one repository the register does not cover. Two hundred and ten learning repositories and two applications were private. All two hundred and twelve were cloned and scanned with the programme's own scanner: two hundred and twelve clean, zero findings, zero that could not be scanned.
```

Resolution:

Resolved 2026-10-21. All two hundred and twelve were published, and the account now holds six hundred and nine public repositories and none that are private. The scan report is at docs/evidence/private-repo-secret-scan.yaml, the scanner is tools/scan_private_repos.py, and the publication is tools/publish_first_party_repos.py. The publication tool refuses to publish anything the scan did not cover, and it never touches a third-party fork.

Acceptance:

- [ ] Every first-party repository on the account is public
- [ ] No repository is published before it has been scanned
- [ ] The third-party forks are not touched, because they are not the owner's data
- [ ] The scan report names the file and the kind of credential, never the value

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

### ⬜ TODO-SRC-004 — Read the ChatGPT project conversations and abstract what is useful

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** conversation-history — OWNER-DIRECTIVES.yaml ASK-01, thread 01a07cc2

The owner asked for this explicitly and repeatedly: "READ THE DATA FROM CHATGPT PROJECT FOLDER GENESIS AND THEN ABSTRACT THE DATA THAT'S NEEDED OR USEFUL. READ THE chat conversations." A ChatGPT project named Genesis exists in the owner's account and holds five conversations: Test a theory, Project Data Integration, Analyse Jev Routing Architecture, Analyse agentic workflows, and Job request. None of them has been read. Eleven other ChatGPT projects exist alongside it, each with its own conversations.

Evidence:

```
"Read the data from ChatGPT project folder Genesis and then abstract the data that's needed or useful." and "READ THE chat conversations." and "either automated, use mouse and keyboard or browser automation to abstract the DATA by analysing it FROM CHATGPT PROJECT FOLDER GENESIS AND THEN ABSTRACT THE DATA THAT'S NEEDED OR USEFUL"
```

Acceptance:

- [ ] Every conversation in the Genesis ChatGPT project has been read
- [ ] What each conversation contributed is recorded against the work it informed
- [ ] Nothing is copied blindly: the register records provenance and the owner's own rule against blind copying applies

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

### ⬜ TODO-AETHERIUS-OS-PROTO-000 — Build the aetherius-os-prototype project the manifest describes

- **Project:** aetherius-os-prototype
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-os-prototype is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-WORLDCASS-PROTO-000 — Build the aetherius-os-worldclass-prototype project the manifest describes

- **Project:** aetherius-os-worldclass-prototype
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-os-worldclass-prototype is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ✅ TODO-AB-013 — The Bridge refused a model's action because the model put a real newline in a JSON string

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-inspection — Agent-Bridge protocol.py, from a live task, 2026-10-21

A model asked to write a haiku produced a JSON action whose string value held a real newline instead of the two characters a backslash and an n. That is not valid JSON, so json.loads refused it with 'Invalid control character', and the action was rejected as though the model had said nothing at all. The task then spent three revisions retrying the same thing and failed. The refusal was right in the sense that the action could not be read, but the output was plainly a structured action and the model had said exactly what it meant. This is what a model does whenever it writes text, so the failure was not an edge case.

Evidence:

```
The live session history recorded the model's exact output: a fenced json block whose content value held literal newlines. Feeding that exact string to parse_model_output reproduced the failure, and json.loads(blob, strict=False) read it correctly. The same task failed before the change and completed after it, in one step with no errors, and the file it was asked for was written.
```

Resolution:

Resolved 2026-10-21. The strict reading is tried first and the relaxed one only if it fails. The relaxed reading permits control characters inside strings and relaxes nothing else: the structure, the types and the action itself are read exactly as before, and the result still has to pass validate_action, which is where the safety lives. Six tests in tests/test_protocol_v01.py cover it, and they were checked against the unfixed parser, where they fail.

Acceptance:

- [ ] An action whose string value holds a real newline is read
- [ ] The newline is preserved in the content the model meant
- [ ] The ordinary escaped form is not disturbed
- [ ] Broken JSON is still refused
- [ ] An unknown action is still refused
- [ ] A write without content is still refused

### ✅ TODO-AB-014 — Nothing proved that a real task actually ran through the Bridge

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-inspection — Aetherius-OS/tools/prove_ide_task.py, 2026-10-21

The programme had evidence that the IDE reaches the Bridge and that the Bridge sees the local models, and nothing that showed a task actually running. A connected backend is not a working one. The inheritance document asks for Genesis to be proven through the IDE and the Bridge, and nothing in the registers could say whether that had happened.

Evidence:

```
tools/prove_ide_task.py drives the same path the interface drives: create a session, submit a task, watch it run, and read back the outcome, the model that did the work, the files it touched and the result on disk. Run live, a local model (hhao/qwen2.5-coder-tools:3b) wrote a haiku in one step with no errors, and the file it was asked for was written. The digest is at docs/evidence/ide-task-proof.yaml and every value in it is read from the running service.
```

Resolution:

Resolved 2026-10-21. The tool is tools/prove_ide_task.py, and the digest is docs/evidence/ide-task-proof.yaml. It is also what found the action-parser defect recorded as TODO-AB-013: the first live run failed, and the reason was worth fixing.

Acceptance:

- [ ] A real task runs through the Bridge with a local model and produces a result
- [ ] The proof can be re-run and it reads the live state rather than asserting it
- [ ] The result on disk is shown, because that is the part that cannot be faked

### ⬜ TODO-AGENT-BRIDGE-002 — Rotate and remove the credentials in Agent-Bridge

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['variants/dashboard/tests/test_h07_h09.py'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ⬜ TODO-BRN-005 — Agent Bridge's communications work is on a branch seventy-five commits ahead

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-005

The external-worker branch holds the agent message, message bus, bridge control, bridge lifecycle and bridge loop files, and none of them are on the default branch. The audit was explicit that the units are to be selected and integrated rather than merged blind.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The default branch is already the active one, so this is an integration and not a branch decision. The units are to be selected one at a time, each with its own receipt.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-PLAT-001 — Agent Bridge's CI is red and the failures are not classified

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-003

The remote run reported 1856 tests with 26 failures and 28 errors, grouped into policy grant expectations, a missing Ollama service, a Windows short-path mismatch, dependency lock and import failures, model inventory mismatches and supervised worker expectations. The audit was explicit that the security-policy failures are to be treated as real until classified, and that they are not to be skipped to make the build green.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The local suite was run in full: 1854 tests, and its 13 failures and 3 errors were each shown to be pre-existing by running the same tests against the code from before the changes. The remote failures are larger because the runner has no model runtime, so a hermetic fast gate that does not need a provider is what closes this.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-PLAT-002 — Agent Bridge's CI failures are now classified per test, and the gate is hermetic

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-003

The audit asked for each failing test's root cause with a fix or an evidence, and for the security-policy failures to be treated as real until they are individually classified. The remote run reported 1,856 tests with 26 failures and 28 errors. Every one is now classified, and the classification is a file rather than a paragraph.

Evidence:

```
The causes: seven test modules import pytest and the runner installed only psutil, so those modules could not be imported at all; the mutation proof copies the repository twenty-three times and the runner ran it in a job with no model runtime, where it could not have passed; two tests need the opencode tool; the rest are real findings, which are not skipped to make a build green. The report is at docs/evidence/agent-bridge-ci-failure-classification.yaml.
```

Resolution:

Resolved 2026-10-21. pytest is declared as a test dependency rather than being an undeclared hard import. The gate runs the project's own documented fast path, which deselects the slow mutation proof, and the full suite is a separate job for a release. Three guards that walked the working tree now read the tracked tree, through one shared helper, so they stop reading a virtualenv, an excluded branch variant and the runtime state.

Acceptance:

- [ ] Every failing test is classified by its cause
- [ ] The runner installs what the declared test command needs
- [ ] The gate runs the project's own documented fast path
- [ ] The slow proof and the live-provider tests are a separate job
- [ ] The real findings are still failures

### ⬜ TODO-PLAT-003 — Two of the Bridge's failing tests are real findings that are not yet fixed

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-003

The fast path on this machine is: two thousand two hundred and four passed, fifteen skipped for a stated reason, one deselected, and two failed. The two are real findings, both in the phase-one acceptance suite: test_02_real_delegation_evidence_verified says both delegations must be VERIFIED and finds one, and test_12_worker_identity_visible says the worker identity is visible in the session and finds it empty. The third failure at the time of writing was the psutil pin test, which the change to the CI had broken, and it is fixed.

The runner's failures are the ones recorded in the classification. The runner has no model runtime, no KeePass, no pykeepass interpreter and no owner's database, and the tests that need those now skip and say which was missing. A test that needs a thing the machine does not have cannot say whether it is right, and failing says only that the runner is a different machine.

Evidence:

```
The classification names each one, with the module it is in. The local suite reproduces them, so they are not only remote artefacts.
```

Acceptance:

- [ ] Each real finding is fixed, or its expectation is corrected and the reason recorded
- [ ] The policy failures are fixed rather than skipped
- [ ] The gate is green on a runner and on this machine

### ⬜ TODO-AGENT-BRIDGE-CLOUDHYBRID-000 — Build the Agent-Bridge-cloudhybrid project the manifest describes

- **Project:** agent-bridge-cloudhybrid
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-cloudhybrid is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AGENT-BRIDGE-DASHBOARD-000 — Build the Agent-Bridge-dashboard project the manifest describes

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-dashboard is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AGENT-BRIDGE-DASHBOARD-002 — Rotate and remove the credentials in Agent-Bridge-dashboard

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['tests/test_h07_h09.py'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ⬜ TODO-AGENT-BRIDGE-RUNTIMESAFETY-000 — Build the Agent-Bridge-runtimesafety project the manifest describes

- **Project:** agent-bridge-runtimesafety
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-runtimesafety is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-AI-DIGITAL-TWIN-002 — Rotate and remove the credentials in ai-digital-clone

- **Project:** ai-digital-twin
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['scripts/setup_local_cloud.sh'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ⬜ TODO-ARCH-SHADOWS-000 — Build the Architecture of Shadows Book project the manifest describes

- **Project:** architecture-of-shadows-book
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Architecture of Shadows Book is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-ATHENA-000 — Build the Athena project the manifest describes

- **Project:** athena
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Athena is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-CROSSPLATFORM-000 — Build the Crossplatform---multiplatform project the manifest describes

- **Project:** crossplatform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Crossplatform---multiplatform is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-DECENTRALIZED-MESSAGING-000 — Build the Decentralized Messaging App project the manifest describes

- **Project:** decentralized-messaging-app
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Decentralized Messaging App is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-FOOD-WIKI-000 — Build the Food Wiki App project the manifest describes

- **Project:** food-wiki-app
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Food Wiki App is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-FOOTBALL-CARD-GAME-000 — Build the football-card-game project the manifest describes

- **Project:** football-card-game
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

football-card-game is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ✅ TODO-GAP-001 — Close the eight priority-one Genesis gaps

- **Project:** genesis
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.md, Next to build

The gap analysis assessed 31 agent-platform capabilities against the Genesis registries and found 27 open, 8 of them priority one: capability-scoped authority, delegation with narrowing scope, hive communication, crash recovery and resume, the free-first admission guard, task decomposition, durable task state, and tool execution with sandboxing.

Evidence:

```
All eight are now closed. Capability-scoped authority was closed by the authority engine; delegation with narrowing scope and hive communication by the hive; durable task state and crash recovery by the durable task registry; the free-first admission and zero-spend guard by the admission gate; task decomposition and planning by the planner, which also gave the organism loop its plan stage; and tool execution with sandboxing by the tool executor. Every one of them is proved by a test executable that runs in the build gate, and the whole Genesis suite passes.
```

Resolution:

Resolved 2026-10-21. All eight priority-one gaps are closed and each is proved by a test executable in the Genesis build gate.

Acceptance:

- [ ] Each priority-one gap moves to IMPLEMENTED or VERIFIED with a test that proves it
- [ ] The gap registry is regenerated and the report shows the change

### ✅ TODO-GAP-004 — Close the free-first admission and zero-spend guard gap

- **Project:** genesis
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml

The admission gate decides what may be called and what may be spent. An endpoint whose cost is not known is refused, because a guard that admits what it does not understand is not a guard. A free or local endpoint is admitted without question, and it is the preferred answer for everything. A metered endpoint spends its free allowance before any money is involved. Money is refused unless it is budgeted: spending is off by default, and a caller that turns it on must state how many paid uses are permitted, which the gate enforces as a ceiling rather than an intention.

Evidence:

```
Genesis includes/genesis/agents/admission.hpp and src/agents/admission.cpp, with tests/admission_tests.cpp proving it in sixty-nine checks that run in the build gate. The requirement registry carries REQ-ADMISSION-FREE-001, and the gap analysis records GAP-MODEL-002 as VERIFIED. The whole Genesis suite passes, twenty-six of twenty-six.
```

Resolution:

Resolved 2026-10-20. The admission gate closes the gap. Sixty-nine checks in tests/admission_tests.cpp prove it, and the whole Genesis suite passes.

Acceptance:

- [ ] GAP-MODEL-002 is VERIFIED and cites the admission gate
- [ ] The admission gate's tests run in the Genesis build gate
- [ ] The spend is zero while only free endpoints are used

### ✅ TODO-GAP-005 — Close the task decomposition and planning gap

- **Project:** genesis
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml

The planner turns an objective into a plan whose steps carry their dependencies, so the steps that may run now are computed rather than guessed. A plan that cannot be executed is refused: a dependency on a step that does not exist, a dependency on itself and a dependency cycle are all refused, because a plan that waits for ever is worse than no plan. When a step fails, the steps that depended on it are held and the objective is decomposed again with the reason, so the work continues rather than restarting. The organism loop borrows the planner and records the plan it produced, so its plan stage is executed rather than marked missing.

Evidence:

```
Genesis includes/genesis/agents/planner.hpp and src/agents/planner.cpp, with tests/planner_tests.cpp proving fifty-six checks and tests/organism_loop_tests.cpp proving ninety-nine. The requirement registry carries REQ-PLAN-DECOMPOSE-001, and the gap analysis records GAP-PLAN-001 as VERIFIED. The whole Genesis suite passes, twenty-seven of twenty-seven.
```

Resolution:

Resolved 2026-10-21. The planner closes the gap, and the organism loop now has its plan stage. Fifty-six checks in tests/planner_tests.cpp and ninety-nine in tests/organism_loop_tests.cpp prove it, and the whole Genesis suite passes.

Acceptance:

- [ ] GAP-PLAN-001 is VERIFIED and cites the planner
- [ ] The organism loop's plan stage is executed rather than marked missing
- [ ] A failed step is re-planned with the reason rather than restarted

### ✅ TODO-GAP-006 — Close the tool execution and sandboxing gap

- **Project:** genesis
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml

There was a gate and nothing behind it. The tool executor runs a registered tool, and it does so behind four checks. The authority decides: the agent must hold a live grant for the tool, and the grant must permit the action. Approval decides: where the agent's approval mode requires it, a call without an approval is refused, and the executor approves nothing on the agent's behalf. The budget decides: the step count and the tool-call count are counted by the executor and cannot be exceeded by a tool. And the sandbox is the grant turned into a declaration: the tool is handed the network and filesystem permissions its grant permits and the remaining budget, and nothing else. A tool is a registered operation the caller supplies rather than arbitrary code the executor loads, so the boundary is the gate and the declaration rather than an operating-system jail. The runtime limit is cooperative, and a call that overruns it is recorded as a breach rather than counted as a success.

Evidence:

```
Genesis includes/genesis/agents/tool_execution.hpp and src/agents/tool_execution.cpp, with tests/tool_execution_tests.cpp proving seventy-one checks that run in the build gate. The requirement registry carries REQ-TOOL-EXECUTE-001, and the gap analysis records GAP-TOOL-001 as VERIFIED. The whole Genesis suite passes, twenty-eight of twenty-eight.
```

Resolution:

Resolved 2026-10-21. The tool executor closes the gap. Seventy-one checks in tests/tool_execution_tests.cpp prove it, and the whole Genesis suite passes.

Acceptance:

- [ ] GAP-TOOL-001 is VERIFIED and cites the tool executor
- [ ] A call without authority, approval or budget is refused and recorded
- [ ] The tool is handed only the permissions its grant permits

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

### ✅ TODO-GEN-010 — The Genesis kernel was never in the chain: the organism was built, tested and never run

- **Project:** genesis
- **Status:** DONE
- **Source:** owner-instruction — Aetherius_Current_Chat_Master_Inheritance_2026-09-15.md, dependency order step 3: Genesis proven through IDE+Bridge

There were two things called Genesis and the programme could not tell them apart. Genesis is the organism: a C++ kernel carrying identity, memory, state and the causal runtime. The Bridge's 'Genesis runtime' was a Python store of session and identity references over JSON, documented as 'Genesis owns session/identity/memory refs; Agent Bridge owns execution'. The C++ kernel was built, tested and never run by anything. The interface reached the Bridge, the Bridge reached the models, and nothing in between was Genesis. The kernel's runtime host existed, worked and had a self-test that boots an organism, records an event, checkpoints it, restarts and rolls back, and nothing called it.

Evidence:

```
The Bridge's genesis_runtime.py documents the split in its own first line. A search of the Bridge for the kernel found nothing: no ctypes binding to the C++ library, no subprocess to the host, no shared library. The kernel's own runtime host was present in the build tree and ran: it booted an organism with a persistent identity, recorded events, checkpointed with registry and memory digests, and rolled back to an earlier version as a new version with an audit record.
```

Resolution:

Resolved 2026-10-21. The Bridge attaches the kernel's runtime host: Agent-Bridge/genesis_kernel.py is the client, the service boots the organism at startup, records a session and a task as the organism's events, and publishes the organism's identity, version and state in the runtime snapshot the interface reads. The interface's status row used to read a fixed string, 'genesis-prime - local preview (unverified)', which named something that was not there; it now shows the organism's own identity, or says the organism is not attached. Run live: a local model wrote a haiku through the Bridge and the organism's memory holds the boot and both events, its version advancing from v1 to v3. Twenty-three tests in tests/test_genesis_kernel.py and eleven in tests/test_genesis_seam.py cover it, the real-kernel ones skipped loudly when the kernel has not been built. The gap register records it as GAP-CHAIN-001, VERIFIED.

Acceptance:

- [ ] The organism is booted by the Bridge and its identity is the one the interface shows
- [ ] A session and a task are recorded as the organism's events
- [ ] The organism's state is durable and survives a restart
- [ ] The organism's identity does not change when the model is replaced
- [ ] A Bridge with no kernel attached still runs every task and says the organism is not attached

### ✅ TODO-GEN-012 — The Genesis secret scanner had never scanned anything

- **Project:** genesis
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-002

Its accumulator was called $matches, and $Matches is a PowerShell automatic variable that the -match operator overwrites with a hashtable. The scan died on the first match and reported nothing, so the scan could not be certified.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The scanner now scans the tracked tree, has an allowlist whose every entry states its reason, and completes: 610 files in nine seconds. It still fails when there is something to find, which was checked against a tree carrying a token and a password.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-GEN-013 — The committed repository content manifest was stale

- **Project:** genesis
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-002

Two of the twenty-eight Linux gates failed because the committed inventory no longer matched the source. The tool that regenerates it was correct; the manifest had simply not been re-run after the source changed.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The manifest is regenerated: 631 canonical source files. The whole suite passes here, twenty-six of twenty-six.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-GENESIS-000 — Build the Genesis project the manifest describes

- **Project:** genesis
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Genesis is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-STR-001 — Make Genesis downloadable and usable as an agent in its own right

- **Project:** genesis
- **Status:** OPEN
- **Source:** owner-direction — The owner's instruction of 2026-10-20

Genesis is the AI agent, and the owner has said it is to be an agent you can download and use. It is the kernel of Aetherius OS and it is part of the IDE, and it keeps its own repository and its own remote precisely so that the download is real: a subdirectory of another project's repository has no history of its own. What is missing is the packaging: a release artefact, an install path and a document that says how to run the organism on its own.

Evidence:

```
The owner's instruction of 2026-10-20: Genesis is an AI agent you can download and use, it is part of the IDE, and it is at the kernel level of Aetherius OS. The registry now records the ownership.
```

Acceptance:

- [ ] A release artefact is produced from the Genesis build
- [ ] The artefact runs on a machine with no Aetherius OS installed
- [ ] The install is documented in the repository's own README

### ⬜ TODO-HERMES-AUDIT-000 — Build the Hermes-Config-Audit project the manifest describes

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Hermes-Config-Audit is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-HOLONAV-OS-000 — Build the holonav-os project the manifest describes

- **Project:** holonav-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

holonav-os is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-IDE-WORKSPACE-000 — Build the IDE-Workspace project the manifest describes

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

IDE-Workspace is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ✅ TODO-IED-106 — The IDE was not launchable: no working launcher, and a HOW TO RUN with every path wrong

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** owner-inspection — Aetherius-OS/apps/IDE-Workspace and Aetherius-OS/HOW-TO-RUN-AETHERIUS-IDE.md, 2026-10-21

The IDE built and served, and its own tests passed, but nobody could start it by following the documentation. The HOW TO RUN pointed at C:\Users\jpowe\Desktop\IDE-Workspace\workspace\integration\BridgeService.py, a path that no longer existed after the workspace was reorganised, named a launcher script that was never created, and gave a health route of /health that the Bridge does not serve under that name. It did not mention the local model runtime at all, so a person following it would get a Bridge reporting UNAVAILABLE and an IDE showing no models, with nothing to explain why.

Evidence:

```
Every path in the document was checked against the filesystem: Desktop\IDE-Workspace and Desktop\Start-Aetherius-IDE.ps1 do not exist, Agent-Bridge\BridgeService.py does not exist, and Agent-Bridge\service.py does. The Bridge serves /v1/runtime, /v1/diagnostics, /v1/selfcheck and /v1/models, not a /v1/health.
```

Resolution:

Resolved 2026-10-21. scripts/start-ide-stack.ps1 starts the local model runtime, then Agent Bridge with the IDE origin allowlisted and the IDE workspace as its root, then the IDE, waiting for each and printing the true state. It was run cold with every port free and it brought the whole chain up. The HOW TO RUN was rewritten against the verified reality, including the two things it had never mentioned: the local model runtime must be up, and the Bridge must be given the IDE's origin or it sends no CORS header and the IDE silently reports disconnected.

Acceptance:

- [ ] One command starts the local model runtime, the Bridge and the IDE, and reports what is actually true
- [ ] The script works from a cold machine with every port free
- [ ] The HOW TO RUN names paths that exist, ports that answer, and the prerequisites that are genuinely required
- [ ] The document says what to do when each step fails

### ⬜ TODO-LEDGERLANDS-000 — Build the LedgerLands project the manifest describes

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

LedgerLands is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-LEDGERLANDS-002 — Rotate and remove the credentials in LedgerLands

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['LedgerLands-Aetherius-App-Repo/LedgerLands/generated/prisma/internal/class.ts'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

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

### ⬜ TODO-STR-004 — Finish MAT, which is still being worked on by the Codex desktop app

- **Project:** mat
- **Status:** OPEN
- **Source:** owner-direction — The owner's instruction of 2026-10-20

MAT is the owner's own periodic table and the substrate the rest of the programme processes data with. It is not finished: it is still being worked on by the Codex desktop app on a scheduled five-hour window, and the work is pending. Until it is finished, every project that depends on it depends on something that is still moving.

Evidence:

```
The owner's instruction of 2026-10-20: MAT is still being worked on by the Codex desktop app, it is not finished, and the work is pending on its five-hour scheduled window. The registry now records MAT as PARTIAL.
```

Acceptance:

- [ ] The scheduled work window completes and the result is reviewed
- [ ] The MAT build validates against the versioned schemas
- [ ] The registry records MAT as finished when it is

### ⬜ TODO-NICHE-PLATFORM-000 — Build the Niche_platform project the manifest describes

- **Project:** niche-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Niche_platform is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ✅ TODO-BRN-004 — Poietek's default branch was eighteen commits behind its own successor

- **Project:** poietek
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-008

The default branch's CI failed because the workflows still assumed a directory that no longer exists at that path. The successor branch carried the corrected workflows and its quality gate passes.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The default branch was moved forward to the successor. The default was a strict ancestor, so the move lost nothing and rewrote nothing.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-POI-013 — Apply the licence audit to every audio candidate before adoption

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md sections 6, 7, 74, 75

The licence audit is mandatory before anything is adopted. LMMS is GPL-2.0, Tracktion Engine is GPL or commercial and depends on separately licensed JUCE, JUCE is AGPLv3 or commercial, Carla is GPL-2.0-or-later, and CLAP provides an open host and plugin ABI. Nothing GPL or AGPL may be pasted into a repository intended for incompatible licensing. Where such code is useful but cannot be integrated, the classification is REFERENCE_ONLY, ARCHITECTURAL_REFERENCE, ALGORITHM_RESEARCH, CLEAN_ROOM_REFERENCE, SEPARATE_PROCESS, or REJECTED_LICENSE.

Evidence:

```
"DO NOT assume either can become the proprietary first-party Poietek foundation without licensing implications." and "No LICENCE CONTAMINATION - Do not paste GPL/AGPL source into a repository intended for incompatible licensing."
```

Acceptance:

- [ ] Every candidate carries a licence classification and a recorded reason
- [ ] No GPL or AGPL source exists in a first-party repository

### ⬜ TODO-POIETEK-000 — Build the Poietek project the manifest describes

- **Project:** poietek
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Poietek is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-QUANTUM-AI-ASSISTANT-000 — Build the quantum-ai-assistant project the manifest describes

- **Project:** quantum-ai-assistant
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

quantum-ai-assistant is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-QUANTUM-OS-000 — Build the Quantum-OS project the manifest describes

- **Project:** quantum-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Quantum-OS is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-QVA-MERGED-000 — Build the QVA-merged project the manifest describes

- **Project:** qva-merged
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

QVA-merged is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-SELF-BUILDING-AI-000 — Build the self-building-ai project the manifest describes

- **Project:** self-building-ai
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

self-building-ai is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-SOVEREIGN-FINANCIAL-OS-000 — Build the sovereign-financial-os project the manifest describes

- **Project:** sovereign-financial-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

sovereign-financial-os is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-SEC-002 — Rotate the credentials that were committed to the trading bot

- **Project:** trading-bot
- **Status:** OPEN
- **Source:** secret-scan — tools/scan_workspace_secrets.py, 2026-10-20

The trading bot carried six live credentials in its history: an AWS account email and password, an AWS access key id, a Google API key, a Groq key, an OpenAI project key, and a Coinbase API secret. They are redacted from the working tree, but a credential in the history is a published credential, and the company that used them, Sifdat, is dissolved, so the accounts may well still be live. Only the owner can rotate them. The history scan of 21 October 2026 found the credential the audit had flagged: the GitHub token was removed from the tip by the redaction commit of 20 October 2026, but the earlier version of the file is still reachable from main, so the token is still published in the account's history. It is a working credential of the right shape and the right length, so this is a revocation and not a deletion. The report is at docs/evidence/credential-exposure-report.yaml.

Evidence:

```
A scan of every repository in the workspace found them: daily-logs/03-10-2024.md held the AWS account and password, production/Facial_Authentication/backend/app.js the AWS access key id, production/AI-Voice-assistant/ assistant.py and crypto.py the Google, Groq and OpenAI keys, and production/API/.env the Coinbase secret. All are redacted in the working tree and pushed on 2026-10-20.
```

Acceptance:

- [ ] Every credential is rotated at its provider
- [ ] The histories are rewritten, or the repositories stay private until they are
- [ ] A scan of the workspace finds no credential in a publishable location

### ⬜ TODO-TRADING-BOT-000 — Build the Multi-Cross-Platform-Trading-Bot project the manifest describes

- **Project:** trading-bot
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Multi-Cross-Platform-Trading-Bot is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-TRADING-BOT-002 — Rotate and remove the credentials in Multi-Cross-Platform-Trading-Bot

- **Project:** trading-bot
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['production/AI-Voice-assistant/assistant.py', 'production/Facial_Authentication/backend/app.js'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ✅ TODO-BRN-003 — Universal Bridge's default branch had no source in it

- **Project:** universal-bridge
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-007

A merge had deleted the implementation, so the default branch had no src/ directory, the CMake configure failed and CodeQL was red. The development branch had restored it and its CI passes.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The development branch was merged into the default. Both histories are ancestors of the result, so nothing that existed before was lost.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

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

### ⬜ TODO-UNIVERSAL-BRIDGE-000 — Build the Universal-Bridge project the manifest describes

- **Project:** universal-bridge
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Universal-Bridge is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-VEYRA-000 — Build the Veyra project the manifest describes

- **Project:** veyra
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Veyra is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-VEYRA-002 — Rotate and remove the credentials in Veyra

- **Project:** veyra
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Literal credentials were found in the project's own source. They are compromised by being on disk in a recovered drive.

Evidence:

```
Files: ['tests/integration/tests/conftest.py'].
```

Acceptance:

- [ ] Every credential is rotated at the provider
- [ ] No credential literal remains in the tree
- [ ] The secret scanner gate rejects the pattern

### ⬜ TODO-VIRTUAL-ASSISTANT-000 — Build the VirtualAssistant project the manifest describes

- **Project:** virtual-assistant
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

VirtualAssistant is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-WEB-PLATFORM-000 — Build the Web-platform project the manifest describes

- **Project:** web-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Web-platform is registered in the programme and has a build manifest, but there is no source. The conversations and the recovered material describe what it is.

Evidence:

```
Measured own source lines: 0.
```

Acceptance:

- [ ] Source exists in the project directory
- [ ] The project builds and its tests pass
- [ ] The build manifest matches what is there

### ⬜ TODO-WEB-PLATFORM-001 — Give Web-platform a test suite

- **Project:** web-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Web-platform holds 9638 lines of its own source with no tests. Without tests the build gate proves nothing about it.

Evidence:

```
Measured own source lines: 9638, test files: 0.
```

Acceptance:

- [ ] Tests exist and run
- [ ] The build manifest runs them
- [ ] A failure in the suite fails the gate

## P2 high

### ⬜ TODO-AETHERIAL-PLATFORM-003 — Choose and record a licence for aetherial-platform

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 200070.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-STR-006 — Settle the health library's two identical frequency tables

- **Project:** aetherius-health-library
- **Status:** OPEN
- **Source:** workspace-restructure — Aetherius-OS/Temp/WORKSPACE-RESTRUCTURE-2026-10-20.md

The health library holds two frequency tables, rife_frequency.txt and spooky2_frequency.txt. They are byte-identical: the same 452,116 bytes with the same SHA-256. So there is one dataset under two names, and one of the two names promises data that is not there. Either the spooky2 table was never filled in, or it was copied from the rife one. Either way, the library should hold what its names say it holds.

Evidence:

```
SHA-256 of rife_frequency.txt and spooky2_frequency.txt are identical. Measured 2026-10-20.
```

Acceptance:

- [ ] The two tables hold what their names say they hold
- [ ] The health library has its own repository, which it is to have once it is finished

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

### ✅ TODO-AOS-015 — The four boundaries and the single brand are not recorded as a rule anywhere

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-material — AETHERIUS_FIGMA_AGENT_HANDOFF_V2_2026-10-17/README_START_HERE.md, 2026-10-17

The handoff of 17 October 2026 states the product boundaries and the single public brand plainly, and the programme had no record of them. The risk was not that the boundaries were wrong. The IDE was called IDE_NAME_TBD and might have been branded as the OS. The risk was that Agent Bridge, which is an authorised capability surface, would be presented as a publicly branded OS app.

Evidence:

```
The handoff states: 'One public-facing brand: Aetherius. Keep Genesis for the AI identity. Old names remain historical references only.' and 'Agent Bridge: distinct authorised tools/capability surface, not automatically a publicly branded OS app.'
```

Resolution:

Resolved 2026-10-21. Recorded as RULE-22 in docs/OWNER-DIRECTIVES.yaml. The IDE's own name was settled at the same time: Aetherius IDE, which is what the handoff calls it.

Acceptance:

- [ ] The boundaries are recorded as a standing rule
- [ ] The IDE, Genesis, Aetherius OS and Agent Bridge are named as four distinct things
- [ ] The single public brand is stated

### ⬜ TODO-AOS-016 — The design status labels are not the evidence vocabulary, and the registers only have the evidence one

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — AETHERIUS_FIGMA_AGENT_HANDOFF_V2_2026-10-17/CURRENT_STATE_AND_NEXT_STEPS.md, 2026-10-17

The handoff makes eight status labels mandatory for design and reference work: SOURCE_REFERENCE, DESIGNED, INTERACTIVE_PROTOTYPE, LOCAL_UI_DEMO, IMPLEMENTED, TESTED, ROADMAP and BLOCKED. The programme's own vocabulary is PROPOSED, FOUND, IMPLEMENTED, TESTED, INTEGRATED, DEPLOYED, NOT_LOCATED and BLOCKED. They overlap on three labels and differ on five, and the difference is exactly where a design artefact is most easily mistaken for a working product. A design frame is not proof of a working product, and a local demo is not a runtime. The registers currently have no vocabulary for the first, second or fourth of those states, so a concept can be recorded as though it were built.

Evidence:

```
The handoff states the labels as mandatory and separates SOURCE_REFERENCE, DESIGNED, INTERACTIVE_PROTOTYPE and LOCAL_UI_DEMO from IMPLEMENTED and TESTED. The programme's vocabulary is recorded in docs/OWNER-DIRECTIVES.yaml RULE and in the header of docs/GAP-ANALYSIS-REGISTRY.yaml.
```

Acceptance:

- [ ] The registers can record a design artefact and a design-only state as themselves
- [ ] The eight design labels are available where design work is recorded
- [ ] The two vocabularies are mapped to each other, so a label means one thing across the programme
- [ ] A concept is never recorded as though it were built

### ⬜ TODO-AOS-017 — Aetherius OS Commerce / Marketplace is a named first-party app the programme has no project for

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — AETHERIUS_FIGMA_AGENT_HANDOFF_V2_2026-10-17/COMMERCE_LEARNING_SPEC.md and DESIGN_ARCHITECTURE.md, 2026-10-17

The handoff names Commerce and Marketplace as a future Aetherius OS application, carrying the storefront, merchant administration, checkout and payment provider concepts, and names the archives that informed it: WooCommerce 7.4.0 for the concepts and Coinbase Commerce 1.2.1 as an optional cryptocurrency checkout provider. The programme's project register has no Commerce project. The word commerce appears in the registers only as part of a predecessor web platform that carried e-commerce, e-learning and social media together, which is history and not the canonical destination.

Evidence:

```
The handoff's screen family table lists 'Commerce/Marketplace | storefront/merchant admin + checkout/provider | future OS selling/buying | identity, entitlements, files, notifications', and its V2 inputs table gives the proper destination as 'Aetherius OS Commerce / Marketplace'.
```

Acceptance:

- [ ] The project is in the build manifest registry with a build manifest and a location
- [ ] The workflow requirements from COMMERCE_LEARNING_SPEC.md are in the requirement register
- [ ] It shares one identity, entitlement and billing model with Learning rather than a second one
- [ ] It is presented as an OS app, not as IDE functionality

### ⬜ TODO-AOS-018 — Aetherius OS Learning is a named first-party app the programme has no project for

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — AETHERIUS_FIGMA_AGENT_HANDOFF_V2_2026-10-17/COMMERCE_LEARNING_SPEC.md and DESIGN_ARCHITECTURE.md, 2026-10-17

The handoff names Learning as a future Aetherius OS application with learner and educator views, courses, lessons, quizzes, groups, assignments and assessment, and names the archive that informed it: the LearnDash LMS 4.5.0.3. The programme's project register has no Learning project. It also states the constraint that matters most here: Commerce and Learning share their data model and must not create overlapping authentication or billing systems.

Evidence:

```
The handoff's screen family table lists 'Learning | learner/educator tabs + courses/lessons/assessment | future OS education | identity, groups, activity, analytics', and the V2 inputs table gives the destination as 'Aetherius OS Learning'.
```

Acceptance:

- [ ] The project is in the build manifest registry with a build manifest and a location
- [ ] The workflow requirements from COMMERCE_LEARNING_SPEC.md are in the requirement register
- [ ] It shares one identity, entitlement and billing model with Commerce
- [ ] It is presented as an OS app, not as IDE functionality

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

### ⬜ TODO-DIR-001 — Check every change against the owner's standing directives

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** conversation-history — OWNER-DIRECTIVES.yaml, the twelve standing rules

Twelve standing rules were recovered from the conversation corpus. They bind every task, and a change that violates one is wrong even when the outcome looks right. Four of them have already been violated in this programme's history: a second build tree was kept alongside the canonical one, unlicensed third-party source was committed, a workspace-cleanup commit swept unrelated files in, and a provisional rating was published from a stale report. A check that the rules are honoured, rather than remembered, is the durable fix.

Evidence:

```
RULE-02, RULE-05, RULE-08, RULE-09 and RULE-11 in docs/OWNER-DIRECTIVES.yaml, each with the work in this programme that already answers to it.
```

Acceptance:

- [ ] The rules are visible where a change is proposed, not only in a document
- [ ] A change that would violate one is refused rather than made and explained

### ⬜ TODO-END-001 — Give the finished programme production and system architecture

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-direction — owner instruction, 2026-10-20

Once every project is finished and built and ready for public release, the programme is to be given senior level, world class, industrial industry level production and system architecture. The bar is a system that would survive being operated by someone else: the deployment is reproducible, the failure modes are known and handled, the boundaries are documented, and the architecture is the one the code actually has rather than the one the documents claim.

Evidence:

```
The owner's instruction of 2026-10-20: once all projects are fully finished and built ready for public release, provide senior level world class industrial industry level production and system architecture.
```

Acceptance:

- [ ] Every project is finished, built and ready for public release
- [ ] The architecture describes the system as it is, not as it was planned
- [ ] The deployment is reproducible from the build manifests

### ⬜ TODO-END-002 — Remove the obsolete material, and keep the reference data

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-direction — owner instruction, 2026-10-20

Once the projects are ready for public release, the obsolete files, folders and data are removed, and the reference data is kept so that it can be used later if needed. The obsolescence register is what the removal needs first, because obsolete and reference are easy to confuse and the difference is costly. The register classifies the account's repositories and the material on the machine into what is live, what is reference and what is obsolete, and it keeps the distinction the owner has asked for: a predecessor absorbed by a working project is obsolete, and a fork that informed the design, or an empty repository the owner keeps for learning, is reference.

Evidence:

```
The obsolescence register, which classifies seven hundred and eighty-six entries: the five absorbed predecessors and the generated build trees are obsolete, and the forks, the learning repositories and the owner's own material are reference.
```

Acceptance:

- [ ] The obsolete material is removed and the reference data is kept
- [ ] The register is regenerated and shows nothing left to remove
- [ ] Every removal is recorded, so that what was removed and why is known

### ⬜ TODO-FRK-001 — Route the two forks the owner's catalogue does not cover

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — Aetherius-OS/docs/OWNER-MATERIAL-SOURCES.yaml

The owner's fork use case migration catalogue routes three hundred and fifty repositories. Two on the account are not in it: buildkit, the container build system, and u-boot, the bootloader. Both are Aetherius OS core material, and both are large enough that a routing decision matters.

Evidence:

```
The fork routing register, which joins the catalogue to the live account, classifies two repositories as unrouted forks: buildkit and u-boot. The catalogue's own category for Aetherius OS core is the place they belong.
```

Acceptance:

- [ ] Each fork has a category, a destination and an integration mode
- [ ] The fork routing register is regenerated and shows no unrouted fork

### ⬜ TODO-FRK-002 — Place the four first-party applications that have no home yet

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — Aetherius-OS/docs/OWNER-MATERIAL-SOURCES.yaml

Four of the owner's own repositories are not part of any project in the workspace and are not learning repositories: Coursiv, Devcontainer-setup, THE-ARCHITECTURE-OF-SHADOWS, and the long-named web platform repository. The Architecture of Shadows book is already in the books section of Aetherius OS, so the repository is probably the book's source rather than a separate application.

Evidence:

```
The fork routing register classifies four repositories as owner applications that are not yet placed: Coursiv, Devcontainer-setup, THE-ARCHITECTURE-OF-SHADOWS and the long-named web platform repository.
```

Acceptance:

- [ ] Each repository is placed in a project, or recorded as a learning repository
- [ ] The programme catalogue records where each one lives

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

### ⬜ TODO-SEC-003 — Scan every repository in the workspace, not just Aetherius OS

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** secret-scan — tools/scan_workspace_secrets.py, 2026-10-20

The secret scanner that guards Aetherius OS only guarded Aetherius OS, so the absorbed projects had no guard at all, and two of them carried live credentials. The scanner now covers every repository in the workspace, and it covers the working tree rather than only the tracked files, because an untracked file is one add away from being published. It reports what it finds and changes nothing: a credential has to be rotated at the provider as well as removed from the tree. The history scan added on 21 October 2026 found the gap this todo could not have seen: the scanner read the tracked tree, so a credential removed from the tip was invisible to it. It now reads the history as well, and it does so in twelve seconds rather than four minutes, because the blobs are read in one batched pass.

Evidence:

```
The scan found the six credentials in the trading bot and the one in self-building-ai. It also found a flaw in itself: the placeholder filter matched the label rather than the value, so a line reading 'Password: Asdf@6773' was treated as a placeholder, and the key patterns did not cover the Groq prefix or an OpenAI key with a hyphen in it. Both were fixed, and the two keys the first pass missed were redacted.
```

Acceptance:

- [ ] Every repository in the workspace is scanned
- [ ] The scan runs as part of the build gate
- [ ] A finding in a publishable location fails the gate

### ✅ TODO-SEC-004 — The histories of the other public repositories have never been scanned

- **Project:** aetherius-os
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-006

The programme's scanner read the tracked tree, not the history, so a credential that was removed from the tip was invisible to it. The history scan was added, and it immediately found the exposures it had been missing.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The scanner now reads the history, and a history job runs in the CI. Every finding is classified with a stated reason, and the four fixtures are allowlisted with their reasons.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

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

### ⬜ TODO-STR-010 — Build the absorbed projects from the Aetherius OS gate

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** workspace-restructure — Aetherius-OS/Temp/WORKSPACE-RESTRUCTURE-2026-10-20.md

Every absorbed project has its own build manifest, and each one records how it is built and tested. But Aetherius OS's own gate does not run them: its test suite is scoped to its own source, and each absorbed project runs its own tests with its own runner. So the manifest of an absorbed project is a record of how it should be built, not evidence that it is. A single command that builds and tests every absorbed project is what turns the manifests into a gate.

Evidence:

```
Aetherius-OS/vite.config.ts now scopes the suite to this project's own source and excludes the absorbed directories. Each absorbed project's build.yaml records its own commands. Measured 2026-10-20.
```

Acceptance:

- [ ] One command builds and tests every absorbed project
- [ ] A failure in an absorbed project fails the Aetherius OS gate
- [ ] The registry records the result of that command

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

### ⬜ TODO-AB-010 — The Bridge's mutation proof makes the whole suite look hung

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-inspection — Agent-Bridge/tests/test_actions_intake_mutations.py, 2026-10-21

The Bridge's test suite runs a mutation proof. For each of twenty-three mutations it copies the whole repository into a temporary directory, changes one line, and runs the affected tests there, expecting them to fail. Each of those runs is a separate pytest process, and the pytest subset takes about seventy seconds on its own, so the proof alone is roughly half an hour. The child's output is captured rather than streamed, so the suite's own log does not grow while it works, and the parent process does no work of its own while it waits. The result is a suite that looks frozen: flat processor time, no new output, no progress line, for as long as the proof runs.

Evidence:

```
Observed three times on 2026-10-21. The suite was judged hung twice and had to be killed both times, and the third run was left to finish. The pytest subset run on its own passed 107 tests in 69.69 seconds, and the mutation list holds twenty-three entries, so the proof is expected to take about half an hour. The copy-and-mutate pattern is in tests/test_actions_intake_mutations.py, which copies the repository with shutil.copytree and runs the suite in the copy.
```

Acceptance:

- [ ] The suite says what it is doing while it is doing it
- [ ] A person watching the run can tell the difference between working and stuck
- [ ] The mutation proof does not have to be part of the default test command to be trusted
- [ ] The proof reports which mutation it is on

### ⬜ TODO-AB-011 — Six of the Bridge's failing tests fail because they scan the working tree instead of the tracked tree

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-gate — Agent-Bridge test suite, 2026-10-21

The Bridge's hygiene, dependency-contract, bypass-guard and phase-1 acceptance tests walk the working tree rather than the files git is tracking. The repository excludes the branch variants, so the local variants directory holds a virtualenv, a personal absolute path and a fake test credential that are all outside the repository and none of which is the repository's business. The tests find them and fail, so a build that is green on a clean checkout is red on the owner's machine, for reasons that have nothing to do with the code. The programme's own secret scanner already holds the right principle and says so: it scans what is tracked, not what is on disk, because a developer's local environment is not the repository's problem and a committed key is.

Evidence:

```
The suite was run in full: 1854 tests over 64.8 minutes, with 13 failures and 3 errors. Six of them pass in a clean checkout and fail in the working tree: test_no_hardcoded_secrets and test_no_personal_absolute_paths_in_source find variants/dashboard/tests/test_h07_h09.py and variants/dashboard/compute/worker_bridge_adapters.py, which git is not tracking, and the dependency-contract test finds variants/dashboard/.venv/Lib/site-packages. The remaining ten are pre-existing and environment-dependent: three depend on the local model set, four get an HTTP 400 from the model runtime, and three depend on a tool that is not installed. None of the sixteen was caused by the changes of this session, which were checked by running the same tests against the code from before them.
```

Acceptance:

- [ ] The hygiene, dependency and guard tests read the tracked tree, like the secret scanner does
- [ ] A build that is green on a clean checkout is green on the owner's machine
- [ ] The failure of a test says what is wrong, not what is somewhere else on the disk

### ✅ TODO-AB-015 — A session label was refused for a workspace it was bound to, because two spellings of one path were compared as strings

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md, the Windows short-path group

A caller label is bound to a workspace so that a label reused for a different workspace is refused rather than silently rebound. The comparison was on the path strings, and on Windows the short form of a path names the same directory as the long form. A temporary directory is routinely handed to a caller in one spelling and recorded in the other, so the caller got a conflict for a path that never changed, and the message said the label was bound to a workspace it was bound to. The audit named this group as a Windows short path normalisation mismatch, and it was a real defect in the product rather than in the test.

Evidence:

```
The remote run reported test_session_label_correlates_actions failing with HTTP 409: session label 'wf-9' already belongs to workspace C:\Users\runner... The two paths named the same directory. The same mismatch appeared in the lock file's own test, which compared a path derived from a short temporary directory against one resolved to the long form.
```

Resolution:

Resolved 2026-10-21. The comparison resolves both paths before it compares them, so the short form and the long form are the same directory. The check is not weakened: a genuinely different path is still refused. Three tests in tests/test_session_label_workspace.py cover it, and they were checked against the unfixed comparison, where the middle one fails with the very conflict this fixes.

Acceptance:

- [ ] Two spellings of one path are one path
- [ ] A label bound to one spelling resolves under another
- [ ] A label bound to a genuinely different workspace is still refused

### ⬜ TODO-AGENT-BRIDGE-003 — Choose and record a licence for Agent-Bridge

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 145743.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-AGENT-BRIDGE-010 — Build the missing Agent-Bridge capabilities

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge was checked against the capability set for its family and 1 of 19 were not found in its own source. The missing ones are: Message store (COM-102).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 672 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-BRN-006 — A file with a .json extension is not JSON

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-012

The global capability closure matrix carries a .json extension but holds comments and Python-style assignments, so a consumer that parses it as JSON fails. The audit asked for the schema and the consumer expectations to be validated.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

The file's format has to be decided and the consumers checked against it.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ✅ TODO-IED-101 — The Bridge's runtime route and its model route disagreed about how many models exist

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-inspection — Agent-Bridge/ide_bridge.py and Agent-Bridge/runtime.py, 2026-10-21

/v1/models reported the ten local models the machine actually had. /v1/runtime reported none, because the runtime snapshot only ever carried the models a tracker had recorded, and no tracker was recording any. One route said the machine had no models while the other said it had ten, and a consumer of the runtime route was told something false.

Evidence:

```
build_runtime_snapshot built its result from RuntimeStateTracker.snapshot(), whose models list is empty until record_models is called, while runtime.model_inventory() queries the model runtime live. Observed live: /v1/runtime returned models: 0 and /v1/models returned 10, on the same machine, at the same moment.
```

Resolution:

Resolved 2026-10-21. The snapshot now falls back to the live inventory when the tracker has recorded no models, and leaves active_model alone so that having no model selected is still reported as a different fact from having no model available. Five tests in tests/test_ide_bridge.py cover the agreement, the precedence, the distinction and the failure path.

Acceptance:

- [ ] The runtime route and the model route report the same model list
- [ ] A recorded model still wins over the live inventory
- [ ] No model being selected is still reported separately from no model being available
- [ ] A model runtime that cannot be reached does not break the snapshot

### ⬜ TODO-STR-002 — Bring Agent-Bridge into the Aetherius OS ecosystem

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** owner-direction — The owner's instruction of 2026-10-20

Agent-Bridge is used by Genesis, Aetherius OS and the IDE, and it is available for users to download and use with their own agents. It will eventually become part of the Aetherius OS ecosystem, and that is what allows Genesis, which is built at the kernel level, to run everything down to the kernel. It stays a repository of its own until then, because a user needs to be able to download it and use it with their own agents.

Evidence:

```
The owner's instruction of 2026-10-20. The registry records Agent-Bridge as a shared library that Genesis, the IDE and Aetherius OS depend on.
```

Acceptance:

- [ ] Aetherius OS builds Agent-Bridge as part of its own build
- [ ] The standalone download still works for a user with their own agents
- [ ] The registry records the ecosystem membership

### ⬜ TODO-AGENT-BRIDGE-CLOUDHYBRID-003 — Choose and record a licence for Agent-Bridge-cloudhybrid

- **Project:** agent-bridge-cloudhybrid
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 111326.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-AGENT-BRIDGE-CLOUDHYBRID-010 — Build the missing Agent-Bridge-cloudhybrid capabilities

- **Project:** agent-bridge-cloudhybrid
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-cloudhybrid was checked against the capability set for its family and 3 of 20 were not found in its own source. The missing ones are: Service definition (CLD-001); Autoscaling (CLD-005); Networking and ingress (CLD-006).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 487 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-AGENT-BRIDGE-DASHBOARD-003 — Choose and record a licence for Agent-Bridge-dashboard

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 134735.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-AGENT-BRIDGE-RUNTIMESAFETY-003 — Choose and record a licence for Agent-Bridge-runtimesafety

- **Project:** agent-bridge-runtimesafety
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 111778.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-AI-DIGITAL-TWIN-003 — Choose and record a licence for ai-digital-clone

- **Project:** ai-digital-twin
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 215983.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-AI-DIGITAL-TWIN-010 — Build the missing ai-digital-clone capabilities

- **Project:** ai-digital-twin
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

ai-digital-clone was checked against the capability set for its family and 1 of 18 were not found in its own source. The missing ones are: Offline caching (LOC-003).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 453 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-AOSB-001 — The book project has no document toolchain, so it has never been built

- **Project:** architecture-of-shadows-book
- **Status:** OPEN
- **Source:** build-audit — Architecture of Shadows Book folder survey, 2026-10-20

The book is a real project with real content: sixteen volumes, fifty-three parts and four hundred and three chapters in the master edition, a student edition, a web version, and a hundred and thirty eight kilobyte text of the whole work. It cannot be built on this machine. Pandoc and XeLaTeX are not installed, so no PDF or EPUB has ever been produced here and no build gate has ever run for the project. The build commands themselves are sound: they are the owner's own, and their globs were checked against the tree and match it. The toolchain is the missing part.

Evidence:

```
pandoc: not installed. xelatex: not installed. The master's own BUILD-INSTRUCTIONS.md gives the commands, and the glob patterns 00-FRONT-MATTER/*.md and VOLUME-*/PART-*/chapter-*.md match the tree exactly.
```

Acceptance:

- [ ] Pandoc and a LaTeX distribution are installed on this machine,The master edition builds to a PDF and an EPUB,The student edition builds to a PDF and an EPUB,The build gate runs for this project and passes

### ✅ TODO-AOSB-002 — The book project was not in the workspace at all, and its manifest was not published

- **Project:** architecture-of-shadows-book
- **Status:** DONE
- **Source:** conversation-history — chatgpt conversation /c/6a415e55-8ba4-83eb-b67a-c96004d46dcf

The book was a registered project whose content was never in the workspace. The register described it accurately as an empty folder, and that was the problem: the folder was empty, but the project was not. It lived in a public repository, and the manifest that the register pointed at sat in a folder the parent repository ignores, so a clone of the parent would not have had it either.

Evidence:

```
The public repository jayprophit/THE-ARCHITECTURE-OF-SHADOWS carried 782 tracked files across three editions. Aetherius-OS/.gitignore excludes books/Architecture of Shadows Book/ along with every other nested project repository, and git ls-files books returned nothing.
```

Resolution:

Resolved 2026-10-21. The repository is cloned into books/Architecture of Shadows Book/, its own manifest is committed inside it, and the register entry now describes the three editions and the real status: the content is present and the toolchain is absent. The counts in the manifest were counted from the tree.

Acceptance:

- [ ] The book repository is cloned into the place the register names,The manifest is inside the book's own repository, so it is published with it,The register describes what the project actually holds,The manifest counts the tree rather than describing it

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

### ✅ TODO-GEN-011 — The gap register said the authority engine was not bound to the tool execution path, which was no longer true

- **Project:** genesis
- **Status:** DONE
- **Source:** gap-analysis — Aetherius-OS/docs/GAP-ANALYSIS-REGISTRY.yaml, 2026-10-21

GAP-AUTH-001 said the authority engine was not bound to the tool execution path, so a tool call did not consult it before it ran. That was true when the gap was written and stopped being true when the tool executor was built: the executor asks the authority engine for the grant and obeys the answer, and the hive narrows a delegated grant against the parent's. The register still said the gap was open. A register that keeps a stale gap is worse than no register, because it says the programme is less finished than it is, and it hides the work that closed it.

Evidence:

```
src/agents/tool_execution.cpp says it in its own words: the authority decides, the executor does not restate the rule, it asks the authority engine and obeys the answer. A missing grant is refused before the tool runs. src/agents/hive.cpp registers grants and narrows delegated ones.
```

Resolution:

Resolved 2026-10-21. GAP-AUTH-001 is now VERIFIED, with the tool executor and the hive cited as the bindings and tests/tool_execution_tests.cpp and tests/hive_tests.cpp as the proof. GAP-AUTH-003 was corrected rather than closed: the authority engine does evaluate a capability request against a grant and has two real callers inside Genesis, but nothing outside Genesis goes through it yet, so it stays PARTIAL with the text saying exactly that.

Acceptance:

- [ ] The register's text matches what the code does
- [ ] The gap that is closed is closed for a stated reason and with a citation
- [ ] The work that closed it is visible rather than lost in the register

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

### ⬜ TODO-HERMES-AUDIT-010 — Build the missing Hermes-Config-Audit capabilities

- **Project:** hermes-config-audit
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Hermes-Config-Audit was checked against the capability set for its family and 4 of 4 were not found in its own source. The missing ones are: Command line entry point (TLS-001); Configuration (TLS-002); Structured output (TLS-003); Testing (TLS-004).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-IDE-WORKSPACE-003 — Choose and record a licence for IDE-Workspace

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 35638.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-IDE-WORKSPACE-DASHBOARD-003 — Choose and record a licence for IDE-Workspace-dashboard

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 27247.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-IDE-WORKSPACE-DASHBOARD-010 — Build the missing IDE-Workspace-dashboard capabilities

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

IDE-Workspace-dashboard was checked against the capability set for its family and 1 of 8 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 136 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ✅ TODO-IED-102 — The IDE showed 'backend: disconnected' with no reason, so a rate-limited Bridge looked like a Bridge that was not running

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** owner-inspection — Aetherius-OS/apps/IDE-Workspace/workspace/app/src/App.tsx, 2026-10-21

The IDE captured the transport's own error, including an HTTP status, and then threw it away: the status line read 'backend: disconnected' whatever the cause. A Bridge that was rate limited, a Bridge at the wrong address and a Bridge that was not running all looked identical, and the three have different fixes.

Evidence:

```
fetchBridgeStatus set base.error from the thrown Error, and the rendered status line used only bridge.connected. Observed live: the Bridge's rate limit is 120 requests a minute per address, one IDE tab polls three routes every five seconds, and with six tabs open the Bridge answered 429, which the IDE displayed as a plain disconnection.
```

Resolution:

Resolved 2026-10-21. The status line now reads 'backend: disconnected (HTTP 429)' or whatever the transport actually said. The connection state itself was not changed: the IDE still reports what it can see, and now says why.

Acceptance:

- [ ] The status line carries the reason the backend is unreachable
- [ ] The reason is the transport's own text, not a paraphrase
- [ ] A connected backend is unaffected

### ✅ TODO-IED-103 — One IDE tab uses 30% of the Bridge's rate limit, and the limit is shared by everything on the machine

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** owner-inspection — Agent-Bridge/service.py and Aetherius-OS/apps/IDE-Workspace/workspace/app/src, 2026-10-21

The Bridge allows 120 requests a minute per address, and everything on the machine shares 127.0.0.1. The IDE polled three routes every five seconds, which is thirty-six requests a minute, so one tab used a third of the whole budget and four tabs exhausted it. This was reached in practice: with six tabs open the Bridge began answering 429 and the IDE reported itself disconnected. The poll was asking the same question three times, because the runtime route reports the health and the model inventory and the IDE was not reading them from there.

Evidence:

```
Agent-Bridge rate_limit_per_min defaults to 120 and _rate_ok counts per client address over a sixty second window. The IDE's BRIDGE_POLL_MS is 5000 and fetchBridgeStatus issues three requests per cycle.
```

Resolution:

Resolved 2026-10-21. The IDE now asks the Bridge once per poll instead of three times. The runtime route already reports the health and the model inventory, so the separate health and model requests were two more requests for information the first one carried. A Bridge that does not carry the models in its runtime snapshot is still supported: the second request is made only when the first one did not supply them. One tab now costs twelve requests a minute instead of thirty-six, which is a tenth of the Bridge's budget rather than a third, and several tabs can be open without any of them being throttled. Four tests in src/bridge.test.ts pin the request count, the fallback, and the rule that the reason for a failure survives to the interface.

Acceptance:

- [ ] One IDE tab uses well under a quarter of the request budget
- [ ] The IDE does not re-request the model inventory on every poll when nothing has changed
- [ ] Two or more IDE tabs can be open without either of them being throttled

### ✅ TODO-IED-107 — The IDE reported itself as IDE_NAME_TBD

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** owner-inspection — Aetherius-OS/apps/IDE-Workspace/workspace/app/index.html, 2026-10-21

The window title and the header of the interface both read IDE_NAME_TBD, and the package was named ide-name-tbd-shell. A report in the repository noted the name was temporary and distinct from Agent Bridge, Aetherius OS and Genesis, but no one replaced it. Anyone opening the IDE saw a placeholder where the product's name should be.

Evidence:

```
index.html carried <title>IDE_NAME_TBD - Shell Slice 1</title>, App.tsx rendered <span>IDE_NAME_TBD</span>, and package.json carried name ide-name-tbd-shell.
```

Resolution:

Resolved 2026-10-21. The name is Aetherius IDE in the title, in the header and in the package. It is distinct from the three neighbouring things: Aetherius OS is the ecosystem, Genesis is the organism, Agent Bridge is the execution runtime, and the IDE is the interface to them. Verified live: the browser reports the title as Aetherius IDE and the header as Aetherius IDE.

Acceptance:

- [ ] The window title names the product
- [ ] The header names the product
- [ ] The package name names the product
- [ ] The name is still distinct from Agent Bridge, Aetherius OS and Genesis

### ✅ TODO-IED-108 — The IDE's bridge retry outlived the view, so a gone interface kept talking to the Bridge

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** owner-inspection — Aetherius-OS/apps/IDE-Workspace/workspace/app/src/App.tsx, 2026-10-21

The status poll retries a few times when the Bridge cannot be reached, and the retry timer was never cleared when the view went away. A retry that fired after the interface was gone was a request the Bridge received for an interface that was no longer there, and it is exactly the kind of background traffic that makes a shared rate limit bite for no reason. It was found because it made the suite flaky: a pending retry from one test landed inside another test's measurement window, so a test that asserted 'a user action added no request' sometimes failed for a reason that had nothing to do with the action.

Evidence:

```
The retry was scheduled with window.setTimeout and the effect's cleanup cleared only the interval. With the fix removed, twenty-five of the suite's twenty-six tests failed, because the runaway retry polluted the whole file's call counts. With the fix in place, the file passes five consecutive runs.
```

Resolution:

Resolved 2026-10-21. The retry timer is held and cleared on unmount, and the poll's interval can be pushed out of the way by a test harness through the same window override the Bridge's base address already uses. Twenty-six tests in src/App.test.tsx, and the new one was checked against the unfixed component, where it fails.

Acceptance:

- [ ] A retry does not fire after the view has gone
- [ ] The suite's call-count assertions are deterministic rather than a matter of timing
- [ ] The test that covers it fails when the fix is removed

### ⬜ TODO-STR-003 — Keep the IDE usable on operating systems other than Aetherius OS

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** owner-direction — The owner's instruction of 2026-10-20

The IDE is an app of Aetherius OS and it may also be used by other operating systems. It therefore depends on Genesis, Agent-Bridge and MAT rather than on Aetherius OS, so it can run without it. That is a constraint on the code as much as on the registry: nothing in the IDE may reach into Aetherius OS's own tree.

Evidence:

```
The owner's instruction of 2026-10-20. The registry records the IDE's dependencies, and it does not list Aetherius OS.
```

Acceptance:

- [ ] The IDE builds and its tests pass without Aetherius OS present
- [ ] No module in the IDE imports from the Aetherius OS tree
- [ ] The build manifest names the operating systems it is supported on

### ⬜ TODO-LED-001 — LedgerLands' green runs are Dependabot's, not product CI

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** owner-audit — Aetherius_GitHub_Diagnostic_2026-10-21.md AUD-013

The recent green GitHub runs were dependency update workflows. A run on a Dependabot branch failed with missing module declarations and type errors, and the manifest's own summary contradicts its open issue list about a removed baseUrl.

Evidence:

```
The audit of 21 October 2026, which is an independent read-only inspection of the GitHub account, and the programme's own working on this machine. The audit states that repository data and CI observations are not equivalent to runtime acceptance, so every claim here was checked against the running thing before it was recorded.
```

Resolution:

Product CI has to run on the default branch, and the manifest's status has to agree with itself.

Acceptance:

- [ ] The finding is closed by something that runs, not by a description
- [ ] The evidence is reproducible on this machine

### ⬜ TODO-LEDGERLANDS-010 — Build the missing LedgerLands capabilities

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

LedgerLands was checked against the capability set for its family and 2 of 17 were not found in its own source. The missing ones are: Invoicing (FIN-002); Budgeting (FIN-004).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 170 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-STR-008 — Reconcile LedgerLands' three copies of itself

- **Project:** ledgerlands
- **Status:** OPEN
- **Source:** workspace-restructure — Aetherius-OS/Temp/WORKSPACE-RESTRUCTURE-2026-10-20.md

LedgerLands holds a git bundle, a source tree, a second copy named as an Aetherius app repository, and a crypto property game MVP with its own archive. It was never under version control at all before the restructure, so nothing records which of the copies is the current one. The bundle is the history and should be unpacked into a repository first.

Evidence:

```
The folder holds LedgerLands.bundle, LedgerLands-source, LedgerLands-Aetherius-App-Repo, crypto-property-game-mvp and crypto-property-game-mvp.zip. Measured 2026-10-20.
```

Acceptance:

- [ ] The bundle is unpacked into a repository with its history
- [ ] One copy is the current source and the others are recorded as archives
- [ ] The build manifest says which is which

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

### ⬜ TODO-NICHE-PLATFORM-003 — Choose and record a licence for Niche_platform

- **Project:** niche-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 27626.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-POI-010 — Build the DAW product capability registry

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md section 2

The master's first research output. Research the current versions and families of the major DAWs and music-production environments, from the seed list and beyond it, and record for each: vendor, product, version, family, platform, price model, target user, the full capability set from recording through scripting and API, the distinguishing features, the Poietek equivalent, the source, and when it was last checked.

Evidence:

```
"Create: DAW_PRODUCT_CAPABILITY_REGISTRY. Research the CURRENT versions/families of major DAWs and related music-production environments. ... Do not stop at this seed list. Discover other important current products."
```

Acceptance:

- [ ] Every product in the seed list is recorded, and the list was extended past the seed
- [ ] Each record carries its Poietek equivalent and its last-checked date

### ⬜ TODO-POI-011 — Build the audio and MIDI engine registries

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md sections 5, 8, 9

Three registries. The audio engine registry, covering the real-time graph, lock-free processing, latency compensation, offline rendering, recording and crash recovery. The audio backend registry, covering WASAPI, ASIO, PipeWire, JACK, ALSA, Core Audio, AAudio and the Web Audio API. The MIDI engine registry, covering MIDI 1.0, MIDI 2.0 and UMP, with the libraries behind each. Universal-Bridge owns hardware interoperability; Poietek consumes its interfaces rather than duplicating them.

Evidence:

```
"Create: AUDIO_BACKEND_REGISTRY" and "Carry forward the existing Universal-Bridge MIDI requirements ... Do NOT duplicate Universal-Bridge. Universal-Bridge owns broad hardware/software interoperability. Poietek consumes the interfaces."
```

Acceptance:

- [ ] Each registry has the field set the master names for it
- [ ] Every entry records its licence and its implementation

### ⬜ TODO-POI-012 — Build the plugin format and plugin host registries

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md sections 10, 11, 12, 13

The plugin format registry covering CLAP, VST3, Audio Units, AUv3, LV2, LADSPA, DSSI, AAX and the legacy VST2, with the full field set the master names. The plugin host registry, covering scanning, format identification, validation, quarantine, crash isolation, sandboxing, bridging and per-plugin process separation. CLAP is to receive serious evaluation as the open modern host and plugin interface. AAX is an interoperability target, not something to reproduce, and it is an owner gate if a developer agreement is needed.

Evidence:

```
"CLAP should receive serious evaluation as an open modern host/plugin interface." and "Treat AAX primarily as interoperability. Do not reproduce proprietary Avid technology." and "A faulty third-party plugin should ideally not destroy the entire project session."
```

Acceptance:

- [ ] Each format is recorded with its SDK licence, its host requirements and its risk
- [ ] CLAP has a written evaluation against the alternatives

### ⬜ TODO-POI-014 — Produce the forty named research outputs

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md section 81

The master names forty required research outputs, from 01_DAW_PRODUCT_REGISTRY through 40_FOLLOW_ON_TODOS, covering the capability matrix, the workflow taxonomy, the engine registries, the plugin registries, the effect and synthesis taxonomies, the format and interchange registries, the hardware map, the dataset, benchmark and licence registers, the fork and dependency shortlists, the first-party repository plans, the architecture and integration maps, the rights and provenance registers, the requirement registry and the implementation priority. The master also states the pipeline the research must follow on a resource-constrained machine: discover, metadata, licence, size, duplicate, value, shortlist, selective fetch, selective build.

Evidence:

```
"Create under: OPENCODE_DATA_ROOT\Poietek-Audio-Research\ At minimum: 01_DAW_PRODUCT_REGISTRY ... 40_FOLLOW_ON_TODOS" and "Pipeline: DISCOVER -> METADATA -> LICENCE -> SIZE -> DUPLICATE -> VALUE -> SHORTLIST -> SELECTIVE FETCH -> SELECTIVE BUILD. Use bounded concurrency."
```

Acceptance:

- [ ] Each of the forty outputs exists, or its absence is recorded with a reason
- [ ] The selective-fetch pipeline is followed rather than cloning everything

### ⬜ TODO-POIETEK-003 — Choose and record a licence for Poietek

- **Project:** poietek
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 65995.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-STR-009 — Make Poietek's build compile the bridge it now contains

- **Project:** poietek
- **Status:** OPEN
- **Source:** workspace-restructure — Aetherius-OS/Temp/WORKSPACE-RESTRUCTURE-2026-10-20.md

The universal bridge is inside Poietek now, as the owner directed. It is a C++ project with its own CMake build, and Poietek's build does not compile it, so the two are in the same folder but not in the same build. The bridge's own manifest records how it is built and tested; Poietek's should record that the bridge is part of it.

Evidence:

```
Poietek/absorbed/Universal-Bridge/build.yaml records the CMake build. Poietek's own commands do not invoke it. Measured 2026-10-20.
```

Acceptance:

- [ ] Poietek's build compiles the bridge
- [ ] The bridge's tests run as part of Poietek's gate
- [ ] The bridge's manifest names Poietek as its owner

### ⬜ TODO-QVA-MERGED-003 — Choose and record a licence for QVA-merged

- **Project:** qva-merged
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 3061.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

### ⬜ TODO-UB-004 — Make Universal Bridge read mixing desks and reach the installed hardware

- **Project:** universal-bridge
- **Status:** OPEN
- **Source:** conversation-history — OWNER-DIRECTIVES.yaml ASK-05, thread 01a06e04

The owner asked for the bridge to read mixing desks and to be able to access the hardware that is installed on the machine. The application registry records what is installed; the bridge has to be able to reach it. The constraint the owner set is explicit: use supported Windows APIs, and do not send undocumented USB or vendor commands, and do not destructively write to the MPC.

Evidence:

```
"I also want it to read mixing desks." and "Please make sure the universal bridge can access them." and "Verify Universal Bridge can enumerate/access their MIDI/audio endpoints using supported Windows APIs; do not send undocumented USB/vendor commands or destructively write to the MPC."
```

Acceptance:

- [ ] Mixing desks are enumerated through supported Windows APIs
- [ ] The hardware present on this machine is identified and recorded
- [ ] No undocumented USB or vendor command is sent

### ⬜ TODO-UNIVERSAL-BRIDGE-010 — Build the missing Universal-Bridge capabilities

- **Project:** universal-bridge
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Universal-Bridge was checked against the capability set for its family and 2 of 17 were not found in its own source. The missing ones are: Plugin SDK (CRE-004); Runtime or kernel (PLT-001).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 47 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-WEB-PLATFORM-003 — Choose and record a licence for Web-platform

- **Project:** web-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

The project has no licence file. The owner decides which; the default for new first-party repositories is private.

Evidence:

```
No licence file found. Own source lines: 9638.
```

Acceptance:

- [ ] A licence file is present
- [ ] The build manifest records it

## P3 medium

### ⬜ TODO-AETHERIAL-010 — Build the missing Aetherial capabilities

- **Project:** aetherial
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Aetherial was checked against the capability set for its family and 26 of 26 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008); Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 1079 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-AETHERIAL-PLATFORM-010 — Build the missing aetherial-platform capabilities

- **Project:** aetherial-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherial-platform was checked against the capability set for its family and 69 of 69 were not found in its own source. The missing ones are: Product catalogue (COM-001); Cart (COM-002); Checkout (COM-003); Order management (COM-004); Payments integration (COM-005); Inventory and stock (COM-006); Pricing and discounts (COM-007); Subscriptions (COM-008); Seller or merchant dashboard (COM-009); Tax and shipping calculation (COM-010); Reviews and ratings (COM-011); Order tracking and fulfilment (COM-012); Course management (EDU-001); Lesson content delivery (EDU-002); Quizzes and assessment (EDU-003); Progress tracking (EDU-004); Certificates (EDU-005); Enrolment and cohorts (EDU-006); Course payments (EDU-007); Gamification (EDU-008); Discussion forums (EDU-009); Learning analytics (EDU-010); User profiles (SOC-001); Feed (SOC-002); Connections and follower graph (SOC-003); Post composer (SOC-004); Comments and replies (SOC-005); Likes and reactions (SOC-006); Direct messaging (SOC-007); Media upload (SOC-008); Notifications (SOC-009); Moderation (SOC-010); Groups and communities (SOC-011); Accounting and double-entry ledger (FIN-001); Invoicing (FIN-002); Payment handling (FIN-003); Budgeting (FIN-004); Markets and trading (FIN-005); Tax handling (FIN-006); Financial reporting (FIN-007); Reconciliation (FIN-008); Risk and compliance controls (FIN-009); Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008); Schema definition (DB-001); Migrations (DB-002); Query layer (DB-003); Indexing (DB-004); Transactions (DB-005); Backup and restore (DB-006); Replication and scaling (DB-007); Connection management (DB-008); Database observability (DB-009); Service definition (CLD-001); Container build (CLD-002); Orchestration (CLD-003); Configuration and secrets (CLD-004); Autoscaling (CLD-005); Networking and ingress (CLD-006); Object storage (CLD-007); Logging and monitoring (CLD-008); Continuous integration (CLD-009); Cost control (CLD-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 797 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-AETHERION-ENGINE-010 — Build the missing aetherion-engine capabilities

- **Project:** aetherion-engine
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherion-engine was checked against the capability set for its family and 18 of 18 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Local runtime (LOC-001); Local model inference (LOC-002); Offline caching (LOC-003); Local data store (LOC-004); Device access (LOC-005); Resource scheduling (LOC-006); Local installation (LOC-007); Update mechanism (LOC-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-AETHERIUM-010 — Build the missing aetherium capabilities

- **Project:** aetherium
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherium was checked against the capability set for its family and 17 of 17 were not found in its own source. The missing ones are: Ingest (KNW-001); Structure and categorisation (KNW-002); Link graph (KNW-003); Search (KNW-004); Source citation (KNW-005); Versioning (KNW-006); Publication (KNW-007); Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-HEALTH-LIBRARY-010 — Build the missing aetherius-health-library capabilities

- **Project:** aetherius-health-library
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-health-library was checked against the capability set for its family and 7 of 7 were not found in its own source. The missing ones are: Ingest (KNW-001); Structure and categorisation (KNW-002); Link graph (KNW-003); Search (KNW-004); Source citation (KNW-005); Versioning (KNW-006); Publication (KNW-007).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-STR-007 — Give the health library its own repository once it is finished

- **Project:** aetherius-health-library
- **Status:** OPEN
- **Source:** workspace-restructure — Aetherius-OS/Temp/WORKSPACE-RESTRUCTURE-2026-10-20.md

The health library will be part of Aetherius OS once it is finished, and when it is finished it will have its own repository, holding new and old discoveries to help with development. It is recorded in the workspace now, and the repository is what comes next.

Evidence:

```
The owner's instruction of 2026-10-20.
```

Acceptance:

- [ ] The library is finished
- [ ] It has its own repository on the owner's account
- [ ] The registry records the repository

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

### ⬜ TODO-AOS-019 — Aetherius OS Community is a named first-party app the programme has no project for

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-material — AETHERIUS_FIGMA_AGENT_HANDOFF_V2_2026-10-17/DESIGN_ARCHITECTURE.md, 2026-10-17

The handoff names Community as a future Aetherius OS application carrying the feed, groups, chat and events, and states that Commerce, Learning and Community must appear as future OS apps with grounded interface flows rather than as bloat in the IDE. The programme's project register has no Community project. There is a predecessor web platform that carried social media, and a decentralised messaging project, but neither is the canonical destination.

Evidence:

```
The handoff's screen family table lists 'Community | feed/groups/chat/events | future OS people + teams | accounts, messages, posts, moderation', and its definition of done requires that Commerce, Payments, Learning and Community appear as future OS apps.
```

Acceptance:

- [ ] The project is in the build manifest registry with a build manifest and a location
- [ ] The account, message, post and moderation requirements are in the requirement register
- [ ] It is presented as an OS app, not as IDE functionality

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

### ⬜ TODO-STR-005 — Delete the archived predecessor repositories once the absorption is verified

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** owner-direction — The owner's instruction of 2026-10-20

The predecessor repositories have been archived on GitHub, which takes them out of the active list and keeps the history. The owner's direction is that the obsolete repositories are removed. Archiving was done instead of deleting because deletion cannot be undone, and the absorption has not yet been verified for each one. The deletion waits until it has.

Evidence:

```
The owner's instruction of 2026-10-20: old failed predecessors will be absorbed by the new working project and the obsolete repositories will be removed. aetherial, Quantum-OS, QVA-merged, Veyra and aetherium are archived as of that date, each with an ABSORBED.md in its history.
```

Acceptance:

- [ ] Each absorbed predecessor's capability is accounted for in the replacement
- [ ] The owner confirms each repository before it is deleted
- [ ] The deletion is recorded in the programme catalogue

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

### ⬜ TODO-AETHERIUS-OS-PROTO-010 — Build the missing aetherius-os-prototype capabilities

- **Project:** aetherius-os-prototype
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-os-prototype was checked against the capability set for its family and 8 of 8 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-WORLDCASS-PROTO-010 — Build the missing aetherius-os-worldclass-prototype capabilities

- **Project:** aetherius-os-worldclass-prototype
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

aetherius-os-worldclass-prototype was checked against the capability set for its family and 18 of 18 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008); Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-AB-012 — Ten of the Bridge's failing tests depend on the local model set or on a tool that is not installed

- **Project:** agent-bridge
- **Status:** OPEN
- **Source:** build-gate — Agent-Bridge test suite, 2026-10-21

The Bridge's suite assumes a model set the machine does not have and a toolchain that is not installed. Three tests fail because the model the local runtime serves is not the one the test asks for, four fail because the model runtime answers HTTP 400 for the request, and three fail because a tool the probe looks for is not on the machine. A test that asserts about a particular model is a test about the machine, not only about the code, and it should say which model it needed and what it found.

Evidence:

```
test_context_length_is_discovered, test_llama32_declares_tools and test_live_rotation_granite_to_qwen fail identically in a clean checkout. test_solo_baseline_runs, test_team_costs_more_than_solo and test_comparison_reports_both_modes error with OllamaRequestError: HTTP 400. test_opencode_probe_reports_version fails because the tool is not on the machine. The model runtime here serves granite3.3, granite4, qwen3, qwen3.5, ministral-3, nomic-embed-text, moondream, local-qwen3 and hhao/qwen2.5-coder-tools, and the tests assume a different set.
```

Acceptance:

- [ ] A test that needs a particular model says which one, and what it found instead
- [ ] A test that needs a tool says so when the tool is absent, rather than failing obscurely
- [ ] The suite passes on the machine the owner actually has

### ✅ TODO-IED-104 — The Bridge logs a full traceback every time the browser abandons a request

- **Project:** agent-bridge
- **Status:** DONE
- **Source:** owner-inspection — Agent-Bridge/service.py, 2026-10-21

A browser that navigates away mid-request makes the Bridge's write fail with ConnectionAbortedError, and the Bridge printed the whole traceback for it. During ordinary use this produced thousands of lines, which buries the real errors in the log and makes the log unreadable when something actually has gone wrong. The fix has to be narrow: a client that has gone away is not a server error, but a fault in the service is, and it must still be reported.

Evidence:

```
The Bridge's output during one session of ordinary IDE polling was 3712 lines, the majority of them ConnectionAbortedError tracebacks from abandoned requests.
```

Resolution:

Resolved 2026-10-21. The handler now catches the three ways a client can disappear, and closes the connection without complaint. A genuine fault still propagates and is still reported, which is the line that matters: a swallowed real error would be worse than the noise. Two tests in tests/test_service_abandoned_connections.py cover it, and they were checked against the unfixed service, where they fail with the traceback they are meant to prevent.

Acceptance:

- [ ] A request abandoned by the client is not logged as an error
- [ ] A genuine server-side failure is still logged in full
- [ ] The log holds one line per real event

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

### ⬜ TODO-AGENT-BRIDGE-DASHBOARD-010 — Build the missing Agent-Bridge-dashboard capabilities

- **Project:** agent-bridge-dashboard
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-dashboard was checked against the capability set for its family and 18 of 18 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-AGENT-BRIDGE-RUNTIMESAFETY-010 — Build the missing Agent-Bridge-runtimesafety capabilities

- **Project:** agent-bridge-runtimesafety
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Agent-Bridge-runtimesafety was checked against the capability set for its family and 18 of 18 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Local runtime (LOC-001); Local model inference (LOC-002); Offline caching (LOC-003); Local data store (LOC-004); Device access (LOC-005); Resource scheduling (LOC-006); Local installation (LOC-007); Update mechanism (LOC-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-IED-105 — The broken 9-byte GPT4All installer on the external drive

- **Project:** ai-digital-twin
- **Status:** OPEN
- **Source:** owner-inspection — E:\external drive\AI Digital Twin\installers\model-runners\GPT4All-v3.10.0-Win64.exe, 2026-10-21

The file named GPT4All-v3.10.0-Win64.exe is 9 bytes long. It is not a truncated download, it is a text file, and it cannot be installed. GPT4All is one of the local model runners the owner's material refers to, so the file is a reference point that does not work.

Evidence:

```
The file is 9 bytes. Every other file in the same folder is a real installer, and Jan-v0.7.7-Win64.exe beside it is 52,689,912 bytes.
```

Acceptance:

- [ ] The file is either replaced with a working installer or removed
- [ ] The reference to GPT4All in the owner's material is corrected if the runner is not available

### ⬜ TODO-ARCH-SHADOWS-010 — Build the missing Architecture of Shadows Book capabilities

- **Project:** architecture-of-shadows-book
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Architecture of Shadows Book was checked against the capability set for its family and 7 of 7 were not found in its own source. The missing ones are: Ingest (KNW-001); Structure and categorisation (KNW-002); Link graph (KNW-003); Search (KNW-004); Source citation (KNW-005); Versioning (KNW-006); Publication (KNW-007).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-ATHENA-010 — Build the missing Athena capabilities

- **Project:** athena
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Athena was checked against the capability set for its family and 10 of 10 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-CROSSPLATFORM-010 — Build the missing Crossplatform---multiplatform capabilities

- **Project:** crossplatform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Crossplatform---multiplatform was checked against the capability set for its family and 12 of 12 were not found in its own source. The missing ones are: Command line entry point (TLS-001); Configuration (TLS-002); Structured output (TLS-003); Testing (TLS-004); Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-DECENTRALIZED-MESSAGING-010 — Build the missing Decentralized Messaging App capabilities

- **Project:** decentralized-messaging-app
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Decentralized Messaging App was checked against the capability set for its family and 9 of 9 were not found in its own source. The missing ones are: Realtime delivery (COM-101); Message store (COM-102); Presence (COM-103); Notification delivery (COM-104); Rich media messages (COM-105); Voice and video (COM-106); Email integration (COM-107); Encryption of messages (COM-108); Federation between servers (COM-109).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-FOOD-WIKI-010 — Build the missing Food Wiki App capabilities

- **Project:** food-wiki-app
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Food Wiki App was checked against the capability set for its family and 15 of 15 were not found in its own source. The missing ones are: Ingest (KNW-001); Structure and categorisation (KNW-002); Link graph (KNW-003); Search (KNW-004); Source citation (KNW-005); Versioning (KNW-006); Publication (KNW-007); Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-FOOTBALL-CARD-GAME-010 — Build the missing football-card-game capabilities

- **Project:** football-card-game
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

football-card-game was checked against the capability set for its family and 12 of 12 were not found in its own source. The missing ones are: Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008); Command line entry point (TLS-001); Configuration (TLS-002); Structured output (TLS-003); Testing (TLS-004).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 95 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-GENESIS-010 — Build the missing Genesis capabilities

- **Project:** genesis
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Genesis was checked against the capability set for its family and 18 of 18 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-HOLONAV-OS-010 — Build the missing holonav-os capabilities

- **Project:** holonav-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

holonav-os was checked against the capability set for its family and 16 of 16 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008); Local runtime (LOC-001); Local model inference (LOC-002); Offline caching (LOC-003); Local data store (LOC-004); Device access (LOC-005); Resource scheduling (LOC-006); Local installation (LOC-007); Update mechanism (LOC-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-IDE-WORKSPACE-010 — Build the missing IDE-Workspace capabilities

- **Project:** ide-workspace
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

IDE-Workspace was checked against the capability set for its family and 8 of 8 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ✅ TODO-IED-001 — Stop tracking a file inside node_modules

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** build-audit — git status, 2026-10-20

The whole dependency tree was tracked, not one file. The ignore rules for node_modules and dist were already in place, but the files had been added before the rules existed and Git keeps tracking a file that is already tracked, so the rules never took effect on them. The tracked build output was worse than merely redundant: the tracked dist/index.html referenced assets that the ignore rules kept out of the repository, so a clone of the repository held a page that could not load.

Evidence:

```
git status --porcelain -> "M workspace/app/node_modules/.package-lock.json"
```

Resolution:

Resolved 2026-10-21. The ignore rules were already correct, but the files had been tracked before the rules existed, and Git keeps tracking a file that is already tracked. So 4715 dependency files and the build output were still in the repository, and the tracked dist/index.html pointed at assets that were not in the repository. Untracking both left the files on disk, so the build and the suite were unaffected, and the repository now carries 249 source files rather than 4964. The build passes and the suite passes: 28 files, 466 tests.

Acceptance:

- [ ] No file under node_modules is tracked
- [ ] No build output is tracked
- [ ] The ignore rules cover both
- [ ] The build and the suite still pass after the change

### ✅ TODO-IED-002 — Clear the duplicated proof scripts from the dashboard tree

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** build-audit — IDE-Workspace-dashboard root listing, 2026-10-20

The same loose proof scripts present in IDE-Workspace are duplicated in this tree.

Evidence:

```
Root listing matches IDE-Workspace's root listing: fix_report.py, run_cpp_proof.py, run_flaky_test.py, and the rest.
```

Resolution:

Resolved 2026-10-20. The supervisor dashboard was a branch of IDE-Workspace, not a separate project, and it has been dissolved into IDE-Workspace. The duplicated proof scripts went with the tree, and the work the dashboard carried that was not yet in master is now in master.

Acceptance:

- [ ] The duplicated scripts are removed or the duplication is deliberate and recorded

### ✅ TODO-IED-003 — Reconcile the dashboard tree with its parent project

- **Project:** ide-workspace
- **Status:** DONE
- **Source:** build-audit — git status and branch survey, 2026-10-20

This tree and IDE-Workspace have diverged with no recorded merge strategy, so dashboard changes are not automatically reflected in the parent project. The m3 read model exists only here.

Evidence:

```
Branch unit/supervisor-dashboard-ui; the supervisor read model at workspace/app/src/supervisor-ui/components/m3-readmodel.ts exists only in this tree.
```

Resolution:

Resolved 2026-10-20. The dashboard tree and its parent project have been reconciled by dissolving the tree: IDE-Workspace is one project on master, and the supervisor UI it carries is the supervisor UI the master branch already held. The branch unit/supervisor-dashboard-ui remains in the repository and on the remote, so nothing was lost.

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

### ⬜ TODO-MAT-011 — Take MAT element data from CERN and the other science institutes

- **Project:** mat
- **Status:** OPEN
- **Source:** conversation-history — OWNER-DIRECTIVES.yaml ASK-13, thread 01a0ed79

The owner asked for MAT to take data and research from CERN and the other science institutes and governing bodies, so that MAT can be used to prove or disprove theories and facts. The source-quality rule applies: the value must be source-backed and recorded with its provenance, and UNKNOWN or INSUFFICIENT DATA is preferred to a fabricated number.

Evidence:

```
"Also take data and research from CERN and other science institutes and governing bodies. So MAT can be used to prove or disprove theories, principals, facts, others, etc"
```

Acceptance:

- [ ] The institute sources are recorded with their accessions and provenance
- [ ] No value is added without a source

### ⬜ TODO-MAT-012 — Rebuild the MAT acceptance rating only after the browser suite refreshes

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

### ⬜ TODO-NICHE-PLATFORM-010 — Build the missing Niche_platform capabilities

- **Project:** niche-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Niche_platform was checked against the capability set for its family and 16 of 16 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008); Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 153 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-POI-003 — Add the MPC-style sample record and recall button to Poietek

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — OWNER-DIRECTIVES.yaml ASK-10, thread 01a02943

The owner asked for a sample record and a recall button, in the style of the MPC sample, which is the reference the Poietek work was compared against. The conversation is a specific, concrete ask against a named reference implementation.

Evidence:

```
"Add a sample record and recall button." and "like the mpc samle, add a sample record and recall button, that allows"
```

Acceptance:

- [ ] A sample record can be created and recalled in the Poietek workflow
- [ ] The behaviour matches the reference the owner named

### ⬜ TODO-POI-015 — Apply the repository rule to the first-party audio repositories

- **Project:** poietek
- **Status:** OPEN
- **Source:** conversation-history — MASTER-HANDOFF-Poietek-Audio-Ecosystem.md sections 1, 15, 70, 71, 72

Every substantial independently maintainable first-party component normally receives its own repository, with a meaningful independent lifecycle, and the default visibility for a new first-party repository is PRIVATE unless the owner explicitly approves a public release. Neither one giant Poietek monorepo nor a repository per preset is correct. The master names candidates: poietek-core, poietek-audio-engine, poietek-midi-engine, poietek-mixer, poietek-routing, poietek-timeline, poietek-piano-roll, poietek-clip-launcher, poietek-sampler, poietek-drum-machine, poietek-synth-core, poietek-plugin-host, poietek-plugin-sdk, poietek-plugin-lab, poietek-score, poietek-mastering, poietek-podcast, poietek-live, plus one repository per substantial effect and instrument. They are candidates for a boundary review, not repositories to be created empty.

Evidence:

```
"Every substantial independently maintainable first-party ... should normally receive its OWN repository. Do NOT create one giant Poietek monorepo containing every product." and "Default for new first-party repositories: VISIBILITY = PRIVATE unless Jonathan explicitly approves public release. Public release remains an OWNER GATE." and "Do not create all empty repos before architectural review. Create/register them as CANDIDATES first."
```

Acceptance:

- [ ] Each candidate has a recorded boundary review before any repository is created
- [ ] No new public repository is created without the owner's explicit approval

### ⬜ TODO-POIETEK-010 — Build the missing Poietek capabilities

- **Project:** poietek
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Poietek was checked against the capability set for its family and 9 of 9 were not found in its own source. The missing ones are: Audio engine (CRE-001); MIDI (CRE-002); Plugin host (CRE-003); Plugin SDK (CRE-004); Timeline and arrangement (CRE-005); Mixer and routing (CRE-006); Sampler and instruments (CRE-007); Export and rendering (CRE-008); Scoring and notation (CRE-009).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-QUANTUM-AI-ASSISTANT-010 — Build the missing quantum-ai-assistant capabilities

- **Project:** quantum-ai-assistant
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

quantum-ai-assistant was checked against the capability set for its family and 10 of 10 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-QUANTUM-OS-010 — Build the missing Quantum-OS capabilities

- **Project:** quantum-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Quantum-OS was checked against the capability set for its family and 8 of 8 were not found in its own source. The missing ones are: Runtime or kernel (PLT-001); Module system (PLT-002); Isolation between parts (PLT-003); User interface shell (PLT-004); Extension system (PLT-005); Configuration management (PLT-006); Observability (PLT-007); Distribution and packaging (PLT-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-QVA-MERGED-010 — Build the missing QVA-merged capabilities

- **Project:** qva-merged
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

QVA-merged was checked against the capability set for its family and 27 of 27 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Chain runtime or node (BC-001); Smart contracts (BC-002); Token or asset standard (BC-003); Wallet and key custody (BC-004); Transaction history and state (BC-005); Fees or gas (BC-006); Bridges and oracles (BC-007); Auditable history (BC-008); Schema definition (DB-001); Migrations (DB-002); Query layer (DB-003); Indexing (DB-004); Transactions (DB-005); Backup and restore (DB-006); Replication and scaling (DB-007); Connection management (DB-008); Database observability (DB-009).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 21 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-SELF-BUILDING-AI-010 — Build the missing self-building-ai capabilities

- **Project:** self-building-ai
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

self-building-ai was checked against the capability set for its family and 10 of 10 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 17 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-SOVEREIGN-FINANCIAL-OS-010 — Build the missing sovereign-financial-os capabilities

- **Project:** sovereign-financial-os
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

sovereign-financial-os was checked against the capability set for its family and 26 of 26 were not found in its own source. The missing ones are: Accounting and double-entry ledger (FIN-001); Invoicing (FIN-002); Payment handling (FIN-003); Budgeting (FIN-004); Markets and trading (FIN-005); Tax handling (FIN-006); Financial reporting (FIN-007); Reconciliation (FIN-008); Risk and compliance controls (FIN-009); Chain runtime or node (BC-001); Smart contracts (BC-002); Token or asset standard (BC-003); Wallet and key custody (BC-004); Transaction history and state (BC-005); Fees or gas (BC-006); Bridges and oracles (BC-007); Auditable history (BC-008); Schema definition (DB-001); Migrations (DB-002); Query layer (DB-003); Indexing (DB-004); Transactions (DB-005); Backup and restore (DB-006); Replication and scaling (DB-007); Connection management (DB-008); Database observability (DB-009).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-PUB-001 — Make the Sifdat trading bot repository public

- **Project:** trading-bot
- **Status:** OPEN
- **Source:** owner-direction — owner instruction, 2026-10-20

The trading bot lives on the Sifdat account, which the owner holds, and it is private. Every other first-party repository is public, so that an external agent can read it without special access, and this one is the exception. Changing a repository's visibility needs administrative rights on the account that holds it, and the token this session authenticates with can read the repository but not administer it, so the change is the owner's to make.

Evidence:

```
The API answers a read of the repository and refuses a PATCH of its visibility with HTTP 404, which is what a missing administrative right looks like. The repository is Sifdat/Multi-Cross-Platform-Trading-Bot, published under CC0-1.0.
```

Acceptance:

- [ ] The repository is public
- [ ] Every first-party repository is public

### ⬜ TODO-TRADING-BOT-010 — Build the missing Multi-Cross-Platform-Trading-Bot capabilities

- **Project:** trading-bot
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Multi-Cross-Platform-Trading-Bot was checked against the capability set for its family and 9 of 9 were not found in its own source. The missing ones are: Accounting and double-entry ledger (FIN-001); Invoicing (FIN-002); Payment handling (FIN-003); Budgeting (FIN-004); Markets and trading (FIN-005); Tax handling (FIN-006); Financial reporting (FIN-007); Reconciliation (FIN-008); Risk and compliance controls (FIN-009).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-VEYRA-010 — Build the missing Veyra capabilities

- **Project:** veyra
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Veyra was checked against the capability set for its family and 10 of 10 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-VIRTUAL-ASSISTANT-010 — Build the missing VirtualAssistant capabilities

- **Project:** virtual-assistant
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

VirtualAssistant was checked against the capability set for its family and 19 of 19 were not found in its own source. The missing ones are: Model routing across providers (INT-001); Tool execution (INT-002); Planning and decomposition (INT-003); Working memory and context (INT-004); Long term memory (INT-005); Multi agent coordination (INT-006); Authority and permissions (INT-007); Durable task state (INT-008); Evaluation and benchmarking (INT-009); Local and offline model (INT-010); Realtime delivery (COM-101); Message store (COM-102); Presence (COM-103); Notification delivery (COM-104); Rich media messages (COM-105); Voice and video (COM-106); Email integration (COM-107); Encryption of messages (COM-108); Federation between servers (COM-109).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 0 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

### ⬜ TODO-WEB-PLATFORM-010 — Build the missing Web-platform capabilities

- **Project:** web-platform
- **Status:** OPEN
- **Source:** programme-gap-analysis — Aetherius-OS/docs/PROGRAMME-GAP-ANALYSIS.yaml

Web-platform was checked against the capability set for its family and 49 of 49 were not found in its own source. The missing ones are: Product catalogue (COM-001); Cart (COM-002); Checkout (COM-003); Order management (COM-004); Payments integration (COM-005); Inventory and stock (COM-006); Pricing and discounts (COM-007); Subscriptions (COM-008); Seller or merchant dashboard (COM-009); Tax and shipping calculation (COM-010); Reviews and ratings (COM-011); Order tracking and fulfilment (COM-012); Course management (EDU-001); Lesson content delivery (EDU-002); Quizzes and assessment (EDU-003); Progress tracking (EDU-004); Certificates (EDU-005); Enrolment and cohorts (EDU-006); Course payments (EDU-007); Gamification (EDU-008); Discussion forums (EDU-009); Learning analytics (EDU-010); User profiles (SOC-001); Feed (SOC-002); Connections and follower graph (SOC-003); Post composer (SOC-004); Comments and replies (SOC-005); Likes and reactions (SOC-006); Direct messaging (SOC-007); Media upload (SOC-008); Notifications (SOC-009); Moderation (SOC-010); Groups and communities (SOC-011); Chain runtime or node (BC-001); Smart contracts (BC-002); Token or asset standard (BC-003); Wallet and key custody (BC-004); Transaction history and state (BC-005); Fees or gas (BC-006); Bridges and oracles (BC-007); Auditable history (BC-008); Application shell and navigation (APP-001); Session state management (APP-002); Offline behaviour and sync (APP-003); Push notification delivery (APP-004); Account and sign-in (APP-005); User preferences and settings (APP-006); Accessibility (APP-007); Packaging and distribution (APP-008).

Evidence:

```
The capability search terms are in tools/programme_capabilities.py and the search was run over 52 own source files.
```

Acceptance:

- [ ] Each missing capability is present in the source
- [ ] Each capability that is present is recorded in PROGRAMME-CATALOGUE.yaml

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

### ⬜ TODO-SRC-005 — Read the last five ChatGPT conversations the API rate-limited

- **Project:** aetherius-os
- **Status:** OPEN
- **Source:** conversation-corpus — tools/read_conversations_about.py, 2026-10-20

The owner's ChatGPT account holds two hundred and twenty conversations. Two hundred and fifteen were read through the API and are in research/chatgpt-all-conversations.json, carrying twenty-nine thousand nine hundred and twenty-eight turns and eleven thousand nine hundred and sixty of the owner's own messages across ten projects. Five kept answering with a rate-limit error however slowly they were asked for. They are the only part of the account that has not been read.

Evidence:

```
The fetch was paced at one conversation every few seconds with a pause before each attempt, and the last five still answered HTTP 429 on 2026-10-20.
```

Acceptance:

- [ ] The remaining conversations are read and added to the corpus
- [ ] The conversation corpus digest is regenerated

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
