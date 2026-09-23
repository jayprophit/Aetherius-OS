# Progressive Disclosure (REQ-progressive-disclosure, P19)

Progressive skill disclosure levels L0–L3. Reference: Saraev
agentic-workflows research (STUDY_ONLY).

## Levels (`src/workflows/disclosure.ts`)

Levels nest; each includes everything below it:

- **L0 identity**: skill_id, version, name.
- **L1 capability**: + capability, risk class.
- **L2 instructions**: + description, inputs, outputs, required
  capabilities/tools/permissions, provenance.
- **L3 artifacts**: + package artifact listing (names, hashes, sizes) from
  an explicit `SkillPackageManifest`. Bytes stay behind `resolveArtifact`;
  disclosure never inlines them.

`status` is surfaced at **every** level so DEPRECATED skills are visible
before anyone pays for instructions. Unknown levels, unparseable refs,
missing skills, and L3-without-package fail honestly.

Callers (P19 scheduler, workflows, Genesis orchestration) take a
`SkillRegistry` — no second registry, no parallel system. P19 owns the
skill system, as the requirement states.

Tests: `src/workflows/disclosure.test.ts` (6 tests: nesting, latest/pinned
resolution, L3 listing without bytes, honest failures).
