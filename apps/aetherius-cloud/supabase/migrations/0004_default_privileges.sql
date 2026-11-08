-- Aetherius Cloud — default-privilege hardening (free tier)
-- Target: Supabase (Postgres 15+). Applied with the table owner ONLY.
--
-- WHY: `pg_default_acl` grants `arwdDxtm` on every FUTURE table and sequence in
-- schema `public` to `anon` and `authenticated` (default ACLs held by
-- `postgres`). Row Level Security blocks them today, but the grants are latent:
-- adding any policy later would expose new tables without a second review.
--
-- MINIMUM SCOPE: only roles that can actually CREATE in `public` are
-- `postgres` and `supabase_admin` (verified). Only `postgres` is used for
-- Aetherius migrations, so the change targets that role in that schema only.
-- No other role, schema or database is touched.
--
-- Functions are deliberately NOT changed: EXECUTE on functions is a code
-- concern rather than a data-exposure one, and Supabase's own roles rely on the
-- current default. Recorded here rather than silently omitted.
--
-- Rollback: 0004_default_privileges_rollback.sql (exact inverse, same scope)

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated;
