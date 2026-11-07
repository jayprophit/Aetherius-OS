import { describe, it } from "node:test";
import assert from "node:assert";
import { Source } from "../src/domain.ts";

describe("Source", () => {
  it("adds repositories and commits", () => {
    const source = new Source();
    const repo = source.addRepository("my-app", "https://github.com/user/my-app", "main");
    const commit = source.commit(repo.id, "Initial commit", "Alice");
    assert.equal(commit.author, "Alice");
    assert.equal(source.listRepositories().length, 1);
  });
});
