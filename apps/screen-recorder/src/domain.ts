import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Screen Recorder domain core.
 *
 * Recording sessions with scope, format and captured-frame accounting.
 * Actual screen capture is a host adapter concern; this layer models what
 * was recorded and where the sessions stand.
 */

export type RecordScope = "screen" | "window" | "region";
export type RecordFormat = "mp4" | "webm" | "gif" | "mkv";
export type RecordingState = "recording" | "paused" | "stopped";

export interface RecordingSession {
  id: string;
  scope: RecordScope;
  format: RecordFormat;
  title: string;
  framesCaptured: number;
  state: RecordingState;
  startedAt: string;
  stoppedAt: string | null;
}

export interface RecorderOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

const SCOPES: RecordScope[] = ["screen", "window", "region"];
const FORMATS: RecordFormat[] = ["mp4", "webm", "gif", "mkv"];

export class ScreenRecorder {
  private readonly sessions = new Map<string, RecordingSession>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: RecorderOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  start(input: { scope?: string; format?: string; title?: string }): RecordingSession {
    const scope = (input.scope ?? "screen") as RecordScope;
    const format = (input.format ?? "mp4") as RecordFormat;
    if (!SCOPES.includes(scope)) throw new Error(`scope must be one of: ${SCOPES.join(", ")}`);
    if (!FORMATS.includes(format)) throw new Error(`format must be one of: ${FORMATS.join(", ")}`);
    const active = [...this.sessions.values()].find((session) => session.state !== "stopped");
    if (active) throw new Error("a recording is already in progress");
    const session: RecordingSession = {
      id: newId("rec"),
      scope,
      format,
      title: (input.title ?? "").trim() || `Recording ${this.sessions.size + 1}`,
      framesCaptured: 0,
      state: "recording",
      startedAt: nowIso(this.clock),
      stoppedAt: null,
    };
    this.sessions.set(session.id, session);
    this.ledger.append({ type: "screenrec.started", actor: "screenrec", subject: session.id, data: { scope, format } });
    return structuredClone(session);
  }

  pause(sessionId: string): RecordingSession {
    const session = this.require(sessionId);
    if (session.state !== "recording") throw new Error(`session is ${session.state}`);
    session.state = "paused";
    this.sessions.set(sessionId, session);
    return structuredClone(session);
  }

  resume(sessionId: string): RecordingSession {
    const session = this.require(sessionId);
    if (session.state !== "paused") throw new Error(`session is ${session.state}`);
    session.state = "recording";
    this.sessions.set(sessionId, session);
    return structuredClone(session);
  }

  addFrames(sessionId: string, frames: number): RecordingSession {
    const session = this.require(sessionId);
    if (session.state !== "recording") throw new Error("frames can only be captured while recording");
    if (!Number.isInteger(frames) || frames <= 0) throw new Error("frames must be a positive integer");
    session.framesCaptured += frames;
    this.sessions.set(sessionId, session);
    return structuredClone(session);
  }

  stop(sessionId: string): RecordingSession {
    const session = this.require(sessionId);
    if (session.state === "stopped") throw new Error("the session is already stopped");
    session.state = "stopped";
    session.stoppedAt = nowIso(this.clock);
    this.sessions.set(sessionId, session);
    this.ledger.append({ type: "screenrec.stopped", actor: "screenrec", subject: sessionId, data: { frames: session.framesCaptured } });
    return structuredClone(session);
  }

  get(sessionId: string): RecordingSession | undefined {
    const found = this.sessions.get(sessionId);
    return found ? structuredClone(found) : undefined;
  }

  list(): RecordingSession[] {
    return [...this.sessions.values()]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .map((session) => structuredClone(session));
  }

  private require(sessionId: string): RecordingSession {
    const found = this.sessions.get(sessionId);
    if (!found) throw new Error(`no session: ${sessionId}`);
    return structuredClone(found);
  }
}
