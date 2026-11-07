import { describe, it } from "node:test";
import assert from "node:assert";
import { Broadcast } from "../src/domain.ts";

describe("Broadcast", () => {
  it("starts and lists streams", () => {
    const broadcast = new Broadcast();
    const stream = broadcast.start("Weekly Show", "twitch");
    assert.equal(stream.platform, "twitch");
    assert.equal(broadcast.list().length, 1);
  });
});
