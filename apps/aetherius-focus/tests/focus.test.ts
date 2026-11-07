import { describe, it } from "node:test";
import assert from "node:assert";
import { FocusService } from "../src/domain.ts";

describe("FocusService", () => {
  it("starts focus sessions", () => {
    const focus = new FocusService();
    const session = focus.start(25, ["editor"]);
    assert.equal(session.durationMin, 25);
    assert.equal(focus.list().length, 1);
  });
});
