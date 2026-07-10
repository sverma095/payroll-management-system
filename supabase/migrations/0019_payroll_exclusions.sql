-- "Stop Salary Processing": exclude a specific employee from a specific
-- month's payroll run (e.g. on unpaid suspension, awaiting an F&F, or any
-- reason the admin doesn't want them processed this cycle) without
-- changing their employee status or salary structure.
create table if not exists payroll_exclusions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  year integer not null,
  month integer not null check (month between 1 and 12),
  reason varchar,
  created_at timestamptz not null default now(),
  unique (employee_id, year, month)
);

alter table payroll_exclusions enable row level security;

drop policy if exists payroll_exclusions_isolation on payroll_exclusions;
create policy payroll_exclusions_isolation on payroll_exclusions for all using (
  employee_id in (
    select e.id from employees e
    join companies c on c.id = e.company_id
    where c.tenant_id = auth_tenant_id() and (auth_is_tenant_admin() or c.id = auth_company_id())
  )
);
