# Aetherius OS — Batch 23: Universal Asset Interoperability

## Result: COMPLETE

Canvas → Slides asset exchange is verified as a tested, deterministic workflow. The Asset Exchange Contract is versioned and reusable by all Aetherius applications.

## Test Results

```
56/56 tests pass across 7 suites
0 failures, 0 skipped
tsc --noEmit: clean (exit 0)
```

## What was delivered

### Asset Exchange Contract (`apps/aetherius-app-suite/src/asset-exchange.ts`)
- `AssetManifest` interface: stable ID, schema version (`aetherius-asset-v1`), MIME type, SHA-256 content hash, ownership, provenance, content dimensions, optional source relationship.
- `AssetStore` class: atomic JSON persistence with integrity verification, duplicate-content idempotency, and corruption detection.
- `sanitizeSvg()`: rejects `<script>`, `javascript:`, event handlers, and external data references.
- `validatePath()`: rejects path traversal characters.
- Shared by all applications via `aetherius-app-suite` index.

### Canvas asset export (`apps/aetherius-canvas/src/domain.ts`)
- `exportAsset(boardId)` returns `{ manifest, svg }`.
- SVG is generated from existing `svg()` method and passed through `sanitizeSvg`.
- Manifest includes provenance (`sourceApp`, `exportedAt`, `exporterVersion`) and `sourceRelationship` (`sourceType: "canvas-board"`, `sourceId: boardId`).
- Content hash is computed over the sanitized SVG string.

### Slides asset import (`apps/aetherius-slides/src/domain.ts`)
- `importAsset(deckId, slideId, manifest, snapshot, placement)` creates an immutable snapshot element (`kind: "asset"`).
- Validates schema version (`aetherius-asset-v1` required), content hash format, path safety, and rejects external asset sources.
- Duplicate import of same ID + same hash is idempotent; different hash raises an error.
- Assets are tracked in `Deck.assets[]` and survive persistence/reload.
- `getAsset()` and `listAssets()` expose registered manifests.
- Placement transforms (`x`, `y`, `width`, `height`) are stored separately from the source geometry.

### Verified workflow
1. **Create** Canvas board with shapes and text.
2. **Export** sanitized SVG + versioned manifest.
3. **Register** asset in shared `AssetStore`.
4. **Import** into Slides as immutable snapshot.
5. **Save** deck and **reopen** in a separate process — asset, manifest, and placement all survive.
6. **Edit** source Canvas board — original snapshot in Slides remains unchanged.
7. **Security**: unsafe SVG, path traversal, unsupported schema versions, and external sources are rejected.
8. **Legacy**: pre-Batch-23 `boards.json` files reopen without modification.

### Tests added
- `apps/aetherius-canvas/tests/canvas.test.ts`: 2 new tests (asset export, missing board rejection).
- `apps/aetherius-slides/tests/slides.test.ts`: 4 new tests (import, duplicate rejection, unsafe rejection, persistence).
- `tests/interop.test.ts`: 4 new integration tests (full workflow, unsafe SVG rejection, duplicate idempotency, legacy reopen).

### Files changed
| Path | Change |
|------|--------|
| `apps/aetherius-app-suite/src/asset-exchange.ts` | New: 130 lines — Asset Exchange Contract, AssetStore, sanitizers |
| `apps/aetherius-app-suite/src/index.ts` | Updated: export asset-exchange |
| `apps/aetherius-canvas/src/domain.ts` | Updated: `exportAsset()` method |
| `apps/aetherius-canvas/tests/canvas.test.ts` | Updated: +2 tests |
| `apps/aetherius-slides/src/domain.ts` | Updated: asset import, tracking, placement |
| `apps/aetherius-slides/tests/slides.test.ts` | Updated: +4 tests |
| `tests/interop.test.ts` | New: 4 integration tests |

### Backup
`aetherius-os-batch23-complete-20261103-060114.bundle` in `../Temp/`

## Regression
All 46 Batch 22 tests continue to pass. No shared mechanisms broken.

## Remaining deficiencies
1. **Sheets formula parser** — still uses constrained evaluation; real parser gate remains open.
2. **Sheets CSV injection** — no injection-risk tests yet.
3. **Canvas raster export** — SVG only; PNG/WebP requires genuine renderer.
4. **Recorder device capture** — simulated audio only; real microphone/camera integration pending.
5. **PPTX support** — not claimed; JSON export only for Slides.
6. **Native GUI** — none of the applications include host windowing adapters.

## Next stage
After Batch 23, the recommended sequence is:
- **Batch 24**: Sheets formula parsing and CSV injection safety.
- **Batch 25**: Shared rendering pipeline (PNG/WebP).
- **Batch 26**: Recorder hardware integration.
- **Batch 27+**: Application interfaces and multi-app interoperability (Writer ↔ Sheets ↔ Slides ↔ Canvas).
