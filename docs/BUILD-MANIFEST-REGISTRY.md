# Build Manifest Registry — Workspace Build Report

> Generated from `docs/BUILD-MANIFEST-REGISTRY.yaml` and each
> project's own `build.yaml`. Do not hand-edit this file.

- Projects: **37**
- States: VERIFIED 7 · PARTIAL 15 · NOT_STARTED 15
- Source date: 2026-10-20

## Build order

Dependencies first. A project that depends on another cannot be
finished before it.

```
 1. mat                          ⚠️ PARTIAL
 2. genesis                      🟢 VERIFIED  (needs: mat)
 3. agent-bridge                 ⚠️ PARTIAL  (needs: genesis, mat)
 4. aetherius-os                 🟢 VERIFIED  (needs: agent-bridge, genesis, mat)
 5. aetherial                    ⚠️ PARTIAL  (needs: aetherius-os)
 6. aetherial-platform           ⚠️ PARTIAL  (needs: aetherius-os)
 7. aetherion-engine             ❌ NOT_STARTED
 8. aetherium                    ❌ NOT_STARTED  (needs: aetherius-os)
 9. aetherius-health-library     ❌ NOT_STARTED  (needs: aetherius-os)
10. aetherius-os-prototype       ❌ NOT_STARTED
11. aetherius-os-worldclass-prototype ❌ NOT_STARTED
12. agent-bridge-cloudhybrid     ⚠️ PARTIAL  (needs: agent-bridge, genesis)
13. ide-workspace                🟢 VERIFIED  (needs: agent-bridge, genesis, mat)
14. agent-bridge-dashboard       ⚠️ PARTIAL  (needs: agent-bridge, ide-workspace)
15. agent-bridge-runtimesafety   ⚠️ PARTIAL  (needs: agent-bridge, genesis)
16. ai-digital-twin              ❌ NOT_STARTED
17. architecture-of-shadows-book ❌ NOT_STARTED  (needs: aetherius-os)
18. athena                       ❌ NOT_STARTED  (needs: aetherius-os)
19. crossplatform                ⚠️ PARTIAL  (needs: aetherius-os)
20. decentralized-messaging-app  ❌ NOT_STARTED  (needs: aetherius-os)
21. food-wiki-app                ❌ NOT_STARTED  (needs: aetherius-os)
22. football-card-game           ⚠️ PARTIAL  (needs: aetherius-os)
23. hermes-config-audit          🟢 VERIFIED  (needs: aetherius-os)
24. holonav-os                   ❌ NOT_STARTED
25. ledgerlands                  🟢 VERIFIED  (needs: aetherius-os)
26. niche-platform               ⚠️ PARTIAL  (needs: aetherius-os)
27. poietek                      🟢 VERIFIED
28. quantum-ai-assistant         ❌ NOT_STARTED
29. quantum-os                   ⚠️ PARTIAL  (needs: aetherius-os)
30. qva-merged                   ⚠️ PARTIAL  (needs: aetherius-os)
31. self-building-ai             ⚠️ PARTIAL  (needs: aetherius-os)
32. sovereign-financial-os       ❌ NOT_STARTED
33. trading-bot                  ❌ NOT_STARTED
34. universal-bridge             🟢 VERIFIED  (needs: poietek)
35. veyra                        ❌ NOT_STARTED  (needs: aetherius-os)
36. virtual-assistant            ⚠️ PARTIAL  (needs: genesis)
37. web-platform                 ⚠️ PARTIAL  (needs: aetherius-os)
```

## Projects

| Project | State | Type | Branch | Build system | Depends on |
|---|---|---|---|---|---|
| Materials Atlas Table Codex | ⚠️ PARTIAL | tool | main | node/scripts | - |
| Genesis | 🟢 VERIFIED | library | main | cmake/ninja | mat |
| Agent-Bridge | ⚠️ PARTIAL | library | main | python/pytest | genesis, mat |
| Aetherius-OS | 🟢 VERIFIED | application | master | npm/vite | genesis, agent-bridge, mat |
| aetherial | ⚠️ PARTIAL | application | main | unknown | aetherius-os |
| aetherial-platform | ⚠️ PARTIAL | application | main | node/npm | aetherius-os |
| aetherion-engine | ❌ NOT_STARTED | application | main | unknown | - |
| aetherium | ❌ NOT_STARTED | application | main | unknown | aetherius-os |
| aetherius-health-library | ❌ NOT_STARTED | application | main | unknown | aetherius-os |
| aetherius-os | ❌ NOT_STARTED | application | main | unknown | - |
| aetherius-os-worldclass-prototype | ❌ NOT_STARTED | application | main | unknown | - |
| Agent-Bridge (cloud-hybrid runtime) | ⚠️ PARTIAL | library | unit/cloud-hybrid-runtime | python/pytest | agent-bridge, genesis |
| IDE-Workspace | 🟢 VERIFIED | application | master | npm/vite/pytest | genesis, agent-bridge, mat |
| Agent-Bridge (supervisor UI / worker telemetry) | ⚠️ PARTIAL | application | unit/external-worker-telemetry | python/pytest | agent-bridge, ide-workspace |
| Agent-Bridge (runtime safety) | ⚠️ PARTIAL | library | unit/runtime-safety-fixes | python/pytest | agent-bridge, genesis |
| ai-digital-clone | ❌ NOT_STARTED | application | main | unknown | - |
| Architecture of Shadows Book | ❌ NOT_STARTED | dataset | - | none | aetherius-os |
| Athena | ❌ NOT_STARTED | application | - | none | aetherius-os |
| crossplatform | ⚠️ PARTIAL | tool | main | unknown | aetherius-os |
| Decentralized Messaging App | ❌ NOT_STARTED | application | - | none | aetherius-os |
| Food Wiki App | ❌ NOT_STARTED | application | - | none | aetherius-os |
| football-card-game | ⚠️ PARTIAL | application | main | node/npm | aetherius-os |
| Hermes-Config-Audit | 🟢 VERIFIED | configuration | - | none | aetherius-os |
| holonav-os | ❌ NOT_STARTED | application | main | unknown | - |
| LedgerLands | 🟢 VERIFIED | application | - | npm/workspaces | aetherius-os |
| niche-platform | ⚠️ PARTIAL | application | main | node/npm | aetherius-os |
| Poietek | 🟢 VERIFIED | application | refactor/architecture-foundation | npm/vite/tauri | - |
| quantum-ai-assistant | ❌ NOT_STARTED | application | main | unknown | - |
| quantum-os | ⚠️ PARTIAL | application | main | unknown | aetherius-os |
| qva-merged | ⚠️ PARTIAL | application | main | python/pytest | aetherius-os |
| self-building-ai | ⚠️ PARTIAL | application | main | unknown | aetherius-os |
| sovereign-financial-os | ❌ NOT_STARTED | application | main | unknown | - |
| Multi-Cross-Platform-Trading-Bot | ❌ NOT_STARTED | application | main | node/npm | - |
| Universal-Bridge | 🟢 VERIFIED | application | develop/v0.5-production-foundation | cmake/ninja | poietek |
| Veyra | ❌ NOT_STARTED | application | main | unknown | aetherius-os |
| virtual-assistant | ⚠️ PARTIAL | application | main | unknown | genesis |
| web-platform | ⚠️ PARTIAL | application | main | unknown | aetherius-os |

## Known issues

### Materials Atlas Table Codex

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The working tree carries 1,236 modified or untracked files on main, with no clear separation between generate… | OPEN | TODO-MAT-001 |
| ⚪ low | The asset validator reports forty warnings, all of the same shape: a structured record's table file exists on… | OPEN | TODO-MAT-009 |
| 🟡 medium | Generated book output and source records are mixed in the same directories, so a clean build cannot be distin… | OPEN | TODO-MAT-002 |
| ⚪ low | The studio has its own nested npm workspace and its own Playwright browser matrix, so the root verify command… | OPEN | TODO-MAT-003 |

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

### Aetherius-OS

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Twelve standing rules recovered from the owner's own conversations bind every change, and five of them have a… | OPEN | TODO-DIR-001 |
| 🟠 high | The repository was carrying about two gigabytes of research artefacts that had never been pushed, so no push … | OPEN | TODO-ARC-001 |
| 🟠 high | The installed application set is recorded but nothing decides what Aetherius has to be able to do with any of… | OPEN | TODO-APP-002 |
| 🔴 critical | The secret scan that found twelve live-looking OpenRouter keys in the conversation corpus is a one-off script… | OPEN | TODO-SEC-001 |
| 🟡 medium | Two hundred and fifteen of the three hundred and forty-four forked repositories name no capability axis, so t… | OPEN | TODO-REPO-002 |
| 🟡 medium | The source registry records that a document exists, but not what the registry of requirements and capabilitie… | OPEN | TODO-SRC-002 |
| 🟠 high | The C kernel's pure logic is written and proven, but the machine-level modules are not, so the UEFI kernel im… | OPEN | TODO-KRN-001 |
| 🟡 medium | The C kernel host suite is not part of the Aetherius-OS verify command, so a kernel change can land without i… | OPEN | TODO-KRN-006 |
| 🟡 medium | Four reserved project folders hold no content, so they are registered as placeholders rather than projects. E… | OPEN | TODO-WS-003 |

### Aetherial

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | There is no test suite, so the build gate proves nothing. | OPEN | - |

### aetherial-platform

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | No licence file. The owner chooses which licence applies. | OPEN | - |

### Agent-Bridge (cloud-hybrid runtime)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| ⚪ low | uv.lock is present but untracked, so the dependency resolution this branch was developed against is not recor… | OPEN | TODO-ABCH-001 |
| 🟡 medium | The cloud-hybrid readiness work is recorded as an audit rather than a verified runtime, and the branch has di… | OPEN | TODO-ABCH-002 |

### IDE-Workspace

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The repository tracks its dependency tree in full: 4,715 files under workspace/app/node_modules are committed… | OPEN | TODO-IED-001 |
| 🟡 medium | The Python bridge integration tests were not exercised in this verification pass, so the front end and the br… | OPEN | TODO-IDE-001 |
| 🟡 medium | The test suite is timing-sensitive under CPU contention on this four-core host, so it is green when run alone… | OPEN | TODO-IDE-004 |
| 🟡 medium | Around thirty loose proof and fix scripts sit at the repository root and in workspace/, many of them one-off … | OPEN | TODO-IDE-002 |
| ⚪ low | The repository root contains committed test artefacts (test.txt, test_output.txt, field_output.json, audit_re… | OPEN | TODO-IDE-003 |

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

### Crossplatform---multiplatform

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The repository holds no source of its own. | OPEN | - |

### Decentralized Messaging App

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope, no transport decision, and no threat model. A decentralized messaging appl… | OPEN | TODO-DMA-001 |

### Food Wiki App

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The project has no recorded scope and no implementation. The only artefact is an empty design directory. | OPEN | TODO-FWA-001 |
| ⚪ low | The design directory name is misspelled ("Desisgn"). If the directory is ever renamed it should be done befor… | OPEN | TODO-FWA-002 |

### football-card-game

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | No licence file. The owner chooses which licence applies. | OPEN | - |

### Hermes-Config-Audit

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Four provider credentials were exposed through earlier chat transcripts and are recorded as MISSING pending o… | OPEN | TODO-HCA-001 |
| 🟡 medium | The configured default model upstage/solar-pro4:free is no longer available at no cost, so the active profile… | OPEN | TODO-HCA-002 |
| 🟡 medium | Hermes cannot use the local Ollama models: the OpenAI-compatible client SDK requires an API key string even a… | OPEN | TODO-HCA-003 |
| ⚪ low | This audit tree is not a git repository, so its history is not tracked and cannot be diffed against a prior s… | OPEN | TODO-HCA-004 |

### LedgerLands

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🔴 critical | TypeScript 7 removed the baseUrl compiler option and the shared base config still uses it, so every workspace… | OPEN | TODO-LL-001 |
| ⚪ low | The npm install reports that three packages have install scripts not covered by allowScripts, so the esbuild … | OPEN | TODO-LL-008 |
| 🟠 high | The active phase is LL-P2 persistence: the in-memory MatchStore has not been replaced with a PostgreSQL repos… | OPEN | TODO-LL-003 |
| 🟡 medium | The repository has never been pushed, so none of the verified work exists outside this machine. | OPEN | TODO-LL-006 |
| 🟡 medium | Three related trees are present (crypto-property-game-mvp, LedgerLands-Aetherius-App-Repo, LedgerLands-source… | OPEN | TODO-LL-005 |

### Niche_platform

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | No licence file. The owner chooses which licence applies. | OPEN | - |

### Poietek

| Sev | Issue | Status | Todo |
|---|---|---|---|
| ⚪ low | The Tauri desktop packaging path was not exercised in this verification pass; only the web build and core tes… | OPEN | TODO-POI-001 |
| ⚪ low | The references/ directory is untracked on this branch and its intended content is not yet established. | OPEN | TODO-POI-002 |

### Quantum-OS

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The repository holds no source of its own. | OPEN | - |

### QVA-merged

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | There is no test suite, so the build gate proves nothing. | OPEN | - |
| 🟡 medium | No licence file. The owner chooses which licence applies. | OPEN | - |

### Multi-Cross-Platform-Trading-Bot

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The code is third-party. It is held as reference and as a starting point, and any part of it that is used in … | OPEN | - |

### Universal-Bridge

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The build/ directory accumulates a growing set of sibling build trees, each with its own cache, and no record… | OPEN | TODO-UB-002 |
| ⚪ low | The VST3 client is experimental and off by default. It requires a separately obtained Steinberg SDK checkout … | ACCEPTED | TODO-UB-003 |

### VirtualAssistant

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The repository holds no source of its own. | OPEN | - |

### Web-platform

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | There is no test suite, so the build gate proves nothing. | OPEN | - |
| 🟡 medium | No licence file. The owner chooses which licence applies. | OPEN | - |

## Verified state per project

### Materials Atlas Table Codex

The validation toolchain and the core test suite both pass. 305 tests across 6 suites, 0 failures, 184 seconds. The full validate command passes with 0 errors and 40 warnings. The working tree is the larger issue: 1,236 files are modified or untracked on branch main.

Evidence:

- npm run validate -> VALIDATE: all suites pass; validate:assets 0 error(s), 40 warning(s); validate:links, validate:ids and validate:booksync all 0 errors
- npm test -> 305 tests, 305 pass, 0 fail, 0 skipped, 183628ms
- git status --porcelain -> 1236 changed files on branch main
- package.json declares 58 scripts across validate:, build:, sync:, audit: and test: families

Commands: `install` · `validate` · `test` · `build` · `build-studio` · `verify` · `preview`

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

### Aetherial

The project holds 276820 lines of its own source and no tests. Nothing about it has been demonstrated to work.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/Aetherial.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> 6411079aec86da3a48ca97cec2ed0b6682544ea5
- git log -1 --format=%ad --date=short -> 2025-07-28
- Measured own source lines: 276820. Measured test files: 0.

Commands: `inspect`

### aetherial-platform

The project holds 200070 lines of its own source across 7 language(s) and 24 test file(s). The build has not been run as part of the workspace gate, so the recorded state is partial rather than verified.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/aetherial-platform.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> d37b2dd5ae83c3a2aaa4240642aa3febcbc24dfc
- git log -1 --format=%ad --date=short -> 2025-10-30
- Measured own source lines: 200070. Measured test files: 24.

Commands: `build` · `test` · `test`

### aetherion-engine

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### aetherium

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### aetherius-health-library

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### aetherius-os

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### aetherius-os-worldclass-prototype

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### Agent-Bridge (cloud-hybrid runtime)

Same v0.8.1 core and same verification surface as the parent Agent-Bridge project, on a branch that adds the cloud-hybrid runtime readiness audit. The branch carries one untracked file, uv.lock, whose resolution is not yet established.

Evidence:

- pyproject.toml -> name agent-bridge, version 0.8.1, requires-python >=3.13
- git log -1 -> d0219ea docs: Genesis Local/Cloud/Hybrid runtime readiness audit (reconciliation unit)
- git status --porcelain -> ?? uv.lock

Commands: `install` · `test` · `verify` · `test-unittest`

### IDE-Workspace

The front end typechecks, builds and passes its whole test suite: 466 tests across 28 files, 42 seconds. The Python bridge layer under workspace/integration was not exercised in this pass.

Evidence:

- npm run build (workspace/app) -> tsc --noEmit clean; vite v6.4.3 built 78 modules in 3.77s
- npm run build produced: index.html, supervisor-ui.html, genesis-ui.html, supervisor-m2.html, client-D6S-fLKS.js (223.82 kB)
- npm test (workspace/app) -> 28 files passed, 466 tests passed, 0 failed, 42.40s
- vitest.config.ts: environment jsdom, testTimeout 15000, include src/**/*.test.{ts,tsx}

Commands: `install` · `build` · `test` · `test-bridge` · `test-all` · `dev`

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

### ai-digital-clone

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

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

### Crossplatform---multiplatform

The repository holds no source of its own. It is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/Crossplatform---multiplatform.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> 69a9890b81fb4c471025dae5667f54bd02f08ede
- git log -1 --format=%ad --date=short -> 2024-12-19
- Measured own source lines: 0. Measured test files: 0.

Commands: `inspect`

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

### football-card-game

The project holds 28448 lines of its own source across 4 language(s) and 2 test file(s). The build has not been run as part of the workspace gate, so the recorded state is partial rather than verified.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/football-card-game.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> 78a44edc17ba6e4b6bccb4f38a3fa546d86ea2b7
- git log -1 --format=%ad --date=short -> 2025-03-09
- Measured own source lines: 28448. Measured test files: 2.

Commands: `build` · `test`

### Hermes-Config-Audit

A documentation project with no build. The nine audit documents are present and internally consistent with the Hermes environment gate report. The documents record credential NAMES only; no secret values were read, copied or logged, which is the standing rule for this tree.

Evidence:

- Folder contains AGENT_LIMITS.json, EVIDENCE_REGISTER.md, MODEL_ROLE_MATRIX.json, OWNER_MANUAL_SETUP.md, PLUGINS_AUDIT.md, PROVIDER_ROUTING_MATRIX.json, SETTINGS_AUDIT.md, SETTINGS_CHANGES.md, SETTINGS_MATRIX.md, TOOLS_AND_KEYS_AUDIT.md
- TOOLS_AND_KEYS_AUDIT.md: 'Rule honored: key NAMES only; no key values were read, copied, or logged.'

Commands: `inspect` · `inspect-auth` · `inspect-routing` · `inspect-moat`

### holonav-os

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### LedgerLands

The workspace typechecks, builds and tests. Every package compiles under TypeScript 7 with project references, the web UI builds through Vite, and 33 tests pass. It previously could not typecheck a single file: the shared base config used the baseUrl option that TypeScript 7 removed, and the package aliases pointed at build output that had never been produced.

Evidence:

- npm install -> dependencies installed; @types/node 24.19.0
- npx tsc -b -> exit 0, the whole solution builds in dependency order
- npm run typecheck -> exit 0, all eight workspaces typecheck
- npm run build -> exit 0; web built in 305ms through Vite
- npm test -> exit 0; 3 suites, 33 tests passed, 0 failed

Commands: `install` · `typecheck` · `test` · `build` · `verify` · `engine-smoke` · `simulate` · `db-generate`

### Niche_platform

The project holds 27626 lines of its own source across 5 language(s) and 21 test file(s). The build has not been run as part of the workspace gate, so the recorded state is partial rather than verified.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/Niche_platform.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> 6cdaee3ceb405a6fc50037ca6088a7f41eae1fa1
- git log -1 --format=%ad --date=short -> 2025-05-18
- Measured own source lines: 27626. Measured test files: 21.

Commands: `build` · `test` · `lint` · `test`

### Poietek

The core typecheck passes with no diagnostics and the full test suite passes: 384 tests, 0 failures, 0 skipped, 8.66s. The web build path is the verified surface; the Tauri desktop build was not exercised in this pass because it needs the Rust toolchain and a longer build.

Evidence:

- npm run typecheck:core -> exit 0, no diagnostics
- npm test -> 384 tests, 384 pass, 0 fail, 0 cancelled, 0 skipped, 0 todo, 8664ms
- npm test -> typecheck:core && node ./scripts/prepare-core-tests.mjs && node --test tests/*.test.js

Commands: `install` · `typecheck` · `test` · `build` · `verify` · `build-desktop` · `dev`

### quantum-ai-assistant

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### Quantum-OS

The repository holds no source of its own. It is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/Quantum-OS.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> c1a9fb5f7bbd4f61a78ff8fb4c35c557ea1cb710
- git log -1 --format=%ad --date=short -> 2025-11-07
- Measured own source lines: 0. Measured test files: 0.

Commands: `inspect`

### QVA-merged

The project holds 3061 lines of its own source and no tests. Nothing about it has been demonstrated to work.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/QVA-merged.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> 5c661cee053ac5ff479a19b15c8f16dd08c40d44
- git log -1 --format=%ad --date=short -> 2025-05-13
- Measured own source lines: 3061. Measured test files: 0.

Commands: `inspect`

### self-building-ai

The project holds 969 lines of its own source and no tests. Nothing about it has been demonstrated to work.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/self-building-ai.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> ea01f01dce186d9f304e122225a072d157d01818
- git log -1 --format=%ad --date=short -> 2025-01-23
- Measured own source lines: 969. Measured test files: 0.

Commands: `inspect`

### sovereign-financial-os

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### Multi-Cross-Platform-Trading-Bot

The upstream repository was cloned into the workspace during the reorganisation. It has not been built on this host, and it has not been adapted to the owner's systems. The licence was checked and permits reuse.

Evidence:

- gh api /repos/Sifdat/Multi-Cross-Platform-Trading-Bot -> license.spdx_id = CC0-1.0
- The upstream remote is Sifdat/Multi-Cross-Platform-Trading-Bot, not the owner's own

Commands: `inspect`

### Universal-Bridge

The build tree configures, compiles and passes. 41 build steps and all 11 registered CTest gates pass, including the offline Python gates that check generated outputs, the research catalogue, the repository assets and the release-gate manifest. The stale caches that blocked every configure attempt have been discarded and the tree reconfigured at its current location.

Evidence:

- cmake -S . -B build -G Ninja -> Configuring done (92.0s), zlib and nlohmann_json re-fetched by pinned SHA256
- cmake --build build -> 41/41 targets built and linked
- ctest --test-dir build --output-on-failure -> 11/11 tests passed, 30.67s
- gates: virtual_hardware_laboratory, deterministic_core_stress, read_only_device_inventory, service_diagnostic_startup, authenticated_local_ipc, bridge_demo_preflight, bridge_invalid_daw, generated_output_validation, research_catalog_validation, repository_asset_validation, release_gate_manifest_validation

Commands: `configure` · `build` · `test` · `verify` · `clean`

### Veyra

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### VirtualAssistant

The repository holds no source of its own. It is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/VirtualAssistant.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> dcb5ae60383a56bb018fbc4be7ca69d7a08f5d92
- git log -1 --format=%ad --date=short -> 2025-01-13
- Measured own source lines: 0. Measured test files: 0.

Commands: `inspect`

### Web-platform

The project holds 9638 lines of its own source and no tests. Nothing about it has been demonstrated to work.

Evidence:

- git remote get-url origin -> https://github.com/jayprophit/Web-platform-with-E-commerce-E-learning-social-media-job-hunting-post-articles-blockchain-ai.git
- git rev-parse --abbrev-ref HEAD -> main
- git log -1 --format=%H -> a98d34a0b6782c982a7905659ae81f9177c8133c
- git log -1 --format=%ad --date=short -> 2025-01-31
- Measured own source lines: 9638. Measured test files: 0.

Commands: `inspect`

## Dependents

| Project | Required by |
|---|---|
| Materials Atlas Table Codex | aetherius-os, agent-bridge, genesis, ide-workspace |
| Genesis | aetherius-os, agent-bridge, agent-bridge-cloudhybrid, agent-bridge-runtimesafety, ide-workspace, virtual-assistant |
| Agent-Bridge | aetherius-os, agent-bridge-cloudhybrid, agent-bridge-dashboard, agent-bridge-runtimesafety, ide-workspace |
| Aetherius-OS | aetherial, aetherial-platform, aetherium, aetherius-health-library, architecture-of-shadows-book, athena, crossplatform, decentralized-messaging-app, food-wiki-app, football-card-game, hermes-config-audit, ledgerlands, niche-platform, quantum-os, qva-merged, self-building-ai, veyra, web-platform |
| IDE-Workspace | agent-bridge-dashboard |
| Poietek | universal-bridge |
