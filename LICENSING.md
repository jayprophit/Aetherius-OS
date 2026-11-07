# Licensing

**Status:** owner-selected multi-licence model. This document explains the
structure; it is not legal advice. Have counsel review it before a public
release, especially before accepting outside contributions or selling commercial
licences.

Copyright (C) 2026 The Aetherius OS Authors. All rights reserved except as
expressly granted below.

## The model in one sentence

Aetherius OS is **open-core**: the foundation is Apache-2.0, the default OS and
application code is AGPL-3.0-or-later, the finance/trading cores are dual
AGPL-3.0-or-later or commercial, and future live/enterprise modules are
commercial and closed.

This gives the project four distribution paths:

| Path | What it is for | Licence |
|---|---|---|
| **Free / open source** | Community use, self-hosting, inspection, modification | AGPL-3.0-or-later, or Apache-2.0 for the foundation paths below |
| **Free / permissive** | SDKs, kernel packages, and reusable foundations | Apache-2.0 |
| **Commercial source** | Organisations that want the AGPL code without AGPL obligations | Commercial licence from the copyright holder |
| **Commercial closed** | Live finance/trading adapters, managed services, enterprise add-ons | Proprietary commercial terms |

## Path-by-path map

### Apache-2.0 foundation

The following paths are licensed under Apache-2.0. The full text is in
`LICENSES/Apache-2.0.txt`.

- `apps/app-kit/`
- `kernel/compute/`
- `native/kernel/`

These are reusable foundations. Apache-2.0 keeps them easy to adopt, embed, and
audit. A per-directory `LICENSE` notice records the exception.

### AGPL-3.0-or-later default

Everything else in this repository that is first-party code is licensed under
the GNU Affero General Public License, version 3 or any later version. The full
text is in `LICENSE` and `LICENSES/AGPL-3.0.txt`.

This includes the OS shell, the default app suite, the desktop and workspace
layers, the self-host stack, and the documentation, unless a path says
otherwise.

AGPL section 13 matters for this project: if you modify the program and let
users interact with it over a network, you must offer those users the
Corresponding Source of your modified version. A public deployment should link
to the source archive from the running application.

### Dual AGPL-3.0-or-later or commercial

The following paths are dual-licensed:

- `apps/sovereign-financial-os/`
- `apps/Multi-Cross-Platform-Trading-Bot/`

You may use them under AGPL-3.0-or-later, or under a separate commercial licence
from the copyright holder. A per-directory `LICENSE` notice records the dual
grant.

The commercial option exists for regulated institutions that cannot accept the
AGPL's source-disclosure obligations. It does **not** grant regulatory
authorisation, market-data rights, or permission to connect to a live venue.
Those are separate legal and compliance gates.

### Commercial and closed

The following are **not** licensed by the AGPL or Apache grants in this
repository:

- Live bank, card, brokerage, exchange, custody, KYC/AML, and market-data
  adapters, when added.
- Managed hosting, support, SLA, and enterprise administration.
- Proprietary model weights, datasets, and partner integrations that are not
  expressly published under an open licence.
- Any future `commercial/` or `enterprise/` directory.

They require a written commercial agreement. Do not add such code to this
repository unless it is clearly placed in one of those paths and covered by the
agreement.

## Third-party components

Third-party dependencies keep their own licences. The generated inventory is
`THIRD_PARTY_NOTICES.md`, derived from `release/evidence/sbom.cdx.json`. The
self-host stack also contains AGPL/GPL services; their obligations are recorded
in `deploy/selfhost/README.md`.

Nothing in this file relicenses a third-party component.

## Contributions

Because the project offers commercial licences alongside AGPL, the copyright
holder needs the right to relicense contributions. Do not accept outside code
contributions until a Contributor License Agreement (CLA) or an equivalent
relicensing grant is in place. Until then, treat unsolicited patches as
suggestions rather than accepted contributions.

## Trademarks

No trademark or brand licence is granted. The names “Aetherius”, “Aetherius OS”,
and the project logos remain the property of the copyright holder. Descriptive
use and forks that clearly mark themselves as modified are expected to be
lawful, but trademark clearance is still an owner action.

## Commercial licensing enquiries

Commercial licensing contact details must be supplied by the copyright holder
before a public release. They are intentionally not invented here.

Until that contact is published, commercial use should be treated as
**unavailable**, and the AGPL-3.0-or-later option remains available.

## Why this structure

- Apache-2.0 gives the foundation the widest adoption and the simplest
  compatibility with free stores and code-signing programmes.
- AGPL-3.0 keeps the hosted OS and app layer open, which fits the self-hosted
  product model.
- Dual licensing lets a regulated customer pay for relief from the AGPL while
  the community keeps the same code.
- A commercial closed tier funds live finance, hardware acceleration, audits,
  and support without pretending those things are already free.

## Commercial model

`docs/adr/ADR-005-OPEN-CORE-FREEMIUM.md` records the freemium direction on top
of this licence map:

- **Community:** free to download, use and self-host under the open-source
  grants above.
- **Plus:** a headline target of **£9.99/month**, not yet an activated price;
  managed sync/backup, a fair-use AI allowance and premium templates are the
  intended value.
- **Business:** a per-seat tier for commerce workflows, multi-user
  administration, audit/export, SSO/SCIM and support.
- **One-time purchases:** specific premium modules or a lifetime option, to be
  modelled.
- **Transaction fee:** a small fee only for lawful commerce or authorised live
  trading, through a licensed payment provider. Paper trading carries no fee.

No paid tier, billing, transaction fee or live-money feature is enabled in
`0.1.0`. The £9.99 figure is a target that must be tested against payment
fees, VAT, store commission, infrastructure, AI usage and support costs before
it is published. Regional pricing may be lower. A paid tier must never paywall
security, accessibility, privacy or data export. The community build must
compile and run from the public repository without a closed module or an
entitlement server.
