# Aetherius App Suite

Domain cores for first-party equivalents of common default apps: Notes, Calculator, Files, Calendar, Photos and Browser.

**Built:** six tested domain cores. **Not built:** any user interface, a native filesystem adapter, a browser engine, an image codec or OS app registration.

## What is built

- **Notes:** create, derive a title, tag, pin, search, keep every revision and restore one.
- **Calculator:** a recursive-descent parser with precedence, unary minus, right-associative powers, history, memory and refusal of malformed or unsafe expressions.
- **Files:** a virtual filesystem with create, write, read, list, move, copy, remove, quota enforcement, traversal refusal and name/content search.
- **Calendar:** validated events, daily/weekly/monthly recurrence, conflict detection and real ICS export.
- **Photos:** albums, tags, favourites, SHA-256 content-hash duplicate detection and metadata validation.
- **Browser:** tabs with back/forward history, bookmarks, downloads, a host blocklist and pagination-link extraction.

## Honest limits

- These are state machines and tests, not applications. There is no window, route, screen, accessibility layer or host mount.
- Files is in-memory and does not touch the host filesystem.
- Browser does not fetch, render or execute pages; pagination is a bounded anchor extractor.
- Calculator uses JavaScript numbers, not arbitrary-precision arithmetic.
- Photos does not decode pixels; it hashes caller-supplied bytes and validates metadata.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Provenance

Built for the owner's request for first-party versions of default OS apps across Apple, Linux, Microsoft, Android, iOS and Google OS. Per-OS settings, default-app routing and installer plans live in `apps/aetherius-desktop`.
