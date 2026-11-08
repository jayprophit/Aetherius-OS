# Omarchy REA Research — Native Runtime Reference for Aetherius

**Date:** 2026-11-08
**Target repo:** `C:\Users\jpowe\Desktop\Projects\Aetherius-OS` (`master` at `8cf0a0e` before this milestone)
**Status:** Research only — no OS-install claim, `NOT_RELEASABLE` / `NOT_5_STAR` retained.

## 1. Source provenance

| Field | Value |
|---|---|
| Upstream repo | `https://github.com/omacom/omarchy` |
| Source branch | `quattro` |
| Upstream commit SHA (retrieved 2026-11-08 via GitHub API) | `f70c317fc6b2fb07801fa9b782cc6e710fb9183e` |
| Commit subject | `Update translations (#18190)` |
| Commit author / committer | `Omarchybot <omabot@omarchy.org>` / `GitHub <noreply@github.com>` |
| Commit date | `2026-11-08T19:10:02Z` |
| Signature | Valid PGP (`verified:true` via API) |
| Licence (repo) | MIT (repo `LICENSE`; see §7 for third-party components) |
| Retrieval method | Selective read-only `webfetch` of raw files + GitHub API; no clone of build artefacts |

### Source files examined (exact refs at `f70c317…`)

| File | URL | Used for |
|---|---|---|
| `docs/file-layout.md` | `https://github.com/omacom/omarchy/blob/quattro/docs/file-layout.md` | Repo→installed-path map, seed/finalize/resync layers |
| `docs/omarchy-shell.md` | `https://raw.githubusercontent.com/omacom/omarchy/quattro/docs/omarchy-shell.md` | Plugin manifest, IPC, `shell.json`, theme tokens |
| `manual/30-updates.md` | `https://raw.githubusercontent.com/omacom/omarchy/quattro/manual/30-updates.md` | Update channels, snapshots, rollback |
| `manual/17-ai.md` | `https://raw.githubusercontent.com/omacom/omarchy/quattro/manual/17-ai.md` | Agent launcher, default-agent, usage panel, local models |

No Omarchy code, assets, trademarks or configuration were copied. Findings below are patterns described in their own words, cross-referenced against Aetherius code.

## 2. What Omarchy is

Arch Linux-based, installable desktop distribution using Hyprland (Wayland compositor) and Quickshell desktop. Omarchy 4.5 announced 2026-11-04 (floating layouts, dock, wider language support, selected Apple Silicon Mac support).

Key architectural idea: one repo builds two Arch packages:

- **`omarchy`** — runtime binaries (`bin/omarchy-*`), install/finalize scripts (`install/`), migrations, themes, Quickshell desktop (`shell/`).
- **`omarchy-settings`** — everything needed before `omarchy` installs (notably before `useradd -m` and limine install): `/etc/skel/**`, `/etc/` drop-ins, `/usr/share` + `/usr/lib` system files, fonts, plymouth/sddm themes, limine/snapper configs, debug binaries for live ISO.

Standalone packages: `omarchy-keyring`, `omarchy-nvim`. Repo-only trees: `manual/`, `agents/skills/`, `docs/`, `test/`, `plans/` — never installed.

## 3. Patterns worth studying (P0 = foundational)

### 3.1 File layout — seed / finalize / resync
Three layers populate `$HOME`:

1. **Seed** — `omarchy-settings` → `/etc/skel/` → `useradd -m` copies into new `$HOME` (only mechanism for brand-new users).
2. **Finalize** — `omarchy-provision-user` runs once per user for things `/etc/skel` cannot do (needs `$HOME` expansion, live `$OMARCHY_PATH`, or runtime system-state detection).
3. **Resync** — `omarchy-reinstall-configs` destructively clobbers existing user configs back to shipped defaults (`cp -af /etc/skel/.` + limine/plymouth/nvim refresh).

Deferred provisioning (`omarchy-apply-system --defer-provisioning`) leaves `/var/lib/omarchy/provisioning/pending`, arming `omarchy-provision-owner.service`. On first boot `omarchy-provision-owner` creates the user on tty1 and runs finalize; on encrypted install it re-keys LUKS from staged install key to owner password via `luks-rekey.sh`, journalling phase/slot (never keys) for resume.

Prebuilt images queue hardware steps in `/var/lib/omarchy/image/deferred-steps`, run offline on first boot via `omarchy-provision-hardware`, serialised, exit 75 on step failure (stays queued), 1 on trust failure.

**Aetherius cross-ref:**
- Existing `packaging/vm/` is a Docker appliance (not a native OS). `src-tauri/` is the desktop host (see §5). `native/` is a bare-metal kernel track (P11 proofs only).
- **Gap:** Aetherius has no seed/finalize/resync separation for desktop app settings, no deferred-provisioning queue, no image manifest. Recommending a small, original implementation in `packaging/` (not copying Omarchy scripts).

### 3.2 Metadata / config overlays
System defaults, user-owned settings, plugin customisations separated. `shell.json` canonical once user customizes (no deep-merge); theme tokens in `shell.toml` (generated from `default/themed/shell.toml.tpl`) + machine override `~/.config/omarchy/shell.toml` wins over theme. Spacing/font tokens scalable; bare `Color` warned (Qt 6.12 conflict) — must use `Commons.Color`.

**Aetherius cross-ref:**
- `src/apps/shellRegistry.tsx` (30 lazy entries) + `data.ts` (52 unique components) is the closest analogue. The shell-e2e sweep shows 12 window ids still served by legacy `src/main.tsx` switch, not the lazy registry — tracked as a gap, not claimed `E2E_VERIFIED`.
- **Gap:** No user-vs-system overlay for app settings, no theme-token layer. `apps/aetherius-settings/src/domain.ts` exists as a service but no overlay merge rule.
- **Proposal (P0):** Introduce a documented overlay precedence: shipped defaults (read-only) → platform/service defaults → user overrides (version-controllable, e.g. `~/.config/aetherius/`). Never merge silently; last-writer wins with explicit resync command.

### 3.3 Package / update lifecycle
Packaging via `omarchy-pkgs` repo (`pkgbuilds/`). Four channels: stable (official releases, mirror 1 month behind), RC, edge, dev (git checkout `~/omarchy` + edge pkgs). Switching via `omarchy-channel-set`. Update runs pre-update snapshot, system upgrade, per-user migrations (`omarchy-migrate` — state in `~/.local/state/omarchy/migrations/`, idempotent, runs as user; `omarchy-migrate-notify.service` notifies once per login, never auto-runs), then `omarchy-hook post-update`. Direct `pacman -Syu` is blocked and points to `omarchy update`.

Rollback: pick pre-update snapshot in bootloader. `omarchy reinstall` reinstalls default packages, resets to stable, downgrades too-new packages, resets config files (user changes clobbered).

**Known limitation (per updates doc + REA brief):** Rollback restores root filesystem but **not** `/home` — configuration-version mismatch. Migrations live per-user and run only on login trigger, not via filesystem watcher (watcher cannot distinguish bypassed `pacman -Syu` from normal update).

**Aetherius cross-ref:**
- `scripts/release-gate.mjs` is fail-closed (19 checks); `signed-artifacts` blockers (0/0) mean no signed updates today.
- `packaging/vm/` serves `dist/` via nginx (Docker), not a native OS image.
- **Proposal (P0):** Update manifest with channel + snapshot + migration journal; rollback must be config-aware (snapshot `/home` subset or versioned settings) and migrations must run atomically with the package transaction. Do not block direct upgrades silently without an escape hatch and audit log.

### 3.4 Agent integration
Default-agent selection (`omarchy default agent`), usage panel (5-hr + weekly meters, aggregate “what you used” line, per-account side-by-side, 95% notify + autoswitch, 15-min refresh), local-model hosting via Podman + NVIDIA toolkit (recipe-based, `omarchy agent local use/list/start/stop`, OpenAI-compatible `http://127.0.0.1:11435/v1`), crash diagnosis via `systemd-coredump` → default agent with `diagnose-crash` skill. Agents installed lazily via mise (first launch installs, 4-hr update check, offline fallback to installed version). Default-agent launcher `Super+Shift+Ctrl+A` unattended (don't-stop-to-ask) — explicitly flagged “be ready for them to actually do things”.

Desktop AI apps: ChatGPT, Claude (beta), Grok Bot, Herdr Desktop, Hermes Desktop (only install path for `hermes`), OpenClaw (Control UI + local gateway), Perplexity, T3 Code (AppImage, Stable/Nightly).

**Aetherius cross-ref:**
- Hive MCP (`orchestration/hive/mcp-server.mjs`, 29 shared tools), `apps/Athena` `AgentCoordinator` (`delegate/register/complete/agentsSnapshot/history`, verified via Graphify path `ledger.ts::GENESIS ⊏ nowIso() ⊏ athena.ts ⊏ AgentCoordinator`), `src/ai/localClient.ts` (`listLocalModels/chooseLocalModel/chatWithLocalModel`) + `src/ai/provider.ts` honest provider labels (`local-ollama`, `genesis-server`, `agent-bridge`, `offline-fallback`).
- **Gap:** No default-agent UX, no aggregate usage/entitlement panel, no unattended-mode guardrails. `AETHERIUS_ALLOW_PAID=1` is the only paid path.
- **Proposal (P1):** Unify Hive work-ledger + Model Fabric entitlement + Agent Bridge routes behind one owner-approved launcher; never inherit passwordless sudo / auto-approval without explicit narrow scope.

### 3.5 Desktop shell (Quickshell)
Single long-running Quickshell instance; bar/panels/overlays/menus/services as plugins. IPC is canonical: `omarchy-shell` forwards a call to running shell, fails when not running (`-q` best-effort, `OMARCHY_SHELL_IPC_TIMEOUT` bound). Plugin manifest `schemaVersion:1` with `kinds` (`bar-widget`, `bar`, `panel`, `overlay`, `menu`, `service`), entry points, `keepLoaded`. Only one full bar active; built-in `omarchy.bar` fallback. `shell.json` holds `bar.id`, `bar.layout.{left,centerBegin,center,centerEnd,tray,right}`, inline settings, `version:1`. Theme tokens via `Commons.Color` / `Style` / `Border`.

IPC methods: `ping`, `summon/hide/toggle`, `togglePanelAt`, `call`, `rescanPlugins`, `reloadConfig`, `applyTheme`, `toggleBarTransparency`, `cycleInput`, `setPluginEnabled`, `enablePlugin`, `putBarWidget`, `moveBarWidget`, `setBarWidget`, `listPlugins`, `listShellConfig`, `debugBarGeometry`.

**Limitations (explicit in source):** Third-party plugins run **unsandboxed in the same process**; scoped facades are API boundaries, not same-process QML sandboxes — visual widgets can walk parent hierarchy to ordinary host objects. Sensitive state must not rely on facade alone. Install warns before cloning, lands disabled for review, updates show diff. Saving files reloads code automatically (hot-reload is a risk).

**Aetherius cross-ref:**
- `src-tauri/src/lib.rs` is a deliberate zero-privilege host (native window + webview only, no privileged commands — Graphify query confirms `frontendDist: ../dist` + local `devUrl` only).
- Current browser shell is not Quickshell; a shared platform-abstraction + native services layer is needed rather than replacing the React UI.
- **Proposal (P0/P1):** Adopt manifest + IPC shape for Aetherius plugins (versioned manifest, kinds, entry points, rescan/hot-reload with audit), but enforce **process-level isolation** for untrusted plugins, explicit user approval for privileged IPC, and no shared-scene traversal.

## 4. Feature matrix vs Aetherius (verified gaps marked)

| Omarchy capability | Aetherius today | Evidence | Gap / Action |
|---|---|---|---|
| Native Linux installer + first-boot provisioning | Not present as OS install; Docker appliance + Tauri desktop scaffold only | `packaging/vm/Dockerfile`, `src-tauri/tauri.conf.json`, `kernel/compute/manifest.json` (`PARTIAL_COMPLETE`) | **P0:** Small deferred-provisioning + user-finalize in `packaging/`; no OS-install claim until built/escaped evidence |
| Quickshell event-driven IPC | Tauri host with zero privileged commands; webview loads `../dist` | `src-tauri/src/lib.rs`, Graphify `tauri.conf` nodes | **P0:** Add versioned plugin IPC (command-scoped, audited), keep host zero-privilege by default |
| Config overlays (seed/finalize/resync) | Settings service exists; no overlay precedence | `apps/aetherius-settings/src/domain.ts` | **P0:** Document + implement overlay precedence with explicit resync |
| Signed packages, channels, migrations, snapshots | Release gate `NOT_RELEASABLE` (signed-artifacts 0/0, acceptance, 5-star blocked) | `scripts/release-gate.mjs` | **P0:** Channel manifest + snapshot-aware rollback; signing still owner-gated |
| Tiling/scrolling/floating, dock, notifications | Browser window system; 30/52 windows in lazy registry, 12 legacy-only | `src/shell-e2e.test.ts`, catalogue 143/135 | **P1:** Expand window modes via native compositor adapter on Linux only; keep React shell as shared UI |
| Plugin manifests | Catalogue + `shellRegistry.tsx` + app slices; no sandbox | `src/apps/catalogue.ts`, `apps/verify.mjs` | **P1:** Manifest v1 + process isolation; never unsandboxed third-party code |
| Agent launcher + usage dashboard | Hive MCP + Athena coordinator + localClient + provider honesty | Graphify `GENESIS→AgentCoordinator`, `src/ai/*` | **P1:** Unified launcher UX; no auto-approval / passwordless sudo by default |
| Btrfs/Snapper/Limine recovery | No snapshot/bootloader for Aetherius OS | `native/`, `kernel/compute/manifest.json` | **P1:** Filesystem snapshot design; fix Omarchy’s `/home`-mismatch failure pattern explicitly |
| Event-driven widgets | Polling/ledger append; no event bus metrics | `apps/app-kit/src/ledger.ts` | **P1:** Measure CPU before claiming gain; add event bus behind ledger |
| Hardware profiles / platform hints | `scripts/platform-preflight.mjs` (desktop BUILDABLE, android/ios BLOCKED) | Preflight JSON 2026-11-08 | **P2:** Platform-package root (`/usr/share/omarchy-platform/` analogue) as Aetherius adapter contract — no hardware claim without evidence |

All priorities from §3 are proposed, not implemented. Cross-device architecture (Windows/Linux/macOS/Android/iOS) is preserved; Hyprland/Quickshell are Linux-only and must not become the shared window system.

## 5. Aetherius native runtime — current truth (no new claim)

- **Web/PWA tier (VERIFIED):** `npm run build` → `dist/index.html` + service worker; served by Cloudflare Pages (`aetherius-preview`).
- **Desktop tier (SCAFFOLDED, BUILDABLE per preflight):** `src-tauri/` Tauri 2 host; `frontendDist: ../dist`, `beforeBuildCommand: npm run build`; icons generated by `scripts/generate-tauri-icons.mjs` (32/128/256 + `.ico`/`.icns`). No installer artifact + SHA-256 yet — first implementation target.
- **VM/appliance (BUILDABLE):** `packaging/vm/Dockerfile` (node:22-alpine build + nginx:1.27-alpine, healthcheck `/healthz`).
- **Native kernel (PARTIAL_COMPLETE):** `kernel/compute/manifest.json` — not a bootable GP OS.
- **Mobile:** `platform:preflight` BLOCKED (no `ANDROID_HOME`/`NDK_HOME`, no Xcode) — `UNVERIFIED`.

Required acceptance (unchanged): at least one native client built, installed, launched offline, core apps local, data persisted, cloud resync after reconnect. Then generalise. No Windows installer = proof of OS.

## 6. What not to copy

- Omarchy appearance (themes, bar layout, branding) — do not copy.
- Unsandboxed plugin model and same-process QML traversal.
- Passwordless sudo / auto-approving agents by default.
- Snapshot rollback that ignores `/home`.
- Any trademarked asset.

Extract patterns and failure modes; write original Aetherius implementations.

## 7. Licensing / dependencies / platforms

- **Omarchy repo:** MIT — reuse requires MIT attribution, no endorsement, retain copyright/permission notice. This document describes patterns, not copied code.
- **Upstream components (own licences, verify independently before any integration):** Arch Linux, Linux kernel, Hyprland, Quickshell, Qt, PipeWire (implied), Btrfs/Snapper/Limine, fonts, plymouth/sddm, uwsM, mise, systemd, Node/Rust (Aetherius side).
- **Applicable platforms (Omarchy):** x86_64, aarch64 (`aarch64-apple`, `aarch64-qualcomm`, `aarch64-n1x`, `aarch64-gb10`) via `omarchy-hw-platform`. Platform files under `/usr/share/omarchy-platform/` only.
- **Aetherius platforms:** Windows/Linux/macOS/Android/iOS as in §5; unsupported = `UNVERIFIED`.

## 8. Testable acceptance criteria for proposals

Each proposal must ship with:

1. Upstream ref (commit SHA + file + line range).
2. New/changed Aetherius files (original implementation).
3. Regression test that fails without the change and passes with it.
4. Local offline launch evidence (no internet) + persistence + resync log.
5. SHA-256 of any produced artifact + build environment + arch.
6. Security review (isolation, privilege, audit).

No claim until 1–6 exist.

## 9. Prioritised implementation proposals

1. **P0 — Local runtime:** Produce first Windows Tauri installer (`npm run desktop:build`), record SHA-256, install/launch offline, verify File Manager/Settings persistence, then document honestly in `docs/CROSS-PLATFORM-DELIVERY-2026-11-08.md`.
2. **P0 — Plugin IPC:** Manifest v1 + command-scoped IPC in `src-tauri/` (or a narrowly-gated companion service) with process isolation for untrusted plugins; no privileged commands by default.
3. **P0 — Config overlays:** Documented precedence + explicit resync; migrate `SettingsService` to overlay reads.
4. **P0 — Updates:** Channel manifest, migration journal, snapshot-aware rollback that includes `/home` subset; signing remains owner-gated (release gate stays `NOT_RELEASABLE`).
5. **P1 — Agent launcher:** Unified default-agent picker + usage/entitlement panel reusing Hive ledger + Model Fabric; unattended mode requires explicit owner scope.
6. **P1 — Event bus:** Replace polling in windows with ledger-driven events; measure CPU before/after on constrained device.

## 10. Open issues

- Tauri CLI not vendored (`node_modules/@tauri-apps` absent) — `desktop:build` requires `npm i -D @tauri-apps/cli` (free, Node 22+).
- No signed artifacts (owner provides identities).
- No independent pen-test / WCAG audit.
- Graphify freshness vs HEAD needs `graphify update .` after each code change.
- Hermes training must not be interrupted; Agent-Bridge `d1927fb` review branch not merged.

---

**Next engineering milestone:** Build/install/launch offline Windows client with SHA-256 evidence; then generalise shared core to Linux/macOS. Keep `NOT_RELEASABLE`.
