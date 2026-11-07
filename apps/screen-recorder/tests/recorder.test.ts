import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ScreenRecorder } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("ScreenRecorder", () => {
  it("starts, pauses, resumes and stops sessions", () => {
    const recorder = new ScreenRecorder({ clock: CLOCK });
    const session = recorder.start({ scope: "region", format: "webm", title: "Demo" });
    assert.equal(session.state, "recording");
    recorder.addFrames(session.id, 120);
    assert.equal(recorder.get(session.id)?.framesCaptured, 120);
    recorder.pause(session.id);
    assert.throws(() => recorder.addFrames(session.id, 10), /frames can only be captured while recording/);
    recorder.resume(session.id);
    recorder.addFrames(session.id, 30);
    const stopped = recorder.stop(session.id);
    assert.equal(stopped.state, "stopped");
    assert.equal(stopped.framesCaptured, 150);
    assert.equal(stopped.stoppedAt, "2026-11-07T12:00:00.000Z");
    assert.throws(() => recorder.stop(session.id), /already stopped/);
  });

  it("rejects concurrent sessions and validates input", () => {
    const recorder = new ScreenRecorder({ clock: CLOCK });
    recorder.start({ scope: "screen", format: "mp4" });
    assert.throws(() => recorder.start({ scope: "window", format: "gif" }), /already in progress/);
    assert.throws(() => recorder.start({ scope: "webcam" as never, format: "mp4" }), /scope must be/);
    assert.throws(() => recorder.addFrames("missing", 10), /no session/);
  });
});
