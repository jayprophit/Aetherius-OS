/**
 * REQ-p17-service-primitives: one unified contract surface for application services.
 *
 * TypeScript service code already exists in separate places. What was missing
 * was the closed contract vocabulary that says which operations each
 * application primitive offers, what authority each operation needs, what
 * evidence it needs, and whether an implementation is actually bound. This
 * unit is that registry and validator. It performs no service work.
 *
 * Contracts describe; they never execute, authorize, transfer value, invoke a
 * model, publish a message or persist state. An `unbound` adapter is an
 * explicit statement that no implementation may be assumed, not a placeholder
 * waiting to be treated as real. Financial primitives are therefore
 * reference/describe-only with no execution authority.
 */

export const SERVICE_CONTRACT_VERSION = "1.0.0" as const;

export const SERVICE_PRIMITIVES = [
  "identity",
  "policy",
  "files",
  "search",
  "messaging",
  "wallet",
  "events",
  "rewards",
  "knowledge",
  "ai",
  "audit",
] as const;
export type ServicePrimitive = (typeof SERVICE_PRIMITIVES)[number];

export type ServiceAccess = "describe" | "read" | "request" | "verify";
export type ServiceAuthority = "none" | "owner-approval" | "p25-decision";
export type ServiceEvidence = "none" | "required";

export interface ServiceOperation {
  operation: string;
  access: ServiceAccess;
  authority: ServiceAuthority;
  evidence: ServiceEvidence;
  description: string;
}

export interface ServiceAdapterBinding {
  status: "bound" | "unbound";
  moduleRef?: string;
  unboundReason?: string;
}

export interface ServiceContract {
  primitive: ServicePrimitive;
  version: typeof SERVICE_CONTRACT_VERSION;
  summary: string;
  operations: ServiceOperation[];
  adapter: ServiceAdapterBinding;
}

export type ServiceContractProblemCode =
  | "SERVICE_PRIMITIVE_UNKNOWN"
  | "SERVICE_VERSION_INVALID"
  | "SERVICE_SUMMARY_INVALID"
  | "SERVICE_OPERATION_INVALID"
  | "SERVICE_OPERATION_DUPLICATE"
  | "SERVICE_AUTHORITY_INVALID"
  | "SERVICE_FINANCE_EXECUTION_REJECTED"
  | "SERVICE_ADAPTER_INVALID";

export class ServiceContractError extends Error {
  readonly code: ServiceContractProblemCode;
  constructor(code: ServiceContractProblemCode, message: string) {
    super(message);
    this.name = "ServiceContractError";
    this.code = code;
  }
}

const OPERATION_ID = /^[a-z][a-z0-9-]{1,63}$/;
const MODULE_REF = /^[a-z][A-Za-z0-9/_.-]*\.ts$/;
const ACCESS: readonly ServiceAccess[] = ["describe", "read", "request", "verify"];
const AUTHORITIES: readonly ServiceAuthority[] = ["none", "owner-approval", "p25-decision"];
const EVIDENCE: readonly ServiceEvidence[] = ["none", "required"];
const FINANCIAL_PRIMITIVES: readonly ServicePrimitive[] = ["wallet", "rewards"];

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function validateOperation(primitive: ServicePrimitive, operation: ServiceOperation): void {
  if (!operation || !OPERATION_ID.test(operation.operation)) {
    throw new ServiceContractError("SERVICE_OPERATION_INVALID", `${primitive} has a malformed operation id`);
  }
  if (!ACCESS.includes(operation.access)) {
    throw new ServiceContractError("SERVICE_OPERATION_INVALID", `${primitive}.${operation.operation} has unknown access`);
  }
  if (!AUTHORITIES.includes(operation.authority)) {
    throw new ServiceContractError(
      "SERVICE_AUTHORITY_INVALID",
      `${primitive}.${operation.operation} has unknown authority`,
    );
  }
  if (!EVIDENCE.includes(operation.evidence)) {
    throw new ServiceContractError("SERVICE_OPERATION_INVALID", `${primitive}.${operation.operation} has unknown evidence rule`);
  }
  if (!nonEmpty(operation.description) || operation.description.trim().length > 500) {
    throw new ServiceContractError("SERVICE_OPERATION_INVALID", `${primitive}.${operation.operation} needs a bounded description`);
  }
  // Authority here is a requirement on the caller, not a grant by the contract.
  // Financial operations are additionally confined to description/reference.
  if (
    FINANCIAL_PRIMITIVES.includes(primitive) &&
    (operation.access === "request" || operation.access === "verify" || operation.authority !== "none")
  ) {
    throw new ServiceContractError(
      "SERVICE_FINANCE_EXECUTION_REJECTED",
      `${primitive}.${operation.operation} must be authority-free description/reference metadata`,
    );
  }
}

function validateAdapter(primitive: ServicePrimitive, adapter: ServiceAdapterBinding): void {
  if (adapter.status !== "bound" && adapter.status !== "unbound") {
    throw new ServiceContractError("SERVICE_ADAPTER_INVALID", `${primitive} has unknown adapter status`);
  }
  if (adapter.status === "bound") {
    if (!adapter.moduleRef || !MODULE_REF.test(adapter.moduleRef)) {
      throw new ServiceContractError("SERVICE_ADAPTER_INVALID", `${primitive} claims a bound adapter without a module path`);
    }
    if (adapter.unboundReason !== undefined) {
      throw new ServiceContractError("SERVICE_ADAPTER_INVALID", `${primitive} cannot be both bound and unbound`);
    }
  } else {
    if (!nonEmpty(adapter.unboundReason)) {
      throw new ServiceContractError("SERVICE_ADAPTER_INVALID", `${primitive} is unbound without a recorded reason`);
    }
    if (adapter.moduleRef !== undefined) {
      throw new ServiceContractError(
        "SERVICE_ADAPTER_INVALID",
        `${primitive} must not name an implementation while reporting it unbound`,
      );
    }
  }
}

/** Validate one contract shape. No service is contacted, executed or authorized. */
export function assertServiceContract(contract: ServiceContract): ServiceContract {
  if (!contract || !(SERVICE_PRIMITIVES as readonly string[]).includes(contract.primitive)) {
    throw new ServiceContractError("SERVICE_PRIMITIVE_UNKNOWN", `unknown service primitive ${String(contract?.primitive)}`);
  }
  if (contract.version !== SERVICE_CONTRACT_VERSION) {
    throw new ServiceContractError("SERVICE_VERSION_INVALID", `${contract.primitive} must use contract ${SERVICE_CONTRACT_VERSION}`);
  }
  if (!nonEmpty(contract.summary) || contract.summary.trim().length > 500) {
    throw new ServiceContractError("SERVICE_SUMMARY_INVALID", `${contract.primitive} needs a bounded summary`);
  }
  if (!Array.isArray(contract.operations) || contract.operations.length === 0) {
    throw new ServiceContractError("SERVICE_OPERATION_INVALID", `${contract.primitive} needs at least one operation`);
  }
  const seen = new Set<string>();
  for (const operation of contract.operations) {
    validateOperation(contract.primitive, operation);
    if (seen.has(operation.operation)) {
      throw new ServiceContractError("SERVICE_OPERATION_DUPLICATE", `${contract.primitive} duplicates ${operation.operation}`);
    }
    seen.add(operation.operation);
  }
  validateAdapter(contract.primitive, contract.adapter);
  return {
    primitive: contract.primitive,
    version: contract.version,
    summary: contract.summary.trim(),
    operations: contract.operations.map((operation) => ({ ...operation, description: operation.description.trim() })),
    adapter: { ...contract.adapter },
  };
}

export const CANONICAL_SERVICE_CONTRACTS: readonly ServiceContract[] = [
  {
    primitive: "identity",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Reference Genesis identity without minting, storing or duplicating it.",
    operations: [
      { operation: "describe-identity-reference", access: "describe", authority: "none", evidence: "none", description: "Return the shape of an identity reference." },
      { operation: "bind-worker-reference", access: "request", authority: "owner-approval", evidence: "required", description: "Request a worker-to-identity binding for an authorized caller to perform." },
    ],
    adapter: { status: "bound", moduleRef: "src/genesis/identity.ts" },
  },
  {
    primitive: "policy",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Classify protection and evaluate an already-authorized owner profile.",
    operations: [
      { operation: "classify-protection", access: "read", authority: "none", evidence: "none", description: "Classify a capability against the explicit owner profile vocabulary." },
      { operation: "evaluate-effective-decision", access: "verify", authority: "none", evidence: "none", description: "Evaluate a decision from explicit profile, scope and protection inputs." },
    ],
    adapter: { status: "bound", moduleRef: "src/policy/ownerProfile.ts" },
  },
  {
    primitive: "files",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Describe file access through an Agent Bridge workspace session when one is bound.",
    operations: [
      { operation: "describe-file-bridge", access: "describe", authority: "none", evidence: "none", description: "Describe the file capability seam and its unavailable default." },
      { operation: "request-file-operation", access: "request", authority: "owner-approval", evidence: "required", description: "Request a file operation for a bound workspace session to perform." },
    ],
    adapter: { status: "unbound", unboundReason: "no Agent Bridge workspace session is bound" },
  },
  {
    primitive: "search",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Search local applications and optionally joined MAT records.",
    operations: [
      { operation: "search-applications", access: "read", authority: "none", evidence: "none", description: "Search the local application registry." },
      { operation: "search-materials", access: "read", authority: "none", evidence: "none", description: "Search joined MAT records when a provider is available." },
    ],
    adapter: { status: "bound", moduleRef: "src/search/search.ts" },
  },
  {
    primitive: "messaging",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Describe channels and inspect durable message state without sending.",
    operations: [
      { operation: "describe-channel", access: "describe", authority: "none", evidence: "none", description: "Describe a messaging channel and its transport limits." },
      { operation: "read-message-state", access: "read", authority: "none", evidence: "none", description: "Read durable message state without transmitting." },
    ],
    adapter: { status: "bound", moduleRef: "src/realtime/degradedLink.ts" },
  },
  {
    primitive: "wallet",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Reference wallets and addresses as metadata. No balances, transfers or custody.",
    operations: [
      { operation: "describe-wallet", access: "describe", authority: "none", evidence: "none", description: "Describe wallet metadata fields." },
      { operation: "reference-address", access: "read", authority: "none", evidence: "none", description: "Resolve a wallet address reference without accessing funds." },
    ],
    adapter: { status: "unbound", unboundReason: "no wallet implementation is bound" },
  },
  {
    primitive: "events",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Validate and correlate events without inventing causation or delivery.",
    operations: [
      { operation: "validate-envelope", access: "verify", authority: "none", evidence: "none", description: "Validate an event envelope structurally." },
      { operation: "correlate-event", access: "read", authority: "none", evidence: "none", description: "Read declared correlation identifiers without equating them." },
    ],
    adapter: { status: "bound", moduleRef: "src/events/envelope.ts" },
  },
  {
    primitive: "rewards",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Reference reward metadata. No issuance, redemption or treasury movement.",
    operations: [
      { operation: "describe-program", access: "describe", authority: "none", evidence: "none", description: "Describe reward-program metadata fields." },
      { operation: "reference-reward", access: "read", authority: "none", evidence: "none", description: "Resolve a reward reference without changing its state." },
    ],
    adapter: { status: "unbound", unboundReason: "no reward implementation is bound" },
  },
  {
    primitive: "knowledge",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Reference knowledge records without asserting retrieval, ranking or truth.",
    operations: [
      { operation: "describe-source", access: "describe", authority: "none", evidence: "none", description: "Describe a knowledge-source record." },
      { operation: "reference-record", access: "read", authority: "none", evidence: "none", description: "Resolve a knowledge record reference." },
    ],
    adapter: { status: "unbound", unboundReason: "no knowledge implementation is bound" },
  },
  {
    primitive: "ai",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Describe provider routing and request model work through an authorized invocation path.",
    operations: [
      { operation: "describe-provider-route", access: "describe", authority: "none", evidence: "none", description: "Describe an available provider route without invoking it." },
      { operation: "request-model-invocation", access: "request", authority: "owner-approval", evidence: "required", description: "Request model work for an authorized invocation path to perform." },
    ],
    adapter: { status: "bound", moduleRef: "src/providers/invoke.ts" },
  },
  {
    primitive: "audit",
    version: SERVICE_CONTRACT_VERSION,
    summary: "Check evidence citations and report audit shape without certifying work.",
    operations: [
      { operation: "validate-citation", access: "verify", authority: "none", evidence: "none", description: "Check whether an evidence citation resolves." },
      { operation: "report-audit-shape", access: "read", authority: "none", evidence: "none", description: "Report the structural shape of an audit finding." },
    ],
    adapter: { status: "bound", moduleRef: "src/programme/evidenceTrace.ts" },
  },
];

export class ServiceContractRegistry {
  private readonly byPrimitive = new Map<ServicePrimitive, ServiceContract>();

  register(contract: ServiceContract): ServiceContract {
    const canonical = assertServiceContract(contract);
    if (this.byPrimitive.has(canonical.primitive)) {
      throw new ServiceContractError("SERVICE_OPERATION_DUPLICATE", `${canonical.primitive} is already registered`);
    }
    this.byPrimitive.set(canonical.primitive, canonical);
    return canonical;
  }

  contractFor(primitive: ServicePrimitive): ServiceContract {
    const contract = this.byPrimitive.get(primitive);
    if (!contract) {
      throw new ServiceContractError("SERVICE_PRIMITIVE_UNKNOWN", `no service contract for ${primitive}`);
    }
    return contract;
  }

  contracts(): ServiceContract[] {
    return [...SERVICE_PRIMITIVES].map((primitive) => this.contractFor(primitive));
  }

  /** An unavailable contract can be described, never used as an implementation. */
  requireBoundContract(primitive: ServicePrimitive): ServiceContract {
    const contract = this.contractFor(primitive);
    if (contract.adapter.status !== "bound") {
      throw new ServiceContractError(
        "SERVICE_ADAPTER_INVALID",
        `${primitive} is unbound: ${contract.adapter.unboundReason ?? "no implementation"}`,
      );
    }
    return contract;
  }
}

/** The canonical closed set. Callers extend coverage by binding adapters, not by adding shadow registries. */
export function canonicalServiceRegistry(): ServiceContractRegistry {
  const registry = new ServiceContractRegistry();
  for (const contract of CANONICAL_SERVICE_CONTRACTS) registry.register(contract);
  return registry;
}

/** Primitives with contracts but no bound implementation. Reported, never papered over. */
export function unboundServicePrimitives(
  registry: ServiceContractRegistry = canonicalServiceRegistry(),
): ServicePrimitive[] {
  return registry.contracts().filter((contract) => contract.adapter.status !== "bound").map((contract) => contract.primitive);
}
