import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
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

const GENESIS = join("..", "Genesis");
const VENDOR_DIR = join("references", "omniagent-runtime-&-workspace");
const INDEX = "docs/omniagent-reference-index.md";

function git(args: string[], cwd: string): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" });
}

describe("omniagent reference: third-party tree stays untracked", () => {
  it("the vendored directory is not tracked by Genesis", () => {
    const tracked = git(["ls-files", "--", "references"], GENESIS)
      .split("\n")
      .filter((l) => l.includes("omniagent"));
    expect(tracked, `unlicensed third-party source is tracked: ${tracked.join(", ")}`).toEqual([]);
  });

  it("the vendored directory is not tracked by Aetherius-OS either", () => {
    const tracked = git(["ls-files", "--", "references"], ".")
      .split("\n")
      .filter((l) => l.includes("omniagent"));
    expect(tracked).toEqual([]);
  });

  it("Genesis does not ignore references/ - which is exactly why this guard exists", () => {
    // If references/ ever becomes gitignored the risk drops to zero, but the
    // guard must not be the only thing standing between the tree and a commit.
    let ignored = "";
    try {
      ignored = git(["check-ignore", "-q", VENDOR_DIR], GENESIS);
    } catch {
      ignored = "not-ignored";
    }
    expect(ignored).toBe("not-ignored");
  });
});

describe("omniagent reference: the material really is unlicensed and third-party", () => {
  it("carries no LICENSE file", () => {
    const root = join(GENESIS, VENDOR_DIR);
    expect(existsSync(root)).toBe(true);
    const found: string[] = [];
    const walk = (dir: string): void => {
      for (const e of readdirSync(dir)) {
        if (e === "node_modules" || e === "__pycache__") continue;
        const p = join(dir, e);
        if (statSync(p).isDirectory()) walk(p);
        else if (/^(LICENSE|LICENCE|NOTICE|COPYING)/i.test(e)) found.push(e);
      }
    };
    walk(root);
    // If a licence ever appears, the provenance record must be revisited -
    // that is a real change in the analysis, not a test to quietly relax.
    expect(found, `licence files present: ${found.join(", ")}`).toEqual([]);
  });

  it("is still the unmodified vendor scaffold, not first-party code", () => {
    const pkg = JSON.parse(readFileSync(join(GENESIS, VENDOR_DIR, "package.json"), "utf8"));
    expect(pkg.name).toBe("react-example");
    expect(pkg.private).toBe(true);
    expect(pkg.dependencies["@google/genai"]).toBeTruthy();
  });

  it("declares the two capabilities this programme refuses", () => {
    const meta = JSON.parse(readFileSync(join(GENESIS, VENDOR_DIR, "metadata.json"), "utf8"));
    expect(meta.majorCapabilities).toContain("MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API");
    expect(meta.requestFramePermissions).toEqual(expect.arrayContaining(["camera", "microphone"]));
  });
});

describe("omniagent reference: refused capabilities were not adopted", () => {
  const ideSrc = join("..", "IDE-Workspace", "workspace", "app", "src");

  it("tracked IDE code contains no Gemini server key usage", () => {
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

  it("tracked IDE code requests no camera or microphone", () => {
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
