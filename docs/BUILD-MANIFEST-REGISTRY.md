# Build Manifest Registry — Workspace Build Report

> Generated from `docs/BUILD-MANIFEST-REGISTRY.yaml` and each
> project's own `build.yaml`. Do not hand-edit this file.

- Projects: **17**
- States: VERIFIED 8 · PARTIAL 5 · NOT_STARTED 4
- Source date: 2026-10-20

## Build order

Dependencies first. A project that depends on another cannot be
finished before it.

```
 1. genesis                      🟢 VERIFIED
 2. agent-bridge                 ⚠️ PARTIAL  (needs: genesis)
 3. ide-workspace                🟢 VERIFIED  (needs: agent-bridge, genesis)
 4. mat                          🟢 VERIFIED  (needs: genesis)
 5. universal-bridge             🟢 VERIFIED
 6. poietek                      🟢 VERIFIED  (needs: universal-bridge)
 7. aetherius-os                 🟢 VERIFIED  (needs: agent-bridge, genesis, ide-workspace, mat, poietek, universal-bridge)
 8. agent-bridge-cloudhybrid     ⚠️ PARTIAL  (needs: agent-bridge, genesis)
 9. agent-bridge-dashboard       ⚠️ PARTIAL  (needs: agent-bridge, ide-workspace)
10. agent-bridge-runtimesafety   ⚠️ PARTIAL  (needs: agent-bridge, genesis)
11. architecture-of-shadows-book ❌ NOT_STARTED
12. athena                       ❌ NOT_STARTED
13. decentralized-messaging-app  ❌ NOT_STARTED
14. food-wiki-app                ❌ NOT_STARTED
15. hermes-config-audit          🟢 VERIFIED  (needs: agent-bridge)
16. ide-workspace-dashboard      ⚠️ PARTIAL  (needs: agent-bridge, genesis, ide-workspace)
17. ledgerlands                  🟢 VERIFIED  (needs: aetherius-os, agent-bridge)
```

## Projects

| Project | State | Type | Branch | Build system | Depends on |
|---|---|---|---|---|---|
| Genesis | 🟢 VERIFIED | library | main | cmake/ninja | - |
| Agent-Bridge | ⚠️ PARTIAL | library | main | python/pytest | genesis |
| IDE-Workspace | 🟢 VERIFIED | application | master | npm/vite/pytest | genesis, agent-bridge |
| Materials Atlas Table Codex | 🟢 VERIFIED | tool | main | node/scripts | genesis |
| Universal-Bridge | 🟢 VERIFIED | application | develop/v0.5-production-foundation | cmake/ninja | - |
| Poietek | 🟢 VERIFIED | application | refactor/architecture-foundation | npm/vite/tauri | universal-bridge |
| Aetherius-OS | 🟢 VERIFIED | application | master | npm/vite | genesis, agent-bridge, ide-workspace, mat, poietek, universal-bridge |
| Agent-Bridge (cloud-hybrid runtime) | ⚠️ PARTIAL | library | unit/cloud-hybrid-runtime | python/pytest | agent-bridge, genesis |
| Agent-Bridge (supervisor UI / worker telemetry) | ⚠️ PARTIAL | application | unit/external-worker-telemetry | python/pytest | agent-bridge, ide-workspace |
| Agent-Bridge (runtime safety) | ⚠️ PARTIAL | library | unit/runtime-safety-fixes | python/pytest | agent-bridge, genesis |
| Architecture of Shadows Book | ❌ NOT_STARTED | dataset | - | none | - |
| Athena | ❌ NOT_STARTED | application | - | none | - |
| Decentralized Messaging App | ❌ NOT_STARTED | application | - | none | - |
| Food Wiki App | ❌ NOT_STARTED | application | - | none | - |
| Hermes-Config-Audit | 🟢 VERIFIED | configuration | - | none | agent-bridge |
| IDE-Workspace (supervisor dashboard) | ⚠️ PARTIAL | application | unit/supervisor-dashboard-ui | npm/vite/pytest | ide-workspace, genesis, agent-bridge |
| LedgerLands | 🟢 VERIFIED | application | - | npm/workspaces | aetherius-os, agent-bridge |

## Known issues

### Genesis

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The unlicensed OmniAgent source is untracked and the Aetherius-OS guard proves it, but this repository's own … | OPEN | TODO-ARC-002 |
| 🟡 medium | The V0 directive gap analysis records a large set of unimplemented stages, and the organism is still missing … | OPEN | TODO-GEN-003 |
| ⚪ low | Local commits to main are blocked by an environment deny-rule, so the verified work exists only on this machi… | ACCEPTED | TODO-GEN-004 |

### Agent-Bridge

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Neither verification path completes in a practical window on this host. Five test files spawn external proces… | OPEN | TODO-AB-001 |
| 🟡 medium | Around sixty one-off analysis and classification scripts sit at the repository root, many of which read machi… | OPEN | TODO-AB-002 |
| 🟠 high | The repository governance work is only partly closed. 4,066 UNKNOWN requirements were flagged for reconciliat… | OPEN | TODO-AB-003 |
| 🟡 medium | Sixty-three PARTIAL_REUSE forks are recorded as accounted for but not yet dispositioned with a concrete reuse… | OPEN | TODO-AB-004 |
| ⚪ low | Commits to main are blocked by an environment deny-rule, so verified work exists only on this machine. | ACCEPTED | TODO-AB-005 |

### IDE-Workspace

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The Python bridge integration tests were not exercised in this verification pass, so the front end and the br… | OPEN | TODO-IDE-001 |
| 🟡 medium | The test suite is timing-sensitive under CPU contention on this four-core host, so it is green when run alone… | OPEN | TODO-IDE-004 |
| 🟡 medium | Around thirty loose proof and fix scripts sit at the repository root and in workspace/, many of them one-off … | OPEN | TODO-IDE-002 |
| ⚪ low | The repository root contains committed test artefacts (test.txt, test_output.txt, field_output.json, audit_re… | OPEN | TODO-IDE-003 |

### Materials Atlas Table Codex

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The working tree carries 1,236 modified or untracked files on main, with no clear separation between generate… | OPEN | TODO-MAT-001 |
| ⚪ low | The asset validator reports forty warnings, all of the same shape: a structured record's table file exists on… | OPEN | TODO-MAT-009 |
| 🟡 medium | Generated book output and source records are mixed in the same directories, so a clean build cannot be distin… | OPEN | TODO-MAT-002 |
| ⚪ low | The studio has its own nested npm workspace and its own Playwright browser matrix, so the root verify command… | OPEN | TODO-MAT-003 |

### Universal-Bridge

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The build/ directory accumulates a growing set of sibling build trees, each with its own cache, and no record… | OPEN | TODO-UB-002 |
| ⚪ low | The VST3 client is experimental and off by default. It requires a separately obtained Steinberg SDK checkout … | ACCEPTED | TODO-UB-003 |

### Poietek

| Sev | Issue | Status | Todo |
|---|---|---|---|
| ⚪ low | The Tauri desktop packaging path was not exercised in this verification pass; only the web build and core tes… | OPEN | TODO-POI-001 |
| ⚪ low | The references/ directory is untracked on this branch and its intended content is not yet established. | OPEN | TODO-POI-002 |

### Aetherius-OS

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | Two tests are timing-sensitive under CPU contention on this host, so the suite is green when run alone and in… | OPEN | TODO-AOS-003 |
| 🟠 high | Twelve standing rules recovered from the owner's own conversations bind every change, and five of them have a… | OPEN | TODO-DIR-001 |
| 🟠 high | The repository was carrying about two gigabytes of research artefacts that had never been pushed, so no push … | OPEN | TODO-ARC-001 |
| 🟠 high | The installed application set is recorded but nothing decides what Aetherius has to be able to do with any of… | OPEN | TODO-APP-002 |
| 🔴 critical | The secret scan that found twelve live-looking OpenRouter keys in the conversation corpus is a one-off script… | OPEN | TODO-SEC-001 |
| 🟡 medium | Two hundred and fifteen of the three hundred and forty-four forked repositories name no capability axis, so t… | OPEN | TODO-REPO-002 |
| 🟡 medium | The source registry records that a document exists, but not what the registry of requirements and capabilitie… | OPEN | TODO-SRC-002 |
| 🟠 high | The C kernel's pure logic is written and proven, but the machine-level modules are not, so the UEFI kernel im… | OPEN | TODO-KRN-001 |
| 🟡 medium | The C kernel host suite is not part of the Aetherius-OS verify command, so a kernel change can land without i… | OPEN | TODO-KRN-006 |
| 🟡 medium | Four reserved project folders hold no content, so they are registered as placeholders rather than projects. E… | OPEN | TODO-WS-003 |

### Agent-Bridge (cloud-hybrid runtime)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| ⚪ low | uv.lock is present but untracked, so the dependency resolution this branch was developed against is not recor… | OPEN | TODO-ABCH-001 |
| 🟡 medium | The cloud-hybrid readiness work is recorded as an audit rather than a verified runtime, and the branch has di… | OPEN | TODO-ABCH-002 |

### Agent-Bridge (supervisor UI / worker telemetry)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The supervisor UI is assessed at level UI-F1 against a target of UI-F4. Twelve structural gaps are recorded, … | OPEN | TODO-ABD-001 |
| 🟡 medium | Twelve worker actions are referenced by the team room view, but only continue is live; the rest have no real … | OPEN | TODO-ABD-002 |
| 🟡 medium | Theme coverage for ABYSS, AURORA, EMBER, GRAPHITE and FROST is unproven on the new components. | OPEN | TODO-ABD-003 |
| ⚪ low | Eight working-tree paths are uncommitted, including the new telemetry screenshots and the agent portal config… | OPEN | TODO-ABD-004 |

### Agent-Bridge (runtime safety)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The runtime safety fixes on this branch are not yet reconciled with the parent project, so the same defect ma… | OPEN | TODO-ABRS-001 |
| 🟡 medium | The cloud/hybrid audit is recorded as resolved into fixed and remaining states, but the remaining states are … | OPEN | TODO-ABRS-002 |

### Architecture of Shadows Book

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope, no outline, no format decision and no authoring pipeline. | OPEN | TODO-AOSB-001 |

### Athena

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope. Without a stated purpose the folder can only be classified, not worked. | OPEN | TODO-ATH-001 |
| ⚪ low | The scope for Athena is recoverable from a ChatGPT project of the same name, which holds an "Athena Project R… | OPEN | TODO-ATH-002 |

### Decentralized Messaging App

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope, no transport decision, and no threat model. A decentralized messaging appl… | OPEN | TODO-DMA-001 |

### Food Wiki App

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope and no implementation. The only artefact is an empty design directory. | OPEN | TODO-FWA-001 |
| ⚪ low | The design directory name is misspelled ("Desisgn"). If the directory is ever renamed it should be done befor… | OPEN | TODO-FWA-002 |

### Hermes-Config-Audit

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Four provider credentials were exposed through earlier chat transcripts and are recorded as MISSING pending o… | OPEN | TODO-HCA-001 |
| 🟡 medium | The configured default model upstage/solar-pro4:free is no longer available at no cost, so the active profile… | OPEN | TODO-HCA-002 |
| 🟡 medium | Hermes cannot use the local Ollama models: the OpenAI-compatible client SDK requires an API key string even a… | OPEN | TODO-HCA-003 |
| ⚪ low | This audit tree is not a git repository, so its history is not tracked and cannot be diffed against a prior s… | OPEN | TODO-HCA-004 |

### IDE-Workspace (supervisor dashboard)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | A file inside node_modules is tracked, which means the dependency tree is partially committed. | OPEN | TODO-IED-001 |
| 🟡 medium | The same loose proof scripts and committed test artefacts present in IDE-Workspace are duplicated here. | OPEN | TODO-IED-002 |
| 🟡 medium | This tree and IDE-Workspace have diverged with no recorded merge strategy, so dashboard changes are not autom… | OPEN | TODO-IED-003 |

### LedgerLands

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🔴 critical | TypeScript 7 removed the baseUrl compiler option and the shared base config still uses it, so every workspace… | OPEN | TODO-LL-001 |
| ⚪ low | The npm install reports that three packages have install scripts not covered by allowScripts, so the esbuild … | OPEN | TODO-LL-008 |
| 🟠 high | The active phase is LL-P2 persistence: the in-memory MatchStore has not been replaced with a PostgreSQL repos… | OPEN | TODO-LL-003 |
| 🟡 medium | The repository has never been pushed, so none of the verified work exists outside this machine. | OPEN | TODO-LL-006 |
| 🟡 medium | Three related trees are present (crypto-property-game-mvp, LedgerLands-Aetherius-App-Repo, LedgerLands-source… | OPEN | TODO-LL-005 |

## Verified state per project

### Genesis

The canonical build tree configures, compiles and passes. 119 build steps and 22 registered CTest gates, of which all 22 pass. The stale CMake cache that blocked every configure attempt has been discarded and the tree reconfigured at its current location.

Evidence:

- cmake -S . -B build -G Ninja -> Configuring done (16.3s), Generating done
- cmake --build build -> 119/119 targets built and linked
- ctest --test-dir build --output-on-failure -> 22/22 tests passed, 184.98s
- tools/validate_repository_content.ps1 -> passed: 609 canonical files, 92754727 bytes, 553 text files, 54 images
- tools/test_repository_content_inventory.ps1 -> passed: 609 tracked files, untracked files ignored, deterministic ordering
- CMakePresets.json local-release -> generator MinGW Makefiles, binaryDir ${sourceDir}/build

Commands: `configure` · `build` · `test` · `verify` · `clean`

### Agent-Bridge

The fast verification path (pytest with the slow marker deselected) is the supported gate; the full suite includes a mutation proof that copies the repository 23 times and takes roughly 35-40 minutes on this host. The repository also carries a large amount of one-off analysis scripts at its root that are not part of the runtime and are not covered by the test suite.

Evidence:

- pyproject.toml [tool.agent-bridge] test_command = python -m unittest discover -s tests -p test_*.py
- pyproject.toml [tool.pytest.ini_options] markers: slow = long-running verification (mutation proof); deselect with -m 'not slow'
- git status --porcelain -> clean working tree on branch main
- 2026-10-20: python -m pytest tests -m 'not slow' -q did not terminate within a 15 minute window on this host

Commands: `install` · `test` · `test-full` · `test-unittest` · `verify` · `secret-scan`

### IDE-Workspace

The front end typechecks, builds and passes its whole test suite: 466 tests across 28 files, 42 seconds. The Python bridge layer under workspace/integration was not exercised in this pass.

Evidence:

- npm run build (workspace/app) -> tsc --noEmit clean; vite v6.4.3 built 78 modules in 3.77s
- npm run build produced: index.html, supervisor-ui.html, genesis-ui.html, supervisor-m2.html, client-D6S-fLKS.js (223.82 kB)
- npm test (workspace/app) -> 28 files passed, 466 tests passed, 0 failed, 42.40s
- vitest.config.ts: environment jsdom, testTimeout 15000, include src/**/*.test.{ts,tsx}

Commands: `install` · `build` · `test` · `test-bridge` · `test-all` · `dev`

### Materials Atlas Table Codex

The validation toolchain and the core test suite both pass. 305 tests across 6 suites, 0 failures, 184 seconds. The full validate command passes with 0 errors and 40 warnings. The working tree is the larger issue: 1,236 files are modified or untracked on branch main.

Evidence:

- npm run validate -> VALIDATE: all suites pass; validate:assets 0 error(s), 40 warning(s); validate:links, validate:ids and validate:booksync all 0 errors
- npm test -> 305 tests, 305 pass, 0 fail, 0 skipped, 183628ms
- git status --porcelain -> 1236 changed files on branch main
- package.json declares 58 scripts across validate:, build:, sync:, audit: and test: families

Commands: `install` · `validate` · `test` · `build` · `build-studio` · `verify` · `preview`

### Universal-Bridge

The build tree configures, compiles and passes. 41 build steps and all 11 registered CTest gates pass, including the offline Python gates that check generated outputs, the research catalogue, the repository assets and the release-gate manifest. The stale caches that blocked every configure attempt have been discarded and the tree reconfigured at its current location.

Evidence:

- cmake -S . -B build -G Ninja -> Configuring done (92.0s), zlib and nlohmann_json re-fetched by pinned SHA256
- cmake --build build -> 41/41 targets built and linked
- ctest --test-dir build --output-on-failure -> 11/11 tests passed, 30.67s
- gates: virtual_hardware_laboratory, deterministic_core_stress, read_only_device_inventory, service_diagnostic_startup, authenticated_local_ipc, bridge_demo_preflight, bridge_invalid_daw, generated_output_validation, research_catalog_validation, repository_asset_validation, release_gate_manifest_validation

Commands: `configure` · `build` · `test` · `verify` · `clean`

### Poietek

The core typecheck passes with no diagnostics and the full test suite passes: 384 tests, 0 failures, 0 skipped, 8.66s. The web build path is the verified surface; the Tauri desktop build was not exercised in this pass because it needs the Rust toolchain and a longer build.

Evidence:

- npm run typecheck:core -> exit 0, no diagnostics
- npm test -> 384 tests, 384 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, 8664ms
- npm test -> typecheck:core && node ./scripts/prepare-core-tests.mjs && node --test tests/*.test.js

Commands: `install` · `typecheck` · `test` · `build` · `verify` · `build-desktop` · `dev`

### Aetherius-OS

Typecheck, build and the full test suite are clean. 1,800 tests across 100 files, all passing, in 32 seconds. The five failures the audit started with are resolved: the stale project list and the two stray root documents, the unlicensed third-party source tracked in Genesis, and the HTTP bridge transport timing artefact.

Evidence:

- npm run typecheck -> exit 0, no diagnostics
- npm test -> 1800 passed / 0 failed / 1800 total, 32.40s, 100 files
- docs/workspace-hygiene.test.ts -> 13 of 13 pass
- docs/omniagent-reference.provenance.test.ts -> 11 of 11 pass
- src/programme/ -> 470 tests pass, including the build manifest gate, the gap analysis gate, the source registry coverage gate and the report sync gates
- native/kernel host suite -> 126 checks, 0 failures

Commands: `install` · `typecheck` · `build` · `test` · `verify` · `source-registry` · `kernel-test` · `dev` · `registry-validate`

### Agent-Bridge (cloud-hybrid runtime)

Same v0.8.1 core and same verification surface as the parent Agent-Bridge project, on a branch that adds the cloud-hybrid runtime readiness audit. The branch carries one untracked file, uv.lock, whose resolution is not yet established.

Evidence:

- pyproject.toml -> name agent-bridge, version 0.8.1, requires-python >=3.13
- git log -1 -> d0219ea docs: Genesis Local/Cloud/Hybrid runtime readiness audit (reconciliation unit)
- git status --porcelain -> ?? uv.lock

Commands: `install` · `test` · `verify` · `test-unittest`

### Agent-Bridge (supervisor UI / worker telemetry)

The runtime verification surface matches the parent project. The branch has eight changed or untracked paths, most of them supervisor UI work and new telemetry evidence, and the recorded M2 visual QA scorecard rates the UI at level UI-F1 against a target of UI-F4.

Evidence:

- git log -1 -> dc9d8d8 E2E-007+E2E-008+H02+H06 live acceptance: lifecycle evidence fusion, standing autonomous loop, nested-worker recall, contradictory-claims resolution
- git status --porcelain -> 8 changed paths: M ui/app.js, M ui/index.html, ?? ui/README.md, ?? ui/agent_portals.json, and 4 new screenshots under docs/screenshots/
- docs/SUPERVISOR_UI_M2_QA_AND_TASKS.md -> ASSESSED LEVEL UI-F1, target >= UI-F4

Commands: `install` · `test` · `verify` · `test-unittest`

### Agent-Bridge (runtime safety)

Same v0.8.1 core and same verification surface as the parent Agent-Bridge project. The working tree is clean, and the branch head is a documentation commit that resolves a cloud/hybrid audit by recording which states are fixed and which remain.

Evidence:

- git log -1 -> 7d24feb docs: Cloud/Hybrid audit RESOLUTION - fixed vs remaining states
- git status --porcelain -> clean working tree on branch unit/runtime-safety-fixes
- pyproject.toml -> name agent-bridge, version 0.8.1, requires-python >=3.13

Commands: `install` · `test` · `verify` · `test-unittest`

### Architecture of Shadows Book

The folder exists and is completely empty: zero files and zero subdirectories. There is nothing to build and no recorded intent for the book's scope or format.

Evidence:

- Folder survey: Architecture of Shadows Book -> 0 items total
- No git repository, no package.json, no README, no source

### Athena

The folder exists and is completely empty: zero files and zero subdirectories. There is nothing to build and no recorded intent for what Athena is meant to become.

Evidence:

- Folder survey: Athena -> 0 items total
- No git repository, no package.json, no README, no source

### Decentralized Messaging App

The folder exists and is completely empty: zero files and zero subdirectories. There is nothing to build and no recorded intent for what this application is meant to become.

Evidence:

- Folder survey: Decentralized Messaging App -> 0 items total
- No git repository, no package.json, no README, no source

### Food Wiki App

The folder contains one subdirectory, "AI System Desisgn for FaturaWiki", which is itself empty. There are no files, no build configuration and no source. The directory name carries a spelling error that has been carried with it.

Evidence:

- Folder survey: Food Wiki App -> 1 item, the directory 'AI System Desisgn for FaturaWiki', which is empty
- No git repository, no package.json, no README, no source

### Hermes-Config-Audit

A documentation project with no build. The nine audit documents are present and internally consistent with the Hermes environment gate report. The documents record credential NAMES only; no secret values were read, copied or logged, which is the standing rule for this tree.

Evidence:

- Folder contains AGENT_LIMITS.json, EVIDENCE_REGISTER.md, MODEL_ROLE_MATRIX.json, OWNER_MANUAL_SETUP.md, PLUGINS_AUDIT.md, PROVIDER_ROUTING_MATRIX.json, SETTINGS_AUDIT.md, SETTINGS_CHANGES.md, SETTINGS_MATRIX.md, TOOLS_AND_KEYS_AUDIT.md
- TOOLS_AND_KEYS_AUDIT.md: 'Rule honored: key NAMES only; no key values were read, copied, or logged.'

Commands: `inspect` · `inspect-auth` · `inspect-routing` · `inspect-moat`

### IDE-Workspace (supervisor dashboard)

This tree mirrors IDE-Workspace's layout and carries the same loose proof scripts and committed test artefacts at its root. The only working-tree change is a generated package lock inside the app's node_modules, which should not be tracked at all.

Evidence:

- git status --porcelain -> M workspace/app/node_modules/.package-lock.json
- Root listing mirrors IDE-Workspace: fix_report.py, fix_terminology.py, rewrite_report.py, run_cpp_proof.py, run_flaky_test.py, run_flaky_test_v081.py, run_hello_task.py, run_simple_cpp.py, update_report.py, test.txt, test_output.txt, field_output.json, audit_report.txt

Commands: `install` · `build` · `test` · `test-bridge` · `verify`

### LedgerLands

The workspace typechecks, builds and tests. Every package compiles under TypeScript 7 with project references, the web UI builds through Vite, and 33 tests pass. It previously could not typecheck a single file: the shared base config used the baseUrl option that TypeScript 7 removed, and the package aliases pointed at build output that had never been produced.

Evidence:

- npm install -> dependencies installed; @types/node 24.19.0
- npx tsc -b -> exit 0, the whole solution builds in dependency order
- npm run typecheck -> exit 0, all eight workspaces typecheck
- npm run build -> exit 0; web built in 305ms through Vite
- npm test -> exit 0; 3 suites, 33 tests passed, 0 failed

Commands: `install` · `typecheck` · `test` · `build` · `verify` · `engine-smoke` · `simulate` · `db-generate`

## Dependents

| Project | Required by |
|---|---|
| Genesis | aetherius-os, agent-bridge, agent-bridge-cloudhybrid, agent-bridge-runtimesafety, ide-workspace, ide-workspace-dashboard, mat |
| Agent-Bridge | aetherius-os, agent-bridge-cloudhybrid, agent-bridge-dashboard, agent-bridge-runtimesafety, hermes-config-audit, ide-workspace, ide-workspace-dashboard, ledgerlands |
| IDE-Workspace | aetherius-os, agent-bridge-dashboard, ide-workspace-dashboard |
| Materials Atlas Table Codex | aetherius-os |
| Universal-Bridge | aetherius-os, poietek |
| Poietek | aetherius-os |
| Aetherius-OS | ledgerlands |
