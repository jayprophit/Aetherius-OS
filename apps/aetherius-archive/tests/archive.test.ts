import { describe, it } from "node:test";
import assert from "node:assert";
import { ArchiveManager } from "../src/domain.ts";

describe("ArchiveManager", () => {
  it("adds and lists archive entries", () => {
    const archive = new ArchiveManager();
    const entry = archive.add({ name: "backup.zip", sizeBytes: 1024, compressed: true });
    assert.equal(archive.list().length, 1);
    assert.equal(entry.compressed, true);
  });

  it("removes entries", () => {
    const archive = new ArchiveManager();
    const entry = archive.add({ name: "backup.zip", sizeBytes: 1024, compressed: true });
    archive.remove(entry.id);
    assert.equal(archive.list().length, 0);
  });

  it("throws on missing entry", () => {
    const archive = new ArchiveManager();
    assert.throws(() => archive.remove("nonexistent"), /archive entry not found/);
  });
});
