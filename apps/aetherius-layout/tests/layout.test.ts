import { describe, it } from "node:test";
import assert from "node:assert";
import { Layout } from "../src/domain.ts";

describe("Layout", () => {
  it("creates and lists pages", () => {
    const layout = new Layout();
    const page = layout.create("Flyer", "A4", ["title", "image", "text"]);
    assert.equal(page.template, "A4");
    assert.equal(layout.list().length, 1);
  });
});
