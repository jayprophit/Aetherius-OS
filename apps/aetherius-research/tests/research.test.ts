import { describe, it } from "node:test";
import assert from "node:assert";
import { Research } from "../src/domain.ts";

describe("Research", () => {
  it("adds and lists sources", () => {
    const research = new Research();
    const source = research.add("Paper on Transformers", "article", "https://arxiv.org/abs/1234");
    assert.equal(source.type, "article");
    assert.equal(research.list().length, 1);
  });
});
