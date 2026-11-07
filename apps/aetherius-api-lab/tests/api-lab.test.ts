import { describe, it } from "node:test";
import assert from "node:assert";
import { ApiLab } from "../src/domain.ts";

describe("ApiLab", () => {
  it("creates and lists request collections", () => {
    const api = new ApiLab();
    const collection = api.createCollection("Users API", "GET", "https://api.example.com/users");
    assert.equal(collection.method, "GET");
    assert.equal(api.list().length, 1);
  });
});
