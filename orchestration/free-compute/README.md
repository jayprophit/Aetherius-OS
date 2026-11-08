# Free compute lane

Status checked **2026-11-08**. This lane catalogues free/freemium compute that an
agent can reach without a paid plan, a card charge, or a purchased credit. It
does **not** claim that any account exists and it does **not** store a
credential.

The machine-readable source of truth is [`registry.json`](./registry.json). The
notebooks live in [`notebooks/free-gpu`](../../notebooks/free-gpu) and the
operator report is
[`docs/FREE-COMPUTE-2026-11-08.md`](../../docs/FREE-COMPUTE-2026-11-08.md).

## What is here

| File | Purpose |
|---|---|
| `registry.json` | 14 providers with category, free tier, card requirement, quotas, automation mode, auth environment-variable names, status, `checked_at` and `source_url`. |
| `kaggle-job.mjs` | Dependency-free Node CLI to validate a job manifest, stage `kernel-metadata.json`, and dry-run without network access. |
| `free-compute.test.mjs` | Vitest checks for the registry, the CLI and both notebooks. |
| `../../notebooks/free-gpu/agent-worker.ipynb` | JSONL job runner with incremental results and deterministic decoding. |
| `../../notebooks/free-gpu/lora-finetune.ipynb` | LoRA/QLoRA fine-tune of a 1.5B open model on a free T4. |
| `../../notebooks/README.md` | Run instructions for Kaggle, Colab, Lightning and Studio Lab. |

## Honest status

- **11 providers are `AVAILABLE`**: Kaggle, Colab, HF ZeroGPU, Lightning,
  Paperspace, GitHub Codespaces, Deepnote, Binder, Modal, Oracle Always Free and
  Cloudflare Workers AI.
- **2 are `OWNER_GATED`**:
  - **SageMaker Studio Lab** is closed to new customers per AWS. Only an
    existing owner account can use it.
  - **Google TPU Research Cloud** requires an approved application and a public
    research output commitment.
- **1 is `DEFERRED`**: **Gitpod**. `gitpod.io/pricing` now serves the Ona
  contact/sales page, and no public free tier was found in this session.
- **No account is claimed.** `auth` contains environment-variable names only.
- **Quotas marked `verified: false` were not confirmed on an official page in
  this session.** Examples: Kaggle's weekly GPU allowance (the docs page gives
  session specs, not the live weekly figure), Colab's exact GPU allowance
  (Google deliberately does not publish it), Paperspace's free GPU hours, and
  Studio Lab's RAM (two AWS pages disagree).
- **No local GPU is assumed.** This Windows host is treated as 16 GB RAM with no
  NVIDIA CUDA device. Local models must fit that. Kaggle/Colab GPUs are remote
  machines with their own limits.

## Kaggle API: exact owner steps

Kaggle is the only provider here with a first-class, documented batch path
(`kaggle kernels push`). The CLI is official and works on Windows.

1. **Create or sign in to a free Kaggle account** at
   <https://www.kaggle.com/account/login>. A card is not required for the free
   notebook tier.
2. **Create an API token** at <https://www.kaggle.com/settings/api>. The current
   CLI accepts the token through `KAGGLE_API_TOKEN`; the legacy credential flow
   uses a `kaggle.json` file with `KAGGLE_USERNAME` and `KAGGLE_KEY`. Do not put
   either value in this repository.
3. **Install the official CLI** in an isolated environment:

   ```powershell
   pipx install kaggle
   # or
   uv tool install kaggle
   ```

   If neither is available:

   ```powershell
   py -m pip install --user kaggle
   ```

4. **Authenticate in the current shell, not in a file.**

   ```powershell
   # Option A: the CLI's browser OAuth flow.
   kaggle auth login

   # Option B: read the token without echoing it into this session's log.
   $env:KAGGLE_API_TOKEN = Read-Host "Kaggle API token"
   ```

   On Bash:

   ```bash
   read -rsp "Kaggle API token: " KAGGLE_API_TOKEN && export KAGGLE_API_TOKEN
   ```

5. **Verify the owner identity** (network call, owner action):

   ```powershell
   kaggle kernels list --mine --page-size 1
   ```

6. **Write a job manifest** in a private working directory. The schema is:

   ```json
   {
     "id": "owner/kernel-slug",
     "title": "Agent worker",
     "code_file": "agent-worker.ipynb",
     "dataset_sources": ["owner/dataset-slug"],
     "kernel_sources": [],
     "enable_gpu": true,
     "enable_tpu": false,
     "competition_sources": [],
     "environment": "python"
   }
   ```

   `dataset_sources`, `kernel_sources` and `competition_sources` are required
   arrays and may be empty. `environment` is `python` or `r`. `enable_gpu` and
   `enable_tpu` cannot both be true. `code_file` must be a relative path inside
   the manifest directory and must exist.

7. **Validate and stage locally. This never touches the network.**

   ```powershell
   node orchestration/free-compute/kaggle-job.mjs validate --job .\job.json
   node orchestration/free-compute/kaggle-job.mjs dry-run --job .\job.json
   node orchestration/free-compute/kaggle-job.mjs metadata --job .\job.json --out .\staging
   ```

   `metadata` copies the code file into the staging directory and writes
   `kernel-metadata.json` with `enable_internet: false`. The push command it
   prints is the exact owner action.

   **Internet is off by default.** The agent notebook downloads
   `Qwen/Qwen2.5-0.5B-Instruct` from the Hugging Face Hub on first run, which
   needs internet. Either edit the staged `kernel-metadata.json` to
   `"enable_internet": true` before `kaggle kernels push`, or attach the model as
   a Kaggle model/dataset source so the kernel reads it locally. The CLI never
   enables internet for you.

8. **Push only when you mean it** (network call, owner action):

   ```powershell
   kaggle kernels push -p .\staging
   ```

   `kaggle kernels push` uploads and runs the kernel. Read the printed status.

9. **Fetch the result to the local machine**:

   ```powershell
   kaggle kernels status owner/kernel-slug
   kaggle kernels output owner/kernel-slug -p .\out
   ```

Never commit `~/.kaggle/kaggle.json`, `~/.kaggle/access_token`, or any token
value. The notebook output and the `job.json` manifest may contain prompts or
data; treat them as private.

## Colab: manual use only

Google Colab has **no official public automation API for free unattended runs**.
The FAQ restricts bypassing the notebook UI, SSH/remote desktop, distributed
workers and similar automation on free managed runtimes. This lane does not fake
an API and does not drive a browser against Colab.

Exact manual steps:

1. Sign in at <https://colab.research.google.com/> with a Google account.
2. Upload `notebooks/free-gpu/agent-worker.ipynb` (**File → Upload notebook**) or
   open it from Google Drive / GitHub.
3. Choose **Runtime → Change runtime type**, select a GPU (usually a T4-class
   device) and save. The exact GPU is assigned by Colab and is not guaranteed.
4. Run the first cell. It prints `nvidia-smi` and `torch.cuda`; confirm the GPU
   and VRAM before loading a model.
5. Upload `jobs.jsonl` in the **Files** pane, or run your own cell to mount
   Google Drive. Mounting Drive is a user action, not part of this notebook.
6. Run the remaining cells in order. `results.jsonl` is appended and `fsync`-ed
   after every job, so an idle timeout does not lose completed work.
7. Download `results.jsonl` from the **Files** pane before closing the runtime.
   The runtime and its disk are temporary.
8. For fine-tuning, select the T4 GPU, run
   `notebooks/free-gpu/lora-finetune.ipynb`, and download the `lora-adapter`
   directory or push it to the Hugging Face Hub with `HF_TOKEN` stored in
   **Secrets** (the key icon), never in a cell.

If Colab refuses a GPU because of dynamic quotas, wait or use Kaggle. Do not
create multiple accounts to work around the limit; the FAQ explicitly forbids it.

## Comparison

Accelerator figures are the free-tier hardware documented at `checked_at`. See
`registry.json` for the full quota list and source URLs.

| Provider | Category | Free tier | Free accelerator | Automation | Status |
|---|---|---|---|---|---|
| Kaggle Notebooks | notebook | Free account | P100 16 GB or 2x T4, TPU v3-8, queued | `api` (official CLI) | AVAILABLE |
| Google Colab | notebook | Free account | T4-class GPU / TPU, variable | `manual` (no official API) | AVAILABLE |
| HF Spaces / ZeroGPU | gpu | 5 min GPU/day, 2 Spaces | 48 GB or 96 GB shared, per call | `api` (Hub/Gradio) | AVAILABLE |
| Lightning AI Studio | notebook | Starter credits / promo hours | T4, L4 and others, 2 concurrent | `unknown` (not exercised) | AVAILABLE |
| SageMaker Studio Lab | notebook | Existing customers only | GPU 4 h/day, CPU 8 h/day | `manual` | OWNER_GATED |
| Paperspace Gradient | gpu | Free plan | Free GPU, best availability | `unknown` (not exercised) | AVAILABLE |
| GitHub Codespaces | cpu | 120 core-h/month | CPU only | `api` (GitHub) | AVAILABLE |
| Gitpod (Ona) | cpu | No public free tier found | None published | `unknown` | DEFERRED |
| Deepnote | notebook | Free forever | CPU only (5 GB RAM, 2 vCPU) | `manual` | AVAILABLE |
| Binder | notebook | Public, no account | CPU, 1-2 GB RAM | `browser` (launch URL) | AVAILABLE |
| Modal | serverless | $30 credits/month | T4/L4/A100 etc. from credits | `api` | AVAILABLE |
| Oracle Always Free | vm | Always Free tenancy | CPU only (Ampere A1) | `api` (OCI) | AVAILABLE |
| Cloudflare Workers AI | serverless | 10k Neurons/day | Serverless inference only | `api` | AVAILABLE |
| Google TPU Research Cloud | tpu | Approved research quota | Cloud TPU | `manual` (application) | OWNER_GATED |

## What to use, and for what

- **Batch JSONL inference, free and scriptable:** Kaggle. Use
  `agent-worker.ipynb`, push with the official CLI, fetch `results.jsonl`.
- **Interactive experiments with a GPU but no batch API:** Colab. Manual only.
- **A demo with a shared GPU and a web UI:** HF ZeroGPU. 5 minutes/day on a free
  account; not a training VM.
- **A real LoRA fine-tune on a T4:** Kaggle or Colab with
  `lora-finetune.ipynb`, 1.5B model, 4-bit NF4, batch 1, gradient accumulation 8.
- **Always-on small CPU service:** Oracle Always Free (Ampere A1, 2 OCPU / 12 GB)
  or GitHub Codespaces (not always-on; quota-limited).
- **Serverless model calls:** Cloudflare Workers AI (10k Neurons/day) or Modal
  credits.
- **Do not use Binder for jobs or secrets.** It is an ephemeral public demo
  service with no persistence.
- **Do not expect a free frontier-model training run.** No provider here offers
  one. The LoRA notebook is fine-tuning a 1.5B open model, not pretraining
  DeepSeek V4.1.

## Security rules for this lane

1. Never write a token, key or password into `registry.json`, a notebook, a
   manifest, a test fixture or a doc. `auth` lists environment-variable **names**
   only.
2. Read secrets at runtime from the environment or the notebook secret store.
   The LoRA notebook reads `HF_TOKEN` only inside the optional push cell and
   never prints it.
3. Do not put private data in a Binder repository. Binder launches are public
   and have no persistence.
4. Treat `results.jsonl`, adapters and merged weights as user data. Check the
   base-model and dataset licences before publishing.
5. A free remote GPU is not the local machine. Confirm the remote GPU with the
   first notebook cell and record the runtime report with the results.
6. Free tiers change. Re-check `source_url` before relying on a quota; update
   `checked_at` when you do.

## Tests

```powershell
npx vitest run orchestration/free-compute/free-compute.test.mjs
```

The suite checks the registry schema, rejects secret-looking values, verifies
every provider has `status`, `checked_at` and `source_url`, exercises the Kaggle
CLI on a fixture (including a bad id), and parses both notebooks as `nbformat`
4 JSON.
