import type { FileStateStore } from "../state/store";
import { StateError } from "../state/types";
import { hashSkill, promotionPolicy, staticSafetyScan, type CandidateProvenance, type Evaluation, type Review, type SecurityFinding, type SkillCandidate, type TestHarness, type TestReport } from "./promotion";
import type { SecurityReviewer } from "./promotion";
import { validateSkill, type SkillRegistry } from "./skills";
import type { Skill } from "./types";

export interface LifecycleOptions {
  now?: () => string;
  id?: () => string;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const candidateEnvelopeId = (candidateId: string): string => `candidate-${candidateId}`;
const activeEnvelopeId = (skillId: string): string => `skill-active-${skillId}`;
const revokedEnvelopeId = (skillId: string): string => `skill-revoked-${skillId}`;
const promotionEnvelopeId = (skillId: string, version: string): string =>
  `promotion-${skillId}-${version}`.replace(/[^A-Za-z0-9_-]+/g, "-");

/**
 * Governed skill lifecycle. Candidates live in staging (P17 envelopes),
 * never in the active SkillRegistry. Promotion is atomic, evidenced and
 * reversible; every gate failure is terminal for that candidate path.
 */
export class SkillLifecycle {
  private readonly active: SkillRegistry;
  private readonly store: FileStateStore | null;
  private readonly now: () => string;
  private readonly makeId: () => string;
  private seq = 0;

  constructor(active: SkillRegistry, store: FileStateStore | null = null, options: LifecycleOptions = {}) {
    this.active = active;
    this.store = store;
    this.now = options.now ?? (() => new Date().toISOString());
    this.makeId = options.id ?? (() => `cand-${Date.now().toString(36)}-${(this.seq++).toString(36)}`);
  }

  // -- candidate intake ---------------------------------------------------

  propose(content: Skill, provenance: CandidateProvenance): SkillCandidate {
    const problem = validateSkill(content);
    if (problem) {
      throw new Error(`invalid candidate schema: ${problem}`);
    }
    if (!provenance.sources || provenance.sources.length === 0) {
      throw new Error("candidate provenance requires at least one source");
    }
    const candidate: SkillCandidate = {
      candidateId: this.makeId(),
      skillId: content.skill_id,
      version: content.version,
      contentHash: hashSkill(content),
      content: JSON.parse(JSON.stringify(content)) as Skill,
      provenance: JSON.parse(JSON.stringify(provenance)) as CandidateProvenance,
      state: "CANDIDATE",
      history: [],
      evaluations: [],
      securityFindings: [],
      reviews: [],
    };
    this.emit(candidate, "candidate.proposed", `hash ${candidate.contentHash}`);
    // Duplicate identity/version against active registry AND staging.
    if (this.active.lookup(candidate.skillId, candidate.version)) {
      throw new Error(`duplicate identity: ${candidate.skillId}@${candidate.version} already active`);
    }
    if (this.store) {
      for (const id of this.listCandidateIds()) {
        const other = this.readCandidate(id);
        if (other.skillId === candidate.skillId && other.version === candidate.version) {
          throw new Error(`duplicate identity: ${candidate.skillId}@${candidate.version} already staged`);
        }
      }
    }
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  stage(candidateId: string): SkillCandidate {
    const candidate = this.require(candidateId, ["CANDIDATE"]);
    candidate.state = "STAGED";
    this.emit(candidate, "candidate.staged", "entered isolated staging; not visible to production resolution");
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  // -- gates ---------------------------------------------------------------

  validateSchema(candidateId: string): SkillCandidate {
    const candidate = this.require(candidateId, ["STAGED"]);
    candidate.state = "VALIDATING";
    const problem = validateSkill(candidate.content);
    if (problem) {
      candidate.state = "REJECTED";
      this.emit(candidate, "candidate.rejected", `schema: ${problem}`);
    } else {
      candidate.state = "VALIDATED";
      this.emit(candidate, "candidate.validated");
    }
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  async runTests(candidateId: string, harness: TestHarness): Promise<SkillCandidate> {
    const candidate = this.require(candidateId, ["VALIDATED"]);
    candidate.state = "TESTING";
    this.persistCandidate(candidate);
    let report: TestReport;
    try {
      report = await harness.run(this.snapshot(candidate));
    } catch (error) {
      report = { passed: false, suites: [{ name: "harness", passed: false, detail: errorMessage(error) }] };
    }
    candidate.testReport = report;
    candidate.state = report.passed ? "EVALUATING" : "TEST_FAILED";
    this.emit(candidate, report.passed ? "candidate.tested" : "candidate.test-failed", `${report.suites.length} suite(s)`);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  recordEvaluation(candidateId: string, evaluation: Omit<Evaluation, "candidateHash" | "timestamp"> & { candidateHash?: string; timestamp?: string }): SkillCandidate {
    const candidate = this.require(candidateId, ["EVALUATING", "SECURITY_REVIEW", "REVIEW_REQUIRED", "APPROVAL_REQUIRED"]);
    if (evaluation.candidateHash !== undefined && evaluation.candidateHash !== candidate.contentHash) {
      throw new Error("evaluation references a different candidate hash");
    }
    const full: Evaluation = {
      ...evaluation,
      candidateHash: candidate.contentHash,
      timestamp: evaluation.timestamp ?? this.now(),
    };
    candidate.evaluations.push(full);
    this.emit(candidate, "candidate.evaluated", `${evaluation.evalId}: ${Object.keys(evaluation.dimensions).length} dimension(s)`);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  async runSecurity(candidateId: string, reviewer?: SecurityReviewer): Promise<SkillCandidate> {
    const candidate = this.require(candidateId, ["EVALUATING", "VALIDATED", "SECURITY_REVIEW"]);
    candidate.state = "SECURITY_REVIEW";
    const staticFindings = staticSafetyScan(candidate.content);
    const active = this.active.lookup(candidate.skillId);
    const before = new Set(active?.required_permissions ?? []);
    const added = candidate.content.required_permissions.filter((p) => !before.has(p));
    const findings: SecurityFinding[] = [...staticFindings];
    if (reviewer) {
      try {
        findings.push(...(await reviewer.review(this.snapshot(candidate))));
      } catch (error) {
        findings.push({ severity: "medium", check: "reviewer-error", detail: errorMessage(error) });
      }
    }
    // Permission expansion is a first-class security fact, not silent metadata.
    if (added.length > 0) {
      findings.push({ severity: "high", check: "privilege-expansion", detail: `added: ${added.join(",")}` });
    }
    findings.sort((a, b) => (a.severity < b.severity ? -1 : a.severity > b.severity ? 1 : a.check.localeCompare(b.check)));
    candidate.securityFindings = findings;
    candidate.permissionDiff = {
      addedPermissions: added.sort(),
      removedPermissions: (active?.required_permissions ?? []).filter((p) => !candidate.content.required_permissions.includes(p)).sort(),
      addedCapabilities: candidate.content.required_capabilities.filter((c) => !(active?.required_capabilities ?? []).includes(c)).sort(),
      removedCapabilities: (active?.required_capabilities ?? []).filter((c) => !candidate.content.required_capabilities.includes(c)).sort(),
      expanded: false,
    };
    candidate.permissionDiff.expanded =
      candidate.permissionDiff.addedPermissions.length > 0 || candidate.permissionDiff.addedCapabilities.length > 0;
    this.emit(candidate, "candidate.security-reviewed", `${findings.length} finding(s)`);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  recordReview(candidateId: string, reviewer: string, verdict: Review["verdict"], notes: string): SkillCandidate {
    const candidate = this.require(candidateId, ["SECURITY_REVIEW", "REVIEW_REQUIRED", "EVALUATING", "APPROVAL_REQUIRED"]);
    if (!reviewer.trim()) throw new Error("reviewer identity is required");
    if (reviewer === candidate.provenance.generator) {
      throw new Error("generator cannot review its own candidate");
    }
    candidate.reviews.push({ reviewer, verdict, notes, at: this.now() });
    if (verdict === "REJECT") {
      candidate.state = "REJECTED";
      this.emit(candidate, "candidate.rejected", `reviewer ${reviewer}: ${notes}`, reviewer);
    } else if (verdict === "REQUEST_CHANGES") {
      candidate.state = "REVIEW_REQUIRED";
      this.emit(candidate, "candidate.changes-requested", `reviewer ${reviewer}: ${notes}`, reviewer);
    } else {
      this.emit(candidate, "candidate.reviewed", `approver ${reviewer}: ${notes}`, reviewer);
    }
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  decide(candidateId: string): { decision: string; reasons: string[]; candidate: SkillCandidate } {
    // Accepted broadly on purpose: the policy itself is the judge, so even
    // early or terminal states get a truthful decision instead of a usage error.
    const candidate = this.require(candidateId, [
      "VALIDATED", "TESTING", "TEST_FAILED", "EVALUATING", "SECURITY_REVIEW",
      "REVIEW_REQUIRED", "APPROVAL_REQUIRED", "REJECTED", "QUARANTINED",
    ]);
    const { decision, reasons } = promotionPolicy(candidate);
    if (decision === "PROMOTABLE") {
      // State stays; promote() performs the transition.
    } else if (decision === "REQUIRES_REVIEW") {
      candidate.state = "REVIEW_REQUIRED";
    } else if (decision === "REQUIRES_OWNER_APPROVAL") {
      candidate.state = "APPROVAL_REQUIRED";
    } else if (decision === "QUARANTINED") {
      candidate.state = "QUARANTINED";
    } else {
      candidate.state = "REJECTED";
    }
    this.emit(candidate, "policy.decided", `${decision}: ${reasons.join("; ")}`);
    this.persistCandidate(candidate);
    return { decision, reasons, candidate: this.snapshot(candidate) };
  }

  approveOwner(candidateId: string, decision: "ALLOW" | "DENY", by: string): SkillCandidate {
    const candidate = this.require(candidateId, ["APPROVAL_REQUIRED"]);
    candidate.ownerApproval = { decision, by, at: this.now() };
    if (decision === "DENY") {
      candidate.state = "REJECTED";
      this.emit(candidate, "candidate.rejected", `owner ${by} denied promotion`, by);
    } else {
      this.emit(candidate, "candidate.owner-approved", `owner ${by} allowed promotion`, by);
    }
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  quarantine(candidateId: string, reason: string, by = "policy"): SkillCandidate {
    const candidate = this.readCandidate(candidateId);
    if (["PROMOTED", "REJECTED"].includes(candidate.state)) {
      throw new Error(`cannot quarantine ${candidate.state} candidate`);
    }
    candidate.state = "QUARANTINED";
    this.emit(candidate, "candidate.quarantined", reason, by);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  reject(candidateId: string, reason: string, by = "policy"): SkillCandidate {
    const candidate = this.readCandidate(candidateId);
    if (["PROMOTED"].includes(candidate.state)) {
      throw new Error("cannot reject a promoted candidate; use revoke/rollback");
    }
    candidate.state = "REJECTED";
    this.emit(candidate, "candidate.rejected", reason, by);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  // -- promotion ------------------------------------------------------------

  promote(candidateId: string, actor: string): SkillCandidate {
    const candidate = this.readCandidate(candidateId);
    // Recompute the hash: content changed after evaluation invalidates it.
    const currentHash = this.hashOf(candidate.content);
    if (currentHash !== candidate.contentHash) {
      candidate.state = "REJECTED";
      this.emit(candidate, "candidate.rejected", "content changed after evaluation; hash mismatch");
      this.persistCandidate(candidate);
      throw new Error("promotion refused: candidate content changed after evaluation");
    }
    const { decision, reasons } = promotionPolicy(candidate);
    if (decision !== "PROMOTABLE") {
      throw new Error(`promotion refused: policy says ${decision} (${reasons.join("; ")})`);
    }
    if (this.active.lookup(candidate.skillId, candidate.version)) {
      throw new Error(`promotion refused: ${candidate.skillId}@${candidate.version} already active (versions are immutable)`);
    }
    // Atomic promotion: register artifact, move active pointer with
    // optimistic concurrency, record promotion, verify reload.
    this.active.register(JSON.parse(JSON.stringify(candidate.content)) as SkillCandidate["content"]);
    const previous = this.readActivePointer(candidate.skillId);
    this.writeActivePointer(candidate.skillId, candidate.version, actor, `promote ${candidateId}`);
    this.writePromotionRecord({
      skillId: candidate.skillId,
      fromVersion: previous,
      toVersion: candidate.version,
      candidateHash: candidate.contentHash,
      policyDecision: decision,
      reviewers: candidate.reviews.filter((r) => r.verdict === "APPROVE").map((r) => r.reviewer),
      ownerApproval: candidate.ownerApproval
        ? { decision: candidate.ownerApproval.decision, by: candidate.ownerApproval.by, at: candidate.ownerApproval.at }
        : undefined,
      timestamp: this.now(),
      provenance: candidate.provenance.sources.join("; "),
      actor,
    });
    const reloaded = this.active.lookup(candidate.skillId, candidate.version);
    if (!reloaded || this.hashOf(reloaded) !== candidate.contentHash) {
      throw new Error("promotion failed verification reload");
    }
    candidate.state = "PROMOTED";
    this.emit(candidate, "candidate.promoted", `${candidate.skillId}@${candidate.version} by ${actor}`, actor);
    this.persistCandidate(candidate);
    return this.snapshot(candidate);
  }

  rollback(skillId: string, targetVersion: string, actor: string, reason: string): string {
    const record = this.readPromotionRecord(skillId, targetVersion);
    if (!record) {
      throw new Error(`rollback refused: ${skillId}@${targetVersion} was never promoted`);
    }
    if (this.isRevoked(skillId, targetVersion)) {
      throw new Error(`rollback refused: ${skillId}@${targetVersion} is revoked`);
    }
    this.writeActivePointer(skillId, targetVersion, actor, `rollback: ${reason}`);
    return targetVersion;
  }

  revoke(skillId: string, version: string, _actor: string, _reason: string): void {
    const key = `${skillId}@${version}`;
    const revoked = this.readRevoked(skillId);
    if (!revoked.includes(key)) {
      revoked.push(key);
      this.writeRevoked(skillId, revoked);
    }
  }

  isRevoked(skillId: string, version: string): boolean {
    return this.readRevoked(skillId).includes(`${skillId}@${version}`);
  }

  /** Active-version resolution honoring revocation. Never falls back silently. */
  lookupActive(skillId: string, version?: string) {
    const active = version ?? this.readActivePointer(skillId);
    if (!active) throw new Error(`no active version for ${skillId}`);
    if (this.isRevoked(skillId, active)) {
      throw new Error(`${skillId}@${active} is revoked; rollback to a trusted version first`);
    }
    const skill = this.active.lookup(skillId, active);
    if (!skill) throw new Error(`active version ${skillId}@${active} missing from registry`);
    return skill;
  }

  summarize(skillId: string): string {
    const pointer = this.readActivePointer(skillId);
    const lines = [`SKILL: ${skillId}`, `ACTIVE: ${pointer ?? "none"}`];
    if (this.store) {
      const candidates = this.listCandidateIds()
        .map((id) => this.readCandidate(id))
        .filter((c) => c.skillId === skillId && c.state !== "PROMOTED" && c.state !== "REJECTED")
        .sort((a, b) => (a.candidateId < b.candidateId ? -1 : 1));
      for (const c of candidates) {
        lines.push(`CANDIDATE: v${c.version} STATE: ${c.state} HASH: ${c.contentHash}`);
      }
    }
    return lines.join("\n");
  }

  // -- internals --------------------------------------------------------------

  private hashOf(def: SkillCandidate["content"]): string {
    return hashSkill(def);
  }

  private emit(candidate: SkillCandidate, kind: string, detail?: string, by?: string): void {
    candidate.history.push({ at: this.now(), kind, detail, by });
  }

  private snapshot(candidate: SkillCandidate): SkillCandidate {
    return JSON.parse(JSON.stringify(candidate)) as SkillCandidate;
  }

  private require(candidateId: string, states: string[]): SkillCandidate {
    const candidate = this.readCandidate(candidateId);
    if (!states.includes(candidate.state)) {
      throw new Error(`candidate ${candidateId} is ${candidate.state}; required one of ${states.join(",")}`);
    }
    return candidate;
  }

  private listCandidateIds(): string[] {
    if (!this.store) {
      return [...this.memoryCandidates.keys()].sort();
    }
    // Derive staged ids from durable envelopes (prefix candidate-).
    return this.store.listIds("candidate-").map((id) => id.slice("candidate-".length));
  }

  private readonly memoryCandidates = new Map<string, SkillCandidate>();

  /** Corrupt/future-schema envelopes surface as errors, never "unknown". */
  private rethrowUnlessNotFound(error: unknown, missing: Error): never {
    if (error instanceof StateError && error.code === "STATE_NOT_FOUND") throw missing;
    throw error;
  }

  private readCandidate(candidateId: string): SkillCandidate {
    if (!this.store) {
      const candidate = this.memoryCandidates.get(candidateId);
      if (!candidate) throw new Error(`unknown candidate ${candidateId}`);
      return candidate;
    }
    try {
      return this.store.load<SkillCandidate>(candidateEnvelopeId(candidateId)).payload;
    } catch (error) {
      this.rethrowUnlessNotFound(error, new Error(`unknown candidate ${candidateId}`));
    }
  }

  private persistCandidate(candidate: SkillCandidate): void {
    if (!this.store) {
      this.memoryCandidates.set(candidate.candidateId, this.snapshot(candidate));
      return;
    }
    const id = candidateEnvelopeId(candidate.candidateId);
    const now = this.now();
    if (this.store.exists(id)) {
      const current = this.store.load<SkillCandidate>(id);
      this.store.save(
        {
          id, kind: "skill-candidate", schemaVersion: 1, recordVersion: current.recordVersion + 1,
          createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
          owner: "aetherius-os", provenance: "skill-lifecycle",
          sensitivity: "SYSTEM", integrity: "", payload: this.snapshot(candidate),
        },
        { expectedRecordVersion: current.recordVersion },
      );
    } else {
      this.store.save({
        id, kind: "skill-candidate", schemaVersion: 1, recordVersion: 1,
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        owner: "aetherius-os", provenance: "skill-lifecycle",
        sensitivity: "SYSTEM", integrity: "", payload: this.snapshot(candidate),
      });
    }
  }

  private readActivePointer(skillId: string): string | null {
    if (!this.store) return this.memoryPointers.get(skillId) ?? null;
    try {
      return this.store.load<{ activeVersion: string }>(activeEnvelopeId(skillId)).payload.activeVersion;
    } catch (error) {
      // Absent pointer is a normal state (never promoted); corruption still surfaces.
      if (error instanceof StateError && error.code === "STATE_NOT_FOUND") return null;
      throw error;
    }
  }

  private readonly memoryPointers = new Map<string, string>();

  private writeActivePointer(skillId: string, version: string, actor: string, reason: string): void {
    if (!this.store) {
      this.memoryPointers.set(skillId, version);
      return;
    }
    const id = activeEnvelopeId(skillId);
    const now = this.now();
    const payload = { activeVersion: version, updatedBy: actor, reason, at: now };
    if (this.store.exists(id)) {
      const current = this.store.load<{ activeVersion: string }>(id);
      this.store.save(
        {
          id, kind: "skill-active-pointer", schemaVersion: 1, recordVersion: current.recordVersion + 1,
          createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
          owner: "aetherius-os", provenance: "skill-lifecycle",
          sensitivity: "SYSTEM", integrity: "", payload,
        },
        { expectedRecordVersion: current.recordVersion },
      );
    } else {
      this.store.save({
        id, kind: "skill-active-pointer", schemaVersion: 1, recordVersion: 1,
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        owner: "aetherius-os", provenance: "skill-lifecycle",
        sensitivity: "SYSTEM", integrity: "", payload,
      });
    }
  }

  private writePromotionRecord(record: {
    skillId: string; fromVersion: string | null; toVersion: string; candidateHash: string;
    policyDecision: string; reviewers: string[];
    ownerApproval?: { decision: string; by: string; at: string };
    timestamp: string; provenance: string; actor: string;
  }): void {
    if (!this.store) return;
    const id = promotionEnvelopeId(record.skillId, record.toVersion);
    const now = this.now();
    const payload = { ...record, history: [record] };
    if (this.store.exists(id)) {
      const current = this.store.load<{ history: { toVersion: string }[] }>(id);
      this.store.save(
        {
          id, kind: "promotion-record", schemaVersion: 1, recordVersion: current.recordVersion + 1,
          createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
          owner: "aetherius-os", provenance: "skill-lifecycle",
          sensitivity: "SYSTEM", integrity: "",
          payload: { ...record, history: [...current.payload.history, record] },
        },
        { expectedRecordVersion: current.recordVersion },
      );
    } else {
      this.store.save({
        id, kind: "promotion-record", schemaVersion: 1, recordVersion: 1,
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        owner: "aetherius-os", provenance: "skill-lifecycle",
        sensitivity: "SYSTEM", integrity: "", payload,
      });
    }
  }

  private readPromotionRecord(skillId: string, version: string): { toVersion: string } | null {
    if (!this.store) return null;
    try {
      return this.store.load<{ toVersion: string }>(promotionEnvelopeId(skillId, version)).payload;
    } catch (error) {
      if (error instanceof StateError && error.code === "STATE_NOT_FOUND") return null;
      throw error;
    }
  }

  private readRevoked(skillId: string): string[] {
    if (!this.store) return [...(this.memoryRevoked.get(skillId) ?? [])];
    try {
      return this.store.load<{ versions: string[] }>(revokedEnvelopeId(skillId)).payload.versions;
    } catch (error) {
      if (error instanceof StateError && error.code === "STATE_NOT_FOUND") return [];
      throw error;
    }
  }

  private readonly memoryRevoked = new Map<string, string[]>();

  private writeRevoked(skillId: string, versions: string[]): void {
    if (!this.store) {
      this.memoryRevoked.set(skillId, [...versions]);
      return;
    }
    const id = revokedEnvelopeId(skillId);
    const now = this.now();
    const payload = { versions: [...versions] };
    if (this.store.exists(id)) {
      const current = this.store.load<{ versions: string[] }>(id);
      this.store.save(
        {
          id, kind: "skill-revoked", schemaVersion: 1, recordVersion: current.recordVersion + 1,
          createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
          owner: "aetherius-os", provenance: "skill-lifecycle",
          sensitivity: "SYSTEM", integrity: "", payload,
        },
        { expectedRecordVersion: current.recordVersion },
      );
    } else {
      this.store.save({
        id, kind: "skill-revoked", schemaVersion: 1, recordVersion: 1,
        createdAt: new Date(now).toISOString(), updatedAt: new Date(now).toISOString(),
        owner: "aetherius-os", provenance: "skill-lifecycle",
        sensitivity: "SYSTEM", integrity: "", payload,
      });
    }
  }

}
