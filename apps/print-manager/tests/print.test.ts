import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { PrintManager } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("PrintManager", () => {
  it("submits, starts and finishes jobs", () => {
    const print = new PrintManager({ clock: CLOCK });
    const printer = print.addPrinter({ name: "Office Laser", duplex: true });
    const job = print.submit(printer.id, { title: "Report", pages: 12, copies: 2 });
    assert.equal(job.status, "queued");
    print.start(job.id);
    assert.equal(print.jobsFor(printer.id)[0].status, "printing");
    const finished = print.finish(job.id, true);
    assert.equal(finished.status, "completed");
    assert.equal(finished.finishedAt, "2026-11-07T12:00:00.000Z");
  });

  it("pauses, resumes and cancels jobs", () => {
    const print = new PrintManager({ clock: CLOCK });
    const printer = print.addPrinter({ name: "Desk" });
    const job = print.submit(printer.id, { title: "Flyer", pages: 1 });
    print.start(job.id);
    print.pause(job.id);
    assert.equal(print.jobsFor(printer.id)[0].status, "paused");
    print.start(job.id);
    assert.equal(print.jobsFor(printer.id)[0].status, "printing");
    const cancelled = print.cancel(job.id);
    assert.equal(cancelled.status, "cancelled");
    assert.throws(() => print.cancel(job.id), /already cancelled/);
  });

  it("refuses jobs on offline printers and validates input", () => {
    const print = new PrintManager({ clock: CLOCK });
    const printer = print.addPrinter({ name: "Offline" });
    print.setPrinterOnline(printer.id, false);
    assert.throws(() => print.submit(printer.id, { title: "x", pages: 1 }), /printer is offline/);
    print.setPrinterOnline(printer.id, true);
    assert.throws(() => print.submit(printer.id, { title: "", pages: 1 }), /needs a title/);
    assert.throws(() => print.submit(printer.id, { title: "x", pages: 0 }), /pages must be/);
    assert.throws(() => print.finish("missing", true), /no job/);
  });
});
