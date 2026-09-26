# Programme Continuation State

**Operational resumption aid only.** This file is NOT requirement truth,
dependency truth, evidence truth or selector truth. Those remain
authoritative in:

- `src/programme/requirements.json` (requirement state)
- `registry/programme.json`, `registry/depgraph.json` (programme + dependency truth)
- `registry/legacy-coverage.json` (legacy ledger)
- `native/BUILD-TODO.md` (chronological build evidence)
- `src/programme/select.ts` (deterministic selector)

**Exact resume instruction:**

> Resume the programme from the committed continuation checkpoint: rerun the
> deterministic selector, execute whatever it returns, and do not stop until a
> true stop condition. Do not ask whether to continue.

## Current selector result

`REQ-p20-change-impact` (P20, priority 1, READY, owner `aetherius-os`).

Selector order is deterministic: priority desc, dependents count desc, phase
number asc, id lexicographic asc. It is never overridden manually.

## Last completed requirement

`REQ-p19-sealed-vault` — Sealed benchmark vault. **P19 is now 20/20 COMPLETE.**

## Commits (Aetherius-OS, local only — never pushed)

| Commit | Requirement |
| --- | --- |
| _(pending)_ | REQ-p19-sealed-vault |
| `aeecdcb` | REQ-p19-online-eval |
| `55d6343` | REQ-p19-independent-review-gate |
| `ee65b82` | REQ-p19-e2e-completion |
| `2086622` | REQ-p19-context-position |
| `15f0d43` | REQ-p19-benchmark-freshness |
| `cb306ff` | REQ-p19-benchmark-contamination |
| `428192c` | REQ-p18-training-compute |
| `5a118b7` | REQ-p18-superposition-lab |
| `13dac73` | REQ-p16-review-context-pack |
| `515eb0b` | REQ-p16-governance-proposals |
| `b6c1acf` | REQ-p16-change-cohort-review |
| `5fe5158` | REQ-p16-capability-graph |
| `a6f43ad` | REQ-p16-autonomy-readiness |

## Next work, in selector order after the current one

1. `REQ-p20-change-impact` (selected now). **P19 has no remaining READY item: 20/20 COMPLETE.** This is the long-verified real gap: build a real code-level dependency graph, not the system-level `registry/depgraph.json`.

`REQ-p19-independent-review-gate` scope, already surveyed: the registered
description says *"gates exist, model-gate and composition do not; emits
clean-room-ready evidence without claiming fresh-env proof while clean-room
is blocked."* The honest minimum is therefore a **composition** of the
existing gates plus a model-review leg whose result is **`UNAVAILABLE`**
because `REQ-p18-model-fabric` is BLOCKED on cloud credentials. It must not
claim clean-room proof, since `REQ-p20-clean-room` is BLOCKED. Reusable:
`src/programme/reviewPack.ts`, `src/eval/contamination.ts`,
`src/workflows/evidenceGate.ts`, `staticSafetyScan` in
`src/workflows/promotion.ts`. Note: Aetherius-OS has **no linter**, so any
"static" leg is `NOT_APPLICABLE`, not `PASS`.

## Repository state

- Aetherius-OS: **ahead of `origin/master`, never pushed** (push is
  OWNER_GATED)
- Working tree: clean at the last checkpoint
- Registry: 107 requirements
- Known pre-existing owner file: `native/BUILD-TODO.md` — its
  unknown-authorship header must never be normalized or rewritten; only
  chronological appends.

## Baselines at last checkpoint

| Gate | State |
| --- | --- |
| Full test suite | 792/792, 59 files |
| Related (eval, programme, state) | 386/386 |
| Registry validation | 167/167, 11 files |
| Typecheck | clean (exit 0) |
| Vite build | clean, 46 modules |
| Lint | `NOT_APPLICABLE` — no lint script and no eslint/biome/oxlint/tslint/stylelint/prettier config exists outside `node_modules`/`.git`/`dist`/`native/target`. **This is not a lint pass.** |

**Gate order to run for every unit:** targeted tests → related tests → lint
(if present; otherwise `NOT_APPLICABLE`) → typecheck → full suite → build →
registry:validate → diff review → junk check → docs → BUILD-TODO → commit.

## Blockers and gates (do not bypass)

**BLOCKED**

- `REQ-p18-model-fabric` — cloud credentials unavailable
- `REQ-p20-clean-room` — no isolated backend

**OWNER_GATED** (do not execute; do not convert to COMPLETE)

- `REQ-native-header-provenance` (the only non-complete P16 item)
- `REQ-genesis-actuator`
- `REQ-memory-integrity-boundary`
- `REQ-regulated-evidence`
- `REQ-p31-release-scope`

**IN_PROGRESS_ELSEWHERE** (do not touch)

- `REQ-p17-owned-state`
- `REQ-desktop-capability-fabric`

**DEFERRED**

- `REQ-p25-reward-treasury`, `REQ-spawn-flake`

**HUMAN_REQUIRED** (do not self-pass; does not stop machine-executable work)

- offline/degraded matrix, platform support matrix, IDE UI validation,
  accessibility audit, privacy/telemetry sign-off

## Standing source-honesty findings

- **Superposition lab source status is LOCKED** at
  `UNAVAILABLE_RESEARCH_NOTE_REFERENCE_ONLY`. There is no primary source and
  no cited paper in this repository. Do not silently upgrade it.
  `PROMPT MEMORY != SOURCE`, `RESEARCH_NOTE != CITATION`.
- **`REQ-p20-change-impact` implementation is ABSENT** and verified so:
  `registry/depgraph.json` is system-level only (~10 nodes, no
  file/module/symbol ids), there is no `depgraph.ts`, and `EvidenceGraph`
  does not derive code dependencies. Do not implement it inside an unrelated
  requirement; let the selector schedule it.
  `SYSTEM DEPGRAPH != CODE DEPENDENCY GRAPH`.
- **`REQ-p26-context-compiler` is registered and READY but has ZERO
  implementation** — no compiler module exists in `src/`. Treat a compiler as
  an optional external reference; never pretend to have compiled anything.

## Phase state

- P16: 11 COMPLETE, 1 OWNER_GATED, 0 executable
- P18: 5 COMPLETE, 1 BLOCKED, 0 executable
- P19: **20 COMPLETE, 0 READY — P19 exhausted**

**No executable items in a phase is not the same as that phase being
complete.** Continue across phases per selector output.

## Release status

`NOT YET RELEASE-PROVEN`, release scope `UNDEFINED`,
`REQ-p31-release-scope` OWNER_GATED. Update release gates only when real
release evidence changes them; otherwise record `RELEASE EFFECT = NONE`.

## Standing test-design lessons

Correct the test when the test is wrong — never distort production code:

- **Fixture inheritance**: a partial object override keeps the factory's
  other defaults. Check spreads before blaming a cache.
- **Boundary tests**: ban forbidden behaviour/API surface, not legitimate
  domain vocabulary. `"train"` may not be banned in a training module, nor
  `"review"` in a review module, nor `"authorize"` where a legitimate
  default-deny authorizer exists. A test that bans a substring its subject
  legitimately contains gets deleted, not obeyed.
- **Sorting**: pass a real comparator, never a comparator factory. Assert
  canonical order from **scrambled** input, and derive expected order from
  the documented comparator rather than intuition (default `.sort()` is by
  code unit, so `changeK` precedes `changed`).
- **Normalization**: use global replacement; test multiple invalid spans,
  repeated separators, leading/trailing runs.
- **Timestamps**: never `new Date(0)`, epoch placeholders or hidden wall
  clock. Caller supplies time.
- **Unknown**: do not fabricate unresolved entries to make a list non-empty.
- **Float tolerance**: a tolerance must reflect expected floating-point
  error, never absorb a bug. A loose tolerance hid a real indexing defect
  once; it was tightened to 1e-9 after the fix.
- **Encoder/decoder**: index mapping must be symmetric and hand-testable.
- **Experiment controls**: a control set must not remove the independent
  variable.
- **Metrics**: metric improvement ≠ mechanism improvement until pathological
  cases are tested.
- **Cross-reference queries**: constrain every dimension that changes the
  answer, not just the obvious one (a fairness lookup keyed only on benchmark
  let a `held-out` assessment vouch for a `train` trial).
- **Passing tests are not a substitute for typecheck.** Two real type errors
  shipped with 31/31 green tests; always run the gate.

## Ownership note

If the selector picks a requirement owned by another repository (MAT,
Agent-Bridge, IDE-Workspace, Genesis, Universal-Bridge, Poietek), implement
it **in the owner repository** and only do programme bookkeeping in
Aetherius-OS. A repository switch is **not** a stop condition. Precedent: the
MAT Claim Registry lives in MAT; Agent-Bridge capabilities live in
Agent-Bridge.
