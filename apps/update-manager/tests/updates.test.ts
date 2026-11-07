import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { UpdateManager } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("UpdateManager", () => {
  it("plans a full update to the latest release on the channel", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    const base = updates.addRelease({ version: "v1.0.0", semver: "1.0.0", channel: "stable", sizeBytes: 1000, signed: true });
    updates.install(base.id);
    updates.addRelease({ version: "v1.1.0", semver: "1.1.0", channel: "stable", sizeBytes: 1200, signed: true });

    const plan = updates.plan("stable");
    assert.equal(plan?.toSemver, "1.1.0");
    assert.equal(plan?.kind, "full");
    assert.equal(plan?.downloadBytes, 1200);
  });

  it("prefers a delta when one exists from the installed version", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    const base = updates.addRelease({ version: "v1.0.0", semver: "1.0.0", channel: "stable", sizeBytes: 1000, signed: true });
    updates.install(base.id);
    updates.addRelease({ version: "v1.1.0", semver: "1.1.0", channel: "stable", sizeBytes: 1200, deltaFrom: "1.0.0", signed: true });

    const plan = updates.plan("stable");
    assert.equal(plan?.kind, "delta");
    assert.equal(plan?.downloadBytes, 360);
  });

  it("refuses unsigned stable and beta releases", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    const unsigned = updates.addRelease({ version: "v2.0.0", semver: "2.0.0", channel: "stable", sizeBytes: 500, signed: false });
    assert.throws(() => updates.install(unsigned.id), /unsigned stable/);
    assert.equal(updates.plan("stable"), null);

    const dev = updates.addRelease({ version: "v2.1.0-dev", semver: "2.1.0", channel: "dev", sizeBytes: 500, signed: false });
    assert.equal(updates.install(dev.id).channel, "dev");
  });

  it("returns no plan when the installed version is current", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    const only = updates.addRelease({ version: "v1.0.0", semver: "1.0.0", channel: "beta", sizeBytes: 800, signed: true });
    updates.install(only.id);
    assert.equal(updates.plan("beta"), null);
  });

  it("rolls back to the previously installed version", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    const first = updates.addRelease({ version: "v1.0.0", semver: "1.0.0", channel: "stable", sizeBytes: 1000, signed: true });
    const second = updates.addRelease({ version: "v1.1.0", semver: "1.1.0", channel: "stable", sizeBytes: 1100, signed: true });
    updates.install(first.id);
    updates.install(second.id);
    const rolled = updates.rollback();
    assert.equal(rolled.semver, "1.0.0");
    assert.equal(updates.current()?.semver, "1.0.0");

    const fresh = new UpdateManager({ clock: CLOCK });
    assert.throws(() => fresh.rollback(), /no previous version/);
  });

  it("validates release metadata", () => {
    const updates = new UpdateManager({ clock: CLOCK });
    assert.throws(
      () => updates.addRelease({ version: "x", semver: "not-a-version", channel: "stable", sizeBytes: 10, signed: true }),
      /semantic version/,
    );
    assert.throws(
      () => updates.addRelease({ version: "x", semver: "1.0.0", channel: "nightly" as never, sizeBytes: 10, signed: true }),
      /channel must be one of/,
    );
    assert.throws(
      () => updates.addRelease({ version: "x", semver: "1.0.0", channel: "stable", sizeBytes: -1, signed: true }),
      /positive integer/,
    );
    assert.throws(() => updates.install("missing"), /no release/);
  });
});
