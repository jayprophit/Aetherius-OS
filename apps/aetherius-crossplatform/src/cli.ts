import {
  PLATFORM_VERSION,
  type ConfigService,
  type ExtensionRegistry,
  type ModuleRegistry,
  type RuntimeKernel,
  type Telemetry,
  type WorkspaceLayout,
} from "./platform.ts";

/**
 * TLS-001..TLS-003: command line entry point, configuration flags and
 * structured output.
 *
 * The CLI is a pure function of argv and the injected services, so tests can
 * assert exit codes and output without spawning a process or touching a real
 * terminal.
 */

export interface CliServices {
  kernel: RuntimeKernel;
  modules: ModuleRegistry;
  config: ConfigService;
  workspace: WorkspaceLayout;
  extensions: ExtensionRegistry;
  telemetry: Telemetry;
  version?: string;
}

export interface CliResult {
  exitCode: number;
  stdout: string;
  stderr: string;
}

class UsageError extends Error {}

interface ParsedArguments {
  command: string | null;
  positionals: string[];
  json: boolean;
  verbose: boolean;
  help: boolean;
  version: boolean;
  config: Record<string, string>;
  args: string | null;
}

function parseArguments(argv: readonly string[]): ParsedArguments {
  const parsed: ParsedArguments = {
    command: null,
    positionals: [],
    json: false,
    verbose: false,
    help: false,
    version: false,
    config: {},
    args: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]!;
    if (argument === "--json") {
      parsed.json = true;
      continue;
    }
    if (argument === "--verbose") {
      parsed.verbose = true;
      continue;
    }
    if (argument === "--help" || argument === "-h") {
      parsed.help = true;
      continue;
    }
    if (argument === "--version" || argument === "-v") {
      parsed.version = true;
      continue;
    }
    if (argument === "--config" || argument.startsWith("--config=")) {
      const pair = argument === "--config" ? argv[++index] : argument.slice("--config=".length);
      if (pair === undefined) throw new UsageError("--config needs key=value");
      const split = pair.indexOf("=");
      if (split <= 0) throw new UsageError(`--config expects key=value, got: ${pair}`);
      parsed.config[pair.slice(0, split)] = pair.slice(split + 1);
      continue;
    }
    if (argument === "--args" || argument.startsWith("--args=")) {
      const value = argument === "--args" ? argv[++index] : argument.slice("--args=".length);
      if (value === undefined) throw new UsageError("--args needs a JSON object");
      parsed.args = value;
      continue;
    }
    if (argument.startsWith("-")) throw new UsageError(`unknown option: ${argument}`);
    if (parsed.command === null) parsed.command = argument;
    else parsed.positionals.push(argument);
  }
  return parsed;
}

export function runCli(argv: readonly string[], services: CliServices): CliResult {
  let parsed: ParsedArguments;
  try {
    parsed = parseArguments(argv);
    if (parsed.verbose) services.telemetry.setLevel("debug");
    if (Object.keys(parsed.config).length > 0) {
      const flags: Record<string, string | number | boolean> = {};
      for (const [key, raw] of Object.entries(parsed.config)) flags[key] = services.config.parse(key, raw);
      services.config.setLayer("flags", flags);
    }
  } catch (caught) {
    return { exitCode: 2, stdout: "", stderr: `${messageOf(caught)}\n` };
  }

  const version = services.version ?? PLATFORM_VERSION;
  if (parsed.help) {
    return {
      exitCode: 0,
      stdout: parsed.json
        ? `${JSON.stringify(helpPayload(version), null, 2)}\n`
        : helpText(version),
      stderr: "",
    };
  }
  if (parsed.version) {
    return { exitCode: 0, stdout: parsed.json ? `${JSON.stringify({ version })}\n` : `${version}\n`, stderr: "" };
  }
  if (parsed.command === null) {
    return { exitCode: 2, stdout: "", stderr: "no command given; run with --help\n" };
  }

  try {
    const payload = dispatch(parsed, services, version);
    return {
      exitCode: 0,
      stdout: parsed.json ? `${JSON.stringify(payload, null, 2)}\n` : formatText(parsed.command, payload),
      stderr: "",
    };
  } catch (caught) {
    if (caught instanceof UsageError) return { exitCode: 2, stdout: "", stderr: `${caught.message}\n` };
    return { exitCode: 1, stdout: "", stderr: `${messageOf(caught)}\n` };
  }
}

function dispatch(parsed: ParsedArguments, services: CliServices, version: string): unknown {
  switch (parsed.command) {
    case "status": {
      const modules = services.modules.list();
      return {
        version,
        phase: services.kernel.state,
        modules: {
          total: modules.length,
          started: modules.filter((module) => module.state === "started").length,
        },
        panels: services.workspace.list().length,
        extensions: {
          total: services.extensions.list().length,
          enabled: services.extensions.list().filter((extension) => extension.enabled).length,
        },
      };
    }
    case "modules":
      return { modules: services.modules.list() };
    case "config": {
      const key = parsed.positionals[0];
      if (key !== undefined) {
        if (parsed.positionals.length > 1) throw new UsageError("config accepts at most one key");
        const value = services.config.toJSON()[key];
        if (value === undefined) throw new UsageError(`config key has no value: ${key}`);
        return { key, value, provenance: services.config.provenance(key) };
      }
      const provenance: Record<string, string | null> = {};
      for (const field of Object.keys(services.config.toJSON())) provenance[field] = services.config.provenance(field);
      return { values: services.config.toJSON(), provenance };
    }
    case "extensions":
      return { extensions: services.extensions.list() };
    case "run": {
      const commandId = parsed.positionals[0];
      if (!commandId) throw new UsageError("run needs a command id");
      if (parsed.positionals.length > 1) throw new UsageError("run accepts one command id");
      let args: Record<string, unknown> = {};
      if (parsed.args !== null) {
        let decoded: unknown;
        try {
          decoded = JSON.parse(parsed.args);
        } catch {
          throw new UsageError("--args must be valid JSON");
        }
        if (!decoded || typeof decoded !== "object" || Array.isArray(decoded)) {
          throw new UsageError("--args must be a JSON object");
        }
        args = decoded as Record<string, unknown>;
      }
      return { command: commandId, result: services.extensions.execute(commandId, args) };
    }
    case "help":
      return helpPayload(version);
    default:
      throw new UsageError(`unknown command: ${parsed.command}`);
  }
}

function helpPayload(version: string): Record<string, unknown> {
  return {
    name: "aetherius-crossplatform",
    version,
    usage: "aetherius-crossplatform <command> [options]",
    commands: ["status", "modules", "config [key]", "extensions", "run <command-id> [--args JSON]", "help"],
    options: ["--json", "--verbose", "--config key=value", "--args JSON", "--version", "--help"],
  };
}

function helpText(version: string): string {
  const payload = helpPayload(version);
  return [
    `${payload.name} ${version}`,
    "",
    `Usage: ${payload.usage}`,
    "",
    "Commands:",
    ...(payload.commands as string[]).map((command) => `  ${command}`),
    "",
    "Options:",
    ...(payload.options as string[]).map((option) => `  ${option}`),
    "",
  ].join("\n");
}

function formatText(command: string | null, payload: unknown): string {
  if (command === "status") {
    const status = payload as {
      version: string;
      phase: string;
      modules: { total: number; started: number };
      panels: number;
      extensions: { total: number; enabled: number };
    };
    return [
      `version: ${status.version}`,
      `phase: ${status.phase}`,
      `modules: ${status.modules.started}/${status.modules.total} started`,
      `panels: ${status.panels}`,
      `extensions: ${status.extensions.enabled}/${status.extensions.total} enabled`,
      "",
    ].join("\n");
  }
  if (command === "modules") {
    const modules = (payload as { modules: { id: string; version: string; state: string; capabilities: string[] }[] }).modules;
    return `${modules
      .map((module) => `${module.id}@${module.version} ${module.state} [${module.capabilities.join(", ")}]`)
      .join("\n")}\n`;
  }
  if (command === "config") {
    const single = payload as {
      key?: string;
      value?: string | number | boolean;
      provenance?: string | null;
    };
    if (single.key !== undefined) {
      return `${single.key} = ${String(single.value)} (${single.provenance ?? "unset"})\n`;
    }
    const config = payload as {
      values: Record<string, string | number | boolean>;
      provenance: Record<string, string | null>;
    };
    return `${Object.entries(config.values)
      .map(([key, value]) => `${key} = ${String(value)} (${config.provenance[key] ?? "unset"})`)
      .join("\n")}\n`;
  }
  if (command === "extensions") {
    const extensions = (payload as {
      extensions: { id: string; version: string; enabled: boolean; commands: string[]; panels: string[] }[];
    }).extensions;
    return `${extensions
      .map(
        (extension) =>
          `${extension.id}@${extension.version} ${extension.enabled ? "enabled" : "disabled"} commands=[${extension.commands.join(
            ", ",
          )}] panels=[${extension.panels.join(", ")}]`,
      )
      .join("\n")}\n`;
  }
  return `${JSON.stringify(payload, null, 2)}\n`;
}

function messageOf(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}
