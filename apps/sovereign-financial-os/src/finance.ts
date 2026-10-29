import {
  EventLedger,
  MemoryRepository,
  addMoney,
  assertSameCurrency,
  money,
  newId,
  nowIso,
  parseMoney,
  subtractMoney,
  sumMoney,
} from "../../app-kit/src/index.ts";
import type { Money, Repository } from "../../app-kit/src/index.ts";

/**
 * Sovereign Financial OS domain slice.
 *
 * The accounting core is a real double-entry ledger: every posting has at
 * least two lines, debits equal credits, and an unbalanced entry is refused.
 * Invoices, tax, budgets, reconciliation and risk are built on that ledger
 * rather than beside it, so a report and the audit trail cannot disagree.
 *
 * The mobile directory in this project is recovered design material; this
 * slice is the first executable finance core, not a claim that the mobile app
 * or the HMRC integration is finished.
 */

export type AccountType = "asset" | "liability" | "equity" | "income" | "expense";
export type Side = "debit" | "credit";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  currency: string;
  parentId: string | null;
  archived: boolean;
}

export interface JournalLine {
  accountId: string;
  side: Side;
  amount: Money;
  category?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  memo: string;
  lines: JournalLine[];
  source: string;
  postedAt: string;
  reversalOf: string | null;
}

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: Money;
  taxRate: number;
}

export interface Invoice {
  id: string;
  number: string;
  customer: string;
  issueDate: string;
  dueDate: string;
  lines: InvoiceLine[];
  net: Money;
  tax: Money;
  gross: Money;
  paid: Money;
  status: "draft" | "issued" | "part_paid" | "paid" | "void";
  journalEntryId: string | null;
  receivableAccountId: string;
  revenueAccountId: string;
  taxAccountId: string;
  payments: { id: string; amount: Money; date: string; key: string }[];
}

export interface Budget {
  id: string;
  category: string;
  periodStart: string;
  periodEnd: string;
  limit: Money;
}

export interface BankTransaction {
  id: string;
  externalId: string;
  date: string;
  amount: Money;
  reference: string;
  matchedEntryId: string | null;
}

export interface TrialBalanceRow {
  accountId: string;
  code: string;
  name: string;
  type: AccountType;
  debit: Money;
  credit: Money;
}

export interface TrialBalance {
  rows: TrialBalanceRow[];
  totalDebit: Money;
  totalCredit: Money;
  balanced: boolean;
}

export interface ProfitAndLoss {
  from: string;
  to: string;
  income: Money;
  expenses: Money;
  net: Money;
  currency: string;
}

export interface BalanceSheet {
  asOf: string;
  assets: Money;
  liabilities: Money;
  equity: Money;
  retainedEarnings: Money;
  balanced: boolean;
  currency: string;
}

export interface AgeingBucket {
  label: "current" | "1-30" | "31-60" | "61-90" | "90+";
  amount: Money;
}

export interface RiskWarning {
  code: string;
  severity: "info" | "warning" | "high";
  message: string;
}

const CURRENCY = "USD";

function isoDate(value: string, field: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${field} must be an ISO date: ${value}`);
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) throw new Error(`${field} is not a real date: ${value}`);
  return value;
}

function positive(value: Money, field: string): Money {
  if (value.amount <= 0) throw new Error(`${field} must be positive`);
  return value;
}

function naturalSign(type: AccountType): 1 | -1 {
  return type === "asset" || type === "expense" ? 1 : -1;
}

export class SovereignFinanceService {
  private readonly accounts: Repository<Account>;
  private readonly entries: Repository<JournalEntry>;
  private readonly invoices: Repository<Invoice>;
  private readonly budgets: Repository<Budget>;
  private readonly bank: Repository<BankTransaction>;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(
    accounts: Repository<Account>,
    entries: Repository<JournalEntry>,
    invoices: Repository<Invoice>,
    budgets: Repository<Budget>,
    bank: Repository<BankTransaction>,
    options: { ledger?: EventLedger; clock?: () => Date } = {},
  ) {
    this.accounts = accounts;
    this.entries = entries;
    this.invoices = invoices;
    this.budgets = budgets;
    this.bank = bank;
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createAccount(input: {
    code: string;
    name: string;
    type: AccountType;
    currency?: string;
    parentId?: string | null;
  }): Account {
    if (!/^[0-9]{3,6}$/.test(input.code)) throw new Error(`account code must be 3-6 digits: ${input.code}`);
    if (!input.name.trim()) throw new Error("an account needs a name");
    if (this.accounts.all().some((account) => account.code === input.code)) {
      throw new Error(`account code is already used: ${input.code}`);
    }
    const account: Account = {
      id: newId("acc"),
      code: input.code,
      name: input.name.trim(),
      type: input.type,
      currency: (input.currency ?? CURRENCY).toUpperCase(),
      parentId: input.parentId ?? null,
      archived: false,
    };
    if (account.parentId && !this.accounts.get(account.parentId)) {
      throw new Error(`parent account does not exist: ${account.parentId}`);
    }
    this.accounts.put(account);
    this.ledger.append({ type: "finance.account.created", actor: "system", subject: account.id, data: { code: account.code } });
    return structuredClone(account);
  }

  archiveAccount(accountId: string, actor: string): Account {
    const account = this.requireAccount(accountId);
    account.archived = true;
    this.accounts.put(account);
    this.ledger.append({ type: "finance.account.archived", actor, subject: account.id, data: { code: account.code } });
    return structuredClone(account);
  }

  account(accountId: string): Account | undefined {
    const account = this.accounts.get(accountId);
    return account ? structuredClone(account) : undefined;
  }

  accountByCode(code: string): Account | undefined {
    const account = this.accounts.all().find((candidate) => candidate.code === code);
    return account ? structuredClone(account) : undefined;
  }

  postEntry(input: {
    date: string;
    memo: string;
    lines: JournalLine[];
    source?: string;
    reversalOf?: string | null;
  }): JournalEntry {
    const date = isoDate(input.date, "date");
    if (!input.memo.trim()) throw new Error("a journal entry needs a memo");
    if (input.lines.length < 2) throw new Error("double entry needs at least two lines");
    const lines = input.lines.map((line) => {
      const account = this.requireAccount(line.accountId);
      if (account.archived) throw new Error(`account is archived: ${account.code}`);
      if (line.amount.currency !== account.currency) {
        throw new Error(`line currency ${line.amount.currency} does not match account ${account.code}`);
      }
      positive(line.amount, "a journal line amount");
      return { ...line, amount: { ...line.amount } };
    });
    const currency = lines[0]!.amount.currency;
    for (const line of lines) assertSameCurrency(lines[0]!.amount, line.amount);

    const debits = sumMoney(lines.filter((line) => line.side === "debit").map((line) => line.amount), currency);
    const credits = sumMoney(lines.filter((line) => line.side === "credit").map((line) => line.amount), currency);
    if (debits.amount !== credits.amount) {
      throw new Error(`entry is unbalanced: debits ${debits.amount} != credits ${credits.amount}`);
    }

    const entry: JournalEntry = {
      id: newId("jrn"),
      date,
      memo: input.memo.trim(),
      lines,
      source: input.source?.trim() || "manual",
      postedAt: nowIso(this.clock),
      reversalOf: input.reversalOf ?? null,
    };
    this.entries.put(entry);
    this.ledger.append({
      type: "finance.entry.posted",
      actor: entry.source,
      subject: entry.id,
      data: { date, debit: debits.amount, credit: credits.amount, lines: lines.length },
    });
    return structuredClone(entry);
  }

  reverseEntry(entryId: string, actor: string, memo: string): JournalEntry {
    const original = this.entries.get(entryId);
    if (!original) throw new Error(`no journal entry: ${entryId}`);
    const reversal = this.postEntry({
      date: nowIso(this.clock).slice(0, 10),
      memo: memo.trim() || `Reversal of ${entryId}`,
      lines: original.lines.map((line) => ({
        accountId: line.accountId,
        side: line.side === "debit" ? "credit" : "debit",
        amount: { ...line.amount },
        category: line.category,
      })),
      source: actor,
      reversalOf: entryId,
    });
    this.ledger.append({ type: "finance.entry.reversed", actor, subject: entryId, data: { reversal: reversal.id } });
    return reversal;
  }

  entriesFor(accountId: string): JournalEntry[] {
    return this.entries
      .all()
      .filter((entry) => entry.lines.some((line) => line.accountId === accountId))
      .sort((a, b) => a.date.localeCompare(b.date) || a.postedAt.localeCompare(b.postedAt))
      .map((entry) => structuredClone(entry));
  }

  /** Debit-positive balance, which is the sign a trial balance uses. */
  rawBalance(accountId: string, asOf?: string): Money {
    const account = this.requireAccount(accountId);
    let total = money(0, account.currency);
    for (const entry of this.entries.all()) {
      if (asOf && entry.date > asOf) continue;
      for (const line of entry.lines) {
        if (line.accountId !== accountId) continue;
        total = line.side === "debit" ? addMoney(total, line.amount) : subtractMoney(total, line.amount);
      }
    }
    return total;
  }

  /** The balance in the account's normal direction (income is credit-positive). */
  naturalBalance(accountId: string, asOf?: string): Money {
    const account = this.requireAccount(accountId);
    const raw = this.rawBalance(accountId, asOf);
    return naturalSign(account.type) === 1 ? raw : money(-raw.amount, raw.currency);
  }

  trialBalance(asOf?: string): TrialBalance {
    const rows: TrialBalanceRow[] = this.accounts.all().map((account) => {
      let debit = money(0, account.currency);
      let credit = money(0, account.currency);
      for (const entry of this.entries.all()) {
        if (asOf && entry.date > asOf) continue;
        for (const line of entry.lines) {
          if (line.accountId !== account.id) continue;
          if (line.side === "debit") debit = addMoney(debit, line.amount);
          else credit = addMoney(credit, line.amount);
        }
      }
      return { accountId: account.id, code: account.code, name: account.name, type: account.type, debit, credit };
    });
    const totalDebit = sumMoney(rows.map((row) => row.debit), CURRENCY);
    const totalCredit = sumMoney(rows.map((row) => row.credit), CURRENCY);
    return {
      rows: rows.sort((a, b) => a.code.localeCompare(b.code)),
      totalDebit,
      totalCredit,
      balanced: totalDebit.amount === totalCredit.amount,
    };
  }

  profitAndLoss(from: string, to: string): ProfitAndLoss {
    isoDate(from, "from");
    isoDate(to, "to");
    if (from > to) throw new Error("the profit-and-loss period starts after it ends");
    const income = this.typeTotal("income", from, to);
    const expenses = this.typeTotal("expense", from, to);
    return {
      from,
      to,
      income,
      expenses,
      net: subtractMoney(income, expenses),
      currency: income.currency,
    };
  }

  balanceSheet(asOf: string): BalanceSheet {
    isoDate(asOf, "asOf");
    const assets = this.typeTotal("asset", undefined, asOf);
    const liabilities = this.typeTotal("liability", undefined, asOf);
    const equity = this.typeTotal("equity", undefined, asOf);
    const retainedEarnings = subtractMoney(this.typeTotal("income", undefined, asOf), this.typeTotal("expense", undefined, asOf));
    return {
      asOf,
      assets,
      liabilities,
      equity,
      retainedEarnings,
      balanced: assets.amount === liabilities.amount + equity.amount + retainedEarnings.amount,
      currency: assets.currency,
    };
  }

  private typeTotal(type: AccountType, from?: string, to?: string): Money {
    let total = money(0, CURRENCY);
    for (const account of this.accounts.all()) {
      if (account.type !== type) continue;
      for (const entry of this.entries.all()) {
        if (from && entry.date < from) continue;
        if (to && entry.date > to) continue;
        for (const line of entry.lines) {
          if (line.accountId !== account.id) continue;
          const signed = line.side === "debit" ? line.amount : money(-line.amount.amount, line.amount.currency);
          total = addMoney(total, signed);
        }
      }
    }
    return type === "asset" || type === "expense" ? total : money(-total.amount, total.currency);
  }

  createInvoice(input: {
    number: string;
    customer: string;
    issueDate: string;
    dueDate: string;
    lines: InvoiceLine[];
    receivableAccountId: string;
    revenueAccountId: string;
    taxAccountId: string;
  }): Invoice {
    isoDate(input.issueDate, "issueDate");
    isoDate(input.dueDate, "dueDate");
    if (input.dueDate < input.issueDate) throw new Error("an invoice cannot fall due before it is issued");
    if (!input.number.trim() || !input.customer.trim()) throw new Error("an invoice needs a number and a customer");
    if (input.lines.length === 0) throw new Error("an invoice needs at least one line");
    const receivable = this.requireAccount(input.receivableAccountId);
    const revenue = this.requireAccount(input.revenueAccountId);
    const tax = this.requireAccount(input.taxAccountId);
    if (receivable.type !== "asset") throw new Error("the receivable account must be an asset");
    if (revenue.type !== "income") throw new Error("the revenue account must be income");
    if (tax.type !== "liability") throw new Error("the tax account must be a liability");
    const currency = receivable.currency;

    let net = money(0, currency);
    let taxTotal = money(0, currency);
    const lines = input.lines.map((line) => {
      if (!line.description.trim()) throw new Error("an invoice line needs a description");
      if (!Number.isFinite(line.quantity) || line.quantity <= 0) throw new Error("an invoice quantity must be positive");
      if (!Number.isFinite(line.taxRate) || line.taxRate < 0 || line.taxRate > 1) {
        throw new Error("a tax rate must be between 0 and 1");
      }
      assertSameCurrency(line.unitPrice, money(0, currency));
      positive(line.unitPrice, "an invoice unit price");
      const lineNet = money(Math.round(line.unitPrice.amount * line.quantity), currency);
      const lineTax = money(Math.round(lineNet.amount * line.taxRate), currency);
      net = addMoney(net, lineNet);
      taxTotal = addMoney(taxTotal, lineTax);
      return { ...line, unitPrice: { ...line.unitPrice } };
    });

    const invoice: Invoice = {
      id: newId("inv"),
      number: input.number.trim(),
      customer: input.customer.trim(),
      issueDate: input.issueDate,
      dueDate: input.dueDate,
      lines,
      net,
      tax: taxTotal,
      gross: addMoney(net, taxTotal),
      paid: money(0, currency),
      status: "draft",
      journalEntryId: null,
      receivableAccountId: receivable.id,
      revenueAccountId: revenue.id,
      taxAccountId: tax.id,
      payments: [],
    };
    this.invoices.put(invoice);
    this.ledger.append({ type: "finance.invoice.created", actor: "system", subject: invoice.id, data: { number: invoice.number } });
    return structuredClone(invoice);
  }

  issueInvoice(invoiceId: string, actor: string): Invoice {
    const invoice = this.requireInvoice(invoiceId);
    if (invoice.status !== "draft") throw new Error(`invoice is already ${invoice.status}`);
    const receivable = this.requireAccount(invoice.receivableAccountId);
    const revenue = this.requireAccount(invoice.revenueAccountId);
    const tax = this.requireAccount(invoice.taxAccountId);
    const lines: JournalLine[] = [
      { accountId: receivable.id, side: "debit", amount: invoice.gross },
      { accountId: revenue.id, side: "credit", amount: invoice.net },
    ];
    if (invoice.tax.amount > 0) {
      lines.push({ accountId: tax.id, side: "credit", amount: invoice.tax });
    }
    const entry = this.postEntry({
      date: invoice.issueDate,
      memo: `Invoice ${invoice.number} to ${invoice.customer}`,
      source: actor,
      lines,
    });
    invoice.status = "issued";
    invoice.journalEntryId = entry.id;
    this.invoices.put(invoice);
    this.ledger.append({ type: "finance.invoice.issued", actor, subject: invoice.id, data: { entry: entry.id, gross: invoice.gross.amount } });
    return structuredClone(invoice);
  }

  recordPayment(invoiceId: string, input: { amount: Money; date: string; key: string; bankAccountId: string }): Invoice {
    const invoice = this.requireInvoice(invoiceId);
    if (invoice.status === "draft") throw new Error("a draft invoice cannot be paid");
    if (invoice.status === "paid") return structuredClone(invoice);
    if (invoice.status === "void") throw new Error("a void invoice cannot be paid");
    if (!input.key.trim()) throw new Error("a payment needs an idempotency key");
    const existing = invoice.payments.find((payment) => payment.key === input.key);
    if (existing) return structuredClone(invoice);
    positive(input.amount, "a payment");
    assertSameCurrency(input.amount, invoice.gross);
    const outstanding = subtractMoney(invoice.gross, invoice.paid);
    if (input.amount.amount > outstanding.amount) throw new Error("a payment cannot exceed the outstanding amount");
    isoDate(input.date, "payment date");
    const bank = this.requireAccount(input.bankAccountId);
    if (bank.type !== "asset") throw new Error("the bank account must be an asset");
    const receivable = this.requireAccount(invoice.receivableAccountId);

    this.postEntry({
      date: input.date,
      memo: `Payment for invoice ${invoice.number}`,
      source: "payment",
      lines: [
        { accountId: bank.id, side: "debit", amount: input.amount },
        { accountId: receivable.id, side: "credit", amount: input.amount },
      ],
    });
    invoice.paid = addMoney(invoice.paid, input.amount);
    invoice.payments.push({ id: newId("pay"), amount: { ...input.amount }, date: input.date, key: input.key });
    invoice.status = invoice.paid.amount === invoice.gross.amount ? "paid" : "part_paid";
    this.invoices.put(invoice);
    this.ledger.append({
      type: "finance.invoice.paid",
      actor: "payment",
      subject: invoice.id,
      data: { amount: input.amount.amount, paid: invoice.paid.amount, status: invoice.status },
    });
    return structuredClone(invoice);
  }

  invoiceStatus(invoiceId: string, asOf: string): Invoice["status"] | "overdue" {
    const invoice = this.requireInvoice(invoiceId);
    if (invoice.status === "issued" || invoice.status === "part_paid") {
      if (invoice.dueDate < asOf) return "overdue";
    }
    return invoice.status;
  }

  ageing(asOf: string): AgeingBucket[] {
    isoDate(asOf, "asOf");
    const buckets: AgeingBucket[] = [
      { label: "current", amount: money(0, CURRENCY) },
      { label: "1-30", amount: money(0, CURRENCY) },
      { label: "31-60", amount: money(0, CURRENCY) },
      { label: "61-90", amount: money(0, CURRENCY) },
      { label: "90+", amount: money(0, CURRENCY) },
    ];
    for (const invoice of this.invoices.all()) {
      if (invoice.status !== "issued" && invoice.status !== "part_paid") continue;
      const outstanding = subtractMoney(invoice.gross, invoice.paid);
      if (outstanding.amount === 0) continue;
      const days = Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${invoice.dueDate}T00:00:00Z`)) / 86_400_000);
      const index = days <= 0 ? 0 : days <= 30 ? 1 : days <= 60 ? 2 : days <= 90 ? 3 : 4;
      buckets[index]!.amount = addMoney(buckets[index]!.amount, outstanding);
    }
    return buckets;
  }

  taxSummary(from: string, to: string): { rate: number; net: Money; tax: Money }[] {
    isoDate(from, "from");
    isoDate(to, "to");
    const byRate = new Map<number, { net: Money; tax: Money }>();
    for (const invoice of this.invoices.all()) {
      if (invoice.issueDate < from || invoice.issueDate > to) continue;
      if (invoice.status === "draft" || invoice.status === "void") continue;
      for (const line of invoice.lines) {
        const net = money(Math.round(line.unitPrice.amount * line.quantity), invoice.net.currency);
        const tax = money(Math.round(net.amount * line.taxRate), invoice.net.currency);
        const current = byRate.get(line.taxRate) ?? { net: money(0, invoice.net.currency), tax: money(0, invoice.net.currency) };
        byRate.set(line.taxRate, { net: addMoney(current.net, net), tax: addMoney(current.tax, tax) });
      }
    }
    return [...byRate.entries()]
      .sort(([a], [b]) => a - b)
      .map(([rate, totals]) => ({ rate, net: totals.net, tax: totals.tax }));
  }

  setBudget(input: { category: string; periodStart: string; periodEnd: string; limit: Money }): Budget {
    isoDate(input.periodStart, "periodStart");
    isoDate(input.periodEnd, "periodEnd");
    if (input.periodEnd < input.periodStart) throw new Error("a budget period ends before it starts");
    if (!input.category.trim()) throw new Error("a budget needs a category");
    positive(input.limit, "a budget limit");
    const budget: Budget = {
      id: newId("bdg"),
      category: input.category.trim().toLowerCase(),
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      limit: { ...input.limit },
    };
    this.budgets.put(budget);
    this.ledger.append({ type: "finance.budget.set", actor: "system", subject: budget.id, data: { category: budget.category } });
    return structuredClone(budget);
  }

  budgetVariance(category: string, periodStart: string, periodEnd: string): {
    budget: Budget | null;
    actual: Money;
    remaining: Money;
    overBudget: boolean;
  } {
    const budget = this.budgets
      .all()
      .find(
        (candidate) =>
          candidate.category === category.trim().toLowerCase() &&
          candidate.periodStart === periodStart &&
          candidate.periodEnd === periodEnd,
      ) ?? null;
    let actual = money(0, CURRENCY);
    for (const entry of this.entries.all()) {
      if (entry.date < periodStart || entry.date > periodEnd) continue;
      for (const line of entry.lines) {
        if (line.side !== "debit" || (line.category ?? "").toLowerCase() !== category.trim().toLowerCase()) continue;
        actual = addMoney(actual, line.amount);
      }
    }
    if (!budget) return { budget: null, actual, remaining: money(0, actual.currency), overBudget: false };
    const remaining = subtractMoney(budget.limit, actual);
    return { budget: structuredClone(budget), actual, remaining, overBudget: remaining.amount < 0 };
  }

  importBankTransaction(input: { externalId: string; date: string; amount: Money; reference: string }): BankTransaction {
    isoDate(input.date, "date");
    if (!input.externalId.trim()) throw new Error("a bank transaction needs an external id");
    if (this.bank.all().some((candidate) => candidate.externalId === input.externalId)) {
      throw new Error(`bank transaction is already imported: ${input.externalId}`);
    }
    const transaction: BankTransaction = {
      id: newId("bnk"),
      externalId: input.externalId.trim(),
      date: input.date,
      amount: { ...input.amount },
      reference: input.reference.trim(),
      matchedEntryId: null,
    };
    this.bank.put(transaction);
    this.ledger.append({ type: "finance.bank.imported", actor: "import", subject: transaction.id, data: { externalId: transaction.externalId } });
    return structuredClone(transaction);
  }

  matchBankTransaction(bankTransactionId: string, entryId: string, bankAccountId: string, actor: string): BankTransaction {
    const transaction = this.bank.get(bankTransactionId);
    if (!transaction) throw new Error(`no bank transaction: ${bankTransactionId}`);
    if (transaction.matchedEntryId) throw new Error("this bank transaction is already matched");
    const entry = this.entries.get(entryId);
    if (!entry) throw new Error(`no journal entry: ${entryId}`);
    const bank = this.requireAccount(bankAccountId);
    if (bank.type !== "asset") throw new Error("the bank account must be an asset");
    const wantedSide: Side = transaction.amount.amount >= 0 ? "debit" : "credit";
    const wanted = money(Math.abs(transaction.amount.amount), transaction.amount.currency);
    const line = entry.lines.find(
      (candidate) =>
        candidate.accountId === bank.id &&
        candidate.side === wantedSide &&
        candidate.amount.amount === wanted.amount &&
        candidate.amount.currency === wanted.currency,
    );
    if (!line) throw new Error("no matching bank line in that entry");
    transaction.matchedEntryId = entryId;
    this.bank.put(transaction);
    this.ledger.append({ type: "finance.bank.matched", actor, subject: transaction.id, data: { entry: entryId } });
    return structuredClone(transaction);
  }

  unmatchedBankTransactions(): BankTransaction[] {
    return this.bank
      .all()
      .filter((transaction) => transaction.matchedEntryId === null)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((transaction) => structuredClone(transaction));
  }

  customerConcentration(customer: string, from: string, to: string): { share: number; warning: RiskWarning | null } {
    const wanted = customer.trim().toLowerCase();
    let total = 0;
    let own = 0;
    for (const invoice of this.invoices.all()) {
      if (invoice.issueDate < from || invoice.issueDate > to) continue;
      if (invoice.status === "draft" || invoice.status === "void") continue;
      total += invoice.net.amount;
      if (invoice.customer.toLowerCase() === wanted) own += invoice.net.amount;
    }
    const share = total === 0 ? 0 : own / total;
    return {
      share,
      warning:
        share > 0.4
          ? {
              code: "RISK-CONCENTRATION",
              severity: "high",
              message: `${(share * 100).toFixed(1)}% of revenue in this period comes from ${customer}.`,
            }
          : null,
    };
  }

  invoiceRisk(invoiceId: string, asOf: string, highValueThreshold = parseMoney("10000")): RiskWarning[] {
    const invoice = this.requireInvoice(invoiceId);
    const warnings: RiskWarning[] = [];
    if (invoice.gross.amount >= highValueThreshold.amount) {
      warnings.push({ code: "RISK-HIGH-VALUE", severity: "warning", message: "Invoice is at or above the high-value threshold." });
    }
    if (this.invoiceStatus(invoiceId, asOf) === "overdue") {
      const days = Math.floor((Date.parse(`${asOf}T00:00:00Z`) - Date.parse(`${invoice.dueDate}T00:00:00Z`)) / 86_400_000);
      warnings.push({
        code: "RISK-OVERDUE",
        severity: days > 30 ? "high" : "warning",
        message: `Invoice is ${days} day(s) overdue.`,
      });
    }
    return warnings;
  }

  private requireAccount(accountId: string): Account {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error(`no account: ${accountId}`);
    return structuredClone(account);
  }

  private requireInvoice(invoiceId: string): Invoice {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`no invoice: ${invoiceId}`);
    return structuredClone(invoice);
  }
}

/** A minimal chart of accounts for the slice's tests and first-run setup. */
export function seedChart(finance: SovereignFinanceService): Record<string, Account> {
  const bank = finance.createAccount({ code: "1000", name: "Bank", type: "asset" });
  const receivable = finance.createAccount({ code: "1100", name: "Accounts receivable", type: "asset" });
  const tax = finance.createAccount({ code: "2100", name: "Tax payable", type: "liability" });
  const equity = finance.createAccount({ code: "3000", name: "Owner equity", type: "equity" });
  const revenue = finance.createAccount({ code: "4000", name: "Revenue", type: "income" });
  const expenses = finance.createAccount({ code: "5000", name: "Operating expenses", type: "expense" });
  return { bank, receivable, tax, equity, revenue, expenses };
}

export function createSovereignFinance(): SovereignFinanceService {
  return new SovereignFinanceService(
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
    new MemoryRepository(),
  );
}
