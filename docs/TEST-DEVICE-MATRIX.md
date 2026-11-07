# Test device and platform matrix

**Status:** 2026-11-04. `0.1.0` is a self-hosted web/PWA developer preview. Native
platforms are outside this release. An untested platform is `UNVERIFIED`, not
`SUPPORTED`.

## 1. Declared 0.1.0 platform

| Platform | Evidence | Status |
|---|---|---|
| Self-hosted web/PWA | `docs/evidence/install-matrix.json`: install `PASS`, launch `PASS`; `docs/evidence/rollback.json`: rollback `PASS`; `docs/evidence/performance.json`: measured on the current host | **VERIFIED** for the declared web/PWA preview |

No native Windows, macOS, Linux, Android or iOS artifact is declared for
`0.1.0`.

## 2. Browser matrix

| Browser / device | How tested | Status |
|---|---|---|
| Chromium desktop on the current Windows x86_64 host | In-app Chromium, PWA installability and launch checks | **VERIFIED** for the programmatic checks; accessibility pre-audit in progress |
| Microsoft Edge desktop | Chromium engine; not yet run separately | **UNVERIFIED** |
| Firefox desktop | Not installed or driven in this session | **UNVERIFIED** |
| Safari desktop | No Mac available | **UNVERIFIED** |
| Chrome on Android phone | Owner has an Android phone; test deferred | **OWNER_TEST_AVAILABLE** |
| Safari on iPad Pro | Owner has an iPad Pro; test deferred | **OWNER_TEST_AVAILABLE** |
| ChromeOS | No Chromebook confirmed | **UNVERIFIED / NOT AVAILABLE** |

The owner has offered to test the iPad Pro and Android phone later. Those tests
will be recorded with the device model, OS version, browser version, viewport,
input method and the exact result.

## 3. Accessibility matrix

| Check | Free tool | Status |
|---|---|---|
| Automated accessibility scan | Lighthouse / axe-core | Pre-audit planned |
| Keyboard-only navigation | Manual | Pre-audit planned |
| Focus visibility | Manual | Pre-audit planned |
| 200% and 400% zoom | Browser zoom | Pre-audit planned |
| High-contrast / forced-colors | Windows high-contrast mode | Pre-audit planned |
| Windows screen reader | NVDA (free) | Check installation; JAWS is paid and not available |
| iPad screen reader | VoiceOver (built in) | **OWNER_TEST_AVAILABLE** |
| Android screen reader | TalkBack (built in) | **OWNER_TEST_AVAILABLE** |
| Linux screen reader | Orca (free) | **UNVERIFIED / NOT AVAILABLE** |
| Switch control | Platform-specific | **UNVERIFIED** |

An independent WCAG 2.2 AA audit by a qualified auditor remains a paid
owner-gated item. The free checks above are a pre-audit, not an audit.

## 4. Out of scope for 0.1.0

These are not required for the approved web/PWA preview and are recorded as
`UNVERIFIED` for later stages:

- Windows x64 and ARM64 native installs.
- macOS Intel and Apple Silicon native installs.
- Linux x86_64, ARM64 and Raspberry Pi native installs.
- Android native APK, low-RAM device and tablet.
- iOS/iPadOS native app and TestFlight.
- ChromeOS Linux container and Android app support.
- Printers, scanners, cameras, microphones, MIDI keyboards and external GPUs.
- VLANs, packet capture, throttling and IPv6 network labs.
- UPS, sleep, hibernate, resume and battery tests.
- Watch, TV and XR builds.

## 5. Reduced supported-platform decision

For `0.1.0`, the supported platform is:

> A self-hosted web/PWA served over HTTPS and opened in a current
> Chromium-based desktop browser.

The following are explicitly not claimed as supported:

- Safari, Firefox and Edge until they are actually tested.
- Any mobile browser until the owner's iPad Pro and Android phone tests are
  recorded.
- Any native desktop or mobile package.
- Any accessibility conformance level until the pre-audit and the independent
  audit are complete.

This is a reduced matrix, not a claim that the untested platforms are broken.
It is the honest boundary of what has been measured.

## 6. Owner tests to schedule

1. iPad Pro: Safari, install to home screen, launch, rotate, 200% and 400% zoom,
   VoiceOver, high contrast.
2. Android phone: Chrome, install to home screen, launch, rotate, 200% zoom,
   TalkBack, high contrast.
3. Windows desktop: Edge and Firefox if available.
4. Optional: a low-RAM Android device and a tablet.

Record each test with the device, OS, browser, viewport, input method, expected
result and observed result. A test that was not run is not a pass.
