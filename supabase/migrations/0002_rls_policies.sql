-- ============================================================================
-- Row Level Security — enforces multi-tenant data isolation
-- Business rule (SRS Module 1): "One company cannot access another
-- company's data." Enforced here at the database layer, not just in app code.
-- ============================================================================

-- Helper: tenant_id of the currently authenticated user
create or replace function auth_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id from app_users where id = auth.uid()
$$;

-- Helper: company_id of the currently authenticated user (null for tenant-wide admins)
create or replace function auth_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from app_users where id = auth.uid()
$$;

-- Helper: true if the current user has no company_id set (tenant/super admin)
create or replace function auth_is_tenant_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select company_id is null from app_users where id = auth.uid()
$$;

-- ----------------------------------------------------------------------------
-- TENANTS / APP_USERS
-- ----------------------------------------------------------------------------
alter table tenants enable row level security;
create policy tenants_isolation on tenants
  for all using (id = auth_tenant_id());

alter table app_users enable row level security;
create policy app_users_isolation on app_users
  for all using (tenant_id = auth_tenant_id());

-- ----------------------------------------------------------------------------
-- COMPANIES — tenant-wide admins see all companies in their tenant;
-- company-level users see only their own company.
-- ----------------------------------------------------------------------------
alter table companies enable row level security;
create policy companies_isolation on companies
  for all using (
    tenant_id = auth_tenant_id()
    and (auth_is_tenant_admin() or id = auth_company_id())
  );

-- ----------------------------------------------------------------------------
-- Generic company-scoped tables
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'branches','departments','designations','employees',
    'salary_components','salary_structures','leave_types',
    'payroll_headers','workflows'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_isolation on %I for all using (
         company_id in (
           select id from companies
           where tenant_id = auth_tenant_id()
             and (auth_is_tenant_admin() or id = auth_company_id())
         )
       )', t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Tables scoped via employee_id -> employees.company_id
-- ----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  for t in select unnest(array[
    'employee_banks','attendance','leave_applications',
    'tax_declarations','performance_ratings','variable_pay',
    'loans','reimbursements','full_and_final'
  ])
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy %I_isolation on %I for all using (
         employee_id in (
           select e.id from employees e
           join companies c on c.id = e.company_id
           where c.tenant_id = auth_tenant_id()
             and (auth_is_tenant_admin() or c.id = auth_company_id())
         )
       )', t, t
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Tables scoped via parent -> company chain (one hop further)
-- ----------------------------------------------------------------------------
alter table salary_structure_details enable row level security;
create policy salary_structure_details_isolation on salary_structure_details
  for all using (
    salary_structure_id in (
      select ss.id from salary_structures ss
      join companies c on c.id = ss.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

alter table payroll_details enable row level security;
create policy payroll_details_isolation on payroll_details
  for all using (
    payroll_header_id in (
      select ph.id from payroll_headers ph
      join companies c on c.id = ph.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

alter table payslips enable row level security;
create policy payslips_isolation on payslips
  for all using (
    payroll_detail_id in (
      select pd.id from payroll_details pd
      join payroll_headers ph on ph.id = pd.payroll_header_id
      join companies c on c.id = ph.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

alter table investment_proofs enable row level security;
create policy investment_proofs_isolation on investment_proofs
  for all using (
    declaration_id in (
      select td.id from tax_declarations td
      join employees e on e.id = td.employee_id
      join companies c on c.id = e.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

alter table workflow_steps enable row level security;
create policy workflow_steps_isolation on workflow_steps
  for all using (
    workflow_id in (
      select w.id from workflows w
      join companies c on c.id = w.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );

-- ----------------------------------------------------------------------------
-- AUDIT_LOGS — tenant admins can view; written by service role only
-- ----------------------------------------------------------------------------
alter table audit_logs enable row level security;
create policy audit_logs_read on audit_logs
  for select using (auth_is_tenant_admin());

-- ----------------------------------------------------------------------------
-- USER_ROLES / ROLE_PERMISSIONS — global reference data, readable by all
-- authenticated users, writable only via service role (admin tooling)
-- ----------------------------------------------------------------------------
alter table user_roles enable row level security;
create policy user_roles_read on user_roles for select using (true);

alter table role_permissions enable row level security;
create policy role_permissions_read on role_permissions for select using (true);
