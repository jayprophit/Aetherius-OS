import { describe, it } from "node:test";
import assert from "node:assert";
import { BackupService } from "../src/domain.ts";

describe("BackupService", () => {
  it("creates and lists snapshots", () => {
    const backup = new BackupService();
    const snapshot = backup.createSnapshot("daily", "/backup/daily", 1024);
    assert.equal(backup.listSnapshots().length, 1);
    assert.equal(snapshot.label, "daily");
  });
});
