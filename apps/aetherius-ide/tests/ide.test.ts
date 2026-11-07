import { describe, it } from "node:test";
import assert from "node:assert";
import { IDE } from "../src/domain.ts";

describe("IDE", () => {
  it("opens and lists projects", () => {
    const ide = new IDE();
    const project = ide.openProject("my-app", "typescript", ["src/index.ts"]);
    assert.equal(project.language, "typescript");
    assert.equal(ide.listProjects().length, 1);
  });
});
