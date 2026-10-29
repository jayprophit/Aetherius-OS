# Aetherius Desktop

The desktop preferences and packaging model for Aetherius OS: layered settings, default-app equivalents for six OS families, URL/MIME routing, and installer plans for real package formats.

**Built:** the settings, default-app and installer-planning domain core with tests. **Not built:** native OS adapters, a settings UI, package builders, signing or notarisation.

## What is built

- Settings with four layers: default, system, user and app; app over user over system over default.
- Typed fields: string, number, boolean, enum and JSON, with required/range/enum validation.
- Policy locks that stop user overrides while leaving the system layer authoritative.
- Presets for `apple`, `linux`, `microsoft`, `android`, `ios` and `google`, applied only within their declared scope.
- Export that redacts secret-looking keys and import that applies only valid non-secret values.
- A default-app catalogue covering 26 roles on each of the six OS families.
- Per-role overrides, resets and resolution.
- URL-scheme and MIME-type routing to the correct role.
- Installer plans for MSIX, DMG, DEB, AAB, IPA and PWA, with per-platform signing requirements and explicit blockers.

## Honest limits

- The settings service is an in-memory model. It does not read or write the Windows registry, macOS plists, Linux dconf/systemd, Android settings or iOS preferences.
- The default-app catalogue is a model. It does not register a handler with an operating system.
- Installer plans name real formats but do not build, sign, notarise or publish a package.
- There is no settings UI or host mount.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

Built for the owner's request for first-party default-app equivalents and settings/preferences across Apple, Linux, Microsoft, Android, iOS and Google OS. The app cores live in `apps/aetherius-app-suite`; the store core lives in `apps/aetherius-store`.
