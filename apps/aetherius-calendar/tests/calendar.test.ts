import { describe, it } from "node:test";
import assert from "node:assert";
import { CalendarService } from "../src/domain.ts";

describe("CalendarService", () => {
  it("creates and retrieves events", () => {
    const calendar = new CalendarService();
    const event = calendar.create("Meeting", "2026-10-30T10:00:00Z", "2026-10-30T11:00:00Z", "Room 1");
    assert.equal(calendar.get(event.id)?.title, "Meeting");
    assert.equal(event.location, "Room 1");
  });

  it("lists events in range", () => {
    const calendar = new CalendarService();
    calendar.create("A", "2026-10-30T09:00:00Z", "2026-10-30T10:00:00Z");
    calendar.create("B", "2026-10-30T12:00:00Z", "2026-10-30T13:00:00Z");
    calendar.create("C", "2026-10-31T09:00:00Z", "2026-10-31T10:00:00Z");
    const range = calendar.listRange("2026-10-30T00:00:00Z", "2026-10-30T23:59:59Z");
    assert.equal(range.length, 2);
  });
});
