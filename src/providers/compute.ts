import type { Provider, ProviderReport } from "./types";
import { baseReport } from "./types";

export interface ComputeSignals {
  cores: number | null;
  memoryGB: number | null;
}

export type ComputeSampler = () => ComputeSignals;

function defaultSampler(): ComputeSignals {
  const nav = (globalThis as { navigator?: { hardwareConcurrency?: number; deviceMemory?: number } }).navigator;
  return {
    cores: typeof nav?.hardwareConcurrency === "number" ? nav.hardwareConcurrency : null,
    memoryGB: typeof nav?.deviceMemory === "number" ? nav.deviceMemory : null,
  };
}

// REAL_LOCAL provider built from real local signals only. Simulated VM-B
// backends (ternary emulator, quantum simulator) are reported by the P9
// routing policy, never invented here.
export function createComputeProvider(sampler: ComputeSampler = defaultSampler): Provider {
  return {
    id: "compute",
    kind: "REAL_LOCAL",
    describe: () => "Host compute signals (cores/memory where exposed)",
    async check(): Promise<ProviderReport> {
      const started = Date.now();
      const signals = sampler();
      if (signals.cores == null && signals.memoryGB == null) {
        return baseReport("compute", "REAL_LOCAL", {
          state: "UNAVAILABLE",
          detail: "no compute signals exposed in this environment",
          latencyMs: Date.now() - started,
          errorCode: "NO_SIGNALS",
          errorDetail: "navigator.hardwareConcurrency/deviceMemory absent",
        });
      }
      return baseReport("compute", "REAL_LOCAL", {
        state: "AVAILABLE",
        detail: `cores=${signals.cores ?? "?"} memoryGB=${signals.memoryGB ?? "?"}`,
        latencyMs: Date.now() - started,
      });
    },
  };
}
