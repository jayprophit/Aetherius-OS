# Free compute lane — operator report, 2026-11-08

Task: `task_d650a506-332c-499e-b084-ff845551befc`
Lane: `free-compute-lane`

## Implemented

| Path | What it is |
|---|---|
| `orchestration/free-compute/registry.json` | 14-provider free/freemium compute catalogue with category, free tier, card requirement, quotas, automation mode, auth env-var names, status, `checked_at` and `source_url`. |
| `orchestration/free-compute/README.md` | Lane explanation, honest status, exact Kaggle API owner steps, Colab manual steps, comparison table and security rules. |
| `orchestration/free-compute/kaggle-job.mjs` | Dependency-free Node CLI: `validate`, `metadata`, `dry-run`. No network calls. |
| `orchestration/free-compute/free-compute.test.mjs` | 15 Vitest checks for the registry, the CLI and both notebooks. |
| `notebooks/free-gpu/agent-worker.ipynb` | Valid nbformat 4 notebook: GPU/VRAM check, configurable JSONL jobs, deterministic decoding, `fsync`-ed incremental results, exact runtime report, remote-GPU warning. |
| `notebooks/free-gpu/lora-finetune.ipynb` | Valid nbformat 4 notebook: fail-fast GPU check, dataset formats, 4-bit QLoRA on a T4, adapter save, optional merge, optional `HF_TOKEN`-gated Hub push. |
| `notebooks/README.md` | Run and retrieval instructions for Kaggle, Colab, Lightning and SageMaker Studio Lab, plus security notes. |

No existing file was edited. No package manifest, router, hive, `src/` or existing
doc was changed. Nothing was committed or pushed.

## Registry status

| Status | Count | Providers |
|---|---|---|
| `AVAILABLE` | 11 | Kaggle, Colab, HF ZeroGPU, Lightning, Paperspace, GitHub Codespaces, Deepnote, Binder, Modal, Oracle Always Free, Cloudflare Workers AI |
| `OWNER_GATED` | 2 | SageMaker Studio Lab (existing customers only), Google TPU Research Cloud (approved application) |
| `DEFERRED` | 1 | Gitpod (now Ona; no public free tier found) |

No account is claimed. Auth fields are environment-variable names only.

## Checked in this session

Official pages were read on 2026-11-08 for: Kaggle notebooks/API docs, Colab
FAQ, HF ZeroGPU docs, Lightning pricing, AWS Studio Lab docs and availability
change, Paperspace pricing, GitHub Codespaces billing, Deepnote pricing, Binder
usage guidelines, Modal pricing, Oracle Always Free docs, Cloudflare Workers AI
pricing, and Google TRC about/FAQ. `source_url` on every provider points at the
page used.

Notable verified facts:

- Kaggle: 12 h CPU/GPU, 9 h TPU, 20 GB saved output, 20 min interactive idle,
  P100 or 2x T4, TPU v3-8.
- Studio Lab: AWS says it is **closed to new customers**; existing accounts get
  GPU 4 h at a time and 4 h per 24 h, CPU 4 h at a time and 8 h per 24 h, 15 GB
  storage.
- HF ZeroGPU: free accounts get 5 GPU-minutes/day and can host 2 ZeroGPU Spaces.
- GitHub Codespaces: 120 core-hours and 15 GB-month per month on GitHub Free.
- Modal: $30/month free credits on the $0 Starter plan.
- Oracle Always Free: 2 AMD micro VMs and/or 2 OCPU + 12 GB Ampere A1, 200 GB
  block, 20 GB object, 10 TB egress/month; card required at signup per docs.
- Cloudflare Workers AI: 10,000 Neurons/day, reset 00:00 UTC.
- Gitpod: `gitpod.io/pricing` now serves the Ona contact/sales page; no public
  free tier found.

## UNVERIFIED or conflicting

These are marked honestly rather than guessed:

1. **Kaggle weekly GPU/TPU allowance.** The docs page fetched gives session
   specs, not the weekly account figure. Inspect the Kaggle account settings.
2. **Colab exact GPU allowance and accelerator types.** Google explicitly does
   not publish them; they fluctuate. The 12-hour maximum runtime is published.
3. **Colab automation.** There is no official public automation API for free
   Colab. The FAQ restricts bypassing the notebook UI, SSH, distributed workers
   and multiple-account evasion. This lane does not fake an API.
4. **Paperspace free GPU model and hours.** The pricing page offers a free GPU
   tier but does not publish the model or an hourly allowance.
5. **Lightning credit-to-GPU-hour conversion.** The page advertises both "up to
   50 free GPU hours" and "up to 30 credits to start". The conversion is not
   stated, and no Lightning API/token flow was exercised.
6. **Studio Lab RAM.** The component overview says 16 GB; the availability-change
   page says 12 GB. Recorded as a conflict.
7. **Modal card requirement.** The pricing page does not say whether Starter
   signup requires a payment method.
8. **Gitpod free tier.** No public free tier was found after the Ona rebrand.
9. **TRC quota size and term.** The programme publishes a shared cluster of more
   than 1,000 TPU devices, not an individual quota.
10. **Notebook execution.** Both notebooks parse as `nbformat` 4 and every code
    cell compiles, but neither was executed end-to-end on a real Kaggle/Colab GPU
    in this session. The first GPU run is an owner action.

## Owner-gated items

- **SageMaker Studio Lab:** only an existing owner account can use it. New work
  should use Kaggle, Colab or Lightning.
- **Google TPU Research Cloud:** requires an application, an approved GCP
  project, a temporary quota grant, and a commitment to publish results.
- **Gitpod/Ona:** the owner would need to confirm any existing account or plan.
  No free tier is advertised.

## Exact next commands

Run from the repository root (`C:\Users\jpowe\Desktop\Projects\Aetherius-OS`).

```powershell
# 1. Re-run the lane tests.
npx vitest run orchestration/free-compute/free-compute.test.mjs

# 2. Validate a local job manifest (replace the path with the owner's file).
node orchestration/free-compute/kaggle-job.mjs validate --job .\job.json
node orchestration/free-compute/kaggle-job.mjs dry-run --job .\job.json

# 3. Stage the Kaggle push folder.
node orchestration/free-compute/kaggle-job.mjs metadata --job .\job.json --out .\staging

# 4. Owner-authenticated network actions (not run by this lane).
#    Set KAGGLE_API_TOKEN in the shell from a prompt, or run: kaggle auth login
#    Then:
kaggle kernels push -p .\staging
kaggle kernels status owner/kernel-slug
kaggle kernels output owner/kernel-slug -p .\out
```

For Colab, follow the manual steps in
`orchestration/free-compute/README.md`: upload the notebook, select a GPU
runtime, run the GPU check, upload `jobs.jsonl`, run, and download
`results.jsonl` before the runtime is recycled.

## Test result

```text
npx vitest run orchestration/free-compute/free-compute.test.mjs
Test Files  1 passed (1)
Tests       15 passed (15)
```

## Non-claims

- No free account was created, no token was set, no Kaggle job was pushed, no
  remote GPU notebook was run, and no model was fine-tuned in this session.
- The registry is a snapshot. Free tiers change; re-check `source_url` and update
  `checked_at` before relying on a quota.
- This lane does not provide a free frontier-model training path. The LoRA
  notebook fine-tunes a 1.5B open model; it does not train DeepSeek V4.1.
