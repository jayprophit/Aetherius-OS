# 5-Star Benchmark — Aetherius OS vs World-Class Operating Systems

**Date:** 2026-11-07
**Baseline:** `tests/fixtures/benchmark-results.json` (8 dimensions, gate-fail-closed:
no unmeasured dimension gets a score; overall 5-star requires every dimension = 5).

This document compares Aetherius OS `0.1.0` against the platforms users
actually benchmark it against: **Apple macOS, Microsoft Windows, Linux
(generic), Ubuntu, Android, iOS/iPadOS, ChromeOS**, plus **HarmonyOS** and
**the Rust ecosystem** (Redox), since the user's forks show interest there.

The rule is the same as the release gate: **no claim without evidence.**
Every gap below names the evidence that would close it.

## The bar, per platform

### macOS (Apple)
- **Settings**: System Settings with deep categories (privacy, accessibility,
  network, display, update) — every toggle wired to the system.
- **Menus**: global menu bar, per-app menus, cascading submenus, keyboard
  shortcuts everywhere.
- **Continuity + sync**: iCloud Drive sync, Handoff, Sidecar.
- **Accessibility**: VoiceOver, full keyboard navigation, reduced motion —
  best-in-class, audit-grade.
- **Security**: Gatekeeper, FileVault, sandboxing, least-privilege.
- **5-star bar**: settings depth + accessibility + continuity.

### Windows (Microsoft)
- **Settings**: deep control panels, device integration, Group Policy.
- **Menus**: ribbon/command palette, context menus everywhere.
- **Device drivers**: plug-and-play hardware discovery.
- **5-star bar**: hardware support + settings depth + driver model.

### Linux (generic) / Ubuntu
- **Settings**: desktop environment prefs + per-app profiles.
- **Package management**: apt-style repos, `.deb` — the gold standard for
  software distribution.
- **Open formats**: everything is a file; interoperable by default.
- **5-star bar**: package management + open formats + hardware breadth.

### Android / iOS
- **Settings**: granular per-app permissions, quick settings tiles.
- **Notifications**: rich, actionable, per-app channels.
- **Sync**: cloud-first accounts, zero-config backup.
- **5-star bar**: notifications + per-app permission model + zero-config sync.

### ChromeOS (Google)
- **Settings**: account-centric, simple, web-first.
- **Sync**: Chrome sync across devices — the benchmark for "just works".
- **5-star bar**: zero-config cloud sync + simple settings.

### HarmonyOS / Redox
- **HarmonyOS**: distributed devices, super-device continuum.
- **Redox**: Rust-based, microkernel-inspired — the inspiration for a clean,
  written-from-scratch OS. Its fork is in the user's GitHub.

## Current state (measured 2026-11-07)

| Dimension | Weight | Score today | Evidence |
|---|---|---|---|
| Foundation (app-kit + slices compile) | 15% | **4/5** | 135 slices, typecheck clean, verify green |
| Default core (mandatory workflows) | 20% | **3/5** | Slices pass; UI windows only 6 wired |
| Advanced unique (security/sync/AI) | 15% | **3/5** | Sync live + proven; kernel honest labels |
| Settings | 10% | **2/5** | 3 categories; most OS features absent |
| Formats | 10% | **4/5** | DOCX/XLSX/PPTX/PDF structural checks pass |
| Performance | 10% | **2/5** | 651 KB bundle; no timing/resource fixtures |
| Security & accessibility | 10% | **1/5** | Security Center new (domain only); a11y needs audit |
| Cross-platform | 10% | **2/5** | Web/PWA works everywhere; no signed native artifacts |

**Overall: NOT 5-STAR** (every dimension must be 5, all gates PASS).

## What "5-star" requires, per dimension — and who provides the mechanism

### 1. Foundation — close with what's already forked
Mechanisms to borrow:
- **tree-sitter** (forked) → the IDE's language-aware editing and semantic search.
- **meson + CMake** (forked) → build system for any native component; the
  aether-boot/Redox-style microkernel direction.
- **vllm / executorch / ComfyUI** (forked) → local AI inference stack
  (token-free, on-device) behind Athena.
- **protobuf + grpc** (forked) → the typed service bus between shell and agents.

### 2. Default core — wire the windows
- 41 UI components exist; **6 wired**. Wire the rest behind the error
  boundary (already in place). Target: every `components/apps/*` opens in a
  window from the launcher.

### 3. Advanced unique — finish the differentiators
- Sync is live ✅ → add blob sync over R2 (bucket ready, binding live).
- Local AI: Ollama default ✅ → add the Genesis CLI bridge fully.
- Kernel honesty ✅ → keep the capability report as the UI source of truth.

### 4. Settings → world-class depth
Required cascading structure (see below). Borrow from:
- **macOS**: category depth + accessibility depth.
- **Windows**: device/hardware panels.
- **Android/iOS**: per-app permissions and quick toggles.
- **Ubuntu**: package/format interoperability prefs.

### 5. Formats
- Structural checks pass (4/4). Full acceptance fixtures (DOCX/XLSX/PPTX/
  PDF/media/CAD/BIM/MIDI/collaboration) are the gate — each needs a fixture
  that round-trips through the real format, not just structurally.

### 6. Performance
- Code-split the bundle (651 KB → dynamic import for Settings/apps).
- Add timing fixtures: shell boot time, app open latency, and a memory budget.
- **REA interop** (see §8): measure resource usage of every tool run.

### 7. Security & accessibility
- Ship the Security Center **UI** (domain is done).
- Independent security audit + WCAG 2.2 AA audit (external gates, recorded).
- **seL4** (forked) → the formal-methods reference for a kernel whose security
  claims are *proven*, not asserted. The kernel honesty labels already follow
  that spirit; seL4 is the north star.

### 8. Cross-platform
- **Redox** (forked) + **tock** (forked, TI open-source OS) → the open
  microkernel direction for a native Aetherius OS build.
- **bootc** (forked) → atomic, container-native OS upgrades.
- **systemd** (forked) → process/service supervision model.
- **9front** (forked) → the 9P file-server protocol for distributed filesystems.
- **grafana** (forked) → the monitoring dashboard model for system telemetry.
- Signed artifacts + install/rollback evidence are the gate.

## Menus and settings structure (recommended)

### Global menu bar (macOS-style, always on top)
```
Aetherius OS | File | Edit | View | Window | Help
  File      → New Window, New Note, Open…, Close Window, separator, Export…, Import…, Print…, separator, Quit
  Edit      → Undo, Redo, separator, Cut, Copy, Paste, Select All
  View      → Zoom In, Zoom Out, Actual Size, separator, Toggle Sidebar, Toggle Notifications
  Window    → Minimize, Maximize, separator, <open windows list>
  Help      → Documentation, Keyboard Shortcuts, About Aetherius OS
```

### Start-menu / launcher (Windows + Android hybrid)
```
Applications (grid, searchable)
Pinned apps
Recent apps
All Applications (alphabetical)
separator
Files · Settings · Help & Support · Terminal · Software
separator
Power: Restart · Sleep · Shut Down
```

### Context menus (right-click, cascading)
```
Open / Open with ▸ (Notes, Writer, Sheets, Slides, Canvas, Text Editor)
Rename
Copy
Move to ▸ (Documents, Uploads, Cloud)
Tag ▸ (Work, Personal, Urgent)
separator
Encrypt with Vault
Share via Sync ▸ (Device, Cloud, Link)
Delete
```

### Settings (deep, macOS-grade)
```
Shell            → Shell settings (store), Display (theme), About (measured)
Cloud & Sync     → endpoint, session token, health, sync now, conflicts
Applications     → 143-entry catalogue w/ manifest status
Personalization  → Wallpaper, sounds, notifications, accessibility
System           → Network, Privacy (per-app permissions), Security Center,
                   Updates (channels/rollback), Backup & Restore
People & Accounts → local profiles (no fake accounts)
AI               → local Ollama first, remote providers opt-in w/ session key
Advanced         → Provider endpoints, telemetry (off by default), storage
```

### Per-app permission model (Android-grade)
Each app declares capabilities; Settings → Privacy shows grant/deny per app.
Default-deny (the app-kit permission primitive already does this).

## What to build, in order

1. **Menu bar + launcher menus** (macOS/Windows parity) — closes the biggest UX gap.
2. **Wire remaining app windows** (41 components) — closes default-core gap.
3. **Blob sync over R2** — bucket + binding live; needs a blob transport.
4. **Settings depth** — categories above, each page honest or excluded.
5. **Code-splitting + performance fixtures** — bundle + timing evidence.
6. **Sentry SDK wiring** — project + public DSN ready; needs the bundle change.
7. **Format acceptance fixtures** — DOCX/XLSX/PPTX/PDF/media round-trips.
8. **Signed artifacts + install/rollback evidence** — cross-platform gate.

## REA's role (from `research/rea`)

Reverse-engineering capability already has a registry entry ("proposed").
It's the mechanism for §7-8: profile the OS, reconstruct specs, register
findings without duplicating existing Aetherius capabilities. The proposed
experiment (small JS/Electron app investigation) is exactly the dogfood that
proves it before the 5-star gates.
