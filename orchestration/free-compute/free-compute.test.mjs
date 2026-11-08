import { afterAll, describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, "..", "..");
const REGISTRY_PATH = join(HERE, "registry.json");
const CLI_PATH = join(HERE, "kaggle-job.mjs");
const AGENT_NOTEBOOK = join(REPO_ROOT, "notebooks", "free-gpu", "agent-worker.ipynb");
const LORA_NOTEBOOK = join(REPO_ROOT, "notebooks", "free-gpu", "lora-finetune.ipynb");

const REQUIRED_PROVIDER_IDS = [
  "kaggle-notebooks",
  "google-colab",
  "hugging-face-zerogpu",
  "lightning-ai",
  "sagemaker-studio-lab",
  "paperspace-gradient",
  "github-codespaces",
  "gitpod",
  "deepnote",
  "binder",
  "modal",
  "oracle-cloud-always-free",
  "cloudflare-workers-ai",
  "google-tpu-research-cloud",
];

const CATEGORIES = new Set(["notebook", "gpu", "tpu", "cpu", "serverless", "vm"]);
const AUTOMATION_MODES = new Set(["api", "browser", "manual", "unknown"]);
const STATUSES = new Set(["AVAILABLE", "OWNER_GATED", "UNVERIFIED", "DEFERRED"]);

const tempRoots = [];

function tempDir(prefix) {
  const directory = mkdtempSync(join(tmpdir(), prefix));
  tempRoots.push(directory);
  return directory;
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function runCli(args, cwd = REPO_ROOT) {
  const result = spawnSync(process.execPath, [CLI_PATH, ...args], {
    cwd,
    encoding: "utf8",
    timeout: 30_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function makeFixture(overrides = {}) {
  const directory = tempDir("aetherius-free-compute-");
  writeFileSync(
    join(directory, "worker.ipynb"),
    `${JSON.stringify({ cells: [], metadata: {}, nbformat: 4, nbformat_minor: 5 }, null, 2)}\n`,
    "utf8",
  );

  const manifest = {
    id: "free-compute/agent-worker",
    title: "Agent worker fixture",
    code_file: "worker.ipynb",
    dataset_sources: ["owner/dataset-one"],
    kernel_sources: [],
    enable_gpu: true,
    enable_tpu: false,
    competition_sources: [],
    environment: "python",
    ...overrides,
  };

  writeJson(join(directory, "job.json"), manifest);
  return { directory, manifest };
}

afterAll(() => {
  for (const directory of tempRoots) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe("free-compute registry", () => {
  const registry = JSON.parse(readFileSync(REGISTRY_PATH, "utf8"));

  it("is a versioned catalogue with every required provider", () => {
    expect(registry).toBeTypeOf("object");
    expect(registry.schema_version).toBe(1);
    expect(Array.isArray(registry.providers)).toBe(true);
    expect(registry.providers.length).toBeGreaterThanOrEqual(REQUIRED_PROVIDER_IDS.length);

    const ids = registry.providers.map((provider) => provider.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const required of REQUIRED_PROVIDER_IDS) {
      expect(ids, `missing provider ${required}`).toContain(required);
    }
  });

  it("gives every provider a complete, honest schema record", () => {
    for (const provider of registry.providers) {
      const label = provider.id ?? "<missing id>";

      expect(provider.id, label).toMatch(/^[a-z0-9][a-z0-9-]*$/);
      expect(typeof provider.label, label).toBe("string");
      expect(provider.label.length, label).toBeGreaterThan(0);

      expect(() => new URL(provider.url), label).not.toThrow();
      expect(CATEGORIES.has(provider.category), `${label} category`).toBe(true);
      expect(typeof provider.free_tier, label).toBe("string");
      expect(provider.free_tier.length, label).toBeGreaterThan(0);

      expect(
        provider.card_required === null || typeof provider.card_required === "boolean",
        `${label} card_required`,
      ).toBe(true);
      expect(
        provider.commercial_use === null || typeof provider.commercial_use === "string",
        `${label} commercial_use`,
      ).toBe(true);

      expect(Array.isArray(provider.quotas), `${label} quotas`).toBe(true);
      for (const quota of provider.quotas) {
        expect(typeof quota.name, `${label} quota name`).toBe("string");
        expect(typeof quota.value, `${label} quota value`).toBe("string");
        expect(typeof quota.reset, `${label} quota reset`).toBe("string");
        expect(typeof quota.verified, `${label} quota verified`).toBe("boolean");
      }

      expect(AUTOMATION_MODES.has(provider.automation), `${label} automation`).toBe(true);
      expect(Array.isArray(provider.auth), `${label} auth`).toBe(true);
      for (const name of provider.auth) {
        expect(name, `${label} auth name`).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }

      expect(STATUSES.has(provider.status), `${label} status`).toBe(true);
      expect(typeof provider.notes, `${label} notes`).toBe("string");
      expect(provider.notes.length, label).toBeGreaterThan(0);

      expect(provider.checked_at, `${label} checked_at`).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(() => new URL(provider.source_url), label).not.toThrow();
      expect(new URL(provider.source_url).protocol, `${label} source protocol`).toBe("https:");
    }
  });

  it("contains no secret-looking values", () => {
    const serialized = JSON.stringify(registry);
    const forbidden = [
      /\bsk-[A-Za-z0-9_-]{16,}\b/,
      /\bhf_[A-Za-z0-9]{16,}\b/,
      /\bghp_[A-Za-z0-9]{20,}\b/,
      /\bgithub_pat_[A-Za-z0-9_]{20,}\b/,
      /\bAKIA[0-9A-Z]{16}\b/,
      /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/,
      /\bAIza[0-9A-Za-z_-]{20,}\b/,
      /\bglpat-[A-Za-z0-9_-]{16,}\b/,
      /\bnpm_[A-Za-z0-9]{20,}\b/,
      /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
      /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\./,
    ];

    for (const pattern of forbidden) {
      expect(serialized, `secret-looking pattern ${pattern}`).not.toMatch(pattern);
    }

    // Auth fields are names, never values. A name ending in "=" or containing a
    // bearer prefix would be a value, not an environment variable.
    for (const provider of registry.providers) {
      for (const name of provider.auth) {
        expect(name).not.toContain("=");
        expect(name.toLowerCase()).not.toContain("bearer");
      }
    }
  });
});

describe("kaggle-job CLI", () => {
  it("validates a good fixture without touching the network", () => {
    const { directory } = makeFixture();
    const result = runCli(["validate", "--job", join(directory, "job.json")]);

    expect(result.status).toBe(0);
    expect(result.output).toContain("OK: free-compute/agent-worker");
    expect(result.output).toContain("accelerator: GPU");
    expect(result.output).toContain("datasets: 1");
    expect(existsSync(join(directory, "kernel-metadata.json"))).toBe(false);
  });

  it("dry-runs and prints the metadata without writing files", () => {
    const { directory } = makeFixture();
    const result = runCli(["dry-run", "--job", join(directory, "job.json")]);

    expect(result.status).toBe(0);
    expect(result.output).toContain("DRY RUN");
    expect(result.output).toContain("free-compute/agent-worker");
    expect(result.output).toContain("--- kernel-metadata.json");
    expect(result.output).toContain('"enable_gpu": true');
    expect(result.output).toContain('"enable_internet": false');
    expect(result.output).toContain("no network calls");
    expect(existsSync(join(directory, "kernel-metadata.json"))).toBe(false);
    expect(existsSync(join(directory, "staging"))).toBe(false);
  });

  it("writes kernel-metadata.json and copies the code file for a push", () => {
    const { directory } = makeFixture();
    const staging = join(directory, "staging");
    const result = runCli(["metadata", "--job", join(directory, "job.json"), "--out", staging]);

    expect(result.status).toBe(0);
    expect(result.output).toContain("Wrote");
    expect(result.output).toContain("kernel-metadata.json");

    const metadataPath = join(staging, "kernel-metadata.json");
    expect(existsSync(metadataPath)).toBe(true);
    expect(existsSync(join(staging, "worker.ipynb"))).toBe(true);

    const metadata = JSON.parse(readFileSync(metadataPath, "utf8"));
    expect(metadata.id).toBe("free-compute/agent-worker");
    expect(metadata.code_file).toBe("worker.ipynb");
    expect(metadata.title).toBe("Agent worker fixture");
    expect(metadata.language).toBe("python");
    expect(metadata.kernel_type).toBe("notebook");
    expect(metadata.is_private).toBe(true);
    expect(metadata.enable_gpu).toBe(true);
    expect(metadata.enable_tpu).toBe(false);
    expect(metadata.enable_internet).toBe(false);
    expect(metadata.dataset_sources).toEqual(["owner/dataset-one"]);
    expect(metadata.competition_sources).toEqual([]);
    expect(metadata.kernel_sources).toEqual([]);
  });

  it("rejects a bad kernel id with a clear non-zero error", () => {
    const { directory } = makeFixture({ id: "not a kaggle id" });
    const result = runCli(["validate", "--job", join(directory, "job.json")]);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("id must look like");
    expect(result.output).toContain("owner/kernel-slug");
  });

  it("rejects non-boolean accelerator flags", () => {
    const { directory } = makeFixture({ enable_gpu: "yes" });
    const result = runCli(["validate", "--job", join(directory, "job.json")]);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("enable_gpu must be true or false");
  });

  it("rejects a missing code file", () => {
    const { directory } = makeFixture({ code_file: "missing.ipynb" });
    const result = runCli(["validate", "--job", join(directory, "job.json")]);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("code_file does not exist");
  });

  it("rejects GPU and TPU enabled together", () => {
    const { directory } = makeFixture({ enable_tpu: true });
    const result = runCli(["validate", "--job", join(directory, "job.json")]);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("cannot both be true");
  });

  it("returns a usage error when --job is missing", () => {
    const result = runCli(["validate"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("--job");
  });
});

describe("notebooks", () => {
  function loadNotebook(path) {
    return JSON.parse(readFileSync(path, "utf8"));
  }

  function notebookText(notebook) {
    return notebook.cells.map((cell) => cell.source.join("")).join("\n");
  }

  it("agent-worker is valid nbformat 4 JSON", () => {
    const notebook = loadNotebook(AGENT_NOTEBOOK);
    expect(notebook.nbformat).toBe(4);
    expect(Number.isInteger(notebook.nbformat_minor)).toBe(true);
    expect(Array.isArray(notebook.cells)).toBe(true);
    expect(notebook.cells.length).toBeGreaterThan(0);
    expect(notebook.metadata.kernelspec.language).toBe("python");

    for (const cell of notebook.cells) {
      expect(["markdown", "code"]).toContain(cell.cell_type);
      expect(Array.isArray(cell.source)).toBe(true);
      if (cell.cell_type === "code") {
        expect(cell.execution_count).toBeNull();
        expect(cell.outputs).toEqual([]);
      }
    }
  });

  it("agent-worker covers GPU, JSONL jobs, deterministic decoding and incremental output", () => {
    const text = notebookText(loadNotebook(AGENT_NOTEBOOK));
    expect(text).toContain("nvidia-smi");
    expect(text).toContain("torch.cuda");
    expect(text).toContain("VRAM");
    expect(text).toContain("jobs.jsonl");
    expect(text).toContain("results.jsonl");
    expect(text).toContain("os.fsync");
    expect(text).toContain("do_sample=False");
    expect(text).toContain("seed=42");
    expect(text).toContain("REMOTE GPU REMINDER");
    expect(text).toContain("16 GB RAM");
  });

  it("lora-finetune is valid nbformat 4 JSON", () => {
    const notebook = loadNotebook(LORA_NOTEBOOK);
    expect(notebook.nbformat).toBe(4);
    expect(Number.isInteger(notebook.nbformat_minor)).toBe(true);
    expect(Array.isArray(notebook.cells)).toBe(true);
    expect(notebook.cells.length).toBeGreaterThan(0);
    expect(notebook.metadata.kernelspec.language).toBe("python");

    for (const cell of notebook.cells) {
      expect(["markdown", "code"]).toContain(cell.cell_type);
      expect(Array.isArray(cell.source)).toBe(true);
      if (cell.cell_type === "code") {
        expect(cell.execution_count).toBeNull();
        expect(cell.outputs).toEqual([]);
      }
    }
  });

  it("lora-finetune fails fast, uses QLoRA on a T4 and keeps the token secret", () => {
    const text = notebookText(loadNotebook(LORA_NOTEBOOK));
    expect(text).toContain("No CUDA GPU is visible");
    expect(text).toContain("BitsAndBytesConfig");
    expect(text).toContain("bnb_4bit_quant_type");
    expect(text).toContain("gradient_accumulation_steps");
    expect(text).toContain("per_device_train_batch_size");
    expect(text).toContain("fp16=True");
    expect(text).toContain("prepare_model_for_kbit_training");
    expect(text).toContain("HF_TOKEN");
    expect(text).toContain("PUSH_TO_HUB");
    expect(text).toContain("not training DeepSeek V4.1");
    expect(text).not.toMatch(/\bhf_[A-Za-z0-9]{16,}\b/);
  });
});
