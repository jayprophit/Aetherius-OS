import { describe, it } from "node:test";
import assert from "node:assert";
import { Knowledge } from "../src/domain.ts";

describe("Knowledge", () => {
  it("creates and lists pages", () => {
    const knowledge = new Knowledge();
    const page = knowledge.create("Getting Started", ["intro", "install", "usage"]);
    assert.equal(page.blocks.length, 3);
    assert.equal(knowledge.list().length, 1);
  });
});
