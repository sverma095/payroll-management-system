-- ============================================================================
-- Employee Self-Service (Module — ESS)
--
-- Three access tiers now exist on app_users:
--   tenant admin   : company_id IS NULL, employee_id IS NULL
--   company admin  : company_id SET,     employee_id IS NULL
--   ESS employee   : company_id IS NULL, employee_id SET
--
-- auth_is_tenant_admin() must be fixed first — it previously treated
-- "company_id IS NULL" alone as tenant-admin, which would have made every
-- ESS employee look like a super-admin. The new self-service policies below
-- are additive and narrow (their own row only); they don't touch or widen
-- any existing company-level policy.
-- ============================================================================

alter table app_users add column employee_id uuid references employees(id) on delete cascade;
create index idx_app_users_employee on app_users(employee_id);

create or replace function auth_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id from app_users where id = auth.uid()
$$;
revoke execute on function auth_employee_id() from public, anon;
grant execute on function auth_employee_id() to authenticated, service_role;

create or replace function auth_is_tenant_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select company_id is null and employee_id is null from app_users where id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- Narrow self-service policies — "own row only", layered on top of the
-- existing company-scoped policies (permissive policies OR together, so
-- this only ever grants additional narrow access, never removes any).
-- ----------------------------------------------------------------------------
create policy employees_self_select on employees
  for select using (id = auth_employee_id());

create policy employee_banks_self_select on employee_banks
  for select using (employee_id = auth_employee_id());

create policy attendance_self_select on attendance
  for select using (employee_id = auth_employee_id());

create policy payroll_details_self_select on payroll_details
  for select using (employee_id = auth_employee_id());

create policy payslips_self_select on payslips
  for select using (
    payroll_detail_id in (select id from payroll_details where employee_id = auth_employee_id())
  );

create policy leave_applications_self_all on leave_applications
  for all
  using (employee_id = auth_employee_id())
  with check (employee_id = auth_employee_id());

-- Looking up an employee's own company/department/designation/branch from
-- a policy on THAT table would recurse (companies' policy queries
-- employees, employees' policy queries companies, ...). Routing it through
-- a security-definer function breaks the cycle the same way auth_tenant_id()
-- etc. already do.
create or replace function auth_employee_row()
returns table(company_id uuid, department_id uuid, designation_id uuid, branch_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select company_id, department_id, designation_id, branch_id
  from employees where id = auth_employee_id()
$$;
revoke execute on function auth_employee_row() from public, anon;
grant execute on function auth_employee_row() to authenticated, service_role;

create policy leave_types_self_select on leave_types
  for select using (company_id = (select company_id from auth_employee_row()));

create policy departments_self_select on departments
  for select using (id = (select department_id from auth_employee_row()));

create policy designations_self_select on designations
  for select using (id = (select designation_id from auth_employee_row()));

create policy branches_self_select on branches
  for select using (id = (select branch_id from auth_employee_row()));

create policy companies_self_select on companies
  for select using (id = (select company_id from auth_employee_row()));

-- ----------------------------------------------------------------------------
-- resolve_current_company now also reports employee_id, so the app can tell
-- an ESS login apart from an admin login using the same single round trip.
-- ----------------------------------------------------------------------------
-- Signature is changing (added employee_id column) — CREATE OR REPLACE can't
-- alter a function's OUT-parameter shape, so drop it first.
drop function if exists resolve_current_company(uuid);

create function resolve_current_company(requested_company_id uuid default null)
returns table(company_id uuid, tenant_id uuid, is_tenant_admin boolean, employee_id uuid)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_company_id uuid;
  v_tenant_id uuid;
  v_employee_id uuid;
begin
  select au.company_id, au.tenant_id, au.employee_id into v_company_id, v_tenant_id, v_employee_id
  from app_users au where au.id = auth.uid();

  if v_tenant_id is null then
    return;
  end if;

  if v_employee_id is not null then
    return query
      select e.company_id, v_tenant_id, false, v_employee_id
      from employees e where e.id = v_employee_id;
    return;
  end if;

  if v_company_id is not null then
    return query select v_company_id, v_tenant_id, false, null::uuid;
    return;
  end if;

  if requested_company_id is not null and exists (
    select 1 from companies c where c.id = requested_company_id and c.tenant_id = v_tenant_id
  ) then
    return query select requested_company_id, v_tenant_id, true, null::uuid;
    return;
  end if;

  return query
    select c.id, v_tenant_id, true, null::uuid
    from companies c
    where c.tenant_id = v_tenant_id
    order by c.created_at asc
    limit 1;
end;
$$;
