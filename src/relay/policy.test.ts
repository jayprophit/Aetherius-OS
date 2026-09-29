import { describe, expect, it } from "vitest";
import { RelayError, repoAllowed, tokenCoversRepos, validateRelayPolicy } from "./policy";
import type { RelayPolicy, RelayToken } from "./policy";

// REQ-p30-repo-relay: the scoped relay-cache policy. These are the guards that
// decide whether a repo may be served at all, so they are pinned directly
// rather than left to whatever an integration test happens to exercise.

const token = (over: Partial<RelayToken> = {}): RelayToken => ({
  tokenId: "tok-1",
  repos: ["acme/api"],
  expiresAt: "2030-01-01T00:00:00.000Z",
  ...over,
});

const policy = (over: Partial<RelayPolicy> = {}): RelayPolicy => ({
  allowedRepos: ["acme/*"],
  tokens: [token()],
  quotas: [{ identityId: "id-1", maxRequests: 10, maxBytes: 1024, windowMs: 60_000 }],
  cacheTtlMs: 30_000,
  cacheMaxEntries: 8,
  ...over,
});

describe("relay policy: repo allowlist", () => {
  it("authorizes an exact owner/name match", () => {
    expect(repoAllowed(["acme/api"], "acme/api")).toBe(true);
  });

  it("refuses a different repo under the same owner", () => {
    expect(repoAllowed(["acme/api"], "acme/web")).toBe(false);
  });

  it("authorizes a direct child of an owner/* pattern", () => {
    expect(repoAllowed(["acme/*"], "acme/api")).toBe(true);
  });

  it("refuses a nested path under owner/* - only direct children", () => {
    // The pattern is one level deep on purpose: owner/* must not become a
    // silent whole-organisation grant.
    expect(repoAllowed(["acme/*"], "acme/tools/api")).toBe(false);
  });

  it("refuses a prefix that only looks like a match", () => {
    expect(repoAllowed(["acme/*"], "acmeevil/api")).toBe(false);
    expect(repoAllowed(["acme/api"], "acme/api-v2")).toBe(false);
  });

  it("never authorizes a repo through a bare wildcard", () => {
    expect(repoAllowed(["*"], "anything/at-all")).toBe(false);
  });

  it("is empty-list safe", () => {
    expect(repoAllowed([], "acme/api")).toBe(false);
  });

  it("is not fooled by an empty owner prefix", () => {
    expect(repoAllowed(["/*"], "acme/api")).toBe(false);
  });
});

describe("relay policy: token scope", () => {
  it("covers a single repo it is scoped to", () => {
    expect(tokenCoversRepos(token(), ["acme/api"])).toBe(true);
  });

  it("covers an empty request set vacuously", () => {
    expect(tokenCoversRepos(token(), [])).toBe(true);
  });

  it("refuses the whole set if any one repo is out of scope", () => {
    expect(tokenCoversRepos(token(), ["acme/api", "acme/web"])).toBe(false);
  });

  it("honours an owner/* scope on the token", () => {
    expect(tokenCoversRepos(token({ repos: ["acme/*"] }), ["acme/api", "acme/web"])).toBe(true);
  });

  it("does not let a token with bare * cover everything", () => {
    expect(tokenCoversRepos(token({ repos: ["*"] }), ["acme/api"])).toBe(false);
  });
});

describe("relay policy: validation", () => {
  it("accepts a well-formed policy", () => {
    expect(validateRelayPolicy(policy())).toEqual([]);
  });

  it("refuses a policy that serves nothing", () => {
    expect(validateRelayPolicy(policy({ allowedRepos: [] }))).toContain(
      "relay serves nothing without owner-allowlisted repos",
    );
  });

  it("rejects a bare wildcard in the owner allowlist", () => {
    const problems = validateRelayPolicy(policy({ allowedRepos: ["*"] }));
    expect(problems.some((p) => p.includes("invalid allowlist pattern *"))).toBe(true);
  });

  it("rejects an allowlist entry with no owner", () => {
    const problems = validateRelayPolicy(policy({ allowedRepos: ["api"] }));
    expect(problems.some((p) => p.includes("invalid allowlist pattern api"))).toBe(true);
  });

  it("rejects a token with no id", () => {
    expect(validateRelayPolicy(policy({ tokens: [token({ tokenId: "  " })] }))).toContain(
      "token without id",
    );
  });

  it("rejects a token carrying a bare wildcard scope", () => {
    const problems = validateRelayPolicy(policy({ tokens: [token({ repos: ["*"] })] }));
    expect(problems.some((p) => p.includes("bare * repos forbidden"))).toBe(true);
  });

  it("rejects an unparseable expiry rather than treating it as never-expiring", () => {
    const problems = validateRelayPolicy(policy({ tokens: [token({ expiresAt: "soon" })] }));
    expect(problems.some((p) => p.includes("bad expiresAt"))).toBe(true);
  });

  it("rejects a quota with no identity", () => {
    const problems = validateRelayPolicy(
      policy({ quotas: [{ identityId: "", maxRequests: 1, maxBytes: 1, windowMs: 1 }] }),
    );
    expect(problems).toContain("quota without identity");
  });

  it("rejects non-positive quota limits in every dimension", () => {
    for (const quota of [
      { identityId: "id", maxRequests: 0, maxBytes: 1, windowMs: 1 },
      { identityId: "id", maxRequests: 1, maxBytes: 0, windowMs: 1 },
      { identityId: "id", maxRequests: 1, maxBytes: 1, windowMs: 0 },
    ]) {
      const problems = validateRelayPolicy(policy({ quotas: [quota] }));
      expect(problems.some((p) => p.includes("positive maxRequests/maxBytes/windowMs required"))).toBe(
        true,
      );
    }
  });

  it("rejects a non-positive cache TTL", () => {
    expect(validateRelayPolicy(policy({ cacheTtlMs: 0 }))).toContain(
      "positive cacheTtlMs and cacheMaxEntries required",
    );
  });

  it("rejects a fractional cache entry cap", () => {
    const problems = validateRelayPolicy(policy({ cacheMaxEntries: 2.5 }));
    expect(problems).toContain("positive cacheTtlMs and cacheMaxEntries required");
  });

  it("rejects a zero cache entry cap", () => {
    expect(validateRelayPolicy(policy({ cacheMaxEntries: 0 }))).toContain(
      "positive cacheTtlMs and cacheMaxEntries required",
    );
  });

  it("returns problems sorted and deduplicated by content", () => {
    const problems = validateRelayPolicy(
      policy({ allowedRepos: ["bad", "worse"], tokens: [token({ tokenId: "" })] }),
    );
    expect(problems).toEqual([...problems].sort());
    expect(new Set(problems).size).toBe(problems.length);
  });

  it("collects every problem rather than stopping at the first", () => {
    const problems = validateRelayPolicy(
      policy({ allowedRepos: [], tokens: [token({ expiresAt: "nope" })], cacheTtlMs: 0 }),
    );
    expect(problems.length).toBeGreaterThanOrEqual(3);
  });

  it("does not mutate the policy it validates", () => {
    const p = policy();
    const before = JSON.stringify(p);
    validateRelayPolicy(p);
    expect(JSON.stringify(p)).toBe(before);
  });
});

describe("relay policy: error surface", () => {
  it("carries a machine-readable code and its own name", () => {
    const err = new RelayError("TOKEN_SCOPE", "token does not cover the repo");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("RelayError");
    expect(err.code).toBe("TOKEN_SCOPE");
    expect(err.message).toBe("token does not cover the repo");
  });
});
