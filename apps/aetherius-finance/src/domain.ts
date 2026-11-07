import { EventLedger, newId, nowIso } from "../../app-kit/src/index.ts";

export interface Account {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface FinanceOptions {
  ledger?: EventLedger;
  clock?: () => Date;
}

export class FinanceService {
  private readonly accounts = new Map<string, Account>();
  private readonly transactions: Transaction[] = [];
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;

  constructor(options: FinanceOptions = {}) {
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
  }

  createAccount(name: string, currency = "USD"): Account {
    const account: Account = { id: newId("account"), name, balance: 0, currency };
    this.accounts.set(account.id, account);
    this.ledger.append({ type: "finance.account.created", actor: "finance", subject: account.id });
    return account;
  }

  addTransaction(accountId: string, amount: number, category: string, description: string): Transaction {
    const account = this.accounts.get(accountId);
    if (!account) throw new Error("account not found");
    const transaction: Transaction = {
      id: newId("txn"),
      accountId,
      amount,
      category,
      description,
      date: nowIso(this.clock),
    };
    this.transactions.push(transaction);
    account.balance += amount;
    this.ledger.append({ type: "finance.transaction.added", actor: "finance", subject: transaction.id });
    return transaction;
  }

  getAccount(id: string): Account | undefined {
    return this.accounts.get(id);
  }

  getTransactions(accountId?: string): Transaction[] {
    if (accountId) return this.transactions.filter((t) => t.accountId === accountId);
    return [...this.transactions];
  }
}
