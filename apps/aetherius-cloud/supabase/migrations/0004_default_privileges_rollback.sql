-- Rollback for 0004_default_privileges.sql
--
-- Restores the exact prior default ACL for role `postgres` in schema `public`:
-- `{postgres=arwdDxtm/postgres, anon=arwdDxtm/postgres,
--   authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}`.
--
-- `GRANT ALL ON TABLES` is used here because it is the precise inverse of the
-- scoped REVOKE in 0004 (ALL on a table = INSERT, SELECT, UPDATE, DELETE,
-- TRUNCATE, REFERENCES, TRIGGER), not a broad database-wide grant. It is scoped
-- to one role and one schema. Requires explicit owner approval.

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated;

alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated;
