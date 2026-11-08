# Mobile, tablet and iPad packaging

Aetherius OS uses Tauri 2 for native desktop and mobile hosts. The web/PWA
build remains the reference UI; the native host supplies the platform webview.
No privileged native commands are exposed by the shell.

## Prerequisites

| Target | Required |
|---|---|
| Android phone/tablet | Node 22+, Rust, JDK 17, Android Studio or SDK, NDK, `adb` |
| iPhone/iPad | macOS, Xcode 15+, Rust, Apple signing identity and provisioning profile |
| Desktop | Node 22+, Rust, platform webview (WebView2 on Windows, WebKitGTK on Linux, WKWebView on macOS) |

Run the preflight before claiming any mobile target is buildable:

```powershell
npm run platform:preflight
```

## Android phone and tablet

```powershell
npm install
npm run desktop:icon
npx tauri android init
npx tauri android dev
npx tauri android build --apk
npx tauri android build --aab
```

- The tablet layout is the same responsive shell; verify at 768x1024,
  1024x1366 and 1280x800 before claiming tablet support.
- A debug APK is not a release artifact. A release APK/AAB requires an
  upload key, `key.properties`, and a recorded signing identity.
- Google Play distribution requires a developer account and store review.
  Both are **owner-gated**.

## iPhone and iPad

```powershell
# On macOS only
npm install
npm run desktop:icon
npx tauri ios init
npx tauri ios dev
npx tauri ios build
```

- iOS/iPadOS builds require Xcode and an Apple Developer signing identity.
- App Store/TestFlight distribution is **owner-gated**.
- Simulator evidence is not device evidence. Record the device model, OS
  version and install path in the release evidence.

## Honest status labels

Use these labels in every report:

- `SCAFFOLDED` — configuration and commands exist; no artifact built.
- `BUILT` — an artifact exists on a named host, with a hash and date.
- `INSTALLED` — the artifact was installed on a named device/emulator.
- `VERIFIED` — install, launch and the listed workflows passed.
- `UNVERIFIED` — anything not covered above.

Do not mark Android, iOS or iPadOS as supported because a desktop browser
rendered at a smaller viewport.
