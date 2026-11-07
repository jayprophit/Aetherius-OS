import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Reminders } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("Reminders", () => {
  it("creates, lists and completes reminders", () => {
    const reminders = new Reminders({ clock: CLOCK });
    const milk = reminders.create({ title: "Buy milk", dueAt: "2026-11-08T09:00:00.000Z", priority: "high" });
    reminders.create({ title: "Call mum", list: "Family", subtasks: ["Pick a time"] });
    assert.equal(reminders.list().length, 2);
    assert.deepEqual(reminders.lists(), ["Family", "Inbox"]);
    assert.equal(reminders.overdue(new Date("2026-11-07T12:00:00.000Z")).length, 0);
    assert.equal(reminders.dueSoon(24, new Date("2026-11-07T12:00:00.000Z"))[0].id, milk.id);

    reminders.complete(milk.id);
    assert.equal(reminders.list().length, 1);
    assert.equal(reminders.get(milk.id)?.completedAt, "2026-11-07T12:00:00.000Z");
    assert.throws(() => reminders.complete(milk.id), /already completed/);
    assert.throws(() => reminders.update(milk.id, { title: "changed" }), /completed reminder cannot be edited/);

    reminders.reopen(milk.id);
    assert.equal(reminders.get(milk.id)?.completedAt, null);
  });

  it("validates input instead of storing junk", () => {
    const reminders = new Reminders({ clock: CLOCK });
    assert.throws(() => reminders.create({ title: "" }), /needs a title/);
    assert.throws(() => reminders.create({ title: "x", priority: "urgent" as never }), /priority must be one of/);
    assert.throws(() => reminders.create({ title: "x", dueAt: "not a date" }), /dueAt must be an ISO date/);
    assert.throws(
      () => reminders.create({ title: "x", location: { placeName: "", radiusMeters: 100 } }),
      /needs a place name/,
    );
    assert.throws(
      () => reminders.create({ title: "x", location: { placeName: "Shop", radiusMeters: 0 } }),
      /radius between 1 and 50000/,
    );
    assert.equal(reminders.get("missing"), undefined);
  });

  it("reports overdue reminders deterministically", () => {
    const reminders = new Reminders({ clock: CLOCK });
    reminders.create({ title: "Late", dueAt: "2026-11-06T09:00:00.000Z" });
    reminders.create({ title: "Later still", dueAt: "2026-11-07T11:00:00.000Z" });
    reminders.create({ title: "Not yet", dueAt: "2026-11-08T09:00:00.000Z" });
    const overdue = reminders.overdue(new Date("2026-11-07T12:00:00.000Z"));
    assert.deepEqual(overdue.map((item) => item.title), ["Late", "Later still"]);
  });

  it("tracks subtask completion", () => {
    const reminders = new Reminders({ clock: CLOCK });
    const withSubs = reminders.create({ title: "Trip", subtasks: ["Book flights", "Pack"] });
    const added = reminders.addStartingSubtask(withSubs.id, "Insurance");
    assert.equal(reminders.get(withSubs.id)?.subtasks.length, 3);
    const toggled = reminders.toggleSubtask(withSubs.id, added.id);
    assert.equal(toggled.done, true);
    assert.throws(() => reminders.toggleSubtask(withSubs.id, "nope"), /no subtask/);
  });

  it("deletes and reports missing reminders", () => {
    const reminders = new Reminders({ clock: CLOCK });
    const one = reminders.create({ title: "One" });
    assert.equal(reminders.delete(one.id), true);
    assert.throws(() => reminders.delete(one.id), /no reminder/);
    assert.equal(reminders.get("gone"), undefined);
  });
});
