import { describe, it } from "node:test";
import assert from "node:assert";
import { SearchService } from "../src/domain.ts";

describe("SearchService", () => {
  it("indexes and searches documents", () => {
    const search = new SearchService();
    search.indexDocument("1", "Hello World", "A greeting");
    const result = search.search("Hello");
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0].title, "Hello World");
  });

  it("returns empty results for no matches", () => {
    const search = new SearchService();
    search.indexDocument("1", "Hello", "Greeting");
    const result = search.search("Goodbye");
    assert.equal(result.results.length, 0);
  });
});
