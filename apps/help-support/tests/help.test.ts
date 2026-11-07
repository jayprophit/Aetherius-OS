import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { HelpSupport } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("HelpSupport", () => {
  it("searches topics deterministically", () => {
    const help = new HelpSupport({ clock: CLOCK });
    help.addTopic({ title: "Reset your password", body: "Open Settings, then Security, then Password.", keywords: ["account", "login"], category: "Account" });
    help.addTopic({ title: "Sync your notes", body: "Notes sync when a token is set in Cloud and Sync settings.", keywords: ["notes", "cloud"], category: "Sync" });
    assert.deepEqual(help.search("password").map((t) => t.title), ["Reset your password"]);
    assert.deepEqual(help.search("sync notes").map((t) => t.title), ["Sync your notes"]);
    assert.deepEqual(help.search("nothing matches"), []);
    assert.equal(help.topicsList().length, 2);
  });

  it("runs a ticket from open to closed", () => {
    const help = new HelpSupport({ clock: CLOCK });
    const ticket = help.openTicket("Sync fails", "high", "The panel says offline.");
    assert.equal(ticket.status, "open");
    help.reply(ticket.id, "We are looking.");
    assert.equal(help.ticketsList()[0].status, "in-progress");
    help.resolve(ticket.id);
    assert.equal(help.ticketsList()[0].status, "resolved");
    help.close(ticket.id);
    assert.equal(help.ticketsList()[0].status, "closed");
    assert.throws(() => help.reply(ticket.id, "too late"), /closed ticket/);
  });

  it("escalates and validates tickets", () => {
    const help = new HelpSupport({ clock: CLOCK });
    const ticket = help.openTicket("Minor glitch", "low", "A colour is off.");
    const escalated = help.escalate(ticket.id);
    assert.equal(escalated.escalated, true);
    assert.equal(escalated.severity, "high");
    assert.throws(() => help.escalate(ticket.id), /already escalated/);
    assert.throws(() => help.openTicket("", "low", "x"), /needs a subject/);
    assert.throws(() => help.openTicket("x", "urgent" as never, "x"), /severity must be one of/);
    assert.throws(() => help.reply("missing", "x"), /no ticket/);
  });
});
