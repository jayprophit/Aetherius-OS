#!/usr/bin/env node
/**
 * kaggle-job.mjs
 *
 * Dependency-free helper for Kaggle kernel jobs.
 *
 *   validate --job <manifest.json>              validate a job manifest
 *   metadata --job <manifest.json> --out <dir>  stage kernel-metadata.json
 *   dry-run  --job <manifest.json>              print what would be pushed
 *
 * This file never performs network I/O. It does not authenticate, push, run or
 * download anything. `kaggle kernels push` remains an explicit owner action.
 */

import { existsSync, readFileSync, statSync, mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { basename, dirname, extname, isAbsolute, join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";

const USAGE = `Usage:
  node kaggle-job.mjs validate --job <manifest.json>
  node kaggle-job.mjs metadata --job <manifest.json> --out <dir>
  node kaggle-job.mjs dry-run  --job <manifest.json>

Manifest schema:
  {
    "id": "owner/kernel-slug",
    "title": "Human readable title",
    "code_file": "relative/path/to/notebook.ipynb",
    "dataset_sources": ["owner/dataset-slug"],
    "kernel_sources": ["owner/kernel-slug"],
    "enable_gpu": true,
    "enable_tpu": false,
    "competition_sources": ["competition-slug"],
    "environment": "python"
  }

Notes:
  - dataset_sources, kernel_sources and competition_sources are required arrays
    and may be empty.
  - environment is "python" or "r".
  - enable_gpu and enable_tpu cannot both be true.
  - No command in this tool makes a network call.`;

const ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,49}\/[a-z0-9][a-z0-9-]{0,99}$/;
const DATASET_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,49}\/[a-z0-9][a-z0-9-]{0,99}$/;
const KERNEL_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{1,49}\/[a-z0-9][a-z0-9-]{0,99}$/;
const COMPETITION_PATTERN = /^[a-z0-9][a-z0-9-]{1,99}$/;
const ENVIRONMENTS = new Set(["python", "r"]);
const CODE_EXTENSIONS = new Set([".ipynb", ".py", ".r"]);
const ALLOWED_KEYS = new Set([
  "id",
  "title",
  "code_file",
  "dataset_sources",
  "kernel_sources",
  "enable_gpu",
  "enable_tpu",
  "competition_sources",
  "environment",
]);

class JobError extends Error {}

function fail(message) {
  throw new JobError(message);
}

function parseOptions(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--job" || arg === "--out") {
      const value = args[index + 1];
      if (typeof value !== "string" || value.length === 0 || value.startsWith("--")) {
        fail(`${arg} requires a value`);
      }
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--job=") || arg.startsWith("--out=")) {
      const separator = arg.indexOf("=");
      const name = arg.slice(2, separator);
      const value = arg.slice(separator + 1);
      if (value.length === 0) {
        fail(`--${name} requires a value`);
      }
      options[name] = value;
      continue;
    }

    fail(`unknown argument: ${arg}`);
  }

  return options;
}

function requireJobPath(options) {
  if (!options.job) {
    fail("--job <manifest.json> is required");
  }
  return options.job;
}

function assertString(value, field, { min = 1, max = 10000 } = {}) {
  if (typeof value !== "string" || value.trim().length < min) {
    fail(`${field} must be a non-empty string`);
  }
  if (value.length > max) {
    fail(`${field} must be at most ${max} characters`);
  }
  return value;
}

function validateSourceArray(value, field, pattern, label) {
  if (!Array.isArray(value)) {
    fail(`${field} must be an array of strings`);
  }

  value.forEach((item, index) => {
    if (typeof item !== "string" || item.trim().length === 0) {
      fail(`${field}[${index}] must be a non-empty string`);
    }
    if (!pattern.test(item)) {
      fail(`${field}[${index}] is not a valid ${label}: ${JSON.stringify(item)}`);
    }
  });

  if (new Set(value).size !== value.length) {
    fail(`${field} must not contain duplicates`);
  }
}

function validateBoolean(value, field) {
  if (typeof value !== "boolean") {
    fail(`${field} must be true or false (not ${JSON.stringify(value)})`);
  }
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function loadJob(manifestPath) {
  const absoluteManifest = resolve(manifestPath);

  if (!existsSync(absoluteManifest)) {
    fail(`job manifest not found: ${absoluteManifest}`);
  }
  if (!statSync(absoluteManifest).isFile()) {
    fail(`job manifest is not a file: ${absoluteManifest}`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(absoluteManifest, "utf8"));
  } catch (error) {
    fail(`job manifest is not valid JSON: ${error.message}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    fail("job manifest must be a JSON object");
  }

  const unknown = Object.keys(parsed).filter((key) => !ALLOWED_KEYS.has(key));
  if (unknown.length > 0) {
    fail(`unknown manifest field(s): ${unknown.join(", ")}`);
  }

  assertString(parsed.id, "id", { max: 150 });
  if (!ID_PATTERN.test(parsed.id)) {
    fail(
      "id must look like 'owner/kernel-slug' with a lowercase hyphenated slug " +
        `(received ${JSON.stringify(parsed.id)})`,
    );
  }

  assertString(parsed.title, "title", { max: 200 });

  assertString(parsed.code_file, "code_file", { max: 500 });
  if (isAbsolute(parsed.code_file)) {
    fail("code_file must be a relative path, not an absolute path");
  }
  if (parsed.code_file.includes("\0")) {
    fail("code_file must not contain NUL bytes");
  }

  const manifestDir = dirname(absoluteManifest);
  const codeAbsolute = resolve(manifestDir, parsed.code_file);
  const codeRelative = relative(manifestDir, codeAbsolute);
  if (codeRelative.startsWith("..") || isAbsolute(codeRelative)) {
    fail("code_file must stay inside the directory that contains the manifest");
  }
  if (!existsSync(codeAbsolute) || !statSync(codeAbsolute).isFile()) {
    fail(`code_file does not exist or is not a file: ${codeAbsolute}`);
  }

  const codeExtension = extname(codeAbsolute).toLowerCase();
  if (!CODE_EXTENSIONS.has(codeExtension)) {
    fail(`code_file must end in .ipynb, .py or .r (received ${codeExtension || "no extension"})`);
  }

  validateBoolean(parsed.enable_gpu, "enable_gpu");
  validateBoolean(parsed.enable_tpu, "enable_tpu");
  if (parsed.enable_gpu && parsed.enable_tpu) {
    fail("enable_gpu and enable_tpu cannot both be true; choose one accelerator");
  }

  validateSourceArray(parsed.dataset_sources, "dataset_sources", DATASET_PATTERN, "dataset source (owner/dataset-slug)");
  validateSourceArray(parsed.kernel_sources, "kernel_sources", KERNEL_PATTERN, "kernel source (owner/kernel-slug)");
  validateSourceArray(
    parsed.competition_sources,
    "competition_sources",
    COMPETITION_PATTERN,
    "competition source (competition-slug)",
  );

  assertString(parsed.environment, "environment", { max: 20 });
  const environment = parsed.environment.toLowerCase();
  if (!ENVIRONMENTS.has(environment)) {
    fail(`environment must be one of: ${[...ENVIRONMENTS].join(", ")}`);
  }

  return {
    job: parsed,
    manifestPath: absoluteManifest,
    manifestDir,
    codeAbsolute,
    codeRelative,
    codeBytes: statSync(codeAbsolute).size,
    codeSha256: sha256File(codeAbsolute),
  };
}

function acceleratorLabel(job) {
  if (job.enable_gpu) return "GPU";
  if (job.enable_tpu) return "TPU";
  return "none";
}

function kernelMetadata(job, codeFile) {
  return {
    id: job.id,
    title: job.title,
    code_file: codeFile,
    language: job.environment.toLowerCase(),
    kernel_type: extname(codeFile).toLowerCase() === ".py" ? "script" : "notebook",
    is_private: true,
    enable_gpu: job.enable_gpu,
    enable_tpu: job.enable_tpu,
    enable_internet: false,
    dataset_sources: job.dataset_sources,
    competition_sources: job.competition_sources,
    kernel_sources: job.kernel_sources,
    model_sources: [],
  };
}

function commandValidate(options) {
  const context = loadJob(requireJobPath(options));
  const { job } = context;

  console.log(`OK: ${job.id}`);
  console.log(`  title: ${job.title}`);
  console.log(`  code_file: ${context.codeRelative} (${context.codeBytes} bytes)`);
  console.log(`  accelerator: ${acceleratorLabel(job)}`);
  console.log(`  datasets: ${job.dataset_sources.length}`);
  console.log(`  kernels: ${job.kernel_sources.length}`);
  console.log(`  competitions: ${job.competition_sources.length}`);
  console.log(`  environment: ${job.environment.toLowerCase()}`);
  return 0;
}

function commandMetadata(options) {
  if (!options.out) {
    fail("--out <dir> is required for the metadata command");
  }

  const context = loadJob(requireJobPath(options));
  const outDirectory = resolve(options.out);
  mkdirSync(outDirectory, { recursive: true });

  const targetCode = join(outDirectory, basename(context.codeAbsolute));
  if (resolve(targetCode) !== resolve(context.codeAbsolute)) {
    copyFileSync(context.codeAbsolute, targetCode);
  }

  const metadata = kernelMetadata(context.job, basename(targetCode));
  const metadataPath = join(outDirectory, "kernel-metadata.json");
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  console.log(`Wrote ${metadataPath}`);
  if (resolve(targetCode) !== resolve(context.codeAbsolute)) {
    console.log(`Copied ${context.codeAbsolute} -> ${targetCode}`);
  }
  console.log(`Next: kaggle kernels push -p "${outDirectory}"`);
  return 0;
}

function commandDryRun(options) {
  const context = loadJob(requireJobPath(options));
  const { job } = context;
  const metadata = kernelMetadata(job, basename(context.codeAbsolute));

  console.log("DRY RUN — no files written and no network calls made");
  console.log(`  manifest: ${context.manifestPath}`);
  console.log(`  kernel: ${job.id}`);
  console.log(`  title: ${job.title}`);
  console.log(`  code_file: ${context.codeRelative}`);
  console.log(`  code_bytes: ${context.codeBytes}`);
  console.log(`  code_sha256: ${context.codeSha256}`);
  console.log(`  accelerator: ${acceleratorLabel(job)}`);
  console.log(`  environment: ${job.environment.toLowerCase()}`);
  console.log("  internet: false");
  console.log("");
  console.log("--- kernel-metadata.json (what `metadata --out <dir>` would write) ---");
  console.log(JSON.stringify(metadata, null, 2));
  console.log("--- end kernel-metadata.json ---");
  console.log("");
  console.log("After staging, the owner command is:");
  console.log(`  kaggle kernels push -p "<staging-dir>"`);
  return 0;
}

function main(argv) {
  const [subcommand, ...rest] = argv;

  if (!subcommand || subcommand === "--help" || subcommand === "-h" || subcommand === "help") {
    console.log(USAGE);
    return 0;
  }

  const options = parseOptions(rest);
  if (options.help) {
    console.log(USAGE);
    return 0;
  }

  switch (subcommand) {
    case "validate":
      return commandValidate(options);
    case "metadata":
      return commandMetadata(options);
    case "dry-run":
      return commandDryRun(options);
    default:
      fail(`unknown subcommand: ${subcommand}`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (error instanceof JobError) {
    console.error(`error: ${error.message}`);
    console.error("Run with --help for usage.");
    process.exitCode = 2;
  } else {
    console.error(`unexpected error: ${error?.stack || error}`);
    process.exitCode = 1;
  }
}
