import { describe, expect, it } from "vitest";
import { validateRelayPolicy } from "./policy";
import { RelayCache } from "./relay";
import { RelayError } from "./policy";
import type { RelayPolicy } from "./policy";

const enc = (s: string): Uint8Array => new TextEncoder().encode(s);

function policy(over: Partial<RelayPolicy> = {}): RelayPolicy {
  return {
    allowedRepos: ["acme/*"],
    tokens: [{ tokenId: "t1", repos: ["acme/app"], expiresAt: "2030-01-01T00:00:00.000Z" }],
    quotas: [{ identityId: "agent-1", maxRequests: 3, maxBytes: 100, windowMs: 60_000 }],
    cacheTtlMs: 60_000,
    cacheMaxEntries: 10,
    ...over,
  };
}

function relay(p: RelayPolicy, upstream: Record<string, string> = {}, now = Date.parse("2026-09-23T00:00:00.000Z")): RelayCache {
  return new RelayCache(
    p,
    async (url) => {
      if (!(url in upstream)) throw new Error(`no fixture for ${url}`);
      return enc(upstream[url]!);
    },
    () => now,
  );
}

describe("relay policy", () => {
  it("accepts a tight policy and rejects open ones", () => {
    expect(validateRelayPolicy(policy())).toEqual([]);
    expect(validateRelayPolicy(policy({ allowedRepos: ["*"] }))).toEqual(
      expect.arrayContaining([expect.stringContaining("allowlist pattern")]),
    );
    expect(
      validateRelayPolicy(policy({ tokens: [{ tokenId: "t", repos: ["*"], expiresAt: "2030-01-01T00:00:00.000Z" }] })),
    ).toEqual(expect.arrayContaining([expect.stringContaining("bare * repos forbidden")]));
    expect(validateRelayPolicy(policy({ allowedRepos: [] }))).toEqual(
      expect.arrayContaining([expect.stringContaining("serves nothing")]),
    );
    const cache = relay(policy());
    expect(cache.cachedEntries()).toBe(0);
  });
});

describe("relay cache", () => {
  const read = { repo: "acme/app", path: "README.md", tokenId: "t1", identityId: "agent-1", upstream: "https://u/f" };

  it("fetches, caches and serves with provenance", async () => {
    const r = relay(policy(), { "https://u/f": "hello" });
    const first = await r.read(read);
    expect(first.cached).toBe(false);
    expect(new TextDecoder().decode(first.bytes)).toBe("hello");
    expect(first.sha256).toHaveLength(64);
    expect(first.upstream).toBe("https://u/f");
    const second = await r.read(read);
    expect(second.cached).toBe(true);
    expect(second.sha256).toBe(first.sha256);
    expect(r.cachedEntries()).toBe(1);
  });

  it("denies non-allowlisted repos, unknown/expired/mis-scoped tokens", async () => {
    const r = relay(policy(), { "https://u/f": "x" });
    await expect(r.read({ ...read, repo: "evil/app" })).rejects.toThrowError(/not owner-allowlisted/);
    await expect(r.read({ ...read, tokenId: "nope" })).rejects.toThrowError(/unknown token/);
    const expired = relay(policy({ tokens: [{ tokenId: "t1", repos: ["acme/app"], expiresAt: "2020-01-01T00:00:00.000Z" }] }));
    await expect(expired.read(read)).rejects.toThrowError(/expired/);
    const scoped = relay(policy({ tokens: [{ tokenId: "t1", repos: ["acme/other"], expiresAt: "2030-01-01T00:00:00.000Z" }] }));
    await expect(scoped.read(read)).rejects.toThrowError(/does not cover/);
    await expect(r.read({ ...read, path: "../escape" })).rejects.toThrowError(/unsafe path/);
  });

  it("enforces budgets without borrowing between identities", async () => {
    const r = relay(policy(), { "https://u/f": "0123456789" }); // 10 bytes
    // 3 requests allowed; 4th denied even though another identity is idle.
    await r.read(read);
    await r.read({ ...read, path: "b" });
    await r.read({ ...read, path: "c" });
    await expect(r.read({ ...read, path: "d" })).rejects.toThrowError(/exceeded 3 requests/);
    const bytes = relay(
      policy({ quotas: [{ identityId: "agent-1", maxRequests: 100, maxBytes: 10, windowMs: 60_000 }] }),
      { "https://u/f": "0123456789", "https://u/g": "0123456789" },
    );
    await bytes.read(read);
    await expect(bytes.read({ ...read, upstream: "https://u/g", path: "g" })).rejects.toThrowError(/exceeded 10 bytes/);
    // Unknown identity has no quota to spend.
    await expect(r.read({ ...read, identityId: "ghost" })).rejects.toThrowError(/no quota/);
  });

  it("surfaces upstream failures honestly", async () => {
    const r = relay(policy());
    await expect(r.read(read)).rejects.toThrowError(/upstream failed/);
  });

  it("evicts oldest entries past the cap", async () => {
    const r = relay(policy({ cacheMaxEntries: 1 }), { "https://u/f": "a", "https://u/g": "b" });
    await r.read(read);
    await r.read({ ...read, path: "g", upstream: "https://u/g" });
    expect(r.cachedEntries()).toBe(1);
    // First entry evicted: fetching it again is a miss.
    const again = await r.read(read);
    expect(again.cached).toBe(false);
  });
});
