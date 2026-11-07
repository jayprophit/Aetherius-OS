/**
 * Simulated audio capture adapter for unit tests and Node.js environments.
 *
 * Generates deterministic PCM sine-wave frames so tests never depend on a microphone.
 */

import type {
  AudioDevice,
  AudioCaptureAdapter,
  AudioCaptureSession,
  AudioFormat,
  CaptureConsent,
  AudioFrame,
} from "./interfaces/audio.ts";
import { AudioCaptureError } from "./interfaces/audio.ts";

export class SimulatedAudioCaptureAdapter implements AudioCaptureAdapter {
  private readonly sessions = new Map<string, AudioCaptureSession>();
  private readonly device = (): AudioDevice => ({
    id: "simulated-device",
    label: "Simulated Microphone",
    kind: "input",
    capabilities: {
      sampleRates: [44100, 48000],
      maxChannels: 2,
      minLatencyMs: 0,
      maxLatencyMs: 0,
    },
  });

  async enumerateDevices(): Promise<AudioDevice[]> {
    return [this.device()];
  }

  async requestConsent(_deviceId?: string): Promise<CaptureConsent> {
    return {
      granted: true,
      requestedAt: new Date().toISOString(),
      resolvedAt: new Date().toISOString(),
      deviceId: this.device().id,
      deviceLabel: this.device().label,
    };
  }

  async startSession(deviceId: string, format: AudioFormat = { sampleRate: 44100, channels: 1, bitDepth: 16 }): Promise<AudioCaptureSession> {
    if (!deviceId) throw new AudioCaptureError("invalid_device", "deviceId is required");

    const existing = Array.from(this.sessions.values()).find((s) => s.state === "recording" || s.state === "paused");
    if (existing) throw new AudioCaptureError("session_active", "a session is already active");

    const sessionId = `sim-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const session: AudioCaptureSession = {
      id: sessionId,
      state: "ready",
      deviceId,
      format,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      frames: [],
      consent: {
        granted: true,
        requestedAt: new Date().toISOString(),
        resolvedAt: new Date().toISOString(),
        deviceId,
        deviceLabel: this.device().label,
      },
      diagnostics: {
        framesReceived: 0,
        bytesRecorded: 0,
        overruns: 0,
        underruns: 0,
      },
    };

    this.sessions.set(sessionId, session);
    session.state = "recording";
    return session;
  }

  async pauseSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "recording") throw new AudioCaptureError("invalid_state", `Cannot pause from ${session.state}`);
    session.state = "paused";
    session.pausedAt = new Date().toISOString();
    return session;
  }

  async resumeSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "paused") throw new AudioCaptureError("invalid_state", `Cannot resume from ${session.state}`);
    session.state = "recording";
    session.resumedAt = new Date().toISOString();
    return session;
  }

  async stopSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "recording" && session.state !== "paused") {
      throw new AudioCaptureError("invalid_state", `Cannot stop from ${session.state}`);
    }

    // Generate deterministic simulated frames if none were recorded
    if (session.frames.length === 0) {
      const frameCount = Math.floor((session.durationMs / 1000) * session.format.sampleRate) || 441;
      for (let i = 0; i < frameCount; i++) {
        const t = i / session.format.sampleRate;
        const sample = Math.sin(2 * Math.PI * 440 * t) * 0.1;
        session.frames.push({
          data: new Float32Array([sample]),
          timestamp: i * (1_000_000 / session.format.sampleRate),
          sampleRate: session.format.sampleRate,
          channels: session.format.channels,
        });
      }
      session.diagnostics.framesReceived = frameCount;
      session.diagnostics.bytesRecorded = frameCount * session.format.channels * 4;
    }

    session.state = "stopped";
    session.stoppedAt = new Date().toISOString();
    const started = new Date(session.startedAt).getTime();
    const stopped = new Date(session.stoppedAt).getTime();
    const pausedMs = session.pausedAt && session.resumedAt
      ? new Date(session.resumedAt).getTime() - new Date(session.pausedAt).getTime()
      : 0;
    session.durationMs = Math.max(0, stopped - started - pausedMs);

    return structuredClone(session);
  }

  getSession(sessionId: string): AudioCaptureSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? structuredClone(session) : undefined;
  }

  /** Inject frames into a running simulated session (test helper). */
  injectFrames(sessionId: string, frames: AudioFrame[]): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.frames.push(...frames);
      session.diagnostics.framesReceived += frames.length;
      session.diagnostics.bytesRecorded += frames.reduce((s, f) => s + f.data.byteLength, 0);
    }
  }
}
