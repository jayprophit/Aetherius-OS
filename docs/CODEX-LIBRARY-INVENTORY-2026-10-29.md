# Codex / ChatGPT library inventory — 2026-10-29

Scope: a read-only inventory of `C:\Users\jpowe\.codex` on 2026-10-29. The
purpose is to identify design and build material that can inform Aetherius OS,
not to claim that any of it has been imported, adopted or cleared for
redistribution.

No conversation text and no attachment text was read for this inventory. Only
file counts, sizes, database table names and row counts, template names and
structural metadata (slide counts, sheet names, image dimensions) were
extracted. Credential files were not opened.

## 1. Summary

| Material | Count | Size | State |
|---|---|---|---|
| Conversation threads | 124 | — | Not read; indexed only |
| Conversation turns | 1,014 | — | Not read |
| Conversation items | 50,994 | — | Not read |
| Session files | 128 (54 `.jsonl`, 74 `.zst`) | 988.55 MB | 2026-08-22 to 2026-10-29 |
| Generated images | 18 PNG, all unique | 30.34 MB | Not visually classified |
| Durable PNG (all sources) | 103 | 34.29 MB | Includes 81 template/plugin and 4 skill images |
| Durable SVG | 50 | 0.09 MB | Template/plugin assets |
| Document templates | 20 (7 PPTX, 7 DOCX, 6 XLSX) | 24.77 MB | Reference only |
| Attachments | 26 TXT + 1 JSON index | 0.56 MB | Not read |
| ChatGPT projects | 2 (6 files) | 0.03 MB | MAT-related, not Aetherius |
| Skills | 49 files | 0.30 MB | Not adopted |
| Logs | 30,123 rows | 65.75 MB | Operational, not design material |
| Transient `.tmp` tree | 5,427 files | 60.25 MB | Excluded as transient |

The 18 generated images are the only durable user-generated image set found.
The 20 document templates are **OpenAI template-plugin reference assets**, not
user-authored documents. The conversations are the user's own Codex history,
but they have not been ingested or redacted.

## 2. Document templates

Location:
`plugins/cache/openai-curated-remote/openai-templates/0.1.1/skills/artifact-template-*/assets/reference.*`

| Template | Format | Size | Structure | Aetherius target | Use |
|---|---|---|---|---|---|
| `analytics-dashboard` | XLSX | 26 KB | Dashboard, Data & Targets, _Chart Helpers | Future analytics surface | Layout and KPI reference |
| `business-review` | PPTX | 1.94 MB | 14 slides | SlidesApp | Review-deck structure |
| `design-report` | DOCX | 2.79 MB | 74 paragraphs | WriterApp / design docs | Report structure |
| `experiment-analysis` | DOCX | 0.20 MB | 277 paragraphs | Genesis evaluation reports | Experiment write-up structure |
| `financial-budget` | XLSX | 37 KB | Summary, Assumptions, Op Build, Checks | `sovereign-financial-os` budget variance | Budget workbook layout |
| `investment-committee-memo` | DOCX | 0.27 MB | 246 paragraphs | Finance / investment memo | Memo structure; no IC workflow exists |
| `legal-memorandum` | DOCX | 0.57 MB | 31 paragraphs | WriterApp | Structure only; requires counsel |
| `market-trends-report` | PPTX | 1.88 MB | 6 slides | SlidesApp | Market-report structure |
| `minimal-letterhead` | DOCX | 10 KB | 18 paragraphs | WriterApp | Letterhead layout |
| `operating-calendar` | XLSX | 45 KB | Annual, Monthly | CalendarApp | Operating-cadence layout |
| `operating-review` | PPTX | 0.29 MB | 31 slides | SlidesApp | Operating-review structure |
| `project-kickoff` | PPTX | 1.99 MB | 12 slides | SlidesApp | Kickoff-deck structure |
| `project-tracker` | XLSX | 14 KB | Project Plan | TasksApp | Project-plan layout |
| `sales-pipeline` | XLSX | 17 KB | Sales Pipeline | Future CRM in Commerce | Pipeline layout; no CRM module exists |
| `simple-dark-mode` | PPTX | 3.09 MB | 26 slides | Desktop appearance tokens | Dark-theme reference |
| `simple-light-mode` | PPTX | 1.45 MB | 26 slides | Desktop appearance tokens | Light-theme reference |
| `strategy-memorandum` | DOCX | 2.56 MB | 180 paragraphs | WriterApp | Strategy-memo structure |
| `system-design` | DOCX | 0.49 MB | 241 paragraphs | Architecture decision records | System-design structure |
| `team-alignment` | PPTX | 6.99 MB | 24 slides | SlidesApp | Alignment-deck structure |
| `three-statement-forecast` | XLSX | 134 KB | Read Me, Assumptions, Exec Sum, IS, BS, CF, Revenue, OpEx, HC, WC, FA & D&A, Fin, Tax & Equity | `sovereign-financial-os` | Forecast-model layout; the finance core has no driver forecast |

Totals: **7 PPTX (17.64 MB), 7 DOCX (6.87 MB), 6 XLSX (0.27 MB) = 20 files,
24.77 MB.**

## 3. Generated images

Location: `generated_images/<thread-id>/exec-<id>.png`.

- 18 PNG, 18 unique SHA-256 prefixes, 30.34 MB.
- Two source thread groups: 4 images and 14 images.
- Dimensions: 3 × 1536×1024, 1 × 1672×941, 11 × 1254×1254, 3 × 1122×1402.
- The images have **not** been visually classified in this pass. Their subject
  matter, people, logos and text are unknown.

Candidate uses, subject to review: desktop wallpapers (landscape and wide),
store hero art, book cover or interior art, and brand exploration. No image has
been copied into the repository or adopted as a product asset.

## 4. Conversations and attachments

`state_5.sqlite` records 124 threads, 107 thread-spawn edges and 2 project
roots. `thread_history_1.sqlite` records 1,014 turns and 50,994 items across
124 threads. The session tree holds 128 files from 2026-08-22 to 2026-10-29:
54 `.jsonl` (546.01 MB) and 74 `.zst` (442.54 MB).

This is a requirements and design corpus, but it is **not ingested**. The
earlier prompt-corpus work used `E:\external drive\ai chat conversations`, a
different root. Using `.codex` requires a redaction and provenance pass first:
the history may contain credentials, personal data, third-party content and
unverified claims. No conversation is quoted in this document.

Attachments: 26 `pasted-text.txt` files and one `pasted-text-attachments.json`
index, 0.56 MB total. They were not read.

The two ChatGPT projects are MAT-related (`MAT-Codex-Audit-and-Migration-Plan.md`
and `MAT-Source-Intake-Status.md`), not Aetherius OS material.

## 5. What the product can use now

| Need | Source | What exists | What is missing |
|---|---|---|---|
| Budget vs actual | `financial-budget.xlsx` | `SovereignFinanceService.setBudget()` and `budgetVariance()` | XLSX import/export and a workbook template registry |
| Three-statement model | `three-statement-forecast.xlsx` | Actuals-based P&L, balance sheet and cash flow | Driver-based forecasting, scenario engine and XLSX export |
| Project plan | `project-tracker.xlsx` | `TasksApp` lists, tags, recurrence, priority and search | Dependencies, assignees, status roll-up and XLSX export |
| Operating cadence | `operating-calendar.xlsx` | Recurring events and ICS export | Annual/monthly planning views |
| Review and kickoff decks | 5 PPTX templates | `SlideDeck` slides, elements, notes and outline export | PPTX import/export and a layout/theme registry |
| Reports and memos | 7 DOCX templates | `WriterDocument` blocks and Markdown export | DOCX import/export and a template registry |
| Theme tokens | dark/light PPTX decks | Desktop `appearance.theme` and `appearance.accent` settings | A shared token system used by the app suite |
| Visual assets | 18 generated PNG | None | Visual classification, rights review and an asset pipeline |
| Requirements mining | 124 threads | None | Redaction, provenance and a structured extraction pass |

The document and spreadsheet cores export **Markdown, CSV and slide outlines**,
not OOXML. `WriterDocument.toMarkdown()`, `Spreadsheet.toCsv()` and
`SlideDeck.toOutline()` are the only export paths. No template can be opened by
the current app suite.

## 6. Gaps this inventory exposes

1. **No OOXML import or export.** The app suite cannot read DOCX, PPTX or XLSX,
   and cannot write them. The templates are therefore structure references, not
   importable assets. A converter or a dependency-free OOXML adapter is needed.
2. **No template registry.** There is no mapping from a template id to a
   `WriterDocument`, `Spreadsheet` or `SlideDeck` structure, and no original
   Aetherius layout set.
3. **No CRM or sales pipeline.** `aetherius-commerce` handles orders, payments
   and entitlements; it has no leads, accounts, stages or forecast.
4. **No driver-based forecast.** `sovereign-financial-os` reports actuals,
   budgets, tax and reconciliation; it does not project revenue, headcount,
   working capital or financing.
5. **No analytics module.** The analytics-dashboard template has no counterpart
   in the app suite. The Athena health dashboard is health-specific.
6. **No conversation ingestion or redaction pipeline.** The `.codex` history is
   indexed but unread. It cannot be treated as evidence or published material
   until it is redacted and sourced.
7. **No image classification or rights review.** The 18 generated images are
   unclassified and unadopted.

## 7. Rights and provenance

- The 20 template files are shipped by the OpenAI templates plugin
  (`openai-templates/0.1.1`). They are **reference material**. Do not
  redistribute the files, and do not ship them as Aetherius templates. Build
  original layouts that achieve the same information structure.
- The generated images were produced in the user's Codex sessions. They still
  need a review for third-party marks, identifiable people and text before any
  public or commercial use.
- Conversations and attachments may contain third-party or personal data. A
  redaction pass is required before quoting, publishing or training on them.
- This inventory grants no licence and makes no ownership claim.

## 8. Non-claims

- No conversation, attachment or image content was read or classified.
- No template was imported, converted, copied or adopted.
- No app suite screen uses any of this material.
- The counts are a point-in-time snapshot and exclude the transient `.tmp`
  tree, logs and credential files.
- The presence of a template does not mean the corresponding Aetherius feature
  exists. The gap column above is the authoritative statement of what exists.

## 9. Evidence and reproduction

The inventory was produced with read-only walks of `C:\Users\jpowe\.codex`:

- File counts and sizes: `os.walk` over the tree, excluding `.tmp` where noted.
- Conversation totals: read-only SQLite queries against
  `thread_history_1.sqlite` and `state_5.sqlite` (`count(*)` only).
- Template structure: ZIP/XML metadata from each `reference.*` file — sheet
  names, slide counts and paragraph counts, not cell or paragraph text.
- Image dimensions: PNG IHDR bytes; SHA-256 for uniqueness.
- Session range: file modification times, 2026-08-22 to 2026-10-29.

Credential files (`auth.json`, `.sandbox-secrets/`, `cap_sid`, `config.toml`)
and logs were deliberately excluded from every query.
