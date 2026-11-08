/**
 * Aetherius Cloud Fabric — persistent control-plane state.
 *
 * Talks to the approved Supabase control plane (apps/aetherius-cloud/supabase)
 * through PostgREST. The service-role credential is supplied by REFERENCE and
 * must only ever run server-side: it is never embedded here, never logged and
 * never shipped to a browser bundle.
 *
 * Covers the fabric requirements that are safe to automate:
 *   - persistent task / job state (cloud_task)
 *   - provider health observations (provider_health)
 *   - usage + cost recording (cloud_usage)
 *   - provider registry reads (cloud_provider)
 */

import type { CredentialResolver, FetchLike } from "./providers.ts";

export interface FabricConfig {
  apiUrl: string;
  credentialRef: string;
  credentials: CredentialResolver;
  fetchFn?: FetchLike;
}

export interface HealthRecord {
  providerId: string;
  state: string;
  latencyMs?: number;
  detail?: string;
}

export interface UsageRecord {
  providerId: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  costGbp?: number;
}

export interface CloudTask {
  id: string;
  definition: string;
  subject: string;
  state: string;
  history: unknown[];
}

export interface ProviderRow {
  id: string;
  display_name: string;
  kind: string;
  credential_ref: string | null;
}

export class FabricError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "FabricError";
  }
}

export class CloudFabric {
  private readonly apiUrl: string;
  private readonly credentialRef: string;
  private readonly credentials: CredentialResolver;
  private readonly fetchFn: FetchLike;

  constructor(config: FabricConfig) {
    this.apiUrl = config.apiUrl.replace(/\/+$/, "");
    this.credentialRef = config.credentialRef;
    this.credentials = config.credentials;
    this.fetchFn = config.fetchFn ?? ((url, init) => fetch(url, init));
  }

  /** Server-side only. Callers must guarantee this never reaches a browser. */
  private async headers(): Promise<Record<string, string>> {
    const secret = await this.credentials(this.credentialRef);
    if (!secret) throw new FabricError("no control-plane credential resolved", 401);
    return {
      apikey: secret,
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    };
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const headers = await this.headers();
    const res = await this.fetchFn(`${this.apiUrl}/rest/v1/${path}`, {
      ...init,
      headers: { ...headers, ...(init.headers as Record<string, string> | undefined) },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new FabricError(`control-plane HTTP ${res.status}: ${text.slice(0, 200)}`, res.status);
    }
    return text ? JSON.parse(text) : null;
  }

  /** Append a provider health observation. */
  async recordHealth(record: HealthRecord): Promise<boolean> {
    await this.request("provider_health", {
      method: "POST",
      body: JSON.stringify({
        provider_id: record.providerId,
        state: record.state,
        latency_ms: record.latencyMs ?? null,
        detail: record.detail ?? null,
      }),
    });
    return true;
  }

  /** Record token usage and cost (costGbp defaults to 0 — the £0 policy). */
  async recordUsage(record: UsageRecord): Promise<boolean> {
    await this.request("cloud_usage", {
      method: "POST",
      body: JSON.stringify({
        provider_id: record.providerId,
        model: record.model,
        input_tokens: record.inputTokens ?? null,
        output_tokens: record.outputTokens ?? null,
        total_tokens: record.totalTokens ?? null,
        cost_gbp: record.costGbp ?? 0,
      }),
    });
    return true;
  }

  /** Create a task with an empty append-only history. */
  async createTask(id: string, definition: string, subject: string): Promise<CloudTask | null> {
    const rows = (await this.request("cloud_task", {
      method: "POST",
      body: JSON.stringify({ id, definition, subject, state: "queued", history: [] }),
    })) as CloudTask[] | null;
    return rows?.[0] ?? null;
  }

  /** Append a history entry and move the task state. */
  async updateTaskState(id: string, state: string, historyEntry?: unknown): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;
    const history = [...task.history, ...(historyEntry ? [historyEntry] : [])];
    await this.request(`cloud_task?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify({ state, history, updated_at: new Date().toISOString() }),
    });
    return true;
  }

  async getTask(id: string): Promise<CloudTask | null> {
    const rows = (await this.request(
      `cloud_task?id=eq.${encodeURIComponent(id)}&select=*`)) as CloudTask[] | null;
    return rows?.[0] ?? null;
  }

  /** Provider registry (no secrets — credential_ref is a stable reference). */
  async listProviders(): Promise<ProviderRow[]> {
    return (await this.request(
      "cloud_provider?select=id,display_name,kind,credential_ref&order=id")) as ProviderRow[];
  }
}
