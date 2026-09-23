# Directive Assessment (REQ-directive-artifact, P19)

Question: does a Directive — objective / constraints / definition-of-done /
recommended skills, after the DOE research pattern (STUDY_ONLY) — belong as
a new P19/Genesis planning artifact, or is it covered by existing
Skill/Workflow contracts?

Decision: **COVERED. No new artifact. No second workflow engine.**

A Directive is a P19 planning artifact realized through the existing
contracts. The mapping is field-exact, against real contract fields:

| Directive field | Existing contract | Evidence |
| --- | --- | --- |
| objective | `Workflow.description` | `src/workflows/types.ts` — every workflow states its purpose |
| constraints | `Routine.policy` + approval checkpoints | `Routine.policy`, `WorkflowStep.approval.{approver,reason}` |
| definition of done | step `outputs` / `output_required_keys` + approval gates | completion is verifiable against declared outputs or gates, never prose |
| recommended skills | `skill:<id>@<version>` step refs + `Routine.capability_requirements` | `parseSkillRef`, `SkillRegistry.lookup` |

Layer placement (canonical, unchanged):

- Directive (what to do) → **P19** planning artifact (Workflow + Routine + Skill).
- Orchestration (probabilistic routing over directives) → **P22** Genesis/models.
- Execution (deterministic work) → **P21** typed executors.
- Governance (who may approve/merge) → **P25** policy/principals.
- SOP prose → **Skill content** (instructions), never a parallel engine.

## Mechanical proof

`src/workflows/directives.ts` (`assessDirective`) checks any directive
against the live registry contents with exact structural rules:

- skills must parse (`skill:<id>@<x.y.z>` or bare `<id>`) and resolve to a
  non-deprecated registered skill;
- constraints must be `policy:<name>` (known routine policy) or
  `approval:<approver>` (existing approval checkpoint) — untyped prose is a
  GAP because no contract can enforce it;
- definition-of-done items must be `<workflow>:<step>.<output>` (declared
  output) or `<workflow>:<step>#approval` (real approval gate) —
  unverifiable completion is a GAP;
- empty objectives are GAPs.

Covered directives carry the standing decision: expressible in P19
contracts, no new artifact. Gapped directives list exactly what to close —
never an invitation to invent a parallel engine.

Tests: `src/workflows/directives.test.ts` (5 tests: covered verdict,
skill gaps, DoD gaps, constraint/objective gaps, no execution surface).
