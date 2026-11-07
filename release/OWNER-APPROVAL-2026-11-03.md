# Owner Approval — 2026-11-03

This record captures the owner's in-session decisions. It is a scope and
licensing decision, not evidence that the release gates pass.

## Decisions

### 1. Licence — hybrid open-core

The owner selected a hybrid of Apache-2.0, AGPL-3.0-or-later, dual
AGPL/commercial, and proprietary/commercial use.

Implemented as:

- Apache-2.0 for `apps/app-kit/`, `kernel/compute/`, and `native/kernel/`.
- AGPL-3.0-or-later for the default OS and application code.
- Dual AGPL-3.0-or-later or commercial for `apps/sovereign-financial-os/` and
  `apps/Multi-Cross-Platform-Trading-Bot/`.
- Commercial and closed for future live finance adapters, managed services, and
  enterprise add-ons.

The map is in `LICENSING.md`. It still requires counsel review and a real
commercial contact before public release.

### 2. Scope — staged release

The owner selected a hybrid release path:

- **Now:** free-first `0.1.0` foundation developer preview, delivered as a
  self-hosted web/PWA.
- **Later:** broader public `1.0` for mass adoption, including Linux packages,
  Windows, macOS, Android, and iOS after the required signing identities,
  audits, device testing, and install evidence exist.

The active scope is `release/release-scope.json`. Linux Flatpak/DEB, Windows,
macOS, Android, and iOS remain out of the `0.1.0` preview until their evidence
exists.

### 3. Finance — paper now, regulated live later

- `0.1.0` remains paper-only: internal ledger, accounting, backtesting, and
  simulated trading.
- Live banking, card, brokerage, exchange, custody, KYC/AML, market-data, DeFi,
  staking, lending, and similar activity require a later written authorisation,
  a regulated partner or licence, compliance evidence, and proven test results.
- No live adapter is enabled by this approval.

### 4. Kernel — binary and simulation now, hardware later

- `0.1.0` claims tested binary kernels plus simulated balanced-ternary and
  quantum state-vector execution.
- Ternary hardware, FPGA synthesis, remote QPU execution, and hardware quantum
  claims remain out of scope.
- A later funded tier may add FPGA or quantum provider access. It must not claim
  hardware execution until real hardware evidence exists.

## What this approval does not do

- It does not create a signed artifact.
- It does not satisfy the security, accessibility, install, rollback,
  performance, fixture, or benchmark gates.
- It does not create a legal entity, security contact, privacy policy, or
  commercial contract.
- It does not authorise live money or live venue connectivity.

The release gate must remain fail-closed until those items have real evidence.
