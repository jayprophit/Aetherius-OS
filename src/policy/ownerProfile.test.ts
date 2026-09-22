import { describe, expect, it } from "vitest";
import {
  activateProfile,
  classifyProtection,
  effectiveDecision,
  OWNER_FULL_CONTROL_V1,
  revokeProfile,
  type DecisionInput,
} from "./ownerProfile";

const ACTIVE = {
  ownerId: "owner-jp",
  scopeRoots: ["C:/Users/jpowe/Desktop/Projects"],
  issuedAt: 1000,
  expiresAt: null,
  provenance: "test",
  state: "ACTIVE" as const,
};

function decide(over: Partial<DecisionInput> = {}) {
  return effectiveDecision({
    profile: ACTIVE,
    nowMs: 2000,
    capability: "filesystem:write",
    protection: "ORDINARY",
    principalValid: true,
    inScope: true,
    ...over,
  });
}

describe("owner profile definition", () => {
  it("V1 set is explicit and closed (no wildcards)", () => {
    expect(OWNER_FULL_CONTROL_V1).toContain("filesystem:write");
    expect(OWNER_FULL_CONTROL_V1).toContain("shell:execute");
    for (const entry of OWNER_FULL_CONTROL_V1) {
      expect(entry).not.toContain("*");
    }
  });
  it("activation requires explicit owner authorization", () => {
    expect(() =>
      activateProfile({ ownerId: "o", scopeRoots: ["/ws"], ownerAuthorized: false, provenance: "t", nowMs: 0 }),
    ).toThrowError(/explicit owner authorization/);
    expect(() =>
      activateProfile({ ownerId: "", scopeRoots: ["/ws"], ownerAuthorized: true, provenance: "t", nowMs: 0 }),
    ).toThrowError(/ownerId/);
    const record = activateProfile({
      ownerId: "o", scopeRoots: ["/ws"], ownerAuthorized: true,
      provenance: "t", nowMs: 1000, expiresInMs: 5000,
    });
    expect(record.expiresAt).toBe(6000);
    expect(record.state).toBe("ACTIVE");
  });
  it("protected classification covers destructive/credential/policy/finance/firmware/physical", () => {
    expect(classifyProtection("filesystem", "delete", { permanent: true })).toBe("PROTECTED");
    expect(classifyProtection("filesystem", "read", { credential: true })).toBe("PROTECTED");
    expect(classifyProtection("system", "policy", { securityPolicy: true })).toBe("PROTECTED");
    expect(classifyProtection("finance", "pay", { finance: true })).toBe("PROTECTED");
    expect(classifyProtection("device", "flash", { firmware: true })).toBe("PROTECTED");
    expect(classifyProtection("device", "move", { physical: true })).toBe("PROTECTED");
    expect(classifyProtection("filesystem", "write", {})).toBe("ORDINARY");
    expect(classifyProtection("browser", "navigate", {})).toBe("FORBIDDEN");
    expect(classifyProtection("future", "teleport", {})).toBe("FORBIDDEN");
  });
});

describe("effective decisions", () => {
  it("ordinary in-scope valid requests are allowed", () => {
    expect(decide()).toEqual({ decision: "ALLOW", reason: "ALLOWED_BY_OWNER_FULL_CONTROL" });
  });
  it("protected requests require approval, never auto-allow", () => {
    expect(decide({ protection: "PROTECTED" })).toEqual({
      decision: "REQUIRE_APPROVAL",
      reason: "REQUIRES_PROTECTED_ACTION_APPROVAL",
    });
  });
  it("forbidden capabilities are denied even under full control", () => {
    expect(decide({ protection: "FORBIDDEN" })).toEqual({
      decision: "DENY",
      reason: "CAPABILITY_NOT_INCLUDED",
    });
  });
  it("out-of-scope, invalid principal and inactive profiles deny", () => {
    expect(decide({ inScope: false }).reason).toBe("OUTSIDE_OWNER_SCOPE");
    expect(decide({ principalValid: false }).reason).toBe("PRINCIPAL_INVALID");
    expect(decide({ profile: null }).reason).toBe("PROFILE_INACTIVE");
    expect(decide({ profile: { ...ACTIVE, state: "REVOKED" } }).reason).toBe("PROFILE_INACTIVE");
  });
  it("expiry is enforced on controllable clock", () => {
    const expiring = { ...ACTIVE, expiresAt: 3000 };
    expect(decide({ profile: expiring, nowMs: 2999 }).decision).toBe("ALLOW");
    expect(decide({ profile: expiring, nowMs: 3000 }).reason).toBe("PROFILE_EXPIRED");
  });
  it("revocation stops future authorization, history untouched", () => {
    const revoked = revokeProfile(ACTIVE);
    expect(revoked.state).toBe("REVOKED");
    expect(decide({ profile: revoked }).reason).toBe("PROFILE_INACTIVE");
    expect(ACTIVE.state).toBe("ACTIVE");
  });
});
