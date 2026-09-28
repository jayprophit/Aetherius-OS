import { describe, expect, it } from "vitest";
import {
  LEVELS,
  MAX_DEPTH,
  ancestorsOf,
  childrenOf,
  descendantsOf,
  grandchildrenOf,
  grantMembership,
  levelOf,
  membershipOf,
  registerNode,
  revokeGrant,
  validateHierarchy,
} from "./hierarchy";
import type { MembershipGrant, NetworkNode } from "./hierarchy";

const AT = "2026-09-27T14:00:00.000Z";

/** Dimension-specific fixtures: every node declares its own fields. */
function node(over: Partial<NetworkNode> = {}): NetworkNode {
  return {
    nodeId: "node-a",
    protocols: [],
    registeredAt: AT,
    provenance: "test",
    ...over,
  };
}

function registerAll(defs: Array<Partial<NetworkNode>>): NetworkNode[] {
  return defs.reduce<NetworkNode[]>((acc, def) => registerNode(acc, node(def)), []);
}

function grantAll(
  nodes: NetworkNode[],
  pairs: Array<[string, string]>,
): MembershipGrant[] {
  return pairs.reduce<MembershipGrant[]>(
    (acc, [parentId, childId], index) =>
      grantMembership(acc, nodes, {
        grantId: `grant-${index}`,
        parentId,
        childId,
        grantedAt: AT,
        provenance: "test",
      }),
    [],
  );
}

/** A coherent Parent -> Child -> Grandchild forest for traversal tests. */
function forest(): { nodes: NetworkNode[]; grants: MembershipGrant[] } {
  const nodes = registerAll([
    { nodeId: "parent" },
    { nodeId: "child", parentRef: "parent", protocols: ["loopback"], identityRef: "id:child-1" },
    { nodeId: "grandchild", parentRef: "child" },
  ]);
  const grants = grantAll(nodes, [["parent", "child"], ["child", "grandchild"]]);
  return { nodes, grants };
}

describe("hierarchy: registered vocabulary", () => {
  it("names exactly Parent, Child, Grandchild with max depth 2", () => {
    expect([...LEVELS]).toEqual(["Parent", "Child", "Grandchild"]);
    expect(MAX_DEPTH).toBe(2);
  });
});

describe("hierarchy: node identity and levels", () => {
  it("derives levels from ancestry: root is Parent", () => {
    const { nodes } = forest();
    expect(levelOf(nodes, "parent")).toBe("Parent");
    expect(levelOf(nodes, "child")).toBe("Child");
    expect(levelOf(nodes, "grandchild")).toBe("Grandchild");
  });

  it("reports null for unknown nodes, never a fabricated level", () => {
    const { nodes } = forest();
    expect(levelOf(nodes, "node-ghost")).toBeNull();
  });

  it("rejects depth beyond Grandchild", () => {
    const { nodes } = forest();
    expect(() => registerNode(nodes, node({ nodeId: "too-deep", parentRef: "grandchild" }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_DEPTH_EXCEEDED" }),
    );
  });

  it("rejects self-parenting and empty identities", () => {
    expect(() => registerNode([], node({ nodeId: "x", parentRef: "x" }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_SELF_PARENT" }),
    );
    expect(() => registerNode([], node({ nodeId: "  " }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_INVALID_INPUT" }),
    );
  });

  it("identifies nodes by stable id, not display name", () => {
    const nodes = registerNode([], node({ nodeId: "node-a", displayName: "API" }));
    expect(levelOf(nodes, "node-a")).toBe("Parent");
    expect(levelOf(nodes, "API")).toBeNull();
  });
});

describe("hierarchy: parent direction and cycles", () => {
  it("treats A-parent-of-B and B-parent-of-A as different graphs", () => {
    const forward = registerAll([
      { nodeId: "a" },
      { nodeId: "b", parentRef: "a" },
    ]);
    expect(childrenOf(forward, "a")).toEqual(["b"]);
    expect(childrenOf(forward, "b")).toEqual([]);
    expect(ancestorsOf(forward, "b")).toEqual(["a"]);
    expect(ancestorsOf(forward, "a")).toEqual([]);
  });

  it("rejects a parent cycle at registration with its path", () => {
    // Registration itself refuses to close a cycle, so the cyclic set below
    // can only arise from deserialized/imported data — which is exactly what
    // validateHierarchy exists to check.
    const nodes = registerAll([
      { nodeId: "a", parentRef: "b" },
      { nodeId: "b", parentRef: "c" },
    ]);
    expect(() => registerNode(nodes, node({ nodeId: "c", parentRef: "a" }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_CYCLE" }),
    );
    try {
      registerNode(nodes, node({ nodeId: "c", parentRef: "a" }));
      throw new Error("expected cycle rejection");
    } catch (error) {
      expect((error as Error).message).toContain("a");
      expect((error as Error).message).toContain("b");
      expect((error as Error).message).toContain("c");
    }
  });

  it("validateHierarchy reports a cycle in imported (non-registered) data", () => {
    const imported: NetworkNode[] = [
      node({ nodeId: "a", parentRef: "b" }),
      node({ nodeId: "b", parentRef: "c" }),
      node({ nodeId: "c", parentRef: "a" }),
    ];
    const { cycle } = validateHierarchy(imported);
    expect(cycle.length).toBeGreaterThan(0);
    expect(new Set(cycle)).toEqual(new Set(["a", "b", "c", "a"]));
  });

  it("whole-set validation reports orphans without fabricating parents", () => {
    const nodes = registerAll([{ nodeId: "orphan", parentRef: "node-ghost" }]);
    const { orphans, cycle } = validateHierarchy(nodes);
    expect(orphans).toEqual(["orphan"]);
    expect(cycle).toEqual([]);
    expect(levelOf(nodes, "orphan")).toBeNull();
  });

  it("traversal stays cycle-safe even on adversarial input", () => {
    const nodes: NetworkNode[] = [
      node({ nodeId: "a", parentRef: "b" }),
      node({ nodeId: "b", parentRef: "a" }),
    ];
    expect(descendantsOf(nodes, "a")).toEqual(["b"]);
    expect(ancestorsOf(nodes, "a")).toEqual(["b"]);
  });
});

describe("hierarchy: registration conflicts, never silent resolution", () => {
  it("treats identical re-registration as idempotent", () => {
    const nodes = registerNode([], node({ nodeId: "x" }));
    expect(registerNode(nodes, node({ nodeId: "x" }))).toBe(nodes);
  });

  it("treats same id with changed content as a conflict", () => {
    const nodes = registerNode([], node({ nodeId: "x" }));
    expect(() => registerNode(nodes, node({ nodeId: "x", parentRef: "parent" }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_CONFLICT" }),
    );
  });

  it("does not mutate the caller node set", () => {
    const nodes: NetworkNode[] = [];
    const snapshot = JSON.stringify(nodes);
    registerNode(nodes, node({ nodeId: "x" }));
    expect(JSON.stringify(nodes)).toBe(snapshot);
  });
});

describe("hierarchy: grants are membership, nothing else", () => {
  it("a root is a MEMBER with no grant", () => {
    const { nodes, grants } = forest();
    expect(membershipOf(nodes, grants, "parent")).toMatchObject({ status: "MEMBER", level: "Parent", blockedBy: [] });
  });

  it("a registered child without a grant is PENDING, not a member", () => {
    const { nodes } = forest();
    expect(membershipOf(nodes, [], "child")).toMatchObject({ status: "PENDING", blockedBy: ["no grant from parent"] });
  });

  it("a granted chain reports MEMBER with its level", () => {
    const { nodes, grants } = forest();
    expect(membershipOf(nodes, grants, "grandchild")).toMatchObject({ status: "MEMBER", level: "Grandchild", blockedBy: [] });
  });

  it("a revoked grant reports REVOKED with the grant named", () => {
    const { nodes, grants } = forest();
    const revoked = revokeGrant(grants, "grant-0", "compromised key", AT);
    expect(membershipOf(nodes, revoked, "child")).toMatchObject({ status: "REVOKED", blockedBy: ["grant grant-0 revoked"] });
  });

  it("a revoked ancestor detaches the subtree without deleting it", () => {
    const { nodes, grants } = forest();
    const revoked = revokeGrant(grants, "grant-0", "compromised key", AT);
    const view = membershipOf(nodes, revoked, "grandchild");
    expect(view.status).toBe("DETACHED");
    expect(view.blockedBy).toEqual(["ancestor grant grant-0 revoked"]);
    // Nothing was deleted or reparented.
    expect(nodes.some((n) => n.nodeId === "grandchild")).toBe(true);
    expect(nodes.find((n) => n.nodeId === "grandchild")!.parentRef).toBe("child");
  });

  it("an unknown parent reports ORPHANED with the parent named", () => {
    const nodes = registerAll([{ nodeId: "orphan", parentRef: "node-ghost" }]);
    expect(membershipOf(nodes, [], "orphan")).toMatchObject({ status: "ORPHANED", blockedBy: ["unknown parent node-ghost"] });
  });

  it("an unregistered id reports UNREGISTERED", () => {
    const { nodes, grants } = forest();
    expect(membershipOf(nodes, grants, "node-ghost")).toMatchObject({ status: "UNREGISTERED", blockedBy: [] });
  });

  it("a grant for a non-topological parent is refused", () => {
    const { nodes } = forest();
    expect(() =>
      grantMembership([], nodes, { grantId: "g-x", parentId: "grandchild", childId: "child", grantedAt: AT, provenance: "test" }),
    ).toThrowError(expect.objectContaining({ code: "HIERARCHY_INVALID_INPUT" }));
  });

  it("duplicate grant ids are refused", () => {
    const { nodes, grants } = forest();
    expect(() =>
      grantMembership(grants, nodes, { grantId: "grant-0", parentId: "parent", childId: "child", grantedAt: AT, provenance: "test" }),
    ).toThrowError(expect.objectContaining({ code: "HIERARCHY_DUPLICATE_ID" }));
  });
});

describe("hierarchy: derived traversal", () => {
  it("reads children, grandchildren, ancestors, and descendants", () => {
    const { nodes } = forest();
    expect(childrenOf(nodes, "parent")).toEqual(["child"]);
    expect(grandchildrenOf(nodes, "parent")).toEqual(["grandchild"]);
    expect(grandchildrenOf(nodes, "child")).toEqual([]);
    expect(ancestorsOf(nodes, "grandchild")).toEqual(["child", "parent"]);
    expect(descendantsOf(nodes, "parent")).toEqual(["child", "grandchild"]);
  });

  it("is deterministic from scrambled registration order", () => {
    const forward = forest().nodes;
    const reversed = registerAll([
      { nodeId: "grandchild", parentRef: "child" },
      { nodeId: "child", parentRef: "parent", protocols: ["loopback"], identityRef: "id:child-1" },
      { nodeId: "parent" },
    ]);
    expect(JSON.stringify(descendantsOf(forward, "parent"))).toBe(JSON.stringify(descendantsOf(reversed, "parent")));
    expect(JSON.stringify(forward)).toBe(JSON.stringify(reversed));
  });

  it("grandchildren are derived, never stored", () => {
    const { nodes } = forest();
    for (const n of nodes) {
      expect(Object.keys(n)).not.toContain("grandchildren");
      expect(Object.keys(n)).not.toContain("children");
      expect(Object.keys(n)).not.toContain("ancestors");
    }
  });
});

describe("hierarchy: boundaries that stay boundaries", () => {
  it("rejects lineage-shaped keys: no Genesis parentage, ever", () => {
    for (const key of ["lineage", "lineageId", "genesisLineage", "parentGenesis", "genesisParent"]) {
      expect(() => registerNode([], { ...node(), [key]: "x" } as never)).toThrowError(
        expect.objectContaining({ code: "HIERARCHY_GENESIS_REJECTED" }),
      );
    }
  });

  it("accepts an opaque identity reference without resolving it", () => {
    const nodes = registerNode([], node({ identityRef: "id:child-1" }));
    expect(nodes[0]!.identityRef).toBe("id:child-1");
    expect(Object.keys(nodes[0]!)).not.toContain("identity");
  });

  it("rejects authority, secret, and persona keys before shape errors", () => {
    expect(() => registerNode([], { ...node(), ownerOverride: true } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_AUTHORITY_REJECTED" }),
    );
    expect(() => registerNode([], { ...node(), trusted: 3 } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_AUTHORITY_REJECTED" }),
    );
    expect(() => registerNode([], { ...node(), token: "t" } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_SECRET_REJECTED" }),
    );
    expect(() => registerNode([], { ...node(), persona: "p" } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_PERSONALITY_REJECTED" }),
    );
  });

  it("rejects unknown node and grant fields", () => {
    expect(() => registerNode([], { ...node(), color: "blue" } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_UNKNOWN_FIELD" }),
    );
    // trustLevel is not "unknown" — it is a banned authority-adjacent key by
    // design (HIERARCHY DEPTH != TRUST LEVEL), so precedence reports it first.
    expect(() => registerNode([], { ...node(), trustLevel: 1 } as never)).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_AUTHORITY_REJECTED" }),
    );
    const { nodes } = forest();
    expect(() =>
      grantMembership([], nodes, { grantId: "g", parentId: "parent", childId: "child", grantedAt: AT, provenance: "t", scope: "all" } as never),
    ).toThrowError(expect.objectContaining({ code: "HIERARCHY_UNKNOWN_FIELD" }));
  });

  it("carries no transport, placement, kill-switch, or scoring surface", async () => {
    const module = await import("./hierarchy");
    const names = Object.keys(module);
    expect(names.sort()).toEqual(
      ["HierarchyError", "LEVELS", "MAX_DEPTH", "ancestorsOf", "childrenOf", "descendantsOf", "grandchildrenOf", "grantMembership", "levelOf", "membershipOf", "registerNode", "revokeGrant", "validateHierarchy"].sort(),
    );
    for (const banned of ["socket", "send", "transport", "place", "cloud", "kill", "wipe", "revokeDevice", "disabl", "score", "trust", "online", "approv", "grantApproved", "schedul", "spawn", "migrat", "deploy"]) {
      expect(names.some((n) => n.toLowerCase().includes(banned))).toBe(false);
    }
  });

  it("records protocols as declared labels with timestamps caller-supplied", () => {
    const nodes = registerNode([], node({ protocols: ["loopback", "websocket"] }));
    expect(nodes[0]!.protocols).toEqual(["loopback", "websocket"]);
    expect(() => registerNode([], node({ registeredAt: "" }))).toThrowError(
      expect.objectContaining({ code: "HIERARCHY_INVALID_INPUT" }),
    );
  });
});
