import { describe, it } from "node:test";
import assert from "node:assert";
import { SafetyService } from "../src/domain.ts";

describe("SafetyService", () => {
  it("adds emergency contacts", () => {
    const safety = new SafetyService();
    const contact = safety.addContact({ name: "Mom", phone: "555-0000", relationship: "family" });
    assert.equal(safety.listContacts().length, 1);
    assert.equal(contact.relationship, "family");
  });
});
