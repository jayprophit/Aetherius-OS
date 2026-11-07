import { describe, it } from "node:test";
import assert from "node:assert";
import { PhotosService } from "../src/domain.ts";

describe("PhotosService", () => {
  it("creates albums and adds photos", () => {
    const photos = new PhotosService();
    const album = photos.createAlbum("Vacation");
    const photo = photos.addPhoto(album.id, "Beach", 1920, 1080);
    assert.equal(album.photoIds.length, 1);
    assert.equal(photo.title, "Beach");
  });

  it("throws on missing album", () => {
    const photos = new PhotosService();
    assert.throws(() => photos.addPhoto("nonexistent", "x", 100, 100), /album not found/);
  });
});
