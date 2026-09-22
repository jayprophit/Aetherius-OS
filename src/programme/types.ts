/** P16/3 programme-truth types. Vocabulary follows BUILD-TODO canonical lists. */

export type SourceClass =
  | "OWNER_DECISION"
  | "RUNNING_CODE"
  | "TEST_EVIDENCE"
  | "BUILD_TODO"
  | "REPO_DOCS"
  | "HANDOFF"
  | "CHAT_HISTORY"
  | "GIT_HISTORY"
  | "USER_FORK"
  | "OPEN_SOURCE_REF"
  | "STANDARD"
  | "PAPER"
  | "RESEARCH_NOTE"
  | "MEDIA_REF"
  | "SCREENSHOT_REF"
  | "LEGACY_MATERIAL";

export type ReqStatus =
  | "RESEARCH"
  | "ARCHITECTED"
  | "SPECIFIED"
  | "SCAFFOLDED"
  | "PARTIAL"
  | "IMPLEMENTED"
  | "COMPILED"
  | "UNIT_TESTED"
  | "INTEGRATION_TESTED"
  | "E2E_TESTED"
  | "BENCHMARKED"
  | "SECURITY_TESTED"
  | "PROVEN"
  | "OPTIMIZED"
  | "STABLE"
  | "PRODUCTION_READY";

export type ExistenceClass =
  | "EXISTS"
  | "PARTIAL"
  | "MISSING"
  | "DUPLICATE"
  | "LEGACY"
  | "CONFLICTING"
  | "EXPERIMENTAL"
  | "RESEARCH"
  | "DEFERRED";

export type ReuseClass =
  | "BUILD_FROM_SCRATCH"
  | "FORK_AND_ADAPT"
  | "STUDY_ONLY"
  | "REPLACEABLE_PROVIDER_ADAPTER"
  | "REUSE_DIRECTLY"
  | "INTEGRATE_DEPENDENCY"
  | "FORK_AND_EXTEND"
  | "PORT"
  | "ADAPT"
  | "MERGE_SELECTIVELY"
  | "REFERENCE_ONLY"
  | "REJECT"
  | "SUPERSEDED";

export type WorkState =
  | "READY"
  | "BLOCKED"
  | "IN_PROGRESS"
  | "COMPLETE"
  | "DEFERRED"
  | "OWNER_GATED";

export interface SourceRef {
  class: SourceClass;
  ref: string;
  location?: string;
  date?: string;
}

export interface Requirement {
  id: string;
  title: string;
  description: string;
  source: SourceRef;
  also_from?: SourceRef[];
  owner: string;
  module?: string;
  phase: string;
  status: ReqStatus;
  existence?: ExistenceClass;
  /** Explicit owner/programme priority, 1..5 (5 = most urgent). Authoritative. */
  priority: number;
  criticality?: "low" | "medium" | "high" | "blocking";
  depends_on: string[];
  blockers: string[];
  evidence: string[];
  implementation_refs?: string[];
  test_refs?: string[];
  provenance: string;
  licence?: string;
  reuse?: ReuseClass;
  risk?: string;
  duplicates?: string[];
  conflicts?: string[];
  supersedes?: string[];
  superseded_by?: string[];
  owner_gate: boolean;
  work_state: WorkState;
  notes?: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  refs: string[];
}

export interface SelectionResult {
  selected_task: string | null;
  phase: string | null;
  project: string | null;
  reason: string;
  priority: number | null;
  dependencies_satisfied: boolean;
  blockers: string[];
  owner_gate: boolean;
  evidence: string[];
}

export interface ProgrammeBundle {
  programme: {
    phases: Array<{ id: string; name: string; status: string }>;
    projects: Array<{ id: string; path: string; role: string }>;
    placements: Record<string, string[]>;
  };
  depgraph: {
    nodes: Array<{ id: string }>;
    edges: Array<{ from: string; to: string; type: string; evidence?: string }>;
  };
  requirements: Requirement[];
}
