import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStateStore } from "../state/store";
import { evaluateReadiness } from "./readiness";
import { upsertMarker, readMarker } from "./markers";
import { parseCommand, authorizeCommand } from "./commands";
import { guardedRepair } from "./repair";
import { StewardReportStore, reportStateId } from "./reports";
import { StewardError } from "./types";
import * as steward from "./index";
import type { ReviewFinding, StewardReport } from "./types";

const finding = (code: string, severity: ReviewFinding["severity"], message = code): ReviewFinding => ({
  code,
  severity,
  message,
});

describe("readiness", () => {
  it("empty findings are ready but carry no merge authority", () => {
    const r = evaluateReadiness([]);
    expect(r.verdict).toBe("ready");
    expect(r.merge_authority).toBe(false);
  });

  it("warnings stay advisory; errors and blockers block", () => {
    const warnOnly = evaluateReadiness([finding("W1", "warning")]);
    expect(warnOnly.verdict).toBe("ready");
    expect(warnOnly.warningCount).toBe(1);
    expect(warnOnly.merge_authority).toBe(false);

    const withError = evaluateReadiness([finding("W1", "warning"), finding("E1", "error")]);
    expect(withError.verdict).toBe("not_ready");
    expect(withError.blockingCount).toBe(1);

    const withBlocker = evaluateReadiness([finding("B1", "blocker")]);
    expect(withBlocker.verdict).toBe("not_ready");
    expect(withBlocker.reasons.join(" ")).toContain("B1");
    expect(withBlocker.merge_authority).toBe(false);
  });
});

describe("marker comments", () => {
  it("appends an owned block to an empty body", () => {
    const out = upsertMarker("", "review", "status: ready");
    expect(out).toContain("<!-- aetherius-steward:begin review -->");
    expect(out).toContain("status: ready");
    expect(out).toContain("<!-- aetherius-steward:end review -->");
    expect(readMarker(out, "review")).toBe("status: ready");
  });

  it("preserves maintainer text outside the owned block on update", () => {
    const first = upsertMarker("Thanks for the PR!\nPlease review.", "review", "v1");
    const second = upsertMarker(first, "review", "v2");
    expect(second).toContain("Thanks for the PR!");
    expect(second).toContain("Please review.");
    expect(second).toContain("v2");
    expect(second).not.toContain("v1");
    expect(readMarker(second, "review")).toBe("v2");
  });

  it("leaves other markers untouched", () => {
    let body = upsertMarker("", "ci", "green");
    body = upsertMarker(body, "review", "one");
    body = upsertMarker(body, "review", "two");
    body = upsertMarker(body, "ci", "also green");
    expect(readMarker(body, "review")).toBe("two");
    expect(readMarker(body, "ci")).toBe("also green");
  });

  it("fails closed on malformed, duplicated or hostile markers", () => {
    expect(() => upsertMarker("<!-- aetherius-steward:begin x -->", "x", "y")).toThrowError(/begin without end/);
    expect(() => upsertMarker("<!-- aetherius-steward:end x -->", "x", "y")).toThrowError(/end without begin/);
    const doubled = "<!-- aetherius-steward:begin x -->a<!-- aetherius-steward:end x -->b<!-- aetherius-steward:begin x -->c<!-- aetherius-steward:end x -->";
    expect(() => upsertMarker(doubled, "x", "y")).toThrowError(/more than once/);
    expect(() => upsertMarker("", "bad id!", "y")).toThrowError(StewardError);
    expect(() => upsertMarker("", "ok", "<!-- aetherius-steward:begin ok -->")).toThrowError(/must not contain/);
    expect(readMarker("no markers", "review")).toBeUndefined();
  });
});

describe("maintainer commands", () => {
  it("parses the strict grammar", () => {
    const cmd = parseCommand("/steward re-review aetherius-os#pull-12", "alice");
    expect(cmd).toEqual({
      actor: "alice",
      verb: "re-review",
      target: { repo: "aetherius-os", kind: "pull", number: 12 },
    });
    const issue = parseCommand("/steward check RepoName#issue-3", "bob");
    expect(issue.target.repo).toBe("reponame");
    expect(issue.target.kind).toBe("issue");
  });

  it("rejects malformed and unknown commands", () => {
    expect(() => parseCommand("hello", "a")).toThrowError(/not a steward command/);
    expect(() => parseCommand("/steward explode repo#pull-1", "a")).toThrowError(/unknown verb/);
    expect(() => parseCommand("/steward check", "a")).toThrowError(/expected/);
    expect(() => parseCommand("/steward check nope", "a")).toThrowError(/invalid target/);
    expect(() => parseCommand("/steward check repo#pull-0", "a")).toThrowError(/positive integer/);
    expect(() => parseCommand("/steward check extra repo#pull-1", "a")).toThrowError(/expected/);
  });

  it("authorizes only explicit allowlisted actors (default deny)", () => {
    const cmd = parseCommand("/steward repair aetherius-os#pull-1", "mallory");
    expect(() => authorizeCommand(cmd, { authorizedActors: [] })).toThrowError(/no authorized maintainers/);
    expect(() => authorizeCommand(cmd, { authorizedActors: ["alice"] })).toThrowError(/not an authorized maintainer/);
    expect(() => authorizeCommand({ ...cmd, actor: "alice" }, { authorizedActors: ["alice"] })).not.toThrow();
  });
});

describe("guarded repair", () => {
  const findings: ReviewFinding[] = [finding("E1", "error"), finding("W1", "warning"), finding("B1", "blocker")];
  const proposal = {
    id: "repair-1",
    target: { repo: "aetherius-os", kind: "pull" as const, number: 7 },
    summary: "fix E1",
    patch: "diff --git a/x b/x",
    fixesFindingCodes: ["E1"],
  };

  it("denied decision leaves findings and readiness untouched", () => {
    const out = guardedRepair(proposal, findings, { allowed: false, reason: "needs human" });
    expect(out.status).toBe("denied");
    expect(out.findings).toHaveLength(3);
    expect(out.readiness.verdict).toBe("not_ready");
    expect(out.readiness.merge_authority).toBe(false);
    if (out.status === "denied") expect(out.reason).toBe("needs human");
  });

  it("allowed decision resolves only listed codes and stays authority-free", () => {
    const out = guardedRepair(proposal, findings, { allowed: true });
    expect(out.status).toBe("applied");
    if (out.status !== "applied") throw new Error("expected applied");
    expect(out.resolvedCodes).toEqual(["E1"]);
    expect(out.findings.map((f) => f.code)).toEqual(["W1", "B1"]);
    expect(out.readiness.verdict).toBe("not_ready");
    expect(out.readiness.merge_authority).toBe(false);
  });

  it("full fix yields ready with merge_authority still false", () => {
    const all = { ...proposal, fixesFindingCodes: ["E1", "W1", "B1"] };
    const out = guardedRepair(all, findings, { allowed: true });
    expect(out.readiness.verdict).toBe("ready");
    expect(out.readiness.merge_authority).toBe(false);
  });

  it("invalid proposals fail closed", () => {
    expect(() => guardedRepair({ ...proposal, id: "" }, findings, { allowed: true })).toThrowError(StewardError);
    expect(() => guardedRepair({ ...proposal, fixesFindingCodes: [] }, findings, { allowed: true })).toThrowError(
      /list codes/,
    );
  });
});

describe("durable reports", () => {
  const target = { repo: "aetherius-os", kind: "pull" as const, number: 42 };

  function makeStore(): { store: FileStateStore; reports: StewardReportStore } {
    const root = mkdtempSync(join(tmpdir(), "steward-"));
    const store = new FileStateStore(root, 1);
    return { store, reports: new StewardReportStore(store, "aetherius-os") };
  }

  function makeReport(revision = 1): StewardReport {
    const findings = revision === 1 ? [finding("E1", "error")] : [];
    return {
      id: reportStateId(target),
      target,
      findings,
      readiness: evaluateReadiness(findings),
      trigger: "scheduled",
      generatedAt: `2026-09-22T00:00:0${revision}.000Z`,
    };
  }

  it("round-trips with integrity and bumps record versions", () => {
    const { store, reports } = makeStore();
    reports.save(makeReport(1));
    const first = store.load<StewardReport>(reportStateId(target));
    expect(first.recordVersion).toBe(1);
    expect(first.integrity).toHaveLength(64);

    reports.save(makeReport(2));
    const second = store.load<StewardReport>(reportStateId(target));
    expect(second.recordVersion).toBe(2);
    expect(second.createdAt).toBe("2026-09-22T00:00:01.000Z");
    const loaded = reports.load(reportStateId(target));
    expect(loaded.readiness.merge_authority).toBe(false);
    expect(reports.listIds()).toContain(reportStateId(target));
  });

  it("detects tampered report payloads", () => {
    const { store, reports } = makeStore();
    reports.save(makeReport(1));
    const path = join(store.root, `${reportStateId(target)}.json`);
    const raw = JSON.parse(readFileSync(path, "utf8")) as { payload: { findings: unknown[] } };
    raw.payload.findings = [];
    writeFileSync(path, JSON.stringify(raw), "utf8");
    expect(() => reports.load(reportStateId(target))).toThrowError(/integrity/);
  });

  it("rejects retargeting an existing report id", () => {
    const { reports } = makeStore();
    reports.save(makeReport(1));
    const hijack = { ...makeReport(2), target: { ...target, number: 99 } };
    expect(() => reports.save(hijack)).toThrowError(/target mismatch/);
  });
});

describe("authority invariant", () => {
  it("steward module exposes no merge capability", () => {
    const names = Object.keys(steward);
    expect(names.some((n) => n.toLowerCase().includes("merge"))).toBe(false);
    expect(names).not.toContain("autoMerge");
    expect(names).not.toContain("approveMerge");
  });

  it("every readiness result, ready or not, has merge_authority false", () => {
    const cases: ReviewFinding[][] = [
      [],
      [finding("W", "warning")],
      [finding("E", "error")],
      [finding("B", "blocker")],
      [finding("E", "error"), finding("W", "warning")],
    ];
    for (const findings of cases) {
      expect(evaluateReadiness(findings).merge_authority).toBe(false);
    }
  });
});
