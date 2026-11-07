import { describe, it } from "node:test";
import assert from "node:assert";
import { Accounts } from "../src/domain.ts";

describe("Accounts", () => {
  it("creates and lists invoices", () => {
    const accounts = new Accounts();
    const invoice = accounts.createInvoice("Acme Corp", 1500);
    assert.equal(invoice.status, "draft");
    assert.equal(accounts.list().length, 1);
  });
});
