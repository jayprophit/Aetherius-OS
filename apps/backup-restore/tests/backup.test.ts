import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { BackupRestore } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

function manifest(version: string) {
  return [
    { path: "notes.json", size: 100, sha256: `a${version}` },
    { path: "photos.jpg", size: 200, sha256: `b${version}` },
  ];
}

describe("BackupRestore", () => {
  it("creates snapshots with a content checksum", () => {
    const backup = new BackupRestore({ clock: CLOCK });
    const snapshot = backup.create({ label: "before update", manifest: manifest("1") });
    assert.equal(snapshot.fileCount, 2);
    assert.equal(snapshot.totalBytes, 300);
    assert.match(snapshot.checksum, /^[0-9a-f]{64}$/);
    const other = backup.create({ label: "after update", manifest: manifest("2") });
    assert.notEqual(other.checksum, snapshot.checksum);
  });

  it("verifies checksums and refuses unverified restores", () => {
    const backup = new BackupRestore({ clock: CLOCK });
    const snapshot = backup.create({ label: "check me", manifest: manifest("1") });
    assert.throws(() => backup.restore(snapshot.id), /verified before it can be restored/);
    assert.equal(backup.verify(snapshot.id, manifest("1")), true);
    const tampered = [
      { path: "notes.json", size: 101, sha256: "a1" },
      { path: "photos.jpg", size: 200, sha256: "b1" },
    ];
    assert.throws(() => backup.verify(snapshot.id, tampered), /checksum mismatch/);
    backup.verify(snapshot.id, manifest("1"));
    const restored = backup.restore(snapshot.id);
    assert.equal(restored.restoredAt, "2026-11-07T12:00:00.000Z");
  });

  it("applies retention per kind", () => {
    const backup = new BackupRestore({ clock: CLOCK });
    backup.create({ kind: "scheduled", label: "s1", manifest: [] });
    backup.create({ kind: "scheduled", label: "s2", manifest: [] });
    backup.create({ kind: "scheduled", label: "s3", manifest: [] });
    backup.create({ kind: "manual", label: "m1", manifest: [] });
    const pruned = backup.applyRetention({ keepManual: 5, keepScheduled: 1, keepPreUpdate: 5 });
    assert.equal(pruned.length, 2);
    assert.equal(backup.list("scheduled").length, 1);
    assert.equal(backup.list("manual").length, 1);
    assert.throws(
      () => backup.applyRetention({ keepManual: -1, keepScheduled: 1, keepPreUpdate: 1 }),
      /non-negative integer/,
    );
  });
});
