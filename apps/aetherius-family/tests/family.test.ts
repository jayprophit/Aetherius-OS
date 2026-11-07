import { describe, it } from "node:test";
import assert from "node:assert";
import { FamilyService } from "../src/domain.ts";

describe("FamilyService", () => {
  it("creates family profiles", () => {
    const family = new FamilyService();
    const profile = family.create("guardian", "child", ["no-games"]);
    assert.equal(profile.restrictions.length, 1);
    assert.equal(family.list().length, 1);
  });
});
