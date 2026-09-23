import { createHash } from "node:crypto";

export function sha256HexBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export interface WorkspaceDiff {
  added: string[];
  modified: string[];
  deleted: string[];
}

export type SyncConflictPolicy = "error" | "incoming-wins" | "existing-wins";

/**
 * Workspace diff-sync contract for runner workspaces. Operates on explicit
 * file maps (path -> bytes); no network, no filesystem access here.
 * Backends transport these maps; this module decides what changed and how
 * to merge. Paths with `..` or absolute paths are rejected: sync never
 * escapes the workspace root.
 */
export function manifestOf(files: ReadonlyMap<string, Uint8Array>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, bytes] of [...files.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) {
    assertSafePath(path);
    out[path] = sha256HexBytes(bytes);
  }
  return out;
}

export function assertSafePath(path: string): void {
  if (!path || path.startsWith("/") || path.startsWith("\\") || path.split(/[\\/]/).includes("..")) {
    throw new Error(`unsafe workspace path ${path}`);
  }
}

export function diffManifests(before: Record<string, string>, after: Record<string, string>): WorkspaceDiff {
  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];
  for (const [path, hash] of Object.entries(after)) {
    if (!(path in before)) added.push(path);
    else if (before[path] !== hash) modified.push(path);
  }
  for (const path of Object.keys(before)) {
    if (!(path in after)) deleted.push(path);
  }
  return {
    added: added.sort(),
    modified: modified.sort(),
    deleted: deleted.sort(),
  };
}

/**
 * Apply an incoming file map onto an existing one per conflict policy.
 * `error` fails on any path both sides changed differently since base;
 * the wins-policies pick a side deterministically. Returns the merged map
 * plus what changed.
 */
export function applySync(
  base: ReadonlyMap<string, Uint8Array>,
  existing: ReadonlyMap<string, Uint8Array>,
  incoming: ReadonlyMap<string, Uint8Array>,
  policy: SyncConflictPolicy,
): { merged: Map<string, Uint8Array>; diff: WorkspaceDiff } {
  const baseManifest = manifestOf(base);
  const existingManifest = manifestOf(existing);
  const incomingManifest = manifestOf(incoming);
  for (const path of [...existing.keys(), ...incoming.keys()]) assertSafePath(path);

  const conflicts: string[] = [];
  for (const path of Object.keys(incomingManifest)) {
    const baseHash = baseManifest[path];
    const existingHash = existingManifest[path];
    const incomingHash = incomingManifest[path]!;
    const existingChanged = baseHash !== undefined && existingHash !== baseHash;
    const incomingChanged = baseHash === undefined || incomingHash !== baseHash;
    if (existingChanged && incomingChanged && existingHash !== incomingHash) {
      conflicts.push(path);
    }
  }
  if (conflicts.length > 0 && policy === "error") {
    throw new Error(`sync conflicts on ${conflicts.sort().join(", ")}`);
  }
  const merged = new Map(existing);
  for (const [path, bytes] of incoming) {
    if (conflicts.includes(path) && policy === "existing-wins") continue;
    merged.set(path, bytes);
  }
  if (policy === "existing-wins") {
    for (const path of conflicts) {
      const bytes = existing.get(path);
      if (bytes) merged.set(path, bytes);
      else merged.delete(path);
    }
  }
  return { merged, diff: diffManifests(existingManifest, manifestOf(merged)) };
}
