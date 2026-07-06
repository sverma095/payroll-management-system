-- audit_logs had no way to scope by tenant at all: the table carried no
-- tenant_id/company_id column, and its RLS policy was just
-- `using (auth_is_tenant_admin())` - true for any tenant admin regardless
-- of which tenant they administer. In practice that meant any tenant
-- admin could read every company's audit trail system-wide via the
-- Reports > Audit report.
--
-- 0 rows exist in this table today (confirmed before writing this), so no
-- backfill is needed - this is a clean add.

alter table audit_logs add column if not exists tenant_id uuid references tenants(id);

drop policy if exists audit_logs_read on audit_logs;
create policy audit_logs_read on audit_logs
  for select
  using (auth_is_tenant_admin() and tenant_id = auth_tenant_id());

-- Inserts happen from trusted server actions (not directly from the
-- client), so this stays permissive for authenticated writers - the read
-- policy above is what was actually missing tenant scoping.
drop policy if exists audit_logs_write on audit_logs;
create policy audit_logs_write on audit_logs
  for insert
  with check (auth.uid() is not null);
