import { describe, it } from "node:test";
import assert from "node:assert";
import { MeetService } from "../src/domain.ts";

describe("MeetService", () => {
  it("starts and ends meetings", () => {
    const meet = new MeetService();
    const meeting = meet.start("Team Sync", ["alice", "bob"]);
    assert.equal(meeting.participants.length, 2);
    meet.end(meeting.id);
    assert.ok(meeting.endedAt !== undefined);
  });

  it("throws on missing meeting", () => {
    const meet = new MeetService();
    assert.throws(() => meet.end("nonexistent"), /meeting not found/);
  });
});
