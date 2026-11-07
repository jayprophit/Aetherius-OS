import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { MediaPlayer } from "../src/domain.ts";

const CLOCK = () => new Date("2026-11-07T12:00:00.000Z");

describe("MediaPlayer", () => {
  it("adds tracks, builds playlists and plays the queue", () => {
    const player = new MediaPlayer({ clock: CLOCK });
    const first = player.addTrack({ title: "Song One", artist: "A", durationSeconds: 200, source: "file:///one.mp3" });
    const second = player.addTrack({ title: "Song Two", artist: "B", durationSeconds: 180, source: "file:///two.mp3" });
    const playlist = player.createPlaylist("Morning");
    player.addToPlaylist(playlist.id, first.id);
    player.addToPlaylist(playlist.id, second.id);
    assert.deepEqual(player.playlist(playlist.id).trackIds, [first.id, second.id]);

    player.enqueue([first.id, second.id]);
    assert.equal(player.play(), first.id);
    assert.equal(player.status().state, "playing");
    assert.equal(player.next(), second.id);
    player.pause();
    assert.equal(player.status().state, "paused");
    assert.equal(player.seek(30), 30);
  });

  it("validates tracks instead of storing junk", () => {
    const player = new MediaPlayer({ clock: CLOCK });
    assert.throws(() => player.addTrack({ title: "", durationSeconds: 10, source: "x" }), /needs a title/);
    assert.throws(() => player.addTrack({ title: "x", durationSeconds: -1, source: "x" }), /positive number/);
    assert.throws(() => player.addTrack({ title: "x", durationSeconds: 10, source: "" }), /needs a source/);
    assert.throws(() => player.play(), /nothing to play/);
    assert.throws(() => player.pause(), /nothing is playing/);
  });

  it("respects repeat modes and stops at the end", () => {
    const player = new MediaPlayer({ clock: CLOCK });
    const only = player.addTrack({ title: "Only", durationSeconds: 60, source: "file:///only.mp3" });
    player.enqueue([only.id]);
    player.play();
    assert.equal(player.next(), null);
    assert.equal(player.status().state, "stopped");

    player.setRepeat("all");
    player.play();
    assert.equal(player.next(), only.id);
    assert.throws(() => player.setRepeat("forever" as never), /repeat must be/);
  });
});
