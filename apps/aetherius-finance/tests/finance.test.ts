import { describe, it } from "node:test";
import assert from "node:assert";
import { FinanceService } from "../src/domain.ts";

describe("FinanceService", () => {
  it("creates accounts and adds transactions", () => {
    const finance = new FinanceService();
    const account = finance.createAccount("Checking", "USD");
    const txn = finance.addTransaction(account.id, -50, "groceries", "Weekly shop");
    assert.equal(account.balance, -50);
    assert.equal(txn.category, "groceries");
  });

  it("throws on missing account", () => {
    const finance = new FinanceService();
    assert.throws(() => finance.addTransaction("nonexistent", 100, "income", "pay"), /account not found/);
  });

  it("lists transactions by account", () => {
    const finance = new FinanceService();
    const a = finance.createAccount("Checking");
    finance.addTransaction(a.id, 100, "income", "pay");
    finance.addTransaction(a.id, -50, "food", "lunch");
    assert.equal(finance.getTransactions(a.id).length, 2);
  });
});
