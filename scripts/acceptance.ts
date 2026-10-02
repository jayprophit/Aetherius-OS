/**
 * BUILD70 acceptance collector.
 *
 * Computes the evidence fingerprint for each acceptance gate from the actual
 * repositories, applies the gate evidence records that reference real
 * artifacts, and prints the derived programme acceptance report.
 *
 * What it deliberately does not do:
 * - It never invents evidence. A gate whose evidence file is absent, or whose
 *   referenced artifact does not exist on disk, stays unevaluated.
 * - It never marks a gate PASS because a test count looked good. Dispositions
 *   come from the acceptance-gate contract, fed only by evidence files whose
 *   artifacts have been verified to exist.
 * - It never authorizes publication. That requires an owner approval reference
 *   supplied by the owner, and this script does not have one.
 *
 * Usage:
 *   npx tsx scripts/acceptance.ts [--json] [--state <dir>]
 *   npx tsx scripts/acceptance.ts --apply   (write gate state to the store)
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  ACCEPTANCE_GATE_DEFINITIONS,
  emptyFingerprint,
  gateDependencyIndex,
} from "../src/programme/acceptanceGate";
import type {
  AcceptanceGateId,
  CriterionOutcome,
  EvidenceFingerprint,
  GateState,
} from "../src/programme/acceptanceGate";
import type { Requirement } from "../src/programme/types";
import requirementsJson from "../src/programme/requirements.json";
import {
  ACCEPTANCE_SCHEMA_VERSION,
  applyTransitionAndSave,
  deriveProgrammeReport,
  formatProgrammeReport,
  loadAcceptanceState,
  publishAndSave,
} from "../src/state/acceptanceState";
import { FileStateStore } from "../src/state/store";
import type { OwnedStore } from "../src/state/store";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, "..");
const WORKSPACE = resolve(REPO, "..");

/** The four core repositories the programme spans. */
const REPOSITORIES = ["Aetherius-OS", "Agent-Bridge", "Genesis", "IDE-Workspace"] as const;

interface ArtifactRef {
  /** Path relative to the repository root. */
  path: string;
  repository: string;
  /**
   * Which of the gate's declared evidence requirements this artifact
   * satisfies. Required in effect: an artifact that satisfies no requirement
   * is not evidence for any, and the existing evidence gate will correctly
   * report the requirement as unproven.
   */
  evidenceKey?: string;
}

interface GateEvidenceFile {
  gateId: AcceptanceGateId;
  /** Repository commit the evidence was taken against. */
  commit: string;
  /** Files whose presence verifies this gate's evidence. */
  artifacts: ArtifactRef[];
  /** Per-criterion results actually observed. */
  criteria: CriterionOutcome[];
  /** Blocking dependencies actually established. */
  blockers?: Array<{ kind: "OWNER" | "EXTERNAL"; ref: string; requirementIds: string[] }>;
  /** Owner approval reference, when the owner actually supplied one. */
  ownerApprovalRef?: string | null;
  evaluatedAt: string;
  note?: string;
}

function git(root: string, args: string[]): string {
  try {
    return execFileSync("git", ["-C", root, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function sha256File(path: string): string | null {
  try {
    return createHash("sha256").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

function hashTree(root: string, subdir: string, skip: RegExp): string {
  const base = join(root, subdir);
  if (!existsSync(base)) return "";
  const acc = createHash("sha256");
  const walk = (dir: string): void => {
    let entries: string[];
    try {
      entries = readdirSync(dir).sort();
    } catch {
      return;
    }
    for (const name of entries) {
      if (skip.test(name)) continue;
      const full = join(dir, name);
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full);
      else if (/\.(ts|tsx|js|jsx|json|py|cpp|hpp|cmake|toml)$/.test(name)) {
        const h = sha256File(full);
        if (h) acc.update(`${full.slice(root.length)}:${h}\n`);
      }
    }
  };
  walk(base);
  return acc.digest("hex");
}

const SKIP = /^(node_modules|\.git|dist|build|__pycache__|\.pytest_cache|coverage|local|reports)$/;

/** The fingerprint the current world actually presents, per gate. */
export function currentFingerprint(gateId: AcceptanceGateId): EvidenceFingerprint {
  const def = ACCEPTANCE_GATE_DEFINITIONS.find((d) => d.id === gateId);
  const fp = emptyFingerprint();
  for (const repo of REPOSITORIES) {
    const root = join(WORKSPACE, repo);
    if (!existsSync(root)) continue;
    const head = git(root, ["rev-parse", "--short", "HEAD"]);
    const dirty = git(root, ["status", "--porcelain"]);
    if (head) fp.sourceCommits[repo] = dirty ? `${head}+dirty` : head;
    const tree = hashTree(root, "", SKIP);
    if (tree) fp.relevantSourceHashes[repo] = tree.slice(0, 16);
  }
  // Requirements are the criteria source; a change to them changes every gate.
  fp.requirementRevision = createHash("sha256")
    .update(readFileSync(join(REPO, "src/programme/requirements.json")))
    .digest("hex")
    .slice(0, 16);
  fp.acceptanceCriteriaRevision = createHash("sha256")
    .update(
      ACCEPTANCE_GATE_DEFINITIONS.map((d) => `${d.id}:${d.requirements.join(",")}`).join("|"),
    )
    .digest("hex")
    .slice(0, 16);
  fp.testEnvironmentRef = `${process.platform}-${process.arch}-node-${process.version}`;
  for (const d of def?.requirements ?? []) {
    const dep = REPOSITORIES.find((r) =>
      (REQUIREMENT_OWNERSHIP[d] ?? []).includes(r),
    );
    if (dep) fp.upstreamGateRevisions[dep] = 0;
  }
  return fp;
}

/**
 * Which repository owns each requirement, derived from the registry's own
 * `owner` field rather than a hand-kept list.
 */
const REQUIREMENT_OWNERSHIP: Record<string, string[]> = Object.fromEntries(
  (requirementsJson.requirements as Requirement[]).map((r) => [r.id, [r.owner]]),
);

function evidenceDir(): string {
  return join(REPO, "acceptance");
}

function loadEvidenceFiles(): Map<AcceptanceGateId, GateEvidenceFile> {
  const out = new Map<AcceptanceGateId, GateEvidenceFile>();
  const dir = evidenceDir();
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".json")) continue;
    let parsed: GateEvidenceFile;
    try {
      parsed = JSON.parse(readFileSync(join(dir, name), "utf8")) as GateEvidenceFile;
    } catch {
      continue;
    }
    if (!parsed?.gateId) continue;
    out.set(parsed.gateId, parsed);
  }
  return out;
}

/** Evidence is only usable when every artifact it names actually exists. */
function missingArtifacts(file: GateEvidenceFile): string[] {
  const missing: string[] = [];
  for (const a of file.artifacts ?? []) {
    const root = a.repository === "Aetherius-OS"
      ? REPO
      : join(WORKSPACE, a.repository);
    if (!existsSync(join(root, a.path))) missing.push(`${a.repository}/${a.path}`);
  }
  return missing;
}

export interface CollectionReport {
  gates: Array<{
    gateId: AcceptanceGateId;
    evidenceFilePresent: boolean;
    missingArtifacts: string[];
    fingerprint: EvidenceFingerprint;
  }>;
  programme: ReturnType<typeof deriveProgrammeReport>;
}

export function collect(store: OwnedStore): CollectionReport {
  const requirements = requirementsJson.requirements as Requirement[];
  const files = loadEvidenceFiles();
  const fingerprints = new Map<AcceptanceGateId, EvidenceFingerprint>();

  for (const def of ACCEPTANCE_GATE_DEFINITIONS) {
    const fp = currentFingerprint(def.id);
    fingerprints.set(def.id, fp);
    const file = files.get(def.id);
    if (!file) continue;
    const missing = missingArtifacts(file);
    if (missing.length > 0) continue;

    const state = loadAcceptanceState(store).gates.find((g) => g.gateId === def.id);
    if (!state || state.lifecycle === "NOT_EVALUATED") {
      applyTransitionAndSave(store, {
        gateId: def.id, to: "IN_PROGRESS", trigger: "EVALUATION_STARTED",
        reason: `collecting evidence recorded at ${file.evaluatedAt}`,
        initiatedBy: "acceptance-collector", timestamp: file.evaluatedAt,
      }, { actor: "acceptance-collector", source: `acceptance/${def.id}.json` });
    }
    const before = loadAcceptanceState(store);
    publishAndSave(
      store,
      {
        gateId: def.id,
        criteria: file.criteria,
        provided: (file.artifacts ?? []).map((a) => ({
          // Each artifact must say which declared requirement it satisfies.
          // Defaulting them all onto the first key would let three files
          // masquerade as three requirements.
          key: a.evidenceKey ?? "",
          kind: "artifact" as const,
          passed: true,
          ref: `${a.repository}/${a.path}`,
        })),
        blockers: file.blockers ?? [],
        fingerprint: fp,
      },
      {
        actor: "acceptance-collector",
        source: `acceptance/${def.id}.json`,
        timestamp: file.evaluatedAt,
        fingerprintAtStart: fp,
        currentFingerprint: fp,
        startedAtRevision: before.gates.find((g) => g.gateId === def.id)!.revision,
      },
    );
  }

  return {
    gates: ACCEPTANCE_GATE_DEFINITIONS.map((def) => {
      const file = files.get(def.id);
      return {
        gateId: def.id,
        evidenceFilePresent: Boolean(file),
        missingArtifacts: file ? missingArtifacts(file) : [],
        fingerprint: fingerprints.get(def.id)!,
      };
    }),
    programme: deriveProgrammeReport({
      store,
      requirements,
      mandatoryGates: ACCEPTANCE_GATE_DEFINITIONS.map((d) => d.id),
      currentFingerprints: fingerprints,
    }),
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const asJson = args.includes("--json");
  const stateDir = join(REPO, ".acceptance-state");
  mkdirSync(stateDir, { recursive: true });
  const store = new FileStateStore(stateDir, ACCEPTANCE_SCHEMA_VERSION);
  const report = collect(store);

  if (asJson) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    return;
  }
  process.stdout.write(`${formatProgrammeReport(report.programme)}\n\n`);
  process.stdout.write("EVIDENCE COLLECTION:\n");
  for (const g of report.gates) {
    const state = "recorded";
    const note = g.evidenceFilePresent
      ? (g.missingArtifacts.length > 0
        ? `present but ${g.missingArtifacts.length} artifact(s) missing: ${g.missingArtifacts.join(", ")}`
        : state)
      : "no evidence file: gate remains unevaluated";
    process.stdout.write(`  ${g.gateId}: ${note}\n`);
  }
  process.stdout.write(`\nDEPENDENCY EDGES (derived): `);
  const index = gateDependencyIndex(requirementsJson.requirements as Requirement[]);
  const edges: string[] = [];
  for (const [gate, deps] of index) {
    for (const d of deps) edges.push(`${d}->${gate}`);
  }
  process.stdout.write(`${edges.length} derived from the requirement graph\n`);
  process.stdout.write(`evidence files: ${join(evidenceDir())}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}

export type { GateState };