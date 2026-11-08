# Free-GPU notebooks

Two notebooks for free remote accelerators. Neither contains a secret. Both
check the runtime before doing expensive work, and both write durable output so
a session timeout does not erase completed work.

| Notebook | Purpose | Minimum runtime |
|---|---|---|
| [`free-gpu/agent-worker.ipynb`](./free-gpu/agent-worker.ipynb) | Run a JSONL job file through a small open model, with deterministic decoding and incremental results. | CPU or GPU; GPU recommended |
| [`free-gpu/lora-finetune.ipynb`](./free-gpu/lora-finetune.ipynb) | LoRA/QLoRA fine-tune of Qwen2.5-1.5B or DeepSeek-R1-Distill-Qwen-1.5B. | CUDA GPU, 16 GB T4 class |

**Remote GPU warning.** A Kaggle or Colab GPU is a remote machine. It is not the
local Windows workstation (assumed 16 GB RAM, no NVIDIA CUDA GPU). The model,
libraries, VRAM and session lifetime on the remote host are different. The
agent-worker's runtime-report cell prints the exact remote model and device;
keep that output with the results.

## Agent worker

### Input format

`jobs.jsonl`, one object per line:

```json
{"id": "job-1", "prompt": "What is 17 + 25?", "system": "Reply tersely."}
{"id": "job-2", "prompt": "Summarise this function."}
```

`id` and `prompt` are required non-empty strings. `system` is optional. The
default model is `Qwen/Qwen2.5-0.5B-Instruct`, greedy decoding, 256 new tokens.
Change `MODEL_ID`, `JOB_FILE`, `OUT_FILE` or `MAX_NEW_TOKENS` in the config cell,
or set the matching `AGENT_*` environment variable before launching.

### Output

`results.jsonl`, one object per job, appended and `fsync`-ed immediately:

```json
{"id": "job-1", "model": "Qwen/Qwen2.5-0.5B-Instruct", "backend": "transformers", "text": "42", "seconds": 1.234, "ok": true}
```

Re-running skips ids already present in the output file. A failed job is written
with `"ok": false` and an error string; the runner continues.

### Backends

- **transformers** (default): loads the model in the notebook process. Run the
  optional install cell first only if imports fail.
- **Ollama**: set `AGENT_BACKEND=ollama`, run `ollama serve`, and
  `ollama pull qwen2.5:0.5b`. The notebook talks to `127.0.0.1:11434` only. No
  credential is used.

## LoRA fine-tune

`lora-finetune.ipynb` fails fast when CUDA is absent. It defaults to:

- `Qwen/Qwen2.5-1.5B-Instruct`
- 4-bit NF4 QLoRA when bitsandbytes is available
- sequence length 1024, batch 1, gradient accumulation 8, one epoch
- fp16 (T4 has no native bf16), paged AdamW 8-bit, gradient checkpointing

Dataset input is JSONL in one of these shapes:

```json
{"text": "full training text"}
{"messages": [{"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
{"instruction": "...", "input": "...", "output": "..."}
```

The notebook writes a two-row example if `train.jsonl` is missing. Replace it
with real data before drawing conclusions.

This is **fine-tuning, not pretraining**, and not training DeepSeek V4.1 from
scratch. A 1.5B adapter on a free T4 is the intended scale.

## Kaggle Notebooks

Kaggle has the only documented batch path in this lane: the official `kaggle`
CLI.

1. Create a free Kaggle account and an API token at
   <https://www.kaggle.com/settings/api>. Keep the token out of the repository.
2. Install the CLI (`pipx install kaggle` or `uv tool install kaggle`) and
   authenticate in the shell:
   - `kaggle auth login`, or
   - set `KAGGLE_API_TOKEN` from a prompt, or
   - use the legacy `~/.kaggle/kaggle.json` with `KAGGLE_USERNAME`/`KAGGLE_KEY`.
3. Write a manifest. For example:

   ```json
   {
     "id": "your-user/agent-worker",
     "title": "Agent worker",
     "code_file": "agent-worker.ipynb",
     "dataset_sources": [],
     "kernel_sources": [],
     "enable_gpu": true,
     "enable_tpu": false,
     "competition_sources": [],
     "environment": "python"
   }
   ```

4. Validate, dry-run and stage locally:

   ```powershell
   node orchestration/free-compute/kaggle-job.mjs validate --job .\job.json
   node orchestration/free-compute/kaggle-job.mjs dry-run --job .\job.json
   node orchestration/free-compute/kaggle-job.mjs metadata --job .\job.json --out .\staging
   ```

5. Push when ready: `kaggle kernels push -p .\staging`.
6. Watch and fetch:

   ```powershell
   kaggle kernels status your-user/agent-worker
   kaggle kernels output your-user/agent-worker -p .\out
   ```

Kaggle kernels have internet disabled by default. The staging metadata keeps
`enable_internet: false`; if a notebook must download a model at runtime, the
owner has to enable internet deliberately in the manifest/metadata and accept
the competition-rules consequences. GPU sessions are limited to 12 hours
(9 hours for TPU), and saved output in `/kaggle/working` is limited to 20 GB.
Exact weekly accelerator quotas are shown in the Kaggle account settings, not in
the public docs page checked on 2026-11-08.

## Google Colab

Colab free has **no official public automation API**. Use the browser.

1. Open <https://colab.research.google.com/> and upload the notebook.
2. **Runtime → Change runtime type → GPU** (or TPU). Save.
3. Run the first cell and confirm the reported GPU/VRAM.
4. Upload `jobs.jsonl` / `train.jsonl` through the Files pane, or mount Google
   Drive in a cell you run yourself.
5. Run the notebook top to bottom.
6. Download `results.jsonl` or the `lora-adapter` directory before the runtime
   is recycled. Free runtimes can terminate on idle or at the dynamic quota.

Do not script the Colab UI, open an SSH shell, or run distributed workers on the
free tier; the FAQ lists those as restricted. Do not create multiple accounts to
evade quotas.

For the optional Hub push, store `HF_TOKEN` in **Secrets** (key icon) and enable
`PUSH_TO_HUB`. The notebook reads the secret at runtime and never prints it.

## Lightning AI Studio

1. Sign in to <https://lightning.ai/> and create a free Studio.
2. Choose a T4 or L4 machine for the session. The Free plan has starter credits
   and a promotional GPU-hour grant; the exact conversion is not published.
3. Clone this repository or upload the notebook, then open it in the Studio's
   JupyterLab.
4. Run the same cells. A free Studio must be restarted every 4 hours; download
   the adapter or push it to the Hub before that.
5. Bring results back with the Studio file browser, `scp` if enabled, or a Hub
   push. Lightning's free persistent storage is 50 GB.

Lightning's API/token flow was not exercised in this lane; treat unattended
automation there as unverified.

## Amazon SageMaker Studio Lab

Studio Lab is **closed to new customers** as of the AWS documentation checked on
2026-11-08. Existing accounts can still use it; new users should choose Kaggle,
Colab or Lightning instead.

Existing owner steps:

1. Sign in at <https://studiolab.sagemaker.aws/>.
2. Start a runtime and select **GPU**. GPU time is capped at 4 hours at a time
   and 4 hours per 24-hour period. CPU is 4 hours at a time and 8 hours per 24
   hours. Storage is 15 GB.
3. Clone the repository or upload the notebook; run it in JupyterLab.
4. Save the adapter/results and download them before the runtime stops. Studio
   Lab does not guarantee that files survive, and its docs recommend manual
   saves and external backups.

No automation API is documented for Studio Lab; use the browser.

## Bringing results back

| Runtime | Result path | Retrieval |
|---|---|---|
| Kaggle | `/kaggle/working/results.jsonl`, `lora-adapter/` | `kaggle kernels output owner/slug -p ./out`, or the Output tab |
| Colab | `results.jsonl`, `lora-adapter/` in the runtime | Files pane download; copy to mounted Drive before the session ends |
| Lightning | same relative paths in the Studio | Studio file browser, SSH/scp if enabled, or Hub push |
| Studio Lab | same relative paths in the project | JupyterLab file browser; export before runtime stop |

For a fine-tune, the adapter directory is the important artifact. It is small
compared with the base model. A merged model is larger and optional. Record
`train-metrics.json` and the runtime-report cell with either one.

## Security notes

- **No secrets in notebooks.** `HF_TOKEN` is read only in the optional push cell
  from notebook secrets or the process environment. Nothing is printed, written
  to a cell, or committed.
- **No secrets in job files.** Prompts, datasets and results can contain private
  data. Keep `jobs.jsonl`, `train.jsonl`, `results.jsonl` and adapters out of
  public repositories unless the owner has reviewed them.
- **Binder is public.** Never run these notebooks on Binder with private data;
  Binder has no persistence and explicitly warns against secrets.
- **Remote hosts are not trusted with local credentials.** Do not upload a local
  `.env`, SSH key, Kaggle credential file or browser profile to a free runtime.
- **Check licences.** Base-model and dataset licences govern what you may
  publish. The notebook does not grant rights.
- **Free tiers change.** The registry records `checked_at` and `source_url` for
  every provider. Re-check before a long run.

## Local machine fallback

The agent-worker can run on CPU with the 0.5B model. It will be slow and uses
several GB of RAM. Start with one or two jobs to measure throughput before
queueing a large file. The LoRA notebook deliberately refuses to train without
CUDA; do not remove that check to "make it work" on the 16 GB CPU host.
