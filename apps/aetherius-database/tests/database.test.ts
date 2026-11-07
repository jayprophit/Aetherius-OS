import { describe, it } from "node:test";
import assert from "node:assert";
import { Database } from "../src/domain.ts";

describe("Database", () => {
  it("creates and lists tables", () => {
    const db = new Database();
    const table = db.createTable("users", ["id", "name", "email"]);
    assert.equal(table.columns.length, 3);
    assert.equal(db.listTables().length, 1);
  });
});
