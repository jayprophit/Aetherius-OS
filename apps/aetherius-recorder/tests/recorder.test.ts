import { describe, it } from "node:test";
import assert from "node:assert";
import { Recorder } from "../src/domain.ts";
import { existsSync, rmSync, readFileSync } from "node:fs";

describe("Recorder", () => {
  const testDir = "test-recorder-data";

  it("records a session with start/stop", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const session = await recorder.startSession("simulated");
    assert.equal(session.state, "recording");
    assert.equal(session.mode, "simulated");
    assert.equal(session.permissionGranted, true);
    assert.equal(session.consentRecorded, true);

    const recording = await recorder.stopSession(session.id);
    assert.equal(recording.format, "wav");
    assert.ok(recording.durationMs >= 0);
    assert.ok(recording.sizeBytes > 0);
  });

  it("supports pause and resume", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const session = await recorder.startSession("simulated");
    await recorder.pauseSession(session.id);
    assert.equal(session.state, "paused");

    await recorder.resumeSession(session.id);
    assert.equal(session.state, "recording");

    await recorder.stopSession(session.id);
    assert.equal(session.state, "saved");
  });

  it("requires deviceId for device mode", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    await assert.rejects(() => recorder.startSession("device"), /deviceId is required/);
  });

  it("requests permission for device capture", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const session = await recorder.requestPermission("dev-1", "Microphone");
    assert.equal(session.deviceId, "dev-1");
    assert.equal(session.deviceLabel, "Microphone");
    assert.equal(session.permissionGranted, true);
    assert.equal(session.consentRecorded, true);
  });

  it("rejects concurrent sessions", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const s1 = await recorder.startSession("simulated");
    await assert.rejects(() => recorder.startSession("simulated"), /a session is already active/);
    await recorder.stopSession(s1.id);
  });

  it("persists and reloads recordings", async () => {
    const recorder1 = new Recorder({ storageDir: testDir });
    const session = await recorder1.startSession("simulated");
    const recording = await recorder1.stopSession(session.id);
    const id = recording.id;

    const recorder2 = new Recorder({ storageDir: testDir });
    await recorder2.load();
    const reloaded = recorder2.getRecording(id);
    assert.ok(reloaded, "recovered recording should exist");
    assert.equal(reloaded?.format, "wav");
    assert.ok(reloaded?.checksum.length > 0);
  });

  it("exports valid WAV files", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const session = await recorder.startSession("simulated");
    const recording = await recorder.stopSession(session.id);

    const wav = recorder.exportWav(recording.id);
    assert.ok(recorder.validateWav(wav));
    assert.ok(wav.length > 44);
  });

  it("rejects invalid WAV data", () => {
    const recorder = new Recorder({ storageDir: testDir });
    assert.equal(recorder.validateWav(Buffer.from("not a wav")), false);
    assert.equal(recorder.validateWav(Buffer.alloc(10)), false);
  });

  it("rejects invalid session operations", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    await assert.rejects(() => recorder.pauseSession("nonexistent"), /session not found/);
    await assert.rejects(() => recorder.resumeSession("nonexistent"), /session not found/);
    await assert.rejects(() => recorder.stopSession("nonexistent"), /session not found/);
  });
});
