/**
 * HTTP transport for the sync worker.
 *
 * Failures are returned, not thrown, so the engine can distinguish "the
 * network is down and the outbox is safe" from "the server rejected this
 * token" without a try/catch around every call.
 */

import type {
  SyncHealth,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from "./protocol.ts";
import { SYNC_LIMITS } from "./protocol.ts";

export type TransportResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number | null; code: string; error: string };

export interface SyncTransport {
  health(signal?: AbortSignal): Promise<TransportResult<SyncHealth>>;
  push(request: SyncPushRequest, signal?: AbortSignal): Promise<TransportResult<SyncPushResponse>>;
  pull(
    cursor: number,
    limit?: number,
    signal?: AbortSignal,
  ): Promise<TransportResult<SyncPullResponse>>;
}

export interface HttpSyncTransportOptions {
  baseUrl: string;
  token?: string;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}

export class HttpSyncTransport implements SyncTransport {
  readonly baseUrl: string;
  private readonly token: string | undefined;
  private readonly fetchFn: typeof fetch | null;
  private readonly timeoutMs: number;

  constructor(options: HttpSyncTransportOptions) {
    const trimmed = options.baseUrl.trim().replace(/\/+$/, "");
    if (!/^https?:\/\//i.test(trimmed)) {
      throw new Error("sync endpoint must start with http:// or https://");
    }
    this.baseUrl = trimmed;
    this.token = options.token?.trim() || undefined;
    this.fetchFn =
      options.fetchFn ??
      (typeof globalThis.fetch === "function" ? globalThis.fetch.bind(globalThis) : null);
    this.timeoutMs = options.timeoutMs ?? 20_000;
  }

  health(signal?: AbortSignal): Promise<TransportResult<SyncHealth>> {
    return this.request<SyncHealth>("/health", { method: "GET" }, signal);
  }

  push(
    request: SyncPushRequest,
    signal?: AbortSignal,
  ): Promise<TransportResult<SyncPushResponse>> {
    if (request.records.length > SYNC_LIMITS.maxRecordsPerPush) {
      return Promise.resolve({
        ok: false,
        status: null,
        code: "BATCH_TOO_LARGE",
        error: `A push carries at most ${SYNC_LIMITS.maxRecordsPerPush} records.`,
      });
    }
    return this.request<SyncPushResponse>(
      "/v1/sync/push",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      },
      signal,
    );
  }

  pull(
    cursor: number,
    limit = 200,
    signal?: AbortSignal,
  ): Promise<TransportResult<SyncPullResponse>> {
    const safeCursor = Number.isFinite(cursor) && cursor > 0 ? Math.floor(cursor) : 0;
    const safeLimit = Math.min(
      SYNC_LIMITS.maxRecordsPerPull,
      Math.max(1, Math.floor(limit)),
    );
    return this.request<SyncPullResponse>(
      `/v1/sync/pull?cursor=${safeCursor}&limit=${safeLimit}`,
      { method: "GET" },
      signal,
    );
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    signal?: AbortSignal,
  ): Promise<TransportResult<T>> {
    if (!this.fetchFn) {
      return { ok: false, status: null, code: "FETCH_UNAVAILABLE", error: "fetch is unavailable" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error("timeout")), this.timeoutMs);
    const forwardAbort = () => controller.abort(signal?.reason);
    if (signal) {
      if (signal.aborted) controller.abort(signal.reason);
      else signal.addEventListener("abort", forwardAbort, { once: true });
    }

    const headers = new Headers(init.headers);
    headers.set("accept", "application/json");
    headers.set("cache-control", "no-store");
    if (this.token) headers.set("authorization", `Bearer ${this.token}`);

    try {
      const response = await this.fetchFn(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
        credentials: "omit",
      });
      const text = await response.text();
      let body: unknown = null;
      if (text) {
        try {
          body = JSON.parse(text) as unknown;
        } catch {
          return {
            ok: false,
            status: response.status,
            code: "MALFORMED_RESPONSE",
            error: `The sync server returned non-JSON (HTTP ${response.status}).`,
          };
        }
      }
      if (!response.ok) {
        const record = (body ?? {}) as { error?: unknown; message?: unknown };
        const code = typeof record.error === "string" ? record.error : `HTTP_${response.status}`;
        const message =
          typeof record.message === "string"
            ? record.message
            : `The sync server returned HTTP ${response.status}.`;
        return { ok: false, status: response.status, code, error: message };
      }
      if (body === null || typeof body !== "object") {
        return {
          ok: false,
          status: response.status,
          code: "EMPTY_RESPONSE",
          error: "The sync server returned an empty response.",
        };
      }
      return { ok: true, data: body as T };
    } catch (error) {
      if (signal?.aborted) {
        return { ok: false, status: null, code: "CANCELLED", error: "Sync request cancelled." };
      }
      if (error instanceof Error && (error.name === "AbortError" || error.message === "timeout")) {
        return {
          ok: false,
          status: null,
          code: "TIMEOUT",
          error: `The sync server did not answer within ${Math.round(this.timeoutMs / 1000)} seconds.`,
        };
      }
      return {
        ok: false,
        status: null,
        code: "NETWORK",
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener("abort", forwardAbort);
    }
  }
}
