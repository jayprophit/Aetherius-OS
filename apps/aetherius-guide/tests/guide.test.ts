import { describe, it } from "node:test";
import assert from "node:assert";
import { GuideService } from "../src/domain.ts";

describe("GuideService", () => {
  it("adds and searches articles", () => {
    const guide = new GuideService();
    guide.add({ title: "Getting Started", content: "Welcome to Aetherius", category: "onboarding" });
    const results = guide.search("Getting");
    assert.equal(results.length, 1);
  });
});
