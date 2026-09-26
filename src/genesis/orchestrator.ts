/**
 * REQ-p22-project-orchestrator: long-horizon coordination state.
 *
 * The registered requirement is the scope authority:
 *
 *   "Long-horizon coordination state (goals, requirement/task graphs,
 *    worker/worktree registries, touch sets, budgets, attention, integration/
 *    artifact/evidence graphs, project memory, recovery) composing Bridge
 *    task_dag + P19/P20 state without duplicating the workflow engine;
 *    registries never store permanent worker personalities."
 *
 * The classification behind it is exact: "fragments tested in task_dag/P19/P20,
 * no unified orchestrator". So the missing thing is the UNIFIED COORDINATION
 * STATE that composes the fragments — not the fragments, and not a new engine.
 *
 *   FRAGMENTS EXIST, TESTED, AND OWNED ELSEWHERE
 *   THE MISSING PIECE IS THE COMPOSITION
 *   ORCHESTRATOR != WORKFLOW ENGINE
 *   ORCHESTRATOR != FRAGMENT REIMPLEMENTATION
 *
 * This module therefore holds REFERENCES and their availability. It does not
 * read, copy, re-derive or reimplement a goal, a task graph, a touch set, a
 * budget, an evidence graph or a recovery path. Each of the registered elements
 * is a named LANE with a declared canonical OWNER, and the state records only
 * whether a reference to that owner is present:
 *
 *   A LINKED LANE IS A REFERENCE, NOT A COPY
 *   A MISSING LINK IS NOT AN EMPTY ELEMENT
 *   NO REFERENCE != PROVEN ABSENCE
 *
 * Nothing is synthesised to fill a gap. An unlinked lane stays unlinked, and
 * the assembly report says so.
 *
 * REGISTRIES NEVER STORE PERMANENT WORKER PERSONALITIES. A worker or worktree
 * lane links a registry *reference*. It cannot hold a persona, a name-as-identity,
 * traits, a backstory or autobiographical content, because a specialist name is
 * a temporary worker, not a permanent identity:
 *
 *   WORKER REGISTRY != PERSONALITY
 *   WORKER NAME != IDENTITY
 *   SPECIALIST != PERMANENT CAST
 *   REGISTRY != PERSONHOOD
 *
 * PROJECT MEMORY IS AN OWNER DECISION, NOT AN IMPLEMENTATION. The
 * worker-scratch versus Genesis-autobiographical-memory boundary is registered as
 * `REQ-memory-integrity-boundary` and is OWNER_GATED. This unit therefore cannot
 * create autobiographical memory and does not: the lane can be linked to a
 * caller-supplied reference, and if the caller claims to be supplying
 * autobiographical content the link is refused:
 *
 *   PROJECT MEMORY != SYNTHESISED HERE
 *   NO OWNER DECISION != ASSUMED BOUNDARY
 *
 * A link may also be recorded as GATED against a named gate, so an owner-blocked
 * lane is visible as blocked rather than quietly missing.
 *
 * AND IT RUNS NOTHING. There is no engine here: no step execution, no run, no
 * scheduling, no dispatch, no retry policy. `src/workflows/` keeps the workflow
 * engine, `src/scheduler/` keeps scheduling, and `src/genesis/workers.ts` keeps
 * temporary-worker lifecycle. None of them is duplicated or wrapped.
 *
 * INPUTS ARE CALLER-SUPPLIED REFERENCES. No clock, no filesystem, no network.
 */

/** The registered coordination lanes, in registered order. */
export const COORDINATION_LANES = [
  "GOALS",
  "REQUIREMENT_GRAPH",
  "TASK_GRAPH",
  "WORKER_REGISTRY",
  "WORKTREE_REGISTRY",
  "TOUCH_SETS",
  "BUDGETS",
  "ATTENTION",
  "INTEGRATION_GRAPH",
  "ARTIFACT_GRAPH",
  "EVIDENCE_GRAPH",
  "PROJECT_MEMORY",
  "RECOVERY",
] as const;
export type CoordinationLane = (typeof COORDINATION_LANES)[number];

/**
 * The canonical owner of each lane, as repository truth records it.
 *
 * A lane whose owner is not established in this repository is declared
 * `UNASSIGNED` rather than pointed at something that does not own it.
 */
export const LANE_OWNERS: Record<CoordinationLane, string> = {
  GOALS: "registry/programme.json",
  REQUIREMENT_GRAPH: "src/programme/requirements.json",
  TASK_GRAPH: "agent-bridge:task_dag",
  WORKER_REGISTRY: "src/workers/profiles.ts + src/workers/spineBranch.ts",
  WORKTREE_REGISTRY: "src/runners/sync.ts",
  TOUCH_SETS: "src/workers/touch.ts",
  BUDGETS: "src/workers/profiles.ts ProfileBudget",
  ATTENTION: "UNASSIGNED",
  INTEGRATION_GRAPH: "src/programme/changeImpact.ts + src/analysis/languageGraph.ts",
  ARTIFACT_GRAPH: "REQ-p17-artifact-library",
  EVIDENCE_GRAPH: "src/programme/evidenceGraph.ts",
  PROJECT_MEMORY: "REQ-memory-integrity-boundary (OWNER_GATED)",
  RECOVERY: "src/workflows/lifecycle.ts",
};

export const LINK_STATES = ["LINKED", "GATED", "UNLINKED"] as const;
export type LinkState = (typeof LINK_STATES)[number];

export interface LaneLink {
  lane: CoordinationLane;
  state: LinkState;
  /** The declared canonical owner. Recorded, never re-pointed. */
  owner: string;
  /** Caller-supplied reference to the owner's content. Absent when UNLINKED. */
  ref?: string;
  /** Required when GATED: which decision is blocking this lane. */
  gateRef?: string;
  provenance: string;
}

export interface CoordinationState {
  links: LaneLink[];
}

export type CoordinationProblemCode =
  | "COORDINATION_INVALID_INPUT"
  | "COORDINATION_UNKNOWN_FIELD"
  | "COORDINATION_UNKNOWN_LANE"
  | "COORDINATION_PERSONALITY_REJECTED"
  | "COORDINATION_ENGINE_SURFACE_REJECTED"
  | "COORDINATION_DUPLICATE_LINK"
  | "COORDINATION_GATE_REQUIRED"
  | "COORDINATION_REF_REQUIRED"
  | "COORDINATION_OWNER_REPOINTED";

export class CoordinationError extends Error {
  readonly code: CoordinationProblemCode;
  constructor(code: CoordinationProblemCode, message: string) {
    super(message);
    this.name = "CoordinationError";
    this.code = code;
  }
}

const LINK_FIELDS = ["lane", "state", "owner", "ref", "gateRef", "provenance"] as const;
const STATE_FIELDS = ["links"] as const;

/**
 * Keys that would turn a registry reference into a stored person. Rejected by
 * name, because a personality smuggled in as metadata is still a personality.
 */
const PERSONALITY_KEYS = [
  "personality",
  "persona",
  "traits",
  "backstory",
  "biography",
  "autobiography",
  "autobiographical",
  "identity",
  "dna",
  "soul",
  "consciousness",
  "selfModel",
  "preferences",
  "quirks",
  "catchphrase",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** True when a string is a JSON object or array, i.e. content rather than a name. */
function looksLikeEmbeddedContent(ref: string): boolean {
  const trimmed = ref.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return false;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    return typeof parsed === "object" && parsed !== null;
  } catch {
    // Malformed JSON that still opens like an object is not a usable reference.
    return true;
  }
}

/**
 * Walk a caller-supplied value and refuse personality-shaped content anywhere in
 * it, not only at the top level.
 */
function assertNoPersonality(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value)) return;
  if (typeof value === "string") return;
  if (value === null || typeof value !== "object") return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoPersonality(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (PERSONALITY_KEYS.includes(key)) {
      throw new CoordinationError(
        "COORDINATION_PERSONALITY_REJECTED",
        `${path}.${key}: a registry link must not carry permanent worker personality content`,
      );
    }
    assertNoPersonality(nested, `${path}.${key}`, seen);
  }
}

export function createCoordinationState(): CoordinationState {
  return { links: [] };
}

export interface LinkInput {
  lane: CoordinationLane;
  /** Caller-supplied reference to the owning system's content. */
  ref?: string;
  /** Set when the lane is blocked on an owner decision. */
  gateRef?: string;
  provenance: string;
  /**
   * Present only so an attempted re-point is caught and refused. A link always
   * takes its owner from `LANE_OWNERS`.
   */
  owner?: string;
}

/**
 * Record that a lane is linked to its canonical owner.
 *
 * The owner is taken from `LANE_OWNERS`, never from the caller, so a link
 * cannot quietly re-point a lane at something that does not own it.
 */
export function linkLane(state: CoordinationState, input: LinkInput): CoordinationState {
  if (!isPlainObject(state)) {
    throw new CoordinationError("COORDINATION_INVALID_INPUT", "state must be an object");
  }
  for (const key of Object.keys(state)) {
    if (!(STATE_FIELDS as readonly string[]).includes(key)) {
      throw new CoordinationError("COORDINATION_UNKNOWN_FIELD", `unknown state field ${key}`);
    }
  }
  if (!COORDINATION_LANES.includes(input.lane)) {
    throw new CoordinationError("COORDINATION_UNKNOWN_LANE", `unknown coordination lane ${String(input.lane)}`);
  }
  if (typeof input.provenance !== "string" || input.provenance.length === 0) {
    throw new CoordinationError("COORDINATION_INVALID_INPUT", "every link requires provenance");
  }
  const supplied: Record<string, unknown> = { ...input };
  // Personality detection outranks the unknown-field check. A smuggled persona is
  // a rejection in its own right, not merely an extra key, and reporting it as
  // "unknown field" would hide what actually went wrong.
  assertNoPersonality(supplied, `link(${input.lane})`, new Set());
  for (const key of Object.keys(supplied)) {
    if (!(LINK_FIELDS as readonly string[]).includes(key)) {
      throw new CoordinationError("COORDINATION_UNKNOWN_FIELD", `unknown link field ${key}`);
    }
  }
  if (input.owner !== undefined && input.owner !== LANE_OWNERS[input.lane]) {
    throw new CoordinationError(
      "COORDINATION_OWNER_REPOINTED",
      `lane ${input.lane} is owned by ${LANE_OWNERS[input.lane]} and cannot be re-pointed`,
    );
  }
  if (state.links.some((link) => link.lane === input.lane)) {
    throw new CoordinationError("COORDINATION_DUPLICATE_LINK", `lane ${input.lane} is already linked`);
  }
  if (input.gateRef !== undefined) {
    if (typeof input.gateRef !== "string" || input.gateRef.length === 0) {
      throw new CoordinationError("COORDINATION_GATE_REQUIRED", "a gated link requires a non-empty gateRef");
    }
  } else if (input.ref === undefined) {
    throw new CoordinationError(
      "COORDINATION_REF_REQUIRED",
      `lane ${input.lane} needs either a ref or a gateRef: a link with neither is not a reference`,
    );
  }
  if (input.ref !== undefined) {
    if (typeof input.ref !== "string" || input.ref.length === 0) {
      throw new CoordinationError("COORDINATION_REF_REQUIRED", "a link ref must be a non-empty string");
    }
    // A reference is an identifier, not embedded content. A ref that parses as
    // a JSON object or array is somebody pasting a fragment into the link,
    // which would make the orchestrator a second owner of that content.
    if (looksLikeEmbeddedContent(input.ref)) {
      throw new CoordinationError(
        "COORDINATION_ENGINE_SURFACE_REJECTED",
        `lane ${input.lane} ref is embedded content, not a reference: A LINK IS A REFERENCE, NOT A COPY`,
      );
    }
  }

  const owner = LANE_OWNERS[input.lane];
  // PROJECT MEMORY is an owner decision, not something this unit creates. The
  // worker-scratch versus autobiographical-memory boundary is OWNER_GATED, so the
  // honest link while that gate stands is a GATED one.
  if (input.lane === "PROJECT_MEMORY" && input.gateRef === undefined) {
    throw new CoordinationError(
      "COORDINATION_GATE_REQUIRED",
      "PROJECT_MEMORY requires a gateRef while REQ-memory-integrity-boundary is OWNER_GATED: this unit does not synthesise autobiographical memory",
    );
  }

  const link: LaneLink = {
    lane: input.lane,
    state: input.gateRef !== undefined ? "GATED" : "LINKED",
    owner,
    ...(input.ref === undefined ? {} : { ref: input.ref }),
    ...(input.gateRef === undefined ? {} : { gateRef: input.gateRef }),
    provenance: input.provenance,
  };

  return {
    links: [...state.links, link].sort((a, b) =>
      COORDINATION_LANES.indexOf(a.lane) - COORDINATION_LANES.indexOf(b.lane),
    ),
  };
}

export interface LaneReport {
  lane: CoordinationLane;
  owner: string;
  state: LinkState;
  gateRef?: string;
  /** True only for a real reference. Never synthesised. */
  hasReference: boolean;
}

export interface AssemblyReport {
  lanes: LaneReport[];
  linked: number;
  gated: number;
  unlinked: CoordinationLane[];
  /**
   * Whether this unit stores any worker personality. Always false, and asserted
   * rather than assumed.
   */
  storesWorkerPersonalities: false;
  /** Whether this unit executes anything. Always false. */
  executesWorkflows: false;
  /** Whether any lane content was copied rather than referenced. Always false. */
  copiesFragmentContent: false;
}

/**
 * Assemble the coordination view.
 *
 * Every registered lane appears, whether or not it is linked, so an absent link
 * is visible as absent instead of disappearing from the report.
 */
export function assemble(state: CoordinationState): AssemblyReport {
  if (!isPlainObject(state) || !Array.isArray(state.links)) {
    throw new CoordinationError("COORDINATION_INVALID_INPUT", "state must carry a links array");
  }
  const byLane = new Map(state.links.map((link) => [link.lane, link]));
  const lanes: LaneReport[] = COORDINATION_LANES.map((lane) => {
    const link = byLane.get(lane);
    return {
      lane,
      owner: LANE_OWNERS[lane],
      state: link?.state ?? "UNLINKED",
      ...(link?.gateRef === undefined ? {} : { gateRef: link.gateRef }),
      hasReference: link?.ref !== undefined,
    };
  });
  return {
    lanes,
    linked: lanes.filter((lane) => lane.state === "LINKED").length,
    gated: lanes.filter((lane) => lane.state === "GATED").length,
    unlinked: lanes.filter((lane) => lane.state === "UNLINKED").map((lane) => lane.lane),
    storesWorkerPersonalities: false,
    executesWorkflows: false,
    copiesFragmentContent: false,
  };
}
