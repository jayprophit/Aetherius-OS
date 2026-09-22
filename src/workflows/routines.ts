import type { Routine, Workflow } from "./types";

/**
 * Validate a routine against known workflows. A routine wraps one workflow
 * version with defaults and policy; schedules/triggers belong to later P19
 * work and are rejected here if present.
 */
export function validateRoutine(
  routine: Routine,
  workflows: Array<{ workflow_id: string; version: string }>,
): string[] {
  const problems: string[] = [];
  if (!routine.routine_id.trim()) problems.push("routine_id is required");
  if (!/^\d+\.\d+\.\d+$/.test(routine.version)) {
    problems.push(`invalid version ${routine.version} (x.y.z required)`);
  }
  if (!workflows.some((w) => w.workflow_id === routine.workflow_ref && w.version === routine.workflow_version)) {
    problems.push(`routine targets unknown workflow ${routine.workflow_ref}@${routine.workflow_version}`);
  }
  if (!routine.policy.trim()) problems.push("policy binding is required");
  const extra =
    (routine as unknown as Record<string, unknown>).schedule ??
    (routine as unknown as Record<string, unknown>).trigger;
  if (extra !== undefined) {
    problems.push("schedule/trigger definitions belong to later P19 scheduling work");
  }
  return [...problems].sort();
}

export function routineFor(run: { routine_id?: string }, routines: Routine[]): Routine | undefined {
  if (!run.routine_id) return undefined;
  return routines.find((r) => r.routine_id === run.routine_id);
}

export type { Routine, Workflow };
