# FOSS Application REA — Canonical Reference Registry

**Date:** 2026-11-08
**Scope:** Video-derived free/open-source/freeware/freemium reference lists vs Aetherius 143-entry catalogue.
**Status:** Research registry — no parity claim, `NOT_RELEASABLE` / `NOT_5_STAR` retained.

> “Free” ≠ open-source. Savings claims in videos ($1k–$4k/yr) are **not verified** and are not used as evidence.

## 1. Method

- Deduplicated aliases (e.g. Shotcut/Kdenlive listed separately; ONLYOFFICE vs LibreOffice distinct).
- Each entry records: category, example repo, licence class, strategy, Aetherius counterpart, gap.
- Cross-referenced via Graphify (`graphify query` for office, media, sync, etc.) and `src/apps/catalogue.ts` measured counts: 143 directories, 135 `aetheriusSlice:true`, `PARTIAL` 109 / `TESTED` 27 / `VERIFIED` 3 / `NOT_STARTED` 4. `src/shell-workflows.test.ts` asserts 30 registry ids, not 42.
- Licence classes: **OSS** (source-open), **SA** (source-available, restricted), **Freeware** (proprietary free), **Freemium**, **Trial/Commercial**. Reuse strategy: **RESEARCH_ONLY**, **INTEROP**, **EXTERNAL_APP**, **LIBRARY**, **NATIVE**, **UNSUITABLE**.

## 2. Canonical groups (13)

### Office / productivity
| App | Repo / site | Licence | Strategy | Aetherius counterpart | Gap |
|---|---|---|---|---|---|
| LibreOffice | libreoffice.org | MPL 2.0 (OSS) | RESEARCH_ONLY + INTEROP (ODF, DOCX/XLSX/PPTX tests) | Writer/Sheets/Slides (`PARTIAL`) | Full acceptance fixtures missing (gate blocker) |
| ONLYOFFICE | onlyoffice.com | AGPL (OSS) | RESEARCH_ONLY | Same | Compare collab + OOXML fidelity |
| Joplin | joplinapp.org | AGPL (OSS) | INTEROP (sync) | Notes (`PARTIAL`) | Which sync protocol? |
| Obsidian | obsidian.md | Proprietary free | RESEARCH_ONLY (vault workflow) | `knowledge/Aetherius-Vault/` (13 notes, SCAFFOLDED) | Vault is export, not canonical ledger |

### Photo / vector / layout
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| GIMP | GPL (OSS) | RESEARCH_ONLY + LIBRARY (GEGL) | Canvas/Raster (`PARTIAL`) |
| Inkscape | GPL (OSS) | RESEARCH_ONLY | Vector/layout |
| Krita | GPL (OSS) | RESEARCH_ONLY | Paint |
| Penpot | MPL 2.0 (OSS) | RESEARCH_ONLY | Prototyping |
| Photopea | Proprietary free | RESEARCH_ONLY | Browser photo |
| Affinity | Proprietary free (Canva account) | RESEARCH_ONLY | Creative suite ref |

### Video / VFX / animation
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Kdenlive | GPL (OSS) | RESEARCH_ONLY + INTEROP (timeline/proxy) | Video studio (`PARTIAL`) |
| FFmpeg | LGPL/GPL per config | LIBRARY (config-dependent) | Encode pipeline |
| Shotcut | GPL (OSS) | RESEARCH_ONLY | Video |
| Natron | Proprietary (ex-copyright) / MPL history | UNSUITABLE without licence check | Compositor |
| OpenToonz | BSD (OSS) | RESEARCH_ONLY | Animation |
| DaVinci Resolve | Proprietary free + Studio | RESEARCH_ONLY benchmark | Pro editor ref |

### Audio / DAW
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Ardour | GPL (OSS) | RESEARCH_ONLY | DAW |
| Audacity | GPL (OSS) | RESEARCH_ONLY | Editor |
| LMMS | GPL (OSS) | RESEARCH_ONLY | MIDI |
| REAPER | Commercial trial | RESEARCH_ONLY benchmark | DAW ref (UNSUITABLE for embed) |

### CAD / 3D / engineering
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| FreeCAD | LGPL (OSS) | RESEARCH_ONLY + INTEROP (STEP/IGES) | Engineering (`PARTIAL`) |
| Blender | GPL (OSS) | RESEARCH_ONLY + LIBRARY | 3D suite |

### Games / development
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Godot | MIT (OSS) | RESEARCH_ONLY + LIBRARY (export) | Game/3D runtime |
| Scratch | BSD (OSS) | RESEARCH_ONLY | Visual programming |
| VSCodium | MIT (OSS) | EXTERNAL_APP | IDE (vs Code) |
| Zed (reference) | AGPL (OSS) | RESEARCH_ONLY | Editor |

### File management
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Double Commander | GPL (OSS) | RESEARCH_ONLY | Files (`PARTIAL`, now with quota) |
| Yazi | MIT (OSS) | RESEARCH_ONLY | Terminal FM |
| Everything | Freeware (Melkor) | RESEARCH_ONLY | Indexing |
| btop | Apache 2.0 (OSS) | EXTERNAL_APP | System monitor |

### Browsers / media
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| VLC | GPL (OSS) | EXTERNAL_APP | Media |
| mpv | LGPL (OSS) | LIBRARY/EXTERNAL | Playback |
| Jellyfin | GPL (OSS) | EXTERNAL_APP | Media Lessons |

### Networking / sync
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Syncthing | MPL 2.0 (OSS) | RESEARCH_ONLY + INTEROP (peer transport) | Cloud sync (`aetherius-cloud`) |
| LocalSend | Apache 2.0 (OSS) | RESEARCH_ONLY | Device transfer |
| KDE Connect | GPL (OSS) | RESEARCH_ONLY | Device comms |

### Security / privacy
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| KeePassXC | GPL (OSS) | INTEROP (KDBX) | KeePass bridge (`scripts/keepass.py` local-only) |
| Bitwarden | AGPL/GPL (OSS) | RESEARCH_ONLY | Vault |
| Cryptomator | AGPL (OSS) | RESEARCH_ONLY | Encryption |

### Research / knowledge
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Zotero | AGPL (OSS) | INTEROP | Research refs |
| Logseq | AGPL (OSS) | RESEARCH_ONLY | Outliner |
| Obsidian | Proprietary | RESEARCH_ONLY | Vault (see above) |

### OS utilities
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| 7-Zip | LGPL (OSS) | EXTERNAL_APP | Archive |
| Flameshot | GPL (OSS) | EXTERNAL_APP | Screenshot |
| Filelight | GPL (OSS) | EXTERNAL_APP | Storage |

### Automation / AI
| App | Licence | Strategy | Counterpart |
|---|---|---|---|
| Excalidraw | MIT (OSS) | LIBRARY/RESEARCH | Diagrams |
| Manim | MIT (OSS) | LIBRARY | Scientific viz |

Full video telemetry (timestamps) reproduced in branch research files; not all 60+ titles integrated — top 5 integration candidates from the brief drive P0 work below.

## 3. Aetherius gap comparison

- Catalogue: 143 `directory` entries; most `PARTIAL` (109). Changing catalogue count ≠ improvement.
- Windows: `shellRegistry.tsx` 30 lazy entries; `data.ts` 52 components; 12 ids legacy-only (tracked in `src/shell-e2e.test.ts`).
- Features missing vs references: DOCX/XLSX/PPTX/PDF/media/CAD/BIM/MIDI/collaboration real fidelity (gate blockers), file-manager quota (now implemented), browser iframe restrictions (now validated `http/https` only, `IFRAME_SANDBOX`, tab quota), Settings overlays, native app launcher, device sync (peer vs cloud).
- `NOT_RELEASABLE` blockers (5): signed artifacts, pen-test, WCAG audit, full acceptance, 5-star benchmark + kernel warning.

## 4. Licence matrix (summary)

| Class | Examples | Obligation |
|---|---|---|
| OSS (GPL/LGPL/MPL/MIT/Apache) | LibreOffice, FreeCAD, Godot, Kdenlive, Syncthing, Godot | Attribution; copyleft analysis before embed; MIT needs notice |
| Proprietary free | Obsidian, Affinity, Photopea, DaVinci | No source reuse; benchmark only |
| Freemium / trial | REAPER, Office, Creative Cloud | UNSUITABLE for embed; compare UX only |
| Commercial | REAPER (paid), streaming services | UNSUITABLE |

No DRM, subscription or licence bypass. No third-party code embedded without licence + dependency validation.

## 5. Local runtime compatibility matrix

| Target | Status | Evidence |
|---|---|---|
| Windows desktop (Tauri) | BUILDABLE, SCAFFOLDED | `npm run platform:preflight` 2026-11-08; icons generated; no installer SHA yet |
| Linux desktop | BUILDABLE (Docker), SCAFFOLDED | `packaging/vm/Dockerfile` |
| macOS / Android / iOS | BLOCKED / UNVERIFIED | No SDK/Xcode on this host |
| Bootable OS | PARTIAL_COMPLETE | `kernel/compute/manifest.json` |

Local-first: persistence, offline function, permission boundaries, Genesis discovery required per target; cloud optional; sync on reconnect.

## 6. Prioritised integration candidates (first batch)

1. Native app launcher (Windows/Linux/macOS): discover + launch authorised installed apps, isolated, explicit approval. **Implemented surface:** `apps/app-launcher` + Tauri host (to be hardened).
2. File search + transfer: Everything/Yazi/Syncthing/LocalSend patterns → Files quota/error already done; add index + peer sync comparison.
3. Creative/engineering engines: FFmpeg + FreeCAD/Blender interop before new editors.
4. Knowledge/AI: Obsidian vault ↔ Hive ledger ↔ Graphify (sanitised export, no private notes).
5. Security/maintenance: KeePassXC KDBX interop, backup/restore drill, btop/Flameshot external launches.

Each candidate must ship: upstream ref (repo + commit), licence, architecture finding, files changed (original code), tests, offline launch evidence, perf/security notes, SHA-256 if artifact.

## 7. Implemented improvements (this milestone)

- `apps/aetherius-files/src/domain.ts`: quota (`maxEntries`/`maxTotalBytes`), name/path validation (traversal/control/empty), duplicate rejection, `usageBytes`/`entryCount`/`quotaStatus`. Tests: `quota-error.test.ts` (5 cases, passing).
- `apps/aetherius-browser/src/domain.ts`: `validateTabUrl` (http/https only, blocks `javascript:/data:/vbscript:/file:`), `IFRAME_SANDBOX = allow-scripts allow-forms allow-popups` (no same-origin), `maxTabs` quota. Tests: browser domain suite passing.
- `src/shell-e2e.test.ts`: window sweep (catalogue 135 baseline, 30 registry, 12 legacy gap documented, settings reachable). Full vitest suite: 1879 passed / 4 failed before registry regen; source-registry 14/14 after regen (`docs/SOURCE-REGISTRY.yaml` 1170 docs). Full `npm run verify` to be re-run after doc commits.
- `scripts/generate-tauri-icons.mjs` + `src-tauri/icons/*`: reproducible Tauri icons.

## 8. Deliverables & provenance

- Registry: this file + `docs/research/OMARCHY-REA-2026-11-08.md` (Omarchy SHA `f70c317…`).
- Requirements register: `docs/MASTER-REQUIREMENTS-REGISTER-2026-11-08.md` (AETH-001..048) — updated gap see §3.
- Local runtime matrix: §5.
- Reproducible tests: `npm run typecheck` ✅, `npm run secret-scan` ✅ (2085 files), `npx vitest run src/programme/sourceRegistry.test.ts` ✅ 14/14, `npx vitest run src/shell-e2e.test.ts src/shell-workflows.test.ts` ✅ 12/12, `node --test apps/aetherius-files/tests/quota-error.test.ts` ✅ 5/5.

---

**Next milestone:** Windows Tauri installer + SHA-256 (requires `npm i -D @tauri-apps/cli`), offline launch evidence, then Linux/macOS generalisation. Keep `NOT_RELEASABLE`.
