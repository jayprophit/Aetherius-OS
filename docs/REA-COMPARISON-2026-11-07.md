# REA Comparison — Aetherius OS vs Apple, Microsoft, Linux, Ubuntu, Android, iOS, Google OS and Others

**Date:** 2026-11-07
**Method:** Reverse-engineer-anything (REA) — behaviour-first comparison. Copy no code, no
assets, no trademarks. Abstract mechanisms, build first-party equivalents, keep the AGPL
boundary, and label every claim with evidence.

This document answers the request to REA the full target set before claiming 5-star parity.
It is the companion to `docs/BENCHMARK-5STAR-2026-11-07.md` (the scores) and
`docs/GAP-ANALYSIS-2026-11-07.md` (the work queue).

## The REA rule

1. **Observe behaviour**, not source. Dock, menus, widgets, settings groups, input models.
2. **Abstract the mechanism** (e.g. "context menu = mouse / touch / keyboard entry points
   into one data-driven menu").
3. **Rebuild first-party** with Aetherius data and honest local behaviour.
4. **Never claim** a platform feature that was not built and measured here.

## 1. At a glance — the comparison matrix

| Area | macOS (Apple) | Windows (Microsoft) | Linux generic (GNOME/KDE) | Ubuntu | Android | iOS / iPadOS | ChromeOS (Google) | Aetherius 0.1.0 after this pass |
|---|---|---|---|---|---|---|---|---|
| Right-click / long-press menus | Ctrl-click, two-finger | Right-click everywhere | Right-click, Shift+F10 | Same as Linux | Long-press | Long-press, edit mode | Right-click, touch | Right-click, two-finger, long-press (500–900 ms configurable), Shift+F10 / Menu key ✅ |
| Mouse / keyboard / touch | Trackpad, keyboard, touch | Mouse, touch pen, keyboard | Mouse, touch, keyboard | Same | Touch-first + hardware kbd | Touch-first + mouse (iPadOS) | Mouse, touch, keyboard | Pointer Events unify mouse/touch/pen; keyboard launches, nudges, resizes ✅ |
| Window model | Floating + Spaces, snap | Layered, snap layouts, maximize | Tiling or floating (WM dependent) | GNOME floating + snap | Fullscreen + split-screen | Split View, Stage Manager | Free-form, shelf | Drag title bar, corner resize, maximize/restore, minimize, right-click window menu ✅ |
| Desktop icons | Finder grid, stacks, folders | Free placement, groups | Free + auto-arrange | Docks + desktop icons ext | Home folders, widgets | Home + libraries | Shelf + bookmarks | Free drag + snap-to-grid, auto-arrange, sort (name/type), group (type/first letter), lock, labels on/off ✅ |
| Widgets | Notification Center, Scriptable | Widgets board | GNOME extensions | Top bar + extensions | Home-screen widgets (S/M/L) | Smart Stack, widgets (S/M/L) | Shelf + widgets panel | Drag to move, S/M/L cycle (180×120 / 240×160 / 320×215), visibility per widget, reset, keyboard nudge — defaults small ✅ |
| Settings groups | System Settings (deep, sandboxed toggles) | Settings + Control Panel | Settings (GNOME/KDE) | Settings (GNOME) + Software | Settings + per-app permissions | Settings + per-app permissions | Settings (account-centric) | Shell, Desktop & Widgets, Windows & Input, Genesis Human, Cloud & Sync, Applications — every control wired to a live preference ✅ |
| Per-app permissions | Entitlements, sandbox | UAC, app capabilities | Flatpak portals | Snap/Flatpak permissions | Runtime permissions (camera/mic/location) | Runtime permissions + tracking consent | Site permissions | Capability declarations via app-kit (default-deny); Genesis camera/mic stay off until the user enables them in-window ✅ |
| Notifications | Rich, actionable, Focus | Toasts, action centre | Notification daemons | GNOME notifications | Channels, actions | Interactive, Focus | Chrome notifications | Empty honest queue until a backend posts; no fake notifications ✅ |
| Updates | Delta, auto, rollback | Feature + cumulative, staged | Distro repos, atomic options | apt, .deb, snap, unattended | Play delta, rollback via A/B | Silent delta, rollback | Forced + rollback | Cloudflare Pages atomic deploy + per-build service-worker versioning; signed native artifacts remain an owner gate |
| Distribution | DMG / App Store, notarisation | MSIX, installer, Store | .tar, package managers | .deb, snap, PPA | APK/AAB, Play | IPA / App Store | Web apps, PWA | PWA live on Pages + Vercel; Ubuntu abstracted as .deb + systemd boundary (no copying); signing pending |
| Accessibility | Best-in-class (VoiceOver) | Narrator, Ease of Access | AT-SPI, screen readers | GNOME a11y | TalkBack, switch access | VoiceOver | ChromeVox | Focusable widgets/icons, ARIA menus, keyboard paths; independent WCAG audit still an external gate |
| Sync / continuity | iCloud, Handoff, Sidecar | OneDrive, Phone Link | Syncthing, Nextcloud | Ubuntu One (legacy) | Google accounts, backup | iCloud backup | Chrome Sync | Cloudflare Worker + D1, deterministic LWW, tombstones, append-only log, offline outbox, R2 blobs under free tier; live push/pull/converge proven |

## 2. Per-platform REA notes

### 2.1 Apple — macOS and iOS/iPadOS

**Mechanisms worth abstracting:**
- **Global menu bar** whose contents follow the focused app. Aetherius already has this
  (`components/MenuBar.tsx`) with cascading submenus.
- **System Settings depth.** macOS groups toggles by system capability, not by app. Aetherius
  now mirrors the grouping shape (Desktop, Windows & Input, Genesis) with honest in-shell scope
  labels — the web preview cannot touch hardware settings and says so.
- **Touch-first parity.** iPadOS shows a pointer UI on a touch device: right-click alternatives
  (long-press), drag with touch, keyboard when attached. Aetherius uses Pointer Events for
  widgets, windows and icons so one code path serves mouse, touch and pen.
- **Widgets as user-sized tiles.** iOS widgets come in S/M/L and can be placed, hidden and
  stacked. Aetherius widgets now do the same (S/M/L cycle + drag + per-widget visibility).
- **What we do not borrow:** Apple branding, assets, or iCloud services. Continuity is
  replaced with the free Cloudflare sync fabric already live.

### 2.2 Microsoft — Windows

**Mechanisms worth abstracting:**
- **Context menus everywhere**, including desktop background and icon right-click with
  Refresh / Arrange / View / Personalize. Aetherius desktop right-click now offers Refresh,
  Auto-arrange, Icon size, Lock layout, Show/hide widgets and Settings.
- **Settings depth + device panels.** Windows Settings mixes system, devices, network, privacy.
  Aetherius mirrors the shape with Shell, Desktop, Windows & Input, Genesis, Cloud & Sync and
  Applications categories.
- **Window snap layouts and maximize.** Aetherius windows now maximize/restore, drag to move
  and resize from the corner. Edge-snap-to-half is a recorded WindowPrefs toggle; the full
  snap-layout grid remains a 1.0 item.
- **Driver model** (plug-and-play discovery) has no web-preview equivalent. Aetherius is honest
  about it: the capability report labels what the shell can actually detect (cores, heap,
  online state) and invents nothing.

### 2.3 Linux (generic) and 2.4 Ubuntu

**Mechanisms worth abstracting:**
- **Everything is a file / open formats.** Formats stay the 5-star gate: structural checks
  pass, full round-trip fixtures remain. Nothing new claimed.
- **Ubuntu as packaging abstraction, not source.** The benchmark already commits to this:
  Aetherius ships as a `.deb` against the Ubuntu LTS core conceptually, with `systemd` units
  for sync/agent services and bootc-style atomic upgrades as the north star. No Ubuntu code is
  copied; the integration is at the packaging and service boundary.
- **GNOME Settings clarity.** Ubuntu Settings separates Appearance, Notifications, Sound,
  Network, Privacy, System. Aetherius Desktop & Widgets mirrors that separation for the desktop
  surface only.
- **Extensions / widget ecosystem.** GNOME widgets are small, composable and removable. Aetherius
  widgets are now removable (per-widget visibility), resizable and resettable.

### 2.5 Android

**Mechanisms worth abstracting:**
- **Runtime permission model.** Android asks per capability (camera, mic, location) at use time
  and lets the user revoke. Genesis Human does the same: camera and microphone stay off until
  the window toggles them; denial is handled honestly; nothing records or uploads by default.
- **Per-app permissions in Settings.** The Aetherius capability registry already defaults to deny;
  the Privacy settings surface remains a 1.0 item (recorded, not faked).
- **Home-screen widgets with size tiers.** Android widgets resize within grid cells. The
  Aetherius S/M/L cycle is the same idea at desktop scale.
- **Quick Settings tiles.** The top bar already exposes zoom, view mode and notifications; a
  full quick-settings grid remains a 1.0 item.

### 2.6 iOS / iPadOS (phone and tablet)

**Mechanisms worth abstracting:**
- **Adaptive layout.** The shell already toggles a mobile grid view. Touch targets can grow to
  "large" via InputPrefs for tablets; long-press handles the right-click alternative.
- **Edit mode vs normal mode.** iOS separates icon editing from launching. Aetherius separates
  them with the Lock layout toggle and the 5 px (configurable) click-vs-drag threshold.
- **Focus and Do Not Disturb.** The universal settings engine already models Focus in source;
  it stays unwired until notifications have a real backend (recorded, not faked).

### 2.7 Google OS — ChromeOS and Fuchsia

**Mechanisms worth abstracting:**
- **Account-centric, web-first, zero-config.** ChromeOS proves settings can be simple when
  sync is free and automatic. Aetherius already proves the same on the data plane (Worker + D1
  + R2, no charge inside the free tier) and now makes the desktop surface equally simple.
- **Shelf + workspace model.** ChromeOS shelves and workspaces map to the Aetherius taskbar and
  the mobile grid view. Windows stay free-form because the benchmark keeps floating plus
  maximize as the 5-star bar.
- **Fuchsia's capability model.** Default-deny capabilities are the same primitive Aetherius
  adopts through the app-kit permission layer. No Fuchsia code is taken.

### 2.8 Others

| System | What REA extracts | What Aetherius does |
|---|---|---|
| **HarmonyOS** | Distributed devices, super-device continuum | Recorded as a 1.0 sync direction; no distributed-device claim now |
| **Redox** (Rust, microkernel-inspired) | Clean-slate discipline | North star for a native build; web preview stays honest |
| **seL4** | Formally verified kernel claims | Honesty labels follow the spirit; no formal proof claimed |
| **tock / TockOS** | Tiny trustworthy embedded OS | Recorded only |
| **9front / 9P** | Distributed filesystems by protocol | 9P-style file sync is a 1.0 direction; R2 blobs cover the preview |
| **Grafana** | Telemetry dashboards with real series | SystemWidget shows only real browser signals; no invented series |
| **systemd** | Service supervision model | Sync/agent services run as systemd units in the native design (packaging boundary) |
| **bootc** | Atomic container-native OS upgrades | Pages deploys already give atomic web upgrades; native atomic upgrades pending |
| **tree-sitter** | Language-aware editing by grammar | IDE fork direction; not claimed in the shell |
| **vllm / executorch / ComfyUI** | On-device inference stacks | Local Ollama inference is the token-free default today |

## 3. What changed in Aetherius because of this REA pass

Every item below is implemented and typechecked; none is a promise.

1. **Right-click menus** — desktop background and window title bar both respond to
   right-click, two-finger click, long-press and Shift+F10 / Menu key (configurable hold time).
2. **Mouse / keyboard / touch** — Pointer Events for widgets, windows and icons; Enter/Space
   launches icons; arrow keys nudge focused widgets; `+` resizes; Esc closes menus.
3. **Resizable widgets** — drag to move, S/M/L cycle on hover/focus, per-widget visibility in
   Desktop settings, defaults small (180×120) so they no longer overwhelm the desktop.
4. **Resizable app windows** — drag the title bar, resize from the bottom-right corner,
   double-click to maximize/restore, minimize, right-click window menu. Genesis Human opens
   at 900×620; other apps at the WindowPrefs default.
5. **Desktop organisation groups** — icon size, snap-to-grid, auto-arrange, sort by name/type,
   group by type/first letter, label visibility, lock layout, wallpaper control, one-click
   reset. Context-menu and Settings both write the same preferences (live, no reload).
6. **Grouped settings** — Desktop & Widgets, Windows & Input and Genesis Human categories
   added alongside Shell, Cloud & Sync and Applications. Each control writes a real
   `aetherius.*` preference the shell reads; hardware-level settings the preview cannot
   control are labelled out of scope instead of faked.
7. **Genesis Human agent window** — IDE-style live window: speaking avatar (IDLE / LISTENING /
   THINKING / SPEAKING, emotion, viseme, gesture, gaze), live chat persistence, local Ollama
   brain with a named-model badge, labelled offline fallback, mic/camera toggles, TTS with
   lip-sync visemes, interrupt, session metrics, approval-only Agent Bridge logging, a
   Voight-Kampff behaviour check, and the Tavus Griffin research panel.

## 4. Honest gaps that remain (no score change claimed)

- **Signed native artifacts** (.deb/msix/dmg) and store accounts — owner gates, unchanged.
- **Independent security + WCAG 2.2 AA audits** — external gates, unchanged.
- **Format round-trip fixtures** beyond structural checks — unchanged.
- **Performance fixtures** (boot timing, open latency, memory budget) — the next measured work.
- **Per-app permission UI** in Settings — capability layer exists; the surface is a 1.0 item.
- **Fuchsia/HarmonyOS/Redox native builds** — recorded directions only; the web/PWA preview is
  the 0.1.0 release scope.

## 5. Evidence

- `npm run typecheck` and `npm run build` after this pass.
- `npm run verify` (secret-scan, typechecks, root tests, app slices, build).
- Live verification of the Genesis Human window and widget drag/resize in the deployed preview.
- Messenger, desktop drag, and browser checks recorded in the session log.

No trademark, asset or code was copied from any compared platform. Mechanisms were observed
from documented behaviour and rebuilt first-party.
