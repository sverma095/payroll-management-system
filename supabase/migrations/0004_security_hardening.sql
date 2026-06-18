-- ============================================================================
-- Security hardening per Supabase advisor findings
-- ============================================================================

-- pg_trgm shouldn't live in the public schema
create schema if not exists extensions;
alter extension pg_trgm set schema extensions;

-- The auth_* helpers are only meant to be evaluated inside RLS policies,
-- not called directly over RPC. `authenticated` still needs EXECUTE because
-- that's the role Postgres uses when evaluating policies for signed-in
-- users — revoking it there would break every isolation policy. `anon`
-- has no legitimate reason to call them (our app has no anonymous routes).
revoke execute on function auth_tenant_id() from public, anon;
revoke execute on function auth_company_id() from public, anon;
revoke execute on function auth_is_tenant_admin() from public, anon;

grant execute on function auth_tenant_id() to authenticated, service_role;
grant execute on function auth_company_id() to authenticated, service_role;
grant execute on function auth_is_tenant_admin() to authenticated, service_role;
