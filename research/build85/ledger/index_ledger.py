"""BUILD85-R4 - minimal cross-build experiment lineage indexer.

Walks every results.jsonl under research/, normalises to the §43 ledger fields,
and writes a single queryable index. Failed rows are retained, never dropped.
"""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(r"C:\Users\jpowe\Desktop\Projects\Aetherius-OS\research")
OUT = Path(__file__).resolve().parent / "ledger_index.json"

FIELDS = ("experiment_id", "parent_experiment", "requirement", "capability",
          "hypothesis", "equation_method", "implementation", "model",
          "model_revision", "dataset", "seed", "hardware", "backend",
          "execution_domain", "metrics", "packed_bytes", "ram_mb", "vram_mb",
          "latency_s", "throughput", "quality", "failure_reason", "evidence",
          "result", "successor", "status")


def normalise(row: dict, source: str) -> dict:
    st = row.get("storage") or {}
    return {
        "experiment_id": row.get("experiment_id"),
        "parent_experiment": row.get("parent_experiment"),
        "requirement": "REQ-p18-superposition-lab",
        "capability": "CAP-research-compute-fabric",
        "hypothesis": row.get("hypothesis"),
        "equation_method": row.get("method"),
        "implementation": row.get("artifact") or st.get("artifact"),
        "model": row.get("model"),
        "model_revision": row.get("model_revision"),
        "dataset": row.get("corpus"),
        "seed": row.get("seed"),
        "hardware": ((row.get("environment") or {}).get("platform")
                     or "i7-870/16GB/GTX1050Ti"),
        "backend": (row.get("environment") or {}).get("torch", "numpy"),
        "execution_domain": row.get("experiment_kind") or row.get("execution_domain"),
        "metrics": {"perplexity": row.get("perplexity"), "loss": row.get("loss")},
        "packed_bytes": st.get("total_bytes"),
        "ram_mb": row.get("peak_rss_mb"),
        "vram_mb": None,
        "latency_s": row.get("eval_seconds"),
        "throughput": row.get("tokens_per_s"),
        "quality": row.get("perplexity"),
        "failure_reason": row.get("notes") if row.get("status") != "OK" else None,
        "evidence": source,
        "result": row.get("status"),
        "successor": row.get("successor"),
        "status": row.get("status"),
    }


def main() -> None:
    rows = []
    for path in sorted(ROOT.rglob("results.jsonl")):
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                rows.append(normalise(json.loads(line), str(path)))
            except Exception as e:
                rows.append({"experiment_id": None, "evidence": str(path),
                             "status": "UNPARSEABLE", "failure_reason": str(e)[:120]})
    OUT.write_text(json.dumps({"fields": list(FIELDS), "rows": rows,
                               "n": len(rows)}, indent=1), encoding="utf-8")
    ok = sum(1 for r in rows if r.get("status") == "OK")
    print(f"ledger rows={len(rows)} ok={ok} failed/other={len(rows)-ok} -> {OUT}")


if __name__ == "__main__":
    main()