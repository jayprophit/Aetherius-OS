import { describe, it } from "node:test";
import assert from "node:assert";
import { Accessible } from "../src/domain.ts";

describe("Accessible", () => {
  it("creates and lists profiles", () => {
    const accessible = new Accessible();
    const profile = accessible.create("Default", true, false);
    assert.equal(profile.screenReader, true);
    assert.equal(accessible.list().length, 1);
  });
});
