import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A minimal reader for the Genesis TSV registries.
 *
 * Genesis keeps its registries as tab-separated files under registry/ and
 * loads them in C++. This module reads the same files so the TypeScript
 * side of the programme can cross-check its own records against the
 * canonical ones rather than restating them.
 *
 * Rules:
 *  - READ-ONLY. Never writes.
 *  - Tolerant of a UTF-8 BOM, which is why the header is stripped
 *    explicitly rather than assumed.
 *  - A missing file is a finding for the caller, not an exception here.
 */

export interface TsvTable {
  /** The header row, with the BOM stripped. */
  header: string[];
  /** One object per data row, keyed by header name. */
  rows: Record<string, string>[];
}

export function parseTsv(text: string): TsvTable {
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = clean.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return { header: [], rows: [] };
  const header = lines[0]!.split("\t");
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = lines[i]!.split("\t");
    const row: Record<string, string> = {};
    for (let c = 0; c < header.length; c += 1) {
      row[header[c]!] = cells[c] ?? "";
    }
    rows.push(row);
  }
  return { header, rows };
}

/** Read and parse a TSV file. Returns null when the file is absent. */
export function readTsv(path: string): TsvTable | null {
  if (!existsSync(path)) return null;
  return parseTsv(readFileSync(path, "utf8"));
}

/** Split a TSV cell that holds a delimited list. "-" means empty. */
export function splitList(value: string | undefined, separator = ";"): string[] {
  if (!value || value === "-") return [];
  return value
    .split(separator)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export interface GenesisRequirement {
  id: string;
  name: string;
  status: string;
  score: number;
  implementationFiles: string[];
  tests: string[];
  dependencies: string[];
}

/**
 * The Genesis requirement registry, as a flat list. This is the canonical
 * set of requirement ids that anything else in the programme may cite.
 */
export function loadGenesisRequirements(genesisRoot: string): GenesisRequirement[] {
  const table = readTsv(join(genesisRoot, "registry", "requirements.tsv"));
  if (!table) return [];
  return table.rows.map((r) => ({
    id: r.id ?? "",
    name: r.name ?? "",
    status: r.status ?? "",
    score: Number(r.score_0_100 ?? 0),
    implementationFiles: splitList(r.implementation_files),
    tests: splitList(r.tests),
    dependencies: splitList(r.dependencies),
  }));
}

/** Every source and test path the requirement registry cites. */
export function genesisReferencedPaths(genesisRoot: string): {
  implementationPaths: string[];
  testPaths: string[];
} {
  const table = readTsv(join(genesisRoot, "registry", "requirements.tsv"));
  const implementationPaths = new Set<string>();
  const testPaths = new Set<string>();
  for (const r of table?.rows ?? []) {
    for (const p of splitList(r.implementation_files)) implementationPaths.add(p);
    for (const p of splitList(r.tests)) testPaths.add(p);
  }
  return {
    implementationPaths: [...implementationPaths].sort(),
    testPaths: [...testPaths].sort(),
  };
}

/** The distinct requirement statuses the registry uses, with counts. */
export function requirementStatusCounts(genesisRoot: string): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const r of loadGenesisRequirements(genesisRoot)) {
    counts[r.status] = (counts[r.status] ?? 0) + 1;
  }
  return counts;
}
