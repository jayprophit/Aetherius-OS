/**
 * Shared audio capture contract for Aetherius OS.
 *
 * Owned by: aetherius-app-suite
 * Reused by: aetherius-recorder, Poietek, and any future audio application.
 *
 * Do not create duplicate audio engines or parallel contracts.
 */

export type SessionState =
  | "idle"
  | "permission_requested"
  | "ready"
  | "recording"
  | "paused"
  | "stopped"
  | "saved"
  | "denied"
  | "failed"
  | "interrupted"
  | "recoverable";

export interface AudioDeviceCapabilities {
  sampleRates: number[];
  maxChannels: number;
  minLatencyMs: number;
  maxLatencyMs: number;
}

export interface AudioDevice {
  id: string;
  label: string;
  kind: "input" | "output" | "loopback";
  capabilities: AudioDeviceCapabilities;
}

export interface AudioFormat {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface PCMBuffer {
  frames: Float32Array[];
  format: AudioFormat;
  frameCount: number;
}

export interface AudioFrame {
  data: Float32Array;
  timestamp: number; // microseconds since session start
  sampleRate: number;
  channels: number;
}

export interface CaptureConsent {
  granted: boolean;
  requestedAt: string;
  resolvedAt?: string;
  deviceId?: string;
  deviceLabel?: string;
}

export interface CaptureDiagnostics {
  framesReceived: number;
  bytesRecorded: number;
  overruns: number;
  underruns: number;
  lastError?: string;
}

export interface AudioCaptureSession {
  id: string;
  state: SessionState;
  deviceId: string;
  format: AudioFormat;
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  stoppedAt?: string;
  durationMs: number;
  frames: AudioFrame[];
  consent: CaptureConsent;
  diagnostics: CaptureDiagnostics;
}

export interface AudioCaptureAdapter {
  enumerateDevices(): Promise<AudioDevice[]>;
  requestConsent(deviceId?: string): Promise<CaptureConsent>;
  startSession(deviceId: string, format: AudioFormat): Promise<AudioCaptureSession>;
  pauseSession(sessionId: string): Promise<AudioCaptureSession>;
  resumeSession(sessionId: string): Promise<AudioCaptureSession>;
  stopSession(sessionId: string): Promise<AudioCaptureSession>;
  getSession(sessionId: string): AudioCaptureSession | undefined;
}

export class AudioCaptureError extends Error {
  public readonly code: string;
  public readonly recoverable: boolean;

  constructor(code: string, message: string, recoverable = false) {
    super(message);
    this.name = "AudioCaptureError";
    this.code = code;
    this.recoverable = recoverable;
  }
}
