/**
 * Aetherius Cloud — persistent control-plane client.
 *
 * Talks to the Supabase control plane created by the approved migration
 * (`cloud_provider`, `cloud_resource`, `provider_health`, `cloud_task`,
 * `cloud_usage`, `cloud_deployment`).
 *
 * SECURITY: this client is SERVER-SIDE ONLY. It resolves the service_role
 * credential by reference and never exposes it to a browser, a model prompt,
 * a log or a client bundle. Every table has RLS enabled with no anon policy,
 * so the anon key cannot read or write the control plane.
 */

import type { CredentialResolver } from "./providers.ts";

export interface ControlPlaneConfig {
  /** Supabase project API URL (https://<ref>.supabase.co). */
  apiUrl: string;
  /** Stable reference for the service_role credential. */
  credentialRef: string;
  credentials: CredentialResolver;
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
}

export interface ProviderRow {
  id: string;
  display_name: string;
  kind: string;
  credential_ref: string | null;
}

export interface HealthRow {
  provider_id: string;
  state: string;
  latency_ms: number | null;
  detail: string | null;
  observed_at: string;
}

export interface TaskRow {
  id: string;
  definition: string;
  subject: string;
  state: string;
  history: unknown[];
  created_at: string;
  updated_at: string;
}

export interface UsageRow {
  provider_id: string;
  model: string;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cost_gbp: string;
}

export class ControlPlaneError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ControlPlaneError";
    this.status = status;
  }
}

function join(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}/rest/v1/${path.replace(/^\/+/, "")}`;
}

export class ControlPlaneClient {
  private readonly apiUrl: string;
  private readonly credentialRef: string;
  private readonly credentials: CredentialResolver;
  private readonly fetchFn: (url: string, init?: RequestInit) => Promise<Response>;

  constructor(config: ControlPlaneConfig) {
    this.apiUrl = config.apiUrl;
    this.credentialRef = config.credentialRef;
    this.credentials = config.credentials;
    this.fetchFn = config.fetchFn ?? ((url, init) => fetch(url, init));
  }
  /** The service-role credential — never logged, never returned to a client. */
  protected async secret(): Promise<string | undefined> {
    return this.credentials(this.credentialRef);
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const key = await this.secret();
    if (!key) throw new ControlPlaneError("no control-plane credential resolved", 401);
    const res = await this.fetchFn(join(this.apiUrl, path), {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
    if (!res.ok) {
      const detail = (await res.text()).slice(0, 300);
      throw new ControlPlaneError(`control plane HTTP ${res.status}: ${detail}`, res.status);
    }
    const text = await res.text();
    return text ? (JSON.parse(text) as unknown) : null;
  }

  listProviders(): Promise<ProviderRow[]> {
    return this.request("cloud_provider?select=*&order=id") as Promise<ProviderRow[]>;
  }

  listTasks(limit = 50): Promise<TaskRow[]> {
    return this.request(`cloud_task?select=*&order=updated_at.desc&limit=${limit}`) as Promise<TaskRow[]>;
  }

  async createTask(task: Omit<TaskRow, "created_at" | "updated_at">): Promise<TaskRow> {
    const rows = (await this.request("cloud_task", {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...task, history: task.history ?? [] }),
    })) as TaskRow[];
    return rows[0];
  }

  async updateTask(id: string, patch: Partial<TaskRow>): Promise<TaskRow> {
    const rows = (await this.request(`cloud_task?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify(patch),
    })) as TaskRow[];
    return rows[0];
  }

  async recordHealth(row: Omit<HealthRow, "observed_at">): Promise<void> {
    await this.request("provider_health", { method: "POST", body: JSON.stringify(row) });
  }

  async recordUsage(row: UsageRow): Promise<void> {
    await this.request("cloud_usage", { method: "POST", body: JSON.stringify(row) });
  }

  async healthSince(since: string): Promise<HealthRow[]> {
    return this.request(
      `provider_health?select=*&observed_at=gte.${encodeURIComponent(since)}&order=observed_at.desc`,
    ) as Promise<HealthRow[]>;
  }
}
