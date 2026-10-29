import { EventLedger, nowIso } from "../../app-kit/src/index.ts";
import { VirtualFiles, normalisePath } from "./files.ts";

/**
 * Terminal core.
 *
 * A small, allowlisted command interpreter over the virtual filesystem. It is
 * not a host shell: it cannot spawn processes, expand variables, redirect
 * output or run pipes. A host that wants a real shell must provide a separate,
 * explicitly privileged adapter.
 */

export interface TerminalResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface TerminalOptions {
  files: VirtualFiles;
  cwd?: string;
  ledger?: EventLedger;
  clock?: () => Date;
  user?: string;
}

const COMMANDS = new Set([
  "pwd",
  "ls",
  "cd",
  "cat",
  "echo",
  "mkdir",
  "touch",
  "rm",
  "cp",
  "mv",
  "grep",
  "wc",
  "help",
  "history",
  "clear",
  "whoami",
  "date",
]);

const FORBIDDEN = /[;&|<>`$(){}[\]\\]/;

function tokenise(line: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  for (const character of line) {
    if (quote) {
      if (character === quote) quote = null;
      else current += character;
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      continue;
    }
    if (/\s/.test(character)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }
    current += character;
  }
  if (quote) throw new Error("unterminated quote");
  if (current) tokens.push(current);
  return tokens;
}

function resolve(cwd: string, path: string): string {
  if (path.startsWith("/")) return normalisePath(path);
  const parts = [...cwd.split("/").filter(Boolean), ...path.split("/").filter(Boolean)];
  const stack: string[] = [];
  for (const part of parts) {
    if (part === ".") continue;
    if (part === "..") stack.pop();
    else stack.push(part);
  }
  return normalisePath(`/${stack.join("/")}`);
}

function parent(path: string): string {
  const parts = path.split("/").filter(Boolean);
  parts.pop();
  return `/${parts.join("/")}`;
}

export class TerminalSession {
  private readonly files: VirtualFiles;
  private readonly ledger: EventLedger;
  private readonly clock: () => Date;
  private readonly user: string;
  private readonly history: string[] = [];
  private cwd: string;

  constructor(options: TerminalOptions) {
    this.files = options.files;
    this.cwd = normalisePath(options.cwd ?? "/");
    this.ledger = options.ledger ?? new EventLedger();
    this.clock = options.clock ?? (() => new Date());
    this.user = options.user?.trim() || "aetherius";
    if (!this.files.stat(this.cwd) || this.files.stat(this.cwd)?.kind !== "directory") {
      throw new Error(`the starting directory does not exist: ${this.cwd}`);
    }
  }

  get directory(): string {
    return this.cwd;
  }

  get commandHistory(): string[] {
    return [...this.history];
  }

  run(line: string): TerminalResult {
    const trimmed = line.trim();
    if (!trimmed) return { stdout: "", stderr: "", exitCode: 0 };
    if (FORBIDDEN.test(trimmed)) {
      return { stdout: "", stderr: "shell metacharacters are not supported\n", exitCode: 2 };
    }
    this.history.push(trimmed);
    let tokens: string[];
    try {
      tokens = tokenise(trimmed);
    } catch (error) {
      return { stdout: "", stderr: `${(error as Error).message}\n`, exitCode: 2 };
    }
    const [command, ...args] = tokens;
    if (!command || !COMMANDS.has(command)) {
      return { stdout: "", stderr: `command not found: ${command ?? ""}\n`, exitCode: 127 };
    }
    try {
      return this.dispatch(command, args);
    } catch (error) {
      return { stdout: "", stderr: `${(error as Error).message}\n`, exitCode: 1 };
    }
  }

  private dispatch(command: string, args: string[]): TerminalResult {
    switch (command) {
      case "pwd":
        return this.ok(`${this.cwd}\n`);
      case "whoami":
        return this.ok(`${this.user}\n`);
      case "date":
        return this.ok(`${nowIso(this.clock)}\n`);
      case "help":
        return this.ok(`${[...COMMANDS].sort().join(" ")}\n`);
      case "history":
        return this.ok(`${this.history.map((entry, index) => `${index + 1}  ${entry}`).join("\n")}\n`);
      case "clear":
        return this.ok("");
      case "echo":
        return this.ok(`${args.join(" ")}\n`);
      case "ls":
        return this.ls(args);
      case "cd":
        return this.cd(args);
      case "cat":
        return this.cat(args);
      case "mkdir":
        return this.mkdir(args);
      case "touch":
        return this.touch(args);
      case "rm":
        return this.rm(args);
      case "cp":
        return this.cp(args);
      case "mv":
        return this.mv(args);
      case "grep":
        return this.grep(args);
      case "wc":
        return this.wc(args);
      default:
        return { stdout: "", stderr: `command not found: ${command}\n`, exitCode: 127 };
    }
  }

  private ls(args: string[]): TerminalResult {
    const target = resolve(this.cwd, args.find((arg) => !arg.startsWith("-")) ?? ".");
    const long = args.includes("-l");
    const entries = this.files.list(target);
    if (entries.length === 0) return this.ok("");
    const lines = entries.map((entry) => {
      const name = entry.path.split("/").pop() ?? entry.path;
      const shown = entry.kind === "directory" ? `${name}/` : name;
      return long ? `${entry.kind === "directory" ? "d" : "-"} ${String(entry.bytes).padStart(8)} ${shown}` : shown;
    });
    return this.ok(`${lines.join("\n")}\n`);
  }

  private cd(args: string[]): TerminalResult {
    const target = resolve(this.cwd, args[0] ?? "/");
    const node = this.files.stat(target);
    if (!node) return this.fail(`no such directory: ${target}`);
    if (node.kind !== "directory") return this.fail(`not a directory: ${target}`);
    this.cwd = target;
    this.ledger.append({ type: "terminal.cd", actor: "terminal", subject: target });
    return this.ok("");
  }

  private cat(args: string[]): TerminalResult {
    if (args.length === 0) return this.fail("cat needs a file");
    const output = args.map((arg) => this.files.read(resolve(this.cwd, arg))).join("");
    return this.ok(output.endsWith("\n") || output.length === 0 ? output : `${output}\n`);
  }

  private mkdir(args: string[]): TerminalResult {
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length === 0) return this.fail("mkdir needs a path");
    for (const path of paths) this.files.mkdir(resolve(this.cwd, path));
    return this.ok("");
  }

  private touch(args: string[]): TerminalResult {
    if (args.length === 0) return this.fail("touch needs a path");
    for (const arg of args) {
      const path = resolve(this.cwd, arg);
      if (this.files.stat(path)) continue;
      this.files.write(path, "");
    }
    return this.ok("");
  }

  private rm(args: string[]): TerminalResult {
    const recursive = args.includes("-r") || args.includes("-rf");
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length === 0) return this.fail("rm needs a path");
    for (const path of paths) this.files.remove(resolve(this.cwd, path), { recursive });
    return this.ok("");
  }

  private cp(args: string[]): TerminalResult {
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length !== 2) return this.fail("cp needs a source and a destination");
    this.files.copy(resolve(this.cwd, paths[0]!), resolve(this.cwd, paths[1]!));
    return this.ok("");
  }

  private mv(args: string[]): TerminalResult {
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length !== 2) return this.fail("mv needs a source and a destination");
    this.files.move(resolve(this.cwd, paths[0]!), resolve(this.cwd, paths[1]!));
    return this.ok("");
  }

  private grep(args: string[]): TerminalResult {
    if (args.length < 2) return this.fail("grep needs a pattern and a file");
    const [pattern, ...files] = args;
    const matches: string[] = [];
    for (const file of files) {
      const path = resolve(this.cwd, file);
      const lines = this.files.read(path).split("\n");
      lines.forEach((text, index) => {
        if (text.includes(pattern!)) matches.push(`${path}:${index + 1}:${text}`);
      });
    }
    return this.ok(matches.length ? `${matches.join("\n")}\n` : "");
  }

  private wc(args: string[]): TerminalResult {
    const paths = args.filter((arg) => !arg.startsWith("-"));
    if (paths.length === 0) return this.fail("wc needs a file");
    const output = paths.map((path) => {
      const resolved = resolve(this.cwd, path);
      const content = this.files.read(resolved);
      const lines = content === "" ? 0 : content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
      return `${lines} ${content.length} ${resolved}`;
    });
    return this.ok(`${output.join("\n")}\n`);
  }

  private ok(stdout: string): TerminalResult {
    return { stdout, stderr: "", exitCode: 0 };
  }

  private fail(stderr: string): TerminalResult {
    return { stdout: "", stderr: `${stderr}\n`, exitCode: 1 };
  }
}

export { parent as parentPath };
