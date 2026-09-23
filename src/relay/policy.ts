/**
 * REQ-p30-repo-relay contracts (P30): authorized scoped repository
 * relay-cache. Reference: OctoPool relay/budget (v0.7.1, MIT, STUDY_ONLY).
 *
 * Self-hosted READ relay with shared cache, budget-aware identity routing
 * and scoped tokens. Owner-authorized only. Explicitly NOT a
 * rate-limit/ToS evasion tool — the design refuses the evasion patterns:
 * quotas never transfer between identities, exhausted budgets deny (never
 * reroute to dodge), and only owner-allowlisted repos are servable.
 *
 * No network lives here: upstream bytes arrive through an injected
 * fetcher (fixtures in tests, a governed HTTP client at runtime).
 */

export interface RelayToken {
  tokenId: string;
  /** Allowed repos: exact `owner/name` or `owner/*` prefix. Bare `*` forbidden. */
  repos: readonly string[];
  expiresAt: string;
}

export interface IdentityQuota {
  identityId: string;
  maxRequests: number;
  maxBytes: number;
  windowMs: number;
}

export interface RelayPolicy {
  /** Owner-allowlisted servable repos (exact or `owner/*`). */
  allowedRepos: readonly string[];
  tokens: readonly RelayToken[];
  quotas: readonly IdentityQuota[];
  /** Cache TTL ms and entry cap. */
  cacheTtlMs: number;
  cacheMaxEntries: number;
}

export interface CacheEntry {
  sha256: string;
  bytes: Uint8Array;
  upstream: string;
  fetchedAt: number;
  tokenId: string;
}

export type RelayErrorCode =
  | "REPO_NOT_ALLOWED"
  | "TOKEN_UNKNOWN"
  | "TOKEN_EXPIRED"
  | "TOKEN_SCOPE"
  | "QUOTA_EXHAUSTED"
  | "UPSTREAM_FAILED";

export class RelayError extends Error {
  readonly code: RelayErrorCode;
  constructor(code: RelayErrorCode, message: string) {
    super(message);
    this.name = "RelayError";
    this.code = code;
  }
}

export function repoAllowed(patterns: readonly string[], repo: string): boolean {
  for (const pattern of patterns) {
    if (pattern === "*") continue; // bare wildcard never authorizes
    if (pattern.endsWith("/*")) {
      const owner = pattern.slice(0, -2);
      if (repo.startsWith(`${owner}/`) && repo.indexOf("/", owner.length + 1) === -1) return true;
    } else if (repo === pattern) {
      return true;
    }
  }
  return false;
}

export function tokenCoversRepos(token: RelayToken, repos: readonly string[]): boolean {
  for (const repo of repos) {
    if (!repoAllowed(token.repos, repo)) return false;
  }
  return true;
}

export function validateRelayPolicy(policy: RelayPolicy): string[] {
  const problems: string[] = [];
  if (policy.allowedRepos.length === 0) problems.push("relay serves nothing without owner-allowlisted repos");
  for (const pattern of policy.allowedRepos) {
    if (pattern === "*" || !pattern.includes("/")) {
      problems.push(`invalid allowlist pattern ${pattern} (owner/name or owner/* required)`);
    }
  }
  for (const token of policy.tokens) {
    if (!token.tokenId.trim()) problems.push("token without id");
    if (token.repos.includes("*" as never)) problems.push(`token ${token.tokenId}: bare * repos forbidden`);
    if (Number.isNaN(Date.parse(token.expiresAt))) problems.push(`token ${token.tokenId}: bad expiresAt`);
  }
  for (const quota of policy.quotas) {
    if (!quota.identityId.trim()) problems.push("quota without identity");
    if (!(quota.maxRequests >= 1) || !(quota.maxBytes >= 1) || !(quota.windowMs >= 1)) {
      problems.push(`quota ${quota.identityId}: positive maxRequests/maxBytes/windowMs required`);
    }
  }
  if (!(policy.cacheTtlMs >= 1) || !Number.isInteger(policy.cacheMaxEntries) || policy.cacheMaxEntries < 1) {
    problems.push("positive cacheTtlMs and cacheMaxEntries required");
  }
  return [...problems].sort();
}
