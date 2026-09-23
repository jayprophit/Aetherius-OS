import type { Readiness, ReviewFinding } from "./types";

const BLOCKING: ReadonlySet<ReviewFinding["severity"]> = new Set(["error", "blocker"]);

/**
 * Pure readiness evaluation over review findings.
 *
 * Verdict is advisory: "ready" means no blocking findings remain. It never
 * grants authority — merge_authority is a literal false on every result.
 */
export function evaluateReadiness(findings: readonly ReviewFinding[]): Readiness {
  const blocking = findings.filter((f) => BLOCKING.has(f.severity));
  const warnings = findings.filter((f) => f.severity === "warning");
  const verdict = blocking.length === 0 ? "ready" : "not_ready";
  const reasons =
    verdict === "ready"
      ? warnings.length > 0
        ? [`no blocking findings; ${warnings.length} warning(s) remain advisory`]
        : ["no blocking findings"]
      : blocking.map((f) => `${f.code}: ${f.message}`);
  return {
    verdict,
    blockingCount: blocking.length,
    warningCount: warnings.length,
    reasons,
    merge_authority: false,
  };
}
