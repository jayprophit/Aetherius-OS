# Privacy notice — draft

**Status:** DRAFT. Not legal advice. Not published. Do not use this as the
public privacy policy until the owner, the hosting operator and a qualified
adviser have reviewed it and the release gate records that review.

**Assumption to verify before publication:** the `0.1.0` build and the local
self-host stack enable no advertising, analytics, crash-reporting or telemetry
SDK by default. If that is not true, this notice must be updated before release.

## 1. Who is responsible

For a self-hosted instance, the person or organisation running the instance is
normally the data controller. For the project's own hosted service, the
controller is:

> `LEGAL ENTITY — OWNER TO CONFIRM`  
> `REGISTERED ADDRESS — OWNER TO CONFIRM`  
> `PRIVACY CONTACT — OWNER TO CONFIRM`

The project working name `Aetherius` is temporary. This notice does not claim a
registered company, trademark or supervisory-authority registration that does
not exist.

## 2. What the preview stores

| Data | Where it is stored | Why |
|---|---|---|
| Account name, email and hashed password | The instance's identity service | Sign-in and account administration |
| Files, notes, calendar entries and photos you create | The instance's file store and database | The feature you asked for |
| App settings and local preferences | Your browser storage and the instance | Keep the interface and data consistent |
| AI prompts and results | Local model runtime; a cloud provider only if you enable a free-tier fallback | Answer your request |
| Vector embeddings | Local Qdrant or pgvector | Local search and retrieval |
| Operational logs | The instance host | Security, troubleshooting and health |
| Backup archives | Storage chosen by the operator | Recovery after loss |

Do not enter special-category data, financial account credentials, government
identifiers or other high-risk data into the preview. The preview is a
developer preview, not a records system.

## 3. What leaves your device — plain English

| Destination | What can be sent | When | Control |
|---|---|---|---|
| Your own self-hosted server | The data you create and your sign-in session | When you use the app | You or your operator controls the server |
| Local Ollama | Your prompt and the context you select | When you use the local assistant | Stays on the machine running Ollama |
| A free-tier cloud AI provider | The minimum prompt needed, with secrets and personal data removed | Only if the owner has configured a key and the request is eligible | Disabled by default for confidential data; can be turned off |
| Open-Meteo / OpenStreetMap | Approximate location or map tile requests | Only if weather or maps are used | Optional feature |
| SearXNG | Your search query | Only if web search is used | Self-hosted by default |
| Matrix / LiveKit | Messages, calls and metadata | Only if federation or calls are enabled | Operator and homeserver policy |
| Let's Encrypt / a certificate authority | Domain name and certificate request metadata | When TLS certificates are issued | Standard public certificate transparency |
| Your DNS and hosting providers | Network metadata | When the instance is reached | Chosen by the operator |

The preview does not sell data, run advertising auctions or build an advertising
profile. If that ever changes, this notice must change first.

## 4. AI-specific statement

- Local inference is the default. A prompt handled by local Ollama does not
  leave the machine running Ollama.
- A cloud free-tier provider is used only when the owner has supplied a key, the
  provider's free terms have been checked, the data class allows it and quota
  remains.
- `CONFIDENTIAL` and `SECRET` tasks are forced to local inference.
- Owner data is not used for provider training. A provider without a no-training
  term is not eligible for owner data.
- Every cloud request is intended to record the provider, model, purpose, data
  class and provenance.
- If no eligible provider is available, the task fails, queues or pauses. It
  does not silently call a paid model.

## 5. Legal bases (UK GDPR / EU GDPR)

The operator must confirm the applicable basis for each purpose. Typical
candidates are:

- contract: providing the account and the features you request;
- legitimate interests: securing the service and preventing abuse, subject to a
  balancing test;
- consent: optional features that are not necessary for the service, where
  consent is the appropriate basis;
- legal obligation: tax, accounting and lawful requests.

Consent must be freely given, specific, informed and withdrawable. Do not use
consent as a catch-all.

## 6. Retention

| Data | Proposed retention | Owner decision |
|---|---|---|
| Account data | While the account exists, then a short deletion window | Confirm |
| User files | Until the user deletes them or the account closes | Confirm |
| Operational logs | Short rolling window | Confirm |
| Incident evidence | Set by legal advice | Confirm |
| Backups | Rolling window with secure deletion | Confirm |
| AI request metadata | Minimum needed for quota and audit | Confirm |

A retention schedule and deletion procedure are still required. This draft does
not claim that automatic deletion is implemented.

## 7. Your rights

Subject to the applicable law, you may request access, correction, deletion,
restriction, portability or objection, and you may withdraw consent. The
operator must provide a working contact and a response process before this
notice is published. You may complain to the Information Commissioner's Office
(UK) or your local supervisory authority.

## 8. Security

The project uses local-first defaults, least-privilege tool access, secret
scanning, dependency review and a fail-closed release gate. No system is
perfect. The preview is not certified, independently audited or insured, and the
security policy is still being completed.

## 9. International transfers

A self-hosted instance normally stays in the operator's chosen region. A
free-tier cloud AI provider may process data outside the UK/EEA. Before enabling
one, the operator must record the provider, region, transfer mechanism and
safeguards. If a provider cannot meet the required terms, it is not eligible.

## 10. Children

The preview is not directed at children. The operator must set a minimum age and
a process if the service could be used by children in its market.

## 11. Changes

Material changes must be published before they take effect, with a date and a
description of what changed. The owner must approve the final text.

## 12. What is still missing before publication

- Confirmed legal entity, address and privacy contact.
- Reviewed retention schedule and deletion procedure.
- Confirmed data flows from the actual build, not this draft.
- Confirmed provider list, regions and contract terms.
- DPIA where required, records of processing and an ICO registration decision.
- Cookie notice if any non-essential cookie or similar technology is used.
- Accessibility of the notice itself.
- Owner and legal sign-off.
