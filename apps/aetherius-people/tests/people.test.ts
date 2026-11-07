import { describe, it } from "node:test";
import assert from "node:assert";
import { People } from "../src/domain.ts";

describe("People", () => {
  it("hires and lists employees", () => {
    const people = new People();
    const employee = people.hire("Alice", "Engineer", "Engineering");
    assert.equal(employee.role, "Engineer");
    assert.equal(people.list().length, 1);
  });
});
