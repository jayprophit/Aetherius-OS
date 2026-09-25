import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { FileStateStore } from "../state/store";
import { evaluateReadiness } from "./readiness";
import { reportStateId } from "./reports";
import { CohortReviewStore, cohortStateId, planCohortBatches, summarizeCohort, validateCohort } from "./cohorts";
import * as cohorts from "./cohorts";
import * as steward from "./index";
import type { CohortInput, CohortMember, CohortReview } from "./cohorts";
import type { ReviewFinding, ReviewTarget, StewardReport } from "./types";

const AT = "2026-09-26T00:00:00.000Z";

function report(target: ReviewTarget, findings: ReviewFinding[], generatedAt = AT): StewardReport {
  return {
    id: reportStateId(target),
    target,
    findings,
    readiness: evaluateReadiness(findings),
    trigger: "scheduled",
    generatedAt,
  };
}

function target(number: number, kind: ReviewTarget["kind"] = "pull"): ReviewTarget {
  return { repo: "aetherius-os", kind, number };
}

const blocking = (code: string): ReviewFinding => ({ code, severity: "error", message: code });
const warning = (code: string): ReviewFinding => ({ code, severity: "warning", message: code });

function input(over: Partial<CohortInput> = {}): CohortInput {
  return { cohortId: "release-train", targets: [], reports: [], generatedAt: AT, ...over };
}

describe("cohort rollup", () => {
  it("reuses stored verdicts and stays ready only when every member reported ready", () => {
    const targets = [target(1), target(2), target(3)];
    const reports = [
      report(target(1), []),
      report(target(2), [warning("W1")]),
      report(target(3), []),
    ];
    const review = summarizeCohort(input({ targets, reports }));
    expect(review.readiness.verdict).toBe("ready");
    expect(review.readiness.readyCount).toBe(3);
    expect(review.readiness.warningCount).toBe(1);
    expect(review.readiness.reasons).toEqual(["every member reported ready"]);
    // Advisory: a ready cohort still carries no authority.
    expect(review.readiness.merge_authority).toBe(false);
  });

  it("is not_ready when any member is not_ready, and counts the blocking work", () => {
    const targets = [target(1), target(2)];
    const reports = [report(target(1), []), report(target(2), [blocking("E1"), warning("W1")])];
    const review = summarizeCohort(input({ targets, reports }));
    expect(review.readiness.verdict).toBe("not_ready");
    expect(review.readiness.notReadyCount).toBe(1);
    expect(review.readiness.blockingCount).toBe(1);
    expect(review.readiness.reasons).toEqual(["steward-aetherius-os-pull2: not_ready"]);
  });

  it("reports an absent report as unknown, never as ready", () => {
    const targets = [target(1), target(2)];
    const review = summarizeCohort(input({ targets, reports: [report(target(1), [])] }));
    expect(review.readiness.verdict).toBe("unknown");
    expect(review.readiness.unknownCount).toBe(1);
    expect(review.readiness.readyCount).toBe(1);
    expect(review.readiness.reasons).toEqual(["steward-aetherius-os-pull2: no stored report"]);
  });

  it("a blocking member outranks an unknown member", () => {
    const targets = [target(1), target(2), target(3)];
    const reports = [report(target(1), []), report(target(2), [blocking("E1")])];
    const review = summarizeCohort(input({ targets, reports }));
    expect(review.readiness.verdict).toBe("not_ready");
    expect(review.readiness.reasons).toEqual([
      "steward-aetherius-os-pull2: not_ready",
      "steward-aetherius-os-pull3: no stored report",
    ]);
  });

  it("reuses the report verdict instead of re-deriving it from findings", () => {
    // A report whose stored verdict disagrees with a fresh evaluation of its
    // own findings is contradictory input; the stored verdict is authoritative.
    const contradictory: StewardReport = {
      ...report(target(1), [blocking("E1")]),
      readiness: { verdict: "ready", blockingCount: 0, warningCount: 0, reasons: [], merge_authority: false },
    };
    const review = summarizeCohort(input({ targets: [target(1)], reports: [contradictory] }));
    expect(review.members[0]!.verdict).toBe("ready");
  });

  it("plan is deterministic and triages unresolved work first", () => {
    const targets = [target(1), target(2), target(3), target(4), target(5)];
    const reports = [
      report(target(1), []),
      report(target(2), [blocking("E1")]),
      report(target(3), [blocking("E2")]),
      report(target(4), []),
    ];
    const review = summarizeCohort(input({ targets, reports, maxBatchSize: 2 }));
    expect(review.batches).toEqual([
      { index: 0, memberIds: ["steward-aetherius-os-pull2", "steward-aetherius-os-pull3"] },
      { index: 1, memberIds: ["steward-aetherius-os-pull5", "steward-aetherius-os-pull1"] },
      { index: 2, memberIds: ["steward-aetherius-os-pull4"] },
    ]);
    const again = summarizeCohort(input({ targets, reports, maxBatchSize: 2 }));
    expect(again.batches).toEqual(review.batches);
  });

  it("orders batches by id when every member shares a verdict", () => {
    const members: CohortMember[] = [3, 1, 2].map((n) => ({
      target: target(n),
      reportId: reportStateId(target(n)),
      verdict: "ready" as const,
      blockingCount: 0,
      warningCount: 0,
    }));
    expect(planCohortBatches(members, 2)).toEqual([
      { index: 0, memberIds: ["steward-aetherius-os-pull1", "steward-aetherius-os-pull2"] },
      { index: 1, memberIds: ["steward-aetherius-os-pull3"] },
    ]);
  });
});

describe("cohort validation", () => {
  it("accepts a well-formed cohort", () => {
    expect(validateCohort(input({ targets: [target(1)], reports: [report(target(1), [])] }))).toEqual([]);
  });

  it("rejects malformed ids, targets, duplicates, batch sizes and timestamps", () => {
    const hostile: Record<string, Partial<CohortInput>> = {
      "cohort-id": { cohortId: "not a slug" },
      target: { targets: [] },
      "duplicate-targets": { targets: [target(1), target(1)] },
      "batch-size": { targets: [target(1)], maxBatchSize: 0 },
      "generated-at": { targets: [target(1)], generatedAt: "" },
    };
    for (const [problem, over] of Object.entries(hostile)) {
      expect(validateCohort(input(over))).toContain(problem);
    }
    expect(validateCohort(input({ targets: [target(1)], maxBatchSize: 1.5 }))).toContain("batch-size");
    expect(validateCohort(input({ targets: [{ ...target(0) }] }))).toContain("target");
    expect(validateCohort(input({ targets: [{ ...target(1), repo: "bad repo" }] }))).toContain("target");
  });

  it("rejects a report that claims merge authority", () => {
    const hostile = { ...report(target(1), []), readiness: { ...report(target(1), []).readiness, merge_authority: true } };
    expect(validateCohort(input({ targets: [target(1)], reports: [hostile as unknown as StewardReport] }))).toContain(
      "report-authority",
    );
  });

  it("rejects a report whose target drifted from the cohort member", () => {
    const drifted = { ...report(target(1), []), id: reportStateId(target(1)), target: target(99) };
    expect(validateCohort(input({ targets: [target(1)], reports: [drifted] }))).toContain("target-mismatch");
  });

  it("summarizeCohort fails closed before returning a rollup", () => {
    expect(() => summarizeCohort(input({ cohortId: "bad id", targets: [target(1)] }))).toThrowError(/cohort-id/);
  });
});

describe("durable cohort reviews", () => {
  function makeStore(): { store: FileStateStore; cohorts: CohortReviewStore } {
    const root = mkdtempSync(join(tmpdir(), "steward-cohort-"));
    const store = new FileStateStore(root, 1);
    return { store, cohorts: new CohortReviewStore(store, "aetherius-os") };
  }

  function makeReview(revision = 1): CohortReview {
    const targets = [target(1), target(2)];
    return summarizeCohort(
      input({
        targets,
        reports: revision === 1 ? [report(target(1), []), report(target(2), [blocking("E1")])] : [report(target(1), []), report(target(2), [])],
        generatedAt: `2026-09-26T00:00:0${revision}.000Z`,
      }),
    );
  }

  it("round-trips with integrity and bumps record versions", () => {
    const { store, cohorts } = makeStore();
    cohorts.save(makeReview(1));
    const first = store.load<CohortReview>(cohortStateId("release-train"));
    expect(first.kind).toBe("steward.cohort");
    expect(first.recordVersion).toBe(1);
    expect(first.integrity).toHaveLength(64);

    cohorts.save(makeReview(2));
    const second = store.load<CohortReview>(cohortStateId("release-train"));
    expect(second.recordVersion).toBe(2);
    expect(second.createdAt).toBe("2026-09-26T00:00:01.000Z");
    const loaded = cohorts.load(cohortStateId("release-train"));
    expect(loaded.readiness.verdict).toBe("ready");
    expect(loaded.readiness.merge_authority).toBe(false);
    expect(cohorts.listIds()).toContain(cohortStateId("release-train"));
  });

  it("detects tampered cohort payloads", () => {
    const { store, cohorts } = makeStore();
    cohorts.save(makeReview(1));
    const path = join(store.root, `${cohortStateId("release-train")}.json`);
    const raw = JSON.parse(readFileSync(path, "utf8")) as { payload: { readiness: { merge_authority: boolean } } };
    raw.payload.readiness.merge_authority = true;
    writeFileSync(path, JSON.stringify(raw), "utf8");
    expect(() => cohorts.load(cohortStateId("release-train"))).toThrowError(/integrity/);
  });

  it("refuses to persist an invalid cohort and writes nothing", () => {
    const { store, cohorts } = makeStore();
    const invalid = { ...makeReview(1), cohortId: "not a slug" };
    expect(() => cohorts.save(invalid)).toThrowError(/cohort-id/);
    expect(store.listIds()).toEqual([]);
  });

  it("rejects a non-cohort record on load", () => {
    const { store, cohorts } = makeStore();
    store.save({
      id: cohortStateId("foreign"),
      kind: "steward.report",
      schemaVersion: 1,
      recordVersion: 1,
      createdAt: AT,
      updatedAt: AT,
      owner: "aetherius-os",
      provenance: "p16-change-cohort-review",
      sensitivity: "USER",
      integrity: "",
      payload: makeReview(1),
    });
    expect(() => cohorts.load(cohortStateId("foreign"))).toThrowError(/not a cohort review/);
  });
});

describe("cohort authority invariant", () => {
  it("cohort exports expose no grant, merge or approval capability", () => {
    // Scoped to the cohort surface. The wider index legitimately exports
    // authorizeCommand (default-deny steward command gating) and is covered
    // by the existing merge-authority test in steward.test.ts.
    const cohortNames = Object.keys(cohorts);
    for (const banned of ["grant", "merge", "approve", "authorize"]) {
      expect(cohortNames.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
    // Nothing anywhere in the steward surface grants or merges.
    const names = Object.keys(steward);
    for (const banned of ["grant", "merge", "approve"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("every cohort rollup, ready or not, has merge_authority false", () => {
    const cases: ReviewFinding[][] = [
      [], [warning("W")], [blocking("E")], [blocking("E"), warning("W")],
    ];
    for (const findings of cases) {
      const review = summarizeCohort(input({ targets: [target(1)], reports: [report(target(1), findings)] }));
      expect(review.readiness.merge_authority).toBe(false);
    }
    const empty = summarizeCohort(input({ targets: [target(1)] }));
    expect(empty.readiness.merge_authority).toBe(false);
  });

  it("exposes no mutation surface on the store", () => {
    const root = mkdtempSync(join(tmpdir(), "steward-cohort-surface-"));
    const cohorts = new CohortReviewStore(new FileStateStore(root, 1), "aetherius-os");
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(cohorts));
    for (const banned of ["grant", "merge", "approve", "authorize", "delete"]) {
      expect(methods.some((m) => m.toLowerCase().includes(banned))).toBe(false);
    }
  });
});
