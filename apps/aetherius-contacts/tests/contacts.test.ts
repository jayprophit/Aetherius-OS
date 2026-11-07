import { describe, it } from "node:test";
import assert from "node:assert";
import { ContactsService } from "../src/domain.ts";

describe("ContactsService", () => {
  it("adds and searches contacts", () => {
    const contacts = new ContactsService();
    const alice = contacts.add({ firstName: "Alice", lastName: "Smith", email: "alice@example.com" });
    assert.equal(contacts.search("Alice").length, 1);
    assert.equal(contacts.get(alice.id)?.email, "alice@example.com");
  });

  it("lists all contacts", () => {
    const contacts = new ContactsService();
    contacts.add({ firstName: "Alice", lastName: "Smith", email: "alice@example.com" });
    contacts.add({ firstName: "Bob", lastName: "Jones", email: "bob@example.com" });
    assert.equal(contacts.list().length, 2);
  });
});
