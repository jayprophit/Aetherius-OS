/**
 * REQ-owner-full-control: P25/1 OWNER_FULL_CONTROL canonical profile
 * definition (Aetherius side).
 *
 * A broad EXPLICIT owner grant for ordinary reversible workstation
 * operations — never a policy bypass. The Python Agent Bridge enforces it
 * at runtime; this module is the versioned definition both sides share:
 * capability set, protected classification, lifecycle semantics and the
 * effective-decision function. Unknown future capabilities are never
 * inherited: only a new reviewed profile version may extend the set.
 */

export const OWNER_FULL_CONTROL_V1 = [
  "filesystem:read",
  "filesystem:list",
  "filesystem:write",
  "filesystem:edit",
  "filesystem:patch",
  "filesystem:mkdir",
  "filesystem:move",
  "filesystem:copy",
  "shell:execute",
] as const;

export type OwnerCapabilityV1 = (typeof OWNER_FULL_CONTROL_V1)[number];

export type ProtectionClass = "ORDINARY" | "PROTECTED" | "FORBIDDEN";

export interface ProtectionFlags {
  permanent?: boolean;
  credential?: boolean;
  securityPolicy?: boolean;
  finance?: boolean;
  firmware?: boolean;
  physical?: boolean;
}

/**
 * Classify an action against the V1 set. Protected classes (destructive,
 * credential, policy, finance, firmware, physical) are never auto-granted;
 * anything outside the explicit set — including unknown future
 * capabilities — is FORBIDDEN (deny), never silently allowed.
 */
export function classifyProtection(
  service: string,
  action: string,
  flags: ProtectionFlags = {},
): ProtectionClass {
  if (flags.permanent && action === "delete") return "PROTECTED";
  if (flags.credential || flags.securityPolicy) return "PROTECTED";
  if (flags.finance || flags.firmware || flags.physical) return "PROTECTED";
  const key = `${service}:${action}`;
  if ((OWNER_FULL_CONTROL_V1 as readonly string[]).includes(key)) return "ORDINARY";
  return "FORBIDDEN";
}

export type ProfileState = "DISABLED" | "ACTIVE" | "EXPIRED" | "REVOKED";

export interface OwnerProfileRecord {
  ownerId: string;
  scopeRoots: string[];
  issuedAt: number;
  expiresAt: number | null;
  provenance: string;
  state: Exclude<ProfileState, "EXPIRED">;
}

export type DecisionReason =
  | "ALLOWED_BY_OWNER_FULL_CONTROL"
  | "REQUIRES_PROTECTED_ACTION_APPROVAL"
  | "OUTSIDE_OWNER_SCOPE"
  | "PROFILE_INACTIVE"
  | "PROFILE_EXPIRED"
  | "CAPABILITY_NOT_INCLUDED"
  | "PRINCIPAL_INVALID"
  | "POLICY_DENIED";

export interface EffectiveDecision {
  decision: "ALLOW" | "REQUIRE_APPROVAL" | "DENY";
  reason: DecisionReason;
}

export interface DecisionInput {
  profile: OwnerProfileRecord | null;
  nowMs: number;
  capability: string;
  protection: ProtectionClass;
  /** Principal already validated (genesis/worker/owner separation enforced upstream). */
  principalValid: boolean;
  /** Resource already confirmed inside a configured scope root. */
  inScope: boolean;
}

/**
 * Deterministic effective authorization. Pure function of explicit inputs:
 * ordinary + active + in-scope + valid principal → ALLOW; protected →
 * REQUIRE_APPROVAL; everything else → DENY with a structured reason.
 */
export function effectiveDecision(input: DecisionInput): EffectiveDecision {
  if (!input.principalValid) {
    return { decision: "DENY", reason: "PRINCIPAL_INVALID" };
  }
  if (input.profile === null) {
    return { decision: "DENY", reason: "PROFILE_INACTIVE" };
  }
  if (input.profile.state === "REVOKED" || input.profile.state === "DISABLED") {
    return { decision: "DENY", reason: "PROFILE_INACTIVE" };
  }
  if (input.profile.expiresAt !== null && input.nowMs >= input.profile.expiresAt) {
    return { decision: "DENY", reason: "PROFILE_EXPIRED" };
  }
  if (!input.inScope) {
    return { decision: "DENY", reason: "OUTSIDE_OWNER_SCOPE" };
  }
  if (input.protection === "FORBIDDEN") {
    return { decision: "DENY", reason: "CAPABILITY_NOT_INCLUDED" };
  }
  if (input.protection === "PROTECTED") {
    return { decision: "REQUIRE_APPROVAL", reason: "REQUIRES_PROTECTED_ACTION_APPROVAL" };
  }
  return { decision: "ALLOW", reason: "ALLOWED_BY_OWNER_FULL_CONTROL" };
}

export interface ActivationInput {
  ownerId: string;
  scopeRoots: string[];
  /** Must come from the trusted owner path; models/skills/workflows/workers can never set it. */
  ownerAuthorized: boolean;
  provenance: string;
  nowMs: number;
  expiresInMs?: number;
}

export function activateProfile(input: ActivationInput): OwnerProfileRecord {
  if (!input.ownerAuthorized) {
    throw new Error("OWNER_FULL_CONTROL requires explicit owner authorization");
  }
  if (!input.ownerId.trim()) throw new Error("ownerId is required");
  if (input.scopeRoots.length === 0) throw new Error("at least one scope root is required");
  return {
    ownerId: input.ownerId.trim(),
    scopeRoots: [...input.scopeRoots],
    issuedAt: input.nowMs,
    expiresAt: input.expiresInMs !== undefined ? input.nowMs + input.expiresInMs : null,
    provenance: input.provenance || "explicit-owner-activation",
    state: "ACTIVE",
  };
}

export function revokeProfile(record: OwnerProfileRecord): OwnerProfileRecord {
  return { ...record, state: "REVOKED" };
}
