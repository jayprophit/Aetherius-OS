import { describe, it } from "node:test";
import assert from "node:assert";
import {
  buildAdapterRegistry,
  REMOTE_CARDS,
  GROQ_CARDS,
  GEMINI_CARDS,
} from "../src/providers.ts";

describe("cloud provider wiring", () => {
  it("registers the local fallback plus Groq and Gemini", () => {
    const registry = buildAdapterRegistry({ credentials: async () => undefined });
    const ids = registry
      .list()
      .map((a) => `${a.providerId}/${a.runtimeId}`)
      .sort();
    assert.deepEqual(ids, ["gemini/gemini", "groq/groq", "local/ollama"]);
  });

  it("keeps remote adapters non-local (privacy boundary)", () => {
    const registry = buildAdapterRegistry({ credentials: async () => undefined });
    for (const adapter of registry.list()) {
      if (adapter.providerId === "groq" || adapter.providerId === "gemini") {
        assert.equal(adapter.local, false);
      }
    }
  });

  it("declares free-tier remote cards for both providers", () => {
    assert.ok(REMOTE_CARDS.some((c) => c.providerId === "groq"));
    assert.ok(REMOTE_CARDS.some((c) => c.providerId === "gemini"));
    assert.ok(GROQ_CARDS.length > 0 && GEMINI_CARDS.length > 0);
  });

  it("exposes no credential in any model card", () => {
    for (const card of REMOTE_CARDS) {
      const serialized = JSON.stringify(card);
      assert.ok(!/key|token|secret|Bearer/i.test(serialized));
    }
  });
});
