# Sovereign Financial OS

The sovereign financial operating system: a double-entry ledger, invoices, tax, budgets, reconciliation, risk limits, reversals and an audit trail.

**Genesis layer:** This is one of Genesis’s capital-management functions within Aetherius OS — not a standalone public consumer app. Genesis accesses it through `genesis-layer/src/financial-trading-layer.ts`. Money is held in integer minor units.

**Built:** the financial core and its tests. **Not built:** the user interface, durable database adapters and any live bank, card or exchange connection.

## What is built

- Double-entry posting that refuses an unbalanced entry.
- A trial balance, profit and loss and a balance sheet derived from the ledger.
- Invoices with tax and payment settlement; payments are idempotent and cannot exceed the outstanding amount.
- Budgets, reconciliation, risk checks and reversals.
- A hash-chained audit trail through the shared `app-kit` ledger.
- **Durable persistence adapter** (`src/persistence.ts`): file-backed JSON storage with line-level persistence.
- **Interface module** (`src/interface.ts`): durable `FinancialService` exposing ledger, invoice and audit endpoints.

## What is not built / out of scope

- No live bank, card or exchange adapter. All balances and settlements are internal records.
- No desktop/mobile UI framework routes (provided by platform UI layer).
- No regulatory certification, audit opinion or tax filing capability is claimed.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Honest limits

There is no live bank, card or exchange adapter. All balances and settlements are internal records. No regulatory certification, audit opinion or tax filing capability is claimed.
