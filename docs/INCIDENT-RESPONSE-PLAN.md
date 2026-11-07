# Incident response plan

**Status:** draft for owner review. This plan is not evidence that an incident
has been handled. The public-release security gate stays red until the owner
names a monitored contact, approves this plan and an independent review is
complete.

**Scope:** the `0.1.0` self-hosted web/PWA preview and the local Docker
self-host stack. Native packages, cloud production and live finance are outside
this scope.

## 1. Roles

| Role | Who | Responsibility |
|---|---|---|
| Incident commander | Owner (Jonathan) until delegated in writing | Declares severity, approves containment, owns external communication |
| Technical lead | The person operating the instance | Preserves evidence, contains, eradicates, recovers |
| Communications | Owner | User, regulator and public statements only after approval |
| Legal / privacy | Owner's adviser | Notification duties, contractual duties, privilege |
| Deputy | Named by the owner before public release | Covers the owner's absence |

No role may be claimed as staffed until the named person has accepted it. A
single-person project must record the deputy gap as a known limitation.

## 2. Severity

| Level | Examples | Target first response |
|---|---|---|
| SEV-1 | Confirmed secret or credential exposure, destructive data loss, unauthorised access to user data, live-money impact | Immediately; contain before other work |
| SEV-2 | Exploitable vulnerability without confirmed exploitation, ransomware attempt blocked, widespread outage | Within 4 hours |
| SEV-3 | Limited-scope vulnerability, single-user data issue, degraded service with a workaround | Within 1 business day |
| SEV-4 | Low-risk finding, policy gap, failed scan with no exploit path | Within 5 business days |

Severity is set by impact and exploitability, not by how easy the report is to
fix. When uncertain, start one level higher and downgrade after triage.

## 3. Detection sources

- Secret scanner, dependency audit, SBOM and release-gate results.
- Application and reverse-proxy logs.
- Host and container health checks.
- User or researcher reports through the published security contact.
- Provider security notices and dependency advisories.
- Unexpected billing, quota or resource changes.

The absence of a monitored alerting channel is a known gap. Until one exists,
detection depends on manual checks; do not describe the service as monitored.

## 4. Response phases

### 4.1 Triage and declaration

1. Record the report time, reporter, affected version, environment and observed
   behaviour.
2. Preserve the original report and initial evidence before changing anything.
3. Assign a severity and an incident ID (`INC-YYYYMMDD-NN`).
4. Open a private incident log. Do not put secrets, personal data or unredacted
   credentials in the log.
5. Declare the incident to the owner. For SEV-1, containment may start before
   the declaration is written.

### 4.2 Containment

- Revoke or rotate exposed credentials at the provider, not only in the repo.
- Disable the affected account, token, integration or feature.
- Isolate the host or container if lateral movement is suspected.
- Preserve logs and disk evidence before rebuilding.
- Do not delete evidence to make a scan look clean.

### 4.3 Eradication

- Identify the root cause and all affected versions, instances and data classes.
- Patch, upgrade or remove the vulnerable component.
- Re-scan and re-test the specific exploit path.
- Check for persistence: new accounts, keys, scheduled tasks, webhooks, forwards
  and container images.

### 4.4 Recovery

- Restore from a known-good backup into an isolated environment first.
- Verify integrity, access control and logging before returning to service.
- Rotate every secret that could have been exposed.
- Monitor closely after recovery and record the observation window.

### 4.5 Notification decision

The owner, with legal advice where required, decides whether to notify:

- affected users,
- the Information Commissioner's Office (UK GDPR, normally within 72 hours of
  awareness where a personal-data breach is reportable),
- contracted customers or partners,
- law enforcement or a regulator,
- the public.

Do not notify a regulator or user on the owner's behalf without explicit
authorisation. Do not promise confidentiality or a timeline that has not been
approved.

### 4.6 Closure

- Confirm the fix is deployed and the exploit path is closed.
- Record the final timeline, impact, data affected and evidence hashes.
- Record what was not determined.
- Assign follow-up actions with owners and dates.
- Update the threat model, tests and release gate where relevant.

## 5. Evidence handling

- Keep a write-once copy of logs and reports where possible.
- Record SHA-256 hashes of preserved files.
- Redact secrets and personal data from shared copies.
- Record who accessed evidence and when.
- Retain evidence for the period set by the owner and legal advice.
- Do not upload evidence to a third-party service without owner approval.

## 6. Communications templates

### 6.1 Internal declaration

> Incident `INC-YYYYMMDD-NN`, severity `SEV-n`, declared at `time` by `name`.
> Affected: `version / environment / data class`. Observed: `facts only`.
> Current action: `containment step`. Next update: `time`.

### 6.2 User notice (only after approval)

> We are investigating a security incident affecting `service` that may have
> involved `data category`. We have taken `containment step`. You can protect
> yourself by `specific action`. We will update you by `time / channel`.

Do not include speculation, blame or unverified scope.

### 6.3 Regulator notification

Prepared with legal advice. Include the nature of the breach, categories and
approximate numbers affected, likely consequences, measures taken, and the
contact point. Do not send without owner authorisation.

## 7. Tabletop exercises

Run at least these before public release, with the owner present:

1. A leaked provider API key in a public commit.
2. A dependency vulnerability with a known exploit against the preview.
3. Loss of the Docker host and restore from backup.
4. A user reports unauthorised access to their files.
5. A free-tier provider changes terms or leaks data.

Record date, participants, scenario, decisions, gaps and follow-up actions.
A tabletop is not a penetration test.

## 8. Owner inputs still required

- A monitored security contact and a private reporting channel.
- A named deputy.
- Retention period for logs and incident evidence.
- Legal/privacy adviser contact.
- Notification decision authority and out-of-hours process.
- Whether cyber insurance applies and what it requires.

## 9. Free-first boundaries

The plan may be exercised with free tools and local infrastructure. A paid
forensic retainer, legal review, insurance or independent audit is not replaced
by this document. The release gate remains fail-closed until the owner supplies
the required evidence.
