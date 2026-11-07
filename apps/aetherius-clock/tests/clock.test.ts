import { describe, it } from "node:test";
import assert from "node:assert";
import { ClockService } from "../src/domain.ts";

describe("ClockService", () => {
  it("sets and lists alarms", () => {
    const clock = new ClockService();
    const alarm = clock.setAlarm("07:00", "Wake up");
    assert.equal(alarm.active, true);
    assert.equal(clock.listAlarms().length, 1);
  });
});
