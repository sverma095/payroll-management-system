-- ============================================================================
-- ESS self-signup: invite codes
--
-- An admin issues an employee a one-time code (out of band, e.g. via the
-- employees list). The employee redeems it on /signup once they have a
-- confirmed auth session — consume_invite() is SECURITY DEFINER because the
-- redeeming user has no row in app_users yet and therefore cannot pass the
-- normal auth_tenant_id()/auth_company_id() RLS checks on invites or
-- app_users. It intentionally does the minimum: link the auth user to the
-- employee record as an ESS-tier app_user (company_id NULL, employee_id SET,
-- matching the three-tier shape from 0007_employee_self_service.sql) and
-- burn the code. It does not assign a role_id — ESS access is governed by
-- auth_employee_id()-scoped policies, not role_permissions.
--
-- NOTE: this migration documents schema that was already applied directly
-- against the project (see handover doc) and is being checked in here for
-- reproducibility. Statements are guarded so re-running this file against
-- the same database is a no-op.
-- ============================================================================

create table if not exists invites (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  code varchar unique not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table invites enable row level security;

drop policy if exists invites_admin_manage on invites;
create policy invites_admin_manage on invites
  for all
  using (
    employee_id in (
      select e.id
      from employees e
      join companies c on c.id = e.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

create or replace function consume_invite(invite_code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite invites%rowtype;
  v_tenant_id uuid;
begin
  select * into v_invite from invites where code = invite_code and used = false;
  if not found then
    return false;
  end if;

  select c.tenant_id into v_tenant_id from employees e join companies c on c.id = e.company_id where e.id = v_invite.employee_id;

  insert into app_users (id, tenant_id, employee_id, full_name, status)
  values (auth.uid(), v_tenant_id, v_invite.employee_id, '', 'active')
  on conflict (id) do nothing;

  update invites set used = true where id = v_invite.id;
  return true;
end;
$$;

revoke execute on function consume_invite(text) from public, anon;
grant execute on function consume_invite(text) to authenticated, service_role;
