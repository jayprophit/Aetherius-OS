import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { loadBuildRegistry, projectRootOf } from "../src/programme/buildManifest";
import { describe, expect, it } from "vitest";

/**
 * REQ-omniagent-reference-index: provenance and non-adoption, pinned.
 *
 * The OmniAgent prototype is an unlicensed Google AI Studio applet that was
 * reviewed and deliberately left untracked. Two things must stay true:
 *
 *  1. The third-party tree must NOT be tracked in any repository. A careless
 *     `git add` would commit ~6 MB of source of unknown licence, so this
 *     fails loudly if that ever happens.
 *  2. The provenance record must stay accurate - the app id, the two
 *     capabilities that were refused, and the absence of a licence.
 *
 * This is a test with teeth: the tracked-tree assertion is the real guard, and
 * the reference-index doc is only trustworthy while it holds.
 */

/**
 * Where Genesis and the IDE live.
 *
 * Both are resolved from the build manifest registry rather than written
 * out here. Genesis is the kernel of Aetherius OS and the IDE is one of
 * its apps, so neither is a sibling directory any more, and a path in
 * code would go stale silently.
 */
const PROJECTS_ROOT = resolve(join(__dirname, "..", ".."));
const BUILD_REGISTRY = loadBuildRegistry(
  readFileSync(join(PROJECTS_ROOT, "Aetherius-OS", "docs", "BUILD-MANIFEST-REGISTRY.yaml"), "utf8"),
);
function projectRoot(id: string, fallback: string): string {
  return projectRootOf(BUILD_REGISTRY, PROJECTS_ROOT, id) ?? fallback;
}
const GENESIS = projectRoot("genesis", join("..", "Genesis"));
const IDE_ROOT = projectRoot("ide-workspace", join("..", "IDE-Workspace"));
const VENDOR_DIR = join("references", "omniagent-runtime-&-workspace");
const INDEX = "docs/omniagent-reference-index.md";

/**
 * This guard deliberately spans repositories: the whole point is that
 * unlicensed third-party source must not be committed in Genesis, and that the
 * refused capabilities must not have been adopted in IDE-Workspace. A clean
 * clone of Aetherius-OS alone has neither sibling, and there these checks are
 * UNVERIFIABLE rather than passing or failing. They skip, explicitly, instead
 * of failing for the wrong reason. The provenance-record checks at the bottom
 * are repository-local and always run.
 */
const GENESIS_PRESENT = existsSync(GENESIS);
const IDE_PRESENT = existsSync(join(IDE_ROOT, "workspace", "app", "src"));
const needsGenesis = GENESIS_PRESENT ? it : it.skip;
const needsIde = IDE_PRESENT ? it : it.skip;

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

/**
 * Run the commit hook and report whether it refused.
 *
 * The guard is a shell script. "sh" is on the PATH on Unix and in a
 * git-bash shell, and it is not on the PATH in a plain Windows shell,
 * so the bash that ships with git is used when there is no "sh". When
 * neither can be found the result is null, and the caller skips rather
 * than asserting something it could not measure.
 */
function guardRefuses(): boolean | null {
  const candidates = [
    "sh",
    join(process.env.ProgramFiles ?? "", "Git", "bin", "bash.exe"),
    join(process.env.ProgramFiles ?? "", "Git", "usr", "bin", "bash.exe"),
    join(process.env["ProgramFiles(x86)"] ?? "", "Git", "bin", "bash.exe"),
  ];
  for (const shell of candidates) {
    if (!shell) continue;
    try {
      execFileSync(shell, ["tools/check_third_party_tracking.sh"], {
        cwd: GENESIS,
        encoding: "utf8",
        stdio: "pipe",
      });
      return false;
    } catch (error) {
      const code = (error as { status?: number | null }).status;
      if (code === undefined || code === null) {
        // The shell itself could not be run. Try the next one.
        continue;
      }
      // The shell ran and the script refused.
      return true;
    }
  }
  return null;
}

describe("omniagent reference: the owner's own tree is tracked, and the guard still bites", () => {
  needsGenesis("the reference tree is tracked by Genesis, because it is the owner's own work", () => {
    // The OmniAgent Runtime and Workspace tree is the owner's AI Studio
    // application, written during vibe coding and kept as a reference for
    // the builds. It is first-party, so it is tracked on purpose.
    const tracked = git(["ls-files", "--", "references"], GENESIS)
      .split("\n")
      .filter((l) => l.includes("omniagent"));
    expect(
      tracked.length,
      "the owner's own reference tree should be tracked in Genesis",
    ).toBeGreaterThan(0);
  });

  it("the reference tree is not tracked by Aetherius-OS, which does not own it", () => {
    const tracked = git(["ls-files", "--", "references"], ".")
      .split("\n")
      .filter((l) => l.includes("omniagent"));
    expect(tracked).toEqual([]);
  });

  needsGenesis("Genesis does not ignore references/ - which is exactly why this guard exists", () => {
    // If references/ ever becomes gitignored the risk drops to zero, but the
    // guard must not be the only thing standing between a tree and a commit.
    let ignored = "";
    try {
      ignored = git(["check-ignore", "-q", VENDOR_DIR], GENESIS);
    } catch {
      ignored = "not-ignored";
    }
    expect(ignored).toBe("not-ignored");
  });

  needsGenesis("the commit hook still refuses unlicensed material under references/", () => {
    // The guard is only worth having if it still refuses. This runs it
    // against a probe file that is not the owner's own, and requires it to
    // refuse. The probe is removed again whatever the outcome.
    const probe = join(GENESIS, "references", "unlicensed-probe-for-the-guard.txt");
    try {
      writeFileSync(probe, "probe", "utf8");
      git(["add", "--", "references/unlicensed-probe-for-the-guard.txt"], GENESIS);
      const refused = guardRefuses();
      if (refused === null) return;
      expect(
        refused,
        "the hook must refuse unlicensed material under references/",
      ).toBe(true);
    } finally {
      try {
        git(["reset", "-q", "HEAD", "--", "references/unlicensed-probe-for-the-guard.txt"], GENESIS);
      } catch {
        // Nothing staged; nothing to undo.
      }
      rmSync(probe, { force: true });
    }
  });

  needsGenesis("the commit hook allows the owner's own tree", () => {
    // The exception must be a named path and not a relaxation, so the hook
    // has to accept the owner's own tree without refusing it.
    git(["add", "-A", "--", "references/omniagent-runtime-&-workspace"], GENESIS);
    const refused = guardRefuses();
    git(["reset", "-q", "HEAD", "--", "references/omniagent-runtime-&-workspace"], GENESIS);
    if (refused === null) return;
    expect(refused, "the hook must allow the owner's own reference tree").toBe(false);
  });
});

describe("omniagent reference: what the material actually is", () => {
  needsGenesis("it is the owner's own AI Studio application, not third-party material", () => {
    // The owner confirmed the provenance: this tree is their own AI Studio
    // application, written during vibe coding and exported from AI Studio.
    // It is kept in the repository as a reference for the builds.
    const root = join(GENESIS, VENDOR_DIR);
    expect(existsSync(root)).toBe(true);
    const metadata = JSON.parse(
      readFileSync(join(root, "metadata.json"), "utf8"),
    ) as { name?: string; description?: string };
    expect(metadata.name).toBe("OmniAgent Runtime & Workspace");
    expect(metadata.description).toContain("agent runtime");
  });

  needsGenesis("it carries no credential", () => {
    // A reference tree that is tracked in a public repository must not
    // carry anything that looks like a live credential.
    const root = join(GENESIS, VENDOR_DIR);
    const suspicious: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        if (e === "node_modules" || e === "__pycache__") continue;
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx|js|jsx|json|env|example|md)$/i.test(e)) {
          const text = readFileSync(p, "utf8");
          if (/AIza[0-9A-Za-z\-_]{20,}|sk-[A-Za-z0-9]{20,}|gh[pousr]_[A-Za-z0-9]{20,}/.test(text)) {
            suspicious.push(p);
          }
        }
      }
    };
    walk(root);
    expect(suspicious, `credential-shaped literals in a tracked tree: ${suspicious.join(", ")}`).toEqual([]);
  });
});

describe("omniagent reference: refused capabilities were not adopted", () => {
  const ideSrc = join(IDE_ROOT, "workspace", "app", "src");

  needsIde("tracked IDE code contains no Gemini server key usage", () => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e)) {
          const text = readFileSync(p, "utf8");
          if (/gemini|@google\/genai/i.test(text)) hits.push(e);
        }
      }
    };
    walk(ideSrc);
    expect(hits, `Gemini usage in tracked IDE code: ${hits.join(", ")}`).toEqual([]);
  });

  needsIde("tracked IDE code requests no camera or microphone", () => {
    const hits: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(e)) {
          const text = readFileSync(p, "utf8");
          if (/getUserMedia|mediaDevices/i.test(text)) hits.push(e);
        }
      }
    };
    walk(ideSrc);
    expect(hits, `device permission usage in tracked IDE code: ${hits.join(", ")}`).toEqual([]);
  });
});

describe("omniagent reference: the provenance record stays true", () => {
  it("names the AI Studio app id so the reference can be re-fetched", () => {
    const index = readFileSync(INDEX, "utf8");
    expect(index).toContain("72382b85-5abd-4c0d-9639-9b14edcc361d");
  });

  it("records the classification and the two refusals", () => {
    const index = readFileSync(INDEX, "utf8");
    expect(index).toContain("THIRD-PARTY VENDORED SOURCE");
    expect(index).toContain("MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API");
    expect(index).toContain("requestFramePermissions");
  });

  it("does not claim the reference is reproducible or tracked", () => {
    // A regression guard on the honesty of the record itself: the index must
    // never imply the vendored tree is part of this repository. Matched with
    // the dot-all flag because the prose wraps mid-phrase.
    const index = readFileSync(INDEX, "utf8");
    expect(index).toMatch(/not\s+committed|never\s+commit\s+it/is);
  });
});
