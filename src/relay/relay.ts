import { createHash } from "node:crypto";
import { RelayError, repoAllowed, tokenCoversRepos, validateRelayPolicy } from "./policy";
import type { CacheEntry, RelayPolicy } from "./policy";

export type FetchUpstream = (url: string) => Promise<Uint8Array>;

export interface RelayResult {
  bytes: Uint8Array;
  sha256: string;
  cached: boolean;
  upstream: string;
  tokenId: string;
  identityId: string;
}

interface QuotaState {
  windowStart: number;
  requests: number;
  bytes: number;
}

function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Authorized scoped relay-cache. Read-only: serves owner-allowlisted
 * repos through scoped tokens, from a shared content-addressed cache,
 * under per-identity budgets. Quotas never transfer between identities —
 * exhaustion denies instead of rerouting (anti-evasion by construction).
 */
export class RelayCache {
  private readonly policy: RelayPolicy;
  private readonly fetchUpstream: FetchUpstream;
  private readonly nowMs: () => number;
  private readonly cache = new Map<string, CacheEntry>();
  private readonly quotas = new Map<string, QuotaState>();

  constructor(policy: RelayPolicy, fetchUpstream: FetchUpstream, nowMs: () => number = Date.now) {
    const problems = validateRelayPolicy(policy);
    if (problems.length > 0) throw new RelayError("REPO_NOT_ALLOWED", `invalid relay policy: ${problems.join("; ")}`);
    this.policy = policy;
    this.fetchUpstream = fetchUpstream;
    this.nowMs = nowMs;
  }

  cachedEntries(): number {
    return this.cache.size;
  }

  async read(options: {
    repo: string;
    path: string;
    tokenId: string;
    identityId: string;
    upstream: string;
  }): Promise<RelayResult> {
    const { repo, path, tokenId, identityId, upstream } = options;
    if (!repoAllowed(this.policy.allowedRepos, repo)) {
      throw new RelayError("REPO_NOT_ALLOWED", `repo ${repo} is not owner-allowlisted`);
    }
    const token = this.policy.tokens.find((t) => t.tokenId === tokenId);
    if (!token) throw new RelayError("TOKEN_UNKNOWN", `unknown token ${tokenId}`);
    if (Date.parse(token.expiresAt) <= this.nowMs()) {
      throw new RelayError("TOKEN_EXPIRED", `token ${tokenId} expired`);
    }
    if (!tokenCoversRepos(token, [repo])) {
      throw new RelayError("TOKEN_SCOPE", `token ${tokenId} does not cover ${repo}`);
    }
    if (!path || path.includes("..")) {
      throw new RelayError("REPO_NOT_ALLOWED", `unsafe path ${path}`);
    }
    const quota = this.policy.quotas.find((q) => q.identityId === identityId);
    if (!quota) throw new RelayError("QUOTA_EXHAUSTED", `no quota for identity ${identityId}`);
    const key = `${repo}:${path}`;
    const fresh = this.cache.get(key);
    if (fresh && this.nowMs() - fresh.fetchedAt <= this.policy.cacheTtlMs) {
      this.spend(quota, identityId, 0);
      return {
        bytes: fresh.bytes, sha256: fresh.sha256, cached: true,
        upstream: fresh.upstream, tokenId: fresh.tokenId, identityId,
      };
    }
    let bytes: Uint8Array;
    try {
      bytes = await this.fetchUpstream(upstream);
    } catch (err) {
      throw new RelayError("UPSTREAM_FAILED", `upstream failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    this.spend(quota, identityId, bytes.byteLength);
    const entry: CacheEntry = {
      sha256: sha256Hex(bytes), bytes, upstream,
      fetchedAt: this.nowMs(), tokenId,
    };
    this.cache.set(key, entry);
    while (this.cache.size > this.policy.cacheMaxEntries) {
      const oldest = this.cache.keys().next().value;
      if (oldest === undefined) break;
      this.cache.delete(oldest);
    }
    return { bytes, sha256: entry.sha256, cached: false, upstream, tokenId, identityId };
  }

  private spend(quota: { maxRequests: number; maxBytes: number; windowMs: number }, identityId: string, bytes: number): void {
    const now = this.nowMs();
    let state = this.quotas.get(identityId);
    if (!state || now - state.windowStart >= quota.windowMs) {
      state = { windowStart: now, requests: 0, bytes: 0 };
    }
    // Cache hits still count as requests (shared-cache accountability)
    // but not bytes; upstream fetches count both. Exhaustion denies —
    // the relay never borrows another identity's budget.
    if (state.requests + 1 > quota.maxRequests) {
      throw new RelayError("QUOTA_EXHAUSTED", `identity ${identityId} exceeded ${quota.maxRequests} requests`);
    }
    if (state.bytes + bytes > quota.maxBytes) {
      throw new RelayError("QUOTA_EXHAUSTED", `identity ${identityId} exceeded ${quota.maxBytes} bytes`);
    }
    state.requests += 1;
    state.bytes += bytes;
    this.quotas.set(identityId, state);
  }
}
