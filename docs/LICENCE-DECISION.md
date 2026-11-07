# Licence Decision — Owner Selected

**Status:** decided on 2026-11-03. The owner selected a hybrid open-core model:
Apache-2.0 foundations, AGPL-3.0-or-later default, dual AGPL/commercial
finance and trading cores, and commercial/closed future live and enterprise
modules. The operative map is `LICENSING.md`; the root `LICENSE` holds
AGPL-3.0 and `LICENSES/` holds the referenced texts.

The options below remain as the comparison that informed the decision. This
document is not legal advice; counsel review is still required before a public
release.

## What the licence controls

- Whether others may use, modify, and redistribute the code.
- Whether you can offer a paid or proprietary edition.
- Whether Flathub, F-Droid, SignPath, and other free distribution paths accept
  the project.
- What source you must publish if you modify copyleft components.
- What notices you must preserve in the SBOM and third-party notices.

## Options

| Option | Others can use/modify | Must publish changes | Paid edition | Free signing/distribution | Main risk |
|---|---|---|---|---|---|
| **Proprietary** | No, only under your EULA | No | Yes | Windows/macOS stores still possible; Flathub/F-Droid/SignPath generally no | User trust; no community contributions; legal cost for EULA |
| **MIT** | Yes | No | Yes (the permissive licence also lets competitors) | Yes | Competitors can ship closed forks |
| **Apache-2.0** | Yes | No (patent grant and notice rules) | Yes | Yes | Competitors can ship closed forks; patent clause needs review |
| **AGPL-3.0** | Yes | Yes, including network use | Yes, via a separate commercial licence | Usually yes; stores need care | Commercial adopters avoid it; network-source obligation |
| **Dual: AGPL-3.0 + commercial** | Yes under AGPL, or paid | AGPL users must publish | Yes | Usually yes | More legal and sales overhead |
| **Source-available (e.g. BUSL)** | Limited | Usually yes for competing use | Yes | Often no; not OSI-approved | Not open source; Flathub/F-Droid/SignPath may reject |

## Recommendation

For a free-first public foundation with self-hosting:

1. **Apache-2.0** for the foundation code, with a separate commercial licence for
   regulated finance/trading modules and enterprise support. This is the simplest
   path to Flathub, F-Droid, SignPath, and broad adoption.
2. **AGPL-3.0** if the priority is keeping modified hosted versions open. This
   fits the self-hosted cloud model but narrows commercial adoption.
3. **Proprietary** only if you do not want others to reuse the code and accept
   that free signing and Linux store paths are largely unavailable.

Do not use a source-available licence if you want F-Droid, Flathub, or free
open-source code signing.

## What happens after you choose

1. Add the chosen `LICENSE` file at the repository root.
2. Add a short `LICENSING.md` explaining any dual-licence or commercial terms.
3. Update `package.json` with the matching `license` field.
4. Re-run `node scripts/release-gate.mjs`; the licence blocker should clear.
5. Review `THIRD_PARTY_NOTICES.md` against the chosen model. Apache/MIT/BSD
   dependencies are compatible with all options above; AGPL/GPL dependencies
   impose additional obligations.
6. If you choose a dual licence, add the commercial terms and a contact path.

## Current dependency licences

The generated inventory shows MIT, Apache-2.0, BSD-3-Clause, ISC, 0BSD, and one
CC-BY-4.0 component. There are no GPL/AGPL dependencies in the root Node SBOM.
The self-host stack does include AGPL/GPL services; those are documented in
`deploy/selfhost/README.md` and are not linked into the Aetherius source.
