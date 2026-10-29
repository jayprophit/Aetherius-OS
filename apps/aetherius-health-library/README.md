# Aetherius Health Library

The health library: recovered reference material plus a working ingestion, search, citation and publication slice.

**Built:** the Rife frequency parser, SHA-256 duplicate detection, search, citations and publication. **Not built:** the library user interface, the host mount and the library's own repository.

The two supplied frequency tables are byte-identical. `spooky2_frequency.txt` is retained as a named alias of `rife_frequency.txt`, not counted as a second data source.

## What is built

- A real parser for the recovered Rife frequency text, producing more than one thousand records.
- SHA-256 content hashing so duplicate material is detected rather than duplicated.
- Search across the parsed records.
- Citations attached to published records.
- A publication workflow with an audit trail.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Not built

The health library UI, the host application mount, and a separate repository for the library once it is finished.

## Provenance

The reference text in this folder is retained unchanged. The parser reads it; it does not rewrite the source.
