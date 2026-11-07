import { describe, it } from "node:test";
import assert from "node:assert";
import { FREE_SERVICES, byoServices, servicesByCategory } from "../src/services.ts";

describe("free/freemium service catalog", () => {
  it("lists services across storage, ai, compute, ops, identity and communication", () => {
    const categories = new Set(FREE_SERVICES.map((s) => s.category));
    for (const expected of ["storage", "ai", "compute", "ops", "identity", "communication"]) {
      assert.ok(categories.has(expected as never), `missing category ${expected}`);
    }
  });

  it("carries no credential value — only stable references", () => {
    for (const service of FREE_SERVICES) {
      const serialized = JSON.stringify(service);
      assert.ok(!/AIza|gsk_|hf_|vck_|oc_sk_|sk-or-|AQ\./.test(serialized), service.id);
      if (service.credentialRef) {
        assert.match(service.credentialRef, /^keepass:/);
      }
    }
  });

  it("marks bring-your-own services so users keep control of their data", () => {
    const byo = byoServices();
    assert.ok(byo.length > 0);
    assert.ok(byo.every((s) => s.byo === true));
  });

  it("includes user-controlled personal storage", () => {
    const storage = servicesByCategory("storage").map((s) => s.id);
    for (const expected of ["google-drive", "onedrive", "dropbox", "terrabox"]) {
      assert.ok(storage.includes(expected), `missing storage ${expected}`);
    }
  });
});
