# Build Manifest Registry — Workspace Build Report

> Generated from `docs/BUILD-MANIFEST-REGISTRY.yaml` and each
> project's own `build.yaml`. Do not hand-edit this file.

- Projects: **40**
- States: VERIFIED 7 · PARTIAL 16 · NOT_STARTED 17
- Source date: 2026-10-21
- Project detail below: **4 of 40** — the projects whose
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
 9. aetherius-commerce           ❌ NOT_STARTED  (needs: aetherius-os, agent-bridge, genesis)
10. aetherius-community          ❌ NOT_STARTED  (needs: aetherius-os, agent-bridge, genesis)
11. aetherius-health-library     ❌ NOT_STARTED  (needs: aetherius-os)
12. aetherius-learning           ❌ NOT_STARTED  (needs: aetherius-os, agent-bridge, genesis)
13. aetherius-os-prototype       ❌ NOT_STARTED
14. aetherius-os-worldclass-prototype ❌ NOT_STARTED
15. agent-bridge-cloudhybrid     ⚠️ PARTIAL  (needs: agent-bridge, genesis)
16. ide-workspace                🟢 VERIFIED  (needs: agent-bridge, genesis, mat)
17. agent-bridge-dashboard       ⚠️ PARTIAL  (needs: agent-bridge, ide-workspace)
18. agent-bridge-runtimesafety   ⚠️ PARTIAL  (needs: agent-bridge, genesis)
19. ai-digital-twin              ❌ NOT_STARTED
20. architecture-of-shadows-book ⚠️ PARTIAL
21. athena                       ❌ NOT_STARTED  (needs: aetherius-os)
22. crossplatform                ⚠️ PARTIAL  (needs: aetherius-os)
23. decentralized-messaging-app  ❌ NOT_STARTED  (needs: aetherius-os)
24. food-wiki-app                ❌ NOT_STARTED  (needs: aetherius-os)
25. football-card-game           ⚠️ PARTIAL  (needs: aetherius-os)
26. hermes-config-audit          🟢 VERIFIED  (needs: aetherius-os)
27. holonav-os                   ❌ NOT_STARTED
28. ledgerlands                  🟢 VERIFIED  (needs: aetherius-os)
29. niche-platform               ⚠️ PARTIAL  (needs: aetherius-os)
30. poietek                      🟢 VERIFIED
31. quantum-ai-assistant         ❌ NOT_STARTED
32. quantum-os                   ⚠️ PARTIAL  (needs: aetherius-os)
33. qva-merged                   ⚠️ PARTIAL  (needs: aetherius-os)
34. self-building-ai             ⚠️ PARTIAL  (needs: aetherius-os)
35. sovereign-financial-os       ❌ NOT_STARTED
36. trading-bot                  ❌ NOT_STARTED
37. universal-bridge             🟢 VERIFIED  (needs: poietek)
38. veyra                        ❌ NOT_STARTED  (needs: aetherius-os)
39. virtual-assistant            ⚠️ PARTIAL  (needs: genesis)
40. web-platform                 ⚠️ PARTIAL  (needs: aetherius-os)
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
| Aetherius OS Commerce | ❌ NOT_STARTED | application | - | none | aetherius-os, agent-bridge, genesis |
| Aetherius OS Community | ❌ NOT_STARTED | application | - | none | aetherius-os, agent-bridge, genesis |
| aetherius-health-library | ❌ NOT_STARTED | - | - | - | aetherius-os |
| Aetherius OS Learning | ❌ NOT_STARTED | application | - | none | aetherius-os, agent-bridge, genesis |
| aetherius-os | ❌ NOT_STARTED | - | - | - | - |
| aetherius-os-worldclass-prototype | ❌ NOT_STARTED | - | - | - | - |
| Agent-Bridge (cloud-hybrid runtime) | ⚠️ PARTIAL | - | - | - | agent-bridge, genesis |
| IDE-Workspace | 🟢 VERIFIED | - | - | - | genesis, agent-bridge, mat |
| Agent-Bridge (supervisor UI / worker telemetry) | ⚠️ PARTIAL | - | - | - | agent-bridge, ide-workspace |
| Agent-Bridge (runtime safety) | ⚠️ PARTIAL | - | - | - | agent-bridge, genesis |
| ai-digital-clone | ❌ NOT_STARTED | - | - | - | - |
| Architecture of Shadows Book | ⚠️ PARTIAL | - | - | - | - |
| Athena | ❌ NOT_STARTED | - | - | - | aetherius-os |
| crossplatform | ⚠️ PARTIAL | - | - | - | aetherius-os |
| Decentralized Messaging App | ❌ NOT_STARTED | - | - | - | aetherius-os |
| Food Wiki App | ❌ NOT_STARTED | - | - | - | aetherius-os |
| football-card-game | ⚠️ PARTIAL | - | - | - | aetherius-os |
| Hermes-Config-Audit | 🟢 VERIFIED | - | - | - | aetherius-os |
| holonav-os | ❌ NOT_STARTED | - | - | - | - |
| LedgerLands | 🟢 VERIFIED | - | - | - | aetherius-os |
| niche-platform | ⚠️ PARTIAL | - | - | - | aetherius-os |
| Poietek | 🟢 VERIFIED | - | - | - | - |
| quantum-ai-assistant | ❌ NOT_STARTED | - | - | - | - |
| quantum-os | ⚠️ PARTIAL | - | - | - | aetherius-os |
| qva-merged | ⚠️ PARTIAL | - | - | - | aetherius-os |
| self-building-ai | ⚠️ PARTIAL | - | - | - | aetherius-os |
| sovereign-financial-os | ❌ NOT_STARTED | - | - | - | - |
| Multi-Cross-Platform-Trading-Bot | ❌ NOT_STARTED | - | - | - | - |
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

### Aetherius OS Commerce

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The application is registered but not built. Its thin vertical slice waits on the shared primitives it consum… | OPEN | TODO-APP-002 |

### Aetherius OS Community

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The application is registered but not built. Its thin vertical slice waits on the shared primitives it consum… | OPEN | TODO-APP-002 |

### Aetherius OS Learning

| Sev | Issue | Status | Todo |
|---|---|---|---|
| 🟠 high | The application is registered but not built. Its thin vertical slice waits on the shared primitives it consum… | OPEN | TODO-APP-002 |

## Verified state per project

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

### Aetherius OS Commerce

The application is registered and its scope is recorded, and nothing has been built. It is an integrated domain of the one Aetherius ecosystem, and the primitives it needs are mapped in docs/APPLICATION-SHARED-PRIMITIVES.yaml rather than built three times over.

Evidence:

- The Figma handoff of 17 October 2026 names the application and its destination.
- The shared primitive map names the owner of every primitive this application uses.

### Aetherius OS Community

The application is registered and its scope is recorded, and nothing has been built. It is an integrated domain of the one Aetherius ecosystem, and the primitives it needs are mapped in docs/APPLICATION-SHARED-PRIMITIVES.yaml rather than built three times over.

Evidence:

- The Figma handoff of 17 October 2026 names the application and its destination.
- The shared primitive map names the owner of every primitive this application uses.

### Aetherius OS Learning

The application is registered and its scope is recorded, and nothing has been built. It is an integrated domain of the one Aetherius ecosystem, and the primitives it needs are mapped in docs/APPLICATION-SHARED-PRIMITIVES.yaml rather than built three times over.

Evidence:

- The Figma handoff of 17 October 2026 names the application and its destination.
- The shared primitive map names the owner of every primitive this application uses.

## Dependents

| Project | Required by |
|---|---|
| Materials Atlas Table Codex | aetherius-os, agent-bridge, genesis, ide-workspace |
| Genesis | aetherius-commerce, aetherius-community, aetherius-learning, aetherius-os, agent-bridge, agent-bridge-cloudhybrid, agent-bridge-runtimesafety, ide-workspace, virtual-assistant |
| Agent-Bridge | aetherius-commerce, aetherius-community, aetherius-learning, aetherius-os, agent-bridge-cloudhybrid, agent-bridge-dashboard, agent-bridge-runtimesafety, ide-workspace |
| Aetherius-OS | aetherial, aetherial-platform, aetherium, aetherius-commerce, aetherius-community, aetherius-health-library, aetherius-learning, athena, crossplatform, decentralized-messaging-app, food-wiki-app, football-card-game, hermes-config-audit, ledgerlands, niche-platform, quantum-os, qva-merged, self-building-ai, veyra, web-platform |
| IDE-Workspace | agent-bridge-dashboard |
| Poietek | universal-bridge |
