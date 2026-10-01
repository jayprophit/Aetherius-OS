# Benchmark baseline — 2026-10-01

How this was measured, what it is compared against, and what is NOT claimed.

## What "compare using benchmark testing" means here

The external leaderboards (LiveBench, Artificial Analysis, Epoch, Geekbench AI,
Scale, Arena and similar) measure **foundation models**: LLM task quality,
inference price/performance, on-device throughput. This system is an **agent
runtime** — execution, approvals, policy, journaling — not a model. No run on
those boards can describe it, and none was attempted. Presenting one would be
fabrication, which this programme refuses to do.

What was measured instead, all from the repositories' own benchmark suites:

1. Genesis native micro-benchmarks (15 binaries), current vs the prior recorded
   outputs from 2026-09-20 found in the workspace Temp folder.
2. Agent Bridge runtime loop overhead with a scripted provider (no model), a
   new baseline with no prior to compare against.
3. Full-suite wall times per repository as coarse end-to-end signals.

## Genesis native benchmarks: 2026-09-20 vs 2026-10-01

Binaries built from the clean tree (GCC 16.1, Ninja, Debug) at Genesis 6fd5342.
Prior outputs were recorded 2026-09-20 from an older tree and an unknown build
configuration, so deltas are reported with that confound stated, not as
improvement claims. No benchmarked code path was touched by any commit between
the two dates except additions (the proposal seam is new code, unused by benches).

| Benchmark | 2026-09-20 | 2026-10-01 | Reading |
| --- | --- | --- | --- |
| core events (`genesis_bench`) | 17,481 ev/s (5.72 s) | 118,431 ev/s (0.84 s) | 6.8x; almost certainly host/build-config difference, NOT a code speedup |
| runtime events (`genesis_runtime_bench`) | 3,537 ev/s (28.27 s) | 14,082 ev/s (7.10 s) | 4.0x; same confound applies |
| organism signals (`genesis_organism_bench`) | 11,907 sig/s (8.40 s) | 37,570 sig/s (2.66 s) | 3.2x; same confound applies |
| memory build (10k nodes) | 2.92 s | 2.86 s | stable |
| memory queries (100) | 0.165 s | 0.042 s | 3.9x; same confound applies |
| memory traversals (100) | 0.218 s | 0.023 s | 9.5x; same confound applies |
| memory roundtrip | 4.25 s | 4.13 s | stable |
| memory belief build | 2.17 s | 2.90 s | slower; within noise or config difference, not a code change |
| memory belief roundtrip | 3.26 s | 3.55 s | stable-ish |

The honest summary: the three throughput figures differ by multiples, which is
incompatible with "the code got faster" given that none of the hot paths
changed. The prior run's configuration is unknown (possibly unoptimized or a
loaded host). These numbers are a new dated baseline, not a victory lap.

## Genesis subsystem comparison (all 2026-10-01, same binary set, same host)

| Subsystem | Workload | Result |
| --- | --- | --- |
| core events | 100k events | 118,431 ev/s |
| runtime dispatch | 100k events, 1k history | 14,082 ev/s |
| organism signals | 100k signals | 37,570 sig/s |
| perception | 10k obs + 10k features | 0.87 s build, 1.49 s roundtrip |
| capability | 10k caps, 50k trials | 1.44 s build, 1.04 s roundtrip |
| world model | 10k states/hypotheses/predictions + 1k sims | 4.15 s build, 2.47 s sims |
| continuity | 10k events, 100 checkpoints | 5.85 s build, 2.48 s roundtrip |
| learning | 10k traces | 0.03 s plan, 0.06 s execute, 1.53 s retention |
| affect | 10k signals, 5k regulations | 3.66 s build, 0.92 s roundtrip |
| identity | 10k entities, 20k relations | 3.89 s build, 8.74 s roundtrip |
| life record | 10k entries | 3.18 s build, 4.87 s roundtrip |
| genetics | 10k births | 6.65 s, all successful |
| crypto provider | 10k providers (synthetic only) | 12.71 s build, 28.25 s roundtrip |
| key custody | 10k handles (synthetic only) | 51.38 s build, 21.52 s roundtrip |

Outliers worth noting, not celebrating: key-custody and crypto-provider
benchmarks dominate wall time and run synthetic-only (`synthetic_only=1`,
`operation_executed=0`, `key_material_present=0`), so they measure harness
overhead, not real cryptography. The identity roundtrip (8.74 s) is the slowest
real subsystem roundtrip; worth profiling before any optimization claim.

Raw output: `Temp/bench-2026-10-01.txt` (this machine). Prior outputs:
`Temp/bench-out.txt`, `Temp/bench-genesis_{runtime,memory,organism}_bench.txt`.

## Agent Bridge runtime overhead (new baseline, 2026-10-01)

Scripted provider (returns instantly), so every millisecond is runtime
machinery: session create, worker thread, approval gate, policy evaluation,
executor dispatch, journal, review/oracle, result assembly. Disposable
workspace, local machine.

| Measurement | Result |
| --- | --- |
| Session create + write + finish task, 15 runs | min 246.5 ms, median 348.7 ms, p95 450.0 ms, max 468.5 ms |
| Approval-pause surfacing (submit to pending id visible), 5 runs | median 261.1 ms, max 553.1 ms |

Two observations from building the probe, both kept as findings rather than
fixed:
- Reusing one session for repeated identical tasks hits the executor's
  idempotent-replay protection (same deterministic action id returns the
  recorded result without re-executing). That is the mechanism working as
  designed; the probe uses one session per task.
- The ~350 ms median is dominated by loop machinery (review/oracle/persistence),
  not the executor. Any future optimization claim must profile first; the
  number is a baseline, not a budget.

## Suite wall times (coarse end-to-end signals, same machine class)

| Suite | Result |
| --- | --- |
| Agent Bridge pytest (1358 tests) | ~16 min |
| Agent Bridge unittest discover (1310 tests) | ~14 min |
| Agent Bridge intake tests (38, real HTTP) | ~27 s |
| Aetherius vitest (1526 tests) | ~30-38 s |
| IDE vitest (80) + integration pytest (8, real HTTP) | ~12 s + ~11 s |
| Genesis ctest (22 gates, clean clone) | ~162 s |

## What is NOT in this report

- No stars, no ranks, no "5 across the board". There is no external board this
  system can honestly appear on, and none was consulted for scoring.
- No before/after speedup claim for the 2026-09-20 deltas: the prior build
  configuration is unknown, and none of the measured paths changed in code.
- The Agent Bridge model benchmarks (`benchmarks/benchmark_runner.py`) were not
  run: they measure provider inference, i.e. model quality, which this report
  separates from runtime quality on principle.
