import { describe, it } from "node:test";
import assert from "node:assert";
import { Design } from "../src/domain.ts";

describe("Design", () => {
  it("creates and lists design projects", () => {
    const design = new Design();
    const project = design.create("Homepage", ["header", "hero", "footer"]);
    assert.equal(project.components.length, 3);
    assert.equal(design.list().length, 1);
  });
});
