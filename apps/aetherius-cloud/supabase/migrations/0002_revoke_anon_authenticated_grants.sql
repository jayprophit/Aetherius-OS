-- Aetherius Cloud — control-plane grant hardening (free tier)
-- Target: Supabase (Postgres 15+). Applied with the table owner ONLY.
--
-- Scope: the six Aetherius cloud-control tables created by 0001.
--
-- WHY: Supabase's default privileges give `anon` and `authenticated` full
-- table grants (INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
-- on every table in `public`. Row Level Security with zero policies blocks
-- them today, but the grants are latent — adding any policy later would
-- expose the control plane without a second review.
--
-- This migration revokes those grants so the server-only access model is
-- explicit at the privilege layer, not only at the policy layer.
-- `service_role` (BYPASSRLS) is untouched and keeps full access.
--
-- Preconditions verified before applying (see supabase/README.md):
--   * all six tables owned by `postgres`; RLS enabled on all six
--   * no views, functions, triggers or sequences depend on the tables
--   * zero policies on all six
--   * `service_role` retains its own grants and BYPASSRLS
--
-- Rollback: 0002_revoke_anon_authenticated_grants_rollback.sql
--   grant all on table public.<table> to anon, authenticated;

revoke all on table public.cloud_provider   from anon, authenticated;
revoke all on table public.cloud_resource   from anon, authenticated;
revoke all on table public.provider_health  from anon, authenticated;
revoke all on table public.cloud_task       from anon, authenticated;
revoke all on table public.cloud_usage      from anon, authenticated;
revoke all on table public.cloud_deployment from anon, authenticated;
