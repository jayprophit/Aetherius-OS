# DOE Mapping (REQ-doe-mapping, P22)

DOE agentic-workflow reference mapping, attributed. The research (Nick
Saraev, "Agentic Workflows" 2026) is STUDY_ONLY external material, not
Aetherius IP. No DOE runtime exists or is implied.

## Canonical mapping

| DOE layer | Owner | Meaning |
| --- | --- | --- |
| Directive (what to do) | P19 | Planning artifacts: Workflow + Routine + Skill (see `docs/directive-assessment.md`) |
| Orchestration (probabilistic routing) | P22 Genesis | Models route over directives; they do not execute |
| Execution (deterministic work) | P21 Agent Bridge | Typed executors under the detexec principle |
| Host/Governance | Aetherius P16/P25 | Programme truth + principals/policy govern every layer; no layer self-authorizes |

## Machine checking

`src/programme/doeMapping.ts`: `canonicalDoeMapping()` records the
standing decision; `validateDoeMapping()` enforces complete exactly-once
layer coverage, first-party owners only (reference systems can never own
a layer), mandatory attribution and STUDY_ONLY marking.

Tests: `src/programme/doeMapping.test.ts` (5 tests).
