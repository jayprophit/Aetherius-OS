import {
  GAP_AXES,
  axisReadiness,
  openGaps,
  rollupByAxis,
  summariseGapStatuses,
  type GapRegistry,
  type GapStatus,
} from "./gapAnalysis";

/**
 * Deterministic Markdown rendering of the Genesis gap analysis.
 *
 * The YAML is the source of truth. This is derived output and a sync test
 * enforces byte-equality.
 *
 * The report is written for the person who has to decide what to build
 * next, so it leads with the open gaps in priority order and says plainly
 * what is missing and what would close it. A gap analysis that buries the
 * next action under a status table has failed at its job.
 */

function statusIcon(status: GapStatus): string {
  switch (status) {
    case "VERIFIED":
      return "🟢";
    case "IMPLEMENTED":
      return "🟡";
    case "PARTIAL":
      return "🟠";
    case "MISSING":
      return "🔴";
    case "RESEARCH":
      return "🔬";
    case "NOT_APPLICABLE":
      return "⚪";
    default:
      return "❓";
  }
}

function escape(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

export interface GapReportInput {
  registry: GapRegistry;
  /**
   * The platforms the comparison is against, with the count of gaps each
   * one already has. Used only for the comparison table.
   */
  platformNames?: readonly string[];
}

export function generateGapReport(input: GapReportInput): string {
  const { registry } = input;
  const summary = summariseGapStatuses(registry);
  const axis = rollupByAxis(registry);
  const open = openGaps(registry);
  const lines: string[] = [];

  lines.push("# Genesis Gap Analysis — agent platform capability");
  lines.push("");
  lines.push("> Generated from `docs/GAP-ANALYSIS-REGISTRY.yaml`. Do not hand-edit");
  lines.push("> this file; edit the YAML and regenerate.");
  lines.push("");
  lines.push(`- Source date: ${registry.source_date}`);
  lines.push(`- Capabilities assessed: **${summary.total}**`);
  lines.push(
    `- States: ${Object.entries(summary.byStatus)
      .filter(([, n]) => n > 0)
      .map(([k, n]) => `${k} ${n}`)
      .join(" · ")}`,
  );
  lines.push(
    `- Open (missing or partial): **${open.length}** (${summary.total === 0 ? 0 : Math.round((open.length / summary.total) * 100)}% of assessed capabilities)`,
  );
  lines.push("");

  lines.push("## Next to build");
  lines.push("");
  lines.push("Open capabilities in priority order. Priority 1 is the next real thing.");
  lines.push("");
  lines.push("| Pri | Id | Axis | Capability | What is missing |");
  lines.push("|---|---|---|---|---|");
  for (const g of open) {
    lines.push(
      `| ${g.priority} | ${g.id} | ${g.axis} | ${escape(g.name)} | ${escape(g.gap.slice(0, 150))} |`,
    );
  }
  lines.push("");

  lines.push("## Coverage by axis");
  lines.push("");
  lines.push("| Axis | Capabilities | Readiness | Verified | Implemented | Partial | Missing | Research | N/A |");
  lines.push("|---|---|---|---|---|---|---|---|---|");
  for (const a of axis) {
    if (a.total === 0) continue;
    lines.push(
      `| ${a.axis} | ${a.total} | ${axisReadiness(a)}% | ${a.byStatus.VERIFIED} | ${a.byStatus.IMPLEMENTED} | ${a.byStatus.PARTIAL} | ${a.byStatus.MISSING} | ${a.byStatus.RESEARCH} | ${a.byStatus.NOT_APPLICABLE} |`,
    );
  }
  lines.push("");
  lines.push("Readiness is the share of an axis's capabilities that are VERIFIED or");
  lines.push("IMPLEMENTED. It is a coverage measure, not a quality judgement.");
  lines.push("");

  lines.push("## Full detail");
  lines.push("");
  for (const a of axis) {
    const gaps = registry.gaps
      .filter((g) => g.axis === a.axis)
      .sort((x, y) => x.priority - y.priority || x.id.localeCompare(y.id));
    if (gaps.length === 0) continue;
    lines.push(`### ${a.axis}`);
    lines.push("");
    for (const g of gaps) {
      lines.push(`#### ${statusIcon(g.status)} ${g.id} — ${escape(g.name)}`);
      lines.push("");
      lines.push(`- **Status:** ${g.status} (priority ${g.priority})`);
      if (g.spec_area) lines.push(`- **Genesis spec area:** ${g.spec_area}`);
      lines.push(`- **Present:** ${g.present}`);
      lines.push(`- **Missing:** ${g.gap}`);
      if (g.decision) {
        lines.push(`- **Owner decision:** ${g.decision}`);
      }
      const refs: string[] = [];
      if (g.requirement_refs?.length) refs.push(`requirements: ${g.requirement_refs.join(", ")}`);
      if (g.acceptance_refs?.length) refs.push(`acceptance: ${g.acceptance_refs.join(", ")}`);
      if (g.gap_register_refs?.length) refs.push(`gap register: ${g.gap_register_refs.join(", ")}`);
      if (g.platform_refs?.length) refs.push(`platforms: ${g.platform_refs.join(", ")}`);
      if (g.implementation_refs?.length) refs.push(`implementation: ${g.implementation_refs.join(", ")}`);
      if (g.test_refs?.length) refs.push(`tests: ${g.test_refs.join(", ")}`);
      if (refs.length > 0) {
        lines.push(`- **Cross-references:** ${refs.join(" · ")}`);
      }
      lines.push(`- **Provenance:** ${g.provenance}`);
      if (g.evidence) {
        lines.push("");
        lines.push("```");
        lines.push(g.evidence.trim());
        lines.push("```");
      }
      lines.push("");
    }
  }

  lines.push("## Platforms compared");
  lines.push("");
  if (input.platformNames?.length) {
    lines.push(
      `The comparison is against: ${input.platformNames.map((p) => `\`${p}\``).join(", ")}.`,
    );
    lines.push("");
    lines.push("Platform names are reference ids only. A gap that names a platform");
    lines.push("means the owner has evidence that platform provides the capability.");
  } else {
    lines.push("No platform inventory was supplied for this report.");
  }
  lines.push("");

  lines.push("## Axes with no assessed capability");
  lines.push("");
  const empty = GAP_AXES.filter((a) => !registry.gaps.some((g) => g.axis === a));
  if (empty.length === 0) {
    lines.push("None. Every axis has at least one assessed capability.");
  } else {
    for (const a of empty) {
      lines.push(`- ${a}`);
    }
    lines.push("");
    lines.push("An empty axis is a finding, not a pass: it means the axis was never");
    lines.push("assessed.");
  }
  lines.push("");

  return lines.join("\n");
}
