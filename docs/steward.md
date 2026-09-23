# Steward Automation (P16)

Guarded repository steward automation: scheduled/event issue-PR review with
durable reports, marker comments, maintainer commands and guarded repair.
Requirement `REQ-p16-steward-automation`.

Study source: ClawSweeper v0.3.0 (MIT, STUDY_ONLY) — informed capability
scope only; this is an original implementation with no copied code or brand.

## Hard invariant

**Readiness never equals merge authority.** Every readiness result carries
`merge_authority: false` as a literal type. The steward module exposes no
merge capability (tested: no merge/autoMerge/approve export). Merging is a
separate, owner-gated bridge action that does not exist here.

## Components

| Module | Role |
| --- | --- |
| `types.ts` | Contracts + typed `StewardError` codes |
| `readiness.ts` | Pure findings → `ready`/`not_ready` evaluation (errors/blockers block; warnings advisory) |
| `markers.ts` | Owned comment blocks (`aetherius-steward:begin/end`); updates replace only owned spans, preserve maintainer text, fail closed on malformed/duplicate markers |
| `commands.ts` | Strict `/steward <verb> <repo>#<kind>-<number>` grammar; explicit allowlist authorization (empty list denies everyone) |
| `repair.ts` | `guardedRepair`: findings change only on an external policy `allowed` decision; deny leaves state untouched; apply never merges |
| `reports.ts` | Durable reports over the P17 `FileStateStore` (atomic writes, integrity hashes, optimistic versions, target-mismatch rejection) |
| `executor.ts` | Workflow step kind `steward-review`: typed findings in → readiness + durable report out |

## Scheduling and events

`steward-review` is a registered workflow step kind. Findings are produced
upstream (model review, static checks, maintainer input) as a runtime
binding — the executor never invents them. P19 scheduler routines fire the
workflow on schedule or event (`REVIEW.*`), proving:

```
schedule/event → activation → WorkflowRun → durable StewardReport
```

Both ready and not_ready outcomes persist with `merge_authority: false`.

## Trust boundaries

- Findings are data, not authority: malformed findings fail the step
  non-retryably, never partially applied.
- Marker edits are scoped to owned blocks; content containing steward
  markers is rejected.
- Repair is decision-first: `allowed: false` returns findings unchanged.
- Reports reject retargeting an existing state id (`target mismatch`).
- Activation/scheduling never grants authority (no grant/approve/merge
  surface on the scheduler).
