import { evaluateReadiness } from "./readiness";
import { StewardReportStore, reportStateId } from "./reports";
import { StewardError } from "./types";
import type { StewardReport, StewardTrigger, ReviewFinding, ReviewTarget } from "./types";
import type { StepExecutor, StepOutcome, ExecContext } from "../workflows/executors";
import type { WorkflowStep } from "../workflows/types";

const REPO_RE = /^[a-z0-9][a-z0-9_-]*$/i;
const SEVERITIES = new Set(["info", "warning", "error", "blocker"]);
const TRIGGERS = new Set(["scheduled", "event", "command", "manual"]);
const KINDS = new Set(["issue", "pull"]);

/**
 * Validate a steward-review step definition. `findings` must be a binding
 * (arrays never travel as string literals); scalars may be literals or
 * bindings resolved at runtime.
 */
export function validateStewardStepDef(step: WorkflowStep): string[] {
  const problems: string[] = [];
  if (step.kind !== "steward-review") {
    problems.push(`steward step must use kind steward-review, got ${step.kind}`);
  }
  const literal = (key: string): string | undefined => {
    const value = step.inputs[key];
    if (value === undefined) return undefined;
    if (value.trim().startsWith("$")) return undefined;
    return value;
  };
  const repo = literal("repo");
  if (repo !== undefined && !REPO_RE.test(repo)) {
    problems.push("repo must be an id-safe name");
  }
  const kind = literal("kind");
  if (kind !== undefined && !KINDS.has(kind)) {
    problems.push(`kind must be issue or pull, got ${kind}`);
  }
  const num = literal("number");
  if (num !== undefined && (!/^\d+$/.test(num) || Number(num) < 1)) {
    problems.push("number must be a positive integer literal");
  }
  const trigger = literal("trigger");
  if (trigger !== undefined && !TRIGGERS.has(trigger)) {
    problems.push(`trigger must be scheduled|event|command|manual, got ${trigger}`);
  }
  const findings = step.inputs["findings"];
  if (findings === undefined) {
    problems.push("steward step requires a findings input binding");
  } else if (!findings.trim().startsWith("$")) {
    problems.push("findings must be a runtime binding, not a literal");
  }
  return [...problems].sort();
}

function parseFindings(raw: unknown): ReviewFinding[] | string {
  if (!Array.isArray(raw)) return "findings must resolve to an array";
  const out: ReviewFinding[] = [];
  for (const [i, item] of raw.entries()) {
    if (typeof item !== "object" || item === null) return `findings[${i}] must be an object`;
    const f = item as Record<string, unknown>;
    if (typeof f["code"] !== "string" || !f["code"].trim()) return `findings[${i}].code must be a non-empty string`;
    if (typeof f["severity"] !== "string" || !SEVERITIES.has(f["severity"])) {
      return `findings[${i}].severity must be info|warning|error|blocker`;
    }
    if (typeof f["message"] !== "string") return `findings[${i}].message must be a string`;
    out.push({
      code: f["code"],
      severity: f["severity"] as ReviewFinding["severity"],
      message: f["message"],
      ...(typeof f["evidence"] === "string" ? { evidence: f["evidence"] } : {}),
    });
  }
  return out;
}

function str(raw: unknown, fallback: string): string {
  return typeof raw === "string" ? raw : fallback;
}

/**
 * STEWARD_REVIEW executor: typed findings (produced upstream — model review,
 * static checks, maintainer input) → deterministic readiness evaluation →
 * durable report. No comments, no repairs, no merge: those are separate,
 * separately governed capabilities. Output always carries
 * merge_authority: false.
 */
export class StewardReviewExecutor implements StepExecutor {
  readonly kind = "steward-review";

  private readonly reports: StewardReportStore;
  private readonly now: () => string;

  constructor(deps: { reports: StewardReportStore; now?: () => string }) {
    this.reports = deps.reports;
    this.now = deps.now ?? (() => new Date().toISOString());
  }

  async execute(step: WorkflowStep, ctx: ExecContext): Promise<StepOutcome> {
    const defProblems = validateStewardStepDef(step);
    if (defProblems.length > 0) {
      return { ok: false, retryable: false, error: `invalid steward step: ${defProblems.join("; ")}` };
    }
    const inputs = ctx.inputs;
    const repo = str(inputs["repo"], "").trim();
    if (!REPO_RE.test(repo)) {
      return { ok: false, retryable: false, error: "repo resolved to an invalid id" };
    }
    const kind = str(inputs["kind"], "");
    if (!KINDS.has(kind)) {
      return { ok: false, retryable: false, error: `kind resolved to ${kind || "(empty)"}, expected issue or pull` };
    }
    const numberRaw = inputs["number"];
    const number = typeof numberRaw === "number" ? numberRaw : Number(str(numberRaw, ""));
    if (!Number.isInteger(number) || number < 1) {
      return { ok: false, retryable: false, error: "number resolved to a non-positive integer" };
    }
    const trigger = str(inputs["trigger"], "manual");
    if (!TRIGGERS.has(trigger)) {
      return { ok: false, retryable: false, error: `trigger resolved to ${trigger}` };
    }
    const findings = parseFindings(inputs["findings"]);
    if (typeof findings === "string") {
      return { ok: false, retryable: false, error: findings };
    }
    const target: ReviewTarget = { repo: repo.toLowerCase(), kind: kind as ReviewTarget["kind"], number };
    const report: StewardReport = {
      id: reportStateId(target),
      target,
      findings,
      readiness: evaluateReadiness(findings),
      trigger: trigger as StewardTrigger,
      generatedAt: this.now(),
    };
    try {
      this.reports.save(report, { actor: `workflow:${ctx.runId}`, source: "steward-review-executor" });
    } catch (err) {
      const message = err instanceof StewardError || err instanceof Error ? err.message : String(err);
      return { ok: false, retryable: true, error: `failed to persist steward report: ${message}` };
    }
    return {
      ok: true,
      retryable: true,
      output: {
        report_id: report.id,
        verdict: report.readiness.verdict,
        blocking_count: report.readiness.blockingCount,
        warning_count: report.readiness.warningCount,
        reasons: report.readiness.reasons,
        merge_authority: false as const,
        target: report.target,
      },
    };
  }
}
