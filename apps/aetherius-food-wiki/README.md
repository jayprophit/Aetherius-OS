# Food Wiki App (FaturaWiki)

The Food Wiki product slice: a food catalogue, a location atlas, a recipe book with photo-assisted suggestions, a Rife-style frequency library, app state and Athena tools, plus the earlier cited-facts and allergen knowledge core.

**Built:** the catalogue, atlas, recipe book, frequency/WAV library, app model, Athena tool definitions, knowledge service and tests. **Not built:** the user interface, host mount, database, vision model, map/geocoding provider or live Athena host.

## What is built

### Catalogue and knowledge

- Ten food kinds: food, herb, vegetable, fruit, meat, fish, mushroom, grain, dairy and other; filter by kind.
- Cited food records, ingredient links and nutrition per 100 g.
- EU allergen declarations and medical flags with `safe`, `caution`, `blocked` and `unknown` verdicts.
- An undeclared allergen is always UNKNOWN, never safe.
- Barcode lookup throttled to one frame per second, with no model path.
- Offline edits either apply or are reported as conflicts.
- Publication returns published edits to draft and keeps every revision.
- Search and an ingredient link graph over published records.
- Every decision is appended to a hash-chained audit ledger.

### Location atlas

- Location kinds: wild, shop, market, garden, online and foraged.
- Coordinates, seasons, notes and per-food location queries.

### Recipes and photos

- Validated recipes with ingredients, servings, steps and tags.
- Ranking by available ingredients, including a "missing ingredients" list.
- `suggestFromPhoto` accepts caller-supplied detections and returns recipe matches.
- `PHOTO_NOTE` states that no vision model runs and no recognition from pixels is claimed.

### Rife-style frequencies

- A library of recorded protocols with frequency, duration and notes.
- `renderToneWav` produces real 16-bit PCM WAV audio.
- `RIFE_DISCLAIMER` states that the claims are not supported by robust clinical evidence and that the tones are not treatment, diagnosis or cure.

### App and Athena

- Eight screens: home, search, food, recipe, scanner, map, rife and settings.
- In-memory account, session and preference state.
- `createAthenaFoodTools` exposes read-only search and lookup tools for Athena.

## Honest limits

- No UI, route, renderer or host registration.
- Photo suggestions consume labels; there is no image decoder, classifier or camera integration.
- Locations, foods and recipes are caller-supplied seed data; there is no map provider, geocoder or shop feed.
- The slice is in-memory: no database, multi-device sync service or encrypted storage.
- Rife-style frequency claims are cultural artefacts, not evidence-based medicine.

## Run

```sh
node --test "tests/*.test.ts"
```

No dependency install is needed: Node 24 runs the TypeScript directly. The shared typecheck is `npx tsc -p ../tsconfig.json --noEmit` from this directory.

## Where it comes from

This slice replaces the empty `apps/Food Wiki App` stub. The product scope comes from the owner's direct statements; the local ChatGPT corpus contains no NaturaWiki or Food Wiki requirements, so no recovered specification is claimed. It does not copy any third-party source.
