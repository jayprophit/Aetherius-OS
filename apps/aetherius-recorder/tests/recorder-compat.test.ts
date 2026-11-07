import { describe, it } from "node:test";
import assert from "node:assert";
import { Recorder } from "../src/domain.ts";
import { SimulatedAudioCaptureAdapter } from "../../aetherius-app-suite/src/audio-capture-simulated.ts";
import { existsSync, rmSync, readFileSync } from "node:fs";

describe("Recorder cross-process and Poietek compatibility", () => {
  const testDir = "test-recorder-compat";

  it("persists recordings across separate process instances", async () => {
    const recorder1 = new Recorder({ storageDir: testDir });
    const session = await recorder1.startSession("simulated");
    const recording = await recorder1.stopSession(session.id);
    const id = recording.id;

    const recorder2 = new Recorder({ storageDir: testDir });
    await recorder2.load();
    const reloaded = recorder2.getRecording(id);
    assert.ok(reloaded, "recovered recording should exist");
    assert.equal(reloaded!.format, "wav");
    assert.ok(reloaded!.checksum.length > 0);
    assert.ok(reloaded!.sizeBytes > 0);
  });

  it("produces WAV files decodable by the shared WAV codec", async () => {
    const recorder = new Recorder({ storageDir: testDir });
    const session = await recorder.startSession("simulated");
    const recording = await recorder.stopSession(session.id);

    const buffer = readFileSync(recording.path);
    const decoded = (await import("../../aetherius-app-suite/src/wav-codec.ts")).decodeWav(buffer);
    assert.equal(decoded.format.sampleRate, session.sampleRate);
    assert.equal(decoded.format.channels, session.channels);
    assert.equal(decoded.format.bitDepth, session.bitDepth);
    assert.ok(decoded.samples.length > 0);
  });

  it("supports real adapter sessions with PCM frames", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const recorder = new Recorder({ storageDir: testDir, captureAdapter: adapter });
    const permission = await recorder.requestPermission("simulated-device");
    assert.equal(permission.permissionGranted, true);

    const session = await recorder.startSession("device", "simulated-device");
    assert.equal(session.state, "recording");

    const recording = await recorder.stopSession(session.id);
    assert.equal(recording.format, "wav");
    assert.ok(recording.sizeBytes > 0);

    const buffer = readFileSync(recording.path);
    const decoded = (await import("../../aetherius-app-suite/src/wav-codec.ts")).decodeWav(buffer);
    assert.ok(decoded.samples.length > 0, "real adapter session should produce decodable samples");
  });

  it("replays session state transitions in order", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const recorder = new Recorder({ storageDir: testDir, captureAdapter: adapter });
    const permission = await recorder.requestPermission("simulated-device");
    assert.equal(permission.state, "ready");

    const session = await recorder.startSession("device", "simulated-device");
    assert.equal(session.state, "recording");

    await recorder.pauseSession(session.id);
    assert.equal(session.state, "paused");

    await recorder.resumeSession(session.id);
    assert.equal(session.state, "recording");

    const recording = await recorder.stopSession(session.id);
    assert.equal(session.state, "saved");
    assert.equal(recording.format, "wav");
  });
});
