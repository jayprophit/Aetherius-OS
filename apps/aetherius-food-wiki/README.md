# Food Wiki App (FaturaWiki)

The food knowledge slice: cited food facts, ingredient and nutrition records, allergen and medical rules, an offline conflict queue, barcode lookup throttling and an auditable publication workflow.

**Built:** the knowledge service and its tests. **Not built:** the Food Wiki user interface, the host application mount, and confirmed FaturaWiki product requirements.

The product scope is candidate scope recorded in `TODO-FWA-003`. The local corpus contains no NaturaWiki or Food Wiki requirements, so this slice must not be presented as the owner's confirmed specification.

## What is built

- Food and ingredient records with citations.
- Allergen and medical rules that return UNKNOWN when a declaration is missing rather than guessing.
- An offline conflict queue for edits that cannot be resolved immediately.
- Barcode lookup throttling.
- A hash-chained audit trail through the shared `app-kit` ledger.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Where it comes from

This slice replaces the empty `apps/Food Wiki App` stub. It does not copy any third-party source.
