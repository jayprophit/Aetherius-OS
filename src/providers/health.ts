/**
 * P18/2 live health model. Declared capability (P18/1) is never confused
 * with observed working state: every observation carries source, time and
 * freshness, and UNKNOWN is never treated as HEALTHY.
 */

export type HealthStatus =
  | "UNKNOWN"
  | "HEALTHY"
  | "DEGRADED"
  | "UNAVAILABLE"
  | "AUTH_REQUIRED"
  | "RATE_LIMITED"
  | "MISCONFIGURED"
  | "UNSUPPORTED";

export type HealthSource =
  | "LOCAL_PROBE"
  | "CLI_PROBE"
  | "API_PROBE"
  | "CONFIG"
  | "REGISTRY"
  | "OWNER_CONFIGURATION";

export interface HealthRecord {
  status: HealthStatus;
  /** Epoch ms when observed. */
  observedAt: number;
  /** How long the observation stays current (ms). */
  ttlMs: number;
  source: HealthSource;
  reason: string;
}

export function isFresh(record: HealthRecord, nowMs: number): boolean {
  return nowMs >= record.observedAt && nowMs <= record.observedAt + record.ttlMs;
}

/** Effective routing state: stale observations decay to UNKNOWN. */
export function effectiveStatus(record: HealthRecord, nowMs: number): HealthStatus {
  if (!isFresh(record, nowMs)) return "UNKNOWN";
  return record.status;
}

export function unknownHealth(reason: string, source: HealthSource = "REGISTRY"): HealthRecord {
  return { status: "UNKNOWN", observedAt: 0, ttlMs: 0, source, reason };
}

export interface ProbeResult {
  record: HealthRecord;
  detail: Record<string, unknown>;
}

export interface HealthProbe {
  readonly id: string;
  probe(nowMs?: number): Promise<ProbeResult>;
}

async function fetchJson(url: string, timeoutMs: number): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as unknown;
  } finally {
    clearTimeout(timer);
  }
}

/** Ollama local probe: version + model list. Never starts the daemon. */
export class OllamaProbe implements HealthProbe {
  readonly id = "ollama";
  constructor(
    private readonly baseUrl = "http://127.0.0.1:11434",
    private readonly timeoutMs = 3000,
    private readonly ttlMs = 60000,
  ) {}
  async probe(nowMs: number = Date.now()): Promise<ProbeResult> {
    try {
      const version = (await fetchJson(`${this.baseUrl}/api/version`, this.timeoutMs)) as { version?: string };
      const tags = (await fetchJson(`${this.baseUrl}/api/tags`, this.timeoutMs)) as {
        models?: Array<{ name?: string }>;
      };
      const models = (tags.models ?? []).map((m) => String(m.name ?? "")).filter(Boolean).sort();
      return {
        record: {
          status: "HEALTHY",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "LOCAL_PROBE",
          reason: `ollama reachable${version.version ? ` v${version.version}` : ""}; ${models.length} model(s) installed`,
        },
        detail: { version: version.version ?? null, models },
      };
    } catch (error) {
      return {
        record: {
          status: "UNAVAILABLE",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "LOCAL_PROBE",
          reason: `ollama unreachable: ${error instanceof Error ? error.message : String(error)}`,
        },
        detail: { models: [] },
      };
    }
  }
}

/** LM Studio local probe: server + model list. Never launches models. */
export class LMStudioProbe implements HealthProbe {
  readonly id = "lmstudio";
  constructor(
    private readonly baseUrl = "http://127.0.0.1:1234",
    private readonly timeoutMs = 3000,
    private readonly ttlMs = 60000,
  ) {}
  async probe(nowMs: number = Date.now()): Promise<ProbeResult> {
    try {
      const data = (await fetchJson(`${this.baseUrl}/v1/models`, this.timeoutMs)) as {
        data?: Array<{ id?: string }>;
      };
      const models = (data.data ?? []).map((m) => String(m.id ?? "")).filter(Boolean).sort();
      return {
        record: {
          status: "HEALTHY",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "LOCAL_PROBE",
          reason: `lmstudio server reachable; ${models.length} model(s) listed`,
        },
        detail: { models },
      };
    } catch (error) {
      return {
        record: {
          status: "UNAVAILABLE",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "LOCAL_PROBE",
          reason: `lmstudio unreachable (server not enabled?): ${error instanceof Error ? error.message : String(error)}`,
        },
        detail: { models: [] },
      };
    }
  }
}

export type ExecFn = (
  command: string,
  args: string[],
  timeoutMs: number,
) => Promise<{ stdout: string; exitCode: number }>;

/**
 * Codex CLI probe: separates CLI availability from auth/inference.
 * Auth state is reported only from explicit version/auth evidence, never
 * inferred from process health. No tokens are read or stored.
 */
export class CodexProbe implements HealthProbe {
  readonly id = "codex";
  constructor(
    private readonly exec: ExecFn,
    private readonly command = "codex",
    private readonly timeoutMs = 15000,
    private readonly ttlMs = 300000,
  ) {}
  async probe(nowMs: number = Date.now()): Promise<ProbeResult> {
    try {
      const version = await this.exec(this.command, ["--version"], this.timeoutMs);
      if (version.exitCode !== 0) {
        return {
          record: {
            status: "MISCONFIGURED",
            observedAt: nowMs,
            ttlMs: this.ttlMs,
            source: "CLI_PROBE",
            reason: `codex --version exited ${version.exitCode}`,
          },
          detail: { cli: false, auth: "UNKNOWN" },
        };
      }
      return {
        record: {
          status: "HEALTHY",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "CLI_PROBE",
          reason: `codex CLI present (${version.stdout.trim()}); auth verified separately, never inferred`,
        },
        detail: { cli: true, version: version.stdout.trim(), auth: "UNKNOWN" },
      };
    } catch (error) {
      return {
        record: {
          status: "UNAVAILABLE",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "CLI_PROBE",
          reason: `codex CLI not runnable: ${error instanceof Error ? error.message : String(error)}`,
        },
        detail: { cli: false, auth: "UNKNOWN" },
      };
    }
  }
}

/** Config-only probe for cloud providers: honest NOT_CONFIGURED/UNKNOWN. */
export class ConfigProbe implements HealthProbe {
  readonly id: string;
  constructor(
    providerId: string,
    private readonly configured: boolean,
    private readonly ttlMs = 300000,
  ) {
    this.id = providerId;
  }
  async probe(nowMs: number = Date.now()): Promise<ProbeResult> {
    if (!this.configured) {
      return {
        record: {
          status: "UNAVAILABLE",
          observedAt: nowMs,
          ttlMs: this.ttlMs,
          source: "CONFIG",
          reason: `${this.id} not configured; no usable runtime`,
        },
        detail: {},
      };
    }
    return {
      record: {
        status: "UNKNOWN",
        observedAt: nowMs,
        ttlMs: this.ttlMs,
        source: "CONFIG",
        reason: `${this.id} configured but never probed; health unknown, not healthy`,
      },
      detail: {},
    };
  }
}
