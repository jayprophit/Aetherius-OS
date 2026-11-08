# Master requirements register

**Date:** 2026-11-08
**Repository:** `C:\Users\jpowe\Desktop\Projects\Aetherius-OS`
**Starting commit:** `b665453`
**Purpose:** One traceable register for the requirements repeated across the
master prompts and handoff documents. It records what is verified, what is
scaffolded, what is owner-gated and what is still research. It does not
replace the detailed design documents; it prevents requirements from being
silently dropped.

## Status vocabulary

| Status | Meaning |
|---|---|
| `VERIFIED` | Reproduced by a named command/test/deployment in this repository |
| `IMPLEMENTED` | Code exists and has focused tests, but not end-to-end verified |
| `SCAFFOLDED` | Configuration/scripts/docs exist; no artifact or device evidence |
| `DESIGNED` | Architecture/specification only; no implementation claim |
| `OWNER_GATED` | Needs owner approval, account, signing identity or payment |
| `BLOCKED` | Needs an external audit/account/decision before progress |
| `UNVERIFIED` | Claimed or intended but not demonstrated |
| `FUTURE` | Out of current release scope; visible for the 1.0 roadmap |

## Register

| ID | Requirement | Source | Status | Evidence / gap | Next action |
|---|---|---|---|---|---|
| AETH-001 | Web/PWA developer preview at a public URL | Phase 5 prompt; `release/release-scope.json` | `VERIFIED` | `https://master.aetherius-preview.pages.dev`; deployed from `b665453`; live asset hash checked | Re-verify after each deploy |
| AETH-002 | Windows desktop installation | `handoff.txt` §1; user clarification 2026-11-08 | `SCAFFOLDED` | `src-tauri/`, `.github/workflows/release-desktop.yml`; installer not yet built | Build locally, record hash + install result |
| AETH-003 | macOS desktop installation | `handoff.txt` §1 | `SCAFFOLDED` | Same Tauri project; requires macOS host/CI | Build on macOS CI; sign/notarise is owner-gated |
| AETH-004 | Linux desktop installation | `handoff.txt` §1 | `SCAFFOLDED` | Same Tauri project; WebKitGTK dependencies documented | Build on Ubuntu CI; record DEB/Flatpak/AppImage |
| AETH-005 | Android phone + tablet installation | `handoff.txt` §1; user clarification | `SCAFFOLDED` | `packaging/mobile/README.md`; preflight script | Install APK on named device/emulator |
| AETH-006 | iPhone + iPad installation | `handoff.txt` §1; user clarification | `SCAFFOLDED` | Same Tauri mobile path; Xcode/signing required | macOS + Apple signing; owner-gated |
| AETH-007 | VM installation | User clarification 2026-11-08 | `SCAFFOLDED` | `packaging/vm/` Dockerfile, Compose, cloud-init, systemd | Build image, boot disposable VM, health check |
| AETH-008 | Native Aetherius kernel / bare-metal OS | Master prompts; `native/` | `FUTURE` | `native/BUILD-TODO.md`; out of 0.1.0 scope | Keep separately gated; do not claim bootable OS |
| AETH-009 | Watches, AR glasses, TV, automotive, rings, embedded | `handoff.txt` §1 | `FUTURE` | No implementation | Keep in 1.0/device roadmap only |
| AETH-010 | One Genesis identity across models/devices/cloud | `handoff.txt` §2 | `IMPLEMENTED` | Provider abstraction; `GenesisHumanApp`; no native provider yet | Add identity/session contract tests |
| AETH-011 | Genesis never presented as an Ollama model | Prior milestone; `src/ai/provider.ts` | `VERIFIED` | `local-ollama`, `offline-fallback`, `genesis-server`, `agent-bridge` labels; shell workflow tests | Keep labels |
| AETH-012 | Native Genesis server integration | Phase 4 prompt; `GENESIS - AGENT BRIDGE - AETHERIUS.txt` | `UNVERIFIED` | No endpoint configured; Hermes training untouched | Define contract + adapter only when endpoint exists |
| AETH-013 | Agent Bridge connection and tool approval | Phase 4 prompt | `UNVERIFIED` | `probeAgentBridge` reports `NOT_CONFIGURED`; approval-only UI exists | Inspect Bridge repo contract; add adapter tests |
| AETH-014 | Cloud PWA to local model via paired companion | Phase 4 prompt | `DESIGNED` | `docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md` §3 | Design authenticated pairing; no open loopback exposure |
| AETH-015 | 143 catalogue entries with honest classification | `docs/APP-INVENTORY-2026-11-07.md` | `VERIFIED` | 143 apps; 135/135 slices pass; 42 windows wired | Continue per-app workflow depth |
| AETH-016 | All 42 app windows resolve and launch | Prior milestone | `VERIFIED` | `src/shell-workflows.test.ts` registry/menu checks | Add browser E2E window-launch sweep |
| AETH-017 | File Manager workflow depth | Phase 2/5 prompts | `IMPLEMENTED` | Virtual FS; create/read/update/delete tests in slice | Add real browser workflow test + quota/error cases |
| AETH-018 | Browser app honesty | Phase 2 prompt | `IMPLEMENTED` | Iframe tabs; not a full engine | Add iframe failure/X-Frame-Options evidence |
| AETH-019 | Terminal app honesty | Phase 2 prompt | `IMPLEMENTED` | Browser-local command set; no native exec | Keep local label; companion PTY remains gated |
| AETH-020 | Task Manager uses real signals only | Phase 2 prompt | `VERIFIED` | No `Math.random()`/simulated process table; contract test | Add browser assertion |
| AETH-021 | Security Center, Update Manager, Backup/Restore workflows | Phase 2 prompt | `IMPLEMENTED` | Slice tests exist; not browser-verified | Add workflow evidence |
| AETH-022 | Settings controls have real effects | Phase 2 prompt | `IMPLEMENTED` | Desktop/window/input/Genesis settings wired to prefs | Audit every control; remove/disable dead controls |
| AETH-023 | Cloud sync correctness (LWW, tombstones, cursor, offline) | Phase 3 prompt | `VERIFIED` | `apps/aetherius-sync` 13 tests; cloud worker tests; stress suite | Add D1/R2 integration tests |
| AETH-024 | Tenant isolation and quota fail-closed | Phase 3 prompt | `VERIFIED` | 6 stress tests (memory repo); 50k cap, 1MB body, 100/push | Add concurrent-write quota test on D1 |
| AETH-025 | Conflict preservation (no silent valuable-work loss) | Phase 3 prompt | `IMPLEMENTED` | LWW + conflict log; loser recorded | Add conflict history/version UI or documented exception matrix |
| AETH-026 | R2 free-tier protection | Prior milestone | `IMPLEMENTED` | App-side blob limits; no live quota monitor | Add usage accounting + alert threshold |
| AETH-027 | Cloudflare free-tier cost protection | Prior milestone | `IMPLEMENTED` | Record cap + request limits | Document per-operation budget and alarms |
| AETH-028 | Secret scan and no secret leakage | `SECURITY.md`; `npm run secret-scan` | `VERIFIED` | Clean scan, 6 allowlisted files | Keep in `verify` |
| AETH-029 | KeePass stays local | Owner requirement | `VERIFIED` | `Database.kdbx` not in repo/scan; no upload | No change without owner approval |
| AETH-030 | Temp sync token file deletion | Prior audit | `OWNER_GATED` | File exists; Worker secret + KeePass entry confirmed | Delete only after explicit owner OK |
| AETH-031 | Independent security audit | Release gate | `BLOCKED` | External auditor required | Owner to commission |
| AETH-032 | Independent accessibility audit (WCAG 2.2 AA) | Release gate | `BLOCKED` | External auditor required | Owner to commission |
| AETH-033 | Signed artifacts / store distribution | Release gate | `OWNER_GATED` | No signing identities or store accounts | Owner to provide |
| AETH-034 | Benchmark fixtures / 5-star evidence | Release gate | `BLOCKED` | `NOT_5_STAR` retained | Build measured fixtures; do not inflate |
| AETH-035 | Legal/privacy review | Release gate | `OWNER_GATED` | Lawyer-reviewed policy marker absent | Owner to commission |
| AETH-036 | Browser E2E (desktop + mobile viewport) | Phase 5 prompt | `UNVERIFIED` | In-app browser smoke only; Playwright not installed | Add Playwright suite with screenshots/traces |
| AETH-037 | Performance fixtures (TTI, memory, launch latency) | Phase 5 prompt | `SCAFFOLDED` | `docs/PERF-BASELINE-2026-11-07.md` static measurements | Automate repeatable measurements |
| AETH-038 | Accessibility checks in-browser | Phase 5 prompt | `UNVERIFIED` | No axe/Lighthouse evidence | Add automated + manual matrix |
| AETH-039 | Project intelligence graph (Graphify + CodeGraph) | `GENESIS - AGENT BRIDGE - AETHERIUS.txt` §20 | `IMPLEMENTED` | Graphify installed; project skill + graph build script | Build graph, commit summary, add in-app viewer |
| AETH-040 | Obsidian-linked project knowledge | User request 2026-11-08 | `SCAFFOLDED` | Obsidian 1.15.0 installed; vault not yet created | Create vault + linked notes |
| AETH-041 | REA reverse-engineering capability | User request 2026-11-08 | `IMPLEMENTED` | `rea-agents` 6.8.0 installed; static JS analysis available | Register MCP/skill; record one real analysis |
| AETH-042 | Kaggle GPU / Colab GPU compute | `GENESIS - AGENT BRIDGE - AETHERIUS.txt` §72; user request | `SCAFFOLDED` | No Kaggle credentials; no notebook bundle | Owner login; export bundle; run notebook |
| AETH-043 | MAT / Universal Bridge / IDE / Genesis repositories | Master prompts | `SEPARATE_REPOS` | Present in workspace; not rebuilt here | Coordinate, do not duplicate |
| AETH-044 | Release gate accurately scoped | Phase F prompt | `IMPLEMENTED` | 19 checks, 13 pass / 5 blockers / 1 warning | Split web-preview vs native-1.0 gates in docs |
| AETH-045 | Backup and recovery evidence | Phase H prompt | `IMPLEMENTED` | `docs/BACKUP-VERIFY-2026-11-07.md`; E: backup stale | Refresh E: backup after owner approval |
| AETH-046 | Todo tracking survives sessions | User request | `VERIFIED` | `docs/PROJECT-TODOS.yaml` + generated MD + sync test | Add this milestone's tasks |
| AETH-047 | Open-source / free-tier only | Owner requirement | `VERIFIED` | No paid services added; Graphify/REA/Obsidian free | Re-check before any paid action |
| AETH-048 | GitHub identity for pushes | User request | `VERIFIED` | `gh auth status` = `jayprophit` | Use GitHub login only; KeePass for other creds |

## Rules for using this register

1. A row may only move to `VERIFIED` with a reproducible command and an
   evidence path.
2. A missing external audit is never downgraded to "pass".
3. A configuration file does not equal a built artifact.
4. A browser viewport does not equal a mobile device.
5. Genesis training and checkpoints are read-only from this repository.
6. New requirements go into this register **and** `docs/PROJECT-TODOS.yaml`,
   not into an untracked note.
