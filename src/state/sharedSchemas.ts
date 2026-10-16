import { validateEnvelope } from "../events/envelope";
import type { EventEnvelope } from "../events/envelope";
import type { ArtifactClass, ArtifactDescriptor } from "./artifacts";
import { sha256Hex } from "./store";
import type { SensitivityClass, StateEnvelope } from "./types";
import type { VerificationState } from "../workflows/deliverable";

/**
 * REQ-p17-shared-schemas: versioned application payload schemas over P17 envelopes.
 *
 * Applications already model their own entities in scattered shapes. What was
 * missing was one closed, additive payload vocabulary that can travel inside
 * the canonical P17 envelope without changing storage, persistence, authority
 * or verification rules. This unit supplies exactly that vocabulary.
 *
 * Payloads describe records; they never act. Wallet, transaction, reward and
 * governance records carry references and states, not balances, transfers,
 * issuance decisions or authorizations. Event correlation reuses the existing
 * P19 event envelope. Artifact metadata reuses the P17 artifact descriptor.
 */

export const SHARED_SCHEMA_VERSION = 1;
export const SHARED_ENVELOPE_KIND = "shared.payload" as const;

export const SHARED_DOMAINS = [
  "user",
  "org",
  "agent",
  "event",
  "artifact",
  "asset",
  "wallet",
  "transaction",
  "reward",
  "reputation",
  "course",
  "product",
  "job",
  "project",
  "contribution",
  "community",
  "governance-proposal",
] as const;
export type SharedDomain = (typeof SHARED_DOMAINS)[number];

export type SharedSchemaName = `aetherius-shared/${SharedDomain}/1`;

export interface SharedPayloadBase<Domain extends SharedDomain> {
  schema: `aetherius-shared/${Domain}/1`;
  schemaVersion: 1;
  id: string;
  owner: string;
  createdAt: string;
  provenance: string;
  sensitivity: SensitivityClass;
}

export interface UserPayload extends SharedPayloadBase<"user"> {
  handle: string;
  status: "active" | "suspended" | "deleted";
}

export interface OrgPayload extends SharedPayloadBase<"org"> {
  name: string;
  status: "active" | "dissolved";
  parentOrgRef?: string;
}

export interface AgentPayload extends SharedPayloadBase<"agent"> {
  profileRef: string;
  instanceRef?: string;
  status: "active" | "retired";
}

export interface EventPayload extends SharedPayloadBase<"event"> {
  name: string;
  occurredAt: string;
  severity: "info" | "warning" | "error";
  subjectRef?: string;
  correlation?: EventEnvelope<Record<string, unknown>>;
}

export interface ArtifactPayload extends SharedPayloadBase<"artifact"> {
  descriptor: ArtifactDescriptor;
}

export interface AssetPayload extends SharedPayloadBase<"asset"> {
  assetKind: "document" | "media" | "dataset" | "binary" | "reference";
  storageRef: string;
  contentHash: string;
  byteLength: number;
  mediaType?: string;
}

export interface WalletPayload extends SharedPayloadBase<"wallet"> {
  network: string;
  addressRef: string;
  status: "active" | "archived";
}

export interface TransactionPayload extends SharedPayloadBase<"transaction"> {
  transactionRef: string;
  kind: "transfer" | "escrow" | "refund" | "adjustment";
  amount: string;
  currency: string;
  status: "proposed" | "settled" | "reversed" | "void";
  payerRef?: string;
  payeeRef?: string;
  occurredAt: string;
}

export interface RewardPayload extends SharedPayloadBase<"reward"> {
  programRef: string;
  points: number;
  status: "allocated" | "redeemed" | "expired" | "revoked";
}

export interface ReputationPayload extends SharedPayloadBase<"reputation"> {
  subjectRef: string;
  outcome: "positive" | "neutral" | "negative";
  tallyRef?: string;
  evidenceRefs: string[];
}

export interface CoursePayload extends SharedPayloadBase<"course"> {
  title: string;
  providerRef?: string;
  status: "draft" | "published" | "archived";
}

export interface ProductPayload extends SharedPayloadBase<"product"> {
  name: string;
  sku?: string;
  status: "draft" | "active" | "retired";
}

export interface JobPayload extends SharedPayloadBase<"job"> {
  title: string;
  employmentType: "full-time" | "part-time" | "contract" | "temporary" | "internship";
  location?: string;
  status: "open" | "closed";
}

export interface ProjectPayload extends SharedPayloadBase<"project"> {
  name: string;
  phaseRef?: string;
  status: "active" | "paused" | "completed" | "cancelled";
}

export interface ContributionPayload extends SharedPayloadBase<"contribution"> {
  kind: "code" | "docs" | "review" | "research" | "support";
  subjectRef: string;
  status: "submitted" | "accepted" | "rejected";
}

export interface CommunityPayload extends SharedPayloadBase<"community"> {
  name: string;
  visibility: "public" | "private" | "invite-only";
}

export interface GovernanceProposalPayload extends SharedPayloadBase<"governance-proposal"> {
  title: string;
  proposalRef: string;
  stage: "PROPOSED" | "REVIEW" | "VOTE" | "WITHDRAWN" | "SUPERSEDED";
  outcome?: "SUPPORTED" | "OPPOSED" | "ABSTAINED";
}

export type SharedPayload =
  | UserPayload
  | OrgPayload
  | AgentPayload
  | EventPayload
  | ArtifactPayload
  | AssetPayload
  | WalletPayload
  | TransactionPayload
  | RewardPayload
  | ReputationPayload
  | CoursePayload
  | ProductPayload
  | JobPayload
  | ProjectPayload
  | ContributionPayload
  | CommunityPayload
  | GovernanceProposalPayload;

export type SharedSchemaProblemCode =
  | "SHARED_SCHEMA_DOMAIN_UNKNOWN"
  | "SHARED_SCHEMA_UNKNOWN_FIELD"
  | "SHARED_SCHEMA_SHAPE_INVALID";

export class SharedSchemaError extends Error {
  readonly code: SharedSchemaProblemCode;
  constructor(code: SharedSchemaProblemCode, message: string) {
    super(message);
    this.name = "SharedSchemaError";
    this.code = code;
  }
}

type FieldRule =
  | { name: string; kind: "text" }
  | { name: string; kind: "optional-text" }
  | { name: string; kind: "id" }
  | { name: string; kind: "optional-id" }
  | { name: string; kind: "ref" }
  | { name: string; kind: "optional-ref" }
  | { name: string; kind: "timestamp" }
  | { name: string; kind: "hash" }
  | { name: string; kind: "semver" }
  | { name: string; kind: "byte-length" }
  | { name: string; kind: "points" }
  | { name: string; kind: "enum"; values: readonly string[] }
  | { name: string; kind: "decimal" }
  | { name: string; kind: "currency" }
  | { name: string; kind: "evidence-refs" };

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const REF = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$/;
const TEXT = /^[\s\S]{1,500}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;
const DECIMAL = /^\d+(\.\d{1,8})?$/;
const CURRENCY = /^[A-Z]{3,10}$/;
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const SENSITIVITIES: readonly SensitivityClass[] = [
  "PUBLIC",
  "USER",
  "PRIVATE",
  "SYSTEM",
  "SECURITY_SENSITIVE",
  "SECRET_REFERENCE",
];
const ARTIFACT_CLASSES: readonly ArtifactClass[] = [
  "source",
  "docs",
  "media",
  "cad",
  "datasets",
  "tests",
  "benchmarks",
  "logs",
  "evidence",
  "diffs",
  "build-outputs",
  "mat-refs",
  "worker-outputs",
  "decisions",
];
const VERIFICATION_STATES: readonly VerificationState[] = ["UNVERIFIED", "EVIDENCE_COMPLETE", "VERIFIED", "FAILED"];

const DOMAIN_FIELDS: Record<SharedDomain, readonly FieldRule[]> = {
  user: [
    { name: "handle", kind: "id" },
    { name: "status", kind: "enum", values: ["active", "suspended", "deleted"] },
  ],
  org: [
    { name: "name", kind: "text" },
    { name: "status", kind: "enum", values: ["active", "dissolved"] },
    { name: "parentOrgRef", kind: "optional-ref" },
  ],
  agent: [
    { name: "profileRef", kind: "ref" },
    { name: "instanceRef", kind: "optional-ref" },
    { name: "status", kind: "enum", values: ["active", "retired"] },
  ],
  event: [
    { name: "name", kind: "text" },
    { name: "occurredAt", kind: "timestamp" },
    { name: "severity", kind: "enum", values: ["info", "warning", "error"] },
    { name: "subjectRef", kind: "optional-ref" },
  ],
  artifact: [],
  asset: [
    { name: "assetKind", kind: "enum", values: ["document", "media", "dataset", "binary", "reference"] },
    { name: "storageRef", kind: "ref" },
    { name: "contentHash", kind: "hash" },
    { name: "byteLength", kind: "byte-length" },
    { name: "mediaType", kind: "optional-text" },
  ],
  wallet: [
    { name: "network", kind: "text" },
    { name: "addressRef", kind: "ref" },
    { name: "status", kind: "enum", values: ["active", "archived"] },
  ],
  transaction: [
    { name: "transactionRef", kind: "ref" },
    { name: "kind", kind: "enum", values: ["transfer", "escrow", "refund", "adjustment"] },
    { name: "amount", kind: "decimal" },
    { name: "currency", kind: "currency" },
    { name: "status", kind: "enum", values: ["proposed", "settled", "reversed", "void"] },
    { name: "payerRef", kind: "optional-ref" },
    { name: "payeeRef", kind: "optional-ref" },
    { name: "occurredAt", kind: "timestamp" },
  ],
  reward: [
    { name: "programRef", kind: "ref" },
    { name: "points", kind: "points" },
    { name: "status", kind: "enum", values: ["allocated", "redeemed", "expired", "revoked"] },
  ],
  reputation: [
    { name: "subjectRef", kind: "ref" },
    { name: "outcome", kind: "enum", values: ["positive", "neutral", "negative"] },
    { name: "tallyRef", kind: "optional-ref" },
    { name: "evidenceRefs", kind: "evidence-refs" },
  ],
  course: [
    { name: "title", kind: "text" },
    { name: "providerRef", kind: "optional-ref" },
    { name: "status", kind: "enum", values: ["draft", "published", "archived"] },
  ],
  product: [
    { name: "name", kind: "text" },
    { name: "sku", kind: "optional-text" },
    { name: "status", kind: "enum", values: ["draft", "active", "retired"] },
  ],
  job: [
    { name: "title", kind: "text" },
    { name: "employmentType", kind: "enum", values: ["full-time", "part-time", "contract", "temporary", "internship"] },
    { name: "location", kind: "optional-text" },
    { name: "status", kind: "enum", values: ["open", "closed"] },
  ],
  project: [
    { name: "name", kind: "text" },
    { name: "phaseRef", kind: "optional-ref" },
    { name: "status", kind: "enum", values: ["active", "paused", "completed", "cancelled"] },
  ],
  contribution: [
    { name: "kind", kind: "enum", values: ["code", "docs", "review", "research", "support"] },
    { name: "subjectRef", kind: "ref" },
    { name: "status", kind: "enum", values: ["submitted", "accepted", "rejected"] },
  ],
  community: [
    { name: "name", kind: "text" },
    { name: "visibility", kind: "enum", values: ["public", "private", "invite-only"] },
  ],
  "governance-proposal": [
    { name: "title", kind: "text" },
    { name: "proposalRef", kind: "ref" },
    { name: "stage", kind: "enum", values: ["PROPOSED", "REVIEW", "VOTE", "WITHDRAWN", "SUPERSEDED"] },
    { name: "outcome", kind: "optional-text" },
  ],
};

function fail(code: SharedSchemaProblemCode, message: string): never {
  throw new SharedSchemaError(code, message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertBaseField(name: string, value: unknown): void {
  switch (name) {
    case "id":
    case "owner":
      if (typeof value !== "string" || !ID.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${name} must be an identifier`);
      return;
    case "provenance":
      if (typeof value !== "string" || !TEXT.test(value.trim())) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", "provenance is required");
      }
      return;
    case "createdAt":
      if (typeof value !== "string" || !INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", "createdAt must be a real timestamp");
      }
      return;
    case "sensitivity":
      if (!SENSITIVITIES.includes(value as SensitivityClass)) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `unknown sensitivity ${String(value)}`);
      }
      return;
    default:
      fail("SHARED_SCHEMA_UNKNOWN_FIELD", `unknown shared payload field ${name}`);
  }
}

function assertDomainField(domain: SharedDomain, rule: FieldRule, values: Record<string, unknown>): void {
  const value = values[rule.name];
  if (value === undefined) {
    if (rule.kind.startsWith("optional-")) return;
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} is required`);
  }
  switch (rule.kind) {
    case "text":
      if (typeof value !== "string" || !TEXT.test(value.trim())) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} is required`);
      return;
    case "optional-text":
      if (typeof value !== "string" || !TEXT.test(value.trim())) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be text`);
      }
      return;
    case "id":
      if (typeof value !== "string" || !ID.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be an identifier`);
      return;
    case "optional-id":
      if (typeof value !== "string" || !ID.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be an identifier`);
      return;
    case "ref":
      if (typeof value !== "string" || !REF.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a reference`);
      return;
    case "optional-ref":
      if (typeof value !== "string" || !REF.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a reference`);
      return;
    case "timestamp":
      if (typeof value !== "string" || !INSTANT.test(value) || !Number.isFinite(Date.parse(value))) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a real timestamp`);
      }
      return;
    case "hash":
      if (typeof value !== "string" || !HEX64.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be lowercase sha256`);
      return;
    case "semver":
      if (typeof value !== "string" || !SEMVER.test(value.trim())) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must use x.y.z`);
      return;
    case "byte-length":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a non-negative integer`);
      }
      return;
    case "points":
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a non-negative integer`);
      }
      return;
    case "decimal":
      if (typeof value !== "string" || !DECIMAL.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be a decimal string`);
      return;
    case "currency":
      if (typeof value !== "string" || !CURRENCY.test(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be an uppercase code`);
      return;
    case "enum":
      if (typeof value !== "string" || !rule.values.includes(value)) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be one of ${rule.values.join(", ")}`);
      }
      return;
    case "evidence-refs":
      if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string" || !REF.test(entry))) {
        fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.${rule.name} must be at least one reference`);
      }
      return;
  }
}

function assertArtifactDescriptor(domain: SharedDomain, value: unknown): void {
  if (!isRecord(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor must be an object`);
  const descriptor = value as Record<string, unknown> & {
    artifactClass?: unknown;
    contentHash?: unknown;
    byteLength?: unknown;
    provenance?: unknown;
    version?: unknown;
    verificationState?: unknown;
    securityClassification?: unknown;
  };
  if (!ARTIFACT_CLASSES.includes(descriptor.artifactClass as ArtifactClass)) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.artifactClass is unknown`);
  }
  if (typeof descriptor.contentHash !== "string" || !HEX64.test(descriptor.contentHash)) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.contentHash must be lowercase sha256`);
  }
  if (typeof descriptor.byteLength !== "number" || !Number.isInteger(descriptor.byteLength) || descriptor.byteLength < 0) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.byteLength must be a non-negative integer`);
  }
  if (typeof descriptor.provenance !== "string" || !TEXT.test(descriptor.provenance.trim())) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.provenance is required`);
  }
  if (typeof descriptor.version !== "string" || !SEMVER.test(descriptor.version.trim())) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.version must use x.y.z`);
  }
  if (!VERIFICATION_STATES.includes(descriptor.verificationState as VerificationState)) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.verificationState is unknown`);
  }
  if (!SENSITIVITIES.includes(descriptor.securityClassification as SensitivityClass)) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.descriptor.securityClassification is unknown`);
  }
}

function assertCorrelation(domain: SharedDomain, value: unknown): void {
  if (value === undefined) return;
  if (!isRecord(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.correlation must be an object`);
  const problems = validateEnvelope(value as unknown as EventEnvelope<Record<string, unknown>>);
  if (problems.length > 0) {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.correlation is invalid: ${problems.join(",")}`);
  }
}

function assertOutcome(domain: SharedDomain, value: unknown): void {
  if (value === undefined) return;
  if (value !== "SUPPORTED" && value !== "OPPOSED" && value !== "ABSTAINED") {
    fail("SHARED_SCHEMA_SHAPE_INVALID", `${domain}.outcome must be SUPPORTED, OPPOSED or ABSTAINED`);
  }
}

/**
 * Validate one shared payload without persisting, executing or authorizing
 * anything. Unknown fields are rejected because a schema that silently drops
 * data cannot be called shared.
 */
export function assertSharedPayload(value: unknown): SharedPayload {
  if (!isRecord(value)) fail("SHARED_SCHEMA_SHAPE_INVALID", "shared payload must be an object");
  const payload = value as Record<string, unknown> & { schema?: unknown };
  if (typeof payload.schema !== "string") fail("SHARED_SCHEMA_SHAPE_INVALID", "schema is required");
  const match = /^aetherius-shared\/([a-z-]+)\/1$/.exec(payload.schema);
  const domain = match?.[1] as SharedDomain | undefined;
  if (!domain || !(SHARED_DOMAINS as readonly string[]).includes(domain)) {
    fail("SHARED_SCHEMA_DOMAIN_UNKNOWN", `unknown shared domain ${String(payload.schema)}`);
  }
  if (payload.schemaVersion !== 1) fail("SHARED_SCHEMA_SHAPE_INVALID", "schemaVersion must be 1");
  const allowed = new Set([
    "schema",
    "schemaVersion",
    "id",
    "owner",
    "createdAt",
    "provenance",
    "sensitivity",
    ...(domain === "artifact" ? ["descriptor"] : []),
    ...(domain === "event" ? ["correlation"] : []),
    ...(domain === "governance-proposal" ? ["outcome"] : []),
    ...DOMAIN_FIELDS[domain].map((rule) => rule.name),
  ]);
  for (const key of Object.keys(payload)) {
    if (!allowed.has(key)) fail("SHARED_SCHEMA_UNKNOWN_FIELD", `unknown shared payload field ${key}`);
  }
  for (const name of ["id", "owner", "createdAt", "provenance", "sensitivity"] as const) {
    assertBaseField(name, payload[name]);
  }
  for (const rule of DOMAIN_FIELDS[domain]) assertDomainField(domain, rule, payload);
  if (domain === "artifact") assertArtifactDescriptor(domain, payload.descriptor);
  if (domain === "event") assertCorrelation(domain, payload.correlation);
  if (domain === "governance-proposal") assertOutcome(domain, payload.outcome);
  return payload as unknown as SharedPayload;
}

export interface WrapSharedPayloadOptions {
  recordVersion?: number;
  causedBy?: { actor: string; source: string };
  now: string;
}

/**
 * Carry a validated shared payload in a P17 envelope. The envelope stays the
 * persistence authority; the payload stays an additive description. No bytes
 * are copied here beyond the payload already supplied by the caller.
 */
export function wrapSharedPayload(
  payload: SharedPayload,
  options: WrapSharedPayloadOptions,
): StateEnvelope<SharedPayload> {
  const canonical = assertSharedPayload(payload);
  if (typeof options.now !== "string" || !INSTANT.test(options.now) || !Number.isFinite(Date.parse(options.now))) {
    throw new SharedSchemaError("SHARED_SCHEMA_SHAPE_INVALID", "wrapping requires a caller-supplied real timestamp");
  }
  if (options.recordVersion !== undefined && (!Number.isInteger(options.recordVersion) || options.recordVersion < 1)) {
    throw new SharedSchemaError("SHARED_SCHEMA_SHAPE_INVALID", "recordVersion must be a positive integer");
  }
  return {
    id: canonical.id,
    kind: SHARED_ENVELOPE_KIND,
    schemaVersion: SHARED_SCHEMA_VERSION,
    recordVersion: options.recordVersion ?? 1,
    createdAt: canonical.createdAt,
    updatedAt: options.now,
    owner: canonical.owner,
    provenance: canonical.provenance,
    sensitivity: canonical.sensitivity,
    integrity: sha256Hex(JSON.stringify(canonical)),
    causedBy: options.causedBy,
    payload: canonical,
  };
}

/** Read a stored envelope back as its validated shared payload. */
export function readSharedPayload(envelope: StateEnvelope<SharedPayload>): SharedPayload {
  if (!isRecord(envelope) || envelope.kind !== SHARED_ENVELOPE_KIND) {
    throw new SharedSchemaError(
      "SHARED_SCHEMA_SHAPE_INVALID",
      `record kind ${String((envelope as { kind?: unknown })?.kind)} is not a shared payload`,
    );
  }
  if (envelope.schemaVersion > SHARED_SCHEMA_VERSION) {
    throw new SharedSchemaError(
      "SHARED_SCHEMA_SHAPE_INVALID",
      `shared schema ${envelope.schemaVersion} is newer than supported`,
    );
  }
  return assertSharedPayload(envelope.payload);
}
