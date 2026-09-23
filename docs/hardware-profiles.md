# Hardware Profiles (REQ-p18-hardware-profiles, P18)

Empirical CPU/GPU/NPU precision-matrix profiles for P18/P20 routing.
Measured data replaces name-pattern heuristics. This is NOT a model
router (capabilities.ts owns routing) and NOT the blocked Model Fabric:
profiles are local measurable inputs, never live-provider proof.

## Contracts (`src/providers/hardware.ts`)

- `HardwareProfile`: profileId, deviceClass (CPU/GPU/NPU), vendor/model/
  architecture/runtime/host fingerprint, measuredAt, workload id+version,
  ONE provenance (LOCAL_EMPIRICAL, EXTERNAL_BENCHMARK, VENDOR_REPORTED,
  ESTIMATED, UNVERIFIED — never mixed), precision entries.
- `PrecisionEntry`: precision label + support
  (MEASURED/UNMEASURED/KNOWN_UNSUPPORTED/UNAVAILABLE). MEASURED requires
  latencyMs + samples (all numbers finite); non-measured entries must
  carry NO numbers — anti-fabrication by construction.
- `unmeasuredProfile`: honest declaration helper (no numbers,
  UNVERIFIED, reason recorded).
- `HardwareProfileRegistry`: validated registration, duplicate
  rejection, deterministic listing.
- `rankForPrecision`: MEASURED support ordered by latency, then id;
  everything else excluded with explicit reasons (unsupported /
  unavailable / unmeasured / unlisted). Names never outrank
  measurements.

## Empirical probe (`src/providers/hardwareProbe.ts`)

Bounded deterministic Float64 matmul (48³ × 3, millisecond scale)
timed with wall-clock. Measured on the build workstation (i7-870):
FP32 mean 2.67ms, ~249 MFLOPS, 3 samples, LOCAL_EMPIRICAL. GPU/NPU are
recorded UNMEASURED/UNAVAILABLE here (no device, no drivers claimed).

Not measured and not claimed: energy, thermals, TOPS, bandwidth.
Unit fixtures are contract data, never production evidence.

Tests: `src/providers/hardware.test.ts` (7 tests: CPU/GPU/NPU shapes,
fabrication rejection, measured-over-name routing, exclusions, real
probe bounds, deterministic serialization).
