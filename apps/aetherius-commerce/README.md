# Aetherius OS Commerce

The Aetherius OS Commerce and Marketplace application: the storefront, the merchant administration, the checkout and the payment providers. An integrated application domain of the one Aetherius ecosystem, not a platform of its own.

**Built: the commerce domain slice.** Catalogue, cart, idempotent checkout, inventory, a deterministic local test payment provider, fulfilment, refunds, entitlements, sales reporting and ledger events. **Not built:** the storefront UI, the host application registry mount, and a real payment provider.

This is an integrated application domain of the one Aetherius ecosystem. It does not get its own account system, its own billing system or its own search index: the primitives it uses belong to the projects named in `docs/APPLICATION-SHARED-PRIMITIVES.yaml`, and this application is a consumer of them. Accounts, entitlements, notifications and the hash-chained ledger come from `apps/app-kit`.

## What is built

- Products with SKU, price in integer minor units, inventory, tags, draft/published state.
- A per-account cart and an idempotent checkout keyed by the caller's idempotency key.
- Stock is decremented once, after payment succeeds; a declined payment changes nothing.
- Fulfilment, refunds that restore stock and revoke the entitlement, and a sales report.
- An append-only ledger event for every state change.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Not built

The storefront and merchant UI, the host registry mount, and any real payment provider. `LocalTestPaymentProvider` is deterministic and performs no financial transaction. A real transaction must not be performed without the owner's approval.

## Where it comes from

The Figma handoff's V2 inputs table gives the destination as Aetherius OS Commerce and Marketplace, with WooCommerce 7.4.0 as the concept source and Coinbase Commerce 1.2.1 as an optional payment provider. Both are third-party and are referenced, not copied.
