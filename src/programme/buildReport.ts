import {
  buildOrder,
  dependenciesOf,
  dependentsOf,
  entryFor,
  summariseBuildStates,
  type BuildManifest,
  type BuildRegistry,
} from "./buildManifest";

/**
 * Deterministic Markdown report generation for the Build Manifest Registry.
 *
 * The .md file is derived output. It is regenerated from the registry YAML
 * plus the per-project build.yaml files, and a sync test fails if the
 * committed report differs from what the generator produces. Never
 * hand-edit the report to change what it says; change the source.
 *
 * The report is written to be read by a person deciding what to work on
 * next, so it leads with what is broken and what is blocked, not with the
 * shape of the registry.
 */

export interface ReportInput {
  registry: BuildRegistry;
  /** Manifest text by project id. Missing manifests are reported, not hidden. */
  manifests: Record<string, BuildManifest | null>;
}

function stateIcon(state: string): string {
  switch (state) {
    case "VERIFIED":
      return "🟢";
    case "PARTIAL":
      return "⚠️";
    case "BROKEN":
      return "⛔";
    case "NOT_STARTED":
      return "❌";
    case "RESEARCH":
      return "🔬";
    default:
      return "❓";
  }
}

function severityIcon(severity: string): string {
  switch (severity) {
    case "critical":
      return "🔴";
    case "high":
      return "🟠";
    case "medium":
      return "🟡";
    case "low":
      return "⚪";
    default:
      return "❓";
  }
}

function escape(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function truncate(text: string, max: number): string {
  const flat = text.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

/**
 * Render the report. Deterministic: the same inputs always produce
 * byte-identical output.
 */
export function generateBuildReport(input: ReportInput): string {
  const { registry, manifests } = input;
  const summary = summariseBuildStates(registry);
  const order = buildOrder(registry);
  const lines: string[] = [];

  lines.push("# Build Manifest Registry — Workspace Build Report");
  lines.push("");
  lines.push("> Generated from `docs/BUILD-MANIFEST-REGISTRY.yaml` and each");
  lines.push("> project's own `build.yaml`. Do not hand-edit this file.");
  lines.push("");
  lines.push(`- Projects: **${summary.total}**`);
  lines.push(
    `- States: ${Object.entries(summary.byState)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ")}`,
  );
  lines.push(`- Source date: ${registry.source_date}`);
  /* The summary covers every project the registry knows about, because
   * the registry is committed here. The per-project detail below only
   * covers the projects whose manifests this repository tracks: the rest
   * live in their own repositories and are reported there. Saying which
   * is which is what stops a reader assuming the detail is complete. */
  const detailed = Object.values(manifests).filter((m) => m !== null).length;
  lines.push(
    `- Project detail below: **${detailed} of ${summary.total}** — the projects whose`,
  );
  lines.push(
    "  manifests this repository tracks. The rest live in their own",
  );
  lines.push("  repositories and are reported there.");
  lines.push("");

  lines.push("## Build order");
  lines.push("");
  lines.push("Dependencies first. A project that depends on another cannot be");
  lines.push("finished before it.");
  lines.push("");
  lines.push("```");
  for (const [i, id] of order.entries()) {
    const deps = dependenciesOf(registry, id);
    const entry = entryFor(registry, id);
    lines.push(
      `${String(i + 1).padStart(2, " ")}. ${id.padEnd(28)} ${stateIcon(entry?.status ?? "")} ${entry?.status ?? "?"}${
        deps.length ? `  (needs: ${deps.join(", ")})` : ""
      }`,
    );
  }
  lines.push("```");
  lines.push("");

  lines.push("## Projects");
  lines.push("");
  lines.push("| Project | State | Type | Branch | Build system | Depends on |");
  lines.push("|---|---|---|---|---|---|");
  for (const id of order) {
    const entry = entryFor(registry, id);
    if (!entry) continue;
    const manifest = manifests[id] ?? null;
    lines.push(
      `| ${escape(entry.name)} | ${stateIcon(entry.status)} ${entry.status} | ${manifest?.project.kind ?? "-"} | ${
        manifest?.project.branch ?? "-"
      } | ${manifest?.toolchain.build_system ?? "-"} | ${(entry.depends_on ?? []).join(", ") || "-"} |`,
    );
  }
  lines.push("");

  lines.push("## Known issues");
  lines.push("");
  let issueCount = 0;
  for (const id of order) {
    const manifest = manifests[id] ?? null;
    if (!manifest) continue;
    const open = (manifest.known_issues ?? []).filter((i) => i.status !== "FIXED");
    if (open.length === 0) continue;
    lines.push(`### ${manifest.project.name}`);
    lines.push("");
    lines.push("| Sev | Issue | Status | Todo |");
    lines.push("|---|---|---|---|");
    for (const issue of open) {
      issueCount += 1;
      lines.push(
        `| ${severityIcon(issue.severity)} ${issue.severity} | ${escape(truncate(issue.summary, 110))} | ${
          issue.status
        } | ${issue.todo_ref ?? "-"} |`,
      );
    }
    lines.push("");
  }
  if (issueCount === 0) {
    lines.push("No open known issues.");
    lines.push("");
  }

  lines.push("## Verified state per project");
  lines.push("");
  for (const id of order) {
    const entry = entryFor(registry, id);
    const manifest = manifests[id] ?? null;
    if (!entry || !manifest) continue;
    lines.push(`### ${manifest.project.name}`);
    lines.push("");
    lines.push(manifest.status.summary.trim());
    lines.push("");
    lines.push("Evidence:");
    lines.push("");
    for (const e of manifest.status.evidence) {
      lines.push(`- ${e.trim()}`);
    }
    lines.push("");
    const commands = (manifest.commands ?? []).map((c) => c.name);
    if (commands.length > 0) {
      lines.push(`Commands: ${commands.map((c) => `\`${c}\``).join(" · ")}`);
      lines.push("");
    }
  }

  lines.push("## Dependents");
  lines.push("");
  lines.push("| Project | Required by |");
  lines.push("|---|---|");
  for (const id of order) {
    const entry = entryFor(registry, id);
    if (!entry) continue;
    const dependents = dependentsOf(registry, id);
    if (dependents.length === 0) continue;
    lines.push(`| ${escape(entry.name)} | ${dependents.join(", ")} |`);
  }
  lines.push("");

  return lines.join("\n");
}
