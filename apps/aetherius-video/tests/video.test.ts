import { describe, it } from "node:test";
import assert from "node:assert";
import { VideoLibrary, VideoPlayer } from "../src/domain.ts";

describe("VideoLibrary and VideoPlayer", () => {
  it("adds and lists videos", () => {
    const lib = new VideoLibrary();
    const video = lib.add({ title: "Movie", durationSec: 3600, format: "mp4" });
    assert.equal(lib.list().length, 1);
    assert.equal(video.format, "mp4");
  });

  it("opens, plays, pauses and seeks", () => {
    const lib = new VideoLibrary();
    const video = lib.add({ title: "Movie", durationSec: 3600, format: "mp4" });
    const player = new VideoPlayer();
    const state = player.open(video.id);
    assert.equal(state.playing, false);
    player.play();
    assert.equal(state.playing, true);
    player.pause();
    assert.equal(state.playing, false);
    player.seek(120);
    assert.equal(state.positionSec, 120);
  });

  it("throws when no video is open", () => {
    const player = new VideoPlayer();
    assert.throws(() => player.play(), /no video open/);
    assert.throws(() => player.pause(), /no video open/);
    assert.throws(() => player.seek(10), /no video open/);
  });

  it("rejects negative seek", () => {
    const lib = new VideoLibrary();
    const video = lib.add({ title: "Movie", durationSec: 3600, format: "mp4" });
    const player = new VideoPlayer();
    player.open(video.id);
    assert.throws(() => player.seek(-1), /position must be non-negative/);
  });
});
