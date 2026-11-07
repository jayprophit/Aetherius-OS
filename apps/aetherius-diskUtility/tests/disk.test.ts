import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { DiskUtility } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("DiskUtility", () => {
  it("adds volumes and accounts for capacity", () => {
    const disk = new DiskUtility({ clock: CLOCK });
    const volume = disk.addVolume({ name: "System", path: "/dev/sda1", kind: "internal", totalBytes: 100_000, usedBytes: 60_000 });
    assert.equal(disk.freeBytes(volume.id), 40_000);
    disk.updateUsage(volume.id, 70_000);
    assert.equal(disk.freeBytes(volume.id), 30_000);
    assert.throws(() => disk.updateUsage(volume.id, 100_001), /between 0 and totalBytes/);
    assert.equal(disk.listVolumes("internal").length, 1);
  });

  it("enforces encryption state changes", () => {
    const disk = new DiskUtility({ clock: CLOCK });
    const volume = disk.addVolume({ name: "Data", path: "/dev/sdb1", kind: "external", totalBytes: 500_000, encrypted: "encrypted" });
    assert.equal(volume.encrypted, "encrypted");
    disk.setEncryption(volume.id, "locked");
    assert.equal(disk.listVolumes()[0].encrypted, "locked");
    assert.throws(() => disk.setEncryption(volume.id, "shredded" as never), /state must be/);
  });

  it("queues repairs and restores health", () => {
    const disk = new DiskUtility({ clock: CLOCK });
    const volume = disk.addVolume({ name: "Data", path: "/dev/sdb1", kind: "external", totalBytes: 500_000 });
    disk.markUnhealthy(volume.id);
    const job = disk.queueRepair(volume.id);
    assert.equal(disk.repairJobs(volume.id).length, 1);
    disk.runRepair(job.id, true);
    assert.equal(disk.listVolumes()[0].healthy, true);
    assert.throws(() => disk.runRepair(job.id, true), /repair job is completed/);
  });

  it("records benchmarks per volume", () => {
    const disk = new DiskUtility({ clock: CLOCK });
    const volume = disk.addVolume({ name: "Fast", path: "/dev/nvme0n1", kind: "internal", totalBytes: 1_000_000 });
    const bench = disk.recordBenchmark(volume.id, 3500, 3000);
    assert.equal(bench.readMbPerSec, 3500);
    assert.equal(disk.benchmarksFor(volume.id).length, 1);
    assert.throws(() => disk.recordBenchmark(volume.id, 0, 10), /must be positive/);
  });
});
