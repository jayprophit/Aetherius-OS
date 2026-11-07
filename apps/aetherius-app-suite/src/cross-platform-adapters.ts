/** Cross-Platform Adapter Patterns — Windows / macOS / Linux / Android / iOS.
 * Added to close cross-platform deployment / integration gap. */
export interface HostAdapter {
  platform: string; osFamily: string;
  fileSystemAccess(): boolean; cameraAccess(): boolean; microphoneAccess(): boolean;
  notifications(): boolean; permissions(): boolean;
  installFormat: string;
}

export const adapters: HostAdapter[] = [
  { platform: "Windows 11", osFamily: "windows", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => false, installFormat: "MSIX / signed installer" },
  { platform: "macOS", osFamily: "macos", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => false, installFormat: "DMG / PKG / App Store" },
  { platform: "Ubuntu / Debian", osFamily: "linux", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => false, installFormat: "DEB / Flatpak" },
  { platform: "Fedora / other Linux", osFamily: "linux", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => false, installFormat: "RPM / Flatpak / AppImage" },
  { platform: "Android / Pixel", osFamily: "android", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => true, installFormat: "APK / AAB" },
  { platform: "iPhone / iPad", osFamily: "ios", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => true, installFormat: "Signed iOS application" },
  { platform: "ChromeOS", osFamily: "chromeos", fileSystemAccess: () => true, cameraAccess: () => true, microphoneAccess: () => true, notifications: () => true, permissions: () => false, installFormat: "PWA / Android app" },
];
