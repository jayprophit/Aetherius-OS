# Aetherius OS cross-platform delivery

**Date:** 2026-11-08
**Starting commit:** `b665453`
**Canonical scope source:** `handoff.txt` section 1 (Aetherius OS / Genesis — Master Updated Handoff, 30 September 2026).

Aetherius OS is **not only a web desktop**. It is a first-party hybrid
operating-system ecosystem intended to span desktop, laptop, web, mobile,
tablet/iPad-class devices, watches, glasses/AR, TVs, automotive systems, rings,
embedded/smart devices and future device types. All of those share one OS
identity, one Genesis identity per user, and one durable user state.

This document separates what is real today from what is scaffolded, what is
owner-gated and what is research.

## 1. Delivery tiers

| Tier | Target | Delivery mechanism | Current status | Evidence |
|---|---|---|---|---|
| 0 | Web / PWA | Cloudflare Pages + service worker | **VERIFIED** | `https://master.aetherius-preview.pages.dev`, `docs/PERF-BASELINE-2026-11-07.md` |
| 1 | Windows desktop | Tauri 2 + WebView2 | **SCAFFOLDED** | `src-tauri/`, `npm run desktop:build`; installer build not yet recorded |
| 1 | macOS desktop | Tauri 2 + WKWebView | **SCAFFOLDED** | Same config; macOS build requires a macOS host/CI, not yet run |
| 1 | Linux desktop | Tauri 2 + WebKitGTK | **SCAFFOLDED** | Same config; Linux build requires WebKitGTK dependencies, not yet run |
| 2 | Android phone | Tauri 2 Android | **SCAFFOLDED** | `packaging/mobile/README.md`, `npm run platform:preflight` |
| 2 | Android tablet | Tauri 2 Android | **SCAFFOLDED** | Same; tablet layout checks defined, not yet run |
| 2 | iPhone | Tauri 2 iOS | **SCAFFOLDED** | Requires macOS + Xcode + Apple signing; owner-gated |
| 2 | iPad / iPadOS | Tauri 2 iOS | **SCAFFOLDED** | Same; tablet/iPad layout checks defined, not yet run |
| 3 | Linux VM appliance | Docker image + cloud-init + systemd | **SCAFFOLDED** | `packaging/vm/`; image and VM boot not yet recorded |
| 4 | Native Aetherius kernel | Rust boot + C++ kernel (`native/`) | **RESEARCH / UNVERIFIED** | `native/BUILD-TODO.md`; explicitly outside the 0.1.0 release scope |
| 5 | Watch, AR glasses, TV, automotive, ring, embedded | No implementation | **FUTURE / UNVERIFIED** | No code claim permitted |

### Status vocabulary

- `SCAFFOLDED` — configuration, scripts and documentation exist; no artifact built.
- `BUILT` — an artifact exists on a named host, with a hash and date.
- `INSTALLED` — the artifact was installed on a named device/emulator.
- `VERIFIED` — install, launch and the listed workflows passed.
- `UNVERIFIED` — anything not covered above.

A desktop browser resized to phone dimensions is **not** mobile support.

## 2. Architecture: one UI, thin native hosts

```text
                    ┌──────────────────────────────┐
                    │  Aetherius web shell (React)  │
                    │  apps, windows, settings,     │
                    │  Genesis Human, sync engine   │
                    └──────────────┬───────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
   Browser/PWA                Tauri 2 host                VM/appliance
   Cloudflare Pages           Windows/macOS/Linux         Docker + cloud-init
   service worker             Android/iOS/iPadOS           systemd service
        │                          │                          │
        └──────────────────────────┴──────────────────────────┘
                                   │
                    local-first storage + optional cloud sync
```

Invariants:

1. **One UI implementation.** Desktop and mobile hosts load the same built
   web shell; there is no second application to keep in sync.
2. **One Genesis identity per user.** Changing device, model, provider or
   local/cloud execution must not create another Genesis.
3. **No silent privilege escalation.** The Tauri host exposes only
   `core:default`; it adds no filesystem, shell or process commands. Native
   privileged operations require a separately gated companion service.
4. **Local-first.** The shell must remain usable without the cloud. Sync is a
   replication layer, not a boot dependency.
5. **Honest capability labels.** A target is not "supported" because its
   configuration file exists.

## 3. Privileged operations boundary

| Capability | Web/PWA | Tauri host (today) | Required future component |
|---|---|---|---|
| Virtual filesystem | Browser storage only | Browser storage only | Companion service with explicit path grants |
| Terminal | Browser-local command set | Browser-local command set | Companion PTY with allowlist, audit chain and per-command approval |
| Host browser engine | Iframe tabs | Platform webview | Not a full browser engine; label iframe limits |
| Window management | In-page windows | Native window shell | Native window integration via host commands |
| Camera/microphone | Browser permission prompts | Platform webview permissions | Same, plus Tauri permission capabilities |
| Model inference | Ollama on loopback (local browser only) or offline fallback | Same | Authenticated paired companion for cloud PWA |

The cloud PWA cannot assume `127.0.0.1:11434`. The paired-device/companion
path remains `UNVERIFIED` and must be authenticated, origin-restricted and
replay-protected before it is exposed.

## 4. Build commands

### Desktop

```powershell
npm install
npm run desktop:icon
npm run desktop:dev
npm run desktop:build
```

Artifacts land in `src-tauri/target/release/bundle/`:
Windows MSI/NSIS, macOS DMG/App, Linux DEB/RPM/AppImage.

### Android

```powershell
npm run platform:preflight
npx tauri android init
npx tauri android build --apk
```

### iOS / iPadOS

```bash
# macOS only
npm run platform:preflight
npx tauri ios init
npx tauri ios build
```

### VM appliance

```powershell
docker build -f packaging/vm/Dockerfile -t aetherius-os:0.1.0 .
docker run --rm -p 8080:8080 aetherius-os:0.1.0
```

### Web/PWA

```powershell
npm run build
npm run verify:pwa
```

## 5. Required evidence before changing a status

| Target | Minimum evidence |
|---|---|
| Windows desktop | Installer hash, install on a clean Windows profile, launch, open 3 apps, resize, uninstall |
| macOS desktop | Signed/notarised DMG or explicitly unsigned local build, install, launch, Gatekeeper result |
| Linux desktop | DEB/Flatpak/AppImage hash, install on a clean distro, launch, rollback |
| Android phone/tablet | APK/AAB hash, install on named device/emulator, launch, tablet layout screenshot, logcat clean |
| iPhone/iPad | Signed IPA or TestFlight build, install on named device, launch, layout screenshot |
| VM appliance | Image digest, VM boot log, health-check output, shell load from a second machine |
| Native kernel | Boot log on named hardware/VM, serial output, rollback evidence |

Store distribution, code signing identities, Apple/Google/Microsoft developer
accounts and notarisation credentials are **owner-gated**. They must not be
simulated or bypassed.

## 6. Release-gate placement

The existing `0.1.0` gate remains a **web/PWA developer-preview** gate. Native
desktop/mobile/VM artifacts get their own evidence in this document and in
`docs/RELEASE-EVIDENCE-2026-11-08.md` once built. They must not be used to
weaken the web gate, and the web gate must not pretend to certify native
artifacts.

Native Aetherius 1.0 remains separately gated on signed binaries, OS
installation, hardware security, store distribution, independent audits and a
measured 5-star benchmark.

## 7. Immediate next actions

1. Build the Windows desktop installer locally and record the hash/install
   result. (No signing certificate required for a local unsigned build.)
2. Run `npm run platform:preflight` and record the actual host result.
3. Run the VM image build and health check locally.
4. Add Android/iOS build evidence only when the SDK/Xcode host exists.
5. Keep watches/AR/TV/automotive/rings/embedded labelled `FUTURE` until a
   device target and an artifact exist.
