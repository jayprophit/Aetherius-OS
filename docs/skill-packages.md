# Skill Packages (REQ-p19-skill-packages, P19)

Versioned skill/plugin package format with trust metadata. Reference:
ClawHub package catalog v0.23.3 (MIT, STUDY_ONLY) — capability scope only.

## Format

`src/workflows/packages.ts`. A package is a manifest plus
content-hash-addressed artifacts (`aetherius-skill-package/1`):

- `buildPackage(skill, artifacts)`: validates the skill, requires at least
  one artifact, rejects hostile names (`..`), hashes every artifact
  (sha256 over exact bytes), copies trust fields from the skill record
  (provenance, risk class, status, permissions, family, capabilities),
  seals the manifest with `manifestSha256`. Deterministic for fixed inputs.
- `verifyPackage(manifest, bundle)`: manifest integrity first, then every
  listed artifact present with exact bytes; unlisted extras reported.
  Returns problems, never substitutes.
- `resolveArtifact(manifest, name, store)`: exact resolution by sha256 from
  a content-addressed store; missing/wrong bytes fail honestly.

Hashes are computed, never asserted. Trust is carried, never invented.
Promotion (P19/5) governs lifecycle; packages govern the publishable bundle
format — no duplication.

Tests: `src/workflows/packages.test.ts` (6 tests: build+trust, determinism,
tamper/missing/extra, manifest alteration, exact resolution, invalid input).
