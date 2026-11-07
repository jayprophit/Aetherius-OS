import { describe, it } from "node:test";
import assert from "node:assert";
import { Camera } from "../src/domain.ts";

describe("Camera", () => {
  it("captures a photo with default dimensions", () => {
    const camera = new Camera();
    const photo = camera.capture();
    assert.equal(photo.width, 1920);
    assert.equal(photo.height, 1080);
    assert.ok(photo.dataUrl.startsWith("data:image/png;base64,"));
  });

  it("captures a photo with custom dimensions", () => {
    const camera = new Camera();
    const photo = camera.capture(800, 600);
    assert.equal(photo.width, 800);
    assert.equal(photo.height, 600);
  });

  it("rejects invalid dimensions", () => {
    const camera = new Camera();
    assert.throws(() => camera.capture(0, 100), /invalid dimensions/);
    assert.throws(() => camera.capture(100, -1), /invalid dimensions/);
  });
});
