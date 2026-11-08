/**
 * Aetherius Cloud — provider health monitoring.
 *
 * Probes are plain async checks; the monitor records one row per probe per
 * pass into the control plane (`provider_health`). Failures are normalized,
 * never thrown, so one dead provider cannot stop the sweep.
 */

export type ProviderState =
  | "AVAILABLE"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "UNKNOWN";

export interface HealthProbe {
  readonly id: string;
  check(signal?: AbortSignal): Promise<{
    state: ProviderState;
    latencyMs: number;
    detail?: string;
  }>;
}

export interface HealthRecord {
  provider_id: string;
  state: ProviderState;
  latency_ms: number | null;
  detail: string | null;
}

export interface HealthSink {
  recordHealth(row: Omit<HealthRecord, "observed_at">): Promise<void>;
}

const TERMINAL: ProviderState[] = ["AVAILABLE", "DEGRADED", "UNAVAILABLE", "AUTH_REQUIRED"];

export class HealthMonitor {
  private readonly probes: readonly HealthProbe[];
  private readonly sink: HealthSink;

  constructor(probes: readonly HealthProbe[], sink: HealthSink) {
    this.probes = probes;
    this.sink = sink;
  }

  /** One sweep: every probe, normalized, persisted. Never throws. */
  async runOnce(signal?: AbortSignal): Promise<HealthRecord[]> {
    const records: HealthRecord[] = [];
    for (const probe of this.probes) {
      const started = Date.now();
      try {
        const result = await probe.check(signal);
        records.push({
          provider_id: probe.id,
          state: TERMINAL.includes(result.state) ? result.state : "UNKNOWN",
          latency_ms: Number.isFinite(result.latencyMs) ? result.latencyMs : null,
          detail: result.detail ? String(result.detail).slice(0, 200) : null,
        });
      } catch (error) {
        records.push({
          provider_id: probe.id,
          state: "UNAVAILABLE",
          latency_ms: null,
          detail: error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200),
        });
      }
    }
    for (const record of records) {
      await this.sink.recordHealth(record);
    }
    return records;
  }

  /** Periodic sweep until aborted. */
  async run(intervalMs: number, signal?: AbortSignal): Promise<void> {
    while (!signal?.aborted) {
      await this.runOnce(signal);
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, intervalMs)));
    }
  }
}

/** Convenience probe built from a check function. */
export function probe(
  id: string,
  check: (signal?: AbortSignal) => Promise<{ state: ProviderState; detail?: string }>,
): HealthProbe {
  return {
    id,
    async check(signal?: AbortSignal) {
      const started = Date.now();
      const result = await check(signal);
      return { state: result.state, latencyMs: Date.now() - started, detail: result.detail };
    },
  };
}
