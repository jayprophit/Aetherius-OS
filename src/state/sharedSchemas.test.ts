import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FileStateStore } from "./store";
import {
  SHARED_DOMAINS,
  SHARED_ENVELOPE_KIND,
  SharedSchemaError,
  assertSharedPayload,
  readSharedPayload,
  wrapSharedPayload,
} from "./sharedSchemas";
import type { SharedDomain, SharedPayload } from "./sharedSchemas";

const HASH = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const AT = "2026-09-23T00:00:00.000Z";
let root = "";

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), "shared-schemas-"));
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function base<Domain extends SharedDomain>(domain: Domain, id: string) {
  return {
    schema: `aetherius-shared/${domain}/1`,
    schemaVersion: 1,
    id,
    owner: "aetherius-os",
    createdAt: AT,
    provenance: "shared-schema-fixture",
    sensitivity: "SYSTEM",
  } as const;
}

function artifactDescriptor() {
  return {
    artifactId: "evidence-shared-1.0.0",
    artifactClass: "evidence",
    contentHash: HASH,
    byteLength: 19,
    provenance: "shared-schema-fixture",
    version: "1.0.0",
    verificationState: "UNVERIFIED",
    securityClassification: "SYSTEM",
    envelope: {
      envelopeId: "evidence-shared",
      kind: "evidence.record",
      schemaVersion: 1,
      recordVersion: 1,
      integrity: HASH,
      sensitivity: "SYSTEM",
    },
  } as const;
}

function payloadFor(domain: SharedDomain): SharedPayload {
  switch (domain) {
    case "user":
      return { ...base(domain, "user-alice"), handle: "alice", status: "active" };
    case "org":
      return { ...base(domain, "org-acme"), name: "Acme", status: "active" };
    case "agent":
      return { ...base(domain, "agent-worker-7"), profileRef: "profiles/worker", status: "active" };
    case "event":
      return {
        ...base(domain, "event-deploy-1"),
        name: "deployment.finished",
        occurredAt: AT,
        severity: "info",
        correlation: {
          eventId: "deploy-1",
          eventType: "workflow:DEPLOY.FINISHED",
          schemaVersion: "1",
          domain: "workflow",
          occurredAt: Date.parse(AT),
          source: "workflow",
          payload: {},
          provenance: "shared-schema-fixture",
        },
      };
    case "artifact":
      return { ...base(domain, "artifact-shared-1"), descriptor: artifactDescriptor() };
    case "asset":
      return {
        ...base(domain, "asset-manual-1"),
        assetKind: "document",
        storageRef: "assets/manual.pdf",
        contentHash: HASH,
        byteLength: 19,
      };
    case "wallet":
      return { ...base(domain, "wallet-ops-1"), network: "example", addressRef: "wallets/ops-1", status: "active" };
    case "transaction":
      return {
        ...base(domain, "transaction-1"),
        transactionRef: "transactions/1",
        kind: "transfer",
        amount: "12.50",
        currency: "USD",
        status: "proposed",
        occurredAt: AT,
      };
    case "reward":
      return { ...base(domain, "reward-1"), programRef: "programs/contributor", points: 5, status: "allocated" };
    case "reputation":
      return {
        ...base(domain, "reputation-alice"),
        subjectRef: "users/alice",
        outcome: "positive",
        evidenceRefs: ["evidence/review-1"],
      };
    case "course":
      return { ...base(domain, "course-safety-1"), title: "Safety", status: "published" };
    case "product":
      return { ...base(domain, "product-ide-1"), name: "Workspace", status: "active" };
    case "job":
      return { ...base(domain, "job-docs-1"), title: "Documentarian", employmentType: "contract", status: "open" };
    case "project":
      return { ...base(domain, "project-aetherius"), name: "Aetherius", status: "active" };
    case "contribution":
      return { ...base(domain, "contribution-1"), kind: "docs", subjectRef: "projects/aetherius", status: "submitted" };
    case "community":
      return { ...base(domain, "community-ops"), name: "Operators", visibility: "invite-only" };
    case "governance-proposal":
      return {
        ...base(domain, "governance-proposal-1"),
        title: "Adopt shared payloads",
        proposalRef: "proposals/shared-payloads",
        stage: "PROPOSED",
      };
  }
}

function expectSharedError(fn: () => unknown, code: string) {
  try {
    fn();
    throw new Error("invalid shared payload was accepted");
  } catch (error) {
    expect(error).toBeInstanceOf(SharedSchemaError);
    expect((error as SharedSchemaError).code).toBe(code);
  }
}

describe("shared application payload schemas", () => {
  it("contains exactly the vocabulary named by the requirement", () => {
    expect([...SHARED_DOMAINS]).toEqual([
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
    ]);
  });

  it("carries every domain inside a P17 envelope without replacing storage", () => {
    const store = new FileStateStore(root, 1);
    for (const domain of SHARED_DOMAINS) {
      const payload = payloadFor(domain);
      const envelope = wrapSharedPayload(payload, { now: AT });
      expect(envelope.kind).toBe(SHARED_ENVELOPE_KIND);
      expect(store.exists(envelope.id)).toBe(false);
      const stored = store.save(envelope, { causedBy: { actor: "schema-fixture", source: "test" }, now: () => AT });
      expect(readSharedPayload(stored)).toEqual(assertSharedPayload(payload));
    }
    expect(store.listIds()).toHaveLength(SHARED_DOMAINS.length);
  });

  it("rejects an unknown domain and a schema that does not fit its fields", () => {
    expectSharedError(
      () => assertSharedPayload({ ...payloadFor("user"), schema: "aetherius-shared/mystery/1" }),
      "SHARED_SCHEMA_DOMAIN_UNKNOWN",
    );
    expectSharedError(
      () => assertSharedPayload({ ...payloadFor("user"), schema: "aetherius-shared/org/1" }),
      "SHARED_SCHEMA_UNKNOWN_FIELD",
    );
  });

  it("rejects unknown or credential-shaped fields instead of storing them", () => {
    expectSharedError(
      () => assertSharedPayload({ ...payloadFor("user"), password: "x" }),
      "SHARED_SCHEMA_UNKNOWN_FIELD",
    );
    expectSharedError(
      () => assertSharedPayload({ ...payloadFor("user"), status: "emperor" }),
      "SHARED_SCHEMA_SHAPE_INVALID",
    );
    expectSharedError(
      () => assertSharedPayload({ ...payloadFor("transaction"), amount: "12.500000000" }),
      "SHARED_SCHEMA_SHAPE_INVALID",
    );
  });

  it("reuses existing event correlation instead of replacing it", () => {
    const payload = payloadFor("event");
    if (payload.schema !== "aetherius-shared/event/1") throw new Error("fixture has the wrong domain");
    expectSharedError(
      () =>
        assertSharedPayload({
          ...payload,
          correlation: { ...payload.correlation, domain: "mystery" },
        }),
      "SHARED_SCHEMA_SHAPE_INVALID",
    );
  });
});
