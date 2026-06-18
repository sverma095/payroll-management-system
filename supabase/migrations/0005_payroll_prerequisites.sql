-- ============================================================================
-- Payroll Processing prerequisites (Module 6)
--
-- The original Database Design Document has no table linking an employee to
-- a salary structure or a monthly gross figure — without one, payroll has
-- no input to run the formula engine against. employee_salary_assignments
-- fills that gap. breakdown_json on payroll_details stores the full
-- per-component computation so the payslip can show more than the six
-- summary columns the original schema has room for.
-- ============================================================================

create table employee_salary_assignments (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  salary_structure_id uuid not null references salary_structures(id),
  monthly_gross numeric(14,2) not null,
  effective_from date not null,
  effective_to date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_esa_employee on employee_salary_assignments(employee_id);

alter table payroll_details add column breakdown_json jsonb;

alter table employee_salary_assignments enable row level security;
create policy employee_salary_assignments_isolation on employee_salary_assignments
  for all using (
    employee_id in (
      select e.id from employees e
      join companies c on c.id = e.company_id
      where c.tenant_id = auth_tenant_id()
        and (auth_is_tenant_admin() or c.id = auth_company_id())
    )
  );
