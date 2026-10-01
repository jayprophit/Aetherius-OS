import {
  blockedNodes,
  byStatus,
  changedSince,
  childrenOf,
  noEvidence,
  progressOf,
  searchRegistry,
  unverifiedImplementations,
  type CapabilityNode,
  type Registry,
} from "./capabilityRegistry";

/** Alias/name collisions listed for human review — candidates, never verdicts. */
function duplicateCandidates(reg: Registry): Array<{ label: string; ids: string[] }> {
  const index = new Map<string, string[]>();
  const add = (label: string, id: string) => {
    const key = label.trim().toLowerCase();
    if (!key) return;
    const list = index.get(key) ?? [];
    list.push(id);
    index.set(key, list);
  };
  for (const n of reg.nodes) {
    add(n.name, n.id);
    for (const a of n.aliases ?? []) add(a, n.id);
  }
  const out: Array<{ label: string; ids: string[] }> = [];
  for (const [label, ids] of index) {
    const uniq = [...new Set(ids)];
    if (uniq.length > 1) out.push({ label, ids: uniq.sort() });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

/**
 * Deterministic Markdown report generation for the System Capability
 * Registry. The .md file is derived output: it is regenerated from the YAML
 * source plus the live requirements registry, and a sync test fails if the
 * committed report differs from what the generator produces. Never hand-edit
 * the report to change what it says; change the source.
 */

function bar(percent: number): string {
  const filled = Math.round(percent / 5);
  return "█".repeat(filled) + "░".repeat(20 - filled);
}

function statusIcon(status: string): string {
  switch (status) {
    case "NOT_STARTED":
      return "❌";
    case "RESEARCH":
      return "🔬";
    case "DESIGNED":
      return "🟡";
    case "PARTIAL":
      return "⚠️";
    case "IMPLEMENTED":
      return "✅";
    case "VERIFIED":
      return "🟢";
    case "LIVE":
      return "🔵";
    case "BLOCKED":
      return "⛔";
    case "DEPRECATED":
      return "🟠";
    case "OBSOLETE":
      return "~~OBSOLETE~~";
    case "REMOVED":
      return "🗑️";
    default:
      return "❓";
  }
}

function treeLines(
  reg: Registry,
  id: string,
  depth: number,
  requiredOnly: boolean,
): string[] {
  const node = reg.byId.get(id);
  if (!node) return [];
  const p = progressOf(reg, id, requiredOnly);
  const pad = "  ".repeat(depth);
  const line = `${pad}${statusIcon(node.status)} ${node.name} — ${p.percent}% (${p.method}) \`${node.id}\``;
  const out = [line];
  for (const kid of childrenOf(reg, id)) {
    out.push(...treeLines(reg, kid.id, depth + 1, requiredOnly));
  }
  return out;
}

function rootsOf(reg: Registry): CapabilityNode[] {
  return reg.nodes.filter((n) => !n.primary_parent);
}

export interface ReportOptions {
  generatedAt?: string;
  requirementCount?: number;
  /** When set, the report covers only this subtree (per-project views). */
  scopeRootId?: string;
  scopeTitle?: string;
}

/** A Registry view restricted to one subtree, for per-project reports. */
export function scopeRegistry(reg: Registry, rootId: string): Registry {
  const ids = new Set<string>();
  const walk = (nodeId: string) => {
    if (ids.has(nodeId) || !reg.byId.has(nodeId)) return;
    ids.add(nodeId);
    for (const k of reg.childrenOf.get(nodeId) ?? []) walk(k);
  };
  walk(rootId);
  const nodes = reg.nodes.filter((n) => ids.has(n.id));
  const byId = new Map<string, (typeof nodes)[number]>();
  const childrenOf = new Map<string, string[]>();
  for (const n of nodes) {
    byId.set(n.id, n);
    if (n.primary_parent && ids.has(n.primary_parent)) {
      const list = childrenOf.get(n.primary_parent) ?? [];
      list.push(n.id);
      childrenOf.set(n.primary_parent, list);
    }
  }
  return { nodes, byId, childrenOf };
}

export function generateReport(
  reg: Registry,
  options: ReportOptions = {},
): string {
  if (options.scopeRootId) {
    // Per-project views share the generator; the footer count then describes
    // the scope, which is the honest denominator for that view.
    reg = scopeRegistry(reg, options.scopeRootId);
  }
  const title = options.scopeTitle ?? "System Capability Registry";
  const at = options.generatedAt ?? new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# ${title} — generated report`);
  lines.push("");
  lines.push(
    `Generated ${at} from docs/SYSTEM-CAPABILITY-REGISTRY.yaml plus the live requirements registry. Do not hand-edit: change the source and regenerate.`,
  );
  lines.push("");

  // -- programme summary -------------------------------------------------
  lines.push("## Programme summary (all children)");
  for (const root of rootsOf(reg)) {
    const p = progressOf(reg, root.id, false);
    lines.push(
      `- ${root.name} ${bar(p.percent)} ${p.percent}% (${p.counted} counted, ${p.excluded} excluded)`,
    );
  }
  lines.push("");
  lines.push("## Programme summary (required only)");
  for (const root of rootsOf(reg)) {
    const p = progressOf(reg, root.id, true);
    lines.push(
      `- ${root.name} ${bar(p.percent)} ${p.percent}% (${p.counted} counted, ${p.excluded} excluded)`,
    );
  }
  lines.push("");

  // -- hierarchy ----------------------------------------------------------
  lines.push("## Capability hierarchy (required-only rollup)");
  for (const root of rootsOf(reg)) {
    lines.push(...treeLines(reg, root.id, 0, true));
  }
  lines.push("");

  // -- missing ------------------------------------------------------------
  const missing = reg.nodes
    .filter((n) => n.required !== false && n.status === "NOT_STARTED")
    .sort((a, b) => a.id.localeCompare(b.id));
  lines.push("## Missing requirements (required, NOT_STARTED)");
  if (missing.length === 0) lines.push("- none");
  for (const n of missing.slice(0, 80)) {
    lines.push(`- ❌ ${n.name} \`${n.id}\``);
  }
  if (missing.length > 80) lines.push(`- … ${missing.length - 80} more`);
  lines.push("");

  // -- blocked --------------------------------------------------------------
  lines.push("## Blocked");
  const blocked = blockedNodes(reg).sort((a, b) => a.id.localeCompare(b.id));
  if (blocked.length === 0) lines.push("- none");
  for (const n of blocked) {
    lines.push(`- ⛔ ${n.name} \`${n.id}\` — ${n.status_reason ?? "no reason recorded"}`);
  }
  lines.push("");

  // -- deprecated / obsolete / removed ---------------------------------------
  lines.push("## Deprecated / obsolete / removed");
  const retired = reg.nodes.filter((n) =>
    ["DEPRECATED", "OBSOLETE", "REMOVED"].includes(n.status),
  );
  if (retired.length === 0) lines.push("- none");
  for (const n of retired.sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`- ${statusIcon(n.status)} ${n.name} \`${n.id}\``);
  }
  lines.push("");

  // -- unverified --------------------------------------------------------------
  lines.push("## Implemented but unverified");
  const unverified = unverifiedImplementations(reg).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  if (unverified.length === 0) lines.push("- none");
  for (const n of unverified.slice(0, 80)) {
    lines.push(`- ✅ ${n.name} \`${n.id}\``);
  }
  if (unverified.length > 80) lines.push(`- … ${unverified.length - 80} more`);
  lines.push("");

  // -- no evidence ---------------------------------------------------------------
  lines.push("## Requirements with no evidence");
  const bare = noEvidence(reg)
    .filter((n) => n.required !== false && !["REMOVED", "OBSOLETE", "DEPRECATED"].includes(n.status))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (bare.length === 0) lines.push("- none");
  for (const n of bare.slice(0, 80)) {
    lines.push(`- ${statusIcon(n.status)} ${n.name} \`${n.id}\``);
  }
  if (bare.length > 80) lines.push(`- … ${bare.length - 80} more`);
  lines.push("");

  // -- recent changes ----------------------------------------------------------------
  const cutoff = new Date(at);
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = changedSince(reg, cutoff.toISOString().slice(0, 10)).sort(
    (a, b) => a.id.localeCompare(b.id),
  );
  lines.push("## Recently added / moved (30 days)");
  if (recent.length === 0) lines.push("- none");
  for (const n of recent.slice(0, 60)) {
    const last = (n.history ?? [])[(n.history ?? []).length - 1];
    lines.push(
      `- ${n.name} \`${n.id}\` — ${last?.action ?? "?"} ${last?.date ?? ""}`,
    );
  }
  if (recent.length > 60) lines.push(`- … ${recent.length - 60} more`);
  lines.push("");

  // -- duplicate candidates ------------------------------------------------------------
  lines.push("## Duplicate candidates (review, do not auto-merge)");
  const dupes = duplicateCandidates(reg);
  if (dupes.length === 0) lines.push("- none");
  for (const d of dupes.slice(0, 40)) {
    lines.push(`- "${d.label}" also names ${d.ids.join(", ")}`);
  }
  if (dupes.length > 40) lines.push(`- … ${dupes.length - 40} more`);
  lines.push("");

  // -- research catalogue -----------------------------------------------------------------
  lines.push("## Research catalogue (status RESEARCH, required)");
  const research = byStatus(reg, "RESEARCH")
    .filter((n) => n.required !== false)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (research.length === 0) lines.push("- none");
  for (const n of research.slice(0, 80)) {
    lines.push(`- 🔬 ${n.name} \`${n.id}\``);
  }
  if (research.length > 80) lines.push(`- … ${research.length - 80} more`);
  lines.push("");

  // -- search footer ------------------------------------------------------------------------
  void searchRegistry;
  lines.push(
    `_Query the registry programmatically via src/programme/capabilityRegistry.ts (search, dependents, dependencies, blockers, subtree). Node count: ${reg.nodes.length}._`,
  );
  lines.push("");
  return lines.join("\n");
}
