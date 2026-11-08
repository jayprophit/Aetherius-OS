-- Rollback for 0002_revoke_anon_authenticated_grants.sql
--
-- Restores the exact pre-hardening state: `anon` and `authenticated` held
-- INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES and TRIGGER on all six
-- tables. `GRANT ALL` on a table grants exactly those seven privileges, so
-- this returns the privileges to their prior shape.
--
-- Running this REMOVES the hardening. It requires explicit owner approval
-- and should only be used to recover from a regression caused by 0002.

grant all on table public.cloud_provider   to anon, authenticated;
grant all on table public.cloud_resource   to anon, authenticated;
grant all on table public.provider_health  to anon, authenticated;
grant all on table public.cloud_task       to anon, authenticated;
grant all on table public.cloud_usage      to anon, authenticated;
grant all on table public.cloud_deployment to anon, authenticated;
