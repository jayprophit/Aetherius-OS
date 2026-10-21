# Aetherius OS Commerce

The Aetherius OS Commerce and Marketplace application: the storefront, the merchant administration, the checkout and the payment providers. An integrated application domain of the one Aetherius ecosystem, not a platform of its own.

**Registered, not built.** The scope is recorded and the primitives it
needs are mapped in `docs/APPLICATION-SHARED-PRIMITIVES.yaml`.

This is an integrated application domain of the one Aetherius
ecosystem. It does not get its own account system, its own billing
system or its own search index: the primitives it uses belong to the
projects the map names, and this application is a consumer of them.

Named as a first-party application in the Figma handoff of 17 October 2026, with the concepts taken from the WooCommerce archive. The shared primitives are in docs/APPLICATION-SHARED-PRIMITIVES.yaml and are not duplicated here: the account, permission, search, notification and payment mechanisms are the ones the rest of Aetherius uses.

## What it will be

A future Aetherius OS application for selling and buying: the storefront, the merchant administration, the checkout, and the payment providers where they are legally and commercially authorised.

## Where it comes from

The Figma handoff's V2 inputs table gives the destination as Aetherius OS Commerce and Marketplace, with WooCommerce 7.4.0 as the concept source and Coinbase Commerce 1.2.1 as an optional payment provider. Both are third-party and are referenced, not copied.
