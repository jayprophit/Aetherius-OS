# Causal Harness (REQ-p19-causal-harness, P19)

A/B harness comparison with task, model, tools, permissions and
environment held constant. Not a leaderboard, vendor ranking,
preference engine or universal score. Unblocks e2e-completion.

## Contract (`src/eval/harness.ts`)

- **Experiment** declares controlled conditions once (model +
  version, tools, permissions, environment, starting state) plus
  upfront confounds, scorer ref and evidence refs.
- **Trials** record actual conditions plus observations (claimed vs
  verified success, tool calls/errors, retries, manual
  interventions, wall time, optional tokens/cost, escalations,
  verification failures, evidence completeness).
- **Control enforcement:** trials whose actual conditions differ from
  the declared block are CONFOUNDED — excluded from aggregates,
  listed with reasons, never silently merged. Declared confounds
  mark the comparison non-comparable (stated, not numbered).
- **Claim separation:** claimed and verified success counted
  separately (HARNESS CLAIM != VERIFIED TASK SUCCESS).
- **No composite:** per-metric B-minus-A deltas only; no winner,
  no score, no outlier removal. Every trial preserved; repeatability
  from samples.
- Deterministic ordering throughout; malformed experiments/trials
  rejected; cross-experiment trials rejected.

Composes with DatasetRegistry/ScorerRegistry (metrics), WorldStateAudit
(verified success), EvidenceGraph (evidence refs) — none duplicated.

Tests: `src/eval/harness.test.ts` (6 tests: controlled comparison,
claim/verified split, confound exclusion, declared confounds,
malformed rejection, determinism).
