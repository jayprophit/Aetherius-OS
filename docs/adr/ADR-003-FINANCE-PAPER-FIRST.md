# ADR-003: Finance and trading are paper-first, with a gated live mode

**Status:** accepted
**Date:** 2026-11-04
**Owner:** Jonathan (Aetherius project)
**Related:** `apps/sovereign-financial-os/`, `apps/Multi-Cross-Platform-Trading-Bot/`

## Context

The finance and trading applications are currently paper and internal-only.
`sovereign-financial-os` keeps an internal double-entry ledger and has no live
bank, card or exchange adapter. `Multi-Cross-Platform-Trading-Bot` has a paper
broker, risk limits, a kill switch and backtesting, and no live venue adapter.

The owner wants a Plus500-style product structure:

- a **demo account** that uses play money and, where licensed, live market
  data, so a user can practise and test strategies without risking money;
- a **live account** that can later connect to real venues through APIs or a
  MetaTrader bridge for fiat and cryptocurrencies;
- no live money until there is written authorisation and compliance evidence.

This ADR records that structure. It does not add a live adapter, a market-data
feed, a licence, or a regulatory permission. Those remain owner-gated.

## Decision

### 1. Three explicit modes: PAPER, DEMO and LIVE

Every finance or trading operation runs in exactly one mode. The mode is a
property of the account and the session, not a hidden configuration flag.

| Mode | Market data | Fills | Money | Ledger | Default |
|---|---|---|---|---|---|
| **PAPER** | Simulated or replayed | Simulated | None | Paper ledger | On |
| **DEMO** | Licensed live or delayed, when available; otherwise simulated | Simulated | Play money | Demo ledger | Opt-in |
| **LIVE** | Licensed live | Real venue | Real money | Live ledger | Off |

- **PAPER** is for development, tests, backtests and deterministic replay. It
  must work with no network connection and no provider account.
- **DEMO** is the Plus500-style practice account. Balances are play money.
  Fills are simulated. If licensed live or delayed data is connected, every
  quote and bar says which it is. A demo account can be reset without touching
  any other ledger.
- **LIVE** places real orders with real money. It is disabled by default, is
  not part of `0.1.0`, and cannot be enabled by configuration alone.

A single build may contain all three modes, but a live adapter is only loaded
when the live gate has passed and the owner has supplied written authorisation.

A platform transaction fee is a separate commercial decision, recorded in
`docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md`. It is never charged on PAPER or DEMO
activity, and a LIVE fee requires a licensed payment provider, reconciled
ledger, refund/dispute process and regulatory review. It is not enabled in
`0.1.0`.

### 2. Every data point carries provenance

Every quote, bar, tick, order, fill and valuation carries a provenance label:

- `LIVE_LICENSED`: real-time data used under a current licence or provider
  agreement.
- `DELAYED`: real data delivered after a stated delay. The delay is recorded.
- `SIMULATED`: generated data, including synthetic price paths.
- `REPLAY`: recorded data replayed for backtesting or demonstration.

The record also carries the source, the licence or permission reference, the
timestamp of the data, and the time it was received. A value with no
provenance is rejected by the domain layer. The user interface must show the
label next to the price and next to the mode banner; it may not present
delayed or simulated data as live execution.

This is a correctness rule, not a cosmetic one. A strategy that looks
profitable on replayed data is not evidence of live profitability, and the
product must not imply that it is.

### 3. Ledgers are separate and non-transferable

PAPER, DEMO and LIVE have separate ledgers and separate account identifiers.

- A demo balance cannot be withdrawn, transferred, converted or used as
  collateral for a live position.
- A paper result cannot settle a live obligation.
- A live ledger is created only after the live gate has passed.
- Resetting a demo account writes an audit record and does not touch paper or
  live history.
- Reports state the mode and the ledger they came from. A combined report that
  silently adds demo and live balances is a defect.

### 4. Venue access is adapter-based, least-privilege and read-only first

Future live connectivity is through adapters for documented APIs or a
MetaTrader bridge. The supported asset classes for the first live scope are
fiat and cryptocurrency. No other asset class is implied.

The adapter contract is:

- credentials come from the OS secret store or an HSM, never from the
  repository or a plain configuration file;
- the first connection to any venue is read-only: balances, positions and
  order history only;
- trading permission is a separate, explicit grant per venue and per account;
- the venue, account and instrument allowlist is explicit and empty by
  default;
- every request and response is recorded in the audit chain with the mode,
  account, instrument and provenance;
- reconciliation compares the local ledger with the venue's records and
  reports a break rather than silently adjusting a balance.

No bank, card issuer, custodian or payment processor is connected by this ADR.
Open Banking, card issuing and crypto custody remain separate owner decisions
with their own compliance work.

### 5. Live trading requires controls that have been tested, not just written

Before the first live order, all of the following must exist and be proven:

- a written authorisation record naming the legal entity, the venue, the
  account, the permitted instruments, the maximum order size, the maximum
  daily loss and the person authorised to stop trading;
- a tested manual kill switch and a tested automatic kill switch triggered by
  the daily-loss limit;
- per-order, per-instrument and per-day exposure limits;
- idempotent client order identifiers, so a retry cannot double-fill;
- a dry-run or canary mode with a small, explicit limit before normal size;
- monitoring and an incident procedure with a named contact;
- a reconciliation report that is reviewed before size is increased;
- a rollback plan that returns the account to read-only or disabled state.

A kill switch that has only been unit-tested against a mock venue is not
enough. The live gate requires evidence against the real venue's sandbox or a
recorded production drill.

### 6. The live gate is a compliance gate, not an engineering checklist

Live money remains disabled until the owner supplies evidence for the
following. This list is the same one recorded in
`docs/OWNER-REQUIRED-INPUTS.md`, and it is deliberately fail-closed.

| Item | Evidence required |
|---|---|
| Regulatory status or licence | FCA authorisation, EMI/PI licence, or a partnered regulated entity with a written agreement |
| Open Banking provider | Provider contract, credentials and a consent flow, if bank access is in scope |
| Card issuing or processing | Stripe Issuing, Adyen or Marqeta agreement; sandbox evidence before production |
| Brokerage or exchange APIs | Venue agreement, API keys, permissions and rate limits; read-only first |
| Market-data licences | Written licence or provider terms, including whether redistribution is permitted |
| KYC and AML | Provider contract, identity and sanctions-screening flow, and record retention |
| Transaction monitoring | Rules, thresholds, alert handling and the SAR/STR process |
| Safeguarding | Client-money account and reconciliation, if client funds are held |
| PCI DSS | Scope definition, SAQ, ASV scan and penetration test, if card data is touched |
| Crypto custody | MPC or HSM design, key ceremony, and travel-rule compliance if applicable |
| Accounting and tax | VAT/GST treatment, invoice numbering and an auditable ledger |
| Financial promotions | Approval for any marketing claim that could be a financial promotion |
| Written authorisation | Explicit owner sign-off naming accounts, instruments, limits and the kill-switch procedure |

Engineering can prepare the adapters, controls and evidence collection. It
cannot grant the permissions, sign the agreements, or certify compliance.

### 7. No advice, no return claims, no implied regulatory status

The product does not provide financial advice, does not promise a return, and
does not describe a strategy as safe or guaranteed. A demo result is described
as a simulation. A backtest is described as a backtest. A live result is
described with its fees, slippage and data provenance. No UI text may imply
that Aetherius is authorised or regulated unless the corresponding permission
has been granted and recorded.

## Staged implementation and gates

| Stage | Scope | Gate |
|---|---|---|
| F0 | Existing paper broker, internal ledger, risk limits and backtests | The existing domain tests pass. No live adapter is present. |
| F1 | Mode and provenance model | Every quote, bar, order, fill and valuation has a provenance label; an unlabelled value is rejected by tests; the UI displays the mode and label. |
| F2 | Demo account with simulated or replayed data | Demo ledger is segregated and non-withdrawable; reset is audited; demo and live balances cannot be combined. |
| F3 | Demo account with licensed live or delayed data | Owner supplies a market-data licence or terms; the adapter records `LIVE_LICENSED` or `DELAYED`; a stale or unlicensed feed fails closed. |
| F4 | Live venue, read-only | Written authorisation and credentials exist; reconciliation and audit pass; no order path is enabled. |
| F5 | Live venue, canary orders | All controls in section 5 are tested against the venue sandbox or a recorded drill; limits are small and explicit. |
| F6 | Live scale-up | A review of canary evidence, reconciliation and incidents approves a higher limit in writing. |

`0.1.0` ships F0 and may ship F1 and F2. F3 and later require owner-supplied
licences, agreements and authorisations. F4 and later are outside the `0.1.0`
public-release scope.

## Explicit non-goals for 0.1.0

- No live bank, card, brokerage, exchange, MetaTrader or custody connection.
- No real-money order routing.
- No claim of FCA authorisation, EMI/PI status or any other regulatory status.
- No claim that market data may be redistributed.
- No client-money safeguarding, because no client money is held.
- No KYC, AML or transaction-monitoring service.
- No financial advice and no claim of profitability.
- No demo or paper balance that can be converted into real money.

## Consequences

**Good:**

- The product structure the owner wants is explicit: practise first, live only
  behind a gate.
- Users can test strategies with realistic data without risking money, and the
  interface cannot confuse a simulation with live execution.
- The provenance rule makes backtests and demo results honest and comparable.
- The live gate is written down before any adapter exists, so it cannot be
  weakened under delivery pressure.

**Bad, and accepted:**

- Three modes and three ledgers are more work than one paper mode.
- Licensed live data costs money and may prohibit redistribution, so a demo
  feed may be delayed or unavailable in some regions.
- A read-only live phase delays the first real order, which is the point.
- The compliance gate depends on providers, lawyers and the owner, not on
  engineering effort.

**Neutral:**

- The existing paper ledger and paper broker remain the foundation.
- The release scope is unchanged. A mode decision is not a live connection.

## Verification and claim rules

A finance or trading capability may be described as live only when the F4 or
F5 gate has evidence and the owner's written authorisation is on file. Until
then the honest labels are:

- `PAPER`: simulated execution, no real money.
- `DEMO`: play money, simulated fills, provenance-labelled data.
- `LIVE_READ_ONLY`: real venue data, no order path.
- `LIVE`: real orders, real money, gated.

The build manifests (`apps/sovereign-financial-os/build.yaml` and
`apps/Multi-Cross-Platform-Trading-Bot/build.yaml`) remain the authority for
what is claimed. This ADR does not change their live-adapter flags.
