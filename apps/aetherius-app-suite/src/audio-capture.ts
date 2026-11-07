/**
 * Browser audio capture adapter using getUserMedia + AudioWorklet.
 *
 * This adapter captures raw PCM frames from the default microphone.
 * It is intended for the installed-web / Electron host environment.
 *
 * Owned by: aetherius-app-suite
 */

import type {
  AudioDevice,
  AudioDeviceCapabilities,
  AudioCaptureAdapter,
  AudioCaptureSession,
  AudioFrame,
  CaptureConsent,
  AudioFormat,
} from "./interfaces/audio.ts";
import { AudioCaptureError } from "./interfaces/audio.ts";

const DEFAULT_FORMAT: AudioFormat = {
  sampleRate: 44100,
  channels: 1,
  bitDepth: 16,
};

function toErrorCode(err: unknown): string {
  if (err instanceof DOMException) {
    if (err.name === "NotAllowedError") return "permission_denied";
    if (err.name === "NotFoundError") return "device_not_found";
    if (err.name === "NotReadableError") return "device_in_use";
    if (err.name === "OverconstrainedError") return "constraint_mismatch";
    return "device_error";
  }
  if (err instanceof Error) return err.message.slice(0, 64);
  return "unknown_error";
}

export class BrowserAudioCaptureAdapter implements AudioCaptureAdapter {
  private readonly streams = new Map<string, MediaStream>();
  private readonly contexts = new Map<string, AudioContext>();
  private readonly processors = new Map<string, ScriptProcessorNode | AudioWorkletNode>();
  private readonly sessions = new Map<string, AudioCaptureSession>();
  private nextId = 1;
  private readonly ledger?: { append: (entry: any) => void };
  private readonly maxBufferFrames: number;

  constructor(options?: { ledger?: { append: (entry: any) => void }; maxBufferFrames?: number }) {
    this.ledger = options?.ledger;
    this.maxBufferFrames = options?.maxBufferFrames ?? 8192;
  }

  async enumerateDevices(): Promise<AudioDevice[]> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      return [];
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === "audioinput");
    return audioInputs.map((d) => ({
      id: d.deviceId,
      label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
      kind: "input",
      capabilities: {
        sampleRates: [44100, 48000],
        maxChannels: 2,
        minLatencyMs: 10,
        maxLatencyMs: 200,
      },
    }));
  }

  async requestConsent(deviceId?: string): Promise<CaptureConsent> {
    const requestedAt = new Date().toISOString();
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      const track = stream.getAudioTracks()[0];
      const settings = track.getSettings();
      const resolvedAt = new Date().toISOString();
      stream.getTracks().forEach((t) => t.stop());
      return {
        granted: true,
        requestedAt,
        resolvedAt,
        deviceId: settings.deviceId,
        deviceLabel: track.label,
      };
    } catch (err) {
      return {
        granted: false,
        requestedAt,
        resolvedAt: new Date().toISOString(),
        deviceId: deviceId,
      };
    }
  }

  async startSession(deviceId: string, format: AudioFormat = DEFAULT_FORMAT): Promise<AudioCaptureSession> {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new AudioCaptureError("host_unavailable", "getUserMedia is not available in this environment");
    }

    const sessionId = `session-${this.nextId++}`;
    const session: AudioCaptureSession = {
      id: sessionId,
      state: "permission_requested",
      deviceId,
      format,
      startedAt: new Date().toISOString(),
      durationMs: 0,
      frames: [],
      consent: {
        granted: false,
        requestedAt: new Date().toISOString(),
        deviceId,
      },
      diagnostics: {
        framesReceived: 0,
        bytesRecorded: 0,
        overruns: 0,
        underruns: 0,
      },
    };

    this.sessions.set(sessionId, session);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          sampleRate: format.sampleRate,
          channelCount: format.channels,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const track = stream.getAudioTracks()[0];
      if (!track) {
        throw new AudioCaptureError("no_audio_track", "No audio track in the media stream");
      }

      const settings = track.getSettings();
      const negotiatedSampleRate = settings.sampleRate ?? format.sampleRate;
      const negotiatedChannels = settings.channelCount ?? format.channels;

      session.consent = {
        granted: true,
        requestedAt: session.consent.requestedAt,
        resolvedAt: new Date().toISOString(),
        deviceId: settings.deviceId,
        deviceLabel: track.label,
      };
      session.state = "ready";
      session.format = {
        sampleRate: negotiatedSampleRate,
        channels: negotiatedChannels,
        bitDepth: format.bitDepth,
      };

      this.streams.set(sessionId, stream);

      // Handle device disconnect.
      track.onended = () => {
        if (session.state === "recording" || session.state === "paused") {
          session.state = "interrupted";
          session.diagnostics.lastError = "device_disconnected";
          this.ledger?.append?.({ type: "audio.session.interrupted", actor: "audio", subject: sessionId, data: { reason: "device_disconnected" } });
        }
      };

      // Use AudioWorklet when available; fall back to ScriptProcessorNode.
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass({ sampleRate: negotiatedSampleRate });
      this.contexts.set(sessionId, ctx);

      const source = ctx.createMediaStreamSource(stream);
      const startTime = performance.now();
      let useWorklet = false;

      if (typeof (ctx as any).audioWorklet !== "undefined") {
        try {
          const workletCode = `
            class CaptureProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.buffer = [];
                this.port.onmessage = (e) => {
                  if (e.data.command === "flush") {
                    this.port.postMessage({ type: "flush", frames: this.buffer });
                    this.buffer = [];
                  }
                };
              }
              process(inputs) {
                const input = inputs[0];
                if (input && input[0] && input[0].length > 0) {
                  this.buffer.push(new Float32Array(input[0]));
                }
                return true;
              }
            }
            registerProcessor("capture-processor", CaptureProcessor);
          `;
          const blob = new Blob([workletCode], { type: "application/javascript" });
          const url = URL.createObjectURL(blob);
          await ctx.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);

          const workletNode = new AudioWorkletNode(ctx, "capture-processor", {
            numberOfInputs: 1,
            numberOfOutputs: 0,
          });
          this.processors.set(sessionId, workletNode);

          workletNode.port.onmessage = (e) => {
            if (session.state !== "recording") return;
            if (e.data.type === "flush") {
              for (const frame of e.data.frames) {
                if (session.frames.length >= this.maxBufferFrames) {
                  session.diagnostics.overruns++;
                  session.frames.shift();
                }
                session.frames.push({
                  data: frame,
                  timestamp: performance.now() - startTime,
                  sampleRate: negotiatedSampleRate,
                  channels: negotiatedChannels,
                });
                session.diagnostics.framesReceived += 1;
                session.diagnostics.bytesRecorded += frame.length * 2;
              }
            }
          };

          source.connect(workletNode);
          useWorklet = true;
        } catch (workletErr) {
          console.warn("AudioWorklet failed, falling back to ScriptProcessorNode:", workletErr);
          this.processors.delete(sessionId);
        }
      }

      if (!useWorklet) {
        const bufferSize = 4096;
        const processor = ctx.createScriptProcessor(bufferSize, negotiatedChannels, negotiatedChannels);
        this.processors.set(sessionId, processor);

        processor.onaudioprocess = (e: AudioProcessingEvent) => {
          if (session.state !== "recording") return;
          const input = e.inputBuffer;
          const channels: Float32Array[] = [];
          for (let c = 0; c < input.numberOfChannels; c++) {
            channels.push(new Float32Array(input.getChannelData(c)));
          }

          // Mix or interleave based on channel count.
          let mixed: Float32Array;
          if (negotiatedChannels === 1) {
            mixed = channels.length === 1 ? channels[0] : this.mixToMono(channels);
          } else {
            mixed = this.interleaveChannels(channels, negotiatedChannels);
          }

          if (session.frames.length >= this.maxBufferFrames) {
            session.diagnostics.overruns++;
            session.frames.shift();
          }

          session.frames.push({
            data: mixed,
            timestamp: performance.now() - startTime,
            sampleRate: negotiatedSampleRate,
            channels: negotiatedChannels,
          });
          session.diagnostics.framesReceived += 1;
          session.diagnostics.bytesRecorded += mixed.length * 2;
        };

        source.connect(processor);
        processor.connect(ctx.destination);
      }

      session.state = "recording";
      this.ledger?.append?.({ type: "audio.session.started", actor: "audio", subject: sessionId });
      return structuredClone(session);
    } catch (err) {
      session.state = "failed";
      session.diagnostics.lastError = toErrorCode(err);
      this.ledger?.append?.({ type: "audio.session.failed", actor: "audio", subject: sessionId, data: { error: toErrorCode(err) } });
      throw new AudioCaptureError(toErrorCode(err), `Failed to start capture: ${toErrorCode(err)}`, true);
    }
  }

  private mixToMono(channels: Float32Array[]): Float32Array {
    if (channels.length === 0) return new Float32Array(0);
    const len = channels[0].length;
    const mixed = new Float32Array(len);
    for (let i = 0; i < len; i++) {
      let sum = 0;
      for (const ch of channels) sum += ch[i];
      mixed[i] = sum / channels.length;
    }
    return mixed;
  }

  private interleaveChannels(channels: Float32Array[], targetChannels: number): Float32Array {
    if (channels.length === 0) return new Float32Array(0);
    const len = channels[0].length;
    const interleaved = new Float32Array(len * targetChannels);
    for (let i = 0; i < len; i++) {
      for (let c = 0; c < targetChannels; c++) {
        interleaved[i * targetChannels + c] = channels[c]?.[i] ?? 0;
      }
    }
    return interleaved;
  }

  async pauseSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "recording") throw new AudioCaptureError("invalid_state", `Cannot pause from ${session.state}`);
    session.state = "paused";
    session.pausedAt = new Date().toISOString();
    this.ledger?.append?.({ type: "audio.session.paused", actor: "audio", subject: sessionId });
    return structuredClone(session);
  }

  async resumeSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "paused") throw new AudioCaptureError("invalid_state", `Cannot resume from ${session.state}`);
    session.state = "recording";
    session.resumedAt = new Date().toISOString();
    this.ledger?.append?.({ type: "audio.session.resumed", actor: "audio", subject: sessionId });
    return structuredClone(session);
  }

  async stopSession(sessionId: string): Promise<AudioCaptureSession> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new AudioCaptureError("session_not_found", `Session ${sessionId} not found`);
    if (session.state !== "recording" && session.state !== "paused") {
      throw new AudioCaptureError("invalid_state", `Cannot stop from ${session.state}`);
    }

    const stream = this.streams.get(sessionId);
    const ctx = this.contexts.get(sessionId);
    const processor = this.processors.get(sessionId);

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      this.streams.delete(sessionId);
    }
    if (processor) {
      processor.disconnect();
      this.processors.delete(sessionId);
    }
    if (ctx) {
      await ctx.close();
      this.contexts.delete(sessionId);
    }

    session.state = "stopped";
    session.stoppedAt = new Date().toISOString();
    const started = new Date(session.startedAt).getTime();
    const stopped = new Date(session.stoppedAt).getTime();
    const pausedMs = session.pausedAt && session.resumedAt
      ? new Date(session.resumedAt).getTime() - new Date(session.pausedAt).getTime()
      : 0;
    session.durationMs = Math.max(0, stopped - started - pausedMs);

    this.ledger?.append?.({ type: "audio.session.stopped", actor: "audio", subject: sessionId });
    return structuredClone(session);
  }

  getSession(sessionId: string): AudioCaptureSession | undefined {
    const session = this.sessions.get(sessionId);
    return session ? structuredClone(session) : undefined;
  }
}
