import { test } from "node:test";
import assert from "node:assert/strict";

import { EventLedger, MemoryRepository, money, parseMoney } from "../../app-kit/src/index.ts";
import {
  SovereignFinanceService,
  createSovereignFinance,
  seedChart,
  type Account,
} from "../src/finance.ts";

function setup() {
  const ledger = new EventLedger();
  const finance = new SovereignFinanceService(
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
    { ledger },
  );
  const chart = seedChart(finance);
  return { finance, chart, ledger };
}

function invoiceInput(chart: Record<string, Account>, overrides: Record<string, unknown> = {}) {
  return {
    number: "INV-001",
    customer: "Acme Ltd",
    issueDate: "2026-10-01",
    dueDate: "2026-10-31",
    lines: [{ description: "Consulting", quantity: 1, unitPrice: parseMoney("100.00"), taxRate: 0.1 }],
    receivableAccountId: chart.receivable!.id,
    revenueAccountId: chart.revenue!.id,
    taxAccountId: chart.tax!.id,
    ...overrides,
  };
}

test("an unbalanced entry is refused", () => {
  const { finance, chart } = setup();
  assert.throws(
    () =>
      finance.postEntry({
        date: "2026-10-01",
        memo: "broken",
        lines: [
          { accountId: chart.bank!.id, side: "debit", amount: parseMoney("10.00") },
          { accountId: chart.revenue!.id, side: "credit", amount: parseMoney("9.00") },
        ],
      }),
    /unbalanced/,
  );
});

test("a balanced entry posts and the trial balance balances", () => {
  const { finance, chart } = setup();
  finance.postEntry({
    date: "2026-10-01",
    memo: "Owner investment",
    lines: [
      { accountId: chart.bank!.id, side: "debit", amount: parseMoney("500.00") },
      { accountId: chart.equity!.id, side: "credit", amount: parseMoney("500.00") },
    ],
  });
  assert.equal(finance.rawBalance(chart.bank!.id).amount, 50000);
  assert.equal(finance.naturalBalance(chart.equity!.id).amount, 50000);
  const trial = finance.trialBalance();
  assert.equal(trial.balanced, true);
  assert.equal(trial.totalDebit.amount, trial.totalCredit.amount);
});

test("profit and loss and the balance sheet agree with the ledger", () => {
  const { finance, chart } = setup();
  finance.postEntry({
    date: "2026-10-01",
    memo: "Sale",
    lines: [
      { accountId: chart.bank!.id, side: "debit", amount: parseMoney("1000.00") },
      { accountId: chart.revenue!.id, side: "credit", amount: parseMoney("1000.00") },
    ],
  });
  finance.postEntry({
    date: "2026-10-02",
    memo: "Hosting",
    lines: [
      { accountId: chart.expenses!.id, side: "debit", amount: parseMoney("200.00") },
      { accountId: chart.bank!.id, side: "credit", amount: parseMoney("200.00") },
    ],
  });
  const pnl = finance.profitAndLoss("2026-10-01", "2026-10-31");
  assert.equal(pnl.income.amount, 100000);
  assert.equal(pnl.expenses.amount, 20000);
  assert.equal(pnl.net.amount, 80000);
  const sheet = finance.balanceSheet("2026-10-31");
  assert.equal(sheet.assets.amount, 80000);
  assert.equal(sheet.retainedEarnings.amount, 80000);
  assert.equal(sheet.balanced, true);
});

test("an invoice posts receivable, revenue and tax, and payment settles it", () => {
  const { finance, chart } = setup();
  const invoice = finance.createInvoice(invoiceInput(chart));
  assert.equal(invoice.net.amount, 10000);
  assert.equal(invoice.tax.amount, 1000);
  assert.equal(invoice.gross.amount, 11000);

  const issued = finance.issueInvoice(invoice.id, "billing");
  assert.equal(issued.status, "issued");
  assert.equal(finance.naturalBalance(chart.receivable!.id).amount, 11000);
  assert.equal(finance.naturalBalance(chart.revenue!.id).amount, 10000);
  assert.equal(finance.naturalBalance(chart.tax!.id).amount, 1000);

  const paid = finance.recordPayment(invoice.id, {
    amount: parseMoney("110.00"),
    date: "2026-10-15",
    key: "bank-ref-1",
    bankAccountId: chart.bank!.id,
  });
  assert.equal(paid.status, "paid");
  assert.equal(finance.naturalBalance(chart.bank!.id).amount, 11000);
  assert.equal(finance.naturalBalance(chart.receivable!.id).amount, 0);
  assert.equal(finance.trialBalance().balanced, true);
});

test("a payment is idempotent and cannot exceed the outstanding amount", () => {
  const { finance, chart } = setup();
  const invoice = finance.createInvoice(invoiceInput(chart));
  finance.issueInvoice(invoice.id, "billing");
  const first = finance.recordPayment(invoice.id, {
    amount: parseMoney("50.00"),
    date: "2026-10-10",
    key: "same-key",
    bankAccountId: chart.bank!.id,
  });
  assert.equal(first.status, "part_paid");
  const second = finance.recordPayment(invoice.id, {
    amount: parseMoney("50.00"),
    date: "2026-10-10",
    key: "same-key",
    bankAccountId: chart.bank!.id,
  });
  assert.equal(second.paid.amount, 5000);
  assert.throws(
    () =>
      finance.recordPayment(invoice.id, {
        amount: parseMoney("100.00"),
        date: "2026-10-11",
        key: "too-much",
        bankAccountId: chart.bank!.id,
      }),
    /exceed/,
  );
});

test("ageing places an overdue balance in the right bucket", () => {
  const { finance, chart } = setup();
  const invoice = finance.createInvoice(invoiceInput(chart));
  finance.issueInvoice(invoice.id, "billing");
  finance.recordPayment(invoice.id, {
    amount: parseMoney("40.00"),
    date: "2026-10-05",
    key: "part",
    bankAccountId: chart.bank!.id,
  });
  const buckets = finance.ageing("2026-12-15");
  assert.equal(buckets.find((bucket) => bucket.label === "31-60")?.amount.amount, 7000);
  assert.equal(finance.invoiceStatus(invoice.id, "2026-12-15"), "overdue");
});

test("tax is summarised by rate for the period", () => {
  const { finance, chart } = setup();
  const invoice = finance.createInvoice(invoiceInput(chart));
  finance.issueInvoice(invoice.id, "billing");
  const summary = finance.taxSummary("2026-10-01", "2026-10-31");
  assert.deepEqual(summary.map((row) => [row.rate, row.net.amount, row.tax.amount]), [[0.1, 10000, 1000]]);
});

test("budget variance reports an overrun against real expense postings", () => {
  const { finance, chart } = setup();
  finance.setBudget({
    category: "marketing",
    periodStart: "2026-10-01",
    periodEnd: "2026-10-31",
    limit: parseMoney("400.00"),
  });
  finance.postEntry({
    date: "2026-10-12",
    memo: "Advert",
    lines: [
      { accountId: chart.expenses!.id, side: "debit", amount: parseMoney("500.00"), category: "marketing" },
      { accountId: chart.bank!.id, side: "credit", amount: parseMoney("500.00") },
    ],
  });
  const variance = finance.budgetVariance("marketing", "2026-10-01", "2026-10-31");
  assert.equal(variance.actual.amount, 50000);
  assert.equal(variance.remaining.amount, -10000);
  assert.equal(variance.overBudget, true);
});

test("bank reconciliation matches once and refuses a second match", () => {
  const { finance, chart } = setup();
  const invoice = finance.createInvoice(invoiceInput(chart));
  finance.issueInvoice(invoice.id, "billing");
  finance.recordPayment(invoice.id, {
    amount: parseMoney("110.00"),
    date: "2026-10-15",
    key: "bank-ref-1",
    bankAccountId: chart.bank!.id,
  });
  const paymentEntry = finance.entriesFor(chart.bank!.id).find((entry) => entry.source === "payment")!;
  const bankTx = finance.importBankTransaction({
    externalId: "tx-1",
    date: "2026-10-15",
    amount: parseMoney("110.00"),
    reference: "INV-001",
  });
  assert.equal(finance.unmatchedBankTransactions().length, 1);
  const matched = finance.matchBankTransaction(bankTx.id, paymentEntry.id, chart.bank!.id, "accountant");
  assert.equal(matched.matchedEntryId, paymentEntry.id);
  assert.equal(finance.unmatchedBankTransactions().length, 0);
  assert.throws(
    () => finance.matchBankTransaction(bankTx.id, paymentEntry.id, chart.bank!.id, "accountant"),
    /already matched/,
  );
});

test("customer concentration and invoice risk raise explainable warnings", () => {
  const { finance, chart } = setup();
  const big = finance.createInvoice(invoiceInput(chart, { number: "INV-A", customer: "Acme Ltd" }));
  const small = finance.createInvoice(
    invoiceInput(chart, {
      number: "INV-B",
      customer: "Beta Ltd",
      lines: [{ description: "Support", quantity: 1, unitPrice: parseMoney("25.00"), taxRate: 0.1 }],
    }),
  );
  finance.issueInvoice(big.id, "billing");
  finance.issueInvoice(small.id, "billing");
  const concentration = finance.customerConcentration("Acme Ltd", "2026-10-01", "2026-10-31");
  assert.ok(concentration.share > 0.7);
  assert.equal(concentration.warning?.code, "RISK-CONCENTRATION");
  const warnings = finance.invoiceRisk(big.id, "2026-12-01", parseMoney("100.00"));
  assert.ok(warnings.some((warning) => warning.code === "RISK-OVERDUE"));
  assert.ok(warnings.some((warning) => warning.code === "RISK-HIGH-VALUE"));
});

test("currency mismatches and archived accounts are refused", () => {
  const { finance, chart } = setup();
  const eur = finance.createAccount({ code: "1010", name: "Euro bank", type: "asset", currency: "EUR" });
  assert.throws(
    () =>
      finance.postEntry({
        date: "2026-10-01",
        memo: "wrong currency",
        lines: [
          { accountId: eur.id, side: "debit", amount: money(100, "USD") },
          { accountId: chart.equity!.id, side: "credit", amount: money(100, "USD") },
        ],
      }),
    /does not match/,
  );
  finance.archiveAccount(chart.bank!.id, "admin");
  assert.throws(
    () =>
      finance.postEntry({
        date: "2026-10-01",
        memo: "archived",
        lines: [
          { accountId: chart.bank!.id, side: "debit", amount: parseMoney("1.00") },
          { accountId: chart.equity!.id, side: "credit", amount: parseMoney("1.00") },
        ],
      }),
    /archived/,
  );
});

test("every posting is on a verifiable audit chain", () => {
  const { finance, chart, ledger } = setup();
  finance.postEntry({
    date: "2026-10-01",
    memo: "Owner investment",
    lines: [
      { accountId: chart.bank!.id, side: "debit", amount: parseMoney("10.00") },
      { accountId: chart.equity!.id, side: "credit", amount: parseMoney("10.00") },
    ],
  });
  assert.equal(ledger.ofType("finance.entry.posted").length, 1);
  assert.deepEqual(EventLedger.verify(ledger.all()), { ok: true });
});

test("a reversal restores the prior balances", () => {
  const { finance, chart } = setup();
  const entry = finance.postEntry({
    date: "2026-10-01",
    memo: "Mistake",
    lines: [
      { accountId: chart.bank!.id, side: "debit", amount: parseMoney("10.00") },
      { accountId: chart.revenue!.id, side: "credit", amount: parseMoney("10.00") },
    ],
  });
  assert.equal(finance.naturalBalance(chart.bank!.id).amount, 1000);
  finance.reverseEntry(entry.id, "accountant", "Reversal");
  assert.equal(finance.naturalBalance(chart.bank!.id).amount, 0);
  assert.equal(finance.naturalBalance(chart.revenue!.id).amount, 0);
});

test("the empty factory has no chart until one is seeded", () => {
  const finance = createSovereignFinance();
  assert.equal(finance.trialBalance().rows.length, 0);
  assert.equal(finance.trialBalance().balanced, true);
});
