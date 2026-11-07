import { describe, it } from "node:test";
import assert from "node:assert";
import { UpdatesService } from "../src/domain.ts";

describe("UpdatesService", () => {
  it("registers and lists updates", () => {
    const updates = new UpdatesService();
    const manifest = updates.register({ version: "1.0.0", sizeBytes: 1024, releasedAt: "2026-10-30" });
    assert.equal(updates.list().length, 1);
    assert.equal(manifest.version, "1.0.0");
  });
});
