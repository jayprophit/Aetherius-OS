# Representation Superposition Lab (REQ-p18-superposition-lab, P18)

**EXPERIMENTAL / STUDY_ONLY.** An isolated evaluation lane for the
interaction between representation superposition and quantization. It is
never in the routing path and never a production dependency.

The registered requirement is the scope authority:

> Isolated STUDY_ONLY eval lane for superposition/quantization interaction
> (feature capacity, interference, width, sparsity, accuracy, memory,
> energy); never in the routing path, never a production dependency.

Implementation: `src/eval/superposition.ts`.

## Source honesty — read this first

The registered source is a `RESEARCH_NOTE` reference:

```json
"source": {"class": "RESEARCH_NOTE", "ref": "representation research",
           "location": "research addendum post-checkpoint 2026-09-23"}
```

**No primary source document exists in this repository**, and the
requirement cites no paper. So the three claim layers are separated
explicitly and the code carries the distinction as data:

| Layer | Value in this lab |
| --- | --- |
| **Source claim** | `UNAVAILABLE_RESEARCH_NOTE_REFERENCE_ONLY` (`SOURCE_CLAIM_STATUS`) |
| **Aetherius mechanism** | The analytical construction below, attributed to standard representation-superposition mathematics — **not** a reproduction of any paper |
| **Aetherius measurement** | Whatever the deterministic run computes, per metric, with per-metric provenance |

This lab reproduces no paper result and claims no scaling, robustness or
superiority. A `RESEARCH_NOTE` reference is not a citation.

## Mechanism (analytical, defined here)

A representation stores `features` binary feature directions in `width`
dimensions.

- **Dense** (`superposition: false`): `features <= width`, each feature gets
  its own dimension, so interference is exactly zero.
- **Superposed** (`superposition: true`): `features > width`, so features are
  packed — `ceil(features / width)` per dimension — and must share
  directions. Interference appears.
- **Quantization**: each stored dimension is rounded to `bits` bits, adding
  collision error on top of packing error.

The interaction under study is precisely *packing × rounding*.

A `superposition: true` variant with `features <= width` is **rejected**:
that is a dense baseline wearing a superposition label, and accepting it
would manufacture a false independent variable.

## Terminology boundaries

This is the **mathematical / neural** sense of superposition — packed
feature directions sharing representational capacity. It is **NOT**:

- quantum superposition or quantum computing
- mixture-of-experts routing
- ensemble averaging
- model merging
- multi-head attention
- latent-space mixing
- **BitNet / ternary compute** — a separate research lane in this repository
  (`registry/legacy-coverage.json` tracks "Ternary / low-bit computing"
  separately). These lanes are not merged.

Note that the demo UI in `components/` already uses "superposition" and
"qubits" loosely (`CoreParadigms.tsx`, `VirtualAccelerator.tsx`). That UI
prose is marketing copy, is not this mechanism, and this lab makes no
quantum claim.

## Metrics — the seven the requirement names

`LAB_METRICS` is exactly the registered list and nothing else. It is
deliberately **not** the shared provider-benchmark vocabulary in
`src/providers/benchmarks.ts` (`latency`, `throughput`, `tool_success`, …,
validated by `isValidMetric`); that shared vocabulary is not widened to
absorb representation metrics.

| Metric | Provenance | Definition |
| --- | --- | --- |
| `feature_capacity` | `ANALYTIC` | `width × bits` |
| `width` | `ANALYTIC` | the width actually used |
| `memory` | `ANALYTIC` | `width × bits / 8` bytes — a **model** of storage, not a measurement of any allocator |
| `sparsity` | `ANALYTIC` | active dimensions / `width × bits` |
| `interference` | `MEASURED` | mean normalized reconstruction error |
| `accuracy` | `MEASURED` | fraction of features reconstructed within `DECODE_TOLERANCE` |
| `energy` | `UNAVAILABLE` | **always null** |

### Why `energy` is always UNAVAILABLE

The only hardware measurement in this repository is
`src/providers/hardwareProbe.ts`, which times an FP32 CPU matmul. There is
no energy measurement anywhere. An energy number here would be invented, so
the metric is reported as `null` with provenance `UNAVAILABLE`.
`UNKNOWN METRIC != ZERO` — it is not reported as `0`.

`memory` is labelled `ANALYTIC` for the same reason: `width × bits / 8` is
closed-form arithmetic over declared dimensions, not a measurement of real
allocator behaviour.

## Two design decisions that prevent dishonest metrics

**1. Interference is reconstruction error, not sign agreement.** A
sign-agreement decoder must break ties, and a coarse grid can round a
cancelled `0` to a small positive value and let one of two tied features
"win" — which reported **less** interference after destroying **more**
information. Normalized error is monotone in the damage and cannot reward
it. A regression test pins this across bit-widths.

**2. `DECODE_TOLERANCE = 0.25`, strictly inside the sign-loss boundary.**
A threshold sitting exactly at `0.5` is a bug: catastrophic cancellation
produces error of exactly `0.5`, and a quantizer with an odd number of
levels has no zero, so it can nudge a fully-cancelled feature just inside
the threshold and manufacture accuracy out of total interference.

**1-bit dimensions are rejected.** A single-bit dimension has only
`{-1, +1}` and no zero level, so two features that cancel in a shared
dimension have no consistent encoding — measured "accuracy" there is a
decoder artifact. Superposition cannot be expressed at all in one bit. The
floor of 2 is far below the repository's own `WELL_KNOWN_PRECISIONS`
(INT4) while still admitting a representable zero.

## Baseline and experimental design

`compareSuperposition(config)` compares a dense baseline against a
superposed experimental variant.

- **Controlled:** `features` — the same number of features is represented in
  both arms, so the task is equally hard.
- **Independent:** `superposition`, `bits`, `width`.
- `width` is deliberately **not** controlled. Superposition *is* defined by
  `features > width`, so pinning width as well would make a clean comparison
  inexpressible — the mechanism could not vary at all. This was a real bug
  found during implementation.
- A comparison is `comparable: false` when any run was confounded, when no
  clean pair exists, or when `bits` is identical in both arms (the
  quantization interaction was not actually varied).

Confounded runs are **excluded** from the deltas and reported in
`confoundedRuns` with reasons. They are never merged into a clean average.

## No winner, no composite

`SuperpositionComparison` has per-metric deltas sorted by metric name and
**deliberately no** `winner`, `best`, `verdict`, `ranking` or composite
score. The one score-adjacent field is `noCompositeScore: true` — a negative
assertion flag, not a score. This follows the causal harness precedent
(`src/eval/harness.ts`: per-metric deltas, no composite).

The causal harness itself was **not** reused: its `TrialObservations` are
agent-task fields (`successClaimed`, `toolCalls`, `wallMs`, `escalations`)
and do not fit a representation experiment. Forcing them would have meant
inventing agent metrics. What was reused is its *discipline* (confound
detection, exclusion, per-metric deltas) and its exported
`stableStringify` canonical serializer.

## Reproducibility

- **Explicit seed required.** `seed` must be a non-negative integer; there
  is no ambient randomness. This repository has no RNG abstraction and no
  seed field anywhere (the only `Math.random` is an id factory in
  `src/workflows/runtime.ts`), so the lab introduces a small fixed 32-bit
  LCG, justified by the requirement's reproducibility rules and acceptable
  in a `STUDY_ONLY` lane.
- `runIndex` is required and folded into the stream, so run *N* is not a
  repeat of run 0.
- **All runs retained** — `labRuns` returns every run, sorted by variant then
  run index. No outlier is discarded. `runDispersion` reports run-to-run
  spread instead of hiding it.
- `canonicalSuperposition` uses key-sorted `stableStringify`, so
  key-insertion order cannot leak into the serialization.
- Every ordered list uses a real comparator, never a comparator factory.
- `recordedAt` is **caller-supplied**; no clock is called.
- NaN, Infinity and negative metrics are rejected at the source, throwing
  rather than contaminating a result.

## Scale limitations — toy only

This is a **synthetic** experiment on generated ±1 directions at toy sizes
(4–8 features, 2–4 dimensions). It demonstrates the *semantics* of the
mechanism, nothing more.

```
TOY EXPERIMENT != PRODUCTION BENCHMARK
```

It says nothing about real model quality, scaling behaviour, hardware
efficiency or general intelligence. No model is trained, loaded or
downloaded; no dataset is fetched; no provider or credential is used.

## Production boundaries — verified untouched

No production routing code was read or modified by this unit. The selection
points that remain untouched:

| Concern | Function |
| --- | --- |
| static model routing | `routeCapabilityRequest` — `src/providers/capabilities.ts:113` |
| live-state routing | `routeWithLiveState` — `src/providers/live.ts:58` |
| adapter dispatch | `AdapterRegistry.find` / `invokeRoute` — `src/providers/invoke.ts:128,167` |
| precision ranking | `rankForPrecision` — `src/providers/hardware.ts:175` |
| Reflex decision | `S0RulesBackend.decide` — `src/genesis/reflex.ts:257` |

Enforced invariants:

```
EXPERIMENT != PRODUCTION ARCHITECTURE
SUPERPOSITION LAB != MODEL FABRIC      (REQ-p18-model-fabric stays BLOCKED on cloud credentials)
SUPERPOSITION LAB != GENESIS           (no identity, memory, agency or authority touched)
SUPERPOSITION LAB != REFLEX
SOURCE CLAIM != LOCAL RESULT
LOCAL RESULT != GENERAL PROOF
REPRESENTATION SUPERPOSITION != QUANTUM SUPERPOSITION
UNKNOWN METRIC != ZERO
NO CLEAN COMPARISON != CLEAN RESULT
```

`LAB_STUDY_ONLY` is a mandatory marker mirroring
`src/programme/doeMapping.ts`, and every comparison carries `studyOnly:
true`. Nothing here has deploy authority: promotion to production would
require a separate requirement, evidence, review, governance and
authorization.

## Release effect: none

`docs/PUBLIC_RELEASE_READINESS.md` already lists the superposition lab under
**EXPERIMENTAL**. Completing it changes no release gate — not packaging,
installer, first-run, update, rollback, privacy, human UX or supply-chain
proof. Public release remains `NOT YET RELEASE-PROVEN` with scope
`UNDEFINED` and `REQ-p31-release-scope` `OWNER_GATED`.

Tests: `src/eval/superposition.test.ts` (36 tests: variant and config
validation, false-control rejection, analytical cases — zero interference
when dense, positive when packed, no precision effect when unpacked —,
per-metric provenance, `energy` `UNAVAILABLE` and never zero, NaN/Infinity
rejection, seed and run-index determinism, run retention and canonical
ordering, dispersion reporting, canonical serialization, confound detection
with exclusion, the width-as-mechanism invariant, precision-damage
monotonicity, 1-bit rejection, encoder/decoder mapping invariant, no
winner/composite field, study-only and source-honesty markers, and the
production-surface bans).
