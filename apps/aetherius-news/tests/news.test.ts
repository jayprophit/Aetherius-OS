import { describe, it } from "node:test";
import assert from "node:assert";
import { NewsService } from "../src/domain.ts";

describe("NewsService", () => {
  it("adds and lists news", () => {
    const news = new NewsService();
    const item = news.add({ title: "Update", source: "Blog", summary: "New features" });
    assert.equal(news.list().length, 1);
    assert.equal(item.source, "Blog");
  });
});
