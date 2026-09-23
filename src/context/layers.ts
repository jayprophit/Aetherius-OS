import { discoverSkills } from "../workflows/discovery";
import type { SkillRegistry } from "../workflows/skills";
import type { OwnedStore } from "../state/store";
import type { GenesisIdentityRef } from "../genesis/identity";

/**
 * REQ-context-layers (P26): layered context retrieval policy (L0–L7).
 *
 * Identity/task/project/skill/memory/file/doc/archive layers load
 * selectively through ONE policy over EXISTING stores — not seven new
 * databases. Each layer names its backing; layers without a local backing
 * (memory lives behind Agent Bridge) are declared UNBOUND with their
 * route, never faked.
 *
 * Governance carried through: SECRET_REFERENCE state contributes metadata
 * only (id/kind/owner), never payload; budgets truncate explicitly with a
 * truncated flag rather than silently dropping.
 *
 * Reference: Saraev layered-context research (STUDY_ONLY).
 */

export type LayerId = "L0" | "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7";

export const LAYERS: readonly LayerId[] = ["L0", "L1", "L2", "L3", "L4", "L5", "L6", "L7"];

export type Backing = "BOUND" | "UNBOUND";

export interface LayerSpec {
  layer: LayerId;
  name: string;
  backing: Backing;
  /** Existing store or route; for UNBOUND, where it resolves at runtime. */
  store: string;
}

export const LAYER_SPECS: readonly LayerSpec[] = [
  { layer: "L0", name: "identity", backing: "BOUND", store: "caller-provided GenesisIdentityRef" },
  { layer: "L1", name: "task", backing: "BOUND", store: "caller-provided task record (workflow run inputs/state)" },
  { layer: "L2", name: "project", backing: "BOUND", store: "caller-provided project descriptor" },
  { layer: "L3", name: "skill", backing: "BOUND", store: "SkillRegistry via discoverSkills" },
  { layer: "L4", name: "memory", backing: "UNBOUND", store: "Agent Bridge memory via bridge (route: memory.query)" },
  { layer: "L5", name: "file", backing: "BOUND", store: "caller-provided workspace file map" },
  { layer: "L6", name: "doc", backing: "BOUND", store: "caller-provided doc records" },
  { layer: "L7", name: "archive", backing: "BOUND", store: "OwnedStore envelopes (metadata only for secrets)" },
];

export interface TaskRecord {
  taskId: string;
  state: string;
  inputs?: Record<string, unknown>;
}

export interface ProjectRecord {
  projectId: string;
  policy?: string;
}

export interface DocRecord {
  docId: string;
  title: string;
  text: string;
}

export interface LayerDeps {
  identity?: GenesisIdentityRef;
  task?: TaskRecord;
  project?: ProjectRecord;
  skills?: SkillRegistry;
  skillQuery?: string;
  files?: ReadonlyMap<string, Uint8Array>;
  docs?: readonly DocRecord[];
  state?: OwnedStore;
  statePrefix?: string;
}

export interface ContextRequest {
  include: LayerId[];
  maxItemsPerLayer?: number;
}

export type LayerStatus = "LOADED" | "SKIPPED" | "UNBOUND" | "DENIED";

export interface LayerResult {
  layer: LayerId;
  name: string;
  status: LayerStatus;
  items: unknown[];
  truncated: boolean;
  reason: string;
}

function cap<T>(items: T[], max: number): { items: T[]; truncated: boolean } {
  if (items.length <= max) return { items, truncated: false };
  return { items: items.slice(0, max), truncated: true };
}

function textOf(bytes: Uint8Array, maxChars: number): string {
  const text = new TextDecoder().decode(bytes);
  return text.length <= maxChars ? text : `${text.slice(0, maxChars)}…[truncated ${text.length - maxChars} chars]`;
}

/**
 * Resolve requested layers against provided stores. Pure + deterministic.
 * Missing backing data SKIPs the layer with a reason (never fabricates);
 * UNBOUND layers report their route; secret state yields metadata only.
 */
export function resolveLayers(request: ContextRequest, deps: LayerDeps): LayerResult[] {
  const max = request.maxItemsPerLayer ?? 25;
  if (!Number.isInteger(max) || max < 1) throw new Error("maxItemsPerLayer must be a positive integer");
  const seen = new Set<LayerId>();
  for (const layer of request.include) {
    if (!LAYERS.includes(layer)) throw new Error(`unknown context layer ${String(layer)}`);
    if (seen.has(layer)) throw new Error(`duplicate context layer ${layer}`);
    seen.add(layer);
  }
  return request.include.map((layer) => loadLayer(layer, deps, max));
}

function loadLayer(layer: LayerId, deps: LayerDeps, max: number): LayerResult {
  const spec = LAYER_SPECS.find((s) => s.layer === layer)!;
  switch (layer) {
    case "L0": {
      if (!deps.identity) return skip(spec, "no identity ref provided");
      return loaded(spec, [{ genesisId: deps.identity.genesisId }], max, "genesis identity ref");
    }
    case "L1": {
      if (!deps.task) return skip(spec, "no task record provided");
      return loaded(spec, [{ taskId: deps.task.taskId, state: deps.task.state }], max, "task record");
    }
    case "L2": {
      if (!deps.project) return skip(spec, "no project descriptor provided");
      return loaded(
        spec, [{ projectId: deps.project.projectId, ...(deps.project.policy ? { policy: deps.project.policy } : {}) }],
        max, "project descriptor",
      );
    }
    case "L3": {
      if (!deps.skills) return skip(spec, "no skill registry provided");
      if (!deps.skillQuery?.trim()) return skip(spec, "no skill query provided");
      const hits = discoverSkills(deps.skills, deps.skillQuery, { limit: max });
      return {
        layer, name: spec.name, status: "LOADED",
        items: hits.map((h) => ({ skillId: h.skill.skill_id, version: h.skill.version, score: h.score })),
        truncated: hits.length >= max,
        reason: `${hits.length} skill hit(s) via registry discovery`,
      };
    }
    case "L4": {
      return { layer, name: spec.name, status: "UNBOUND", items: [], truncated: false, reason: `memory resolves at runtime via ${spec.store}` };
    }
    case "L5": {
      if (!deps.files) return skip(spec, "no workspace file map provided");
      const entries = [...deps.files.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
      const items = entries.map(([path, bytes]) => ({ path, preview: textOf(bytes, 500) }));
      const capped = cap(items, max);
      return loaded(spec, capped.items, max, `${entries.length} file(s)`, capped.truncated);
    }
    case "L6": {
      if (!deps.docs) return skip(spec, "no doc records provided");
      const items = [...deps.docs]
        .sort((a, b) => (a.docId < b.docId ? -1 : 1))
        .map((d) => ({ docId: d.docId, title: d.title, preview: d.text.slice(0, 500) }));
      const capped = cap(items, max);
      return loaded(spec, capped.items, max, `${deps.docs.length} doc(s)`, capped.truncated);
    }
    case "L7": {
      if (!deps.state) return skip(spec, "no owned store provided");
      const withList = deps.state as OwnedStore & { listIds?: (p?: string) => string[] };
      if (typeof withList.listIds !== "function") return skip(spec, "store does not list envelopes");
      const ids = withList.listIds(deps.statePrefix ?? "");
      const items = ids.map((id) => {
        try {
          const env = deps.state!.load<unknown>(id);
          if (env.sensitivity === "SECRET_REFERENCE") {
            return { id, kind: env.kind, owner: env.owner, payload: "[withheld: secret reference]" };
          }
          return { id, kind: env.kind, owner: env.owner };
        } catch {
          return { id, kind: "unreadable", owner: "" };
        }
      });
      const capped = cap(items, max);
      return loaded(spec, capped.items, max, `${ids.length} envelope(s); secret payloads withheld`, capped.truncated);
    }
  }
}

function skip(spec: LayerSpec, reason: string): LayerResult {
  return { layer: spec.layer, name: spec.name, status: "SKIPPED", items: [], truncated: false, reason };
}

function loaded(spec: LayerSpec, items: unknown[], max: number, reason: string, truncated?: boolean): LayerResult {
  const capped = truncated === undefined ? cap(items, max) : { items, truncated };
  return { layer: spec.layer, name: spec.name, status: "LOADED", items: capped.items, truncated: capped.truncated, reason };
}
