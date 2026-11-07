# Free-first audit and professional-services readiness

**Status:** free pre-audit and self-assessment plan. This is **not** an
independent audit, legal opinion or certification. The public-release gate
remains fail-closed until the paid or owner-supplied evidence exists.

**Policy:** use free and open-source tools to find and fix problems early. Do
not describe a self-assessment as an audit. Do not claim a certification that
has not been issued by the certifying body.

## 1. What can be done for free

| Service | Free pre-audit / self-assessment | Still owner-gated before public release |
|---|---|---|
| Independent penetration test | OWASP ASVS self-assessment, OWASP ZAP baseline/full scan, Semgrep, CodeQL for public repos, Trivy/Grype, OSV-Scanner, `npm audit`, OpenSSF Scorecard, fuzzing, dependency and secret scans | A real independent pen test and remediation acceptance |
| WCAG 2.2 AA audit | axe-core, Lighthouse, Pa11y, WAVE, keyboard-only test, focus visibility, 200%/400% zoom, high contrast, NVDA, VoiceOver, TalkBack | An independent audit by a qualified accessibility auditor |
| Legal review (EULA/privacy/IP) | Open policy templates, ICO/GDPR guidance, a plain-English data-flow statement, a draft DPIA and retention schedule | A lawyer-reviewed and signed policy set |
| Trademark search/filing | UK IPO, EUIPO, WIPO Global Brand Database and USPTO searches; a preliminary conflict log | Legal clearance and trademark filing fees |
| Open-source licence counsel | REUSE, ScanCode, ORT, `license-checker`, CycloneDX SBOM, the existing third-party notices generator | Counsel review of copyleft, patent and contribution terms |
| Export-control review | A self-assessment questionnaire based on UK/EU/US public guidance; an inventory of cryptographic and AI functionality | A formal export-control classification |
| Accounting/tax adviser | The internal double-entry ledger, open-source reporting and a documented tax-treatment draft | An accountant or tax adviser for a live finance product |
| Insurance (cyber/professional indemnity) | None; this is a paid product | A broker and policy before enterprise procurement |
| Accessibility user testing | Free assistive technology and self-conducted tests; community testing only with consent and fair treatment | Paid participant research with disabled users |
| Localisation vendors | Weblate, LibreTranslate, Pontoon and community review; pseudo-localisation tests | Professional translation and RTL review per locale |

## 2. Free pre-audit commands

These are development checks, not an audit:

```sh
npm audit --audit-level=high
npm run secret-scan
npm run release:sbom
npm run release:notices
npm run typecheck
npm run typecheck:apps
npm test
npm run test:apps
```

Additional tools, installed only when needed and never committed as a licence
obligation:

```sh
npx semgrep --config=auto
npx @axe-core/cli http://127.0.0.1:4173
npx pa11y http://127.0.0.1:4173
npx lighthouse http://127.0.0.1:4173 --only-categories=accessibility
```

If a tool requires a paid licence or a cloud account, record it as
`PAID_ONLY` and do not add it to the default gate.

## 3. Lawful cost reduction and reverse engineering

The owner may reduce costs by using open-source components, public
specifications and clean-room interoperability work. The following are
acceptable:

- Reading public specifications, RFCs, standards and open documentation.
- Using open-source implementations under their licences.
- Purchasing a licence for interoperability testing where required.
- Clean-room reimplementation from a specification, with provenance recorded.
- The limited UK CDPA section 50B interoperability exception, with legal review.
- Replacing a paid third-party service with a self-hosted open-source service
  when the licence and terms allow it.

The following are not acceptable:

- Bypassing DRM, licence checks, paywalls or paid-tier enforcement.
- Copying proprietary code, assets, fonts, models or datasets without a licence.
- Violating a provider's Terms of Service or automation rules.
- Creating duplicate accounts to evade quotas.
- Removing copyright notices or licence texts.
- Presenting a clean-room reimplementation as the original product.
- Using leaked, scraped or unlicensed material.

"Reverse engineer to cut costs" is therefore scoped to lawful interoperability
and clean-room work. It is not a licence to clone a competitor's product.

## 4. What the free pre-audit can and cannot prove

**Can prove:**

- Known dependency vulnerabilities are absent at the time of the scan.
- The secret scanner finds no known secret patterns in the declared scope.
- The accessibility tooling finds no automated violations in the tested pages.
- A keyboard and zoom test passes on the tested device.
- The SBOM and notices are generated from the actual dependency tree.

**Cannot prove:**

- That the system is secure against a determined attacker.
- That the product conforms to WCAG 2.2 AA for every user and workflow.
- That the legal documents are enforceable or compliant in every market.
- That the trademark is clear.
- That the export classification is correct.
- That a live financial service is compliant.

## 5. Gate mapping

| Release gate blocker | Free evidence that can be produced now | Remains red until |
|---|---|---|
| Security audit | Self-assessment, scans, SBOM, threat model, fuzzing results | Independent pen test and remediation acceptance |
| Accessibility audit | Automated scan, keyboard/zoom/high-contrast test, screen-reader notes | Independent WCAG 2.2 AA audit |
| Privacy policy | Draft notice, data-flow statement, DPIA draft, retention schedule | Lawyer review and owner approval |
| Security policy | `SECURITY.md`, `security.txt`, disclosure process, incident runbook | A monitored contact and owner sign-off |
| Backup/restore | A real backup and restore drill with recorded output | Owner sign-off on the drill and retention |
| Full acceptance fixtures | Open-format fixtures and structural tests | Complete fixtures for every claimed format |
| Five-star benchmark | Measured dimensions only, with gaps disclosed | A complete measured benchmark or an honest gap disclosure |

## 6. Order of work

1. Run the free pre-audit and fix what it finds.
2. Write the drafts: privacy notice, DPIA, incident response, security.txt,
   export-control self-assessment, trademark search log.
3. Run the backup/restore drill and record the result.
4. Run the accessibility pre-audit on the current host and the owner's iPad Pro
   and Android phone when available.
5. Only then book the paid audits, legal review and filings.
6. Keep the release gate red until the paid or owner-supplied evidence exists.
