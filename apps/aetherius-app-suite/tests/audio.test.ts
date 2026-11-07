import { describe, it } from "node:test";
import assert from "node:assert";
import { SimulatedAudioCaptureAdapter } from "../src/audio-capture-simulated.ts";
import type { AudioDevice, AudioCaptureSession, AudioFormat } from "../src/interfaces/audio.ts";
import { AudioCaptureError } from "../src/interfaces/audio.ts";

describe("SimulatedAudioCaptureAdapter", () => {
  it("enumerates a single simulated device", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const devices = await adapter.enumerateDevices();
    assert.equal(devices.length, 1);
    assert.equal(devices[0].id, "simulated-device");
    assert.equal(devices[0].kind, "input");
  });

  it("grants consent for any device", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const consent = await adapter.requestConsent("simulated-device");
    assert.ok(consent.granted);
    assert.equal(consent.deviceId, "simulated-device");
  });

  it("starts and stops a session", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const session = await adapter.startSession("simulated-device", { sampleRate: 44100, channels: 1, bitDepth: 16 });
    assert.equal(session.state, "recording");
    assert.equal(session.format.sampleRate, 44100);
    assert.equal(session.format.channels, 1);

    const stopped = await adapter.stopSession(session.id);
    assert.equal(stopped.state, "stopped");
    assert.ok(stopped.frames.length > 0, "should generate simulated frames");
    assert.ok(stopped.durationMs >= 0);
  });

  it("pauses and resumes", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const session = await adapter.startSession("simulated-device");
    await adapter.pauseSession(session.id);
    assert.equal(session.state, "paused");

    await adapter.resumeSession(session.id);
    assert.equal(session.state, "recording");

    await adapter.stopSession(session.id);
  });

  it("rejects concurrent sessions", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    await adapter.startSession("simulated-device");
    await assert.rejects(() => adapter.startSession("simulated-device-2"), /a session is already active/);
  });

  it("rejects invalid state transitions", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const session = await adapter.startSession("simulated-device");
    await adapter.stopSession(session.id);
    await assert.rejects(() => adapter.pauseSession(session.id), /Cannot pause from/);
  });

  it("retrieves sessions", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const started = await adapter.startSession("simulated-device");
    const retrieved = adapter.getSession(started.id);
    assert.ok(retrieved);
    assert.equal(retrieved!.id, started.id);
  });

  it("injects frames for deterministic testing", async () => {
    const adapter = new SimulatedAudioCaptureAdapter();
    const session = await adapter.startSession("simulated-device");
    adapter.injectFrames(session.id, [
      { data: new Float32Array([0.5, -0.5]), timestamp: 0, sampleRate: 44100, channels: 1 },
    ]);
    const updated = adapter.getSession(session.id);
    assert.equal(updated!.frames.length, 1);
    assert.equal(updated!.diagnostics.framesReceived, 1);
  });
});

describe("AudioCaptureError", () => {
  it("carries code and recoverable flag", () => {
    const err = new AudioCaptureError("test_code", "test message", true);
    assert.equal(err.code, "test_code");
    assert.equal(err.recoverable, true);
    assert.equal(err.message, "test message");
  });
});
