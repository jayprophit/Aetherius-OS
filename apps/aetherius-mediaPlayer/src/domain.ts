import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Media Player domain core.
 *
 * Playlists, queues, playback state and repeat/shuffle modes. Media
 * decoding is a host adapter concern; this layer models what is queued,
 * what is playing and how it advances.
 */

export type RepeatMode = "off" | "one" | "all";
export type PlaybackState = "stopped" | "playing" | "paused";

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  source: string;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface QueueEntry {
  trackId: string;
  position: number;
}

export interface MediaPlayerOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MediaPlayer {
  private readonly tracks = new Map<string, Track>();
  private readonly playlists = new Map<string, Playlist>();
  private queue: QueueEntry[] = [];
  private currentTrackId: string | null = null;
  private positionSeconds = 0;
  private state: PlaybackState = "stopped";
  private repeatMode: RepeatMode = "off";
  private shuffle = false;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MediaPlayerOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addTrack(input: { title: string; artist?: string; durationSeconds: number; source: string }): Track {
    if (typeof input.title !== "string" || input.title.trim().length === 0) {
      throw new Error("a track needs a title");
    }
    if (!Number.isFinite(input.durationSeconds) || input.durationSeconds <= 0) {
      throw new Error("durationSeconds must be a positive number");
    }
    if (typeof input.source !== "string" || input.source.trim().length === 0) {
      throw new Error("a track needs a source");
    }
    const track: Track = {
      id: newId("trk"),
      title: input.title.trim(),
      artist: (input.artist ?? "Unknown").trim() || "Unknown",
      durationSeconds: input.durationSeconds,
      source: input.source.trim(),
    };
    this.tracks.set(track.id, track);
    this.ledger.append({ type: "media.track_added", actor: "media", subject: track.id, data: {} });
    return structuredClone(track);
  }

  removeTrack(trackId: string): boolean {
    if (!this.tracks.delete(trackId)) return false;
    this.queue = this.queue.filter((entry) => entry.trackId !== trackId);
    for (const playlist of this.playlists.values()) {
      playlist.trackIds = playlist.trackIds.filter((id) => id !== trackId);
    }
    if (this.currentTrackId === trackId) {
      this.currentTrackId = null;
      this.positionSeconds = 0;
      this.state = "stopped";
    }
    return true;
  }

  createPlaylist(name: string): Playlist {
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new Error("a playlist needs a name");
    }
    const playlist: Playlist = { id: newId("pl"), name: name.trim(), trackIds: [] };
    this.playlists.set(playlist.id, playlist);
    return structuredClone(playlist);
  }

  addToPlaylist(playlistId: string, trackId: string): Playlist {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`no playlist: ${playlistId}`);
    if (!this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
    if (!playlist.trackIds.includes(trackId)) playlist.trackIds.push(trackId);
    return structuredClone(playlist);
  }

  playlist(playlistId: string): Playlist {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`no playlist: ${playlistId}`);
    return structuredClone(playlist);
  }

  enqueue(trackIds: string[]): void {
    for (const trackId of trackIds) {
      if (!this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
    }
    this.queue = trackIds.map((trackId, position) => ({ trackId, position }));
    this.ledger.append({ type: "media.queue_set", actor: "media", subject: trackIds.length ? trackIds[0] : "empty", data: { count: trackIds.length } });
  }

  play(trackId?: string): string {
    if (trackId !== undefined && !this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
    const target = trackId ?? this.currentTrackId ?? this.queue[0]?.trackId;
    if (!target) throw new Error("nothing to play: the queue is empty");
    this.currentTrackId = target;
    this.positionSeconds = 0;
    this.state = "playing";
    this.ledger.append({ type: "media.playback_started", actor: "media", subject: target, data: {} });
    return target;
  }

  pause(): void {
    if (this.state !== "playing") throw new Error("nothing is playing");
    this.state = "paused";
    this.ledger.append({ type: "media.playback_paused", actor: "media", subject: this.currentTrackId ?? "", data: { position: this.positionSeconds } });
  }

  seek(seconds: number): number {
    if (this.state === "stopped" || !this.currentTrackId) throw new Error("nothing is loaded");
    const track = this.tracks.get(this.currentTrackId)!;
    const clamped = Math.max(0, Math.min(Math.floor(seconds), Math.floor(track.durationSeconds)));
    this.positionSeconds = clamped;
    return clamped;
  }

  next(): string | null {
    if (this.queue.length === 0) return null;
    const index = this.queue.findIndex((entry) => entry.trackId === this.currentTrackId);
    const following = this.queue[index + 1] ?? (this.repeatMode === "all" ? this.queue[0] : null);
    if (!following) {
      this.state = "stopped";
      this.currentTrackId = null;
      this.positionSeconds = 0;
      return null;
    }
    this.currentTrackId = following.trackId;
    this.positionSeconds = 0;
    this.state = "playing";
    return following.trackId;
  }

  setRepeat(mode: RepeatMode): void {
    if (mode !== "off" && mode !== "one" && mode !== "all") {
      throw new Error("repeat must be off, one or all");
    }
    this.repeatMode = mode;
  }

  setShuffle(enabled: boolean): void {
    this.shuffle = enabled === true;
  }

  status(): { state: PlaybackState; trackId: string | null; positionSeconds: number; queueLength: number; repeat: RepeatMode; shuffle: boolean } {
    return {
      state: this.state,
      trackId: this.currentTrackId,
      positionSeconds: this.positionSeconds,
      queueLength: this.queue.length,
      repeat: this.repeatMode,
      shuffle: this.shuffle,
    };
  }
}
