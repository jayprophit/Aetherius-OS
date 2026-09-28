/**
 * REQ-p27-network-hierarchy: Parent/Child/Grandchild network model.
 *
 * The registered requirement is the scope authority:
 *
 *   "Aetherius OS network hierarchy (isolated Parent authority, distributed
 *    Child layer, protocols, grants/inheritance, revocation, identity
 *    linkage); belongs to OS/network, never to Genesis identity."
 *
 * Every parenthetical element becomes exactly one mechanism: per-subtree
 * Parent authority, the Child layer with derived Grandchildren, declared
 * protocol labels, membership grants with structural inheritance of position,
 * revocation, and opaque identity linkage. Nothing else is built.
 *
 * THREE LEVELS, DERIVED — NEVER STORED. A root (no parentRef) is Parent
 * depth 0; its children are Child depth 1; their children are Grandchild
 * depth 2, which is terminal. Level is always computed from ancestry, so a
 * stored level can never contradict the links:
 *
 *   DERIVED RELATION != SECOND CANONICAL OWNER
 *   DERIVED VIEW != CANONICAL STATE
 *
 * GRANTS ARE TOPOLOGY MEMBERSHIP, NOTHING ELSE. A membership grant records
 * that a parent accepts a child into its subtree. It confers no policy, no
 * capability, no secret, no approval — those owners are untouched:
 *
 *   PARENT != OWNER APPROVAL
 *   NETWORK ANCESTRY != POLICY PRECEDENCE
 *   PARENT RELATION != AUTOMATIC INHERITANCE (of anything but position)
 *
 * What IS inherited structurally is position: a grandchild's ancestry runs
 * through its parent, and each root's authority is isolated to its own
 * subtree — grants in one subtree have no effect in another:
 *
 *   ISOLATED PARENT AUTHORITY (per-subtree, non-transferable)
 *
 * REVOCATION DETACHES, NEVER DELETES. Revoking a grant flips its status with
 * a reason; the node and its subtree stay recorded but report detached.
 * There is no removal, no reparenting, no cascade delete, no silent
 * orphan-repair:
 *
 *   REVOKED != DELETED
 *   ORPHANED != REPARENTED
 *   UNKNOWN PARENT != ROOT (no placeholder parents are ever fabricated)
 *
 * TOPOLOGY IS NOTHING ELSE. In particular, verified by tests:
 *
 *   AETHERIUS NETWORK HIERARCHY != GENESIS (one Genesis + temporary workers;
 *     no parent/child Genesis, no lineage fields — lineage-shaped keys are
 *     rejected outright)
 *   TOPOLOGICAL LEVEL != AUTHORIZATION
 *   NODE ID != USER/AI/BLOCKCHAIN ID (identityRef is opaque, never resolved)
 *   NODE REGISTERED != NODE ONLINE (no liveness is recorded or inferred)
 *   NODE REGISTERED != NODE APPROVED
 *   TOPOLOGY != TRANSPORT / PLACEMENT (no sockets, no routing, no targets)
 *   LOGICAL PATH != NETWORK PATH
 *   NODE RELATED != NODE REACHABLE
 *   PARENT OFFLINE != CHILD INVALID (no liveness exists to go stale)
 *   HIERARCHY DEPTH != TRUST LEVEL (no scores, ever)
 *   PARENT != RELAY, CHILD != CLIENT (no role mapping invented)
 *   PARENT != OWNER (unless a future requirement says so)
 *
 * ORPHANS AND CYCLES: an unknown parentRef records the node as ORPHANED
 * (reported, never repaired); a parent cycle is rejected with its path;
 * self-parenting is rejected; a second registration with the same id and
 * identical content is idempotent while changed content is a conflict —
 * conflicting parent claims therefore never resolve silently.
 *
 * Timestamps are caller-supplied record times only (registeredAt, grantedAt,
 * revokedAt). No joinedAt/lastSeen is fabricated. Everything is pure,
 * deterministic, and caller-held: no store, no timers, no network calls.
 */

export type HierarchyProblemCode =
  | "HIERARCHY_INVALID_INPUT"
  | "HIERARCHY_UNKNOWN_FIELD"
  | "HIERARCHY_AUTHORITY_REJECTED"
  | "HIERARCHY_SECRET_REJECTED"
  | "HIERARCHY_PERSONALITY_REJECTED"
  | "HIERARCHY_GENESIS_REJECTED"
  | "HIERARCHY_DUPLICATE_ID"
  | "HIERARCHY_CONFLICT"
  | "HIERARCHY_UNKNOWN_NODE"
  | "HIERARCHY_SELF_PARENT"
  | "HIERARCHY_CYCLE"
  | "HIERARCHY_DEPTH_EXCEEDED"
  | "HIERARCHY_GRANT_REQUIRED";

export class HierarchyError extends Error {
  readonly code: HierarchyProblemCode;
  constructor(code: HierarchyProblemCode, message: string) {
    super(message);
    this.name = "HierarchyError";
    this.code = code;
  }
}

/** Exact registered level names, in depth order. */
export const LEVELS = ["Parent", "Child", "Grandchild"] as const;
export type LevelName = (typeof LEVELS)[number];

/** Maximum ancestry depth. Grandchild is terminal: the model names 3 levels. */
export const MAX_DEPTH = 2;

export type MembershipState =
  | "MEMBER"
  | "PENDING"
  | "REVOKED"
  | "DETACHED"
  | "ORPHANED"
  | "UNREGISTERED";

export interface NetworkNode {
  /** Stable identity. DISPLAY NAME != NODE IDENTITY; CURRENT IP != NODE IDENTITY. */
  nodeId: string;
  displayName?: string;
  /** Parent link. A IS PARENT OF B != B IS PARENT OF A. Single parentRef. */
  parentRef?: string;
  /** Declared protocol labels. Declared, never negotiated or validated. */
  protocols: string[];
  /** Opaque reference to an existing identity. Never resolved, never owned. */
  identityRef?: string;
  registeredAt: string;
  provenance: string;
}

export interface MembershipGrant {
  grantId: string;
  parentId: string;
  childId: string;
  status: "ACTIVE" | "REVOKED";
  grantedAt: string;
  revokedAt?: string;
  revokeReason?: string;
  provenance: string;
}

const NODE_FIELDS = [
  "nodeId", "displayName", "parentRef", "protocols", "identityRef",
  "registeredAt", "provenance",
] as const;

const GRANT_FIELDS = [
  "grantId", "parentId", "childId", "grantedAt", "provenance",
] as const;

const AUTHORITY_KEYS = [
  "authorized", "approved", "canExecute", "canDeploy", "permission",
  "permissionGranted", "grantApproved", "policyBypass", "ownerOverride",
  "mergeAuthority", "trusted", "trustLevel", "killSwitch", "remoteDisable",
  "wipe", "revokeDevice",
];

const SECRET_KEYS = ["apiKey", "secret", "token", "password", "privateKey", "credential"];

const PERSONALITY_KEYS = [
  "personality", "persona", "traits", "backstory", "biography",
  "autobiography", "identity", "dna", "soul", "selfModel",
];

/** Lineage-shaped keys would build Genesis parentage: refused outright. */
const GENESIS_KEYS = ["lineage", "lineageId", "genesisLineage", "parentGenesis", "childGenesis", "genesisParent", "genesisChild"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Security-significant violations are diagnosed BEFORE generic shape errors,
 * so a smuggled grant is reported as itself and never disappears into an
 * unknown-field complaint.
 */
function assertNoViolations(value: unknown, path: string, seen: Set<unknown>): void {
  if (seen.has(value) || typeof value !== "object" || value === null) return;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoViolations(item, `${path}[${index}]`, seen));
    return;
  }
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    if (AUTHORITY_KEYS.includes(key)) {
      throw new HierarchyError("HIERARCHY_AUTHORITY_REJECTED", `${path}.${key}: topology never carries authority`);
    }
    if (SECRET_KEYS.includes(key)) {
      throw new HierarchyError("HIERARCHY_SECRET_REJECTED", `${path}.${key}: SECRET REF != SECRET VALUE`);
    }
    if (PERSONALITY_KEYS.includes(key)) {
      throw new HierarchyError("HIERARCHY_PERSONALITY_REJECTED", `${path}.${key}: a node record carries no stored person`);
    }
    if (GENESIS_KEYS.includes(key)) {
      throw new HierarchyError("HIERARCHY_GENESIS_REJECTED", `${path}.${key}: AETHERIUS NETWORK HIERARCHY != GENESIS — no lineage fields, ever`);
    }
    assertNoViolations(nested, `${path}.${key}`, seen);
  }
}

function assertStringList(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.some((id) => !nonEmpty(id))) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", `${path} must be an array of non-empty strings`);
  }
  return [...new Set(value as string[])].sort();
}

function assertNodeShape(value: unknown): NetworkNode {
  if (!isPlainObject(value)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "node must be an object");
  }
  assertNoViolations(value, "node", new Set());
  for (const key of Object.keys(value)) {
    if (!(NODE_FIELDS as readonly string[]).includes(key)) {
      throw new HierarchyError("HIERARCHY_UNKNOWN_FIELD", `unknown node field ${key}`);
    }
  }
  if (!nonEmpty(value.nodeId)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "nodeId must be a non-empty stable id");
  }
  if (value.displayName !== undefined && !nonEmpty(value.displayName)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "displayName must be non-empty when present");
  }
  if (value.parentRef !== undefined) {
    if (!nonEmpty(value.parentRef)) {
      throw new HierarchyError("HIERARCHY_INVALID_INPUT", "parentRef must be non-empty when present");
    }
    if (value.parentRef === value.nodeId) {
      throw new HierarchyError("HIERARCHY_SELF_PARENT", `node ${value.nodeId} cannot parent itself`);
    }
  }
  if (value.identityRef !== undefined && !nonEmpty(value.identityRef)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "identityRef must be non-empty when present");
  }
  if (!nonEmpty(value.registeredAt) || !nonEmpty(value.provenance)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "registeredAt and provenance are required: timestamps are caller-supplied, never invented");
  }
  return {
    nodeId: value.nodeId,
    ...(value.displayName === undefined ? {} : { displayName: value.displayName as string }),
    ...(value.parentRef === undefined ? {} : { parentRef: value.parentRef as string }),
    protocols: value.protocols === undefined ? [] : assertStringList(value.protocols, "protocols"),
    ...(value.identityRef === undefined ? {} : { identityRef: value.identityRef as string }),
    registeredAt: value.registeredAt,
    provenance: value.provenance,
  };
}

/**
 * Register one node into a caller-held node set. Pure: returns a new sorted
 * set, never mutates. Same id + identical content is idempotent; same id +
 * changed content is a conflict (MULTIPLE CLAIMS != AUTOMATIC RESOLUTION).
 * Depth beyond Grandchild is rejected: the registered model names 3 levels.
 */
export function registerNode(nodes: NetworkNode[], input: unknown): NetworkNode[] {
  if (!Array.isArray(nodes)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "nodes must be an array");
  }
  const node = assertNodeShape(input);
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const existing = byId.get(node.nodeId);
  if (existing !== undefined) {
    if (JSON.stringify(existing) === JSON.stringify(node)) return nodes;
    throw new HierarchyError("HIERARCHY_CONFLICT", `node ${node.nodeId} already registered with different content`);
  }
  if (node.parentRef !== undefined) {
    const depth = ancestryDepth(byId, node.parentRef);
    if (depth === -1) {
      // Parent unknown: the node records as ORPHANED. No placeholder is
      // fabricated; UNKNOWN PARENT != ROOT.
    } else if (depth + 1 > MAX_DEPTH) {
      throw new HierarchyError(
        "HIERARCHY_DEPTH_EXCEEDED",
        `node ${node.nodeId} would sit at depth ${depth + 1}: the registered model names Parent/Child/Grandchild only`,
      );
    }
    checkCycle(byId, node.nodeId, node.parentRef);
  }
  return [...nodes, node].sort((a, b) => (a.nodeId < b.nodeId ? -1 : 1));
}

/** Depth of a node by ancestry: root = 0; unknown = -1. Cycle-safe. */
function ancestryDepth(byId: Map<string, NetworkNode>, nodeId: string): number {
  const visited = new Set<string>();
  let current: string | undefined = nodeId;
  let depth = 0;
  while (current !== undefined) {
    if (visited.has(current)) return depth;
    visited.add(current);
    const node = byId.get(current);
    if (node === undefined) return -1;
    if (node.parentRef === undefined) return depth;
    current = node.parentRef;
    depth += 1;
    if (depth > 64) return depth;
  }
  return depth;
}

function checkCycle(byId: Map<string, NetworkNode>, nodeId: string, parentRef: string): void {
  const path = [nodeId];
  const visited = new Set<string>([nodeId]);
  let current: string | undefined = parentRef;
  while (current !== undefined) {
    if (visited.has(current)) {
      throw new HierarchyError("HIERARCHY_CYCLE", `parent cycle: ${[...path, current].join(" -> ")}`);
    }
    visited.add(current);
    path.push(current);
    current = byId.get(current)?.parentRef;
  }
}

/** Level name derived from ancestry. Roots are Parent; unknown is null. */
export function levelOf(nodes: NetworkNode[], nodeId: string): LevelName | null {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const node = byId.get(nodeId);
  if (node === undefined) return null;
  if (node.parentRef === undefined) return "Parent";
  const depth = ancestryDepth(byId, nodeId);
  if (depth < 0 || depth > MAX_DEPTH) return null;
  return LEVELS[depth] ?? null;
}

export interface GrantInput {
  grantId: string;
  parentId: string;
  childId: string;
  grantedAt: string;
  provenance: string;
}

/**
 * Record a parent's membership grant for a child: topology membership only,
 * conferring no policy, capability, secret, or approval. Pure: returns a new
 * sorted grant set.
 */
export function grantMembership(grants: MembershipGrant[], nodes: NetworkNode[], input: unknown): MembershipGrant[] {
  if (!Array.isArray(grants)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "grants must be an array");
  }
  if (!isPlainObject(input)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "grant must be an object");
  }
  assertNoViolations(input, "grant", new Set());
  for (const key of Object.keys(input)) {
    if (!["grantId", "parentId", "childId", "grantedAt", "provenance"].includes(key)) {
      throw new HierarchyError("HIERARCHY_UNKNOWN_FIELD", `unknown grant field ${key}`);
    }
  }
  if (!nonEmpty(input.grantId) || !nonEmpty(input.parentId) || !nonEmpty(input.childId)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "grantId, parentId, and childId must be non-empty");
  }
  if (input.parentId === input.childId) {
    throw new HierarchyError("HIERARCHY_SELF_PARENT", "a node cannot grant membership to itself");
  }
  if (!nonEmpty(input.grantedAt) || !nonEmpty(input.provenance)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "grantedAt and provenance are required");
  }
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const child = byId.get(input.childId as string);
  const parent = byId.get(input.parentId as string);
  if (child === undefined) {
    throw new HierarchyError("HIERARCHY_UNKNOWN_NODE", `grant child ${input.childId} is not registered: UNKNOWN REF != EMPTY NODE`);
  }
  if (parent === undefined) {
    throw new HierarchyError("HIERARCHY_UNKNOWN_NODE", `grant parent ${input.parentId} is not registered`);
  }
  if (child.parentRef !== input.parentId) {
    throw new HierarchyError(
      "HIERARCHY_INVALID_INPUT",
      `grant parent ${input.parentId} is not the registered parent of ${input.childId}: grants follow topology, never redefine it`,
    );
  }
  if (grants.some((g) => g.grantId === input.grantId)) {
    throw new HierarchyError("HIERARCHY_DUPLICATE_ID", `grant ${input.grantId} already recorded`);
  }
  const grant: MembershipGrant = {
    grantId: input.grantId as string,
    parentId: input.parentId as string,
    childId: input.childId as string,
    status: "ACTIVE",
    grantedAt: input.grantedAt as string,
    provenance: input.provenance as string,
  };
  return [...grants, grant].sort((a, b) => (a.grantId < b.grantId ? -1 : 1));
}

/**
 * Revoke a membership grant with a reason. The node and its subtree stay
 * recorded; they report detached. No deletion, no reparenting, no cascade.
 */
export function revokeGrant(
  grants: MembershipGrant[],
  grantId: string,
  reason: string,
  revokedAt: string,
): MembershipGrant[] {
  if (!nonEmpty(grantId) || !nonEmpty(reason) || !nonEmpty(revokedAt)) {
    throw new HierarchyError("HIERARCHY_INVALID_INPUT", "revokeGrant needs non-empty grantId, reason, and revokedAt");
  }
  const grant = grants.find((g) => g.grantId === grantId);
  if (grant === undefined) {
    throw new HierarchyError("HIERARCHY_UNKNOWN_NODE", `grant ${grantId} is not recorded`);
  }
  if (grant.status === "REVOKED") return grants;
  return grants
    .map((g) => (g.grantId === grantId ? { ...g, status: "REVOKED" as const, revokedAt, revokeReason: reason } : g))
    .sort((a, b) => (a.grantId < b.grantId ? -1 : 1));
}

export type MembershipStatus = "MEMBER" | "PENDING" | "REVOKED" | "DETACHED" | "ORPHANED" | "UNREGISTERED";

export interface MembershipView {
  nodeId: string;
  level: LevelName | null;
  status: MembershipStatus;
  /** Named blockers: revoked grant, unknown parent, detached ancestor. */
  blockedBy: string[];
}

/**
 * Effective membership, derived — never stored. A member needs: registration,
 * a known parent chain to a root (roots need no grant), and an ACTIVE grant
 * at every non-root link. Anything else names its blocker explicitly.
 */
export function membershipOf(nodes: NetworkNode[], grants: MembershipGrant[], nodeId: string): MembershipView {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const node = byId.get(nodeId);
  if (node === undefined) {
    return { nodeId, level: null, status: "UNREGISTERED", blockedBy: [] };
  }
  if (node.parentRef === undefined) {
    return { nodeId, level: "Parent", status: "MEMBER", blockedBy: [] };
  }
  // Walk the ancestry, collecting the first blocker. Every link needs a
  // known parent and an ACTIVE grant; the walk stops at the first failure
  // so the report names exactly what blocks membership.
  const chain: string[] = [nodeId];
  const visited = new Set<string>([nodeId]);
  let current: string | undefined = node.parentRef;
  while (current !== undefined) {
    if (visited.has(current)) {
      return { nodeId, level: null, status: "ORPHANED", blockedBy: [`cycle at ${current}`] };
    }
    visited.add(current);
    const parent = byId.get(current);
    if (parent === undefined) {
      return { nodeId, level: levelOf(nodes, nodeId), status: "ORPHANED", blockedBy: [`unknown parent ${current}`] };
    }
    const childId = chain[chain.length - 1]!;
    const grant = grants.find((g) => g.parentId === current && g.childId === childId);
    if (grant === undefined) {
      return { nodeId, level: levelOf(nodes, nodeId), status: "PENDING", blockedBy: [`no grant from ${current}`] };
    }
    if (grant.status === "REVOKED") {
      if (childId === nodeId) {
        return { nodeId, level: levelOf(nodes, nodeId), status: "REVOKED", blockedBy: [`grant ${grant.grantId} revoked`] };
      }
      return { nodeId, level: levelOf(nodes, nodeId), status: "DETACHED", blockedBy: [`ancestor grant ${grant.grantId} revoked`] };
    }
    chain.push(current);
    current = parent.parentRef;
  }
  return { nodeId, level: levelOf(nodes, nodeId), status: "MEMBER", blockedBy: [] };
}

/** Direct children, canonically ordered. */
export function childrenOf(nodes: NetworkNode[], nodeId: string): string[] {
  return nodes.filter((n) => n.parentRef === nodeId).map((n) => n.nodeId).sort();
}

/** Grandchildren: children of children. Derived, never stored. */
export function grandchildrenOf(nodes: NetworkNode[], nodeId: string): string[] {
  const out = new Set<string>();
  for (const child of childrenOf(nodes, nodeId)) {
    for (const grandchild of childrenOf(nodes, child)) out.add(grandchild);
  }
  return [...out].sort();
}

/** Ancestors nearest-first. Cycle-safe via visited set. */
export function ancestorsOf(nodes: NetworkNode[], nodeId: string): string[] {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const out: string[] = [];
  const visited = new Set<string>([nodeId]);
  let current = byId.get(nodeId)?.parentRef;
  while (current !== undefined && !visited.has(current)) {
    visited.add(current);
    out.push(current);
    current = byId.get(current)?.parentRef;
  }
  return out;
}

/** Descendants breadth-first in canonical order. Cycle-safe via visited set. */
export function descendantsOf(nodes: NetworkNode[], nodeId: string): string[] {
  const visited = new Set<string>([nodeId]);
  const out: string[] = [];
  let frontier = childrenOf(nodes, nodeId);
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of frontier) {
      if (visited.has(id)) continue;
      visited.add(id);
      out.push(id);
      next.push(...childrenOf(nodes, id));
    }
    frontier = [...new Set(next)].sort();
  }
  return out;
}

/**
 * Whole-set validation: individually valid edges may collectively form a
 * cycle, so the set is checked as a set. Returns orphans and the cycle path
 * (at most the first found); an empty report means a coherent forest.
 */
export function validateHierarchy(nodes: NetworkNode[]): { orphans: string[]; cycle: string[] } {
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  const orphans = nodes
    .filter((n) => n.parentRef !== undefined && !byId.has(n.parentRef))
    .map((n) => n.nodeId)
    .sort();
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map<string, number>(nodes.map((n) => [n.nodeId, WHITE]));
  let cycle: string[] = [];
  const visit = (id: string, stack: string[]): boolean => {
    color.set(id, GRAY);
    const parent = byId.get(id)?.parentRef;
    if (parent !== undefined && byId.has(parent)) {
      if (color.get(parent) === GRAY) {
        cycle = [...stack.slice(stack.indexOf(parent)), parent];
        return true;
      }
      if (color.get(parent) === WHITE && visit(parent, [...stack, parent])) return true;
    }
    color.set(id, BLACK);
    return false;
  };
  for (const id of [...byId.keys()].sort()) {
    if (color.get(id) === WHITE && visit(id, [id])) break;
  }
  return { orphans, cycle };
}
