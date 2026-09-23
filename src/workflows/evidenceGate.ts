/**
 * REQ-p19-evidence-bound-completion: generic evidence-bound task
 * completion gate.
 *
 * Platform rule: a task is not proven-complete while required evidence
 * is missing. Skill promotion enforces this for skills only
 * (promotion.ts); this module states the generic form for any task
 * without touching the proven promotion rule.
 *
 * The gate is advisory-classification, not authority: it reports
 * COMPLETE vs NOT_PROVEN with missing/failed lists. It never approves,
 * merges, or executes anything.
 */

export type EvidenceKind =
  | "test-report"
  | "evaluation"
  | "verification"
  | "artifact"
  | "approval";

export interface EvidenceRequirement {
  key: string;
  description: string;
}

export interface EvidenceProvided {
  key: string;
  kind: EvidenceKind;
  passed: boolean;
  ref: string;
}

export type CompletionVerdict = "COMPLETE" | "NOT_PROVEN";

export interface GateResult {
  verdict: CompletionVerdict;
  missing: string[];
  failed: string[];
  extra: string[];
}

const KINDS: readonly string[] = ["test-report", "evaluation", "verification", "artifact", "approval"];

/**
 * Check required evidence against provided evidence. Every required key
 * needs at least one provided entry with passed=true. Provided entries
 * for unrequired keys are reported as extra (informational, never a
 * failure). Empty requirements are vacuously COMPLETE (documented).
 */
export function checkEvidenceGate(
  required: readonly EvidenceRequirement[],
  provided: readonly EvidenceProvided[],
): GateResult {
  const missing: string[] = [];
  const failed: string[] = [];
  const requiredKeys = new Set<string>();
  for (const req of required) {
    const key = req.key.trim();
    if (!key || requiredKeys.has(key)) {
      throw new Error(`invalid evidence requirement key ${JSON.stringify(req.key)}`);
    }
    requiredKeys.add(key);
  }
  for (const item of provided) {
    if (!KINDS.includes(item.kind)) {
      throw new Error(`unknown evidence kind ${JSON.stringify(item.kind)}`);
    }
    if (!item.key.trim() || !item.ref.trim()) {
      throw new Error("provided evidence needs a key and a ref");
    }
  }
  for (const key of requiredKeys) {
    const entries = provided.filter((p) => p.key === key);
    if (entries.length === 0) {
      missing.push(key);
    } else if (!entries.some((p) => p.passed)) {
      failed.push(key);
    }
  }
  const extra = [...new Set(provided.map((p) => p.key).filter((k) => !requiredKeys.has(k)))].sort();
  const verdict = missing.length === 0 && failed.length === 0 ? "COMPLETE" : "NOT_PROVEN";
  return { verdict, missing: [...missing].sort(), failed: [...failed].sort(), extra };
}
