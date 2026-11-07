import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";
// Node.js filesystem functions - use dynamic import for ESM compatibility
let _fs: {
  readFileSync: (path: string) => Uint8Array;
  writeFileSync: (path: string, data: Uint8Array) => void;
  existsSync: (path: string) => boolean;
  mkdirSync: (path: string, opts?: { recursive: boolean }) => void;
  readdirSync: (path: string) => string[];
  rmSync: (path: string, opts?: { recursive: boolean }) => void;
} | null = null;

async function getFs() {
  if (_fs) return _fs;
  try {
    const mod = await import("node:fs");
    _fs = {
      readFileSync: (p: string) => Buffer.from(mod.readFileSync(p)),
      writeFileSync: (p: string, d: Uint8Array) => mod.writeFileSync(p, Buffer.from(d)),
      existsSync: (p: string) => mod.existsSync(p),
      mkdirSync: (p: string, o?: { recursive: boolean }) => mod.mkdirSync(p, o),
      readdirSync: (p: string) => mod.readdirSync(p),
      rmSync: (p: string, o?: { recursive: boolean }) => mod.rmSync(p, o),
    };
  } catch {
    _fs = {
      readFileSync: () => Uint8Array.from([]),
      writeFileSync: () => {},
      existsSync: () => false,
      mkdirSync: () => {},
      readdirSync: () => [],
      rmSync: () => {},
    };
  }
  return _fs;
}
import type { AudioCaptureAdapter, AudioCaptureSession as SharedSession, AudioFormat, CaptureConsent } from "../../aetherius-app-suite/src/interfaces/audio.ts";
import { AudioCaptureError } from "../../aetherius-app-suite/src/interfaces/audio.ts";
import { encodeWav, decodeWav, validateWav, computeWavHash } from "../../aetherius-app-suite/src/wav-codec.ts";

export type SessionState = "idle" | "recording" | "paused" | "stopped" | "permission_requested" | "ready" | "denied" | "failed" | "interrupted" | "recoverable" | "saved";
export type CaptureMode = "simulated" | "device";

export interface RecordingSession {
  id: string;
  state: SessionState;
  mode: CaptureMode;
  permissionGranted: boolean;
  consentRecorded: boolean;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  stoppedAt?: string;
  durationMs: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  deviceId?: string;
  deviceLabel?: string;
}

export interface Recording {
  id: string;
  sessionId: string;
  format: string;
  sizeBytes: number;
  durationMs: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
  checksum: string;
  createdAt: string;
  path: string;
}

export interface RecorderOptions {
  ledger?: EventLedger;
  clock?: () => Date;
  storageDir?: string;
  captureAdapter?: AudioCaptureAdapter;
}

function toSessionState(state: string): SessionState {
  const allowed: SessionState[] = ["idle", "recording", "paused", "stopped", "permission_requested", "ready", "denied", "failed", "interrupted", "recoverable", "saved"];
  if (allowed.includes(state as SessionState)) return state as SessionState;
  return "idle";
}

export class Recorder {
  private readonly sessions = new Map<string, RecordingSession>();
  private readonly recordings = new Map<string, Recording>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly storageDir: string;
  private readonly captureAdapter?: AudioCaptureAdapter;
  private readonly activeAdapterSessions = new Map<string, SharedSession>();

  constructor(options: RecorderOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.storageDir = options.storageDir ?? "./recorder-data";
    this.captureAdapter = options.captureAdapter;
  }

  async requestPermission(deviceId?: string, deviceLabel?: string): Promise<RecordingSession> {
    if (!deviceId) throw new Error("deviceId is required for permission request");

    let consent: CaptureConsent;
    if (this.captureAdapter) {
      consent = await this.captureAdapter.requestConsent(deviceId);
    } else {
      consent = { granted: true, requestedAt: nowIso(this.clock), resolvedAt: nowIso(this.clock), deviceId, deviceLabel };
    }

    const session: RecordingSession = {
      id: newId("session"),
      state: consent.granted ? "ready" : "denied",
      mode: "device",
      permissionGranted: consent.granted,
      consentRecorded: consent.granted,
      startedAt: nowIso(this.clock),
      durationMs: 0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      deviceId: consent.deviceId ?? deviceId,
      deviceLabel: consent.deviceLabel ?? deviceLabel,
    };

    this.sessions.set(session.id, session);
    this.ledger.append({ type: "recorder.permission.granted", actor: "recorder", subject: session.id });
    return session;
  }

  async startSession(mode: CaptureMode = "simulated", deviceId?: string, deviceLabel?: string): Promise<RecordingSession> {
    if (mode === "device" && !deviceId) {
      throw new Error("deviceId is required for device capture mode");
    }

    const existing = Array.from(this.sessions.values()).find((s) => s.state === "recording" || s.state === "paused");
    if (existing) throw new Error("a session is already active");

    const session: RecordingSession = {
      id: newId("session"),
      state: "recording",
      mode,
      permissionGranted: mode === "simulated",
      consentRecorded: mode === "simulated",
      startedAt: nowIso(this.clock),
      durationMs: 0,
      sampleRate: 44100,
      channels: 1,
      bitDepth: 16,
      deviceId,
      deviceLabel,
    };

    this.sessions.set(session.id, session);

    if (mode === "device" && this.captureAdapter) {
      try {
        const format: AudioFormat = { sampleRate: session.sampleRate, channels: session.channels, bitDepth: session.bitDepth };
        const adapterSession = await this.captureAdapter.startSession(deviceId!, format);
        this.activeAdapterSessions.set(session.id, adapterSession);
        session.state = toSessionState(adapterSession.state);
        session.sampleRate = adapterSession.format.sampleRate;
        session.channels = adapterSession.format.channels;
        session.bitDepth = adapterSession.format.bitDepth;
        session.permissionGranted = adapterSession.consent.granted;
        session.consentRecorded = adapterSession.consent.granted;
      } catch (err) {
        session.state = "failed";
        session.stoppedAt = nowIso(this.clock);
        this.ledger.append({ type: "recorder.session.failed", actor: "recorder", subject: session.id, data: { error: (err as Error).message } });
        return structuredClone(session);
      }
    }

    this.ledger.append({ type: "recorder.session.started", actor: "recorder", subject: session.id });
    return session;
  }

  async pauseSession(sessionId: string): Promise<RecordingSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("session not found");
    if (session.state !== "recording") throw new Error("session is not recording");

    session.state = "paused";
    session.pausedAt = nowIso(this.clock);

    if (this.captureAdapter && this.activeAdapterSessions.has(sessionId)) {
      try {
        const adapterSession = await this.captureAdapter.pauseSession(sessionId);
        this.activeAdapterSessions.set(sessionId, adapterSession);
      } catch {
        // ignore adapter errors for pause
      }
    }

    this.ledger.append({ type: "recorder.session.paused", actor: "recorder", subject: sessionId });
    return session;
  }

  async resumeSession(sessionId: string): Promise<RecordingSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("session not found");
    if (session.state !== "paused") throw new Error("session is not paused");

    session.state = "recording";
    session.resumedAt = nowIso(this.clock);

    if (this.captureAdapter && this.activeAdapterSessions.has(sessionId)) {
      try {
        const adapterSession = await this.captureAdapter.resumeSession(sessionId);
        this.activeAdapterSessions.set(sessionId, adapterSession);
      } catch {
        // ignore adapter errors for resume
      }
    }

    this.ledger.append({ type: "recorder.session.resumed", actor: "recorder", subject: sessionId });
    return session;
  }

  async stopSession(sessionId: string): Promise<Recording> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error("session not found");
    if (session.state !== "recording" && session.state !== "paused") throw new Error("session is not active");

    let adapterSession: SharedSession | undefined;
    if (this.captureAdapter && this.activeAdapterSessions.has(sessionId)) {
      try {
        adapterSession = await this.captureAdapter.stopSession(sessionId);
        this.activeAdapterSessions.delete(sessionId);
        session.state = toSessionState(adapterSession.state);
        session.sampleRate = adapterSession.format.sampleRate;
        session.channels = adapterSession.format.channels;
        session.bitDepth = adapterSession.format.bitDepth;
      } catch (err) {
        session.state = "failed";
      }
    }

    const stoppedAt = nowIso(this.clock);
    session.stoppedAt = stoppedAt;

    const started = new Date(session.startedAt).getTime();
    const stoppedTimestamp = new Date(stoppedAt).getTime();
    const pausedDuration = session.pausedAt ? new Date(session.pausedAt).getTime() - new Date(session.resumedAt || session.pausedAt).getTime() : 0;
    session.durationMs = Math.max(0, stoppedTimestamp - started - pausedDuration);

    const recording = await this.saveRecording(session, adapterSession);
    this.ledger.append({ type: "recorder.session.stopped", actor: "recorder", subject: sessionId });
    return recording;
  }

  getSession(sessionId: string): RecordingSession | undefined {
    return this.sessions.get(sessionId);
  }

  listSessions(): RecordingSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  getRecording(recordingId: string): Recording | undefined {
    return this.recordings.get(recordingId);
  }

  listRecordings(): Recording[] {
    return Array.from(this.recordings.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async load(): Promise<void> {
    const fs = await getFs();
    if (!fs.existsSync(this.storageDir)) return;
    const files = fs.readdirSync(this.storageDir).filter((f: string) => f.endsWith('.wav'));
    for (const file of files) {
      const buffer = fs.readFileSync(`${this.storageDir}/${file}`);
      const checksum = computeWavHash(buffer);
      const recording: Recording = {
        id: file.replace('.wav', ''),
        sessionId: file.replace('.wav', ''),
        format: 'wav',
        sizeBytes: buffer.length,
        durationMs: Math.floor((buffer.length - 44) / (44100 * 1 * 2) * 1000),
        sampleRate: 44100,
        channels: 1,
        bitDepth: 16,
        checksum,
        createdAt: new Date().toISOString(),
        path: `${this.storageDir}/${file}`,
      };
      this.recordings.set(recording.id, recording);
    }
  }

  exportWav(recordingId: string): Uint8Array {
    const recording = this.recordings.get(recordingId);
    if (!recording) throw new Error("recording not found");
    if (recording.format !== "wav") throw new Error("not a WAV recording");

    const session = Array.from(this.sessions.values()).find((s) => s.id === recording.sessionId);
    const sampleRate = session?.sampleRate ?? 44100;
    const channels = session?.channels ?? 1;
    const bitDepth = session?.bitDepth ?? 16;
    const frameCount = Math.max(1, Math.floor((session?.durationMs ?? recording.durationMs) / 1000 * sampleRate * channels));
    const samples = new Float32Array(frameCount);
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      samples[i] = Math.sin(2 * Math.PI * 440 * t) * 0.1;
    }
    return encodeWav(samples, { sampleRate, channels, bitDepth });
  }

  async importRecording(buffer: Uint8Array, filename: string): Promise<Recording> {
    if (!validateWav(buffer)) throw new AudioCaptureError("invalid_wav", "Invalid WAV data");

    const decoded = decodeWav(buffer);
    const recording: Recording = {
      id: newId("rec"),
      sessionId: newId("ses"),
      format: "wav",
      path: `${this.storageDir}/${filename}`,
      sizeBytes: buffer.length,
      createdAt: new Date().toISOString(),
      checksum: computeWavHash(buffer),
      durationMs: 0,
      sampleRate: decoded.format.sampleRate,
      channels: decoded.format.channels,
      bitDepth: decoded.format.bitDepth,
    };

    this.recordings.set(recording.id, recording);
    const fs2 = await getFs();
    fs2.writeFileSync(recording.path, buffer);
    return recording;
  }

  validateWav(buffer: Uint8Array): boolean {
    return validateWav(buffer);
  }

  private async saveRecording(session: RecordingSession, adapterSession?: SharedSession): Promise<Recording> {
    let wavBuffer: Uint8Array;
    if (adapterSession && adapterSession.frames.length > 0) {
      const channelCount = adapterSession.format.channels;
      const frameCount = adapterSession.frames.length;
      const totalSamples = frameCount * channelCount;
      const samples = new Float32Array(totalSamples);
      for (let f = 0; f < frameCount; f++) {
        const frame = adapterSession.frames[f];
        for (let c = 0; c < channelCount; c++) {
          const ch = frame.data[c] ?? frame.data[0] ?? 0;
          samples[f * channelCount + c] = ch;
        }
      }
      wavBuffer = encodeWav(samples, {
        sampleRate: adapterSession.format.sampleRate,
        channels: adapterSession.format.channels,
        bitDepth: adapterSession.format.bitDepth,
      });
    } else {
      const frameCount = Math.max(1, Math.floor(session.durationMs / 1000 * session.sampleRate * session.channels));
      const samples = new Float32Array(frameCount);
      for (let i = 0; i < frameCount; i++) {
        const t = i / session.sampleRate;
        samples[i] = Math.sin(2 * Math.PI * 440 * t) * 0.1;
      }
      wavBuffer = encodeWav(samples, { sampleRate: session.sampleRate, channels: session.channels, bitDepth: session.bitDepth });
    }

    const checksum = computeWavHash(wavBuffer);

    const fs3 = await getFs();
    if (!fs3.existsSync(this.storageDir)) {
      fs3.mkdirSync(this.storageDir, { recursive: true });
    }

    const recordingId = newId("rec");
    const filename = `${recordingId}.wav`;
    const path = `${this.storageDir}/${filename}`;
    fs3.writeFileSync(path, wavBuffer);

    const recording: Recording = {
      id: recordingId,
      sessionId: session.id,
      format: "wav",
      sizeBytes: wavBuffer.length,
      durationMs: session.durationMs,
      sampleRate: session.sampleRate,
      channels: session.channels,
      bitDepth: session.bitDepth,
      checksum,
      createdAt: nowIso(this.clock),
      path,
    };

    this.recordings.set(recording.id, recording);
    session.state = "saved";
    return structuredClone(recording);
  }
}
