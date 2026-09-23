# Invention Disclosure Registry (REQ-p16-invention-disclosure, P16)

Invention disclosure records under P16 provenance. Preserves potentially
novel Aetherius mechanisms plus prior-art research WITHOUT claiming
anything is patented or patentable. No patent engine, no patentability
classifier, no legal advice, no second provenance store.

## Record (`src/programme/inventions.ts`)

Fields: deterministic `inventionId` (`inv-<slug>-<hash8>` over
title+mechanism), title, inventor/contributor refs, date conceived,
technical problem, prior approaches, specific mechanism, technical
effect, projects, source/research refs, prototype evidence, prior-art
refs with relations, public disclosure date, status, evidence refs,
provenance, related requirement ids, external attribution when derived
from external work.

Status vocabulary (invention-specific, consistent with the requirement):
`CANDIDATE`, `PRIOR_ART_REVIEW_PENDING`, `UNDER_REVIEW`, `DISCLOSED`,
`ARCHIVED`. No legal-conclusion state exists; free-text legal claims
(patentable, patent pending, non-obvious, novel invention, claims
novelty) are rejected by validation.

Rules:

- Same content re-registered is idempotent; same id with different
  content is a conflict — records are immutable, never silently
  overwritten.
- Related requirement ids validate against the known registry set.
- External mechanisms stay attributed (`derivedFromExternal` requires
  `externalAttribution`).
- Registration is pure (new list returned, inputs unmutated) and
  composes with requirement evidence/provenance conventions.

Tests: `src/programme/inventions.test.ts` (6 tests: valid registration,
idempotence/conflict, field validation, legal-conclusion rejection,
registry linkage, deterministic serialization).
