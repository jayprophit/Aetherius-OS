# Sovereign Financial OS - Native Mobile Strategy

## Configuration
- **Framework**: Flutter (Dart) for high-performance cross-platform UI.
- **Authentication**: Firebase Auth with `local_auth` for Biometric (FaceID/Fingerprint) hardware gates.
- **CI/CD**: Fastlane configured for App Store Connect and Google Play Console automated deployments.

## Integration Plan
1. **Biometrics**: Implementation of `LocalAuthentication` in the `AppHome` widget to guard the financial vault.
2. **Push Notifications**: Firebase Cloud Messaging (FCM) for real-time valuation alerts and tax deadlines.
3. **Deep Linking**: Configured for `sovereign://` protocol to handle OAuth redirects and specific portfolio views.

## Build Instructions
```bash
cd mobile
flutter pub get
flutter run
```
