/**
 * Bounded empirical CPU probe: a small deterministic Float64 matmul timed
 * with wall-clock. Produces a LOCAL_EMPIRICAL FP32 precision entry with
 * real measured numbers on the executing machine — or throws when the
 * environment cannot measure (never fabricated).
 *
 * Workload is deliberately tiny (milliseconds): it proves measurability
 * and exercises the profile pipeline, not a Hardware Benchmark Lab
 * (which remains future work).
 */

export const CPU_PROBE_WORKLOAD_ID = "cpu-matmul-f64";
export const CPU_PROBE_WORKLOAD_VERSION = "1.0.0";

export interface CpuProbeResult {
  latencyMs: number;
  throughputOps: number;
  samples: number;
}

export function probeCpuMatmul(size = 48, repeats = 3): CpuProbeResult {
  if (!Number.isInteger(size) || size < 8 || size > 256) {
    throw new Error("probe size must be an integer 8..256");
  }
  if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) {
    throw new Error("probe repeats must be an integer 1..10");
  }
  // Deterministic fill: same bytes every run, no RNG state.
  const a = new Float64Array(size * size);
  const b = new Float64Array(size * size);
  for (let i = 0; i < size * size; i++) {
    a[i] = (i % 17) / 17;
    b[i] = ((i * 7) % 13) / 13;
  }
  const out = new Float64Array(size * size);
  const latencies: number[] = [];
  for (let r = 0; r < repeats; r++) {
    out.fill(0);
    const start = Date.now();
    for (let i = 0; i < size; i++) {
      for (let k = 0; k < size; k++) {
        const aik = a[i * size + k]!;
        for (let j = 0; j < size; j++) {
          out[i * size + j]! += aik * b[k * size + j]!;
        }
      }
    }
    latencies.push(Date.now() - start);
  }
  // Touch the output so no engine may discard the loop as dead code.
  let checksum = 0;
  for (let i = 0; i < out.length; i += 97) checksum += out[i]!;
  if (!Number.isFinite(checksum)) throw new Error("probe produced non-finite output");
  const latencyMs = Math.max(0, latencies.reduce((x, y) => x + y, 0) / latencies.length);
  const ops = 2 * size * size * size;
  return {
    latencyMs,
    throughputOps: latencyMs > 0 ? Math.floor((ops * repeats) / (latencyMs / 1000)) : 0,
    samples: repeats,
  };
}
