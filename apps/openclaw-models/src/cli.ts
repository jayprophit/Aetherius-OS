#!/usr/bin/env node
/**
 * Inspect the OpenClaw model catalogue and render config fragments.
 *
 * This CLI is read-only. It prints JSON to stdout and never edits a live
 * OpenClaw configuration. Credentials appear only as environment references
 * such as `${OPENAI_API_KEY}`; no secret is read or written.
 */
import {
  MODEL_CATALOGUE,
  allModels,
  modelsByTier,
  renderAgentDefaults,
  renderProviderConfig,
  resolveModel,
  selectionFor,
  selectionForTier,
  tierSummary,
  validateCatalogue,
  type ModelTier,
} from "./index.ts";

const TIERS: ModelTier[] = ["free", "paid", "premium", "other"];

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(2);
}

function isTier(value: string): value is ModelTier {
  return (TIERS as string[]).includes(value);
}

function flagValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) fail(`${name} needs a value`);
  return value;
}

function tierOption(args: string[]): ModelTier | undefined {
  const value = flagValue(args, "--tier");
  if (value === undefined) return undefined;
  if (!isTier(value)) fail(`unknown tier: ${value}`);
  return value;
}

function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

function printTiers(): void {
  const summary = tierSummary();
  for (const tier of TIERS) {
    const entry = summary[tier];
    process.stdout.write(
      `${tier.padEnd(8)} ${String(entry.models).padStart(2)} models  ${entry.providers.join(", ")}\n`,
    );
  }
}

function printModels(args: string[]): void {
  const tier = tierOption(args);
  const entries = tier ? modelsByTier(tier) : allModels();
  if (args.includes("--json")) {
    printJson(
      entries.map((entry) => ({
        ref: entry.ref,
        tier: entry.model.tier,
        name: entry.model.name,
        contextWindow: entry.model.contextWindow ?? null,
        maxTokens: entry.model.maxTokens ?? null,
        input: entry.model.input,
        reasoning: entry.model.reasoning,
      })),
    );
    return;
  }
  for (const entry of entries) {
    const context = entry.model.contextWindow ? String(entry.model.contextWindow) : "-";
    const output = entry.model.maxTokens ? String(entry.model.maxTokens) : "-";
    process.stdout.write(
      `${entry.ref.padEnd(62)} ${entry.model.tier.padEnd(8)} ctx ${context.padStart(8)} out ${output.padStart(7)}  ${entry.model.input.join("+")}\n`,
    );
  }
}

function printSelection(target: string | undefined): void {
  if (!target) fail("select needs a tier or a model reference");
  const selection = isTier(target) ? selectionForTier(target) : selectionFor(target);
  printJson(selection);
}

function printProviders(args: string[]): void {
  const tier = tierOption(args);
  const providerFlag = flagValue(args, "--provider");
  if (providerFlag && !MODEL_CATALOGUE.providers.some((provider) => provider.id === providerFlag)) {
    fail(`unknown provider: ${providerFlag}`);
  }
  printJson(
    renderProviderConfig({
      ...(tier ? { tier } : {}),
      ...(providerFlag ? { providerIds: [providerFlag] } : {}),
    }),
  );
}

function printAgents(target: string | undefined): void {
  if (!target) fail("agents needs a tier or a model reference");
  if (!isTier(target)) {
    // Validate the reference before rendering so a typo fails loudly.
    resolveModel(target);
  }
  printJson(renderAgentDefaults(target));
}

function printValidation(): void {
  const problems = validateCatalogue();
  if (problems.length === 0) {
    process.stdout.write(
      `catalogue valid: ${MODEL_CATALOGUE.providers.length} providers, ${allModels().length} models, source ${MODEL_CATALOGUE.sourceDate}\n`,
    );
    return;
  }
  for (const problem of problems) process.stderr.write(`- ${problem}\n`);
  process.exitCode = 1;
}

function usage(): void {
  process.stdout.write(
    [
      "usage: node src/cli.ts <command> [options]",
      "",
      "commands:",
      "  tiers                              count models per tier",
      "  models [--tier <tier>] [--json]    list models",
      "  select <tier|model-ref>            show a primary and fallback chain",
      "  providers [--tier <tier>] [--provider <id>]",
      "                                     render the models.providers fragment",
      "  agents <tier|model-ref>            render the agents.defaults fragment",
      "  validate                           check ids, tiers, aliases and selections",
      "",
      "tiers: free, paid, premium, other",
      "The command is read-only; it never edits a live OpenClaw config.",
    ].join("\n") + "\n",
  );
}

const [command, ...args] = process.argv.slice(2);
switch (command) {
  case "tiers":
    printTiers();
    break;
  case "models":
    printModels(args);
    break;
  case "select":
    printSelection(args[0]);
    break;
  case "providers":
    printProviders(args);
    break;
  case "agents":
    printAgents(args[0]);
    break;
  case "validate":
    printValidation();
    break;
  case undefined:
  case "help":
  case "--help":
  case "-h":
    usage();
    break;
  default:
    fail(`unknown command: ${command}`);
}
