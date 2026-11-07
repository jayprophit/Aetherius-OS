import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Video {
  id: string;
  title: string;
  durationSec: number;
  format: string;
}

export interface PlaybackState {
  videoId: string;
  positionSec: number;
  playing: boolean;
}

export interface VideoOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class VideoLibrary {
  private readonly videos = new Map<string, Video>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VideoOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  add(video: Omit<Video, "id">): Video {
    const v: Video = { ...video, id: newId("video") };
    this.videos.set(v.id, v);
    this.ledger.append({ type: "video.added", actor: "video", subject: v.id });
    return v;
  }

  get(id: string): Video | undefined {
    return this.videos.get(id);
  }

  list(): Video[] {
    return Array.from(this.videos.values());
  }
}

export class VideoPlayer {
  private state: PlaybackState | null = null;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: VideoOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  open(videoId: string): PlaybackState {
    const state: PlaybackState = { videoId, positionSec: 0, playing: false };
    this.state = state;
    this.ledger.append({ type: "video.opened", actor: "video", subject: videoId });
    return state;
  }

  play(): void {
    if (!this.state) throw new Error("no video open");
    this.state.playing = true;
    this.ledger.append({ type: "video.play", actor: "video", subject: this.state.videoId });
  }

  pause(): void {
    if (!this.state) throw new Error("no video open");
    this.state.playing = false;
    this.ledger.append({ type: "video.pause", actor: "video", subject: this.state.videoId });
  }

  seek(positionSec: number): void {
    if (!this.state) throw new Error("no video open");
    if (positionSec < 0) throw new Error("position must be non-negative");
    this.state.positionSec = positionSec;
    this.ledger.append({ type: "video.seek", actor: "video", subject: this.state.videoId });
  }
}
