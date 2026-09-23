# Expected Touch Sets (REQ-p20-expected-touch-set, P20)

Pre-execution estimation of files a worker will likely modify, from
evidenced sources only. Feeds collision prediction and placement.

## Estimator (`src/workers/touch.ts`)

`estimateTouchSet` unions, with per-path provenance:

- **declared** files (e.g. Bridge `writes_files`);
- **workflow** literal file bindings;
- **package** artifacts via skill refs → SkillRegistry → package
  manifests (`package:<id>@<version>`);
- **history** past touch sets by task type (`history:<taskType>`).

Honesty rules:

- Dynamic content (unparseable/unresolvable refs, missing registry,
  missing manifests, missing history) lands in `unknown` with reasons —
  never guessed.
- Unsafe/empty paths (`..`, absolute, blank) are excluded and listed in
  `invalid`, never estimated.
- Deterministic: sorted, deduped; first source wins provenance.

Tests: `src/workers/touch.test.ts` (5 tests: union+provenance, skill
expansion, unknown reporting, unsafe exclusion, empty honesty).
