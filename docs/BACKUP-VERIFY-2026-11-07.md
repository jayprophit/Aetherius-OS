# Backup verification report (2026-11-07, read-only)

**Backup:** `E:\Aetherius-Workspace-Backup-2026-11-04` (exists).
**Last files:** `BACKUP_MANIFEST.csv`, `MANIFEST_STATUS.txt`, `backup.log` — all dated
**2026-11-04 21:14**. The backup **predates three days of work** (Genesis Human, widgets,
registry, provider, sync quota, icon fix). It is **stale and not current**.

## Findings (read-only)

| Check | Result |
|---|---|
| Backup exists | Yes |
| Backup current | **No — stale by 3 days** |
| Source folders deleted | **No — nothing deleted** (gate respected) |
| Model checkpoints | Hermes runs in `Genesis/Genesis-Model/runs/` are **not** in the E: backup (they postdate it) |
| Uncommitted work | 9 test-output JSON files + new source files since backup |
| Restore evidence | Not present in current manifests |

## Required before any source deletion

1. Fresh `E:` backup of `C:\Users\jpowe\Desktop\Projects` (excluding `.venv`, `node_modules`,
   `.git` objects can be included via existing manifest tooling).
2. `scripts/migration-manifest.mjs` re-run + hash comparison.
3. Representative restore test.
4. Explicit owner approval. **Until then, no source folders may be deleted.**

## Next backup operation (pending owner approval + storage check)

Command (preview only — not executed in this pass):

```powershell
# 1. Confirm free space on E:
Get-PSDrive E
# 2. Fresh robocopy of Projects (exclude heavy dirs)
robocopy C:\Users\jpowe\Desktop\Projects E:\Aetherius-Workspace-Backup-2026-11-04\sources /MIR /XD .venv node_modules .git .wrangler /XF *.wav
# 3. Re-run manifest + hashes
node scripts/migration-manifest.mjs
# 4. Restore test (copy one slice to Temp and diff)
```

Nothing was deleted or overwritten in this pass.
