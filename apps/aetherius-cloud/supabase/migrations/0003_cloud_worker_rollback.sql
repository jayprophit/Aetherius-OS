-- Rollback for 0003_cloud_worker.sql
--
-- DROPS the cloud_worker table and restores the anon/authenticated grants that
-- 0003 revoked. DESTRUCTIVE: any worker registration, lease state and audit
-- metadata in that table are lost. Requires explicit owner approval.

grant all on table public.cloud_worker to anon, authenticated;
drop table if exists public.cloud_worker;
