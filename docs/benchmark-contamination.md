# Benchmark Contamination Guards (REQ-p19-benchmark-contamination, P19)

Detection of benchmark contamination risk, so evaluation results are not
presented as independent evidence when a model or system may have been
exposed to benchmark material. Implementation: `src/eval/contamination.ts`.

The registered requirement is the scope authority:

> Train/valid/internal held-out/OOD/adversarial/temporal/private-sealed
> partitions with contamination detection; listed as gap, never implemented.

## The partitions already existed — the real gap was detection

`DatasetSplit` / `DATASET_SPLITS` in `src/eval/evaluation.ts` is **already**
exactly the requirement's seven partitions under different spellings:

| Requirement | Existing `DatasetSplit` |
| --- | --- |
| train | `train` |
| valid | `validation` |
| internal held-out | `held-out` |
| OOD | `out-of-domain` |
| adversarial | `adversarial` |
| temporal | `temporal` |
| private-sealed | `sealed` |

They are **reused**. `BenchmarkPartition2` was not created and this module
adds no partition vocabulary of its own. What the requirement names as
missing — *contamination detection* — is what it adds.

## What a partition label alone establishes

`partitionExpectation(partition)` deliberately stops short of a verdict:

| Partitions | Expectation | Meaning |
| --- | --- | --- |
| `train`, `validation` | `EXPECTED_EXPOSURE` | visible during development **by design**; qualifies interpretation, is **not** a defect |
| `held-out`, `out-of-domain`, `adversarial`, `temporal` | `INTENDED_INDEPENDENT` | an intent, not a proof |
| `sealed` | `POLICY_LABEL_ONLY` | a handling-policy label that says nothing about actual history |

```
SEALED LABEL        != PROVEN SEALED HISTORY
TRAINING EXPOSURE   != INTENTIONAL CHEATING
TEMPORAL SEPARATION != ABSOLUTE PROOF
```

A `train` or `validation` assessment can **never** carry
`independentEvidence`, however well evidenced, because that partition is
expected-visible by construction.

## Status: no boolean, no CLEAN

```
KNOWN_EXPOSED | SUSPECTED | NO_KNOWN_EXPOSURE | UNKNOWN | SEALED_BY_POLICY
```

There is deliberately **no `CLEAN` and no `true`/`false`**. Absence of
disclosure is `UNKNOWN`, never `CLEAN` — `UNKNOWN != FALSE`.

Three validation rules carry the honesty:

| Rule | Rejected as |
| --- | --- |
| `NO_KNOWN_EXPOSURE` with no `evidenceRefs` | `status-evidence` |
| `KNOWN_EXPOSED` with no `exposureRefs` | `status-evidence` |
| exposure asserted with `exposureSource: "UNKNOWN"` | `status-evidence` |
| `sealed` partition claiming `NO_KNOWN_EXPOSURE` unevidenced | `sealed-claim` |
| any unrecognised input key | `unknown-field` |

The last one exists because **silent repair is forbidden**: an unrecognised
`score` or `expected` field must be reported, not quietly discarded, or a
caller would believe it had been recorded when it had not.

## Fingerprints are computed, never asserted

`matchedFingerprints` is the **intersection** of what the subject was known
to have seen and what the benchmark contains. It is never an input, so a
caller cannot claim overlap the hashes do not support.

- A non-empty intersection forces the status to at least `SUSPECTED` — it is
  never quietly downgraded. It also never *downgrades* a stronger
  `KNOWN_EXPOSED`; overlap adds evidence to it.
- A **no-match is never proof of no exposure**. Absence of a hash match is
  the conservative direction and yields `UNKNOWN`, not `independentEvidence`.
- Fingerprints must be real 64-char sha256 hex. A similarity score is
  rejected: `FINGERPRINT NO-MATCH != PROOF OF NO EXPOSURE`, and
  `SIMILARITY != EVIDENCE`.

Hashing reuses the existing `sha256HexBytes` from `src/runners/sync.ts`.

## Normalization, documented exactly

`NORMALIZATION != SEMANTIC EQUIVALENCE`. Over-normalizing collapses distinct
benchmark items and manufactures false overlap.

**Applied:** CRLF and lone CR → LF; trailing whitespace stripped per line;
whole item trimmed.

**Not applied:** case folding, punctuation stripping, Unicode normalization,
inner whitespace collapsing, synonym/semantic handling.

So `Hello` ≠ `hello`, `a,b` ≠ `ab`, `a  b` ≠ `a b`, `café` ≠ `cafe` — a
missed match is honest, a false match is not. Only a line-ending or
trailing-whitespace difference is treated as the same item.

## Performance is never contamination evidence

The assessment has **no** `score`, `accuracy`, `passed`, `mean`,
`latencyMs`, `performance` or `result` field, and the input rejects unknown
keys, so performance cannot enter by any route.

```
HIGH SCORE != CONTAMINATION PROOF
LOW SCORE  != CLEAN BENCHMARK PROOF
```

A surprising result may trigger investigation; it proves nothing either way.

## Contamination is relational

`subjectRef` identifies the model **or** the system, and the same benchmark
yields different assessments per subject. Nothing marks a dataset globally
contaminated because one model saw it.

```
MODEL CONTAMINATION != AGENT/SYSTEM CONTAMINATION
```

`independentEvidenceFor(assessments, query)` returns
`INDEPENDENT | QUALIFIED | NO_ASSESSMENT` — a **qualification** attached
beside a result. It never mutates an observed score.

## Identity

- `assessmentId` is `bcont-<slug>`, matching
  `/^bcont-[a-z0-9][a-z0-9-]*$/`, so it **structurally cannot** masquerade
  as a dataset id, model id, run id, evidence id, governance proposal id
  (`gov-…`) or review pack id (`rcp-…`).
- `datasetVersion` is **required** and strict `x.y.z`:
  `DATASET NAME != DATASET VERSION`.
- `subjectVersion` is optional but available, so per-version exposure can be
  distinguished.
- `assessedAt` is **caller-supplied**; no clock is called.
- `canonicalAssessment` key-sorts; queries order by
  id → benchmark → subject → version with a **real comparator**, and
  deep-copy every result.

## Security and privacy

Contamination metadata carries only **identifiers and hashes** — never raw
benchmark content, answer keys, expected outputs or private labels. A test
asserts the serialized assessment contains the fingerprint but not the item
text, and contains no `answer` or `expected` substring.

## Boundaries

- **Not a scorer.** No score, grade or metric computation; it replaces no
  `Scorer` and does not touch `runEvaluation`.
- **No second registry.** No `DatasetRegistry2`, no `BenchmarkRegistry2`, no
  second evidence graph. Reuses `DatasetSplit`/`DATASET_SPLITS`,
  `sha256HexBytes`, and the `ClaimSource` provenance vocabulary established
  in `src/providers/trainingLifecycle.ts`.
- **Not clean-room.** `SEALED BENCHMARK != CLEAN-ROOM EXECUTION`;
  `REQ-p20-clean-room` remains BLOCKED and untouched.
- **Does not alter the CausalHarness.** A contaminated dataset may qualify a
  comparison later; the harness is not rewritten.
- **No memory interference.** `REQ-memory-integrity-boundary` is
  `OWNER_GATED`; exposure is *represented*, never cleared.
- **No fingerprinting by semantic similarity**, no crawling, no downloading,
  no training-data inspection, no provenance oracle.

## Source honesty

The registered source is a `RESEARCH_NOTE` reference (*"benchmark
research"*). **No primary source document exists in this repository**, so no
citation is claimed and no paper result is reproduced.
`RESEARCH_NOTE != CITATION`, `PROMPT MEMORY != SOURCE`.

## Scope not implemented

Not built, because the registered requirement is *partition semantics plus
contamination detection*: temporal cutoff verification, repeated-evaluation
/ retest history tracking, memory and retrieval-corpus exposure scanning,
answer-key isolation enforcement in the runtime, and any automated leak
detection pipeline. These remain unimplemented rather than stubbed.

Tests: `src/eval/contamination.test.ts` (37 tests).
