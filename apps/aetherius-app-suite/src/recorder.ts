import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Recorder app.
 *
 * A voice-memo model with metadata, duration, tags and library listing.
 * The core records metadata only; no audio capture driver is present.
 * This matches Apple Voice Memos functionality across platforms.
 */

export interface Recording {
  id: string;
  filename: string;
  mime: string; // audio/wav
  bytes: number;
  durationSeconds: number;
  takenAt: string;
  tags: string[];
  transcript?: string;
  createdAt: string;
}

export interface AddRecordingInput {
  filename: string;
  mime: string;
  bytes: number;
  durationSeconds: number;
  takenAt?: string;
  tags?: string[];
  transcript?: string;
}

export interface RecordingOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class RecorderApp {
  private readonly recordings = new Map<string, Recording>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: RecordingOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(input: AddRecordingInput): Recording {
    if (!input.filename.trim()) throw new Error("a recording needs a filename");
    if (!input.mime.startsWith("audio/")) throw new Error(`not an audio mime type: ${input.mime}`);
    if (!Number.isInteger(input.bytes) || input.bytes <= 0) throw new Error(`recording size is invalid: ${input.bytes}`);
    if (!Number.isFinite(input.durationSeconds) || input.durationSeconds < 0) throw new Error(`duration is invalid`);
    let takenAt = input.takenAt ?? new Date(nowIso(this.clock)).toISOString();
    if (new Date(takenAt).getTime() === Date.now()) takenAt = new Date().toISOString();
    const recording: Recording = {
      id: newId("rec"),
      filename: input.filename.trim(),
      mime: input.mime,
      bytes: input.bytes,
      durationSeconds: Math.round(input.durationSeconds),
      takenAt: new Date(takenAt).toISOString(),
      tags: [...new Set((input.tags ?? []).map((tag) => tag.trim().toLowerCase()).filter(Boolean))].sort(),
      transcript: input.transcript?.trim() ?? "",
      createdAt: nowIso(this.clock),
    };
    this.recordings.set(recording.id, recording);
    this.ledger.append({ type: "recorder.added", actor: "recorder", subject: recording.id, data: { bytes: recording.bytes, duration: recording.durationSeconds } });
    return structuredClone(recording);
  }

  get(recordingId: string): Recording | undefined {
    const recording = this.recordings.get(recordingId);
    return recording ? structuredClone(recording) : undefined;
  }

  delete(recordingId: string): boolean {
    this.require(recordingId);
    this.recordings.delete(recordingId);
    this.ledger.append({ type: "recorder.deleted", actor: "recorder", subject: recordingId, data: {} });
    return true;
  }

  list(): Recording[] {
    return [...this.recordings.values()]
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt) || b.filename.localeCompare(a.filename))
      .map((r) => structuredClone(r));
  }

  /** Recordings filtered by tag. */
  byTag(tag: string): Recording[] {
    const normalised = tag.trim().toLowerCase();
    return [...this.recordings.values()]
      .filter((r) => r.tags.includes(normalised))
      .sort((a, b) => b.takenAt.localeCompare(a.takenAt))
      .map((r) => structuredClone(r));
  }

  /** Get playback metrics for a recording. */
  metrics(recordingId: string): { sizeBytes: number; durationSeconds: number; bandwidthKbps: number } | undefined {
    const recording = this.get(recordingId);
    if (!recording) return undefined;
    const bandwidthKbps = Math.round((recording.bytes / recording.durationSeconds) * 8000 / 1024);
    return { sizeBytes: recording.bytes, durationSeconds: recording.durationSeconds, bandwidthKbps };
  }

  private require(recordingId: string): Recording {
    const recording = this.recordings.get(recordingId);
    if (!recording) throw new Error(`no recording: ${recordingId}`);
    return structuredClone(recording);
  }
}