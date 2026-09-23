import { RunnerError } from "./types";
import type { RunRecord, RunState } from "./types";

const TRANSITIONS: Record<RunState, readonly RunState[]> = {
  DEFINED: ["PROVISIONING"],
  PROVISIONING: ["READY", "FAILED"],
  READY: ["RUNNING", "TEARDOWN"],
  RUNNING: ["SUCCEEDED", "FAILED", "TIMED_OUT"],
  SUCCEEDED: ["TEARDOWN"],
  FAILED: ["TEARDOWN"],
  TIMED_OUT: ["TEARDOWN"],
  TEARDOWN: ["TORN_DOWN"],
  TORN_DOWN: [],
};

/**
 * Pure run lifecycle: only declared transitions advance. Terminal
 * non-torn-down states require teardown before the record is released —
 * orphan runners are a lifecycle error, never silent.
 */
export function transition(record: RunRecord, next: RunState): RunRecord {
  const allowed = TRANSITIONS[record.state];
  if (!allowed.includes(next)) {
    throw new RunnerError("INVALID_TRANSITION", `run ${record.runId}: ${record.state} -> ${next} not allowed`);
  }
  return { ...record, state: next, tornDown: next === "TORN_DOWN" ? true : record.tornDown };
}

/** Records in a non-torn-down terminal state still owe teardown. */
export function teardownOwed(record: RunRecord): boolean {
  return (record.state === "SUCCEEDED" || record.state === "FAILED" || record.state === "TIMED_OUT") && !record.tornDown;
}

export function requireTornDown(record: RunRecord): void {
  if (record.state !== "TORN_DOWN") {
    throw new RunnerError(
      "TEARDOWN_REQUIRED",
      `run ${record.runId} in ${record.state}: teardown before release`,
    );
  }
}
