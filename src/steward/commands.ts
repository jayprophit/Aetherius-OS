import { StewardError } from "./types";
import type { CommandPolicy, CommandVerb, MaintainerCommand, ReviewTarget } from "./types";

const VERBS: ReadonlySet<string> = new Set(["check", "re-review", "repair", "pause", "resume"]);
const TARGET_RE = /^([a-z0-9][a-z0-9_-]*)#(issue|pull)-(\d+)$/i;

/**
 * Strict grammar: `/steward <verb> <repo>#<issue|pull>-<number>`.
 * Unknown verbs, malformed targets and empty input fail closed.
 */
export function parseCommand(text: string, actor: string): MaintainerCommand {
  const trimmed = text.trim();
  if (!trimmed.startsWith("/steward")) {
    throw new StewardError("COMMAND_PARSE_FAILED", "not a steward command");
  }
  const rest = trimmed.slice("/steward".length).trim();
  const parts = rest.split(/\s+/).filter((p) => p.length > 0);
  if (parts.length !== 2) {
    throw new StewardError("COMMAND_PARSE_FAILED", "expected: /steward <verb> <repo>#<kind>-<number>");
  }
  const [verb, rawTarget] = parts as [string, string];
  if (!VERBS.has(verb)) {
    throw new StewardError("COMMAND_PARSE_FAILED", `unknown verb ${verb}`);
  }
  const match = TARGET_RE.exec(rawTarget);
  if (!match) {
    throw new StewardError("COMMAND_PARSE_FAILED", `invalid target ${rawTarget}`);
  }
  const target: ReviewTarget = {
    repo: match[1]!.toLowerCase(),
    kind: match[2]!.toLowerCase() as ReviewTarget["kind"],
    number: Number(match[3]),
  };
  if (!Number.isInteger(target.number) || target.number < 1) {
    throw new StewardError("COMMAND_PARSE_FAILED", "target number must be a positive integer");
  }
  return { actor, verb: verb as CommandVerb, target };
}

/**
 * Default deny: only actors on the explicit allowlist may act. An empty or
 * missing allowlist denies everyone, including "owner"-looking names.
 */
export function authorizeCommand(cmd: MaintainerCommand, policy: CommandPolicy): void {
  if (!Array.isArray(policy.authorizedActors) || policy.authorizedActors.length === 0) {
    throw new StewardError("COMMAND_DENIED", "no authorized maintainers configured");
  }
  if (!policy.authorizedActors.includes(cmd.actor)) {
    throw new StewardError("COMMAND_DENIED", `actor ${cmd.actor} is not an authorized maintainer`);
  }
}
