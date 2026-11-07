import { test } from "node:test";
import assert from "node:assert/strict";
import { RecorderApp } from "../src/recorder.ts";

test("recorder adds, lists and filters voice recordings", () => {
  const recorder = new RecorderApp();
  const recording = recorder.add({
    filename: "meeting-1",
    mime: "audio/wav",
    bytes: 5242880, // 5 MB
    durationSeconds: 360, // 6 minutes
    tags: ["meeting", "weekly"],
  });
  assert.strictEqual(recording.durationSeconds, 360);
  assert.strictEqual(recording.bytes, 5242880);

  const list = recorder.list();
  assert.strictEqual(list.length, 1);
  assert.strictEqual(list[0]!.filename, "meeting-1");

  const byTag = recorder.byTag("meeting");
  assert.strictEqual(byTag.length, 1);

  const metrics = recorder.metrics(recording.id);
  assert.strictEqual(typeof metrics?.bandwidthKbps, "number");
  assert.ok(metrics !== undefined);

  assert.strictEqual(recorder.delete(recording.id), true);
});