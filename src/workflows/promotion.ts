/**
 * REQ-p19-promotion: governed skill promotion lifecycle.
 *
 * A promotion is a recorded fact - candidate, evidence, pointer and history -
 * never an in-place mutation of the active version.
 */
import type { FileStateStore } from "../state/store";
import { validateSkill, type SkillRegistry } from "./skills";
import type { Skill } from "./types";

/**
 * P19/5 governed skill promotion lifecycle.
 *
 * GENERATED/BROADCAST skill != TRUSTED skill. Candidates live in staging,
 * never in the active registry; promotion is atomic, versioned, evidenced
 * and reversible. No silent self-modification, no self-approval, no
 * self-granted authority.
 */

export type CandidateState =
  | "DRAFT"
  | "CANDIDATE"
  | "STAGED"
  | "VALIDATING"
  | "VALIDATED"
  | "TESTING"
  | "TEST_FAILED"
  | "EVALUATING"
  | "SECURITY_REVIEW"
  | "REVIEW_REQUIRED"
  | "APPROVAL_REQUIRED"
  | "PROMOTABLE"
  | "PROMOTED"
  | "REJECTED"
  | "QUARANTINED"
  | "DEPRECATED"
  | "REVOKED";

export type OriginClass =
  | "OWNER_AUTHORED"
  | "AETHERIUS_FIRST_PARTY"
  | "GENESIS_GENERATED"
  | "WORKFLOW_DERIVED"
  | "EXPERIENCE_DERIVED"
  | "DOCUMENT_DERIVED"
  | "REFERENCE_ADAPTED"
  | "FORK_ADAPTED"
  | "IMPORTED_EXTERNAL";

export interface CandidateProvenance {
  origin: OriginClass;
  generator?: string;
  workflowRef?: string;
  parentSkill?: string;
  parentVersion?: string;
  sources: string[];
}

export interface LifecycleEvent {
  at: string;
  kind: string;
  detail?: string;
  by?: string;
}

export interface TestSuiteResult {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface TestReport {
  passed: boolean;
  suites: TestSuiteResult[];
}

export interface SecurityFinding {
  severity: "info" | "low" | "medium" | "high" | "critical";
  check: string;
  detail: string;
}

export interface EvaluationDimension {
  value: number;
  target?: number;
  pass: boolean;
}

export interface Evaluation {
  evalId: string;
  candidateHash: string;
  dimensions: Record<string, EvaluationDimension>;
  baselineVersion?: string;
  baselineRegression?: string[];
  timestamp: string;
  source: string;
}

export interface Review {
  reviewer: string;
  verdict: "APPROVE" | "REQUEST_CHANGES" | "REJECT";
  notes: string;
  at: string;
}

export interface PermissionDiff {
  addedPermissions: string[];
  removedPermissions: string[];
  addedCapabilities: string[];
  removedCapabilities: string[];
  expanded: boolean;
}

export interface SkillCandidate {
  candidateId: string;
  skillId: string;
  version: string;
  contentHash: string;
  content: Skill;
  provenance: CandidateProvenance;
  state: CandidateState;
  history: LifecycleEvent[];
  testReport?: TestReport;
  evaluations: Evaluation[];
  securityFindings: SecurityFinding[];
  reviews: Review[];
  permissionDiff?: PermissionDiff;
  ownerApproval?: { decision: "ALLOW" | "DENY"; by: string; at: string };
}

export type PromotionDecision =
  | "PROMOTABLE"
  | "REQUIRES_REVIEW"
  | "REQUIRES_OWNER_APPROVAL"
  | "REJECTED"
  | "QUARANTINED";

export interface PromotionRecord {
  skillId: string;
  fromVersion: string | null;
  toVersion: string;
  candidateHash: string;
  policyDecision: PromotionDecision;
  reviewers: string[];
  ownerApproval?: { decision: string; by: string; at: string };
  timestamp: string;
  provenance: string;
  actor: string;
}

/** Deterministic canonical serialization for content hashing. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((v) => stableStringify(v)).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}

export function hashSkill(def: Skill): string {
  // Hash the executable/instruction substance, not registry metadata.
  const substance = {
    skill_id: def.skill_id,
    version: def.version,
    name: def.name,
    description: def.description,
    capability: def.capability,
    inputs: def.inputs,
    outputs: def.outputs,
    required_capabilities: [...def.required_capabilities].sort(),
    required_permissions: [...def.required_permissions].sort(),
    required_tools: [...def.required_tools].sort(),
    supported_platforms: [...def.supported_platforms].sort(),
    execution_kind: def.execution_kind,
    implementation_ref: def.implementation_ref,
    risk_class: def.risk_class,
  };
  let digest = 0;
  const text = stableStringify(substance);
  for (let i = 0; i < text.length; i++) {
    digest = (Math.imul(digest, 31) + text.charCodeAt(i)) | 0;
  }
  return `fnv1a32:${(digest >>> 0).toString(16).padStart(8, "0")}`;
}

export interface TestHarness {
  run(candidate: SkillCandidate): TestReport | Promise<TestReport>;
}

export interface SecurityReviewer {
  review(candidate: SkillCandidate): SecurityFinding[] | Promise<SecurityFinding[]>;
}

const SECRET_PATTERNS = [
  /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/i,
  /bearer\s+[A-Za-z0-9._-]+/i,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /password\s*[:=]\s*['"][^'"]+['"]/i,
];

/** Static safety inspection: one gate among many, never final proof. */
export function staticSafetyScan(def: Skill): SecurityFinding[] {
  const findings: SecurityFinding[] = [];
  const text = `${def.description}\n${def.implementation_ref}\n${def.name}`;
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(text)) {
      findings.push({ severity: "critical", check: "hardcoded-secret", detail: `matches ${pattern.source}` });
    }
  }
  const risky = def.required_permissions.some((p) => /shell|delete|device|finance|credential|publish/i.test(p));
  if (risky && def.risk_class !== "high" && def.risk_class !== "critical") {
    findings.push({ severity: "medium", check: "risk-underclassified", detail: "sensitive permissions with low risk class" });
  }
  return findings;
}

export function permissionDiff(active: Skill | null, candidate: Skill): PermissionDiff {
  const before = new Set(active?.required_permissions ?? []);
  const after = new Set(candidate.required_permissions);
  const addedPermissions = [...after].filter((p) => !before.has(p)).sort();
  const removedPermissions = [...before].filter((p) => !after.has(p)).sort();
  const beforeCaps = new Set(active?.required_capabilities ?? []);
  const afterCaps = new Set(candidate.required_capabilities);
  const addedCapabilities = [...afterCaps].filter((c) => !beforeCaps.has(c)).sort();
  const removedCapabilities = [...beforeCaps].filter((c) => !afterCaps.has(c)).sort();
  return {
    addedPermissions, removedPermissions, addedCapabilities, removedCapabilities,
    expanded: addedPermissions.length > 0 || addedCapabilities.length > 0,
  };
}

/**
 * Deterministic promotion policy. Pure function of candidate evidence —
 * never LLM prose, never silent.
 */
export function promotionPolicy(candidate: SkillCandidate): { decision: PromotionDecision; reasons: string[] } {
  const reasons: string[] = [];
  if (candidate.state === "REJECTED") return { decision: "REJECTED", reasons: ["already rejected"] };
  if (candidate.state === "QUARANTINED") return { decision: "QUARANTINED", reasons: ["quarantined"] };
  if (!candidate.testReport || !candidate.testReport.passed) {
    return { decision: "REJECTED", reasons: ["tests missing or failing"] };
  }
  if (candidate.securityFindings.some((f) => f.severity === "critical")) {
    return { decision: "QUARANTINED", reasons: ["critical security finding"] };
  }
  const active = candidate.evaluations.length > 0;
  if (!active) {
    return { decision: "REJECTED", reasons: ["no evaluation evidence"] };
  }
  const failedDims = Object.entries(candidate.evaluations[candidate.evaluations.length - 1].dimensions)
    .filter(([, d]) => !d.pass)
    .map(([name]) => name);
  if (failedDims.length > 0) {
    return { decision: "REJECTED", reasons: [`failing dimensions: ${failedDims.join(",")}`] };
  }
  if (candidate.ownerApproval?.decision === "DENY") {
    return { decision: "REJECTED", reasons: ["owner denied promotion"] };
  }
  const risky =
    candidate.content.risk_class === "high" ||
    candidate.content.risk_class === "critical" ||
    (candidate.permissionDiff?.expanded ?? false) ||
    candidate.securityFindings.some((f) => f.severity === "high");
  const independentApproval = candidate.reviews.some(
    (r) => r.verdict === "APPROVE" && r.reviewer !== candidate.provenance.generator,
  );
  if (risky && candidate.ownerApproval?.decision !== "ALLOW") {
    reasons.push("risky candidate requires owner approval");
    return { decision: "REQUIRES_OWNER_APPROVAL", reasons };
  }
  if (!independentApproval) {
    reasons.push("no independent approval from a non-generator reviewer");
    return { decision: "REQUIRES_REVIEW", reasons };
  }
  return { decision: "PROMOTABLE", reasons: ["all gates pass"] };
}
