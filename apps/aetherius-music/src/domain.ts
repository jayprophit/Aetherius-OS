import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  durationSec: number;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
}

export interface MusicOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class MusicLibrary {
  private readonly tracks = new Map<string, Track>();
  private readonly playlists = new Map<string, Playlist>();
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: MusicOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  addTrack(track: Omit<Track, "id">): Track {
    const t: Track = { ...track, id: newId("track") };
    this.tracks.set(t.id, t);
    this.ledger.append({ type: "music.track.added", actor: "music", subject: t.id });
    return t;
  }

  getTrack(id: string): Track | undefined {
    return this.tracks.get(id);
  }

  listTracks(): Track[] {
    return Array.from(this.tracks.values());
  }

  createPlaylist(name: string): Playlist {
    const playlist: Playlist = { id: newId("pl"), name, trackIds: [] };
    this.playlists.set(playlist.id, playlist);
    this.ledger.append({ type: "music.playlist.created", actor: "music", subject: playlist.id });
    return playlist;
  }

  addToPlaylist(playlistId: string, trackId: string): void {
    const playlist = this.playlists.get(playlistId);
    const track = this.tracks.get(trackId);
    if (!playlist) throw new Error("playlist not found");
    if (!track) throw new Error("track not found");
    playlist.trackIds.push(trackId);
    this.ledger.append({ type: "music.playlist.track.added", actor: "music", subject: playlistId });
  }

  getPlaylist(id: string): Playlist | undefined {
    return this.playlists.get(id);
  }
}
