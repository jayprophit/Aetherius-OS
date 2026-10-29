# Build Manifest Registry — Workspace Build Report

> Generated from `docs/BUILD-MANIFEST-REGISTRY.yaml` and each
> project's own `build.yaml`. Do not hand-edit this file.

- Projects: **45**
- States: VERIFIED 7 · PARTIAL 31 · NOT_STARTED 7
- Source date: 2026-10-29
- Project detail below: **19 of 45** — the projects whose
  manifests this repository tracks. The rest live in their own
  repositories and are reported there.

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
 9. aetherius-app-suite          ⚠️ PARTIAL  (needs: aetherius-os)
10. aetherius-athena-health      ⚠️ PARTIAL  (needs: aetherius-os)
11. aetherius-commerce           ⚠️ PARTIAL  (needs: aetherius-os, agent-bridge, genesis)
12. aetherius-community          ⚠️ PARTIAL  (needs: aetherius-os, agent-bridge, genesis)
13. aetherius-desktop            ⚠️ PARTIAL  (needs: aetherius-os)
14. aetherius-health-library     ⚠️ PARTIAL  (needs: aetherius-os)
15. aetherius-learning           ⚠️ PARTIAL  (needs: aetherius-os, agent-bridge, genesis)
16. aetherius-os-prototype       ❌ NOT_STARTED
17. aetherius-os-worldclass-prototype ❌ NOT_STARTED
18. aetherius-store              ⚠️ PARTIAL  (needs: aetherius-os)
19. agent-bridge-cloudhybrid     ⚠️ PARTIAL  (needs: agent-bridge, genesis)
20. ide-workspace                🟢 VERIFIED  (needs: agent-bridge, genesis, mat)
21. agent-bridge-dashboard       ⚠️ PARTIAL  (needs: agent-bridge, ide-workspace)
22. agent-bridge-runtimesafety   ⚠️ PARTIAL  (needs: agent-bridge, genesis)
23. ai-digital-twin              ❌ NOT_STARTED
24. architecture-of-shadows-book ⚠️ PARTIAL
25. athena                       ⚠️ PARTIAL  (needs: aetherius-os, agent-bridge)
26. crossplatform                ⚠️ PARTIAL  (needs: aetherius-os)
27. decentralized-messaging-app  ⚠️ PARTIAL  (needs: aetherius-os, agent-bridge)
28. food-wiki-app                ⚠️ PARTIAL  (needs: aetherius-os)
29. football-card-game           ⚠️ PARTIAL  (needs: aetherius-os)
30. hermes-config-audit          🟢 VERIFIED  (needs: aetherius-os)
31. holonav-os                   ❌ NOT_STARTED
32. ledgerlands                  🟢 VERIFIED  (needs: aetherius-os)
33. niche-platform               ⚠️ PARTIAL  (needs: aetherius-os)
34. openclaw-models              ⚠️ PARTIAL  (needs: aetherius-os)
35. poietek                      🟢 VERIFIED
36. quantum-ai-assistant         ⚠️ PARTIAL  (needs: aetherius-os, athena)
37. quantum-os                   ⚠️ PARTIAL  (needs: aetherius-os)
38. qva-merged                   ⚠️ PARTIAL  (needs: aetherius-os)
39. self-building-ai             ⚠️ PARTIAL  (needs: aetherius-os)
40. sovereign-financial-os       ⚠️ PARTIAL  (needs: aetherius-os)
41. trading-bot                  ⚠️ PARTIAL  (needs: aetherius-os)
42. universal-bridge             🟢 VERIFIED  (needs: poietek)
43. veyra                        ❌ NOT_STARTED  (needs: aetherius-os)
44. virtual-assistant            ⚠️ PARTIAL  (needs: genesis)
45. web-platform                 ⚠️ PARTIAL  (needs: aetherius-os)
```

## Projects

| Project | State | Type | Branch | Build system | Depends on |
|---|---|---|---|---|---|
| Materials Atlas Table Codex | ⚠️ PARTIAL | - | - | - | - |
| Genesis | 🟢 VERIFIED | - | - | - | mat |
| Agent-Bridge | ⚠️ PARTIAL | - | - | - | genesis, mat |
| Aetherius-OS | 🟢 VERIFIED | application | master | npm/vite | genesis, agent-bridge, mat |
| aetherial | ⚠️ PARTIAL | - | - | - | aetherius-os |
| aetherial-platform | ⚠️ PARTIAL | - | - | - | aetherius-os |
| aetherion-engine | ❌ NOT_STARTED | - | - | - | - |
| aetherium | ❌ NOT_STARTED | - | - | - | aetherius-os |
| Aetherius App Suite | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| Athena Health | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| Aetherius OS Commerce | ⚠️ PARTIAL | application | - | node --test | aetherius-os, agent-bridge, genesis |
| Aetherius OS Community | ⚠️ PARTIAL | application | - | node --test | aetherius-os, agent-bridge, genesis |
| Aetherius Desktop | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| aetherius-health-library | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| Aetherius OS Learning | ⚠️ PARTIAL | application | - | node --test | aetherius-os, agent-bridge, genesis |
| aetherius-os | ❌ NOT_STARTED | application | main | unknown | - |
| aetherius-os-worldclass-prototype | ❌ NOT_STARTED | application | main | unknown | - |
| Aetherius Store | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| Agent-Bridge (cloud-hybrid runtime) | ⚠️ PARTIAL | - | - | - | agent-bridge, genesis |
| IDE-Workspace | 🟢 VERIFIED | - | - | - | genesis, agent-bridge, mat |
| Agent-Bridge (supervisor UI / worker telemetry) | ⚠️ PARTIAL | - | - | - | agent-bridge, ide-workspace |
| Agent-Bridge (runtime safety) | ⚠️ PARTIAL | - | - | - | agent-bridge, genesis |
| ai-digital-clone | ❌ NOT_STARTED | - | - | - | - |
| Architecture of Shadows Book | ⚠️ PARTIAL | - | - | - | - |
| Athena | ⚠️ PARTIAL | application | - | node --test | aetherius-os, agent-bridge |
| crossplatform | ⚠️ PARTIAL | library | - | node --test | aetherius-os |
| Decentralized Messaging App | ⚠️ PARTIAL | application | - | node --test | aetherius-os, agent-bridge |
| Food Wiki App (FaturaWiki) | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| football-card-game | ⚠️ PARTIAL | - | - | - | aetherius-os |
| Hermes-Config-Audit | 🟢 VERIFIED | - | - | - | aetherius-os |
| holonav-os | ❌ NOT_STARTED | application | main | unknown | - |
| LedgerLands | 🟢 VERIFIED | - | - | - | aetherius-os |
| niche-platform | ⚠️ PARTIAL | - | - | - | aetherius-os |
| OpenClaw Model Catalogue | ⚠️ PARTIAL | library | - | node --test | aetherius-os |
| Poietek | 🟢 VERIFIED | - | - | - | - |
| quantum-ai-assistant | ⚠️ PARTIAL | application | - | node --test | aetherius-os, athena |
| quantum-os | ⚠️ PARTIAL | - | - | - | aetherius-os |
| qva-merged | ⚠️ PARTIAL | - | - | - | aetherius-os |
| self-building-ai | ⚠️ PARTIAL | - | - | - | aetherius-os |
| sovereign-financial-os | ⚠️ PARTIAL | application | - | node --test | aetherius-os |
| Multi-Cross-Platform-Trading-Bot | ⚠️ PARTIAL | - | - | - | aetherius-os |
| Universal-Bridge | 🟢 VERIFIED | - | - | - | poietek |
| Veyra | ❌ NOT_STARTED | - | - | - | aetherius-os |
| virtual-assistant | ⚠️ PARTIAL | - | - | - | genesis |
| web-platform | ⚠️ PARTIAL | - | - | - | aetherius-os |

## Known issues

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
| 🟠 high | The app suite, store, Food Wiki and Athena Health are tested domain libraries with no native host shell, rend… | OPEN | TODO-APP-006 |
| 🟡 medium | The Office modules export Markdown, CSV and slide outlines only. They cannot import or export DOCX, PPTX or X… | OPEN | TODO-APP-007 |
| 🟡 medium | The commerce slice has no CRM or sales pipeline, the finance slice has no driver-based forecast, and the suit… | OPEN | TODO-APP-008 |
| 🟡 medium | The Codex conversation corpus is inventoried but unread and unredacted, so it cannot be used as evidence or p… | OPEN | TODO-CODEX-001 |
| ⚪ low | The 18 generated Codex images are unclassified and have no rights review, so none can be adopted as a product… | OPEN | TODO-CODEX-002 |

### Aetherius App Suite

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | These are domain cores, not applications: there is no window, route, screen, accessibility layer or host moun… | OPEN | - |
| 🟡 medium | Files is a virtual in-memory filesystem. It does not read or write the host filesystem and has no permissions… | OPEN | - |
| 🟡 medium | Browser is a session model. It does not fetch pages, execute JavaScript, render HTML or maintain cookies; pag… | OPEN | - |
| 🟡 medium | Calculator uses JavaScript numbers, not arbitrary-precision arithmetic. | OPEN | - |
| 🟡 medium | Photos validates metadata and hashes caller-supplied bytes. It does not decode, thumbnail, crop or recognise … | OPEN | - |

### Athena Health

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | This is a wellness tool, not a medical device or a clinical decision system. The readiness score and plan sug… | ACCEPTED | - |
| 🟠 high | There is no user interface, host mount or wearable/device integration. Activity must be entered by a caller. | OPEN | - |
| 🟠 high | Privacy controls are an in-process model. Data is not encrypted at rest, and export/erase operate on caller-s… | OPEN | - |
| 🟡 medium | The exercise catalogue is a small generic seed. It is not a complete exercise database and has not been revie… | OPEN | - |

### Aetherius OS Commerce

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The domain slice is built and listed in the host application registry, but the storefront UI and a real payme… | OPEN | TODO-APP-003 |

### Aetherius OS Community

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The domain slice is built and listed in the host application registry, but chat and the UI are not. | OPEN | TODO-APP-005 |

### Aetherius Desktop

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Settings are a model. There is no native adapter that reads or writes the Windows registry, macOS plists, Lin… | OPEN | - |
| 🟠 high | The default-app catalogue is a model. Registering a handler with a real operating system is not implemented. | OPEN | - |
| 🟠 high | Installer plans name real package formats but do not build, sign, notarise or publish a package. | OPEN | - |
| 🟡 medium | There is no settings user interface or host mount. | OPEN | - |

### Aetherius Health Library

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The ingestion, search, citation and publication services are built, but the health library user interface and… | OPEN | - |
| ⚪ low | The health library does not yet have its own repository, which the programme requires once it is finished. | OPEN | TODO-STR-007 |

### Aetherius OS Learning

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The domain slice is built and listed in the host application registry, but the learner and educator UI and a … | OPEN | TODO-APP-004 |

### Aetherius Store

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Signatures are checked through a caller-supplied SignatureVerifier. The bundled DemoSignatureVerifier accepts… | OPEN | - |
| 🟠 high | The store plans and records installs but does not download, unpack or execute an artifact, and does not write… | OPEN | - |
| 🟡 medium | Entitlements and permissions are caller-supplied. OwnsEverything is a demo implementation, not an account or … | OPEN | - |
| 🟡 medium | There is no store user interface and no hosted catalogue service. | OPEN | - |

### Athena

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The original Athena requirements are not recovered. The implemented capability set is candidate scope derived… | OPEN | TODO-ATH-002 |
| 🟡 medium | No hosted model provider is connected. The local-model contract is exercised with a deterministic stub in the… | OPEN | - |
| 🟡 medium | The Athena user interface and host application mount are not built. | OPEN | - |

### Crossplatform---multiplatform

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟡 medium | The workspace is a layout model only. There is no native or web renderer that draws the panels. | OPEN | - |
| 🟡 medium | Packaging produces and verifies a release manifest, but there is no installer, code signing or artifact publi… | OPEN | - |
| ⚪ low | "Kernel" in this project means the scheduler and lifecycle core of the runtime, not an operating-system kerne… | ACCEPTED | - |
| 🟠 high | The Genesis bridge is a policy and orchestration layer only. It ships no live browser driver, screen-capture … | OPEN | - |
| 🟡 medium | Browser pagination is a bounded anchor extractor, not a JavaScript DOM renderer. Pages that build pagination … | OPEN | - |

### Decentralized Messaging App

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | There is no WebRTC media plane. Call records are signalling metadata, not audio or video. | OPEN | - |
| 🟡 medium | There is no live federation transport. Signed envelopes are constructed and verified in-process; they are not… | OPEN | - |
| 🟡 medium | The messaging product requirements are candidate scope, not recovered owner requirements. | OPEN | TODO-DMA-002 |

### Food Wiki App (FaturaWiki)

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The Food Wiki user interface and the host application registry mount are not built. The app model is a state … | OPEN | - |
| 🟠 high | Photo-assisted recipe suggestions do not use a vision model. The caller must supply the detected food labels;… | OPEN | - |
| 🟡 medium | Rife-style frequency claims are not supported by robust clinical evidence. The library records them as cultur… | ACCEPTED | - |
| 🟡 medium | Locations, foods and recipes are caller-supplied seed data. There is no map provider, geocoder, shop inventor… | OPEN | - |
| 🟡 medium | The slice is in-memory. There is no persistent database, multi-device sync service or encrypted storage. | OPEN | - |

### OpenClaw Model Catalogue

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | Every hosted provider is configured but cold: no owner API key is present, so no hosted inference has been pr… | OPEN | TODO-OCM-001 |
| 🟡 medium | The LM Studio provider is catalogued but unavailable: the Windows lms.exe exits 0xC000001D and the installed … | OPEN | TODO-OCM-003 |
| 🟡 medium | Model metadata is a point-in-time snapshot. Context windows, output limits and prices change, and unknown fie… | OPEN | - |
| 🟡 medium | The slice renders config fragments but does not apply or verify them on a live gateway, and it has no user in… | OPEN | TODO-OCM-002 |
| ⚪ low | Free-tier classification reflects published terms on 2026-10-29; a provider can change quotas or pricing with… | OPEN | - |

### Quantum AI Assistant

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | This is a classical statevector simulation. No quantum hardware or quantum cloud provider is connected. | OPEN | - |
| 🟡 medium | The assistant user interface and host application mount are not built. | OPEN | - |

### Sovereign Financial OS

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | There is no live bank, card or exchange adapter. All balances and settlements in this slice are internal reco… | OPEN | - |
| 🟡 medium | The financial user interface and durable database adapters are not built. | OPEN | - |

## Verified state per project

### Aetherius-OS

The full declared gate is clean. On 2026-10-27 `npm run verify` passed every stage: secret scan clean (970 files, 5 allowlisted), both typechecks clean, 1,804 tests passed and 1 skipped across 100 files in 77.33 s, all four app slices passed (30 tests), and the production build completed in 4.51 s. The five failures the audit started with remain resolved: the stale project list and the two stray root documents, the unlicensed third-party source tracked in Genesis, and the HTTP bridge transport timing artefact.

Evidence:

- 2026-10-27: npm run verify -> exit 0; secret scan clean (970 files, 5 allowlisted); typecheck and typecheck:apps clean
- 2026-10-27: npm test -> 100 files passed, 1,804 passed / 1 skipped / 1,805 total, 77.33 s
- 2026-10-27: node apps/verify.mjs -> 4/4 slices passed (commerce 6, community 10, learning 6, app-kit 8)
- 2026-10-27: npm run build -> vite 6.4.3, 46 modules transformed, dist/assets/index-DewxI7pW.js 276.44 kB, built in 4.51 s
- 2026-10-27: docs/workspace-hygiene.test.ts + docs/omniagent-reference.provenance.test.ts -> 26 passed (14 + 12)
- First verify attempt on 2026-10-27 failed two provenance tests because kernel/Genesis held a stale .git/index.lock from an interrupted 2026-10-25 run; the lock was removed, the test's own probe path was reset, and the clean re-run above passed
- src/programme/ -> build manifest gate, gap analysis gate, source registry coverage gate and report sync gates pass
- native/kernel host suite -> 126 checks, 0 failures (2026-10-25 baseline)

Commands: `install` · `typecheck` · `typecheck-apps` · `build` · `test` · `test-apps` · `secret-scan` · `verify` · `source-registry` · `kernel-test` · `dev` · `registry-validate`

### Aetherius App Suite

Six app cores are built and tested: Notes (create, tag, pin, search, revisions, restore), Calculator (precedence, unary minus, right-associative powers, history, memory, unsafe-expression refusal), virtual Files (create, write, read, list, move, copy, remove, quota, traversal refusal, name and content search), Calendar (validation, daily/weekly/monthly recurrence, conflicts, ICS export), Photos (albums, tags, favourites, content-hash duplicates, metadata validation) and Browser (tabs with back/forward, bookmarks, downloads, host blocklist, pagination extraction). There is no user interface, no native filesystem adapter, no browser engine and no image decoder.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-app-suite -> 17 tests passed, 0 failed.
- 2026-10-29: the tests cover note revisions and restore, calculator precedence and refusal, filesystem quota and traversal, calendar recurrence/conflicts/ICS, photo albums and duplicates, and browser history/bookmarks/blocklist/pagination.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Athena Health

The health and wellbeing core is built and tested: a seeded exercise library with category, equipment, difficulty, search and medical-flag filtering; validated custom exercises; plan building for strength, endurance, mobility and general goals; an activity log with weekly load and consecutive-day streaks; weekly/monthly goals; a deterministic recovery readiness band; a wellbeing journal with averages and trend; consent that defaults to off and gates research/cloud/export; and a dashboard that combines them. Every mutation is recorded on the hash-chained EventLedger. The readiness score is a transparent heuristic, not a clinical assessment. There is no user interface, wearable integration, clinician review or encrypted storage.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-athena-health -> 12 tests passed, 0 failed.
- 2026-10-29: the tests cover library filtering and medical flags, custom-exercise validation, plan mixes, activity summaries and streaks, goal windows, readiness bands, journal averages, consent dependencies, export/erase and dashboard composition.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Aetherius OS Commerce

The commerce domain slice is built and tested: catalogue, cart, idempotent checkout, inventory, a deterministic local test payment provider, fulfilment, refund, entitlements, sales reporting and ledger events. It is not yet mounted in the Aetherius OS host UI, and no real payment provider is connected.

Evidence:

- 2026-10-25: node --test "tests/*.test.ts" -> 6 tests passed.
- 2026-10-25: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 (all four app slices).
- 2026-10-25: node apps/verify.mjs -> 4/4 slices passed.
- The service uses the shared app-kit accounts, entitlements, notifications and hash-chained ledger.

Commands: `test` · `typecheck` · `verify`

### Aetherius OS Community

The community domain slice is built and tested: public and private groups, invitations, membership, a feed, comments with notifications, events with capacity, reports and moderator resolution with an audit trail. Chat is not built here because messaging is the Agent-Bridge primitive, and the slice is not yet mounted in the Aetherius OS host UI.

Evidence:

- 2026-10-25: node --test "tests/*.test.ts" -> 10 tests passed.
- 2026-10-25: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 (all four app slices).
- 2026-10-25: node apps/verify.mjs -> 4/4 slices passed.
- The service uses the shared app-kit accounts, notifications and hash-chained ledger.

Commands: `test` · `typecheck` · `verify`

### Aetherius Desktop

The desktop model is built and tested: four-layer settings precedence (default, system, user, app), type/range/enum validation, policy locks, six OS presets, secret-redacting export and validated import, 26 default-app roles on each of six OS families, override/reset resolution, URL-scheme and MIME routing, and installer plans for MSIX, DMG, DEB, AAB, IPA and PWA with signing blockers. It does not read or write a real registry, plist, dconf, systemd unit or mobile bundle, and it does not build or sign a package.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-desktop -> 13 tests passed, 0 failed.
- 2026-10-29: the tests cover settings precedence, validation, policy locks, presets, redacted export/import, the 26x6 default-app catalogue, overrides and resets, URL/MIME routing, package formats and signing blockers.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Aetherius Health Library

The health library slice is built and tested: a real Rife frequency parser producing more than one thousand records, SHA-256 duplicate detection, search, citation and a publication workflow. The two supplied frequency files are byte-identical, so the second name is recorded as an alias, not as distinct data. The library UI and its own repository are not built.

Evidence:

- 2026-10-27: node --test "tests/*.test.ts" in apps/aetherius-health-library -> 8 tests passed, 0 failed.
- 2026-10-27: rife_frequency.txt and spooky2_frequency.txt both hash to a60a985f... (SHA-256); the duplicate detector records spooky2_frequency.txt as an alias of the same content.
- 2026-10-27: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 12 app slices.
- 2026-10-27: node apps/verify.mjs -> 12/12 slices passed.

Commands: `test` · `typecheck` · `verify`

### Aetherius OS Learning

The learning domain slice is built and tested: courses, ordered lessons, enrolment, prerequisite enforcement, quizzes with pass marks, assignments and grading, progress and completion. It is not yet mounted in the Aetherius OS host UI, and authoring is an API rather than an editor.

Evidence:

- 2026-10-25: node --test "tests/*.test.ts" -> 6 tests passed.
- 2026-10-25: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 (all four app slices).
- 2026-10-25: node apps/verify.mjs -> 4/4 slices passed.
- The service uses the shared app-kit accounts, entitlements and hash-chained ledger.

Commands: `test` · `typecheck` · `verify`

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

### Aetherius Store

The store core is built and tested: semver, signature gating, search, artifact selection, dependency ordering, cycle refusal, permission and entitlement checks, disk-space checks, install/update/rollback, uninstall and key revocation. Every state change is recorded on a hash-chained EventLedger. The signature verifier is a demo interface implementation, not a real cryptographic verifier, and no artifact is downloaded or executed. There is no store user interface or hosted catalogue service.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-store -> 11 tests passed, 0 failed.
- 2026-10-29: the tests cover semver ordering and ranges, unsigned/bad-signature refusal, digest-stable publishing, highest-compatible resolution, dependency-first plans and size totals, permission/entitlement refusal, disk-space refusal, install/update/rollback history, uninstall, key revocation and dependency cycles.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Athena

The intelligence runtime is built and tested: deterministic model routing, a tool registry with permission checks, planning, bounded working memory, long-term memory retrieval, delegation, durable task checkpoints, evaluation and a local-model contract. It is not connected to a hosted model provider and has no user interface. The original Athena requirements have not been recovered.

Evidence:

- 2026-10-27: node --test "tests/*.test.ts" in apps/Athena -> 11 tests passed, 0 failed.
- 2026-10-27: the tests cover INT-001..INT-010, including a task that resumes in a new service instance.
- 2026-10-27: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 12 app slices.
- 2026-10-27: node apps/verify.mjs -> 12/12 slices passed.

Commands: `test` · `typecheck` · `verify`

### Crossplatform---multiplatform

The cross-platform runtime slice is built and tested. It implements the twelve capabilities the programme measured as missing: PLT-001..PLT-008 (kernel, modules, isolation, workspace shell, extensions, configuration, observability, packaging) and TLS-001..TLS-004 (CLI, flags, structured output, tests). It also implements the Genesis bridge policy layer: nine explicit capabilities, scoped file roots, exact/wildcard browser hosts, app allowlists, expiring grants, bounded pagination and crawling, front-to-back app command sequences, pointer/keyboard/screen limits and a redacting hash-chained audit journal. It is a host-neutral library: hosts must supply the filesystem, browser, app, screen and input ports. There is no native or web renderer, live browser driver, installer or signed release yet.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-crossplatform -> 32 tests passed, 0 failed (17 bridge tests plus 15 platform/CLI tests).
- 2026-10-29: the bridge tests cover grant normalisation and expiry, path traversal, file read/write/search limits, wildcard host scoping, redirect refusal, page-size limits, next/previous/numbered pagination, crawl limits and cycles, app launch/invoke/front-to-back failure, input bounds, screen capture, secret redaction and ledger verification.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Decentralized Messaging App

The messaging core is built and tested: AES-256-GCM encryption at rest, membership checks, presence, notification fan-out, attachment metadata, call signalling records, Ed25519-signed federation envelopes and an audit trail. THREAT-MODEL.md records the assets, trust boundaries, controls and residual risks, including key custody, replay, metadata leakage and the absence of host authentication. There is no media plane, no live federation transport and no messaging user interface.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/Decentralized Messaging App -> 16 tests passed, 0 failed.
- 2026-10-29: the tests cover AES-256-GCM round trips, membership refusal, presence, notifications, attachments, call signals, Ed25519 envelope verification and tamper rejection.
- 2026-10-29: THREAT-MODEL.md records the transport decision (interfaces only) and fourteen threat/control pairs with residual-risk status.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### Food Wiki App (FaturaWiki)

The Food Wiki slice is built and tested. The catalogue covers ten food kinds and can be filtered by kind. The location atlas records wild, shop, market, garden, online and foraged sources with coordinates, seasons and notes. The recipe book validates ingredients, ranks recipes by what is available and suggests recipes from caller-supplied photo detections while stating that no vision model is running. The frequency library records Rife-style protocols with an explicit no-evidence disclaimer and renders real 16-bit PCM WAV tones. The app model covers eight screens, accounts, sessions and preferences, and exposes read-only Athena ToolDefinitions. The earlier knowledge core still provides citations, allergen and medical rules, barcode throttling, offline conflict handling and an auditable publication workflow. There is no user interface, host mount, database, vision model, map/geocoding provider or live Athena host.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/aetherius-food-wiki -> 22 tests passed, 0 failed (7 atlas/app tests plus 15 knowledge tests).
- 2026-10-29: the tests cover food kinds and filtering, wild/shop/market locations and seasons, recipe validation and availability ranking, photo-label suggestions with the no-vision note, Rife protocols and WAV output, app navigation/account/preferences, Athena tools, allergen verdicts, medical flags, citations, publication history, search and the ingredient graph, barcode throttling, offline conflicts and audit-chain verification.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 16 app slices.
- 2026-10-29: node apps/verify.mjs -> 16/16 slices passed.

Commands: `test` · `typecheck` · `verify`

### holonav-os

The project is registered so that it is visible and owned, and so that the work to build it is tracked rather than forgotten. It holds no buildable source at the time of recording.

Evidence:

- The project was registered during the workspace reorganisation of 2026-10-20
- Measured own source lines: 0

Commands: `inspect`

### OpenClaw Model Catalogue

The catalogue is built and tested: 17 providers and 52 models across four tiers, 29 aliases, per-tier primary/fallback chains, and renderers for the models.providers and agents.defaults fragments. Validation rejects duplicate refs, missing aliases, invalid tiers, empty modalities and negative costs. Hosted providers remain cold because the owner has not supplied their keys; the live gateway has not been changed by this slice.

Evidence:

- 2026-10-29: node --test "tests/*.test.ts" in apps/openclaw-models -> 11 tests passed, 0 failed.
- 2026-10-29: the tests cover catalogue validation, all four tiers, local and hosted providers, aliases, single-model selection, env-reference rendering, secret absence, tier/provider filtering, omitted unknown metadata, agent defaults and the CLI.
- 2026-10-29: npx tsc -p apps/tsconfig.json --noEmit -> exit 0.
- 2026-10-29: node src/cli.ts validate -> catalogue valid: 17 providers, 52 models, source 2026-10-29.
- Model ids and endpoints were checked against the provider documentation shipped with OpenClaw 2026.9.6 and the live gateway configuration.

Commands: `test` · `typecheck` · `verify`

### Quantum AI Assistant

The assistant is built and tested: a statevector simulator with X, H, RX, RY and CNOT gates, Bell-state and superposition checks, seeded sampling, input validation, an Athena runtime path and an explicit simulation disclaimer. It does not connect to quantum hardware and has no user interface.

Evidence:

- 2026-10-27: node --test "tests/*.test.ts" in apps/quantum-ai-assistant -> 10 tests passed, 0 failed.
- 2026-10-27: the tests assert the Bell state produces only |00> and |11>, that RX(pi) reaches |1>, and that sampling is deterministic for a seed.
- 2026-10-27: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 12 app slices.
- 2026-10-27: node apps/verify.mjs -> 12/12 slices passed.

Commands: `test` · `typecheck` · `verify`

### Sovereign Financial OS

The financial core is built and tested: double-entry posting, a trial balance, profit and loss, a balance sheet, invoices with tax and payment settlement, idempotent payments, budgets, reconciliation, risk checks, reversals and an audit trail. The user interface, persistence adapters and any live banking or exchange integration are not built.

Evidence:

- 2026-10-27: node --test "tests/*.test.ts" in apps/sovereign-financial-os -> 14 tests passed, 0 failed.
- 2026-10-27: the tests assert that an unbalanced entry is refused and that the trial balance, profit and loss and balance sheet agree with the ledger.
- 2026-10-27: npx tsc -p apps/tsconfig.json --noEmit -> exit 0 across all 12 app slices.
- 2026-10-27: node apps/verify.mjs -> 12/12 slices passed.

Commands: `test` · `typecheck` · `verify`

## Dependents

| Project | Required by |
|---|---|
| Materials Atlas Table Codex | aetherius-os, agent-bridge, genesis, ide-workspace |
| Genesis | aetherius-commerce, aetherius-community, aetherius-learning, aetherius-os, agent-bridge, agent-bridge-cloudhybrid, agent-bridge-runtimesafety, ide-workspace, virtual-assistant |
| Agent-Bridge | aetherius-commerce, aetherius-community, aetherius-learning, aetherius-os, agent-bridge-cloudhybrid, agent-bridge-dashboard, agent-bridge-runtimesafety, athena, decentralized-messaging-app, ide-workspace |
| Aetherius-OS | aetherial, aetherial-platform, aetherium, aetherius-app-suite, aetherius-athena-health, aetherius-commerce, aetherius-community, aetherius-desktop, aetherius-health-library, aetherius-learning, aetherius-store, athena, crossplatform, decentralized-messaging-app, food-wiki-app, football-card-game, hermes-config-audit, ledgerlands, niche-platform, openclaw-models, quantum-ai-assistant, quantum-os, qva-merged, self-building-ai, sovereign-financial-os, trading-bot, veyra, web-platform |
| IDE-Workspace | agent-bridge-dashboard |
| Athena | quantum-ai-assistant |
| Poietek | universal-bridge |
