import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

/**
 * Music and video cores.
 *
 * A deterministic library, playlist, queue and playback state; a video library
 * with trim ranges and subtitle cues. No codec, DRM, streaming or camera
 * pipeline is claimed. The host supplies decoding and output.
 */

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationMs: number;
  genre: string;
  year?: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: string;
}

export interface SubtitleCue {
  startMs: number;
  endMs: number;
  text: string;
}

export interface SubtitleTrack {
  lang: string;
  cues: SubtitleCue[];
}

export interface Video {
  id: string;
  title: string;
  durationMs: number;
  subtitles: SubtitleTrack[];
  trim?: { startMs: number; endMs: number };
}

export interface MediaOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

function assertDuration(durationMs: number, label: string): void {
  if (!Number.isInteger(durationMs) || durationMs < 0) throw new Error(`${label} must be a non-negative integer`);
}

export class MusicApp {
  private readonly tracks = new Map<string, Track>();
  private readonly playlists = new Map<string, Playlist>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private queue: string[] = [];
  private index = -1;
  private playing = false;
  private positionMs = 0;

  constructor(options: MediaOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addTrack(input: Omit<Track, "id">): Track {
    assertDuration(input.durationMs, "a track duration");
    if (!input.title.trim()) throw new Error("a track needs a title");
    const track: Track = { ...input, id: newId("track"), title: input.title.trim() };
    this.tracks.set(track.id, track);
    this.ledger.append({ type: "music.track.added", actor: "music", subject: track.id });
    return structuredClone(track);
  }

  track(trackId: string): Track | undefined {
    const track = this.tracks.get(trackId);
    return track ? structuredClone(track) : undefined;
  }

  search(query: string): Track[] {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (terms.length === 0) return [];
    return [...this.tracks.values()]
      .filter((track) => {
        const haystack = `${track.title} ${track.artist} ${track.album} ${track.genre}`.toLowerCase();
        return terms.every((term) => haystack.includes(term));
      })
      .map((track) => structuredClone(track));
  }

  createPlaylist(name: string): Playlist {
    const value = name.trim();
    if (!value) throw new Error("a playlist needs a name");
    const playlist: Playlist = { id: newId("playlist"), name: value, trackIds: [], createdAt: nowIso(this.clock) };
    this.playlists.set(playlist.id, playlist);
    return structuredClone(playlist);
  }

  addToPlaylist(playlistId: string, trackId: string): Playlist {
    const playlist = this.requirePlaylist(playlistId);
    if (!this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
    if (playlist.trackIds.includes(trackId)) return structuredClone(playlist);
    const updated: Playlist = { ...playlist, trackIds: [...playlist.trackIds, trackId] };
    this.playlists.set(playlistId, updated);
    return structuredClone(updated);
  }

  removeFromPlaylist(playlistId: string, trackId: string): Playlist {
    const playlist = this.requirePlaylist(playlistId);
    const updated: Playlist = { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) };
    this.playlists.set(playlistId, updated);
    return structuredClone(updated);
  }

  playlist(playlistId: string): Playlist | undefined {
    const playlist = this.playlists.get(playlistId);
    return playlist ? structuredClone(playlist) : undefined;
  }

  queueTracks(trackIds: string[]): string[] {
    for (const trackId of trackIds) if (!this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
    this.queue = [...trackIds];
    this.index = -1;
    this.playing = false;
    this.positionMs = 0;
    return [...this.queue];
  }

  play(trackId?: string): Track {
    if (trackId) {
      if (!this.tracks.has(trackId)) throw new Error(`no track: ${trackId}`);
      const existing = this.queue.indexOf(trackId);
      if (existing === -1) this.queue.push(trackId);
      this.index = this.queue.indexOf(trackId);
      this.positionMs = 0;
    }
    if (this.index < 0) {
      if (this.queue.length === 0) throw new Error("the queue is empty");
      this.index = 0;
    }
    this.playing = true;
    const track = this.tracks.get(this.queue[this.index]!);
    if (!track) throw new Error("the queue references a missing track");
    return structuredClone(track);
  }

  pause(): void {
    this.playing = false;
  }

  next(): Track | undefined {
    if (this.index + 1 >= this.queue.length) return undefined;
    this.index += 1;
    this.positionMs = 0;
    const track = this.tracks.get(this.queue[this.index]!);
    return track ? structuredClone(track) : undefined;
  }

  previous(): Track | undefined {
    if (this.index <= 0) return undefined;
    this.index -= 1;
    this.positionMs = 0;
    const track = this.tracks.get(this.queue[this.index]!);
    return track ? structuredClone(track) : undefined;
  }

  seek(positionMs: number): void {
    const track = this.current();
    if (!track) throw new Error("nothing is playing");
    if (!Number.isInteger(positionMs) || positionMs < 0 || positionMs > track.durationMs) {
      throw new Error("the seek position is outside the track");
    }
    this.positionMs = positionMs;
  }

  current(): Track | undefined {
    const trackId = this.queue[this.index];
    return trackId ? this.track(trackId) : undefined;
  }

  state(): { playing: boolean; positionMs: number; index: number; queue: string[] } {
    return { playing: this.playing, positionMs: this.positionMs, index: this.index, queue: [...this.queue] };
  }

  /** A deterministic shuffle; the same seed gives the same order. */
  shuffle(seed = 1): string[] {
    const queue = [...this.queue];
    let state = seed >>> 0;
    for (let index = queue.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const swap = state % (index + 1);
      [queue[index], queue[swap]] = [queue[swap]!, queue[index]!];
    }
    this.queue = queue;
    this.index = -1;
    return [...queue];
  }

  private requirePlaylist(playlistId: string): Playlist {
    const playlist = this.playlists.get(playlistId);
    if (!playlist) throw new Error(`no playlist: ${playlistId}`);
    return playlist;
  }
}

export class VideoLibrary {
  private readonly videos = new Map<string, Video>();

  add(input: Omit<Video, "id">): Video {
    assertDuration(input.durationMs, "a video duration");
    if (!input.title.trim()) throw new Error("a video needs a title");
    const video: Video = {
      ...input,
      id: newId("video"),
      title: input.title.trim(),
      subtitles: input.subtitles.map((track) => ({
        lang: track.lang.trim().toLowerCase(),
        cues: track.cues.map((cue) => {
          assertDuration(cue.startMs, "a cue start");
          assertDuration(cue.endMs, "a cue end");
          if (cue.endMs < cue.startMs) throw new Error("a cue ends before it starts");
          return { ...cue };
        }),
      })),
    };
    this.videos.set(video.id, video);
    return structuredClone(video);
  }

  get(videoId: string): Video | undefined {
    const video = this.videos.get(videoId);
    return video ? structuredClone(video) : undefined;
  }

  setTrim(videoId: string, startMs: number, endMs: number): Video {
    const video = this.require(videoId);
    assertDuration(startMs, "a trim start");
    assertDuration(endMs, "a trim end");
    if (startMs >= endMs) throw new Error("a trim must have a positive length");
    if (endMs > video.durationMs) throw new Error("a trim exceeds the video duration");
    const updated: Video = { ...video, trim: { startMs, endMs } };
    this.videos.set(videoId, updated);
    return structuredClone(updated);
  }

  clearTrim(videoId: string): Video {
    const video = this.require(videoId);
    const updated: Video = { ...video, trim: undefined };
    this.videos.set(videoId, updated);
    return structuredClone(updated);
  }

  subtitlesAt(videoId: string, timeMs: number, lang?: string): string[] {
    const video = this.require(videoId);
    const tracks = lang ? video.subtitles.filter((track) => track.lang === lang.toLowerCase()) : video.subtitles;
    return tracks.flatMap((track) =>
      track.cues.filter((cue) => timeMs >= cue.startMs && timeMs <= cue.endMs).map((cue) => cue.text),
    );
  }

  private require(videoId: string): Video {
    const video = this.videos.get(videoId);
    if (!video) throw new Error(`no video: ${videoId}`);
    return video;
  }
}
