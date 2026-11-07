import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { SecurityCenter } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("SecurityCenter", () => {
  it("controls firewall rules and resolves them per app", () => {
    const center = new SecurityCenter({ clock: CLOCK });
    const rule = center.addRule("browser", "outbound", 443, true);
    assert.equal(center.isAllowed("browser", "outbound", 443), true);
    assert.equal(center.isAllowed("browser", "outbound", 80), false);
    center.setRuleAllowed(rule.id, false);
    assert.equal(center.isAllowed("browser", "outbound", 443), false);
    assert.throws(() => center.addRule("browser", "sideways" as never, 80, true), /direction must be/);
    assert.throws(() => center.addRule("browser", "inbound", 0, true), /port must be/);
    assert.throws(() => center.setRuleAllowed("missing", true), /no rule/);
  });

  it("tracks per-application permissions", () => {
    const center = new SecurityCenter({ clock: CLOCK });
    center.setPermission("notes", "filesystem.read", true);
    center.setPermission("notes", "network.access", false);
    assert.equal(center.permissionFor("notes", "filesystem.read")?.granted, true);
    assert.equal(center.permissionFor("notes", "network.access")?.granted, false);
    assert.equal(center.permissionFor("notes", "camera.capture"), null);
    center.setPermission("notes", "network.access", true);
    assert.equal(center.permissionFor("notes", "network.access")?.granted, true);
  });

  it("keeps a verifiable hash-chained audit log", () => {
    const center = new SecurityCenter({ clock: CLOCK });
    center.record("test.action", "tester", "first");
    center.record("test.action", "tester", "second");
    assert.equal(center.auditEntries().length, 2);
    assert.equal(center.verifyAudit(), true);
  });

  it("quarantines and releases items", () => {
    const center = new SecurityCenter({ clock: CLOCK });
    const item = center.quarantine("evil.exe", "unsigned binary");
    assert.equal(center.pendingQuarantine().length, 1);
    const released = center.release(item.id);
    assert.equal(released.releasedAt, "2026-11-07T12:00:00.000Z");
    assert.equal(center.pendingQuarantine().length, 0);
    assert.throws(() => center.release(item.id), /already released/);
    assert.throws(() => center.quarantine("", "no name"), /must be a non-empty string/);
  });

  it("reports a posture score from real state", () => {
    const center = new SecurityCenter({ clock: CLOCK });
    const empty = center.posture();
    assert.equal(empty.score, 65);
    assert.equal(empty.quarantinePending, 0);

    center.addRule("browser", "outbound", 443, false);
    center.setPermission("notes", "network.access", false);
    center.record("test.action", "tester", "audit");
    const next = center.posture();
    assert.equal(next.score, 100);
    assert.equal(next.firewallRules, 1);
    assert.equal(next.permissionsDenied, 1);
  });
});
