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
> true stop condition.

## Last completed requirement

`REQ-p19-benchmark-freshness` — Benchmark freshness and saturation policy.

## Commits (Aetherius-OS, local only)

| Commit | Requirement |
| --- | --- |
| _(pending)_ | REQ-p19-benchmark-freshness |
| `cb306ff` | REQ-p19-benchmark-contamination |
| `428192c` | REQ-p18-training-compute |
| `5a118b7` | REQ-p18-superposition-lab |
| `13dac73` | REQ-p16-review-context-pack |
| `515eb0b` | REQ-p16-governance-proposals |
| `b6c1acf` | REQ-p16-change-cohort-review |
| `5fe5158` | REQ-p16-capability-graph |
| `a6f43ad` | REQ-p16-autonomy-readiness |
| `355c96b` | REQ-p22-reflex-abstention |

## Current selector result

`REQ-p19-context-position` (P19, priority 1, READY, owner `aetherius-os`).

Selector order is deterministic: priority desc, dependents count desc,
phase number asc, id lexicographic asc. It is never overridden manually.

## Repository state

- Aetherius-OS: **ahead of `origin/master`, never pushed** (push is
  OWNER_GATED)
- Working tree: clean after each committed unit
- Registry: 107 requirements
- Known pre-existing owner file: `native/BUILD-TODO.md` — its unknown-authorship
  header must never be normalized or rewritten; only chronological appends.

## Baselines at last checkpoint

| Gate | State |
| --- | --- |
| Full test suite | 654/654, 54 files |
| Registry validation | 137/137, 10 files |
| Typecheck | clean (exit 0) |
| Vite build | clean, 46 modules |
| Lint | `NOT_APPLICABLE` — no lint script and no eslint/biome/oxlint/tslint/stylelint/prettier config exists outside `node_modules`/`.git`/`dist`/`native/target`. **This is not a lint pass.** |

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
  `registry/depgraph.json` is system-level only (~10 nodes, no file/module/symbol
  ids), there is no `depgraph.ts`, and `EvidenceGraph` does not derive code
  dependencies. Do not implement it inside an unrelated requirement;
  let the selector schedule it. `SYSTEM DEPGRAPH != CODE DEPENDENCY GRAPH`.

## Phase state

- P16: 11 COMPLETE, 1 OWNER_GATED, 0 executable
- P18: 5 COMPLETE, 1 BLOCKED, 0 executable
- P19: in progress; `REQ-p19-context-position` next

**No executable items in a phase is not the same as that phase being
complete.** Continue across phases per selector output.

## Release status

`NOT YET RELEASE-PROVEN`, release scope `UNDEFINED`,
`REQ-p31-release-scope` OWNER_GATED. Update release gates only when real
release evidence changes them; otherwise record `RELEASE EFFECT = NONE`.
