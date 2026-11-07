import { describe, it } from "node:test";
import assert from "node:assert";
import { MusicLibrary } from "../src/domain.ts";

describe("MusicLibrary", () => {
  it("adds and lists tracks", () => {
    const lib = new MusicLibrary();
    const track = lib.addTrack({ title: "Song", artist: "Artist", album: "Album", durationSec: 180 });
    assert.equal(lib.listTracks().length, 1);
    assert.equal(track.title, "Song");
  });

  it("creates playlists and adds tracks", () => {
    const lib = new MusicLibrary();
    const track = lib.addTrack({ title: "Song", artist: "Artist", album: "Album", durationSec: 180 });
    const pl = lib.createPlaylist("Favorites");
    lib.addToPlaylist(pl.id, track.id);
    assert.equal(pl.trackIds.length, 1);
  });

  it("throws on missing track for playlist", () => {
    const lib = new MusicLibrary();
    const pl = lib.createPlaylist("Favorites");
    assert.throws(() => lib.addToPlaylist(pl.id, "nonexistent"), /track not found/);
  });

  it("throws on missing playlist", () => {
    const lib = new MusicLibrary();
    assert.throws(() => lib.addToPlaylist("nonexistent", "track"), /playlist not found/);
  });
});
